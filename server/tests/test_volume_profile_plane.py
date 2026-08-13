"""VP dual-store plane — storage, geometry, APIs (Spec v0.4; no production bins)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from tests.conftest import cookie_for


def test_parse_mounts_and_fail_loud(tmp_path, monkeypatch):
    from market_data.storage import MountError, load_mounts, parse_mounts_env

    mounts = parse_mounts_env(f"raw-primary:{tmp_path}")
    assert len(mounts) == 1
    assert mounts[0].role == "raw-primary"
    assert mounts[0].data_root == tmp_path / "fattail-market-data"

    with pytest.raises(MountError, match="unknown mount role"):
        parse_mounts_env(f"laptop:{tmp_path}")

    missing = tmp_path / "nope"
    monkeypatch.setenv("LABS_MARKET_DATA_MOUNTS", f"raw-primary:{missing}")
    with pytest.raises(MountError, match="mount missing"):
        load_mounts(require_present=True)


def test_half_away_from_zero_golden():
    from market_data.vp_bins import bin_index, half_away_from_zero

    assert half_away_from_zero(1.5) == 2
    assert half_away_from_zero(-1.5) == -2
    assert half_away_from_zero(2.5) == 3
    assert half_away_from_zero(-2.5) == -3
    assert half_away_from_zero(1.4) == 1
    assert half_away_from_zero(-1.4) == -1
    # AT-R5: price / tick on binary-exact cents
    assert bin_index(10.00, 0.01) == 1000
    assert bin_index(10.01, 0.01) == 1001
    assert bin_index(0.0, 0.01) == 0


def test_trades_first_sum_and_bar_degrade_not_typical():
    from market_data.vp_bins import accumulate_bar_spread, accumulate_trades, dense_volumes

    trades = [
        {"price": 10.00, "size": 100, "conditions": []},
        {"price": 10.02, "size": 50, "conditions": []},
    ]
    sparse = accumulate_trades(trades, tick_size=0.01)
    _, vols, total = dense_volumes(sparse)
    assert total == 150
    assert sum(vols) == 150

    bars = [{"h": 10.04, "l": 10.00, "v": 100}]
    spread = accumulate_bar_spread(bars, tick_size=0.01)
    assert len(spread) > 1
    assert abs(sum(spread.values()) - 100) < 1e-9
    # typical-price would be a single bin at 10.02
    typical_only = accumulate_trades(
        [{"price": 10.02, "size": 100}], tick_size=0.01
    )
    assert typical_only != spread


def test_vix_quarantine_and_spy_proxy():
    from market_data.vp_eligibility import VpEligibilityError, resolve_series

    with pytest.raises(VpEligibilityError, match="quarantined"):
        resolve_series("VIX")
    with pytest.raises(VpEligibilityError, match="quarantined"):
        resolve_series("I:VIX1D")
    spy = resolve_series("SPY")
    assert spy["series_ticker"] == "SPY"
    assert spy["proxy_of"] is None
    spx = resolve_series("SPX")
    assert spx["series_ticker"] == "SPY"
    assert spx["proxy_of"] == "SPX"
    assert spx["price_space"] == "series"


def test_parquet_schema_projects_conditions(tmp_path):
    from market_data.parquet_schema import table_for
    import pyarrow.parquet as pq

    rows = [
        {"price": 10.0, "size": 3, "conditions": [12, 14], "sip_timestamp": 1, "foo": "x"}
    ]
    table = table_for("trades", rows)
    path = tmp_path / "part-000.parquet"
    pq.write_table(table, path)
    back = pq.read_table(path).to_pylist()
    assert back[0]["price"] == 10.0
    assert back[0]["size"] == 3
    assert "12" in str(back[0]["conditions"])
    extra = json.loads(back[0]["extra_json"])
    assert extra["foo"] == "x"


def test_raw_day_open_contract(tmp_path, monkeypatch):
    from market_data.parquet_schema import table_for
    from market_data.raw_store import open_day
    import pyarrow.parquet as pq

    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    day = date(2024, 6, 3)
    part = (
        tmp_path
        / "raw"
        / "SPY"
        / "trades"
        / "year=2024"
        / "month=06"
        / "day=03"
        / "part-000.parquet"
    )
    part.parent.mkdir(parents=True)
    pq.write_table(table_for("trades", [{"price": 1.0, "size": 2}]), part)
    (part.with_suffix(part.suffix + ".ok")).write_text(
        json.dumps({"status": "ok", "rows": 1, "day": "2024-06-03"})
    )
    opened = open_day("SPY", "trades", day, preview_rows=5, root=tmp_path)
    assert opened["exists"] is True
    assert opened["complete"] is True
    assert opened["rows"] == 1
    assert opened["preview"][0]["price"] == 1.0


def test_member_vp_waiting_and_vix(client, monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_MOUNTS", f"raw-primary:{tmp_path}")
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path / "fattail-market-data"))
    cookies = cookie_for("navigator", identity_id=1)
    # identity 1 may not exist — use probe-like admin? tool member needs membership.
    # Administrator always passes tool gate.
    cookies = cookie_for("administrator")
    r = client.get("/api/me/market/volume-profile", params={"symbol": "SPY"}, cookies=cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["measured"] is False
    assert body["state"] == "WAITING"
    assert body["volumes"] is None
    assert "poc" not in body

    r2 = client.get("/api/me/market/volume-profile", params={"symbol": "VIX"}, cookies=cookies)
    assert r2.status_code == 422
    assert r2.json()["detail"]["code"] == "quarantined"


def test_admin_backfill_and_rebuild_do_not_pull(client, monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_MOUNTS", f"raw-primary:{tmp_path}")
    admin = cookie_for("administrator")
    r = client.post("/api/admin/market/raw/backfill", cookies=admin)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "read_only_request_path"

    r2 = client.post("/api/admin/market/volume-profile/rebuild", cookies=admin)
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "bins_not_frozen"


def test_admin_mounts_and_authz(client, monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_MOUNTS", f"raw-primary:{tmp_path}")
    r = client.get("/api/admin/market/storage/mounts")
    assert r.status_code == 401

    nav = cookie_for("navigator")
    r2 = client.get("/api/admin/market/storage/mounts", cookies=nav)
    assert r2.status_code == 403

    admin = cookie_for("administrator")
    r3 = client.get("/api/admin/market/storage/mounts", cookies=admin)
    assert r3.status_code == 200, r3.text
    body = r3.json()
    assert body["bins_frozen"] is False
    assert body["mounts"][0]["role"] == "raw-primary"
    assert "free_bytes" in body["mounts"][0]


def test_index_403_helper_records_entitlement():
    from market_data.p2_index_entitlement import classify_index_error

    assert classify_index_error("Massive HTTP 403 for /v3/trades/I:SPX: denied") == "403"
    assert classify_index_error("Massive HTTP 429") == "429"
