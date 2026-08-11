"""Infer / refine Trade Log strategy codes from option legs.

Broken wing fly: same 3-strike +1/−2/+1 (or short −1/+2/−1) pattern as a
classic butterfly, but wing widths (lower gap vs upper gap) are unequal.
"""

from __future__ import annotations

from collections import defaultdict
from math import gcd
from typing import Any

# Codes we may reclassify when legs show classic fly geometry.
_FLY_FAMILY = frozenset({"BUTTERFLY", "BROKEN_WING_FLY", "CUSTOM", "FLY", "BF"})


def _signed_qty(leg: dict[str, Any]) -> int:
    q = abs(int(leg.get("quantity") or 0))
    side = str(leg.get("side") or "BUY").upper()
    return q if side == "BUY" else -q


def classify_butterfly_geometry(legs: list[dict[str, Any]]) -> str | None:
    """Return BUTTERFLY | BROKEN_WING_FLY if legs match a 3-strike fly pattern.

    Looks for same underlier, expiry, and right with net signed quantities
    proportional to +1/−2/+1 or −1/+2/−1 after GCD normalization.
    """
    if not legs:
        return None
    opts = [
        lg
        for lg in legs
        if lg.get("strike") is not None
        and str(lg.get("right") or "").upper() in ("PUT", "CALL")
    ]
    if len(opts) < 3:
        return None

    groups: dict[tuple, list[dict]] = defaultdict(list)
    for lg in opts:
        under = (lg.get("underlier") or lg.get("symbol") or "").strip().upper()
        exp = str(lg.get("expiry") or "")[:10]
        right = str(lg.get("right") or "").upper()
        groups[(under, exp, right)].append(lg)

    for _key, gl in groups.items():
        by_strike: dict[float, int] = defaultdict(int)
        for lg in gl:
            try:
                k = float(lg["strike"])
            except (TypeError, ValueError):
                continue
            by_strike[k] += _signed_qty(lg)
        strikes = sorted(by_strike.keys())
        if len(strikes) != 3:
            continue
        qs = [by_strike[k] for k in strikes]
        g = 0
        for q in qs:
            g = gcd(g, abs(q))
        if g == 0:
            continue
        nq = [q // g for q in qs]
        if nq not in ([1, -2, 1], [-1, 2, -1]):
            continue
        w_lo = strikes[1] - strikes[0]
        w_hi = strikes[2] - strikes[1]
        if w_lo <= 0 or w_hi <= 0:
            continue
        # Equal wing widths → classic butterfly; unequal → broken wing.
        if abs(w_lo - w_hi) < 1e-6:
            return "BUTTERFLY"
        return "BROKEN_WING_FLY"
    return None


def refine_strategy_from_legs(
    strategy: str,
    legs: list[dict[str, Any]] | None,
) -> str:
    """Refine strategy code using leg geometry (create + import).

    - Fly geometry with equal wings → BUTTERFLY
    - Fly geometry with unequal wings → BROKEN_WING_FLY
    - Non-fly strategies left unchanged unless labeled as a fly alias
    """
    strat = (strategy or "CUSTOM").upper().strip()
    if strat in ("FLY", "BF", "BROKEN_WING", "BWF", "BROKEN_WING_BUTTERFLY"):
        # Normalize aliases before geometry (catalog may not list them)
        if strat in ("FLY", "BF"):
            strat = "BUTTERFLY"
        else:
            strat = "BROKEN_WING_FLY"

    inferred = classify_butterfly_geometry(legs or [])
    if inferred is None:
        return strat

    # Always correct fly geometry: don't leave asymmetric flies as BUTTERFLY.
    if strat in _FLY_FAMILY or strat in ("BUTTERFLY", "BROKEN_WING_FLY"):
        return inferred
    # If broker labeled something else but geometry is clearly a fly, prefer geometry
    # only when they said butterfly-ish or custom.
    if strat in ("CUSTOM", ""):
        return inferred
    return strat
