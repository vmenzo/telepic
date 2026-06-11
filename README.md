# Telepic

Telepic 是一个自托管图床，支持 Web 管理台、HTTP API、Telegram Bot 管理、本地存储和 S3 兼容对象存储。

## 功能

- Web 管理台：上传、URL 抓图、搜索、筛选、标签、重命名、删除、批量操作。
- 登录与权限：账号密码登录、API token、公开 / 私有图片。
- 链接格式：页面链接、图片直链、Markdown、HTML、BBCode。
- 统计与日志：图片数量、空间占用、来源统计、类型统计、最近操作。
- Telegram Bot：上传、搜索、查看、改名、标签、公开私有切换、删除、token 管理。
- 存储：本地文件、S3 兼容对象存储（AWS S3、Cloudflare R2、Backblaze B2、MinIO）。
- 数据库：默认 SQLite，可切换 JSON；首次启动可从旧版 `data/db.json` 自动导入。
- 部署：Dockerfile、docker-compose、一键 Linux 安装脚本。

## 一键部署

默认部署到 `/opt/telepic`，会自动安装 Git、Docker 和 Docker Compose。

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh | sudo sh
```

脚本会提示填写：

- 安装目录
- HTTP 端口
- 公开地址 `PUBLIC_URL`
- 管理员用户名

安装完成后，脚本会直接输出：

- 管理台地址
- 管理员用户名
- 管理员密码
- API 管理密钥

也就是说，首次安装后不需要你自己去猜密码，终端里会直接显示。

如果已经确定配置，也可以通过环境变量无交互部署：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh \
  | sudo env TELEPIC_NONINTERACTIVE=1 PUBLIC_URL=https://img.example.com sh
```

`PUBLIC_URL` 用于生成外链和 Telegram webhook 地址。没有域名时可以先使用默认值，之后在 `/opt/telepic/.env` 里修改。

如果使用 fork 仓库：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh \
  | sudo env TELEPIC_REPO=https://github.com/yourname/telepic.git TELEPIC_NONINTERACTIVE=1 sh
```

安装完成后脚本会输出：

- 管理台地址
- 管理员用户名
- 管理员密码
- API 管理密钥

### Linux 安装说明

这个安装脚本面向常见 Linux 发行版，已内置以下处理：

- 自动检测包管理器：`apt`、`dnf`、`yum`、`apk`、`pacman`
- 自动安装 Git、Docker、Docker Compose
- 自动尝试启动 Docker 服务
- 自动克隆仓库并生成 `.env`
- 自动构建并启动 Telepic 容器
- 如果容器启动失败，会直接输出最近日志，而不是假装安装成功

### 安装后去哪里改配置

安装目录默认是：

```bash
/opt/telepic
```

主要配置文件：

```bash
/opt/telepic/.env
```

常见后续操作：

```bash
cd /opt/telepic
docker compose ps
docker compose logs -f
docker compose restart
```

如果你修改了 `.env`，重新加载：

```bash
cd /opt/telepic
docker compose up -d --build
```

### 常见部署方式

只想先跑起来，本地端口访问：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh | sudo sh
```

有域名，直接无交互安装：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh \
  | sudo env TELEPIC_NONINTERACTIVE=1 PUBLIC_URL=https://img.example.com sh
```

接对象存储一起装：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh \
  | sudo env TELEPIC_NONINTERACTIVE=1 \
    PUBLIC_URL=https://img.example.com \
    STORAGE_DRIVER=s3 \
    S3_BUCKET=your-bucket \
    S3_REGION=auto \
    S3_ENDPOINT=https://your-endpoint.example \
    S3_ACCESS_KEY_ID=your-key \
    S3_SECRET_ACCESS_KEY=your-secret \
    S3_PUBLIC_BASE_URL=https://cdn.example.com \
    sh
```

接 Telegram Bot：

```bash
curl -fsSL https://raw.githubusercontent.com/vmenzo/telepic/main/scripts/install.sh \
  | sudo env TELEPIC_NONINTERACTIVE=1 \
    PUBLIC_URL=https://img.example.com \
    TELEGRAM_BOT_TOKEN=123456:abcdef \
    TELEGRAM_ALLOWED_USER_IDS=123456789 \
    sh
```

## 更新

```bash
cd /opt/telepic
sh scripts/update.sh
```

常用命令：

```bash
cd /opt/telepic
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

如果你想在 Linux 机器上先做一轮部署自检，再决定是否上线：

```bash
cd /opt/telepic
sh scripts/self-check.sh
```

它会依次检查：

- npm 依赖安装
- `src/server.js` 语法
- `src/web.js` 语法
- `public/app.js` 语法
- `docker compose` 配置
- Docker 镜像构建

## 本地运行

需要 Node.js 22.5 或更高版本。

```bash
cp .env.example .env
node src/server.js
```

访问：

```text
http://127.0.0.1:8787
```

默认登录配置在 `.env`：

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-admin-password
```

## Telegram Bot

`.env` 配置：

```text
TELEGRAM_BOT_TOKEN=
PUBLIC_URL=https://img.example.com
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ALLOWED_USER_IDS=
```

注册 webhook 并同步 Telegram 菜单命令：

```bash
node scripts/set-telegram-webhook.js
```

Bot 以按钮控制台为主。发送 `/start` 或 `/panel` 打开控制台后，可通过按钮完成图片列表、搜索、链接抓图、相册、API 密钥、回收站、统计、日志、系统状态和存储状态管理。

保留的快捷命令：

```text
/start     启动机器人
/panel     打开图床控制台
/stats     查看统计概览
/system    查看运行状态
/storage   查看存储状态
/register  查看账号和聊天 ID
```

上传图片可以直接把图片发送给 Bot。需要改名、标签、删除、加入相册、生成链接格式等管理操作时，在控制台按钮中选择对应功能即可。

## 对象存储

默认本地存储：

```text
STORAGE_DRIVER=local
```

S3 兼容存储：

```text
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket
S3_REGION=auto
S3_ENDPOINT=https://your-endpoint.example
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_PREFIX=telepic
S3_FORCE_PATH_STYLE=true
```

说明：

- `S3_ENDPOINT` 用于 R2、B2 S3、MinIO 等兼容服务。
- `S3_PUBLIC_BASE_URL` 可选；配置后直链优先使用 CDN / 对象存储公开域名。
- 私有图片不会直接暴露对象存储公开 URL，会走应用权限检查。

## 数据库

默认 SQLite：

```text
DATABASE_DRIVER=sqlite
DATABASE_FILE=./data/telepic.sqlite
```

切换 JSON：

```text
DATABASE_DRIVER=json
```

## API

上传图片：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.png" \
  http://127.0.0.1:8787/api/upload
```

URL 抓图：

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.png"}' \
  http://127.0.0.1:8787/api/upload-from-url
```

列表：

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://127.0.0.1:8787/api/images?limit=20&sort=newest"
```

创建 API token：

```bash
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"uploader","scopes":["upload","manage"]}' \
  http://127.0.0.1:8787/api/tokens
```

## 配置

| 变量 | 说明 |
| --- | --- |
| `PORT` | HTTP 端口 |
| `HOST` | 监听地址 |
| `PUBLIC_URL` | 外链和 Telegram webhook 使用的公开地址 |
| `DATA_DIR` | 数据目录 |
| `DATABASE_DRIVER` | `sqlite` 或 `json` |
| `DATABASE_FILE` | SQLite 文件路径 |
| `STORAGE_DRIVER` | `local` 或 `s3` |
| `ADMIN_USERNAME` | Web 管理台用户名 |
| `ADMIN_PASSWORD` | Web 管理台密码 |
| `ADMIN_SESSION_HOURS` | Web 登录会话有效期 |
| `ADMIN_TOKEN` | 管理 API 密钥和会话签名密钥 |
| `PUBLIC_UPLOAD` | 是否允许匿名上传 |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook 路径密钥 |
| `TELEGRAM_ALLOWED_USER_IDS` | 允许使用 Bot 的 Telegram 用户 ID |
| `MAX_UPLOAD_BYTES` | 单文件大小限制 |
| `S3_BUCKET` | S3 bucket |
| `S3_REGION` | S3 区域 |
| `S3_ENDPOINT` | S3 endpoint |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_PUBLIC_BASE_URL` | CDN / 公开访问域名 |
| `S3_PREFIX` | 对象 key 前缀 |
| `S3_FORCE_PATH_STYLE` | 是否使用 path-style URL |

## License

MIT
