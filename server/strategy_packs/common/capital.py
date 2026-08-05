"""Capital-at-risk resolution."""

from __future__ import annotations

from typing import Any


def resolve_max_capital_dollars(
    config: dict[str, Any],
    *,
    account_capital: float = 100_000.0,
) -> float:
    """Resolve max capital at risk to dollars."""
    raw = float(config.get("max_capital_at_risk") or 0)
    unit = str(config.get("max_capital_unit") or "dollars").lower()
    if unit == "percent_of_capital":
        return max(0.0, account_capital * (raw / 100.0))
    return max(0.0, raw)
