"""Phase E — WordPress SSO provider contract tests (stub JWTs, no live WP).

If WP is down in production, native login still works; these tests prove Labs
side of dual-issuer verify + identity link + session.
"""

from __future__ import annotations

import time

import jwt
import pytest

import db
import identity
from config import get_config


def _mint_wp_token(
    *,
    issuer: str,
    secret: str,
    email: str,
    wp_user_id: int = 900001,
    plans: list[str] | None = None,
    roles: list[str] | None = None,
    msc_shape: bool = False,
) -> str:
    """Mint a Labs or MSC/fotw-sso shaped JWT for tests."""
    now = int(time.time())
    if msc_shape:
        # MarketSwarm-Canonical / fotw-sso claim shape
        payload = {
            "iss": issuer,
            "sub": str(wp_user_id),
            "email": email,
            "name": "ZZ SSO Probe",
            "membership_plans": plans or [],
            "roles": roles or [],
            "iat": now,
            "exp": now + 600,
        }
    else:
        payload = {
            "iss": issuer,
            "wp_user_id": wp_user_id,
            "email": email,
            "display_name": "ZZ SSO Probe",
            "plans": plans or [],
            "roles": roles or [],
            "iat": now,
            "exp": now + 600,
        }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture()
def sso_email():
    email = "zztest-sso-probe@labs.test"
    yield email
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id FROM identities WHERE email = %s", (email,))
            row = cur.fetchone()
            if row:
                iid = row["identity_id"]
                cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_sso_unknown_provider_404(client):
    client.cookies.clear()
    r = client.get("/api/auth/sso/wordpress:nope", params={"token": "x"})
    assert r.status_code == 404


def test_sso_bad_token_401(client):
    client.cookies.clear()
    r = client.get(
        "/api/auth/sso/wordpress:fattail",
        params={"token": "not.a.jwt"},
        follow_redirects=False,
    )
    assert r.status_code == 401


def test_sso_fattail_happy_path_sets_session(client, sso_email):
    cfg = get_config()
    token = _mint_wp_token(
        issuer="fattail",
        secret=cfg.sso_secrets["fattail"],
        email=sso_email,
        wp_user_id=910001,
    )
    r = client.get(
        "/api/auth/sso/wordpress:fattail",
        params={"token": token},
        follow_redirects=False,
    )
    assert r.status_code in (302, 307)
    assert r.headers.get("location") in ("/courses", "http://testserver/courses") or (
        r.headers.get("location") or ""
    ).endswith("/courses")
    # Session cookie set
    assert cfg.session_cookie in r.cookies or any(
        cfg.session_cookie in (c or "") for c in r.headers.get_list("set-cookie")
    ) or client.cookies.get(cfg.session_cookie)

    # Identity linked
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id FROM identities WHERE email = %s", (sso_email,)
            )
            row = cur.fetchone()
            assert row
            cur.execute(
                """SELECT provider FROM identity_links
                   WHERE identity_id = %s AND provider = 'wordpress:fattail'""",
                (row["identity_id"],),
            )
            assert cur.fetchone()
    client.cookies.clear()


def test_sso_msc_fotw_claim_shape_accepted(client, sso_email):
    """fotw-sso / MSC mint iss=fotw, sub, membership_plans, name; query ?sso=."""
    cfg = get_config()
    token = _mint_wp_token(
        issuer="fotw",
        secret=cfg.sso_secrets["fattail"],
        email=sso_email,
        wp_user_id=910002,
        plans=["labs-membership"],
        msc_shape=True,
    )
    r = client.get(
        "/api/auth/sso/wordpress:fattail",
        params={"sso": token},  # MSC query name
        follow_redirects=False,
    )
    assert r.status_code in (302, 307), r.text
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT external_id FROM identity_links
                   WHERE provider = 'wordpress:fattail'
                     AND identity_id = (
                       SELECT identity_id FROM identities WHERE email = %s
                     )""",
                (sso_email,),
            )
            link = cur.fetchone()
            assert link
            assert str(link["external_id"]) == "910002"
    # Session-scoped TestClient keeps cookies across tests.
    client.cookies.clear()


def test_sso_wrong_issuer_secret_rejected(client, sso_email):
    token = _mint_wp_token(
        issuer="fattail",
        secret="x" * 32,  # wrong secret
        email=sso_email,
    )
    r = client.get(
        "/api/auth/sso/wordpress:fattail",
        params={"token": token},
        follow_redirects=False,
    )
    assert r.status_code == 401


def test_providers_list_shape(client):
    r = client.get("/api/auth/providers")
    assert r.status_code == 200
    body = r.json()
    assert "sso" in body
    assert isinstance(body["sso"], dict)


def test_native_login_still_works_when_sso_would_fail(client):
    """Documented fallback: WP down → native credentials."""
    email = "zztest-native-fallback@labs.test"
    password = "native-fallback-password-99"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity.get_or_create_identity(cur, email, "Native Fallback")
            cur.execute("DELETE FROM credentials WHERE identity_id = %s", (iid,))
            cur.execute(
                "INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)",
                (iid, identity.hash_password(password)),
            )
    try:
        r = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert r.status_code == 200
        assert r.json()["identity_id"] == iid
    finally:
        client.cookies.clear()
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM credentials WHERE identity_id = %s", (iid,)
                )
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))
