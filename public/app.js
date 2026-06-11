const THEME_PRESETS = {
  gallery: {
    label: '艺廊白',
    bg: '#eef1ee',
    panel: '#ffffff',
    ink: '#19201f',
    accent: '#2f7d68',
    danger: '#c44f46',
    backdrop: 'radial-gradient(circle at 18% 12%, rgba(47,125,104,0.18), transparent 30%), radial-gradient(circle at 84% 18%, rgba(219,154,87,0.18), transparent 28%), linear-gradient(135deg, #eef1ee 0%, #f8f6f0 52%, #e8eff2 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.18))',
    panelAlpha: 0.88,
    blur: 18
  },
  coast: {
    label: '海岸玻璃',
    bg: '#e8f1f2',
    panel: '#ffffff',
    ink: '#142429',
    accent: '#197c8c',
    danger: '#c65b4d',
    backdrop: 'radial-gradient(circle at 18% 18%, rgba(25,124,140,0.28), transparent 30%), radial-gradient(circle at 84% 24%, rgba(244,170,91,0.22), transparent 30%), linear-gradient(135deg, #dfeff0 0%, #f7fbfa 48%, #edf0e7 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.12))',
    panelAlpha: 0.82,
    blur: 22
  },
  studio: {
    label: '影棚灰',
    bg: '#eceff1',
    panel: '#fbfbfa',
    ink: '#1d2227',
    accent: '#596f82',
    danger: '#bd4f49',
    backdrop: 'linear-gradient(120deg, rgba(255,255,255,0.78), rgba(210,217,222,0.58)), repeating-linear-gradient(90deg, rgba(40,48,56,0.045) 0 1px, transparent 1px 96px)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08))',
    panelAlpha: 0.90,
    blur: 14
  },
  dusk: {
    label: '暮色柔光',
    bg: '#f1ece8',
    panel: '#fffdf9',
    ink: '#27201d',
    accent: '#8d6b4f',
    danger: '#b95148',
    backdrop: 'radial-gradient(circle at 22% 18%, rgba(221,145,96,0.28), transparent 32%), radial-gradient(circle at 78% 12%, rgba(93,125,142,0.20), transparent 28%), linear-gradient(135deg, #f5ede7 0%, #f8f6ef 52%, #e9eef1 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.16))',
    panelAlpha: 0.86,
    blur: 18
  },
  focus: {
    label: '暗场工作台',
    bg: '#11161a',
    panel: '#171d22',
    ink: '#e9eef0',
    accent: '#58b899',
    danger: '#ef7868',
    backdrop: 'radial-gradient(circle at 18% 18%, rgba(88,184,153,0.18), transparent 30%), radial-gradient(circle at 82% 12%, rgba(232,184,104,0.13), transparent 26%), linear-gradient(135deg, #11161a 0%, #1c2226 52%, #12171b 100%)',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.30))',
    panelAlpha: 0.82,
    blur: 20
  },
  botanical: {
    label: '植物玻璃',
    bg: '#edf3ef',
    panel: '#ffffff',
    ink: '#182126',
    accent: '#237a57',
    danger: '#c0463a',
    backdrop: 'radial-gradient(circle at 16% 18%, rgba(35,122,87,0.24), transparent 30%), radial-gradient(circle at 90% 8%, rgba(87,132,166,0.18), transparent 26%), linear-gradient(135deg, #edf3ef 0%, #f8faf7 50%, #e9eef3 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.12))',
    panelAlpha: 0.86,
    blur: 18
  }
};

const THEME_LIBRARY = {
  gallery: {
    id: 'gallery',
    preset: 'gallery',
    label: '艺廊白',
    author: 'Telepic',
    category: '编辑感',
    description: '明亮克制的策展风格，适合展示作品集、截图墙和品牌素材。',
    cover: '',
    ...THEME_PRESETS.gallery
  },
  coast: {
    id: 'coast',
    preset: 'coast',
    label: '海岸玻璃',
    author: 'Telepic',
    category: '玻璃感',
    description: '通透轻盈的半透明面板，适合大众审美下的日常图床后台。',
    cover: '',
    ...THEME_PRESETS.coast
  },
  studio: {
    id: 'studio',
    preset: 'studio',
    label: '影棚灰',
    author: 'Telepic',
    category: '中性色',
    description: '偏专业控制台气质的中性灰主题，适合长时间管理和运维查看。',
    cover: '',
    ...THEME_PRESETS.studio
  },
  dusk: {
    id: 'dusk',
    preset: 'dusk',
    label: '暮色柔光',
    author: 'Telepic',
    category: '生活感',
    description: '暖色柔和、层次细腻，适合个人站长和内容型图片管理场景。',
    cover: '',
    ...THEME_PRESETS.dusk
  },
  focus: {
    id: 'focus',
    preset: 'focus',
    label: '暗场工作台',
    author: 'Telepic',
    category: '深色',
    description: '低亮度高对比的深色工作界面，适合夜间值守和密集操作。',
    cover: '',
    ...THEME_PRESETS.focus
  },
  botanical: {
    id: 'botanical',
    preset: 'botanical',
    label: '植物玻璃',
    author: 'Telepic',
    category: '自然系',
    description: '清新的植物配色和玻璃质感，更适合轻松一点的运营氛围。',
    cover: '',
    ...THEME_PRESETS.botanical
  }
};

const RECOMMENDED_THEME_PACKS = {
  auroraDeck: {
    id: 'auroraDeck',
    preset: 'custom',
    label: '极光控制台',
    author: '社区精选',
    category: '推荐主题',
    description: '偏冷调的科技感主题，适合做对象存储、Bot 和系统状态这类信息面板。',
    cover: '',
    bg: '#e8eef6',
    panel: '#fdfefe',
    ink: '#102030',
    accent: '#3d84ff',
    danger: '#dd5f57',
    backdrop: 'radial-gradient(circle at 14% 18%, rgba(61,132,255,0.24), transparent 28%), radial-gradient(circle at 82% 18%, rgba(104,211,255,0.22), transparent 24%), linear-gradient(135deg, #ebf4ff 0%, #f8fbff 52%, #ebf1f8 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.10))',
    panelAlpha: 0.84,
    blur: 22,
    image: ''
  },
  cinemaAmber: {
    id: 'cinemaAmber',
    preset: 'custom',
    label: '电影琥珀',
    author: '社区精选',
    category: '推荐主题',
    description: '深色基底配暖金强调，适合夜间管理和内容审核场景，整体更稳一些。',
    cover: '',
    bg: '#181413',
    panel: '#221b19',
    ink: '#f4ede8',
    accent: '#d39a4a',
    danger: '#f06f62',
    backdrop: 'radial-gradient(circle at 14% 20%, rgba(211,154,74,0.24), transparent 28%), radial-gradient(circle at 84% 14%, rgba(255,218,142,0.12), transparent 22%), linear-gradient(135deg, #181413 0%, #241b18 54%, #151212 100%)',
    overlay: 'linear-gradient(180deg, rgba(12,8,6,0.16), rgba(12,8,6,0.32))',
    panelAlpha: 0.84,
    blur: 20,
    image: ''
  },
  paperSignal: {
    id: 'paperSignal',
    preset: 'custom',
    label: '纸感信号',
    author: '社区精选',
    category: '推荐主题',
    description: '轻纸感背景和红蓝对比点缀，风格更鲜明，适合想要一点设计感的站长。',
    cover: '',
    bg: '#f5f2eb',
    panel: '#fffdfa',
    ink: '#1d2329',
    accent: '#2c78c6',
    danger: '#cb4d49',
    backdrop: 'linear-gradient(120deg, rgba(255,255,255,0.74), rgba(242,234,224,0.54)), repeating-linear-gradient(0deg, rgba(44,120,198,0.035) 0 1px, transparent 1px 88px), radial-gradient(circle at 84% 16%, rgba(203,77,73,0.10), transparent 24%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.12))',
    panelAlpha: 0.9,
    blur: 14,
    image: ''
  },
  neonHarbor: {
    id: 'neonHarbor',
    preset: 'custom',
    label: '霓虹港湾',
    author: '社区精选',
    category: '推荐主题',
    description: '紫蓝交替的夜景氛围，适合想让面板更有玩家主题味道的使用者。',
    cover: '',
    bg: '#131722',
    panel: '#191f2e',
    ink: '#eef3ff',
    accent: '#61c4ff',
    danger: '#ff7b82',
    backdrop: 'radial-gradient(circle at 18% 18%, rgba(97,196,255,0.20), transparent 30%), radial-gradient(circle at 84% 12%, rgba(176,118,255,0.18), transparent 26%), linear-gradient(135deg, #10141d 0%, #191d2c 48%, #121722 100%)',
    overlay: 'linear-gradient(180deg, rgba(10,14,22,0.16), rgba(10,14,22,0.32))',
    panelAlpha: 0.82,
    blur: 22,
    image: ''
  }
};

const THEME_SOURCE_LABELS = {
  builtin: '内置主题',
  recommended: '推荐主题',
  installed: '我的主题',
  custom: '自定义草稿'
};

const DEFAULT_STATS = {
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
};

const SESSION_IDLE_FALLBACK_MS = 30 * 60 * 1000;
const SESSION_ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
let sessionIdleTimer = null;
let lastSessionRefreshAt = 0;

function safeStorageGet(storage, key, fallback = '') {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeStorageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {}
}

function safeStorageRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {}
}

const state = {
  adminToken: safeStorageGet(localStorage, 'telepic.adminToken', ''),
  adminUsername: safeStorageGet(localStorage, 'telepic.adminUsername', 'admin'),
  sessionIdleExpiresAt: Number(safeStorageGet(localStorage, 'telepic.sessionIdleExpiresAt', 0) || 0),
  images: [],
  imageTotal: 0,
  imageLimit: 24,
  imageOffset: 0,
  selected: new Set(),
  albums: [],
  activeAlbumId: '',
  trashItems: [],
  trashTotal: 0,
  telegramStatus: null,
  storageStatus: null,
  systemStatus: null,
  config: {},
  stats: { ...DEFAULT_STATS },
  activeImageId: null,
  uploadHistory: [],
  themeLibrary: loadStoredThemeLibrary(),
  theme: loadTheme(),
  mainView: 'library',
  inspectorPane: 'detail',
  loginDismissed: safeStorageGet(sessionStorage, 'telepic.loginDismissed', '') === '1'
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
  renderVisibilityChart();
  renderSourceChart();
  renderBreakdownCharts();
  renderStatusOverview();
  loadServerTheme().catch(function (error) {
    setThemeStorageState('云端主题读取失败');
    setRuntimeStatus('云端主题读取失败：' + error.message);
  });
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
  on('#loginUsername', 'keydown', (event) => {
    if (event.key === 'Enter') saveLoginToken();
  });
  on('#loginPassword', 'keydown', (event) => {
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
  on('#changePassword', 'click', changeAdminPassword);
  on('#saveTelegramConfig', 'click', saveTelegramConfig);
  on('#registerTelegramWebhook', 'click', registerTelegramWebhook);
  on('#saveStorageConfig', 'click', saveStorageConfig);
  on('#testStorageConfig', 'click', testStorageConfig);
  on('#searchInput', 'input', debounce(resetImagePageAndRefresh, 220));
  on('#tagFilter', 'input', debounce(resetImagePageAndRefresh, 220));
  on('#visibilityFilter', 'change', resetImagePageAndRefresh);
  on('#sourceFilter', 'change', resetImagePageAndRefresh);
  on('#sortFilter', 'change', resetImagePageAndRefresh);
  on('#linkFormat', 'change', renderImages);
  on('#gallery', 'click', handleGalleryClick);
  on('#tokens', 'click', handleTokenClick);
  on('#imageDetail', 'click', handleDetailAction);
  on('#fetchUrlButton', 'click', fetchUrlUpload);
  on('#refreshEvents', 'click', refreshEvents);
  on('#selectAllVisible', 'click', selectAllVisible);
  on('#clearSelection', 'click', clearSelection);
  on('#copySelectedLinks', 'click', copySelectedLinks);
  on('#downloadSelected', 'click', downloadSelected);
  on('#applyBatchTags', 'click', applyBatchTags);
  on('#clearBatchTags', 'click', clearBatchTags);
  on('#mainNav', 'click', handleMainNav);
  on('#createAlbum', 'click', createAlbum);
  on('#assignSelectedAlbum', 'click', assignSelectedToAlbum);
  on('#clearAlbumFilter', 'click', clearAlbumFilter);
  on('#albumGrid', 'click', handleAlbumGridClick);
  on('#saveAlbumMeta', 'click', saveAlbumMeta);
  on('#setAlbumCoverFromCurrent', 'click', setAlbumCoverFromCurrent);
  on('#removeCurrentFromAlbum', 'click', removeCurrentFromAlbum);
  on('#moveCurrentAlbumUp', 'click', () => reorderCurrentAlbumImage('up'));
  on('#moveCurrentAlbumDown', 'click', () => reorderCurrentAlbumImage('down'));
  on('#deleteAlbum', 'click', deleteAlbum);
  on('#refreshTrash', 'click', refreshTrash);
  on('#emptyTrash', 'click', emptyTrash);
  on('#trashList', 'click', handleTrashListClick);
  on('#prevPage', 'click', () => changePage(-1));
  on('#nextPage', 'click', () => changePage(1));
  on('#sendTelegramTest', 'click', sendTelegramTest);
  on('#migrateStorageData', 'click', migrateStorageData);
  on('#inspectorTabs', 'click', handleInspectorTabs);
  on('#themePreset', 'change', onThemePresetChange);
  on('#themeQuickPicks', 'click', handleThemeQuickPick);
  on('#saveTheme', 'click', saveThemeFromInputs);
  on('#installTheme', 'click', installCurrentTheme);
  on('#removeTheme', 'click', removeCurrentTheme);
  on('#resetTheme', 'click', resetThemePreset);
  on('#themeBackgroundFile', 'change', handleThemeBackgroundUpload);
  on('#clearThemeBackground', 'click', clearThemeBackground);
  on('#exportTheme', 'click', exportThemePack);
  on('#themeImportFile', 'change', importThemePack);
  ['themeBg', 'themePanel', 'themeInk', 'themeAccent', 'themeDanger'].forEach((id) => {
    on(`#${id}`, 'input', previewCustomTheme);
  });
  document.addEventListener('paste', handlePasteUpload);
  SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, markSessionActivity, { passive: true });
  });
  scheduleSessionIdleCheck();
}

function hydrateSession() {
  const tokenInput = $('#adminToken');
  if (tokenInput) tokenInput.value = state.adminToken;
  const loginUsername = $('#loginUsername');
  if (loginUsername) loginUsername.value = state.adminUsername;
  syncAdminState();
}

function saveAdminToken() {
  state.adminToken = $('#adminToken').value.trim();
  persistAdminToken(state.adminToken);
  toast(state.adminToken ? '管理员身份已更新' : '已清空管理员密钥');
}

async function saveLoginToken() {
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  if (!username || !password) {
    $('#loginMessage').textContent = '请输入用户名和密码。';
    return;
  }

  $('#loginMessage').textContent = '正在登录...';
  try {
    const data = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    state.adminToken = data.token;
    state.adminUsername = data.username || username;
    applySessionRefresh(data);
    safeStorageSet(localStorage, 'telepic.adminUsername', state.adminUsername);
    const tokenInput = $('#adminToken');
    const passwordInput = $('#loginPassword');
    if (tokenInput) tokenInput.value = state.adminToken;
    if (passwordInput) passwordInput.value = '';
    state.loginDismissed = false;
    safeStorageRemove(sessionStorage, 'telepic.loginDismissed');
    persistAdminToken(state.adminToken);
    $('#loginMessage').textContent = data.expiresAt ? `已登录，会话有效期至 ${formatDate(data.expiresAt)}` : '已登录。';
    toast('管理员登录成功');
  } catch (error) {
    $('#loginMessage').textContent = error.message;
    toast(error.message);
  }
}

function logoutAdminToken() {
  clearSessionIdleTimer();
  state.adminToken = '';
  state.sessionIdleExpiresAt = 0;
  state.loginDismissed = false;
  safeStorageRemove(localStorage, 'telepic.adminToken');
  safeStorageRemove(localStorage, 'telepic.sessionIdleExpiresAt');
  safeStorageRemove(sessionStorage, 'telepic.loginDismissed');
  const tokenInput = $('#adminToken');
  const passwordInput = $('#loginPassword');
  if (tokenInput) tokenInput.value = '';
  if (passwordInput) passwordInput.value = '';
  syncAdminState();
  refresh();
  toast('已退出管理员登录');
}

function dismissLogin() {
  state.loginDismissed = true;
  safeStorageSet(sessionStorage, 'telepic.loginDismissed', '1');
  syncAdminState();
}

function persistAdminToken(token) {
  if (token) {
    safeStorageSet(localStorage, 'telepic.adminToken', token);
    if (!state.sessionIdleExpiresAt) {
      state.sessionIdleExpiresAt = Date.now() + sessionIdleMs();
      safeStorageSet(localStorage, 'telepic.sessionIdleExpiresAt', String(state.sessionIdleExpiresAt));
    }
    if (state.config && state.config.adminAuthenticated === false) {
      delete state.config.adminAuthenticated;
    }
  } else {
    safeStorageRemove(localStorage, 'telepic.adminToken');
    safeStorageRemove(localStorage, 'telepic.sessionIdleExpiresAt');
    state.sessionIdleExpiresAt = 0;
  }
  scheduleSessionIdleCheck();
  syncAdminState();
  setRuntimeStatus(token ? '管理员已登录' : '管理员未登录');
  refresh();
}

function syncAdminState() {
  const loggedIn = Boolean(state.adminToken);
  const sessionExpired = loggedIn && (isSessionIdleExpired() || (state.config && state.config.adminAuthenticated === false));
  const overlay = $('#loginOverlay');
  const logout = $('#logoutToken');
  $('#adminState').textContent = sessionExpired
    ? '登录已失效，请重新登录'
    : (loggedIn ? '管理员已登录，本地浏览器已保存' : '未登录管理员');
  if (logout) logout.disabled = !loggedIn;
  if (overlay) {
    const hideOverlay = (loggedIn && !sessionExpired) || state.loginDismissed;
    overlay.classList.toggle('is-hidden', hideOverlay);
    overlay.setAttribute('aria-hidden', hideOverlay ? 'true' : 'false');
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
  if (state.adminToken && isSessionIdleExpired()) {
    expireSession();
    throw new Error('登录空闲超过 30 分钟，请重新登录。');
  }
  const response = await fetch(path, {
    ...options,
    headers: headers(options.headers || {})
  });
  applySessionRefresh({
    token: response.headers.get('x-admin-session'),
    expiresAt: response.headers.get('x-admin-session-expires-at'),
    idleExpiresAt: response.headers.get('x-admin-session-idle-expires-at')
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.adminToken) expireSession();
    throw new Error(humanizeError(data.error || 'Request failed: ' + response.status));
  }
  return data;
}

function applySessionRefresh(data = {}) {
  if (!data.token || !String(data.token).startsWith('tp_session_')) return;
  state.adminToken = data.token;
  safeStorageSet(localStorage, 'telepic.adminToken', state.adminToken);
  if (data.idleExpiresAt) {
    const idleExpiresAt = Date.parse(data.idleExpiresAt);
    if (Number.isFinite(idleExpiresAt)) {
      state.sessionIdleExpiresAt = idleExpiresAt;
      safeStorageSet(localStorage, 'telepic.sessionIdleExpiresAt', String(idleExpiresAt));
    }
  }
  const tokenInput = $('#adminToken');
  if (tokenInput) tokenInput.value = state.adminToken;
  scheduleSessionIdleCheck();
}

function markSessionActivity() {
  if (!state.adminToken) return;
  state.sessionIdleExpiresAt = Date.now() + sessionIdleMs();
  safeStorageSet(localStorage, 'telepic.sessionIdleExpiresAt', String(state.sessionIdleExpiresAt));
  scheduleSessionIdleCheck();
  refreshSessionAfterActivity();
}

function sessionIdleMs() {
  const minutes = Number(state.config && state.config.adminSessionIdleMinutes);
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : SESSION_IDLE_FALLBACK_MS;
}

function isSessionIdleExpired() {
  return Boolean(state.adminToken && state.sessionIdleExpiresAt && Date.now() >= state.sessionIdleExpiresAt);
}

function scheduleSessionIdleCheck() {
  clearSessionIdleTimer();
  if (!state.adminToken || !state.sessionIdleExpiresAt) return;
  const delay = Math.max(1000, Math.min(state.sessionIdleExpiresAt - Date.now(), 2147483647));
  sessionIdleTimer = window.setTimeout(() => {
    if (isSessionIdleExpired()) expireSession();
    else scheduleSessionIdleCheck();
  }, delay);
}

function clearSessionIdleTimer() {
  if (sessionIdleTimer) {
    window.clearTimeout(sessionIdleTimer);
    sessionIdleTimer = null;
  }
}

function expireSession() {
  clearSessionIdleTimer();
  state.adminToken = '';
  state.sessionIdleExpiresAt = 0;
  state.loginDismissed = false;
  safeStorageRemove(localStorage, 'telepic.adminToken');
  safeStorageRemove(localStorage, 'telepic.sessionIdleExpiresAt');
  safeStorageRemove(sessionStorage, 'telepic.loginDismissed');
  const tokenInput = $('#adminToken');
  if (tokenInput) tokenInput.value = '';
  syncAdminState();
  toast('登录空闲超过 30 分钟，请重新登录。');
}

function refreshSessionAfterActivity() {
  if (!state.adminToken || Date.now() - lastSessionRefreshAt < 60 * 1000) return;
  lastSessionRefreshAt = Date.now();
  fetch('/api/session/refresh', {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' })
  }).then((response) => {
    if (response.status === 401) {
      expireSession();
      return {};
    }
    return response.json().catch(() => ({}));
  }).then(applySessionRefresh).catch(() => {});
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
  const tasks = [
    refreshConfig(),
    refreshStats(),
    refreshImages(),
    refreshAlbums(),
    refreshTelegramStatus(),
    refreshStorageStatus(),
    refreshSystemStatus(),
    refreshTrash(),
    refreshTokens(),
    refreshEvents()
  ];
  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length) {
    setRuntimeStatus(`刷新完成，${failed.length} 个模块需要重试`);
  }
  renderApiExample();
  renderBatchTagSummary();
  mountIntegrationPanels();
  renderAlbums();
}

async function refreshConfig() {
  try {
    state.config = await request('/api/config');
    syncAdminState();
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
    hydrateIntegrationForms();
    syncUploadGate();
    $('#systemConfig').innerHTML = [
      configRow('应用版本', `${state.config.appName || 'telepic'} ${state.config.appVersion || ''}`.trim()),
      configRow('Node / 平台', `${state.config.nodeVersion || '未知'} · ${state.config.platform || '未知'}`),
      configRow('监听地址', `${state.config.host || '0.0.0.0'}:${state.config.port || ''}`),
      configRow('服务器时间', state.config.serverTime ? formatDate(state.config.serverTime) : '未知'),
      configRow('接口状态', state.config.checks && state.config.checks.api ? '正常' : '未检测到'),
      configRow('数据库检测', state.config.checks && state.config.checks.database ? '正常' : '未检测到'),
      configRow('存储检测', state.config.checks && state.config.checks.storage ? '正常' : '未检测到'),
      configRow('主题云端配置', state.config.checks && state.config.checks.themeSettings ? '已保存' : '未保存'),
      configRow('主题库数量', String(state.config.themeLibraryCount || 0)),
      configRow('管理员状态', state.config.adminAuthenticated ? '已登录，显示完整信息' : '未登录，仅显示公开信息'),
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
    renderStatusOverview();
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
    state.stats = { ...DEFAULT_STATS, ...stats };
    $('#statImages').textContent = state.stats.images;
    $('#statPublic').textContent = state.stats.publicImages;
    $('#statPrivate').textContent = state.stats.privateImages;
    $('#statBytes').textContent = formatBytes(state.stats.totalBytes);
    $('#statTokens').textContent = state.stats.tokens;
    $('#sourceSummary').textContent = renderSourceSummary(state.stats.sourceBreakdown);
    renderVisibilityChart();
    renderSourceChart();
    renderBreakdownCharts();
    renderStatusOverview();
  } catch (error) {
    state.stats = { ...DEFAULT_STATS };
    renderVisibilityChart();
    renderSourceChart();
    renderBreakdownCharts();
    renderStatusOverview();
    $('#sourceSummary').textContent = '统计读取失败';
    toast(error.message);
  }
}

async function refreshImages() {
  const params = new URLSearchParams({
    limit: String(state.imageLimit),
    offset: String(state.imageOffset),
    q: $('#searchInput').value.trim(),
    tag: $('#tagFilter').value.trim(),
    visibility: $('#visibilityFilter').value,
    source: $('#sourceFilter').value,
    sort: $('#sortFilter').value
  });
  if (state.activeAlbumId) params.set('albumId', state.activeAlbumId);

  try {
    const data = await request(`/api/images?${params.toString()}`);
    state.images = data.images || [];
    state.imageTotal = Number(data.total || state.images.length || 0);
    state.imageLimit = Number(data.limit || state.imageLimit);
    state.imageOffset = Number(data.offset || 0);
    state.selected = new Set([...state.selected].filter((id) => state.images.some((image) => image.id === id)));

    if (!state.activeImageId || !state.images.some((image) => image.id === state.activeImageId)) {
      state.activeImageId = state.images.length ? state.images[0].id : null;
    }

    renderImages();
    renderSelectionSummary();
    renderImageDetail();
    renderPagination();
    renderAlbums();
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

async function refreshAlbums() {
  if (!state.adminToken) {
    state.albums = [];
    renderAlbums();
    return;
  }
  try {
    const data = await request('/api/albums');
    state.albums = data.albums || [];
    if (state.activeAlbumId && !state.albums.some((album) => album.id === state.activeAlbumId)) {
      state.activeAlbumId = '';
    }
    renderAlbums();
    renderAlbumDetail();
  } catch (error) {
    state.albums = [];
    const grid = $('#albumGrid');
    if (grid) grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function refreshTrash() {
  if (!state.adminToken) {
    state.trashItems = [];
    state.trashTotal = 0;
    renderTrash();
    return;
  }
  try {
    const data = await request('/api/trash?limit=100');
    state.trashItems = data.items || [];
    state.trashTotal = Number(data.total || state.trashItems.length || 0);
    renderTrash();
  } catch (error) {
    const list = $('#trashList');
    if (list) list.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function refreshTelegramStatus() {
  if (!state.adminToken) {
    state.telegramStatus = null;
    renderTelegramStatus();
    return;
  }
  try {
    state.telegramStatus = await request('/api/integrations/telegram/status');
    renderTelegramStatus();
  } catch (error) {
    state.telegramStatus = { ok: false, error: error.message };
    renderTelegramStatus();
  }
}

async function refreshStorageStatus() {
  if (!state.adminToken) {
    state.storageStatus = null;
    renderStorageStatus();
    return;
  }
  try {
    state.storageStatus = await request('/api/integrations/storage/status');
    renderStorageStatus();
  } catch (error) {
    state.storageStatus = { ok: false, message: error.message };
    renderStorageStatus();
  }
}

async function refreshSystemStatus() {
  if (!state.adminToken) {
    state.systemStatus = null;
    renderSystemStatus();
    return;
  }
  try {
    state.systemStatus = await request('/api/system/status');
    renderSystemStatus();
  } catch (error) {
    state.systemStatus = { ok: false, error: error.message };
    renderSystemStatus();
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

async function changeAdminPassword() {
  const current = $('#currentPassword').value;
  const next = $('#newPassword').value;
  const confirm = $('#confirmPassword').value;
  const result = $('#passwordResult');

  if (!state.adminToken) {
    result.textContent = '请先登录管理员账号。';
    return;
  }
  if (!current || !next || !confirm) {
    result.textContent = '请填写当前密码和新密码。';
    return;
  }
  if (next.length < 8) {
    result.textContent = '新密码至少 8 位。';
    return;
  }
  if (next !== confirm) {
    result.textContent = '两次输入的新密码不一致。';
    return;
  }

  try {
    await request('/api/admin/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next })
    });
    $('#currentPassword').value = '';
    $('#newPassword').value = '';
    $('#confirmPassword').value = '';
    result.textContent = '密码已更新，下次登录请使用新密码。';
    toast('管理员密码已更新');
  } catch (error) {
    result.textContent = error.message;
  }
}

function hydrateIntegrationForms() {
  setValue('#cfgPublicUrl', state.config.publicUrl || window.TELEPIC.publicUrl || location.origin);
  setValue('#cfgTelegramWebhookSecret', state.config.telegramWebhookSecret || '');
  setValue('#cfgTelegramAllowedUsers', state.config.telegramAllowedUserIds || '');
  setValue('#cfgStorageDriver', state.config.storageDriver || 'local');
  setValue('#cfgS3Bucket', state.config.s3Bucket || '');
  setValue('#cfgS3Region', state.config.s3Region || 'auto');
  setValue('#cfgS3Endpoint', state.config.s3Endpoint || '');
  setValue('#cfgS3PublicBaseUrl', state.config.s3PublicBaseUrl || '');
  setValue('#cfgS3Prefix', state.config.s3Prefix || 'telepic');
  const forcePath = $('#cfgS3ForcePathStyle');
  if (forcePath) forcePath.checked = state.config.s3ForcePathStyle !== false;
  const tgBadge = $('#telegramConfigBadge');
  if (tgBadge) {
    tgBadge.textContent = state.config.telegramEnabled ? '已配置' : '未配置';
    tgBadge.className = 'badge ' + (state.config.telegramEnabled ? 'ok' : '');
  }
  const storageBadge = $('#storageConfigBadge');
  if (storageBadge) {
    storageBadge.textContent = state.config.storageDriver === 's3' ? '对象存储' : '本地';
    storageBadge.className = 'badge ' + (state.config.storageDriver === 's3' ? 'ok' : '');
  }
}

function setValue(selector, value) {
  const element = $(selector);
  if (element && element.value !== String(value || '')) element.value = value || '';
}

async function saveTelegramConfig() {
  const result = $('#telegramConfigResult');
  if (result) result.textContent = '正在保存 Telegram 配置...';
  try {
    const payload = {
      publicUrl: $('#cfgPublicUrl') ? $('#cfgPublicUrl').value.trim() : '',
      botToken: $('#cfgTelegramBotToken') ? $('#cfgTelegramBotToken').value.trim() : '',
      webhookSecret: $('#cfgTelegramWebhookSecret') ? $('#cfgTelegramWebhookSecret').value.trim() : '',
      allowedUserIds: $('#cfgTelegramAllowedUsers') ? $('#cfgTelegramAllowedUsers').value.trim() : ''
    };
    const data = await request('/api/integrations/telegram', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if ($('#cfgTelegramBotToken')) $('#cfgTelegramBotToken').value = '';
    if (result) result.textContent = 'Telegram 配置已保存，Webhook: ' + (data.telegramWebhookUrl || '未生成');
    toast('Telegram 配置已保存');
    await refreshConfig();
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

async function registerTelegramWebhook() {
  const result = $('#telegramConfigResult');
  if (result) result.textContent = '正在向 Telegram 注册 webhook...';
  try {
    const data = await request('/api/integrations/telegram/webhook', { method: 'POST' });
    if (result) result.textContent = 'Webhook 注册成功: ' + data.webhookUrl;
    toast('Telegram Webhook 已注册');
    await refreshConfig();
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

async function saveStorageConfig() {
  const result = $('#storageConfigResult');
  if (result) result.textContent = '正在保存对象存储配置...';
  try {
    const payload = storageConfigPayloadFromForm();
    const data = await request('/api/integrations/storage', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if ($('#cfgS3AccessKeyId')) $('#cfgS3AccessKeyId').value = '';
    if ($('#cfgS3SecretAccessKey')) $('#cfgS3SecretAccessKey').value = '';
    if (result) result.textContent = '对象存储配置已保存，当前驱动: ' + data.storageDriver;
    toast('存储配置已保存');
    await refreshConfig();
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

async function testStorageConfig() {
  const result = $('#storageConfigResult');
  if (result) result.textContent = '正在测试当前存储配置...';
  try {
    const data = await request('/api/integrations/storage/test', { method: 'POST' });
    if (result) result.textContent = '当前存储配置可用: ' + data.storageDriver;
    toast('存储配置可用');
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

function storageConfigPayloadFromForm() {
  const forcePath = $('#cfgS3ForcePathStyle');
  return {
    storageDriver: $('#cfgStorageDriver') ? $('#cfgStorageDriver').value : 'local',
    s3Bucket: $('#cfgS3Bucket') ? $('#cfgS3Bucket').value.trim() : '',
    s3Region: $('#cfgS3Region') ? $('#cfgS3Region').value.trim() : 'auto',
    s3Endpoint: $('#cfgS3Endpoint') ? $('#cfgS3Endpoint').value.trim() : '',
    s3AccessKeyId: $('#cfgS3AccessKeyId') ? $('#cfgS3AccessKeyId').value.trim() : '',
    s3SecretAccessKey: $('#cfgS3SecretAccessKey') ? $('#cfgS3SecretAccessKey').value.trim() : '',
    s3PublicBaseUrl: $('#cfgS3PublicBaseUrl') ? $('#cfgS3PublicBaseUrl').value.trim() : '',
    s3Prefix: $('#cfgS3Prefix') ? $('#cfgS3Prefix').value.trim() : '',
    s3ForcePathStyle: forcePath ? forcePath.checked : true
  };
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
  const albumSummary = $('#albumSelectionSummary');
  if (albumSummary) albumSummary.textContent = count ? `已选择 ${count} 张图片` : '未选择图片';
  renderBatchTagSummary();
}

function renderPagination() {
  const currentPage = Math.floor(state.imageOffset / state.imageLimit) + 1;
  const totalPages = Math.max(1, Math.ceil(state.imageTotal / state.imageLimit));
  $('#pageSummary').textContent = `第 ${currentPage} / ${totalPages} 页`;
  $('#pageMeta').textContent = `${state.images.length} / ${state.imageTotal}`;
  $('#prevPage').disabled = state.imageOffset <= 0;
  $('#nextPage').disabled = state.imageOffset + state.imageLimit >= state.imageTotal;
}

function changePage(direction) {
  const nextOffset = Math.max(0, state.imageOffset + direction * state.imageLimit);
  if (nextOffset === state.imageOffset) return;
  state.imageOffset = nextOffset;
  refreshImages();
}

function resetImagePageAndRefresh() {
  state.imageOffset = 0;
  refreshImages();
}

function renderAlbumDetail() {
  const album = state.albums.find((item) => item.id === state.activeAlbumId) || null;
  $('#albumDetailBadge').textContent = album ? album.name : '未选择';
  if ($('#albumEditName')) $('#albumEditName').value = album ? (album.name || '') : '';
  if ($('#albumEditDescription')) $('#albumEditDescription').value = album ? (album.description || '') : '';
  if ($('#albumSortMode')) $('#albumSortMode').value = album ? (album.sortMode || 'manual') : 'manual';
  const result = $('#albumDetailResult');
  if (result && !album) result.textContent = '选择一个相册后可编辑名称、描述和封面。';
}

function renderTelegramStatus() {
  const panel = $('#telegramStatusPanel');
  if (!panel) return;
  const status = state.telegramStatus;
  if (!status) {
    panel.innerHTML = '<p class="empty-state">登录管理员后可查看 Bot 状态。</p>';
    return;
  }
  const chatInput = $('#telegramTestChatId');
  if (chatInput && !chatInput.value && status.allowedUserIds && status.allowedUserIds.length) {
    chatInput.value = status.allowedUserIds[0];
  }
  panel.innerHTML = `
    <article class="dashboard-panel">
      <div class="pane-head"><div><p class="panel-kicker">Bot 状态</p><h2>${status.enabled ? '已配置' : '未配置'}</h2></div></div>
      <div class="config-list">
        ${configRow('Webhook', status.webhookUrl || '未生成')}
        ${configRow('允许用户', (status.allowedUserIds || []).join(', ') || '未配置')}
        ${configRow('机器人', status.bot && status.bot.result ? `${status.bot.result.username || ''} (${status.bot.result.id})` : '未获取')}
        ${configRow('最后错误', status.webhook && status.webhook.result ? (status.webhook.result.last_error_message || '无') : (status.error || '无'))}
        ${configRow('待处理更新', status.webhook && status.webhook.result ? String(status.webhook.result.pending_update_count || 0) : '0')}
      </div>
      <div class="events">${(status.recentEvents || []).map((item) => `<article class="event-item"><div class="event-head"><strong>${escapeHtml(item.type)}</strong><small>${formatDate(item.createdAt)}</small></div><div class="event-body">${escapeHtml(renderEventDetails(item.details))}</div></article>`).join('') || '<p class="empty-state">暂无 Telegram 相关事件。</p>'}</div>
    </article>
  `;
}

function renderStorageStatus() {
  const panel = $('#storageStatusPanel');
  if (!panel) return;
  const status = state.storageStatus;
  if (!status) {
    panel.innerHTML = '<p class="empty-state">登录管理员后可查看存储状态。</p>';
    return;
  }
  panel.innerHTML = `
    <article class="dashboard-panel">
      <div class="pane-head"><div><p class="panel-kicker">存储状态</p><h2>${status.driver || 'unknown'}</h2></div></div>
      <div class="config-list">
        ${configRow('读写测试', status.ok ? (status.testRead ? '通过' : '待检查') : '失败')}
        ${configRow('Bucket', status.bucket || '本地模式')}
        ${configRow('Endpoint', status.endpoint || '本地模式')}
        ${configRow('前缀', status.prefix || '未设置')}
        ${configRow('图片数', String(status.imageCount || 0))}
        ${configRow('回收站', String(status.recycleCount || 0))}
        ${configRow('可迁移旧配置', status.previousConfigAvailable ? '有' : '无')}
        ${configRow('说明', status.message || '无')}
      </div>
    </article>
  `;
}

function renderSystemStatus() {
  const panel = $('#systemStatusPanel');
  if (!panel) return;
  const status = state.systemStatus;
  if (!status) {
    panel.innerHTML = '<p class="empty-state">登录管理员后可查看系统运维状态。</p>';
    return;
  }
  if (status.ok === false) {
    panel.innerHTML = `<p class="empty-state">${escapeHtml(status.error || '读取失败')}</p>`;
    return;
  }
  panel.innerHTML = [
    configRow('进程 PID', String(status.pid)),
    configRow('运行时长', `${Math.floor((status.uptimeSeconds || 0) / 60)} 分钟`),
    configRow('Node / 平台', `${status.nodeVersion} · ${status.platform}`),
    configRow('数据目录', status.dataDir || ''),
    configRow('上传目录', status.uploadDir || ''),
    configRow('数据库', status.databaseDriver || ''),
    configRow('存储驱动', status.storageDriver || ''),
    configRow('相册数量', String(status.albumCount || 0)),
    configRow('回收站数量', String(status.recycleCount || 0)),
    configRow('RSS 内存', formatBytes(status.memory && status.memory.rss || 0)),
    configRow('Heap 已用', formatBytes(status.memory && status.memory.heapUsed || 0)),
    configRow('数据目录可用', status.checks && status.checks.dataDirWritable ? '正常' : '异常'),
    configRow('上传目录可用', status.checks && status.checks.uploadDirWritable ? '正常' : '异常'),
    configRow('Telegram 配置', status.checks && status.checks.telegramConfigured ? '已配置' : '未配置'),
    configRow('存储配置', status.checks && status.checks.storageConfigured ? '已配置' : '未配置')
  ].join('');
}

function renderTrash() {
  const list = $('#trashList');
  if (!list) return;
  list.innerHTML = state.trashItems.map((item) => `
    <article class="token-card" data-trash-id="${item.id}">
      <div class="token-head">
        <strong>${escapeHtml(item.originalName || item.id)}</strong>
        <div class="actions">
          <button class="secondary" data-trash-action="restore">恢复</button>
          <button class="danger" data-trash-action="purge">彻底删除</button>
        </div>
      </div>
      <div class="token-meta">删除时间：${formatDate(item.deletedAt)}</div>
      <div class="token-meta">来源：${escapeHtml(sourceName(item.source))} · ${formatBytes(item.size || 0)}</div>
    </article>
  `).join('') || '<p class="empty-state">回收站是空的。</p>';
}

function handleMainNav(event) {
  const button = event.target.closest('[data-main-view]');
  if (!button) return;
  setMainView(button.dataset.mainView);
}

function setMainView(view) {
  state.mainView = view;
  document.querySelectorAll('.main-nav-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mainView === view);
  });
  const visibleView = view === 'system' ? 'library' : view;
  document.querySelectorAll('.main-view').forEach((section) => {
    section.classList.toggle('is-active', section.id === `view-${visibleView}`);
  });
  if (view === 'system') setInspectorPane('system');
  if (view === 'bot' || view === 'storage') mountIntegrationPanels();
  if (view === 'albums') {
    renderAlbums();
    renderAlbumDetail();
  }
  if (view === 'trash') renderTrash();
}

function mountIntegrationPanels() {
  const telegramPanel = $('#telegramConfigPanel');
  const telegramMount = $('#telegramConfigMount');
  if (telegramPanel && telegramMount && telegramPanel.parentElement !== telegramMount) {
    telegramMount.appendChild(telegramPanel);
  }
  const storagePanel = $('#storageConfigPanel');
  const storageMount = $('#storageConfigMount');
  if (storagePanel && storageMount && storagePanel.parentElement !== storageMount) {
    storageMount.appendChild(storagePanel);
  }
}

function renderAlbums() {
  const grid = $('#albumGrid');
  if (!grid) return;
  grid.innerHTML = state.albums.map((album) => `
    <article class="album-card ${state.activeAlbumId === album.id ? 'is-active' : ''}" data-album="${escapeHtml(album.id)}">
      <div class="album-cover">
        ${album.coverImage ? `<img src="${previewRawUrl(album.coverImage)}" alt="${escapeHtml(album.name)}" loading="lazy">` : '<span>相册</span>'}
      </div>
      <div class="album-body">
        <strong>${escapeHtml(album.name)}</strong>
        <span>${album.imageCount || 0} 张图片</span>
        <span>${escapeHtml(album.description || '未填写描述')}</span>
      </div>
      <div class="actions">
        <button type="button" class="secondary" data-album-action="open">打开</button>
        <button type="button" class="secondary" data-album-action="add">加入已选</button>
      </div>
    </article>
  `).join('') || '<p class="empty-state">还没有相册。输入名称创建相册，或选中图片后加入相册。</p>';
  renderSelectionSummary();
}

async function createAlbum() {
  const input = $('#albumNameInput');
  const result = $('#albumResult');
  const name = input ? input.value.trim() : '';
  if (!name) {
    if (result) result.textContent = '请输入相册名称。';
    return;
  }
  const data = await request('/api/albums', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (input) input.value = '';
  if (result) result.textContent = `相册“${data.album.name}”已创建。`;
  state.activeAlbumId = data.album.id;
  await refreshAlbums();
  await refreshImages();
  renderAlbumDetail();
  setMainView('albums');
  toast('相册已创建');
}

async function assignSelectedToAlbum() {
  const ids = [...state.selected];
  const activeAlbum = state.albums.find((album) => album.id === state.activeAlbumId);
  if (!ids.length) {
    toast('先在图片页选择要加入相册的图片');
    return;
  }
  if (!activeAlbum) {
    toast('先创建相册或选择一个相册');
    return;
  }
  await request(`/api/albums/${activeAlbum.id}/images`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  if ($('#albumNameInput')) $('#albumNameInput').value = '';
  toast(`已加入相册：${activeAlbum.name}`);
  await refreshAlbums();
  await refreshImages();
  setMainView('albums');
}

async function handleAlbumGridClick(event) {
  const card = event.target.closest('[data-album]');
  if (!card) return;
  const action = event.target.closest('[data-album-action]');
  const albumId = card.dataset.album;
  state.activeAlbumId = albumId;
  if (action && action.dataset.albumAction === 'add') {
    await assignSelectedToAlbum();
    return;
  }
  renderAlbumDetail();
  setMainView('library');
  state.imageOffset = 0;
  await refreshImages();
  const album = state.albums.find((item) => item.id === albumId);
  toast(`已筛选相册：${album ? album.name : ''}`);
}

async function clearAlbumFilter() {
  state.activeAlbumId = '';
  await refreshImages();
  renderAlbums();
  toast('已清除相册筛选');
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

async function saveAlbumMeta() {
  const album = state.albums.find((item) => item.id === state.activeAlbumId);
  if (!album) {
    toast('先选择一个相册');
    return;
  }
  const payload = {
    name: $('#albumEditName').value.trim(),
    description: $('#albumEditDescription').value.trim(),
    sortMode: $('#albumSortMode').value
  };
  const data = await request(`/api/albums/${album.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  $('#albumDetailResult').textContent = `已保存相册：${data.album.name}`;
  await refreshAlbums();
  toast('相册信息已保存');
}

async function setAlbumCoverFromCurrent() {
  const album = state.albums.find((item) => item.id === state.activeAlbumId);
  const image = currentImage();
  if (!album || !image) {
    toast('先选择相册和当前图片');
    return;
  }
  await request(`/api/albums/${album.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ coverImageId: image.id })
  });
  await refreshAlbums();
  toast('相册封面已更新');
}

async function removeCurrentFromAlbum() {
  const album = state.albums.find((item) => item.id === state.activeAlbumId);
  const image = currentImage();
  if (!album || !image) {
    toast('先选择相册和当前图片');
    return;
  }
  await request(`/api/albums/${album.id}/images/${image.id}`, { method: 'DELETE' });
  await refreshAlbums();
  await refreshImages();
  renderAlbumDetail();
  toast('已从相册移除当前图片');
}

async function reorderCurrentAlbumImage(direction) {
  const album = state.albums.find((item) => item.id === state.activeAlbumId);
  const image = currentImage();
  if (!album || !image) {
    toast('先选择相册和当前图片');
    return;
  }
  await request(`/api/albums/${album.id}/reorder`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageId: image.id, direction })
  });
  await refreshAlbums();
  await refreshImages();
  renderAlbumDetail();
  toast(direction === 'up' ? '当前图片已上移' : '当前图片已下移');
}

async function deleteAlbum() {
  const album = state.albums.find((item) => item.id === state.activeAlbumId);
  if (!album) {
    toast('先选择一个相册');
    return;
  }
  if (!confirm(`确定删除相册 ${album.name} 吗？`)) return;
  await request(`/api/albums/${album.id}`, { method: 'DELETE' });
  state.activeAlbumId = '';
  await refreshAlbums();
  await refreshImages();
  toast('相册已删除');
}

async function handleTrashListClick(event) {
  const card = event.target.closest('[data-trash-id]');
  const action = event.target.closest('[data-trash-action]');
  if (!card || !action) return;
  const id = card.dataset.trashId;
  if (action.dataset.trashAction === 'restore') {
    await request(`/api/trash/${id}/restore`, { method: 'POST' });
    await refresh();
    toast('图片已恢复');
    return;
  }
  if (!confirm('确定彻底删除这张图片吗？')) return;
  await request(`/api/trash/${id}`, { method: 'DELETE' });
  await refreshTrash();
  toast('图片已彻底删除');
}

async function emptyTrash() {
  if (!state.trashItems.length) {
    toast('回收站已经是空的');
    return;
  }
  if (!confirm(`确定清空回收站中的 ${state.trashItems.length} 项吗？`)) return;
  await request('/api/trash/empty', { method: 'POST' });
  await refreshTrash();
  toast('回收站已清空');
}

async function sendTelegramTest() {
  const result = $('#telegramTestResult');
  if (result) result.textContent = '正在发送测试消息...';
  try {
    const data = await request('/api/integrations/telegram/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chatId: $('#telegramTestChatId') ? $('#telegramTestChatId').value.trim() : '',
        message: $('#telegramTestMessage') ? $('#telegramTestMessage').value.trim() : ''
      })
    });
    if (result) result.textContent = `测试消息已发送：${data.result && data.result.result ? data.result.result.message_id : 'ok'}`;
    await refreshTelegramStatus();
    toast('Telegram 测试消息已发送');
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

async function migrateStorageData() {
  const result = $('#storageMigrateResult');
  if (result) result.textContent = '正在迁移已有文件...';
  try {
    const data = await request('/api/integrations/storage/migrate', { method: 'POST' });
    if (result) {
      result.textContent = data.failed && data.failed.length
        ? `迁移完成，成功 ${data.migrated.length}，失败 ${data.failed.length}`
        : `迁移完成，成功 ${data.migrated.length} 个文件`;
    }
    await refreshStorageStatus();
    toast(data.failed && data.failed.length ? '迁移已完成，但存在失败项' : '存储迁移已完成');
  } catch (error) {
    if (result) result.textContent = error.message;
    toast(error.message);
  }
}

async function downloadSelected() {
  const ids = [...state.selected];
  if (!ids.length) {
    toast('先选择图片');
    return;
  }
  const response = await fetch('/api/images/download', {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({ ids })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(humanizeError(data.error || '下载失败'));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `telepic-export-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`已开始下载 ${ids.length} 张图片`);
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
  ensureThemeLibrarySeed();
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  renderThemeStore();
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
  const actionButton = event.target.closest('[data-theme-action]');
  if (actionButton) {
    event.preventDefault();
    event.stopPropagation();
    const themeId = actionButton.dataset.themeId;
    const action = actionButton.dataset.themeAction;
    if (action === 'apply') applyThemeFromCard(themeId);
    if (action === 'install') installThemeById(themeId);
    if (action === 'clone') cloneThemeToLibrary(themeId);
    return;
  }

  const button = event.target.closest('.theme-card-main[data-theme-id], .theme-card[data-theme-id]');
  if (!button) return;
  applyThemeFromCard(button.dataset.themeId);
}

function applyPresetTheme(preset) {
  if (!THEME_PRESETS[preset]) return;
  const themePack = themePackForPreset(preset);
  state.theme = normalizeTheme(themePack || { ...state.theme, preset, ...THEME_PRESETS[preset] });
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(preset);
  persistTheme();
}

function applyThemeFromCard(themeId) {
  const theme = themeLibraryList().find((item) => item.id === themeId);
  if (!theme) return;
  state.theme = normalizeTheme(theme);
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  toast(`已切换到${state.theme.label}主题`);
}

async function installThemeById(themeId) {
  const theme = themeLibraryList().find((item) => item.id === themeId);
  if (!theme) return;
  const installedTheme = normalizeTheme({
    ...theme,
    source: 'installed',
    preset: theme.preset === 'custom' ? 'custom' : theme.preset
  });
  upsertThemeInLibrary(installedTheme);
  state.theme = installedTheme;
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  renderThemeStore();
  refreshConfig().catch(() => {});
  toast(`已将 ${state.theme.label} 安装到我的主题`);
}

async function cloneThemeToLibrary(themeId) {
  const theme = themeLibraryList().find((item) => item.id === themeId);
  if (!theme) return;
  const cloned = normalizeTheme({
    ...theme,
    id: normalizeThemeId(`${theme.id}-copy`),
    label: `${theme.label} 副本`,
    author: state.adminUsername || '本地用户',
    source: 'installed',
    preset: 'custom'
  });
  state.theme = cloned;
  upsertThemeInLibrary(cloned);
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks('custom');
  persistTheme();
  renderThemeStore();
  refreshConfig().catch(() => {});
  toast(`已复制 ${theme.label} 到我的主题`);
}

async function saveThemeFromInputs() {
  state.theme = {
    id: state.theme.id || `custom_${Date.now().toString(36)}`,
    preset: 'custom',
    label: ($('#themeLabel') && $('#themeLabel').value.trim()) || state.theme.label || '自定义主题',
    author: ($('#themeAuthor') && $('#themeAuthor').value.trim()) || state.theme.author || '本地用户',
    category: state.theme.category || '自定义',
    description: ($('#themeDescription') && $('#themeDescription').value.trim()) || state.theme.description || '',
    cover: state.theme.cover || '',
    bg: $('#themeBg').value,
    panel: $('#themePanel').value,
    ink: $('#themeInk').value,
    accent: $('#themeAccent').value,
    danger: $('#themeDanger').value,
    backdrop: state.theme.backdrop || THEME_PRESETS.gallery.backdrop,
    overlay: state.theme.overlay || THEME_PRESETS.gallery.overlay,
    panelAlpha: state.theme.panelAlpha || THEME_PRESETS.gallery.panelAlpha,
    blur: state.theme.blur || THEME_PRESETS.gallery.blur,
    image: state.theme.image || '',
    source: 'installed'
  };
  applyTheme(state.theme);
  syncThemeQuickPicks('custom');
  persistTheme();
  $('#themePreset').value = 'custom';
  await saveThemeToCloud();
  refreshConfig().catch(() => {});
}

function resetThemePreset() {
  const preset = $('#themePreset').value === 'custom' ? 'gallery' : $('#themePreset').value;
  if (preset !== 'custom' && THEME_PRESETS[preset]) {
    applyPresetTheme(preset);
    toast('已恢复当前预设');
    return;
  }
  state.theme = normalizeTheme(themePackForPreset('gallery'));
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  toast('已恢复默认主题');
}

function previewCustomTheme() {
  const preview = {
    id: state.theme.id || `custom_${Date.now().toString(36)}`,
    preset: 'custom',
    label: ($('#themeLabel') && $('#themeLabel').value.trim()) || state.theme.label || '自定义主题',
    author: ($('#themeAuthor') && $('#themeAuthor').value.trim()) || state.theme.author || '本地用户',
    category: state.theme.category || '自定义',
    description: ($('#themeDescription') && $('#themeDescription').value.trim()) || state.theme.description || '',
    cover: state.theme.cover || '',
    bg: $('#themeBg').value,
    panel: $('#themePanel').value,
    ink: $('#themeInk').value,
    accent: $('#themeAccent').value,
    danger: $('#themeDanger').value,
    backdrop: state.theme.backdrop || THEME_PRESETS.gallery.backdrop,
    overlay: state.theme.overlay || THEME_PRESETS.gallery.overlay,
    panelAlpha: state.theme.panelAlpha || THEME_PRESETS.gallery.panelAlpha,
    blur: state.theme.blur || THEME_PRESETS.gallery.blur,
    image: state.theme.image || '',
    source: 'custom'
  };
  applyTheme(preview, false);
  $('#themePreset').value = 'custom';
  syncThemeQuickPicks('custom');
  $('#themeBadge').textContent = '自定义';
}

function handleThemeBackgroundUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('请选择图片文件');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast('背景图片建议小于 2 MiB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.theme = {
      ...state.theme,
      preset: 'custom',
      cover: String(reader.result || ''),
      image: String(reader.result || ''),
      source: 'custom'
    };
    applyTheme(state.theme);
    syncThemeQuickPicks('custom');
    persistTheme();
    $('#themePreset').value = 'custom';
    setThemeStorageState('背景图待保存');
    toast('背景图片已应用，点击保存主题同步到云端');
  };
  reader.onerror = () => toast('背景图片读取失败');
  reader.readAsDataURL(file);
}

function clearThemeBackground() {
  state.theme = { ...state.theme, image: '', source: state.theme.source || 'custom' };
  applyTheme(state.theme);
  persistTheme();
  const input = $('#themeBackgroundFile');
  if (input) input.value = '';
  setThemeStorageState('背景图待保存');
  toast('背景图片已移除，点击保存主题同步到云端');
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
  root.style.setProperty('--panel-bg', hexToRgba(theme.panel, theme.image ? Math.min(theme.panelAlpha || 0.88, 0.68) : (theme.panelAlpha || 0.88)));
  root.style.setProperty('--panel-blur', `${theme.image ? Math.max(theme.blur || 16, 24) : (theme.blur || 16)}px`);
  root.style.setProperty('--theme-image', theme.image ? `url("${theme.image}")` : 'none');
  root.style.setProperty('--theme-backdrop', theme.backdrop || THEME_PRESETS.gallery.backdrop);
  root.style.setProperty('--theme-overlay', theme.image
    ? 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))'
    : (theme.overlay || 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))'));
  root.style.setProperty('--shadow', luminance(theme.bg) < 0.35
    ? '0 18px 44px rgba(0, 0, 0, 0.38)'
    : '0 16px 34px rgba(16, 24, 40, 0.10)');
  document.body.classList.toggle('theme-dark', luminance(theme.bg) < 0.35);
  document.body.classList.toggle('theme-photo', Boolean(theme.image));
  $('#themeBadge').textContent = theme.label || themeName(theme.preset);
  renderThemePreview(theme);
  renderThemeStore();
  syncThemeQuickPicks(theme.preset);
}

function themePackForPreset(preset) {
  const installed = state.themeLibrary.find((item) => item.preset === preset || item.id === preset);
  if (installed) return { ...installed };
  if (RECOMMENDED_THEME_PACKS[preset]) return { ...RECOMMENDED_THEME_PACKS[preset] };
  return THEME_LIBRARY[preset] ? { ...THEME_LIBRARY[preset] } : null;
}

function enrichTheme(theme) {
  const base = theme && theme.preset && THEME_LIBRARY[theme.preset] ? THEME_LIBRARY[theme.preset] : null;
  const recommended = theme && theme.id && RECOMMENDED_THEME_PACKS[theme.id] ? RECOMMENDED_THEME_PACKS[theme.id] : null;
  const builtin = theme && theme.id && THEME_LIBRARY[theme.id] ? THEME_LIBRARY[theme.id] : null;
  const resolvedBase = recommended || builtin || base;
  const themeId = String(theme && theme.id || resolvedBase && resolvedBase.id || `custom_${Date.now().toString(36)}`);
  const source = String(
    theme && theme.source
    || (builtin ? 'builtin' : '')
    || (recommended ? 'recommended' : '')
    || (theme && theme.id && theme.id.startsWith('custom_') ? 'custom' : '')
    || (theme && theme.preset === 'custom' ? 'installed' : '')
    || (base ? 'builtin' : 'custom')
  );
  return {
    id: themeId,
    preset: String(theme && theme.preset || resolvedBase && resolvedBase.preset || 'custom'),
    label: String(theme && theme.label || resolvedBase && resolvedBase.label || '自定义主题'),
    author: String(theme && theme.author || resolvedBase && resolvedBase.author || '本地用户'),
    category: String(theme && theme.category || resolvedBase && resolvedBase.category || '自定义'),
    description: String(theme && theme.description || resolvedBase && resolvedBase.description || ''),
    cover: String(theme && theme.cover || resolvedBase && resolvedBase.cover || ''),
    source,
    bg: theme.bg,
    panel: theme.panel,
    ink: theme.ink,
    accent: theme.accent,
    danger: theme.danger,
    backdrop: theme.backdrop,
    overlay: theme.overlay,
    panelAlpha: theme.panelAlpha,
    blur: theme.blur,
    image: theme.image || ''
  };
}

function themeLibraryList() {
  const installedIds = new Set(state.themeLibrary.map((theme) => String(theme.id)));
  const installed = state.themeLibrary.map((theme) => enrichTheme({ ...theme, source: 'installed' }));
  const builtin = Object.values(THEME_LIBRARY).map((theme) => enrichTheme({ ...theme, source: 'builtin' }));
  const recommended = Object.values(RECOMMENDED_THEME_PACKS)
    .filter((theme) => !installedIds.has(theme.id))
    .map((theme) => enrichTheme({ ...theme, source: 'recommended' }));
  const current = enrichTheme(state.theme);
  const combined = [...installed, ...builtin, ...recommended];
  if (combined.some((theme) => theme.id === current.id)) return dedupeThemes(combined);
  return dedupeThemes([{ ...current, source: current.source || 'custom' }, ...combined]);
}

function renderThemeStore() {
  const showcase = $('#themeShowcase');
  const store = $('#themeQuickPicks');
  const meta = $('#themeLibraryMeta');
  const theme = enrichTheme(state.theme);
  const themes = themeLibraryList();
  const installedCount = state.themeLibrary.length;
  const recommendedCount = Object.keys(RECOMMENDED_THEME_PACKS).length;
  if (showcase) {
    showcase.innerHTML = `
      <div class="theme-showcase-cover" style="background:${escapeHtml(theme.backdrop || theme.bg)}; ${theme.image ? `background-image:url('${escapeHtml(theme.image)}'); background-size:cover; background-position:center;` : ''}"></div>
      <div class="theme-showcase-body">
        <strong>${escapeHtml(theme.label)}</strong>
        <span>${escapeHtml(theme.author || '本地用户')} · ${escapeHtml(theme.category || '自定义')} · ${escapeHtml(THEME_SOURCE_LABELS[theme.source] || '主题')}</span>
        <p>${escapeHtml(theme.description || '可在这里编辑、保存并导入导出完整主题包。')}</p>
      </div>
    `;
  }
  if (meta) {
    meta.innerHTML = `
      <div class="theme-meta-card">
        <strong>${installedCount}</strong>
        <span>我的主题</span>
      </div>
      <div class="theme-meta-card">
        <strong>${recommendedCount}</strong>
        <span>推荐主题</span>
      </div>
      <div class="theme-meta-card">
        <strong>${state.adminToken ? '已连接' : '未登录'}</strong>
        <span>${theme.source === 'recommended' ? '当前可安装' : '云端同步状态'}</span>
      </div>
    `;
  }
  if (store) {
    store.innerHTML = themes.map((item) => {
      const active = item.id === theme.id;
      const installed = isThemeInstalled(item.id);
      const builtin = item.source === 'builtin';
      const recommendedTheme = item.source === 'recommended';
      const secondaryLabel = recommendedTheme ? (installed ? '已安装' : '安装到我的主题') : '复制到我的主题';
      return `
        <article class="theme-card ${active ? 'is-active' : ''}" data-theme-id="${escapeHtml(item.id)}" data-theme-source="${escapeHtml(item.source || '')}">
          <button type="button" class="theme-card-main" data-theme-id="${escapeHtml(item.id)}">
            <span class="theme-card-cover" style="background:${escapeHtml(item.backdrop || item.bg)}; ${item.image ? `background-image:url('${escapeHtml(item.image)}'); background-size:cover; background-position:center;` : ''}"></span>
            <span class="theme-card-body">
              <strong>${escapeHtml(item.label)}</strong>
              <span class="theme-card-meta">${escapeHtml(item.author || 'Telepic')}</span>
              <span class="theme-card-desc">${escapeHtml(item.description || '')}</span>
            </span>
          </button>
          <div class="theme-card-actions">
            <small>${escapeHtml(THEME_SOURCE_LABELS[item.source] || item.category || '主题')}</small>
            <span class="theme-card-buttons">
              <button type="button" class="secondary" data-theme-action="apply" data-theme-id="${escapeHtml(item.id)}">${active ? '当前使用' : '启用'}</button>
              ${!builtin ? `<button type="button" class="secondary" data-theme-action="${recommendedTheme && !installed ? 'install' : 'clone'}" data-theme-id="${escapeHtml(item.id)}">${escapeHtml(secondaryLabel)}</button>` : ''}
            </span>
          </div>
        </article>
      `;
    }).join('');
  }
}

function exportThemePack() {
  const theme = enrichTheme(state.theme);
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(theme.label || 'telepic-theme').replace(/[\/:*?"<>|]+/g, '-').slice(0, 60)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('主题包已导出');
}

function importThemePack(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      state.theme = normalizeTheme(parsed);
      upsertThemeInLibrary(state.theme, false);
      applyTheme(state.theme);
      syncThemeInputs(state.theme);
      syncThemeQuickPicks(state.theme.preset);
      renderThemeStore();
      persistTheme();
      $('#themePreset').value = state.theme.preset || 'custom';
      toast('主题包已导入');
    } catch (error) {
      toast('主题包导入失败');
    }
    event.target.value = '';
  };
  reader.onerror = () => {
    toast('主题包读取失败');
    event.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
}

function syncThemeInputs(theme) {
  $('#themePreset').value = theme.preset || 'gallery';
  $('#themeBg').value = theme.bg;
  $('#themePanel').value = theme.panel;
  $('#themeInk').value = theme.ink;
  $('#themeAccent').value = theme.accent;
  $('#themeDanger').value = theme.danger;
  if ($('#themeLabel')) $('#themeLabel').value = theme.label || '';
  if ($('#themeAuthor')) $('#themeAuthor').value = theme.author || '';
  if ($('#themeDescription')) $('#themeDescription').value = theme.description || '';
  setThemeStorageState(theme.image ? '已设置背景图' : '预设背景');
}

function persistTheme() {
  safeStorageSet(localStorage, 'telepic.theme', JSON.stringify(state.theme));
  safeStorageSet(localStorage, 'telepic.themeLibrary', JSON.stringify(state.themeLibrary));
}

async function loadServerTheme() {
  const data = await request('/api/settings/theme');
  if (Array.isArray(data.library) && data.library.length) {
    state.themeLibrary = mergeThemeLibraries(data.library);
  } else if (!state.themeLibrary.length) {
    state.themeLibrary = [];
  }
  if (!data.theme) {
    setThemeStorageState('暂无云端主题');
    renderThemeStore();
    return;
  }
  state.theme = normalizeTheme(data.theme);
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  setThemeStorageState('云端主题已加载');
}

async function saveThemeToCloud() {
  if (!state.adminToken) {
    setThemeStorageState('登录后可云端保存');
    toast('请先登录管理员账号再保存到云端');
    return;
  }
  upsertThemeInLibrary(state.theme, false);
  const data = await request('/api/settings/theme', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ theme: state.theme, library: state.themeLibrary })
  });
  state.theme = normalizeTheme(data.theme || state.theme);
  state.themeLibrary = mergeThemeLibraries(data.library || []);
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  setThemeStorageState('已云端保存');
  refreshConfig().catch(() => {});
  toast('主题已保存到云端');
}

async function installCurrentTheme() {
  state.theme = normalizeTheme({
    ...state.theme,
    preset: 'custom',
    id: normalizeThemeId(state.theme.id || state.theme.label || `theme_${Date.now().toString(36)}`),
    label: ($('#themeLabel') && $('#themeLabel').value.trim()) || state.theme.label || '自定义主题',
    author: ($('#themeAuthor') && $('#themeAuthor').value.trim()) || state.theme.author || '本地用户',
    category: state.theme.category || '自定义',
    description: ($('#themeDescription') && $('#themeDescription').value.trim()) || state.theme.description || ''
  });
  upsertThemeInLibrary(state.theme);
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  renderThemeStore();
  persistTheme();
  refreshConfig().catch(() => {});
  toast('主题已加入商店');
}

async function removeCurrentTheme() {
  if (!state.theme.id) {
    toast('当前主题无法移除');
    return;
  }
  if (Object.prototype.hasOwnProperty.call(THEME_LIBRARY, state.theme.id)) {
    toast('内置主题不能移除');
    return;
  }
  const nextLibrary = state.themeLibrary.filter((item) => item.id !== state.theme.id);
  if (nextLibrary.length === state.themeLibrary.length) {
    toast('当前主题未安装到商店');
    return;
  }
  state.themeLibrary = nextLibrary;
  state.theme = normalizeTheme(themePackForPreset('gallery'));
  applyTheme(state.theme);
  syncThemeInputs(state.theme);
  syncThemeQuickPicks(state.theme.preset);
  persistTheme();
  renderThemeStore();
  refreshConfig().catch(() => {});
  if (state.adminToken) await saveThemeToCloud();
  else setThemeStorageState('本地商店已更新');
  toast('主题已从商店移除');
}

function setThemeStorageState(text) {
  const el = $('#themeStorageState');
  if (el) el.textContent = text;
}

function normalizeTheme(theme) {
  theme = theme && typeof theme === 'object' ? theme : {};
  const preset = theme.preset && THEME_PRESETS[theme.preset] ? theme.preset : 'custom';
  if (preset !== 'custom') {
    return enrichTheme({ ...theme, preset, ...THEME_PRESETS[preset], image: theme.image || '', cover: theme.cover || theme.image || '' });
  }
  return enrichTheme({
    id: String(theme.id || `custom_${Date.now().toString(36)}`),
    preset: 'custom',
    label: String(theme.label || '自定义主题'),
    author: String(theme.author || '本地用户'),
    category: String(theme.category || '自定义'),
    description: String(theme.description || ''),
    cover: String(theme.cover || theme.image || ''),
    source: String(theme.source || 'custom'),
    bg: normalizeColor(theme.bg, THEME_PRESETS.gallery.bg),
    panel: normalizeColor(theme.panel, THEME_PRESETS.gallery.panel),
    ink: normalizeColor(theme.ink, THEME_PRESETS.gallery.ink),
    accent: normalizeColor(theme.accent, THEME_PRESETS.gallery.accent),
    danger: normalizeColor(theme.danger, THEME_PRESETS.gallery.danger),
    backdrop: theme.backdrop || THEME_PRESETS.gallery.backdrop,
    overlay: theme.overlay || THEME_PRESETS.gallery.overlay,
    panelAlpha: theme.panelAlpha || THEME_PRESETS.gallery.panelAlpha,
    blur: theme.blur || THEME_PRESETS.gallery.blur,
    image: theme.image || ''
  });
}

function ensureThemeLibrarySeed() {
  state.themeLibrary = mergeThemeLibraries(state.themeLibrary);
}

function mergeThemeLibraries(list) {
  const merged = [];
  const seen = new Set();
  (Array.isArray(list) ? list : []).forEach((theme) => {
    const normalized = normalizeTheme(theme);
    if (Object.prototype.hasOwnProperty.call(THEME_LIBRARY, normalized.id)) return;
    if (!normalized.id || seen.has(normalized.id)) return;
    seen.add(normalized.id);
    merged.push(normalized);
  });
  return merged;
}

function dedupeThemes(list) {
  const seen = new Set();
  const output = [];
  (Array.isArray(list) ? list : []).forEach((theme) => {
    const normalized = enrichTheme(theme);
    if (!normalized.id || seen.has(normalized.id)) return;
    seen.add(normalized.id);
    output.push(normalized);
  });
  return output;
}

function isThemeInstalled(themeId) {
  return state.themeLibrary.some((item) => item.id === themeId);
}

function normalizeThemeId(value) {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || `theme_${Date.now().toString(36)}`;
}

function upsertThemeInLibrary(theme, persistCloud = true) {
  const normalized = normalizeTheme(theme);
  const index = state.themeLibrary.findIndex((item) => item.id === normalized.id);
  if (index === -1) state.themeLibrary.unshift(normalized);
  else state.themeLibrary.splice(index, 1, normalized);
  state.themeLibrary = mergeThemeLibraries(state.themeLibrary);
  if (!persistCloud) return;
  if (state.adminToken) {
    saveThemeToCloud().catch((error) => {
      setThemeStorageState('云端商店保存失败');
      setRuntimeStatus(`主题商店保存失败：${error.message}`);
    });
  } else {
    setThemeStorageState('已加入本地商店，登录后可同步云端');
  }
}

function syncThemeQuickPicks(preset) {
  const buttons = document.querySelectorAll('[data-theme-id], [data-theme-preset]');
  if (!buttons.length) return;
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themePreset === preset || button.dataset.themeId === state.theme.id);
  });
}

function renderThemePreview(theme) {
  const preview = $('#themePreview');
  if (!preview) return;
  preview.innerHTML = `
    ${theme.image ? `<div class="theme-preview-image" style="background-image:url('${escapeHtml(theme.image)}')"></div>` : ''}
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.bg)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.panel)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.ink)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.accent)}"></div>
    <div class="theme-preview-swatch" style="background:${escapeHtml(theme.danger)}"></div>
    <div class="theme-preview-label">${escapeHtml(theme.label || themeName(theme.preset))} · ${theme.image ? '自定义背景图' : '预设风格背景'}</div>
  `;
}

function loadTheme() {
  try {
    const raw = safeStorageGet(localStorage, 'telepic.theme', '');
    if (!raw) return { preset: 'gallery', ...THEME_PRESETS.gallery };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { preset: 'gallery', ...THEME_PRESETS.gallery };
    if (parsed.preset && THEME_PRESETS[parsed.preset] && parsed.preset !== 'custom') {
      return { ...parsed, preset: parsed.preset, ...THEME_PRESETS[parsed.preset], image: parsed.image || '' };
    }
    return normalizeTheme(parsed);
  } catch {
    return { preset: 'gallery', ...THEME_PRESETS.gallery };
  }
}

function loadStoredThemeLibrary() {
  try {
    const raw = safeStorageGet(localStorage, 'telepic.themeLibrary', '');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  if (message.includes('Invalid username or password')) {
    return '用户名或密码不正确。';
  }
  if (message.includes('Current password is incorrect')) {
    return '当前密码不正确。';
  }
  if (message.includes('New password must be between')) {
    return '新密码长度需要在 8 到 200 个字符之间。';
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

function normalizeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
}

function hexToRgb(hex) {
  const value = normalizeColor(hex, '#000000').replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '';
}

function themeName(preset) {
  if (preset === 'gallery') return '艺廊白';
  if (preset === 'coast') return '海岸玻璃';
  if (preset === 'studio') return '影棚灰';
  if (preset === 'dusk') return '暮色柔光';
  if (preset === 'focus') return '暗场工作台';
  if (preset === 'botanical') return '植物玻璃';
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
