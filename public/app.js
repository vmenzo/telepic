const state = {
  adminToken: localStorage.getItem('telepic.adminToken') || '',
  images: [],
  selected: new Set(),
  config: {},
  stats: {
    images: 0,
    publicImages: 0,
    privateImages: 0,
    totalBytes: 0,
    averageBytes: 0,
    latestImageAt: null,
    oldestImageAt: null,
    largestImage: null,
    mimeBreakdown: {},
    tagBreakdown: {},
    ownerBreakdown: {},
    tokens: 0,
    sourceBreakdown: {}
  },
  activeImageId: null,
  uploadHistory: [],
  theme: loadTheme(),
  inspectorPane: 'detail',
  loginDismissed: sessionStorage.getItem('telepic.loginDismissed') === '1'
};

const THEME_PRESETS = {
  forest: {
    bg: '#edf3ef',
    panel: '#ffffff',
    ink: '#182126',
    accent: '#237a57',
    danger: '#c0463a'
  },
  graphite: {
    bg: '#eef2f6',
    panel: '#ffffff',
    ink: '#182230',
    accent: '#326aa1',
    danger: '#bf4b3d'
  },
  paper: {
    bg: '#f7f3eb',
    panel: '#fffdfa',
    ink: '#2b261f',
    accent: '#8e6743',
    danger: '#b84e3e'
  },
  midnight: {
    bg: '#0f141c',
    panel: '#171f2b',
    ink: '#e8edf5',
    accent: '#42b58d',
    danger: '#ef7868'
  },
  copper: {
    bg: '#f6eee7',
    panel: '#fffaf6',
    ink: '#2a1d18',
    accent: '#bf6a2f',
    danger: '#b54034'
  },
  ocean: {
    bg: '#eaf2f7',
    panel: '#ffffff',
    ink: '#1a2730',
    accent: '#1f6f8b',
    danger: '#cc5b48'
  }
};

const $ = (selector) => document.querySelector(selector);
const on = (selector, event, handler) => {
  const element = $(selector);
  if (element) element.addEventListener(event, handler);
  return element;
};

window.addEventListener('error', function (event) {
  window.TELEPIC_APP_ERROR = event.message;
  var runtime = $('#runtimeStatus');
  if (runtime) runtime.textContent = '前端报错：' + event.message;
});

window.addEventListener('unhandledrejection', function (event) {
  const message = event.reason && event.reason.message ? event.reason.message : String(event.reason || '未知错误');
  window.TELEPIC_APP_ERROR = message;
  setRuntimeStatus('操作失败：' + message);
  toast('操作失败：' + message);
});

try {
  bindEvents();
  hydrateSession();
  initTheme();
  refresh().catch(function (error) {
    setRuntimeStatus('刷新失败：' + error.message);
  });
  window.TELEPIC_APP_READY = true;
  setRuntimeStatus('控制台已就绪');
} catch (error) {
  window.TELEPIC_APP_ERROR = error.message;
  setRuntimeStatus('前端启动失败：' + error.message);
  throw error;
}

function bindEvents() {
  on('#saveToken', 'click', saveAdminToken);
  on('#logoutToken', 'click', logoutAdminToken);
  on('#loginButton', 'click', saveLoginToken);
  on('#loginGuest', 'click', dismissLogin);
  on('#loginToken', 'keydown', (event) => {
    if (event.key === 'Enter') saveLoginToken();
  });
  on('#adminToken', 'keydown', (event) => {
    if (event.key === 'Enter') saveAdminToken();
  });
  on('#fileInput', 'change', (event) => uploadFiles(event.target.files));
  on('#dropzone', 'dragover', onDragOver);
  on('#dropzone', 'dragleave', onDragLeave);
  on('#dropzone', 'drop', onDrop);
  on('#refreshImages', 'click', refresh);
  on('#bulkDelete', 'click', bulkDelete);
  on('#bulkPublic', 'click', () => bulkUpdate({ visibility: 'public' }, '已批量设为公开'));
  on('#bulkPrivate', 'click', () => bulkUpdate({ visibility: 'private' }, '已批量设为私有'));
  on('#createToken', 'click', createToken);
  on('#searchInput', 'input', debounce(refreshImages, 220));
  on('#tagFilter', 'input', debounce(refreshImages, 220));
  on('#visibilityFilter', 'change', refreshImages);
  on('#sourceFilter', 'change', refreshImages);
  on('#sortFilter', 'change', refreshImages);
  on('#linkFormat', 'change', renderImages);
  on('#gallery', 'click', handleGalleryClick);
  on('#tokens', 'click', handleTokenClick);
  on('#imageDetail', 'click', handleDetailAction);
  on('#fetchUrlButton', 'click', fetchUrlUpload);
  on('#refreshEvents', 'click', refreshEvents);
  on('#selectAllVisible', 'click', selectAllVisible);
  on('#clearSelection', 'click', clearSelection);
  on('#copySelectedLinks', 'click', copySelectedLinks);
  on('#applyBatchTags', 'click', applyBatchTags);
  on('#clearBatchTags', 'click', clearBatchTags);
  on('#inspectorTabs', 'click', handleInspectorTabs);
  on('#themePreset', 'change', onThemePresetChange);
  on('#themeQuickPicks', 'click', handleThemeQuickPick);
  on('#saveTheme', 'click', saveThemeFromInputs);
  on('#resetTheme', 'click', resetThemePreset);
  ['themeBg', 'themePanel', 'themeInk', 'themeAccent', 'themeDanger'].forEach((id) => {
    on(`#${id}`, 'input', previewCustomTheme);
  });
  document.addEventListener('paste', handlePasteUpload);
}

function hydrateSession() {
  const tokenInput = $('#adminToken');
  if (tokenInput) tokenInput.value = state.adminToken;
  const loginInput = $('#loginToken');
  if (loginInput) loginInput.value = state.adminToken;
  syncAdminState();
}

function saveAdminToken() {
  state.adminToken = $('#adminToken').value.trim();
  persistAdminToken(state.adminToken);
  toast(state.adminToken ? '管理员身份已更新' : '已清空管理员密钥');
}

function saveLoginToken() {
  const token = $('#loginToken').value.trim();
  if (!token) {
    $('#loginMessage').textContent = '请输入管理员 Token。';
    return;
  }
  state.adminToken = token;
  const tokenInput = $('#adminToken');
  if (tokenInput) tokenInput.value = token;
  state.loginDismissed = false;
  sessionStorage.removeItem('telepic.loginDismissed');
  persistAdminToken(token);
  $('#loginMessage').textContent = '已登录。';
  toast('管理员登录成功');
}

function logoutAdminToken() {
  state.adminToken = '';
  state.loginDismissed = false;
  localStorage.removeItem('telepic.adminToken');
  sessionStorage.removeItem('telepic.loginDismissed');
  const tokenInput = $('#adminToken');
  const loginInput = $('#loginToken');
  if (tokenInput) tokenInput.value = '';
  if (loginInput) loginInput.value = '';
  syncAdminState();
  refresh();
  toast('已退出管理员登录');
}

function dismissLogin() {
  state.loginDismissed = true;
  sessionStorage.setItem('telepic.loginDismissed', '1');
  syncAdminState();
}

function persistAdminToken(token) {
  if (token) {
    localStorage.setItem('telepic.adminToken', token);
  } else {
    localStorage.removeItem('telepic.adminToken');
  }
  syncAdminState();
  setRuntimeStatus(token ? '管理员已登录，本地浏览器已保存' : '未登录管理员');
  refresh();
}

function syncAdminState() {
  const loggedIn = Boolean(state.adminToken);
  const overlay = $('#loginOverlay');
  const logout = $('#logoutToken');
  $('#adminState').textContent = loggedIn ? '管理员已登录，本地浏览器已保存' : '未登录管理员';
  if (logout) logout.disabled = !loggedIn;
  if (overlay) {
    overlay.classList.toggle('is-hidden', loggedIn || state.loginDismissed);
    overlay.setAttribute('aria-hidden', loggedIn || state.loginDismissed ? 'true' : 'false');
  }
  syncUploadGate();
}

function onDragOver(event) {
  event.preventDefault();
  $('#dropzone').classList.add('is-dragover');
}

function onDragLeave() {
  $('#dropzone').classList.remove('is-dragover');
}

function onDrop(event) {
  event.preventDefault();
  $('#dropzone').classList.remove('is-dragover');
  uploadFiles(event.dataTransfer.files);
}

function headers(extra = {}) {
  return {
    ...extra,
    ...(state.adminToken ? { Authorization: `Bearer ${state.adminToken}` } : {})
  };
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: headers(options.headers || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(humanizeError(data.error || `请求失败：${response.status}`));
  return data;
}

async function uploadFiles(files) {
  if (!files || !files.length) return;
  $('#uploadResult').textContent = '';

  for (const file of files) {
    try {
      const data = await request('/api/upload', {
        method: 'POST',
        headers: {
          'content-type': file.type || 'application/octet-stream',
          'x-file-name': safeHeaderFileName(file.name || 'upload')
        },
        body: file
      });
      state.activeImageId = data.image.id;
      pushUploadHistory(`已上传 ${file.name}`, data.image.url);
    } catch (error) {
      pushUploadHistory(`上传失败 ${file.name}`, error.message);
    }
  }

  renderUploadHistory();
  await refresh();
  setInspectorPane('detail');
}

async function refresh() {
  await Promise.all([refreshConfig(), refreshStats(), refreshImages(), refreshTokens(), refreshEvents()]);
  renderApiExample();
  renderBatchTagSummary();
}

async function refreshConfig() {
  try {
    state.config = await request('/api/config');
    $('#statTelegram').textContent = state.config.telegramEnabled ? '已启用' : '未启用';
    $('#statDatabase').textContent = state.config.databaseDriver === 'sqlite' ? 'SQLite' : 'JSON';
    $('#statStorage').textContent = state.config.storageDriver === 's3' ? 'S3/R2' : '本地';
    $('#telegramBadge').textContent = state.config.telegramEnabled ? '已启用' : '未配置';
    $('#telegramBadge').className = `badge ${state.config.telegramEnabled ? 'ok' : ''}`;
    $('#telegramHint').textContent = state.config.telegramEnabled
      ? 'Bot 已接入，可直接通过 /panel 进入按钮面板，用 /token、/list、/view、/delete 处理日常管理。'
      : '在 .env 中配置 TELEGRAM_BOT_TOKEN、PUBLIC_URL、TELEGRAM_ALLOWED_USER_IDS 后，再运行 webhook 脚本即可启用。';
    $('#telegramWebhook').textContent = state.config.telegramWebhookUrl
      ? `Webhook\n${state.config.telegramWebhookUrl}`
      : 'Webhook\n保存管理员密钥后显示完整 webhook 地址';
    $('#storageBadge').textContent = state.config.storageDriver === 'local' ? '本地存储' : '对象存储';
    $('#storageBadge').className = `badge ${state.config.storageDriver === 'local' ? '' : 'ok'}`;
    syncUploadGate();
    $('#systemConfig').innerHTML = [
      configRow('应用版本', `${state.config.appName || 'telepic'} ${state.config.appVersion || ''}`.trim()),
      configRow('Node / 平台', `${state.config.nodeVersion || '未知'} · ${state.config.platform || '未知'}`),
      configRow('监听地址', `${state.config.host || '0.0.0.0'}:${state.config.port || ''}`),
      configRow('公开地址', state.config.publicUrl),
      configRow('数据库驱动', state.config.databaseDriver === 'sqlite' ? 'SQLite' : 'JSON'),
      configRow('数据库文件', state.config.databaseFile || (state.config.adminAuthenticated ? '未设置' : '管理员授权后显示')),
      configRow('数据目录', state.config.dataDir || (state.config.adminAuthenticated ? '未设置' : '管理员授权后显示')),
      configRow('上传大小限制', formatBytes(state.config.maxUploadBytes)),
      configRow('匿名上传', state.config.publicUpload ? '允许' : '关闭'),
      configRow('Telegram 白名单', state.config.telegramAllowedUsersConfigured ? '已配置' : '未配置'),
      configRow('Telegram Webhook', state.config.telegramWebhookUrl || '管理员授权后显示'),
      configRow('存储驱动', state.config.storageDriver),
      configRow('对象存储配置', state.config.s3Configured ? '已配置' : '未配置'),
      configRow('对象存储 Bucket', state.config.s3Bucket || (state.config.storageDriver === 's3' ? '管理员授权后显示' : '未启用')),
      configRow('对象存储 Endpoint', state.config.s3Endpoint || '未设置'),
      configRow('对象存储区域', state.config.s3Region || '未设置'),
      configRow('对象存储前缀', state.config.s3Prefix || '未设置'),
      configRow('对象存储公开域名', state.config.s3PublicBaseUrl || '未设置'),
      configRow(
        '当前状态',
        state.config.storageDriver === 'local'
          ? '当前为本地模式，可继续接入 S3 / R2 / B2'
          : '当前已启用 S3 兼容对象存储'
      )
    ].join('');
    renderStatusOverview();
  } catch (error) {
    $('#telegramHint').textContent = error.message;
    $('#systemConfig').innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function syncUploadGate() {
  const hint = $('#uploadGateHint');
  const badge = $('#uploadAuthBadge');
  if (!hint || !badge) return;

  if (state.config.publicUpload) {
    badge.textContent = '开放上传';
    badge.className = 'badge ok';
    hint.textContent = '当前已开启匿名上传，网页端可直接上传。';
    return;
  }

  if (state.adminToken) {
    badge.textContent = '已授权上传';
    badge.className = 'badge ok';
    hint.textContent = '当前站点关闭匿名上传，你已保存管理员密钥，可正常上传和管理图片。';
    return;
  }

  badge.textContent = '需要密钥';
  badge.className = 'badge';
  hint.textContent = '当前站点关闭匿名上传。请先在右上角填入管理员密钥，或创建上传 API 密钥后再上传。';
}

async function refreshStats() {
  try {
    const stats = await request('/api/stats');
    state.stats = stats;
    $('#statImages').textContent = stats.images;
    $('#statPublic').textContent = stats.publicImages;
    $('#statPrivate').textContent = stats.privateImages;
    $('#statBytes').textContent = formatBytes(stats.totalBytes);
    $('#statTokens').textContent = stats.tokens;
    $('#sourceSummary').textContent = renderSourceSummary(stats.sourceBreakdown);
    renderVisibilityChart();
    renderSourceChart();
    renderBreakdownCharts();
    renderStatusOverview();
  } catch (error) {
    toast(error.message);
  }
}

async function refreshImages() {
  const params = new URLSearchParams({
    limit: '120',
    q: $('#searchInput').value.trim(),
    tag: $('#tagFilter').value.trim(),
    visibility: $('#visibilityFilter').value,
    source: $('#sourceFilter').value,
    sort: $('#sortFilter').value
  });

  try {
    const data = await request(`/api/images?${params.toString()}`);
    state.images = data.images;
    state.selected = new Set([...state.selected].filter((id) => state.images.some((image) => image.id === id)));

    if (!state.activeImageId || !state.images.some((image) => image.id === state.activeImageId)) {
      state.activeImageId = state.images.length ? state.images[0].id : null;
    }

    renderImages();
    renderSelectionSummary();
    renderImageDetail();
  } catch (error) {
    $('#gallery').innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function refreshTokens() {
  if (!state.adminToken) {
    $('#tokens').innerHTML = '<p class="empty-state">保存管理员密钥后可查看和创建 API 密钥。</p>';
    return;
  }

  try {
    const data = await request('/api/tokens');
    renderTokens(data.tokens);
  } catch (error) {
    $('#tokens').innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function renderImages() {
  const format = $('#linkFormat').value;
  $('#gallery').innerHTML = state.images.map((image) => {
    const selected = state.selected.has(image.id);
    const active = state.activeImageId === image.id;
    const tags = (image.tags || []).length ? image.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('') : '<span class="tag-chip muted">无标签</span>';
    const preview = linkFor(image, format);

    return `
      <article class="asset-row ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}" data-id="${image.id}">
        <div class="asset-cell asset-check">
          <input type="checkbox" data-action="select" ${selected ? 'checked' : ''} aria-label="选择图片">
        </div>
        <div class="asset-cell asset-file">
          <a class="asset-thumb" href="${previewPageUrl(image)}" target="_blank" rel="noreferrer">
            <img src="${previewRawUrl(image)}" alt="${escapeHtml(image.originalName || image.id)}" loading="lazy">
          </a>
          <div class="asset-main">
            <strong title="${escapeHtml(image.originalName || image.id)}">${escapeHtml(image.originalName || image.id)}</strong>
          <div class="asset-subline">ID ${image.id} · ${escapeHtml(image.storageKey || image.fileName || '无存储键')}</div>
          <div class="asset-subline">创建于 ${formatDate(image.createdAt)}</div>
            <div class="chip-row">
              <span class="status-chip ${image.visibility === 'private' ? 'private' : 'public'}">${image.visibility === 'private' ? '私有' : '公开'}</span>
              <span class="status-chip">${escapeHtml(sourceName(image.source))}</span>
            </div>
          </div>
        </div>
        <div class="asset-cell asset-meta">
          <div>${escapeHtml(image.mime)}</div>
          <div>${formatBytes(image.size)}</div>
          <div>归属：${escapeHtml(image.owner || '未知')}</div>
          <div>更新于 ${formatDate(image.updatedAt)}</div>
          <div class="tag-row">${tags}</div>
        </div>
        <div class="asset-cell asset-link">
          <code>${escapeHtml(preview)}</code>
        </div>
        <div class="asset-cell asset-actions">
          <button class="secondary" data-action="copy">复制</button>
          <button class="secondary" data-action="detail">详情</button>
          <button class="secondary" data-action="visibility">${image.visibility === 'private' ? '公开' : '私有'}</button>
          <button class="danger" data-action="delete">删除</button>
        </div>
      </article>
    `;
  }).join('') || '<p class="empty-state">还没有图片。先上传一张试试看。</p>';
}

function renderTokens(tokens) {
  $('#tokens').innerHTML = tokens.map((token) => `
    <article class="token-card" data-id="${token.id}">
      <div class="token-head">
        <strong>${escapeHtml(token.name)}</strong>
        <button class="danger" data-action="delete-token">删除</button>
      </div>
      <div class="token-meta">权限：${token.scopes.map(scopeName).join('、')}</div>
      <div class="token-meta">创建于 ${formatDate(token.createdAt)}</div>
      <div class="token-meta">最近使用：${token.lastUsedAt ? formatDate(token.lastUsedAt) : '暂无'}</div>
    </article>
  `).join('') || '<p class="empty-state">还没有 API 密钥。</p>';
}

async function handleGalleryClick(event) {
  const row = event.target.closest('.asset-row');
  if (!row) return;

  const id = row.dataset.id;
  const image = state.images.find((item) => item.id === id);
  if (!image) return;

  state.activeImageId = id;

  const actionEl = event.target.closest('[data-action]');
  const action = actionEl ? actionEl.dataset.action : '';

  if (!action) {
    renderImages();
    renderImageDetail();
    return;
  }

  if (action === 'select') {
    actionEl.checked ? state.selected.add(id) : state.selected.delete(id);
    renderImages();
    renderSelectionSummary();
    return;
  }

  if (action === 'copy') {
    await copyText(linkFor(image, $('#linkFormat').value));
    toast('已复制当前链接格式');
  }

  if (action === 'detail') {
    setInspectorPane('detail');
    toast('已打开图片详情');
  }

  if (action === 'visibility') {
    await updateImage(id, { visibility: image.visibility === 'private' ? 'public' : 'private' });
    toast('可见性已更新');
  }

  if (action === 'delete') {
    if (!confirm(`确定删除 ${image.originalName || image.id} 吗？`)) return;
    await deleteImage(id);
    toast('图片已删除');
  }

  renderImages();
  renderSelectionSummary();
  renderImageDetail();
}

async function handleDetailAction(event) {
  const button = event.target.closest('[data-detail-action]');
  if (!button) return;

  const image = currentImage();
  if (!image) return;

  const action = button.dataset.detailAction;

  if (action === 'save-name') {
    const nameInput = $('#detailNameInput');
    const name = (nameInput ? nameInput.value.trim() : '') || image.originalName || image.id;
    await updateImage(image.id, { originalName: name });
    toast('图片名称已更新');
    return;
  }

  if (action === 'save-tags') {
    const tagsInput = $('#detailTagsInput');
    const tags = tagsInput ? tagsInput.value.trim() : '';
    await updateImage(image.id, { tags });
    toast('图片标签已更新');
    return;
  }

  if (action === 'toggle-visibility') {
    await updateImage(image.id, { visibility: image.visibility === 'private' ? 'public' : 'private' });
    toast('可见性已切换');
    return;
  }

  if (action === 'delete') {
    if (!confirm(`确定删除 ${image.originalName || image.id} 吗？`)) return;
    await deleteImage(image.id);
    toast('图片已删除');
    return;
  }

  if (action === 'copy-page') {
    await copyText(image.url);
    toast('已复制页面链接');
    return;
  }

  if (action === 'copy-raw') {
    await copyText(image.rawUrl);
    toast('已复制图片直链');
    return;
  }

  if (action === 'copy-markdown') {
    await copyText(linkFor(image, 'markdown'));
    toast('已复制 Markdown');
    return;
  }

  if (action === 'copy-html') {
    await copyText(linkFor(image, 'html'));
    toast('已复制 HTML');
    return;
  }

  if (action === 'copy-bbcode') {
    await copyText(linkFor(image, 'bbcode'));
    toast('已复制 BBCode');
  }
}

async function handleTokenClick(event) {
  const button = event.target.closest('button[data-action="delete-token"]');
  if (!button) return;
  const token = event.target.closest('.token-card');
  if (!token) return;
  if (!confirm('确定删除这个 API 密钥吗？')) return;
  await deleteToken(token.dataset.id);
  toast('API 密钥已删除');
}

function handleInspectorTabs(event) {
  const button = event.target.closest('button[data-pane]');
  if (!button) return;
  setInspectorPane(button.dataset.pane);
}

function setInspectorPane(pane) {
  state.inspectorPane = pane;
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.pane === pane);
  });
  document.querySelectorAll('.inspector-pane').forEach((section) => {
    section.classList.toggle('is-active', section.id === `pane-${pane}`);
  });
}

function currentImage() {
  return state.images.find((item) => item.id === state.activeImageId) || null;
}

async function updateImage(id, patch) {
  await request(`/api/images/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch)
  });
  await refreshStats();
  await refreshImages();
  renderImageDetail();
}

async function createToken() {
  const name = $('#tokenName').value.trim() || '上传密钥';
  const scopes = [];
  if ($('#scopeUpload').checked) scopes.push('upload');
  if ($('#scopeManage').checked) scopes.push('manage');

  if (!scopes.length) {
    toast('至少选择一个权限');
    return;
  }

  try {
    const data = await request('/api/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, scopes })
    });
    $('#tokenResult').textContent = `新密钥只显示一次：${data.token}`;
    $('#tokenName').value = '';
    setInspectorPane('tokens');
    await refreshTokens();
    await refreshStats();
    toast('API 密钥已创建');
  } catch (error) {
    $('#tokenResult').textContent = error.message;
  }
}

async function deleteToken(id) {
  await request(`/api/tokens/${id}`, { method: 'DELETE' });
  await refreshTokens();
  await refreshStats();
}

async function deleteImage(id) {
  await request(`/api/images/${id}`, { method: 'DELETE' });
  state.selected.delete(id);
  await refresh();
}

async function bulkDelete() {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先勾选要删除的图片');
    return;
  }
  if (!confirm(`确定删除选中的 ${ids.length} 张图片吗？`)) return;

  await request('/api/images/bulk-delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids })
  });

  state.selected.clear();
  toast('批量删除完成');
  await refresh();
}

async function bulkUpdate(patch, message) {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先勾选要操作的图片');
    return;
  }

  await request('/api/images/bulk-update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, ...patch })
  });

  toast(message);
  await refresh();
}

async function fetchUrlUpload() {
  const input = $('#fetchUrlInput');
  const result = $('#fetchUrlResult');
  const url = input.value.trim();

  if (!url) {
    result.textContent = '先输入图片 URL。';
    return;
  }

  try {
    const data = await request('/api/upload-from-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    });
    state.activeImageId = data.image.id;
    input.value = '';
    result.textContent = `抓取成功：${data.image.url}`;
    pushUploadHistory('URL 抓图成功', data.image.url);
    renderUploadHistory();
    await refresh();
    setInspectorPane('detail');
  } catch (error) {
    result.textContent = error.message;
  }
}

async function refreshEvents() {
  if (!state.adminToken) {
    $('#events').innerHTML = '<p class="empty-state">保存管理员密钥后可查看最近操作。</p>';
    return;
  }

  try {
    const data = await request('/api/events?limit=12');
    renderEvents(data.events);
  } catch (error) {
    $('#events').innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function linkFor(image, format) {
  if (format === 'raw') return image.rawUrl;
  if (format === 'markdown') return `![${image.originalName || image.id}](${image.rawUrl})`;
  if (format === 'html') return `<img src="${image.rawUrl}" alt="${image.originalName || image.id}">`;
  if (format === 'bbcode') return `[img]${image.rawUrl}[/img]`;
  return image.url;
}

function previewRawUrl(image) {
  if (image.visibility !== 'private' || !state.adminToken) return image.rawUrl;
  return withAccessToken(image.appRawUrl || image.rawUrl);
}

function previewPageUrl(image) {
  if (image.visibility !== 'private' || !state.adminToken) return image.url;
  return withAccessToken(image.url);
}

function withAccessToken(url) {
  const separator = String(url).includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(state.adminToken)}`;
}

function renderApiExample() {
  const publicUrl = state.config.publicUrl || window.TELEPIC.publicUrl || location.origin;
  $('#apiExample').textContent = [
    '# 上传图片',
    'curl -H "Authorization: Bearer YOUR_TOKEN" \\',
    '  -F "image=@photo.png" \\',
    `  ${publicUrl}/api/upload`,
    '',
    '# URL 抓图',
    'curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\',
    '  -H "Content-Type: application/json" \\',
    `  -d '{"url":"https://example.com/photo.png"}' ${publicUrl}/api/upload-from-url`,
    '',
    '# 管理列表',
    `curl -H "Authorization: Bearer ADMIN_TOKEN" "${publicUrl}/api/images?limit=20&sort=newest"`
  ].join('\n');
}

function renderEvents(events) {
  $('#events').innerHTML = events.map((eventItem) => `
    <article class="event-item">
      <div class="event-head">
        <strong>${escapeHtml(eventItem.type)}</strong>
        <small>${formatDate(eventItem.createdAt)}</small>
      </div>
      <div class="event-body">${escapeHtml(renderEventDetails(eventItem.details))}</div>
    </article>
  `).join('') || '<p class="empty-state">暂无操作记录。</p>';
}

function renderSelectionSummary() {
  const count = state.selected.size;
  $('#selectionSummary').textContent = count ? `已选择 ${count} 张图片` : '未选择图片';
  renderBatchTagSummary();
}

function renderImageDetail() {
  const image = currentImage();
  $('#detailBadge').textContent = image ? image.id : '未选中';

  if (!image) {
    $('#imageDetail').innerHTML = '<p class="empty-state">点击列表中的任意图片，在这里查看预览、编辑名称和标签、复制不同格式的链接。</p>';
    return;
  }

  $('#imageDetail').innerHTML = `
    <div class="detail-hero">
      <img class="detail-image" src="${previewRawUrl(image)}" alt="${escapeHtml(image.originalName || image.id)}">
      <div class="detail-summary">
        <strong>${escapeHtml(image.originalName || image.id)}</strong>
        <div class="chip-row">
          <span class="status-chip ${image.visibility === 'private' ? 'private' : 'public'}">${image.visibility === 'private' ? '私有' : '公开'}</span>
          <span class="status-chip">${escapeHtml(sourceName(image.source))}</span>
        </div>
        <p class="muted-text">${escapeHtml(image.mime)} · ${formatBytes(image.size)}</p>
        <p class="muted-text">归属 ${escapeHtml(image.owner || '未知')} · ${escapeHtml(image.storageKey || image.fileName || '无存储键')}</p>
      </div>
    </div>

    <div class="detail-editors">
      <label class="field-stack">
        <span>图片名称</span>
        <input id="detailNameInput" value="${escapeHtml(image.originalName || '')}" placeholder="输入新的图片名称">
      </label>
      <button class="secondary" data-detail-action="save-name">保存名称</button>
      <label class="field-stack field-stack-wide">
        <span>标签</span>
        <input id="detailTagsInput" value="${escapeHtml((image.tags || []).join(', '))}" placeholder="标签1, 标签2">
      </label>
      <button class="secondary" data-detail-action="save-tags">保存标签</button>
    </div>

    <div class="detail-grid">
      ${configRow('图片 ID', image.id)}
      ${configRow('文件名', image.fileName || '未记录')}
      ${configRow('存储键', image.storageKey || '未记录')}
      ${configRow('归属', image.owner || '未知')}
      ${configRow('来源', sourceName(image.source))}
      ${configRow('MIME', image.mime)}
      ${configRow('大小', formatBytes(image.size))}
      ${configRow('可见性', image.visibility === 'private' ? '私有' : '公开')}
      ${configRow('创建时间', formatDate(image.createdAt))}
      ${configRow('更新时间', formatDate(image.updatedAt))}
      ${configRow('SHA256', image.sha256)}
      ${configRow('页面链接', image.url)}
      ${configRow('图片直链', image.rawUrl)}
      ${configRow('应用直链', image.appRawUrl || image.rawUrl)}
      ${configRow('Markdown', linkFor(image, 'markdown'))}
      ${configRow('HTML', linkFor(image, 'html'))}
      ${configRow('BBCode', linkFor(image, 'bbcode'))}
    </div>

    <div class="detail-actions">
      <button class="secondary" data-detail-action="copy-page">复制页面链接</button>
      <button class="secondary" data-detail-action="copy-raw">复制图片直链</button>
      <button class="secondary" data-detail-action="copy-markdown">复制 Markdown</button>
      <button class="secondary" data-detail-action="copy-html">复制 HTML</button>
      <button class="secondary" data-detail-action="copy-bbcode">复制 BBCode</button>
      <button class="secondary" data-detail-action="toggle-visibility">${image.visibility === 'private' ? '设为公开' : '设为私有'}</button>
      <button class="danger" data-detail-action="delete">删除图片</button>
    </div>
  `;
}

function pushUploadHistory(title, content) {
  state.uploadHistory.unshift({ title, content, at: new Date().toISOString() });
  state.uploadHistory = state.uploadHistory.slice(0, 8);
}

function renderUploadHistory() {
  const lines = state.uploadHistory.map((item) => `[${formatDate(item.at)}] ${item.title}\n${item.content}`);
  $('#uploadResult').textContent = lines.join('\n\n');
}

function selectAllVisible() {
  state.images.forEach((image) => state.selected.add(image.id));
  renderImages();
  renderSelectionSummary();
}

function clearSelection() {
  state.selected.clear();
  renderImages();
  renderSelectionSummary();
}

async function copySelectedLinks() {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先选择图片');
    return;
  }

  const format = $('#linkFormat').value;
  const text = state.images
    .filter((image) => ids.includes(image.id))
    .map((image) => linkFor(image, format))
    .join('\n');

  await copyText(text);
  toast(`已复制 ${ids.length} 条链接`);
}

async function applyBatchTags() {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先选择图片');
    return;
  }

  const tags = $('#batchTagsInput').value.trim();
  await request('/api/images/bulk-update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, tags })
  });

  toast(`已为 ${ids.length} 张图片更新标签`);
  await refresh();
}

async function clearBatchTags() {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先选择图片');
    return;
  }

  await request('/api/images/bulk-update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, tags: [] })
  });

  toast(`已清空 ${ids.length} 张图片的标签`);
  await refresh();
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function toast(message) {
  const flash = $('#flashMessage');
  if (!flash) return;
  flash.textContent = message;
  flash.classList.remove('is-pulsing');
  void flash.offsetWidth;
  flash.classList.add('is-pulsing');
  setRuntimeStatus(message);
}

function setRuntimeStatus(message) {
  var runtime = $('#runtimeStatus');
  if (runtime) runtime.textContent = message;
}

function sourceName(source) {
  if (source === 'telegram') return 'Telegram';
  if (source === 'api') return '网页/API';
  if (source === 'url') return 'URL 抓图';
  return source || '未知';
}

function renderBatchTagSummary() {
  const count = state.selected.size;
  $('#batchTagBadge').textContent = count ? `已选择 ${count} 张` : '未选择';
}

function initTheme() {
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  renderThemePreview(state.theme);
}

function onThemePresetChange() {
  const preset = $('#themePreset').value;
  if (preset === 'custom') {
    previewCustomTheme();
    return;
  }

  applyPresetTheme(preset);
  toast('主题已切换');
}

function handleThemeQuickPick(event) {
  const button = event.target.closest('[data-theme-preset]');
  if (!button) return;
  applyPresetTheme(button.dataset.themePreset);
  toast(`已切换到${themeName(button.dataset.themePreset)}主题`);
}

function applyPresetTheme(preset) {
  if (!THEME_PRESETS[preset]) return;
  state.theme = { preset, ...THEME_PRESETS[preset] };
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(preset);
  persistTheme();
}

function saveThemeFromInputs() {
  state.theme = {
    preset: 'custom',
    bg: $('#themeBg').value,
    panel: $('#themePanel').value,
    ink: $('#themeInk').value,
    accent: $('#themeAccent').value,
    danger: $('#themeDanger').value
  };
  applyTheme(state.theme);
  syncThemeQuickPicks('custom');
  persistTheme();
  $('#themePreset').value = 'custom';
  toast('主题已保存');
}

function resetThemePreset() {
  const preset = $('#themePreset').value === 'custom' ? 'forest' : $('#themePreset').value;
  applyPresetTheme(preset);
  toast('已恢复当前预设');
}

function previewCustomTheme() {
  const preview = {
    preset: 'custom',
    bg: $('#themeBg').value,
    panel: $('#themePanel').value,
    ink: $('#themeInk').value,
    accent: $('#themeAccent').value,
    danger: $('#themeDanger').value
  };
  applyTheme(preview, false);
  $('#themePreset').value = 'custom';
  syncThemeQuickPicks('custom');
  $('#themeBadge').textContent = '自定义';
}

function applyTheme(theme, updateState = true) {
  if (updateState) state.theme = theme;

  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--panel', theme.panel);
  root.style.setProperty('--ink', theme.ink);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--danger', theme.danger);
  root.style.setProperty('--line', mixColor(theme.panel, theme.ink, 0.12));
  root.style.setProperty('--line-strong', mixColor(theme.panel, theme.ink, 0.22));
  root.style.setProperty('--muted', mixColor(theme.ink, theme.bg, 0.5));
  root.style.setProperty('--soft', mixColor(theme.accent, theme.panel, 0.88));
  root.style.setProperty('--danger-soft', mixColor(theme.danger, theme.panel, 0.88));
  root.style.setProperty('--accent-strong', mixColor(theme.accent, theme.ink, 0.18));
  root.style.setProperty('--accent-contrast', luminance(theme.accent) > 0.52 ? '#102028' : '#ffffff');
  root.style.setProperty('--shadow', theme.preset === 'midnight'
    ? '0 18px 38px rgba(0, 0, 0, 0.34)'
    : '0 16px 28px rgba(16, 24, 40, 0.08)');
  document.body.classList.toggle('theme-dark', theme.preset === 'midnight' || luminance(theme.bg) < 0.35);
  $('#themeBadge').textContent = themeName(theme.preset);
  renderThemePreview(theme);
  syncThemeQuickPicks(theme.preset);
}

function syncThemeInputs(theme) {
  $('#themePreset').value = theme.preset || 'forest';
  $('#themeBg').value = theme.bg;
  $('#themePanel').value = theme.panel;
  $('#themeInk').value = theme.ink;
  $('#themeAccent').value = theme.accent;
  $('#themeDanger').value = theme.danger;
}

function persistTheme() {
  localStorage.setItem('telepic.theme', JSON.stringify(state.theme));
}

function syncThemeQuickPicks(preset) {
  const buttons = document.querySelectorAll('[data-theme-preset]');
  if (!buttons.length) return;
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themePreset === preset);
  });
}

function renderThemePreview(theme) {
  const preview = $('#themePreview');
  if (!preview) return;
  preview.innerHTML = `
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.bg)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.panel)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.ink)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.accent)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.danger)}"></div>
    <div class="theme-preview-label">${themeName(theme.preset)} · 当前面板配色</div>
  `;
}

function loadTheme() {
  try {
    const raw = localStorage.getItem('telepic.theme');
    if (!raw) return { preset: 'forest', ...THEME_PRESETS.forest };
    const parsed = JSON.parse(raw);
    if (parsed.preset && THEME_PRESETS[parsed.preset] && parsed.preset !== 'custom') {
      return { preset: parsed.preset, ...THEME_PRESETS[parsed.preset] };
    }
    return {
      preset: 'custom',
      bg: parsed.bg || THEME_PRESETS.forest.bg,
      panel: parsed.panel || THEME_PRESETS.forest.panel,
      ink: parsed.ink || THEME_PRESETS.forest.ink,
      accent: parsed.accent || THEME_PRESETS.forest.accent,
      danger: parsed.danger || THEME_PRESETS.forest.danger
    };
  } catch {
    return { preset: 'forest', ...THEME_PRESETS.forest };
  }
}

async function handlePasteUpload(event) {
  const files = [];
  const clipboardItems = event.clipboardData && event.clipboardData.items ? event.clipboardData.items : [];
  for (const item of clipboardItems) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file && file.type.startsWith('image/')) files.push(file);
  }

  if (!files.length) return;
  event.preventDefault();
  toast(`检测到 ${files.length} 张剪贴板图片，正在上传`);
  await uploadFiles(files);
}

function scopeName(scope) {
  if (scope === 'upload') return '上传';
  if (scope === 'manage') return '管理';
  return scope;
}

function formatDate(value) {
  return new Date(value).toLocaleString('zh-CN');
}

function renderEventDetails(details) {
  return Object.entries(details || {})
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' · ');
}

function renderSourceSummary(breakdown = {}) {
  const items = Object.entries(breakdown || {});
  if (!items.length) return '暂无来源统计';
  return items.map(([key, value]) => `${sourceName(key)} ${value}`).join(' / ');
}

function humanizeError(message) {
  if (!message) return '请求失败';
  if (message.includes('Upload requires an admin token or API token')) {
    return '上传被拒绝：当前站点未开启匿名上传，请先填写管理员密钥或使用上传 API 密钥。';
  }
  if (message.includes('Management requires an admin token')) {
    return '当前操作需要管理员密钥。';
  }
  return message;
}

function renderVisibilityChart() {
  const chart = $('#visibilityChart');
  const rate = $('#visibilityRate');
  const legend = $('#visibilityLegend');
  if (!chart || !rate || !legend) return;
  const total = state.stats.images || 0;
  const publicImages = state.stats.publicImages || 0;
  const privateImages = state.stats.privateImages || 0;
  const publicRatio = total ? Math.round((publicImages / total) * 100) : 0;

  rate.textContent = `${publicRatio}%`;
  chart.style.background = total
    ? `conic-gradient(var(--accent) 0 ${publicRatio}%, color-mix(in srgb, var(--danger) 78%, var(--panel)) ${publicRatio}% 100%)`
    : 'conic-gradient(var(--line) 0 100%)';

  legend.innerHTML = [
    legendItem('公开图片', publicImages, 'var(--accent)'),
    legendItem('私有图片', privateImages, 'var(--danger)')
  ].join('');
}

function renderSourceChart() {
  const chart = $('#sourceChart');
  if (!chart) return;
  const entries = Object.entries(state.stats.sourceBreakdown || {});
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const palette = ['var(--accent)', '#4f8cff', '#f39c4a', '#9b7af7', 'var(--danger)'];

  chart.innerHTML = entries.length
    ? entries.map(([key, value], index) => {
      const percent = total ? Math.round((value / total) * 100) : 0;
      return `
        <div class="source-row">
          <div class="source-row-head">
            <strong>${escapeHtml(sourceName(key))}</strong>
            <span>${value} 张 · ${percent}%</span>
          </div>
          <div class="source-bar">
            <i style="width:${percent}%; background:${palette[index % palette.length]}"></i>
          </div>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">暂无来源统计。</p>';
}

function renderBreakdownCharts() {
  const target = $('#breakdownCharts');
  if (!target) return;
  target.innerHTML = [
    breakdownBlock('文件类型', state.stats.mimeBreakdown, (key) => key),
    breakdownBlock('标签 Top 6', topEntries(state.stats.tagBreakdown, 6), (key) => `#${key}`),
    breakdownBlock('上传归属', state.stats.ownerBreakdown, (key) => key === 'unknown' ? '未知' : key)
  ].join('');
}

function renderStatusOverview() {
  const overview = $('#statusOverview');
  if (!overview) return;
  overview.innerHTML = [
    statusItem('数据库', state.config.databaseDriver === 'sqlite' ? 'SQLite' : 'JSON', state.config.databaseDriver === 'sqlite' ? 'ok' : 'neutral'),
    statusItem('存储', state.config.storageDriver === 's3' ? '对象存储' : '本地存储', state.config.storageDriver === 's3' ? 'ok' : 'neutral'),
    statusItem('对象存储', state.config.s3Configured ? '已配置' : '未配置', state.config.s3Configured ? 'ok' : 'warn'),
    statusItem('Bot', state.config.telegramEnabled ? '已启用' : '未启用', state.config.telegramEnabled ? 'ok' : 'warn'),
    statusItem('匿名上传', state.config.publicUpload ? '开启' : '关闭', state.config.publicUpload ? 'warn' : 'neutral'),
    statusItem('平均大小', formatBytes(state.stats.averageBytes || 0), 'neutral'),
    statusItem('最新图片', state.stats.latestImageAt ? formatDate(state.stats.latestImageAt) : '暂无', 'neutral'),
    statusItem('最大文件', state.stats.largestImage ? `${state.stats.largestImage.originalName || state.stats.largestImage.id} · ${formatBytes(state.stats.largestImage.size || 0)}` : '暂无', 'neutral')
  ].join('');
}

function configRow(label, value) {
  return `<div class="config-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function breakdownBlock(title, entries, labeler) {
  const normalized = Array.isArray(entries) ? entries : Object.entries(entries || {});
  return `
    <div class="breakdown-block">
      <strong>${escapeHtml(title)}</strong>
      ${normalized.length ? normalized.map(([key, value]) => `
        <div class="breakdown-row">
          <span>${escapeHtml(labeler(key))}</span>
          <b>${value}</b>
        </div>
      `).join('') : '<p class="empty-state compact">暂无数据</p>'}
    </div>
  `;
}

function topEntries(source, limit) {
  return Object.entries(source || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function legendItem(label, value, color) {
  return `
    <div class="legend-item">
      <span class="legend-dot" style="background:${color}"></span>
      <strong>${escapeHtml(label)}</strong>
      <span>${value}</span>
    </div>
  `;
}

function statusItem(label, value, tone) {
  return `
    <div class="status-item ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function mixColor(foreground, background, ratio) {
  const a = hexToRgb(foreground);
  const b = hexToRgb(background);
  return rgbToHex({
    r: Math.round(a.r * (1 - ratio) + b.r * ratio),
    g: Math.round(a.g * (1 - ratio) + b.g * ratio),
    b: Math.round(a.b * (1 - ratio) + b.b * ratio)
  });
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '';
}

function themeName(preset) {
  if (preset === 'forest') return '森绿';
  if (preset === 'graphite') return '石墨';
  if (preset === 'paper') return '纸白';
  if (preset === 'midnight') return '夜幕';
  if (preset === 'copper') return '铜橙';
  if (preset === 'ocean') return '海港';
  if (preset === 'custom') return '自定义';
  return capitalize(preset);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GiB`;
}

function safeHeaderFileName(name) {
  return encodeURIComponent(String(name || 'upload').replace(/[\r\n]/g, '').slice(0, 180));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
