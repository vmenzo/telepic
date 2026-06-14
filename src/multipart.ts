import { readBody } from './utils';

function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buffer.indexOf(delimiter);

  while (cursor !== -1) {
    cursor += delimiter.length;
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break;
    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) cursor += 2;

    const next = buffer.indexOf(delimiter, cursor);
    if (next === -1) break;
    let part = buffer.slice(cursor, next);
    if (part.slice(-2).toString('binary') === '\r\n') part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd !== -1) {
      const rawHeaders = part.slice(0, headerEnd).toString('utf8');
      const body = part.slice(headerEnd + 4);
      const headers = parseHeaders(rawHeaders);
      const disposition = parseDisposition(headers['content-disposition'] || '');
      parts.push({
        name: disposition.name,
        filename: disposition.filename,
        mime: headers['content-type'] || 'application/octet-stream',
        data: body,
        text: body.toString('utf8')
      });
    }
    cursor = next;
  }

  return parts;
}

function parseHeaders(raw) {
  const headers: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
  }
  return headers;
}

function parseDisposition(value) {
  const result: Record<string, string> = {};
  for (const segment of value.split(';')) {
    const [key, rawValue] = segment.trim().split('=');
    if (!rawValue) continue;
    result[key] = rawValue.replace(/^"|"$/g, '');
  }
  return result;
}

async function parseMultipartRequest(req, maxBytes) {
  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) {
    const error = new Error('Missing multipart boundary');
    error.statusCode = 400;
    throw error;
  }
  const body = await readBody(req, maxBytes);
  return parseMultipart(body, match[1] || match[2]);
}

export { parseMultipartRequest };
