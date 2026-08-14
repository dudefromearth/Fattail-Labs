"""Member Data & Privacy spine (W2) — isolation, consent, audit."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import db
import identity as identity_mod
from conftest import COOKIE, cookie_for


def _mint(role: str, identity_id: int) -> dict:
    return cookie_for(role, identity_id)


def _make_identity(email: str, name: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, name)


def _purge_identity(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql in (
                "DELETE FROM member_access_audit WHERE actor_identity_id = %s OR subject_identity_id = %s",
                "DELETE FROM member_consent_grants WHERE member_identity_id = %s OR admin_identity_id = %s",
                "DELETE FROM member_tool_notes WHERE identity_id = %s",
                "DELETE FROM member_analytics_consent WHERE identity_id = %s",
                "DELETE FROM identity_links WHERE identity_id = %s",
                "DELETE FROM credentials WHERE identity_id = %s",
                "DELETE FROM identities WHERE identity_id = %s",
            ):
                # Some deletes need one arg, some two
                if sql.count("%s") == 2:
                    cur.execute(sql, (iid, iid))
                else:
                    cur.execute(sql, (iid,))


def test_analytics_consent_defaults_false(client):
    iid = _make_identity("zztest-priv-a@labs.test", "Priv A")
    try:
        r = client.get(
            "/api/me/privacy/analytics-consent",
            cookies=_mint("activator", iid),
        )
        assert r.status_code == 200
        assert r.json()["opted_in"] is False
        r2 = client.put(
            "/api/me/privacy/analytics-consent",
            cookies=_mint("activator", iid),
            json={"opted_in": True},
        )
        assert r2.status_code == 200
        assert r2.json()["opted_in"] is True
    finally:
        _purge_identity(iid)


def test_member_isolation_notes(client):
    a = _make_identity("zztest-priv-iso-a@labs.test", "Iso A")
    b = _make_identity("zztest-priv-iso-b@labs.test", "Iso B")
    try:
        ca, cb = _mint("activator", a), _mint("activator", b)
        created = client.post(
            "/api/me/tools/journal/notes",
            cookies=ca,
            json={"body_md": "secret process note A"},
        )
        assert created.status_code == 200, created.text
        note_id = created.json()["id"]

        # Owner can read
        own = client.get(f"/api/me/tools/journal/notes/{note_id}", cookies=ca)
        assert own.status_code == 200
        assert "secret" in own.json()["body_md"]

        # Peer cannot read (404 fail-closed)
        peer = client.get(f"/api/me/tools/journal/notes/{note_id}", cookies=cb)
        assert peer.status_code == 404

        # Peer list does not include A's notes
        blist = client.get("/api/me/tools/journal/notes", cookies=cb)
        assert blist.status_code == 200
        assert all(n["id"] != note_id for n in blist.json()["notes"])
    finally:
        _purge_identity(a)
        _purge_identity(b)


def test_admin_read_denied_without_consent_and_allowed_with_grant(client):
    member = _make_identity("zztest-priv-mem@labs.test", "Member M")
    admin_id = _make_identity("zztest-priv-adm@labs.test", "Admin A")
    try:
        cm = _mint("activator", member)
        # Session role administrator for admin_id (identity row exists for FK)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' "
                    "WHERE identity_id = %s",
                    (admin_id,),
                )
        ca = _mint("administrator", admin_id)

        note = client.post(
            "/api/me/tools/trade_log/notes",
            cookies=cm,
            json={"body_md": "trade process only"},
        )
        assert note.status_code == 200, note.text

        # Deny without grant
        denied = client.get(
            f"/api/admin/members/{member}/tools/trade_log/notes",
            cookies=ca,
        )
        assert denied.status_code == 403, denied.text
        assert "consent" in denied.json()["detail"].lower()

        # Audit recorded deny
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT action FROM member_access_audit
                       WHERE actor_identity_id = %s AND subject_identity_id = %s
                       ORDER BY id DESC LIMIT 1""",
                    (admin_id, member),
                )
                row = cur.fetchone()
                assert row is not None
                assert row["action"] == "deny"

        # Member grants admin
        expires = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        grant = client.post(
            "/api/me/privacy/examination-grants",
            cookies=cm,
            json={
                "admin_identity_id": admin_id,
                "surfaces": ["trade_log"],
                "purpose": "coaching review",
                "expires_at": expires,
            },
        )
        assert grant.status_code == 200, grant.text
        grant_id = grant.json()["id"]

        # Scope: journal not included
        wrong = client.get(
            f"/api/admin/members/{member}/tools/journal/notes",
            cookies=ca,
        )
        assert wrong.status_code == 403

        # Allow trade_log
        allowed = client.get(
            f"/api/admin/members/{member}/tools/trade_log/notes",
            cookies=ca,
        )
        assert allowed.status_code == 200, allowed.text
        body = allowed.json()
        assert body["consent_grant_id"] == grant_id
        assert any("trade process" in n["body_md"] for n in body["notes"])

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT action, consent_grant_id FROM member_access_audit
                       WHERE actor_identity_id = %s AND subject_identity_id = %s
                         AND action = 'read'
                       ORDER BY id DESC LIMIT 1""",
                    (admin_id, member),
                )
                read_row = cur.fetchone()
                assert read_row is not None
                assert int(read_row["consent_grant_id"]) == grant_id

        # Revoke ends access
        rev = client.delete(
            f"/api/me/privacy/examination-grants/{grant_id}",
            cookies=cm,
        )
        assert rev.status_code == 200
        after = client.get(
            f"/api/admin/members/{member}/tools/trade_log/notes",
            cookies=ca,
        )
        assert after.status_code == 403
    finally:
        _purge_identity(member)
        _purge_identity(admin_id)


def test_min_cohort_k_exposed(client):
    r = client.get(
        "/api/admin/privacy/min-cohort-k",
        cookies=cookie_for("administrator"),
    )
    assert r.status_code == 200
    assert r.json()["min_cohort_k"] == 5
