"""OPF L4 headless pricing API — resolve / interest / lock.

No Options Lab UI wiring. Auth: member session + tool gate.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from guards import require_session
from opf.generation import ContractStore
from opf.interest import InterestBudgetExceeded, get_interest_manager
from opf.keys import bus_ladder_key, parse_ladder_topic
from opf.leg import LegIntent
from opf.lock import get_lock_controller
from opf.package import PackagePricer, StrategyIntent
from opf.packs.registry import list_packs
from opf.resolve import resolve_pricing
from opf.static_facts import default_static_facts
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["opf-pricing"])

# Process-local generation store for foundation (in-memory; hydrate from body or bus)
_store = ContractStore()


def get_opf_store() -> ContractStore:
    return _store


class LegIn(BaseModel):
    leg_id: str
    side: str
    strike: float
    expiration: str
    qty: float
    product: str = "SPX"


class StrategyIn(BaseModel):
    strategy_id: str = "s1"
    structure: str = "custom"
    packages: float = 1.0
    product: str = "SPX"
    legs: list[LegIn]


class GenerationIn(BaseModel):
    """Optional inline generation hydrate (headless / tests)."""
    product: str
    chain_underlier: str | None = None
    expiration: str
    wings: int = 25
    spot: float | None = None
    as_of: str | None = None
    content_hash: str = ""
    rows: list[dict[str, Any]] = Field(default_factory=list)


class ResolveIn(BaseModel):
    use_case: str = "day_trade"
    pack_id: str | None = None
    strategy: StrategyIn
    generations: list[GenerationIn] | None = None
    what_if: dict[str, Any] | None = None
    scenario: dict[str, Any] | None = None
    spot: float | None = None
    vix: float | None = None
    vix1d: float | None = None
    as_of: str | None = None


class InterestIn(BaseModel):
    chain_underlier: str
    expiration: str
    wings: int = 25
    action: str = "touch"  # touch | release


class LockIn(BaseModel):
    strategy_id: str
    action: str  # lock_natural | lock_limit | unlock | edit_limit
    limit_per_share: float | None = None
    freeze_iv: bool = False
    freeze_marks: bool = False
    # optional quote context for natural lock
    strategy: StrategyIn | None = None
    generations: list[GenerationIn] | None = None


def _hydrate(gens: list[GenerationIn] | None) -> None:
    if not gens:
        return
    from opf.generation import ChainGeneration, GenerationKey

    for g in gens:
        key = GenerationKey(
            product=g.product,
            chain_underlier=g.chain_underlier or g.product,
            expiration=g.expiration[:10],
            wings=g.wings,
        )
        gen = ChainGeneration(
            key=key,
            rows=list(g.rows),
            spot=g.spot,
            as_of=g.as_of or "",
            content_hash=g.content_hash,
            dual_side=True,
        )
        _store.put(gen)


def _intent(s: StrategyIn) -> StrategyIntent:
    return StrategyIntent(
        strategy_id=s.strategy_id,
        structure=s.structure,
        packages=s.packages,
        product=s.product,
        legs=[
            LegIntent(
                leg_id=L.leg_id,
                side=L.side,
                strike=L.strike,
                expiration=L.expiration[:10],
                qty=L.qty,
                product=L.product or s.product,
            )
            for L in s.legs
        ],
    )


@router.get("/api/me/pricing/packs")
def pricing_packs(request: Request) -> dict[str, Any]:
    session = require_session(request)
    _require_tool_member(session)
    return {"packs": list_packs()}


@router.post("/api/me/pricing/resolve")
def pricing_resolve(request: Request, body: ResolveIn) -> dict[str, Any]:
    session = require_session(request)
    _require_tool_member(session)
    _hydrate(body.generations)
    try:
        out = resolve_pricing(
            use_case=body.use_case,
            intent=_intent(body.strategy),
            store=_store,
            pack_id=body.pack_id,
            facts=default_static_facts(),
            what_if=body.what_if,
            scenario=body.scenario,
            as_of=body.as_of,
            vix=body.vix,
            vix1d=body.vix1d,
            spot_override=body.spot,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return out


class PackageQuoteIn(BaseModel):
    """Lightweight package quote — card SoR (PB17); no full model pack curves."""

    strategy: StrategyIn
    generations: list[GenerationIn] | None = None
    require_epoch_ok: bool = True
    vix: float | None = None
    vix1d: float | None = None


@router.post("/api/me/pricing/package-quote")
def pricing_package_quote(request: Request, body: PackageQuoteIn) -> dict[str, Any]:
    """OPF PackageQuote for Analyzer cards (single pricing SoR with resolve)."""
    session = require_session(request)
    _require_tool_member(session)
    _hydrate(body.generations)
    pricer = PackagePricer(
        _store,
        facts=default_static_facts(),
        vix=body.vix,
        vix1d=body.vix1d,
    )
    quote = pricer.quote(
        _intent(body.strategy),
        require_epoch_ok=body.require_epoch_ok,
    )
    gens = quote.get("generations_used") or {}
    as_ofs = [
        (meta or {}).get("as_of")
        for meta in gens.values()
        if isinstance(meta, dict) and meta.get("as_of")
    ]
    return {
        "complete": quote.get("complete"),
        "package_debit_per_share": quote.get("package_debit_per_share"),
        "basis_debit_per_share": quote.get("basis_debit_per_share"),
        "basis_source": quote.get("basis_source"),
        "mark_mode": quote.get("mark_mode"),
        "mark_disclaimer": quote.get("mark_disclaimer"),
        "leg_marks": quote.get("leg_marks"),
        "max_skew_ms": quote.get("max_skew_ms"),
        "epoch_quality": quote.get("epoch_quality"),
        "generations_used": gens,
        "as_of": max(as_ofs) if as_ofs else None,
        "error": quote.get("error"),
        "skew_fail": bool(quote.get("skew_fail")),
        "pnl_unit": quote.get("pnl_unit"),
        "opf_session": quote.get("opf_session"),
    }


@router.post("/api/me/pricing/interest")
def pricing_interest(request: Request, body: InterestIn) -> dict[str, Any]:
    session = require_session(request)
    _require_tool_member(session)
    topic = bus_ladder_key(body.chain_underlier, body.expiration[:10], body.wings)
    mgr = get_interest_manager()
    action = (body.action or "touch").lower()
    try:
        if action == "release":
            mgr.release(topic)
        else:
            mgr.touch(topic)
            # also touch Redis interest if bus enabled
            try:
                from market_data.market_bus.store import get_store

                store = get_store()
                if store is not None:
                    store.touch_interest(topic)
            except Exception:
                pass
    except InterestBudgetExceeded as exc:
        raise HTTPException(
            status_code=429,
            detail={"error": str(exc), "cap": exc.cap, "held": exc.held},
        ) from exc
    return {
        "topic": topic,
        "held": mgr.held_count(),
        "cap": mgr.cap,
        "topics": mgr.list_topics(),
    }


@router.post("/api/me/pricing/lock")
def pricing_lock(request: Request, body: LockIn) -> dict[str, Any]:
    session = require_session(request)
    _require_tool_member(session)
    lc = get_lock_controller()
    action = body.action.lower()
    try:
        if action == "unlock":
            state = lc.unlock(body.strategy_id)
        elif action == "edit_limit":
            if body.limit_per_share is None:
                raise HTTPException(status_code=422, detail="limit_per_share required")
            state = lc.edit_limit(body.strategy_id, body.limit_per_share)
        elif action == "lock_limit":
            if body.limit_per_share is None:
                raise HTTPException(status_code=422, detail="limit_per_share required")
            quote = None
            if body.strategy is not None:
                _hydrate(body.generations)
                quote = PackagePricer(_store, facts=default_static_facts()).quote(
                    _intent(body.strategy), require_epoch_ok=False
                )
            state = lc.lock_limit(
                body.strategy_id,
                body.limit_per_share,
                package_quote=quote,
                freeze_iv=body.freeze_iv,
                freeze_marks=body.freeze_marks,
            )
        elif action == "lock_natural":
            if body.strategy is None:
                raise HTTPException(status_code=422, detail="strategy required for lock_natural")
            _hydrate(body.generations)
            quote = PackagePricer(_store, facts=default_static_facts()).quote(
                _intent(body.strategy)
            )
            state = lc.lock_natural(
                body.strategy_id,
                quote,
                freeze_iv=body.freeze_iv,
                freeze_marks=body.freeze_marks,
            )
        else:
            raise HTTPException(status_code=422, detail=f"unknown action {body.action}")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"lock": state.to_dict()}


@router.get("/api/me/pricing/health")
def pricing_health(request: Request) -> dict[str, Any]:
    """Unauthenticated? No — still session; lightweight status for smoke."""
    session = require_session(request)
    _require_tool_member(session)
    mgr = get_interest_manager()
    return {
        "ok": True,
        "foundation": "opf",
        "spec": "v0.2.1",
        "generations_cached": len(_store.list_keys()),
        "interest_held": mgr.held_count(),
        "interest_cap": mgr.cap,
        "packs": list_packs(),
    }
