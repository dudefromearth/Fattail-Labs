"""Campaign Journey / panel alignment pure functions.

Hotel doctrine (Spec §6a.2): axis extension = band-alignment (boundaries) or
progress-toward-mark (goals) — never raw magnitude. Big shape = faithful.

Bench: J0-0 · Kilo #21
"""

from __future__ import annotations

from typing import Literal

Role = Literal["boundary", "goal"]


def boundary_alignment(
    value: float,
    range_low: float | None,
    range_high: float | None,
) -> float:
    """
    Return extension in [0, 1] for a boundary corridor.

    - Fully in-band (or on open side of a one-sided band) → 1.0
    - Outside either end → decays toward 0 (both sides). Out-of-band-high
      reduces extension (celebrate-the-drift regression).
    - Empty band (both ends null) → 1.0 (no constraint declared)
    """
    lo, hi = range_low, range_high
    if lo is None and hi is None:
        return 1.0
    if lo is not None and hi is not None and lo > hi:
        lo, hi = hi, lo

    # In band
    if lo is not None and hi is not None:
        if lo <= value <= hi:
            return 1.0
        if value < lo:
            span = abs(hi - lo) or abs(lo) or 1.0
            dist = lo - value
            return max(0.0, 1.0 - dist / span)
        # value > hi
        span = abs(hi - lo) or abs(hi) or 1.0
        dist = value - hi
        return max(0.0, 1.0 - dist / span)

    if lo is not None and hi is None:
        # Floor only — at/above floor = full; below decays
        if value >= lo:
            return 1.0
        span = abs(lo) or 1.0
        return max(0.0, 1.0 - (lo - value) / span)

    # hi only — at/below ceiling = full; above decays
    assert hi is not None
    if value <= hi:
        return 1.0
    span = abs(hi) or 1.0
    return max(0.0, 1.0 - (value - hi) / span)


def goal_progress(
    value: float,
    range_low: float | None,
    range_high: float | None,
) -> float:
    """
    Progress toward a goal band in [0, 1].

    Target center = midpoint of closed band, or the single closed end.
    Below the "near" side of the band: ramp 0→1 as value approaches.
    Inside band: 1.0 (reached). Outside the far side: still 1.0 (reached/overshot
    still counts as reached for progress — never variance).
    """
    lo, hi = range_low, range_high
    if lo is None and hi is None:
        return 1.0
    if lo is not None and hi is not None and lo > hi:
        lo, hi = hi, lo

    if lo is not None and hi is not None:
        mid = (lo + hi) / 2.0
        # Approach from below mid
        if value < lo:
            # distance from 0-ish baseline: use band width as approach scale
            span = abs(hi - lo) or abs(lo) or 1.0
            # start ramping from one band-width below lo
            start = lo - span
            if value <= start:
                return 0.0
            return max(0.0, min(1.0, (value - start) / span))
        return 1.0  # at/above floor of goal band = reached/tracking in

    if lo is not None and hi is None:
        # Goal floor — progress as value approaches lo from below
        if value >= lo:
            return 1.0
        span = abs(lo) or 1.0
        start = lo - span
        if value <= start:
            return 0.0
        return max(0.0, min(1.0, (value - start) / span))

    assert hi is not None
    # Goal ceiling as mark (unusual) — treat as approach to hi
    if value >= hi:
        return 1.0
    span = abs(hi) or 1.0
    start = hi - span
    if value <= start:
        return 0.0
    return max(0.0, min(1.0, (value - start) / span))


def axis_extension(
    role: Role | str,
    value: float,
    range_low: float | None,
    range_high: float | None,
) -> float:
    """Role-aware extension scalar for radar / panel."""
    r = (role or "boundary").strip().lower()
    if r == "goal":
        return goal_progress(value, range_low, range_high)
    return boundary_alignment(value, range_low, range_high)
