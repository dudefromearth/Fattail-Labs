"""In-process rate limiting for auth endpoints (hardening M1).

Single-process safe (Labs uvicorn is typically one worker under launchd).
Uses monotonic time windows; no Redis dependency.

Limits are intentional product constants; override only via env for tests.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from config import get_config


class RateLimitExceeded(Exception):
    def __init__(self, retry_after_sec: int = 60):
        self.retry_after_sec = max(1, int(retry_after_sec))
        super().__init__("rate limit exceeded")


# Sourced from Config at import (boot already failed if missing/invalid).
# Tests may patch these module attributes.
_cfg = get_config()
LOGIN_LIMIT = _cfg.rl_login_per_min
LOGIN_WINDOW = 60.0
FORGOT_LIMIT = _cfg.rl_forgot_per_hour
FORGOT_WINDOW = 3600.0
REGISTER_LIMIT = _cfg.rl_register_per_min
REGISTER_WINDOW = 60.0
SSO_LIMIT = _cfg.rl_sso_per_min
SSO_WINDOW = 60.0
RESET_LIMIT = _cfg.rl_reset_per_min
RESET_WINDOW = 60.0


class _SlidingWindow:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, *, limit: int, window_sec: float) -> None:
        now = time.monotonic()
        cutoff = now - window_sec
        with self._lock:
            q = self._hits[key]
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                # rough retry-after from oldest hit
                retry = int(window_sec - (now - q[0])) + 1 if q else int(window_sec)
                raise RateLimitExceeded(retry_after_sec=retry)
            q.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


_limiter = _SlidingWindow()


def reset_rate_limiter_for_tests() -> None:
    _limiter.reset()


def client_ip(request: Request) -> str:
    """Best-effort client IP (first X-Forwarded-For hop when proxied)."""
    xff = request.headers.get("x-forwarded-for") or request.headers.get(
        "X-Forwarded-For"
    )
    if xff:
        return xff.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def check_rate_limit(key: str, *, limit: int, window_sec: float) -> None:
    try:
        _limiter.hit(key, limit=limit, window_sec=window_sec)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts — try again later",
            headers={"Retry-After": str(exc.retry_after_sec)},
        ) from exc


def rate_limit_login(request: Request, email: str) -> None:
    ip = client_ip(request)
    check_rate_limit(f"login:ip:{ip}", limit=LOGIN_LIMIT, window_sec=LOGIN_WINDOW)
    if email:
        check_rate_limit(
            f"login:email:{email.strip().lower()}",
            limit=LOGIN_LIMIT,
            window_sec=LOGIN_WINDOW,
        )


def rate_limit_forgot(request: Request, email: str) -> None:
    ip = client_ip(request)
    check_rate_limit(f"forgot:ip:{ip}", limit=FORGOT_LIMIT, window_sec=FORGOT_WINDOW)
    if email:
        check_rate_limit(
            f"forgot:email:{email.strip().lower()}",
            limit=FORGOT_LIMIT,
            window_sec=FORGOT_WINDOW,
        )


def rate_limit_register(request: Request) -> None:
    ip = client_ip(request)
    check_rate_limit(
        f"register:ip:{ip}", limit=REGISTER_LIMIT, window_sec=REGISTER_WINDOW
    )


def rate_limit_sso(request: Request) -> None:
    ip = client_ip(request)
    check_rate_limit(f"sso:ip:{ip}", limit=SSO_LIMIT, window_sec=SSO_WINDOW)


def rate_limit_reset(request: Request) -> None:
    ip = client_ip(request)
    check_rate_limit(f"reset:ip:{ip}", limit=RESET_LIMIT, window_sec=RESET_WINDOW)
