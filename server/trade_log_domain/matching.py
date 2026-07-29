"""FIFO open→close structure matching. Port of matchOpenClose."""

from __future__ import annotations

from typing import Any

from trade_log_domain.structure import (
    structure_key,
    trade_is_close_fill,
    ymd_from_exec,
)


def match_open_close(trades: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return list of {open, open_day, close, close_day} (close may be None)."""
    sorted_t = sorted(
        trades,
        key=lambda t: (t.get("exec_at") or "", int(t.get("id") or 0)),
    )
    queues: dict[str, list[dict[str, Any]]] = {}
    result: list[dict[str, Any]] = []

    for t in sorted_t:
        day = ymd_from_exec(t.get("exec_at"))
        if not day:
            continue
        if t.get("strategy") == "NOTE" and not (t.get("legs") or []):
            continue

        key = structure_key(t)
        is_close = trade_is_close_fill(t)

        if not is_close:
            m = {
                "open": t,
                "open_day": day,
                "close": None,
                "close_day": None,
            }
            queues.setdefault(key, []).append(m)
            result.append(m)
            continue

        q = queues.get(key) or []
        open_slot = next((m for m in q if m["close"] is None), None)
        if open_slot is not None:
            open_slot["close"] = t
            open_slot["close_day"] = day

    return result
