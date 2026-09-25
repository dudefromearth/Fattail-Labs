"""Read-only opening-gap history stored on StudioOne.

Files are one JSON document per underlying, written by the gap study builder.
The dashboard only reads them. It does not call Massive and it does not
rebuild the files.

  {LABS_MARKET_DATA_ROOT}/gap-history/SPY.json
  {LABS_MARKET_DATA_ROOT}/gap-history/I_SPX.json
"""
from __future__ import annotations

import json
import os
from pathlib import Path

INDEX = {"SPX", "XSP", "VIX", "VIX1D"}
# One Session reads stored bars, not a chain snapshot, so futures stay on the menu.
_BOOK = ("day", "direction", "zone", "zoneName", "size", "gapPct", "gapAtr", "gapSigma",
         "result", "fillMin", "extMin", "vwap5", "maeSigma")


def history_root() -> Path:
    raw = (os.environ.get("LABS_GAP_HISTORY_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser()
    from market_data.ssr_live_capture import data_root

    return data_root() / "gap-history"


def _file(symbol: str) -> Path:
    sym = (symbol or "").upper()
    name = f"I_{sym}.json" if sym in INDEX else f"{sym}.json"
    return history_root() / name


def symbols() -> list[str]:
    root = history_root()
    if not root.is_dir():
        return []
    out = []
    for path in sorted(root.glob("*.json")):
        stem = path.stem
        name = stem[2:] if stem.startswith("I_") else stem
        out.append(name)
    return out


def book(symbol: str) -> dict | None:
    """Every stored session, with the size measures and the VWAP path. No chain fields."""
    doc = load(symbol)
    if not doc:
        return None
    rows = [{key: row.get(key) for key in _BOOK} for row in (doc.get("rows") or [])]
    return {
        "symbol": (symbol or "").upper(),
        "ticker": doc.get("ticker"),
        "from": doc.get("from"),
        "to": doc.get("to"),
        "count": len(rows),
        "chains": False,
        "rows": rows,
    }


def load(symbol: str) -> dict | None:
    path = _file(symbol)
    if not path.is_file():
        return None
    return json.loads(path.read_text())


def query(symbol: str, direction: str | None, zone: str | None, size: str | None,
          day: str | None) -> dict | None:
    doc = load(symbol)
    if not doc:
        return None
    stored = None
    matched = []
    for row in doc.get("rows") or []:
        if day and row.get("day") == day:
            stored = row
        if day and row.get("day") == day:
            continue
        if direction and row.get("direction") != direction:
            continue
        if zone and row.get("zone") != zone:
            continue
        if size and row.get("size") != size:
            continue
        matched.append(row)
    if day and stored and not any((direction, zone, size)):
        direction = stored.get("direction")
        zone = stored.get("zone")
        size = stored.get("size")
        matched = [r for r in (doc.get("rows") or [])
                   if r.get("day") != day
                   and (not direction or r.get("direction") == direction)
                   and (not zone or r.get("zone") == zone)
                   and (not size or r.get("size") == size)]
    counts = {"n": 0, "open": 0, "filled": 0, "extended": 0, "noGap": 0}
    slim = []
    for row in matched:
        counts["n"] += 1
        key = {"open": "open", "filled": "filled", "extended": "extended"}.get(row.get("result"), "noGap")
        counts[key] += 1
        slim.append({
            "day": row.get("day"),
            "result": row.get("result"),
            "fillMin": row.get("fillMin"),
            "extMin": row.get("extMin"),
        })
    return {
        "symbol": (symbol or "").upper(),
        "ticker": doc.get("ticker"),
        "from": doc.get("from"),
        "to": doc.get("to"),
        "count": doc.get("count"),
        "study": stored,
        "history": {
            "match": {"direction": direction, "zone": zone, "size": size},
            "from": doc.get("from"),
            "to": doc.get("to"),
            "recent": slim[-8:],
            "members": slim,
            **counts,
        },
    }
