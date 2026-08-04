"""Black-Scholes pricing primitives for risk graph computation.

Vendored into FatTail Labs from MarketSwarm-Canonical
`src/engines/risk_graph/pricing.py` (stdlib-only, pure, deterministic).
Labs does not import MSC at runtime — this is an installed copy so both
products can share one math lineage for Risk Graph.

Math is identical to MSC convexity calculator BS primitives.
"""

import math


def norm_cdf(x: float) -> float:
    """Standard normal CDF via error function."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def norm_pdf(x: float) -> float:
    """Standard normal PDF."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


def bs_d1(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Black-Scholes d1."""
    return (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * math.sqrt(T))


def bs_d2(d1: float, sigma: float, T: float) -> float:
    """Black-Scholes d2."""
    return d1 - sigma * math.sqrt(T)


def bs_price(
    S: float, K: float, T: float, r: float, sigma: float, is_call: bool,
) -> float:
    """Black-Scholes option price.

    Edge cases: when S <= 0 or K <= 0 or T <= 0 or sigma <= 0,
    returns intrinsic value (floored at zero).
    """
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return max(0.0, (S - K) if is_call else (K - S))
    d1 = bs_d1(S, K, T, r, sigma)
    d2 = bs_d2(d1, sigma, T)
    if is_call:
        return S * norm_cdf(d1) - K * math.exp(-r * T) * norm_cdf(d2)
    else:
        return K * math.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)


def bs_delta(
    S: float, K: float, T: float, r: float, sigma: float, is_call: bool,
) -> float:
    """Black-Scholes delta."""
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        if is_call:
            return 1.0 if S > K else 0.0
        else:
            return -1.0 if S < K else 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    if is_call:
        return norm_cdf(d1)
    else:
        return norm_cdf(d1) - 1.0


def bs_gamma(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Black-Scholes gamma (same for call and put)."""
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    return norm_pdf(d1) / (S * sigma * math.sqrt(T))


def bs_vega(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Black-Scholes vega (same for call and put)."""
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    return S * norm_pdf(d1) * math.sqrt(T)


def bs_theta(
    S: float, K: float, T: float, r: float, sigma: float, is_call: bool,
) -> float:
    """Black-Scholes theta (per year)."""
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    d2 = bs_d2(d1, sigma, T)
    common = -(S * norm_pdf(d1) * sigma) / (2.0 * math.sqrt(T))
    if is_call:
        return common - r * K * math.exp(-r * T) * norm_cdf(d2)
    else:
        return common + r * K * math.exp(-r * T) * norm_cdf(-d2)
