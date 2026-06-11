#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/telepic}"
BRANCH="${TELEPIC_BRANCH:-main}"

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

env_value() {
  KEY="$1"
  if [ ! -f .env ]; then
    echo ""
    return
  fi
  grep "^${KEY}=" .env | tail -n 1 | cut -d= -f2- || true
}

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Telepic git checkout not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

COMPOSE="$(compose_cmd)"
if [ -z "$COMPOSE" ]; then
  echo "Docker Compose is required."
  exit 1
fi

$COMPOSE up -d --build

if [ -n "$(env_value TELEGRAM_BOT_TOKEN)" ]; then
  echo "Registering Telegram webhook and command menu..."
  if ! $COMPOSE exec -T telepic node scripts/set-telegram-webhook.js; then
    echo "Telegram webhook registration failed. Check PUBLIC_URL, TELEGRAM_BOT_TOKEN, and TELEGRAM_WEBHOOK_SECRET in ${APP_DIR}/.env."
  fi
fi

$COMPOSE ps

echo "Telepic updated."
