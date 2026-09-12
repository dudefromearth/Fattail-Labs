"""Rolling session refresh — pure-logic tests (no DB/app env needed)."""

import session_refresh as sr


def test_fresh_token_not_refreshed():
    now = 1_000_000
    assert sr._needs_refresh(now - 600, now, 86400) is False        # 10 min old


def test_old_token_refreshed():
    now = 1_000_000
    assert sr._needs_refresh(now - 2 * 86400, now, 86400) is True   # 2 days old


def test_exactly_at_threshold_refreshed():
    now = 1_000_000
    assert sr._needs_refresh(now - 86400, now, 86400) is True


def test_zero_iat_never_refreshed():
    assert sr._needs_refresh(0, 1_000_000, 86400) is False


class _Resp:
    def __init__(self, headers):
        self.raw_headers = headers


def test_detects_endpoint_managed_cookie():
    resp = _Resp([(b"set-cookie", b"ft_session=abc123; Path=/; HttpOnly")])
    assert sr._already_sets_session_cookie(resp, "ft_session") is True


def test_ignores_unrelated_cookies():
    resp = _Resp([
        (b"set-cookie", b"other=1; Path=/"),
        (b"content-type", b"text/html"),
    ])
    assert sr._already_sets_session_cookie(resp, "ft_session") is False


def test_refresh_after_default_when_unset(monkeypatch):
    monkeypatch.delenv("LABS_SESSION_REFRESH_SECONDS", raising=False)
    assert sr._refresh_after_seconds() == 86400


def test_refresh_after_env_override(monkeypatch):
    monkeypatch.setenv("LABS_SESSION_REFRESH_SECONDS", "3600")
    assert sr._refresh_after_seconds() == 3600


def test_refresh_after_bad_value_falls_back(monkeypatch):
    monkeypatch.setenv("LABS_SESSION_REFRESH_SECONDS", "not-a-number")
    assert sr._refresh_after_seconds() == 86400
