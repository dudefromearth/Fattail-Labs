"""Build search query from butterfly config."""

from __future__ import annotations

from typing import Any

from strategy_packs.packs.butterfly.validation import resolve_dte_window


def build_search_query(config: dict[str, Any]) -> dict[str, Any]:
    window = resolve_dte_window(config) or (0, 0)
    direction = str(config.get("direction") or "balanced").lower()
    if direction == "call":
        rights = ["call"]
    elif direction == "put":
        rights = ["put"]
    else:
        rights = ["call", "put"]
    return {
        "underlying": str(config.get("underlying") or "SPX"),
        "dte_min": window[0],
        "dte_max": window[1],
        "rights": rights,
        "butterfly_family": str(config.get("butterfly_family") or "symmetric"),
    }
