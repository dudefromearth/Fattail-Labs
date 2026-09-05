#!/usr/bin/env bash
# FatTail Labs — start the app locally on macOS.
#
#     cd ~/Fattail-Labs && bash scripts/dev-run-macos.sh
#
# First run installs what is missing (python deps, npm packages). Later runs
# skip straight to starting both servers. Ctrl-C stops both.
#
# Prerequisite: scripts/dev-setup-macos.sh has been run (creates .env and the
# labs database). Dev only — never staging or production (Invariant 3).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

[ -f .env ] || { echo "!! no .env — run: bash scripts/dev-setup-macos.sh"; exit 1; }
set -a; source .env; set +a
PORT="${LABS_PORT:-4000}"

# ---------------------------------------------------------------- python deps
PY=""
for c in server/.venv/bin/python python3.12 python3.11; do
  if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then PY="$c"; break; fi
done
[ -n "$PY" ] || { echo "!! need Python 3.11+ (brew install python@3.12)"; exit 1; }

if [ ! -x server/.venv/bin/python ]; then
  echo "==> creating server/.venv with $PY"
  "$PY" -m venv server/.venv || exit 1
fi

VER="$(server/.venv/bin/python -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)"
case "$VER" in
  3.1[1-9]|3.[2-9]*) : ;;
  *) echo "!! server/.venv is Python $VER — the code needs 3.11+ (typing.NotRequired)."
     echo "   Delete it and re-run:  rm -rf server/.venv && bash scripts/dev-run-macos.sh"
     exit 1 ;;
esac

if ! server/.venv/bin/python -c "import fastapi, pymysql, jwt" >/dev/null 2>&1; then
  echo "==> installing python dependencies (first run only)"
  server/.venv/bin/pip install --quiet --upgrade pip
  server/.venv/bin/pip install --quiet -r server/requirements.txt || exit 1
fi

# ---------------------------------------------------------------- node deps
if [ ! -d web/node_modules ]; then
  echo "==> installing npm packages (first run only, a few minutes)"
  ( cd web && npm install ) || exit 1
fi

# ---------------------------------------------------------------- preflight
echo "==> checking config and database"
server/.venv/bin/python - <<'PY' || exit 1
import os, sys
sys.path.insert(0, "server")
try:
    import config, db
    cfg = config.get_config()
    c = db.connect(); cur = c.cursor()
    cur.execute("SELECT COUNT(*) AS n FROM schema_migrations")
    row = cur.fetchone()
    n = row["n"] if isinstance(row, dict) else row[0]   # db.py uses a dict cursor
    print(f"    config OK · db {cfg.db_name}@{cfg.db_host} · {n} migrations")
except Exception as e:
    print(f"!! {type(e).__name__}: {e}")
    print("   Config is fail-loud by design; the message above names what is wrong.")
    sys.exit(1)
PY

# ---------------------------------------------------------------- run
echo
echo "==> starting  API http://127.0.0.1:$PORT   ·   web http://localhost:3000"
echo "    Ctrl-C stops both."
echo

cleanup() { kill "${API_PID:-}" "${WEB_PID:-}" 2>/dev/null; wait 2>/dev/null; }
trap cleanup EXIT INT TERM

( cd server && ../server/.venv/bin/uvicorn main:app --port "$PORT" --host 127.0.0.1 ) &
API_PID=$!
( cd web && npm run dev ) &
WEB_PID=$!
wait
