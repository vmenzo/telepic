const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const config = require('./config');
const { createAdminSession, requireAdmin, requireManage, requireUpload, verifyAdminLogin, verifyAdminSession } = require('./auth');
const { createDb } = require('./db');
const { parseMultipartRequest } = require('./multipart');
const { createStorage } = require('./storage');
const { handleTelegramUpdate } = require('./telegram');
const { htmlPage, imagePage } = require('./web');
const { isImageMime, json, parseJsonBody, text } = require('./utils');
const packageJson = require('../package.json');

const db = createDb(config);
const storage = createStorage(config);

db.load();
storage.ensure();

const publicDir = path.join(config.rootDir, 'public');

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    const status = error.statusCode || 500;
    if (status >= 500) console.error(error);
    json(res, status, { error: error.message || 'Internal server error' });
  });
});

async function route(req, res) {
  const url = new URL(req.url, config.publicUrl);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'GET' && pathname === '/') {
    return sendHtml(res, htmlPage(config));
  }

  if (req.method === 'GET' && pathname.startsWith('/assets/')) {
    return serveStatic(res, pathname.replace('/assets/', ''));
  }

  if (req.method === 'GET' && pathname.startsWith('/raw/')) {
    return serveImageFile(req, res, pathname.split('/')[2]);
  }

  if (req.method === 'GET' && pathname.startsWith('/i/')) {
    const image = db.getImage(pathname.split('/')[2]);
    if (!image) return json(res, 404, { error: 'Image not found' });
    if (image.visibility === 'private' && !hasManageAccess(req, url)) {
      return json(res, 403, { error: 'Private image requires management permission' });
    }
    return sendHtml(res, imagePage(image, config, url.searchParams.get('token') || ''));
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    return json(res, 200, db.stats());
  }

  if (req.method === 'GET' && pathname === '/api/settings/theme') {
    const settings = readSettings();
    return json(res, 200, { theme: settings.theme || null });
  }

  if (req.method === 'PUT' && pathname === '/api/settings/theme') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 3 * 1024 * 1024);
    const settings = readSettings();
    settings.theme = sanitizeTheme(body.theme || {});
    settings.updatedAt = new Date().toISOString();
    writeSettings(settings);
    db.addEvent('settings.theme.updated', { actor: auth.actor });
    return json(res, 200, { ok: true, theme: settings.theme, updatedAt: settings.updatedAt });
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    const body = await parseJsonBody(req, 16 * 1024);
    if (!verifyAdminLogin(body.username, body.password, config)) {
      return json(res, 401, { error: 'Invalid username or password' });
    }
    return json(res, 200, createAdminSession(config));
  }

  if (req.method === 'POST' && pathname === '/api/admin/password') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 16 * 1024);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (!verifyAdminLogin(config.adminUsername, currentPassword, config)) {
      return json(res, 401, { error: 'Current password is incorrect' });
    }
    if (newPassword.length < 8 || newPassword.length > 200) {
      return json(res, 400, { error: 'New password must be between 8 and 200 characters' });
    }
    updateEnvValue(config.envFile, 'ADMIN_PASSWORD', newPassword);
    process.env.ADMIN_PASSWORD = newPassword;
    config.adminPassword = newPassword;
    db.addEvent('admin.password.updated', { actor: auth.actor });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && pathname === '/api/images') {
    const admin = requireAdmin(req, config);
    const limit = clamp(Number(url.searchParams.get('limit') || 50), 1, 200);
    const offset = clamp(Number(url.searchParams.get('offset') || 0), 0, Number.MAX_SAFE_INTEGER);
    const visibility = url.searchParams.get('visibility') || '';
    const source = url.searchParams.get('source') || '';
    const tag = url.searchParams.get('tag') || '';
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    return json(res, 200, {
      images: db.listImages({ limit, offset, includePrivate: admin, visibility, source, tag, q, sort }).map(publicImage)
    });
  }

  if (req.method === 'POST' && pathname === '/api/upload') {
    const auth = requireUpload(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const image = await uploadFromRequest(req, auth.actor);
    return json(res, 201, { image: publicImage(image) });
  }

  if (req.method === 'POST' && pathname === '/api/upload-from-url') {
    const auth = requireUpload(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 32 * 1024);
    const image = await uploadFromUrl(body.url, auth.actor);
    return json(res, 201, { image: publicImage(image) });
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const limit = clamp(Number(url.searchParams.get('limit') || 20), 1, 100);
    return json(res, 200, { events: db.listEvents({ limit }) });
  }

  if (req.method === 'GET' && /^\/api\/images\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/')[3];
    const image = db.getImage(id);
    if (!image) return json(res, 404, { error: 'Image not found' });
    if (image.visibility === 'private' && !requireManage(req, db, config).ok) {
      return json(res, 403, { error: 'Private image metadata requires management permission' });
    }
    return json(res, 200, { image: publicImage(image) });
  }

  if (req.method === 'PATCH' && pathname.startsWith('/api/images/')) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const id = pathname.split('/')[3];
    const body = await parseJsonBody(req, 64 * 1024);
    const patch = {};
    if (['public', 'private'].includes(body.visibility)) patch.visibility = body.visibility;
    if (typeof body.originalName === 'string') patch.originalName = body.originalName.slice(0, 200);
    if (Array.isArray(body.tags) || typeof body.tags === 'string') patch.tags = normalizeTags(body.tags);
    const image = db.updateImage(id, patch);
    if (!image) return json(res, 404, { error: 'Image not found' });
    return json(res, 200, { image: publicImage(image) });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/images/')) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const id = pathname.split('/')[3];
    const image = db.deleteImage(id);
    if (!image) return json(res, 404, { error: 'Image not found' });
    await storage.delete(image);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === '/api/images/bulk-delete') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 256 * 1024);
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 200) : [];
    const deleted = [];
    const missing = [];
    for (const id of ids) {
      const image = db.deleteImage(String(id));
      if (image) {
        await storage.delete(image);
        deleted.push(id);
      } else {
        missing.push(id);
      }
    }
    return json(res, 200, { ok: true, deleted, missing });
  }

  if (req.method === 'POST' && pathname === '/api/images/bulk-update') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 256 * 1024);
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 200) : [];
    const patch = {};
    if (['public', 'private'].includes(body.visibility)) patch.visibility = body.visibility;
    if (Array.isArray(body.tags) || typeof body.tags === 'string') patch.tags = normalizeTags(body.tags);
    const updated = [];
    const missing = [];
    for (const id of ids) {
      const image = db.updateImage(String(id), patch);
      if (image) {
        updated.push(publicImage(image));
      } else {
        missing.push(id);
      }
    }
    return json(res, 200, { ok: true, updated, missing });
  }

  if (req.method === 'GET' && pathname === '/api/config') {
    const admin = requireAdmin(req, config);
    return json(res, 200, {
      appName: packageJson.name,
      appVersion: packageJson.version,
      nodeVersion: process.version,
      platform: `${process.platform}/${process.arch}`,
      host: config.host,
      port: config.port,
      publicUrl: config.publicUrl,
      publicUpload: config.publicUpload,
      adminAuthenticated: admin,
      adminUsername: config.adminUsername,
      adminSessionHours: config.adminSessionHours,
      serverTime: new Date().toISOString(),
      checks: {
        api: true,
        database: true,
        storage: true,
        themeSettings: fs.existsSync(settingsPath())
      },
      databaseDriver: config.databaseDriver,
      databaseFile: admin ? config.databaseFile : '',
      dataDir: admin ? config.dataDir : '',
      telegramEnabled: Boolean(config.telegramBotToken),
      telegramAllowedUsersConfigured: config.telegramAllowedUserIds.length > 0,
      telegramWebhookUrl: admin ? `${config.publicUrl}/telegram/${config.telegramWebhookSecret}` : '',
      storageDriver: config.storageDriver,
      s3Configured: Boolean(config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey),
      s3Bucket: admin ? (config.s3Bucket || '') : '',
      s3Endpoint: admin ? (config.s3Endpoint || '') : '',
      s3Region: config.s3Region || '',
      s3Prefix: config.s3Prefix || '',
      s3ForcePathStyle: config.s3ForcePathStyle,
      s3PublicBaseUrl: config.s3PublicBaseUrl || '',
      maxUploadBytes: config.maxUploadBytes
    });
  }

  if (req.method === 'GET' && pathname === '/api/tokens') {
    if (!requireAdmin(req, config)) return json(res, 401, { error: 'Admin token required' });
    return json(res, 200, { tokens: db.listTokens() });
  }

  if (req.method === 'POST' && pathname === '/api/tokens') {
    if (!requireAdmin(req, config)) return json(res, 401, { error: 'Admin token required' });
    const body = await parseJsonBody(req, 64 * 1024);
    const created = db.createToken({ name: body.name, scopes: body.scopes });
    return json(res, 201, created);
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/tokens/')) {
    if (!requireAdmin(req, config)) return json(res, 401, { error: 'Admin token required' });
    const token = db.deleteToken(pathname.split('/')[3]);
    if (!token) return json(res, 404, { error: 'Token not found' });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === `/telegram/${config.telegramWebhookSecret}`) {
    if (!config.telegramBotToken) return json(res, 503, { error: 'Telegram bot token is not configured' });
    const update = await parseJsonBody(req, config.maxUploadBytes);
    await handleTelegramUpdate({ update, config, db, storage });
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'Not found' });
}

async function uploadFromRequest(req, actor) {
  const contentType = req.headers['content-type'] || '';
  let file;

  if (contentType.startsWith('multipart/form-data')) {
    const parts = await parseMultipartRequest(req, config.maxUploadBytes);
    file = parts.find((part) => part.filename && part.name === 'image') || parts.find((part) => part.filename);
  } else if (contentType.startsWith('image/')) {
    const { readBody } = require('./utils');
    const buffer = await readBody(req, config.maxUploadBytes);
    file = {
      filename: decodeHeaderFileName(req.headers['x-file-name'] || 'upload'),
      mime: contentType.split(';')[0],
      data: buffer
    };
  } else {
    const error = new Error('Use multipart/form-data with an image field, or send a raw image/* body.');
    error.statusCode = 415;
    throw error;
  }

  if (!file || !file.data || !file.data.length) {
    const error = new Error('No image file found');
    error.statusCode = 400;
    throw error;
  }

  if (!isImageMime(file.mime)) {
    const error = new Error(`Unsupported image type: ${file.mime}`);
    error.statusCode = 415;
    throw error;
  }

  const image = await storage.saveImage({
    buffer: file.data,
    mime: file.mime,
    originalName: file.filename,
    source: 'api',
    owner: actor
  });
  image.url = `${config.publicUrl}/i/${image.id}`;
  image.rawUrl = `${config.publicUrl}/raw/${image.id}`;
  db.addImage(image);
  return image;
}

async function uploadFromUrl(rawUrl, actor) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    const error = new Error('A valid image URL is required.');
    error.statusCode = 400;
    throw error;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const error = new Error('Invalid URL.');
    error.statusCode = 400;
    throw error;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const error = new Error('Only http and https URLs are supported.');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(parsed, {
    redirect: 'follow',
    headers: { 'user-agent': 'Telepic/0.1' }
  });

  if (!response.ok) {
    const error = new Error(`Remote download failed: ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const mime = (response.headers.get('content-type') || '').split(';')[0].trim();
  if (!isImageMime(mime)) {
    const error = new Error(`Remote file is not a supported image: ${mime || 'unknown'}`);
    error.statusCode = 415;
    throw error;
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength && contentLength > config.maxUploadBytes) {
    const error = new Error('Remote image is too large.');
    error.statusCode = 413;
    throw error;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > config.maxUploadBytes) {
    const error = new Error('Remote image is too large.');
    error.statusCode = 413;
    throw error;
  }

  const fileName = decodeURIComponent(parsed.pathname.split('/').pop() || 'remote-image');
  const image = await storage.saveImage({
    buffer,
    mime,
    originalName: fileName,
    source: 'url',
    owner: actor
  });
  image.url = `${config.publicUrl}/i/${image.id}`;
  image.rawUrl = `${config.publicUrl}/raw/${image.id}`;
  db.addImage(image);
  return image;
}

function publicImage(image) {
  const fallbackRawUrl = image.rawUrl || `${config.publicUrl}/raw/${image.id}`;
  const storageRawUrl = typeof storage.getPublicObjectUrl === 'function' ? storage.getPublicObjectUrl(image) : '';
  return {
    id: image.id,
    originalName: image.originalName,
    mime: image.mime,
    size: image.size,
    sha256: image.sha256,
    source: image.source,
    owner: image.owner,
    fileName: image.fileName,
    storageKey: image.storageKey || image.fileName,
    tags: image.tags || [],
    visibility: image.visibility,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    url: image.url || `${config.publicUrl}/i/${image.id}`,
    rawUrl: image.visibility === 'private' ? fallbackRawUrl : (storageRawUrl || fallbackRawUrl),
    appRawUrl: fallbackRawUrl
  };
}

async function serveImageFile(req, res, id) {
  const image = db.getImage(id);
  if (!image) return json(res, 404, { error: 'Image not found' });
  const url = new URL(req.url, config.publicUrl);
  if (image.visibility === 'private' && !hasManageAccess(req, url)) {
    return json(res, 403, { error: 'Private image requires management permission' });
  }
  let stored;
  try {
    stored = await storage.read(image);
  } catch (error) {
    const status = /404/.test(String(error.message)) ? 404 : 502;
    return json(res, status, { error: status === 404 ? 'Image file missing' : error.message });
  }
  res.writeHead(200, {
    'content-type': stored.mime || image.mime,
    'cache-control': 'public, max-age=31536000, immutable'
  });
  res.end(stored.buffer);
}

function serveStatic(res, name) {
  const safeName = path.basename(name);
  const filePath = path.join(publicDir, safeName);
  if (!fs.existsSync(filePath)) return text(res, 404, 'Not found');
  const ext = path.extname(filePath);
  const mime = ext === '.css' ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
  res.writeHead(200, { 'content-type': mime });
  fs.createReadStream(filePath).pipe(res);
}

function sendHtml(res, body) {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(body);
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeTags(input) {
  const list = Array.isArray(input) ? input : String(input || '').split(',');
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean).slice(0, 20))];
}

function updateEnvValue(filePath, key, value) {
  const line = `${key}=${escapeEnvValue(value)}`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${line}\n`);
    return;
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let replaced = false;
  const next = lines.map((item) => {
    if (item.startsWith(`${key}=`)) {
      replaced = true;
      return line;
    }
    return item;
  });
  if (!replaced) next.push(line);
  fs.writeFileSync(filePath, next.join('\n').replace(/\n*$/, '\n'));
}

function settingsPath() {
  return path.join(config.dataDir, 'settings.json');
}

function readSettings() {
  const filePath = settingsPath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  const filePath = settingsPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
}

function sanitizeTheme(theme) {
  const stringFields = ['preset', 'bg', 'panel', 'ink', 'accent', 'danger', 'backdrop', 'overlay', 'image'];
  const clean = {};
  for (const field of stringFields) {
    if (typeof theme[field] === 'string') clean[field] = theme[field].slice(0, field === 'image' ? 2_800_000 : 4000);
  }
  clean.panelAlpha = clamp(Number(theme.panelAlpha || 0.88), 0.55, 1);
  clean.blur = clamp(Number(theme.blur || 18), 0, 40);
  return clean;
}

function escapeEnvValue(value) {
  const text = String(value || '');
  return /[\s#"']/g.test(text) ? JSON.stringify(text) : text;
}

function decodeHeaderFileName(value) {
  try {
    return decodeURIComponent(String(value || 'upload'));
  } catch {
    return String(value || 'upload');
  }
}

function hasManageAccess(req, url) {
  if (requireManage(req, db, config).ok) return true;
  const queryToken = url.searchParams.get('token') || '';
  if (!queryToken) return false;
  if (config.adminToken && queryToken === config.adminToken) return true;
  if (verifyAdminSession(queryToken, config)) return true;
  const token = db.findToken(queryToken);
  if (token && token.scopes.includes('manage')) {
    db.touchToken(token.id);
    return true;
  }
  return false;
}

server.listen(config.port, config.host, () => {
  console.log(`Telepic is running at http://${config.host}:${config.port}`);
  console.log(`Public URL: ${config.publicUrl}`);
});
