"""M1 — auth endpoint rate limits (429)."""

from __future__ import annotations

import rate_limit as rl
from conftest import client  # noqa: F401 — fixture via pytest


def setup_function():
    rl.reset_rate_limiter_for_tests()


def test_login_rate_limit_by_ip(client):
    rl.reset_rate_limiter_for_tests()
    # Use low limit via module constants temporarily
    old = rl.LOGIN_LIMIT
    rl.LOGIN_LIMIT = 3
    try:
        body = {"email": "nobody@labs.test", "password": "wrong-password-xx"}
        codes = []
        for _ in range(4):
            r = client.post("/api/auth/login", json=body)
            codes.append(r.status_code)
        assert codes[:3] == [401, 401, 401]
        assert codes[3] == 429
        assert "Retry-After" in r.headers
    finally:
        rl.LOGIN_LIMIT = old
        rl.reset_rate_limiter_for_tests()


def test_register_rate_limit(client):
    rl.reset_rate_limiter_for_tests()
    old = rl.REGISTER_LIMIT
    rl.REGISTER_LIMIT = 2
    try:
        codes = []
        for i in range(3):
            r = client.post(
                "/api/auth/register",
                json={
                    "name": "RL",
                    "email": f"zztest-rl-{i}@labs.test",
                    "password": "longenoughpassword1",
                },
            )
            codes.append(r.status_code)
        # first two may 201/422/409; third must be 429 once limit hit
        assert 429 in codes
        assert codes[-1] == 429
    finally:
        rl.REGISTER_LIMIT = old
        rl.reset_rate_limiter_for_tests()


def test_sso_rate_limit(client):
    rl.reset_rate_limiter_for_tests()
    old = rl.SSO_LIMIT
    rl.SSO_LIMIT = 2
    try:
        codes = []
        for _ in range(3):
            r = client.get(
                "/api/auth/sso/wordpress:fattail",
                params={"sso": "not.a.jwt"},
            )
            codes.append(r.status_code)
        # missing/invalid token → 400/401 until rate limit
        assert codes[-1] == 429
    finally:
        rl.SSO_LIMIT = old
        rl.reset_rate_limiter_for_tests()
