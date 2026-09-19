#!/bin/zsh
# Symbology Registry sidecar. StudioOne D1. Computing-class :4011.
# Does not touch chain_feed, vp-api :4010, Labs :3000/:4000, or Massive.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_SYMBOLOGY_API_HOST="${LABS_SYMBOLOGY_API_HOST:-0.0.0.0}"
export LABS_SYMBOLOGY_API_PORT="${LABS_SYMBOLOGY_API_PORT:-4011}"
cd "$ROOT/server"
if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
else
  echo "symbology-run: no python venv at $ROOT/server/.venv" >&2
  exit 1
fi
exec "$PY" -m symbology_app
