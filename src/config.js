const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = parseEnvValue(trimmed.slice(index + 1).trim());
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function parseEnvValue(value) {
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

const envFile = path.resolve(process.cwd(), '.env');
loadEnvFile(envFile);

const rootDir = path.resolve(process.cwd());
const dataDir = path.resolve(rootDir, process.env.DATA_DIR || './data');
const databaseFile = process.env.DATABASE_FILE
  ? path.resolve(rootDir, process.env.DATABASE_FILE)
  : path.join(dataDir, 'telepic.sqlite');

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function csv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  rootDir,
  envFile,
  dataDir,
  databaseDriver: process.env.DATABASE_DRIVER || 'sqlite',
  databaseFile,
  uploadDir: path.join(dataDir, 'uploads'),
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: process.env.S3_REGION || 'auto',
  s3Endpoint: process.env.S3_ENDPOINT || '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
  s3Prefix: process.env.S3_PREFIX || '',
  s3ForcePathStyle: bool(process.env.S3_FORCE_PATH_STYLE, process.env.S3_ENDPOINT ? true : false),
  port: Number(process.env.PORT || 8787),
  host: process.env.HOST || '127.0.0.1',
  publicUrl: (process.env.PUBLIC_URL || 'http://127.0.0.1:8787').replace(/\/$/, ''),
  adminToken: process.env.ADMIN_TOKEN || 'change-me-to-a-long-random-secret',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || 'change-me-to-a-long-random-secret',
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_TOKEN || '',
  adminSessionHours: Number(process.env.ADMIN_SESSION_HOURS || 168),
  publicUpload: bool(process.env.PUBLIC_UPLOAD, false),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || 'change-me-webhook-secret',
  telegramAllowedUserIds: csv(process.env.TELEGRAM_ALLOWED_USER_IDS),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024)
};
