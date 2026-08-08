"""Playbook + Practice Campaign (Trader Development Phase 1)."""

from __future__ import annotations

import db
import identity as identity_mod
import practice_spine_domain as psd
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Spine")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql, args in (
                ("DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_trade_log_accounts WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_journal_messages WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_journal_attachments WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_journal_sessions WHERE identity_id = %s", (iid,)),
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
                # Clear self-FK before delete (predecessor_campaign_id)
                (
                    "UPDATE member_practice_campaigns SET predecessor_campaign_id = NULL "
                    "WHERE identity_id = %s",
                    (iid,),
                ),
                ("DELETE FROM member_practice_campaigns WHERE identity_id = %s", (iid,)),
                # Playbook scrapbook (094/095) — cover FK first, then children
                (
                    "UPDATE member_playbook_entries SET cover_attachment_id = NULL "
                    "WHERE identity_id = %s",
                    (iid,),
                ),
                ("DELETE FROM member_playbook_versions WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_evidence WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_stickies WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_pages WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_chapters WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_attachments WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_entries WHERE identity_id = %s", (iid,)),
            ):
                try:
                    cur.execute(sql, args)
                except Exception:
                    pass


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

        # multi-active allowed (DL-259) — second active does not 409
        c2 = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "October", "activate": True},
        )
        assert c2.status_code == 200, c2.text
        camp2 = c2.json()["campaign"]
        assert camp2["status"] == "active"

        listed = client.get("/api/me/practice/campaigns", cookies=cookies)
        assert listed.status_code == 200
        actives = listed.json().get("actives") or []
        assert len(actives) >= 2

        done = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"status": "completed"},
        )
        assert done.status_code == 200, done.text
        assert done.json()["campaign"]["status"] == "completed"

        # October still active (ledger may also be active — multi-active OK)
        active = client.get(
            "/api/me/practice/campaigns/active", cookies=cookies
        )
        assert active.status_code == 200
        assert active.json()["active"] is not None
        assert active.json()["active"]["status"] == "active"
        assert active.json()["active"]["id"] != camp["id"]  # not the completed one
    finally:
        _cleanup(iid)


def test_default_book_campaign_and_import_stamp(client):
    """Silent book default + brokerage import stamps practice_campaign_id."""
    iid = _member("zztest-spine-default-book@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Primary account
        accts = client.get("/api/me/trade-log/accounts", cookies=cookies)
        assert accts.status_code == 200, accts.text
        primary = next(
            (
                a
                for a in (accts.json().get("accounts") or [])
                if a.get("label") == "Primary" or a.get("status") == "active"
            ),
            None,
        )
        assert primary is not None
        aid = int(primary["id"])

        # Ledger is genesis furniture for Primary (GET accounts ensures it)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                ledger = psd.ensure_ledger_campaign(cur, iid, aid)
                ledger_id = int(ledger["id"])

        focus = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Focus season",
                "activate": True,
                "account_id": aid,
            },
        )
        assert focus.status_code == 200, focus.text

        # Prefill prefers ledger for this account when memory empty
        pref = client.get(
            f"/api/me/practice/campaigns/active?account_id={aid}",
            cookies=cookies,
        )
        assert pref.status_code == 200
        assert pref.json()["active"]["id"] == ledger_id

        # Minimal native import body — use generic CSV adapter if available
        # Empty legs still create a CUSTOM trade via thinkorswim-like? Use native JSON.
        native = {
            "format": "fattail.labs.trade_log",
            "model_version": "1.0",
            "trades": [
                {
                    "exec_at": "2026-06-01T14:30:00",
                    "strategy": "CUSTOM",
                    "asset_class": "equity",
                    "order_type": "MKT",
                    "external_order_id": "zz-default-book-1",
                    "legs": [
                        {
                            "side": "BUY",
                            "quantity": 1,
                            "underlier": "SPY",
                            "instrument_type": "equity",
                        }
                    ],
                }
            ],
        }
        import json as _json

        commit = client.post(
            "/api/me/trade-log/import/commit",
            cookies=cookies,
            json={
                "text": _json.dumps(native),
                "adapter": "native",
                "account_id": aid,
                "use_default_campaign": True,
            },
        )
        assert commit.status_code == 200, commit.text
        body = commit.json()
        assert body["created"] >= 1
        assert body.get("practice_campaign_id") == ledger_id

        trades = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&practice_campaign_id={ledger_id}&full=1",
            cookies=cookies,
        )
        assert trades.status_code == 200, trades.text
        rows = trades.json().get("trades") or []
        assert any(t.get("practice_campaign_id") == ledger_id for t in rows)
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
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "Spine", "broker": "fattail"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Season", "activate": True, "account_id": aid},
        ).json()["campaign"]
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

        # Blotter filters by campaign / playbook
        by_camp = client.get(
            f"/api/me/trade-log/trades?practice_campaign_id={camp['id']}&full=1",
            cookies=cookies,
        )
        assert by_camp.status_code == 200, by_camp.text
        assert len(by_camp.json()["trades"]) == 1
        by_pb = client.get(
            f"/api/me/trade-log/trades?playbook_entry_id={pb['id']}&full=1",
            cookies=cookies,
        )
        assert by_pb.status_code == 200
        assert len(by_pb.json()["trades"]) == 1
        none = client.get(
            "/api/me/trade-log/trades?practice_campaign_id=999999999&full=1",
            cookies=cookies,
        )
        assert none.status_code == 200
        assert none.json()["trades"] == []
    finally:
        _cleanup(iid)


def test_playbook_scrapbook_chapters_save_and_evidence(client):
    """Scrapbook: full tree, Save versions, journal evidence staple (094/095)."""
    iid = _member("zztest-spine-scrapbook@labs.test")
    cookies = cookie_for("activator", iid)
    _cleanup(iid)
    try:
        r = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Classic Fly", "body_md": "Size first."},
        )
        assert r.status_code == 200, r.text
        book = r.json()["entry"]
        assert book["title"] == "Classic Fly"
        assert "chapters" in book
        assert len(book["chapters"]) >= 1
        assert book["is_draft"] is True  # new book, no Save yet unless body seeded
        # body_md on create is draft page content — no version until Save
        bid = book["id"]
        ch_id = book["chapters"][0]["id"]
        page_id = book["chapters"][0]["pages"][0]["id"]

        # patch page
        p = client.patch(
            f"/api/me/playbook/pages/{page_id}",
            cookies=cookies,
            json={"body_md": "## Rules\nNo chase."},
        )
        assert p.status_code == 200, p.text

        # new chapter
        c = client.post(
            f"/api/me/playbook/entries/{bid}/chapters",
            cookies=cookies,
            json={"title": "Regime", "blurb": "VIX map"},
        )
        assert c.status_code == 200, c.text
        assert any(ch["title"] == "Regime" for ch in c.json()["entry"]["chapters"])

        # explicit Save → version
        s = client.post(f"/api/me/playbook/entries/{bid}/save", cookies=cookies)
        assert s.status_code == 200, s.text
        assert s.json()["version_n"] >= 1
        assert s.json()["book"]["is_draft"] is False

        # journal evidence
        js = client.post(
            "/api/me/journal-sessions",
            cookies=cookies,
            json={"journal_date": "2026-08-10", "tag": "reflection"},
        )
        assert js.status_code == 200, js.text
        sid = js.json()["session"]["id"]
        ev = client.post(
            f"/api/me/playbook/entries/{bid}/evidence",
            cookies=cookies,
            json={"object_type": "journal_session", "object_id": sid},
        )
        assert ev.status_code == 200, ev.text
        assert len(ev.json()["evidence"]) == 1
        assert ev.json()["evidence"][0]["target"]["status"] != "missing"

        full = client.get(
            f"/api/me/playbook/entries/{bid}?full=1", cookies=cookies
        )
        assert full.status_code == 200
        assert full.json()["entry"]["version_count"] >= 1
    finally:
        _cleanup(iid)


def test_journal_campaign_stamp_default_and_clear(client):
    """OD-1.4 — new sessions default-suggest active campaign; stamp removable."""
    iid = _member("zztest-spine-journal-camp@labs.test")
    cookies = cookie_for("activator", iid)
    _cleanup(iid)  # prior runs may leave a one-session-per-date row
    try:
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Journal season", "activate": True},
        ).json()["campaign"]
        # Default stamp on fresh create
        r = client.post(
            "/api/me/journal-sessions",
            cookies=cookies,
            json={"journal_date": "2026-08-07", "tag": "reflection"},
        )
        assert r.status_code == 200, r.text
        sess = r.json()["session"]
        assert sess.get("practice_campaign_id") == camp["id"], sess
        # Clear stamp
        p = client.patch(
            f"/api/me/journal-sessions/{sess['id']}",
            cookies=cookies,
            json={"practice_campaign_id": None},
        )
        assert p.status_code == 200, p.text
        assert p.json()["session"].get("practice_campaign_id") is None
    finally:
        _cleanup(iid)


def test_campaign_abandon_and_edit(client):
    """B2-2: abandon from active; edit goals on open campaign."""
    iid = _member("zztest-spine-abandon@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "To abandon",
                "activate": True,
                "goals_md": "North Star draft",
                "starting_capital": 10000,
            },
        )
        assert c.status_code == 200, c.text
        camp = c.json()["campaign"]
        assert camp["status"] == "active"

        edited = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"goals_md": "Edited charter", "starting_capital": 12000},
        )
        assert edited.status_code == 200, edited.text
        assert edited.json()["campaign"]["goals_md"] == "Edited charter"
        assert float(edited.json()["campaign"]["starting_capital"]) == 12000

        ab = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"status": "abandoned"},
        )
        assert ab.status_code == 200, ab.text
        assert ab.json()["campaign"]["status"] == "abandoned"
    finally:
        _cleanup(iid)


def test_campaign_pause_and_resume(client):
    """active → planned (pause) → active (resume)."""
    iid = _member("zztest-spine-pause@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        c = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Pause me", "activate": True},
        )
        assert c.status_code == 200, c.text
        camp = c.json()["campaign"]
        assert camp["status"] == "active"

        paused = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"status": "planned"},
        )
        assert paused.status_code == 200, paused.text
        assert paused.json()["campaign"]["status"] == "planned"

        resumed = client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert resumed.status_code == 200, resumed.text
        assert resumed.json()["campaign"]["status"] == "active"
    finally:
        _cleanup(iid)


def test_campaign_list_get_never_auto_creates(client):
    """GET list is read-only — empty stays empty (umpire §4.5.5b)."""
    iid = _member("zztest-spine-coldstart@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_practice_campaign_amendments WHERE identity_id = %s",
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
        r = client.get("/api/me/practice/campaigns", cookies=cookies)
        assert r.status_code == 200, r.text
        assert r.json()["campaigns"] == []
        # Second GET still empty — no side-effect provisioning
        r2 = client.get("/api/me/practice/campaigns", cookies=cookies)
        assert r2.status_code == 200
        assert r2.json()["campaigns"] == []
    finally:
        _cleanup(iid)


def test_campaign_sign_amend_terminal_delete(client):
    """L2-1: first activate signs; multi-field PATCH → N amendments; terminal 422; DELETE signed 409."""
    iid = _member("zztest-spine-lifecycle@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Draft — never signed
        draft = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Lifecycle Season",
                "activate": False,
                "starting_capital": 5000,
                "goals_md": "Preserve capital",
            },
        )
        assert draft.status_code == 200, draft.text
        camp = draft.json()["campaign"]
        assert camp.get("signed_at") is None
        assert camp["status"] == "planned"
        cid = camp["id"]

        # Unsigned draft can hard-delete
        # First create another draft to delete; keep this one for sign path
        to_del = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Disposable draft", "activate": False},
        ).json()["campaign"]
        d = client.delete(
            f"/api/me/practice/campaigns/{to_del['id']}", cookies=cookies
        )
        assert d.status_code == 200, d.text

        # Activate → sign
        act = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert act.status_code == 200, act.text
        signed = act.json()["campaign"]
        assert signed.get("signed_at") is not None
        terms = signed.get("signed_terms")
        assert isinstance(terms, dict)
        assert terms.get("title") == "Lifecycle Season"
        assert float(terms.get("starting_capital")) == 5000.0
        assert signed.get("signed_terms_backfilled") is False

        # Create-as-active also signs
        live = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Live-born", "activate": True, "goals_md": "Go"},
        )
        assert live.status_code == 200, live.text
        assert live.json()["campaign"].get("signed_at") is not None

        # Multi-field charter PATCH → N amendment rows (same amended_at batch ok)
        edited = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={
                "title": "Lifecycle Season v2",
                "starting_capital": 7500,
                "goals_md": "Preserve + size carefully",
            },
        )
        assert edited.status_code == 200, edited.text
        am = client.get(
            f"/api/me/practice/campaigns/{cid}/amendments", cookies=cookies
        )
        assert am.status_code == 200, am.text
        rows = am.json()["amendments"]
        fields = {r["field"] for r in rows}
        assert "title" in fields
        assert "starting_capital" in fields
        assert "goals_md" in fields
        # Immutable signed_terms
        assert edited.json()["campaign"]["signed_terms"]["title"] == "Lifecycle Season"
        assert float(edited.json()["campaign"]["signed_terms"]["starting_capital"]) == 5000.0

        # Pause → status amendment preferred
        paused = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "planned"},
        )
        assert paused.status_code == 200
        am2 = client.get(
            f"/api/me/practice/campaigns/{cid}/amendments", cookies=cookies
        ).json()["amendments"]
        assert any(r["field"] == "status" and r["new_value"] == "planned" for r in am2)

        # Resume does not re-sign
        resumed = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert resumed.status_code == 200
        assert resumed.json()["campaign"]["signed_at"] == signed["signed_at"]

        # Complete → terminal
        done = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"status": "completed"},
        )
        assert done.status_code == 200
        assert done.json()["campaign"]["status"] == "completed"

        # Terminal charter PATCH → 422
        bad = client.patch(
            f"/api/me/practice/campaigns/{cid}",
            cookies=cookies,
            json={"title": "Should not stick"},
        )
        assert bad.status_code == 422, bad.text

        # DELETE signed → 409 (signature is permanence)
        kill = client.delete(
            f"/api/me/practice/campaigns/{cid}", cookies=cookies
        )
        assert kill.status_code == 409, kill.text
    finally:
        _cleanup(iid)


def test_campaign_renew_chain_and_multi_successor(client):
    """L2-2: renew terminal only; 3-chain cycle; two successors from one predecessor."""
    iid = _member("zztest-spine-renew@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        root = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Q1 Season",
                "activate": True,
                "starting_capital": 10000,
                "goals_md": "Stop the bleeding",
            },
        ).json()["campaign"]
        rid = root["id"]

        # Active cannot renew
        no = client.post(
            f"/api/me/practice/campaigns/{rid}/renew", cookies=cookies
        )
        assert no.status_code == 422, no.text

        client.patch(
            f"/api/me/practice/campaigns/{rid}",
            cookies=cookies,
            json={"status": "completed"},
        )

        c2 = client.post(
            f"/api/me/practice/campaigns/{rid}/renew", cookies=cookies
        )
        assert c2.status_code == 200, c2.text
        s2 = c2.json()["campaign"]
        assert s2["status"] == "planned"
        assert s2["predecessor_campaign_id"] == rid
        assert s2.get("cycle_number") == 2
        assert s2.get("signed_at") is None
        assert float(s2.get("starting_capital") or 0) == 10000.0
        assert s2.get("goals_md") == "Stop the bleeding"
        # Law 6 — renew may suffix when root still holds the base title
        assert s2["title"] == "Q1 Season" or s2["title"].startswith("Q1 Season")

        # Activate + complete second → renew to third
        client.patch(
            f"/api/me/practice/campaigns/{s2['id']}",
            cookies=cookies,
            json={"status": "active"},
        )
        client.patch(
            f"/api/me/practice/campaigns/{s2['id']}",
            cookies=cookies,
            json={"status": "completed"},
        )
        c3 = client.post(
            f"/api/me/practice/campaigns/{s2['id']}/renew", cookies=cookies
        )
        assert c3.status_code == 200, c3.text
        s3 = c3.json()["campaign"]
        assert s3["predecessor_campaign_id"] == s2["id"]
        assert s3.get("cycle_number") == 3
        assert s3.get("predecessor", {}).get("id") == s2["id"]

        # Second successor from same root (multi-successor)
        s2b = client.post(
            f"/api/me/practice/campaigns/{rid}/renew", cookies=cookies
        ).json()["campaign"]
        assert s2b["predecessor_campaign_id"] == rid
        assert s2b["id"] != s2["id"]
        assert s2b.get("cycle_number") == 2

        # GET detail lineage
        detail = client.get(
            f"/api/me/practice/campaigns/{s3['id']}", cookies=cookies
        )
        assert detail.status_code == 200
        dcamp = detail.json()["campaign"]
        assert dcamp.get("cycle_number") == 3
        assert dcamp.get("predecessor_campaign_id") == s2["id"]
    finally:
        _cleanup(iid)


def test_structured_practice_ledger_stamp_memory(client):
    """Law 1–3: Primary + ledger at first touch; trade stamps without campaign pick."""
    iid = _member("zztest-spine-structured@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        accts = client.get("/api/me/trade-log/accounts", cookies=cookies)
        assert accts.status_code == 200
        primary = next(
            a for a in accts.json()["accounts"] if a.get("label") == "Primary"
        )
        aid = int(primary["id"])
        with db.transaction() as conn:
            with conn.cursor() as cur:
                led = psd.ensure_ledger_campaign(cur, iid, aid)
                assert led["is_ledger"] is True
                assert led.get("signed_at") is None
                lid = int(led["id"])
                # Ledger cannot complete
                try:
                    psd.patch_campaign(cur, iid, lid, status="completed")
                    assert False, "expected ledger status block"
                except psd.PracticeSpineError as e:
                    assert e.code == 422

        tr = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": aid,
                "broker": "fattail",
                "exec_at": "2026-08-01T15:00:00",
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
        assert body.get("practice_campaign_id") == lid
    finally:
        _cleanup(iid)


def test_campaign_amendments_get_family_b(client):
    """L2-3: GET amendments; 404 for foreign/missing campaign."""
    iid = _member("zztest-spine-amends@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "Amend me", "activate": True, "starting_capital": 1},
        ).json()["campaign"]
        client.patch(
            f"/api/me/practice/campaigns/{camp['id']}",
            cookies=cookies,
            json={"starting_capital": 2},
        )
        r = client.get(
            f"/api/me/practice/campaigns/{camp['id']}/amendments",
            cookies=cookies,
        )
        assert r.status_code == 200
        assert len(r.json()["amendments"]) >= 1
        miss = client.get(
            "/api/me/practice/campaigns/999999999/amendments", cookies=cookies
        )
        assert miss.status_code == 404
    finally:
        _cleanup(iid)
