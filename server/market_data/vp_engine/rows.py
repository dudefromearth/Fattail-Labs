"""§5.1 floor-rule rows on vp_row. Decimal — no float-bin drift."""

from __future__ import annotations

from decimal import Decimal, ROUND_FLOOR


def row_price(price: float | int | str, vp_row: float | str) -> float:
    d = Decimal(str(price))
    r = Decimal(str(vp_row))
    if r <= 0:
        raise ValueError("vp_row must be > 0")
    q = (d / r).to_integral_value(rounding=ROUND_FLOOR)
    return float(q * r)


def row_step(vp_row: float | str) -> Decimal:
    return Decimal(str(vp_row))
