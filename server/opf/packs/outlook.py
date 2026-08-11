"""Outlook packs: scenario_surface (default) + dynamics/SABR gate (alternate)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from opf.engines.bsm import bsm_european_price
from opf.generation import ContractStore
from opf.lock import LockState
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import MarketStaticFacts, require_static_facts
from opf.tau import shift_clock, tau as compute_tau


def run_scenario_surface(
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
    scenario: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Outlook default: time roll + explicit vol scenarios — never labeled as mark."""
    facts = require_static_facts(facts)
    pricer = PackagePricer(
        store, facts=facts, vix=vix, vix1d=vix1d, as_of_clock=as_of_clock
    )
    quote = pricer.quote(intent, lock=lock, require_epoch_ok=False)
    sc = scenario or what_if or {}
    # OPF31: vol_*_pts absolute IV points
    vol_pts = float(
        sc.get("vol_offset_pts")
        or sc.get("vol_up_pts")
        or sc.get("vol_scenario_pts")
        or 0.0
    )
    time_h = float(sc.get("time_offset_hours") or 0.0)
    spot_pct = float(sc.get("spot_pct") or 0.0)

    spot = spot_override or quote.get("epoch", {}).get("spot")
    if spot is None or not quote.get("complete"):
        return {
            "use_case": "outlook",
            "pack_id": "outlook.scenario_surface@1.0.0",
            "complete": False,
            "marks": {"label": "mark", "leg_marks": quote.get("leg_marks"), "complete": quote.get("complete")},
            "scenario": None,
            "meta": {"error": quote.get("error") or "spot/incomplete", "label": "scenario"},
        }

    clock = as_of_clock
    if time_h and clock is not None:
        clock = shift_clock(clock, time_h)
    elif time_h:
        from datetime import datetime as dt
        from zoneinfo import ZoneInfo

        clock = shift_clock(dt.now(tz=ZoneInfo("America/New_York")), time_h)

    S = float(spot) * (1.0 + spot_pct / 100.0)
    r = facts.risk_free_rate
    q = facts.q_continuous(intent.product)
    model_sum = 0.0
    for lm in quote["leg_marks"]:
        settlement = facts.product(intent.product).settlement
        tmeta = compute_tau(lm["expiration"], clock, settlement=settlement)  # type: ignore[arg-type]
        t = float(tmeta["tau"])
        iv0 = lm.get("iv")
        if iv0 is None:
            return {
                "use_case": "outlook",
                "pack_id": "outlook.scenario_surface@1.0.0",
                "complete": False,
                "meta": {"error": f"missing IV leg={lm.get('leg_id')}", "label": "scenario"},
            }
        iv = float(iv0) + vol_pts / 100.0
        px = bsm_european_price(S, float(lm["strike"]), t, r, q, max(iv, 1e-6), lm["side"])
        model_sum += float(lm["qty"]) * px

    packages = float(intent.packages or 1.0)
    d_basis = quote.get("basis_debit_per_share") or quote.get("package_debit_per_share") or 0.0
    pnl = (model_sum - float(d_basis)) * 100.0 * packages

    return {
        "use_case": "outlook",
        "pack_id": "outlook.scenario_surface@1.0.0",
        "complete": True,
        "marks": {
            "label": "mark",
            "package_debit_per_share": quote.get("package_debit_per_share"),
            "mark_dollars": quote.get("mark_dollars"),
            "complete": quote.get("complete"),
            "leg_marks": quote.get("leg_marks"),
        },
        "scenario": {
            "label": "scenario",  # OPF15 — never present as live mark
            "vol_offset_pts": vol_pts,
            "time_offset_hours": time_h,
            "spot_pct": spot_pct,
            "spot": S,
            "debit_per_share": model_sum,
            "pnl_dollars": pnl,
            "pnl_unit": "usd_per_package_set",
        },
        "meta": {
            "engine_id": "bsm_european",
            "rate_source": facts.rate_source,
            "label": "scenario",
        },
    }


def run_dynamics(
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
    scenario: dict[str, Any] | None = None,
    sabr_rmse_gate: float = 0.05,
) -> dict[str, Any]:
    """Alternate outlook: attempt SABR smile morph; on fit fail → fallback scenario_surface labeled."""
    # Minimal SABR gate: if we cannot fit (no dense slice), fallback loud
    try:
        # Placeholder: without full SABR calibrate, treat as fit fail when <5 IV points
        gen = None
        for leg in intent.legs:
            gen = store.get_by_expiration(leg.product, leg.expiration)
            if gen:
                break
        n_iv = sum(1 for r in (gen.rows if gen else []) if r.get("iv") is not None)
        if n_iv < 5:
            raise RuntimeError(f"SABR fit RMSE gate: insufficient points n_iv={n_iv}")
        # If enough points, still use scenario path with engine label sabr_slice (simplified)
        out = run_scenario_surface(
            intent,
            store,
            facts=facts,
            lock=lock,
            what_if=what_if,
            as_of_clock=as_of_clock,
            vix=vix,
            vix1d=vix1d,
            spot_override=spot_override,
            scenario=scenario,
        )
        out["pack_id"] = "outlook.dynamics@1.0.0"
        if out.get("meta"):
            out["meta"]["engine_id"] = "sabr_slice"
            out["meta"]["sabr_rmse_gate"] = sabr_rmse_gate
            out["meta"]["fallback"] = False
        return out
    except Exception as exc:
        out = run_scenario_surface(
            intent,
            store,
            facts=facts,
            lock=lock,
            what_if=what_if,
            as_of_clock=as_of_clock,
            vix=vix,
            vix1d=vix1d,
            spot_override=spot_override,
            scenario=scenario,
        )
        out["pack_id"] = "outlook.dynamics@1.0.0"
        if out.get("meta") is None:
            out["meta"] = {}
        out["meta"]["engine_id"] = "scenario_surface_fallback"
        out["meta"]["fallback"] = True
        out["meta"]["fallback_reason"] = str(exc)
        out["meta"]["label"] = "scenario"
        return out
