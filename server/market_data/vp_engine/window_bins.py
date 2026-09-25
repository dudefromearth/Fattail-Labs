"""REQ-007 v2 — time-window histogram at vp_row grain.

Coverage floor is queried from the store at serve time per contract.
No capture-start date constant.

Reads ONLY the precomputed histograms the Engine pipeline (bin_loop.py /
rebuild_session / build_histogram) already produces — session/day=*/
histogram.json for completed days, developing/histogram.json for the
latest (still-growing) day. No raw print parsing here, no separate
precompute process. A window request sums whichever day-histograms
overlap [from_t, to_t]; there is no intraday time slicing — a day either
contributes its full histogram or it doesn't.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from market_data.vp_engine.bin_landed import latest_ingested_day
from market_data.vp_engine.coverage import floor_of, load_coverage
from market_data.vp_engine.rebuild import histogram_path
from market_data.vp_engine.rows import row_price
from market_data.vp_ingest.store import archive_root


def _day_of(ms: int) -> date:
    return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc).date()


def _existing_histogram_bins(
    root: Path, source: str, day: date, *, is_latest: bool
) -> tuple[list[dict[str, Any]], float] | None:
    """Read the day's precomputed histogram, already on disk. None if it
    hasn't been built yet — the caller contributes nothing for that day
    rather than fabricating it from raw prints."""
    kind = "developing" if is_latest else "session"
    path = histogram_path(root, source, day, kind)
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    bins = doc.get("bins") or []
    if not isinstance(bins, list):
        return None
    native_row = float(doc.get("vp_row") or 0.25)
    return bins, native_row


def assemble_window(
    source: str,
    *,
    from_t: int,
    to_t: int,
    vp_row: float | None = None,
) -> dict[str, Any]:
    src = source.upper()
    if to_t < from_t:
        from_t, to_t = to_t, from_t
    root = archive_root()
    floor = floor_of(root, src)
    from symbology.spec import assert_native_grain

    row = assert_native_grain(src, vp_row)
    d0 = _day_of(from_t)
    d1 = _day_of(to_t)
    latest = latest_ingested_day(root, src)
    print_acc: dict[float, int] = {}
    aggs_acc: dict[float, int] = {}
    day = d0
    while day <= d1:
        use_prints = floor is not None and day >= floor
        if use_prints:
            hist = _existing_histogram_bins(root, src, day, is_latest=(day == latest))
            if hist is not None:
                bins, _native_row = hist
                for b in bins:
                    vol = int(b.get("volume") or 0)
                    if not vol:
                        continue
                    px = row_price(b.get("price"), row)
                    print_acc[px] = print_acc.get(px, 0) + vol
        else:
            for px, vol in _aggs_rows(src, day, from_t, to_t, row):
                aggs_acc[px] = aggs_acc.get(px, 0) + vol
        day += timedelta(days=1)

    if print_acc and aggs_acc:
        source_tag = "mixed"
    elif print_acc:
        source_tag = "prints"
    elif aggs_acc:
        source_tag = "aggs-derived"
    else:
        source_tag = "prints" if floor and d1 >= floor else "aggs-derived"

    acc: dict[float, int] = {}
    for px, vol in print_acc.items():
        acc[px] = acc.get(px, 0) + vol
    for px, vol in aggs_acc.items():
        acc[px] = acc.get(px, 0) + vol
    bins = [{"price": p, "volume": acc[p]} for p in sorted(acc)]
    cov = load_coverage(root).get(src) or {}
    return {
        "kind": "window",
        "source": src,
        "from_t": from_t,
        "to_t": to_t,
        "vp_row": row,
        "bins": bins,
        "bin_count": len(bins),
        "bin_source": source_tag,
        "coverage_floor": cov.get("floor"),
        "coverage_ceiling": cov.get("ceiling"),
        "status": "COMPLETE" if bins else "EMPTY",
    }


def _aggs_rows(
    source: str,
    day: date,
    from_t: int,
    to_t: int,
    vp_row: float,
) -> list[tuple[float, int]]:
    """Derive bins from cached Massive 5m aggs. Never a client path."""
    from sa_dev.futures_history import vendor_ticker, _cache_path, _default_bound

    try:
        bound = _default_bound(source)
        vendor = vendor_ticker(bound)
    except Exception:
        return []
    cached = None
    try:
        path = _cache_path(vendor, "5m")
        if path.is_file():
            cached = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []
    bars = (cached or {}).get("bars") or []
    out: list[tuple[float, int]] = []
    for b in bars:
        t = int(b.get("t") or 0)
        if t < from_t or t > to_t:
            continue
        px = b.get("c") or b.get("typical")
        if px is None:
            continue
        vol = int(b.get("v") or 0)
        if vol:
            out.append((row_price(px, vp_row), vol))
    return out
