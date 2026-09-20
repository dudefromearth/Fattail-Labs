"""Q4 sale-condition fixture. Capture stores every print; this map labels."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "fixtures"
    / "vp_q4_stock_trade_conditions.json"
)


@lru_cache(maxsize=1)
def load_q4() -> dict[str, Any]:
    return json.loads(_FIXTURE.read_text(encoding="utf-8"))


def by_id() -> dict[int, dict[str, Any]]:
    return {int(c["id"]): c for c in load_q4()["codes"] if "id" in c}


def annotate(condition_ids: list[int]) -> dict[str, Any]:
    """Labels for a print. Does not drop the print."""
    table = by_id()
    auction = False
    oddlot = False
    unknown: list[int] = []
    names: list[str] = []
    for cid in condition_ids:
        row = table.get(int(cid))
        if row is None:
            unknown.append(int(cid))
            continue
        names.append(str(row.get("name") or cid))
        if row.get("auction") is True:
            auction = True
        if row.get("oddlot") is True:
            oddlot = True
    return {
        "auction": auction,
        "oddlot": oddlot,
        "unknown_condition_ids": unknown,
        "names": names,
    }
