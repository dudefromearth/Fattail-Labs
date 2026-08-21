"""Progress findings — every rule states its trigger and threshold.

A finding that cannot name the number that fired it is not auditable, so the
shape of the output is tested as tightly as the logic.
"""

from __future__ import annotations

from progress import rules as R

PARAMS = {
    "monthly_revenue_target": 30_000.0,
    "conversion_floor": 0.10,
    "activator_churn_ceiling": 0.10,
    "navigator_churn_ceiling": 0.15,
    "campaign_ctr_floor": 0.005,
    "snapshot_stale_hours": 6.0,
}


def ctx(**over):
    base = {
        "params": PARAMS,
        "observer_funnel": [],
        "churn_activator": [],
        "churn_navigator": [],
        "youtube_months": [],
        "campaign_months": [],
        "stale_sources": [],
        "settles_at": None,
        "observers_needed": None,
        "observers_per_month": None,
    }
    base.update(over)
    return base


def find(results, key):
    return next((f for f in results if f["key"] == key), None)


class TestShape:
    def test_every_finding_carries_trigger_and_threshold(self):
        out = R.evaluate(ctx(
            settles_at=11_000.0, observers_needed=170.0, observers_per_month=55.0,
            observer_funnel=[{"month": "2026-07", "signups": 70, "upgraded": 3,
                              "rate": 0.043, "mature": True, "partial": False}],
        ))
        assert out
        for f in out:
            assert f["trigger"] and f["threshold"] and f["title"] and f["detail"]
            assert f["severity"] in {"critical", "warning", "good", "info"}

    def test_critical_findings_sort_first(self):
        out = R.evaluate(ctx(
            settles_at=11_000.0,
            churn_activator=[{"month": "2026-07", "lost": 6, "at_risk": 74,
                              "rate": 0.081, "partial": False}],
        ))
        assert out[0]["severity"] == "critical"

    def test_no_data_produces_no_findings(self):
        assert R.evaluate(ctx()) == []


class TestConversionFloor:
    def test_below_floor_is_critical_and_quotes_the_rate(self):
        f = find(R.evaluate(ctx(observer_funnel=[
            {"month": "2026-07", "signups": 70, "upgraded": 3, "rate": 0.043,
             "mature": True, "partial": False}])), "conversion_floor")
        assert f["severity"] == "critical"
        assert "4.3%" in f["trigger"] and "10.0%" in f["threshold"]

    def test_above_floor_reads_as_good(self):
        f = find(R.evaluate(ctx(observer_funnel=[
            {"month": "2026-04", "signups": 31, "upgraded": 4, "rate": 0.129,
             "mature": True, "partial": False}])), "conversion_floor")
        assert f["severity"] == "good"

    def test_immature_cohorts_are_ignored(self):
        """An August cohort at 0% is an artefact, not a finding."""
        assert find(R.evaluate(ctx(observer_funnel=[
            {"month": "2026-08", "signups": 39, "upgraded": 0, "rate": 0.0,
             "mature": False, "partial": True}])), "conversion_floor") is None


class TestChurnRules:
    def test_healthy_activator_churn_reads_good(self):
        f = find(R.evaluate(ctx(churn_activator=[
            {"month": "2026-07", "lost": 6, "at_risk": 74, "rate": 0.081,
             "partial": False}])), "activator_churn")
        assert f["severity"] == "good"

    def test_navigator_small_base_is_called_out(self):
        f = find(R.evaluate(ctx(churn_navigator=[
            {"month": "2026-07", "lost": 2, "at_risk": 13, "rate": 0.20,
             "partial": False}])), "navigator_churn")
        assert f["severity"] == "warning"
        assert "13" in f["detail"] and "approximate" in f["detail"]

    def test_partial_month_is_never_used(self):
        """A 21-day month scaled up would fire false alarms."""
        assert find(R.evaluate(ctx(churn_navigator=[
            {"month": "2026-08", "lost": 2, "at_risk": 12, "rate": 0.60,
             "partial": True}])), "navigator_churn") is None


class TestTargetGap:
    def test_short_of_target_is_critical_with_the_intake_needed(self):
        f = find(R.evaluate(ctx(settles_at=11_000.0, observers_needed=170.0,
                                observers_per_month=55.0)), "target_gap")
        assert f["severity"] == "critical"
        assert "$11,000" in f["trigger"] and "170" in f["detail"] and "5.7 a day" in f["detail"]

    def test_reaching_target_reads_good(self):
        f = find(R.evaluate(ctx(settles_at=41_000.0)), "target_gap")
        assert f["severity"] == "good"


class TestReachAndCampaigns:
    def test_reach_well_below_peak_warns(self):
        f = find(R.evaluate(ctx(youtube_months=[
            {"month": "2026-06", "views": 47_642, "partial": False},
            {"month": "2026-07", "views": 35_253, "partial": False},
            {"month": "2026-08", "views": 19_426, "partial": False}])), "reach_trend")
        assert f["severity"] == "warning" and "41% of peak" in f["trigger"]

    def test_reach_near_peak_is_silent(self):
        assert find(R.evaluate(ctx(youtube_months=[
            {"month": "2026-06", "views": 47_000, "partial": False},
            {"month": "2026-07", "views": 45_000, "partial": False},
            {"month": "2026-08", "views": 44_000, "partial": False}])), "reach_trend") is None

    def test_list_fatigue_fires_on_low_ctr(self):
        f = find(R.evaluate(ctx(campaign_months=[
            {"month": "2026-07", "sent": 66_437, "ctr": 0.0027,
             "partial": False}])), "campaign_fatigue")
        assert f["severity"] == "warning" and "over-mailed" in f["detail"]


class TestStaleness:
    def test_stale_sources_are_named(self):
        f = find(R.evaluate(ctx(stale_sources=["youtube", "activecampaign"])),
                 "stale_sources")
        assert "activecampaign" in f["trigger"] and "youtube" in f["trigger"]

    def test_fresh_sources_produce_nothing(self):
        assert find(R.evaluate(ctx(stale_sources=[])), "stale_sources") is None
