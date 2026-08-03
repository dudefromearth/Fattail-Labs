"""M2 — SSO email vs identity_links reconciliation."""

from __future__ import annotations

import time

import jwt
import pytest

import db
import identity
from config import get_config


def _mint(*, email: str, wp_user_id: int, secret: str, issuer: str = "fattail") -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "iss": issuer,
            "wp_user_id": wp_user_id,
            "email": email,
            "display_name": "M2 Probe",
            "plans": [],
            "roles": [],
            "iat": now,
            "exp": now + 600,
        },
        secret,
        algorithm="HS256",
    )


def _cleanup_emails(*emails: str):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for email in emails:
                cur.execute(
                    "SELECT identity_id FROM identities WHERE email = %s", (email,)
                )
                row = cur.fetchone()
                if not row:
                    continue
                iid = row["identity_id"]
                cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_email_change_on_same_wp_user_updates_identity(client):
    """Link by external_id; WP email change updates Labs email when free."""
    cfg = get_config()
    secret = cfg.sso_secrets["fattail"]
    e1 = "zztest-m2-a@labs.test"
    e2 = "zztest-m2-a-new@labs.test"
    wp_id = 920101
    _cleanup_emails(e1, e2)
    try:
        t1 = _mint(email=e1, wp_user_id=wp_id, secret=secret)
        r1 = client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t1},
            follow_redirects=False,
        )
        assert r1.status_code in (302, 307)

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT identity_id FROM identities WHERE email = %s", (e1,)
                )
                iid = cur.fetchone()["identity_id"]

        t2 = _mint(email=e2, wp_user_id=wp_id, secret=secret)
        r2 = client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t2},
            follow_redirects=False,
        )
        assert r2.status_code in (302, 307)

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT email FROM identities WHERE identity_id = %s", (iid,)
                )
                assert cur.fetchone()["email"] == e2
                cur.execute(
                    "SELECT identity_id FROM identities WHERE email = %s", (e1,)
                )
                assert cur.fetchone() is None
    finally:
        _cleanup_emails(e1, e2)


def test_email_collision_with_other_identity_409(client):
    """Linked WP user cannot steal another Labs account's email."""
    cfg = get_config()
    secret = cfg.sso_secrets["fattail"]
    e_link = "zztest-m2-link@labs.test"
    e_other = "zztest-m2-other@labs.test"
    wp_id = 920102
    _cleanup_emails(e_link, e_other)
    try:
        # Create other identity owning e_other
        with db.transaction() as conn:
            with conn.cursor() as cur:
                identity.get_or_create_identity(cur, e_other, "Other")

        t1 = _mint(email=e_link, wp_user_id=wp_id, secret=secret)
        assert client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t1},
            follow_redirects=False,
        ).status_code in (302, 307)

        # Same WP id, JWT email is someone else's Labs email
        t2 = _mint(email=e_other, wp_user_id=wp_id, secret=secret)
        r = client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t2},
            follow_redirects=False,
        )
        assert r.status_code == 409
        assert "different" in r.text.lower() or "support" in r.text.lower()
    finally:
        _cleanup_emails(e_link, e_other)


def test_two_wp_users_same_email_conflict_409(client):
    """Email already linked to WP user A; SSO as WP user B with same email → 409."""
    cfg = get_config()
    secret = cfg.sso_secrets["fattail"]
    email = "zztest-m2-dual@labs.test"
    _cleanup_emails(email)
    try:
        t1 = _mint(email=email, wp_user_id=920201, secret=secret)
        assert client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t1},
            follow_redirects=False,
        ).status_code in (302, 307)

        t2 = _mint(email=email, wp_user_id=920202, secret=secret)
        r = client.get(
            "/api/auth/sso/wordpress:fattail",
            params={"token": t2},
            follow_redirects=False,
        )
        assert r.status_code == 409
    finally:
        _cleanup_emails(email)


def test_resolve_sso_identity_unit():
    email = "zztest-m2-unit@labs.test"
    _cleanup_emails(email)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = identity.resolve_sso_identity(
                    cur, "wordpress:fattail", "930001", email, "Unit"
                )
                assert iid > 0
                # same link again
                iid2 = identity.resolve_sso_identity(
                    cur, "wordpress:fattail", "930001", email, "Unit"
                )
                assert iid2 == iid
    finally:
        _cleanup_emails(email)
