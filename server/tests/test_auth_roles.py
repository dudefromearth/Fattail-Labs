"""Auth surface + the role ladder (Identity & Access spec)."""

import auth
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


def test_role_ladder_is_cumulative():
    order = ("observer", "alumni", "activator", "navigator", "administrator")
    for i, role in enumerate(order):
        for j, minimum in enumerate(order):
            assert auth.role_at_least(role, minimum) is (i >= j)


def test_garbage_session_cookie_is_anonymous(client):
    from conftest import COOKIE
    r = client.get("/api/auth/me", cookies={COOKIE: "not-a-jwt"})
    assert r.status_code == 401
