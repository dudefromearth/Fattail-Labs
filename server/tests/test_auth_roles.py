"""Auth surface + the role ladder (Identity & Access spec)."""

import auth
import db
import identity as identity_mod
from conftest import cookie_for


def test_health(client):
    assert client.get("/api/health").status_code == 200


def test_me_requires_session(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_role(client):
    r = client.get("/api/auth/me", cookies=cookie_for("navigator", 902))
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "navigator"
    assert body["identity_id"] == 902
    assert body.get("access_role") == "navigator"
    assert "memberships" in body
    assert isinstance(body["memberships"], list)


def test_entitlement_key_candidates_normalize():
    from identity import _entitlement_key_candidates

    c = _entitlement_key_candidates("Observer Access")
    assert "observer-access" in c
    assert "observer" in c


def test_role_ladder_is_cumulative():
    order = ("observer", "alumni", "activator", "navigator", "administrator")
    for i, role in enumerate(order):
        for j, minimum in enumerate(order):
            assert auth.role_at_least(role, minimum) is (i >= j)


def test_garbage_session_cookie_is_anonymous(client):
    from conftest import COOKIE
    r = client.get("/api/auth/me", cookies={COOKIE: "not-a-jwt"})
    assert r.status_code == 401


def test_logout_clears_session_cookie_attrs(client):
    """Sign out must expire ft_session with path (and domain when configured).

    Regression: delete_cookie without domain left .fattail.ai sessions intact.
    """
    from conftest import COOKIE
    from config import get_config

    r = client.get(
        "/api/auth/logout",
        cookies=cookie_for("observer", 901),
        follow_redirects=False,
    )
    assert r.status_code in (302, 303)
    assert r.headers.get("location") in ("/login", "http://testserver/login")

    # Set-Cookie must clear the session name
    set_cookies = r.headers.get_list("set-cookie")
    joined = " ".join(set_cookies).lower()
    assert COOKIE.lower() in joined
    # Max-Age=0 or expires in the past is how Starlette deletes
    assert "max-age=0" in joined or "expires=" in joined
    assert "path=/" in joined

    cfg = get_config()
    if cfg.cookie_domain:
        assert cfg.cookie_domain.lower() in joined

    # After client applies delete, /me is anonymous
    r2 = client.get("/api/auth/me")
    assert r2.status_code == 401


def test_logout_json_emits_expire_headers(client):
    """POST logout?json=1 returns signed_out and expires ft_session."""
    from conftest import COOKIE

    r = client.post(
        "/api/auth/logout?json=1",
        cookies=cookie_for("observer", 901),
        headers={"Accept": "application/json"},
    )
    assert r.status_code == 200
    assert r.json().get("signed_out") is True
    joined = " ".join(r.headers.get_list("set-cookie")).lower()
    assert COOKIE.lower() in joined
    assert "max-age=0" in joined or "expires=" in joined


def test_feature_role_observer_trial_elevates_to_navigator():
    """DL-128: paid Observer membership elevates feature gates to navigator."""
    email = "zztest-feature-role@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Feature Role")
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert identity_mod.feature_role(cur, iid, "observer") == "observer"
                assert identity_mod.role_meets(cur, iid, "observer", "activator") is False
                assert identity_mod.role_meets(cur, iid, "observer", "navigator") is False

                cur.execute(
                    "SELECT id FROM plans WHERE slug = %s", ("observer-trial",)
                )
                plan = cur.fetchone()
                assert plan is not None
                identity_mod.upsert_membership(
                    cur, iid, int(plan["id"]), "active", "zztest"
                )
                assert identity_mod.feature_role(cur, iid, "observer") == "navigator"
                assert identity_mod.role_meets(cur, iid, "observer", "activator") is True
                assert identity_mod.role_meets(cur, iid, "observer", "navigator") is True
                assert identity_mod.role_meets(cur, iid, "observer", "alumni") is True
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_me_access_role_elevates_with_observer_trial(client):
    email = "zztest-me-access-role@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Me Access")
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("SELECT id FROM plans WHERE slug = %s", ("observer-trial",))
            plan = cur.fetchone()
            identity_mod.upsert_membership(
                cur, iid, int(plan["id"]), "active", "zztest"
            )
    try:
        r = client.get("/api/auth/me", cookies=cookie_for("observer", iid))
        assert r.status_code == 200
        body = r.json()
        assert body["role"] == "observer"
        assert body["access_role"] == "navigator"
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))
