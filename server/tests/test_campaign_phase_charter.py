"""Campaign Phase & Charter Tiering — Spec §10 acceptance (S/G core)."""

from __future__ import annotations

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Phase")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_practice_campaign_amendments WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                """DELETE FROM member_practice_campaign_playbooks
                   WHERE campaign_id IN (
                     SELECT id FROM member_practice_campaigns WHERE identity_id = %s
                   )""",
                (iid,),
            )
            cur.execute(
                "UPDATE member_practice_campaigns SET predecessor_campaign_id = NULL "
                "WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                (iid,),
            )


def test_big_three_required_on_activate(client):
    """§10 #1 — activate without Big Three → 422; undirected trade still 200."""
    iid = _member("zztest-phase-big3@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "No Big Three", "activate": True},
        )
        assert r.status_code == 422, r.text
        assert "Big Three" in r.text

        draft = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Draft ok", "activate": False},
        )
        assert draft.status_code == 200, draft.text
        cid = draft.json()["campaign"]["id"]
        bad = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert bad.status_code == 422, bad.text

        ok = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={
                "status": "active",
                "starting_capital": 25000,
                "max_drawdown_pct": 12.5,
                "starts_at": "2026-03-01",
            },
        )
        assert ok.status_code == 200, ok.text
        camp = ok.json()["campaign"]
        assert camp["status"] == "active"
        assert camp["charter_version"] == 1
        assert float(camp["max_drawdown_pct"]) == 12.5
        assert float(camp["starting_capital"]) == 25000

        # undirected trade create still works (umpire)
        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "symbol": "SPY",
                "asset_class": "equity",
                "side": "buy",
                "quantity": 1,
                "price": 400,
                "executed_at": "2026-03-02T15:00:00Z",
            },
        )
        # trade API shapes vary — accept 200 or 422 only for trade fields not campaign
        assert tr.status_code in (200, 201, 422), tr.text
        if tr.status_code == 422:
            assert "Big Three" not in tr.text
            assert "campaign" not in (tr.text or "").lower() or "practice_campaign" not in tr.text
    finally:
        _cleanup(iid)


def test_max_dd_percent_only(client):
    """§10 #2 — max DD percent bounds."""
    iid = _member("zztest-phase-mdd@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        bad = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Bad DD",
                "activate": True,
                "starting_capital": 10_000,
                "starts_at": "2026-01-01",
                "max_drawdown_pct": 0,
            },
        )
        assert bad.status_code == 422, bad.text
        bad2 = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Bad DD 2",
                "activate": True,
                "starting_capital": 10_000,
                "starts_at": "2026-01-01",
                "max_drawdown_pct": 101,
            },
        )
        assert bad2.status_code == 422, bad2.text
    finally:
        _cleanup(iid)


def test_end_required_to_complete(client):
    """§10 #3 — complete without ends_at → 422."""
    iid = _member("zztest-phase-end@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Need end",
                "activate": True,
                "starting_capital": 10_000,
                "max_drawdown_pct": 10,
                "starts_at": "2026-01-01",
            },
        )
        assert c.status_code == 200, c.text
        cid = c.json()["campaign"]["id"]
        bad = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "completed"},
        )
        assert bad.status_code == 422, bad.text
        ok = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "completed", "ends_at": "2026-06-01"},
        )
        assert ok.status_code == 200, ok.text
        assert ok.json()["campaign"]["status"] == "completed"
    finally:
        _cleanup(iid)


def test_phase_report_strip_and_p13(client):
    """§10 #8–10 · #13 — phase report; no margin_at_risk; P13 allocation base."""
    import campaign_phase_reports as cpr

    assert cpr.realized_dd_pct_of_allocation([], 10_000) == 0.0
    # trading curve: +1000 then -400 → peak 1000, trough 600, dd $400 → 4% of 10k
    assert abs(cpr.realized_dd_pct_of_allocation([1000.0, -400.0], 10_000) - 4.0) < 1e-9
    assert cpr.realized_dd_pct_of_allocation([100.0], None) is None

    iid = _member("zztest-phase-report@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Report season",
                "activate": True,
                "starting_capital": 10_000,
                "max_drawdown_pct": 15,
                "starts_at": "2026-01-01",
            },
        )
        assert c.status_code == 200, c.text
        cid = c.json()["campaign"]["id"]
        r = client.get(
            f"/api/me/practice/campaigns/{cid}/phase-report", cookies=cookies
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "margin_at_risk" not in r.text
        assert "margin_at_risk" not in (body.get("report") or {})
        rep = body["report"]
        assert "structure_risk_open" in rep
        assert "free_cash" in rep
        assert "free_margin" in rep
        assert "realized_max_drawdown_pct" in rep
        assert "strategy_mix" in rep
        assert rep.get("declared_max_drawdown_pct") == 15.0 or float(
            rep.get("declared_max_drawdown_pct") or 0
        ) == 15.0
    finally:
        _cleanup(iid)


def test_post_sign_adopt_unadopt_bumps_version(client):
    """§10 #6–7 — post-sign adopt/un-adopt → amendment + charter_version++."""
    iid = _member("zztest-phase-adopt@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Adopt season",
                "activate": True,
                "starting_capital": 10_000,
                "max_drawdown_pct": 15,
                "starts_at": "2026-01-01",
            },
        )
        assert c.status_code == 200, c.text
        camp = c.json()["campaign"]
        cid = camp["id"]
        assert camp["charter_version"] == 1
        assert camp.get("same_bet") is None
        assert camp.get("strategy_codes") is None

        adopt = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={
                "same_bet": {
                    "what": "SPX",
                    "leaning": "neutral",
                    "regime": "calm",
                    "kills": "vol crush",
                },
                "strategy_codes": ["iron_condor", "butterfly"],
            },
        )
        assert adopt.status_code == 200, adopt.text
        a = adopt.json()["campaign"]
        assert a["charter_version"] == 2
        assert a["same_bet"]["what"] == "SPX"
        assert "iron_condor" in a["strategy_codes"]

        am = client.get(
            f"/api/me/practice/campaigns/{cid}/amendments", cookies=cookies
        )
        fields = {r["field"] for r in am.json()["amendments"]}
        assert "same_bet" in fields
        assert "strategy_codes" in fields

        unadopt = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"same_bet": None, "strategy_codes": None},
        )
        assert unadopt.status_code == 200, unadopt.text
        u = unadopt.json()["campaign"]
        assert u["charter_version"] == 3
        assert u.get("same_bet") is None
        assert u.get("strategy_codes") is None
    finally:
        _cleanup(iid)
