#!/bin/zsh
# Sibling futures collector. Host: StudioOne. Does not touch chain_feed / sym_feed.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
# StudioTwo has no FatTail2TB. Do not inherit StudioOne's .env path.
if [[ ! -d /Volumes/FatTail2TB/fattail-market-data ]]; then
  export LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data
fi
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Users/ernie/fattail-market-data}"
cd "$ROOT/server"
if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
else
  echo "vp-futures-run: no python venv at $ROOT/server/.venv" >&2
  exit 1
fi
exec "$PY" -m market_data.vp_ingest.futures_feed
