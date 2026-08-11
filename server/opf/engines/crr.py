"""Cox–Ross–Rubinstein American binomial (OPF22 default for American)."""

from __future__ import annotations

import math
from typing import Literal


def crr_american_price(
    spot: float,
    strike: float,
    tau: float,
    r: float,
    q: float,
    iv: float,
    side: Literal["call", "put"] | str,
    *,
    steps: int = 80,
) -> float:
    """American option via CRR tree; continuous r,q (yield as cost of carry)."""
    S = float(spot)
    K = float(strike)
    T = max(float(tau), 1e-12)
    sigma = max(float(iv), 1e-8)
    n = max(2, int(steps))
    side_n = str(side).lower()
    if side_n in ("c", "call"):
        is_call = True
    elif side_n in ("p", "put"):
        is_call = False
    else:
        raise ValueError(f"side must be call|put, got {side!r}")

    dt = T / n
    u = math.exp(sigma * math.sqrt(dt))
    d = 1.0 / u
    # risk-neutral p with continuous dividend yield
    a = math.exp((r - q) * dt)
    p = (a - d) / (u - d)
    p = min(1.0, max(0.0, p))
    disc = math.exp(-r * dt)

    # terminal payoffs
    values = [0.0] * (n + 1)
    for i in range(n + 1):
        ST = S * (u ** (n - i)) * (d**i)
        if is_call:
            values[i] = max(0.0, ST - K)
        else:
            values[i] = max(0.0, K - ST)

    for step in range(n - 1, -1, -1):
        for i in range(step + 1):
            cont = disc * (p * values[i] + (1.0 - p) * values[i + 1])
            ST = S * (u ** (step - i)) * (d**i)
            if is_call:
                ex = max(0.0, ST - K)
            else:
                ex = max(0.0, K - ST)
            values[i] = max(cont, ex)
    return float(values[0])
