"""Primitive Algo day path: underlier price vs time.

Prefers SSR live_capture marks JSONL. Falls back to 1-minute OHLC.
Does not attach chain snaps (vol) — that plane is later (DL-486).
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")


def _ny_day(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000.0, tz=NY).date().isoformat()


def capture_roots() -> list[Path]:
    from market_data.ssr_live_capture import cache_root, data_root

    roots: list[Path] = []
    for base in (cache_root(), data_root()):
        p = base / "ssr" / "live_capture"
        if p.is_dir():
            roots.append(p)
    return roots


def list_capture_days() -> list[str]:
    days: set[str] = set()
    for root in capture_roots():
        try:
            kids = list(root.iterdir())
        except OSError:
            continue
        for child in kids:
            name = child.name
            if name.startswith("day=") and len(name) >= 14:
                days.add(name[4:14])
    return sorted(days)


def _marks_file(day: str, symbol: str) -> Path | None:
    slug = symbol.strip().lower()
    for root in capture_roots():
        path = root / f"day={day}" / "marks" / f"{slug}.jsonl"
        if path.is_file():
            return path
    return None


def samples_from_marks_jsonl(path: Path) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return out
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            doc = json.loads(line)
        except json.JSONDecodeError:
            continue
        mid = doc.get("mid")
        try:
            spot = float(mid)
        except (TypeError, ValueError):
            continue
        if not (spot > 0):
            continue
        raw_t = doc.get("captured_at") or doc.get("as_of") or doc.get("ts")
        t_ms: int | None = None
        if isinstance(raw_t, (int, float)):
            t_ms = int(raw_t if raw_t > 1e12 else raw_t * 1000)
        elif isinstance(raw_t, str):
            try:
                t_ms = int(datetime.fromisoformat(raw_t.replace("Z", "+00:00")).timestamp() * 1000)
            except ValueError:
                t_ms = None
        if t_ms is None:
            continue
        out.append({"t_ms": t_ms, "spot": spot})
    out.sort(key=lambda r: r["t_ms"])
    return out


def samples_from_ohlc_bars(bars: list[dict[str, Any]], day: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for bar in bars:
        t = bar.get("t")
        c = bar.get("c")
        try:
            t_ms = int(t)
            close = float(c)
        except (TypeError, ValueError):
            continue
        if close <= 0:
            continue
        if _ny_day(t_ms) != day:
            continue
        row: dict[str, Any] = {"t_ms": t_ms, "spot": close, "c": close}
        for key, src in (("o", "o"), ("h", "h"), ("l", "l")):
            try:
                val = float(bar.get(src))
            except (TypeError, ValueError):
                continue
            if val > 0:
                row[key] = val
        out.append(row)
    out.sort(key=lambda r: r["t_ms"])
    return out


def load_primitive_path(symbol: str, day: str) -> dict[str, Any]:
    """Price/time samples for one NY calendar day."""
    date.fromisoformat(day)
    product = (symbol or "SPX").strip().upper()
    marks = _marks_file(day, product)
    if marks is not None:
        samples = samples_from_marks_jsonl(marks)
        if samples:
            return {
                "day": day,
                "symbol": product,
                "source": "ssr_marks",
                "vol": False,
                "samples": samples,
                "sample_count": len(samples),
            }
    return {
        "day": day,
        "symbol": product,
        "source": None,
        "vol": False,
        "samples": [],
        "sample_count": 0,
        "hole": "NO MARKS",
    }


def list_days(symbol: str) -> list[dict[str, Any]]:
    product = (symbol or "SPX").strip().upper()
    captured = list_capture_days()
    if captured:
        return [{"day": d, "source": "ssr_marks"} for d in captured[-40:]]
    # No archive mounted — offer recent weekdays; path loader uses 1m OHLC.
    today = datetime.now(NY).date()
    out: list[dict[str, Any]] = []
    d = today
    while len(out) < 10:
        if d.weekday() < 5:
            out.append({"day": d.isoformat(), "source": "ohlc_1m"})
        d = d - timedelta(days=1)
    return list(reversed(out))
