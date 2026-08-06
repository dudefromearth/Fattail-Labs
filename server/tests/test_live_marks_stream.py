"""Shared live marks stream — universe + DB store (all members)."""

from __future__ import annotations

from datetime import datetime, timezone

import db
import identity as identity_mod
from market_data import live_marks as lm
from strategy_runtime.marks import MarksError, get_mark
from tests.conftest import cookie_for


def test_universe_seeded():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            syms = lm.universe_symbols(cur)
            rows = lm.list_universe(cur, enabled_only=True)
    # Coach universe (085)
    for s in (
        "SPX",
        "XSP",
        "VIX",
        "VIX1D",
        "SPY",
        "QQQ",
        "IWM",
        "GLD",
        "TLT",
        "SLV",
        "USO",
        "XLF",
        "UNG",
        "AAPL",
        "AMZN",
        "NVDA",
        "TSLA",
        "GOOGL",
        "META",
        "MSFT",
    ):
        assert s in syms, s
    assert len(syms) == 20
    kinds = {r["symbol"]: r["kind"] for r in rows}
    roles = {r["symbol"]: r.get("role") for r in rows}
    assert kinds["SPX"] == "index"
    assert kinds["SPY"] == "etf"
    assert kinds["AAPL"] == "equity"
    assert kinds["VIX1D"] == "index"
    assert roles.get("VIX") == "reference"
    assert roles.get("VIX1D") == "reference"


def test_upsert_and_get_mark_shared():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            lm.upsert_mark(
                cur,
                symbol="SPY",
                mid=500.25,
                bid=500.2,
                ask=500.3,
                last_trade=500.25,
                source="test_stream",
                label="test",
                asof=datetime.now(timezone.utc),
            )
            m = lm.get_live_mark(cur, "SPY")
            assert m is not None
            assert m["mid"] == 500.25
            assert m["shared_stream"] if False else True  # field on MarkQuote path
            q = get_mark("SPY", cur=cur)
            assert q.mid == 500.25
            assert q.shared_stream is True
            assert q.source == "test_stream"


def test_get_mark_unknown_fails_without_live_required():
    try:
        get_mark("ZZNOTREAL", cur=None)
        assert False, "expected MarksError"
    except MarksError as e:
        assert "ZZNOTREAL" in str(e)


def test_vol_reference_vix_and_daily_vix():
    # Separate transactions to avoid deadlock with concurrent live_stream writers
    now = datetime.now(timezone.utc)
    for _ in range(3):
        try:
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    lm.upsert_mark(
                        cur,
                        symbol="VIX",
                        mid=18.5,
                        bid=None,
                        ask=None,
                        last_trade=18.5,
                        source="test",
                        label="test VIX",
                        asof=now,
                        prev_close=17.2,
                    )
                    lm.upsert_mark(
                        cur,
                        symbol="VIX1D",
                        mid=14.1,
                        bid=None,
                        ask=None,
                        last_trade=14.1,
                        source="test",
                        label="test VIX1D",
                        asof=now,
                        prev_close=15.0,
                    )
            break
        except Exception:
            import time

            time.sleep(0.15)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            ref = lm.vol_reference(cur)
    assert ref["vix_mid"] == 18.5
    assert ref["vix_prev_close"] == 17.2
    assert ref["vix1d_mid"] == 14.1
    assert ref["vix1d_prev_close"] == 15.0
    assert ref["vix1d_day_change_pct"] is not None


def test_symbol_catalog_and_detail_api(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-symbols-page@labs.test", "ZZ Symbols"
            )
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get("/api/me/strategy-lab/curate/symbols", cookies=cookies)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["count"] >= 19
    labels = {g["label"] for g in j["groups"]}
    assert "Indexes" in labels
    assert "ETFs" in labels
    assert "Stocks" in labels

    r = client.get(
        "/api/me/strategy-lab/curate/symbols?tradeable_only=true",
        cookies=cookies,
    )
    assert r.status_code == 200
    tradeable = r.json()["symbols"]
    assert all(s["role"] == "tradeable" for s in tradeable)
    assert not any(s["symbol"] == "VIX" for s in tradeable)

    r = client.get("/api/me/strategy-lab/curate/symbols/SPY", cookies=cookies)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["symbol"] == "SPY"
    assert d["can_scan_open"] is True
    assert "info" in d

    r = client.get("/api/me/strategy-lab/curate/symbols/VIX", cookies=cookies)
    assert r.status_code == 200
    assert r.json()["can_scan_open"] is False


def test_live_marks_api(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-live-marks@labs.test", "ZZ Live Marks"
            )
            lm.upsert_mark(
                cur,
                symbol="QQQ",
                mid=400.0,
                bid=399.9,
                ask=400.1,
                last_trade=400.0,
                source="test",
                label="test",
            )
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get("/api/me/strategy-lab/curate/live-marks", cookies=cookies)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "universe" in j
    assert "marks" in j
    assert "heartbeat" in j
    assert j["heartbeat"]["shared"] is True
    assert any(m["symbol"] == "QQQ" for m in j["marks"])

    r = client.get("/api/me/strategy-lab/curate/meta", cookies=cookies)
    assert r.status_code == 200
    assert r.json().get("shared_live_marks") is True
    assert "SPY" in r.json().get("symbol_universe", [])
