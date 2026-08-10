"""Process-local counters for AT-MB1 (Massive call rate vs client count)."""

from __future__ import annotations

import threading

_lock = threading.Lock()
_massive_calls = 0


def record_massive_call(n: int = 1) -> None:
    global _massive_calls
    with _lock:
        _massive_calls += int(n)


def massive_call_count() -> int:
    with _lock:
        return _massive_calls


def reset_metrics() -> None:
    global _massive_calls
    with _lock:
        _massive_calls = 0
