"""Newest-first historical ingest. Contiguous descending from yesterday.

ES/MES: Massive futures flat files / REST — after-close only (CP-1).
SPY: equities tier, same order. No out-of-order tranches.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

from market_data.vp_engine.coverage import SOURCES, next_backfill_session
from market_data.vp_ingest.store import archive_root, in_rth


def plan(root: Path | None = None, *, today: date | None = None) -> dict[str, str | None]:
    ar = root or archive_root()
    today = today or date.today()
    return {s: (d.isoformat() if d else None) for s, d in (
        (s, next_backfill_session(ar, s, today=today)) for s in SOURCES
    )}


def main() -> int:
    today = date.today()
    planned = plan(today=today)
    print(f"backfill newest-first today={today.isoformat()} plan={planned}")
    if in_rth():
        print(
            "HOLD CP-1: Massive historical REST/flat-files share the account "
            "with StudioOne chain_feed. Tranche 1 starts after 16:00 ET; "
            "order remains strictly descending from yesterday."
        )
        return 0
    print("after-close: fetch implementation lands with tranche 1 tonight")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
