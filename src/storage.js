const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { extensionForMime, now, randomId, sha256 } = require('./utils');

function createStorage(config) {
  if (config.storageDriver === 's3') {
    return new S3Storage(config);
  }
  return new LocalStorage(config.uploadDir);
}

class LocalStorage {
  constructor(uploadDir) {
    this.uploadDir = uploadDir;
    this.driver = 'local';
  }

  ensure() {
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  saveImage({ buffer, mime, originalName, source, owner }) {
    this.ensure();
    const record = createImageRecord({ buffer, mime, originalName, source, owner, storageDriver: this.driver });
    this.writeObject(record, buffer, mime);
    return record;
  }

  pathFor(image) {
    return path.join(this.uploadDir, image.storageKey || image.fileName);
  }

  async read(image) {
    const filePath = this.pathFor(image);
    return {
      buffer: fs.readFileSync(filePath),
      mime: image.mime
    };
  }

  writeObject(image, buffer) {
    const filePath = this.pathFor(image);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
  }

  delete(image) {
    const filePath = this.pathFor(image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

class S3Storage {
  constructor(config) {
    this.driver = 's3';
    this.bucket = config.s3Bucket;
    this.region = config.s3Region || 'auto';
    this.accessKeyId = config.s3AccessKeyId;
    this.secretAccessKey = config.s3SecretAccessKey;
    this.endpoint = (config.s3Endpoint || '').replace(/\/$/, '');
    this.publicBaseUrl = (config.s3PublicBaseUrl || '').replace(/\/$/, '');
    this.prefix = normalizePrefix(config.s3Prefix || '');
    this.forcePathStyle = config.s3ForcePathStyle;
  }

  ensure() {
    for (const [key, value] of Object.entries({
      S3_BUCKET: this.bucket,
      S3_ACCESS_KEY_ID: this.accessKeyId,
      S3_SECRET_ACCESS_KEY: this.secretAccessKey
    })) {
      if (!value) {
        throw new Error(`Missing object storage configuration: ${key}`);
      }
    }
  }

  async saveImage({ buffer, mime, originalName, source, owner }) {
    this.ensure();
    const record = createImageRecord({ buffer, mime, originalName, source, owner, prefix: this.prefix, storageDriver: this.driver });
    await this.writeObject(record, buffer, mime);
    return record;
  }

  async read(image) {
    this.ensure();
    const target = this.buildRequest('GET', image.storageKey || image.fileName, Buffer.alloc(0), '');
    const response = await fetch(target.url, {
      method: 'GET',
      headers: target.headers
    });
    if (!response.ok) {
      throw new Error(`Object storage read failed: ${response.status}`);
    }
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mime: image.mime || response.headers.get('content-type') || 'application/octet-stream'
    };
  }

  async delete(image) {
    this.ensure();
    const target = this.buildRequest('DELETE', image.storageKey || image.fileName, Buffer.alloc(0), '');
    const response = await fetch(target.url, {
      method: 'DELETE',
      headers: target.headers
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Object storage delete failed: ${response.status}`);
    }
  }

  getPublicObjectUrl(image) {
    if (!this.publicBaseUrl) return '';
    return `${this.publicBaseUrl}/${encodeURIComponentPath(image.storageKey || image.fileName)}`;
  }

  async writeObject(image, buffer, mime) {
    const target = this.buildRequest('PUT', image.storageKey || image.fileName, buffer, mime);
    const response = await fetch(target.url, {
      method: 'PUT',
      headers: target.headers,
      body: buffer
    });
    if (!response.ok) {
      throw new Error(`Object storage upload failed: ${response.status}`);
    }
  }

  buildRequest(method, objectKey, bodyBuffer, mime) {
    const endpoint = this.resolveEndpoint();
    const host = endpoint.host;
    const pathname = this.resolvePathname(objectKey);
    const url = `${endpoint.origin}${pathname}`;
    const timestamp = amzTimestamp();
    const dateStamp = timestamp.slice(0, 8);
    const payloadHash = sha256Hex(bodyBuffer);
    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${timestamp}`
    ].join('\n');
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      method,
      pathname,
      '',
      `${canonicalHeaders}\n`,
      signedHeaders,
      payloadHash
    ].join('\n');
    const scope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      scope,
      sha256Hex(Buffer.from(canonicalRequest, 'utf8'))
    ].join('\n');
    const signingKey = signingKeyFor(this.secretAccessKey, dateStamp, this.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const headers = {
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': timestamp,
      Authorization: [
        `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${scope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`
      ].join(', ')
    };
    if (mime) headers['content-type'] = mime;
    return { url, headers };
  }

  resolveEndpoint() {
    if (this.endpoint) {
      const endpoint = new URL(this.endpoint);
      if (this.forcePathStyle) return endpoint;
      const virtual = new URL(endpoint.toString());
      virtual.hostname = `${this.bucket}.${endpoint.hostname}`;
      return virtual;
    }

    const endpoint = new URL(
      this.region === 'us-east-1'
        ? 'https://s3.amazonaws.com'
        : `https://s3.${this.region}.amazonaws.com`
    );
    if (this.forcePathStyle) return endpoint;
    endpoint.hostname = `${this.bucket}.${endpoint.hostname}`;
    return endpoint;
  }

  resolvePathname(objectKey) {
    const encodedKey = encodeURIComponentPath(objectKey);
    if (this.endpoint && this.forcePathStyle) return `/${this.bucket}/${encodedKey}`;
    if (!this.endpoint && this.forcePathStyle) return `/${this.bucket}/${encodedKey}`;
    return `/${encodedKey}`;
  }
}

function createImageRecord({ buffer, mime, originalName, source, owner, prefix = '', storageDriver = 'local' }) {
  const id = randomId(10);
  const extension = extensionForMime(mime);
  const fileName = `${id}.${extension}`;
  const storageKey = prefix ? `${prefix}/${fileName}` : fileName;
  return {
    id,
    fileName,
    storageKey,
    storageDriver,
    originalName: originalName || fileName,
    mime,
    size: buffer.length,
    sha256: sha256(buffer),
    source: source || 'api',
    owner: owner || null,
    tags: [],
    visibility: 'public',
    createdAt: now(),
    updatedAt: now()
  };
}

function normalizePrefix(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function encodeURIComponentPath(value) {
  return String(value)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function amzTimestamp() {
  return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function signingKeyFor(secret, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest();
}

module.exports = { createStorage };
