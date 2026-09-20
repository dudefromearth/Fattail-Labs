#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export TZ=America/New_York
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
cd "$ROOT/server"
exec "$ROOT/server/.venv/bin/python" -m market_data.vp_ops.autorun
