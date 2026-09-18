"""Render-only row override (SA-L8). Never changes detection substrate."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Any

from market_data.vp_engine.rows import row_price, row_step


def display_rebin(
    bins: list[dict[str, Any]],
    *,
    native_row: float,
    requested_row: float,
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """Coarser-grid display rebin. Returns (422-body, bins).

    Detection stays on native_row. Requested row must be a positive integer
    multiple of the substrate. Finer than substrate is refused (cannot invent
    resolution). Equal row is a no-op copy.
    """
    try:
        native = Decimal(str(native_row))
        req = Decimal(str(requested_row))
    except Exception:
        return {"error": "bad_range", "detail": "row must be a number"}, []
    if req <= 0 or native <= 0:
        return {"error": "bad_range", "detail": "row must be > 0"}, []
    if req < native:
        return {
            "error": "row_below_substrate",
            "substrate_vp_row": float(native),
            "requested_row": float(req),
        }, []
    ratio = req / native
    if ratio != ratio.to_integral_value():
        return {
            "error": "row_not_multiple_of_substrate",
            "substrate_vp_row": float(native),
            "requested_row": float(req),
        }, []
    if ratio == 1:
        return None, [{"price": b["price"], "volume": int(b["volume"])} for b in bins]
    acc: dict[float, int] = defaultdict(int)
    for b in bins:
        acc[row_price(b["price"], float(req))] += int(b["volume"])
    if not acc:
        return None, []
    step = row_step(float(req))
    lo = min(acc)
    hi = max(acc)
    out: list[dict[str, Any]] = []
    x = Decimal(str(lo))
    end = Decimal(str(hi))
    while x <= end:
        px = float(x)
        out.append({"price": px, "volume": int(acc.get(px, 0))})
        x += step
    return None, out
