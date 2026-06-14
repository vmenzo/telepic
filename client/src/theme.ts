import type { ThemePack } from './types/api';

const fallbackThemeId = 'graphiteMist';

export const deprecatedThemeIds = new Set([
  'gallery',
  'coast',
  'studio',
  'dusk',
  'focus',
  'botanical',
  'auroraDeck',
  'cinemaAmber',
  'paperSignal',
  'inkDesk',
  'carbonMint'
]);

export const themePresets: Record<string, ThemePack> = {
  graphiteMist: {
    id: 'graphiteMist',
    preset: 'graphiteMist',
    label: '石墨雾',
    author: 'Telepic',
    category: '专业后台',
    description: '中性石墨、清晰边界和低饱和绿色强调，适合长时间管理图片资产。',
    bg: '#f4f6f8',
    panel: '#ffffff',
    ink: '#171c21',
    accent: '#277568',
    danger: '#c84d57',
    backdrop: 'linear-gradient(180deg, #f7f8fa 0%, #eef2f4 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.18))',
    panelAlpha: 0.92,
    blur: 12
  },
  opalConsole: {
    id: 'opalConsole',
    preset: 'opalConsole',
    label: '欧泊控制台',
    author: 'Telepic',
    category: '轻量玻璃',
    description: '微冷白底搭配蓝绿强调，适合公开图床和团队素材库。',
    bg: '#edf5f4',
    panel: '#fbfefd',
    ink: '#142426',
    accent: '#187d8b',
    danger: '#c95156',
    backdrop: 'linear-gradient(135deg, #eff7f5 0%, #f9fbfc 54%, #e9f0f4 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.14))',
    panelAlpha: 0.86,
    blur: 18
  },
  sageLedger: {
    id: 'sageLedger',
    preset: 'sageLedger',
    label: '鼠尾草账本',
    author: 'Telepic',
    category: '低饱和',
    description: '灰绿底色和暖白面板，适合内容运营、相册整理和审核流程。',
    bg: '#eef3ee',
    panel: '#fffefd',
    ink: '#1d251f',
    accent: '#4f7d5b',
    danger: '#b84d50',
    backdrop: 'linear-gradient(135deg, #eef3ee 0%, #fbfaf6 55%, #edf1f2 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.40), rgba(255,255,255,0.16))',
    panelAlpha: 0.9,
    blur: 14
  }
};

export const recommendedThemes: Record<string, ThemePack> = {
  cobaltLine: {
    id: 'cobaltLine',
    preset: 'custom',
    label: '钴线',
    author: '精选参考',
    category: '数据面板',
    description: '克制的蓝色强调和灰白背景，适合系统状态、存储和 Bot 面板。',
    bg: '#f3f6fb',
    panel: '#ffffff',
    ink: '#172033',
    accent: '#326fd1',
    danger: '#d0525f',
    backdrop: 'linear-gradient(180deg, #f7f9fd 0%, #edf2f8 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0.12))',
    panelAlpha: 0.9,
    blur: 12
  },
  cranberryGlass: {
    id: 'cranberryGlass',
    preset: 'custom',
    label: '蔓越莓玻璃',
    author: '精选参考',
    category: '品牌感',
    description: '浅灰底配蔓越莓红强调，更适合个人品牌和图片展示站。',
    bg: '#f7f4f5',
    panel: '#fffdfd',
    ink: '#241a20',
    accent: '#a9355b',
    danger: '#c43c45',
    backdrop: 'linear-gradient(135deg, #f8f4f6 0%, #ffffff 52%, #eef2f4 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.16))',
    panelAlpha: 0.88,
    blur: 16
  },
  porcelainCode: {
    id: 'porcelainCode',
    preset: 'custom',
    label: '瓷白代码',
    author: '精选参考',
    category: '清爽',
    description: '瓷白背景、深墨文字和青色焦点，适合高密度表格和快速扫描。',
    bg: '#f8faf9',
    panel: '#ffffff',
    ink: '#111827',
    accent: '#0f8b8d',
    danger: '#d14b5a',
    backdrop: 'linear-gradient(180deg, #fbfcfc 0%, #eff4f3 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.12))',
    panelAlpha: 0.94,
    blur: 10
  }
};

const fallbackTheme = themePresets[fallbackThemeId];

export function isDeprecatedTheme(theme?: Partial<ThemePack> | null) {
  if (!theme) return false;
  return deprecatedThemeIds.has(String(theme.id || '')) || deprecatedThemeIds.has(String(theme.preset || ''));
}

export function isBuiltInTheme(theme?: Partial<ThemePack> | null) {
  if (!theme) return false;
  const id = String(theme.id || '');
  return Boolean(themePresets[id] || recommendedThemes[id]);
}

export function cleanThemeLibrary(library?: Partial<ThemePack>[] | null): ThemePack[] {
  if (!Array.isArray(library)) return [];
  const seen = new Set<string>();
  const cleaned: ThemePack[] = [];
  for (const item of library) {
    if (!item || isDeprecatedTheme(item) || isBuiltInTheme(item)) continue;
    const theme = normalizeTheme(item);
    if (seen.has(theme.id || '')) continue;
    seen.add(theme.id || '');
    cleaned.push(theme);
  }
  return cleaned;
}

export function normalizeTheme(theme?: Partial<ThemePack> | null): ThemePack {
  if (!theme || isDeprecatedTheme(theme)) return { ...fallbackTheme };
  const preset = theme.preset && themePresets[theme.preset] ? theme.preset : 'custom';
  const base = preset !== 'custom' ? themePresets[preset] : fallbackTheme;
  return {
    ...base,
    ...theme,
    id: theme.id || base.id || `theme_${Date.now().toString(36)}`,
    preset,
    label: theme.label || base.label || '自定义主题',
    bg: theme.bg || base.bg,
    panel: theme.panel || base.panel,
    ink: theme.ink || base.ink,
    accent: theme.accent || base.accent,
    danger: theme.danger || base.danger,
    backdrop: theme.backdrop || base.backdrop,
    overlay: theme.overlay || base.overlay,
    panelAlpha: theme.panelAlpha || base.panelAlpha || 0.9,
    blur: theme.blur || base.blur || 14
  };
}

export function applyThemeVariables(theme: ThemePack) {
  const root = document.documentElement;
  root.style.setProperty('--color-background', theme.bg);
  root.style.setProperty('--color-card', theme.panel);
  root.style.setProperty('--color-foreground', theme.ink);
  root.style.setProperty('--color-card-foreground', theme.ink);
  root.style.setProperty('--color-primary', theme.accent);
  root.style.setProperty('--color-danger', theme.danger);
  root.style.setProperty('--theme-backdrop', theme.backdrop || theme.bg);
  if (theme.image) root.style.setProperty('--theme-image', `url("${theme.image}")`);
  else root.style.removeProperty('--theme-image');
}
