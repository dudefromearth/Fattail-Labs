"""FIFO open→close structure matching. Port of matchOpenClose.

Safety: refuse to pair open→close when the hold span is absurdly long
(e.g. spreadsheet year typo 2026-05-12 open → 2027-05-12 close). That pairing
used to keep the structure in open interest for a full year on every journal day.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from trade_log_domain.structure import (
    structure_key,
    trade_is_close_fill,
    ymd_from_exec,
)

# Max calendar days open→close for a matched pair. Legitimate multi-day holds
# in the 0DTE book are ~1 week; a year-long pair is always bad data.
# Unmatched opens past this window are also dropped from open-interest display.
MAX_STRUCTURE_HOLD_DAYS = 30


def _parse_ymd(s: str | None) -> date | None:
    if not s or len(s) < 10 or s[4] != "-" or s[7] != "-":
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def calendar_days_between(open_day: str, close_day: str) -> int | None:
    """Inclusive calendar span in days (same day → 0). None if unparseable."""
    a, b = _parse_ymd(open_day), _parse_ymd(close_day)
    if a is None or b is None:
        return None
    return (b - a).days


def hold_within_limit(open_day: str, close_day: str) -> bool:
    """True if close may be paired with open under MAX_STRUCTURE_HOLD_DAYS."""
    span = calendar_days_between(open_day, close_day)
    if span is None:
        return False
    if span < 0:
        return False
    return span <= MAX_STRUCTURE_HOLD_DAYS


def match_open_close(trades: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return list of {open, open_day, close, close_day} (close may be None).

    FIFO by structure_key. A close is **not** paired to an open when the hold
    would exceed MAX_STRUCTURE_HOLD_DAYS (orphaned close; open stays unmatched).
    """
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
        # Prefer oldest unmatched open that is within the hold window.
        open_slot = next(
            (
                m
                for m in q
                if m["close"] is None
                and hold_within_limit(str(m["open_day"]), day)
            ),
            None,
        )
        if open_slot is not None:
            open_slot["close"] = t
            open_slot["close_day"] = day

    return result
