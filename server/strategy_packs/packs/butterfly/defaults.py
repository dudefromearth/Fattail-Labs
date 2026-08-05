"""Butterfly default templates (Pack Spec §4.5)."""

from __future__ import annotations

from typing import Any

_DEFAULT_EXIT = {
    "dynamic_premium_decay_trailing": {
        "enabled": True,
        "mode": "rate",
        "notes": "Trail based on premium decay rate — required",
    },
    "take_profit": {"enabled": False},
    "time_stop": {"enabled": False},
    "discretionary_notes": "",
}

_DEFAULT_CAPITAL = {
    "max_capital_at_risk": 500.0,
    "max_capital_unit": "dollars",
}


def _base(**extra: Any) -> dict[str, Any]:
    cfg: dict[str, Any] = {
        **_DEFAULT_CAPITAL,
        "primary_metric": "sortino",
        "exit_rules": dict(_DEFAULT_EXIT),
        "underlying": "SPX",
        "pack_id": "butterfly",
        "pack_version": "1.0.0",
    }
    cfg.update(extra)
    return cfg


def get_default_configs() -> list[dict[str, Any]]:
    return [
        _base(
            name="High VIX Wide 0DTE Batman",
            butterfly_family="symmetric",
            symmetric_regime="high_vix",
            direction="balanced",
            dte_type="0dte",
            width_style="wide",
            debit_to_width_min=0.02,
            debit_to_width_max=0.05,
            primary_metric="sortino",
        ),
        _base(
            name="Mid VIX Trend Morning Butterfly",
            butterfly_family="symmetric",
            symmetric_regime="mid_vix",
            direction="call",
            directional_bias="with_trend",
            timing="morning",
            dte_type="0dte",
            width_style="variable",
            debit_to_width_min=0.05,
            debit_to_width_max=0.10,
            primary_metric="sortino",
        ),
        _base(
            name="Low VIX 1DTE Overnight Batman",
            butterfly_family="symmetric",
            symmetric_regime="low_vix",
            direction="balanced",
            dte_type="1dte",
            timing="before_close",
            width_style="wide",
            debit_to_width_min=0.02,
            debit_to_width_max=0.05,
            primary_metric="sortino",
        ),
        _base(
            name="Short-Term Campaign 2-5 DTE",
            butterfly_family="symmetric",
            symmetric_regime="campaign",
            direction="balanced",
            dte_type="2_5_dte",
            width_style="fixed_30_50",
            debit_to_width_min=0.02,
            debit_to_width_max=0.05,
            frequency_per_week=2,
            primary_metric="calmar",
        ),
        _base(
            name="BWB Style A+ Near-Zero Scalp",
            butterfly_family="broken_wing",
            bwb_style="A_plus_scalp",
            direction="put",
            broken_wing_side="lower",
            dte_type="0dte",
            target_debit_to_payoff_min=0.05,
            target_debit_to_payoff_max=0.25,
            primary_metric="sortino",
            max_capital_at_risk=2500.0,
        ),
        _base(
            name="BWB Style B+ High Gamma Scalp",
            butterfly_family="broken_wing",
            bwb_style="B_plus_gamma",
            direction="call",
            broken_wing_side="upper",
            dte_type="0dte",
            target_debit_to_payoff_min=0.03,
            target_debit_to_payoff_max=0.20,
            primary_metric="sortino",
            max_capital_at_risk=2500.0,
        ),
    ]
