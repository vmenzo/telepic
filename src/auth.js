function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function requireAdmin(req, config) {
  const token = bearerToken(req) || req.headers['x-admin-token'] || '';
  return Boolean(config.adminToken && token === config.adminToken);
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

module.exports = { bearerToken, requireAdmin, requireManage, requireUpload };
