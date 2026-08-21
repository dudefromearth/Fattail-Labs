"""Progress projection — the arithmetic the admin page rests on.

Reference figures were derived independently from the live WooCommerce data on
2026-08-21; the model must reproduce them or the page is lying.
"""

from __future__ import annotations

import pytest

from progress.projection import (
    ModelInputs,
    ProjectionError,
    months_to_target,
    observers_needed_for,
    project,
    settles_at,
    steady_state,
)

# Measured 2026-08-21: of 345 paid Observers, 14 became Activators, 5 Navigators,
# 10 bought an annual. Churn 6.7% / 20.5%. Observer worth ~$60 over a 42-day term.
R_ACT, R_NAV, R_ANN = 14 / 345, 5 / 345, 10 / 345
UPGRADE = R_ACT + R_NAV
NAV_SHARE = R_NAV / UPGRADE


def make(observers: float, **over) -> ModelInputs:
    base = dict(
        observers_per_month=observers,
        upgrade_rate=UPGRADE,
        annual_rate=R_ANN,
        navigator_share=NAV_SHARE,
        activator_churn=0.067,
        navigator_churn=0.205,
        observer_revenue=60.0,
        activator_price=97.0,
        navigator_price=267.0,
        annual_price=1997.0,
    )
    base.update(over)
    return ModelInputs(**base)


class TestSteadyState:
    def test_identity(self):
        assert steady_state(5, 0.067) == pytest.approx(74.6, abs=0.1)
        assert steady_state(20, 0.067) == pytest.approx(298.5, abs=0.1)

    def test_zero_adds_settles_at_zero(self):
        assert steady_state(0, 0.1) == 0

    @pytest.mark.parametrize("churn", [0, -0.1, 1.5])
    def test_impossible_churn_fails_loud(self, churn):
        with pytest.raises(ProjectionError):
            steady_state(5, churn)


class TestSettlesAt:
    """Must reproduce the independently derived reference figures."""

    def test_five_observers_a_day(self):
        assert settles_at(make(150)) == pytest.approx(29_330, abs=60)

    def test_ten_observers_a_day(self):
        assert settles_at(make(300)) == pytest.approx(58_660, abs=120)

    def test_scales_linearly_with_intake(self):
        assert settles_at(make(300)) == pytest.approx(2 * settles_at(make(150)), rel=1e-6)

    def test_no_intake_no_revenue(self):
        assert settles_at(make(0)) == 0


class TestProject:
    def test_bases_converge_on_steady_state(self):
        inputs = make(150)
        end = project(inputs, months=400)[-1]
        assert end.total_cash == pytest.approx(settles_at(inputs), rel=1e-3)

    def test_existing_base_decays_when_intake_stops(self):
        inputs = make(0, start_activators=50, start_navigators=8)
        curve = project(inputs, months=24)
        assert curve[0].total_cash > curve[-1].total_cash
        assert curve[-1].activators < 50

    def test_upfront_cash_lands_immediately(self):
        first = project(make(300), months=1)[0]
        assert first.observer_cash == pytest.approx(300 * 60)
        assert first.annual_cash == pytest.approx(300 * R_ANN * 1997, rel=1e-6)

    def test_months_must_be_positive(self):
        with pytest.raises(ProjectionError):
            project(make(150), months=0)


class TestTargets:
    def test_thirty_k_needs_five_to_six_observers_a_day(self):
        needed = observers_needed_for(30_000, make(150))
        assert needed is not None
        assert 4.5 <= needed / 30 <= 6.5

    def test_unreachable_target_returns_none(self):
        assert observers_needed_for(30_000, make(150), hi=10) is None

    def test_todays_intake_never_reaches_target(self):
        # ~55 Observers/month at the Jun-Jul conversion rate.
        weak = make(55, upgrade_rate=0.059, annual_rate=0.01)
        assert months_to_target(weak, 30_000, months=36) is None

    def test_target_must_be_positive(self):
        with pytest.raises(ProjectionError):
            observers_needed_for(0, make(150))


class TestGuards:
    @pytest.mark.parametrize("field,value", [
        ("upgrade_rate", 1.5), ("annual_rate", -0.1), ("navigator_share", 2.0),
        ("activator_churn", 0.0), ("observers_per_month", -1),
    ])
    def test_invalid_inputs_fail_loud(self, field, value):
        with pytest.raises(ProjectionError):
            make(150, **{field: value})
