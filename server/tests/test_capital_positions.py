"""Positions valuation — Spec v0.2 (weekend rule, undirected, per-account BP)."""

from __future__ import annotations

import identity as identity_mod

import capital_positions as cpos
import db
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(
                cur, email, "ZZ Positions Test"
            )


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
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
            cur.execute(
                "DELETE FROM member_capital_prefs WHERE identity_id = %s",
                (iid,),
            )


def test_structure_display_equity():
    t = {
        "strategy": "CUSTOM",
        "asset_class": "equity",
        "legs": [
            {
                "underlier": "TSLA",
                "quantity": 10,
                "side": "BUY",
                "pos_effect": "TO_OPEN",
                "fill_price": 200,
                "asset_class": "equity",
            }
        ],
    }
    assert cpos.structure_display_name(t) == "TSLA"
    qty, avg, basis = cpos.open_qty_and_avg_cost(t)
    assert qty == 10
    assert avg == 200
    assert basis == 2000


def test_equity_like_mistagged_asset_class_no_100x():
    """Import often tags stock legs as equity_option — value must not ×100."""
    t = {
        "strategy": "CUSTOM",
        "asset_class": "equity_option",  # wrong tag
        "legs": [
            {
                "underlier": "TSLA",
                "quantity": 310,
                "side": "BUY",
                "pos_effect": "TO_OPEN",
                "fill_price": 328.38,
                # no expiry/strike/right → equity-like
                "asset_class": "equity_option",
            }
        ],
    }
    assert cpos._is_equity_like(t) is True
    assert cpos._contract_multiplier(t) == 1
    qty, avg, basis = cpos.open_qty_and_avg_cost(t)
    assert qty == 310
    assert abs((basis or 0) - 310 * 328.38) < 0.01
    # Marked value: mid × qty × 1
    mid = 319.43
    assert abs(mid * abs(qty) * cpos._contract_multiplier(t) - 99023.3) < 0.1


def test_positions_valuation_api_and_per_account_bp(client):
    iid = _member("zztest-positions-val@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        a1 = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "BookA", "broker": "fattail", "starting_balance": 10000},
        )
        assert a1.status_code == 200, a1.text
        aid = int(a1.json()["id"])

        bp = client.patch(
            f"/api/me/capital/accounts/{aid}/buying-power",
            cookies=cookies,
            json={
                "buying_power_posture": "self_report",
                "buying_power_value": 250000,
            },
        )
        assert bp.status_code == 200, bp.text
        assert bp.json()["account"]["buying_power_value"] == 250000.0

        # Open equity fill
        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-08-01T14:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 5,
                        "pos_effect": "TO_OPEN",
                        "underlier": "AAPL",
                        "asset_class": "equity",
                        "fill_price": 100,
                    }
                ],
            },
        )
        assert tr.status_code == 200, tr.text
        assert tr.json().get("practice_campaign_id") is None

        val = client.get(
            "/api/me/capital/positions-valuation",
            cookies=cookies,
        )
        assert val.status_code == 200, val.text
        body = val.json()
        assert body.get("valuation_uses_latest_mark") is True
        # Weekend rule: even if marks are old, do not require blank book
        groups = body.get("accounts") or []
        assert any(g["account_id"] == aid for g in groups)
        g = next(x for x in groups if x["account_id"] == aid)
        assert g["cash"] is None  # OD-MC omit
        assert g["buying_power"]["value"] == 250000.0
        assert g["positions"]
        row = g["positions"][0]
        assert row["campaign"] is None  # undirected absence
        assert row["symbol"] == "AAPL"
        # Mark present or at_cost degradation
        assert row["value"] is not None

        # Undirected filter
        und = client.get(
            "/api/me/capital/positions-valuation?undirected=true",
            cookies=cookies,
        )
        assert und.status_code == 200
        assert und.json()["grand_total"]["n"] >= 1
    finally:
        _cleanup(iid)


def test_realized_dd_and_overview_still_ok(client):
    iid = _member("zztest-positions-ov@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/capital/overview", cookies=cookies)
        assert r.status_code == 200, r.text
        assert "accounts" in r.json()
        assert "master_drawdown" in r.json()
    finally:
        _cleanup(iid)


def test_at_ppl_3_open_qty_overstates_partial_close_remainder(client):
    """AT-PPL-3 inverted (PPL2): positions_valuation qty is slot remainder 4.

    open_qty_and_avg_cost(trade) still sees the fill (5) — it is not qty SoR.
    """
    from trade_log_domain.structure import unit_qty

    exp = "2026-12-31"
    open_t = {
        "id": 1,
        "account_id": 1,
        "exec_at": "2026-04-21T10:00:00",
        "strategy": "BUTTERFLY",
        "asset_class": "equity_option",
        "net_price": 0.60,
        "net_side": "DEBIT",
        "legs": [
            {
                "side": "BUY",
                "quantity": 5,
                "pos_effect": "TO_OPEN",
                "underlier": "SPX",
                "expiry": exp,
                "strike": 7080,
                "right": "PUT",
                "fill_price": 1.0,
                "asset_class": "equity_option",
            },
            {
                "side": "SELL",
                "quantity": 10,
                "pos_effect": "TO_OPEN",
                "underlier": "SPX",
                "expiry": exp,
                "strike": 7075,
                "right": "PUT",
                "fill_price": 1.0,
                "asset_class": "equity_option",
            },
            {
                "side": "BUY",
                "quantity": 5,
                "pos_effect": "TO_OPEN",
                "underlier": "SPX",
                "expiry": exp,
                "strike": 7070,
                "right": "PUT",
                "fill_price": 1.0,
                "asset_class": "equity_option",
            },
        ],
    }
    assert unit_qty(open_t) == 5
    fill_qty, _avg, _basis = cpos.open_qty_and_avg_cost(open_t)
    assert fill_qty == 5  # fill helper unchanged

    iid = _member("zztest-ppl2-qty@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        a1 = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "PPL2qty", "broker": "fattail", "starting_balance": 10000},
        )
        assert a1.status_code == 200, a1.text
        aid = int(a1.json()["id"])
        open_r = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-04-21T10:00:00",
                "strategy": "BUTTERFLY",
                "asset_class": "equity_option",
                "net_price": 0.60,
                "net_side": "DEBIT",
                "legs": open_t["legs"],
            },
        )
        assert open_r.status_code == 200, open_r.text
        close_legs = [
            {**open_t["legs"][0], "side": "SELL", "quantity": 1, "pos_effect": "TO_CLOSE"},
            {**open_t["legs"][1], "side": "BUY", "quantity": 2, "pos_effect": "TO_CLOSE"},
            {**open_t["legs"][2], "side": "SELL", "quantity": 1, "pos_effect": "TO_CLOSE"},
        ]
        close_r = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-04-21T14:00:00",
                "strategy": "BUTTERFLY",
                "asset_class": "equity_option",
                "net_price": 0.20,
                "net_side": "CREDIT",
                "legs": close_legs,
            },
        )
        assert close_r.status_code == 200, close_r.text
        val = client.get("/api/me/capital/positions-valuation", cookies=cookies)
        assert val.status_code == 200, val.text
        groups = val.json().get("accounts") or []
        g = next(x for x in groups if x["account_id"] == aid)
        row = next(p for p in g["positions"] if p["trade_id"] == open_r.json()["id"])
        assert row["qty"] == 4
    finally:
        _cleanup(iid)
