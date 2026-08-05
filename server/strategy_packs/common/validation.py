"""Cross-pack hard constraints (HC-*)."""

from __future__ import annotations

from typing import Any

from strategy_packs.types import PRIMARY_METRICS, ValidationResult


def empty_result() -> ValidationResult:
    return {"valid": True, "errors": [], "warnings": []}


def merge_results(*parts: ValidationResult) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    for p in parts:
        errors.extend(p.get("errors") or [])
        warnings.extend(p.get("warnings") or [])
    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def check_primary_metric(config: dict[str, Any]) -> ValidationResult:
    r = empty_result()
    pm = str(config.get("primary_metric") or "").strip().lower()
    if not pm:
        r["errors"].append("primary_metric is required")
        r["valid"] = False
        return r
    if pm in ("win_rate", "winrate", "hit_rate"):
        r["errors"].append(
            "primary_metric must be risk-adjusted (HC-2/HC-3); win rate is forbidden"
        )
        r["valid"] = False
        return r
    if pm not in PRIMARY_METRICS:
        r["errors"].append(
            f"primary_metric must be one of {sorted(PRIMARY_METRICS)}; got {pm!r}"
        )
        r["valid"] = False
    return r


def check_capital(config: dict[str, Any]) -> ValidationResult:
    r = empty_result()
    try:
        cap = float(config.get("max_capital_at_risk"))
    except (TypeError, ValueError):
        r["errors"].append("max_capital_at_risk must be a number > 0")
        r["valid"] = False
        return r
    if cap <= 0:
        r["errors"].append("max_capital_at_risk must be > 0")
        r["valid"] = False
    unit = str(config.get("max_capital_unit") or "dollars").lower()
    if unit not in ("dollars", "percent_of_capital"):
        r["errors"].append("max_capital_unit must be dollars or percent_of_capital")
        r["valid"] = False
    return r


def check_exit_rules(config: dict[str, Any]) -> ValidationResult:
    r = empty_result()
    rules = config.get("exit_rules")
    if rules is None:
        r["errors"].append("exit_rules is required")
        r["valid"] = False
        return r
    if not isinstance(rules, dict):
        r["errors"].append("exit_rules must be a JSON object")
        r["valid"] = False
        return r
    trail = rules.get("dynamic_premium_decay_trailing")
    if not isinstance(trail, dict) or not trail.get("enabled"):
        r["errors"].append(
            "exit_rules.dynamic_premium_decay_trailing.enabled must be true"
        )
        r["valid"] = False
    return r
