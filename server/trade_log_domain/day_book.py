"""Journal day book: open / fill activity / union. Port of journalDayBook.ts."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from trade_log_domain.matching import match_open_close
from trade_log_domain.structure import (
    trade_expiry,
    trade_is_close_fill,
    ymd_from_exec,
)


def _item(
    trade: dict[str, Any],
    role: str,
    opened_on: str,
    closed_on: str | None,
    expires_on: str | None,
) -> dict[str, Any]:
    return {
        "trade": trade,
        "trade_id": int(trade["id"]),
        "role": role,
        "opened_on": opened_on,
        "closed_on": closed_on,
        "expires_on": expires_on,
    }


def opens_on_day(trades: list[dict[str, Any]], day_ymd: str) -> list[dict[str, Any]]:
    matched = match_open_close(trades)
    out: list[dict[str, Any]] = []
    for m in matched:
        if m["open_day"] > day_ymd:
            continue
        if m["close_day"] is not None and m["close_day"] <= day_ymd:
            continue
        exp = trade_expiry(m["open"])
        if exp and exp < day_ymd:
            continue
        out.append(
            _item(
                m["open"],
                "open",
                m["open_day"],
                m["close_day"],
                exp,
            )
        )
    # Newest opens first (opened_on desc, id desc) — match journalDayBook.ts
    out.sort(key=lambda i: (i["opened_on"], int(i["trade"]["id"])), reverse=True)
    return out


def fills_on_day(trades: list[dict[str, Any]], day_ymd: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for t in trades:
        day = ymd_from_exec(t.get("exec_at"))
        if day != day_ymd:
            continue
        if t.get("strategy") == "NOTE" and not (t.get("legs") or []):
            continue
        is_close = trade_is_close_fill(t)
        out.append(
            _item(
                t,
                "fill_close" if is_close else "fill_open",
                day,
                day if is_close else None,
                trade_expiry(t),
            )
        )
    out.sort(
        key=lambda i: (i["trade"].get("exec_at") or "", int(i["trade"]["id"])),
        reverse=True,
    )
    return out


def union_day_book_items(
    open_items: list[dict[str, Any]],
    activity: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    seen: set[int] = set()
    items: list[dict[str, Any]] = []
    for o in open_items:
        tid = int(o["trade"]["id"])
        if tid in seen:
            continue
        seen.add(tid)
        items.append(o)
    for a in activity:
        tid = int(a["trade"]["id"])
        if tid in seen:
            continue
        seen.add(tid)
        items.append(a)
    return items


def build_day_book(trades: list[dict[str, Any]], day_ymd: str) -> dict[str, Any]:
    """Build day book for a YMD string (server has no Date local calendar)."""
    activity = fills_on_day(trades, day_ymd)
    open_items = opens_on_day(trades, day_ymd)
    items = union_day_book_items(open_items, activity)
    return {
        "day": day_ymd,
        "activity": activity,
        "open": open_items,
        "items": items,
        "open_ids": [int(i["trade"]["id"]) for i in open_items],
    }


def _parse_ymd(s: str) -> date | None:
    try:
        y, m, d = s.split("-")
        return date(int(y), int(m), int(d))
    except (ValueError, TypeError):
        return None


def days_with_book_interest(
    trades: list[dict[str, Any]],
    range_start: str,
    range_end: str,
) -> list[str]:
    """Sorted unique days with activity or open interest in [start, end]."""
    days: set[str] = set()
    for t in trades:
        d = ymd_from_exec(t.get("exec_at"))
        if d and range_start <= d <= range_end:
            days.add(d)

    matched = match_open_close(trades)
    for m in matched:
        exp = trade_expiry(m["open"])
        end = m["close_day"] or exp or range_end
        if exp and (not m["close_day"] or exp < m["close_day"]):
            end = m["close_day"] or range_end
        if m["close_day"]:
            end = m["close_day"]
        start = m["open_day"] if m["open_day"] > range_start else range_start
        stop = end if end < range_end else range_end
        if start > stop:
            continue
        close_exclusive = m["close_day"]
        cur = _parse_ymd(start)
        last = _parse_ymd(stop)
        if not cur or not last:
            continue
        # Cap walk length (multi-year open books); fill days still come from exec_at above.
        guard = 0
        while cur <= last and guard < 4000:
            y = cur.isoformat()
            if not close_exclusive or y < close_exclusive:
                if exp and y > exp:
                    break
                days.add(y)
            cur += timedelta(days=1)
            guard += 1
    return sorted(days)

