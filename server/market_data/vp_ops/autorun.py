"""Evening autorun. launchd fires 16:05 ET weekdays. Queue owns the work.

Does not move packet clock gates or CP-1. Empty queue = one-line no-work.
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
QUEUE = (
    Path(__file__).resolve().parents[3]
    / "agents"
    / "p-volume-profile-service"
    / "evening-queue.json"
)
REPORTS = (
    Path(__file__).resolve().parents[3]
    / "agents"
    / "p-volume-profile-service"
    / "gate-reports"
)


def is_trading_day(now: datetime) -> bool:
    """Weekday session. Unscheduled closures: none shipped (GSC L4)."""
    return now.weekday() < 5


def main() -> int:
    now = datetime.now(tz=ET)
    day = now.date().isoformat()
    if not is_trading_day(now):
        print(f"autorun {day}: no work (non-trading day)", flush=True)
        return 0
    if not QUEUE.is_file():
        print(f"autorun {day}: no work (empty queue — no evening-queue.json)", flush=True)
        return 0
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    items = list(queue.get("items") or [])
    if not items:
        print(f"autorun {day}: no work (empty items)", flush=True)
        return 0
    print(f"autorun {day}: {len(items)} items, order={[i.get('id') for i in items]}", flush=True)
    lines = [f"# Autorun {day}", "", f"Fired {now.isoformat()}", ""]
    failed: set[str] = set()
    for item in items:
        iid = str(item.get("id") or "")
        cmd = item.get("cmd")
        deps = [str(d) for d in (item.get("depends_on") or [])]
        blocked = [d for d in deps if d in failed]
        if blocked:
            print(f"autorun skip {iid}: depends_on failed {blocked}", flush=True)
            lines.append(f"- {iid}: SKIP depends_on {blocked}")
            continue
        print(f"autorun start {iid}", flush=True)
        if not cmd:
            lines.append(f"- {iid}: NO CMD")
            failed.add(iid)
            continue
        proc = subprocess.run(cmd, shell=True, cwd=str(QUEUE.parents[2]))
        lines.append(f"- {iid}: exit {proc.returncode}")
        if proc.returncode != 0:
            print(f"autorun {iid} FAILED {proc.returncode} — continue independents", flush=True)
            failed.add(iid)
            continue
        print(f"autorun {iid} OK", flush=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    out = REPORTS / f"autorun-{day}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"autorun wrote {out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
