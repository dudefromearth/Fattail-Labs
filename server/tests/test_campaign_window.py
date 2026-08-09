"""Member Campaign Spec v1.3 — window model (M0 + D1).

L5 charters account-free; L4 fill-time eligibility; L3 memory → ledger fallback.
"""

from __future__ import annotations

from datetime import datetime

import db
import identity as identity_mod
import practice_spine_domain as psd
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Window")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql, args in (
                ("DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_trade_log_accounts WHERE identity_id = %s", (iid,)),
                (
                    "DELETE FROM member_practice_campaign_amendments WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_practice_campaign_bounds WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_practice_campaign_memory WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_practice_campaign_playbooks WHERE campaign_id IN "
                    "(SELECT id FROM member_practice_campaigns WHERE identity_id = %s)",
                    (iid,),
                ),
                (
                    "UPDATE member_practice_campaigns SET predecessor_campaign_id = NULL "
                    "WHERE identity_id = %s",
                    (iid,),
                ),
                ("DELETE FROM member_practice_campaigns WHERE identity_id = %s", (iid,)),
            ):
                try:
                    cur.execute(sql, args)
                except Exception:
                    pass


def test_charter_create_account_free(client):
    """M0 — creating a charter does not bind account_id (L5)."""
    iid = _member("zztest-window-m0@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "BookA", "broker": "fattail"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]

        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Account-free season",
                "activate": True,
                "account_id": aid,  # client may still send; server strips
                "starts_at": "2026-01-01",
                "ends_at": "2026-12-31",
            },
        )
        assert c.status_code == 200, c.text
        camp = c.json()["campaign"]
        assert camp.get("account_id") is None, camp
        assert camp.get("is_ledger") is False
    finally:
        _cleanup(iid)


def test_stamp_across_books_and_window_reject(client):
    """D1 — stamp any book into charter when fill in window; reject outside."""
    iid = _member("zztest-window-d1@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        a1 = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "WinA", "broker": "fattail"},
        ).json()["id"]
        a2 = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "WinB", "broker": "fattail"},
        ).json()["id"]

        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Summer window",
                "activate": True,
                "starts_at": "2026-06-01",
                "ends_at": "2026-08-31",
            },
        ).json()["campaign"]
        cid = camp["id"]
        assert camp.get("account_id") is None

        # Fill from book B inside window — L5 multi-book
        ok = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": a2,
                "exec_at": "2026-07-15T15:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPY",
                        "instrument_type": "equity",
                    }
                ],
                "practice_campaign_id": cid,
            },
        )
        assert ok.status_code == 200, ok.text
        assert ok.json()["practice_campaign_id"] == cid
        assert ok.json().get("stamped_by") == "member"

        # Outside window — 422 membership (picker should have filtered)
        bad = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": a1,
                "exec_at": "2026-01-15T15:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "QQQ",
                        "instrument_type": "equity",
                    }
                ],
                "practice_campaign_id": cid,
            },
        )
        assert bad.status_code == 422, bad.text
        assert "window" in bad.json().get("detail", "").lower()
    finally:
        _cleanup(iid)


def test_memory_falls_back_to_ledger_when_window_ends(client):
    """D1-1 — memory of expired charter → silent ledger (L3)."""
    iid = _member("zztest-window-mem@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        aid = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "MemBook", "broker": "fattail"},
        ).json()["id"]

        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Short season",
                "activate": True,
                "starts_at": "2026-03-01",
                "ends_at": "2026-03-31",
            },
        ).json()["campaign"]
        cid = camp["id"]

        # Direct inside window → sets memory
        r1 = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-03-10T12:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "IWM",
                        "instrument_type": "equity",
                    }
                ],
                "practice_campaign_id": cid,
            },
        )
        assert r1.status_code == 200, r1.text

        # No explicit stamp after season ends → ledger
        r2 = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "exec_at": "2026-05-01T12:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "IWM",
                        "instrument_type": "equity",
                    }
                ],
            },
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["practice_campaign_id"] != cid
        with db.transaction() as conn:
            with conn.cursor() as cur:
                led = psd.get_ledger_campaign(cur, iid, aid)
                assert led is not None
                assert body["practice_campaign_id"] == int(led["id"])
    finally:
        _cleanup(iid)


def test_eligible_api_filters_window(client):
    iid = _member("zztest-window-elig@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        aid = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "Elig", "broker": "fattail"},
        ).json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Q3 only",
                "activate": True,
                "starts_at": "2026-07-01",
                "ends_at": "2026-09-30",
            },
        ).json()["campaign"]
        cid = camp["id"]

        inside = client.get(
            f"/api/me/practice/campaigns/eligible?account_id={aid}"
            f"&exec_at=2026-08-01T10:00:00",
            cookies=cookies,
        )
        assert inside.status_code == 200, inside.text
        ids_in = {c["id"] for c in inside.json()["campaigns"]}
        assert cid in ids_in
        assert any(c.get("is_ledger") for c in inside.json()["campaigns"])

        outside = client.get(
            f"/api/me/practice/campaigns/eligible?account_id={aid}"
            f"&exec_at=2026-01-01T10:00:00",
            cookies=cookies,
        )
        assert outside.status_code == 200, outside.text
        ids_out = {c["id"] for c in outside.json()["campaigns"]}
        assert cid not in ids_out
        assert any(c.get("is_ledger") for c in outside.json()["campaigns"])
    finally:
        _cleanup(iid)


def test_campaign_covers_fill_pure():
    """Unit: campaign_covers_fill day atoms."""
    row = {
        "is_ledger": 0,
        "starts_at": datetime(2026, 6, 1),
        "ends_at": datetime(2026, 6, 30),
    }
    assert psd.campaign_covers_fill(row, datetime(2026, 6, 15))
    assert not psd.campaign_covers_fill(row, datetime(2026, 5, 31))
    assert not psd.campaign_covers_fill(row, datetime(2026, 7, 1))
    ledger = {"is_ledger": 1, "starts_at": None, "ends_at": None}
    assert psd.campaign_covers_fill(ledger, datetime(1999, 1, 1))
    open_end = {
        "is_ledger": 0,
        "starts_at": datetime(2026, 1, 1),
        "ends_at": None,
    }
    assert psd.campaign_covers_fill(open_end, datetime(2099, 1, 1))
