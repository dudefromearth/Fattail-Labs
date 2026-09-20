#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data
export LABS_VP_BIN_INTERVAL_S=60
cd "$ROOT/server"
exec "$ROOT/server/.venv/bin/python" -m market_data.vp_engine.bin_loop
