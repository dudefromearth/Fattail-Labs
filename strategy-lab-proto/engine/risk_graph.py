"""Streamlit Risk Graph host — MSC-lineage engine + viewport.

Math: ``engine.risk_engine``
Viewport: ATM-centered autofit / 1σ / wide (``risk_engine.viewport``)
"""

from __future__ import annotations

import io
import math
from typing import Any, Literal

import numpy as np

from engine.risk_engine import build_package, build_risk_surface
from engine.risk_engine.curves import RiskSurface
from engine.risk_engine.viewport import Viewport, compute_viewport
from engine.spec import StrategySpec

_FIG_DPI = 110
ViewportMode = Literal["autofit", "one_sigma", "wide"]


def _time_to_expiry_years(spec: StrategySpec, *, hours_elapsed: float = 0.0) -> float:
    dte = int(getattr(spec, "dte", 0) or 0)
    session = getattr(spec, "entry_session", None) or "afternoon"
    left = {"morning": 0.75, "afternoon": 0.40, "closing": 0.12}.get(session, 0.40)
    if dte <= 0:
        base = max(left, 0.25) / 365.0
    else:
        base = (dte + left) / 365.0
    # What-if: burn hours from remaining life
    burn = max(0.0, float(hours_elapsed)) / (24.0 * 365.0)
    return max(0.02 / 365.0, base - burn)


def build_surface(
    spec: StrategySpec,
    *,
    spot: float | None = None,
    iv: float | None = None,
    vol_mode: str = "theo",
    hours_elapsed: float = 0.0,
    vol_shift_pct: float = 0.0,
) -> RiskSurface:
    """Build authority risk surface (Theo default; optional what-if)."""
    pkg = build_package(spec, spot=spot)
    T = _time_to_expiry_years(spec, hours_elapsed=hours_elapsed)
    base_iv = iv
    # If caller passes explicit IV after shift, use it; else calibrate then shift
    surface = build_risk_surface(
        pkg,
        time_years=T,
        volatility=base_iv,
        vol_mode="mkt" if vol_mode == "mkt" else "theo",
        calibrate_iv=(base_iv is None),
    )
    if vol_shift_pct and abs(vol_shift_pct) > 1e-9:
        shifted = max(0.02, surface.single_iv * (1.0 + vol_shift_pct / 100.0))
        surface = build_risk_surface(
            pkg,
            time_years=T,
            volatility=shifted,
            vol_mode="theo",
            calibrate_iv=False,
        )
    return surface


def _apply_viewport_axes(ax, vp: Viewport) -> None:
    ax.set_xlim(vp.x_min, vp.x_max)
    ax.set_ylim(vp.y_min, vp.y_max)


def figure_risk_panel(
    spec: StrategySpec,
    spot: float | None = None,
    *,
    iv: float | None = None,
    vol_mode: str = "theo",
    viewport_mode: ViewportMode = "autofit",
    hours_elapsed: float = 0.0,
    vol_shift_pct: float = 0.0,
    spot_whatif_pct: float = 0.0,
    r: float = 0.0,
) -> Any:
    """2D Risk Graph with MSC viewport."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    surface = build_surface(
        spec,
        spot=spot,
        iv=iv,
        vol_mode=vol_mode,
        hours_elapsed=hours_elapsed,
        vol_shift_pct=vol_shift_pct,
    )
    pkg = build_package(spec, spot=spot)
    S = np.asarray(surface.prices, dtype=float)
    pnl_exp = np.asarray(surface.expiry.pnl, dtype=float)
    pnl_theo = np.asarray(surface.realtime.pnl, dtype=float)
    spot_x = float(surface.spot)
    sigma = float(surface.single_iv)
    T_now = float(surface.realtime.time_years)
    credit = float(pkg.credit)
    wing = float(pkg.wing)
    max_profit = float(surface.max_profit)
    max_loss = -float(surface.max_loss)

    # What-if spot marker (does not reprice shape — MSC Spot What-If = scan curve)
    mark_s = spot_x * (1.0 + spot_whatif_pct / 100.0)
    i0 = int(np.argmin(np.abs(S - mark_s)))
    pnl_spot = float(pnl_theo[i0])

    strikes_sorted = sorted({lg.strike for lg in pkg.legs})
    be_all = list(surface.breakevens)
    content = [spot_x, *strikes_sorted, *be_all]
    all_pnl = list(pnl_exp) + list(pnl_theo)
    vp = compute_viewport(
        spot=spot_x,
        content_prices=content,
        pnl_values=all_pnl,
        mode=viewport_mode,
        single_iv=sigma,
        time_years=T_now,
    )

    bg = "#12141a"
    fig, ax = plt.subplots(figsize=(10.5, 4.4), facecolor=bg)
    ax.set_facecolor(bg)
    ax.tick_params(colors="#9aa0a6", labelsize=8)
    for spine in ax.spines.values():
        spine.set_color("#2a2f3a")
    ax.grid(True, color="#1e2430", lw=0.6)
    ax.axhline(0, color="#5a6270", lw=0.9, zorder=1)
    ax.axhline(max_profit, color="#4da3ff", ls=":", lw=0.9, alpha=0.55, zorder=2)
    ax.axhline(max_loss, color="#f07178", ls=":", lw=0.9, alpha=0.55, zorder=2)
    ax.text(
        0.99,
        max_profit,
        f" max profit ${max_profit:,.0f}",
        transform=ax.get_yaxis_transform(),
        color="#8ab4f8",
        fontsize=6.5,
        ha="right",
        va="bottom",
    )
    ax.text(
        0.99,
        max_loss,
        f" max risk ${abs(max_loss):,.0f}",
        transform=ax.get_yaxis_transform(),
        color="#f0a0a0",
        fontsize=6.5,
        ha="right",
        va="top",
    )

    ax.fill_between(
        S, pnl_exp, 0, where=(pnl_exp >= 0), interpolate=True, color="#0d3d2a", alpha=0.85, zorder=2
    )
    ax.fill_between(
        S, pnl_exp, 0, where=(pnl_exp < 0), interpolate=True, color="#3a1520", alpha=0.75, zorder=2
    )
    rt_color = "#e879f9" if vol_mode == "mkt" else "#e056fd"
    ax.plot(S, pnl_exp, color="#3b82f6", lw=2.0, zorder=4, label="At Expiry")
    ax.plot(S, pnl_theo, color=rt_color, lw=2.0, zorder=5, label=surface.realtime.label)

    # Spot + optional what-if marker
    ax.axvline(spot_x, color="#f0b429", ls="--", lw=1.1, zorder=6, alpha=0.9)
    if abs(spot_whatif_pct) > 1e-6:
        ax.axvline(mark_s, color="#3ddc84", ls=":", lw=1.2, zorder=6)
    ax.plot(mark_s, pnl_spot, "o", color="#3ddc84", ms=6.5, zorder=8)
    sign = "+" if pnl_spot >= 0 else ""
    ax.annotate(
        f"{sign}${pnl_spot:,.0f}",
        xy=(mark_s, pnl_spot),
        xytext=(8, 10),
        textcoords="offset points",
        color="#e8eaed",
        fontsize=8,
        fontweight="bold",
        bbox=dict(boxstyle="round,pad=0.22", fc="#1e3a2f", ec="#3ddc84", lw=0.7),
        zorder=9,
    )
    ax.text(
        spot_x,
        1.02,
        f"{spot_x:g}",
        color="#f0b429",
        fontsize=8,
        ha="center",
        va="bottom",
        transform=ax.get_xaxis_transform(),
        clip_on=False,
    )

    y_span = max_profit - max_loss + 1.0
    for k in strikes_sorted:
        yk = float(np.interp(k, S, pnl_exp))
        ax.plot(k, yk, "o", color="#3b82f6", ms=5, zorder=7)
        ax.axvline(k, color="#2a4060", ls="-", lw=0.5, alpha=0.5, zorder=1)
        ax.text(
            k,
            yk - 0.04 * y_span,
            f"{k:g}",
            color="#8ab4f8",
            fontsize=6.5,
            ha="center",
            va="top",
        )
    for be in be_all:
        ax.plot(be, 0.0, "o", color="#f0b429", ms=3, zorder=7)

    # 1σ guides inside viewport
    if vp.one_sigma_band and vp.one_sigma_band > 0:
        half1 = vp.one_sigma_band / 2.0
        for k, lab in ((-1, "1σ"), (1, "1σ"), (-2, "2σ"), (2, "2σ")):
            x = spot_x + k * half1
            if vp.x_min <= x <= vp.x_max:
                ax.axvline(x, color="#2a3140", ls=":", lw=0.6, zorder=1)
                ax.text(
                    x,
                    0.98,
                    lab,
                    transform=ax.get_xaxis_transform(),
                    color="#6b7280",
                    fontsize=6.5,
                    ha="center",
                    va="top",
                )

    _apply_viewport_axes(ax, vp)

    ax.set_xlabel("Underlying price", color="#c4c7cc", fontsize=9)
    ax.set_ylabel("P&L ($)", color="#c4c7cc", fontsize=9)
    mode_note = f"viewport={viewport_mode}"
    ax.set_title(
        f"{spec.underlying}  ·  {pkg.label}  ·  wing ${wing:g}  ·  "
        f"{getattr(spec, 'body_side', 'both')}  ·  "
        f"DTE {getattr(spec, 'dte', 0)}  ·  IV {sigma * 100:.0f}%  ·  {mode_note}",
        color="#e8eaed",
        fontsize=10,
        pad=8,
    )
    legend = ax.legend(
        loc="upper left",
        fontsize=8,
        frameon=True,
        facecolor="#1a1e28",
        edgecolor="#2a2f3a",
        labelcolor="#e8eaed",
    )
    legend.get_frame().set_alpha(0.95)

    short_ks = sorted({lg.strike for lg in pkg.legs if lg.qty < 0})
    long_ks = sorted({lg.strike for lg in pkg.legs if lg.qty > 0})
    ax.text(
        0.01,
        0.02,
        f"Bought {long_ks} · Sold {short_ks} · debit ${credit:.2f}/sh · "
        f"max profit ${wing - credit:.2f}/sh · T≈{T_now * 365:.2f}d · "
        f"X[{vp.x_min:.0f},{vp.x_max:.0f}]",
        transform=ax.transAxes,
        fontsize=7,
        color="#8b919a",
        va="bottom",
    )

    fig.subplots_adjust(left=0.08, right=0.98, top=0.88, bottom=0.14)
    return fig


def figure_risk_png(
    spec: StrategySpec,
    spot: float | None = None,
    *,
    iv: float | None = None,
    vol_mode: str = "theo",
    viewport_mode: ViewportMode = "autofit",
    hours_elapsed: float = 0.0,
    vol_shift_pct: float = 0.0,
    spot_whatif_pct: float = 0.0,
    dpi: int = _FIG_DPI,
) -> bytes:
    import matplotlib.pyplot as plt

    fig = figure_risk_panel(
        spec,
        spot=spot,
        iv=iv,
        vol_mode=vol_mode,
        viewport_mode=viewport_mode,
        hours_elapsed=hours_elapsed,
        vol_shift_pct=vol_shift_pct,
        spot_whatif_pct=spot_whatif_pct,
    )
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, facecolor=fig.get_facecolor())
    plt.close(fig)
    return buf.getvalue()


def geometry_summary(
    spec: StrategySpec,
    *,
    spot: float | None = None,
    iv: float | None = None,
    vol_mode: str = "theo",
    hours_elapsed: float = 0.0,
    vol_shift_pct: float = 0.0,
) -> dict[str, Any]:
    pkg = build_package(spec, spot=spot)
    surface = build_surface(
        spec,
        spot=spot,
        iv=iv,
        vol_mode=vol_mode,
        hours_elapsed=hours_elapsed,
        vol_shift_pct=vol_shift_pct,
    )
    content = [pkg.spot, *[lg.strike for lg in pkg.legs], *pkg.breakevens]
    all_pnl = list(surface.expiry.pnl) + list(surface.realtime.pnl)
    vp = compute_viewport(
        spot=pkg.spot,
        content_prices=content,
        pnl_values=all_pnl,
        mode="autofit",
        single_iv=surface.single_iv,
        time_years=surface.realtime.time_years,
    )
    return {
        "n_structures": 1,
        "spot_ref": pkg.spot,
        "wing": pkg.wing,
        "est_credit_per_share": pkg.credit,  # debit premium $/share (compat key)
        "est_debit_per_share": pkg.credit,
        "est_max_profit": pkg.max_profit,
        "est_max_loss": pkg.max_loss,
        "breakevens": list(pkg.breakevens),
        "labels": [pkg.label],
        "mult": 100 * int(spec.contracts),
        "single_iv": surface.single_iv,
        "t_years": surface.realtime.time_years,
        "cost_basis": surface.cost_basis,
        "vol_mode": vol_mode,
        "engine": "risk_engine",
        "viewport": {
            "x_min": vp.x_min,
            "x_max": vp.x_max,
            "y_min": vp.y_min,
            "y_max": vp.y_max,
            "mode": vp.mode,
        },
        "legs": [
            {
                "strike": lg.strike,
                "qty": lg.qty,
                "right": lg.right,
                "entry": lg.entry_price,
            }
            for lg in pkg.legs
        ],
        "note": (
            "MSC-lineage risk engine + viewport. Shape controls update the structure; "
            "Apply to Spec writes wing / direction / structure into Design. "
            "What-If (time/vol/spot) is view-only until you save a Spec."
        ),
    }
