import crypto from 'crypto';

const PASSWORD_HASH_PREFIX = 'tp_pwd_pbkdf2_sha256';

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function requireAdmin(req, config) {
  const token = bearerToken(req) || req.headers['x-admin-token'] || '';
  return Boolean(
    (config.adminToken && safeEqual(token, config.adminToken)) ||
    (config.adminTokenHash && safeEqual(sha256Text(token), config.adminTokenHash)) ||
    verifyAdminSession(token, config)
  );
}

function verifyAdminLogin(username, password, config) {
  return safeEqual(username, config.adminUsername) && verifyPassword(password, config.adminPasswordHash || config.adminPassword);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const iterations = 210000;
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('base64url');
  return `${PASSWORD_HASH_PREFIX}$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const value = String(stored || '');
  if (!value.startsWith(`${PASSWORD_HASH_PREFIX}$`)) return safeEqual(password, value);
  const parts = value.split('$');
  if (parts.length !== 4) return false;
  const iterations = Number(parts[1] || 0);
  const salt = parts[2];
  const expected = parts[3];
  if (!iterations || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('base64url');
  return safeEqual(actual, expected);
}

function createAdminSession(config, options: Record<string, any> = {}) {
  const now = options.now || Date.now();
  const expiresAt = options.expiresAt || now + config.adminSessionHours * 60 * 60 * 1000;
  const payload = base64UrlEncode(JSON.stringify({
    sub: config.adminUsername,
    role: 'admin',
    exp: expiresAt,
    last: now
  }));
  const signature = sign(payload, config);
  return {
    token: `tp_session_${payload}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString(),
    idleExpiresAt: new Date(now + idleTimeoutMs(config)).toISOString(),
    idleMinutes: idleTimeoutMinutes(config),
    username: config.adminUsername
  };
}

function verifyAdminSession(rawToken, config) {
  return Boolean(readAdminSession(rawToken, config).ok);
}

function refreshAdminSession(rawToken, config) {
  const session = readAdminSession(rawToken, config);
  if (!session.ok) return null;
  return createAdminSession(config, { expiresAt: session.data.exp });
}

function readAdminSession(rawToken, config) {
  if (!rawToken || !String(rawToken).startsWith('tp_session_')) return { ok: false };
  const token = String(rawToken).slice('tp_session_'.length);
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false };
  const [payload, signature] = parts;
  if (!safeEqual(signature, sign(payload, config))) return { ok: false };
  try {
    const data = JSON.parse(base64UrlDecode(payload));
    const now = Date.now();
    const expiresAt = Number(data.exp || 0);
    const lastActivityAt = Number(data.last || 0);
    const valid =
      data.role === 'admin' &&
      data.sub === config.adminUsername &&
      expiresAt > now &&
      lastActivityAt > 0 &&
      now - lastActivityAt <= idleTimeoutMs(config);
    return valid ? { ok: true, data: { ...data, exp: expiresAt, last: lastActivityAt } } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function requireUpload(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin', 'upload'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  if (rawToken) {
    const token = db.findToken(rawToken);
    if (token && tokenUsable(token) && token.scopes.includes('upload')) {
      db.touchToken(token.id, clientIp(req));
      return { ok: true, actor: token.name, scopes: token.scopes };
    }
    return { ok: false, statusCode: 401, message: 'Upload token is invalid, expired, or lacks upload permission.' };
  }
  if (config.publicUpload) return { ok: true, actor: 'anonymous', scopes: ['upload'] };
  return { ok: false, statusCode: 401, message: 'Upload requires an admin token or API token.' };
}

function requireRead(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin', 'read'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  const token = db.findToken(rawToken);
  if (token && tokenUsable(token) && (token.scopes.includes('read') || token.scopes.includes('manage'))) {
    db.touchToken(token.id, clientIp(req));
    return { ok: true, actor: token.name, scopes: token.scopes };
  }
  return { ok: false, statusCode: 401, message: 'Read requires an admin token or API token with read permission.' };
}

function requireManage(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  const token = db.findToken(rawToken);
  if (token && tokenUsable(token) && token.scopes.includes('manage')) {
    db.touchToken(token.id, clientIp(req));
    return { ok: true, actor: token.name, scopes: token.scopes };
  }
  return { ok: false, statusCode: 401, message: 'Management requires an admin token.' };
}

function requireDelete(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin', 'delete'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  const token = db.findToken(rawToken);
  if (token && tokenUsable(token) && (token.scopes.includes('delete') || token.scopes.includes('manage'))) {
    db.touchToken(token.id, clientIp(req));
    return { ok: true, actor: token.name, scopes: token.scopes };
  }
  return { ok: false, statusCode: 401, message: 'Delete requires an admin token or API token with delete permission.' };
}

function tokenUsable(token) {
  if (!token) return false;
  if (!token.expiresAt) return true;
  const expires = new Date(token.expiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || '';
}

function sign(payload, config) {
  return crypto.createHmac('sha256', sessionSecret(config)).update(payload).digest('base64url');
}

function sessionSecret(config) {
  return config.adminSessionSecret || config.adminTokenHash || config.adminToken || config.adminPasswordHash || config.adminPassword || 'telepic-dev-session-secret';
}

function idleTimeoutMinutes(config) {
  const value = Number(config.adminSessionIdleMinutes || 30);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

function idleTimeoutMs(config) {
  return idleTimeoutMinutes(config) * 60 * 1000;
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

export { bearerToken, clientIp, createAdminSession, hashPassword, refreshAdminSession, requireAdmin, requireDelete, requireManage, requireRead, requireUpload, sha256Text, verifyAdminLogin, verifyAdminSession, verifyPassword };
