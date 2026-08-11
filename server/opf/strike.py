"""Canonical strike strings (OPF32)."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def canonical_strike(strike: float | int | str | Decimal) -> str:
    """Normalize strike for map keys / content hash.

    Max 4 decimal places, strip trailing zeros and trailing dot.
    AT-L1-STRIKE: 302.50 and 302.5 → \"302.5\".
    """
    try:
        d = Decimal(str(strike))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError(f"invalid strike: {strike!r}") from exc
    # quantize to 4 dp then normalize
    q = d.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    s = format(q.normalize(), "f")
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    if s in ("", "-0"):
        s = "0"
    return s


def contract_map_key(side: str, strike: float | int | str | Decimal) -> str:
    s = (side or "").strip().lower()
    if s in ("c", "call"):
        s = "call"
    elif s in ("p", "put"):
        s = "put"
    else:
        raise ValueError(f"side must be call|put, got {side!r}")
    return f"{s}:{canonical_strike(strike)}"
