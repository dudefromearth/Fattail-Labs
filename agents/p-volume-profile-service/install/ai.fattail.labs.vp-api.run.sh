#!/bin/zsh
# VP Contract API sidecar. StudioTwo. Does not touch :3000 / :4000.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
# Truth: engine/ingest store on StudioTwo is the internal disk, not FatTail2TB.
export LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data
export LABS_VP_API_PORT="${LABS_VP_API_PORT:-4010}"
export LABS_VP_WARMER="${LABS_VP_WARMER:-1}"
cd "$ROOT/server"
if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
else
  echo "vp-api-run: no python venv at $ROOT/server/.venv" >&2
  exit 1
fi
exec "$PY" -m market_data.vp_api
