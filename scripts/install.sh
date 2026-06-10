#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:-telepic}"
APP_DIR="${APP_DIR:-/opt/telepic}"
REPO_URL="${TELEPIC_REPO:-https://github.com/YOUR_GITHUB_USERNAME/telepic.git}"
BRANCH="${TELEPIC_BRANCH:-main}"
PORT="${PORT:-8787}"
PUBLIC_URL="${PUBLIC_URL:-}"

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

echo "==> Checking runtime"
need_cmd git
need_cmd docker
COMPOSE="$(compose_cmd)"
if [ -z "$COMPOSE" ]; then
  echo "Docker Compose is required. Install Docker Compose v2 first."
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root, for example: sudo sh scripts/install.sh"
  exit 1
fi

if [ "$REPO_URL" = "https://github.com/YOUR_GITHUB_USERNAME/telepic.git" ]; then
  echo "Set TELEPIC_REPO first, for example:"
  echo "TELEPIC_REPO=https://github.com/yourname/telepic.git sh scripts/install.sh"
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
  WEBHOOK_SECRET="tp_wh_$(random_secret)"
  if [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL="http://127.0.0.1:${PORT}"
  fi
  sed -i "s|^HOST=.*|HOST=0.0.0.0|" .env
  sed -i "s|^PORT=.*|PORT=${PORT}|" .env
  sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=${PUBLIC_URL}|" .env
  sed -i "s|^DATA_DIR=.*|DATA_DIR=/app/data|" .env
  sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=${ADMIN_TOKEN}|" .env
  sed -i "s|^TELEGRAM_WEBHOOK_SECRET=.*|TELEGRAM_WEBHOOK_SECRET=${WEBHOOK_SECRET}|" .env
else
  ADMIN_TOKEN="$(grep '^ADMIN_TOKEN=' .env | tail -n 1 | cut -d= -f2- || true)"
fi

echo "==> Starting Docker service"
$COMPOSE up -d --build

echo ""
echo "Telepic is running."
echo "URL: ${PUBLIC_URL}"
echo "Admin token: ${ADMIN_TOKEN}"
echo ""
echo "Manage service:"
echo "  cd ${APP_DIR}"
echo "  ${COMPOSE} ps"
echo "  ${COMPOSE} logs -f"
echo "  ${COMPOSE} pull && ${COMPOSE} up -d --build"
