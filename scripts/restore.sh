#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
ARCHIVE="${1:-}"

if [ -z "$ARCHIVE" ]; then
  echo "Usage: sh scripts/restore.sh /path/to/telepic-backup.tar.gz"
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Backup archive not found: $ARCHIVE"
  exit 1
fi

cd "$APP_DIR"
if [ -e .env ] || [ -d data ]; then
  SAFETY="pre-restore-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$SAFETY"
  [ -e .env ] && cp .env "$SAFETY/.env"
  [ -d data ] && cp -a data "$SAFETY/data"
  echo "Existing config/data copied to ${APP_DIR}/${SAFETY}"
fi

tar -xzf "$ARCHIVE" -C "$APP_DIR"
echo "Restored from $ARCHIVE"
echo "Restart Telepic after restore."
