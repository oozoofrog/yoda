#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8123}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}"

cd "$ROOT_DIR"

echo "[yoda] 웹 콘텐츠를 생성합니다..."
python3 scripts/build_web_content.py

echo "[yoda] 서버를 시작합니다: ${URL}"
echo "[yoda] 종료하려면 Ctrl+C"

if command -v open >/dev/null 2>&1; then
  (sleep 1; open "$URL") >/dev/null 2>&1 || true
fi

python3 -m http.server "$PORT" -b "$HOST" -d docs
