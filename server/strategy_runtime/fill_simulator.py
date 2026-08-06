"""Fill simulation after sim adapter accept — management layer, not adapter.

Fill model: mark_mid_v1
- Open fills at intent entry_price (debit/credit package price).
- Marks for manage use pnl_frac walk or explicit override.
- Labeled: not live broker fills; Curate only.
"""

from __future__ import annotations

from typing import Any

from strategy_runtime.marks import package_mark_from_pnl_frac
from strategy_runtime.sim_adapter import OrderIntent

FILL_MODEL = "mark_mid_v1"


def fill_open(intent: OrderIntent) -> dict[str, Any]:
    """Immediate full fill at entry_price after accept."""
    return {
        "fill_model": FILL_MODEL,
        "fill_price": float(intent.entry_price),
        "qty": int(intent.qty),
        "symbol": intent.symbol,
        "label": "Curate sim fill at package entry (mark_mid_v1)",
    }


def fill_close(
    *,
    entry_price: float,
    mark_price: float,
    qty: int,
) -> dict[str, Any]:
    return {
        "fill_model": FILL_MODEL,
        "fill_price": float(mark_price),
        "qty": int(qty),
        "entry_price": float(entry_price),
        "label": "Curate sim close at current package mark",
    }


def advance_package_mark(
    *,
    entry_price: float,
    max_profit_usd: float,
    max_loss_usd: float,
    current_unrealized: float,
    step_frac: float,
) -> tuple[float, float]:
    """Walk unrealized toward max profit (positive step) or loss (negative).

    step_frac is added to current pnl fraction (approx).
    """
    # Recover current frac from unrealized
    if current_unrealized >= 0 and max_profit_usd > 0:
        cur_f = current_unrealized / max_profit_usd
    elif current_unrealized < 0 and max_loss_usd > 0:
        cur_f = current_unrealized / max_loss_usd  # negative
    else:
        cur_f = 0.0
    new_f = max(-1.0, min(1.0, cur_f + float(step_frac)))
    return package_mark_from_pnl_frac(
        entry_price=entry_price,
        max_profit_usd=max_profit_usd,
        max_loss_usd=max_loss_usd,
        pnl_frac=new_f,
    )
