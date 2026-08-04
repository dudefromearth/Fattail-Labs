"""Curve generation for Labs Risk Graph (2D series).

Series (MSC rendering inventory):
  S1 At Expiry     — intrinsic mark − cost_basis
  S2 Real-Time     — BS mark − cost_basis (Theo: single σ; Mkt: per-leg IV)

Same cost_basis for both series → wings asymptote to −debit / max risk.
No fake mid-anchor shift (MSC P&L authority).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from engine.risk_engine.legs import Package
from engine.risk_engine.payoff import compute_payoff, package_cost_basis

VolMode = Literal["theo", "mkt"]


@dataclass(frozen=True)
class CurveSeries:
    label: str
    prices: tuple[float, ...]
    pnl: tuple[float, ...]
    time_years: float
    volatility: float
    vol_mode: str


@dataclass(frozen=True)
class RiskSurface:
    """All series for one package chart."""

    prices: tuple[float, ...]
    expiry: CurveSeries
    realtime: CurveSeries
    spot: float
    cost_basis: float
    max_profit: float
    max_loss: float  # positive $ magnitude of max risk
    breakevens: tuple[float, ...]
    package_label: str
    single_iv: float


def compute_price_range(
    spot: float,
    volatility: float,
    time_years: float,
    strikes: tuple[float, ...],
    *,
    steps: int = 161,
    sigma_width: float = 2.5,
) -> tuple[float, ...]:
    """MSC-style range: wider of vol envelope and strike envelope."""
    if steps < 3:
        steps = 3
    if steps % 2 == 0:
        steps += 1
    T_eff = max(time_years, 1.0 / 365.0)
    vol_range = sigma_width * max(volatility, 0.05) * math.sqrt(T_eff) * spot
    vol_lo, vol_hi = spot - vol_range, spot + vol_range
    if strikes:
        smin, smax = min(strikes), max(strikes)
        buf = (smax - smin) * 0.15 if smax > smin else spot * 0.05
        strike_lo, strike_hi = smin - buf, smax + buf
    else:
        strike_lo, strike_hi = vol_lo, vol_hi
    lo = min(vol_lo, strike_lo, spot * 0.96)
    hi = max(vol_hi, strike_hi, spot * 1.04)
    if hi <= lo:
        lo, hi = spot * 0.9, spot * 1.1
    step = (hi - lo) / (steps - 1)
    return tuple(lo + i * step for i in range(steps))


def calibrate_iv_to_credit(
    pkg: Package,
    *,
    time_years: float,
    target_credit: float,
    risk_free_rate: float = 0.0,
    lo: float = 0.05,
    hi: float = 1.50,
    steps: int = 48,
) -> float:
    """Single σ so mark(spot) ≈ package cost basis (Theo pin to package debit).

    Multi-leg packages (esp. OTM butterflies) are often **non-monotonic** in σ,
    so a binary search on the endpoints can pin at the old 250% ceiling. We
    grid-search |mark − cost_basis| instead, then refine locally.

    ``target_credit`` kept for callers; premium is encoded in package entries.
    """
    from engine.risk_engine.payoff import mark_value

    _ = target_credit
    want_mark = package_cost_basis(pkg)

    def mark_at(sig: float) -> float:
        return mark_value(
            pkg.legs,
            pkg.spot,
            time_years=time_years,
            volatility=sig,
            risk_free_rate=risk_free_rate,
            vol_mode="theo",
        )

    # Log-spaced grid over a realistic equity-options band (not 250%).
    best_sig = 0.20
    best_err = float("inf")
    n = max(12, int(steps))
    ratio = hi / lo if lo > 0 else 1.0
    for i in range(n + 1):
        t = i / n
        sig = lo * (ratio**t)
        err = abs(mark_at(sig) - want_mark)
        if err < best_err:
            best_err = err
            best_sig = sig

    # Local refine around best grid point
    span = max(best_sig * 0.25, 0.02)
    a = max(lo, best_sig - span)
    b = min(hi, best_sig + span)
    for _ in range(20):
        mid = 0.5 * (a + b)
        # Sample three points; shrink toward lower residual
        for cand in (a, mid, b):
            err = abs(mark_at(cand) - want_mark)
            if err < best_err:
                best_err = err
                best_sig = cand
        # Tighten bracket around current best
        span *= 0.5
        a = max(lo, best_sig - span)
        b = min(hi, best_sig + span)

    # If no σ can match (tiny residual structure, weird geometry), use a sane default
    scale = max(abs(want_mark), 25.0)
    if best_err > 0.75 * scale:
        return 0.20

    return float(max(lo, min(hi, best_sig)))


def build_risk_surface(
    pkg: Package,
    *,
    time_years: float,
    volatility: float | None = None,
    risk_free_rate: float = 0.0,
    vol_mode: VolMode = "theo",
    calibrate_iv: bool = True,
    grid_steps: int = 161,
) -> RiskSurface:
    """Build expiry + realtime curves under MSC P&L authority."""
    cb = package_cost_basis(pkg)
    T_now = max(float(time_years), 0.05 / 365.0)
    T_entry = min(T_now + 0.20 / 365.0, max(T_now * 1.5, T_now + 1e-8))

    if volatility is not None:
        sigma = float(volatility)
    elif calibrate_iv and vol_mode == "theo":
        sigma = calibrate_iv_to_credit(pkg, time_years=T_entry, target_credit=pkg.credit)
        sigma = max(0.08, sigma)
    else:
        sigma = 0.20

    strikes = tuple(lg.strike for lg in pkg.legs)
    prices = compute_price_range(
        pkg.spot, sigma, T_now, strikes, steps=grid_steps
    )

    exp_pnl: list[float] = []
    rt_pnl: list[float] = []
    for S in prices:
        exp_pnl.append(
            compute_payoff(
                pkg,
                S,
                time_years=0.0,
                volatility=0.0,
                risk_free_rate=risk_free_rate,
                vol_mode="theo",
                cost_basis=cb,
            ).pnl
        )
        rt_pnl.append(
            compute_payoff(
                pkg,
                S,
                time_years=T_now,
                volatility=sigma,
                risk_free_rate=risk_free_rate,
                vol_mode=vol_mode,
                cost_basis=cb,
            ).pnl
        )

    expiry = CurveSeries(
        label="At Expiry",
        prices=prices,
        pnl=tuple(exp_pnl),
        time_years=0.0,
        volatility=0.0,
        vol_mode="expiry",
    )
    realtime = CurveSeries(
        label=f"Real-Time ({'Mkt' if vol_mode == 'mkt' else f'Theo IV {sigma * 100:.0f}%'})",
        prices=prices,
        pnl=tuple(rt_pnl),
        time_years=T_now,
        volatility=sigma,
        vol_mode=vol_mode,
    )

    return RiskSurface(
        prices=prices,
        expiry=expiry,
        realtime=realtime,
        spot=pkg.spot,
        cost_basis=cb,
        max_profit=float(pkg.max_profit),
        max_loss=float(pkg.max_loss),
        breakevens=pkg.breakevens,
        package_label=pkg.label,
        single_iv=sigma,
    )
