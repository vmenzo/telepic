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
run_check "Check server syntax" node --check src/server.js
run_check "Check web bootstrap syntax" node --check src/web.js
run_check "Check frontend syntax" node --check public/app.js
run_check "Validate compose file" docker compose config
run_check "Build Docker image" docker build -t telepic:self-check .

echo ""
echo "Self-check passed."
