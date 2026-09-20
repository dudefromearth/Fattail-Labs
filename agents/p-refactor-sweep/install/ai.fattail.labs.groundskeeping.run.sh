#!/bin/zsh
# WG-1 weekly grounds-keeping. StudioTwo. Saturday 16:05 ET.
# Executes only stamped R0/H0 inventory seeds when armed.
# Do not load this launchd until TOPO-1 AP-1 and the priority board is clear.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
WM="$ROOT/agents/bench/groundskeeping.json"
LOGDIR="$HOME/Library/Logs/fattail-labs"
mkdir -p "$LOGDIR"
if [[ ! -f "$WM" ]]; then
  echo "groundskeeping: missing $WM" >&2
  exit 1
fi
# HOLD is not a miss (not armed). Miss = armed && no lists.
python3 - "$WM" <<'PY'
import json, sys, datetime
from pathlib import Path
p = Path(sys.argv[1])
doc = json.loads(p.read_text())
now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
doc["last_attempt"] = now
if not doc.get("armed") or doc.get("hold_until_board_clear"):
    print(f"WG-1 HOLD at {now}: {doc.get('hold_reason')}")
    p.write_text(json.dumps(doc, indent=2) + "\n")
    sys.exit(0)
print(f"WG-1 FIRE at {now}: run stamped R0 + H0 seeds only; empty lists are a result")
p.write_text(json.dumps(doc, indent=2) + "\n")
PY
# Armed fire: Juliet/Kilo session on seeds R0-kilo.md and H0-kilo.md.
# A later packet may invoke grok here. Until then the fire writes last_attempt
# and a cycle stub so a miss can be detected if lists are absent next week.
CYCLE="$ROOT/agents/p-refactor-sweep/cycles"
mkdir -p "$CYCLE"
if python3 -c "import json; d=json.load(open('$WM')); raise SystemExit(0 if d.get('armed') and not d.get('hold_until_board_clear') else 1)"; then
  STAMP=$(date +%F)
  echo "WG-1 armed $STAMP — inventories due: R0 + H0" > "$CYCLE/${STAMP}.due"
fi
