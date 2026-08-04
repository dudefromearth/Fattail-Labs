"""Entry session + DTE helpers for honest fill timing.

Precept #1: fills are tied to a session fill clock (and optional conditions),
not a silent daily-open fantasy when the Spec says afternoon/closing.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

DTE = Literal[0, 1]
EntrySession = Literal["morning", "afternoon", "closing"]
# How entry is authorized within the chosen session
EntryFill = Literal["session_time", "condition", "session_and_condition"]

DTE_LABELS: dict[int, str] = {
    0: "0 DTE (expires entry day)",
    1: "1 DTE (expires next session)",
}

ENTRY_SESSION_LABELS: dict[str, str] = {
    "morning": "Morning",
    "afternoon": "Afternoon",
    "closing": "Closing session",
}

ENTRY_FILL_LABELS: dict[str, str] = {
    "session_time": "At session time (if conditions allow)",
    "condition": "When condition is true (checked at session time)",
    "session_and_condition": "Session time AND condition",
}


@dataclass(frozen=True)
class SessionWindow:
    """RTH session bucket with a representative fill clock (ET)."""

    key: EntrySession
    label: str
    # Single minute used for fill proxy (Massive 1-minute bar)
    fill_et: str  # "HH:MM"
    window_start_et: str
    window_end_et: str


SESSIONS: dict[str, SessionWindow] = {
    "morning": SessionWindow(
        "morning",
        "Morning",
        fill_et="10:00",
        window_start_et="09:45",
        window_end_et="11:00",
    ),
    "afternoon": SessionWindow(
        "afternoon",
        "Afternoon",
        fill_et="14:30",
        window_start_et="14:00",
        window_end_et="15:15",
    ),
    "closing": SessionWindow(
        "closing",
        "Closing session",
        fill_et="15:45",
        window_start_et="15:30",
        window_end_et="15:55",
    ),
}


def get_session(key: str) -> SessionWindow:
    return SESSIONS.get(key) or SESSIONS["afternoon"]


def parse_hhmm(hhmm: str) -> tuple[int, int]:
    h, m = hhmm.strip().split(":")
    return int(h), int(m)


def et_datetime(day: str, hhmm: str) -> datetime:
    y, mo, d = (int(x) for x in day.split("-"))
    h, mi = parse_hhmm(hhmm)
    return datetime(y, mo, d, h, mi, tzinfo=ET)


def et_to_utc_ms(day: str, hhmm: str) -> int:
    return int(et_datetime(day, hhmm).timestamp() * 1000)


def next_trading_day(day_iso: str, session_dates: list[str]) -> str | None:
    """Next date strictly after day_iso that appears in session_dates (sorted)."""
    for d in session_dates:
        if d > day_iso:
            return d
    return None


def expiration_for_entry(entry_day: str, dte: int, session_dates: list[str]) -> str | None:
    """Map entry day + DTE → option expiration date."""
    dte = int(dte)
    if dte == 0:
        return entry_day
    if dte == 1:
        return next_trading_day(entry_day, session_dates)
    return None


def condition_passes_open_move(
    *,
    open_move_max_pct: float | None,
    spot_open: float,
    prior_close: float | None,
) -> tuple[bool, str | None]:
    """Open-range condition (session-independent feature)."""
    if open_move_max_pct is None:
        return True, None
    if prior_close is None or prior_close <= 0 or spot_open <= 0:
        return False, "no_prior_close"
    move = abs(spot_open / prior_close - 1.0)
    if move > open_move_max_pct:
        return False, f"open_move_{move:.3%}"
    return True, None


def should_enter(
    *,
    fill_mode: str,
    condition_ok: bool,
    condition_reason: str | None,
) -> tuple[bool, str | None]:
    """Decide entry from fill mode + condition result.

    - session_time: enter at session fill clock unless a *blocking* condition fails
      (when no condition configured, condition_ok is True).
    - condition: enter only if condition_ok (evaluated at session time in this engine).
    - session_and_condition: same as condition for now (session supplies the clock;
      condition must pass). Distinct label for product clarity / future multi-check.
    """
    mode = (fill_mode or "session_time").strip()
    if mode == "session_time":
        if not condition_ok:
            return False, condition_reason or "condition_failed"
        return True, None
    if mode in ("condition", "session_and_condition"):
        if not condition_ok:
            return False, condition_reason or "condition_failed"
        return True, None
    return False, "bad_fill_mode"
