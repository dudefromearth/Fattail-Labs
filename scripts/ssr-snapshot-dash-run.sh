#!/bin/zsh
# Chain Snapshot dashboard — StudioOne localhost only.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Volumes/FatTail2TB/fattail-market-data}"
export LABS_SSR_DASH_HOST="${LABS_SSR_DASH_HOST:-127.0.0.1}"
export LABS_SSR_DASH_PORT="${LABS_SSR_DASH_PORT:-5055}"
cd "$ROOT/server"

if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
elif [[ -x "$HOME/.venv/bin/python" ]]; then
  PY="$HOME/.venv/bin/python"
else
  echo "ssr-snapshot-dash-run: no python venv at server/.venv or \$HOME/.venv" >&2
  exit 1
fi

exec "$PY" -m market_data.ssr_snapshot_dash
