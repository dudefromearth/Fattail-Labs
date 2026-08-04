"""Build payload for the interactive risk-handles component."""

from __future__ import annotations

from typing import Any

from engine.risk_engine import build_package
from engine.risk_engine.handles import build_handles
from engine.risk_engine.viewport import Viewport, resolve_viewport
from engine.risk_graph import build_surface
from engine.spec import StrategySpec
from engine.universe import strike_increment


def interactive_chart_data(
    spec: StrategySpec,
    *,
    viewport_mode: str = "autofit",
    hours_elapsed: float = 0.0,
    vol_shift_pct: float = 0.0,
    sticky_viewport: dict[str, Any] | Viewport | None = None,
    force_autofit: bool = False,
    viewport_seq: int = 0,
) -> dict[str, Any]:
    """JSON-serializable chart state for the canvas component.

    ``sticky_viewport`` + ``force_autofit=False`` keeps MSC-style viewState
    across handle drags so the X scale does not widen on every drop.
    """
    pkg = build_package(spec)
    surface = build_surface(
        spec,
        hours_elapsed=hours_elapsed,
        vol_shift_pct=vol_shift_pct,
    )
    # Content for autofit: market spot + structure (not body-as-spot only)
    content = [pkg.spot, pkg.body, *[lg.strike for lg in pkg.legs], *pkg.breakevens]
    all_pnl = list(surface.expiry.pnl) + list(surface.realtime.pnl)
    mode = viewport_mode if viewport_mode in ("autofit", "one_sigma", "wide") else "autofit"
    vp = resolve_viewport(
        spot=pkg.spot,
        content_prices=content,
        pnl_values=all_pnl,
        mode=mode,  # type: ignore[arg-type]
        single_iv=surface.single_iv,
        time_years=surface.realtime.time_years,
        sticky=sticky_viewport,
        force_autofit=force_autofit or sticky_viewport is None,
    )
    handles = build_handles(pkg, spec.underlying)
    legs = [
        {
            "strike": float(lg.strike),
            "qty": int(lg.qty),
            "right": lg.right,
            "entry": float(lg.entry_price),
        }
        for lg in pkg.legs
    ]
    return {
        "prices": list(surface.prices),
        "expiry_pnl": list(surface.expiry.pnl),
        "realtime_pnl": list(surface.realtime.pnl),
        "spot": pkg.spot,
        "max_profit": pkg.max_profit,
        "max_loss": pkg.max_loss,
        "breakevens": list(pkg.breakevens),
        "handles": handles,
        "legs": legs,
        "strike_increment": strike_increment(spec.underlying),
        "symmetric_wings": pkg.label.lower().startswith("iron"),
        "label": pkg.label,
        "wing": pkg.wing,
        "credit": pkg.credit,
        "body": pkg.body,
        "single_iv": surface.single_iv,
        "viewport": vp.to_dict(),
        # Client applies Python viewport only when this seq increases (Autofit)
        "viewport_seq": int(viewport_seq),
        "title": (
            f"{spec.underlying} · {pkg.label} · wing ${pkg.wing:g} · "
            f"{getattr(spec, 'body_side', 'both')}"
        ),
    }
