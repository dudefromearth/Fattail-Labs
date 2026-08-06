"""Curate run environment — sim broker, fake money, decision log."""

from __future__ import annotations

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _cookies():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-curate-runtime@labs.test", "ZZ Curate Runtime"
            )
    return cookie_for("navigator", identity_id=iid), iid


def _strategy(client, cookies) -> str:
    r = client.post(
        "/api/me/strategy-lab/strategies",
        json={"name": "Curate RT", "phase": "curation"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    return r.json()["strategy"]["id"]


def test_curate_meta(client):
    cookies, _ = _cookies()
    r = client.get("/api/me/strategy-lab/curate/meta", cookies=cookies)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["broker"] == "sim"
    assert j["fill_model"] == "mark_mid_v1"
    assert j["deploy_for_members"] is False


def test_curate_create_arm_tick_open(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)

    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 5000,
                "max_positions_concurrent": 2,
                "max_positions_per_day": 5,
                "scan_symbol": "SPX",
                "scan_risk_per_open_usd": 400,
            },
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    inst = r.json()["instance"]
    assert inst["status"] == "draft"
    assert inst["cash_usd"] == 5000
    assert inst["broker"] == "sim"
    assert inst["fill_model"] == "mark_mid_v1"
    iid = inst["id"]

    r = client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    assert r.status_code == 422  # not armed

    r = client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/arm",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["instance"]["status"] == "armed"

    r = client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["instance"]["status"] == "running"
    assert body["fill_model"] == "mark_mid_v1"
    opens = [p for p in body["positions"] if p["status"] == "open"]
    assert len(opens) == 1
    assert opens[0]["symbol"] == "SPX"
    assert body["instance"]["cash_usd"] == 5000 - 400

    r = client.get(
        f"/api/me/strategy-lab/curate/instances/{iid}",
        cookies=cookies,
    )
    assert r.status_code == 200
    decisions = r.json()["decisions"]
    types = {d["event_type"] for d in decisions}
    assert "position_opened" in types
    assert "tick_complete" in types


def test_curate_envelope_blocks_second_open(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 2000,
                "max_positions_concurrent": 1,
                "max_positions_per_day": 10,
                "scan_symbol": "SPX",
                "scan_risk_per_open_usd": 500,
            },
        },
        cookies=cookies,
    )
    iid = r.json()["instance"]["id"]
    client.post(f"/api/me/strategy-lab/curate/instances/{iid}/arm", cookies=cookies)
    client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    r = client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    opens = [p for p in r.json()["positions"] if p["status"] == "open"]
    assert len(opens) == 1
    r = client.get(
        f"/api/me/strategy-lab/curate/instances/{iid}/decisions",
        cookies=cookies,
    )
    blocked = [
        d
        for d in r.json()["decisions"]
        if d["event_type"] == "open_blocked"
    ]
    assert blocked
    assert blocked[0]["reason_code"] == "envelope_max_positions_concurrent"


def test_curate_manage_take_profit(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 3000,
                "max_positions_concurrent": 3,
                "scan_symbol": "SPX",
                "scan_risk_per_open_usd": 500,
                "take_profit_frac_of_max_profit": 0.4,
                "stop_multiple_of_premium_risked": 10,
            },
        },
        cookies=cookies,
    )
    iid = r.json()["instance"]["id"]
    client.post(f"/api/me/strategy-lab/curate/instances/{iid}/arm", cookies=cookies)
    client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    # Force mark to full profit → manage should close
    r = client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={"force_pnl_frac": 1.0},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    opens = [p for p in r.json()["positions"] if p["status"] == "open"]
    # may open a new one on same tick after close — concurrent allows 3
    closed = [p for p in r.json()["positions"] if p["status"] == "closed"]
    assert closed
    assert closed[0]["close_reason"] in ("take_profit", "max_loss", "stop")


def test_curate_unknown_symbol_fails_loud(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)
    # Rejected at create — not a tradeable universe symbol
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 2000,
                "scan_symbol": "NOTASYMBOL",
                "scan_risk_per_open_usd": 100,
            },
        },
        cookies=cookies,
    )
    assert r.status_code == 422
    assert "NOTASYMBOL" in r.text or "tradeable" in r.text.lower()


def test_curate_comparison_and_tick_all(client):
    # Fresh identity so leftover armed instances from other tests do not pollute counts
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-curate-compare@labs.test", "ZZ Curate Compare"
            )
    cookies = cookie_for("navigator", identity_id=iid)
    # Pause any prior tickable rows for this probe
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE strategy_lab_curate_instances
                   SET status = 'paused'
                   WHERE identity_id = %s AND status IN ('armed', 'running')""",
                (iid,),
            )

    armed_ids = []
    for name in ("Compare A", "Compare B"):
        r = client.post(
            "/api/me/strategy-lab/strategies",
            json={"name": name, "phase": "curation"},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        sid = r.json()["strategy"]["id"]
        r = client.post(
            "/api/me/strategy-lab/curate/instances",
            json={
                "strategy_id": sid,
                "envelope": {
                    "allocation_usd": 3000,
                    "scan_symbol": "SPX",
                    "scan_risk_per_open_usd": 200,
                },
            },
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        iid_pub = r.json()["instance"]["id"]
        client.post(
            f"/api/me/strategy-lab/curate/instances/{iid_pub}/arm",
            cookies=cookies,
        )
        armed_ids.append(iid_pub)

    r = client.post(
        "/api/me/strategy-lab/curate/tick-all",
        json={},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["ticked"] == 2
    assert j["ok"] == 2
    assert j["identity_scoped"] is True

    r = client.get("/api/me/strategy-lab/curate/comparison", cookies=cookies)
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["identity_scoped"] is True
    assert c["summary"]["strategies"] >= 2
    assert c["summary"]["armed_or_running"] >= 1
    # Hot path uses bots only (strategies legacy key is empty — no dual payload)
    bot_rows = c.get("bots") or c.get("strategies") or []
    names = {row["strategy_name"] for row in bot_rows}
    assert "Compare A" in names and "Compare B" in names
    for row in bot_rows:
        assert "equity_approx_usd" in row
        assert "equity_series" in row
        assert isinstance(row["equity_series"], list)
        assert row["broker"] == "sim"
    assert isinstance(c.get("bots"), list) and len(c["bots"]) >= 2


def test_curate_positions_report(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 4000,
                "scan_symbol": "SPX",
                "scan_risk_per_open_usd": 300,
            },
        },
        cookies=cookies,
    )
    iid = r.json()["instance"]["id"]
    client.post(f"/api/me/strategy-lab/curate/instances/{iid}/arm", cookies=cookies)
    client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )

    r = client.get(
        "/api/me/strategy-lab/curate/positions-report",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["broker"] == "sim"
    assert j["summary"]["open_count"] >= 1
    assert j["positions"]
    row = j["positions"][0]
    assert row["strategy_id"] == sid
    assert "progress_frac" in row
    assert row["not_tradier"] is True

    r = client.get(
        "/api/me/strategy-lab/curate/positions-report?status=open",
        cookies=cookies,
    )
    assert r.status_code == 200
    assert all(p["status"] == "open" for p in r.json()["positions"])


def test_deploy_reports_book_shape(client):
    cookies, _ = _cookies()
    sid = _strategy(client, cookies)
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={
            "strategy_id": sid,
            "envelope": {
                "allocation_usd": 5000,
                "scan_symbol": "SPY",
                "scan_risk_per_open_usd": 300,
                "take_profit_frac_of_max_profit": 0.2,
                "stop_multiple_of_premium_risked": 10,
            },
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    iid = r.json()["instance"]["id"]
    client.post(f"/api/me/strategy-lab/curate/instances/{iid}/arm", cookies=cookies)
    client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={},
        cookies=cookies,
    )
    client.post(
        f"/api/me/strategy-lab/curate/instances/{iid}/tick",
        json={"force_pnl_frac": 1.0},
        cookies=cookies,
    )

    r = client.get(
        "/api/me/strategy-lab/deploy/reports-book?starting_capital=50000",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert "series" in j
    assert "stats" in j
    assert "outcome_pnls" in j
    assert j["phase"] == "deployment"
    assert j["starting_capital"] == 50000
    assert len(j["series"]) >= 1


def test_curate_isolation(client):
    cookies_a, _ = _cookies()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid_b = identity_mod.get_or_create_identity(
                cur, "zztest-curate-other@labs.test", "ZZ Curate Other"
            )
    cookies_b = cookie_for("navigator", identity_id=iid_b)
    sid = _strategy(client, cookies_a)
    r = client.post(
        "/api/me/strategy-lab/curate/instances",
        json={"strategy_id": sid, "envelope": {"allocation_usd": 1000}},
        cookies=cookies_a,
    )
    iid = r.json()["instance"]["id"]
    r = client.get(
        f"/api/me/strategy-lab/curate/instances/{iid}",
        cookies=cookies_b,
    )
    assert r.status_code == 404
