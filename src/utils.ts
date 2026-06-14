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

function imageDimensions(buffer, mime = '') {
  const kind = cleanMime(mime) || detectImageMime(buffer);
  if (!Buffer.isBuffer(buffer) || buffer.length < 10) return { width: 0, height: 0 };
  if (kind === 'image/png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (kind === 'image/gif' && buffer.length >= 10) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (kind === 'image/jpeg') return jpegDimensions(buffer);
  if (kind === 'image/webp') return webpDimensions(buffer);
  if (kind === 'image/avif' || kind.startsWith('image/heif') || kind.startsWith('image/heic')) return isoBmffDimensions(buffer);
  return { width: 0, height: 0 };
}

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return { width: 0, height: 0 };
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.slice(0, 4).toString('ascii') !== 'RIFF' || buffer.slice(8, 12).toString('ascii') !== 'WEBP') {
    return { width: 0, height: 0 };
  }
  const type = buffer.slice(12, 16).toString('ascii');
  if (type === 'VP8 ' && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (type === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (type === 'VP8X' && buffer.length >= 30) {
    return { width: readUInt24LE(buffer, 24) + 1, height: readUInt24LE(buffer, 27) + 1 };
  }
  return { width: 0, height: 0 };
}

function isoBmffDimensions(buffer) {
  const box = findBox(buffer, ['meta', 'iprp', 'ipco', 'ispe']);
  if (!box || box.start + 12 > box.end) return { width: 0, height: 0 };
  return { width: buffer.readUInt32BE(box.start + 4), height: buffer.readUInt32BE(box.start + 8) };
}

function findBox(buffer, path, start = 0, end = buffer.length) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    let headerSize = 8;
    if (size === 1 && offset + 16 <= end) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
      headerSize = 16;
    }
    if (!size || offset + size > end || size < headerSize) break;
    const contentStart = offset + headerSize + (type === 'meta' ? 4 : 0);
    const contentEnd = offset + size;
    if (type === path[0]) {
      if (path.length === 1) return { start: contentStart, end: contentEnd };
      return findBox(buffer, path.slice(1), contentStart, contentEnd);
    }
    offset += size;
  }
  return null;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
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
  imageDimensions,
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
