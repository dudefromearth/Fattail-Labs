"""Campaign Panel v1 — Six Controls + journey shape."""

from __future__ import annotations

import db
import identity as identity_mod
import practice_spine_domain as psd
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Panel")


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


def _charter(client, cookies, title: str = "Panel charter") -> dict:
    r = client.post(
        "/api/me/practice/campaigns",
        cookies=cookies,
        json={"title": title, "activate": True, "starting_capital": 50000},
    )
    assert r.status_code == 200, r.text
    return r.json()["campaign"]


def test_panel_six_controls_and_ledger_404(client):
    iid = _member("zztest-panel-six@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        accts = client.get("/api/me/trade-log/accounts", cookies=cookies)
        aid = int(accts.json()["accounts"][0]["id"])
        with db.transaction() as conn:
            with conn.cursor() as cur:
                led = psd.ensure_ledger_campaign(cur, iid, aid)
                lid = int(led["id"])
        assert (
            client.get(
                f"/api/me/practice/campaigns/{lid}/panel", cookies=cookies
            ).status_code
            == 404
        )

        camp = _charter(client, cookies)
        cid = camp["id"]
        p = client.get(
            f"/api/me/practice/campaigns/{cid}/panel", cookies=cookies
        )
        assert p.status_code == 200, p.text
        panel = p.json()["panel"]
        assert len(panel["controls"]) == 6
        assert panel["can_edit"] is False
        assert [c["attribute"] for c in panel["controls"]] == [
            "win_rate",
            "risk_to_reward",
            "drawdown",
            "avg_win_loss",
            "profit_factor",
            "sharpe",
        ]
        wr = panel["controls"][0]
        assert wr["range_low"] == 40.0
        assert wr["range_high"] == 60.0
        assert wr["display_low"] == 0.0
        assert wr["display_high"] == 100.0

        shape = client.get(
            f"/api/me/practice/campaigns/{cid}/journey-shape", cookies=cookies
        ).json()["shape"]
        assert shape["kind"] == "shape"
        assert len(shape["axes"]) == 6
    finally:
        _cleanup(iid)


def _grant_admin(iid: int) -> None:
    """H1: live derive_role — set role_override, not JWT alone."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE identities SET role_override = 'administrator' WHERE identity_id = %s",
                (iid,),
            )


def test_admin_patch_panel_writes_amendment(client):
    iid = _member("zztest-panel-admin@labs.test")
    _grant_admin(iid)
    admin = cookie_for("administrator", iid)
    try:
        camp = _charter(client, admin, "Admin dial")
        cid = camp["id"]
        # Clear override → member cannot patch
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (iid,),
                )
        member = cookie_for("activator", iid)
        denied = client.patch(
            f"/api/me/practice/campaigns/{cid}/panel/win_rate",
            cookies=member,
            json={"range_low": 35, "range_high": 65},
        )
        assert denied.status_code in (401, 403), denied.text

        _grant_admin(iid)
        ok = client.patch(
            f"/api/me/practice/campaigns/{cid}/panel/win_rate",
            cookies=admin,
            json={
                "range_low": 35,
                "range_high": 65,
                "display_low": 0,
                "display_high": 100,
            },
        )
        assert ok.status_code == 200, ok.text
        wr = next(
            c
            for c in ok.json()["panel"]["controls"]
            if c["attribute"] == "win_rate"
        )
        assert wr["range_low"] == 35.0
        assert wr["range_high"] == 65.0

        am = client.get(
            f"/api/me/practice/campaigns/{cid}/amendments", cookies=admin
        )
        assert am.status_code == 200
        fields = [a["field"] for a in am.json()["amendments"]]
        assert any("win_rate" in f for f in fields)
    finally:
        _cleanup(iid)


def test_win_rate_extension_after_n_floor(client):
    iid = _member("zztest-panel-ext@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "PanelBook", "broker": "fattail"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Shape season",
                "activate": True,
                "starts_at": "2026-06-01",
                "ends_at": "2026-06-30",
            },
        )
        assert camp.status_code == 200, camp.text
        cid = camp.json()["campaign"]["id"]
        assert camp.json()["campaign"].get("account_id") is None  # L5
        # Lower n_floor via domain (panel house seed is 20)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                import campaign_panel as cpanel

                cpanel.patch_control(
                    cur, iid, cid, "win_rate", n_floor=3
                )
        # Inside window stamps to charter; outside window → ledger only (L4)
        for day, pnl, stamp in [
            ("2026-06-01", 100, True),
            ("2026-06-02", -50, True),
            ("2026-06-03", 80, True),
            ("2026-06-04", -40, True),
            ("2026-07-15", 999, False),  # after ends_at — not stampable
        ]:
            body = {
                "account_id": aid,
                "broker": "fattail",
                "exec_at": f"{day}T15:00:00",
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
            }
            if stamp:
                body["practice_campaign_id"] = cid
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=cookies,
                json=body,
            )
            assert r.status_code == 200, r.text
        p = client.get(
            f"/api/me/practice/campaigns/{cid}/panel", cookies=cookies
        ).json()["panel"]
        assert p["window_from"] == "2026-06-01"
        assert p["window_to"] == "2026-06-30"
        assert p["sample_n"] == 4  # July fill excluded
        wr = next(c for c in p["controls"] if c["attribute"] == "win_rate")
        assert wr["state"] != "gathering", wr
        assert wr["reading"] == 50.0  # 2/4
        assert wr["extension"] is not None
        assert wr["extension"] >= 0.99  # 50% in 40–60
    finally:
        _cleanup(iid)
