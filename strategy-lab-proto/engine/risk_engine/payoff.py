"""Single-point payoff — MSC Risk Graph P&L authority.

Authority (MSC risk_graph_pnl_authority_v1.1):
  P&L(S) = mark(S, T, σ) − cost_basis
  cost_basis from package entry (card debit / credit)
  No mid-anchor vertical shift.

Supports:
  • theoretical: single flat σ on every leg
  • market: optional per-leg IV (when provided)
"""

from __future__ import annotations

from dataclasses import dataclass

from engine.risk_engine.legs import OptionLeg, Package
from engine.risk_engine.pricing import bs_price


@dataclass(frozen=True)
class PayoffPoint:
    pnl: float
    mark_value: float
    cost_basis: float


def package_cost_basis(pkg: Package) -> float:
    """Total $ cost basis. Short credit → negative (money received)."""
    total = 0.0
    for lg in pkg.legs:
        # entry_price is $/share; qty is contracts; ×100
        total += lg.entry_price * 100.0 * lg.qty
    return total


def mark_value(
    legs: tuple[OptionLeg, ...] | list[OptionLeg],
    S: float,
    *,
    time_years: float,
    volatility: float,
    risk_free_rate: float = 0.0,
    vol_mode: str = "theo",
) -> float:
    """Portfolio mark in $ at underlying S."""
    total = 0.0
    for lg in legs:
        is_call = lg.right == "call"
        if vol_mode == "mkt" and lg.iv is not None:
            sig = float(lg.iv)
        else:
            sig = float(volatility)
        unit = bs_price(S, lg.strike, time_years, risk_free_rate, sig, is_call)
        total += lg.qty * unit * 100.0
    return total


def compute_payoff(
    pkg: Package,
    S: float,
    *,
    time_years: float,
    volatility: float,
    risk_free_rate: float = 0.0,
    vol_mode: str = "theo",
    cost_basis: float | None = None,
) -> PayoffPoint:
    """P&L at one spot under MSC authority: mark − cost_basis."""
    if S <= 0:
        raise ValueError(f"spot must be > 0, got {S}")
    cb = package_cost_basis(pkg) if cost_basis is None else float(cost_basis)
    mark = mark_value(
        pkg.legs,
        S,
        time_years=time_years,
        volatility=volatility,
        risk_free_rate=risk_free_rate,
        vol_mode=vol_mode,
    )
    return PayoffPoint(pnl=mark - cb, mark_value=mark, cost_basis=cb)
