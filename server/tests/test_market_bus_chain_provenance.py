"""MB-P2 — chain document stale + epoch_quality (same defs as marks / OPF)."""

from __future__ import annotations

import time

from market_data.chain_ladder import content_hash
from market_data.chain_provenance import (
    ChainProvenanceError,
    apply_chain_provenance,
    chain_epoch_quality,
    chain_is_stale,
)
from opf.generation import ContractStore, build_epoch
from routes.market_stream import _chain_wire


def _payload(*, fetched_at: float, rows: list | None = None) -> dict:
    rows = rows if rows is not None else [
        {"strike": 100, "side": "call", "mid": 1.0, "bid": 0.9, "ask": 1.1},
        {"strike": 100, "side": "put", "mid": 1.0, "bid": 0.9, "ask": 1.1},
    ]
    p = {
        "underlier": "I:SPX",
        "product": "SPX",
        "expiration": "2026-08-24",
        "dual_side": True,
        "spot": 5600.0,
        "vix": 15.0,
        "rows": rows,
        "as_of": "2026-08-22T00:00:00Z",
        "fetched_at_unix": fetched_at,
        "wings": 25,
    }
    p["content_hash"] = content_hash(p)
    return p


def test_fresh_generation_not_stale(monkeypatch):
    monkeypatch.setenv("LABS_MARK_STALE_SECONDS", "60")
    now = 1_000_000.0
    p = _payload(fetched_at=now)
    apply_chain_provenance(p, now=now)
    assert p["stale"] is False


def test_age_past_threshold_stale(monkeypatch):
    monkeypatch.setenv("LABS_MARK_STALE_SECONDS", "60")
    now = 1_000_000.0
    p = _payload(fetched_at=now - 61)
    apply_chain_provenance(p, now=now)
    assert p["stale"] is True


def test_epoch_quality_matches_opf_build_epoch():
    p = _payload(fetched_at=time.time())
    apply_chain_provenance(p)
    store = ContractStore()
    gen = store.from_ladder_payload(p)
    expect = build_epoch([gen], spot=p["spot"])["epoch_quality"]
    assert p["epoch_quality"] == expect
    assert chain_epoch_quality(p) == expect


def test_empty_rows_incomplete():
    p = _payload(fetched_at=time.time(), rows=[])
    apply_chain_provenance(p)
    assert p["epoch_quality"] == "incomplete"


def test_content_hash_unchanged_when_only_stale_flips(monkeypatch):
    monkeypatch.setenv("LABS_MARK_STALE_SECONDS", "60")
    now = 1_000_000.0
    p = _payload(fetched_at=now)
    h0 = p["content_hash"]
    apply_chain_provenance(p, now=now)
    assert p["stale"] is False
    h1 = content_hash(p)
    p2 = dict(p)
    apply_chain_provenance(p2, now=now + 61)
    assert p2["stale"] is True
    h2 = content_hash(p2)
    assert h0 == h1 == h2


def test_missing_clock_fail_loud():
    p = _payload(fetched_at=1)
    del p["fetched_at_unix"]
    del p["as_of"]
    try:
        chain_is_stale(p, now=2)
        raise AssertionError("expected ChainProvenanceError")
    except ChainProvenanceError:
        pass


def test_ws_and_http_carry_identical_provenance_fields(monkeypatch):
    monkeypatch.setenv("LABS_MARK_STALE_SECONDS", "60")
    p = _payload(fetched_at=time.time())
    apply_chain_provenance(p)
    http = {
        "mode": "full",
        "content_hash": p["content_hash"],
        "ladder": p,
        "stale": p["stale"],
        "epoch_quality": p["epoch_quality"],
    }
    ws = _chain_wire(
        mode="full",
        key="chain:SPX:2026-08-24:w25",
        ladder=dict(p),
        session_open=False,
    )
    assert ws["stale"] == http["stale"]
    assert ws["epoch_quality"] == http["epoch_quality"]
    assert ws["content_hash"] == http["content_hash"]
    assert "stale" in ws["ladder"] and "epoch_quality" in ws["ladder"]
