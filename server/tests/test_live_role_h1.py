"""H1 — require_admin uses live derive_role, not frozen JWT role."""

from __future__ import annotations

import auth
import db
import identity as identity_mod
from conftest import COOKIE, cookie_for
from fastapi.testclient import TestClient
from main import app


def test_demoted_admin_jwt_cannot_hit_admin_api(client):
    """Session claims role=administrator but live role is observer → 403."""
    email = "zztest-h1-demoted-admin@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "H1 Demoted")
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
    try:
        # Mint JWT that *claims* administrator (stale snapshot attack)
        token = auth.issue_session(iid, "internal", "administrator")
        r = client.get(
            "/api/admin/access/policies",
            cookies={COOKIE: token},
        )
        assert r.status_code == 403, r.text
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_real_admin_still_passes(client, admin_cookies):
    r = client.get("/api/admin/access/policies", cookies=admin_cookies)
    # identity 0 admin in tests via cookie_for("administrator")
    assert r.status_code == 200, r.text


def test_live_role_helper_derive_not_session():
    from guards import _live_authorization_role

    email = "zztest-h1-live-derive@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "H1 Live")
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
    try:
        claims = {"identity_id": iid, "role": "administrator"}
        assert _live_authorization_role(claims) == "observer"
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' "
                    "WHERE identity_id = %s",
                    (iid,),
                )
        assert _live_authorization_role(claims) == "administrator"
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (iid,),
                )
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))
