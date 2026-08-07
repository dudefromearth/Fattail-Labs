"""Playbook + Practice Campaign (Trader Development Phase 1)."""

from __future__ import annotations

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Spine")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_practice_campaign_playbooks WHERE campaign_id IN "
                "(SELECT id FROM member_practice_campaigns WHERE identity_id = %s)",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_playbook_entries WHERE identity_id = %s",
                (iid,),
            )


def test_playbook_and_campaign_lifecycle(client):
    iid = _member("zztest-spine-lifecycle@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Butterfly rules", "body_md": "No chase."},
        )
        assert r.status_code == 200, r.text
        pb = r.json()["entry"]
        assert pb["title"] == "Butterfly rules"
        assert pb["status"] == "active"

        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "September",
                "playbook_entry_ids": [pb["id"]],
                "activate": True,
            },
        )
        assert c.status_code == 200, c.text
        camp = c.json()["campaign"]
        assert camp["status"] == "active"
        assert pb["id"] in camp["playbook_entry_ids"]

        # single active
        c2 = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "October", "activate": True},
        )
        assert c2.status_code == 409, c2.text

        done = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"status": "completed"},
        )
        assert done.status_code == 200, done.text
        assert done.json()["campaign"]["status"] == "completed"

        active = client.get(
            "/api/me/practice/campaigns/active", cookies=cookies
        )
        assert active.status_code == 200
        assert active.json()["active"] is None
    finally:
        _cleanup(iid)


def test_trade_links_playbook_campaign(client):
    iid = _member("zztest-spine-trade@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        pb = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Rules", "body_md": "x"},
        ).json()["entry"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Season", "activate": True},
        ).json()["campaign"]
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "Spine", "broker": "fattail"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-08-01T15:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity_option",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "asset_class": "equity_option",
                        "underlier": "SPX",
                        "symbol": "SPX",
                        "fill_price": 1.0,
                    }
                ],
                "playbook_entry_id": pb["id"],
                "practice_campaign_id": camp["id"],
                "adherence": "followed",
            },
        )
        assert tr.status_code == 200, tr.text
        body = tr.json()
        assert body.get("playbook_entry_id") == pb["id"]
        assert body.get("practice_campaign_id") == camp["id"]
    finally:
        _cleanup(iid)
