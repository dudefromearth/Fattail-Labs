"""Coverage floor per source. Archive is one solid interval [floor … now].

Newest-first backfill extends the floor downward. No out-of-order days.
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any

SOURCES = ("ES", "MES", "SPY")
VP_ROW = {"SPY": 0.10, "ES": 0.25, "MES": 0.25}


def coverage_path(root: Path) -> Path:
    return root / "vp" / "engine" / "coverage.json"


def _empty_src() -> dict[str, Any]:
    return {
        "floor": None,
        "ceiling": None,
        "sessions_ingested": [],
        "sessions_binned": [],
    }


def load_coverage(root: Path) -> dict[str, Any]:
    path = coverage_path(root)
    if not path.is_file():
        return {s: _empty_src() for s in SOURCES}
    data = json.loads(path.read_text(encoding="utf-8"))
    for s in SOURCES:
        data.setdefault(s, _empty_src())
    return data


def save_coverage(root: Path, data: dict[str, Any]) -> Path:
    path = coverage_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


def _dates(rows: list[str]) -> list[date]:
    return sorted(date.fromisoformat(x) for x in rows)


def is_contiguous(days: list[date]) -> bool:
    """Solid interval: every session-calendar day from min to max is present.

    Saturday is not a CME session and may be absent without breaking the interval.
    """
    if not days:
        return True
    have = set(days)
    d = min(days)
    end = max(days)
    while d <= end:
        if d.weekday() != 5 and d not in have:  # 5 = Saturday
            return False
        d += timedelta(days=1)
    return True


def mark_session(root: Path, source: str, session_date: date, *, binned: bool) -> dict[str, Any]:
    source = source.upper()
    if source not in SOURCES:
        raise ValueError(source)
    data = load_coverage(root)
    key = "sessions_binned" if binned else "sessions_ingested"
    iso = session_date.isoformat()
    rows = list(data[source].get(key) or [])
    if iso not in rows:
        rows.append(iso)
    rows = sorted(set(rows))
    days = _dates(rows)
    if not is_contiguous(days):
        raise ValueError(f"{source} {key} would not be contiguous: {rows}")
    data[source][key] = rows
    if days:
        data[source]["floor"] = min(days).isoformat()
        data[source]["ceiling"] = max(days).isoformat()
    save_coverage(root, data)
    return data[source]


def floor_of(root: Path, source: str) -> date | None:
    raw = load_coverage(root).get(source.upper(), {}).get("floor")
    return date.fromisoformat(raw) if raw else None


def ceiling_of(root: Path, source: str) -> date | None:
    raw = load_coverage(root).get(source.upper(), {}).get("ceiling")
    return date.fromisoformat(raw) if raw else None


def next_backfill_session(root: Path, source: str, *, today: date) -> date | None:
    """Newest uncaptured session: yesterday, then strictly descending."""
    ceil = ceiling_of(root, source)
    if ceil is None:
        cand = today - timedelta(days=1)
    else:
        cand = min(ceil, today) - timedelta(days=1)
    # skip Saturday
    while cand.weekday() == 5:
        cand -= timedelta(days=1)
    vendor_floor = {
        "ES": date(2017, 4, 1),
        "MES": date(2019, 5, 1),
        "SPY": date(2004, 1, 2),
    }[source.upper()]
    if cand < vendor_floor:
        return None
    ingested = set(load_coverage(root).get(source.upper(), {}).get("sessions_ingested") or [])
    while cand >= vendor_floor:
        if cand.weekday() != 5 and cand.isoformat() not in ingested:
            return cand
        cand -= timedelta(days=1)
    return None
