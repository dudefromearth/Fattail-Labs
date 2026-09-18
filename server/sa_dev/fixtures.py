"""SA v0.3 §12 F1 detection tape. Not live market data."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

# 34 rows, 640.00–643.30 × 0.10
F1_VOLUMES: tuple[int, ...] = (
    18, 22, 20, 19, 21, 20, 70,
    290, 310, 300, 285, 305, 295, 300,
    28, 25, 30,
    240, 260, 250,
    60, 55,
    255, 245, 250,
    22, 19, 20, 21, 18, 20,
    45, 85, 170,
)


def f1_bins() -> list[dict[str, Any]]:
    step = Decimal("0.10")
    start = Decimal("640.00")
    out: list[dict[str, Any]] = []
    for i, vol in enumerate(F1_VOLUMES):
        px = start + step * i
        out.append({"price": float(px), "volume": int(vol)})
    return out
