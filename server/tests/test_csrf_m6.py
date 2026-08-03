"""M6 — Origin/Referer CSRF guard for cookie-authenticated mutations."""

from __future__ import annotations

from conftest import COOKIE, cookie_for
from csrf import allowed_origins, request_origin_allowed, should_check_csrf
from fastapi import Request
from starlette.datastructures import Headers


def test_allowed_origins_include_dev_defaults():
    origins = allowed_origins()
    assert "http://testserver" in origins or "http://localhost:3000" in origins


def test_mutation_with_session_cookie_wrong_origin_403(client):
    cookies = cookie_for("administrator", 0)
    # Override session Origin to evil site
    r = client.put(
        "/api/admin/access/policies/lesson:1",
        cookies=cookies,
        headers={"Origin": "https://evil.example"},
        json={"mode": "soft", "label": "csrf-probe"},
    )
    assert r.status_code == 403
    assert "csrf" in r.text.lower() or "origin" in r.text.lower()


def test_mutation_with_session_cookie_good_origin_not_csrf(client):
    cookies = cookie_for("administrator", 0)
    # Default client Origin is testserver — should pass CSRF (may 422 on policy)
    r = client.put(
        "/api/admin/access/policies/lesson:999991",
        cookies=cookies,
        json={"mode": "soft", "label": "csrf-ok"},
    )
    assert r.status_code != 403, r.text


def test_mutation_without_session_cookie_skips_csrf(client):
    # No cookie → login-like public POST path; CSRF middleware skips
    r = client.post(
        "/api/auth/login",
        headers={"Origin": "https://evil.example"},
        json={"email": "x@y.com", "password": "not-real-password-xx"},
    )
    # 401 invalid credentials, not 403 CSRF
    assert r.status_code in (401, 422)
    assert r.status_code != 403


def test_get_with_cookie_skips_csrf(client):
    cookies = cookie_for("administrator", 0)
    r = client.get(
        "/api/admin/access/policies",
        cookies=cookies,
        headers={"Origin": "https://evil.example"},
    )
    # GET is safe method — not blocked by CSRF (admin may still 200)
    assert r.status_code != 403


def test_webhook_without_cookie_skips_csrf(client):
    r = client.post(
        "/api/integrations/wordpress:fattail/membership",
        headers={"Origin": "https://evil.example", "Content-Type": "application/json"},
        content=b"{}",
    )
    # Bad signature / validation, not CSRF
    assert r.status_code != 403
