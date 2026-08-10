"""Market Bus config — fail loud when enabled without Redis."""

from __future__ import annotations

import os


def bus_enabled() -> bool:
    """LABS_MARKET_BUS=1 enables Redis-backed generations (MB-P1+)."""
    return (os.environ.get("LABS_MARKET_BUS") or "").strip() in ("1", "true", "yes", "on")


def redis_url() -> str:
    raw = (os.environ.get("REDIS_URL") or os.environ.get("LABS_REDIS_URL") or "").strip()
    if bus_enabled() and not raw:
        raise RuntimeError(
            "LABS_MARKET_BUS is enabled but REDIS_URL (or LABS_REDIS_URL) is missing"
        )
    return raw or "redis://127.0.0.1:6379/0"


def chain_ttl_s() -> float:
    try:
        return float((os.environ.get("LABS_MB_CHAIN_TTL_S") or "2.0").strip())
    except ValueError as exc:
        raise RuntimeError("LABS_MB_CHAIN_TTL_S must be a float") from exc


def interest_grace_s() -> int:
    try:
        return int((os.environ.get("LABS_MB_INTEREST_GRACE_S") or "45").strip())
    except ValueError as exc:
        raise RuntimeError("LABS_MB_INTEREST_GRACE_S must be an int") from exc
