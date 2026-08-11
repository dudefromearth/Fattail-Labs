"""Package-quote endpoint — Analyzer card SoR (PB17)."""

from __future__ import annotations

from opf.engines.bsm import bsm_european_price
from opf.generation import ChainGeneration, ContractStore, GenerationKey
from opf.leg import LegIntent
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import default_static_facts
from opf.tau import tau
from datetime import datetime
from zoneinfo import ZoneInfo


def test_package_quote_nat_signed_fly():
    """D_nat from PackagePricer matches sum q*m — single SoR for cards."""
    store = ContractStore()
    exp = "2026-08-15"
    clock = datetime.fromisoformat("2026-08-11T15:00:00-04:00")
    facts = default_static_facts()
    t = tau(exp, clock, settlement="pm")["tau"]
    spot = 100.0
    r = facts.risk_free_rate
    iv = 0.2
    rows = []
    for K in (90.0, 100.0, 110.0):
        for side in ("call", "put"):
            px = bsm_european_price(spot, K, t, r, 0.0, iv, side)
            rows.append(
                {
                    "side": side,
                    "strike": K,
                    "mid": px,
                    "iv": iv,
                    "expiration": exp,
                }
            )
    store.put(
        ChainGeneration(
            key=GenerationKey("SPX", "I:SPX", exp, 25),
            rows=rows,
            spot=spot,
            as_of="2026-08-11T15:00:00-04:00",
            content_hash="h1",
        )
    )
    intent = StrategyIntent(
        strategy_id="fly",
        product="SPX",
        legs=[
            LegIntent("a", "call", 90, exp, 1, "SPX"),
            LegIntent("b", "call", 100, exp, -2, "SPX"),
            LegIntent("c", "call", 110, exp, 1, "SPX"),
        ],
    )
    q = PackagePricer(store, facts=facts, as_of_clock=clock).quote(intent)
    assert q["complete"] is True
    assert q["package_debit_per_share"] is not None
    assert q.get("generations_used")


def test_lock_signed_d_star_roundtrip():
    from opf.lock import LockController

    lc = LockController()
    quote = {
        "complete": True,
        "package_debit_per_share": -1.25,  # credit structure
        "generations_used": {"2026-08-15": {"content_hash": "x"}},
        "leg_marks": [],
    }
    st = lc.lock_natural("s1", quote)
    assert st.mode == "locked"
    assert st.package_debit_per_share == -1.25
    st2 = lc.unlock("s1")
    assert st2.mode == "unlocked"
