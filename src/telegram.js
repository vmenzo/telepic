const { isImageMime, randomId } = require('./utils');
const { ensureAlbums, ensureRecycleBin, findAlbum, moveImageToRecycleBin, permanentlyDeleteTrashItem, readSettings, restoreTrashItem, writeSettings } = require('./settings');

const TG_PAGE_SIZE = 6;
const TG_PENDING_TTL_MS = 10 * 60 * 1000;
const telegramPendingActions = new Map();

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

function pendingActionKey(chatId, userId) {
  return `${chatId}:${userId}`;
}

function setPendingAction(chatId, userId, action) {
  telegramPendingActions.set(pendingActionKey(chatId, userId), {
    ...action,
    expiresAt: Date.now() + TG_PENDING_TTL_MS
  });
}

function getPendingAction(chatId, userId) {
  const key = pendingActionKey(chatId, userId);
  const pending = telegramPendingActions.get(key);
  if (!pending) return null;
  if (pending.expiresAt <= Date.now()) {
    telegramPendingActions.delete(key);
    return null;
  }
  return pending;
}

function clearPendingAction(chatId, userId) {
  telegramPendingActions.delete(pendingActionKey(chatId, userId));
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

  const inputText = (message.text || message.caption || '').trim();
  const command = parseCommand(inputText);

  if (!isAllowedTelegramUser(config, userId)) {
    if (['start', 'help', 'register', 'id'].includes(command.name)) {
      await sendRegistrationGuide(config, chatId, userId, message.chat && message.chat.type);
    } else {
      await sendText(config, chatId, '你还没有权限使用这个图床。\n发送 /register 获取当前账号与聊天 ID，便于加入白名单。');
    }
    return { ok: true };
  }

  if (command.name === 'register' || command.name === 'id') {
    await sendRegistrationGuide(config, chatId, userId, message.chat && message.chat.type, true);
    return { ok: true };
  }

  if (inputText === '取消') {
    clearPendingAction(chatId, userId);
    await sendHomePanel({ config, db, chatId, note: '已取消当前输入。' });
    return { ok: true };
  }

  if (!command.name && inputText) {
    const pending = getPendingAction(chatId, userId);
    if (pending) {
      const handled = await handlePendingText({ pending, inputText, chatId, userId, config, db, storage });
      if (handled) return { ok: true };
    }
  }

  if (command.name === 'start' || command.name === 'help') {
    clearPendingAction(chatId, userId);
    await sendHomePanel({
      config,
      db,
      chatId,
      note: [
        'Telepic Bot 已就绪。',
        '日常操作都可以直接点按钮完成，命令只保留快捷入口：',
        '/panel 打开控制台',
        '/stats 查看统计',
        '/system 查看运行状态',
        '/storage 查看存储状态',
        '/register 查看当前账号与聊天 ID',
        '直接发送图片或图片文件也会自动上传。'
      ].join('\n')
    });
    return { ok: true };
  }

  if (command.name === 'panel') {
    clearPendingAction(chatId, userId);
    await sendHomePanel({ config, db, chatId, note: 'Telepic 控制台' });
    return { ok: true };
  }

  if (command.name === 'stats') {
    await sendStatsPanel({ config, db, chatId });
    return { ok: true };
  }

  if (command.name === 'system') {
    await sendSystemPanel({ config, chatId, db });
    return { ok: true };
  }

  if (command.name === 'storage') {
    await sendStoragePanel({ config, chatId });
    return { ok: true };
  }

  if (command.name) {
    clearPendingAction(chatId, userId);
    await sendHomePanel({
      config,
      db,
      chatId,
      note: [
        `已收到命令：/${command.name}`,
        'TG 控制台的管理操作已统一改为按钮交互。',
        '请直接点击下面的按钮完成图片、相册、密钥、回收站和链接管理。'
      ].join('\n')
    });
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

  const [namespace, action, ...args] = String(callback.data || '').split(':');
  const [a = '', b = '', c = ''] = args;
  if (namespace !== 'tp') {
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'home') {
    clearPendingAction(chatId, userId);
    await sendHomePanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'stats') {
    await sendStatsPanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'events') {
    await sendEventsPanel({ config, db, chatId, editMessageId: messageId, events: db.listEvents({ limit: 10 }) });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'system') {
    await sendSystemPanel({ config, chatId, db, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'storage') {
    await sendStoragePanel({ config, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'searchstart') {
    setPendingAction(chatId, userId, { type: 'search' });
    await answerCallback(config, callback.id, '请发送关键词');
    await sendText(config, chatId, '请输入要搜索的关键词。\n发送“取消”可退出本次输入。');
    return { ok: true };
  }

  if (action === 'fetchstart') {
    setPendingAction(chatId, userId, { type: 'fetch' });
    await answerCallback(config, callback.id, '请发送图片链接');
    await sendText(config, chatId, '请输入要抓取的图片链接。\n发送“取消”可退出本次输入。');
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

  if (action === 'links') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    await sendLinkPanel({
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

  if (action === 'rename') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    setPendingAction(chatId, userId, {
      type: 'rename_image',
      imageId: a,
      backOffset: clamp(Number(b || 0), 0, 99999)
    });
    await answerCallback(config, callback.id, '请发送新名称');
    await sendText(config, chatId, `请发送图片“${truncate(image.originalName || image.id, 24)}”的新名称。\n发送“取消”可退出本次输入。`);
    return { ok: true };
  }

  if (action === 'tags') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    setPendingAction(chatId, userId, {
      type: 'edit_tags',
      imageId: a,
      backOffset: clamp(Number(b || 0), 0, 99999)
    });
    await answerCallback(config, callback.id, '请发送标签');
    await sendText(config, chatId, '请输入标签，多个标签用英文逗号分隔。\n发送“取消”可退出本次输入。');
    return { ok: true };
  }

  if (action === 'deleteask') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    await sendDeleteConfirmPanel({
      config,
      chatId,
      image,
      backOffset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId
    });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'delete') {
    const image = db.deleteImage(a);
    if (image) {
      moveImageToRecycleBin(config, image, String(userId));
      db.addEvent('image.trashed', { actor: String(userId), id: image.id, via: 'telegram' });
    }
    await sendListPanel({
      config,
      db,
      chatId,
      offset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId,
      note: image ? `已移入回收站 ${a}` : `未找到 ${a}`
    });
    await answerCallback(config, callback.id, image ? '已移入回收站' : '未找到图片');
    return { ok: true };
  }

  if (action === 'tokens') {
    await sendTokenPanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'tokencreate') {
    await sendTokenScopePanel({ config, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'tokenscope') {
    const scopes = parseScopes(a);
    if (!scopes.length) {
      await answerCallback(config, callback.id, '权限类型无效');
      return { ok: true };
    }
    setPendingAction(chatId, userId, { type: 'create_token', scopes });
    await answerCallback(config, callback.id, '请发送密钥名称');
    await sendText(config, chatId, `当前权限：${scopes.join(', ')}\n请发送新密钥名称。\n发送“取消”可退出本次输入。`);
    return { ok: true };
  }

  if (action === 'tokendel') {
    const token = db.deleteToken(a);
    await sendTokenPanel({ config, db, chatId, editMessageId: messageId, note: token ? `已删除密钥 ${a}` : `未找到密钥 ${a}` });
    await answerCallback(config, callback.id, token ? '已删除' : '未找到');
    return { ok: true };
  }

  if (action === 'albums') {
    await sendAlbumPanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'createalbum') {
    setPendingAction(chatId, userId, { type: 'create_album' });
    await answerCallback(config, callback.id, '请发送相册信息');
    await sendText(config, chatId, '请输入相册名称。\n也可以使用“名称 | 描述”一次写完。\n发送“取消”可退出本次输入。');
    return { ok: true };
  }

  if (action === 'albumview') {
    await sendAlbumImagesPanel({ config, db, chatId, albumId: a, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'albumrename') {
    const settings = readSettings(config);
    const album = findAlbum(settings, a);
    if (!album) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    setPendingAction(chatId, userId, { type: 'rename_album', albumId: a });
    await answerCallback(config, callback.id, '请发送新相册名');
    await sendText(config, chatId, `请发送相册“${truncate(album.name, 24)}”的新名称。\n发送“取消”可退出本次输入。`);
    return { ok: true };
  }

  if (action === 'albumdescribe') {
    const settings = readSettings(config);
    const album = findAlbum(settings, a);
    if (!album) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    setPendingAction(chatId, userId, { type: 'describe_album', albumId: a });
    await answerCallback(config, callback.id, '请发送新描述');
    await sendText(config, chatId, '请输入新的相册描述。\n发送“取消”可退出本次输入。');
    return { ok: true };
  }

  if (action === 'albumdeleteask') {
    const settings = readSettings(config);
    const album = findAlbum(settings, a);
    if (!album) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    await sendAlbumDeleteConfirmPanel({ config, chatId, album, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'albumdelete') {
    const settings = readSettings(config);
    const before = ensureAlbums(settings).length;
    settings.albums = ensureAlbums(settings).filter((album) => String(album.id) !== String(a));
    if (settings.albums.length === before) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    settings.updatedAt = new Date().toISOString();
    writeSettings(config, settings);
    db.addEvent('album.deleted', { actor: String(userId), albumId: a, via: 'telegram' });
    await sendAlbumPanel({ config, db, chatId, editMessageId: messageId, note: `已删除相册 ${a}` });
    await answerCallback(config, callback.id, '已删除');
    return { ok: true };
  }

  if (action === 'albumcover') {
    const settings = readSettings(config);
    const album = findAlbum(settings, a);
    if (!album) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    album.coverImageId = b;
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    db.addEvent('album.updated', { actor: String(userId), albumId: a, coverImageId: b, via: 'telegram' });
    await sendAlbumImagesPanel({ config, db, chatId, albumId: a, editMessageId: messageId, note: `已更新封面为 ${b}` });
    await answerCallback(config, callback.id, '已设为封面');
    return { ok: true };
  }

  if (action === 'albumaddstart') {
    const image = db.getImage(a);
    if (!image) {
      await answerCallback(config, callback.id, '图片不存在');
      return { ok: true };
    }
    await sendAlbumPickerPanel({
      config,
      db,
      chatId,
      image,
      backOffset: clamp(Number(b || 0), 0, 99999),
      editMessageId: messageId
    });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'albumadd') {
    const albumId = a;
    const imageId = b;
    const backOffset = clamp(Number(c || 0), 0, 99999);
    const settings = readSettings(config);
    const album = findAlbum(settings, albumId);
    const image = db.getImage(imageId);
    if (!album || !image) {
      await answerCallback(config, callback.id, '图片或相册不存在');
      return { ok: true };
    }
    album.imageIds = [...new Set([...(album.imageIds || []), imageId])];
    if (!album.coverImageId) album.coverImageId = imageId;
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    db.addEvent('album.images_added', { actor: String(userId), albumId, count: 1, imageId, via: 'telegram' });
    await sendImageDetailPanel({
      config,
      chatId,
      image,
      backOffset,
      editMessageId: messageId,
      note: `已加入相册：${album.name}`
    });
    await answerCallback(config, callback.id, '已加入相册');
    return { ok: true };
  }

  if (action === 'albumremove') {
    const settings = readSettings(config);
    const album = findAlbum(settings, a);
    if (!album) {
      await answerCallback(config, callback.id, '相册不存在');
      return { ok: true };
    }
    album.imageIds = (album.imageIds || []).filter((id) => String(id) !== String(b));
    if (String(album.coverImageId || '') === String(b)) album.coverImageId = album.imageIds[0] || '';
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    db.addEvent('album.image_removed', { actor: String(userId), albumId: a, imageId: b, via: 'telegram' });
    await sendAlbumImagesPanel({ config, db, chatId, albumId: a, editMessageId: messageId, note: `已移出图片 ${b}` });
    await answerCallback(config, callback.id, '已移出');
    return { ok: true };
  }

  if (action === 'trash') {
    await sendTrashPanel({ config, db, chatId, editMessageId: messageId });
    await answerCallback(config, callback.id);
    return { ok: true };
  }

  if (action === 'restore') {
    const item = restoreTrashItem(config, db, a, String(userId));
    if (item) db.addEvent('image.restored', { actor: String(userId), id: item.id, via: 'telegram' });
    await sendTrashPanel({ config, db, chatId, editMessageId: messageId, note: item ? `已恢复 ${a}` : `未找到 ${a}` });
    await answerCallback(config, callback.id, item ? '已恢复' : '未找到');
    return { ok: true };
  }

  if (action === 'purge') {
    const item = await permanentlyDeleteTrashItem(config, storage, a);
    if (item) db.addEvent('image.purged', { actor: String(userId), id: item.id, via: 'telegram' });
    await sendTrashPanel({ config, db, chatId, editMessageId: messageId, note: item ? `已彻底删除 ${a}` : `未找到 ${a}` });
    await answerCallback(config, callback.id, item ? '已彻底删除' : '未找到');
    return { ok: true };
  }

  await answerCallback(config, callback.id);
  return { ok: true };
}

async function sendListPanel({ config, db, chatId, offset = 0, note = '', editMessageId = null }) {
  const records = db.listImages({ includePrivate: true, limit: TG_PAGE_SIZE + 1, offset, sort: 'newest' });
  const hasNext = records.length > TG_PAGE_SIZE;
  const images = records.slice(0, TG_PAGE_SIZE);
  const text = [
    note || '最新图片',
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
  inline_keyboard.push([{ text: '搜索图片', callback_data: 'tp:searchstart' }, { text: '链接抓图', callback_data: 'tp:fetchstart' }]);
  inline_keyboard.push([{ text: '相册管理', callback_data: 'tp:albums' }, { text: 'API 密钥', callback_data: 'tp:tokens' }]);
  inline_keyboard.push([{ text: '回到首页', callback_data: 'tp:home' }]);
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
  inline_keyboard.push([{ text: '重新搜索', callback_data: 'tp:searchstart' }, { text: '回到首页', callback_data: 'tp:home' }]);
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
      { text: '改名', callback_data: `tp:rename:${details.id}:${backOffset}` },
      { text: '标签', callback_data: `tp:tags:${details.id}:${backOffset}` }
    ],
    [
      { text: '加入相册', callback_data: `tp:albumaddstart:${details.id}:${backOffset}` },
      { text: '更多链接', callback_data: `tp:links:${details.id}:${backOffset}` }
    ],
    [
      { text: details.visibility === 'private' ? '设为公开' : '设为私有', callback_data: `tp:toggle:${details.id}:${backOffset}` },
      { text: '删除图片', callback_data: `tp:deleteask:${details.id}:${backOffset}` }
    ],
    [
      { text: '返回列表', callback_data: `tp:list:${backOffset}` },
      { text: '回到首页', callback_data: 'tp:home' }
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
  inline_keyboard.push([{ text: '新建密钥', callback_data: 'tp:tokencreate' }]);
  inline_keyboard.push([{ text: '回到首页', callback_data: 'tp:home' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendAlbumPanel({ config, db, chatId, editMessageId = null, note = '' }) {
  const settings = readSettings(config);
  const albums = ensureAlbums(settings);
  const text = [
    note || '相册列表',
    '',
    albums.length
      ? albums.map((album) => `${album.id} · ${album.name}\n图片数：${(album.imageIds || []).length}\n封面：${album.coverImageId || '未设置'}\n描述：${album.description || '无'}`).join('\n\n')
      : '还没有相册。'
  ].join('\n');
  const inline_keyboard = albums.slice(0, 12).map((album) => [
    { text: `查看 ${truncate(album.name, 18)}`, callback_data: `tp:albumview:${album.id}` }
  ]);
  inline_keyboard.push([{ text: '创建相册', callback_data: 'tp:createalbum' }]);
  inline_keyboard.push([{ text: '回到首页', callback_data: 'tp:home' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendAlbumImagesPanel({ config, db, chatId, albumId, editMessageId = null, note = '' }) {
  const settings = readSettings(config);
  const album = findAlbum(settings, albumId);
  if (!album) {
    await sendText(config, chatId, `未找到相册：${albumId}`);
    return;
  }
  const images = (album.imageIds || []).map((id) => db.getImage(id)).filter(Boolean).slice(0, 10);
  const text = [
    note || `相册：${album.name}`,
    '',
    `ID：${album.id}`,
    `描述：${album.description || '无'}`,
    `封面：${album.coverImageId || '未设置'}`,
    '',
    images.length ? images.map((image) => renderShortImage(image)).join('\n') : '相册里还没有图片。'
  ].join('\n');
  const inline_keyboard = [];
  for (const image of images.slice(0, 6)) {
    inline_keyboard.push([{ text: `查看 ${truncate(image.originalName || image.id, 18)}`, callback_data: `tp:view:${image.id}:0` }]);
    inline_keyboard.push([
      { text: '设为封面', callback_data: `tp:albumcover:${album.id}:${image.id}` },
      { text: '移出相册', callback_data: `tp:albumremove:${album.id}:${image.id}` }
    ]);
  }
  inline_keyboard.push([{ text: '重命名', callback_data: `tp:albumrename:${album.id}` }, { text: '改描述', callback_data: `tp:albumdescribe:${album.id}` }]);
  inline_keyboard.push([{ text: '删除相册', callback_data: `tp:albumdeleteask:${album.id}` }]);
  inline_keyboard.push([{ text: '返回相册列表', callback_data: 'tp:albums' }, { text: '回到首页', callback_data: 'tp:home' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendTrashPanel({ config, db, chatId, editMessageId = null, note = '' }) {
  const settings = readSettings(config);
  const items = ensureRecycleBin(settings).slice(0, 10);
  const text = [
    note || '回收站',
    '',
    items.length
      ? items.map((item) => `${item.id} · ${truncate(item.originalName || item.fileName, 18)}\n删除时间：${item.deletedAt}`).join('\n\n')
      : '回收站为空。'
  ].join('\n');
  const inline_keyboard = items.map((item) => [
    { text: `恢复 ${truncate(item.originalName || item.id, 12)}`, callback_data: `tp:restore:${item.id}` },
    { text: '彻底删除', callback_data: `tp:purge:${item.id}` }
  ]);
  inline_keyboard.push([{ text: '回到首页', callback_data: 'tp:home' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendHomePanel({ config, db, chatId, editMessageId = null, note = '' }) {
  const settings = readSettings(config);
  const stats = db.stats();
  const text = [
    'Telepic 控制台',
    note ? `\n${note}\n` : '',
    '直接发送图片或图片文件即可上传。',
    `图片总数：${stats.images}`,
    `公开 / 私有：${stats.publicImages} / ${stats.privateImages}`,
    `存储占用：${formatBytes(stats.totalBytes)}`,
    `相册：${ensureAlbums(settings).length}`,
    `回收站：${ensureRecycleBin(settings).length}`,
    `API 密钥：${stats.tokens}`,
    `存储驱动：${config.storageDriver}`,
    `来源分布：${formatSourceBreakdown(stats.sourceBreakdown)}`
  ].join('\n');
  const inline_keyboard = [
    [{ text: '最新图片', callback_data: 'tp:list:0' }, { text: '搜索图片', callback_data: 'tp:searchstart' }],
    [{ text: '链接抓图', callback_data: 'tp:fetchstart' }, { text: '相册管理', callback_data: 'tp:albums' }],
    [{ text: 'API 密钥', callback_data: 'tp:tokens' }, { text: '回收站', callback_data: 'tp:trash' }],
    [{ text: '统计概览', callback_data: 'tp:stats' }, { text: '运行日志', callback_data: 'tp:events' }],
    [{ text: '系统状态', callback_data: 'tp:system' }, { text: '存储状态', callback_data: 'tp:storage' }],
    [{ text: '刷新首页', callback_data: 'tp:home' }]
  ];
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendStatsPanel({ config, db, chatId, editMessageId = null }) {
  const stats = db.stats();
  const text = [
    '统计概览',
    '',
    `图片总数：${stats.images}`,
    `公开：${stats.publicImages}`,
    `私有：${stats.privateImages}`,
    `存储占用：${formatBytes(stats.totalBytes)}`,
    `API 密钥：${stats.tokens}`,
    `来源分布：${formatSourceBreakdown(stats.sourceBreakdown)}`
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '最新图片', callback_data: 'tp:list:0' }, { text: '回到首页', callback_data: 'tp:home' }]] }
  });
}

async function sendEventsPanel({ config, db, chatId, events, editMessageId = null }) {
  const text = ['最近操作', '', renderEvents(events)].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '刷新日志', callback_data: 'tp:events' }, { text: '回到首页', callback_data: 'tp:home' }]] }
  });
}

async function sendSystemPanel({ config, chatId, db, editMessageId = null }) {
  const settings = readSettings(config);
  const memory = process.memoryUsage();
  const text = [
    '系统状态',
    `PID：${process.pid}`,
    `Node：${process.version}`,
    `平台：${process.platform}/${process.arch}`,
    `图片数：${db.stats().images}`,
    `相册数：${ensureAlbums(settings).length}`,
    `回收站：${ensureRecycleBin(settings).length}`,
    `RSS：${formatBytes(memory.rss)}`,
    `Heap：${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)}`
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '统计概览', callback_data: 'tp:stats' }, { text: '回到首页', callback_data: 'tp:home' }]] }
  });
}

async function sendStoragePanel({ config, chatId, editMessageId = null }) {
  const settings = readSettings(config);
  const text = [
    '存储状态',
    `驱动：${config.storageDriver}`,
    `Bucket：${config.s3Bucket || '本地模式'}`,
    `Endpoint：${config.s3Endpoint || '本地模式'}`,
    `前缀：${config.s3Prefix || '未设置'}`,
    `旧配置可迁移：${settings.previousStorageConfig && settings.previousStorageConfig.storageDriver ? '是' : '否'}`
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '系统状态', callback_data: 'tp:system' }, { text: '回到首页', callback_data: 'tp:home' }]] }
  });
}

async function sendLinkPanel({ config, chatId, image, backOffset = 0, editMessageId = null }) {
  const details = publicImage(image, config);
  const text = [
    '链接格式',
    '',
    `页面：${buildLink(details, 'page')}`,
    '',
    `直链：${buildLink(details, 'raw')}`,
    '',
    `Markdown：${buildLink(details, 'markdown')}`,
    '',
    `HTML：${buildLink(details, 'html')}`,
    '',
    `BBCode：${buildLink(details, 'bbcode')}`
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '返回图片详情', callback_data: `tp:view:${details.id}:${backOffset}` }, { text: '回到首页', callback_data: 'tp:home' }]] }
  });
}

async function sendDeleteConfirmPanel({ config, chatId, image, backOffset = 0, editMessageId = null }) {
  const text = [
    '确认删除',
    '',
    `图片：${image.originalName || image.fileName || image.id}`,
    `ID：${image.id}`,
    '删除后会先进入回收站。'
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '确认删除', callback_data: `tp:delete:${image.id}:${backOffset}` }, { text: '返回详情', callback_data: `tp:view:${image.id}:${backOffset}` }]] }
  });
}

async function sendTokenScopePanel({ config, chatId, editMessageId = null }) {
  const text = [
    '新建 API 密钥',
    '',
    '先选择权限，再发送密钥名称。'
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: {
      inline_keyboard: [
        [{ text: '仅上传', callback_data: 'tp:tokenscope:upload' }, { text: '仅管理', callback_data: 'tp:tokenscope:manage' }],
        [{ text: '全部权限', callback_data: 'tp:tokenscope:all' }],
        [{ text: '返回密钥列表', callback_data: 'tp:tokens' }]
      ]
    }
  });
}

async function sendAlbumPickerPanel({ config, db, chatId, image, backOffset = 0, editMessageId = null }) {
  const settings = readSettings(config);
  const albums = ensureAlbums(settings);
  const text = [
    `加入相册：${image.originalName || image.id}`,
    '',
    albums.length ? '请选择目标相册。' : '当前还没有相册，请先创建一个。'
  ].join('\n');
  const inline_keyboard = albums.slice(0, 12).map((album) => [
    { text: `加入 ${truncate(album.name, 18)}`, callback_data: `tp:albumadd:${album.id}:${image.id}:${backOffset}` }
  ]);
  inline_keyboard.push([{ text: '创建相册', callback_data: 'tp:createalbum' }]);
  inline_keyboard.push([{ text: '返回图片详情', callback_data: `tp:view:${image.id}:${backOffset}` }, { text: '回到首页', callback_data: 'tp:home' }]);
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard }
  });
}

async function sendAlbumDeleteConfirmPanel({ config, chatId, album, editMessageId = null }) {
  const text = [
    '确认删除相册',
    '',
    `相册：${album.name}`,
    `ID：${album.id}`,
    '删除相册不会删除图片本身。'
  ].join('\n');
  return sendOrEditMessage(config, {
    chatId,
    messageId: editMessageId,
    text,
    reply_markup: { inline_keyboard: [[{ text: '确认删除', callback_data: `tp:albumdelete:${album.id}` }, { text: '返回相册', callback_data: `tp:albumview:${album.id}` }]] }
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

async function handlePendingText({ pending, inputText, chatId, userId, config, db, storage }) {
  if (pending.type === 'search') {
    clearPendingAction(chatId, userId);
    const images = db.listImages({ includePrivate: true, limit: 10, q: inputText, sort: 'newest' });
    await sendSearchPanel({ config, chatId, images, keyword: inputText });
    return true;
  }

  if (pending.type === 'fetch') {
    try {
      const remote = await downloadRemoteImage(inputText, config.maxUploadBytes);
      clearPendingAction(chatId, userId);
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
      await sendText(config, chatId, `抓图失败：${error.message}\n请重新发送图片链接，或发送“取消”退出。`);
    }
    return true;
  }

  if (pending.type === 'rename_image') {
    const image = db.updateImage(pending.imageId, { originalName: inputText.trim().slice(0, 200) });
    clearPendingAction(chatId, userId);
    if (!image) {
      await sendText(config, chatId, '目标图片不存在，已退出本次操作。');
      return true;
    }
    await sendImageDetailPanel({ config, chatId, image, backOffset: pending.backOffset || 0, note: '图片名称已更新' });
    return true;
  }

  if (pending.type === 'edit_tags') {
    const image = db.updateImage(pending.imageId, { tags: normalizeTags(inputText) });
    clearPendingAction(chatId, userId);
    if (!image) {
      await sendText(config, chatId, '目标图片不存在，已退出本次操作。');
      return true;
    }
    await sendImageDetailPanel({ config, chatId, image, backOffset: pending.backOffset || 0, note: '图片标签已更新' });
    return true;
  }

  if (pending.type === 'create_token') {
    const name = inputText.trim().slice(0, 60);
    if (!name) {
      await sendText(config, chatId, '密钥名称不能为空，请重新发送。');
      return true;
    }
    clearPendingAction(chatId, userId);
    const created = db.createToken({ name, scopes: pending.scopes });
    await sendText(config, chatId, [
      `已创建密钥：${created.record.name}`,
      `ID：${created.record.id}`,
      `权限：${created.record.scopes.join(', ')}`,
      `Token：${created.token}`,
      '注意：这个明文 token 只会显示这一次。'
    ].join('\n'));
    await sendTokenPanel({ config, db, chatId, note: `已创建密钥：${created.record.name}` });
    return true;
  }

  if (pending.type === 'create_album') {
    const payload = parseAlbumInput(inputText);
    if (!payload.name) {
      await sendText(config, chatId, '相册名称不能为空，请重新发送。');
      return true;
    }
    const settings = readSettings(config);
    if (ensureAlbums(settings).some((album) => album.name === payload.name)) {
      await sendText(config, chatId, '同名相册已存在，请重新命名。');
      return true;
    }
    clearPendingAction(chatId, userId);
    const album = createAlbumRecord(payload);
    settings.albums = ensureAlbums(settings);
    settings.albums.unshift(album);
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    db.addEvent('album.created', { actor: String(userId), albumId: album.id, via: 'telegram' });
    await sendAlbumPanel({ config, db, chatId, note: `已创建相册：${album.name}` });
    return true;
  }

  if (pending.type === 'rename_album') {
    const settings = readSettings(config);
    const album = findAlbum(settings, pending.albumId);
    if (!album) {
      clearPendingAction(chatId, userId);
      await sendText(config, chatId, '目标相册不存在，已退出本次操作。');
      return true;
    }
    const name = inputText.trim().slice(0, 80);
    if (!name) {
      await sendText(config, chatId, '相册名称不能为空，请重新发送。');
      return true;
    }
    album.name = name;
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    clearPendingAction(chatId, userId);
    db.addEvent('album.updated', { actor: String(userId), albumId: album.id, via: 'telegram' });
    await sendAlbumImagesPanel({ config, db, chatId, albumId: album.id, note: '相册名称已更新' });
    return true;
  }

  if (pending.type === 'describe_album') {
    const settings = readSettings(config);
    const album = findAlbum(settings, pending.albumId);
    if (!album) {
      clearPendingAction(chatId, userId);
      await sendText(config, chatId, '目标相册不存在，已退出本次操作。');
      return true;
    }
    album.description = inputText.trim().slice(0, 300);
    album.updatedAt = new Date().toISOString();
    settings.updatedAt = album.updatedAt;
    writeSettings(config, settings);
    clearPendingAction(chatId, userId);
    db.addEvent('album.updated', { actor: String(userId), albumId: album.id, via: 'telegram' });
    await sendAlbumImagesPanel({ config, db, chatId, albumId: album.id, note: '相册描述已更新' });
    return true;
  }

  return false;
}

function sendRegistrationGuide(config, chatId, userId, chatType, alreadyAllowed = false) {
  const userLabel = alreadyAllowed ? '当前账号已可用，你也可以把下面的信息给其他管理员做排查。' : '当前账号尚未加入白名单。';
  return sendText(config, chatId, [
    userLabel,
    `用户 ID：${userId}`,
    `聊天类型：${chatType || 'unknown'}`,
    `聊天 ID：${chatId}`,
    '',
    '白名单配置示例：',
    `TELEGRAM_ALLOWED_USER_IDS=${userId}`,
    '',
    alreadyAllowed ? '完成后发送 /panel 即可打开按钮控制台。' : '管理员把你的用户 ID 加入白名单后，再发送 /panel 即可进入按钮控制台。'
  ].join('\n'));
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

function parseScopes(raw) {
  if (raw === 'all') return ['upload', 'manage'];
  return [raw].filter((scope) => ['upload', 'manage'].includes(scope));
}

function parseAlbumInput(raw) {
  const text = String(raw || '').trim();
  const pipeIndex = text.indexOf('|');
  if (pipeIndex >= 0) {
    return {
      name: text.slice(0, pipeIndex).trim().slice(0, 80),
      description: text.slice(pipeIndex + 1).trim().slice(0, 300)
    };
  }
  const [firstLine, ...rest] = text.split(/\r?\n/);
  return {
    name: String(firstLine || '').trim().slice(0, 80),
    description: rest.join('\n').trim().slice(0, 300)
  };
}

function createAlbumRecord(payload) {
  const timestamp = new Date().toISOString();
  return {
    id: `alb_${randomId(4)}`,
    name: payload.name,
    description: payload.description || '',
    coverImageId: '',
    imageIds: [],
    sortMode: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp
  };
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
