const { isImageMime } = require('./utils');

const TG_PAGE_SIZE = 6;

function isAllowedTelegramUser(config, userId) {
  if (!config.telegramAllowedUserIds.length) return true;
  return config.telegramAllowedUserIds.includes(String(userId));
}

function telegramApi(config, method, payload) {
  if (!config.telegramBotToken) return Promise.resolve(null);
  return fetch(`https://api.telegram.org/bot${config.telegramBotToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  }).then((res) => res.json().catch(() => ({})));
}

async function handleTelegramUpdate({ update, config, db, storage }) {
  if (update.callback_query) {
    return handleCallbackQuery({ callback: update.callback_query, config, db, storage });
  }

  const message = update.message || update.edited_message;
  if (!message) return { ok: true };

  const chatId = message.chat && message.chat.id;
  const userId = message.from && message.from.id;
  if (!chatId || !userId) return { ok: true };

  if (!isAllowedTelegramUser(config, userId)) {
    await sendText(config, chatId, '你没有权限管理这个图床。');
    return { ok: true };
  }

  const inputText = (message.text || message.caption || '').trim();
  const command = parseCommand(inputText);

  if (command.name === 'start' || command.name === 'help') {
    await sendText(config, chatId, [
      'Telepic Bot 命令：',
      '/panel 打开按钮控制台',
      '/stats 查看统计',
      '/list [数量] 查看最新图片',
      '/search 关键词 搜索图片',
      '/view 图片ID 查看详情',
      '/rename 图片ID 新名称',
      '/public 图片ID',
      '/private 图片ID',
      '/tags 图片ID 标签1,标签2',
      '/delete 图片ID',
      '/events [数量] 查看最近操作',
      '/token list',
      '/token create 名称 [upload|manage|all]',
      '/token delete TokenID',
      '/fetch 图片URL',
      '/link 图片ID [page|raw|markdown|html|bbcode]',
      '直接发送图片或图片文件也会自动上传。'
    ].join('\n'));
    return { ok: true };
  }

  if (command.name === 'panel') {
    await sendListPanel({ config, db, chatId, offset: 0, note: 'Telepic 控制台' });
    return { ok: true };
  }

  if (command.name === 'stats') {
    const stats = db.stats();
    await sendText(config, chatId, [
      `图片总数：${stats.images}`,
      `公开：${stats.publicImages}`,
      `私有：${stats.privateImages}`,
      `存储占用：${formatBytes(stats.totalBytes)}`,
      `API 密钥：${stats.tokens}`,
      `来源分布：${formatSourceBreakdown(stats.sourceBreakdown)}`
    ].join('\n'));
    return { ok: true };
  }

  if (command.name === 'list') {
    const limit = clamp(Number(command.args[0] || TG_PAGE_SIZE), 1, 20);
    if (limit === TG_PAGE_SIZE) {
      await sendListPanel({ config, db, chatId, offset: 0, note: '最新图片' });
    } else {
      const images = db.listImages({ includePrivate: true, limit, sort: 'newest' });
      await sendText(config, chatId, renderImageList(images, '最新图片'));
    }
    return { ok: true };
  }

  if (command.name === 'search') {
    const keyword = command.rest;
    if (!keyword) {
      await sendText(config, chatId, '用法：/search 关键词');
      return { ok: true };
    }
    const images = db.listImages({ includePrivate: true, limit: 10, q: keyword, sort: 'newest' });
    await sendSearchPanel({ config, chatId, images, keyword });
    return { ok: true };
  }

  if (command.name === 'view') {
    const id = command.args[0];
    if (!id) {
      await sendText(config, chatId, '用法：/view 图片ID');
      return { ok: true };
    }
    const image = db.getImage(id);
    if (!image) {
      await sendText(config, chatId, `未找到图片：${id}`);
      return { ok: true };
    }
    await sendImageDetailPanel({ config, chatId, image, backOffset: 0 });
    return { ok: true };
  }

  if (command.name === 'rename') {
    const id = command.args[0];
    const newName = command.args.slice(1).join(' ').trim();
    if (!id || !newName) {
      await sendText(config, chatId, '用法：/rename 图片ID 新名称');
      return { ok: true };
    }
    const image = db.updateImage(id, { originalName: newName.slice(0, 200) });
    await sendText(config, chatId, image ? `已重命名：${renderShortImage(image)}` : `未找到图片：${id}`);
    return { ok: true };
  }

  if (command.name === 'public' || command.name === 'private') {
    const id = command.args[0];
    if (!id) {
      await sendText(config, chatId, `用法：/${command.name} 图片ID`);
      return { ok: true };
    }
    const image = db.updateImage(id, { visibility: command.name });
    await sendText(config, chatId, image ? `已更新可见性：${renderShortImage(image)}` : `未找到图片：${id}`);
    return { ok: true };
  }

  if (command.name === 'tags') {
    const id = command.args[0];
    const tags = normalizeTags(command.args.slice(1).join(' '));
    if (!id) {
      await sendText(config, chatId, '用法：/tags 图片ID 标签1,标签2');
      return { ok: true };
    }
    const image = db.updateImage(id, { tags });
    await sendText(config, chatId, image ? `标签已更新：${renderShortImage(image)}` : `未找到图片：${id}`);
    return { ok: true };
  }

  if (command.name === 'delete') {
    const id = command.args[0];
    if (!id) {
      await sendText(config, chatId, '用法：/delete 图片ID');
      return { ok: true };
    }
    const image = db.deleteImage(id);
    if (image) await storage.delete(image);
    await sendText(config, chatId, image ? `已删除：${id}` : `未找到图片：${id}`);
    return { ok: true };
  }

  if (command.name === 'events') {
    const limit = clamp(Number(command.args[0] || 10), 1, 20);
    const events = db.listEvents({ limit });
    await sendText(config, chatId, renderEvents(events));
    return { ok: true };
  }

  if (command.name === 'token') {
    await handleTokenCommand({ command, chatId, config, db });
    return { ok: true };
  }

  if (command.name === 'fetch') {
    const rawUrl = command.rest;
    if (!rawUrl) {
      await sendText(config, chatId, '用法：/fetch 图片URL');
      return { ok: true };
    }
    try {
      const remote = await downloadRemoteImage(rawUrl, config.maxUploadBytes);
      const image = await saveImageRecord({
        config,
        db,
        storage,
        buffer: remote.buffer,
        mime: remote.mime,
        originalName: remote.originalName,
        source: 'url',
        owner: String(userId)
      });
      await sendImageDetailPanel({ config, chatId, image, backOffset: 0, note: '抓图成功' });
    } catch (error) {
      await sendText(config, chatId, `抓图失败：${error.message}`);
    }
    return { ok: true };
  }

  if (command.name === 'link') {
    const id = command.args[0];
    const format = command.args[1] || 'page';
    if (!id) {
      await sendText(config, chatId, '用法：/link 图片ID [page|raw|markdown|html|bbcode]');
      return { ok: true };
    }
    const image = db.getImage(id);
    if (!image) {
      await sendText(config, chatId, `未找到图片：${id}`);
      return { ok: true };
    }
    await sendText(config, chatId, buildLink(publicImage(image, config), format));
    return { ok: true };
  }

  const photo = bestPhoto(message);
  const document = message.document;
  const fileId = photo ? photo.file_id : document && document.file_id;
  const mime = document && document.mime_type;
  if (fileId && (!document || isImageMime(mime))) {
    const downloaded = await downloadTelegramFile(config, fileId);
    const finalMime = document ? mime : downloaded.mime;
    if (!isImageMime(finalMime)) {
      await sendText(config, chatId, '只支持图片文件。');
      return { ok: true };
    }
    const image = await saveImageRecord({
      config,
      db,
      storage,
      buffer: downloaded.buffer,
      mime: finalMime,
      originalName: document ? document.file_name : downloaded.originalName,
      source: 'telegram',
      owner: String(userId)
    });
    await sendImageDetailPanel({ config, chatId, image, backOffset: 0, note: '上传成功' });
  }

  return { ok: true };
}

async function handleCallbackQuery({ callback, config, db, storage }) {
  const userId = callback.from && callback.from.id;
  if (!userId || !isAllowedTelegramUser(config, userId)) {
    await answerCallback(config, callback.id, '你没有权限');
    return { ok: true };
  }

  const message = callback.message;
  const chatId = message && message.chat && message.chat.id;
  const messageId = message && message.message_id;
  if (!chatId || !messageId) {
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  const [namespace, action, a = '', b = ''] = String(callback.data || '').split(':');
  if (namespace !== 'tp') {
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'list') {
    await sendListPanel({ config, db, chatId, offset: clamp(Number(a || 0), 0, 99999), editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'view') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    await sendImageDetailPanel({
      config,
      chatId,
      image,
      backOffset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId
    });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'toggle') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    const updated = db.updateImage(a, { visibility: image.visibility === 'private' ? 'public' : 'private' });
    await sendImageDetailPanel({
      config,
      chatId,
      image: updated,
      backOffset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId,
      note: '可见性已更新'
    });
    await answerCallback(config, callback.id, '已更新');
    return { ok: true };
  }

  if (action === 'delete') {
    const image = db.deleteImage(a);
    if (image) await storage.delete(image);
    await sendListPanel({
      config,
      db,
      chatId,
      offset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId,
      note: image ? `已删除 ${a}` : `未找到 ${a}`
    });
    await answerCallback(config, callback.id, image ? '已删除' : '未找到图片');
    return { ok: true };
  }

  if (action === 'tokens') {
    await sendTokenPanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'tokendel') {
    const token = db.deleteToken(a);
    await sendTokenPanel({ config, db, chatId, editMessageId: messageId, note: token ? `已删除密钥 ${a}` : `未找到密钥 ${a}` });
    await answerCallback(config, callback.id, token ? '已删除' : '未找到');
    return { ok: true };
  }

  await answerCallback(config, callback.id);
  return { ok: true };
}

async function handleTokenCommand({ command, chatId, config, db }) {
  const sub = command.args[0];
  if (!sub || sub === 'help') {
    await sendText(config, chatId, [
      '/token list',
      '/token create 名称 [upload|manage|all]',
      '/token delete TokenID'
    ].join('\n'));
    return;
  }

  if (sub === 'list') {
    await sendTokenPanel({ config, db, chatId });
    return;
  }

  if (sub === 'create') {
    const name = command.args[1];
    const scopeArg = command.args[2] || 'upload';
    if (!name) {
      await sendText(config, chatId, '用法：/token create 名称 [upload|manage|all]');
      return;
    }
    const scopes = scopeArg === 'all' ? ['upload', 'manage'] : [scopeArg].filter((item) => ['upload', 'manage'].includes(item));
    if (!scopes.length) {
      await sendText(config, chatId, '权限只支持 upload、manage 或 all。');
      return;
    }
    const created = db.createToken({ name, scopes });
    await sendText(config, chatId, [
      `已创建密钥：${created.record.name}`,
      `ID：${created.record.id}`,
      `权限：${created.record.scopes.join(', ')}`,
      `Token：${created.token}`,
      '注意：这个明文 token 只会显示这一次。'
    ].join('\n'));
    return;
  }

  if (sub === 'delete') {
    const id = command.args[1];
    if (!id) {
      await sendText(config, chatId, '用法：/token delete TokenID');
      return;
    }
    const token = db.deleteToken(id);
    await sendText(config, chatId, token ? `已删除密钥：${id}` : `未找到密钥：${id}`);
    return;
  }

  await sendText(config, chatId, '未知 token 子命令。发送 /token help 查看说明。');
}

async function sendListPanel({ config, db, chatId, offset = 0, note = '', editMessageId = null }) {
  const records = db.listImages({ includePrivate: true, limit: TG_PAGE_SIZE + 1, offset, sort: 'newest' });
  const hasNext = records.length > TG_PAGE_SIZE;
  const images = records.slice(0, TG_PAGE_SIZE);
  const text = [
    note || 'Telepic 控制台',
    '',
    images.length
      ? images.map((image, index) => `${offset + index + 1}. ${renderShortImage(image)}`).join('\n')
      : '暂无图片。'
  ].join('\n');
  const inline_keyboard = images.map((image) => [
    { text: `查看 ${truncate(image.originalName || image.id, 20)}`, callback_data: `tp:view:${image.id}:${offset}` }
  ]);
  const pager = [];
  if (offset > 0) pager.push({ text: '上一页', callback_data: `tp:list:${Math.max(0, offset - TG_PAGE_SIZE)}` });
  if (hasNext) pager.push({ text: '下一页', callback_data: `tp:list:${offset + TG_PAGE_SIZE}` });
  if (pager.length) inline_keyboard.push(pager);
  inline_keyboard.push([{ text: 'API 密钥', callback_data: 'tp:tokens' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendSearchPanel({ config, chatId, images, keyword }) {
  if (!images.length) {
    await sendText(config, chatId, `没有找到：${keyword}`);
    return;
  }
  const text = `搜索结果：${keyword}\n\n${images.map((image) => renderShortImage(image)).join('\n')}`;
  const inline_keyboard = images.slice(0, 8).map((image) => [
    { text: `查看 ${truncate(image.originalName || image.id, 20)}`, callback_data: `tp:view:${image.id}:0` }
  ]);
  await sendOrEditMessage(config, {
    chatId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendImageDetailPanel({ config, chatId, image, backOffset = 0, editMessageId = null, note = '' }) {
  const details = publicImage(image, config);
  const text = [
    note || '图片详情',
    '',
    `ID：${details.id}`,
    `名称：${details.originalName || '-'}`,
    `类型：${details.mime}`,
    `大小：${formatBytes(details.size)}`,
    `来源：${details.source}`,
    `可见性：${details.visibility === 'private' ? '私有' : '公开'}`,
    `标签：${details.tags.length ? details.tags.join(', ') : '无'}`,
    `创建时间：${details.createdAt}`
  ].join('\n');
  const inline_keyboard = [
    [
      { text: '页面链接', url: details.url },
      { text: '图片直链', url: details.rawUrl }
    ],
    [
      { text: details.visibility === 'private' ? '设为公开' : '设为私有', callback_data: `tp:toggle:${details.id}:${backOffset}` },
      { text: '删除图片', callback_data: `tp:delete:${details.id}:${backOffset}` }
    ],
    [
      { text: '返回列表', callback_data: `tp:list:${backOffset}` }
    ]
  ];
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendTokenPanel({ config, db, chatId, editMessageId = null, note = '' }) {
  const tokens = db.listTokens();
  const text = [
    note || 'API 密钥',
    '',
    tokens.length
      ? tokens.map((token) => `${token.id} · ${token.name}\n权限：${token.scopes.join(', ')}\n最近使用：${token.lastUsedAt || '暂无'}`).join('\n\n')
      : '还没有 API 密钥。'
  ].join('\n');
  const inline_keyboard = tokens.slice(0, 10).map((token) => [
    { text: `删除 ${truncate(token.name, 18)}`, callback_data: `tp:tokendel:${token.id}` }
  ]);
  inline_keyboard.push([{ text: '返回图片列表', callback_data: 'tp:list:0' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendOrEditMessage(config, { chatId, messageId = null, text, reply_markup }) {
  if (messageId) {
    return telegramApi(config, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup
    });
  }
  return telegramApi(config, 'sendMessage', {
    chat_id: chatId,
    text,
    reply_markup
  });
}

function answerCallback(config, callbackId, text = '') {
  return telegramApi(config, 'answerCallbackQuery', {
    callback_query_id: callbackId,
    text: text || undefined,
    show_alert: false
  });
}

async function downloadTelegramFile(config, fileId) {
  const fileResponse = await telegramApi(config, 'getFile', { file_id: fileId });
  if (!fileResponse || !fileResponse.ok) throw new Error('Telegram getFile failed');
  const url = `https://api.telegram.org/file/bot${config.telegramBotToken}/${fileResponse.result.file_path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Telegram file download failed: ${response.status}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mime: response.headers.get('content-type') || 'application/octet-stream',
    originalName: fileResponse.result.file_path.split('/').pop()
  };
}

function bestPhoto(message) {
  if (!Array.isArray(message.photo) || !message.photo.length) return null;
  return message.photo[message.photo.length - 1];
}

async function saveImageRecord({ config, db, storage, buffer, mime, originalName, source, owner }) {
  const image = await storage.saveImage({ buffer, mime, originalName, source, owner });
  image.url = `${config.publicUrl}/i/${image.id}`;
  image.rawUrl = `${config.publicUrl}/raw/${image.id}`;
  db.addImage(image);
  return image;
}

async function downloadRemoteImage(rawUrl, maxBytes) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL 无效');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('只支持 http 或 https 地址');
  }
  const response = await fetch(parsed, {
    redirect: 'follow',
    headers: { 'user-agent': 'Telepic/0.1' }
  });
  if (!response.ok) throw new Error(`远程下载失败：${response.status}`);
  const mime = (response.headers.get('content-type') || '').split(';')[0].trim();
  if (!isImageMime(mime)) throw new Error(`不是受支持的图片类型：${mime || 'unknown'}`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength && contentLength > maxBytes) throw new Error('图片过大');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error('图片过大');
  return {
    buffer,
    mime,
    originalName: decodeURIComponent(parsed.pathname.split('/').pop() || 'remote-image')
  };
}

function parseCommand(input) {
  if (!input.startsWith('/')) {
    return { name: '', args: [], rest: '' };
  }
  const trimmed = input.replace(/\s+/g, ' ').trim();
  const [rawName, ...args] = trimmed.slice(1).split(' ');
  return {
    name: rawName.split('@')[0].toLowerCase(),
    args,
    rest: args.join(' ').trim()
  };
}

function normalizeTags(raw) {
  return [...new Set(String(raw || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20))];
}

function renderImageList(images, title) {
  if (!images.length) return `${title}\n暂无结果。`;
  return [title, ...images.map((image) => `${renderShortImage(image)}\n${publicImage(image).url}`)].join('\n\n');
}

function renderShortImage(image) {
  return `${image.id} · ${truncate(image.originalName || image.fileName, 18)} · ${image.visibility === 'private' ? '私有' : '公开'} · ${formatBytes(image.size)}`;
}

function renderEvents(events) {
  if (!events.length) return '暂无最近操作。';
  return events.map((event) => `${event.type}\n${event.createdAt}\n${renderEventDetails(event.details)}`).join('\n\n');
}

function renderEventDetails(details) {
  return Object.entries(details || {})
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join('\n');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GiB`;
}

function formatSourceBreakdown(breakdown = {}) {
  const entries = Object.entries(breakdown);
  return entries.length ? entries.map(([key, value]) => `${key}:${value}`).join(' / ') : '暂无';
}

function sendText(config, chatId, text) {
  return telegramApi(config, 'sendMessage', {
    chat_id: chatId,
    text
  });
}

function buildLink(image, format) {
  if (format === 'raw') return image.rawUrl;
  if (format === 'markdown') return `![${image.originalName || image.id}](${image.rawUrl})`;
  if (format === 'html') return `<img src="${image.rawUrl}" alt="${image.originalName || image.id}">`;
  if (format === 'bbcode') return `[img]${image.rawUrl}[/img]`;
  return image.url;
}

function publicImage(image, config = { publicUrl: '' }) {
  const url = image.url || `${config.publicUrl}/i/${image.id}`;
  const rawUrl = image.rawUrl || `${config.publicUrl}/raw/${image.id}`;
  const shouldAttachAccess = image.visibility === 'private' && config.adminToken;
  return {
    ...image,
    tags: image.tags || [],
    url: shouldAttachAccess ? withAccessToken(url, config.adminToken) : url,
    rawUrl: shouldAttachAccess ? withAccessToken(rawUrl, config.adminToken) : rawUrl
  };
}

function withAccessToken(url, token) {
  const separator = String(url).includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function truncate(value, max) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

module.exports = { handleTelegramUpdate, telegramApi };
