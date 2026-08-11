"""Time-to-expiry τ law (OPF29 · Spec §3.7)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Literal
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")
YEAR_SECONDS = 365.25 * 86400.0
MIN_TAU = 1.0 / 365.25 / 24.0 / 60.0  # 1 minute in year-fraction


Settlement = Literal["am", "pm"]


def expiry_instant(
    expiration: date | str,
    *,
    settlement: Settlement = "pm",
) -> datetime:
    """Expiry wall-clock instant in America/New_York.

    PM (default): 16:00 ET on expiration date.
    AM: 09:30 ET (opening auction / SOQ proxy for classic SPX AM).
    """
    if isinstance(expiration, str):
        expiration = date.fromisoformat(expiration[:10])
    if settlement == "am":
        t = time(9, 30, 0)
    elif settlement == "pm":
        t = time(16, 0, 0)
    else:
        raise ValueError(f"settlement must be am|pm, got {settlement!r}")
    return datetime.combine(expiration, t, tzinfo=NY)


def tau(
    expiration: date | str,
    as_of_clock: datetime | None = None,
    *,
    settlement: Settlement = "pm",
    min_tau: float | None = None,
    configured_floor: float | None = None,
) -> dict:
    """Compute τ year-fraction (Actual/365.25 continuous).

    Returns dict with tau, final_hour_clamped, seconds_to_expiry, settlement.
    """
    floor = MIN_TAU if min_tau is None else float(min_tau)
    if configured_floor is not None:
        floor = max(floor, float(configured_floor))

    now = as_of_clock
    if now is None:
        now = datetime.now(tz=NY)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc).astimezone(NY)
    else:
        now = now.astimezone(NY)

    exp_dt = expiry_instant(expiration, settlement=settlement)
    seconds = (exp_dt - now).total_seconds()
    raw_tau = seconds / YEAR_SECONDS if seconds > 0 else 0.0
    # wall-clock tau before floor
    wall = max(0.0, raw_tau)
    clamped = False
    t = wall
    if t < floor:
        if configured_floor is not None and configured_floor > MIN_TAU and wall < configured_floor:
            clamped = True
        t = floor if wall > 0 or seconds > -60 else floor  # still floor if barely past
        if wall <= 0 and seconds <= 0:
            t = floor  # expired / at instant → min for numerical stability when requested
            # For truly expired, still report min floor with clamp disclosure if higher floor
            if configured_floor is not None and configured_floor > MIN_TAU:
                clamped = True

    # Spec: τ ≥ 1-minute; do not flatline final hour with 1h floor
    if t < floor:
        t = floor

    return {
        "tau": float(t),
        "wall_tau": float(wall),
        "final_hour_clamped": bool(clamped),
        "seconds_to_expiry": float(seconds),
        "settlement": settlement,
        "expiry_instant": exp_dt.isoformat(),
        "as_of": now.isoformat(),
        "min_tau": float(floor),
    }


def calendar_dte(expiration: date | str, as_of: date | datetime | None = None) -> int:
    """Calendar days to expiration date (0 on expiry day)."""
    if isinstance(expiration, str):
        expiration = date.fromisoformat(expiration[:10])
    if as_of is None:
        as_of_d = datetime.now(tz=NY).date()
    elif isinstance(as_of, datetime):
        as_of_d = as_of.astimezone(NY).date() if as_of.tzinfo else as_of.date()
    else:
        as_of_d = as_of
    return max(0, (expiration - as_of_d).days)


def shift_clock(as_of: datetime, time_offset_hours: float) -> datetime:
    if as_of.tzinfo is None:
        as_of = as_of.replace(tzinfo=timezone.utc)
    return as_of + timedelta(hours=float(time_offset_hours))
