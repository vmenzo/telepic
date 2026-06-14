import { escapeHtml } from './utils';
const assetVersion = Date.now();

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#101820"/>
  <rect x="10" y="10" width="44" height="44" rx="10" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
  <path d="M17 19h30v8h-11v22h-8V27H17v-8Z" fill="#fff"/>
  <path d="M41 40h9v9h-9v-9Z" fill="#277568"/>
</svg>`;

const iconDataUri = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

function htmlPage(config) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#277568">
  <link rel="icon" href="${iconDataUri}" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico">
  <title>Telepic 图床</title>
  <script>
    window.TELEPIC = { publicUrl: ${JSON.stringify(config.publicUrl)} };
    window.addEventListener("error", function (event) {
      if (!window.TELEPIC_APP_READY) {
        window.TELEPIC_APP_ERROR = event.message || "脚本加载失败";
      }
    });
  </script>
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersion}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/app.js?v=${assetVersion}"></script>
</body>
</html>`;
}

function imagePage(image, config, accessToken = '') {
  const title = escapeHtml(image.originalName || image.fileName);
  const tokenSuffix = image.visibility === 'private' && accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
  const rawPath = `/raw/${image.id}${tokenSuffix}`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#277568">
  <link rel="icon" href="${iconDataUri}" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico">
  <meta property="og:image" content="${config.publicUrl}/raw/${image.id}${tokenSuffix}">
  <meta property="og:title" content="${title}">
  <title>${title}</title>
  <style>
    :root{color-scheme:light;--ink:#17212b;--muted:#667085;--line:#d9dee7;--panel:#fff;--bg:#f6f7f9;--brand:#247f73}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;background:linear-gradient(180deg,#f7f8fa,#edf2f5);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 340px}
    .stage{display:grid;place-items:center;background:#0d1117;padding:24px}
    .stage img{display:block;max-width:100%;max-height:calc(100vh - 48px);object-fit:contain;border-radius:8px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
    aside{display:flex;flex-direction:column;gap:18px;border-left:1px solid var(--line);background:rgba(255,255,255,.94);padding:24px}
    .brand{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px}
    .mark{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#101820;color:#fff;font-weight:800}
    h1{margin:0;font-size:22px;line-height:1.18;overflow-wrap:anywhere}
    p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}
    .meta{display:grid;gap:8px}
    .row{display:flex;justify-content:space-between;gap:12px;border-radius:8px;background:#eef1f4;padding:9px 10px;font-size:13px}
    .row strong{font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    nav{display:grid;gap:10px;margin-top:auto}
    a{display:flex;align-items:center;justify-content:center;height:40px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);text-decoration:none;font-weight:600}
    a.primary{border-color:var(--brand);background:var(--brand);color:#fff}
    @media (max-width:860px){main{grid-template-columns:1fr}.stage{min-height:58vh;padding:12px}.stage img{max-height:56vh}aside{border-left:0;border-top:1px solid var(--line);padding:18px}}
  </style>
</head>
<body>
  <main>
    <section class="stage"><img src="${rawPath}" alt="${title}"></section>
    <aside>
      <div class="brand"><span class="mark">T</span><span>Telepic Image</span></div>
      <div>
        <h1>${title}</h1>
        <p>${escapeHtml(image.mime || '')} · ${formatPublicBytes(image.size || 0)}</p>
      </div>
      <div class="meta">
        <div class="row"><span>可见性</span><strong>${image.visibility === 'private' ? '私有' : '公开'}</strong></div>
        <div class="row"><span>来源</span><strong>${escapeHtml(image.source || '-')}</strong></div>
        <div class="row"><span>创建时间</span><strong>${escapeHtml(formatPublicDate(image.createdAt))}</strong></div>
      </div>
      <nav>
        <a class="primary" href="${rawPath}">查看原图</a>
        <a href="/">打开管理台</a>
      </nav>
    </aside>
  </main>
</body>
</html>`;
}

function albumPage(album, images, config) {
  const title = escapeHtml(album.name || 'Telepic 相册');
  const description = escapeHtml(album.description || `${images.length} 张图片`);
  const cover = images[0] ? `${config.publicUrl}/raw/${images[0].id}` : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#277568">
  <link rel="icon" href="${iconDataUri}" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${cover ? `<meta property="og:image" content="${cover}">` : ''}
  <title>${title}</title>
  <style>
    :root{--ink:#17212b;--muted:#667085;--line:#d9dee7;--panel:#fff;--bg:#f6f7f9;--brand:#247f73}
    *{box-sizing:border-box}
    body{margin:0;background:linear-gradient(180deg,#f7f8fa,#edf2f5);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{max-width:1200px;margin:0 auto;padding:28px 20px 44px}
    header{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;margin-bottom:22px;border-bottom:1px solid var(--line);padding-bottom:20px}
    .brand{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px}
    .mark{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#101820;color:#fff;font-weight:800}
    h1{margin:16px 0 0;font-size:clamp(32px,6vw,64px);line-height:.98;overflow-wrap:anywhere}
    p{margin:10px 0 0;color:var(--muted);line-height:1.55}
    .count{align-self:end;border:1px solid var(--line);border-radius:999px;background:#fff;padding:9px 13px;color:var(--muted);font-size:14px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
    a.card{display:block;overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff;text-decoration:none;color:inherit;box-shadow:0 10px 24px rgba(24,32,42,.06);transition:transform .18s ease,box-shadow .18s ease}
    a.card:hover{transform:translateY(-2px);box-shadow:0 18px 34px rgba(24,32,42,.1)}
    img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#eef1f4}
    strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:10px 12px;font-size:14px}
    .empty{border:1px dashed var(--line);border-radius:10px;background:#fff;padding:40px;text-align:center;color:var(--muted)}
    @media (max-width:720px){main{padding:20px 12px 32px}header{grid-template-columns:1fr}.count{justify-self:start}.grid{grid-template-columns:1fr 1fr;gap:10px}h1{font-size:34px}}
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand"><span class="mark">T</span><span>Telepic Album</span></div>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      <div class="count">${images.length} 张公开图片</div>
    </header>
    ${images.length ? `<section class="grid">${images.map((image) => `<a class="card" href="/i/${image.id}"><img src="/raw/${image.id}" alt="${escapeHtml(image.originalName || image.id)}"><strong>${escapeHtml(image.originalName || image.id)}</strong></a>`).join('')}</section>` : '<div class="empty">这个相册暂时没有公开图片。</div>'}
  </main>
</body>
</html>`;
}

function formatPublicBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes);
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatPublicDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

export { albumPage, htmlPage, iconSvg, imagePage };
