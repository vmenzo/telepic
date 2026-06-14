import fs from 'fs';
import path from 'path';

const PLACEHOLDER_VALUES = new Set([
  'change-me-to-a-long-random-secret',
  'change-me-admin-password',
  'change-me-webhook-secret',
  ''
]);

function configWarnings(config) {
  const warnings: string[] = [];
  const isPublicHost = ['0.0.0.0', '::'].includes(String(config.host || ''));
  const publicUrl = safeUrl(config.publicUrl);

  if (PLACEHOLDER_VALUES.has(String(config.adminToken || '')) && !config.adminTokenHash) {
    warnings.push('ADMIN_TOKEN is using a default or empty value.');
  }
  if (PLACEHOLDER_VALUES.has(String(config.adminPassword || '')) && !config.adminPasswordHash) {
    warnings.push('ADMIN_PASSWORD is using a default or empty value.');
  }
  if (!config.adminSessionSecret && !config.adminTokenHash) {
    warnings.push('ADMIN_SESSION_SECRET is not set; sessions depend on the admin token/password secret.');
  }
  if (config.publicUpload) {
    warnings.push('PUBLIC_UPLOAD is enabled; anonymous uploads are allowed.');
  }
  if (config.telegramBotToken && PLACEHOLDER_VALUES.has(String(config.telegramWebhookSecret || ''))) {
    warnings.push('TELEGRAM_WEBHOOK_SECRET should be changed before exposing the bot webhook.');
  }
  if (isPublicHost && publicUrl && publicUrl.protocol === 'http:' && !isLocalPublicUrl(publicUrl)) {
    warnings.push('PUBLIC_URL uses plain HTTP while the service listens on a public interface.');
  }
  if (!['sqlite', 'json'].includes(String(config.databaseDriver || ''))) {
    warnings.push(`DATABASE_DRIVER "${config.databaseDriver}" is not supported; use sqlite or json.`);
  }
  if (!['local', 's3'].includes(String(config.storageDriver || ''))) {
    warnings.push(`STORAGE_DRIVER "${config.storageDriver}" is not supported; use local or s3.`);
  }
  if (config.storageDriver === 's3') {
    const missing = ['s3Bucket', 's3AccessKeyId', 's3SecretAccessKey'].filter((key) => !config[key]);
    if (missing.length) warnings.push(`S3 storage is selected but missing: ${missing.join(', ')}.`);
  }
  if (!Number.isFinite(Number(config.maxUploadBytes)) || Number(config.maxUploadBytes) <= 0) {
    warnings.push('MAX_UPLOAD_BYTES must be a positive number.');
  }
  if (config.allowSvgUploads) {
    warnings.push('ALLOW_SVG_UPLOADS is enabled; only use it for trusted uploaders.');
  }

  return warnings;
}

function healthPayload(config, db, settings, bootAt) {
  const dataDirWritable = canWriteDirectory(config.dataDir);
  const uploadDirWritable = config.storageDriver === 'local' ? canWriteDirectory(config.uploadDir) : true;
  const dbReady = dbReadyCheck(config);
  const warnings = configWarnings(config);
  const ok = dataDirWritable && uploadDirWritable && dbReady.ok && warnings.every((warning) => !warning.includes('not supported') && !warning.includes('must be'));
  return {
    ok,
    status: ok ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor((Date.now() - bootAt) / 1000),
    storageDriver: config.storageDriver,
    databaseDriver: config.databaseDriver,
    imageCount: db.stats().images,
    recycleCount: Array.isArray(settings.recycleBin) ? settings.recycleBin.length : 0,
    checks: {
      dataDirWritable,
      uploadDirWritable,
      database: dbReady.ok
    },
    warnings
  };
}

function canWriteDirectory(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function dbReadyCheck(config) {
  try {
    if (config.databaseDriver === 'sqlite') {
      fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
      fs.accessSync(path.dirname(config.databaseFile), fs.constants.R_OK | fs.constants.W_OK);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function safeUrl(value) {
  try {
    return new URL(String(value || ''));
  } catch {
    return null;
  }
}

function isLocalPublicUrl(url) {
  return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
}

export { configWarnings, healthPayload };
