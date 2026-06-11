const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const config = require('./config');
const { bearerToken, createAdminSession, refreshAdminSession, requireAdmin, requireManage, requireUpload, verifyAdminLogin, verifyAdminSession } = require('./auth');
const { createDb } = require('./db');
const { parseMultipartRequest } = require('./multipart');
const { createStorage } = require('./storage');
const { handleTelegramUpdate, telegramApi } = require('./telegram');
const { htmlPage, imagePage } = require('./web');
const { isImageMime, json, parseJsonBody, text } = require('./utils');
const packageJson = require('../package.json');

const db = createDb(config);
let storage = createStorage(config);
const bootAt = Date.now();

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
  refreshSessionHeader(req, res);
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

  if (req.method === 'GET' && pathname === '/api/system/status') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    return json(res, 200, systemStatusPayload());
  }

  if (req.method === 'GET' && pathname === '/api/albums') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const settings = readSettings();
    return json(res, 200, { albums: listAlbums(settings).map((album) => publicAlbum(album)) });
  }

  if (req.method === 'POST' && pathname === '/api/albums') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 64 * 1024);
    const settings = readSettings();
    const album = createAlbumRecord(body, settings);
    settings.albums = ensureAlbums(settings);
    settings.albums.unshift(album);
    settings.updatedAt = new Date().toISOString();
    writeSettings(settings);
    db.addEvent('album.created', { actor: auth.actor, albumId: album.id, name: album.name });
    return json(res, 201, { album: publicAlbum(album) });
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

  if (req.method === 'POST' && pathname === '/api/session/refresh') {
    const refreshed = refreshAdminSession(bearerToken(req), config);
    if (!refreshed) return json(res, 401, { error: 'Session expired' });
    return json(res, 200, refreshed);
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
    const albumId = url.searchParams.get('albumId') || '';
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    const settings = readSettings();
    const album = albumId ? findAlbum(settings, albumId) : null;
    const imageIds = album ? new Set((album.imageIds || []).map(String)) : null;
    let all = db.listImages({ limit: Number.MAX_SAFE_INTEGER, offset: 0, includePrivate: admin, visibility, source, tag, q, sort })
      .filter((image) => !image.deletedAt)
      .filter((image) => !imageIds || imageIds.has(String(image.id)));
    if (album) all = applyAlbumOrdering(all, album);
    const page = all.slice(offset, offset + limit);
    return json(res, 200, {
      images: page.map(publicImage),
      total: all.length,
      limit,
      offset,
      hasMore: offset + limit < all.length
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

  if (req.method === 'GET' && pathname === '/api/trash') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const settings = readSettings();
    const limit = clamp(Number(url.searchParams.get('limit') || 30), 1, 200);
    const offset = clamp(Number(url.searchParams.get('offset') || 0), 0, Number.MAX_SAFE_INTEGER);
    const recycleBin = ensureRecycleBin(settings);
    return json(res, 200, {
      items: recycleBin.slice(offset, offset + limit).map(publicTrashItem),
      total: recycleBin.length,
      limit,
      offset,
      hasMore: offset + limit < recycleBin.length
    });
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
    moveImageToRecycleBin(image, auth.actor);
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
        moveImageToRecycleBin(image, auth.actor);
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

  if (req.method === 'POST' && pathname === '/api/images/download') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 256 * 1024);
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
    const images = ids.map((id) => db.getImage(String(id))).filter(Boolean);
    if (!images.length) return json(res, 400, { error: 'No images selected' });
    const archive = await createImageZip(images);
    res.writeHead(200, {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="telepic-export-${Date.now()}.zip"`,
      'content-length': archive.length
    });
    return res.end(archive);
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
      adminSessionIdleMinutes: config.adminSessionIdleMinutes,
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
      telegramBotConfigured: Boolean(config.telegramBotToken),
      telegramAllowedUsersConfigured: config.telegramAllowedUserIds.length > 0,
      telegramAllowedUserIds: admin ? config.telegramAllowedUserIds.join(',') : '',
      telegramWebhookSecret: admin ? config.telegramWebhookSecret : '',
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

  if (req.method === 'GET' && pathname === '/api/integrations/telegram/status') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const status = await telegramStatusPayload();
    return json(res, 200, status);
  }

  if (req.method === 'PUT' && pathname === '/api/integrations/telegram') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 64 * 1024);
    updateRuntimeConfig({
      publicUrl: cleanUrl(body.publicUrl, config.publicUrl),
      telegramBotToken: typeof body.botToken === 'string' && body.botToken.trim() ? body.botToken.trim() : config.telegramBotToken,
      telegramWebhookSecret: cleanSecret(body.webhookSecret, config.telegramWebhookSecret),
      telegramAllowedUserIds: csvList(body.allowedUserIds)
    });
    updateEnvValues(config.envFile, {
      PUBLIC_URL: config.publicUrl,
      TELEGRAM_BOT_TOKEN: config.telegramBotToken,
      TELEGRAM_WEBHOOK_SECRET: config.telegramWebhookSecret,
      TELEGRAM_ALLOWED_USER_IDS: config.telegramAllowedUserIds.join(',')
    });
    db.addEvent('integration.telegram.updated', { actor: auth.actor });
    return json(res, 200, telegramConfigPayload());
  }

  if (req.method === 'POST' && pathname === '/api/integrations/telegram/webhook') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    if (!config.telegramBotToken) return json(res, 400, { error: 'Telegram bot token is not configured' });
    const webhookUrl = `${config.publicUrl}/telegram/${config.telegramWebhookSecret}`;
    const result = await telegramApi(config, 'setWebhook', { url: webhookUrl });
    if (!result || !result.ok) {
      return json(res, 502, { error: result && result.description ? result.description : 'Telegram webhook registration failed' });
    }
    db.addEvent('integration.telegram.webhook_registered', { actor: auth.actor, webhookUrl });
    return json(res, 200, { ok: true, webhookUrl, telegram: result });
  }

  if (req.method === 'POST' && pathname === '/api/integrations/telegram/test') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    if (!config.telegramBotToken) return json(res, 400, { error: 'Telegram bot token is not configured' });
    const body = await parseJsonBody(req, 32 * 1024);
    const chatId = String(body.chatId || config.telegramAllowedUserIds[0] || '').trim();
    if (!chatId) return json(res, 400, { error: 'A Telegram chat ID is required' });
    const textMessage = String(body.message || 'Telepic 测试消息').trim().slice(0, 2000);
    const result = await telegramApi(config, 'sendMessage', { chat_id: chatId, text: textMessage });
    if (!result || !result.ok) {
      return json(res, 502, { error: result && result.description ? result.description : 'Telegram test message failed' });
    }
    db.addEvent('integration.telegram.test_sent', { actor: auth.actor, chatId });
    return json(res, 200, { ok: true, result });
  }

  if (req.method === 'PUT' && pathname === '/api/integrations/storage') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const body = await parseJsonBody(req, 96 * 1024);
    const previousStorage = currentStorageSnapshot();
    const next = storageConfigFromBody(body);
    if (next.storageDriver === 's3') {
      const missing = ['s3Bucket', 's3AccessKeyId', 's3SecretAccessKey'].filter((key) => !next[key]);
      if (missing.length) return json(res, 400, { error: `Missing object storage configuration: ${missing.join(', ')}` });
    }
    updateRuntimeConfig(next);
    storage = createStorage(config);
    storage.ensure();
    const settings = readSettings();
    settings.previousStorageConfig = previousStorage;
    settings.updatedAt = new Date().toISOString();
    writeSettings(settings);
    updateEnvValues(config.envFile, {
      STORAGE_DRIVER: config.storageDriver,
      S3_BUCKET: config.s3Bucket,
      S3_REGION: config.s3Region,
      S3_ENDPOINT: config.s3Endpoint,
      S3_ACCESS_KEY_ID: config.s3AccessKeyId,
      S3_SECRET_ACCESS_KEY: config.s3SecretAccessKey,
      S3_PUBLIC_BASE_URL: config.s3PublicBaseUrl,
      S3_PREFIX: config.s3Prefix,
      S3_FORCE_PATH_STYLE: String(config.s3ForcePathStyle)
    });
    db.addEvent('integration.storage.updated', { actor: auth.actor, storageDriver: config.storageDriver });
    return json(res, 200, storageConfigPayload());
  }

  if (req.method === 'POST' && pathname === '/api/integrations/storage/test') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const candidate = createStorage(config);
    candidate.ensure();
    return json(res, 200, { ok: true, storageDriver: config.storageDriver, s3Configured: Boolean(config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey) });
  }

  if (req.method === 'POST' && pathname === '/api/integrations/storage/migrate') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const settings = readSettings();
    const previous = settings.previousStorageConfig;
    if (!previous || !previous.storageDriver) {
      return json(res, 400, { error: 'No previous storage configuration is available for migration' });
    }
    const sourceStorage = createStorageFromSnapshot(previous);
    const targetStorage = createStorage(config);
    sourceStorage.ensure();
    targetStorage.ensure();
    const images = db.listImages({ limit: Number.MAX_SAFE_INTEGER, offset: 0, includePrivate: true });
    const migrated = [];
    const failed = [];
    for (const image of images) {
      try {
        const file = await sourceStorage.read(image);
        await targetStorage.writeObject(image, file.buffer, file.mime || image.mime);
        migrated.push(image.id);
      } catch (error) {
        failed.push({ id: image.id, error: error.message });
      }
    }
    if (!failed.length) {
      settings.previousStorageConfig = null;
      settings.updatedAt = new Date().toISOString();
      writeSettings(settings);
    }
    db.addEvent('integration.storage.migrated', { actor: auth.actor, migrated: migrated.length, failed: failed.length });
    return json(res, 200, { ok: failed.length === 0, migrated, failed });
  }

  if (req.method === 'GET' && pathname === '/api/integrations/storage/status') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    return json(res, 200, await storageStatusPayload());
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

  if (req.method === 'PATCH' && /^\/api\/albums\/[^/]+$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const albumId = pathname.split('/')[3];
    const body = await parseJsonBody(req, 64 * 1024);
    const settings = readSettings();
    const album = findAlbum(settings, albumId);
    if (!album) return json(res, 404, { error: 'Album not found' });
    if (typeof body.name === 'string' && body.name.trim()) album.name = body.name.trim().slice(0, 80);
    if (typeof body.description === 'string') album.description = body.description.trim().slice(0, 300);
    if (typeof body.coverImageId === 'string') album.coverImageId = body.coverImageId.trim();
    if (body.sortMode !== undefined) album.sortMode = normalizeAlbumSortMode(body.sortMode);
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(settings);
    db.addEvent('album.updated', { actor: auth.actor, albumId: album.id });
    return json(res, 200, { album: publicAlbum(album) });
  }

  if (req.method === 'DELETE' && /^\/api\/albums\/[^/]+$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const albumId = pathname.split('/')[3];
    const settings = readSettings();
    const before = ensureAlbums(settings).length;
    settings.albums = ensureAlbums(settings).filter((album) => String(album.id) !== String(albumId));
    if (settings.albums.length === before) return json(res, 404, { error: 'Album not found' });
    settings.updatedAt = new Date().toISOString();
    writeSettings(settings);
    db.addEvent('album.deleted', { actor: auth.actor, albumId });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && /^\/api\/albums\/[^/]+\/images$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const albumId = pathname.split('/')[3];
    const body = await parseJsonBody(req, 256 * 1024);
    const settings = readSettings();
    const album = findAlbum(settings, albumId);
    if (!album) return json(res, 404, { error: 'Album not found' });
    const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 200) : [];
    album.imageIds = [...new Set([...(album.imageIds || []), ...ids])];
    if (!album.coverImageId && ids.length) album.coverImageId = ids[0];
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(settings);
    db.addEvent('album.images_added', { actor: auth.actor, albumId, count: ids.length });
    return json(res, 200, { album: publicAlbum(album) });
  }

  if (req.method === 'DELETE' && /^\/api\/albums\/[^/]+\/images\/[^/]+$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const [, , , albumId, , imageId] = pathname.split('/');
    const settings = readSettings();
    const album = findAlbum(settings, albumId);
    if (!album) return json(res, 404, { error: 'Album not found' });
    album.imageIds = (album.imageIds || []).filter((id) => String(id) !== String(imageId));
    if (String(album.coverImageId || '') === String(imageId)) album.coverImageId = album.imageIds[0] || '';
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(settings);
    db.addEvent('album.image_removed', { actor: auth.actor, albumId, imageId });
    return json(res, 200, { album: publicAlbum(album) });
  }

  if (req.method === 'POST' && /^\/api\/albums\/[^/]+\/reorder$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const albumId = pathname.split('/')[3];
    const body = await parseJsonBody(req, 32 * 1024);
    const settings = readSettings();
    const album = findAlbum(settings, albumId);
    if (!album) return json(res, 404, { error: 'Album not found' });
    reorderAlbumImages(album, String(body.imageId || ''), String(body.direction || ''));
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(settings);
    db.addEvent('album.reordered', { actor: auth.actor, albumId, imageId: body.imageId, direction: body.direction });
    return json(res, 200, { album: publicAlbum(album) });
  }

  if (req.method === 'POST' && /^\/api\/trash\/[^/]+\/restore$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const item = restoreTrashItem(pathname.split('/')[3], auth.actor);
    if (!item) return json(res, 404, { error: 'Recycle bin item not found' });
    return json(res, 200, { ok: true, image: publicImage(item) });
  }

  if (req.method === 'DELETE' && /^\/api\/trash\/[^/]+$/.test(pathname)) {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const item = await permanentlyDeleteTrashItem(pathname.split('/')[3], auth.actor);
    if (!item) return json(res, 404, { error: 'Recycle bin item not found' });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === '/api/trash/empty') {
    const auth = requireManage(req, db, config);
    if (!auth.ok) return json(res, auth.statusCode, { error: auth.message });
    const settings = readSettings();
    const items = ensureRecycleBin(settings);
    for (const item of items) await storage.delete(item);
    removeImagesFromAlbums(settings, items.map((item) => item.id));
    settings.recycleBin = [];
    settings.updatedAt = new Date().toISOString();
    writeSettings(settings);
    db.addEvent('trash.emptied', { actor: auth.actor, count: items.length });
    return json(res, 200, { ok: true, removed: items.length });
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

function ensureAlbums(settings) {
  settings.albums ||= [];
  return settings.albums;
}

function ensureRecycleBin(settings) {
  settings.recycleBin ||= [];
  return settings.recycleBin;
}

function listAlbums(settings) {
  return ensureAlbums(settings).map((album) => {
    const imageIds = Array.isArray(album.imageIds) ? album.imageIds.map(String) : [];
    const coverImage = album.coverImageId ? db.getImage(album.coverImageId) : db.getImage(imageIds[0] || '');
    const activeImageIds = imageIds.filter((id) => db.getImage(id));
    return {
      ...album,
      imageIds: activeImageIds,
      imageCount: activeImageIds.length,
      coverImageId: album.coverImageId || (activeImageIds[0] || ''),
      coverImage,
      sortMode: album.sortMode || 'manual'
    };
  });
}

function publicAlbum(album) {
  return {
    id: album.id,
    name: album.name,
    description: album.description || '',
    coverImageId: album.coverImageId || '',
    imageIds: album.imageIds || [],
    imageCount: typeof album.imageCount === 'number' ? album.imageCount : (album.imageIds || []).length,
    sortMode: album.sortMode || 'manual',
    coverImage: album.coverImage ? publicImage(album.coverImage) : null,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt
  };
}

function findAlbum(settings, id) {
  return ensureAlbums(settings).find((album) => String(album.id) === String(id));
}

function createAlbumRecord(body, settings) {
  const name = String(body && body.name || '').trim().slice(0, 80);
  if (!name) {
    const error = new Error('Album name is required');
    error.statusCode = 400;
    throw error;
  }
  if (ensureAlbums(settings).some((album) => album.name === name)) {
    const error = new Error('Album name already exists');
    error.statusCode = 409;
    throw error;
  }
  const nowIso = new Date().toISOString();
  return {
    id: `alb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name,
    description: String(body && body.description || '').trim().slice(0, 300),
    coverImageId: String(body && body.coverImageId || '').trim(),
    imageIds: Array.isArray(body && body.imageIds) ? body.imageIds.map(String).slice(0, 2000) : [],
    sortMode: normalizeAlbumSortMode(body && body.sortMode),
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

function moveImageToRecycleBin(image, actor) {
  const settings = readSettings();
  const recycleBin = ensureRecycleBin(settings);
  recycleBin.unshift({
    ...image,
    deletedAt: new Date().toISOString(),
    deletedBy: actor || 'admin'
  });
  settings.updatedAt = new Date().toISOString();
  writeSettings(settings);
  db.addEvent('image.trashed', { actor, id: image.id });
}

function publicTrashItem(item) {
  return {
    id: item.id,
    originalName: item.originalName,
    mime: item.mime,
    size: item.size,
    owner: item.owner,
    source: item.source,
    deletedAt: item.deletedAt,
    deletedBy: item.deletedBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function restoreTrashItem(id, actor) {
  const settings = readSettings();
  const recycleBin = ensureRecycleBin(settings);
  const index = recycleBin.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;
  const [item] = recycleBin.splice(index, 1);
  delete item.deletedAt;
  delete item.deletedBy;
  db.addImage(item);
  settings.updatedAt = new Date().toISOString();
  writeSettings(settings);
  db.addEvent('image.restored', { actor, id: item.id });
  return item;
}

async function permanentlyDeleteTrashItem(id, actor) {
  const settings = readSettings();
  const recycleBin = ensureRecycleBin(settings);
  const index = recycleBin.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;
  const [item] = recycleBin.splice(index, 1);
  await storage.delete(item);
  removeImagesFromAlbums(settings, [item.id]);
  settings.updatedAt = new Date().toISOString();
  writeSettings(settings);
  db.addEvent('image.purged', { actor, id: item.id });
  return item;
}

function removeImagesFromAlbums(settings, ids) {
  const removal = new Set(ids.map(String));
  for (const album of ensureAlbums(settings)) {
    album.imageIds = (album.imageIds || []).filter((id) => !removal.has(String(id)));
    if (album.coverImageId && removal.has(String(album.coverImageId))) {
      album.coverImageId = album.imageIds[0] || '';
    }
    album.updatedAt = new Date().toISOString();
  }
}

function normalizeAlbumSortMode(value) {
  return ['manual', 'newest', 'oldest', 'name'].includes(String(value || '')) ? String(value) : 'manual';
}

function applyAlbumOrdering(images, album) {
  const sortMode = normalizeAlbumSortMode(album.sortMode);
  if (sortMode === 'manual') {
    const order = new Map((album.imageIds || []).map((id, index) => [String(id), index]));
    return [...images].sort((a, b) => (order.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) - (order.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER));
  }
  if (sortMode === 'name') {
    return [...images].sort((a, b) => String(a.originalName || '').localeCompare(String(b.originalName || ''), 'zh-CN'));
  }
  if (sortMode === 'oldest') {
    return [...images].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  return [...images].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function reorderAlbumImages(album, imageId, direction) {
  album.imageIds ||= [];
  const index = album.imageIds.findIndex((id) => String(id) === String(imageId));
  if (index === -1) return;
  const offset = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  const target = index + offset;
  if (target < 0 || target >= album.imageIds.length) return;
  const [image] = album.imageIds.splice(index, 1);
  album.imageIds.splice(target, 0, image);
  album.sortMode = 'manual';
}

async function telegramStatusPayload() {
  const payload = {
    ok: true,
    enabled: Boolean(config.telegramBotToken),
    publicUrl: config.publicUrl,
    webhookUrl: `${config.publicUrl}/telegram/${config.telegramWebhookSecret}`,
    allowedUserIds: config.telegramAllowedUserIds,
    recentEvents: db.listEvents({ limit: 20 }).filter((event) => String(event.type).includes('telegram')).slice(0, 10),
    bot: null,
    webhook: null,
    error: ''
  };
  if (!config.telegramBotToken) return payload;
  try {
    payload.bot = await telegramApi(config, 'getMe', {});
    payload.webhook = await telegramApi(config, 'getWebhookInfo', {});
  } catch (error) {
    payload.error = error.message;
  }
  return payload;
}

async function storageStatusPayload() {
  const settings = readSettings();
  const status = {
    ok: true,
    driver: config.storageDriver,
    bucket: config.s3Bucket || '',
    endpoint: config.s3Endpoint || '',
    region: config.s3Region || '',
    prefix: config.s3Prefix || '',
    publicBaseUrl: config.s3PublicBaseUrl || '',
    forcePathStyle: Boolean(config.s3ForcePathStyle),
    imageCount: db.stats().images,
    recycleCount: ensureRecycleBin(settings).length,
    previousConfigAvailable: Boolean(settings.previousStorageConfig && settings.previousStorageConfig.storageDriver),
    testWrite: false,
    testRead: false,
    message: ''
  };
  try {
    storage.ensure();
    status.testWrite = true;
    if (config.storageDriver === 'local') {
      status.message = `本地目录：${config.uploadDir}`;
      status.testRead = fs.existsSync(config.uploadDir);
    } else {
      const probeBuffer = Buffer.from(`telepic-probe-${Date.now()}`, 'utf8');
      const probe = await storage.saveImage({
        buffer: probeBuffer,
        mime: 'text/plain',
        originalName: 'probe.txt',
        source: 'system',
        owner: 'system'
      });
      const probeRead = await storage.read(probe);
      status.testRead = Buffer.compare(probeRead.buffer, probeBuffer) === 0;
      await storage.delete(probe);
      status.message = status.testRead ? '对象存储读写测试通过' : '对象存储读写结果不一致';
    }
  } catch (error) {
    status.ok = false;
    status.message = error.message;
  }
  return status;
}

async function createImageZip(images) {
  const files = [];
  for (const image of images) {
    const stored = await storage.read(image);
    files.push({
      name: safeArchiveName(image.originalName || image.fileName || `${image.id}.bin`, image.id),
      data: stored.buffer
    });
  }
  return createZipArchive(files);
}

function safeArchiveName(name, fallbackId) {
  const base = String(name || `${fallbackId}.bin`).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 180);
  return base || `${fallbackId}.bin`;
}

function createZipArchive(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data || '');
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc >>> 0, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += localHeader.length + name.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
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

function updateEnvValues(filePath, values) {
  for (const [key, value] of Object.entries(values)) updateEnvValue(filePath, key, value);
}

function updateRuntimeConfig(values) {
  for (const [key, value] of Object.entries(values)) {
    config[key] = value;
  }
}

function currentStorageSnapshot() {
  return {
    rootDir: config.rootDir,
    uploadDir: config.uploadDir,
    storageDriver: config.storageDriver,
    s3Bucket: config.s3Bucket,
    s3Region: config.s3Region,
    s3Endpoint: config.s3Endpoint,
    s3AccessKeyId: config.s3AccessKeyId,
    s3SecretAccessKey: config.s3SecretAccessKey,
    s3PublicBaseUrl: config.s3PublicBaseUrl,
    s3Prefix: config.s3Prefix,
    s3ForcePathStyle: config.s3ForcePathStyle
  };
}

function createStorageFromSnapshot(snapshot) {
  const merged = {
    ...config,
    ...snapshot
  };
  return createStorage(merged);
}

function telegramConfigPayload() {
  return {
    ok: true,
    telegramEnabled: Boolean(config.telegramBotToken),
    telegramBotConfigured: Boolean(config.telegramBotToken),
    telegramAllowedUserIds: config.telegramAllowedUserIds.join(','),
    telegramWebhookSecret: config.telegramWebhookSecret,
    telegramWebhookUrl: `${config.publicUrl}/telegram/${config.telegramWebhookSecret}`,
    publicUrl: config.publicUrl
  };
}

function storageConfigPayload() {
  return {
    ok: true,
    storageDriver: config.storageDriver,
    s3Configured: Boolean(config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey),
    s3Bucket: config.s3Bucket,
    s3Endpoint: config.s3Endpoint,
    s3Region: config.s3Region,
    s3Prefix: config.s3Prefix,
    s3ForcePathStyle: config.s3ForcePathStyle,
    s3PublicBaseUrl: config.s3PublicBaseUrl
  };
}

function systemStatusPayload() {
  const memory = process.memoryUsage();
  const settings = readSettings();
  return {
    ok: true,
    uptimeSeconds: Math.floor((Date.now() - bootAt) / 1000),
    pid: process.pid,
    nodeVersion: process.version,
    platform: `${process.platform}/${process.arch}`,
    dataDir: config.dataDir,
    uploadDir: config.uploadDir,
    databaseDriver: config.databaseDriver,
    storageDriver: config.storageDriver,
    imageCount: db.stats().images,
    recycleCount: ensureRecycleBin(settings).length,
    albumCount: ensureAlbums(settings).length,
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal
    },
    checks: {
      dataDirWritable: fs.existsSync(config.dataDir),
      uploadDirWritable: fs.existsSync(config.uploadDir),
      themeConfigured: fs.existsSync(settingsPath()),
      telegramConfigured: Boolean(config.telegramBotToken),
      storageConfigured: config.storageDriver === 'local' ? true : Boolean(config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey)
    }
  };
}

function storageConfigFromBody(body) {
  const storageDriver = body.storageDriver === 's3' ? 's3' : 'local';
  return {
    storageDriver,
    s3Bucket: cleanText(body.s3Bucket, config.s3Bucket, 200),
    s3Region: cleanText(body.s3Region, config.s3Region || 'auto', 80) || 'auto',
    s3Endpoint: cleanOptionalUrl(body.s3Endpoint, config.s3Endpoint),
    s3AccessKeyId: cleanConfigText(body.s3AccessKeyId, config.s3AccessKeyId, 400),
    s3SecretAccessKey: cleanConfigText(body.s3SecretAccessKey, config.s3SecretAccessKey, 800),
    s3PublicBaseUrl: cleanOptionalUrl(body.s3PublicBaseUrl, config.s3PublicBaseUrl),
    s3Prefix: cleanPrefix(body.s3Prefix, config.s3Prefix),
    s3ForcePathStyle: boolInput(body.s3ForcePathStyle, config.s3ForcePathStyle)
  };
}

function cleanText(value, fallback = '', max = 400) {
  if (typeof value !== 'string') return fallback || '';
  return value.trim().slice(0, max);
}

function cleanConfigText(value, fallback = '', max = 400) {
  const textValue = cleanText(value, '', max);
  return textValue || fallback || '';
}

function cleanUrl(value, fallback = '') {
  const textValue = cleanText(value, fallback, 400).replace(/\/+$/, '');
  if (!textValue) return fallback || '';
  try {
    const parsed = new URL(textValue);
    if (!['http:', 'https:'].includes(parsed.protocol)) return fallback || '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback || '';
  }
}

function cleanOptionalUrl(value, fallback = '') {
  const textValue = cleanText(value, '', 400);
  return textValue ? cleanUrl(textValue, fallback) : '';
}

function cleanSecret(value, fallback = '') {
  const textValue = cleanText(value, fallback, 200);
  return textValue.replace(/[^a-zA-Z0-9_-]/g, '') || fallback || `tp_wh_${Date.now().toString(36)}`;
}

function cleanPrefix(value, fallback = '') {
  const textValue = cleanText(value, fallback, 180);
  return textValue.replace(/^\/+/, '').replace(/\/+$/, '');
}

function csvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 200);
}

function boolInput(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return Boolean(fallback);
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function refreshSessionHeader(req, res) {
  const token = bearerToken(req);
  const refreshed = refreshAdminSession(token, config);
  if (!refreshed) return;
  res.setHeader('x-admin-session', refreshed.token);
  res.setHeader('x-admin-session-expires-at', refreshed.expiresAt);
  res.setHeader('x-admin-session-idle-expires-at', refreshed.idleExpiresAt);
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
