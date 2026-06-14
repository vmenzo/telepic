export type Visibility = 'public' | 'private';
export type StorageDriver = 'local' | 's3';

export interface ImageRecord {
  id: string;
  fileName?: string;
  originalName?: string;
  mime: string;
  size: number;
  sha256?: string;
  source?: string;
  owner?: string;
  tags?: string[];
  visibility: Visibility;
  createdAt: string;
  updatedAt?: string;
  url: string;
  rawUrl: string;
  storageDriver?: StorageDriver;
}

export interface StatsPayload {
  images: number;
  publicImages: number;
  privateImages: number;
  totalBytes: number;
  averageBytes: number;
  latestImageAt?: string | null;
  oldestImageAt?: string | null;
  largestImage?: ImageRecord | null;
  tokens: number;
  sourceBreakdown: Record<string, number>;
  mimeBreakdown: Record<string, number>;
  tagBreakdown: Record<string, number>;
  ownerBreakdown: Record<string, number>;
}

export interface ImageListPayload {
  images: ImageRecord[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiToken {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  expiresAt?: string | null;
  expired?: boolean;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  imageIds: string[];
  imageCount?: number;
  coverImageId?: string;
  coverImage?: ImageRecord | null;
  sortMode?: 'manual' | 'newest' | 'oldest' | 'name';
  createdAt: string;
  updatedAt: string;
}

export interface TrashItem extends ImageRecord {
  deletedAt?: string;
  deletedBy?: string;
}

export interface EventRecord {
  id: string;
  type: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ConfigPayload {
  appName: string;
  appVersion: string;
  nodeVersion: string;
  platform: string;
  host: string;
  port: number;
  publicUrl: string;
  publicUpload: boolean;
  adminAuthenticated: boolean;
  adminUsername: string;
  adminSessionHours: number;
  adminSessionIdleMinutes: number;
  serverTime: string;
  checks: Record<string, boolean>;
  databaseDriver: string;
  databaseFile?: string;
  dataDir?: string;
  telegramEnabled: boolean;
  telegramBotConfigured: boolean;
  telegramAllowedUsersConfigured: boolean;
  telegramAllowedUserIds?: string;
  telegramWebhookSecret?: string;
  telegramWebhookUrl?: string;
  storageDriver: StorageDriver;
  s3Configured: boolean;
  s3Bucket?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Prefix?: string;
  s3ForcePathStyle?: boolean;
  s3PublicBaseUrl?: string;
  maxUploadBytes: number;
  themeLibraryCount?: number;
}

export interface SessionPayload {
  token: string;
  expiresAt: string;
  idleExpiresAt?: string;
  idleMinutes?: number;
  username: string;
}

export interface TelegramStatusPayload {
  ok?: boolean;
  enabled?: boolean;
  configured?: boolean;
  bot?: Record<string, unknown>;
  webhook?: Record<string, unknown>;
  commands?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}

export interface StorageStatusPayload {
  ok?: boolean;
  storageDriver: StorageDriver;
  s3Configured?: boolean;
  uploadDir?: string;
  dataDir?: string;
  files?: number;
  bytes?: number;
  previousConfigAvailable?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface SystemStatusPayload {
  uptimeSeconds?: number;
  bootAt?: string;
  memory?: Record<string, number>;
  versions?: Record<string, string>;
  storage?: StorageStatusPayload;
  [key: string]: unknown;
}

export interface ThemePack {
  id?: string;
  preset?: string;
  label?: string;
  author?: string;
  category?: string;
  description?: string;
  cover?: string;
  source?: string;
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  danger: string;
  backdrop?: string;
  overlay?: string;
  panelAlpha?: number;
  blur?: number;
  image?: string;
}

export interface ThemeSettingsPayload {
  theme: ThemePack | null;
  library: ThemePack[];
}
