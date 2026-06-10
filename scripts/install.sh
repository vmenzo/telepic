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

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root, for example: sudo sh scripts/install.sh"
  exit 1
fi

APP_DIR="$(prompt_value "Install directory" "$APP_DIR")"
PORT="$(prompt_value "HTTP port" "$PORT")"
if [ -z "$PUBLIC_URL" ]; then
  PUBLIC_URL="$(prompt_value "Public URL" "$(default_public_url)")"
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
  sed -i "s|^HOST=.*|HOST=0.0.0.0|" .env
  sed -i "s|^PORT=.*|PORT=${PORT}|" .env
  sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=${PUBLIC_URL}|" .env
  sed -i "s|^DATA_DIR=.*|DATA_DIR=/app/data|" .env
  sed -i "s|^DATABASE_DRIVER=.*|DATABASE_DRIVER=sqlite|" .env
  sed -i "s|^DATABASE_FILE=.*|DATABASE_FILE=/app/data/telepic.sqlite|" .env
  sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=${ADMIN_TOKEN}|" .env
  sed -i "s|^ADMIN_USERNAME=.*|ADMIN_USERNAME=${ADMIN_USERNAME}|" .env
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env
  sed -i "s|^ADMIN_SESSION_HOURS=.*|ADMIN_SESSION_HOURS=168|" .env
  sed -i "s|^TELEGRAM_WEBHOOK_SECRET=.*|TELEGRAM_WEBHOOK_SECRET=${WEBHOOK_SECRET}|" .env
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
fi

echo "==> Starting Docker service"
$COMPOSE up -d --build

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
