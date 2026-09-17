""" /range coverage honesty. Refuse rather than invent a contract field. """

from __future__ import annotations

from datetime import date


def refuse_below_floor(
    *,
    from_d: date,
    to_d: date,
    floor: date | None,
    ceiling: date | None,
) -> dict[str, str] | None:
    """Return a 422 body if the request is not fully inside [floor, ceiling].

    Contract v1.0 has no coverage_floor field. Truncating and labeling
    the partial sum would require improvising one — that is a v1.1
    candidate, not a silent extra key. Refuse instead.
    """
    if from_d > to_d:
        return {"error": "bad_range"}
    if floor is None or ceiling is None:
        return {"error": "range_below_coverage"}
    if from_d < floor or to_d < floor:
        return {"error": "range_below_coverage"}
    if from_d > ceiling or to_d > ceiling:
        return {"error": "range_below_coverage"}
    return None
