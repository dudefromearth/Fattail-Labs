"""Day-trade packs: mark_hybrid (default) + surface (alternate)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from opf import config as opf_config
from opf.engines.bsm import bsm_european_price
from opf.engines.crr import crr_american_price
from opf.engines.surface import SurfaceFitError, build_surface_from_chain
from opf.generation import ContractStore
from opf.lock import LockState
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import MarketStaticFacts, require_static_facts

# re-export for type checkers; datetime used in _dual_curves


def run_mark_hybrid(
    intent: StrategyIntent,
    store: ContractStore,
    *,
    facts: MarketStaticFacts | None,
    lock: LockState | None = None,
    what_if: dict[str, Any] | None = None,
    as_of_clock: datetime | None = None,
    vix: float | None = None,
    vix1d: float | None = None,
    spot_override: float | None = None,
) -> dict[str, Any]:
    """Default day_trade: mark from mids + model_t0 from per-leg IV + named engine."""
    facts = require_static_facts(facts)
    pricer = PackagePricer(
        store, facts=facts, vix=vix, vix1d=vix1d, as_of_clock=as_of_clock
    )
    quote = pricer.quote(intent, lock=lock)
    if not quote.get("complete"):
        return _result(intent, "day_trade.mark_hybrid@1.0.0", quote, model_t0=None, error=quote.get("error"))

    spot = spot_override
    if spot is None:
        spot = quote.get("epoch", {}).get("spot")
    if spot is None:
        return _result(
            intent,
            "day_trade.mark_hybrid@1.0.0",
            quote,
            model_t0=None,
            error="spot missing for model_t0",
        )

    wi = what_if or {}
    spot_pct = float(wi.get("spot_pct") or 0.0)
    vol_pts = float(wi.get("vol_offset_pts") or 0.0)
    spot_s = float(spot) * (1.0 + spot_pct / 100.0)

    r = facts.risk_free_rate
    q = facts.q_continuous(intent.product)
    prod = facts.product(intent.product)
    engine_id = "bsm_european" if prod.exercise == "european" else "crr_american"

    model_sum = 0.0
    tau_by_leg: dict[str, float] = {}
    for lm in quote["leg_marks"]:
        iv = lm.get("iv")
        if iv is None:
            return _result(
                intent,
                "day_trade.mark_hybrid@1.0.0",
                quote,
                model_t0=None,
                error=f"missing IV for model_t0 leg={lm.get('leg_id')} source={lm.get('iv_source')}",
            )
        iv_adj = float(iv) + vol_pts / 100.0  # OPF31: absolute IV points
        if iv_adj <= 0:
            return _result(
                intent,
                "day_trade.mark_hybrid@1.0.0",
                quote,
                model_t0=None,
                error=f"non-positive IV after vol_offset_pts for leg={lm.get('leg_id')}",
            )
        t = float(lm.get("tau") or 0.0)
        tau_by_leg[str(lm["leg_id"])] = t
        if engine_id == "bsm_european":
            px = bsm_european_price(
                spot_s, float(lm["strike"]), t, r, q, iv_adj, lm["side"]
            )
        else:
            px = crr_american_price(
                spot_s, float(lm["strike"]), t, r, q, iv_adj, lm["side"]
            )
        model_sum += float(lm["qty"]) * px

    packages = float(intent.packages or 1.0)
    d_basis = quote.get("basis_debit_per_share")
    model_dollars = None
    if d_basis is not None:
        model_dollars = (model_sum - float(d_basis)) * 100.0 * packages

    # mark dollars already basis-referenced in quote
    mark_dollars = quote.get("mark_dollars")

    recon = _recon(mark_dollars, model_dollars if spot_pct == 0 and vol_pts == 0 else None)

    # Dense dual curves for Risk Analyzer / ToS-comparable presentation
    curve_steps = int(wi.get("curve_steps") or 161)
    curve_range_pct = float(wi.get("curve_range_pct") or 8.0)
    curves = _dual_curves(
        quote,
        facts,
        engine_id,
        float(spot),
        r,
        q,
        vol_pts,
        d_basis,
        packages,
        steps=curve_steps,
        range_pct=curve_range_pct,
        time_offset_hours=float(wi.get("time_offset_hours") or 0.0),
        as_of_clock=as_of_clock,
        product=intent.product,
    )

    return _result(
        intent,
        "day_trade.mark_hybrid@1.0.0",
        quote,
        model_t0={
            "label": "model_t0",
            "engine_id": engine_id,
            "debit_per_share": model_sum,
            "pnl_dollars": model_dollars,
            "spot": spot_s,
        },
        curves=curves,
        tau_by_leg=tau_by_leg,
        recon=recon,
        rate_source=facts.rate_source,
        engine_id=engine_id,
    )


def run_surface(
    intent: StrategyIntent,
    store: ContractStore,
    *,
    facts: MarketStaticFacts | None,
    lock: LockState | None = None,
    what_if: dict[str, Any] | None = None,
    as_of_clock: datetime | None = None,
    vix: float | None = None,
    vix1d: float | None = None,
    spot_override: float | None = None,
) -> dict[str, Any]:
    """Alternate: same marks; model_t0 IVs from surface_tv_logk."""
    facts = require_static_facts(facts)
    pricer = PackagePricer(
        store, facts=facts, vix=vix, vix1d=vix1d, as_of_clock=as_of_clock
    )
    quote = pricer.quote(intent, lock=lock)
    if not quote.get("complete"):
        return _result(intent, "day_trade.surface@1.0.0", quote, model_t0=None, error=quote.get("error"))

    spot = spot_override or quote.get("epoch", {}).get("spot")
    if spot is None:
        return _result(intent, "day_trade.surface@1.0.0", quote, model_t0=None, error="spot missing")

    r = facts.risk_free_rate
    q = facts.q_continuous(intent.product)
    # build surface per unique expiration
    surfaces: dict[str, Any] = {}
    try:
        for lm in quote["leg_marks"]:
            exp = lm["expiration"]
            if exp in surfaces:
                continue
            gen = store.get_by_expiration(intent.product, exp)
            if not gen:
                raise SurfaceFitError(f"no generation for {exp}")
            t = float(lm.get("tau") or 0.0)
            surfaces[exp] = build_surface_from_chain(
                gen.rows, spot=float(spot), tau=t, r=r, q=q
            )
    except SurfaceFitError as exc:
        return _result(
            intent,
            "day_trade.surface@1.0.0",
            quote,
            model_t0=None,
            error=f"surface fit failed: {exc}",
        )

    import math

    model_sum = 0.0
    for lm in quote["leg_marks"]:
        surf = surfaces[lm["expiration"]]
        t = float(lm.get("tau") or 0.0)
        try:
            F = float(spot) * math.exp((r - q) * t)
            iv = surf.iv(float(lm["strike"]), F, t)
        except SurfaceFitError as exc:
            return _result(
                intent,
                "day_trade.surface@1.0.0",
                quote,
                model_t0=None,
                error=str(exc),
            )
        px = bsm_european_price(
            float(spot), float(lm["strike"]), t, r, q, iv, lm["side"]
        )
        model_sum += float(lm["qty"]) * px

    packages = float(intent.packages or 1.0)
    d_basis = quote.get("basis_debit_per_share")
    model_dollars = (
        (model_sum - float(d_basis)) * 100.0 * packages if d_basis is not None else None
    )
    recon = _recon(quote.get("mark_dollars"), model_dollars)

    return _result(
        intent,
        "day_trade.surface@1.0.0",
        quote,
        model_t0={
            "label": "model_t0",
            "engine_id": "surface_tv_logk",
            "debit_per_share": model_sum,
            "pnl_dollars": model_dollars,
            "spot": float(spot),
        },
        recon=recon,
        rate_source=facts.rate_source,
        engine_id="surface_tv_logk",
    )


def _recon(mark_dollars: float | None, model_dollars: float | None) -> dict[str, Any]:
    """AT-L3-RECON at t=0: model pnl should be ~0 vs mark basis (both basis-referenced).

    At spot with exact IVs, model value ≈ natural mark, so basis-referenced model pnl ≈ 0
    when basis = natural. We also compare model package value dollars to mark dollars.
    """
    tol_abs = opf_config.t0_recon_tol_abs()
    tol_rel = opf_config.t0_recon_tol_rel()
    if mark_dollars is None or model_dollars is None:
        return {"checked": False, "pass": None, "reason": "missing mark or model"}
    # model_dollars is already (V - D_basis)*100*pkg; at t0 natural lock, expect ~0
    err = abs(float(model_dollars))
    # Also allow comparing raw if mark is cost basis itself
    tol = max(tol_abs, abs(float(mark_dollars)) * tol_rel)
    ok = err <= tol
    return {
        "checked": True,
        "pass": ok,
        "error_dollars": err,
        "tol_dollars": tol,
        "mark_dollars": mark_dollars,
        "model_t0_pnl_dollars": model_dollars,
    }


def _intrinsic(side: str, strike: float, spot: float) -> float:
    s = str(side).lower()
    K = float(strike)
    S = float(spot)
    if s in ("c", "call"):
        return max(0.0, S - K)
    return max(0.0, K - S)


def _dual_curves(
    quote: dict[str, Any],
    facts: MarketStaticFacts,
    engine_id: str,
    spot: float,
    r: float,
    q: float,
    vol_pts: float,
    d_basis: float | None,
    packages: float,
    *,
    steps: int = 161,
    range_pct: float = 8.0,
    time_offset_hours: float = 0.0,
    as_of_clock: datetime | None = None,
    product: str = "SPX",
) -> dict[str, Any]:
    """Dense model_t0 + expiration curves (OPF30 · ToS Risk Analyzer dual shape).

    points[] = {x: underlier, y: pnl USD per package-set, basis-referenced}.
    """
    if d_basis is None:
        return {}
    steps = max(21, min(401, int(steps)))
    range_pct = max(1.0, min(40.0, float(range_pct)))
    # Expand range to cover all strikes + padding
    strikes = [float(lm["strike"]) for lm in quote.get("leg_marks") or []]
    if strikes:
        lo_s, hi_s = min(strikes), max(strikes)
        pad = max((hi_s - lo_s) * 0.35, float(spot) * 0.02, 5.0)
        x_lo = min(float(spot) * (1.0 - range_pct / 100.0), lo_s - pad)
        x_hi = max(float(spot) * (1.0 + range_pct / 100.0), hi_s + pad)
    else:
        x_lo = float(spot) * (1.0 - range_pct / 100.0)
        x_hi = float(spot) * (1.0 + range_pct / 100.0)
    if x_hi <= x_lo:
        x_hi = x_lo + 1.0

    # Optional time roll for theo τ (what-if hours)
    from opf.tau import shift_clock, tau as compute_tau

    clock = as_of_clock
    if time_offset_hours and clock is not None:
        clock = shift_clock(clock, time_offset_hours)
    elif time_offset_hours:
        from zoneinfo import ZoneInfo

        clock = shift_clock(
            datetime.now(tz=ZoneInfo("America/New_York")), time_offset_hours
        )

    settlement = facts.product(product).settlement
    leg_taus: list[float] = []
    for lm in quote.get("leg_marks") or []:
        if clock is not None:
            tmeta = compute_tau(
                lm["expiration"], clock, settlement=settlement  # type: ignore[arg-type]
            )
            leg_taus.append(float(tmeta["tau"]))
        else:
            leg_taus.append(float(lm.get("tau") or 0.0))

    model_pts: list[dict[str, float]] = []
    exp_pts: list[dict[str, float]] = []
    n = steps
    for i in range(n):
        S = x_lo + (x_hi - x_lo) * (i / (n - 1))
        v_model = 0.0
        v_exp = 0.0
        for j, lm in enumerate(quote.get("leg_marks") or []):
            iv = float(lm["iv"]) + vol_pts / 100.0
            if iv <= 0:
                iv = 1e-6
            t = leg_taus[j] if j < len(leg_taus) else float(lm.get("tau") or 0.0)
            qty = float(lm["qty"])
            if engine_id == "crr_american":
                px = crr_american_price(S, float(lm["strike"]), t, r, q, iv, lm["side"])
            else:
                px = bsm_european_price(S, float(lm["strike"]), t, r, q, iv, lm["side"])
            v_model += qty * px
            v_exp += qty * _intrinsic(lm["side"], float(lm["strike"]), S)
        y_m = (v_model - float(d_basis)) * 100.0 * packages
        y_e = (v_exp - float(d_basis)) * 100.0 * packages
        model_pts.append({"x": S, "y": y_m})
        exp_pts.append({"x": S, "y": y_e})

    return {
        "model_t0": {
            "label": "model_t0",
            "pnl_unit": "usd_per_package_set",
            "points": model_pts,
        },
        "expiration": {
            "label": "expiration",
            "pnl_unit": "usd_per_package_set",
            "points": exp_pts,
        },
    }


def _result(
    intent: StrategyIntent,
    pack_id: str,
    quote: dict[str, Any],
    *,
    model_t0: dict[str, Any] | None,
    curves: dict[str, Any] | None = None,
    tau_by_leg: dict[str, float] | None = None,
    recon: dict[str, Any] | None = None,
    rate_source: str | None = None,
    engine_id: str | None = None,
    error: str | None = None,
) -> dict[str, Any]:
    return {
        "use_case": "day_trade",
        "pack_id": pack_id,
        "strategy_id": intent.strategy_id,
        "marks": {
            "label": "mark",
            "package_debit_per_share": quote.get("package_debit_per_share"),
            "basis_debit_per_share": quote.get("basis_debit_per_share"),
            "mark_dollars": quote.get("mark_dollars"),
            "complete": quote.get("complete"),
            "leg_marks": quote.get("leg_marks"),
        },
        "model_t0": model_t0,
        "curves": curves or {},
        "lock": None,
        "meta": {
            "max_skew_ms": quote.get("max_skew_ms"),
            "epoch_quality": quote.get("epoch_quality"),
            "generations_used": quote.get("generations_used"),
            "tau_by_leg": tau_by_leg,
            "rate_source": rate_source,
            "engine_id": engine_id,
            "pnl_unit": "usd_per_package_set",
            "recon": recon,
            "error": error or quote.get("error"),
        },
        "complete": bool(quote.get("complete")) and error is None and model_t0 is not None,
    }
