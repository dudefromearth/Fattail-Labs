#!/bin/zsh
# Chain Snapshot dashboard — StudioOne LAN (http://studioone.local:5055).
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Volumes/FatTail2TB/fattail-market-data}"
export LABS_SSR_DASH_HOST="${LABS_SSR_DASH_HOST:-0.0.0.0}"
export LABS_SSR_DASH_PORT="${LABS_SSR_DASH_PORT:-5055}"
export PYTHONUNBUFFERED=1
# Archive work runs niced below the tap (process-wide; macOS has no per-thread nice).
renice +10 $$ >/dev/null 2>&1 || true
if [[ -z "${LABS_SSR_ARCHIVE_TOKEN:-}" ]]; then
  echo "ssr-snapshot-dash-run: LABS_SSR_ARCHIVE_TOKEN unset — archive routes 501 ARCHIVE NOT CONFIGURED (collector HTML still up)" >&2
elif [[ ${#LABS_SSR_ARCHIVE_TOKEN} -lt 32 ]]; then
  echo "ssr-snapshot-dash-run: LABS_SSR_ARCHIVE_TOKEN is shorter than 32 characters" >&2
  exit 1
fi
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
