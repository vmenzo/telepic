#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

run_check() {
  LABEL="$1"
  shift
  echo "==> ${LABEL}"
  "$@"
}

cd "$APP_DIR"

need_cmd node
need_cmd npm
need_cmd docker

run_check "Install dependencies" npm install
run_check "TypeScript check" npm run check
run_check "Build application" npm run build
run_check "Check compiled server syntax" node --check dist/server.js
run_check "Check web bootstrap syntax" node --check dist/web.js
run_check "Validate compose file" docker compose config
run_check "Build Docker image" docker build -t telepic:self-check .

echo ""
echo "Self-check passed."
