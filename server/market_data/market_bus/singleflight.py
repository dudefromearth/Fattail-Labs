"""Single-flight: one fill per key; concurrent waiters share the result.

Late arrivals that miss in-flight registration still coalesce via a short
result park window (covers barrier-style stampedes after a fast fill).
"""

from __future__ import annotations

import threading
import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")

_PARK_S = 0.25


class _Flight:
    __slots__ = ("event", "value", "error")

    def __init__(self) -> None:
        self.event = threading.Event()
        self.value: Any = None
        self.error: BaseException | None = None


_lock = threading.Lock()
_flights: dict[str, _Flight] = {}
# key -> (deadline, value) | (deadline, None, error)
_parked: dict[str, tuple[float, Any, BaseException | None]] = {}


def do(key: str, fn: Callable[[], T]) -> T:
    now = time.monotonic()
    with _lock:
        parked = _parked.get(key)
        if parked and parked[0] > now:
            if parked[2] is not None:
                raise parked[2]
            return parked[1]  # type: ignore[return-value]
        if parked:
            _parked.pop(key, None)

        flight = _flights.get(key)
        if flight is None:
            flight = _Flight()
            _flights[key] = flight
            leader = True
        else:
            leader = False

    if not leader:
        flight.event.wait(timeout=120.0)
        if flight.error is not None:
            raise flight.error
        if not flight.event.is_set():
            raise RuntimeError(f"singleflight timeout for {key}")
        return flight.value  # type: ignore[return-value]

    try:
        flight.value = fn()
        val = flight.value
        with _lock:
            _parked[key] = (time.monotonic() + _PARK_S, val, None)
        return val  # type: ignore[return-value]
    except BaseException as exc:
        flight.error = exc
        with _lock:
            _parked[key] = (time.monotonic() + _PARK_S, None, exc)
        raise
    finally:
        flight.event.set()
        with _lock:
            if _flights.get(key) is flight:
                del _flights[key]
