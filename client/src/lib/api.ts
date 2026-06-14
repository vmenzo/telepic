import type {
  Album,
  ApiToken,
  ConfigPayload,
  EventRecord,
  ImageListPayload,
  ImageRecord,
  SessionPayload,
  StatsPayload,
  StorageStatusPayload,
  SystemStatusPayload,
  TelegramStatusPayload,
  ThemePack,
  ThemeSettingsPayload,
  TrashItem
} from '../types/api';
import { safeFileName } from './utils';

const TOKEN_KEY = 'telepic.adminToken';
const USER_KEY = 'telepic.adminUsername';
const IDLE_KEY = 'telepic.sessionIdleExpiresAt';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getStoredUsername() {
  try {
    return localStorage.getItem(USER_KEY) || 'admin';
  } catch {
    return 'admin';
  }
}

export function getStoredIdleExpiresAt() {
  try {
    return Number(localStorage.getItem(IDLE_KEY) || 0);
  } catch {
    return 0;
  }
}

export function storeSession(session: SessionPayload) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, session.username || 'admin');
  if (session.idleExpiresAt) {
    localStorage.setItem(IDLE_KEY, String(new Date(session.idleExpiresAt).getTime()));
  }
}

export function storeToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IDLE_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  const refreshed = response.headers.get('x-admin-session');
  if (refreshed) {
    storeToken(refreshed);
    const idle = response.headers.get('x-admin-session-idle-expires-at');
    if (idle) localStorage.setItem(IDLE_KEY, String(new Date(idle).getTime()));
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new ApiError(response.status, data.error || response.statusText || '请求失败');
  }
  return data as T;
}

export function uploadFileWithProgress(
  file: File,
  storageDriver: string,
  onProgress: (progress: number) => void
) {
  const token = getStoredToken();
  return new Promise<{ image: ImageRecord }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/upload');
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.setRequestHeader('content-type', file.type || 'application/octet-stream');
    request.setRequestHeader('x-file-name', safeFileName(file.name));
    if (storageDriver !== 'default') request.setRequestHeader('x-storage-driver', storageDriver);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };
    request.onerror = () => reject(new ApiError(0, '网络连接失败'));
    request.onload = () => {
      const refreshed = request.getResponseHeader('x-admin-session');
      if (refreshed) {
        storeToken(refreshed);
        const idle = request.getResponseHeader('x-admin-session-idle-expires-at');
        if (idle) localStorage.setItem(IDLE_KEY, String(new Date(idle).getTime()));
      }
      let data: any = {};
      try {
        data = request.responseText ? JSON.parse(request.responseText) : {};
      } catch {
        data = {};
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new ApiError(request.status, data.error || request.statusText || '上传失败'));
        return;
      }
      onProgress(100);
      resolve(data as { image: ImageRecord });
    };
    request.send(file);
  });
}

export const api = {
  login(username: string, password: string) {
    return apiRequest<SessionPayload>('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },
  refreshSession() {
    return apiRequest<SessionPayload>('/api/session/refresh', { method: 'POST' });
  },
  config() {
    return apiRequest<ConfigPayload>('/api/config');
  },
  stats() {
    return apiRequest<StatsPayload>('/api/stats');
  },
  images(params: URLSearchParams) {
    return apiRequest<ImageListPayload>(`/api/images?${params.toString()}`);
  },
  image(id: string) {
    return apiRequest<{ image: ImageRecord }>(`/api/images/${id}`);
  },
  updateImage(id: string, patch: Partial<ImageRecord> | { tags?: string | string[] }) {
    return apiRequest<{ image: ImageRecord }>(`/api/images/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
  },
  deleteImage(id: string) {
    return apiRequest<{ ok: true }>(`/api/images/${id}`, { method: 'DELETE' });
  },
  bulkDelete(ids: string[]) {
    return apiRequest<{ ok: true; deleted: string[]; missing: string[] }>('/api/images/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  },
  bulkUpdate(ids: string[], patch: { visibility?: string; tags?: string | string[] }) {
    return apiRequest<{ ok: true; updated: ImageRecord[]; missing: string[] }>('/api/images/bulk-update', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids, ...patch })
    });
  },
  async downloadImages(ids: string[]) {
    const token = getStoredToken();
    const response = await fetch('/api/images/download', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) throw new ApiError(response.status, '下载失败');
    return response.blob();
  },
  uploadFile(file: File, storageDriver: string) {
    return apiRequest<{ image: ImageRecord }>('/api/upload', {
      method: 'POST',
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-file-name': safeFileName(file.name),
        ...(storageDriver !== 'default' ? { 'x-storage-driver': storageDriver } : {})
      },
      body: file
    });
  },
  uploadFileWithProgress,
  uploadFromUrl(url: string, storageDriver: string) {
    return apiRequest<{ image: ImageRecord }>('/api/upload-from-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, storageDriver: storageDriver === 'default' ? undefined : storageDriver })
    });
  },
  tokens() {
    return apiRequest<{ tokens: ApiToken[] }>('/api/tokens');
  },
  createToken(name: string, scopes: string[], expiresAt?: string) {
    return apiRequest<{ token: string; record: ApiToken }>('/api/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, scopes, expiresAt: expiresAt || undefined })
    });
  },
  deleteToken(id: string) {
    return apiRequest<{ ok: true }>(`/api/tokens/${id}`, { method: 'DELETE' });
  },
  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ ok: true }>('/api/admin/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },
  rotateAdminToken() {
    return apiRequest<{ ok: true; token: string }>('/api/admin/token/rotate', { method: 'POST' });
  },
  events(params: { q?: string; type?: string; limit?: number } = {}) {
    const search = new URLSearchParams({ limit: String(params.limit || 24) });
    if (params.q) search.set('q', params.q);
    if (params.type) search.set('type', params.type);
    return apiRequest<{ events: EventRecord[] }>(`/api/events?${search.toString()}`);
  },
  albums() {
    return apiRequest<{ albums: Album[] }>('/api/albums');
  },
  createAlbum(name: string) {
    return apiRequest<{ album: Album }>('/api/albums', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    });
  },
  updateAlbum(id: string, patch: Partial<Album>) {
    return apiRequest<{ album: Album }>(`/api/albums/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
  },
  deleteAlbum(id: string) {
    return apiRequest<{ ok: true }>(`/api/albums/${id}`, { method: 'DELETE' });
  },
  addImagesToAlbum(albumId: string, ids: string[]) {
    return apiRequest<{ album: Album }>(`/api/albums/${albumId}/images`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  },
  removeImageFromAlbum(albumId: string, imageId: string) {
    return apiRequest<{ album: Album }>(`/api/albums/${albumId}/images/${imageId}`, { method: 'DELETE' });
  },
  reorderAlbum(albumId: string, imageId: string, direction: 'up' | 'down') {
    return apiRequest<{ album: Album }>(`/api/albums/${albumId}/reorder`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageId, direction })
    });
  },
  sortAlbumImages(albumId: string, imageIds: string[]) {
    return apiRequest<{ album: Album }>(`/api/albums/${albumId}/reorder`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageIds })
    });
  },
  trash() {
    return apiRequest<{ items: TrashItem[]; total: number }>('/api/trash?limit=100');
  },
  restoreTrash(id: string) {
    return apiRequest<{ ok: true; image: ImageRecord }>(`/api/trash/${id}/restore`, { method: 'POST' });
  },
  deleteTrash(id: string) {
    return apiRequest<{ ok: true }>(`/api/trash/${id}`, { method: 'DELETE' });
  },
  emptyTrash() {
    return apiRequest<{ ok: true; removed: number }>('/api/trash/empty', { method: 'POST' });
  },
  telegramStatus() {
    return apiRequest<TelegramStatusPayload>('/api/integrations/telegram/status');
  },
  saveTelegram(payload: { publicUrl: string; botToken: string; webhookSecret: string; allowedUserIds: string }) {
    return apiRequest<Record<string, unknown>>('/api/integrations/telegram', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  registerTelegramWebhook() {
    return apiRequest<Record<string, unknown>>('/api/integrations/telegram/webhook', { method: 'POST' });
  },
  sendTelegramTest(chatId: string, message: string) {
    return apiRequest<Record<string, unknown>>('/api/integrations/telegram/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chatId, message })
    });
  },
  storageStatus() {
    return apiRequest<StorageStatusPayload>('/api/integrations/storage/status');
  },
  saveStorage(payload: Record<string, unknown>) {
    return apiRequest<Record<string, unknown>>('/api/integrations/storage', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  testStorage() {
    return apiRequest<Record<string, unknown>>('/api/integrations/storage/test', { method: 'POST' });
  },
  migrateStorage() {
    return apiRequest<Record<string, unknown>>('/api/integrations/storage/migrate', { method: 'POST' });
  },
  systemStatus() {
    return apiRequest<SystemStatusPayload>('/api/system/status');
  },
  themeSettings() {
    return apiRequest<ThemeSettingsPayload>('/api/settings/theme');
  },
  saveTheme(theme: ThemePack, library: ThemePack[]) {
    return apiRequest<ThemeSettingsPayload>('/api/settings/theme', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme, library })
    });
  }
};
