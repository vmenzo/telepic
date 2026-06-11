#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:-telepic}"
APP_DIR="${APP_DIR:-/opt/telepic}"
REPO_URL="${TELEPIC_REPO:-https://github.com/vmenzo/telepic.git}"
BRANCH="${TELEPIC_BRANCH:-main}"
PORT="${PORT:-8787}"
PUBLIC_URL="${PUBLIC_URL:-}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
TELEPIC_NONINTERACTIVE="${TELEPIC_NONINTERACTIVE:-}"
PUBLIC_UPLOAD="${PUBLIC_UPLOAD:-false}"
DATABASE_DRIVER="${DATABASE_DRIVER:-sqlite}"
STORAGE_DRIVER="${STORAGE_DRIVER:-local}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-auto}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-}"
S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-}"
S3_PUBLIC_BASE_URL="${S3_PUBLIC_BASE_URL:-}"
S3_PREFIX="${S3_PREFIX:-telepic}"
S3_FORCE_PATH_STYLE="${S3_FORCE_PATH_STYLE:-true}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_ALLOWED_USER_IDS="${TELEGRAM_ALLOWED_USER_IDS:-}"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    return 1
  fi
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr -d '=+/' | cut -c 1-40
    return
  fi
  dd if=/dev/urandom bs=32 count=1 2>/dev/null | od -An -tx1 | tr -d ' \n' | cut -c 1-40
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
    return
  fi
  echo ""
}

prompt_value() {
  LABEL="$1"
  DEFAULT_VALUE="$2"
  if [ -n "$TELEPIC_NONINTERACTIVE" ] || [ ! -r /dev/tty ]; then
    echo "$DEFAULT_VALUE"
    return
  fi
  printf "%s [%s]: " "$LABEL" "$DEFAULT_VALUE" > /dev/tty
  IFS= read -r ANSWER < /dev/tty || ANSWER=""
  if [ -n "$ANSWER" ]; then
    echo "$ANSWER"
  else
    echo "$DEFAULT_VALUE"
  fi
}

default_public_url() {
  if command -v hostname >/dev/null 2>&1; then
    IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
    if [ -n "$IP" ]; then
      echo "http://${IP}:${PORT}"
      return
    fi
  fi
  echo "http://127.0.0.1:${PORT}"
}

package_manager() {
  if command -v apt-get >/dev/null 2>&1; then echo "apt"; return; fi
  if command -v dnf >/dev/null 2>&1; then echo "dnf"; return; fi
  if command -v yum >/dev/null 2>&1; then echo "yum"; return; fi
  if command -v apk >/dev/null 2>&1; then echo "apk"; return; fi
  if command -v pacman >/dev/null 2>&1; then echo "pacman"; return; fi
  echo ""
}

install_runtime() {
  PM="$(package_manager)"
  if [ -z "$PM" ]; then
    echo "Cannot detect package manager. Please install git, Docker, and Docker Compose first."
    exit 1
  fi

  echo "==> Installing runtime with ${PM}"
  case "$PM" in
    apt)
      apt-get update
      apt-get install -y git ca-certificates curl docker.io docker-compose-plugin || apt-get install -y git ca-certificates curl docker.io docker-compose
      ;;
    dnf)
      dnf install -y git docker docker-compose-plugin || dnf install -y git docker docker-compose
      ;;
    yum)
      yum install -y git docker docker-compose-plugin || yum install -y git docker docker-compose
      ;;
    apk)
      apk add --no-cache git docker docker-cli-compose || apk add --no-cache git docker docker-compose
      ;;
    pacman)
      pacman -Sy --noconfirm git docker docker-compose
      ;;
  esac
}

start_docker() {
  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now docker >/dev/null 2>&1 || true
    return
  fi
  if command -v service >/dev/null 2>&1; then
    service docker start >/dev/null 2>&1 || true
  fi
}

compose_ps() {
  $COMPOSE ps >/dev/null 2>&1
}

compose_up() {
  $COMPOSE up -d --build
}

compose_logs_tail() {
  $COMPOSE logs --tail=120
}

service_ready() {
  if ! compose_ps; then
    return 1
  fi
  if $COMPOSE ps --format json >/dev/null 2>&1; then
    $COMPOSE ps --format json | grep -q '"State":"running"' 2>/dev/null
    return $?
  fi
  $COMPOSE ps | grep -qi "Up"
}

env_set() {
  KEY="$1"
  VALUE="$2"
  if grep -q "^${KEY}=" .env 2>/dev/null; then
    sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" .env
  else
    printf "%s=%s\n" "$KEY" "$VALUE" >> .env
  fi
}

env_value_file() {
  FILE_PATH="$1"
  KEY="$2"
  if [ ! -f "$FILE_PATH" ]; then
    echo ""
    return
  fi
  grep "^${KEY}=" "$FILE_PATH" | tail -n 1 | cut -d= -f2- || true
}

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root, for example: sudo sh scripts/install.sh"
  exit 1
fi

APP_DIR="$(prompt_value "Install directory" "$APP_DIR")"
PORT="$(prompt_value "HTTP port" "$PORT")"
if [ -z "$PUBLIC_URL" ]; then
  EXISTING_PUBLIC_URL="$(env_value_file "${APP_DIR}/.env" "PUBLIC_URL")"
  if [ -n "$EXISTING_PUBLIC_URL" ]; then
    PUBLIC_URL="$(prompt_value "Public URL" "$EXISTING_PUBLIC_URL")"
  else
    PUBLIC_URL="$(prompt_value "Public URL" "$(default_public_url)")"
  fi
fi
ADMIN_USERNAME="$(prompt_value "Admin username" "$ADMIN_USERNAME")"

echo "==> Checking Linux runtime"
if ! command -v git >/dev/null 2>&1 || ! command -v docker >/dev/null 2>&1; then
  install_runtime
fi
need_cmd git
need_cmd docker
start_docker
COMPOSE="$(compose_cmd)"
if [ -z "$COMPOSE" ]; then
  echo "Docker Compose is required. Install Docker Compose v2 first."
  exit 1
fi

echo "==> Installing ${APP_NAME} into ${APP_DIR}"
mkdir -p "$(dirname "$APP_DIR")"

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --prune origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "==> Creating .env"
  cp .env.example .env
  ADMIN_TOKEN="tp_admin_$(random_secret)"
  ADMIN_PASSWORD="tp_pass_$(random_secret)"
  WEBHOOK_SECRET="tp_wh_$(random_secret)"
  env_set HOST "0.0.0.0"
  env_set PORT "${PORT}"
  env_set PUBLIC_URL "${PUBLIC_URL}"
  env_set DATA_DIR "/app/data"
  env_set DATABASE_DRIVER "${DATABASE_DRIVER}"
  env_set DATABASE_FILE "/app/data/telepic.sqlite"
  env_set STORAGE_DRIVER "${STORAGE_DRIVER}"
  env_set S3_BUCKET "${S3_BUCKET}"
  env_set S3_REGION "${S3_REGION}"
  env_set S3_ENDPOINT "${S3_ENDPOINT}"
  env_set S3_ACCESS_KEY_ID "${S3_ACCESS_KEY_ID}"
  env_set S3_SECRET_ACCESS_KEY "${S3_SECRET_ACCESS_KEY}"
  env_set S3_PUBLIC_BASE_URL "${S3_PUBLIC_BASE_URL}"
  env_set S3_PREFIX "${S3_PREFIX}"
  env_set S3_FORCE_PATH_STYLE "${S3_FORCE_PATH_STYLE}"
  env_set ADMIN_TOKEN "${ADMIN_TOKEN}"
  env_set ADMIN_USERNAME "${ADMIN_USERNAME}"
  env_set ADMIN_PASSWORD "${ADMIN_PASSWORD}"
  env_set ADMIN_SESSION_HOURS "168"
  env_set PUBLIC_UPLOAD "${PUBLIC_UPLOAD}"
  env_set TELEGRAM_BOT_TOKEN "${TELEGRAM_BOT_TOKEN}"
  env_set TELEGRAM_WEBHOOK_SECRET "${WEBHOOK_SECRET}"
  env_set TELEGRAM_ALLOWED_USER_IDS "${TELEGRAM_ALLOWED_USER_IDS}"
else
  ADMIN_TOKEN="$(grep '^ADMIN_TOKEN=' .env | tail -n 1 | cut -d= -f2- || true)"
  ADMIN_USERNAME="$(grep '^ADMIN_USERNAME=' .env | tail -n 1 | cut -d= -f2- || true)"
  if [ -z "$ADMIN_USERNAME" ]; then
    ADMIN_USERNAME="admin"
  fi
  ADMIN_PASSWORD="$(grep '^ADMIN_PASSWORD=' .env | tail -n 1 | cut -d= -f2- || true)"
  if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD="$ADMIN_TOKEN"
  fi
  env_set HOST "0.0.0.0"
  env_set PORT "${PORT}"
  env_set PUBLIC_URL "${PUBLIC_URL}"
fi

echo "==> Starting Docker service"
compose_up

if [ -n "$(env_value_file .env TELEGRAM_BOT_TOKEN)" ]; then
  echo "==> Registering Telegram webhook and command menu"
  if ! $COMPOSE exec -T telepic node scripts/set-telegram-webhook.js; then
    echo "Telegram webhook registration failed. Check PUBLIC_URL, TELEGRAM_BOT_TOKEN, and TELEGRAM_WEBHOOK_SECRET in ${APP_DIR}/.env."
  fi
fi

if ! service_ready; then
  echo ""
  echo "Telepic failed to start. Recent container logs:"
  compose_logs_tail || true
  echo ""
  echo "Please check the values in ${APP_DIR}/.env and run:"
  echo "  cd ${APP_DIR}"
  echo "  ${COMPOSE} up -d --build"
  exit 1
fi

echo ""
echo "Telepic is running."
echo "URL: ${PUBLIC_URL}"
echo "Admin username: ${ADMIN_USERNAME}"
echo "Admin password: ${ADMIN_PASSWORD}"
echo "Admin token: ${ADMIN_TOKEN}"
echo ""
echo "Manage service:"
echo "  cd ${APP_DIR}"
echo "  ${COMPOSE} ps"
echo "  ${COMPOSE} logs -f"
echo "  ${COMPOSE} pull && ${COMPOSE} up -d --build"
