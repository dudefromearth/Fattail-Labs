#!/bin/zsh
# GBI ops dash interim. StudioTwo localhost :5056. Does not touch :3000/:4000/:5055.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data
export LABS_OPS_DASH_HOST=127.0.0.1
export LABS_OPS_DASH_PORT=5056
cd "$ROOT/server"
exec "$ROOT/server/.venv/bin/python" -m market_data.ops_dash
