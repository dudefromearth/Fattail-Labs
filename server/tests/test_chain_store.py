"""Local chain store — unit tests (no network)."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from market_data.chain_store import ChainStore, underlier_dir_name


def test_underlier_dir_name():
    assert underlier_dir_name("I:SPX") == "I_SPX"
    assert underlier_dir_name("SPX") == "SPX"


def test_write_and_iter_roundtrip(tmp_path: Path):
    store = ChainStore(tmp_path)
    contracts = [
        {
            "details": {
                "ticker": "O:SPX240801C05000000",
                "strike_price": 5000,
                "contract_type": "call",
            },
            "greeks": {"delta": 0.5, "gamma": 0.01, "theta": -1.0, "vega": 2.0},
        }
    ]
    as_of = datetime(2026, 8, 1, 14, 30, 5, tzinfo=timezone.utc)
    meta = store.write_snapshot(
        underlier="I:SPX",
        contracts=contracts,
        as_of=as_of,
        source="test",
    )
    assert meta.contract_count == 1
    assert meta.path.is_file()

    rows = list(store.iter_day("I:SPX", as_of.date()))
    assert len(rows) == 1
    assert rows[0]["contract_count"] == 1
    assert rows[0]["contracts"][0]["greeks"]["delta"] == 0.5
    assert store.count_snapshots("I:SPX") == 1
    latest = store.latest_snapshot("I:SPX")
    assert latest is not None
    assert latest["as_of"].startswith("2026-08-01")


def test_append_two_snaps(tmp_path: Path):
    store = ChainStore(tmp_path)
    t1 = datetime(2026, 8, 1, 14, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 8, 1, 14, 0, 5, tzinfo=timezone.utc)
    store.write_snapshot(underlier="SPX", contracts=[{"a": 1}], as_of=t1)
    store.write_snapshot(underlier="SPX", contracts=[{"a": 2}], as_of=t2)
    rows = list(store.iter_day("SPX", t1.date()))
    assert len(rows) == 2
    assert rows[0]["contracts"][0]["a"] == 1
    assert rows[1]["contracts"][0]["a"] == 2
