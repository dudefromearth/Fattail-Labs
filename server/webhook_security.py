"""Membership webhook anti-replay (auth hardening M7).

HMAC alone is not enough: a captured signed body could be replayed.
Require a timestamp *inside the signed JSON body* and reject:
  - missing / malformed timestamps
  - events older than max age (default 5 minutes)
  - events too far in the future (clock skew)
  - exact raw-body replays within the max-age window (in-process cache)

Single-worker launchd: in-memory replay set is sufficient. Multi-worker
deployments should move receipts to shared store later.
"""

from __future__ import annotations

import hashlib
import os
import threading
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        v = int(raw)
    except ValueError:
        return default
    return v if v > 0 else default


# Max age of webhook event (seconds). Default 5 minutes.
WEBHOOK_MAX_AGE_SEC = _env_int("LABS_WEBHOOK_MAX_AGE_SECONDS", 300)
# Allow small future skew (seconds).
WEBHOOK_FUTURE_SKEW_SEC = _env_int("LABS_WEBHOOK_FUTURE_SKEW_SECONDS", 60)


class _ReplayCache:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        # digest -> expires_at monotonic
        self._seen: dict[str, float] = {}

    def check_and_store(self, digest: str, *, ttl_sec: float) -> None:
        now = time.monotonic()
        with self._lock:
            # purge expired
            dead = [k for k, exp in self._seen.items() if exp <= now]
            for k in dead:
                del self._seen[k]
            if digest in self._seen:
                raise HTTPException(
                    status_code=409,
                    detail="Duplicate webhook (replay rejected)",
                )
            self._seen[digest] = now + ttl_sec

    def reset(self) -> None:
        with self._lock:
            self._seen.clear()


_replay = _ReplayCache()


def reset_webhook_replay_for_tests() -> None:
    _replay.reset()


def parse_webhook_timestamp(raw: Any) -> datetime:
    """Parse body timestamp to timezone-aware UTC datetime."""
    if raw is None or raw == "":
        raise HTTPException(
            status_code=422,
            detail=(
                "timestamp required in signed body "
                "(unix seconds or ISO-8601 UTC, e.g. 2026-08-03T12:00:00Z)"
            ),
        )
    if isinstance(raw, (int, float)) and not isinstance(raw, bool):
        try:
            return datetime.fromtimestamp(float(raw), tz=timezone.utc)
        except (OverflowError, OSError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="timestamp unix value out of range"
            ) from exc
    if isinstance(raw, str):
        s = raw.strip()
        # pure digits → unix
        if s.isdigit() or (s.startswith("-") and s[1:].isdigit()):
            try:
                return datetime.fromtimestamp(float(s), tz=timezone.utc)
            except (OverflowError, OSError, ValueError) as exc:
                raise HTTPException(
                    status_code=422, detail="timestamp unix value out of range"
                ) from exc
        s = s.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail="timestamp must be unix seconds or ISO-8601",
            ) from exc
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    raise HTTPException(status_code=422, detail="timestamp has invalid type")


def validate_webhook_timestamp(body: dict) -> datetime:
    """Validate freshness; return parsed UTC timestamp."""
    ts = body.get("timestamp", body.get("sent_at"))
    event_time = parse_webhook_timestamp(ts)
    now = datetime.now(timezone.utc)
    age = (now - event_time).total_seconds()
    if age > WEBHOOK_MAX_AGE_SEC:
        raise HTTPException(
            status_code=401,
            detail=(
                f"Webhook too old (max age {WEBHOOK_MAX_AGE_SEC}s) — "
                "re-sign with a current timestamp"
            ),
        )
    if age < -WEBHOOK_FUTURE_SKEW_SEC:
        raise HTTPException(
            status_code=401,
            detail="Webhook timestamp too far in the future",
        )
    return event_time


def reject_webhook_replay(provider: str, raw_body: bytes) -> None:
    """Reject exact raw-body replay within the max-age window."""
    digest = hashlib.sha256(
        provider.encode("utf-8") + b"\0" + raw_body
    ).hexdigest()
    _replay.check_and_store(digest, ttl_sec=float(WEBHOOK_MAX_AGE_SEC))
