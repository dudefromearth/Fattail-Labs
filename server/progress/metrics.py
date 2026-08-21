"""Progress metrics — pure derivation from normalised source facts.

No I/O, no clock reads beyond the injected `now`, no config. Every function
here is deterministic so the arithmetic can be locked down by tests.

FIVE DATA TRAPS this module encodes, each learned from the live data:

1. Free Observers are not Observers. The Nov 2025 - Feb 2026 era issued
   zero-price Observer subscriptions (later bulk-cancelled). Any Observer
   subscription whose recurring total is <= 0 is excluded everywhere. This is
   a rule about the record, not a hardcoded date.
2. Membership records are not payers. Navigator membership records are also
   minted by 0-DTE SSO login. We count SUBSCRIPTIONS, so grants never inflate
   a paying number.
3. Revenue is never split new-vs-renewal. Observer bills weekly and Activator
   monthly; counting only first orders understates a tier several-fold.
   Every order line is counted, grouped by product.
4. Term length is read per subscription, never assumed. Observer ran 28 days
   through Jul 2026 and 42 days from Aug 2026.
5. Partial months are labelled, never annualised silently.
"""

from __future__ import annotations

import datetime as dt
from collections import defaultdict
from typing import Any, Iterable, Sequence

# Tiers that represent a paying recurring member.
RECURRING_TIERS: tuple[str, ...] = ("Observer", "Activator", "Navigator")
# Tiers billed up front for a long period.
UPFRONT_TIERS: tuple[str, ...] = ("Navigator Annual", "Navigator Lifetime")
PAID_TIERS: tuple[str, ...] = ("Activator", "Navigator", "Navigator Annual", "Navigator Lifetime")

LIVE_STATUSES: frozenset[str] = frozenset({"active", "pending-cancel"})
FAILED_STATUSES: frozenset[str] = frozenset({"on-hold", "pending"})


class MetricsError(ValueError):
    """Raised when source facts are structurally unusable. Fail loud."""


def _as_date(value: Any) -> dt.datetime | None:
    if value in (None, "", 0, "0"):
        return None
    if isinstance(value, dt.datetime):
        return value
    if isinstance(value, dt.date):
        return dt.datetime(value.year, value.month, value.day)
    text = str(value).strip().replace("T", " ").replace("Z", "")
    if not text or text.startswith("0000"):
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(text[: len(fmt) + 2].strip(), fmt)
        except ValueError:
            continue
    return None


def is_real_observer(sub: dict) -> bool:
    """Trap 1 — a free/comped Observer is not part of the paid funnel."""
    if sub.get("product") != "Observer":
        return True
    try:
        return float(sub.get("recurring_total") or 0) > 0
    except (TypeError, ValueError):
        return False


def real_subscriptions(subs: Iterable[dict]) -> list[dict]:
    return [s for s in subs if is_real_observer(s)]


def ended_at(sub: dict) -> dt.datetime | None:
    """When a subscription stopped billing: cancellation, else scheduled end."""
    cancelled = _as_date(sub.get("cancelled_at"))
    if cancelled:
        return cancelled
    if str(sub.get("status")) == "expired":
        return _as_date(sub.get("ends_at"))
    return None


def term_days(sub: dict) -> int | None:
    """Trap 4 — read the configured term off the record, never assume."""
    start = _as_date(sub.get("start_at"))
    end = _as_date(sub.get("ends_at"))
    if not start or not end or end <= start:
        return None
    return round((end - start).total_seconds() / 86400)


def members_by_tier(subs: Sequence[dict]) -> dict[str, dict[str, int]]:
    """Trap 2 — paying counts come from subscriptions, never membership rows."""
    out: dict[str, dict[str, int]] = {}
    for sub in real_subscriptions(subs):
        tier = str(sub.get("product") or "unknown")
        bucket = out.setdefault(tier, {"paying": 0, "payment_failed": 0})
        status = str(sub.get("status") or "")
        if status in LIVE_STATUSES:
            bucket["paying"] += 1
        elif status in FAILED_STATUSES:
            bucket["payment_failed"] += 1
    return out


def revenue_by_month(orders: Sequence[dict], months: int, now: dt.datetime) -> list[dict]:
    """Trap 3 — every order line, grouped by product. Initial and renewal alike."""
    horizon = _month_starts(months, now)
    keys = {m.strftime("%Y-%m") for m in horizon}
    buckets: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    counts: dict[str, int] = defaultdict(int)
    for order in orders:
        when = _as_date(order.get("created_at"))
        if not when:
            continue
        key = when.strftime("%Y-%m")
        if key not in keys:
            continue
        product = str(order.get("product") or "unknown")
        try:
            buckets[key][product] += float(order.get("line_total") or 0)
        except (TypeError, ValueError):
            raise MetricsError(f"order {order.get('id')!r} has a non-numeric line_total")
        counts[key] += 1
    rows: list[dict] = []
    this_month = now.strftime("%Y-%m")
    for m in horizon:
        key = m.strftime("%Y-%m")
        by_tier = {k: round(v, 2) for k, v in sorted(buckets.get(key, {}).items())}
        rows.append(
            {
                "month": key,
                "by_tier": by_tier,
                "total": round(sum(by_tier.values()), 2),
                "orders": counts.get(key, 0),
                "partial": key == this_month,  # Trap 5
                "days_elapsed": now.day if key == this_month else _days_in_month(m),
            }
        )
    return rows


def churn_by_month(subs: Sequence[dict], tier: str, months: int, now: dt.datetime) -> list[dict]:
    """Cancellations in the month over everyone at risk that month."""
    pool = [s for s in real_subscriptions(subs) if s.get("product") == tier]
    rows: list[dict] = []
    for start in _month_starts(months, now):
        end = _next_month(start)
        window_end = min(end, now)
        at_risk = 0
        lost = 0
        for sub in pool:
            began = _as_date(sub.get("start_at"))
            if not began:
                continue
            stopped = ended_at(sub)
            if began < window_end and (stopped is None or stopped >= start):
                at_risk += 1
            if stopped and start <= stopped < window_end:
                lost += 1
        partial = end > now
        rows.append(
            {
                "month": start.strftime("%Y-%m"),
                "lost": lost,
                "at_risk": at_risk,
                "rate": round(lost / at_risk, 4) if at_risk else None,
                "partial": partial,
            }
        )
    return rows


def observer_funnel(subs: Sequence[dict], months: int, now: dt.datetime,
                    window_days: int = 28) -> list[dict]:
    """Observer intake vs upgrades, on an identical window for every cohort.

    A cohort month is only marked mature once every member of it has had the
    full window elapse - otherwise a young cohort reads as a conversion crash.
    """
    obs = [s for s in real_subscriptions(subs) if s.get("product") == "Observer"]
    paid = [s for s in real_subscriptions(subs) if s.get("product") in PAID_TIERS]
    by_customer: dict[Any, list[dict]] = defaultdict(list)
    for sub in paid:
        by_customer[sub.get("customer_id")].append(sub)

    rows: list[dict] = []
    for start in _month_starts(months, now):
        end = _next_month(start)
        cohort = [
            s for s in obs
            if (began := _as_date(s.get("start_at"))) and start <= began < end
        ]
        if not cohort:
            rows.append({"month": start.strftime("%Y-%m"), "signups": 0, "upgraded": 0,
                         "rate": None, "mature": False})
            continue
        upgraded = 0
        for sub in cohort:
            began = _as_date(sub.get("start_at"))
            horizon = began + dt.timedelta(days=window_days)
            for other in by_customer.get(sub.get("customer_id"), ()):
                started = _as_date(other.get("start_at"))
                if started and began - dt.timedelta(days=1) <= started <= horizon:
                    upgraded += 1
                    break
        youngest = max(_as_date(s.get("start_at")) for s in cohort)
        mature = (now - youngest).days >= window_days
        rows.append(
            {
                "month": start.strftime("%Y-%m"),
                "signups": len(cohort),
                "upgraded": upgraded,
                "rate": round(upgraded / len(cohort), 4),
                "mature": mature,
            }
        )
    return rows


def observer_term_days(subs: Sequence[dict], now: dt.datetime) -> int | None:
    """The term currently being sold, from the most recent Observer records."""
    recent = sorted(
        (s for s in real_subscriptions(subs) if s.get("product") == "Observer"
         and _as_date(s.get("start_at"))),
        key=lambda s: _as_date(s.get("start_at")),
        reverse=True,
    )[:25]
    terms = [t for t in (term_days(s) for s in recent) if t]
    if not terms:
        return None
    return max(set(terms), key=terms.count)


def recurring_run_rate(members: dict[str, dict[str, int]], prices: dict[str, float]) -> float:
    """Monthly value of the recurring book at list price. Observer billed weekly."""
    total = 0.0
    for tier, counts in members.items():
        price = float(prices.get(tier) or 0)
        if not price:
            continue
        paying = counts.get("paying", 0)
        if tier == "Observer":
            total += paying * price * 52 / 12
        elif tier in ("Activator", "Navigator"):
            total += paying * price
    return round(total, 2)


def _days_in_month(when: dt.datetime) -> int:
    return (_next_month(when) - when).days


def _next_month(when: dt.datetime) -> dt.datetime:
    return dt.datetime(when.year + (when.month == 12), (when.month % 12) + 1, 1)


def _month_starts(months: int, now: dt.datetime) -> list[dt.datetime]:
    if months < 1:
        raise MetricsError("months must be >= 1")
    cursor = dt.datetime(now.year, now.month, 1)
    out = [cursor]
    for _ in range(months - 1):
        cursor = dt.datetime(cursor.year - (cursor.month == 1), ((cursor.month - 2) % 12) + 1, 1)
        out.append(cursor)
    return list(reversed(out))
