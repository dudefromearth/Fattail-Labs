"""REQ-007 v2 — time-window histogram at vp_row grain.

Coverage floor is queried from the store at serve time per contract.
No capture-start date constant.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from market_data.vp_engine.coverage import VP_ROW, floor_of, load_coverage
from market_data.vp_engine.eligibility import print_eligible, size_int
from market_data.vp_engine.rebuild import load_prints
from market_data.vp_engine.rows import row_price
from market_data.vp_ingest.store import archive_root, vendor_ts_to_seconds


def _day_of(ms: int) -> date:
    return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc).date()


def _print_ms(rec: dict[str, Any]) -> int:
    t = rec.get("t") or 0
    sec = vendor_ts_to_seconds(int(t))
    return int(sec * 1000)


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
    row = float(vp_row or VP_ROW.get(src, 0.25))
    d0 = _day_of(from_t)
    d1 = _day_of(to_t)
    print_acc: dict[float, int] = {}
    aggs_acc: dict[float, int] = {}
    day = d0
    while day <= d1:
        use_prints = floor is not None and day >= floor
        if use_prints:
            for rec in load_prints(root, src, day):
                if not print_eligible(rec):
                    continue
                ms = _print_ms(rec)
                if ms < from_t or ms > to_t:
                    continue
                p = rec.get("p")
                if p is None:
                    continue
                vol = size_int(rec)
                if vol:
                    px = row_price(p, row)
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
        import json

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
