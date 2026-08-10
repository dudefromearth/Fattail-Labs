"""Redis last-value store + interest TTL (MB Spec)."""

from __future__ import annotations

import json
import threading
import time
from typing import Any

from market_data.market_bus.config import bus_enabled, chain_ttl_s, interest_grace_s, redis_url

_store_lock = threading.Lock()
_store: "BusStore | None" = None


class BusStore:
    def __init__(self, url: str | None = None) -> None:
        import redis

        self._url = url or redis_url()
        self._r = redis.Redis.from_url(self._url, decode_responses=True)
        self._r.ping()

    def ping(self) -> bool:
        return bool(self._r.ping())

    def chain_key(self, feed: str, expiration: str, side: str) -> str:
        return f"mb:chain:{feed}:{expiration}:{side}"

    def get_json(self, key: str) -> dict[str, Any] | None:
        raw = self._r.get(key)
        if not raw:
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return data if isinstance(data, dict) else None

    def set_json(self, key: str, doc: dict[str, Any], *, ttl_s: float | None = None) -> None:
        ttl = float(ttl_s if ttl_s is not None else chain_ttl_s())
        # TTL slightly longer than refresh (Spec §5.2)
        ex = max(2, int(ttl * 3))
        self._r.set(key, json.dumps(doc, default=str, separators=(",", ":")), ex=ex)
        try:
            self._r.publish(
                "mb:pub",
                json.dumps(
                    {"topic": key, "hash": doc.get("content_hash"), "ts": time.time()},
                    default=str,
                ),
            )
        except Exception:
            pass  # pub is best-effort

    def touch_interest(self, topic: str) -> None:
        grace = interest_grace_s()
        self._r.set(f"mb:interest:{topic}", str(time.time()), ex=grace)

    def list_interest_topics(self, prefix: str = "mb:chain:") -> list[str]:
        out: list[str] = []
        for k in self._r.scan_iter(match="mb:interest:*", count=100):
            topic = str(k).removeprefix("mb:interest:")
            if topic.startswith(prefix) or prefix == "*":
                out.append(topic)
        return out

    def get_chain(
        self, feed: str, expiration: str, side: str
    ) -> dict[str, Any] | None:
        return self.get_json(self.chain_key(feed, expiration, side))

    def set_chain(
        self, feed: str, expiration: str, side: str, payload: dict[str, Any]
    ) -> None:
        key = self.chain_key(feed, expiration, side)
        self.set_json(key, payload)
        self.touch_interest(key)


def get_store() -> BusStore | None:
    """Return shared store when bus enabled; None when disabled (local-cache path)."""
    if not bus_enabled():
        return None
    global _store
    with _store_lock:
        if _store is None:
            _store = BusStore()
        return _store
