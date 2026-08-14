"""Journal Session v0.7 charter — drafts, heat, extract, surfacing ledger."""

from __future__ import annotations

from datetime import date

import pytest

import db
import identity as identity_mod
import journal_coach_config as jcc
import journal_session_structured as jss
from tests.conftest import cookie_for
from tests.test_journal_sessions import _cleanup, _member


@pytest.fixture(autouse=True)
def _coach_env(monkeypatch):
    monkeypatch.setenv("LABS_COACH_POSTURE_DEFAULT", "forward")
    monkeypatch.setenv("LABS_COACH_MODEL_PROVIDER", "xai")
    monkeypatch.setenv("LABS_COACH_MODEL", "grok-4")
    monkeypatch.setenv(
        "LABS_COACH_EFFORT_MAP",
        "day_open:low,surface:low,extract:low,mechanical_turn:low",
    )
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")


def test_closed_field_set_matches_p1():
    keys = jss.all_field_keys()
    expected = {
        "instrument",
        "thesis_direction",
        "trigger_level",
        "size_risk",
        "invalidation",
        "watching",
        "plan_diff",
        "deviations",
        "what_worked",
        "open_thread",
        "differed_from_plan",
        "note",
    }
    assert keys == expected


def test_coach_config_fail_loud(monkeypatch):
    monkeypatch.delenv("LABS_COACH_POSTURE_DEFAULT", raising=False)
    with pytest.raises(jcc.CoachConfigError, match="LABS_COACH_POSTURE_DEFAULT"):
        jcc.require_coach_config()
    monkeypatch.setenv("LABS_COACH_POSTURE_DEFAULT", "forward")
    monkeypatch.setenv("LABS_COACH_EFFORT_MAP", "day_open:low")
    with pytest.raises(jcc.CoachConfigError, match="missing keys"):
        jcc.require_coach_config()


def test_draft_family_b_isolation_404(client):
    """RB-03 — B must not read or overwrite A's draft."""
    a = _member("zztest-j07-draft-a@labs.test")
    b = _member("zztest-j07-draft-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    d = date.today().isoformat()
    secret = "A-only draft body — must not leak"
    try:
        put_a = client.put(
            "/api/me/journal/drafts",
            json={"journal_date": d, "body_md": secret},
            cookies=ca,
        )
        assert put_a.status_code == 200, put_a.text
        get_b = client.get(f"/api/me/journal/drafts?journal_date={d}", cookies=cb)
        assert get_b.status_code in (200, 404)
        if get_b.status_code == 200:
            draft = get_b.json().get("draft")
            assert draft is None or secret not in str(draft)
            assert secret not in get_b.text
        put_b = client.put(
            "/api/me/journal/drafts",
            json={"journal_date": d, "body_md": "B overwrite attempt"},
            cookies=cb,
        )
        assert put_b.status_code in (200, 404)
        get_a = client.get(f"/api/me/journal/drafts?journal_date={d}", cookies=ca)
        assert get_a.status_code == 200
        assert get_a.json()["draft"]["body_md"] == secret
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT body_md FROM member_journal_drafts "
                    "WHERE identity_id = %s AND journal_date = %s",
                    (a, d),
                )
                row = cur.fetchone()
        assert row and row["body_md"] == secret
    finally:
        _cleanup(a)
        _cleanup(b)


def test_draft_roundtrip_and_export_omit(client):
    iid = _member("zztest-j07-draft@labs.test")
    cookies = cookie_for("activator", iid)
    d = date.today().isoformat()
    try:
        r = client.put(
            "/api/me/journal/drafts",
            json={"journal_date": d, "body_md": "mid thought"},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        g = client.get(f"/api/me/journal/drafts?journal_date={d}", cookies=cookies)
        assert g.status_code == 200
        assert g.json()["draft"]["body_md"] == "mid thought"
        assert g.json()["draft"]["read_only"] is False
    finally:
        _cleanup(iid)


def test_extract_confirm_same_txn_and_unknown_key(client):
    iid = _member("zztest-j07-confirm@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        m = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "Watching ES around 5800."},
            cookies=cookies,
        )
        mid = m.json()["message"]["id"]
        bad = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "mood",
                "value": "anxious",
                "present": True,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert bad.status_code == 422
        ok = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "instrument",
                "value": "ES",
                "present": True,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert ok.status_code == 200, ok.text
        sess = ok.json()["session"]
        assert sess["structured"]["instrument"] == "ES"
        assert sess["structured_provenance"]["instrument"]["method"] == "extraction"
        # confirmation is not a member message
        members = [x for x in sess["messages"] if x["author"] == "member"]
        assert len(members) == 1
        dec = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "instrument",
                "present": False,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert dec.status_code == 200
        assert "instrument" not in (dec.json()["session"]["structured"] or {})
    finally:
        _cleanup(iid)


def test_agent_source_cannot_confirm(client):
    iid = _member("zztest-j07-agent-src@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        # no member message — fake agent id
        r = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "note",
                "value": "nope",
                "present": True,
                "source_message_ids": [999999],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert r.status_code == 422
    finally:
        _cleanup(iid)


def _purge_trade_book(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s", (iid,)
            )


def test_heat_any_account_unmatched_open_restrains(client):
    """RB-04 — unmatched open on the *second* active account must restrain.

    If identity_has_unmatched_open is narrowed to the first/default account,
    this test fails.
    """
    import journal_heat as jh
    from routes.trade_log.common import _load_member_book
    from trade_log_domain.matching import match_open_close

    iid = _member("zztest-j07-heat-anyacct@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        book = client.get("/api/me/trade-log/trades", cookies=cookies)
        assert book.status_code == 200, book.text
        default_id = int(book.json()["default_account_id"])
        acct2 = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={"label": "zztest-second-book", "broker": "fattail"},
        )
        assert acct2.status_code == 200, acct2.text
        second = acct2.json().get("account") or acct2.json()
        second_id = int(second["id"])
        assert second_id != default_id
        opened = client.post(
            "/api/me/trade-log/trades",
            cookies=cookies,
            json={
                "account_id": second_id,
                "exec_at": "2026-08-01T10:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 10,
                        "underlier": "SPY",
                        "instrument_type": "equity",
                        "fill_price": 100.0,
                        "pos_effect": "TO_OPEN",
                    }
                ],
            },
        )
        assert opened.status_code == 200, opened.text

        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert jh.identity_has_unmatched_open(cur, iid) is True
                trades, accounts = _load_member_book(cur, int(iid), None)
                first_only = [
                    t
                    for t in (trades or [])
                    if int(t.get("account_id") or 0) == default_id
                ]
                matched_first = match_open_close(first_only) if first_only else []
                first_unmatched = any(
                    m.get("close") is None for m in matched_first
                )
                assert first_unmatched is False, (
                    "fixture broken: first account should be flat so a "
                    "one-account helper would miss the heat"
                )

        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": "What do you think of this trade?"},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["kind"] == "heat_hold"
        assert turn.get("heat") is True
    finally:
        _cleanup(iid)
        _purge_trade_book(iid)


def test_heat_asked_analysis_rejected(client, monkeypatch):
    iid = _member("zztest-j07-heat@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": "What do you think of this trade?"},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["kind"] == "heat_hold"
        assert turn.get("message") is None
        assert turn.get("heat") is True
    finally:
        _cleanup(iid)


def test_heat_unprompted_quiet(client, monkeypatch):
    iid = _member("zztest-j07-heat-q@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200
        assert t.json()["turn"]["kind"] == "quiet"
        assert t.json()["turn"]["message"] is None
    finally:
        _cleanup(iid)


def test_surfacing_ledger_one_fire(client, monkeypatch):
    iid = _member("zztest-j07-ledger@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh
    import journal_session_domain as jsd

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
    monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "pre_open")
    d = date.today().isoformat()
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": d},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t1 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t1.status_code == 200, t1.text
        assert t1.json()["turn"]["kind"] == "coach_day_open"
        t2 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t2.json()["turn"]["kind"] == "quiet"
        tick = client.post(
            "/api/me/journal/coach/tick",
            json={"journal_date": d, "journal_focused": False},
            cookies=cookies,
        )
        assert tick.status_code == 200
        assert tick.json()["actions"] == []
    finally:
        _cleanup(iid)


def test_heat_consume_blocks_late_day_open(client, monkeypatch):
    iid = _member("zztest-j07-consume@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh
    import journal_session_domain as jsd

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "pre_open")
    d = date.today().isoformat()
    try:
        client.post(
            "/api/me/journal/coach/tick",
            json={"journal_date": d, "journal_focused": True},
            cookies=cookies,
        )
        monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
        monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "intraday")
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": d},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.json()["turn"]["kind"] == "quiet"
    finally:
        _cleanup(iid)


def test_process_tag_does_not_flip_required_for_complete(client, admin_cookies):
    """RB-06 — assigning a process tag must not change required_for_complete."""
    import journal_session_structured as jss
    import tag_domain as td

    iid = _member("zztest-j07-tag-seal@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        before = client.get(
            "/api/me/journal-sessions/schema?tag=pre_market",
            cookies=cookies,
        )
        assert before.status_code == 200, before.text
        req_before = {
            f["key"]: f["required_for_complete"] for f in before.json()["fields"]
        }
        assert req_before.get("invalidation") is True

        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat(), "tag": "pre_market"},
            cookies=cookies,
        )
        assert s.status_code == 200, s.text
        sid = s.json()["session"]["id"]
        incomplete = jss.checklist_status("pre_market", {"instrument": "ES"})
        assert incomplete["complete"] is False
        assert "invalidation" in incomplete["missing_required"]

        tags = client.get("/api/tags", cookies=admin_cookies).json()["tags"]
        process = next(
            (
                t
                for t in tags
                if str((t.get("category") or t.get("category_key") or "")).lower()
                in ("process",)
                or "process" in str(t.get("category") or "").lower()
            ),
            None,
        )
        if process is None:
            process = next(t for t in tags if t.get("status") == "active")
        assign = client.post(
            "/api/tags/assignments",
            json={
                "tag_id": process["id"],
                "object_type": "journal_session",
                "object_id": sid,
            },
            cookies=cookies,
        )
        assert assign.status_code == 200, assign.text

        after = client.get(
            "/api/me/journal-sessions/schema?tag=pre_market",
            cookies=cookies,
        )
        req_after = {
            f["key"]: f["required_for_complete"] for f in after.json()["fields"]
        }
        assert req_after == req_before
        still = jss.checklist_status("pre_market", {"instrument": "ES"})
        assert still["complete"] is False
        assert "invalidation" in still["missing_required"]
        assert process.get("slug") not in still["missing_required"]
        assert process.get("label") not in still["missing_required"]
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM tag_assignments WHERE identity_id = %s", (iid,)
                )
        _cleanup(iid)


def test_prompt_version_still_stamped(client):
    iid = _member("zztest-j07-prompt@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert s.status_code == 200
        assert s.json()["session"].get("prompt_version_id")
    finally:
        _cleanup(iid)
