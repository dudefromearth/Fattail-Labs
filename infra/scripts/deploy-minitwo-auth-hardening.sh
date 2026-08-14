#!/usr/bin/env bash
# Deploy Labs main (auth hardening H5 residual) on MiniTwo.
# Run ON MiniTwo as the Labs user (ernie), from any directory:
#   bash ~/Fattail-Labs/infra/scripts/deploy-minitwo-auth-hardening.sh
#
# Prerequisites:
#   - Repo at ~/Fattail-Labs
#   - .env has LABS_ENV=production|staging and LABS_ADMIN_EMAILS=...
#   - launchd: ai.fattail.labs.api + ai.fattail.labs.web

set -euo pipefail

# launchd/SSH non-interactive shells often lack Homebrew on PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH:-/usr/bin:/bin}"

REPO="${LABS_REPO:-$HOME/Fattail-Labs}"

GO_ID=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --go)
      if [[ $# -lt 2 ]]; then
        echo "REFUSE: --go requires an ID (e.g. --go RB-08)" >&2
        exit 1
      fi
      GO_ID="$2"
      shift 2
      ;;
    *)
      echo "REFUSE: unknown argument: $1" >&2
      echo "  deploy requires --go <ID>  (DL-328 / agents/go/README.md)" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$GO_ID" ]]; then
  echo "REFUSE: deploy kickstart requires --go <ID>" >&2
  echo "  Chat GO is not authority. See agents/go/README.md" >&2
  echo "  Example: bash infra/scripts/deploy-minitwo-auth-hardening.sh --go RB-08" >&2
  exit 1
fi

REQUIRE_GO="$REPO/scripts/require_go.py"
if [[ ! -f "$REQUIRE_GO" ]]; then
  echo "REFUSE: missing $REQUIRE_GO" >&2
  exit 1
fi
echo "==> GO check --id $GO_ID"
python3 "$REQUIRE_GO" --id "$GO_ID" --root "$REPO"

cd "$REPO"

echo "==> git pull"
git fetch origin
git checkout main
git pull --ff-only origin main
echo "    HEAD=$(git rev-parse --short HEAD)"

if [[ ! -f .env ]]; then
  echo "ERROR: missing $REPO/.env" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env && set +a

if [[ "${LABS_ENV:-}" != "dev" ]]; then
  if [[ -z "${LABS_ADMIN_EMAILS:-}" ]]; then
    echo "ERROR: LABS_ADMIN_EMAILS is required when LABS_ENV=$LABS_ENV" >&2
    echo "  Add e.g. LABS_ADMIN_EMAILS=ernie@dudefromearth.com,coach@fattail.ai,conor@fattail.ai" >&2
    exit 1
  fi
  echo "==> LABS_ADMIN_EMAILS is set (${#LABS_ADMIN_EMAILS} chars)"
fi

echo "==> pip (if needed)"
if [[ -f server/requirements.txt ]]; then
  server/.venv/bin/pip install -q -r server/requirements.txt
fi

echo "==> migrations"
(cd server && .venv/bin/python migrate.py)

echo "==> web build"
(cd web && npm ci && npm run build)

echo "==> restart launchd"
UID_NUM="$(id -u)"
launchctl kickstart -k "gui/${UID_NUM}/ai.fattail.labs.api" || {
  echo "WARN: kickstart api failed — try: launchctl load ~/Library/LaunchAgents/ai.fattail.labs.api.plist" >&2
}
launchctl kickstart -k "gui/${UID_NUM}/ai.fattail.labs.web" || {
  echo "WARN: kickstart web failed — try: launchctl load ~/Library/LaunchAgents/ai.fattail.labs.web.plist" >&2
}

sleep 2
echo "==> verify"
lsof -nP -iTCP:4000 -sTCP:LISTEN || true
curl -fsS "http://127.0.0.1:4000/api/health" | tee /tmp/labs-health.json
echo
PROV="$(curl -fsS "http://127.0.0.1:4000/api/auth/providers")"
echo "$PROV" | head -c 600
echo
if echo "$PROV" | grep -q 'reauth=1'; then
  echo "OK: providers include reauth=1"
else
  echo "WARN: providers missing reauth=1 — check LABS_SSO_LOGIN_URL_* and LABS_SSO_FORCE_REAUTH" >&2
fi

echo "==> done HEAD=$(git rev-parse --short HEAD)"
