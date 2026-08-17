#!/bin/zsh
# Standing gold archive — Market Bus writers + SSR live tap.
# Host: StudioOne (dedicated). Does not run on MiniTwo. One writer.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_BUS=1
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Volumes/FatTail2TB/fattail-market-data}"
# OD-6: gold chain snaps 3–5s from 2026-08-17 open. Fail loud if set outside the band.
export LABS_SSR_CHAIN_EVERY_S="${LABS_SSR_CHAIN_EVERY_S:-4}"
cd "$ROOT/server"

if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
elif [[ -x "$HOME/.venv/bin/python" ]]; then
  PY="$HOME/.venv/bin/python"
else
  echo "ssr-live-capture-run: no python venv at server/.venv or \$HOME/.venv" >&2
  exit 1
fi

alive() { pgrep -f "$1" >/dev/null 2>&1; }

if ! alive "market_data.sym_feed"; then
  "$PY" -m market_data.sym_feed --interval 5 &
fi
if ! alive "market_data.chain_feed"; then
  "$PY" -m market_data.chain_feed --interval 2 &
fi
exec "$PY" -m market_data.ssr_live_capture
