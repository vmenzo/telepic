import {
  Album,
  ApiToken,
  ConfigPayload,
  EventRecord,
  ImageRecord,
  StatsPayload,
  StorageStatusPayload,
  SystemStatusPayload,
  TelegramStatusPayload,
  ThemePack,
  TrashItem
} from './types/api';
import { api, clearSession, getStoredIdleExpiresAt, getStoredToken, getStoredUsername, storeSession, storeToken } from './lib/api';
import { applyThemeVariables, cleanThemeLibrary, isBuiltInTheme, normalizeTheme, recommendedThemes, themePresets } from './theme';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Select } from './components/ui/select';
import { TelepicMark } from './components/telepic-mark';
import { Textarea } from './components/ui/textarea';
import { cn, formatBytes, formatDate } from './lib/utils';
import {
  ArchiveRestore,
  Bot,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  HardDrive,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Maximize2,
  RotateCcw,
  Palette,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type View = 'library' | 'albums' | 'bot' | 'storage' | 'trash' | 'system' | 'theme';
type InspectorPane = 'detail' | 'events';
type LibraryMode = 'table' | 'grid';
type Toast = { id: number; message: string; tone?: 'default' | 'danger' };
type UploadQueueItem = {
  id: string;
  file?: File;
  fileName: string;
  size: number;
  status: 'queued' | 'uploading' | 'success' | 'error' | 'skipped';
  progress: number;
  message: string;
};
type ConfirmRequest = {
  title: string;
  message: string;
  tone?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (confirmed: boolean) => void;
};
type StorageForm = {
  storageDriver: string;
  s3Bucket: string;
  s3Region: string;
  s3Endpoint: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3PublicBaseUrl: string;
  s3Prefix: string;
  s3ForcePathStyle: boolean;
};

const defaultStats: StatsPayload = {
  images: 0,
  publicImages: 0,
  privateImages: 0,
  totalBytes: 0,
  averageBytes: 0,
  tokens: 0,
  sourceBreakdown: {},
  mimeBreakdown: {},
  tagBreakdown: {},
  ownerBreakdown: {}
};

const navItems: Array<{ id: View; label: string; title: string; description: string; icon: typeof ImageIcon }> = [
  { id: 'library', label: '图片', title: '图片资产控制台', description: '上传、筛选、复制链接和批量管理图片。', icon: ImageIcon },
  { id: 'albums', label: '相册', title: '相册编排', description: '组织图片集合、封面和展示顺序。', icon: Boxes },
  { id: 'bot', label: 'Bot', title: 'Telegram Bot', description: '管理 webhook、权限和消息联动。', icon: Bot },
  { id: 'storage', label: '存储', title: '存储配置', description: '切换本地或对象存储并检查连接状态。', icon: HardDrive },
  { id: 'trash', label: '回收站', title: '回收站', description: '恢复或彻底清理已删除图片。', icon: ArchiveRestore },
  { id: 'system', label: '系统', title: '系统状态', description: '查看运行信息、配置和审计记录。', icon: Settings },
  { id: 'theme', label: '主题', title: '主题外观', description: '调整控制台配色、背景和主题库。', icon: Palette }
];

declare global {
  interface Window {
    TELEPIC?: { publicUrl?: string };
    TELEPIC_APP_READY?: boolean;
    TELEPIC_APP_ERROR?: string;
  }
}

export function App() {
  const [token, setToken] = useState(getStoredToken());
  const [username, setUsername] = useState(getStoredUsername());
  const [password, setPassword] = useState('');
  const [manualToken, setManualToken] = useState(getStoredToken());
  const [config, setConfig] = useState<ConfigPayload | null>(null);
  const [stats, setStats] = useState<StatsPayload>(defaultStats);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [imageTotal, setImageTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeImageId, setActiveImageId] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState('');
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusPayload | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatusPayload | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusPayload | null>(null);
  const [theme, setTheme] = useState<ThemePack>(() => normalizeTheme(readLocalTheme()));
  const [themeLibrary, setThemeLibrary] = useState<ThemePack[]>(() => cleanThemeLibrary(readLocalThemeLibrary()));
  const [view, setView] = useState<View>('library');
  const [pane, setPane] = useState<InspectorPane>('detail');
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [visibility, setVisibility] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('newest');
  const [linkFormat, setLinkFormat] = useState('page');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('table');
  const [offset, setOffset] = useState(0);
  const [limit] = useState(24);
  const [uploadStorageDriver, setUploadStorageDriver] = useState('default');
  const [fetchUrl, setFetchUrl] = useState('');
  const [batchTags, setBatchTags] = useState('');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageRecord | null>(null);
  const [lightboxImageId, setLightboxImageId] = useState('');
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [telegramForm, setTelegramForm] = useState({ publicUrl: '', botToken: '', webhookSecret: '', allowedUserIds: '' });
  const [storageForm, setStorageForm] = useState({
    storageDriver: 'local',
    s3Bucket: '',
    s3Region: 'auto',
    s3Endpoint: '',
    s3AccessKeyId: '',
    s3SecretAccessKey: '',
    s3PublicBaseUrl: '',
    s3Prefix: 'telepic',
    s3ForcePathStyle: true
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [tokenForm, setTokenForm] = useState({ name: '', upload: true, read: true, manage: false, delete: false, expiresAt: '', created: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const themeImportRef = useRef<HTMLInputElement | null>(null);
  const themeImageRef = useRef<HTMLInputElement | null>(null);

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) || images[0] || null,
    [activeImageId, images]
  );
  const activeAlbum = useMemo(
    () => albums.find((album) => album.id === activeAlbumId) || albums[0] || null,
    [activeAlbumId, albums]
  );
  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedImages = useMemo(() => images.filter((image) => selected.has(image.id)), [images, selected]);
  const pageImageIds = useMemo(() => images.map((image) => image.id), [images]);
  const pageSelectedCount = useMemo(() => pageImageIds.filter((id) => selected.has(id)).length, [pageImageIds, selected]);
  const allPageSelected = pageImageIds.length > 0 && pageSelectedCount === pageImageIds.length;
  const loggedIn = Boolean(token);
  const activeNavItem = navItems.find((item) => item.id === view) || navItems[0];
  const showLibrarySidebar = view === 'library';
  const uploadingCount = useMemo(() => uploadQueue.filter((item) => ['queued', 'uploading'].includes(item.status)).length, [uploadQueue]);
  const lightboxImage = useMemo(() => images.find((image) => image.id === lightboxImageId) || null, [images, lightboxImageId]);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200);
  }, []);

  const run = useCallback(
    async <T,>(label: string, task: () => Promise<T>, success?: string) => {
      setBusy(label);
      try {
        const result = await task();
        if (success) toast(success);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '操作失败';
        toast(message, 'danger');
        throw error;
      } finally {
        setBusy('');
      }
    },
    [toast]
  );

  const askConfirm = useCallback((request: Omit<ConfirmRequest, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      setConfirmRequest({ ...request, resolve });
    });
  }, []);

  const refreshConfig = useCallback(async () => {
    const data = await api.config();
    setConfig(data);
    setTelegramForm({
      publicUrl: data.publicUrl || window.TELEPIC?.publicUrl || '',
      botToken: '',
      webhookSecret: data.telegramWebhookSecret || '',
      allowedUserIds: data.telegramAllowedUserIds || ''
    });
    setStorageForm({
      storageDriver: data.storageDriver || 'local',
      s3Bucket: data.s3Bucket || '',
      s3Region: data.s3Region || 'auto',
      s3Endpoint: data.s3Endpoint || '',
      s3AccessKeyId: '',
      s3SecretAccessKey: '',
      s3PublicBaseUrl: data.s3PublicBaseUrl || '',
      s3Prefix: data.s3Prefix || 'telepic',
      s3ForcePathStyle: Boolean(data.s3ForcePathStyle)
    });
    return data;
  }, []);

  const refreshStats = useCallback(async () => setStats(await api.stats()), []);

  const refreshImages = useCallback(async () => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      sort
    });
    if (query) params.set('q', query);
    if (tagFilter) params.set('tag', tagFilter);
    if (visibility) params.set('visibility', visibility);
    if (source) params.set('source', source);
    if (activeAlbumId && view === 'albums') params.set('albumId', activeAlbumId);
    const data = await api.images(params);
    setImages(data.images);
    setImageTotal(data.total);
    setHasMore(data.hasMore);
    if (!data.images.some((image) => image.id === activeImageId)) {
      setActiveImageId(data.images[0]?.id || '');
    }
  }, [activeAlbumId, activeImageId, limit, offset, query, sort, source, tagFilter, view, visibility]);

  const refreshProtected = useCallback(async () => {
    if (!getStoredToken()) return;
    const results = await Promise.allSettled([
      api.tokens(),
      api.albums(),
      api.events(),
      api.trash(),
      api.telegramStatus(),
      api.storageStatus(),
      api.systemStatus(),
      api.themeSettings()
    ]);
    if (results[0].status === 'fulfilled') setTokens(results[0].value.tokens);
    if (results[1].status === 'fulfilled') {
      setAlbums(results[1].value.albums);
      if (!activeAlbumId) setActiveAlbumId(results[1].value.albums[0]?.id || '');
    }
    if (results[2].status === 'fulfilled') setEvents(results[2].value.events);
    if (results[3].status === 'fulfilled') setTrash(results[3].value.items);
    if (results[4].status === 'fulfilled') setTelegramStatus(results[4].value);
    if (results[5].status === 'fulfilled') setStorageStatus(results[5].value);
    if (results[6].status === 'fulfilled') setSystemStatus(results[6].value);
    if (results[7].status === 'fulfilled') {
      const nextTheme = normalizeTheme(results[7].value.theme || readLocalTheme());
      const nextLibrary = cleanThemeLibrary(results[7].value.library || readLocalThemeLibrary());
      setTheme(nextTheme);
      setThemeLibrary(nextLibrary);
      persistTheme(nextTheme, nextLibrary);
      applyThemeVariables(nextTheme);
    }
  }, [activeAlbumId]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([refreshConfig(), refreshStats(), refreshImages(), refreshProtected()]);
  }, [refreshConfig, refreshImages, refreshProtected, refreshStats]);

  useEffect(() => {
    window.TELEPIC_APP_READY = true;
    applyThemeVariables(theme);
    refreshAll().catch(() => {});
  }, []);

  useEffect(() => {
    refreshImages().catch(() => {});
  }, [refreshImages]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        setView('library');
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setSelected(new Set());
        setDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [query, tagFilter, visibility, source, sort]);

  useEffect(() => {
    if (view !== 'albums' || !albums.length) return;
    if (albums.some((album) => album.id === activeAlbumId)) return;
    setActiveAlbumId(albums[0].id);
    setOffset(0);
  }, [activeAlbumId, albums, view]);

  useEffect(() => {
    const handler = () => {
      if (!getStoredToken()) return;
      const idle = getStoredIdleExpiresAt();
      if (idle && Date.now() >= idle) {
        clearSession();
        setToken('');
        setManualToken('');
        setSessionNotice('登录会话已因空闲超时失效，请重新登录。');
        toast('登录空闲超过限制，请重新登录', 'danger');
        return;
      }
      api.refreshSession().then(storeSession).catch(() => {});
    };
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [toast]);

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'));
      if (!files.length) return;
      event.preventDefault();
      uploadFiles(files);
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [uploadStorageDriver]);

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (event.dataTransfer.types.includes('Files')) setDragActive(true);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name));
    if (files.length) uploadFiles(files);
  }

  function updateUploadItem(id: string, patch: Partial<UploadQueueItem>) {
    setUploadQueue((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item).slice(0, 12));
  }

  async function login() {
    const session = await run('login', () => api.login(username.trim(), password), '登录成功');
    if (!session) return;
    storeSession(session);
    setSessionNotice('');
    setToken(session.token);
    setManualToken(session.token);
    setUsername(session.username || username);
    setPassword('');
    await refreshAll();
  }

  async function applyManualToken() {
    storeToken(manualToken.trim());
    setToken(manualToken.trim());
    await refreshAll();
    toast(manualToken.trim() ? '管理员身份已更新' : '已清空管理员密钥');
  }

  function logout() {
    clearSession();
    setSessionNotice('');
    setToken('');
    setManualToken('');
    setPassword('');
    toast('已退出管理员登录');
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    const existing = new Set(images.map((image) => `${image.originalName || image.fileName}:${image.size}`));
    const batchSeen = new Set<string>();
    const items = list.map((file) => {
      const fingerprint = `${file.name}:${file.size}`;
      const duplicate = existing.has(fingerprint) || batchSeen.has(fingerprint);
      batchSeen.add(fingerprint);
      return {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        fileName: file.name,
        size: file.size,
        status: duplicate ? 'skipped' as const : 'queued' as const,
        progress: duplicate ? 100 : 0,
        message: duplicate ? '已跳过重复文件' : '等待上传'
      };
    });
    setUploadQueue((current) => [...items, ...current].slice(0, 12));
    const pending = items.filter((item) => item.status === 'queued' && item.file);
    if (!pending.length) return;
    setBusy('upload');
    try {
      for (const item of pending) {
        updateUploadItem(item.id, { status: 'uploading', message: '上传中', progress: 1 });
        try {
          const data = await api.uploadFileWithProgress(item.file!, uploadStorageDriver, (progress) => {
            updateUploadItem(item.id, { progress });
          });
          updateUploadItem(item.id, {
            fileName: data.image.originalName || item.fileName,
            status: 'success',
            progress: 100,
            message: '上传成功'
          });
        } catch (error) {
          updateUploadItem(item.id, {
            status: 'error',
            progress: 100,
            message: error instanceof Error ? error.message : '上传失败'
          });
        }
      }
    } finally {
      setBusy('');
    }
    await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
  }

  async function retryUpload(item: UploadQueueItem) {
    if (!item.file) return toast('这个项目缺少本地文件，不能重试', 'danger');
    updateUploadItem(item.id, { status: 'uploading', message: '重新上传中', progress: 1 });
    setBusy('upload');
    try {
      const data = await api.uploadFileWithProgress(item.file, uploadStorageDriver, (progress) => updateUploadItem(item.id, { progress }));
      updateUploadItem(item.id, {
        fileName: data.image.originalName || item.fileName,
        status: 'success',
        progress: 100,
        message: '上传成功'
      });
      await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
    } catch (error) {
      updateUploadItem(item.id, {
        status: 'error',
        progress: 100,
        message: error instanceof Error ? error.message : '上传失败'
      });
    } finally {
      setBusy('');
    }
  }

  function toggleSelectCurrentPage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        pageImageIds.forEach((id) => next.delete(id));
      } else {
        pageImageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function fetchRemoteUrl() {
    if (!fetchUrl.trim()) return toast('先输入图片 URL', 'danger');
    setFetchingUrl(true);
    try {
      await run('fetch', () => api.uploadFromUrl(fetchUrl.trim(), uploadStorageDriver), '抓取成功');
      setFetchUrl('');
      await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
    } finally {
      setFetchingUrl(false);
    }
  }

  async function saveImageEdit(image: ImageRecord) {
    const name = (document.getElementById('detail-name') as HTMLInputElement | null)?.value || '';
    const tags = (document.getElementById('detail-tags') as HTMLInputElement | null)?.value || '';
    await run('image', () => api.updateImage(image.id, { originalName: name, tags }), '图片信息已保存');
    setDetailOpen(false);
    await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
  }

  async function toggleVisibility(image: ImageRecord) {
    await run('image', () => api.updateImage(image.id, { visibility: image.visibility === 'private' ? 'public' : 'private' }), '可见性已更新');
    await Promise.allSettled([refreshImages(), refreshStats()]);
  }

  async function deleteImage(image: ImageRecord) {
    const confirmed = await askConfirm({
      title: '删除图片',
      message: `确定把“${image.originalName || image.id}”移入回收站吗？`,
      tone: 'danger',
      confirmLabel: '删除'
    });
    if (!confirmed) return;
    await run('delete', () => api.deleteImage(image.id), '图片已移入回收站');
    setSelected((current) => {
      const next = new Set(current);
      next.delete(image.id);
      return next;
    });
    await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
  }

  async function runBulk(action: 'delete' | 'public' | 'private' | 'tags' | 'clear-tags') {
    if (!selectedIds.length) return toast('先选择图片', 'danger');
    if (action === 'delete' || action === 'clear-tags') {
      const confirmed = await askConfirm({
        title: action === 'delete' ? '批量删除图片' : '清空标签',
        message: action === 'delete' ? `确定把 ${selectedIds.length} 张图片移入回收站吗？` : `确定清空 ${selectedIds.length} 张图片的标签吗？`,
        tone: action === 'delete' ? 'danger' : 'default',
        confirmLabel: action === 'delete' ? '批量删除' : '清空标签'
      });
      if (!confirmed) return;
    }
    if (action === 'delete') await run('bulk', () => api.bulkDelete(selectedIds), '已批量删除');
    if (action === 'public') await run('bulk', () => api.bulkUpdate(selectedIds, { visibility: 'public' }), '已批量公开');
    if (action === 'private') await run('bulk', () => api.bulkUpdate(selectedIds, { visibility: 'private' }), '已批量私有');
    if (action === 'tags') await run('bulk', () => api.bulkUpdate(selectedIds, { tags: batchTags }), '已批量更新标签');
    if (action === 'clear-tags') await run('bulk', () => api.bulkUpdate(selectedIds, { tags: [] }), '已批量清空标签');
    setSelected(new Set());
    await Promise.allSettled([refreshImages(), refreshStats(), refreshProtected()]);
  }

  async function copySelectedLinks() {
    if (!selectedIds.length) return toast('先选择图片', 'danger');
    const lines = selectedImages.map((image) => linkFor(image, linkFormat, token));
    await navigator.clipboard.writeText(lines.join('\n'));
    toast('链接已复制');
  }

  async function downloadSelected() {
    if (!selectedIds.length) return toast('先选择图片', 'danger');
    const blob = await run('download', () => api.downloadImages(selectedIds));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telepic-export-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openLightbox(image: ImageRecord) {
    setActiveImageId(image.id);
    setLightboxImageId(image.id);
  }

  function moveLightbox(direction: 'prev' | 'next') {
    if (!images.length) return;
    const current = Math.max(0, images.findIndex((image) => image.id === lightboxImageId));
    const nextIndex = direction === 'prev'
      ? (current - 1 + images.length) % images.length
      : (current + 1) % images.length;
    setActiveImageId(images[nextIndex].id);
    setLightboxImageId(images[nextIndex].id);
  }

  async function copyImageLink(image: ImageRecord, format = linkFormat) {
    await navigator.clipboard.writeText(linkFor(image, format, token));
    toast('链接已复制');
  }

  function downloadImage(image: ImageRecord) {
    const link = document.createElement('a');
    link.href = previewRawUrl(image, token);
    link.download = image.originalName || image.fileName || `${image.id}.image`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function createAlbum() {
    if (!newAlbumName.trim()) return toast('请输入相册名称', 'danger');
    const data = await run('album', () => api.createAlbum(newAlbumName.trim()), '相册已创建');
    setNewAlbumName('');
    await refreshProtected();
    if (data) {
      setActiveAlbumId(data.album.id);
      setOffset(0);
    }
  }

  async function saveAlbumMeta() {
    if (!activeAlbum) return;
    const name = (document.getElementById('album-name') as HTMLInputElement | null)?.value || '';
    const description = (document.getElementById('album-description') as HTMLInputElement | null)?.value || '';
    const sortMode = (document.getElementById('album-sort') as HTMLSelectElement | null)?.value || 'manual';
    await run('album', () => api.updateAlbum(activeAlbum.id, { name, description, sortMode: sortMode as Album['sortMode'] }), '相册已保存');
    await refreshProtected();
  }

  async function addSelectedToAlbum() {
    if (!activeAlbum) return toast('先创建或选择相册', 'danger');
    if (!selectedIds.length) return toast('先选择图片', 'danger');
    await run('album', () => api.addImagesToAlbum(activeAlbum.id, selectedIds), '已加入相册');
    setSelected(new Set());
    setOffset(0);
    await Promise.allSettled([refreshProtected(), refreshImages()]);
  }

  async function saveTelegram() {
    await run('telegram', () => api.saveTelegram(telegramForm), 'Bot 配置已保存');
    await Promise.allSettled([refreshConfig(), refreshProtected()]);
  }

  async function saveStorage() {
    await run('storage', () => api.saveStorage(storageForm), '存储配置已保存');
    await Promise.allSettled([refreshConfig(), refreshProtected()]);
  }

  async function savePassword() {
    if (!passwordForm.current || !passwordForm.next || passwordForm.next !== passwordForm.confirm) {
      return toast('请检查当前密码和新密码', 'danger');
    }
    await run('password', () => api.changePassword(passwordForm.current, passwordForm.next), '密码已更新');
    setPasswordForm({ current: '', next: '', confirm: '' });
  }

  async function createToken() {
    const scopes = [
      tokenForm.upload ? 'upload' : '',
      tokenForm.read ? 'read' : '',
      tokenForm.manage ? 'manage' : '',
      tokenForm.delete ? 'delete' : ''
    ].filter(Boolean);
    if (!scopes.length) return toast('至少选择一个权限', 'danger');
    const data = await run('token', () => api.createToken(tokenForm.name || 'API token', scopes, tokenForm.expiresAt), '密钥已创建');
    if (data) setTokenForm({ ...tokenForm, name: '', expiresAt: '', created: data.token });
    await refreshProtected();
  }

  async function confirmDeleteToken(id: string) {
    const tokenRecord = tokens.find((item) => item.id === id);
    const confirmed = await askConfirm({
      title: '删除 API 密钥',
      message: `确定删除“${tokenRecord?.name || id}”吗？已经分发出去的这个密钥会立即失效。`,
      tone: 'danger',
      confirmLabel: '删除密钥'
    });
    if (!confirmed) return;
    await run('token', () => api.deleteToken(id), '密钥已删除');
    await refreshProtected();
  }

  async function saveThemeToCloud() {
    const nextLibrary = cleanThemeLibrary(themeLibrary);
    await run('theme', () => api.saveTheme(theme, nextLibrary), '主题已保存到云端');
    setThemeLibrary(nextLibrary);
    persistTheme(theme, nextLibrary);
  }

  async function clearThemeLibrary() {
    setThemeLibrary([]);
    persistTheme(theme, []);
    await run('theme', () => api.saveTheme(theme, []), '我的主题已清空');
  }

  function applyTheme(themePack: ThemePack) {
    const next = normalizeTheme(themePack);
    const nextLibrary = cleanThemeLibrary(themeLibrary);
    setTheme(next);
    setThemeLibrary(nextLibrary);
    applyThemeVariables(next);
    persistTheme(next, nextLibrary);
  }

  async function importThemeFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const nextTheme = normalizeTheme(parsed.theme || parsed);
      const nextLibrary = cleanThemeLibrary(Array.isArray(parsed.library) ? parsed.library : themeLibrary);
      setTheme(nextTheme);
      setThemeLibrary(nextLibrary);
      applyThemeVariables(nextTheme);
      persistTheme(nextTheme, nextLibrary);
      toast('主题已导入');
    } catch {
      toast('主题文件格式无效', 'danger');
    }
  }

  function exportThemeFile() {
    const payload = JSON.stringify({ theme, library: cleanThemeLibrary(themeLibrary) }, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telepic-theme-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('主题文件已导出');
  }

  function importThemeImage(file: File) {
    if (!file.type.startsWith('image/')) return toast('请选择图片文件', 'danger');
    if (file.size > 2.5 * 1024 * 1024) return toast('背景图不能超过 2.5MB', 'danger');
    const reader = new FileReader();
    reader.onload = () => {
      const next = normalizeTheme({ ...theme, preset: 'custom', image: String(reader.result || '') });
      const nextLibrary = cleanThemeLibrary(themeLibrary);
      setTheme(next);
      setThemeLibrary(nextLibrary);
      applyThemeVariables(next);
      persistTheme(next, nextLibrary);
      toast('背景图已应用');
    };
    reader.readAsDataURL(file);
  }

  const content = (
    <>
      <Metrics stats={stats} config={config} storage={storageStatus} />
      {view === 'library' && (
        <LibraryView
          images={images}
          total={imageTotal}
          offset={offset}
          limit={limit}
          hasMore={hasMore}
          selected={selected}
          activeImageId={activeImageId}
          query={query}
          tagFilter={tagFilter}
          visibility={visibility}
          source={source}
          sort={sort}
          linkFormat={linkFormat}
          mode={libraryMode}
          searchRef={searchInputRef}
          allPageSelected={allPageSelected}
          pageSelectedCount={pageSelectedCount}
          setQuery={setQuery}
          setTagFilter={setTagFilter}
          setVisibility={setVisibility}
          setSource={setSource}
          setSort={setSort}
          setLinkFormat={setLinkFormat}
          setMode={setLibraryMode}
          setSelected={setSelected}
          toggleSelectCurrentPage={toggleSelectCurrentPage}
          clearSelected={() => setSelected(new Set())}
          setActiveImageId={setActiveImageId}
          setOffset={setOffset}
          openLightbox={openLightbox}
          openDetail={(image) => {
            setEditingImage(image);
            setDetailOpen(true);
          }}
          copyImageLink={copyImageLink}
          downloadImage={downloadImage}
          toggleVisibility={toggleVisibility}
          deleteImage={deleteImage}
          linkToken={token}
          refresh={refreshImages}
          toast={toast}
        />
      )}
      {view === 'albums' && (
        <AlbumsView
          albums={albums}
          images={images}
          imageTotal={imageTotal}
          offset={offset}
          limit={limit}
          hasMore={hasMore}
          activeAlbum={activeAlbum}
          activeAlbumId={activeAlbumId}
          newAlbumName={newAlbumName}
          setNewAlbumName={setNewAlbumName}
          setActiveAlbumId={(id) => {
            setActiveAlbumId(id);
            setOffset(0);
            setQuery('');
            setTagFilter('');
            setVisibility('');
            setSource('');
          }}
          createAlbum={createAlbum}
          saveAlbumMeta={saveAlbumMeta}
          addSelectedToAlbum={addSelectedToAlbum}
          copyAlbumLink={async (url) => {
            await navigator.clipboard.writeText(url);
            toast('公开相册链接已复制');
          }}
          setOffset={setOffset}
          removeImage={async (imageId) => {
            if (!activeAlbum) return;
            await run('album', () => api.removeImageFromAlbum(activeAlbum.id, imageId), '已移出相册');
            await Promise.allSettled([refreshProtected(), refreshImages()]);
          }}
          setCover={async (imageId) => {
            if (!activeAlbum) return;
            await run('album', () => api.updateAlbum(activeAlbum.id, { coverImageId: imageId }), '封面已更新');
            await Promise.allSettled([refreshProtected(), refreshImages()]);
          }}
          reorder={async (imageId, direction) => {
            if (!activeAlbum) return;
            await run('album', () => api.reorderAlbum(activeAlbum.id, imageId, direction), '排序已更新');
            await Promise.allSettled([refreshProtected(), refreshImages()]);
          }}
          sortImages={async (ids) => {
            if (!activeAlbum) return;
            await run('album', () => api.sortAlbumImages(activeAlbum.id, ids), '排序已更新');
            await Promise.allSettled([refreshProtected(), refreshImages()]);
          }}
          deleteAlbum={async () => {
            if (!activeAlbum) return;
            const confirmed = await askConfirm({
              title: '删除相册',
              message: `确定删除相册“${activeAlbum.name}”吗？图片本身不会被删除。`,
              tone: 'danger',
              confirmLabel: '删除相册'
            });
            if (!confirmed) return;
            await run('album', () => api.deleteAlbum(activeAlbum.id), '相册已删除');
            setActiveAlbumId('');
            await refreshProtected();
          }}
        />
      )}
      {view === 'bot' && (
        <BotView
          form={telegramForm}
          setForm={setTelegramForm}
          status={telegramStatus}
          save={saveTelegram}
          register={() => run('telegram', () => api.registerTelegramWebhook(), 'Webhook 已注册').then(refreshProtected)}
          sendTest={(chatId, message) => run('telegram', () => api.sendTelegramTest(chatId, message), '测试消息已发送')}
        />
      )}
      {view === 'storage' && (
        <StorageView
          form={storageForm}
          setForm={setStorageForm}
          status={storageStatus}
          save={saveStorage}
          test={() => run('storage', () => api.testStorage(), '存储测试通过').then(refreshProtected)}
          migrate={() => run('storage', () => api.migrateStorage(), '迁移任务完成').then(refreshProtected)}
        />
      )}
      {view === 'trash' && (
        <TrashView
          items={trash}
          restore={(id) => run('trash', () => api.restoreTrash(id), '已恢复').then(refreshAll)}
          remove={async (id) => {
            const confirmed = await askConfirm({
              title: '彻底删除',
              message: '确定彻底删除这张图片吗？这个操作无法从回收站恢复。',
              tone: 'danger',
              confirmLabel: '彻底删除'
            });
            if (confirmed) await run('trash', () => api.deleteTrash(id), '已彻底删除').then(refreshAll);
          }}
          empty={async () => {
            const confirmed = await askConfirm({
              title: '清空回收站',
              message: `确定彻底删除回收站中的 ${trash.length} 个项目吗？`,
              tone: 'danger',
              confirmLabel: '清空'
            });
            if (confirmed) await run('trash', () => api.emptyTrash(), '回收站已清空').then(refreshAll);
          }}
        />
      )}
      {view === 'system' && (
        <SystemView
          config={config}
          status={systemStatus}
          events={events}
          refresh={refreshProtected}
          tokens={tokens}
          tokenForm={tokenForm}
          setTokenForm={setTokenForm}
          createToken={createToken}
          deleteToken={confirmDeleteToken}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          savePassword={savePassword}
        />
      )}
      {view === 'theme' && (
        <ThemeView
          theme={theme}
          library={themeLibrary}
          setTheme={setTheme}
          applyTheme={applyTheme}
          setLibrary={setThemeLibrary}
          saveCloud={saveThemeToCloud}
          clearLibrary={clearThemeLibrary}
          importRef={themeImportRef}
          imageRef={themeImageRef}
          importTheme={importThemeFile}
          exportTheme={exportThemeFile}
          importImage={importThemeImage}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen">
      {!loggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TelepicMark />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Login</p>
                  <CardTitle className="mt-1 text-xl">Telepic 管理员登录</CardTitle>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionNotice && <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{sessionNotice}</div>}
              <Field label="管理员用户名">
                <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
              </Field>
              <Field label="密码">
                <Input
                  value={password}
                  type="password"
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && login()}
                />
              </Field>
              <Button className="w-full" onClick={login} disabled={busy === 'login'}>
                {busy === 'login' && <Loader2 className="h-4 w-4 animate-spin" />}
                进入控制台
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-lg:grid-cols-1">
        <aside className="sticky top-0 h-screen overflow-auto border-r border-border bg-white/86 p-4 shadow-sm max-lg:static max-lg:h-auto max-lg:border-b max-lg:border-r-0 max-sm:p-3">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            <TelepicMark />
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Telepic 图床</h1>
              <p className="text-xs text-muted-foreground">图片资产与 Bot 管理台</p>
            </div>
          </div>

          <div
            className={cn('mb-5 space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm transition', dragActive && 'border-primary bg-primary/5')}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Field label="本次上传位置">
              <Select value={uploadStorageDriver} onChange={(event) => setUploadStorageDriver(event.target.value)}>
                <option value="default">跟随当前配置</option>
                <option value="local">本地存储</option>
                <option value="s3">对象存储</option>
              </Select>
            </Field>
            <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
            <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
              {uploadingCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingCount > 0 ? `上传中 ${uploadingCount}` : dragActive ? '松开上传' : '上传图片'}
            </Button>
            <div className="flex gap-2">
              <Input placeholder="URL 抓图：粘贴图片地址" value={fetchUrl} onChange={(event) => setFetchUrl(event.target.value)} />
              <Button size="icon" onClick={fetchRemoteUrl} disabled={fetchingUrl} aria-label="抓取 URL">
                {fetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">支持本地上传、拖拽、粘贴截图和 URL 抓图，重复文件会自动跳过。</p>
            <UploadQueue items={uploadQueue} retry={retryUpload} clear={() => setUploadQueue([])} />
          </div>

          <nav className="grid gap-1 max-lg:grid-cols-4 max-sm:grid-cols-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm transition hover:bg-muted',
                    view === item.id && 'bg-primary text-primary-foreground hover:bg-primary'
                  )}
                  onClick={() => setView(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 p-5 max-sm:p-3">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">运营后台</p>
              <h2 className="text-2xl font-semibold">{activeNavItem.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{activeNavItem.description}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 max-lg:justify-start max-sm:w-full">
              <Badge tone={loggedIn ? 'success' : 'warning'}>{loggedIn ? '已登录' : '未登录'}</Badge>
              <Input className="w-72 max-sm:w-full" value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="API 管理密钥 / 会话 Token" type="password" />
              <Button className="max-sm:flex-1" variant="secondary" onClick={applyManualToken}>切换</Button>
              <Button className="max-sm:flex-1" variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4" />
                退出
              </Button>
              <Button variant="outline" size="icon" onClick={refreshAll} aria-label="刷新">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className={cn('grid gap-4', showLibrarySidebar ? 'grid-cols-[minmax(0,1fr)_360px] max-2xl:grid-cols-1' : 'grid-cols-1')}>
            <section className="min-w-0 space-y-4">{content}</section>
            {showLibrarySidebar && (
              <aside className="sticky top-5 h-fit space-y-4 max-2xl:static">
                <BatchPanel
                  selectedCount={selected.size}
                  batchTags={batchTags}
                  setBatchTags={setBatchTags}
                  runBulk={runBulk}
                  copySelectedLinks={copySelectedLinks}
                  downloadSelected={downloadSelected}
                  addSelectedToAlbum={addSelectedToAlbum}
                  clearSelected={() => setSelected(new Set())}
                />
                <Inspector
                  pane={pane}
                  setPane={setPane}
                  image={activeImage}
                  events={events}
                  openDetail={(image) => {
                    setEditingImage(image);
                    setDetailOpen(true);
                  }}
                />
              </aside>
            )}
          </div>
        </main>
      </div>

      {view === 'library' && (
        <FloatingBatchBar
          selectedCount={selected.size}
          linkFormat={linkFormat}
          setLinkFormat={setLinkFormat}
          copySelectedLinks={copySelectedLinks}
          downloadSelected={downloadSelected}
          runBulk={runBulk}
          addSelectedToAlbum={addSelectedToAlbum}
          clearSelected={() => setSelected(new Set())}
        />
      )}

      <Lightbox
        image={lightboxImage}
        total={images.length}
        index={Math.max(0, images.findIndex((image) => image.id === lightboxImageId))}
        token={token}
        linkFormat={linkFormat}
        open={Boolean(lightboxImage)}
        onOpenChange={(open) => !open && setLightboxImageId('')}
        prev={() => moveLightbox('prev')}
        next={() => moveLightbox('next')}
        copy={copyImageLink}
        download={downloadImage}
        edit={(image) => {
          setEditingImage(image);
          setDetailOpen(true);
        }}
        toggleVisibility={toggleVisibility}
        remove={deleteImage}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>图片详情</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-4 p-5">
              <img className="max-h-72 w-full rounded-md object-contain bg-muted" src={previewRawUrl(editingImage, token)} alt="" />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="图片名称">
                  <Input id="detail-name" defaultValue={editingImage.originalName || ''} />
                </Field>
                <Field label="标签">
                  <Input id="detail-tags" defaultValue={(editingImage.tags || []).join(', ')} />
                </Field>
              </div>
              <div className="grid gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <span>ID：{editingImage.id}</span>
                <span>类型：{editingImage.mime}</span>
                <span>大小：{formatBytes(editingImage.size)}</span>
                <span>创建：{formatDate(editingImage.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => saveImageEdit(editingImage)}>保存</Button>
                <Button variant="secondary" onClick={() => toggleVisibility(editingImage)}>
                  {editingImage.visibility === 'private' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {editingImage.visibility === 'private' ? '设为公开' : '设为私有'}
                </Button>
                <Button variant="danger" onClick={() => deleteImage(editingImage)}>
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />

      <div className="fixed bottom-4 right-4 z-50 grid gap-2">
        {toasts.map((item) => (
          <div key={item.id} className={cn('rounded-md border px-4 py-3 text-sm shadow-lg', item.tone === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-border bg-card')}>
            {item.message}
          </div>
        ))}
      </div>
      {busy && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow">
          <Loader2 className="h-4 w-4 animate-spin" />
          处理中
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  function resolve(confirmed: boolean) {
    request?.resolve(confirmed);
    onClose();
  }

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && resolve(false)}>
      <DialogContent className="w-[min(460px,calc(100vw-32px))]">
        <DialogHeader>
          <DialogTitle>{request?.title || '确认操作'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-muted-foreground">{request?.message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => resolve(false)}>
              {request?.cancelLabel || '取消'}
            </Button>
            <Button variant={request?.tone === 'danger' ? 'danger' : 'default'} onClick={() => resolve(true)}>
              {request?.confirmLabel || '确认'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metrics({ stats, config, storage }: { stats: StatsPayload; config: ConfigPayload | null; storage: StorageStatusPayload | null }) {
  const items = [
    ['图片总数', stats.images],
    ['公开图片', stats.publicImages],
    ['私有图片', stats.privateImages],
    ['占用空间', formatBytes(stats.totalBytes)],
    ['API 密钥', stats.tokens],
    ['Telegram', config?.telegramEnabled ? '已启用' : '未启用'],
    ['数据库', config?.databaseDriver || '检测中'],
    ['存储', storage?.storageDriver || config?.storageDriver || '检测中']
  ];
  return (
    <section className="grid metric-grid gap-3">
      {items.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <strong className="mt-1 block truncate text-lg">{value}</strong>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function EmptyState({ icon: Icon = ImageIcon, title, detail, action }: { icon?: typeof ImageIcon; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/35 p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-card text-muted-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

function LibraryView(props: {
  images: ImageRecord[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  selected: Set<string>;
  activeImageId: string;
  query: string;
  tagFilter: string;
  visibility: string;
  source: string;
  sort: string;
  linkFormat: string;
  mode: LibraryMode;
  searchRef: React.RefObject<HTMLInputElement | null>;
  allPageSelected: boolean;
  pageSelectedCount: number;
  setQuery: (value: string) => void;
  setTagFilter: (value: string) => void;
  setVisibility: (value: string) => void;
  setSource: (value: string) => void;
  setSort: (value: string) => void;
  setLinkFormat: (value: string) => void;
  setMode: (mode: LibraryMode) => void;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelectCurrentPage: () => void;
  clearSelected: () => void;
  setActiveImageId: (id: string) => void;
  setOffset: (value: number | ((current: number) => number)) => void;
  openLightbox: (image: ImageRecord) => void;
  openDetail: (image: ImageRecord) => void;
  copyImageLink: (image: ImageRecord, format?: string) => void;
  downloadImage: (image: ImageRecord) => void;
  toggleVisibility: (image: ImageRecord) => void;
  deleteImage: (image: ImageRecord) => void;
  linkToken: string;
  refresh: () => void;
  toast: (message: string, tone?: Toast['tone']) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>图片资产列表</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{props.total} 张图片，当前页已选 {props.pageSelectedCount} 张。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={props.toggleSelectCurrentPage}>
            <Check className="h-4 w-4" />
            {props.allPageSelected ? '取消本页' : '选择本页'}
          </Button>
          <Button variant="secondary" onClick={props.clearSelected}>清空选择</Button>
          <div className="flex rounded-md border border-border bg-background p-0.5">
            <button className={cn('h-8 rounded px-2 text-xs', props.mode === 'table' && 'bg-primary text-primary-foreground')} onClick={() => props.setMode('table')}>列表</button>
            <button className={cn('h-8 rounded px-2 text-xs', props.mode === 'grid' && 'bg-primary text-primary-foreground')} onClick={() => props.setMode('grid')}>网格</button>
          </div>
          <Button variant="secondary" onClick={props.refresh}>
            <RefreshCcw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_repeat(4,minmax(120px,0.7fr))]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input ref={props.searchRef} className="pl-8" placeholder="搜索文件名、ID、来源，按 / 聚焦" value={props.query} onChange={(e) => props.setQuery(e.target.value)} />
          </div>
          <Input placeholder="按标签筛选" value={props.tagFilter} onChange={(e) => props.setTagFilter(e.target.value)} />
          <Select value={props.visibility} onChange={(e) => props.setVisibility(e.target.value)}>
            <option value="">全部可见性</option>
            <option value="public">公开</option>
            <option value="private">私有</option>
          </Select>
          <Select value={props.source} onChange={(e) => props.setSource(e.target.value)}>
            <option value="">全部来源</option>
            <option value="api">网页/API</option>
            <option value="url">URL 抓图</option>
            <option value="telegram">Telegram</option>
          </Select>
          <Select value={props.sort} onChange={(e) => props.setSort(e.target.value)}>
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="name">按名称</option>
            <option value="size-desc">大小降序</option>
            <option value="size-asc">大小升序</option>
          </Select>
          <Select value={props.linkFormat} onChange={(e) => props.setLinkFormat(e.target.value)}>
            <option value="page">页面链接</option>
            <option value="raw">直链</option>
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="bbcode">BBCode</option>
          </Select>
        </div>
        {props.mode === 'table' ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[48px_minmax(220px,1.2fr)_150px_minmax(260px,1fr)_170px] bg-muted px-3 py-2 text-xs font-medium text-muted-foreground max-xl:hidden">
              <span>选择</span>
              <span>文件</span>
              <span>元信息</span>
              <span>链接预览</span>
              <span>操作</span>
            </div>
            <div className="divide-y divide-border">
              {props.images.length === 0 && <EmptyLibrary />}
              {props.images.map((image) => (
                <ImageTableRow key={image.id} image={image} {...props} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {props.images.length === 0 && <EmptyLibrary />}
            {props.images.map((image) => (
              <ImageGridCard key={image.id} image={image} {...props} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <span className="text-sm text-muted-foreground">{props.total} 张图片，当前 {props.offset + 1}-{Math.min(props.offset + props.limit, props.total)}</span>
          <div className="flex gap-2 max-sm:grid max-sm:grid-cols-2">
            <Button className="max-sm:w-full" variant="secondary" disabled={props.offset === 0} onClick={() => props.setOffset((current) => Math.max(0, current - props.limit))}>
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button className="max-sm:w-full" variant="secondary" disabled={!props.hasMore} onClick={() => props.setOffset((current) => current + props.limit)}>
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type LibraryImageProps = React.ComponentProps<typeof LibraryView> & { image: ImageRecord };

function ImageTableRow(props: LibraryImageProps) {
  const { image } = props;
  return (
    <div
      className={cn(
        'grid grid-cols-[48px_minmax(220px,1.2fr)_150px_minmax(260px,1fr)_170px] items-center gap-3 px-3 py-3 text-sm transition hover:bg-muted/60 max-xl:grid-cols-1 max-sm:px-2',
        props.activeImageId === image.id && 'bg-primary/5'
      )}
      onClick={() => props.setActiveImageId(image.id)}
    >
      <div className="max-xl:flex max-xl:justify-end"><ImageCheckbox {...props} /></div>
      <div className="flex min-w-0 items-center gap-3">
        <button className="group/thumb relative h-14 w-14 overflow-hidden rounded-md bg-muted" onClick={(event) => { event.stopPropagation(); props.openLightbox(image); }}>
          <img className="h-full w-full object-cover transition group-hover/thumb:scale-105" src={previewRawUrl(image, props.linkToken)} alt="" />
          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>
        <div className="min-w-0">
          <strong className="block truncate">{image.originalName || image.fileName || image.id}</strong>
          <p className="truncate text-xs text-muted-foreground">ID {image.id}</p>
          <Badge tone={image.visibility === 'private' ? 'warning' : 'success'}>{image.visibility === 'private' ? '私有' : '公开'}</Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>{image.mime}</p>
        <p>{formatBytes(image.size)}</p>
        <p>{formatDate(image.createdAt)}</p>
      </div>
      <code className="block max-w-full truncate rounded bg-muted px-2 py-1 text-xs">{linkFor(image, props.linkFormat, props.linkToken)}</code>
      <ImageActions {...props} />
    </div>
  );
}

function ImageGridCard(props: LibraryImageProps) {
  const { image } = props;
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md',
        props.activeImageId === image.id && 'border-primary shadow-sm'
      )}
      onClick={() => {
        props.setActiveImageId(image.id);
        props.openLightbox(image);
      }}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img className="h-full w-full object-cover" src={previewRawUrl(image, props.linkToken)} alt="" loading="lazy" />
        <div className="absolute left-2 top-2">
          <ImageCheckbox {...props} />
        </div>
        <div className="absolute right-2 top-2">
          <Badge tone={image.visibility === 'private' ? 'warning' : 'success'}>{image.visibility === 'private' ? '私有' : '公开'}</Badge>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm">{image.originalName || image.fileName || image.id}</strong>
          <p className="truncate text-xs text-muted-foreground">{formatBytes(image.size)} · {formatDate(image.createdAt)}</p>
        </div>
        <code className="block truncate rounded bg-muted px-2 py-1 text-xs">{linkFor(image, props.linkFormat, props.linkToken)}</code>
        <ImageActions {...props} />
      </div>
    </div>
  );
}

function ImageCheckbox(props: LibraryImageProps) {
  return (
    <input
      className="h-4 w-4"
      type="checkbox"
      checked={props.selected.has(props.image.id)}
      onChange={(event) =>
        props.setSelected((current) => {
          const next = new Set(current);
          if (event.target.checked) next.add(props.image.id);
          else next.delete(props.image.id);
          return next;
        })
      }
      onClick={(event) => event.stopPropagation()}
    />
  );
}

function ImageActions(props: LibraryImageProps) {
  const { image } = props;
  return (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); props.openDetail(image); }}>详情</Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          props.copyImageLink(image);
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          props.downloadImage(image);
        }}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          props.toggleVisibility(image);
        }}
      >
        {image.visibility === 'private' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={(event) => {
          event.stopPropagation();
          props.deleteImage(image);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function EmptyLibrary() {
  return <EmptyState title="还没有图片" detail="上传图片、拖拽文件或使用 URL 抓图后，图片会出现在这里。" action={<Badge tone="info">支持粘贴截图</Badge>} />;
}

function Inspector(props: {
  pane: InspectorPane;
  setPane: (pane: InspectorPane) => void;
  image: ImageRecord | null;
  events: EventRecord[];
  openDetail: (image: ImageRecord) => void;
}) {
  const panes: Array<[InspectorPane, string, typeof ImageIcon]> = [
    ['detail', '详情', ImageIcon],
    ['events', '日志', LayoutDashboard]
  ];
  return (
    <Card>
      <CardHeader className="block">
        <div className="mb-3 flex gap-1">
          {panes.map(([id, label, Icon]) => (
            <button key={id} className={cn('flex h-8 items-center gap-1 rounded-md px-2 text-xs', props.pane === id ? 'bg-primary text-white' : 'bg-muted')} onClick={() => props.setPane(id)}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <CardTitle>检查器</CardTitle>
      </CardHeader>
      <CardContent>
        {props.pane === 'detail' && (
          props.image ? (
            <div className="space-y-3">
              <img className="h-48 w-full rounded-md bg-muted object-contain" src={previewRawUrl(props.image, getStoredToken())} alt="" />
              <div>
                <strong className="block truncate">{props.image.originalName || props.image.id}</strong>
                <p className="text-xs text-muted-foreground">{props.image.mime} · {formatBytes(props.image.size)}</p>
              </div>
              <Button className="w-full" variant="secondary" onClick={() => props.openDetail(props.image!)}>
                打开编辑
              </Button>
            </div>
          ) : <p className="text-sm text-muted-foreground">点击图片后查看详情。</p>
        )}
        {props.pane === 'events' && (
          <div className="space-y-2">
            {props.events.map((event) => (
              <div key={event.id} className="rounded-md bg-muted p-2 text-xs">
                <strong>{event.type}</strong>
                <p className="text-muted-foreground">{formatDate(event.createdAt)}</p>
              </div>
            ))}
            {!props.events.length && <EmptyState icon={LayoutDashboard} title="暂无操作记录" detail="上传、编辑、删除或配置变更后会在这里显示最近事件。" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UploadQueue(props: { items: UploadQueueItem[]; retry: (item: UploadQueueItem) => void; clear: () => void }) {
  if (!props.items.length) return null;
  const toneFor = (status: UploadQueueItem['status']): 'neutral' | 'success' | 'warning' | 'danger' | 'info' => {
    if (status === 'success') return 'success';
    if (status === 'error') return 'danger';
    if (status === 'skipped') return 'warning';
    return 'info';
  };
  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-xs">上传队列</strong>
        <Button size="sm" variant="ghost" onClick={props.clear}>清空</Button>
      </div>
      {props.items.map((item) => (
        <div key={item.id} className="rounded bg-card p-2 text-xs shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{item.fileName}</span>
            <Badge tone={toneFor(item.status)}>{item.message}</Badge>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', item.status === 'error' ? 'bg-danger' : item.status === 'skipped' ? 'bg-muted-foreground' : 'bg-primary')} style={{ width: `${item.progress}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-muted-foreground">
            <span>{formatBytes(item.size)}</span>
            {item.status === 'error' ? (
              <button className="text-primary" onClick={() => props.retry(item)}>重试</button>
            ) : (
              <span>{item.progress}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FloatingBatchBar(props: {
  selectedCount: number;
  linkFormat: string;
  setLinkFormat: (value: string) => void;
  copySelectedLinks: () => void;
  downloadSelected: () => void;
  runBulk: (action: 'delete' | 'public' | 'private' | 'tags' | 'clear-tags') => void;
  addSelectedToAlbum: () => void;
  clearSelected: () => void;
}) {
  if (!props.selectedCount) return null;
  return (
    <div className="fixed bottom-5 left-[calc(260px+50%)] z-40 w-[min(820px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-border bg-card/95 p-3 shadow-2xl backdrop-blur max-lg:left-1/2 max-sm:bottom-3 max-sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <strong className="text-sm">已选择 {props.selectedCount} 张图片</strong>
          <p className="text-xs text-muted-foreground">复制、下载或批量修改当前选中项。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:grid max-sm:w-full max-sm:grid-cols-3">
          <Select className="w-32 max-sm:col-span-3 max-sm:w-full" value={props.linkFormat} onChange={(event) => props.setLinkFormat(event.target.value)}>
            <option value="page">页面链接</option>
            <option value="raw">直链</option>
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="bbcode">BBCode</option>
          </Select>
          <Button size="sm" variant="secondary" onClick={props.copySelectedLinks}><Copy className="h-3.5 w-3.5" />复制</Button>
          <Button size="sm" variant="secondary" onClick={props.downloadSelected}><Download className="h-3.5 w-3.5" />下载</Button>
          <Button className="max-sm:col-span-2" size="sm" variant="secondary" onClick={props.addSelectedToAlbum}>加入相册</Button>
          <Button size="sm" variant="secondary" onClick={() => props.runBulk('public')}>公开</Button>
          <Button size="sm" variant="secondary" onClick={() => props.runBulk('private')}>私有</Button>
          <Button size="sm" variant="danger" onClick={() => props.runBulk('delete')}>删除</Button>
          <Button size="sm" variant="ghost" onClick={props.clearSelected}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function BatchPanel(props: {
  selectedCount: number;
  batchTags: string;
  setBatchTags: (value: string) => void;
  runBulk: (action: 'delete' | 'public' | 'private' | 'tags' | 'clear-tags') => void;
  copySelectedLinks: () => void;
  downloadSelected: () => void;
  addSelectedToAlbum: () => void;
  clearSelected: () => void;
}) {
  const disabled = props.selectedCount === 0;
  const [action, setAction] = useState<'public' | 'private' | 'tags' | 'clear-tags' | 'delete'>('public');
  const actionTone = action === 'delete' ? 'danger' : 'default';
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>批量操作</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{disabled ? '先勾选图片' : '选择动作后一次执行'}</p>
        </div>
        <Badge>{props.selectedCount} 张</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select value={action} onChange={(event) => setAction(event.target.value as typeof action)}>
            <option value="public">设为公开</option>
            <option value="private">设为私有</option>
            <option value="tags">覆盖标签</option>
            <option value="clear-tags">清空标签</option>
            <option value="delete">移入回收站</option>
          </Select>
          <Button variant={actionTone} disabled={disabled || (action === 'tags' && !props.batchTags.trim())} onClick={() => props.runBulk(action)}>
            执行
          </Button>
        </div>
        {action === 'tags' && (
          <Input placeholder="标签：标签1, 标签2" value={props.batchTags} onChange={(e) => props.setBatchTags(e.target.value)} />
        )}
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="secondary" disabled={disabled} onClick={props.copySelectedLinks}>
            <Copy className="h-3.5 w-3.5" />
            复制
          </Button>
          <Button size="sm" variant="secondary" disabled={disabled} onClick={props.downloadSelected}>
            <Download className="h-4 w-4" />
            下载
          </Button>
          <Button size="sm" variant="secondary" disabled={disabled} onClick={props.addSelectedToAlbum}>相册</Button>
        </div>
        <Button className="w-full" size="sm" variant="ghost" disabled={disabled} onClick={props.clearSelected}>清空选择</Button>
      </CardContent>
    </Card>
  );
}

function Lightbox(props: {
  image: ImageRecord | null;
  total: number;
  index: number;
  token: string;
  linkFormat: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prev: () => void;
  next: () => void;
  copy: (image: ImageRecord, format?: string) => void;
  download: (image: ImageRecord) => void;
  edit: (image: ImageRecord) => void;
  toggleVisibility: (image: ImageRecord) => void;
  remove: (image: ImageRecord) => void;
}) {
  useEffect(() => {
    if (!props.open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') props.prev();
      if (event.key === 'ArrowRight') props.next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [props.open, props.prev, props.next]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[min(1180px,calc(100vw-24px))] max-h-[92vh] overflow-hidden bg-slate-950 p-0 text-white max-sm:w-[calc(100vw-12px)]">
        {props.image && (
          <div className="grid max-h-[92vh] min-h-[70vh] grid-cols-[minmax(0,1fr)_320px] max-lg:grid-cols-1">
            <div className="relative grid min-h-[52vh] place-items-center bg-black max-sm:min-h-[44vh]">
              <img className="max-h-[86vh] w-full object-contain max-lg:max-h-[52vh]" src={previewRawUrl(props.image, props.token)} alt={props.image.originalName || props.image.id} />
              <Button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white hover:bg-white/20" size="icon" variant="ghost" onClick={props.prev} aria-label="上一张">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white hover:bg-white/20" size="icon" variant="ghost" onClick={props.next} aria-label="下一张">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <aside className="space-y-4 overflow-auto bg-card p-5 text-foreground max-sm:p-3">
              <div>
                <p className="text-xs text-muted-foreground">{props.index + 1} / {props.total}</p>
                <h3 className="mt-1 break-words text-lg font-semibold">{props.image.originalName || props.image.fileName || props.image.id}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{props.image.mime} · {formatBytes(props.image.size)} · {formatDate(props.image.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-3">
                <Button variant="secondary" onClick={() => props.copy(props.image!, 'raw')}><Copy className="h-4 w-4" />直链</Button>
                <Button variant="secondary" onClick={() => props.copy(props.image!, 'markdown')}><FileText className="h-4 w-4" />MD</Button>
                <Button variant="secondary" onClick={() => props.download(props.image!)}><Download className="h-4 w-4" />下载</Button>
                <Button variant="secondary" onClick={() => props.edit(props.image!)}>编辑</Button>
                <Button variant="secondary" onClick={() => props.toggleVisibility(props.image!)}>
                  {props.image.visibility === 'private' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {props.image.visibility === 'private' ? '公开' : '私有'}
                </Button>
                <Button variant="danger" onClick={() => props.remove(props.image!)}><Trash2 className="h-4 w-4" />删除</Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">当前格式链接</p>
                <code className="block max-h-32 overflow-auto break-all rounded bg-muted p-2 text-xs text-foreground">{linkFor(props.image, props.linkFormat, props.token)}</code>
              </div>
              <div className="grid gap-2 text-sm">
                <InfoRow label="可见性" value={props.image.visibility === 'private' ? '私有' : '公开'} />
                <InfoRow label="来源" value={props.image.source || '-'} />
                <InfoRow label="存储" value={props.image.storageDriver || '-'} />
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AlbumsView(props: {
  albums: Album[];
  images: ImageRecord[];
  imageTotal: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  activeAlbum: Album | null;
  activeAlbumId: string;
  newAlbumName: string;
  setNewAlbumName: (value: string) => void;
  setActiveAlbumId: (id: string) => void;
  createAlbum: () => void;
  saveAlbumMeta: () => void;
  addSelectedToAlbum: () => void;
  copyAlbumLink: (url: string) => void;
  setOffset: (value: number | ((current: number) => number)) => void;
  removeImage: (imageId: string) => void;
  setCover: (imageId: string) => void;
  reorder: (imageId: string, direction: 'up' | 'down') => void;
  sortImages: (imageIds: string[]) => void;
  deleteAlbum: () => void;
}) {
  const [draggingId, setDraggingId] = useState('');
  const albumImages = props.activeAlbum ? props.images : [];
  const albumTotal = props.activeAlbum?.imageCount ?? props.imageTotal;
  const pageStart = props.imageTotal > 0 ? props.offset + 1 : 0;
  const pageEnd = Math.min(props.offset + props.limit, props.imageTotal);
  const publicAlbumUrl = props.activeAlbum ? `${window.TELEPIC?.publicUrl || window.location.origin}/a/${props.activeAlbum.id}` : '';
  const reorderByDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const ids = albumImages.map((image) => image.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    props.sortImages(ids);
    setDraggingId('');
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader><CardTitle>相册</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="新相册名称" value={props.newAlbumName} onChange={(e) => props.setNewAlbumName(e.target.value)} />
            <Button size="icon" onClick={props.createAlbum}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            {props.albums.map((album) => (
              <button key={album.id} className={cn('flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm', props.activeAlbumId === album.id ? 'border-primary bg-primary/5' : 'border-border bg-card')} onClick={() => props.setActiveAlbumId(album.id)}>
                {album.coverImage ? (
                  <img className="h-12 w-12 rounded-md bg-muted object-cover" src={album.coverImage.rawUrl} alt="" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-muted text-xs text-muted-foreground">空</span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate">{album.name}</strong>
                  <span className="text-xs text-muted-foreground">{album.imageCount ?? album.imageIds.length} 张图片</span>
                </span>
              </button>
            ))}
            {!props.albums.length && <EmptyState icon={Boxes} title="还没有相册" detail="创建相册后，可以把已选择的图片加入相册并生成公开分享页。" />}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{props.activeAlbum?.name || '相册详情'}</CardTitle>
            {props.activeAlbum && <p className="mt-1 text-xs text-muted-foreground">共 {albumTotal} 张，当前显示 {pageStart}-{pageEnd}</p>}
          </div>
          <Button variant="secondary" onClick={props.addSelectedToAlbum}>加入已选图片</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.activeAlbum ? (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                <Input id="album-name" defaultValue={props.activeAlbum.name} />
                <Input id="album-description" defaultValue={props.activeAlbum.description || ''} placeholder="相册描述" />
                <Select id="album-sort" defaultValue={props.activeAlbum.sortMode || 'manual'}>
                  <option value="manual">手动排序</option>
                  <option value="newest">最新优先</option>
                  <option value="oldest">最早优先</option>
                  <option value="name">按名称</option>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={props.saveAlbumMeta}>保存相册</Button>
                <Button variant="secondary" onClick={() => props.copyAlbumLink(publicAlbumUrl)}>复制公开链接</Button>
                <Button variant="secondary" asChild>
                  <a href={publicAlbumUrl} target="_blank" rel="noreferrer">打开公开页</a>
                </Button>
                <Button variant="danger" onClick={props.deleteAlbum}>删除相册</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {albumImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn('group rounded-md border border-border bg-card p-2 transition', draggingId === image.id && 'scale-[0.98] opacity-60', props.activeAlbum?.coverImageId === image.id && 'border-primary')}
                    draggable
                    onDragStart={() => setDraggingId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorderByDrop(image.id)}
                    onDragEnd={() => setDraggingId('')}
                  >
                    <button className="relative block w-full overflow-hidden rounded bg-muted" onClick={() => props.setCover(image.id)}>
                      <img className="h-44 w-full object-cover transition group-hover:scale-105" src={image.rawUrl} alt="" />
                      {props.activeAlbum?.coverImageId === image.id && <Badge className="absolute left-2 top-2" tone="success">封面</Badge>}
                    </button>
                    <strong className="mt-2 block truncate text-sm">{image.originalName || image.id}</strong>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Button size="sm" variant="secondary" onClick={() => props.setCover(image.id)}>封面</Button>
                      <Button size="sm" variant="secondary" onClick={() => props.reorder(image.id, 'up')}>上移</Button>
                      <Button size="sm" variant="secondary" onClick={() => props.reorder(image.id, 'down')}>下移</Button>
                      <Button size="sm" variant="danger" onClick={() => props.removeImage(image.id)}>移出</Button>
                    </div>
                  </div>
                ))}
                {!albumImages.length && (
                  <div className="md:col-span-2 xl:col-span-3">
                    <EmptyState icon={Boxes} title="这个相册还没有图片" detail="先在图片页勾选图片，再回到这里加入当前相册。" action={<Button variant="secondary" onClick={props.addSelectedToAlbum}>加入已选图片</Button>} />
                  </div>
                )}
              </div>
              {props.imageTotal > props.limit && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">第 {Math.floor(props.offset / props.limit) + 1} 页</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={props.offset === 0} onClick={() => props.setOffset((current) => Math.max(0, current - props.limit))}>
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button variant="secondary" disabled={!props.hasMore} onClick={() => props.setOffset((current) => current + props.limit)}>
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : <EmptyState icon={Boxes} title="先创建一个相册" detail="相册可以组织图片、设置封面、排序并生成公开访问页。" />}
        </CardContent>
      </Card>
    </div>
  );
}

function BotView(props: {
  form: { publicUrl: string; botToken: string; webhookSecret: string; allowedUserIds: string };
  setForm: React.Dispatch<React.SetStateAction<{ publicUrl: string; botToken: string; webhookSecret: string; allowedUserIds: string }>>;
  status: TelegramStatusPayload | null;
  save: () => void;
  register: () => void;
  sendTest: (chatId: string, message: string) => void;
}) {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('Telepic 测试消息');
  const configured = Boolean(props.status?.configured || props.status?.enabled);
  const webhookOk = Boolean((props.status?.webhook as any)?.ok || (props.status?.webhook as any)?.result?.url);
  const botName = (props.status?.bot as any)?.result?.username || (props.status?.bot as any)?.username || 'Telegram Bot';
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Telegram Bot</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">保存配置后会自动同步 Webhook 和 Bot 菜单。</p>
          </div>
          <Badge tone={configured ? 'success' : 'warning'}>{configured ? '已配置' : '待配置'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="公网地址 PUBLIC_URL"><Input value={props.form.publicUrl} onChange={(e) => props.setForm((v) => ({ ...v, publicUrl: e.target.value }))} /></Field>
            <Field label="Bot Token"><Input type="password" value={props.form.botToken} onChange={(e) => props.setForm((v) => ({ ...v, botToken: e.target.value }))} placeholder="留空则不覆盖现有 token" /></Field>
            <Field label="Webhook Secret"><Input value={props.form.webhookSecret} onChange={(e) => props.setForm((v) => ({ ...v, webhookSecret: e.target.value }))} /></Field>
            <Field label="允许用户 ID"><Input value={props.form.allowedUserIds} onChange={(e) => props.setForm((v) => ({ ...v, allowedUserIds: e.target.value }))} placeholder="多个 ID 用英文逗号分隔" /></Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={props.save}><Save className="h-4 w-4" />保存并自动同步</Button>
            <Button variant="secondary" onClick={props.register}><RefreshCcw className="h-4 w-4" />重新同步 Webhook</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatusTile label="Bot" value={configured ? botName : '未连接'} tone={configured ? 'success' : 'warning'} />
            <StatusTile label="Webhook" value={webhookOk ? '已同步' : '待同步'} tone={webhookOk ? 'success' : 'warning'} />
            <StatusTile label="访问控制" value={props.form.allowedUserIds.trim() ? '已限制' : '未限制'} tone={props.form.allowedUserIds.trim() ? 'success' : 'warning'} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>发送测试</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="测试 Chat ID" value={chatId} onChange={(e) => setChatId(e.target.value)} />
            <Input placeholder="测试内容" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button className="w-full" variant="secondary" onClick={() => props.sendTest(chatId, message)}><Send className="h-4 w-4" />发送测试消息</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>连接详情</CardTitle></CardHeader>
          <CardContent><StatusJson data={props.status} /></CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusTile({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Badge tone={tone}>{tone === 'success' ? '正常' : tone === 'danger' ? '异常' : tone === 'warning' ? '注意' : '状态'}</Badge>
      </div>
      <strong className="block truncate text-sm">{value}</strong>
    </div>
  );
}

function StorageView(props: {
  form: StorageForm;
  setForm: React.Dispatch<React.SetStateAction<StorageForm>>;
  status: StorageStatusPayload | null;
  save: () => void;
  test: () => void;
  migrate: () => void;
}) {
  const s3Ready = Boolean(props.form.s3Bucket && props.form.s3AccessKeyId && props.form.s3SecretAccessKey);
  const driverLabel = props.form.storageDriver === 's3' ? '对象存储' : '本地存储';
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>存储配置</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">选择图片落盘位置，保存前可测试连接。</p>
          </div>
          <Badge tone={props.form.storageDriver === 's3' ? (s3Ready ? 'success' : 'warning') : 'info'}>{driverLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatusTile label="当前驱动" value={driverLabel} tone="info" />
            <StatusTile label="对象存储配置" value={s3Ready ? '完整' : '未完整'} tone={s3Ready ? 'success' : 'warning'} />
            <StatusTile label="连接状态" value={props.status?.ok ? '最近检测正常' : '等待检测'} tone={props.status?.ok ? 'success' : 'warning'} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="存储类型">
              <Select value={props.form.storageDriver} onChange={(e) => props.setForm((v) => ({ ...v, storageDriver: e.target.value }))}>
                <option value="local">本地存储</option>
                <option value="s3">S3/R2/MinIO/B2 兼容</option>
              </Select>
            </Field>
            <Field label="Bucket"><Input value={props.form.s3Bucket} onChange={(e) => props.setForm((v) => ({ ...v, s3Bucket: e.target.value }))} /></Field>
            <Field label="Region"><Input value={props.form.s3Region} onChange={(e) => props.setForm((v) => ({ ...v, s3Region: e.target.value }))} /></Field>
            <Field label="Endpoint"><Input value={props.form.s3Endpoint} onChange={(e) => props.setForm((v) => ({ ...v, s3Endpoint: e.target.value }))} /></Field>
            <Field label="Access Key ID"><Input type="password" value={props.form.s3AccessKeyId} onChange={(e) => props.setForm((v) => ({ ...v, s3AccessKeyId: e.target.value }))} /></Field>
            <Field label="Secret Access Key"><Input type="password" value={props.form.s3SecretAccessKey} onChange={(e) => props.setForm((v) => ({ ...v, s3SecretAccessKey: e.target.value }))} /></Field>
            <Field label="公开访问域名 / CDN"><Input value={props.form.s3PublicBaseUrl} onChange={(e) => props.setForm((v) => ({ ...v, s3PublicBaseUrl: e.target.value }))} /></Field>
            <Field label="目录前缀"><Input value={props.form.s3Prefix} onChange={(e) => props.setForm((v) => ({ ...v, s3Prefix: e.target.value }))} /></Field>
            <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm"><input type="checkbox" checked={props.form.s3ForcePathStyle} onChange={(e) => props.setForm((v) => ({ ...v, s3ForcePathStyle: e.target.checked }))} /> Path-style URL</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={props.save}><Save className="h-4 w-4" />保存存储配置</Button>
            <Button variant="secondary" onClick={props.test}><Check className="h-4 w-4" />测试连接</Button>
            <Button variant="secondary" onClick={props.migrate}><RotateCcw className="h-4 w-4" />迁移已有文件</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>存储状态</CardTitle></CardHeader>
        <CardContent><StatusJson data={props.status} /></CardContent>
      </Card>
    </div>
  );
}

function TrashView(props: { items: TrashItem[]; restore: (id: string) => void; remove: (id: string) => void; empty: () => void }) {
  const totalBytes = props.items.reduce((sum, item) => sum + Number(item.size || 0), 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>回收站</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">恢复误删图片，或彻底释放存储空间。</p>
          </div>
          <Button variant="danger" disabled={!props.items.length} onClick={props.empty}>清空回收站</Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <StatusTile label="待处理项目" value={`${props.items.length} 个`} tone={props.items.length ? 'warning' : 'success'} />
          <StatusTile label="占用空间" value={formatBytes(totalBytes)} tone={totalBytes ? 'warning' : 'success'} />
          <StatusTile label="清理方式" value="手动确认" tone="info" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {props.items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <img className="h-40 w-full bg-muted object-cover" src={item.rawUrl} alt="" />
              <div className="space-y-2 p-3">
                <strong className="block truncate text-sm">{item.originalName || item.id}</strong>
                <p className="text-xs text-muted-foreground">{formatBytes(item.size)} · 删除于 {formatDate(item.deletedAt)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => props.restore(item.id)}>恢复</Button>
                  <Button size="sm" variant="danger" onClick={() => props.remove(item.id)}>彻底删除</Button>
                </div>
              </div>
            </div>
          ))}
          {!props.items.length && (
            <div className="md:col-span-2 xl:col-span-4">
              <EmptyState icon={ArchiveRestore} title="回收站为空" detail="删除的图片会先进入回收站，确认无误后再彻底清理。" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityPanel(props: {
  tokens: ApiToken[];
  tokenForm: { name: string; upload: boolean; read: boolean; manage: boolean; delete: boolean; expiresAt: string; created: string };
  setTokenForm: React.Dispatch<React.SetStateAction<{ name: string; upload: boolean; read: boolean; manage: boolean; delete: boolean; expiresAt: string; created: string }>>;
  createToken: () => void;
  deleteToken: (id: string) => void;
  passwordForm: { current: string; next: string; confirm: string };
  setPasswordForm: React.Dispatch<React.SetStateAction<{ current: string; next: string; confirm: string }>>;
  savePassword: () => void;
}) {
  const copyCreatedToken = async () => {
    if (!props.tokenForm.created) return;
    await navigator.clipboard.writeText(props.tokenForm.created);
  };
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>安全与密钥</CardTitle>
        <Badge>{props.tokens.length} 个密钥</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <CardTitle>管理员密码</CardTitle>
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-1">
            <Input placeholder="当前密码" type="password" value={props.passwordForm.current} onChange={(e) => props.setPasswordForm((v) => ({ ...v, current: e.target.value }))} />
            <Input placeholder="新密码" type="password" value={props.passwordForm.next} onChange={(e) => props.setPasswordForm((v) => ({ ...v, next: e.target.value }))} />
            <Input placeholder="确认新密码" type="password" value={props.passwordForm.confirm} onChange={(e) => props.setPasswordForm((v) => ({ ...v, confirm: e.target.value }))} />
          </div>
          <Button onClick={props.savePassword}>保存新密码</Button>
        </div>
        <div className="space-y-3">
          <CardTitle>API 密钥</CardTitle>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input placeholder="密钥名称" value={props.tokenForm.name} onChange={(e) => props.setTokenForm((v) => ({ ...v, name: e.target.value }))} />
            <Button onClick={props.createToken}>创建密钥</Button>
          </div>
          <Field label="过期时间">
            <Input type="datetime-local" value={props.tokenForm.expiresAt} onChange={(e) => props.setTokenForm((v) => ({ ...v, expiresAt: e.target.value }))} />
          </Field>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['upload', '上传', '允许上传文件和 URL 抓图'],
              ['read', '读取', '允许读取私有图片和下载'],
              ['manage', '管理', '允许编辑图片、相册和配置'],
              ['delete', '删除', '允许删除图片和清理回收站']
            ].map(([key, label, hint]) => (
              <label key={key} className="flex items-start gap-2 rounded-md border border-border p-2">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={Boolean(props.tokenForm[key as keyof typeof props.tokenForm])}
                  onChange={(e) => props.setTokenForm((v) => ({ ...v, [key]: e.target.checked }))}
                />
                <span>
                  <strong className="block">{label}</strong>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {props.tokenForm.created && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <strong className="text-sm text-amber-900">新密钥只显示这一次</strong>
                <Button size="sm" variant="secondary" onClick={copyCreatedToken}><Copy className="h-3.5 w-3.5" />复制</Button>
              </div>
              <code className="block break-all rounded bg-white/70 p-2 text-xs text-amber-950">{props.tokenForm.created}</code>
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {props.tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{token.name}</strong>
                  <p className="text-xs text-muted-foreground">{token.scopes.join('、')}</p>
                  <p className="text-xs text-muted-foreground">
                    {token.expiresAt ? `过期：${formatDate(token.expiresAt)}` : '永不过期'}
                    {token.lastUsedIp ? ` · IP ${token.lastUsedIp}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="danger" onClick={() => props.deleteToken(token.id)}>删除</Button>
              </div>
            ))}
            {!props.tokens.length && <EmptyState icon={ShieldCheck} title="暂无 API 密钥" detail="创建密钥后，外部工具可以按权限上传、读取或管理图片。" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemView({
  config,
  status,
  events,
  refresh,
  tokens,
  tokenForm,
  setTokenForm,
  createToken,
  deleteToken,
  passwordForm,
  setPasswordForm,
  savePassword
}: {
  config: ConfigPayload | null;
  status: SystemStatusPayload | null;
  events: EventRecord[];
  refresh: () => void;
  tokens: ApiToken[];
  tokenForm: { name: string; upload: boolean; read: boolean; manage: boolean; delete: boolean; expiresAt: string; created: string };
  setTokenForm: React.Dispatch<React.SetStateAction<{ name: string; upload: boolean; read: boolean; manage: boolean; delete: boolean; expiresAt: string; created: string }>>;
  createToken: () => void;
  deleteToken: (id: string) => void;
  passwordForm: { current: string; next: string; confirm: string };
  setPasswordForm: React.Dispatch<React.SetStateAction<{ current: string; next: string; confirm: string }>>;
  savePassword: () => void;
}) {
  const [eventQuery, setEventQuery] = useState('');
  const [eventType, setEventType] = useState('');
  const filteredEvents = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    const type = eventType.trim().toLowerCase();
    return events.filter((event) => {
      const text = `${event.type} ${JSON.stringify(event.details || {})}`.toLowerCase();
      return (!type || event.type.toLowerCase().includes(type)) && (!q || text.includes(q));
    });
  }, [eventQuery, eventType, events]);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SecurityPanel
        tokens={tokens}
        tokenForm={tokenForm}
        setTokenForm={setTokenForm}
        createToken={createToken}
        deleteToken={deleteToken}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        savePassword={savePassword}
      />
      <Card>
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
          <Button variant="secondary" onClick={refresh}>刷新</Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {config && Object.entries({
            版本: `${config.appName} ${config.appVersion}`,
            Node: config.nodeVersion,
            平台: config.platform,
            公开地址: config.publicUrl,
            匿名上传: config.publicUpload ? '允许' : '关闭',
            数据库: config.databaseDriver,
            数据目录: config.dataDir || '-',
            上传限制: formatBytes(config.maxUploadBytes)
          }).map(([label, value]) => <InfoRow key={label} label={label} value={String(value)} />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>运行状态</CardTitle></CardHeader>
        <CardContent><StatusJson data={status} /></CardContent>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>审计日志</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="搜索日志内容" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} />
            <Select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option value="">全部类型</option>
              <option value="image">图片</option>
              <option value="album">相册</option>
              <option value="token">密钥</option>
              <option value="admin">安全</option>
              <option value="telegram">Telegram</option>
              <option value="storage">存储</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => <InfoRow key={event.id} label={event.type} value={formatDate(event.createdAt)} />)}
          {!filteredEvents.length && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={LayoutDashboard} title="暂无匹配事件" detail="换一个类型或关键词，或者刷新后查看最新审计记录。" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeView(props: {
  theme: ThemePack;
  library: ThemePack[];
  setTheme: (theme: ThemePack) => void;
  applyTheme: (theme: ThemePack) => void;
  setLibrary: React.Dispatch<React.SetStateAction<ThemePack[]>>;
  saveCloud: () => void;
  clearLibrary: () => void;
  importRef: React.RefObject<HTMLInputElement | null>;
  imageRef: React.RefObject<HTMLInputElement | null>;
  importTheme: (file: File) => void;
  exportTheme: () => void;
  importImage: (file: File) => void;
}) {
  const builtInThemes = [...Object.values(themePresets), ...Object.values(recommendedThemes)];
  const customLibrary = cleanThemeLibrary(props.library);
  const all = [...builtInThemes, ...customLibrary];
  function update(field: keyof ThemePack, value: string) {
    props.setTheme(normalizeTheme({ ...props.theme, preset: 'custom', [field]: value }));
  }
  function install(theme: ThemePack) {
    if (isBuiltInTheme(theme)) return props.applyTheme(theme);
    props.setLibrary((current) => {
      if (current.some((item) => item.id === theme.id)) return cleanThemeLibrary(current);
      return cleanThemeLibrary([theme, ...current]);
    });
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>主题编辑</CardTitle>
          <Badge>{props.theme.label || '自定义主题'}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={props.importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) props.importTheme(file);
              event.currentTarget.value = '';
            }}
          />
          <input
            ref={props.imageRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) props.importImage(file);
              event.currentTarget.value = '';
            }}
          />
          <div className="rounded-md border border-border p-3" style={{ background: props.theme.backdrop || props.theme.bg }}>
            <div className="flex min-h-28 flex-col justify-between rounded-md border border-black/5 p-3" style={{ background: props.theme.panel, color: props.theme.ink }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate">{props.theme.label || '自定义主题'}</strong>
                  <p className="text-xs opacity-70">{props.theme.category || props.theme.author || 'Telepic'}</p>
                </div>
                <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: props.theme.accent }} />
              </div>
              <div className="mt-6 grid grid-cols-5 gap-1">
                {(['bg', 'panel', 'ink', 'accent', 'danger'] as Array<keyof ThemePack>).map((field) => (
                  <span key={field} className="h-5 rounded" style={{ background: String(props.theme[field] || '#ffffff') }} />
                ))}
              </div>
            </div>
          </div>
          <Field label="主题名称"><Input value={props.theme.label || ''} onChange={(e) => update('label', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            {(['bg', 'panel', 'ink', 'accent', 'danger'] as Array<keyof ThemePack>).map((field) => (
              <Field key={field} label={field}>
                <Input type="color" value={String(props.theme[field] || '#ffffff')} onChange={(e) => update(field, e.target.value)} />
              </Field>
            ))}
          </div>
          <Field label="背景图 Data URL / URL"><Textarea value={props.theme.image || ''} onChange={(e) => update('image', e.target.value)} /></Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => props.applyTheme(props.theme)}><Check className="h-4 w-4" />应用</Button>
            <Button variant="secondary" onClick={props.saveCloud}><Save className="h-4 w-4" />保存</Button>
            <Button variant="secondary" onClick={() => install(normalizeTheme({ ...props.theme, id: `custom_${Date.now().toString(36)}` }))}><Sparkles className="h-4 w-4" />收藏</Button>
            <Button variant="secondary" onClick={() => props.imageRef.current?.click()}><Upload className="h-4 w-4" />背景</Button>
            <Button variant="secondary" onClick={() => props.importRef.current?.click()}><Upload className="h-4 w-4" />导入</Button>
            <Button variant="secondary" onClick={props.exportTheme}><Download className="h-4 w-4" />导出</Button>
            <Button variant="ghost" disabled={!customLibrary.length} onClick={props.clearLibrary}><Trash2 className="h-4 w-4" />清空</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>主题库</CardTitle>
          <Badge>{all.length} 套</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {all.map((item, index) => (
            <div key={`${item.id}-${index}`} className={cn('rounded-md border p-3 transition hover:-translate-y-0.5 hover:shadow-md', props.theme.id === item.id ? 'border-primary bg-primary/5' : 'border-border bg-card')}>
              <div className="h-20 rounded-md border border-black/5 p-2" style={{ background: item.backdrop || item.bg }}>
                <div className="grid h-full grid-cols-[1fr_52px] gap-2">
                  <div className="rounded" style={{ background: item.panel }} />
                  <div className="space-y-1">
                    <div className="h-4 rounded" style={{ background: item.accent }} />
                    <div className="h-4 rounded" style={{ background: item.bg }} />
                    <div className="h-4 rounded" style={{ background: item.panel }} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <strong className="block truncate">{item.label}</strong>
                  <p className="text-xs text-muted-foreground">{item.category || item.author || '主题'}</p>
                </div>
                {props.theme.id === item.id && <Badge>当前</Badge>}
              </div>
              <p className="min-h-10 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => props.applyTheme(item)}><Check className="h-3.5 w-3.5" />启用</Button>
                {!isBuiltInTheme(item) && <Button size="sm" variant="ghost" onClick={() => install(item)}><Sparkles className="h-3.5 w-3.5" />收藏</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <strong className="truncate text-right">{value}</strong>
    </div>
  );
}

function StatusJson({ data }: { data: unknown }) {
  return <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100 scrollbar-thin">{JSON.stringify(data || {}, null, 2)}</pre>;
}

function linkFor(image: ImageRecord, format: string, token: string) {
  const raw = previewRawUrl(image, token);
  const page = previewPageUrl(image, token);
  const name = image.originalName || image.id;
  if (format === 'raw') return raw;
  if (format === 'markdown') return `![${name}](${raw})`;
  if (format === 'html') return `<img src="${raw}" alt="${name}">`;
  if (format === 'bbcode') return `[img]${raw}[/img]`;
  return page;
}

function previewRawUrl(image: ImageRecord, token: string) {
  if (image.visibility !== 'private' || !token) return image.rawUrl;
  return withAccessToken(image.rawUrl, token);
}

function previewPageUrl(image: ImageRecord, token: string) {
  if (image.visibility !== 'private' || !token) return image.url;
  return withAccessToken(image.url, token);
}

function withAccessToken(url: string, token: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function readLocalTheme() {
  try {
    const raw = localStorage.getItem('telepic.theme');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readLocalThemeLibrary() {
  try {
    const raw = localStorage.getItem('telepic.themeLibrary');
    const parsed = raw ? JSON.parse(raw) : [];
    return cleanThemeLibrary(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

function persistTheme(theme: ThemePack, library: ThemePack[]) {
  localStorage.setItem('telepic.theme', JSON.stringify(normalizeTheme(theme)));
  localStorage.setItem('telepic.themeLibrary', JSON.stringify(cleanThemeLibrary(library)));
}
