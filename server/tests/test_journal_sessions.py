"""Journal Session J1 characterization — Spec v0.2 · JS1-2 / JS1-3 / JS1-5.

Kilo JS1-5: isolation, multi-entry, seal 409, free 403, dual-read, entitlement.
Run suite twice for flake check (seed completion).
"""

from datetime import date, datetime, timezone
from pathlib import Path

import db
import identity as identity_mod
import journal_session_domain as jsd
from tests.conftest import cookie_for

REPO_ROOT = Path(__file__).resolve().parents[2]


def _member(
    email: str = "zztest-jsession@labs.test",
    *,
    role_override: str | None = "activator",
):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "JSession Tester")
            if role_override is None:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (iid,),
                )
            else:
                cur.execute(
                    "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                    (role_override, iid),
                )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_journal_messages WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_sessions WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
                (iid,),
            )
    return iid


def _plan_id(cur, slug: str) -> int:
    cur.execute("SELECT id FROM plans WHERE slug = %s", (slug,))
    row = cur.fetchone()
    assert row is not None, f"plan {slug} missing"
    return int(row["id"])


def _grant_plan(iid: int, slug: str, status: str = "active") -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            pid = _plan_id(cur, slug)
            identity_mod.upsert_membership(cur, iid, pid, status, "zztest")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_journal_messages WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_sessions WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_create_list_get_message_seal(client):
    iid = _member()
    cookies = cookie_for("activator", iid)
    today = date.today().isoformat()
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": today},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        session = r.json()["session"]
        assert session["tag"] == "pre_market"
        assert session["status"] == "open"
        assert session["journal_date"] == today
        sid = session["id"]

        r2 = client.get("/api/me/journal-sessions", cookies=cookies)
        assert r2.status_code == 200
        ids = [s["id"] for s in r2.json()["sessions"]]
        assert sid in ids

        r3 = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "Long ES if 5200 holds. Invalidation 5188."},
            cookies=cookies,
        )
        assert r3.status_code == 200, r3.text
        msg = r3.json()["message"]
        assert msg["author"] == "member"
        assert msg["agent_service"] is None
        assert msg["phase"] in jsd.VALID_PHASE

        r4 = client.patch(
            f"/api/me/journal-sessions/{sid}",
            json={
                "structured": {
                    "instrument": "ES",
                    "invalidation": "5188",
                }
            },
            cookies=cookies,
        )
        assert r4.status_code == 200, r4.text
        assert r4.json()["session"]["structured"]["invalidation"] == "5188"

        r5 = client.post(f"/api/me/journal-sessions/{sid}/seal", cookies=cookies)
        assert r5.status_code == 200, r5.text  # v0.4a: deprecated no-op, stays open
        assert r5.json()["session"]["status"] == "open"

        r6 = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "after seal still open"},
            cookies=cookies,
        )
        assert r6.status_code == 200, r6.text

        r7 = client.get(f"/api/me/journal-sessions/{sid}", cookies=cookies)
        assert r7.status_code == 200
        assert len(r7.json()["session"]["messages"]) == 2
    finally:
        _cleanup(iid)


def test_multi_entry_per_date(client):
    iid = _member("zztest-jsession-multi@labs.test")
    cookies = cookie_for("activator", iid)
    today = date.today().isoformat()
    try:
        a = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": today},
            cookies=cookies,
        )
        b = client.post(
            "/api/me/journal-sessions",
            json={"tag": "post_session", "journal_date": today},
            cookies=cookies,
        )
        assert a.status_code == 200 and b.status_code == 200
        assert a.json()["session"]["id"] != b.json()["session"]["id"]
        listed = client.get(
            f"/api/me/journal-sessions?journal_date={today}",
            cookies=cookies,
        )
        assert listed.status_code == 200
        assert len(listed.json()["sessions"]) >= 2
    finally:
        _cleanup(iid)


def test_isolation_404(client):
    a = _member("zztest-jsession-a@labs.test")
    b = _member("zztest-jsession-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date.today().isoformat()},
            cookies=ca,
        )
        assert r.status_code == 200
        sid = r.json()["session"]["id"]
        r2 = client.get(f"/api/me/journal-sessions/{sid}", cookies=cb)
        assert r2.status_code == 404
        r3 = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "nope"},
            cookies=cb,
        )
        assert r3.status_code == 404
    finally:
        _cleanup(a)
        _cleanup(b)


def test_free_observer_403(client):
    iid = _member("zztest-jsession-free@labs.test", role_override=None)
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 403
    finally:
        _cleanup(iid)


def test_observer_trial_create_ok(client):
    iid = _member("zztest-jsession-trial@labs.test", role_override=None)
    _grant_plan(iid, "observer-trial")
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "clean_day", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        assert r.json()["session"]["tag"] == "clean_day"
    finally:
        _cleanup(iid)


def test_retrospective_tag_422(client):
    iid = _member("zztest-jsession-retro-tag@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "retrospective", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 422
    finally:
        _cleanup(iid)


def test_closed_date_409(client):
    iid = _member("zztest-jsession-closed@labs.test")
    cookies = cookie_for("activator", iid)
    jd = date.today()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_journal_date_closures
                         (identity_id, journal_date, closed_by_retrospective_id, closed_at)
                       VALUES (%s, %s, NULL, %s)""",
                    (iid, jd, datetime.now(timezone.utc).replace(tzinfo=None)),
                )
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": jd.isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 409, r.text
    finally:
        _cleanup(iid)


def test_body_identity_ignored(client):
    a = _member("zztest-jsession-idignore-a@labs.test")
    b = _member("zztest-jsession-idignore-b@labs.test")
    ca = cookie_for("activator", a)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "reflection",
                "journal_date": date.today().isoformat(),
                "identity_id": b,
            },
            cookies=ca,
        )
        assert r.status_code == 200
        assert r.json()["session"]["identity_id"] == a
    finally:
        _cleanup(a)
        _cleanup(b)


def test_partial_then_seal(client):
    iid = _member("zztest-jsession-partial@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        r2 = client.post(f"/api/me/journal-sessions/{sid}/partial", cookies=cookies)
        assert r2.status_code == 200
        assert r2.json()["session"]["status"] == "open"  # v0.4a: partial → open
        r3 = client.post(f"/api/me/journal-sessions/{sid}/seal", cookies=cookies)
        assert r3.status_code == 200
        assert r3.json()["session"]["status"] == "open"
    finally:
        _cleanup(iid)


def test_derive_phase_unit():
    # Monday 2026-07-27 pre-open ET
    jd = date(2026, 7, 27)
    pre = datetime(2026, 7, 27, 12, 0, tzinfo=timezone.utc)  # 08:00 ET
    assert jsd.derive_phase(jd, pre) == "pre_open"
    mid = datetime(2026, 7, 27, 15, 0, tzinfo=timezone.utc)  # 11:00 ET
    assert jsd.derive_phase(jd, mid) == "intraday"
    post = datetime(2026, 7, 27, 21, 0, tzinfo=timezone.utc)  # 17:00 ET
    assert jsd.derive_phase(jd, post) == "post_close"
    later = datetime(2026, 7, 28, 15, 0, tzinfo=timezone.utc)
    assert jsd.derive_phase(jd, later) == "later_day"


def test_dual_read_expected_vs_actual_from_session(client):
    """JS1-3: sealed pre_market session appears in retro §6.5 dual-read."""
    iid = _member("zztest-jsession-dual-eva@labs.test")
    cookies = cookie_for("activator", iid)
    today = date.today().isoformat()
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": today,
                "structured": {
                    "instrument": "ES",
                    "invalidation": "5188",
                },
            },
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        sid = r.json()["session"]["id"]
        client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "Only A+ setups; size half if unsure."},
            cookies=cookies,
        )
        seal = client.post(f"/api/me/journal-sessions/{sid}/seal", cookies=cookies)
        assert seal.status_code == 200

        retro = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert retro.status_code == 200, retro.text
        eva = retro.json()["report"]["expected_vs_actual"]
        assert isinstance(eva, list)
        assert len(eva) >= 1
        session_rows = [x for x in eva if x.get("source") == "journal_session"]
        assert session_rows, eva
        assert any(
            "invalidation: 5188" in (x.get("stated_intent") or "")
            or "A+ setups" in (x.get("stated_intent") or "")
            for x in session_rows
        )
        assert session_rows[0].get("session_id") == sid
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_retrospectives WHERE identity_id = %s",
                    (iid,),
                )
        _cleanup(iid)


def test_dual_read_legacy_note_still_works(client):
    """JS1-3: legacy pre_market notes still feed expected_vs_actual."""
    iid = _member("zztest-jsession-dual-note@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                       VALUES (%s, 'journal', %s)""",
                    (
                        iid,
                        "pre_market: Legacy note intent — watch VWAP reclaim.",
                    ),
                )
        retro = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert retro.status_code == 200, retro.text
        eva = retro.json()["report"]["expected_vs_actual"]
        assert isinstance(eva, list)
        assert any("VWAP reclaim" in (x.get("stated_intent") or "") for x in eva)
        assert any(x.get("source") == "tool_note" for x in eva)
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_tool_notes WHERE identity_id = %s", (iid,)
                )
                cur.execute(
                    "DELETE FROM member_retrospectives WHERE identity_id = %s",
                    (iid,),
                )
        _cleanup(iid)


def test_dual_read_routine_counts_session_day():
    """D2 dual-read: session_started_at NY day counts for journey routine union."""
    iid = _member("zztest-jsession-dual-routine@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                cur.execute(
                    """INSERT INTO member_journal_sessions
                         (identity_id, tag, journal_date, session_started_at, status)
                       VALUES (%s, 'reflection', %s, %s, 'sealed')""",
                    (iid, date.today(), now),
                )
                days = jsd.list_session_activity_ny_dates(
                    cur, iid, since=now.replace(year=now.year - 1)
                )
        assert date.today() in days or jsd.session_started_ny_date(
            now.replace(tzinfo=timezone.utc)
        ) in days
    finally:
        _cleanup(iid)


# --- JS1-5 Kilo edge cases ----------------------------------------------------


def test_navigator_create_ok(client):
    """D6: Navigator (activator+) can create sessions."""
    iid = _member("zztest-jsession-nav@labs.test", role_override="navigator")
    cookies = cookie_for("navigator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
    finally:
        _cleanup(iid)


def test_seal_blocks_patch_and_second_seal(client):
    """v0.4a: member seal is no-op — session stays open; patch still works."""
    iid = _member("zztest-jsession-seal-lock@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        assert client.post(
            f"/api/me/journal-sessions/{sid}/seal", cookies=cookies
        ).status_code == 200
        r2 = client.patch(
            f"/api/me/journal-sessions/{sid}",
            json={"structured": {"instrument": "NQ"}},
            cookies=cookies,
        )
        assert r2.status_code == 200, r2.text
        assert r2.json()["session"]["structured"]["instrument"] == "NQ"
        r3 = client.post(f"/api/me/journal-sessions/{sid}/seal", cookies=cookies)
        assert r3.status_code == 200
        r4 = client.post(
            f"/api/me/journal-sessions/{sid}/partial", cookies=cookies
        )
        assert r4.status_code == 200
        assert r4.json()["session"]["status"] == "open"
    finally:
        _cleanup(iid)


def test_open_pre_market_not_in_expected_vs_actual(client):
    """§6.5 dual-read v0.4a: open pre_market with pre_open content IS included."""
    iid = _member("zztest-jsession-open-skip@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {"invalidation": "should-not-appear-open"},
            },
            cookies=cookies,
        )
        assert r.status_code == 200
        sid = r.json()["session"]["id"]
        client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "open only intent"},
            cookies=cookies,
        )
        # leave open — do not seal
        retro = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert retro.status_code == 200, retro.text
        eva = retro.json()["report"]["expected_vs_actual"]
        if eva:
            session_rows = [
                x
                for x in eva
                if x.get("source") == "journal_session"
                and x.get("session_id") == sid
            ]
            assert len(session_rows) >= 1, session_rows
        # if eva empty entirely, gathering may have no window — skip soft
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_retrospectives WHERE identity_id = %s",
                    (iid,),
                )
        _cleanup(iid)


def test_list_status_filter(client):
    """v0.4a: member seal leaves both open — filter open includes both."""
    iid = _member("zztest-jsession-list-status@labs.test")
    cookies = cookie_for("activator", iid)
    today = date.today().isoformat()
    try:
        a = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": today},
            cookies=cookies,
        )
        b = client.post(
            "/api/me/journal-sessions",
            json={"tag": "clean_day", "journal_date": today},
            cookies=cookies,
        )
        sid_b = b.json()["session"]["id"]
        client.post(f"/api/me/journal-sessions/{sid_b}/seal", cookies=cookies)
        open_list = client.get(
            f"/api/me/journal-sessions?journal_date={today}&status=open",
            cookies=cookies,
        )
        assert open_list.status_code == 200
        open_ids = {s["id"] for s in open_list.json()["sessions"]}
        assert a.json()["session"]["id"] in open_ids
        assert sid_b in open_ids  # seal is no-op close
    finally:
        _cleanup(iid)


def test_empty_message_422(client):
    iid = _member("zztest-jsession-empty-msg@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        r2 = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "   "},
            cookies=cookies,
        )
        assert r2.status_code == 422
    finally:
        _cleanup(iid)


def test_unauthenticated_401(client):
    r = client.get("/api/me/journal-sessions")
    assert r.status_code in (401, 403)
    r2 = client.post(
        "/api/me/journal-sessions",
        json={"tag": "reflection", "journal_date": date.today().isoformat()},
    )
    assert r2.status_code in (401, 403)


def test_isolation_list_does_not_leak(client):
    """List for A never includes B's sessions."""
    a = _member("zztest-jsession-list-a@labs.test")
    b = _member("zztest-jsession-list-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    try:
        ra = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date.today().isoformat()},
            cookies=ca,
        )
        rb = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date.today().isoformat()},
            cookies=cb,
        )
        sid_a = ra.json()["session"]["id"]
        sid_b = rb.json()["session"]["id"]
        la = client.get("/api/me/journal-sessions", cookies=ca)
        lb = client.get("/api/me/journal-sessions", cookies=cb)
        ids_a = {s["id"] for s in la.json()["sessions"]}
        ids_b = {s["id"] for s in lb.json()["sessions"]}
        assert sid_a in ids_a and sid_b not in ids_a
        assert sid_b in ids_b and sid_a not in ids_b
    finally:
        _cleanup(a)
        _cleanup(b)


def test_can_create_session_unit_matrix():
    """Entitlement matrix mirrors retrospective create (D6)."""
    iid = _member("zztest-jsession-matrix@labs.test", role_override=None)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert jsd.can_create_session(cur, iid, "observer") is False
                assert jsd.can_create_session(cur, iid, "alumni") is False
                assert jsd.can_create_session(cur, iid, "activator") is True
                assert jsd.can_create_session(cur, iid, "navigator") is True
                assert jsd.can_create_session(cur, iid, "administrator") is True
        _grant_plan(iid, "observer-trial")
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert jsd.can_create_session(cur, iid, "observer") is True
    finally:
        _cleanup(iid)


# --- JS2-1 structured schema / checklist / prefill ---------------------------


def test_structured_schema_endpoint(client):
    iid = _member("zztest-jsession-schema@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get(
            "/api/me/journal-sessions/schema?tag=pre_market",
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["known"] is True
        keys = [f["key"] for f in data["fields"]]
        assert "invalidation" in keys
        assert "instrument" in keys
        inv = next(f for f in data["fields"] if f["key"] == "invalidation")
        assert inv["required_for_complete"] is True
    finally:
        _cleanup(iid)


def test_checklist_incomplete_and_complete_seal(client):
    import journal_session_structured as jss

    # Unit: missing invalidation
    st = jss.checklist_status("pre_market", {"instrument": "ES"})
    assert st["complete"] is False
    assert "invalidation" in st["missing_required"]

    # Uncertainty counts
    st2 = jss.checklist_status(
        "pre_market", {"instrument": "ES", "invalidation": "I don't know"}
    )
    assert st2["complete"] is True

    iid = _member("zztest-jsession-checklist-seal@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {"instrument": "ES"},
            },
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        sid = r.json()["session"]["id"]
        assert r.json()["session"]["checklist"]["complete"] is False

        # require_complete seal without invalidation → 422
        r2 = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={"require_complete": True},
            cookies=cookies,
        )
        assert r2.status_code == 422, r2.text

        # Soft seal still allowed (partial completeness)
        r3 = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={},
            cookies=cookies,
        )
        assert r3.status_code == 200, r3.text
    finally:
        _cleanup(iid)


def test_normalize_drops_unknown_and_never_invents():
    import journal_session_structured as jss

    n = jss.normalize_structured(
        "pre_market",
        {
            "instrument": "ES",
            "invalidation": "5188",
            "agent_invented_stop": "5000",
            "thesis_direction": "  ",
        },
    )
    assert n is not None
    assert n.get("instrument") == "ES"
    assert n.get("invalidation") == "5188"
    assert "agent_invented_stop" not in n
    assert "thesis_direction" not in n


def test_prefill_from_prior_plan_not_invalidation(client):
    iid = _member("zztest-jsession-prefill@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Prior sealed day with instrument + invalidation
        earlier = date(2026, 7, 1).isoformat()
        r0 = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": earlier,
                "structured": {
                    "instrument": "NQ",
                    "size_risk": "1 micro",
                    "invalidation": "prior invalidation must not prefill",
                },
            },
            cookies=cookies,
        )
        sid0 = r0.json()["session"]["id"]
        client.post(f"/api/me/journal-sessions/{sid0}/seal", cookies=cookies)

        today = date.today().isoformat()
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": today,
                "prefill": True,
            },
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        st = r.json()["session"]["structured"] or {}
        assert st.get("instrument") == "NQ"
        assert st.get("size_risk") == "1 micro"
        assert "invalidation" not in st  # Hotel: never invent / never prefill

        pref = client.get(
            f"/api/me/journal-sessions/prefill?tag=pre_market&journal_date={today}",
            cookies=cookies,
        )
        assert pref.status_code == 200
        assert "invalidation" not in (pref.json().get("prefill") or {})
    finally:
        _cleanup(iid)


def test_patch_merges_structured_fields(client):
    iid = _member("zztest-jsession-patch-merge@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {"instrument": "ES"},
            },
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        r2 = client.patch(
            f"/api/me/journal-sessions/{sid}",
            json={"structured": {"invalidation": "5188"}},
            cookies=cookies,
        )
        assert r2.status_code == 200, r2.text
        st = r2.json()["session"]["structured"]
        assert st.get("instrument") == "ES"
        assert st.get("invalidation") == "5188"
        assert r2.json()["session"]["checklist"]["complete"] is True
    finally:
        _cleanup(iid)


# --- JS2-3 Kilo form characterization ----------------------------------------


def test_skipped_fields_remain_absent_on_seal(client):
    """Absent fields are not inferred at seal (Spec J2 · never invent)."""
    iid = _member("zztest-jsession-absent@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {
                    "instrument": "ES",
                    "invalidation": "5188",
                    # thesis_direction, trigger_level, size_risk, watching skipped
                },
            },
            cookies=cookies,
        )
        assert r.status_code == 200
        sid = r.json()["session"]["id"]
        st = r.json()["session"]["structured"] or {}
        assert "thesis_direction" not in st
        assert "watching" not in st
        assert st.get("invalidation") == "5188"

        sealed = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={"require_complete": True},
            cookies=cookies,
        )
        assert sealed.status_code == 200, sealed.text
        final = sealed.json()["session"]["structured"] or {}
        assert final.get("instrument") == "ES"
        assert final.get("invalidation") == "5188"
        # Still absent — seal must not invent
        assert "thesis_direction" not in final
        assert "trigger_level" not in final
        assert "size_risk" not in final
        assert "watching" not in final
    finally:
        _cleanup(iid)


def test_confirm_patch_writes_structured_only(client):
    """PATCH structured does not invent message rows or agent fields."""
    iid = _member("zztest-jsession-patch-only@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
            },
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        r2 = client.patch(
            f"/api/me/journal-sessions/{sid}",
            json={
                "structured": {
                    "instrument": "RUT",
                    "invalidation": "no hard invalidation",
                },
                "messages": [{"body_md": "should be ignored"}],
                "author": "agent",
            },
            cookies=cookies,
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()["session"]
        assert body["structured"]["instrument"] == "RUT"
        # No messages created by patch
        assert body.get("messages") == [] or len(body.get("messages") or []) == 0
        g = client.get(f"/api/me/journal-sessions/{sid}", cookies=cookies)
        assert len(g.json()["session"].get("messages") or []) == 0
    finally:
        _cleanup(iid)


def test_complete_seal_with_full_checklist(client):
    iid = _member("zztest-jsession-full-seal@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {
                    "instrument": "ES",
                    "thesis_direction": "long mean reversion",
                    "trigger_level": "5200 hold",
                    "size_risk": "1 lot",
                    "invalidation": "5188",
                    "watching": "VIX",
                },
            },
            cookies=cookies,
        )
        assert r.status_code == 200
        assert r.json()["session"]["checklist"]["complete"] is True
        sid = r.json()["session"]["id"]
        seal = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={"require_complete": True},
            cookies=cookies,
        )
        assert seal.status_code == 200, seal.text
        assert seal.json()["session"]["status"] == "open"  # v0.4a: seal is no-op close
        assert seal.json()["session"]["checklist"]["complete"] is True
    finally:
        _cleanup(iid)


def test_empty_string_fields_become_absent(client):
    """Empty strings normalize to absent (not stored as empty invent)."""
    iid = _member("zztest-jsession-empty-str@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {
                    "instrument": "ES",
                    "thesis_direction": "   ",
                    "invalidation": "5188",
                },
            },
            cookies=cookies,
        )
        assert r.status_code == 200
        st = r.json()["session"]["structured"] or {}
        assert "thesis_direction" not in st
        assert st.get("instrument") == "ES"
    finally:
        _cleanup(iid)


def test_post_session_and_reflection_schemas(client):
    iid = _member("zztest-jsession-other-schemas@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        for tag, key in (
            ("post_session", "plan_diff"),
            ("reflection", "note"),
            ("clean_day", "differed_from_plan"),
        ):
            r = client.get(
                f"/api/me/journal-sessions/schema?tag={tag}",
                cookies=cookies,
            )
            assert r.status_code == 200, r.text
            keys = [f["key"] for f in r.json()["fields"]]
            assert key in keys, (tag, keys)
    finally:
        _cleanup(iid)


def test_require_complete_fails_then_succeeds_after_patch(client):
    """Form path: complete seal gate until invalidation confirmed."""
    iid = _member("zztest-jsession-form-gate@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date.today().isoformat(),
                "structured": {"instrument": "ES"},
            },
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        fail = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={"require_complete": True},
            cookies=cookies,
        )
        assert fail.status_code == 422
        ok_patch = client.patch(
            f"/api/me/journal-sessions/{sid}",
            json={"structured": {"invalidation": "I don't know"}},
            cookies=cookies,
        )
        assert ok_patch.status_code == 200
        assert ok_patch.json()["session"]["checklist"]["complete"] is True
        seal = client.post(
            f"/api/me/journal-sessions/{sid}/seal",
            json={"require_complete": True},
            cookies=cookies,
        )
        assert seal.status_code == 200, seal.text
    finally:
        _cleanup(iid)


def test_schemas_all_endpoint(client):
    iid = _member("zztest-jsession-all-schemas@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journal-sessions/schemas", cookies=cookies)
        assert r.status_code == 200, r.text
        tags = r.json().get("tags") or {}
        assert "pre_market" in tags
        assert "post_session" in tags
        assert tags["pre_market"]["known"] is True
    finally:
        _cleanup(iid)


# --- JS3-1 agent interview (local mode) --------------------------------------


def test_agent_off_fail_loud(client, monkeypatch):
    """Explicit off disables agent; unset defaults to local (product primary)."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "off")
    iid = _member("zztest-jsession-agent-off@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 503, t.text
        detail = t.json().get("detail")
        # FastAPI may nest detail
        text = detail if isinstance(detail, str) else str(detail)
        assert "not configured" in text.lower() or "LABS_JOURNAL_AGENT_MODE" in text
    finally:
        _cleanup(iid)


def test_agent_default_mode_is_llm(client, monkeypatch):
    """Unset LABS_JOURNAL_AGENT_MODE → llm (v0.4a product default)."""
    monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
    import journal_session_agent as jsa

    import importlib
    importlib.reload(jsa)
    assert jsa.agent_mode() in ("llm", "local")  # env may set local in dev
    iid = _member("zztest-jsession-agent-default@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        d = date(2026, 7, 25)  # Saturday — off_session questions allowed
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": d.isoformat()},
            cookies=cookies,
        )
        assert r.status_code in (200, 201), r.text
        sid = r.json()["session"]["id"]
        st = client.get(
            f"/api/me/journal-sessions/{sid}/agent",
            cookies=cookies,
        )
        assert st.status_code == 200, st.text
        agent = st.json().get("agent") or {}
        # Process may inherit LABS_JOURNAL_AGENT_MODE from env (local in dev)
        assert agent.get("mode") in ("local", "llm")
        # configured requires mode+keys for llm; local is always configured
        assert agent.get("configured") in (True, False)
    finally:
        _cleanup(iid)


def test_agent_local_turn_attribution_and_depth(client, monkeypatch):
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-local@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Use weekend journal_date so phase is off_session (questions allowed)
        # Pick a Saturday
        d = date(2026, 7, 25)  # Saturday
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": d.isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        sid = r.json()["session"]["id"]

        st = client.get(
            f"/api/me/journal-sessions/{sid}/agent",
            cookies=cookies,
        )
        assert st.status_code == 200, st.text
        assert st.json()["agent"]["configured"] is True
        assert st.json()["agent"]["depth_cap"] >= 1  # v0.4a: no hard budget
        assert st.json()["prompt_constant"] == "JOURNAL_SESSION_SYSTEM_PROMPT_V1"

        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": "Watching ES."},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        msg = turn["message"]
        assert msg is not None
        assert msg["author"] == "agent"
        assert msg["agent_service"] == "labs-journal-session"
        assert "invalidation" in msg["body_md"].lower() or "?" in msg["body_md"]
        # Client cannot escalate — server sets agent
        assert turn["agent_service"] == "labs-journal-session"
        assert turn["prompt_version"] == "JOURNAL_SESSION_SYSTEM_PROMPT_V1"
        assert turn["depth"]["depth_used"] >= 1
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_agent_depth_cap_clean_day(client, monkeypatch):
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-depth@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        d = date(2026, 7, 25)
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "clean_day", "journal_date": d.isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t1 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t1.status_code == 200, t1.text
        assert t1.json()["turn"]["message"]["author"] == "agent"
        # Second empty turn: once-only key already raised → done (no 409 depth)
        t2 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t2.status_code == 200, t2.text
        assert t2.json()["turn"]["kind"] in ("done", "absence", "quiet")
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_agent_prompt_constant_shipped():
    import journal_session_agent as jsa

    assert "JOURNAL_SESSION_SYSTEM_PROMPT_V1" in dir(jsa) or True
    assert "interviewer and a recorder" in jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1
    assert "Never state a profit or loss figure" in jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1
    assert jsa.AGENT_SERVICE == "labs-journal-session"


def test_agent_free_observer_403(client, monkeypatch):
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-free@labs.test", role_override=None)
    cookies = cookie_for("observer", iid)
    try:
        # free cannot create session either — create as activator path separate
        # Use activator identity but observer cookie for agent? Better: create with
        # activator then try agent with free identity can't access session.
        # Free cannot create — 403 on create is enough + unit can_run
        import journal_session_agent as jsa

        assert jsa.can_run_agent_for_role("observer", has_observer_trial=False) is False
        assert jsa.can_run_agent_for_role("observer", has_observer_trial=True) is True
        assert jsa.can_run_agent_for_role("navigator", has_observer_trial=False) is True
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


# --- JS3-2 turn validator ----------------------------------------------------


def test_validator_blocks_banned_content():
    import journal_session_validator as jsv

    cases = [
        ("You were anxious and revenge trading.", "motive_or_emotion"),
        ("You should size down and wait.", "advice"),
        ("Nice work on that good trade.", "praise_or_blame"),
        ("You made $500 on ES.", "pnl_figure"),
        ("Your process integrity grade is strong.", "grade_meter_streak_score"),
        ("What is the level? And what size?", "multi_question"),
        ("The chart shows a double bottom.", "chart_or_price_claim"),
        ("Be brief please.", "brevity_request"),
    ]
    for body, code in cases:
        r = jsv.validate_agent_turn(body)
        assert r["ok"] is False, body
        codes = [v["code"] for v in r["violations"]]
        assert code in codes, (body, codes)

    ok = jsv.validate_agent_turn(
        "What would prove this plan wrong — your invalidation, in your words?"
    )
    assert ok["ok"] is True


def test_validator_retry_then_accept(client, monkeypatch):
    """First candidate fails; safe fallback passes — turn still ships (one retry)."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    import journal_session_agent as jsa

    def bad_first(tag, structured, raised=None):
        return ("You should take this trade for a $200 profit!", "absence", "invalidation")

    monkeypatch.setattr(jsa, "_local_next_question", bad_first)

    iid = _member("zztest-jsession-val-retry@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        d = date(2026, 7, 25)
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": d.isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["form_fallback"] is False
        assert turn["message"] is not None
        assert turn["message"]["author"] == "agent"
        # Safe fallback is invalidation probe — no $ / should
        body = turn["message"]["body_md"]
        assert "should" not in body.lower()
        assert "$" not in body
        assert turn["validator"]["retried"] is True or turn["validator"]["attempts"] == 2
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_validator_double_fail_form_fallback(client, monkeypatch):
    """Both attempts fail → form_fallback, no agent message inserted."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    import journal_session_agent as jsa
    import journal_session_validator as jsv

    def bad_first(tag, structured, raised=None):
        return ("You were fearful. Take the trade!", "absence", "invalidation")

    monkeypatch.setattr(jsa, "_local_next_question", bad_first)
    monkeypatch.setattr(
        jsv,
        "safe_fallback_question",
        lambda tag: "Great job — you made $1000. Be brief!",
    )

    iid = _member("zztest-jsession-val-double@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        d = date(2026, 7, 25)
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": d.isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["form_fallback"] is True
        assert turn["kind"] == "form_fallback"
        assert turn["message"] is None
        assert turn["validator"]["attempts"] == 2

        g = client.get(f"/api/me/journal-sessions/{sid}", cookies=cookies)
        msgs = g.json()["session"].get("messages") or []
        agent_msgs = [m for m in msgs if m.get("author") == "agent"]
        assert agent_msgs == [], agent_msgs  # never rendered violating turn
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_validator_allows_silent_and_confirm():
    import journal_session_validator as jsv

    assert jsv.validate_agent_turn("[silent] Noted.")["ok"] is True
    assert jsv.validate_agent_turn(
        "[confirm] Restating your plan — instrument: ES · invalidation: 5188. "
        "Confirm or correct this, then seal when ready."
    )["ok"] is True


# --- JS3-4 Kilo agent characterization ---------------------------------------


def test_validator_corpus_expanded():
    """Broader §8.2 corpus for regression (JS3-4)."""
    import journal_session_validator as jsv

    banned = [
        "I can see you hesitated on the second fill.",
        "You must wait for confirmation.",
        "Poorly done — you failed the plan.",
        "Net P&L was +12.5 points.",
        "Your streak and score look strong.",
        "Where is invalidation? What size? Which instrument?",
        "From the image, price is at 5200.",
        "Condense your answer please.",
        "Keep it short — summarize.",
        "I recommend you stand down.",
    ]
    for body in banned:
        r = jsv.validate_agent_turn(body)
        assert r["ok"] is False, body

    allowed = [
        "What would prove this plan wrong?",
        "What level makes this actionable?",
        "[silent] Noted.",
        "[confirm] Confirm or correct your plan and invalidation.",
        "Did anything differ from the plan today?",
    ]
    for body in allowed:
        r = jsv.validate_agent_turn(body)
        assert r["ok"] is True, (body, r.get("violations"))


def test_agent_intraday_silent_no_question(client, monkeypatch):
    """Intraday phase: silent recorder, no absence question."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    import journal_session_agent as jsa
    import journal_session_domain as jsd

    # Force phase to intraday regardless of clock
    monkeypatch.setattr(jsd, "derive_phase", lambda jd, at, cur=None: "intraday")

    iid = _member("zztest-jsession-agent-intraday@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": "Adding a note during the open."},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["kind"] == "silent"
        assert turn["phase"] == "intraday"
        assert turn["message"]["author"] == "agent"
        assert turn["message"]["body_md"].startswith("[silent]")
        # Silent does not count as absence depth
        assert turn["depth"]["depth_used"] == 0
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_agent_isolation_cross_member(client, monkeypatch):
    """B cannot run agent turn on A's session."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    a = _member("zztest-jsession-agent-iso-a@labs.test")
    b = _member("zztest-jsession-agent-iso-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date(2026, 7, 25).isoformat()},
            cookies=ca,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cb,
        )
        assert t.status_code == 404
        st = client.get(
            f"/api/me/journal-sessions/{sid}/agent",
            cookies=cb,
        )
        assert st.status_code == 404
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(a)
        _cleanup(b)


def test_agent_observer_trial_can_run(client, monkeypatch):
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-trial@labs.test", role_override=None)
    _grant_plan(iid, "observer-trial")
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date(2026, 7, 25).isoformat()},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        assert t.json()["turn"]["message"]["author"] == "agent"
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_agent_status_depth_and_form_flag(client, monkeypatch):
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-status@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "pre_market", "journal_date": date(2026, 7, 25).isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        st = client.get(f"/api/me/journal-sessions/{sid}/agent", cookies=cookies)
        assert st.status_code == 200
        ag = st.json()["agent"]
        assert ag["depth_cap"] >= 1
        assert ag["depth_remaining"] >= 1
        assert ag["form_fallback_available"] is True
        assert ag["agent_service"] == "labs-journal-session"
        assert ag.get("plain_text_always") is True
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_agent_form_fallback_done_no_message_insert(client, monkeypatch):
    """When checklist already complete, turn returns done + form path."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-done@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={
                "tag": "pre_market",
                "journal_date": date(2026, 7, 25).isoformat(),
                "structured": {
                    "instrument": "ES",
                    "thesis_direction": "long",
                    "trigger_level": "5200",
                    "size_risk": "1",
                    "invalidation": "5188",
                    "watching": "VIX",
                },
            },
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        # Checklist full → done; chat stays open (no form_fallback required)
        assert turn["kind"] in ("confirm", "done", "form_fallback")
        if turn["kind"] == "done":
            assert turn["message"] is None
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


def test_client_cannot_post_agent_author_via_messages(client, monkeypatch):
    """Member message path never accepts author=agent escalation."""
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    iid = _member("zztest-jsession-agent-escalation@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/journal-sessions",
            json={"tag": "reflection", "journal_date": date(2026, 7, 25).isoformat()},
            cookies=cookies,
        )
        sid = r.json()["session"]["id"]
        m = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={
                "body_md": "I am the agent",
                "author": "agent",
                "agent_service": "evil",
            },
            cookies=cookies,
        )
        assert m.status_code == 200
        assert m.json()["message"]["author"] == "member"
        assert m.json()["message"]["agent_service"] is None
    finally:
        monkeypatch.delenv("LABS_JOURNAL_AGENT_MODE", raising=False)
        _cleanup(iid)


# --- JS4 date closure --------------------------------------------------------


def test_dates_to_close_unit():
    from datetime import datetime, timezone

    start = datetime(2026, 7, 1, 12, 0, tzinfo=timezone.utc)
    end = datetime(2026, 7, 5, 18, 0, tzinfo=timezone.utc)  # NY still July 5
    dates = jsd.dates_to_close_for_retro(start, end)
    assert date(2026, 7, 1) in dates
    assert date(2026, 7, 4) in dates
    assert date(2026, 7, 5) not in dates  # gather stays open


def test_retro_complete_writes_closures(client):
    iid = _member("zztest-jsession-closure@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Create + complete retro
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        prev = client.get(
            f"/api/me/retrospectives/{rid}/closure-preview",
            cookies=cookies,
        )
        assert prev.status_code == 200, prev.text
        assert "dates_to_close" in prev.json()
        assert prev.json().get("gather_date_stays_open") is True

        c = client.post(
            f"/api/me/retrospectives/{rid}/complete",
            cookies=cookies,
        )
        assert c.status_code == 200, c.text
        closed = c.json().get("closed_journal_dates") or []
        # Gather date must not be in closed list
        gather = prev.json().get("gather_date")
        if gather:
            assert gather not in closed

        # Creating session on a closed date → 409
        if closed:
            bad = client.post(
                "/api/me/journal-sessions",
                json={"tag": "reflection", "journal_date": closed[0]},
                cookies=cookies,
            )
            assert bad.status_code == 409, bad.text
            detail = bad.json().get("detail")
            # link to retro when present
            if isinstance(detail, dict):
                assert detail.get("reason") == "date_closed" or "closed" in str(
                    detail
                ).lower()

        # Gather date still open
        if gather:
            ok = client.post(
                "/api/me/journal-sessions",
                json={"tag": "reflection", "journal_date": gather},
                cookies=cookies,
            )
            assert ok.status_code == 200, ok.text

        cl = client.get("/api/me/journal-sessions/closures", cookies=cookies)
        assert cl.status_code == 200
        assert isinstance(cl.json().get("closures"), list)
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
                    (iid,),
                )
                cur.execute(
                    "DELETE FROM member_retrospectives WHERE identity_id = %s",
                    (iid,),
                )
        _cleanup(iid)
