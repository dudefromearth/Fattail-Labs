"""Open-book structure marks via OPF package-quote (Universal Adoption Phase C).

Equity-like: underlier mid × qty (caller).
Option structures: dual-side chain generation + PackagePricer natural debit.
"""

from __future__ import annotations

from typing import Any

from opf.generation import ChainGeneration, ContractStore, GenerationKey
from opf.leg import LegIntent
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import default_static_facts


def positions_opf_enabled() -> bool:
    """Live OPF package marks for open option positions.

    Sourced from LABS_POSITIONS_OPF via Config — missing or mistyped aborts boot.
    """
    from config import get_config

    return get_config().positions_opf


def _leg_right(leg: dict[str, Any]) -> str | None:
    for k in ("option_right", "right", "put_call", "cp"):
        r = leg.get(k)
        if r is None:
            continue
        s = str(r).strip().upper()
        if s in ("C", "CALL"):
            return "call"
        if s in ("P", "PUT"):
            return "put"
    return None


def _signed_qty(leg: dict[str, Any]) -> float:
    q = abs(float(leg.get("quantity") or 0))
    side = str(leg.get("side") or "BUY").upper()
    signed = q if side == "BUY" else -q
    pe = str(leg.get("pos_effect") or "").upper()
    if pe == "TO_CLOSE":
        signed = -signed
    return signed


def trade_to_strategy_intent(trade: dict[str, Any]) -> StrategyIntent | None:
    """Map trade_log open structure → OPF StrategyIntent. None if not options."""
    legs_in = trade.get("legs") or []
    if not legs_in:
        return None
    product = None
    opf_legs: list[LegIntent] = []
    for i, lg in enumerate(legs_in):
        right = _leg_right(lg)
        strike = lg.get("strike")
        exp = str(lg.get("expiry") or lg.get("expiration") or "")[:10]
        if right is None or strike is None or not exp:
            continue
        under = (lg.get("underlier") or lg.get("symbol") or "").strip().upper()
        if under:
            product = product or under
        try:
            k = float(strike)
        except (TypeError, ValueError):
            continue
        qty = _signed_qty(lg)
        if qty == 0:
            continue
        opf_legs.append(
            LegIntent(
                leg_id=f"L{i}",
                side=right,
                strike=k,
                expiration=exp,
                qty=qty,
                product=under or product or "SPX",
            )
        )
    if not opf_legs:
        return None
    product = product or opf_legs[0].product
    for leg in opf_legs:
        if not leg.product:
            leg.product = product
    strat = str(trade.get("strategy") or "custom").lower()
    return StrategyIntent(
        strategy_id=f"trade-{trade.get('id') or 'open'}",
        legs=opf_legs,
        structure=strat,
        packages=1.0,
        product=product,
    )


def _wings_for_legs(legs: list[LegIntent], spot: float | None) -> int:
    strikes = [float(l.strike) for l in legs]
    if not strikes:
        return 25
    span = max(strikes) - min(strikes)
    if spot and spot > 0:
        # wing count roughly span/step; use generous band
        step = 5.0 if spot > 100 else 1.0
        n = int(span / step) + 4
        return max(10, min(40, n))
    return max(15, min(40, int(span) + 5))


def hydrate_generations_for_intent(
    intent: StrategyIntent,
    *,
    store: ContractStore | None = None,
) -> ContractStore:
    """Pull dual-side ladders for each unique (product, exp) and put into store."""
    store = store or ContractStore()
    from routes import chain_ladder as cl

    by_key: dict[tuple[str, str], list[LegIntent]] = {}
    for leg in intent.legs:
        key = (leg.product.upper(), leg.expiration[:10])
        by_key.setdefault(key, []).append(leg)

    for (product, exp), legs in by_key.items():
        try:
            resolved = cl._resolve_universe_symbol(product)
        except Exception:
            continue
        wings = _wings_for_legs(legs, None)
        try:
            ladder = cl._fetch_ladder(
                product=resolved["product"],
                chain_underlier=resolved["chain_underlier"],
                kind=str(resolved.get("kind") or "equity"),
                expiration=exp,
                side="call",  # dual-side gen ignores view side
                wings=wings,
                strike_step_cfg=resolved.get("strike_step"),
            )
        except Exception:
            continue
        rows = list(ladder.get("rows") or [])
        key = GenerationKey(
            product=resolved["product"],
            chain_underlier=str(resolved["chain_underlier"]),
            expiration=exp,
            wings=int(ladder.get("wings") or wings),
        )
        gen = ChainGeneration(
            key=key,
            rows=rows,
            spot=float(ladder["spot"]) if ladder.get("spot") is not None else None,
            as_of=str(ladder.get("as_of") or ""),
            content_hash=str(ladder.get("content_hash") or ""),
            dual_side=True,
        )
        store.put(gen)
    return store


def quote_open_option_structure(trade: dict[str, Any]) -> dict[str, Any]:
    """Return package mark for an open option trade.

    Keys: complete, package_debit_per_share, mark_dollars, error, mark_meta
    """
    if not positions_opf_enabled():
        return {
            "complete": False,
            "error": "LABS_POSITIONS_OPF disabled",
            "package_debit_per_share": None,
            "mark_dollars": None,
            "mark_meta": {"engine": "disabled"},
        }
    intent = trade_to_strategy_intent(trade)
    if intent is None:
        return {
            "complete": False,
            "error": "not an option structure",
            "package_debit_per_share": None,
            "mark_dollars": None,
            "mark_meta": {"engine": "none"},
        }
    try:
        store = hydrate_generations_for_intent(intent)
        pricer = PackagePricer(store, facts=default_static_facts())
        # Open book: do not fail entire book on mild skew
        q = pricer.quote(intent, require_epoch_ok=False)
        d = q.get("package_debit_per_share")
        # Net structure value: for long debit structures mid package debit is
        # what you'd pay to open; mark value of long open ≈ debit * mult * packages.
        # Short structures have negative debit (credit) → value is liability.
        mark_dollars = q.get("mark_dollars")
        return {
            "complete": bool(q.get("complete")),
            "package_debit_per_share": d,
            "mark_dollars": mark_dollars,
            "error": q.get("error"),
            "mark_meta": {
                "engine": "package_quote",
                "plane": "market_bus_opf",
                "complete": bool(q.get("complete")),
                "epoch_quality": q.get("epoch_quality"),
                "generations": q.get("generations_used"),
                "structure": intent.structure,
                "product": intent.product,
            },
        }
    except Exception as exc:
        return {
            "complete": False,
            "error": str(exc),
            "package_debit_per_share": None,
            "mark_dollars": None,
            "mark_meta": {"engine": "package_quote", "error": str(exc)},
        }
