"""Append-only daily gzip jsonl under LABS_MARKET_DATA_ROOT/vp/ingest/.

Not the 2026-08-18 parquet campaign. Same volume root as SSR/chain archive.
"""

from __future__ import annotations

import gzip
import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
GAP_MIN_SECONDS = 300


def vendor_ts_to_seconds(t: int | float) -> float:
    """Convert a vendor timestamp to unix seconds.

    Live Massive futures `t` has arrived as milliseconds (~1.79e12 in 2026)
    while wall clocks use `time.time_ns()` (~1.79e18). Comparing 300 against
    a mixed-unit difference opens a print_absence on every print.
    Each value is classified independently: ns / µs / ms / s.
    """
    n = int(t)
    if n >= 10**16:
        return n / 1_000_000_000
    if n >= 10**13:
        return n / 1_000_000
    if n >= 10**10:
        return n / 1_000
    return float(n)


def archive_root(override: str | Path | None = None) -> Path:
    raw = override or os.environ.get("LABS_MARKET_DATA_ROOT") or ""
    if not str(raw).strip():
        raise RuntimeError("LABS_MARKET_DATA_ROOT is required for VP ingest")
    return Path(raw)


def _day_et(ts_ms: int | None = None) -> date:
    if ts_ms is None:
        return datetime.now(ET).date()
    return datetime.fromtimestamp(ts_ms / 1000.0, tz=ET).date()


def prints_path(root: Path, symbol: str, day: date) -> Path:
    return (
        root
        / "vp"
        / "ingest"
        / symbol.upper()
        / "trades"
        / f"day={day.isoformat()}"
        / "prints.jsonl.gz"
    )


def gaps_path(root: Path, symbol: str, day: date) -> Path:
    return (
        root
        / "vp"
        / "ingest"
        / symbol.upper()
        / "gaps"
        / f"day={day.isoformat()}"
        / "gaps.jsonl"
    )


def _session_day(rec: dict[str, Any]) -> date:
    """Vendor session_end_date if present; else stocks fallback from ts (ET)."""
    sed = rec.get("session_end_date")
    if sed:
        return date.fromisoformat(str(sed)[:10])
    ts = rec.get("t")
    return _day_et(int(ts) if ts is not None else None)


def append_print(root: Path, rec: dict[str, Any]) -> Path:
    day = _session_day(rec)
    path = prints_path(root, str(rec.get("sym") or rec.get("product") or "SPY"), day)
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(rec, separators=(",", ":"), ensure_ascii=True) + "\n"
    with gzip.open(path, "ab") as fh:
        fh.write(line.encode("utf-8"))
    return path


def append_gap(root: Path, symbol: str, rec: dict[str, Any]) -> Path:
    ts = rec.get("t_ms") or rec.get("opened_ms")
    day = _day_et(int(ts) if ts is not None else None)
    path = gaps_path(root, symbol, day)
    path.parent.mkdir(parents=True, exist_ok=True)
    rec = {**rec, "symbol": symbol.upper()}
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
    return path


def in_rth(now: datetime | None = None) -> bool:
    dt = now or datetime.now(ET)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ET)
    dt = dt.astimezone(ET)
    if dt.weekday() >= 5:
        return False
    minutes = dt.hour * 60 + dt.minute
    return (9 * 60 + 30) <= minutes < (16 * 60)
