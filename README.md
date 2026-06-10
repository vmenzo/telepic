# Telepic 图床

Telepic 是一个可自托管的开源图床，目标是同时服务 Web 管理、API 上传和 Telegram Bot 管理。当前版本是轻量但可用的 MVP：不依赖数据库服务，元数据保存在 JSON 文件中，图片可存本地或切换到 S3 兼容对象存储。

## 已有功能

- 中文 Web 管理台：上传、粘贴上传、搜索、筛选、复制链接、重命名、标签、删除、批量操作。
- 多种链接格式：页面链接、图片直链、Markdown、HTML、BBCode。
- 图片可见性：公开 / 私有，支持批量切换。
- URL 抓图：把外部图片直接收进图床。
- 标签、最近操作记录、来源统计、排序。
- 主题系统：预设主题 + 自定义颜色主题，保存在浏览器本地。
- API：上传、URL 抓图、列表、详情、重命名、标签、可见性更新、删除、批量删除、批量更新、统计、最近操作。
- API 密钥：可创建上传权限或管理权限 token。
- Telegram Bot webhook：发图上传、搜图、查看详情、改名、标签、公开私有切换、删图、事件流、token 管理、URL 抓图。
- 对象存储：支持 S3 兼容接口，可对接 AWS S3、Cloudflare R2、Backblaze B2 S3、MinIO。
- Dockerfile 和 docker-compose 示例。

## 快速启动

### 一键部署到服务器

把项目上传到 GitHub 后，服务器上可以用一条命令部署。先把命令里的仓库地址换成你自己的：

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/telepic/main/scripts/install.sh \
  | TELEPIC_REPO=https://github.com/YOUR_GITHUB_USERNAME/telepic.git \
    PUBLIC_URL=https://img.example.com \
    sh
```

脚本会自动：

- 拉取 GitHub 仓库到 `/opt/telepic`
- 生成 `.env`
- 自动生成 `ADMIN_TOKEN` 和 `TELEGRAM_WEBHOOK_SECRET`
- 使用 Docker Compose 构建并启动服务
- 输出管理台地址和管理员密钥

更新到最新版：

```bash
cd /opt/telepic
sh scripts/update.sh
```

常用维护命令：

```bash
cd /opt/telepic
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

### 上传到 GitHub

如果这是一个新仓库，先在 GitHub 创建一个空仓库，例如 `telepic`，然后在本地执行：

```bash
git init
git add .
git commit -m "Initial Telepic release"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/telepic.git
git push -u origin main
```

注意不要提交 `.env`、`data/`、`work/`、`tools/`，项目里的 `.gitignore` 已经默认排除了这些本地文件。

如果你要我直接帮你推到 GitHub，需要给我仓库名，例如 `telepic`，以及选择公开还是私有。

复制配置文件并修改密钥：

```powershell
Copy-Item .env.example .env
```

启动服务：

```powershell
node src/server.js
```

当前 Codex 环境可用这个 Node：

```powershell
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' src\server.js
```

访问：

```text
http://127.0.0.1:8787
```

把 `.env` 里的 `ADMIN_TOKEN` 粘到管理台右上角，即可启用管理功能。

## Telegram Bot 对接

1. 找 [@BotFather](https://t.me/BotFather) 创建 Bot。
2. 在 `.env` 填入：

```text
TELEGRAM_BOT_TOKEN=你的bot_token
PUBLIC_URL=https://你的域名
TELEGRAM_WEBHOOK_SECRET=一段随机密钥
TELEGRAM_ALLOWED_USER_IDS=你的Telegram数字ID
```

3. 服务必须能被 Telegram 访问，且 `PUBLIC_URL` 必须是 HTTPS。
4. 注册 webhook：

```powershell
node scripts/set-telegram-webhook.js
```

Bot 支持：

- `/panel`：打开按钮式控制台。
- 发送图片：自动上传到图床并返回链接。
- `/stats`：查看图片数量和占用空间。
- `/list [数量]`：列出最近图片。
- `/search 关键词`：搜索图片。
- `/view 图片ID`：查看图片详情。
- `/rename 图片ID 新名称`：重命名。
- `/public 图片ID` / `/private 图片ID`：切换可见性。
- `/tags 图片ID 标签1,标签2`：设置标签。
- `/delete 图片ID`：删除图片。
- `/events [数量]`：查看最近操作。
- `/token list` / `/token create` / `/token delete`：管理 API 密钥。
- `/fetch 图片URL`：从外部 URL 抓图。
- `/link 图片ID [page|raw|markdown|html|bbcode]`：获取指定格式链接。

## 对象存储

默认是本地存储：

```text
STORAGE_DRIVER=local
```

切到 S3 兼容对象存储时：

```text
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket
S3_REGION=auto
S3_ENDPOINT=https://your-endpoint.example
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_PREFIX=telepic
S3_FORCE_PATH_STYLE=true
```

说明：

- `S3_ENDPOINT` 可用于 R2、B2 S3、MinIO 等兼容服务。
- `S3_PUBLIC_BASE_URL` 可选。配置后，“直链”会优先使用对象存储 / CDN 域名；不配置时仍然可以通过应用的 `/raw/:id` 提供图片。
- `S3_FORCE_PATH_STYLE=true` 对大多数兼容服务更稳，尤其是自定义 endpoint。
- `S3_PREFIX` 用于给对象 key 加前缀，便于同 bucket 下分目录管理。

Cloudflare R2 示例：

```text
STORAGE_DRIVER=s3
S3_BUCKET=telepic
S3_REGION=auto
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_PREFIX=telepic
S3_FORCE_PATH_STYLE=true
```

AWS S3 示例：

```text
STORAGE_DRIVER=s3
S3_BUCKET=telepic
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=
S3_PREFIX=telepic
S3_FORCE_PATH_STYLE=false
```

## API 示例

上传图片：

```powershell
curl.exe -H "Authorization: Bearer YOUR_TOKEN" -F "image=@C:\path\to\image.png" http://127.0.0.1:8787/api/upload
```

URL 抓图：

```powershell
curl.exe -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"url\":\"https://example.com/image.png\"}" http://127.0.0.1:8787/api/upload-from-url
```

列表：

```powershell
curl.exe -H "Authorization: Bearer ADMIN_TOKEN" "http://127.0.0.1:8787/api/images?q=logo&visibility=public&sort=newest"
```

删除：

```powershell
curl.exe -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" http://127.0.0.1:8787/api/images/IMAGE_ID
```

创建 API 密钥：

```powershell
curl.exe -X POST -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"uploader\",\"scopes\":[\"upload\",\"manage\"]}" http://127.0.0.1:8787/api/tokens
```

## 配置项

| 变量 | 说明 |
| --- | --- |
| `PORT` | HTTP 端口，默认 `8787`。 |
| `HOST` | 监听地址，本地用 `127.0.0.1`，容器用 `0.0.0.0`。 |
| `PUBLIC_URL` | 生成外链和 Telegram 回复时使用的公网地址。 |
| `DATA_DIR` | 数据和图片保存目录。 |
| `STORAGE_DRIVER` | `local` 或 `s3`。 |
| `S3_BUCKET` | S3 兼容存储 bucket 名称。 |
| `S3_REGION` | S3 区域，R2 可用 `auto`。 |
| `S3_ENDPOINT` | 兼容存储 endpoint，例如 R2 / B2 / MinIO。 |
| `S3_ACCESS_KEY_ID` | 对象存储 Access Key。 |
| `S3_SECRET_ACCESS_KEY` | 对象存储 Secret Key。 |
| `S3_PUBLIC_BASE_URL` | 可选的公开访问域名 / CDN 域名。 |
| `S3_PREFIX` | 对象 key 前缀。 |
| `S3_FORCE_PATH_STYLE` | 是否使用 path-style URL。 |
| `ADMIN_TOKEN` | 管理台和管理 API 的密钥。 |
| `PUBLIC_UPLOAD` | 是否允许匿名上传。 |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token。 |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook 路径密钥。 |
| `TELEGRAM_ALLOWED_USER_IDS` | 允许使用 Bot 的 Telegram 用户 ID，逗号分隔。 |
| `MAX_UPLOAD_BYTES` | 单文件上传大小限制。 |

## 后续路线

- 标签筛选、批量标签、相册。
- 缩略图、压缩、EXIF 清理。
- 登录用户和角色权限。
- 更完整的 Docker 部署文档和反向代理示例。

## License

MIT
