#!/bin/zsh
# Standing gold archive — Market Bus writers + SSR live tap.
# Host: StudioOne (dedicated). Does not run on MiniTwo. One writer.
set -euo pipefail
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_BUS=1
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Volumes/FatTail2TB/fattail-market-data}"
cd "$ROOT/server"

alive() { pgrep -f "$1" >/dev/null 2>&1; }

if ! alive "market_data.sym_feed"; then
  .venv/bin/python -m market_data.sym_feed --interval 5 &
fi
if ! alive "market_data.chain_feed"; then
  .venv/bin/python -m market_data.chain_feed --interval 2 &
fi
exec .venv/bin/python -m market_data.ssr_live_capture
