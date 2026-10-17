"""Native Billing v2.0 — deterministic period arithmetic.  Spec §5.4 / §5.4.1.

PURE. No DB, no network, no clock reads except where passed in. Every billing date
in the system comes from here, so this module is the one that must be boring.

THE TWO RULES THAT COST US A REWRITE:

  1. anchor_at is the DUE DATE, not the subscription start (§5.4.1). Anchoring on
     _schedule_start reproduced Woo's real next-payment date on only 88 of 204 live
     subscriptions; anchoring on the due date reproduced 204 of 204.

  2. Dates are computed from the immutable anchor plus N intervals — never by adding
     an interval to now(), which drifts a few minutes per cycle and eventually walks
     a weekly subscriber across a day boundary.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import datetime, timedelta

UNITS = ("day", "week", "month", "year")


class PeriodError(ValueError):
    pass


def _is_leap(y: int) -> bool:
    return calendar.isleap(y)


def add_interval(anchor: datetime, unit: str, count: int, n: int = 1) -> datetime:
    """anchor + (n × count) of unit, clamped. Always computed FROM THE ANCHOR, so
    repeated application cannot accumulate error."""
    if unit not in UNITS:
        raise PeriodError(f"unknown interval unit {unit!r}")
    if count < 1 or n < 0:
        raise PeriodError(f"bad interval count={count} n={n}")
    steps = count * n
    if unit == "day":
        return anchor + timedelta(days=steps)
    if unit == "week":
        return anchor + timedelta(weeks=steps)
    if unit == "month":
        total = anchor.month - 1 + steps
        year = anchor.year + total // 12
        month = total % 12 + 1
        # Clamp the day to the target month's length. Jan 31 -> Feb 28/29 -> Mar 31:
        # clamping is applied per period FROM the anchor, so it never moves the anchor
        # and a short month cannot permanently drag the series earlier.
        day = min(anchor.day, calendar.monthrange(year, month)[1])
        return anchor.replace(year=year, month=month, day=day)
    # year
    year = anchor.year + steps
    day = anchor.day
    if anchor.month == 2 and day == 29 and not _is_leap(year):
        day = 28          # Feb 29 -> Feb 28 in non-leap years; returns on the next leap
    return anchor.replace(year=year, day=day)


@dataclass(frozen=True)
class Schedule:
    """Everything needed to decide when, and whether, to charge."""
    anchor_at: datetime
    interval_unit: str
    interval_count: int = 1
    period_index: int = 0            # periods Labs itself has charged
    ends_at: datetime | None = None  # PRIMARY stop (imported from Woo)
    max_periods: int | None = None   # derived secondary guard (§8.4)

    def period_start(self, index: int | None = None) -> datetime:
        i = self.period_index if index is None else index
        return add_interval(self.anchor_at, self.interval_unit, self.interval_count, i)

    def period_end(self, index: int | None = None) -> datetime:
        i = self.period_index if index is None else index
        return add_interval(self.anchor_at, self.interval_unit, self.interval_count, i + 1)

    def next_charge_at(self) -> datetime | None:
        """The instant the NEXT charge is due, or None when nothing further is owed.

        period_index 0 is due AT the anchor — that is what makes an imported
        subscription land on Woo's exact date with no arithmetic (§5.4.1)."""
        if self.max_periods is not None and self.period_index >= self.max_periods:
            return None
        due = self.period_start()
        if self.ends_at is not None and due > self.ends_at:
            return None
        return due

    def is_terminal(self) -> bool:
        return self.next_charge_at() is None

    def advance(self) -> "Schedule":
        """After a successful charge. Returns a new Schedule — never mutates."""
        return Schedule(self.anchor_at, self.interval_unit, self.interval_count,
                        self.period_index + 1, self.ends_at, self.max_periods)


def derive_max_periods(anchor_at: datetime, unit: str, count: int,
                       ends_at: datetime | None) -> int | None:
    """§8.4 — max_periods is DERIVED from ends_at, never from the product.

    Observer terms in the live book are 1, 2, 4, 5, 6 and 12 weeks. A hardcoded 6
    would have halved one active member's access.

    Counts how many period starts fall at or before ends_at, so the guard can never
    authorise a charge the ends_at rule would refuse."""
    if ends_at is None:
        return None
    n = 0
    while n < 10_000:
        if add_interval(anchor_at, unit, count, n) > ends_at:
            break
        n += 1
    return n


def import_from_woo(*, schedule_next_payment: datetime | None,
                    schedule_start: datetime | None,
                    schedule_end: datetime | None,
                    billing_period: str, billing_interval: int) -> Schedule:
    """§5.4.1 + §9.2 — build a Schedule from WooCommerce meta.

    anchor_at = _schedule_next_payment (NOT _schedule_start), period_index = 0, so
    the first Labs charge needs no arithmetic and drift is zero by construction.

    When _schedule_next_payment is empty but _schedule_end is set, the subscription
    is in its FINAL period: it must expire at ends_at and must never be charged.
    Nine live Observers are in exactly that state."""
    if schedule_next_payment is not None:
        anchor = schedule_next_payment
    elif schedule_start is not None:
        anchor = schedule_start          # final period / no further payment
    else:
        raise PeriodError("subscription has neither a next payment nor a start date")

    max_p = derive_max_periods(anchor, billing_period, billing_interval, schedule_end)
    if schedule_next_payment is None:
        max_p = 0                        # nothing further is owed, full stop

    return Schedule(anchor_at=anchor, interval_unit=billing_period,
                    interval_count=billing_interval, period_index=0,
                    ends_at=schedule_end, max_periods=max_p)


def prorated_credit(*, amount_minor: int, period_start: datetime,
                    period_end: datetime, at: datetime) -> int:
    """§8.2 — the unused remainder of a period, floored to the minor unit.

    FLOORED deliberately: rounding a credit up would let a member repeatedly
    upgrade/downgrade to extract fractions of a cent. The member loses at most one
    cent per switch; we never pay out more than was unused.
    """
    if not isinstance(amount_minor, int):
        raise PeriodError("amount must be int minor units")
    total = (period_end - period_start).total_seconds()
    if total <= 0:
        raise PeriodError("period_end must be after period_start")
    if at <= period_start:
        return amount_minor                 # nothing consumed
    if at >= period_end:
        return 0                            # fully consumed
    remaining = (period_end - at).total_seconds()
    return (amount_minor * int(remaining)) // int(total)


def upgrade_charge(*, old_amount_minor: int, new_amount_minor: int,
                   period_start: datetime, period_end: datetime,
                   at: datetime) -> tuple[int, int]:
    """§8.2 upgrade-now: (amount_to_charge, credit_applied).

    Never returns a negative charge — if the credit exceeds the new plan's price the
    charge is 0 and the excess is simply not refunded, matching the spec's
    'no refund on downgrade' rule rather than inventing a payout path."""
    credit = prorated_credit(amount_minor=old_amount_minor, period_start=period_start,
                             period_end=period_end, at=at)
    return max(0, new_amount_minor - credit), credit
