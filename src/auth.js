const crypto = require('crypto');

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function requireAdmin(req, config) {
  const token = bearerToken(req) || req.headers['x-admin-token'] || '';
  return Boolean(
    (config.adminToken && safeEqual(token, config.adminToken)) ||
    verifyAdminSession(token, config)
  );
}

function verifyAdminLogin(username, password, config) {
  return safeEqual(username, config.adminUsername) && safeEqual(password, config.adminPassword);
}

function createAdminSession(config) {
  const expiresAt = Date.now() + config.adminSessionHours * 60 * 60 * 1000;
  const payload = base64UrlEncode(JSON.stringify({
    sub: config.adminUsername,
    role: 'admin',
    exp: expiresAt
  }));
  const signature = sign(payload, config);
  return {
    token: `tp_session_${payload}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString(),
    username: config.adminUsername
  };
}

function verifyAdminSession(rawToken, config) {
  if (!rawToken || !String(rawToken).startsWith('tp_session_')) return false;
  const token = String(rawToken).slice('tp_session_'.length);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!safeEqual(signature, sign(payload, config))) return false;
  try {
    const data = JSON.parse(base64UrlDecode(payload));
    return data.role === 'admin' && data.sub === config.adminUsername && Number(data.exp || 0) > Date.now();
  } catch {
    return false;
  }
}

function requireUpload(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin', 'upload'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  const token = db.findToken(rawToken);
  if (token && token.scopes.includes('upload')) {
    db.touchToken(token.id);
    return { ok: true, actor: token.name, scopes: token.scopes };
  }
  if (config.publicUpload) return { ok: true, actor: 'anonymous', scopes: ['upload'] };
  return { ok: false, statusCode: 401, message: 'Upload requires an admin token or API token.' };
}

function requireManage(req, db, config) {
  if (requireAdmin(req, config)) return { ok: true, actor: 'admin', scopes: ['admin'] };
  const rawToken = bearerToken(req) || req.headers['x-api-token'] || '';
  const token = db.findToken(rawToken);
  if (token && token.scopes.includes('manage')) {
    db.touchToken(token.id);
    return { ok: true, actor: token.name, scopes: token.scopes };
  }
  return { ok: false, statusCode: 401, message: 'Management requires an admin token.' };
}

function sign(payload, config) {
  return crypto.createHmac('sha256', sessionSecret(config)).update(payload).digest('base64url');
}

function sessionSecret(config) {
  return config.adminSessionSecret || config.adminToken || config.adminPassword || 'telepic-dev-session-secret';
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

module.exports = { bearerToken, createAdminSession, requireAdmin, requireManage, requireUpload, verifyAdminLogin, verifyAdminSession };
