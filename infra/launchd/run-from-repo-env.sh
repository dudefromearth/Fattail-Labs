#!/bin/zsh
# Source the repo .env, then exec python from the Labs venv.
# No secrets in this file. chain-feed (and later feeds) need the full
# server config, not just LABS_MARKET_BUS / REDIS_URL.
set -euo pipefail
ROOT="/Users/ernie/Fattail-Labs"
ENVFILE="$ROOT/.env"
if [[ ! -f "$ENVFILE" ]]; then
  print -u2 "run-from-repo-env: missing $ENVFILE"
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENVFILE"
set +a
cd "$ROOT/server"
exec "$ROOT/server/.venv/bin/python" "$@"
