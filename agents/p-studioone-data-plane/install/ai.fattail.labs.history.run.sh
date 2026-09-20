#!/bin/zsh
# SODP2 F3 history sidecar. StudioOne D1 :4012. Computing-class.
# Does not touch chain_feed, vp-api :4010, symbology :4011.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_HISTORY_API_HOST="${LABS_HISTORY_API_HOST:-0.0.0.0}"
export LABS_HISTORY_API_PORT="${LABS_HISTORY_API_PORT:-4012}"
export LABS_FUTURES_HISTORY_ROOT="${LABS_FUTURES_HISTORY_ROOT:-/Users/ernie/fattail-market-data}"
cd "$ROOT/server"
if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
else
  echo "history-run: no python venv at $ROOT/server/.venv" >&2
  exit 1
fi
exec "$PY" -m history_app
