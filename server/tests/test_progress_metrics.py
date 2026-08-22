"""Progress metrics — the five data traps, each pinned by a test.

These are not hypothetical. Every one of them produced a materially wrong
number against the live WooCommerce data before it was fixed.
"""

from __future__ import annotations

import datetime as dt

import pytest

from progress import metrics as M

NOW = dt.datetime(2026, 8, 21, 12, 0, 0)


def sub(product, start, *, status="active", total=17.0, cust=1,
        cancelled=None, ends=None):
    return {
        "id": f"{product}-{start}-{cust}",
        "product": product,
        "status": status,
        "recurring_total": total,
        "customer_id": cust,
        "start_at": start,
        "cancelled_at": cancelled,
        "ends_at": ends,
    }


class TestTrap1FreeObservers:
    """A zero-price Observer is a comp, not part of the paid funnel."""

    def test_free_observer_excluded(self):
        subs = [sub("Observer", "2026-01-05", total=0.0),
                sub("Observer", "2026-06-05", total=17.0, cust=2)]
        assert len(M.real_subscriptions(subs)) == 1

    def test_free_observers_do_not_inflate_member_counts(self):
        subs = [sub("Observer", "2026-01-05", total=0.0, cust=i) for i in range(50)]
        assert M.members_by_tier(subs) == {}

    def test_zero_price_paid_tier_is_kept(self):
        """Only Observer is filtered — a comped Activator is still a member."""
        assert len(M.real_subscriptions([sub("Activator", "2026-06-01", total=0.0)])) == 1


class TestTrap2MembersAreSubscriptions:
    def test_paying_and_failed_are_separated(self):
        subs = [
            sub("Activator", "2026-01-01", status="active", total=97, cust=1),
            sub("Activator", "2026-01-01", status="on-hold", total=97, cust=2),
            sub("Activator", "2026-01-01", status="cancelled", total=97, cust=3),
        ]
        assert M.members_by_tier(subs)["Activator"] == {"paying": 1, "payment_failed": 1}

    def test_pending_cancel_still_counts_as_paying(self):
        subs = [sub("Navigator", "2026-01-01", status="pending-cancel", total=267)]
        assert M.members_by_tier(subs)["Navigator"]["paying"] == 1


class TestTrap3RevenueIsEveryCharge:
    def test_renewals_are_counted_not_just_first_orders(self):
        orders = [{"id": i, "created_at": "2026-08-05", "product": "Observer",
                   "line_total": 17.0} for i in range(6)]
        rows = M.revenue_by_month(orders, months=1, now=NOW)
        assert rows[0]["by_tier"]["Observer"] == pytest.approx(102.0)
        assert rows[0]["orders"] == 6

    def test_tiers_are_kept_separate(self):
        orders = [
            {"id": 1, "created_at": "2026-08-05", "product": "Observer", "line_total": 17.0},
            {"id": 2, "created_at": "2026-08-06", "product": "Activator", "line_total": 97.0},
        ]
        by_tier = M.revenue_by_month(orders, months=1, now=NOW)[0]["by_tier"]
        assert by_tier == {"Activator": 97.0, "Observer": 17.0}

    def test_non_numeric_total_fails_loud(self):
        orders = [{"id": 9, "created_at": "2026-08-05", "product": "Observer",
                   "line_total": "not-a-number"}]
        with pytest.raises(M.MetricsError):
            M.revenue_by_month(orders, months=1, now=NOW)


class TestTrap4TermIsRead:
    def test_four_and_six_week_terms_both_read_correctly(self):
        assert M.term_days(sub("Observer", "2026-07-01", ends="2026-07-29")) == 28
        assert M.term_days(sub("Observer", "2026-08-01", ends="2026-09-12")) == 42

    def test_current_term_uses_recent_records(self):
        subs = ([sub("Observer", "2026-07-01", ends="2026-07-29", cust=i) for i in range(5)]
                + [sub("Observer", "2026-08-10", ends="2026-09-21", cust=100 + i)
                   for i in range(20)])
        assert M.observer_term_days(subs, NOW) == 42

    def test_missing_dates_give_no_term(self):
        assert M.term_days(sub("Observer", "2026-07-01")) is None


class TestTrap5PartialMonths:
    def test_current_month_is_flagged_partial(self):
        rows = M.revenue_by_month([], months=2, now=NOW)
        assert rows[-1]["partial"] is True and rows[-1]["month"] == "2026-08"
        assert rows[0]["partial"] is False

    def test_partial_month_reports_days_elapsed(self):
        assert M.revenue_by_month([], months=1, now=NOW)[0]["days_elapsed"] == 21


class TestChurn:
    def test_rate_is_losses_over_at_risk(self):
        subs = [sub("Activator", "2026-05-01", total=97, cust=i) for i in range(10)]
        subs[0]["cancelled_at"] = "2026-07-10"
        subs[0]["status"] = "cancelled"
        row = [r for r in M.churn_by_month(subs, "Activator", 4, NOW) if r["month"] == "2026-07"][0]
        assert row["lost"] == 1 and row["at_risk"] == 10 and row["rate"] == 0.1

    def test_empty_tier_gives_no_rate_not_zero(self):
        rows = M.churn_by_month([], "Navigator", 2, NOW)
        assert all(r["rate"] is None for r in rows)


class TestObserverFunnel:
    def test_upgrade_is_attributed_to_the_observer_cohort(self):
        subs = [sub("Observer", "2026-06-01", total=17, cust=7),
                sub("Activator", "2026-06-20", total=97, cust=7)]
        row = [r for r in M.observer_funnel(subs, 4, NOW) if r["month"] == "2026-06"][0]
        assert row["signups"] == 1 and row["upgraded"] == 1 and row["rate"] == 1.0

    def test_upgrade_outside_the_window_does_not_count(self):
        subs = [sub("Observer", "2026-06-01", total=17, cust=7),
                sub("Activator", "2026-07-25", total=97, cust=7)]
        row = [r for r in M.observer_funnel(subs, 4, NOW) if r["month"] == "2026-06"][0]
        assert row["upgraded"] == 0

    def test_young_cohort_is_marked_immature(self):
        """The August cohort cannot have had 28 days - never read it as a crash."""
        subs = [sub("Observer", "2026-08-18", total=17, cust=1)]
        row = [r for r in M.observer_funnel(subs, 1, NOW) if r["month"] == "2026-08"][0]
        assert row["mature"] is False

    def test_old_cohort_is_mature(self):
        subs = [sub("Observer", "2026-06-01", total=17, cust=1)]
        row = [r for r in M.observer_funnel(subs, 3, NOW) if r["month"] == "2026-06"][0]
        assert row["mature"] is True


class TestRunRate:
    def test_observer_weekly_price_is_annualised_to_a_month(self):
        members = {"Observer": {"paying": 12, "payment_failed": 0}}
        assert M.recurring_run_rate(members, {"Observer": 17.0}) == pytest.approx(884.0, abs=1)

    def test_monthly_tiers_are_taken_at_face_value(self):
        members = {"Activator": {"paying": 50, "payment_failed": 0},
                   "Navigator": {"paying": 8, "payment_failed": 0}}
        rate = M.recurring_run_rate(members, {"Activator": 97.0, "Navigator": 267.0})
        assert rate == pytest.approx(50 * 97 + 8 * 267)


class TestTrap5AppliesToTheFunnelToo:
    """The current month is a fraction of a month — never average it in.

    Shipped wrong once: observer_funnel emitted no `partial` key, so the
    report's "complete months only" filter was a silent no-op and a 22-day
    August averaged in as a whole month, dragging intake from 88 to 71.3.
    """

    def test_funnel_rows_flag_the_current_month(self):
        subs = [sub("Observer", "2026-08-05", total=17, cust=1),
                sub("Observer", "2026-07-05", total=17, cust=2)]
        rows = {r["month"]: r for r in M.observer_funnel(subs, 2, NOW)}
        assert rows["2026-08"]["partial"] is True
        assert rows["2026-07"]["partial"] is False

    def test_empty_cohorts_also_carry_the_flag(self):
        rows = {r["month"]: r for r in M.observer_funnel([], 2, NOW)}
        assert rows["2026-08"]["partial"] is True
        assert set(rows["2026-07"]) >= {"month", "signups", "upgraded", "rate",
                                        "mature", "partial"}

    def test_filtering_on_partial_drops_only_the_current_month(self):
        subs = ([sub("Observer", "2026-07-05", total=17, cust=i) for i in range(69)]
                + [sub("Observer", "2026-08-05", total=17, cust=100 + i) for i in range(38)])
        rows = M.observer_funnel(subs, 2, NOW)
        complete = [r for r in rows if not r["partial"]]
        assert [r["signups"] for r in complete] == [69]
