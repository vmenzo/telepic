import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { now, randomId, sha256 } from './utils';

function createDb(config) {
  if (config.databaseDriver === 'sqlite') {
    return new SqliteDb(config.databaseFile, path.join(config.dataDir, 'db.json'));
  }
  return new JsonDb(path.join(config.dataDir, 'db.json'));
}

class JsonDb {
  filePath: string;
  state: {
    images: any[];
    tokens: any[];
    events: any[];
  };

  constructor(filePath) {
    this.filePath = filePath;
    this.state = {
      images: [],
      tokens: [],
      events: []
    };
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      this.save();
      return;
    }
    const raw = fs.readFileSync(this.filePath, 'utf8');
    if (raw.trim()) this.state = JSON.parse(raw);
    this.state.images ||= [];
    this.state.tokens ||= [];
    this.state.events ||= [];
  }

  save() {
    const temp = `${this.filePath}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(this.state, null, 2));
    fs.renameSync(temp, this.filePath);
  }

  addImage(image) {
    this.state.images.unshift(image);
    this.addEvent('image.created', { id: image.id, source: image.source });
    this.save();
    return image;
  }

  listImages(options = {}) {
    return filterAndSortImages(this.state.images, options);
  }

  getImage(id) {
    return this.state.images.find((image) => image.id === id);
  }

  updateImage(id, patch) {
    const image = this.getImage(id);
    if (!image) return null;
    Object.assign(image, patch, { updatedAt: now() });
    this.addEvent('image.updated', { id, patch });
    this.save();
    return image;
  }

  deleteImage(id) {
    const index = this.state.images.findIndex((image) => image.id === id);
    if (index === -1) return null;
    const [image] = this.state.images.splice(index, 1);
    this.addEvent('image.deleted', { id });
    this.save();
    return image;
  }

  createToken({ name, scopes, expiresAt = null }) {
    const token = `tp_${randomId(24)}`;
    const record = {
      id: randomId(8),
      name: name || 'API token',
      tokenHash: sha256(Buffer.from(token)),
      scopes: normalizeScopes(scopes),
      createdAt: now(),
      lastUsedAt: null,
      lastUsedIp: null,
      expiresAt: normalizeExpiresAt(expiresAt)
    };
    this.state.tokens.unshift(record);
    this.addEvent('token.created', { id: record.id, name: record.name });
    this.save();
    return { token, record: this.publicToken(record) };
  }

  listTokens() {
    return this.state.tokens.map((token) => this.publicToken(token));
  }

  getToken(id) {
    const token = this.state.tokens.find((item) => item.id === id);
    return token ? this.publicToken(token) : null;
  }

  findToken(rawToken) {
    if (!rawToken) return null;
    const tokenHash = sha256(Buffer.from(rawToken));
    return this.state.tokens.find((token) => token.tokenHash === tokenHash);
  }

  touchToken(id, ip = '') {
    const token = this.state.tokens.find((item) => item.id === id);
    if (!token) return;
    token.lastUsedAt = now();
    token.lastUsedIp = ip || token.lastUsedIp || null;
    this.save();
  }

  deleteToken(id) {
    const index = this.state.tokens.findIndex((token) => token.id === id);
    if (index === -1) return null;
    const [token] = this.state.tokens.splice(index, 1);
    this.addEvent('token.deleted', { id });
    this.save();
    return this.publicToken(token);
  }

  stats() {
    return statsFor(this.state.images, this.state.tokens);
  }

  listEvents({ limit = 30 } = {}) {
    return this.state.events.slice(0, limit);
  }

  addEvent(type, details) {
    this.state.events.unshift({ id: randomId(8), type, details, createdAt: now() });
    this.state.events = this.state.events.slice(0, 500);
    this.save();
  }

  publicToken(token) {
    return publicToken(token);
  }

  findImageBySha256(hash) {
    if (!hash) return null;
    return this.state.images.find((image) => image.sha256 === hash && !image.deletedAt) || null;
  }

  close() {}
}

class SqliteDb {
  filePath: string;
  importJsonPath: string;
  db: any;

  constructor(filePath, importJsonPath) {
    this.filePath = filePath;
    this.importJsonPath = importJsonPath;
    this.db = null;
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.db = new DatabaseSync(this.filePath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.migrate();
    this.importJsonIfNeeded();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        file_name TEXT,
        storage_key TEXT,
        storage_driver TEXT NOT NULL DEFAULT 'local',
        original_name TEXT,
        mime TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        sha256 TEXT,
        source TEXT,
        owner TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        visibility TEXT NOT NULL DEFAULT 'public',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        url TEXT,
        raw_url TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
      CREATE INDEX IF NOT EXISTS idx_images_visibility ON images(visibility);
      CREATE INDEX IF NOT EXISTS idx_images_source ON images(source);

      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        scopes TEXT NOT NULL DEFAULT '["upload"]',
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        last_used_ip TEXT,
        expires_at TEXT
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
    `);
    this.ensureColumn('images', 'storage_driver', "TEXT NOT NULL DEFAULT 'local'");
    this.ensureColumn('tokens', 'last_used_ip', 'TEXT');
    this.ensureColumn('tokens', 'expires_at', 'TEXT');
  }

  ensureColumn(table, column, definition) {
    const exists = this.db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
    if (!exists) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  importJsonIfNeeded() {
    if (!this.importJsonPath || !fs.existsSync(this.importJsonPath)) return;
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM images').get().count;
    if (count > 0) return;

    const raw = fs.readFileSync(this.importJsonPath, 'utf8');
    if (!raw.trim()) return;
    const state = JSON.parse(raw);
    const insertImage = this.db.prepare(`
      INSERT OR IGNORE INTO images (
        id, file_name, storage_key, storage_driver, original_name, mime, size, sha256, source, owner, tags, visibility, created_at, updated_at, url, raw_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertToken = this.db.prepare(`
      INSERT OR IGNORE INTO tokens (id, name, token_hash, scopes, created_at, last_used_at, last_used_ip, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvent = this.db.prepare(`
      INSERT OR IGNORE INTO events (id, type, details, created_at)
      VALUES (?, ?, ?, ?)
    `);

    this.db.exec('BEGIN');
    try {
      for (const image of state.images || []) insertImage.run(...imageValues(image));
      for (const token of state.tokens || []) {
        insertToken.run(token.id, token.name || 'API token', token.tokenHash, jsonText(normalizeScopes(token.scopes)), token.createdAt || now(), token.lastUsedAt || null, token.lastUsedIp || null, normalizeExpiresAt(token.expiresAt));
      }
      for (const event of state.events || []) {
        insertEvent.run(event.id || randomId(8), event.type || 'event', jsonText(event.details || {}), event.createdAt || now());
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  addImage(image) {
    this.db.prepare(`
      INSERT INTO images (
        id, file_name, storage_key, storage_driver, original_name, mime, size, sha256, source, owner, tags, visibility, created_at, updated_at, url, raw_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...imageValues(image));
    this.addEvent('image.created', { id: image.id, source: image.source });
    return image;
  }

  listImages(options = {}) {
    const rows = this.db.prepare('SELECT * FROM images').all();
    return filterAndSortImages(rows.map(rowToImage), options);
  }

  getImage(id) {
    const row = this.db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    return row ? rowToImage(row) : null;
  }

  updateImage(id, patch) {
    const image = this.getImage(id);
    if (!image) return null;
    const updated = { ...image, ...patch, updatedAt: now() };
    this.db.prepare(`
      UPDATE images SET
        file_name = ?, storage_key = ?, storage_driver = ?, original_name = ?, mime = ?, size = ?, sha256 = ?, source = ?, owner = ?,
        tags = ?, visibility = ?, created_at = ?, updated_at = ?, url = ?, raw_url = ?
      WHERE id = ?
    `).run(
      updated.fileName || null,
      updated.storageKey || null,
      updated.storageDriver || 'local',
      updated.originalName || null,
      updated.mime,
      updated.size || 0,
      updated.sha256 || null,
      updated.source || null,
      updated.owner || null,
      jsonText(updated.tags || []),
      updated.visibility || 'public',
      updated.createdAt,
      updated.updatedAt,
      updated.url || null,
      updated.rawUrl || null,
      id
    );
    this.addEvent('image.updated', { id, patch });
    return updated;
  }

  deleteImage(id) {
    const image = this.getImage(id);
    if (!image) return null;
    this.db.prepare('DELETE FROM images WHERE id = ?').run(id);
    this.addEvent('image.deleted', { id });
    return image;
  }

  createToken({ name, scopes, expiresAt = null }) {
    const token = `tp_${randomId(24)}`;
    const record = {
      id: randomId(8),
      name: name || 'API token',
      tokenHash: sha256(Buffer.from(token)),
      scopes: normalizeScopes(scopes),
      createdAt: now(),
      lastUsedAt: null,
      lastUsedIp: null,
      expiresAt: normalizeExpiresAt(expiresAt)
    };
    this.db.prepare(`
      INSERT INTO tokens (id, name, token_hash, scopes, created_at, last_used_at, last_used_ip, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(record.id, record.name, record.tokenHash, jsonText(record.scopes), record.createdAt, record.lastUsedAt, record.lastUsedIp, record.expiresAt);
    this.addEvent('token.created', { id: record.id, name: record.name });
    return { token, record: this.publicToken(record) };
  }

  listTokens() {
    return this.db.prepare('SELECT * FROM tokens ORDER BY created_at DESC').all().map((row) => this.publicToken(rowToToken(row)));
  }

  getToken(id) {
    const row = this.db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
    return row ? this.publicToken(rowToToken(row)) : null;
  }

  findToken(rawToken) {
    if (!rawToken) return null;
    const tokenHash = sha256(Buffer.from(rawToken));
    const row = this.db.prepare('SELECT * FROM tokens WHERE token_hash = ?').get(tokenHash);
    return row ? rowToToken(row) : null;
  }

  touchToken(id, ip = '') {
    this.db.prepare('UPDATE tokens SET last_used_at = ?, last_used_ip = COALESCE(NULLIF(?, \'\'), last_used_ip) WHERE id = ?').run(now(), ip || '', id);
  }

  deleteToken(id) {
    const row = this.db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
    if (!row) return null;
    this.db.prepare('DELETE FROM tokens WHERE id = ?').run(id);
    this.addEvent('token.deleted', { id });
    return this.publicToken(rowToToken(row));
  }

  stats() {
    return statsFor(this.db.prepare('SELECT * FROM images').all().map(rowToImage), this.db.prepare('SELECT id FROM tokens').all());
  }

  listEvents({ limit = 30 } = {}) {
    return this.db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?').all(limit).map(rowToEvent);
  }

  addEvent(type, details) {
    this.db.prepare('INSERT INTO events (id, type, details, created_at) VALUES (?, ?, ?, ?)').run(randomId(8), type, jsonText(details || {}), now());
    this.db.prepare('DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY created_at DESC LIMIT 500)').run();
  }

  publicToken(token) {
    return publicToken(token);
  }

  findImageBySha256(hash) {
    if (!hash) return null;
    const row = this.db.prepare('SELECT * FROM images WHERE sha256 = ? ORDER BY created_at DESC LIMIT 1').get(hash);
    return row ? rowToImage(row) : null;
  }

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
  }
}

function imageValues(image) {
  return [
    image.id,
    image.fileName || null,
    image.storageKey || image.fileName || null,
    image.storageDriver || 'local',
    image.originalName || image.fileName || image.id,
    image.mime,
    image.size || 0,
    image.sha256 || null,
    image.source || 'api',
    image.owner || null,
    jsonText(image.tags || []),
    image.visibility || 'public',
    image.createdAt || now(),
    image.updatedAt || image.createdAt || now(),
    image.url || null,
    image.rawUrl || null
  ];
}

function rowToImage(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    storageKey: row.storage_key,
    storageDriver: row.storage_driver || 'local',
    originalName: row.original_name,
    mime: row.mime,
    size: Number(row.size || 0),
    sha256: row.sha256,
    source: row.source,
    owner: row.owner,
    tags: parseJson(row.tags, []),
    visibility: row.visibility || 'public',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    url: row.url,
    rawUrl: row.raw_url
  };
}

function rowToToken(row) {
  return {
    id: row.id,
    name: row.name,
    tokenHash: row.token_hash,
    scopes: parseJson(row.scopes, ['upload']),
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    lastUsedIp: row.last_used_ip,
    expiresAt: row.expires_at
  };
}

function rowToEvent(row) {
  return {
    id: row.id,
    type: row.type,
    details: parseJson(row.details, {}),
    createdAt: row.created_at
  };
}

function filterAndSortImages(sourceImages, { limit = 50, offset = 0, includePrivate = false, q = '', visibility = '', source = '', tag = '', sort = 'newest' } = {}) {
  const keyword = String(q || '').trim().toLowerCase();
  let images = includePrivate
    ? sourceImages
    : sourceImages.filter((image) => image.visibility === 'public');

  if (visibility && ['public', 'private'].includes(visibility)) {
    images = images.filter((image) => image.visibility === visibility);
  }

  if (source) {
    images = images.filter((image) => image.source === source);
  }

  if (tag) {
    const needle = String(tag).trim().toLowerCase();
    images = images.filter((image) => Array.isArray(image.tags) && image.tags.some((item) => String(item).toLowerCase() === needle));
  }

  if (keyword) {
    images = images.filter((image) => {
      return [
        image.id,
        image.originalName,
        image.mime,
        image.sha256,
        image.source,
        image.owner,
        ...(Array.isArray(image.tags) ? image.tags : [])
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }

  return sortImages(images, sort).slice(offset, offset + limit);
}

function sortImages(images, sort) {
  const list = [...images];
  if (sort === 'oldest') {
    return list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  if (sort === 'name') {
    return list.sort((a, b) => String(a.originalName || '').localeCompare(String(b.originalName || ''), 'zh-CN'));
  }
  if (sort === 'size-desc') {
    return list.sort((a, b) => b.size - a.size);
  }
  if (sort === 'size-asc') {
    return list.sort((a, b) => a.size - b.size);
  }
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function statsFor(images, tokens) {
  const totalBytes = images.reduce((sum, image) => sum + image.size, 0);
  const sortedByTime = [...images].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const largest = [...images].sort((a, b) => (b.size || 0) - (a.size || 0))[0] || null;
  const sourceBreakdown = images.reduce((acc, image) => {
    const key = image.source || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const mimeBreakdown = images.reduce((acc, image) => {
    const key = image.mime || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const tagBreakdown = images.reduce((acc, image) => {
    for (const tag of image.tags || []) {
      acc[tag] = (acc[tag] || 0) + 1;
    }
    return acc;
  }, {});
  const ownerBreakdown = images.reduce((acc, image) => {
    const key = image.owner || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    images: images.length,
    publicImages: images.filter((image) => image.visibility === 'public').length,
    privateImages: images.filter((image) => image.visibility === 'private').length,
    totalBytes,
    averageBytes: images.length ? Math.round(totalBytes / images.length) : 0,
    latestImageAt: sortedByTime[0] ? sortedByTime[0].createdAt : null,
    oldestImageAt: sortedByTime[sortedByTime.length - 1] ? sortedByTime[sortedByTime.length - 1].createdAt : null,
    largestImage: largest ? {
      id: largest.id,
      originalName: largest.originalName,
      size: largest.size
    } : null,
    tokens: tokens.length,
    sourceBreakdown,
    mimeBreakdown,
    tagBreakdown,
    ownerBreakdown
  };
}

function publicToken(token) {
  return {
    id: token.id,
    name: token.name,
    scopes: token.scopes,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
    lastUsedIp: token.lastUsedIp || null,
    expiresAt: token.expiresAt || null,
    expired: token.expiresAt ? new Date(token.expiresAt).getTime() <= Date.now() : false
  };
}

function normalizeScopes(scopes) {
  return Array.isArray(scopes) && scopes.length ? scopes : ['upload'];
}

function normalizeExpiresAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function jsonText(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export { JsonDb, SqliteDb, createDb };
