"""Engine eligibility: Q5 EXCLUDE odd lots; Q4 ambiguous EXCLUDED-and-flagged.

F1: average-price prints (condition 2) are not regular — excluded.
Capture still stores everything.
"""

from __future__ import annotations

from typing import Any

from market_data.vp_ingest.conditions import by_id

# F1 / §4 regular prints — Average Price Trade is stored, not histogrammed.
_AVERAGE_PRICE = 2


def print_eligible(rec: dict[str, Any]) -> bool:
    if rec.get("oddlot") is True:
        return False
    cond = rec.get("c") or []
    ids = [int(x) for x in cond]
    if _AVERAGE_PRICE in ids:
        return False
    table = by_id()
    for cid in ids:
        row = table.get(cid)
        if row is None:
            return False
        if row.get("status") == "AMBIGUOUS":
            return False
        ev = row.get("engine_volume")
        if ev is not True:
            return False
    return True


def size_int(rec: dict[str, Any]) -> int:
    s = rec.get("s")
    if s is None:
        return 0
    return int(s)
