const fs = require('fs');
const path = require('path');
const { now, randomId, sha256 } = require('./utils');

class JsonDb {
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

  listImages({ limit = 50, offset = 0, includePrivate = false, q = '', visibility = '', source = '', tag = '', sort = 'newest' } = {}) {
    const keyword = String(q || '').trim().toLowerCase();
    let images = includePrivate
      ? this.state.images
      : this.state.images.filter((image) => image.visibility === 'public');

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

    images = this.sortImages(images, sort);
    return images.slice(offset, offset + limit);
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

  createToken({ name, scopes }) {
    const token = `tp_${randomId(24)}`;
    const record = {
      id: randomId(8),
      name: name || 'API token',
      tokenHash: sha256(Buffer.from(token)),
      scopes: Array.isArray(scopes) && scopes.length ? scopes : ['upload'],
      createdAt: now(),
      lastUsedAt: null
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

  touchToken(id) {
    const token = this.state.tokens.find((item) => item.id === id);
    if (!token) return;
    token.lastUsedAt = now();
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
    const totalBytes = this.state.images.reduce((sum, image) => sum + image.size, 0);
    const sourceBreakdown = this.state.images.reduce((acc, image) => {
      const key = image.source || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      images: this.state.images.length,
      publicImages: this.state.images.filter((image) => image.visibility === 'public').length,
      privateImages: this.state.images.filter((image) => image.visibility === 'private').length,
      totalBytes,
      tokens: this.state.tokens.length,
      sourceBreakdown
    };
  }

  listEvents({ limit = 30 } = {}) {
    return this.state.events.slice(0, limit);
  }

  addEvent(type, details) {
    this.state.events.unshift({ id: randomId(8), type, details, createdAt: now() });
    this.state.events = this.state.events.slice(0, 500);
  }

  sortImages(images, sort) {
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

  publicToken(token) {
    return {
      id: token.id,
      name: token.name,
      scopes: token.scopes,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt
    };
  }
}

module.exports = { JsonDb };
