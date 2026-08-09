"""Accounts & Capital stack — Capital v0.3 · Funding v0.2 · Amendment undirected."""

from __future__ import annotations

import identity as identity_mod

import capital_domain as cap
import db
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(
                cur, email, "ZZ Capital Test"
            )


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_account_cash_movements WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_capital_prefs WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_trade_log_legs WHERE trade_id IN "
                "(SELECT id FROM member_trade_log_trades WHERE identity_id = %s)",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                (iid,),
            )


def test_realized_dd_dollars_pure():
    assert cap.realized_dd_dollars([]) == 0.0
    assert cap.realized_dd_dollars([100, -50]) == 50.0
    # Peak 150, trough 50 → DD 100
    assert cap.realized_dd_dollars([100, 50, -100]) == 100.0


def test_capital_overview_balance_and_movements(client):
    iid = _member("zztest-capital-overview@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={
                "label": "CapBook",
                "broker": "fattail",
                "starting_balance": 10000,
            },
        )
        assert acct.status_code == 200, acct.text
        aid = int(acct.json()["id"])
        assert acct.json().get("starting_balance") == 10000.0

        # Fill P&L
        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-08-01T12:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "pnl_amount": 250,
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "underlier": "SPY",
                        "instrument_type": "equity",
                        "fill_price": 1.0,
                    }
                ],
            },
        )
        assert tr.status_code == 200, tr.text
        assert tr.json().get("practice_campaign_id") is None

        mv = client.post(
            f"/api/me/capital/accounts/{aid}/movements",
            cookies=cookies,
            json={"amount": 500, "note": "wire in"},
        )
        assert mv.status_code == 200, mv.text
        assert mv.json()["movement"]["amount"] == 500.0

        # Zero amount rejected
        bad = client.post(
            f"/api/me/capital/accounts/{aid}/movements",
            cookies=cookies,
            json={"amount": 0},
        )
        assert bad.status_code == 422

        ov = client.get("/api/me/capital/overview", cookies=cookies)
        assert ov.status_code == 200, ov.text
        body = ov.json()
        assert body["total_net_capital"] == 10000 + 250 + 500
        row = next(a for a in body["accounts"] if a["id"] == aid)
        assert row["current_balance"] == 10750.0
        assert row["fill_pnl_sum"] == 250.0
        assert row["movements_sum"] == 500.0
        assert body["master_drawdown"]["sample_n"] >= 1
        # Trading curve only fill P&L — one +250 → realized DD 0
        assert body["master_drawdown"]["realized_dd_dollars"] == 0.0
    finally:
        _cleanup(iid)


def test_master_dd_fill_only_ignores_cash(client):
    """Funding §3.4 — master DD on trading curve (fill P&L only)."""
    iid = _member("zztest-capital-dd@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={
                "label": "DDBook",
                "broker": "fattail",
                "starting_balance": 50000,
            },
        )
        aid = int(acct.json()["id"])
        client.post(
            f"/api/me/capital/accounts/{aid}/movements",
            cookies=cookies,
            json={"amount": -10000, "note": "withdraw"},
        )
        for pnl in [1000, -600, -500]:
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=cookies,
                json={
                    "account_id": aid,
                    "exec_at": "2026-08-02T12:00:00",
                    "strategy": "CUSTOM",
                    "asset_class": "equity",
                    "pnl_amount": pnl,
                    "legs": [
                        {
                            "side": "BUY",
                            "quantity": 1,
                            "underlier": "QQQ",
                            "instrument_type": "equity",
                            "fill_price": 1.0,
                        }
                    ],
                },
            )
            assert r.status_code == 200, r.text
        ov = client.get("/api/me/capital/overview", cookies=cookies).json()
        # Peak 1000, trough -100 → DD 1100
        assert ov["master_drawdown"]["realized_dd_dollars"] == 1100.0
        # Balance includes start + fills + movements
        fills = 1000 - 600 - 500
        assert ov["total_net_capital"] == 50000 + fills - 10000
    finally:
        _cleanup(iid)


def test_patch_prefs_and_confirm(client):
    iid = _member("zztest-capital-prefs@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.patch(
            "/api/me/capital/prefs",
            cookies=cookies,
            json={
                "tolerated_master_drawdown": 8,
                "tolerated_master_drawdown_form": "percent",
                "confirm_balances": True,
            },
        )
        assert r.status_code == 200, r.text
        prefs = r.json()["prefs"]
        assert prefs["tolerated_master_drawdown"] == 8.0
        assert prefs["balances_confirmed_at"] is not None
    finally:
        _cleanup(iid)
