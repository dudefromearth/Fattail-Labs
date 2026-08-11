"""Black–Scholes–Merton European (continuous r, q)."""

from __future__ import annotations

import math
from typing import Literal


def _n_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def bsm_european_price(
    spot: float,
    strike: float,
    tau: float,
    r: float,
    q: float,
    iv: float,
    side: Literal["call", "put"] | str,
) -> float:
    """Undiscounted option price per share (standard BSM with continuous dividend yield)."""
    S = float(spot)
    K = float(strike)
    T = max(float(tau), 1e-12)
    sigma = max(float(iv), 1e-8)
    r = float(r)
    q = float(q)
    side_n = str(side).lower()
    if side_n in ("c", "call"):
        side_n = "call"
    elif side_n in ("p", "put"):
        side_n = "put"
    else:
        raise ValueError(f"side must be call|put, got {side!r}")

    if T <= 0 or sigma <= 0:
        # intrinsic
        if side_n == "call":
            return max(0.0, S * math.exp(-q * max(T, 0)) - K * math.exp(-r * max(T, 0)))
        return max(0.0, K * math.exp(-r * max(T, 0)) - S * math.exp(-q * max(T, 0)))

    sqrt_t = math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrt_t)
    d2 = d1 - sigma * sqrt_t
    if side_n == "call":
        return S * math.exp(-q * T) * _n_cdf(d1) - K * math.exp(-r * T) * _n_cdf(d2)
    return K * math.exp(-r * T) * _n_cdf(-d2) - S * math.exp(-q * T) * _n_cdf(-d1)
