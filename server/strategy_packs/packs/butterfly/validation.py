"""Butterfly config validation."""

from __future__ import annotations

from typing import Any

from strategy_packs.common.validation import (
    check_capital,
    check_exit_rules,
    check_primary_metric,
    empty_result,
    merge_results,
)
from strategy_packs.types import ValidationResult


def resolve_dte_window(config: dict[str, Any]) -> tuple[int, int] | None:
    dte_type = str(config.get("dte_type") or "").strip().lower()
    if dte_type == "0dte":
        return 0, 0
    if dte_type == "1dte":
        return 1, 1
    if dte_type == "2_5_dte":
        return 2, 5
    if dte_type == "custom":
        try:
            lo = int(config.get("dte_min"))
            hi = int(config.get("dte_max"))
        except (TypeError, ValueError):
            return None
        return lo, hi
    return None


def validate(config: dict[str, Any]) -> ValidationResult:
    if not isinstance(config, dict):
        return {
            "valid": False,
            "errors": ["config must be an object"],
            "warnings": [],
        }

    parts = [
        check_primary_metric(config),
        check_capital(config),
        check_exit_rules(config),
    ]
    r = empty_result()

    direction = str(config.get("direction") or "").lower()
    if direction not in ("call", "put", "balanced"):
        r["errors"].append("direction must be call, put, or balanced")

    family = str(config.get("butterfly_family") or "").lower()
    if family not in ("symmetric", "broken_wing"):
        r["errors"].append("butterfly_family must be symmetric or broken_wing")

    window = resolve_dte_window(config)
    if window is None:
        r["errors"].append(
            "dte_type invalid or custom requires dte_min and dte_max integers"
        )
    else:
        lo, hi = window
        if lo < 0 or hi < 0 or lo > hi:
            r["errors"].append("dte window must satisfy 0 ≤ dte_min ≤ dte_max")

    if family == "symmetric":
        regime = str(config.get("symmetric_regime") or "")
        if regime not in ("high_vix", "mid_vix", "low_vix", "campaign"):
            r["errors"].append("symmetric_regime is required for symmetric family")
        width_style = str(config.get("width_style") or "")
        if width_style not in ("wide", "variable", "narrow", "fixed_30_50"):
            r["errors"].append("width_style is required for symmetric family")
        try:
            dmin = float(config.get("debit_to_width_min"))
            dmax = float(config.get("debit_to_width_max"))
            if dmin > dmax:
                r["errors"].append("debit_to_width_min must be ≤ debit_to_width_max")
            if dmin < 0.01 or dmax > 0.15:
                r["warnings"].append(
                    "debit-to-width outside typical 0.01–0.15 coaching band"
                )
        except (TypeError, ValueError):
            r["errors"].append(
                "debit_to_width_min and debit_to_width_max are required numbers"
            )
        wmin = config.get("width_points_min")
        wmax = config.get("width_points_max")
        if wmin is not None and wmax is not None:
            try:
                if float(wmin) > float(wmax):
                    r["errors"].append("width_points_min must be ≤ width_points_max")
            except (TypeError, ValueError):
                r["errors"].append("width_points_min/max must be numbers")

    if family == "broken_wing":
        if str(config.get("bwb_style") or "") not in (
            "A_efficiency",
            "A_plus_scalp",
            "B_steep",
            "B_plus_gamma",
        ):
            r["errors"].append("bwb_style is required for broken_wing")
        if str(config.get("broken_wing_side") or "") not in ("upper", "lower"):
            r["errors"].append("broken_wing_side is required for broken_wing")
        try:
            pmin = float(config.get("target_debit_to_payoff_min"))
            pmax = float(config.get("target_debit_to_payoff_max"))
            if pmin > pmax:
                r["errors"].append(
                    "target_debit_to_payoff_min must be ≤ target_debit_to_payoff_max"
                )
        except (TypeError, ValueError):
            r["errors"].append(
                "target_debit_to_payoff_min and target_debit_to_payoff_max are required"
            )
        mcq = config.get("min_convexity_quality")
        if mcq is not None and str(mcq) not in ("medium", "high", "extreme", ""):
            r["errors"].append(
                "min_convexity_quality must be medium, high, extreme, or omitted"
            )
        elif mcq in ("medium", "high", "extreme"):
            r["warnings"].append(
                "min_convexity_quality filters a provisional convexity score (Q1 open)"
            )

    r["valid"] = len(r["errors"]) == 0
    return merge_results(*parts, r)


def before_promote_to_curation(config: dict[str, Any]) -> bool:
    return bool(validate(config).get("valid"))
