#!/bin/bash
# AT-SOAR-45: prove fire, not schedule. Silence is not a pass.
#
# Evidence log shape for any scheduled script (FIRED ≠ SUCCEEDED):
#   NAME FIRED=yes|no at=...
#   NAME SUCCEEDED=yes|no rc=... reason=...
#   NAME RECOVERY_SUCCEEDED=yes   # only if a recovery run happened
# Keep those as separate facts. A fire that dies in one second is not a pass.
set -u
LOG="/Users/ernie/Fattail-Labs/agents/p-studioone-archive-read/evidence/at45-run.log"
TARGET_EPOCH=$(python3 -c "from datetime import datetime; from zoneinfo import ZoneInfo
print(int(datetime(2026,8,28,9,32,0,tzinfo=ZoneInfo('America/New_York')).timestamp()))")
now_et() { TZ=America/New_York date '+%Y-%m-%dT%H:%M:%S%z'; }
iso() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

mkdir -p "$(dirname "$LOG")"
{
  echo "AT-SOAR-45 START utc=$(iso) et=$(now_et) target=2026-08-28T09:32:00-04:00 pid=$$"
  echo "AT-SOAR-45 WAIT seconds=$((TARGET_EPOCH - $(date +%s)))"
} > "$LOG"

now=$(date +%s)
if [ "$now" -lt "$TARGET_EPOCH" ]; then
  sleep $((TARGET_EPOCH - now))
fi

{
  echo "AT-SOAR-45 FIRE utc=$(iso) et=$(now_et)"
} >> "$LOG"

ssh -o BatchMode=yes -o ConnectTimeout=20 ernie@studioone.local \
  'cd /Users/ernie/Fattail-Labs/server && .venv/bin/python /Users/ernie/Fattail-Labs/scripts/soar-at45.py' \
  >> "$LOG" 2>&1
rc=$?
{
  echo "AT-SOAR-45 END rc=$rc utc=$(iso) et=$(now_et)"
} >> "$LOG"

if [ "$rc" -eq 0 ]; then
  echo "AT-SOAR-45 FIRED rc=0"
else
  echo "AT-SOAR-45 DID_NOT_FIRE rc=$rc"
fi
exit "$rc"
