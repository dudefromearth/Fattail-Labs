""" /range coverage honesty. Contract v1.1. """

from __future__ import annotations

from datetime import date
from typing import Any


def range_decision(
    *,
    from_d: date,
    to_d: date,
    floor: date | None,
    ceiling: date | None,
    allow_partial: bool = False,
) -> tuple[str, dict[str, Any] | None]:
    """Return ('ok'|'partial'|'422', extra).

    Default: from < floor → 422 {error, coverage_floor}.
    allow_partial=true → 200 truncated over the covered slice.
    """
    if from_d > to_d:
        return "422", {"error": "bad_range"}
    if floor is None or ceiling is None:
        return "422", {"error": "range_below_coverage"}
    if to_d < floor or from_d > ceiling:
        return "422", {
            "error": "range_below_coverage",
            "coverage_floor": floor.isoformat(),
        }
    if from_d < floor:
        if not allow_partial:
            return "422", {
                "error": "range_below_coverage",
                "coverage_floor": floor.isoformat(),
            }
        served_to = min(to_d, ceiling)
        return "partial", {
            "requested_from": from_d.isoformat(),
            "served_from": floor.isoformat(),
            "served_to": served_to.isoformat(),
            "truncated": True,
        }
    if to_d > ceiling:
        return "422", {
            "error": "range_below_coverage",
            "coverage_floor": floor.isoformat(),
        }
    return "ok", None


def refuse_below_floor(
    *,
    from_d: date,
    to_d: date,
    floor: date | None,
    ceiling: date | None,
) -> dict[str, str] | None:
    kind, extra = range_decision(
        from_d=from_d, to_d=to_d, floor=floor, ceiling=ceiling, allow_partial=False
    )
    if kind == "422":
        return extra  # type: ignore[return-value]
    return None
