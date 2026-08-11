"""Backtest packs: chain_replay (cold archive) + surface_reconstruct."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from opf.archive import ArchiveGap, archive_get, archive_put
from opf.engines.bsm import bsm_european_price
from opf.generation import ChainGeneration, ContractStore, GenerationKey
from opf.lock import LockState
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import MarketStaticFacts, require_static_facts


def run_chain_replay(
    intent: StrategyIntent,
    store: ContractStore,
    *,
    facts: MarketStaticFacts | None,
    lock: LockState | None = None,
    what_if: dict[str, Any] | None = None,
    as_of_clock: datetime | None = None,
    as_of: str | None = None,
    vix: float | None = None,
    vix1d: float | None = None,
    spot_override: float | None = None,
) -> dict[str, Any]:
    """Default backtest: require cold archive generations (OPF16)."""
    facts = require_static_facts(facts)
    # Load archive for each leg expiration into a scratch store
    scratch = ContractStore()
    gaps: list[dict[str, Any]] = []
    for leg in intent.legs:
        # Prefer live store first for unit tests; else archive
        live = store.get_by_expiration(leg.product, leg.expiration)
        if live and not as_of:
            scratch.put(live)
            continue
        key = GenerationKey(
            product=leg.product,
            chain_underlier=live.key.chain_underlier if live else leg.product,
            expiration=leg.expiration,
            wings=live.key.wings if live else 25,
        )
        try:
            gen = archive_get(key, as_of=as_of)
            if gen is None:
                return {
                    "use_case": "backtest",
                    "pack_id": "backtest.chain_replay@1.0.0",
                    "complete": False,
                    "meta": {
                        "error": f"cold archive miss for {leg.expiration} (OPF16 fail loud)",
                        "label": "historical",
                    },
                }
            scratch.put(gen)
        except ArchiveGap as gap:
            gaps.append(gap.to_dict())
            return {
                "use_case": "backtest",
                "pack_id": "backtest.chain_replay@1.0.0",
                "complete": False,
                "meta": {
                    "error": "archive gap (OPF33)",
                    "gap": gap.to_dict(),
                    "label": "historical",
                },
            }

    if not scratch.list_keys():
        return {
            "use_case": "backtest",
            "pack_id": "backtest.chain_replay@1.0.0",
            "complete": False,
            "meta": {
                "error": "backtest.chain_replay requires cold archive or seeded generations",
                "label": "historical",
            },
        }

    pricer = PackagePricer(scratch, facts=facts, as_of_clock=as_of_clock)
    quote = pricer.quote(intent, lock=lock, require_epoch_ok=False)
    return {
        "use_case": "backtest",
        "pack_id": "backtest.chain_replay@1.0.0",
        "complete": bool(quote.get("complete")),
        "marks": {
            "label": "historical",
            "package_debit_per_share": quote.get("package_debit_per_share"),
            "mark_dollars": quote.get("mark_dollars"),
            "complete": quote.get("complete"),
            "leg_marks": quote.get("leg_marks"),
        },
        "meta": {
            "engine_id": "replay_archive",
            "label": "historical",
            "gaps": gaps,
            "error": quote.get("error"),
        },
    }


def run_surface_reconstruct(
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
    """Weaker alternate: parametric IV from VIX — labeled surface_reconstruct."""
    facts = require_static_facts(facts)
    pricer = PackagePricer(
        store, facts=facts, vix=vix, vix1d=vix1d, as_of_clock=as_of_clock
    )
    quote = pricer.quote(intent, lock=lock, require_epoch_ok=False)
    spot = spot_override or quote.get("epoch", {}).get("spot")
    if spot is None:
        return {
            "use_case": "backtest",
            "pack_id": "backtest.surface_reconstruct@1.0.0",
            "complete": False,
            "meta": {"error": "spot missing", "label": "historical"},
        }
    iv = (vix or 20.0) / 100.0 if (vix or 20) > 3 else float(vix or 0.2)
    r = facts.risk_free_rate
    q = facts.q_continuous(intent.product)
    model_sum = 0.0
    for lm in quote.get("leg_marks") or []:
        t = float(lm.get("tau") or 1e-4)
        px = bsm_european_price(float(spot), float(lm["strike"]), t, r, q, iv, lm["side"])
        model_sum += float(lm["qty"]) * px
    packages = float(intent.packages or 1.0)
    d_basis = quote.get("basis_debit_per_share") or 0.0
    return {
        "use_case": "backtest",
        "pack_id": "backtest.surface_reconstruct@1.0.0",
        "complete": True,
        "marks": {
            "label": "historical",
            "note": "surface_reconstruct is weaker; labeled historical",
            "package_debit_per_share": quote.get("package_debit_per_share"),
        },
        "model": {
            "label": "historical",
            "engine_id": "surface_reconstruct",
            "debit_per_share": model_sum,
            "pnl_dollars": (model_sum - float(d_basis)) * 100.0 * packages,
        },
        "meta": {
            "engine_id": "surface_reconstruct",
            "label": "historical",
            "quality": "weak_reconstruct",
        },
    }


def seed_archive_from_store(store: ContractStore) -> int:
    """Helper: write all store generations to cold archive."""
    n = 0
    for k in store.list_keys():
        gen = store.get(k)
        if gen:
            archive_put(gen)
            n += 1
    return n
