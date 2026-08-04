"""Labs Risk Engine — single options rendering math (MSC lineage).

Vendored / adapted from MarketSwarm-Canonical `src/engines/risk_graph/`
and the P&L authority / vol-mode specs under
`architecture/17_theoretical_pricing/`.

Labs does **not** import MarketSwarm at runtime. This package is the
installed copy so Strategy Lab (and later Labs web) share one engine.

Modes (roadmap parity with MSC):
  • theo  — single flat IV (current default; Spec Design)
  • mkt   — per-leg IV when chain data is present (hook ready)
  • 2D    — curves (current Streamlit chart)
  • 3D    — deferred; same RiskSurface series feed both hosts in MSC

Public API:
  build_package(spec) → Package
  build_risk_surface(pkg, ...) → RiskSurface
  pricing.bs_price / Greeks
"""

from engine.risk_engine.curves import RiskSurface, build_risk_surface
from engine.risk_engine.legs import OptionLeg, Package, build_package
from engine.risk_engine.payoff import PayoffPoint, compute_payoff, package_cost_basis
from engine.risk_engine.pricing import (
    bs_delta,
    bs_gamma,
    bs_price,
    bs_theta,
    bs_vega,
    norm_cdf,
    norm_pdf,
)
from engine.risk_engine.viewport import Viewport, compute_viewport, resolve_viewport
from engine.risk_engine.handles import apply_handle_drag, build_handles

__all__ = [
    "OptionLeg",
    "Package",
    "build_package",
    "PayoffPoint",
    "compute_payoff",
    "package_cost_basis",
    "RiskSurface",
    "build_risk_surface",
    "Viewport",
    "compute_viewport",
    "resolve_viewport",
    "build_handles",
    "apply_handle_drag",
    "bs_price",
    "bs_delta",
    "bs_gamma",
    "bs_vega",
    "bs_theta",
    "norm_cdf",
    "norm_pdf",
]
