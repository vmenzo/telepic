#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/telepic}"
BRANCH="${TELEPIC_BRANCH:-main}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Telepic git checkout not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
  docker compose ps
else
  docker-compose up -d --build
  docker-compose ps
fi

echo "Telepic updated."
