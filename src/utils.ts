import crypto from 'crypto';

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/heic-sequence': 'heic',
  'image/heif-sequence': 'heif'
};

const EXTENSION_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  heif: 'image/heif'
};

const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']);

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function text(res, status, payload) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(payload);
}

function randomId(length = 12) {
  return crypto.randomBytes(length).toString('base64url');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function now() {
  return new Date().toISOString();
}

function extensionForMime(mime) {
  return MIME_EXTENSIONS[mime] || 'bin';
}

function isImageMime(mime) {
  return Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, cleanMime(mime));
}

function cleanMime(mime) {
  return String(mime || '').split(';')[0].trim().toLowerCase();
}

function mimeFromFileName(filename) {
  const match = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? (EXTENSION_MIME[match[1]] || '') : '';
}

function mimeFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return '';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 6) {
    const gif = buffer.slice(0, 6).toString('ascii');
    if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif';
  }
  if (buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  const brandMime = mimeFromIsoBmff(buffer);
  if (brandMime) return brandMime;
  const prefix = buffer.slice(0, 512).toString('utf8').trimStart().toLowerCase();
  if (prefix.startsWith('<svg') || prefix.includes('<svg')) return 'image/svg+xml';
  return '';
}

function mimeFromIsoBmff(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.slice(4, 8).toString('ascii') !== 'ftyp') return '';
  const brands = [buffer.slice(8, 12).toString('ascii')];
  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    brands.push(buffer.slice(offset, offset + 4).toString('ascii'));
  }
  if (brands.includes('avif') || brands.includes('avis')) return 'image/avif';
  if (brands.some((brand) => ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'].includes(brand))) return 'image/heic';
  if (brands.some((brand) => HEIF_BRANDS.has(brand))) return 'image/heif';
  return '';
}

function normalizeImageMime(mime, filename, buffer) {
  const cleaned = cleanMime(mime);
  if (isImageMime(cleaned)) return cleaned;
  return mimeFromBuffer(buffer) || mimeFromFileName(filename) || cleaned || 'application/octet-stream';
}

function detectImageMime(buffer) {
  return mimeFromBuffer(buffer);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseJsonBody(req, maxBytes) {
  return readBody(req, maxBytes).then((buffer) => {
    if (!buffer.length) return {};
    return JSON.parse(buffer.toString('utf8'));
  });
}

function readBody(req, maxBytes) {
  if (Buffer.isBuffer(req.__bodyBuffer)) {
    if (req.__bodyBuffer.length > maxBytes) {
      return Promise.reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
    }
    return Promise.resolve(req.__bodyBuffer);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export {
  cleanMime,
  detectImageMime,
  escapeHtml,
  extensionForMime,
  isImageMime,
  json,
  mimeFromBuffer,
  mimeFromFileName,
  normalizeImageMime,
  now,
  parseJsonBody,
  randomId,
  readBody,
  sha256,
  text
};
