const { escapeHtml } = require('./utils');
const assetVersion = Date.now();

function htmlPage(config) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Telepic 图床</title>
  <script>
    (function () {
      function safeGet(key) {
        try { return localStorage.getItem(key) || ''; } catch (error) { return ''; }
      }
      function validHex(value) {
        return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : '';
      }
      function hexToRgb(hex) {
        var value = validHex(hex).slice(1);
        if (!value) return null;
        return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
      }
      function luminance(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) return 1;
        return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
      }
      function mixColor(foreground, background, ratio) {
        var a = hexToRgb(foreground);
        var b = hexToRgb(background);
        if (!a || !b) return foreground || background || '#000000';
        function blend(left, right) { return Math.round(left * (1 - ratio) + right * ratio).toString(16).padStart(2, '0'); }
        return '#' + blend(a.r, b.r) + blend(a.g, b.g) + blend(a.b, b.b);
      }
      function hexToRgba(hex, alpha) {
        var rgb = hexToRgb(hex);
        if (!rgb) return 'rgba(255,255,255,' + alpha + ')';
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
      }
      var raw = safeGet('telepic.theme');
      if (!raw) return;
      var theme;
      try { theme = JSON.parse(raw); } catch (error) { return; }
      if (!theme || typeof theme !== 'object') return;
      var bg = validHex(theme.bg);
      var panel = validHex(theme.panel);
      var ink = validHex(theme.ink);
      var accent = validHex(theme.accent);
      var danger = validHex(theme.danger);
      if (!bg || !panel || !ink || !accent || !danger) return;
      var root = document.documentElement;
      root.style.setProperty('--bg', bg);
      root.style.setProperty('--panel', panel);
      root.style.setProperty('--ink', ink);
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--danger', danger);
      root.style.setProperty('--line', mixColor(panel, ink, 0.12));
      root.style.setProperty('--line-strong', mixColor(panel, ink, 0.22));
      root.style.setProperty('--muted', mixColor(ink, bg, 0.5));
      root.style.setProperty('--soft', mixColor(accent, panel, 0.88));
      root.style.setProperty('--danger-soft', mixColor(danger, panel, 0.88));
      root.style.setProperty('--accent-strong', mixColor(accent, ink, 0.18));
      root.style.setProperty('--accent-contrast', luminance(accent) > 0.52 ? '#102028' : '#ffffff');
      root.style.setProperty('--panel-bg', hexToRgba(panel, theme.image ? Math.min(Number(theme.panelAlpha || 0.88), 0.68) : Number(theme.panelAlpha || 0.88)));
      root.style.setProperty('--panel-blur', (theme.image ? Math.max(Number(theme.blur || 16), 24) : Number(theme.blur || 16)) + 'px');
      root.style.setProperty('--shadow', luminance(bg) < 0.35 ? '0 18px 44px rgba(0, 0, 0, 0.38)' : '0 16px 34px rgba(16, 24, 40, 0.10)');
      if (theme.backdrop) root.style.setProperty('--theme-backdrop', theme.backdrop);
      if (theme.overlay) root.style.setProperty('--theme-overlay', theme.image ? 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))' : theme.overlay);
      if (theme.image) root.style.setProperty('--theme-image', 'url("' + String(theme.image).replace(/"/g, '&quot;') + '")');
      document.addEventListener('DOMContentLoaded', function () {
        document.body.classList.toggle('theme-dark', luminance(bg) < 0.35);
        document.body.classList.toggle('theme-photo', Boolean(theme.image));
      }, { once: true });
    }());
  </script>
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersion}">
</head>
<body class="app-body">
  <div id="loginOverlay" class="auth-stage">
    <section class="auth-copy">
      <div class="ops-brand oversized"><span>TP</span></div>
      <p class="eyebrow">Self-hosted media operations</p>
      <h1>Telepic Command Center</h1>
      <p>把上传、检索、相册、对象存储和 Telegram Bot 管理收进一个全新的媒体工作台。</p>
      <div class="auth-signal-grid">
        <span>Local-first</span>
        <span>S3 Ready</span>
        <span>Bot Ops</span>
      </div>
    </section>
    <section class="auth-card">
      <div>
        <p class="eyebrow">Admin Login</p>
        <h2>进入控制台</h2>
      </div>
      <label class="field-stack">
        <span>管理员账号</span>
        <input id="loginUsername" type="text" autocomplete="username" placeholder="用户名">
      </label>
      <label class="field-stack">
        <span>密码</span>
        <input id="loginPassword" type="password" autocomplete="current-password" placeholder="密码">
      </label>
      <div class="login-actions single">
        <button id="loginButton" type="button">进入控制台</button>
      </div>
      <p id="loginMessage" class="mini-note">请使用管理员账号和密码登录。</p>
    </section>
  </div>

  <div class="ops-shell">
    <aside class="ops-rail" aria-label="主导航">
      <div class="ops-brand"><span>TP</span></div>
      <nav id="mainNav" class="main-nav">
        <button type="button" class="main-nav-button is-active" data-main-view="overview"><span>Overview</span><strong>概览</strong></button>
        <button type="button" class="main-nav-button" data-main-view="library"><span>Library</span><strong>图片</strong></button>
        <button type="button" class="main-nav-button" data-main-view="albums"><span>Albums</span><strong>相册</strong></button>
        <button type="button" class="main-nav-button" data-main-view="bot"><span>Bot</span><strong>机器人</strong></button>
        <button type="button" class="main-nav-button" data-main-view="storage"><span>Storage</span><strong>存储</strong></button>
        <button type="button" class="main-nav-button" data-main-view="trash"><span>Trash</span><strong>回收站</strong></button>
        <button type="button" class="main-nav-button" data-main-view="system"><span>System</span><strong>系统</strong></button>
        <button type="button" class="main-nav-button" data-main-view="theme"><span>Theme</span><strong>外观</strong></button>
      </nav>
      <div class="rail-status">
        <span class="status-dot"></span>
        <span>Live</span>
      </div>
    </aside>

    <header class="ops-commandbar">
      <div class="command-title">
        <p class="eyebrow">Media Operations Desk</p>
        <h1>Telepic 图床工作台</h1>
      </div>
      <label class="global-search">
        <span>Search</span>
        <input id="searchInput" placeholder="搜索文件名、ID、来源">
      </label>
    </header>

    <main class="ops-main">
      <div id="flashMessage" class="flash-bar">准备就绪</div>

      <section id="view-overview" class="main-view is-active workspace-view overview-workspace">
        <section class="overview-hero ops-panel">
          <div>
            <p class="panel-kicker">Overview</p>
            <h2>站点概览</h2>
            <p class="section-text">统计、来源、运行状态和内容结构集中在这里；切换到图片/相册/系统时不再占用页面。</p>
          </div>
        </section>
        <section class="ops-overview">
          <article class="metric-card"><small>图片总数</small><strong id="statImages">0</strong></article>
          <article class="metric-card"><small>公开图片</small><strong id="statPublic">0</strong></article>
          <article class="metric-card"><small>私有图片</small><strong id="statPrivate">0</strong></article>
          <article class="metric-card"><small>占用空间</small><strong id="statBytes">0 B</strong></article>
          <article class="metric-card"><small>API 密钥</small><strong id="statTokens">0</strong></article>
          <article class="metric-card"><small>Telegram</small><strong id="statTelegram">未启用</strong></article>
          <article class="metric-card"><small>数据库</small><strong id="statDatabase">检测中</strong></article>
          <article class="metric-card"><small>存储</small><strong id="statStorage">检测中</strong></article>
        </section>
        <section class="ops-intel-grid">
          <article class="ops-panel visibility-panel">
            <div class="panel-head compact"><div><p class="panel-kicker">Visibility</p><h2>公开率</h2></div></div>
            <div class="ring-layout"><div id="visibilityChart" class="ring-chart"><div class="ring-center"><strong id="visibilityRate">0%</strong><span>公开</span></div></div><div id="visibilityLegend" class="chart-legend"></div></div>
          </article>
          <article class="ops-panel"><div class="panel-head compact"><div><p class="panel-kicker">Sources</p><h2>上传来源</h2></div></div><div id="sourceChart" class="source-chart"></div></article>
          <article class="ops-panel"><div class="panel-head compact"><div><p class="panel-kicker">Runtime</p><h2>服务状态</h2></div></div><div id="statusOverview" class="status-overview"></div></article>
          <article class="ops-panel"><div class="panel-head compact"><div><p class="panel-kicker">Content</p><h2>内容结构</h2></div></div><div id="breakdownCharts" class="breakdown-list"></div></article>
        </section>
      </section>

      <section id="view-library" class="main-view workspace-view library-workspace">
        <section class="intake-deck">
          <div class="intake-copy">
            <p class="panel-kicker">Intake</p>
            <h2>快速入库</h2>
            <p class="section-text">拖拽、粘贴、文件选择或 URL 抓图，把素材直接送进媒体库。</p>
            <div class="intake-badges"><span id="uploadAuthBadge" class="badge">文件 / URL</span><span id="uploadGateHint" class="notice-box"></span></div>
          </div>
          <label class="dropzone" id="dropzone">
            <input id="fileInput" type="file" accept="image/*,.heic,.heif" multiple>
            <span class="dropzone-title">Drop images here</span>
            <span class="dropzone-sub">点击选择、多文件、截图粘贴都支持</span>
          </label>
          <div class="intake-controls">
            <label class="field-stack"><span>本次上传位置</span><select id="uploadStorageDriver"><option value="default">跟随当前配置</option><option value="local">本地存储</option><option value="s3">对象存储</option></select></label>
            <div class="inline-form"><input id="fetchUrlInput" class="wide-input" placeholder="粘贴图片 URL 后抓取"><button id="fetchUrlButton">抓取</button></div>
          </div>
          <div id="fetchUrlResult" class="result-box"></div>
          <div id="uploadResult" class="result-box result-log"></div>
        </section>

        <section class="asset-board-shell">
          <div class="board-head">
            <div><p class="panel-kicker">Library</p><h2>媒体资产板</h2><p id="sourceSummary" class="section-text"></p></div>
            <div class="actions"><button id="refreshImages" class="secondary">刷新</button><button id="bulkPublic" class="secondary">批量公开</button><button id="bulkPrivate" class="secondary">批量私有</button><button id="bulkDelete" class="danger">批量删除</button></div>
          </div>
          <div class="filter-bar">
            <input id="tagFilter" placeholder="按标签筛选">
            <select id="visibilityFilter"><option value="">全部可见性</option><option value="public">公开</option><option value="private">私有</option></select>
            <select id="sourceFilter"><option value="">全部来源</option><option value="api">网页/API</option><option value="url">URL 抓图</option><option value="telegram">Telegram</option></select>
            <select id="sortFilter"><option value="newest">最新优先</option><option value="oldest">最早优先</option><option value="name">按名称</option><option value="size-desc">按大小降序</option><option value="size-asc">按大小升序</option></select>
            <select id="linkFormat"><option value="page">页面链接</option><option value="raw">直链</option><option value="markdown">Markdown</option><option value="html">HTML</option><option value="bbcode">BBCode</option></select>
          </div>
          <div class="selection-dock">
            <div><strong id="selectionSummary">未选择图片</strong><span id="batchTagBadge" class="badge">未选择</span></div>
            <div class="actions"><button id="selectAllVisible" class="secondary">全选</button><button id="clearSelection" class="secondary">清空</button><button id="copySelectedLinks" class="secondary">复制链接</button><button id="downloadSelected" class="secondary">下载</button></div>
            <div class="batch-row"><input id="batchTagsInput" class="wide-input" placeholder="批量标签：标签1, 标签2"><button id="applyBatchTags" class="secondary">覆盖标签</button><button id="clearBatchTags" class="secondary">清空标签</button></div>
          </div>
          <div class="media-board" id="gallery"></div>
          <div class="pagination-bar"><div><strong id="pageSummary">第 1 页</strong><span id="pageMeta" class="muted-text">0 / 0</span></div><div class="actions"><button id="prevPage" class="secondary" type="button">上一页</button><button id="nextPage" class="secondary" type="button">下一页</button></div></div>
        </section>
      </section>

      <section id="view-albums" class="main-view workspace-view">
        <section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">Albums</p><h2>相册工作区</h2><p class="section-text">创建集合、装配已选图片、封面和排序都集中在这里。</p></div><div class="actions"><input id="albumNameInput" class="wide-input" placeholder="新相册名称"><button id="createAlbum" type="button">创建相册</button></div></div><div class="selection-dock"><div><strong id="albumSelectionSummary">未选择图片</strong><span class="muted-text">从媒体库选择图片后加入相册</span></div><div class="actions"><button id="assignSelectedAlbum" class="secondary" type="button">加入相册</button><button id="clearAlbumFilter" class="secondary" type="button">清除筛选</button></div></div><div id="albumResult" class="result-box"></div><div id="albumGrid" class="album-grid"></div></section>
        <section class="ops-panel workspace-panel"><div class="pane-head"><div><p class="panel-kicker">Album Detail</p><h2>相册详情</h2></div><span id="albumDetailBadge" class="badge">未选择</span></div><div class="integration-grid"><label class="field-stack"><span>相册名称</span><input id="albumEditName" placeholder="相册名称"></label><label class="field-stack"><span>相册描述</span><input id="albumEditDescription" placeholder="相册描述"></label><label class="field-stack"><span>排序方式</span><select id="albumSortMode"><option value="manual">手动排序</option><option value="newest">最新优先</option><option value="oldest">最早优先</option><option value="name">按名称</option></select></label></div><div class="actions actions-split"><button id="saveAlbumMeta" class="secondary" type="button">保存</button><button id="setAlbumCoverFromCurrent" class="secondary" type="button">设封面</button><button id="removeCurrentFromAlbum" class="secondary" type="button">移出当前图片</button><button id="moveCurrentAlbumUp" class="secondary" type="button">上移</button><button id="moveCurrentAlbumDown" class="secondary" type="button">下移</button><button id="deleteAlbum" class="danger" type="button">删除</button></div><div id="albumDetailResult" class="result-box"></div></section>
      </section>

      <section id="view-bot" class="main-view workspace-view"><section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">Telegram Bot</p><h2>机器人运维</h2><p class="section-text">Webhook、白名单、测试消息和运行状态。</p></div><span id="telegramBadge" class="badge">检测中</span></div><p id="telegramHint" class="section-text"></p><pre id="telegramWebhook" class="mono-box"></pre><div id="telegramStatusPanel" class="status-panel-grid"></div></section><section class="ops-panel workspace-panel"><div id="telegramConfigMount"></div><div class="integration-panel"><div class="panel-head compact"><div><p class="panel-kicker">Test</p><h2>发送测试消息</h2></div></div><div class="integration-grid"><label class="field-stack"><span>测试 Chat ID</span><input id="telegramTestChatId" placeholder="留空默认白名单用户"></label><label class="field-stack"><span>测试内容</span><input id="telegramTestMessage" placeholder="Telepic 测试消息"></label></div><div class="actions"><button id="sendTelegramTest" type="button" class="secondary">发送测试</button></div><div id="telegramTestResult" class="result-box"></div></div></section></section>

      <section id="view-storage" class="main-view workspace-view"><section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">Storage</p><h2>存储拓扑</h2><p class="section-text">本地、S3/R2/MinIO/B2 兼容存储的状态与迁移。</p></div><span id="storageBadge" class="badge">检测中</span></div><div id="storageStatusPanel" class="status-panel-grid"></div><div class="integration-panel"><div class="panel-head compact"><div><p class="panel-kicker">Migration</p><h2>迁移已有文件</h2></div></div><div class="actions"><button id="migrateStorageData" type="button" class="secondary">迁移到当前存储配置</button></div><div id="storageMigrateResult" class="result-box"></div></div></section><section class="ops-panel workspace-panel"><div id="storageConfigMount"></div></section></section>

      <section id="view-trash" class="main-view workspace-view"><section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">Recovery</p><h2>回收站</h2><p class="section-text">恢复误删图片，或彻底清空空间。</p></div><div class="actions"><button id="refreshTrash" class="secondary" type="button">刷新</button><button id="emptyTrash" class="danger" type="button">清空</button></div></div><div id="trashList" class="trash-list"></div></section></section>

      <section id="view-system" class="main-view workspace-view"><section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">System</p><h2>系统与运行状态</h2></div></div><div id="systemConfig" class="config-list"></div><div id="systemStatusPanel" class="config-list"></div><pre id="apiExample" class="mono-box"></pre></section><section class="ops-panel workspace-panel"><div class="pane-head"><div><p class="panel-kicker">Access</p><h2>密钥与审计</h2></div><button id="refreshEvents" class="secondary">刷新日志</button></div><div class="system-split"><div><div class="token-create-row"><input id="tokenName" class="wide-input" placeholder="密钥名称"><label class="checkline"><input id="scopeUpload" type="checkbox" checked> 上传</label><label class="checkline"><input id="scopeManage" type="checkbox"> 管理</label><button id="createToken">创建</button></div><div id="tokenResult" class="result-box"></div><div id="tokens" class="tokens"></div></div><div><div id="events" class="events"></div></div></div></section><section class="ops-panel workspace-panel"><div class="pane-head"><div><p class="panel-kicker">Security</p><h2>修改管理员密码</h2></div></div><div class="password-grid"><label class="field-stack"><span>当前密码</span><input id="currentPassword" type="password" autocomplete="current-password"></label><label class="field-stack"><span>新密码</span><input id="newPassword" type="password" autocomplete="new-password"></label><label class="field-stack"><span>确认新密码</span><input id="confirmPassword" type="password" autocomplete="new-password"></label><button id="changePassword" type="button">保存新密码</button></div><div id="passwordResult" class="result-box"></div></section></section>

      <section id="view-theme" class="main-view workspace-view"><section class="ops-panel workspace-panel"><div class="board-head"><div><p class="panel-kicker">Appearance</p><h2>主题工作室</h2><p id="themeStorageState" class="section-text">等待同步</p></div><span id="themeBadge" class="badge">当前主题</span></div><div id="themeShowcase" class="theme-showcase"></div><div id="themeLibraryMeta" class="theme-library-meta"></div><div id="themeQuickPicks" class="theme-store-grid"></div></section><section class="ops-panel workspace-panel"><div id="themePreview" class="theme-preview"></div><div class="integration-grid"><label class="field-stack"><span>预设</span><select id="themePreset"><option value="graphite">石墨蓝</option><option value="ember">暗金琥珀</option><option value="forest">深林绿</option><option value="plum">午夜紫</option><option value="custom">自定义</option></select></label><label class="field-stack"><span>名称</span><input id="themeLabel" placeholder="主题名称"></label><label class="field-stack"><span>作者</span><input id="themeAuthor" placeholder="作者"></label><label class="field-stack field-stack-wide"><span>描述</span><input id="themeDescription" placeholder="描述"></label><label class="field-stack"><span>背景</span><input id="themeBg" type="color"></label><label class="field-stack"><span>面板</span><input id="themePanel" type="color"></label><label class="field-stack"><span>文字</span><input id="themeInk" type="color"></label><label class="field-stack"><span>强调</span><input id="themeAccent" type="color"></label><label class="field-stack"><span>危险</span><input id="themeDanger" type="color"></label></div><div class="actions actions-split"><button id="saveTheme" type="button">保存主题</button><button id="installTheme" class="secondary" type="button">安装</button><button id="removeTheme" class="secondary" type="button">移除</button><button id="resetTheme" class="secondary" type="button">重置</button><label class="file-button secondary">背景图<input id="themeBackgroundFile" type="file" accept="image/*"></label><button id="clearThemeBackground" class="secondary" type="button">清除背景</button><button id="exportTheme" class="secondary" type="button">导出</button><label class="file-button secondary">导入<input id="themeImportFile" type="file" accept="application/json"></label></div></section></section>
    </main>

    <aside class="ops-drawer inspector-shell" id="inspectorShell" aria-label="图片检查器">
      <div class="drawer-head"><div><p class="panel-kicker">Inspector</p><h2>图片详情</h2></div><button id="closeInspector" class="secondary" type="button">关闭</button></div>
      <div id="inspectorTabs" class="inspector-tabs"><button class="tab-button is-active" data-pane="detail">详情</button><button class="tab-button" data-pane="system">系统</button><button class="tab-button" data-pane="events">日志</button><button class="tab-button" data-pane="tokens">密钥</button></div>
      <section id="pane-detail" class="inspector-pane is-active"><div class="pane-head"><div><p class="panel-kicker">Selected Asset</p><h2>资产详情</h2></div><span id="detailBadge" class="badge">未选中</span></div><div id="imageDetail" class="detail-panel"><p class="empty-state">选择一张图片，查看预览、编辑名称标签、复制链接。</p></div></section>
      <section id="pane-system" class="inspector-pane"><div class="pane-head"><div><p class="panel-kicker">System Shortcut</p><h2>系统快照</h2></div></div><p class="empty-state">完整系统信息已移到 System 工作区。</p></section>
      <section id="pane-events" class="inspector-pane"><div class="pane-head"><div><p class="panel-kicker">Audit</p><h2>最近操作</h2></div></div><p class="empty-state">审计日志已移到 System 工作区。</p></section>
      <section id="pane-tokens" class="inspector-pane"><div class="pane-head"><div><p class="panel-kicker">Access</p><h2>API 密钥</h2></div></div><p class="empty-state">API 密钥已移到 System 工作区。</p></section>
    </aside>

    <div class="ops-hidden-panels">
      <div id="telegramConfigPanel" class="integration-panel"><div class="panel-head compact"><div><p class="panel-kicker">Telegram Bot</p><h2>快捷对接</h2></div><span id="telegramConfigBadge" class="badge">未配置</span></div><div class="integration-grid"><label class="field-stack"><span>公网地址 PUBLIC_URL</span><input id="cfgPublicUrl" placeholder="https://img.example.com"></label><label class="field-stack"><span>Bot Token</span><input id="cfgTelegramBotToken" type="password" placeholder="123456:ABC..."></label><label class="field-stack"><span>允许用户 ID</span><input id="cfgTelegramAllowedUsers" placeholder="123456789,987654321"></label></div><div class="actions actions-split"><button id="saveTelegramConfig" type="button">保存并自动接入</button></div><div id="telegramConfigResult" class="result-box"></div></div>
      <div id="storageConfigPanel" class="integration-panel"><div class="panel-head compact"><div><p class="panel-kicker">Object Storage</p><h2>第三方存储桶</h2></div><span id="storageConfigBadge" class="badge">本地</span></div><div class="integration-grid"><label class="field-stack"><span>存储类型</span><select id="cfgStorageDriver"><option value="local">本地存储</option><option value="s3">S3/R2/MinIO/B2 兼容</option></select></label><label class="field-stack"><span>Bucket</span><input id="cfgS3Bucket" placeholder="telepic"></label><label class="field-stack"><span>Region</span><input id="cfgS3Region" placeholder="auto"></label><label class="field-stack"><span>Endpoint</span><input id="cfgS3Endpoint" placeholder="https://xxx.r2.cloudflarestorage.com"></label><label class="field-stack"><span>Access Key ID</span><input id="cfgS3AccessKeyId" type="password"></label><label class="field-stack"><span>Secret Access Key</span><input id="cfgS3SecretAccessKey" type="password"></label><label class="field-stack"><span>公开访问域名 / CDN</span><input id="cfgS3PublicBaseUrl" placeholder="https://cdn.example.com"></label><label class="field-stack"><span>目录前缀</span><input id="cfgS3Prefix" placeholder="telepic"></label><label class="checkline integration-check"><input id="cfgS3ForcePathStyle" type="checkbox" checked> Path-style URL</label></div><div class="actions actions-split"><button id="saveStorageConfig" type="button">保存存储配置</button><button id="testStorageConfig" type="button" class="secondary">测试当前配置</button></div><div id="storageConfigResult" class="result-box"></div></div>
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
      graphite: { bg: '#070b14', panel: '#111827', ink: '#eaf2ff', accent: '#38bdf8', danger: '#fb7185', label: '石墨蓝', backdrop: 'radial-gradient(circle at 18% 12%, rgba(56,189,248,0.16), transparent 30%), radial-gradient(circle at 82% 8%, rgba(99,102,241,0.14), transparent 28%), linear-gradient(135deg, #070b14 0%, #0d1320 52%, #050814 100%)', overlay: 'linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.38))', panelAlpha: 0.9, blur: 18 },
      ember: { bg: '#120d0a', panel: '#1f1712', ink: '#fff3e4', accent: '#f59e0b', danger: '#ef4444', label: '暗金琥珀', backdrop: 'radial-gradient(circle at 18% 16%, rgba(245,158,11,0.16), transparent 30%), radial-gradient(circle at 82% 10%, rgba(217,119,6,0.12), transparent 28%), linear-gradient(135deg, #120d0a 0%, #1b130d 54%, #0f0b08 100%)', overlay: 'linear-gradient(180deg, rgba(20,10,4,0.04), rgba(20,10,4,0.42))', panelAlpha: 0.9, blur: 16 },
      forest: { bg: '#07110d', panel: '#101c16', ink: '#e8fff3', accent: '#34d399', danger: '#f97316', label: '深林绿', backdrop: 'radial-gradient(circle at 16% 14%, rgba(52,211,153,0.16), transparent 30%), radial-gradient(circle at 86% 10%, rgba(20,184,166,0.10), transparent 28%), linear-gradient(135deg, #07110d 0%, #0e1a14 55%, #050d0a 100%)', overlay: 'linear-gradient(180deg, rgba(2,16,10,0.04), rgba(2,16,10,0.42))', panelAlpha: 0.9, blur: 18 },
      plum: { bg: '#0d0a18', panel: '#17132a', ink: '#f2ecff', accent: '#a78bfa', danger: '#fb7185', label: '午夜紫', backdrop: 'radial-gradient(circle at 18% 12%, rgba(167,139,250,0.18), transparent 30%), radial-gradient(circle at 84% 12%, rgba(236,72,153,0.10), transparent 28%), linear-gradient(135deg, #0d0a18 0%, #151026 54%, #080612 100%)', overlay: 'linear-gradient(180deg, rgba(13,10,24,0.04), rgba(13,10,24,0.44))', panelAlpha: 0.9, blur: 18 }
    };
    window.TELEPIC_THEME_LIBRARY = {
      graphite: { id: 'graphite', preset: 'graphite', label: '石墨蓝', author: 'Telepic', category: '高可读深色', description: '冷静的石墨蓝黑底，面板对比清楚。' },
      ember: { id: 'ember', preset: 'ember', label: '暗金琥珀', author: 'Telepic', category: '暖色深色', description: '暖金强调但不过曝。' },
      forest: { id: 'forest', preset: 'forest', label: '深林绿', author: 'Telepic', category: '自然深色', description: '低亮度绿色工作台。' },
      plum: { id: 'plum', preset: 'plum', label: '午夜紫', author: 'Telepic', category: '柔和深色', description: '紫色强调搭配深底。' }
    };
    window.TELEPIC_THEME_RECOMMENDED = {
      slateMint: { id: 'slateMint', preset: 'custom', label: '板岩薄荷', author: 'Telepic', category: '推荐主题', description: '灰蓝底配薄荷绿，适合长时间看图和管理。', bg: '#0a1018', panel: '#121c26', ink: '#edf7f4', accent: '#5eead4', danger: '#fb7185', backdrop: 'radial-gradient(circle at 18% 14%, rgba(94,234,212,0.14), transparent 30%), linear-gradient(135deg, #0a1018 0%, #111827 52%, #070b12 100%)', overlay: 'linear-gradient(180deg, rgba(3,7,18,0.04), rgba(3,7,18,0.42))', panelAlpha: 0.9, blur: 18 },
      inkRose: { id: 'inkRose', preset: 'custom', label: '墨色玫瑰', author: 'Telepic', category: '推荐主题', description: '暗墨底配玫瑰强调，按钮醒目但不过亮。', bg: '#100a12', panel: '#1c121d', ink: '#fff1f7', accent: '#f472b6', danger: '#fb7185', backdrop: 'radial-gradient(circle at 18% 14%, rgba(244,114,182,0.14), transparent 30%), linear-gradient(135deg, #100a12 0%, #1b1020 52%, #09070d 100%)', overlay: 'linear-gradient(180deg, rgba(16,10,18,0.04), rgba(16,10,18,0.42))', panelAlpha: 0.9, blur: 18 }
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
      function loadThemeLibrary() {
        try {
          var raw = localStorage.getItem('telepic.themeLibrary');
          var parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      }
      function saveThemeLibrary(list) {
        try { localStorage.setItem('telepic.themeLibrary', JSON.stringify(Array.isArray(list) ? list : [])); } catch (error) {}
      }
      function themeCardList() {
        var builtins = Object.keys(window.TELEPIC_THEME_LIBRARY || {}).map(function (key) {
          var base = window.TELEPIC_THEME_LIBRARY[key] || {};
          var presetTheme = window.TELEPIC_THEME_PRESETS[base.preset] || {};
          return Object.assign({ source: 'builtin' }, base, presetTheme);
        });
        var installed = loadThemeLibrary().map(function (item) { return Object.assign({ source: 'installed' }, item); });
        var installedIds = {};
        var i;
        for (i = 0; i < installed.length; i += 1) installedIds[installed[i].id] = true;
        var recommended = Object.keys(window.TELEPIC_THEME_RECOMMENDED || {}).filter(function (key) {
          return !installedIds[key];
        }).map(function (key) {
          return Object.assign({ source: 'recommended' }, window.TELEPIC_THEME_RECOMMENDED[key]);
        });
        return installed.concat(builtins).concat(recommended);
      }
      function renderFallbackThemeStore(currentId) {
        var store = qs('#themeQuickPicks');
        var meta = qs('#themeLibraryMeta');
        var items = themeCardList();
        if (meta) {
          meta.innerHTML = [
            '<div class="theme-meta-card"><strong>' + loadThemeLibrary().length + '</strong><span>我的主题</span></div>',
            '<div class="theme-meta-card"><strong>' + Object.keys(window.TELEPIC_THEME_RECOMMENDED || {}).length + '</strong><span>推荐主题</span></div>',
            '<div class="theme-meta-card"><strong>' + (localStorage.getItem('telepic.adminToken') ? '已连接' : '未登录') + '</strong><span>云端同步状态</span></div>'
          ].join('');
        }
        if (!store) return;
        store.innerHTML = items.map(function (item) {
          var active = item.id === currentId || item.preset === currentId;
          var installed = item.source === 'installed';
          var builtin = item.source === 'builtin';
          var actionLabel = item.source === 'recommended' ? '安装到我的主题' : '复制到我的主题';
          return ''
            + '<article class="theme-card' + (active ? ' is-active' : '') + '" data-theme-id="' + escapeHtml(item.id) + '" data-theme-source="' + escapeHtml(item.source || '') + '">'
            +   '<button type="button" class="theme-card-main" data-theme-id="' + escapeHtml(item.id) + '">'
            +     '<span class="theme-card-cover" style="background:' + escapeHtml(item.bg || '#eef1ee') + '"></span>'
            +     '<span class="theme-card-body">'
            +       '<strong>' + escapeHtml(item.label || item.id) + '</strong>'
            +       '<span class="theme-card-meta">' + escapeHtml(item.author || 'Telepic') + '</span>'
            +       '<span class="theme-card-desc">' + escapeHtml(item.description || '') + '</span>'
            +     '</span>'
            +   '</button>'
            +   '<div class="theme-card-actions">'
            +     '<small>' + escapeHtml(item.category || (builtin ? '内置主题' : installed ? '我的主题' : '推荐主题')) + '</small>'
            +     '<span class="theme-card-buttons">'
            +       '<button type="button" class="secondary" data-theme-action="apply" data-theme-id="' + escapeHtml(item.id) + '">启用</button>'
            +       (!builtin ? '<button type="button" class="secondary" data-theme-action="' + (item.source === 'recommended' ? 'install' : 'clone') + '" data-theme-id="' + escapeHtml(item.id) + '">' + escapeHtml(actionLabel) + '</button>' : '')
            +     '</span>'
            +   '</div>'
            + '</article>';
        }).join('');
      }
      function themeById(themeId) {
        var items = themeCardList();
        for (var i = 0; i < items.length; i += 1) {
          if (items[i].id === themeId) return items[i];
        }
        return null;
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
          html += ''
            + '<article class="asset-row' + (fallbackState.selected[items[i].id] ? ' is-selected' : '') + (fallbackState.activeImageId === items[i].id ? ' is-active' : '') + '" data-id="' + items[i].id + '">'
            +   '<label class="asset-cell asset-check asset-card-select"><input type="checkbox" data-action="select" ' + (fallbackState.selected[items[i].id] ? 'checked' : '') + '><span>选择</span></label>'
            +   '<a class="asset-cell asset-thumb asset-card-media" href="' + items[i].url + '" target="_blank" rel="noreferrer"><img src="' + items[i].rawUrl + '" alt="' + escapeHtml(items[i].originalName || items[i].id) + '"></a>'
            +   '<div class="asset-cell asset-main asset-card-body">'
            +     '<div class="asset-card-title-row"><strong>' + escapeHtml(items[i].originalName || items[i].id) + '</strong><span class="status-chip ' + (items[i].visibility === 'private' ? 'private' : 'public') + '">' + (items[i].visibility === 'private' ? '私有' : '公开') + '</span></div>'
            +     '<div class="asset-subline">ID ' + items[i].id + '</div>'
            +     '<div class="asset-card-chips chip-row"><span class="status-chip">' + (items[i].mime || 'image/*') + '</span><span class="status-chip">' + (items[i].size || 0) + ' B</span></div>'
            +     '<div class="asset-card-link asset-link"><code>' + escapeHtml(linkFor(items[i], format)) + '</code></div>'
            +   '</div>'
            +   '<div class="asset-cell asset-actions asset-card-actions"><button class="secondary" data-action="copy">复制</button><button class="secondary" data-action="detail">详情</button><button class="danger" data-action="delete">删除</button></div>'
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
      function imageMimeForFile(file) {
        var explicit = String(file && file.type || '').split(';')[0].trim().toLowerCase();
        var name = String(file && file.name || '').toLowerCase();
        if (explicit) return explicit;
        if (/\.jpe?g$/.test(name)) return 'image/jpeg';
        if (/\.png$/.test(name)) return 'image/png';
        if (/\.gif$/.test(name)) return 'image/gif';
        if (/\.webp$/.test(name)) return 'image/webp';
        if (/\.avif$/.test(name)) return 'image/avif';
        if (/\.svg$/.test(name)) return 'image/svg+xml';
        if (/\.heic$/.test(name)) return 'image/heic';
        if (/\.heif$/.test(name)) return 'image/heif';
        return 'application/octet-stream';
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
          xhr.setRequestHeader('Content-Type', imageMimeForFile(file));
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
        var theme = typeof name === 'string' ? (themeById(name) || window.TELEPIC_THEME_PRESETS[name]) : name;
        var root = document.documentElement;
        if (!theme || !root) return;
        root.style.setProperty('--bg', theme.bg);
        root.style.setProperty('--panel', theme.panel);
        root.style.setProperty('--ink', theme.ink);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--danger', theme.danger);
        var badge = qs('#themeBadge');
        var themeId = theme.id || theme.preset || name;
        if (badge) badge.textContent = theme.label;
        var preset = qs('#themePreset');
        if (preset) preset.value = theme.preset && window.TELEPIC_THEME_PRESETS[theme.preset] ? theme.preset : 'custom';
        renderFallbackThemeStore(themeId);
        try {
          localStorage.setItem('telepic.theme', JSON.stringify({
            id: themeId,
            preset: theme.preset || name,
            label: theme.label || '',
            bg: theme.bg,
            panel: theme.panel,
            ink: theme.ink,
            accent: theme.accent,
            danger: theme.danger
          }));
        } catch (error) {}
      }
      function bindFallback() {
        var loginOverlay = qs('#loginOverlay');
        var loginUsername = qs('#loginUsername');
        var loginPassword = qs('#loginPassword');
        var loginButton = qs('#loginButton');
        var fileInput = qs('#fileInput');
        var gallery = qs('#gallery');
        var detail = qs('#imageDetail');
        var closeInspectorButton = qs('#closeInspector');
        var fetchButton = qs('#fetchUrlButton');
        var createTokenButton = qs('#createToken');
        var changePasswordButton = qs('#changePassword');
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
        var savedUsername = 'admin';
        try { savedUsername = localStorage.getItem('telepic.adminUsername') || 'admin'; } catch (error) {}
        if (loginUsername) loginUsername.value = savedUsername;
        function syncLoginOverlay() {
          var token = '';
          try { token = localStorage.getItem('telepic.adminToken') || ''; } catch (error) {}
          if (loginOverlay) loginOverlay.classList.toggle('is-hidden', Boolean(token));
        }
        function openInspector() { document.body.classList.add('inspector-open'); }
        function closeInspector() { document.body.classList.remove('inspector-open'); }
        syncLoginOverlay();
        if (loginButton && loginUsername && loginPassword) {
          loginButton.addEventListener('click', function () {
            var username = loginUsername.value.trim();
            var password = loginPassword.value;
            if (!username || !password) return;
            requestJson('POST', '/api/login', { username: username, password: password }, function (status, data) {
              if (status >= 200 && status < 300 && data.token) {
                try {
                  localStorage.setItem('telepic.adminToken', data.token);
                  localStorage.setItem('telepic.adminUsername', data.username || username);
                } catch (error) {}
                loginPassword.value = '';
                syncLoginOverlay();
                loadConfig();
                loadStats();
                loadImages();
                setRuntime('管理员登录成功');
              } else {
                setRuntime((data && data.error) || '登录失败');
              }
            });
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
        if (changePasswordButton) {
          changePasswordButton.addEventListener('click', function () {
            var current = qs('#currentPassword');
            var next = qs('#newPassword');
            var confirm = qs('#confirmPassword');
            var result = qs('#passwordResult');
            if (!current || !next || !confirm) return;
            if (!current.value || !next.value || next.value !== confirm.value) {
              if (result) result.textContent = '请检查当前密码和新密码。';
              return;
            }
            requestJson('POST', '/api/admin/password', { currentPassword: current.value, newPassword: next.value }, function (status, data) {
              if (result) result.textContent = status >= 200 && status < 300 ? '密码已更新，下次登录请使用新密码。' : ((data && data.error) || '修改失败');
              if (status >= 200 && status < 300) {
                current.value = '';
                next.value = '';
                confirm.value = '';
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
            if (action === 'detail' || !action) openInspector();
            if (action === 'delete' && image) {
              deleteImage(id, function () { setRuntime('图片已删除'); });
              return;
            }
            renderGallery({ images: fallbackState.images });
          });
        }
        if (closeInspectorButton) closeInspectorButton.addEventListener('click', closeInspector);
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
            var actionButton = event.target.closest('[data-theme-action]');
            var button;
            var themeId;
            var theme;
            var library;
            if (actionButton) {
              themeId = actionButton.getAttribute('data-theme-id');
              theme = themeById(themeId);
              if (!theme) return;
              if (actionButton.getAttribute('data-theme-action') === 'apply') {
                applyTheme(theme);
              } else {
                library = loadThemeLibrary();
                if (!library.some(function (item) { return item.id === theme.id; })) library.unshift(theme);
                saveThemeLibrary(library);
                renderFallbackThemeStore(theme.id);
                setRuntime(actionButton.getAttribute('data-theme-action') === 'install' ? '推荐主题已加入我的主题' : '主题副本已保存到我的主题');
              }
              return;
            }
            button = event.target.closest('[data-theme-id]');
            if (!button) return;
            theme = themeById(button.getAttribute('data-theme-id'));
            if (!theme) return;
            applyTheme(theme);
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
            if (parsed && (parsed.id || parsed.preset)) applyTheme(parsed.id || parsed.preset);
          }
        } catch (error) {}
        renderFallbackThemeStore('graphite');
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
        }, 1200);
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
