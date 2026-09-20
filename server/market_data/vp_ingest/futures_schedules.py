"""Vendor schedules / market-status. Halt is never a gap.

Live HTTP StudioOne-only. Tests inject.
ES/MES have TWO daily stops (CME equity-index Globex):
  cash-close pause  16:15–16:30 America/New_York  Mon–Fri
  maintenance       17:00–18:00 America/New_York  Mon–Thu
Vendor market-status remains SoR for open/closed; these windows are
lawful idle even if the vendor row still says open.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
CT = ZoneInfo("America/Chicago")
CME_EQUITY_PRODUCTS = frozenset({"ES", "MES"})
# Named windows in ET minutes.
CASH_CLOSE_START_MIN = 16 * 60 + 15
CASH_CLOSE_END_MIN = 16 * 60 + 30
MAINTENANCE_START_MIN = 17 * 60
MAINTENANCE_END_MIN = 18 * 60


def _et(now: datetime | None) -> datetime:
    ts = now or datetime.now(tz=ET)
    if ts.tzinfo is None:
        return ts.replace(tzinfo=ET)
    return ts.astimezone(ET)


def es_mes_halt_window(now: datetime | None = None) -> str | None:
    """Named lawful stop covering *now*, or None."""
    ts = _et(now)
    wd = ts.weekday()
    minutes = ts.hour * 60 + ts.minute
    if wd <= 4 and CASH_CLOSE_START_MIN <= minutes < CASH_CLOSE_END_MIN:
        return "cash_close"
    if wd <= 3 and MAINTENANCE_START_MIN <= minutes < MAINTENANCE_END_MIN:
        return "maintenance"
    return None


def cme_equity_index_halt_now(now: datetime | None = None) -> bool:
    """True during either daily stop. Prefer es_mes_halt_window for the name."""
    return es_mes_halt_window(now) is not None


def session_is_open(status: dict[str, Any] | None, *, product: str) -> bool:
    """True only when vendor says the product session is open (not halt/closed)."""
    if not status:
        return False
    # Shapes vary; accept explicit open/halt/closed without inventing hours.
    st = str(status.get("status") or status.get("market") or "").lower()
    if st in ("halt", "halted", "closed", "maintenance"):
        return False
    products = status.get("products") or status.get("results") or []
    if isinstance(products, list):
        for row in products:
            if not isinstance(row, dict):
                continue
            code = str(row.get("product_code") or row.get("product") or "").upper()
            if code and code != product.upper():
                continue
            rst = str(
                row.get("market_event") or row.get("status") or row.get("state") or st
            ).lower()
            if rst in ("halt", "halted", "closed", "maintenance"):
                return False
            if rst in ("open", "regular", "extended"):
                return True
    if st in ("open", "regular", "extended"):
        return True
    return False


def halt_is_scheduled(
    schedule: dict[str, Any] | None,
    *,
    now_ns: int | None = None,
    now: datetime | None = None,
    product: str | None = None,
) -> bool:
    """True only when a maintenance window covers *now*. A halt listed
    for later today is not a gap suppressor yet."""
    if product and product.upper() in CME_EQUITY_PRODUCTS and es_mes_halt_window(now):
        return True
    if not schedule:
        return False
    events = schedule.get("results") or schedule.get("events") or []
    if not isinstance(events, list):
        return bool(schedule.get("maintenance") or schedule.get("halt")) and cme_equity_index_halt_now(now)
    ts = now or datetime.now(tz=CT)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=CT)
    for ev in events:
        if not isinstance(ev, dict):
            continue
        kind = str(ev.get("type") or ev.get("name") or ev.get("event") or "").lower()
        if "halt" not in kind and "maintenance" not in kind:
            continue
        start = ev.get("start") or ev.get("begin") or ev.get("start_time")
        end = ev.get("end") or ev.get("end_time")
        if start and end:
            try:
                from datetime import datetime as dt

                s = dt.fromisoformat(str(start).replace("Z", "+00:00"))
                e = dt.fromisoformat(str(end).replace("Z", "+00:00"))
                if s <= ts <= e:
                    return True
            except ValueError:
                continue
        # Event named halt but no window → only if CME daily halt is now.
        if cme_equity_index_halt_now(ts):
            return True
    return False
