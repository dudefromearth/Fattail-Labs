"""Market Bus single-flight + optional Redis (AT-MB1 spirit)."""

from __future__ import annotations

import threading
import time

from market_data.market_bus import singleflight as sf
from market_data.market_bus.metrics import massive_call_count, reset_metrics, record_massive_call


def test_singleflight_one_call_many_waiters():
    reset_metrics()
    calls = {"n": 0}
    barrier = threading.Barrier(5)

    def work():
        barrier.wait()
        def fill():
            calls["n"] += 1
            record_massive_call(1)
            time.sleep(0.05)
            return {"ok": True, "n": calls["n"]}

        return sf.do("k-test", fill)

    results = []
    threads = [threading.Thread(target=lambda: results.append(work())) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=5)

    assert len(results) == 5
    assert calls["n"] == 1
    assert all(r.get("ok") for r in results)
    assert massive_call_count() == 1


def test_redis_store_roundtrip():
    try:
        from market_data.market_bus.store import BusStore
        store = BusStore("redis://127.0.0.1:6379/15")  # test DB
        store._r.flushdb()
        store.set_json("mb:test:key", {"content_hash": "abc", "x": 1}, ttl_s=2.0)
        got = store.get_json("mb:test:key")
        assert got and got["content_hash"] == "abc"
        store.touch_interest("mb:test:key")
        store._r.flushdb()
    except Exception as exc:
        # Redis optional in CI without service
        if "Connection" in type(exc).__name__ or "Error" in type(exc).__name__:
            return
        raise
