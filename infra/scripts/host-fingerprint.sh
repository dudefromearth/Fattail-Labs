#!/usr/bin/env bash
# host-fingerprint.sh — one-screen fingerprint of a Labs host, for "identical to MiniTwo" evidence.
#
# ▶ RUN ON: MiniTwo, then DudeOne (and later MiniTwo-as-staging). Diff the two outputs.
#   bash ~/Fattail-Labs/infra/scripts/host-fingerprint.sh > /tmp/fp-$(hostname -s).txt
#
# Read-only. Prints env variable NAMES only — never values. Needs the repo at ~/Fattail-Labs.
set -u
R="$HOME/Fattail-Labs"
say(){ printf '%-14s %s\n' "$1" "$2"; }
say host      "$(hostname -s) · $(sw_vers -productVersion 2>/dev/null) · $(uname -m) · TZ=$(readlink /etc/localtime | sed 's#.*zoneinfo/##')"
if [ -d "$R/.git" ]; then
  say git       "$(git -C "$R" rev-parse --short HEAD) $(git -C "$R" branch --show-current) dirty=$(git -C "$R" status --porcelain | wc -l | tr -d ' ')"
else say git "NO REPO at $R"; fi
say python    "$("$R/server/.venv/bin/python" --version 2>&1 || echo 'no venv')"
say reqs      "$(shasum "$R/server/requirements.txt" 2>/dev/null | cut -c1-12)  installed=$("$R/server/.venv/bin/pip" freeze 2>/dev/null | shasum | cut -c1-12)"
say node      "$(node --version 2>/dev/null || echo absent) npm=$(npm --version 2>/dev/null || echo absent)"
say weblock   "$(shasum "$R/web/package-lock.json" 2>/dev/null | cut -c1-12)  build=$([ -d "$R/web/.next" ] && stat -f %Sm -t %F_%T "$R/web/.next/BUILD_ID" 2>/dev/null || echo none)"
say env_keys  "$([ -f "$R/.env" ] && grep -o '^[A-Z_][A-Z0-9_]*' "$R/.env" | sort -u | tr '\n' ' ' | shasum | cut -c1-12) n=$([ -f "$R/.env" ] && grep -c '^[A-Z_][A-Z0-9_]*=' "$R/.env" || echo 0)"
say env_list  "$([ -f "$R/.env" ] && grep -o '^[A-Z_][A-Z0-9_]*' "$R/.env" | sort -u | tr '\n' ' ')"
say mysql     "$(mysql --version 2>/dev/null | sed 's/,.*//' || echo absent)"
if [ -f "$R/.env" ]; then
  set -a; . "$R/.env" 2>/dev/null; set +a
  say db_tables "$(mysql -h "${LABS_DB_HOST:-127.0.0.1}" -P "${LABS_DB_PORT:-3306}" -u "${LABS_DB_USER:-labs}" -p"${LABS_DB_PASSWORD:-}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${LABS_DB_NAME:-labs}'" 2>/dev/null || echo 'no db access')"
  say db_rows   "$(mysql -h "${LABS_DB_HOST:-127.0.0.1}" -P "${LABS_DB_PORT:-3306}" -u "${LABS_DB_USER:-labs}" -p"${LABS_DB_PASSWORD:-}" -N -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='${LABS_DB_NAME:-labs}' ORDER BY table_name" 2>/dev/null | tr '\t' '=' | tr '\n' ' ' | shasum | cut -c1-12) (hash of table_rows; approximate under InnoDB — use the dump row counts for the real check)"
  say migrations "$(cd "$R/server" && .venv/bin/python migrate.py --dry-run 2>/dev/null | tail -1)"
fi
say launchd   "$(launchctl list 2>/dev/null | awk '$3 ~ /fattail|labwiki/ {print $3"("$1")"}' | sort | tr '\n' ' ')"
say ports     "$(lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $9}' | sed 's/.*://' | sort -un | tr '\n' ' ')"
say health    "$(curl -s -m 3 "http://127.0.0.1:${LABS_PORT:-4000}/api/health" | head -c 120 || echo 'no api')"
say wiki      "$([ -n "${LABS_WIKI_ROOT:-}" ] && git -C "$LABS_WIKI_ROOT" rev-parse --short HEAD 2>/dev/null || echo 'n/a')"
say tailscale "$(tailscale ip -4 2>/dev/null || echo absent)"
say disk      "$(df -h / | awk 'NR==2{print $4" free of "$2}')"
