#!/usr/bin/env bash
# Quant Lab — Delta evidence packet, MacBook side (DL-677, ATRV v0.9 §7).
#
# ▶ RUN ON: MacBook, from the repo root, with the dev API already running
#   (scripts/dev-run-macos.sh) and the repo-root .env sourced (set -a; source .env; set +a). Never on StudioOne.
#   If the suite fails at conftest import with an anyio DeprecationWarning, the
#   venv is behind requirements.txt (anyio must be <4.10):
#       cd server && .venv/bin/pip install -r requirements.txt
#
# Produces docs/evidence/quant-delta-macbook-<date>.txt containing:
#   1. the full characterization suite on the dev venv (not --noconftest)
#   2. a real-server curl transcript against http://localhost:$LABS_PORT
#      - unauthenticated  -> must be 401
#      - authenticated    -> only if FT_SESSION is set in the environment;
#                            the cookie VALUE is never written anywhere
# Env var NAMES are printed; VALUES never are.
set -u
cd "$(dirname "$0")/.." || exit 1
: "${LABS_PORT:?LABS_PORT must be set (source .env first)}"
DAY="$(date +%F)"
OUT="docs/evidence/quant-delta-macbook-${DAY}.txt"
mkdir -p docs/evidence
{
  echo "# Quant Lab — Delta evidence (MacBook) ${DAY}"
  echo "host: $(hostname)  commit: $(git rev-parse --short HEAD)  branch: $(git branch --show-current)"
  echo "env present: LABS_PORT=$([ -n "${LABS_PORT:-}" ] && echo yes || echo no)" \
       "LABS_QUANT_STORE_ROOT=$([ -n "${LABS_QUANT_STORE_ROOT:-}" ] && echo yes || echo no)" \
       "LABS_QUANT_GREEKS_QUANTUM=$([ -n "${LABS_QUANT_GREEKS_QUANTUM:-}" ] && echo yes || echo no)" \
       "FT_SESSION=$([ -n "${FT_SESSION:-}" ] && echo yes || echo no)"
  echo
  echo "## 1. Full characterization suite (server/.venv, conftest ON)"
  echo '$ cd server && .venv/bin/python -m pytest tests -q'
  PYLOG="$(mktemp)"
  ( cd server && .venv/bin/python -m pytest tests -q >"$PYLOG" 2>&1 ); RC=$?
  tail -25 "$PYLOG"; rm -f "$PYLOG"
  echo "exit: ${RC}"
  echo
  echo "## 2. Real-server curl transcript (http://localhost:\$LABS_PORT)"
  B="http://localhost:${LABS_PORT}"
  echo '$ curl -s -o /dev/null -w "%{http_code}" $B/api/me/quant/days   # no cookie'
  curl -s -o /dev/null -w "%{http_code}\n" "$B/api/me/quant/days"
  if [ -n "${FT_SESSION:-}" ]; then
    C=(-b "ft_session=${FT_SESSION}")
    echo '$ curl -s -b ft_session=<redacted> $B/api/me/quant/days'
    curl -s "${C[@]}" "$B/api/me/quant/days"; echo
    echo '$ curl -s -b ft_session=<redacted> "$B/api/me/quant/spot?day=2026-09-04&book=XSP" | head -c 400'
    curl -s "${C[@]}" "$B/api/me/quant/spot?day=2026-09-04&book=XSP" | head -c 400; echo
    echo '$ curl -s -b ft_session=<redacted> -X POST $B/api/me/quant/simulate  (762P:+1,767P:-2,772P:+1 · target +150% · 2000 paths · seed 7)'
    curl -s "${C[@]}" -H 'content-type: application/json' -X POST "$B/api/me/quant/simulate" \
      -d '{"day":"2026-09-04","book":"XSP","legs":"762P:+1,767P:-2,772P:+1","t_entry":"10:00","t_exit":"15:45","exit_kind":"target","target_pct":150,"paths":2000,"seed":7}' \
      | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps({k:d.get(k) for k in ("bands","modality","no_fill_rate","stability","fidelity","exit","t_exit_resolved","display_legal")},indent=1))'
  else
    echo "(FT_SESSION not set — authenticated transcript skipped; export FT_SESSION=<your ft_session cookie> and rerun)"
  fi
} | tee "$OUT"
echo
echo "written: $OUT"
