"""B1 bounds CRUD · Two Roles · critical rejects goal (Spec #17–#18)."""

from __future__ import annotations

import db
import identity as identity_mod
import practice_spine_domain as psd
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Bounds")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql in (
                "DELETE FROM member_practice_campaign_bounds WHERE identity_id = %s",
                "DELETE FROM member_practice_campaign_amendments WHERE identity_id = %s",
                "DELETE FROM member_practice_campaign_memory WHERE identity_id = %s",
                "DELETE FROM member_practice_campaign_playbooks WHERE campaign_id IN "
                "(SELECT id FROM member_practice_campaigns WHERE identity_id = %s)",
                "UPDATE member_practice_campaigns SET predecessor_campaign_id = NULL "
                "WHERE identity_id = %s",
                "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
            ):
                try:
                    cur.execute(sql, (iid,))
                except Exception:
                    pass


def _charter(client, cookies, title: str = "Bound charter") -> dict:
    r = client.post(
        "/api/me/practice/campaigns",
        cookies=cookies,
        json={"title": title, "activate": True, "starting_capital": 50000},
    )
    assert r.status_code == 200, r.text
    return r.json()["campaign"]


def test_bounds_crud_role_and_critical_rejects_goal(client):
    iid = _member("zztest-bounds-role@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        camp = _charter(client, cookies)
        cid = camp["id"]

        # Boundary with critical
        b = client.post(
            f"/api/me/practice/campaigns/{cid}/bounds",
            cookies=cookies,
            json={
                "role": "boundary",
                "attribute": "win_rate",
                "range_low": 40,
                "range_high": 60,
                "is_critical": True,
                "n_floor": 20,
            },
        )
        assert b.status_code == 200, b.text
        bound = b.json()["bound"]
        assert bound["role"] == "boundary"
        assert bound["is_critical"] is True
        assert bound["range_low"] == 40.0

        # Goal ok
        g = client.post(
            f"/api/me/practice/campaigns/{cid}/bounds",
            cookies=cookies,
            json={
                "role": "goal",
                "attribute": "risk_to_reward",
                "range_low": 12,
                "range_high": None,
            },
        )
        assert g.status_code == 200, g.text
        assert g.json()["bound"]["role"] == "goal"
        assert g.json()["bound"]["is_critical"] is False

        # Goal + critical → 422 (#18)
        bad = client.post(
            f"/api/me/practice/campaigns/{cid}/bounds",
            cookies=cookies,
            json={
                "role": "goal",
                "attribute": "drawdown",
                "range_high": 15,
                "is_critical": True,
            },
        )
        assert bad.status_code == 422, bad.text

        # Patch goal to critical → 422
        gid = g.json()["bound"]["id"]
        bad2 = client.patch(
            f"/api/me/practice/campaigns/{cid}/bounds/{gid}",
            cookies=cookies,
            json={"is_critical": True},
        )
        assert bad2.status_code == 422, bad2.text

        listed = client.get(
            f"/api/me/practice/campaigns/{cid}/bounds", cookies=cookies
        )
        assert listed.status_code == 200
        assert len(listed.json()["bounds"]) == 2

        # Ledger rejects bounds
        accts = client.get("/api/me/trade-log/accounts", cookies=cookies)
        assert accts.status_code == 200
        accounts = accts.json()["accounts"]
        aid = int(accounts[0]["id"])
        with db.transaction() as conn:
            with conn.cursor() as cur:
                led = psd.ensure_ledger_campaign(cur, iid, aid)
                lid = int(led["id"])
        led_b = client.post(
            f"/api/me/practice/campaigns/{lid}/bounds",
            cookies=cookies,
            json={
                "role": "boundary",
                "attribute": "win_rate",
                "range_low": 40,
                "range_high": 60,
            },
        )
        assert led_b.status_code == 422, led_b.text
    finally:
        _cleanup(iid)


def test_journey_shape_with_win_rate_bound_computes_extension(client):
    """B3/J1: enough closed P&Ls → win_rate axis not gathering forever."""
    iid = _member("zztest-journey-ext@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Shape season", "activate": True},
        ).json()["campaign"]
        cid = camp["id"]
        aid = camp["account_id"]
        client.post(
            f"/api/me/practice/campaigns/{cid}/bounds",
            cookies=cookies,
            json={
                "role": "boundary",
                "attribute": "win_rate",
                "range_low": 40,
                "range_high": 60,
                "n_floor": 3,
            },
        )
        # 2 wins + 2 losses = 50% in band
        for i, pnl in enumerate([100, -50, 80, -40]):
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=cookies,
                json={
                    "account_id": aid,
                    "practice_campaign_id": cid,
                    "broker": "fattail",
                    "exec_at": f"2026-06-0{i+1}T15:00:00",
                    "strategy": "CUSTOM",
                    "asset_class": "equity",
                    "pnl_amount": pnl,
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
            assert r.status_code == 200, r.text
        shape = client.get(
            f"/api/me/practice/campaigns/{cid}/journey-shape",
            cookies=cookies,
        )
        assert shape.status_code == 200, shape.text
        axes = shape.json()["shape"]["axes"]
        wr = next(a for a in axes if a["attribute"] == "win_rate")
        assert wr["state"] != "gathering", wr
        assert wr["extension"] is not None
        assert wr["extension"] >= 0.99  # 50% in 40–60 → full alignment
    finally:
        _cleanup(iid)


def test_journey_shape_ledger_404_and_invitation(client):
    """J1-0 / #20: ledger → 404; zero-bound charter → invitation payload."""
    iid = _member("zztest-journey-shape@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        accts = client.get("/api/me/trade-log/accounts", cookies=cookies)
        assert accts.status_code == 200
        aid = int(accts.json()["accounts"][0]["id"])
        with db.transaction() as conn:
            with conn.cursor() as cur:
                led = psd.ensure_ledger_campaign(cur, iid, aid)
                lid = int(led["id"])
        r404 = client.get(
            f"/api/me/practice/campaigns/{lid}/journey-shape", cookies=cookies
        )
        assert r404.status_code == 404, r404.text

        camp = _charter(client, cookies, "Empty fingerprint")
        cid = camp["id"]
        inv = client.get(
            f"/api/me/practice/campaigns/{cid}/journey-shape", cookies=cookies
        )
        assert inv.status_code == 200, inv.text
        shape = inv.json()["shape"]
        assert shape["kind"] == "invitation"
        assert shape["axes"] == []
    finally:
        _cleanup(iid)


def test_fill_after_ends_at_logs_with_window_variance(client):
    """B2-1 / #8: trade after ends_at succeeds; quiet trading_window variance."""
    iid = _member("zztest-bounds-window@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Term window",
                "activate": True,
                "starts_at": "2026-01-01",
                "ends_at": "2026-01-31",
            },
        )
        assert camp.status_code == 200, camp.text
        cid = camp.json()["campaign"]["id"]
        aid = camp.json()["campaign"]["account_id"]
        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "practice_campaign_id": cid,
                "broker": "fattail",
                "exec_at": "2026-03-15T15:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
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
        body = tr.json()
        notes = body.get("charter_variance") or []
        assert any(n.get("attribute") == "trading_window" for n in notes), body
    finally:
        _cleanup(iid)


def test_bounds_post_sign_records_amendment(client):
    iid = _member("zztest-bounds-amend@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        camp = _charter(client, cookies, "Amend bounds")
        cid = camp["id"]
        assert camp.get("signed_at")  # activate signs
        r = client.post(
            f"/api/me/practice/campaigns/{cid}/bounds",
            cookies=cookies,
            json={
                "role": "boundary",
                "attribute": "position_size",
                "range_low": 1,
                "range_high": 2,
            },
        )
        assert r.status_code == 200, r.text
        am = client.get(
            f"/api/me/practice/campaigns/{cid}/amendments", cookies=cookies
        )
        assert am.status_code == 200
        fields = [a["field"] for a in am.json()["amendments"]]
        assert any(f.startswith("bound.") for f in fields)
    finally:
        _cleanup(iid)
