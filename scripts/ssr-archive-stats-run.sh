#!/bin/zsh
# Nightly archive stats — StudioOne, niced below the tap. Spec v0.8 §7.2.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export LABS_MARKET_DATA_ROOT="${LABS_MARKET_DATA_ROOT:-/Volumes/FatTail2TB/fattail-market-data}"
export PYTHONUNBUFFERED=1
renice +10 $$ >/dev/null 2>&1 || true
cd "$ROOT/server"
if [[ -x "$ROOT/server/.venv/bin/python" ]]; then
  PY="$ROOT/server/.venv/bin/python"
elif [[ -x "$HOME/.venv/bin/python" ]]; then
  PY="$HOME/.venv/bin/python"
else
  echo "ssr-archive-stats-run: no python venv" >&2
  exit 1
fi
exec "$PY" -m market_data.ssr_archive_stats
