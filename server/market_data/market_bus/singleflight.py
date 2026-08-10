"""Single-flight: one fill per key; concurrent waiters share the result."""

from __future__ import annotations

import threading
from typing import Any, Callable, TypeVar

T = TypeVar("T")

_lock = threading.Lock()
# key -> (event, result_box) where result_box is {"v": val} or {"e": exc}
_flights: dict[str, tuple[threading.Event, dict[str, Any]]] = {}


def do(key: str, fn: Callable[[], T]) -> T:
    with _lock:
        flight = _flights.get(key)
        if flight is None:
            ev = threading.Event()
            box: dict[str, Any] = {}
            _flights[key] = (ev, box)
            leader = True
        else:
            ev, box = flight
            leader = False

    if not leader:
        ev.wait(timeout=120.0)
        if "e" in box:
            raise box["e"]
        if "v" in box:
            return box["v"]
        raise RuntimeError(f"singleflight incomplete for {key}")

    try:
        val = fn()
        box["v"] = val
        return val
    except BaseException as exc:
        box["e"] = exc
        raise
    finally:
        with _lock:
            _flights.pop(key, None)
        ev.set()
