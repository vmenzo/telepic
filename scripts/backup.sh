#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${1:-${BACKUP_DIR}/telepic-backup-${STAMP}.tar.gz}"

cd "$APP_DIR"
mkdir -p "$(dirname "$TARGET")"

INCLUDE=""
[ -f .env ] && INCLUDE="${INCLUDE} .env"
[ -d data ] && INCLUDE="${INCLUDE} data"

if [ -z "$INCLUDE" ]; then
  echo "Nothing to back up. Expected .env or data/ in ${APP_DIR}."
  exit 1
fi

# shellcheck disable=SC2086
tar -czf "$TARGET" --exclude='./backups' --exclude='./node_modules' --exclude='./dist' $INCLUDE

echo "$TARGET"
