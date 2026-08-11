"""L4 resolve API core (headless)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from opf.generation import ContractStore
from opf.lock import LockController, LockState, get_lock_controller
from opf.package import StrategyIntent
from opf.packs.registry import get_pack, list_packs, resolve_pack_id
from opf.static_facts import MarketStaticFacts, default_static_facts


def resolve_pricing(
    *,
    use_case: str,
    intent: StrategyIntent,
    store: ContractStore,
    pack_id: str | None = None,
    facts: MarketStaticFacts | None = None,
    lock: LockState | None = None,
    lock_controller: LockController | None = None,
    what_if: dict[str, Any] | None = None,
    as_of_clock: datetime | None = None,
    as_of: str | None = None,
    vix: float | None = None,
    vix1d: float | None = None,
    spot_override: float | None = None,
    scenario: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run pack for use_case; attach lock state."""
    pid = resolve_pack_id(use_case, pack_id)
    pack = get_pack(pid)
    if facts is None:
        facts = default_static_facts()

    lc = lock_controller or get_lock_controller()
    if lock is None:
        lock = lc.get(intent.strategy_id)

    runner = pack["run"]
    kwargs: dict[str, Any] = dict(
        facts=facts,
        lock=lock,
        what_if=what_if,
        as_of_clock=as_of_clock,
        vix=vix,
        vix1d=vix1d,
        spot_override=spot_override,
    )
    # pack-specific optional args
    import inspect

    sig = inspect.signature(runner)
    if "as_of" in sig.parameters:
        kwargs["as_of"] = as_of
    if "scenario" in sig.parameters:
        kwargs["scenario"] = scenario

    out = runner(intent, store, **kwargs)
    out["pack_id"] = pid
    out["lock"] = lock.to_dict() if lock else {"mode": "unlocked"}
    out["registry"] = list_packs()
    return out
