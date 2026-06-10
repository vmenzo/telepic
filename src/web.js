const { escapeHtml } = require('./utils');
const assetVersion = Date.now();

function htmlPage(config) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Telepic 图床</title>
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersion}">
</head>
<body class="app-body">
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">TP</div>
        <div class="brand-copy">
          <p class="eyebrow">Image Hosting</p>
          <h1>Telepic 图床</h1>
          <p class="brand-text">自托管图片资产库与 Telegram 管理台</p>
        </div>
      </div>

      <section class="side-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">上传入口</p>
            <h2>快速入库</h2>
          </div>
          <span id="uploadAuthBadge" class="badge">文件 / URL</span>
        </div>
        <div id="uploadGateHint" class="notice-box"></div>
        <label class="dropzone" id="dropzone">
          <input id="fileInput" type="file" accept="image/*" multiple>
          <span class="dropzone-title">点击或拖拽上传图片</span>
          <span class="dropzone-sub">支持多文件、粘贴上传、截图直传</span>
        </label>
        <div class="inline-form">
          <input id="fetchUrlInput" class="wide-input" placeholder="粘贴图片 URL 后抓取">
          <button id="fetchUrlButton">抓取</button>
        </div>
        <div id="fetchUrlResult" class="result-box"></div>
        <div id="uploadResult" class="result-box result-log"></div>
      </section>

      <section class="side-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Bot 联动</p>
            <h2>Telegram 控制台</h2>
          </div>
          <span id="telegramBadge" class="badge">检测中</span>
        </div>
        <p id="telegramHint" class="hint"></p>
        <div class="command-list">
          <code>/panel</code>
          <code>/list</code>
          <code>/view</code>
          <code>/search</code>
          <code>/delete</code>
          <code>/token</code>
        </div>
        <pre id="telegramWebhook" class="mono-box"></pre>
      </section>

      <section class="side-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">外观</p>
            <h2>主题实验室</h2>
          </div>
          <span id="themeBadge" class="badge">森绿</span>
        </div>
        <div class="theme-stack">
          <div id="themeQuickPicks" class="theme-preset-grid">
            <button type="button" class="theme-preset is-active" data-theme-preset="forest">
              <span class="theme-preset-name">森绿</span>
              <span class="theme-preset-swatches">
                <i style="background:#edf3ef"></i><i style="background:#237a57"></i><i style="background:#c0463a"></i>
              </span>
            </button>
            <button type="button" class="theme-preset" data-theme-preset="graphite">
              <span class="theme-preset-name">石墨</span>
              <span class="theme-preset-swatches">
                <i style="background:#eef2f6"></i><i style="background:#326aa1"></i><i style="background:#bf4b3d"></i>
              </span>
            </button>
            <button type="button" class="theme-preset" data-theme-preset="paper">
              <span class="theme-preset-name">纸白</span>
              <span class="theme-preset-swatches">
                <i style="background:#f7f3eb"></i><i style="background:#8e6743"></i><i style="background:#b84e3e"></i>
              </span>
            </button>
            <button type="button" class="theme-preset" data-theme-preset="midnight">
              <span class="theme-preset-name">夜幕</span>
              <span class="theme-preset-swatches">
                <i style="background:#0f141c"></i><i style="background:#42b58d"></i><i style="background:#ef7868"></i>
              </span>
            </button>
            <button type="button" class="theme-preset" data-theme-preset="copper">
              <span class="theme-preset-name">铜橙</span>
              <span class="theme-preset-swatches">
                <i style="background:#f6eee7"></i><i style="background:#bf6a2f"></i><i style="background:#b54034"></i>
              </span>
            </button>
            <button type="button" class="theme-preset" data-theme-preset="ocean">
              <span class="theme-preset-name">海港</span>
              <span class="theme-preset-swatches">
                <i style="background:#eaf2f7"></i><i style="background:#1f6f8b"></i><i style="background:#cc5b48"></i>
              </span>
            </button>
          </div>
          <select id="themePreset">
            <option value="forest">森绿</option>
            <option value="graphite">石墨</option>
            <option value="paper">纸白</option>
            <option value="midnight">夜幕</option>
            <option value="copper">铜橙</option>
            <option value="ocean">海港</option>
            <option value="custom">自定义</option>
          </select>
          <div class="theme-grid">
            <label><span>背景</span><input id="themeBg" type="color" value="#eef3f1" aria-label="背景色"></label>
            <label><span>面板</span><input id="themePanel" type="color" value="#ffffff" aria-label="面板色"></label>
            <label><span>文字</span><input id="themeInk" type="color" value="#172026" aria-label="文字色"></label>
            <label><span>强调</span><input id="themeAccent" type="color" value="#237a57" aria-label="强调色"></label>
            <label><span>危险</span><input id="themeDanger" type="color" value="#c0463a" aria-label="危险色"></label>
          </div>
          <div class="actions actions-split">
            <button id="saveTheme" class="secondary">保存主题</button>
            <button id="resetTheme" class="secondary">恢复预设</button>
          </div>
          <div id="themePreview" class="theme-preview"></div>
        </div>
      </section>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="topbar-copy">
          <p class="eyebrow">运营后台</p>
          <h2>图片资产控制台</h2>
          <p class="topbar-text">统一管理上传、权限、标签、对象存储和 Telegram 机器人操作。</p>
        </div>
        <div class="topbar-tools">
          <div class="service-chip">
            <span class="status-dot"></span>
            <span>本地服务在线</span>
          </div>
          <div class="token-box">
            <input id="adminToken" type="password" placeholder="管理员密钥">
            <button id="saveToken">保存</button>
          </div>
          <div id="adminState" class="mini-note">未保存管理员密钥</div>
          <div id="runtimeStatus" class="mini-note">前端脚本加载中</div>
        </div>
      </header>

      <div id="flashMessage" class="flash-bar">准备就绪</div>

      <section class="overview-strip">
        <article class="metric-card">
          <small>图片总数</small>
          <strong id="statImages">0</strong>
        </article>
        <article class="metric-card">
          <small>公开图片</small>
          <strong id="statPublic">0</strong>
        </article>
        <article class="metric-card">
          <small>私有图片</small>
          <strong id="statPrivate">0</strong>
        </article>
        <article class="metric-card">
          <small>占用空间</small>
          <strong id="statBytes">0 B</strong>
        </article>
        <article class="metric-card">
          <small>API 密钥</small>
          <strong id="statTokens">0</strong>
        </article>
        <article class="metric-card">
          <small>Telegram</small>
          <strong id="statTelegram">未启用</strong>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="dashboard-panel dashboard-panel-accent">
          <div class="panel-head compact">
            <div>
              <p class="panel-kicker">可见性分布</p>
              <h2>公开 / 私有</h2>
            </div>
          </div>
          <div class="ring-layout">
            <div id="visibilityChart" class="ring-chart">
              <div class="ring-center">
                <strong id="visibilityRate">0%</strong>
                <span>公开率</span>
              </div>
            </div>
            <div id="visibilityLegend" class="chart-legend"></div>
          </div>
        </article>

        <article class="dashboard-panel">
          <div class="panel-head compact">
            <div>
              <p class="panel-kicker">来源统计</p>
              <h2>上传来源结构</h2>
            </div>
          </div>
          <div id="sourceChart" class="source-chart"></div>
        </article>

        <article class="dashboard-panel">
          <div class="panel-head compact">
            <div>
              <p class="panel-kicker">运行状态</p>
              <h2>服务概览</h2>
            </div>
          </div>
          <div id="statusOverview" class="status-overview"></div>
        </article>
      </section>

      <section class="content-grid">
        <section class="library-shell">
          <div class="section-head">
            <div>
              <p class="panel-kicker">媒体库</p>
              <h2>图片资产列表</h2>
              <p class="section-text">更适合长期运营的表格式视图，支持筛选、批量操作、链接复制和状态切换。</p>
            </div>
            <div class="actions">
              <button id="refreshImages" class="secondary">刷新列表</button>
              <button id="bulkPublic" class="secondary">批量公开</button>
              <button id="bulkPrivate" class="secondary">批量私有</button>
              <button id="bulkDelete" class="danger">批量删除</button>
            </div>
          </div>

          <div class="filter-bar">
            <input id="searchInput" placeholder="搜索文件名、ID、来源">
            <input id="tagFilter" placeholder="按标签筛选">
            <select id="visibilityFilter">
              <option value="">全部可见性</option>
              <option value="public">公开</option>
              <option value="private">私有</option>
            </select>
            <select id="sourceFilter">
              <option value="">全部来源</option>
              <option value="api">网页/API</option>
              <option value="url">URL 抓图</option>
              <option value="telegram">Telegram</option>
            </select>
            <select id="sortFilter">
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
              <option value="name">按名称</option>
              <option value="size-desc">按大小降序</option>
              <option value="size-asc">按大小升序</option>
            </select>
            <select id="linkFormat">
              <option value="page">页面链接</option>
              <option value="raw">直链</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
              <option value="bbcode">BBCode</option>
            </select>
          </div>

          <div class="selection-bar">
            <div class="selection-copy">
              <strong id="selectionSummary">未选择图片</strong>
              <span id="sourceSummary" class="muted-text"></span>
            </div>
            <div class="actions">
              <button id="selectAllVisible" class="secondary">全选当前结果</button>
              <button id="clearSelection" class="secondary">清空选择</button>
              <button id="copySelectedLinks" class="secondary">复制已选链接</button>
            </div>
          </div>

          <div class="batch-row">
            <span id="batchTagBadge" class="badge">未选择</span>
            <input id="batchTagsInput" class="wide-input" placeholder="批量标签：标签1, 标签2, 标签3">
            <button id="applyBatchTags" class="secondary">覆盖标签</button>
            <button id="clearBatchTags" class="secondary">清空标签</button>
          </div>

          <div class="asset-table">
            <div class="asset-table-head">
              <span>选择</span>
              <span>文件</span>
              <span>元信息</span>
              <span>链接预览</span>
              <span>操作</span>
            </div>
            <div id="gallery" class="asset-table-body"></div>
          </div>
        </section>

        <aside class="inspector-shell">
          <div id="inspectorTabs" class="inspector-tabs">
            <button class="tab-button is-active" data-pane="detail">详情</button>
            <button class="tab-button" data-pane="system">系统</button>
            <button class="tab-button" data-pane="events">日志</button>
            <button class="tab-button" data-pane="tokens">密钥</button>
          </div>

          <section id="pane-detail" class="inspector-pane is-active">
            <div class="pane-head">
              <div>
                <p class="panel-kicker">检查器</p>
                <h2>图片详情</h2>
              </div>
              <span id="detailBadge" class="badge">未选中</span>
            </div>
            <div id="imageDetail" class="detail-panel">
              <p class="empty-state">点击列表中的任意图片，在这里查看预览、编辑名称和标签、复制不同格式的链接。</p>
            </div>
          </section>

          <section id="pane-system" class="inspector-pane">
            <div class="pane-head">
              <div>
                <p class="panel-kicker">环境信息</p>
                <h2>系统配置</h2>
              </div>
              <span id="storageBadge" class="badge">检测中</span>
            </div>
            <div id="systemConfig" class="config-list"></div>
            <div class="api-panel">
              <div class="panel-head compact">
                <div>
                  <p class="panel-kicker">开放接口</p>
                  <h2>快速 API</h2>
                </div>
              </div>
              <pre id="apiExample" class="mono-box"></pre>
            </div>
          </section>

          <section id="pane-events" class="inspector-pane">
            <div class="pane-head">
              <div>
                <p class="panel-kicker">审计日志</p>
                <h2>最近操作</h2>
              </div>
              <button id="refreshEvents" class="secondary">刷新</button>
            </div>
            <div id="events" class="events"></div>
          </section>

          <section id="pane-tokens" class="inspector-pane">
            <div class="pane-head">
              <div>
                <p class="panel-kicker">访问控制</p>
                <h2>API 密钥</h2>
              </div>
              <button id="createToken">创建</button>
            </div>
            <input id="tokenName" class="wide-input" placeholder="密钥名称">
            <div class="token-scope-row">
              <label class="checkline"><input id="scopeUpload" type="checkbox" checked> 上传</label>
              <label class="checkline"><input id="scopeManage" type="checkbox"> 管理</label>
            </div>
            <div id="tokenResult" class="result-box"></div>
            <div id="tokens" class="tokens"></div>
          </section>
        </aside>
      </section>
    </div>
  </div>

  <script>
    window.TELEPIC = { publicUrl: ${JSON.stringify(config.publicUrl)} };
    window.addEventListener('error', function (event) {
      if (!window.TELEPIC_APP_READY) {
        window.TELEPIC_APP_ERROR = event.message || '脚本加载失败';
      }
    });
    window.TELEPIC_THEME_PRESETS = {
      forest: { bg: '#edf3ef', panel: '#ffffff', ink: '#182126', accent: '#237a57', danger: '#c0463a', label: '森绿' },
      graphite: { bg: '#eef2f6', panel: '#ffffff', ink: '#182230', accent: '#326aa1', danger: '#bf4b3d', label: '石墨' },
      paper: { bg: '#f7f3eb', panel: '#fffdfa', ink: '#2b261f', accent: '#8e6743', danger: '#b84e3e', label: '纸白' },
      midnight: { bg: '#0f141c', panel: '#171f2b', ink: '#e8edf5', accent: '#42b58d', danger: '#ef7868', label: '夜幕' },
      copper: { bg: '#f6eee7', panel: '#fffaf6', ink: '#2a1d18', accent: '#bf6a2f', danger: '#b54034', label: '铜橙' },
      ocean: { bg: '#eaf2f7', panel: '#ffffff', ink: '#1a2730', accent: '#1f6f8b', danger: '#cc5b48', label: '海港' }
    };
    (function () {
      function qs(selector) { return document.querySelector(selector); }
      function qsa(selector) { return document.querySelectorAll(selector); }
      var fallbackState = {
        images: [],
        selected: {},
        activeImageId: ''
      };
      function setRuntime(text) {
        var el = qs('#runtimeStatus');
        if (el) el.textContent = text;
      }
      function setText(selector, text) {
        var el = qs(selector);
        if (el) el.textContent = text;
      }
      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
      function authHeaders(xhr) {
        var token = '';
        try { token = localStorage.getItem('telepic.adminToken') || ''; } catch (error) {}
        if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      }
      function requestJson(method, url, body, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.onreadystatechange = function () {
          var data = {};
          if (xhr.readyState !== 4) return;
          try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch (error) {}
          callback(xhr.status, data);
        };
        authHeaders(xhr);
        if (body && !(body instanceof FormData)) xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(body instanceof FormData ? body : (body ? JSON.stringify(body) : null));
      }
      function renderSystemConfig(data) {
        var target = qs('#systemConfig');
        if (!target) return;
        target.innerHTML = [
          '<div class="config-row"><span>公开地址</span><strong>' + data.publicUrl + '</strong></div>',
          '<div class="config-row"><span>匿名上传</span><strong>' + (data.publicUpload ? '允许' : '关闭') + '</strong></div>',
          '<div class="config-row"><span>存储驱动</span><strong>' + data.storageDriver + '</strong></div>',
          '<div class="config-row"><span>上传大小限制</span><strong>' + data.maxUploadBytes + ' bytes</strong></div>'
        ].join('');
      }
      function renderTokens(data) {
        var target = qs('#tokens');
        var html = '';
        var i;
        if (!target) return;
        if (!data.tokens || !data.tokens.length) {
          target.innerHTML = '<p class="empty-state">还没有 API 密钥。</p>';
          return;
        }
        for (i = 0; i < data.tokens.length; i += 1) {
          html += '<article class="token-card" data-id="' + data.tokens[i].id + '"><div class="token-head"><strong>' + escapeHtml(data.tokens[i].name) + '</strong><button class="danger" data-action="delete-token">删除</button></div><div class="token-meta">权限：' + (data.tokens[i].scopes || []).join('、') + '</div></article>';
        }
        target.innerHTML = html;
      }
      function renderEvents(data) {
        var target = qs('#events');
        var html = '';
        var i;
        if (!target) return;
        if (!data.events || !data.events.length) {
          target.innerHTML = '<p class="empty-state">暂无操作记录。</p>';
          return;
        }
        for (i = 0; i < data.events.length; i += 1) {
          html += '<article class="event-item"><div class="event-head"><strong>' + data.events[i].type + '</strong><small>' + data.events[i].createdAt + '</small></div></article>';
        }
        target.innerHTML = html;
      }
      function renderStats(data) {
        setText('#statImages', String(data.images || 0));
        setText('#statPublic', String(data.publicImages || 0));
        setText('#statPrivate', String(data.privateImages || 0));
        setText('#statBytes', String(data.totalBytes || 0) + ' B');
        setText('#statTokens', String(data.tokens || 0));
        setText('#sourceSummary', data.sourceBreakdown ? Object.keys(data.sourceBreakdown).join(' / ') : '');
      }
      function currentLinkFormat() {
        var select = qs('#linkFormat');
        return select && select.value ? select.value : 'page';
      }
      function linkFor(image, format) {
        if (format === 'raw') return image.rawUrl;
        if (format === 'markdown') return '![' + (image.originalName || image.id) + '](' + image.rawUrl + ')';
        if (format === 'html') return '<img src="' + image.rawUrl + '" alt="' + (image.originalName || image.id) + '">';
        if (format === 'bbcode') return '[img]' + image.rawUrl + '[/img]';
        return image.url;
      }
      function renderGallery(data) {
        var target = qs('#gallery');
        var items = data && data.images ? data.images : [];
        var html = '';
        var i;
        var format = currentLinkFormat();
        fallbackState.images = items;
        if (!fallbackState.activeImageId && items.length) fallbackState.activeImageId = items[0].id;
        if (fallbackState.activeImageId) {
          var exists = false;
          for (i = 0; i < items.length; i += 1) {
            if (items[i].id === fallbackState.activeImageId) exists = true;
          }
          if (!exists) fallbackState.activeImageId = items.length ? items[0].id : '';
        }
        if (!target) return;
        if (!items.length) {
          target.innerHTML = '<p class="empty-state">还没有图片。先上传一张试试看。</p>';
          renderDetail();
          renderSelectionSummary();
          return;
        }
        for (i = 0; i < items.length; i += 1) {
          html += ''
            + '<article class="asset-row' + (fallbackState.activeImageId === items[i].id ? ' is-active' : '') + '" data-id="' + items[i].id + '">'
            +   '<div class="asset-cell asset-check"><input type="checkbox" data-action="select" ' + (fallbackState.selected[items[i].id] ? 'checked' : '') + '></div>'
            +   '<div class="asset-cell asset-file">'
            +     '<a class="asset-thumb" href="' + items[i].url + '" target="_blank" rel="noreferrer"><img src="' + items[i].rawUrl + '" alt=""></a>'
            +     '<div class="asset-main">'
            +       '<strong>' + escapeHtml(items[i].originalName || items[i].id) + '</strong>'
            +       '<div class="asset-subline">ID ' + items[i].id + '</div>'
            +       '<div class="chip-row"><span class="status-chip ' + (items[i].visibility === 'private' ? 'private' : 'public') + '">' + (items[i].visibility === 'private' ? '私有' : '公开') + '</span></div>'
            +     '</div>'
            +   '</div>'
            +   '<div class="asset-cell asset-meta"><div>' + items[i].mime + '</div><div>' + items[i].size + ' B</div></div>'
            +   '<div class="asset-cell asset-link"><code>' + escapeHtml(linkFor(items[i], format)) + '</code></div>'
            +   '<div class="asset-cell asset-actions"><button class="secondary" data-action="detail">详情</button><button class="secondary" data-action="copy">复制</button><button class="danger" data-action="delete">删除</button></div>'
            + '</article>';
        }
        target.innerHTML = html;
        renderDetail();
        renderSelectionSummary();
      }
      function loadStats() {
        requestJson('GET', '/api/stats', null, function (status, data) {
          if (status >= 200 && status < 300) renderStats(data);
        });
      }
      function loadImages() {
        var query = [];
        var search = qs('#searchInput');
        var tag = qs('#tagFilter');
        var visibility = qs('#visibilityFilter');
        var source = qs('#sourceFilter');
        var sort = qs('#sortFilter');
        query.push('limit=50');
        if (search && search.value) query.push('q=' + encodeURIComponent(search.value));
        if (tag && tag.value) query.push('tag=' + encodeURIComponent(tag.value));
        if (visibility && visibility.value) query.push('visibility=' + encodeURIComponent(visibility.value));
        if (source && source.value) query.push('source=' + encodeURIComponent(source.value));
        if (sort && sort.value) query.push('sort=' + encodeURIComponent(sort.value));
        requestJson('GET', '/api/images?' + query.join('&'), null, function (status, data) {
          if (status >= 200 && status < 300) renderGallery(data);
        });
      }
      function loadConfig() {
        requestJson('GET', '/api/config', null, function (status, data) {
          if (status >= 200 && status < 300) renderSystemConfig(data);
        });
      }
      function currentImage() {
        var i;
        for (i = 0; i < fallbackState.images.length; i += 1) {
          if (fallbackState.images[i].id === fallbackState.activeImageId) return fallbackState.images[i];
        }
        return null;
      }
      function selectedIds() {
        var ids = [];
        var key;
        for (key in fallbackState.selected) {
          if (fallbackState.selected.hasOwnProperty(key) && fallbackState.selected[key]) ids.push(key);
        }
        return ids;
      }
      function renderSelectionSummary() {
        var ids = selectedIds();
        setText('#selectionSummary', ids.length ? ('已选择 ' + ids.length + ' 张图片') : '未选择图片');
        setText('#batchTagBadge', ids.length ? ('已选择 ' + ids.length + ' 张') : '未选择');
      }
      function renderDetail() {
        var image = currentImage();
        var target = qs('#imageDetail');
        var badge = qs('#detailBadge');
        if (badge) badge.textContent = image ? image.id : '未选中';
        if (!target) return;
        if (!image) {
          target.innerHTML = '<p class="empty-state">点击列表中的任意图片，在这里查看预览、编辑名称和标签、复制不同格式的链接。</p>';
          return;
        }
        target.innerHTML = ''
          + '<div class="detail-hero">'
          +   '<img class="detail-image" src="' + image.rawUrl + '" alt="">'
          +   '<div class="detail-summary">'
          +     '<strong>' + escapeHtml(image.originalName || image.id) + '</strong>'
          +     '<div class="chip-row"><span class="status-chip ' + (image.visibility === 'private' ? 'private' : 'public') + '">' + (image.visibility === 'private' ? '私有' : '公开') + '</span></div>'
          +     '<p class="muted-text">' + image.mime + ' · ' + image.size + ' B</p>'
          +   '</div>'
          + '</div>'
          + '<div class="detail-editors">'
          +   '<label class="field-stack"><span>图片名称</span><input id="detailNameInput" value="' + escapeHtml(image.originalName || '') + '"></label>'
          +   '<button class="secondary" data-detail-action="save-name">保存名称</button>'
          +   '<label class="field-stack field-stack-wide"><span>标签</span><input id="detailTagsInput" value="' + escapeHtml((image.tags || []).join(', ')) + '"></label>'
          +   '<button class="secondary" data-detail-action="save-tags">保存标签</button>'
          + '</div>'
          + '<div class="detail-grid">'
          +   '<div class="config-row"><span>图片 ID</span><strong>' + image.id + '</strong></div>'
          +   '<div class="config-row"><span>页面链接</span><strong>' + image.url + '</strong></div>'
          +   '<div class="config-row"><span>图片直链</span><strong>' + image.rawUrl + '</strong></div>'
          + '</div>'
          + '<div class="detail-actions">'
          +   '<button class="secondary" data-detail-action="copy-page">复制页面链接</button>'
          +   '<button class="secondary" data-detail-action="copy-raw">复制图片直链</button>'
          +   '<button class="secondary" data-detail-action="toggle-visibility">' + (image.visibility === 'private' ? '设为公开' : '设为私有') + '</button>'
          +   '<button class="danger" data-detail-action="delete">删除图片</button>'
          + '</div>';
      }
      function copyText(text, callback) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (callback) callback(true);
          }, function () {
            if (callback) callback(false);
          });
          return;
        }
        if (callback) callback(false);
      }
      function patchImage(id, body, callback) {
        requestJson('PATCH', '/api/images/' + id, body, function (status, data) {
          if (status >= 200 && status < 300) {
            loadImages();
            loadStats();
            if (callback) callback(true, data);
          } else if (callback) {
            callback(false, data);
          }
        });
      }
      function deleteImage(id, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', '/api/images/' + id, true);
        authHeaders(xhr);
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          loadImages();
          loadStats();
          if (callback) callback(xhr.status >= 200 && xhr.status < 300);
        };
        xhr.send(null);
      }
      function bulkUpdate(body, callback) {
        requestJson('POST', '/api/images/bulk-update', body, function (status, data) {
          if (status >= 200 && status < 300) {
            loadImages();
            loadStats();
            if (callback) callback(true, data);
          } else if (callback) {
            callback(false, data);
          }
        });
      }
      function bulkDelete(ids, callback) {
        requestJson('POST', '/api/images/bulk-delete', { ids: ids }, function (status, data) {
          if (status >= 200 && status < 300) {
            fallbackState.selected = {};
            loadImages();
            loadStats();
            if (callback) callback(true, data);
          } else if (callback) {
            callback(false, data);
          }
        });
      }
      function fallbackUpload(files) {
        var result = qs('#uploadResult');
        var file;
        var reader;
        if (!files || !files.length) return;
        file = files[0];
        if (result) result.textContent = '正在上传...';
        reader = new FileReader();
        reader.onload = function () {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload', true);
          authHeaders(xhr);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name || 'upload.png'));
          xhr.onreadystatechange = function () {
            var data = {};
            if (xhr.readyState !== 4) return;
            try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch (error) {}
            if (!result) return;
            if (xhr.status >= 200 && xhr.status < 300 && data.image) {
              result.textContent = '上传成功：' + data.image.url;
              setRuntime('上传接口正常');
              loadStats();
              loadImages();
            } else {
              result.textContent = (data && data.error) ? data.error : ('上传失败：' + xhr.status);
              setRuntime('上传接口返回 ' + xhr.status);
            }
          };
          xhr.send(file);
        };
        reader.onerror = function () {
          if (result) result.textContent = '读取文件失败';
          setRuntime('文件读取失败');
        };
        reader.readAsArrayBuffer(file);
      }
      function applyTheme(name) {
        var theme = window.TELEPIC_THEME_PRESETS[name];
        var root = document.documentElement;
        if (!theme || !root) return;
        root.style.setProperty('--bg', theme.bg);
        root.style.setProperty('--panel', theme.panel);
        root.style.setProperty('--ink', theme.ink);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--danger', theme.danger);
        var badge = qs('#themeBadge');
        if (badge) badge.textContent = theme.label;
        var preset = qs('#themePreset');
        if (preset) preset.value = name;
        for (var i = 0; i < qsa('[data-theme-preset]').length; i += 1) {
          var button = qsa('[data-theme-preset]')[i];
          button.classList.toggle('is-active', button.getAttribute('data-theme-preset') === name);
        }
        try {
          localStorage.setItem('telepic.theme', JSON.stringify({
            preset: name,
            bg: theme.bg,
            panel: theme.panel,
            ink: theme.ink,
            accent: theme.accent,
            danger: theme.danger
          }));
        } catch (error) {}
      }
      function bindFallback() {
        var tokenInput = qs('#adminToken');
        var saveToken = qs('#saveToken');
        var fileInput = qs('#fileInput');
        var gallery = qs('#gallery');
        var detail = qs('#imageDetail');
        var fetchButton = qs('#fetchUrlButton');
        var createTokenButton = qs('#createToken');
        var refreshImagesButton = qs('#refreshImages');
        var refreshEventsButton = qs('#refreshEvents');
        var bulkPublicButton = qs('#bulkPublic');
        var bulkPrivateButton = qs('#bulkPrivate');
        var bulkDeleteButton = qs('#bulkDelete');
        var applyBatchTagsButton = qs('#applyBatchTags');
        var clearBatchTagsButton = qs('#clearBatchTags');
        var selectAllButton = qs('#selectAllVisible');
        var clearSelectionButton = qs('#clearSelection');
        var copySelectedLinksButton = qs('#copySelectedLinks');
        var savedToken = '';
        try { savedToken = localStorage.getItem('telepic.adminToken') || ''; } catch (error) {}
        if (tokenInput && savedToken) tokenInput.value = savedToken;
        if (saveToken && tokenInput) {
          saveToken.addEventListener('click', function () {
            try { localStorage.setItem('telepic.adminToken', tokenInput.value.trim()); } catch (error) {}
            var adminState = qs('#adminState');
            if (adminState) adminState.textContent = tokenInput.value.trim() ? '管理员密钥已保存到本地浏览器' : '未保存管理员密钥';
            loadConfig();
            loadStats();
            loadImages();
            setRuntime('基础交互已响应');
          });
        }
        if (fileInput) {
          fileInput.addEventListener('change', function (event) {
            fallbackUpload(event.target.files);
          });
        }
        if (refreshImagesButton) refreshImagesButton.addEventListener('click', function () { loadImages(); loadStats(); });
        if (refreshEventsButton) refreshEventsButton.addEventListener('click', function () { requestJson('GET', '/api/events?limit=12', null, function (status, data) { if (status >= 200 && status < 300) renderEvents(data); }); });
        if (fetchButton) {
          fetchButton.addEventListener('click', function () {
            var input = qs('#fetchUrlInput');
            var result = qs('#fetchUrlResult');
            if (!input || !input.value) {
              if (result) result.textContent = '先输入图片 URL。';
              return;
            }
            requestJson('POST', '/api/upload-from-url', { url: input.value }, function (status, data) {
              if (result) result.textContent = status >= 200 && status < 300 && data.image ? ('抓取成功：' + data.image.url) : ((data && data.error) || ('抓取失败：' + status));
              if (status >= 200 && status < 300) {
                input.value = '';
                loadImages();
                loadStats();
              }
            });
          });
        }
        if (createTokenButton) {
          createTokenButton.addEventListener('click', function () {
            var nameInput = qs('#tokenName');
            var scopeUpload = qs('#scopeUpload');
            var scopeManage = qs('#scopeManage');
            var result = qs('#tokenResult');
            var scopes = [];
            if (scopeUpload && scopeUpload.checked) scopes.push('upload');
            if (scopeManage && scopeManage.checked) scopes.push('manage');
            if (!scopes.length) {
              if (result) result.textContent = '至少选择一个权限';
              return;
            }
            requestJson('POST', '/api/tokens', { name: nameInput && nameInput.value ? nameInput.value : '上传密钥', scopes: scopes }, function (status, data) {
              if (result) result.textContent = status >= 200 && status < 300 ? ('新密钥只显示一次：' + data.token) : ((data && data.error) || ('创建失败：' + status));
              if (status >= 200 && status < 300) {
                if (nameInput) nameInput.value = '';
                requestJson('GET', '/api/tokens', null, function (tokenStatus, tokenData) { if (tokenStatus >= 200 && tokenStatus < 300) renderTokens(tokenData); });
                loadStats();
              }
            });
          });
        }
        var tokensPanel = qs('#tokens');
        if (tokensPanel) {
          tokensPanel.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-action="delete-token"]');
            var card = event.target.closest('.token-card');
            if (!button || !card) return;
            var xhr = new XMLHttpRequest();
            xhr.open('DELETE', '/api/tokens/' + card.getAttribute('data-id'), true);
            authHeaders(xhr);
            xhr.onreadystatechange = function () {
              if (xhr.readyState !== 4) return;
              requestJson('GET', '/api/tokens', null, function (status, data) { if (status >= 200 && status < 300) renderTokens(data); });
              loadStats();
              setRuntime('API 密钥已删除');
            };
            xhr.send(null);
          });
        }
        if (gallery) {
          gallery.addEventListener('click', function (event) {
            var row = event.target.closest('.asset-row');
            var action = event.target.getAttribute('data-action');
            var id;
            var image;
            if (!row) return;
            id = row.getAttribute('data-id');
            fallbackState.activeImageId = id;
            if (action === 'select') {
              fallbackState.selected[id] = event.target.checked;
              renderSelectionSummary();
              return;
            }
            for (var gi = 0; gi < fallbackState.images.length; gi += 1) {
              if (fallbackState.images[gi].id === id) image = fallbackState.images[gi];
            }
            if (action === 'copy' && image) {
              copyText(linkFor(image, currentLinkFormat()), function () { setRuntime('图片链接已复制'); });
            }
            if (action === 'delete' && image) {
              deleteImage(id, function () { setRuntime('图片已删除'); });
              return;
            }
            renderGallery({ images: fallbackState.images });
          });
        }
        if (detail) {
          detail.addEventListener('click', function (event) {
            var action = event.target.getAttribute('data-detail-action');
            var image = currentImage();
            var nameInput;
            var tagsInput;
            if (!action || !image) return;
            if (action === 'save-name') {
              nameInput = qs('#detailNameInput');
              patchImage(image.id, { originalName: nameInput ? nameInput.value : image.originalName }, function () { setRuntime('图片名称已更新'); });
            }
            if (action === 'save-tags') {
              tagsInput = qs('#detailTagsInput');
              patchImage(image.id, { tags: tagsInput ? tagsInput.value : '' }, function () { setRuntime('图片标签已更新'); });
            }
            if (action === 'toggle-visibility') {
              patchImage(image.id, { visibility: image.visibility === 'private' ? 'public' : 'private' }, function () { setRuntime('可见性已切换'); });
            }
            if (action === 'delete') {
              deleteImage(image.id, function () { setRuntime('图片已删除'); });
            }
            if (action === 'copy-page') copyText(image.url, function () { setRuntime('页面链接已复制'); });
            if (action === 'copy-raw') copyText(image.rawUrl, function () { setRuntime('图片直链已复制'); });
          });
        }
        if (bulkPublicButton) bulkPublicButton.addEventListener('click', function () { var ids = selectedIds(); if (ids.length) bulkUpdate({ ids: ids, visibility: 'public' }, function () { setRuntime('已批量设为公开'); }); });
        if (bulkPrivateButton) bulkPrivateButton.addEventListener('click', function () { var ids = selectedIds(); if (ids.length) bulkUpdate({ ids: ids, visibility: 'private' }, function () { setRuntime('已批量设为私有'); }); });
        if (bulkDeleteButton) bulkDeleteButton.addEventListener('click', function () { var ids = selectedIds(); if (ids.length) bulkDelete(ids, function () { setRuntime('已批量删除'); }); });
        if (applyBatchTagsButton) applyBatchTagsButton.addEventListener('click', function () { var ids = selectedIds(); var input = qs('#batchTagsInput'); if (ids.length && input) bulkUpdate({ ids: ids, tags: input.value }, function () { setRuntime('已批量更新标签'); }); });
        if (clearBatchTagsButton) clearBatchTagsButton.addEventListener('click', function () { var ids = selectedIds(); if (ids.length) bulkUpdate({ ids: ids, tags: [] }, function () { setRuntime('已清空标签'); }); });
        if (selectAllButton) selectAllButton.addEventListener('click', function () { var i; for (i = 0; i < fallbackState.images.length; i += 1) fallbackState.selected[fallbackState.images[i].id] = true; loadImages(); });
        if (clearSelectionButton) clearSelectionButton.addEventListener('click', function () { fallbackState.selected = {}; renderSelectionSummary(); loadImages(); });
        if (copySelectedLinksButton) copySelectedLinksButton.addEventListener('click', function () {
          var ids = selectedIds();
          var lines = [];
          var i;
          for (i = 0; i < fallbackState.images.length; i += 1) {
            if (fallbackState.selected[fallbackState.images[i].id]) lines.push(linkFor(fallbackState.images[i], currentLinkFormat()));
          }
          copyText(lines.join('\\n'), function () { setRuntime('已复制选中图片链接'); });
        });
        ['#searchInput', '#tagFilter', '#visibilityFilter', '#sourceFilter', '#sortFilter', '#linkFormat'].forEach(function (selector) {
          var el = qs(selector);
          if (el) el.addEventListener('change', loadImages);
          if (el && (selector === '#searchInput' || selector === '#tagFilter')) el.addEventListener('input', loadImages);
        });
        var tabs = qs('#inspectorTabs');
        if (tabs) {
          tabs.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-pane]');
            var pane;
            var i;
            if (!button) return;
            pane = button.getAttribute('data-pane');
            for (i = 0; i < qsa('.tab-button').length; i += 1) {
              qsa('.tab-button')[i].classList.toggle('is-active', qsa('.tab-button')[i] === button);
            }
            for (i = 0; i < qsa('.inspector-pane').length; i += 1) {
              qsa('.inspector-pane')[i].classList.toggle('is-active', qsa('.inspector-pane')[i].id === 'pane-' + pane);
            }
            if (pane === 'system') {
              requestJson('GET', '/api/config', null, function (status, data) {
                if (status >= 200 && status < 300) renderSystemConfig(data);
              });
            }
            if (pane === 'tokens') {
              requestJson('GET', '/api/tokens', null, function (status, data) {
                if (status >= 200 && status < 300) renderTokens(data);
              });
            }
            if (pane === 'events') {
              requestJson('GET', '/api/events?limit=12', null, function (status, data) {
                if (status >= 200 && status < 300) renderEvents(data);
              });
            }
            setRuntime('标签页切换正常');
          });
        }
        var quickPicks = qs('#themeQuickPicks');
        if (quickPicks) {
          quickPicks.addEventListener('click', function (event) {
            var button = event.target.closest('[data-theme-preset]');
            if (!button) return;
            applyTheme(button.getAttribute('data-theme-preset'));
            setRuntime('主题切换正常');
          });
        }
        var preset = qs('#themePreset');
        if (preset) {
          preset.addEventListener('change', function () {
            if (window.TELEPIC_THEME_PRESETS[preset.value]) {
              applyTheme(preset.value);
              setRuntime('主题切换正常');
            }
          });
        }
        try {
          var rawTheme = localStorage.getItem('telepic.theme');
          if (rawTheme) {
            var parsed = JSON.parse(rawTheme);
            if (parsed && parsed.preset && window.TELEPIC_THEME_PRESETS[parsed.preset]) applyTheme(parsed.preset);
          }
        } catch (error) {}
        loadConfig();
        loadStats();
        loadImages();
        setRuntime('基础交互已加载');
      }
      function bootFallbackIfNeeded() {
        window.setTimeout(function () {
          if (window.TELEPIC_APP_READY) return;
          setRuntime(window.TELEPIC_APP_ERROR ? ('主脚本失败，已启用兼容模式：' + window.TELEPIC_APP_ERROR) : '已启用兼容模式');
          bindFallback();
        }, 260);
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootFallbackIfNeeded);
      } else {
        bootFallbackIfNeeded();
      }
    }());
  </script>
  <script src="/assets/app.js?v=${assetVersion}"></script>
</body>
</html>`;
}

function imagePage(image, config, accessToken = '') {
  const title = escapeHtml(image.originalName || image.fileName);
  const tokenSuffix = image.visibility === 'private' && accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:image" content="${config.publicUrl}/raw/${image.id}${tokenSuffix}">
  <meta property="og:title" content="${title}">
  <title>${title}</title>
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersion}">
</head>
<body class="viewer">
  <main>
    <img src="/raw/${image.id}${tokenSuffix}" alt="${title}">
    <nav>
      <a href="/raw/${image.id}${tokenSuffix}">原图</a>
      <a href="/">管理台</a>
    </nav>
  </main>
</body>
</html>`;
}

module.exports = { htmlPage, imagePage };
