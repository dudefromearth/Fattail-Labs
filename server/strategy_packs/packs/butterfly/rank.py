"""Honest ranking (Pack Spec §4.7)."""

from __future__ import annotations

from typing import Any

from strategy_packs.common.capital import resolve_max_capital_dollars
from strategy_packs.packs.butterfly.construct import construct_structures
from strategy_packs.packs.butterfly.family import normalize_family
from strategy_packs.packs.butterfly.metrics import calculate_metrics
from strategy_packs.packs.butterfly.validation import validate
from strategy_packs.types import PRIMARY_METRICS

_QUALITY = {"medium": 40.0, "high": 60.0, "extreme": 80.0}


def _primary_computable(config: dict[str, Any], metrics: dict[str, Any]) -> bool:
    pm = str(config.get("primary_metric") or "").lower()
    key = {
        "distribution_shape": "expectedDistributionShape",
        "sharpe": "expectedSharpe",
        "sortino": "expectedSortino",
        "calmar": "expectedCalmar",
        "return_avg_dd": "expectedReturnAvgDd",
    }.get(pm)
    if not key:
        return False
    return metrics.get(key) is not None


def _roc_band(config: dict[str, Any]) -> tuple[float | None, float | None]:
    def _one(key: str) -> float | None:
        raw = config.get(key)
        if raw is None or raw == "":
            return None
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None

    return _one("convexity_roc_min_pct"), _one("convexity_roc_max_pct")


def _in_roc_band(metrics: dict[str, Any], config: dict[str, Any]) -> bool | None:
    """True / False when tick-% is known; None when the band is set but uncomputable."""
    lo, hi = _roc_band(config)
    if lo is None and hi is None:
        return True
    roc = metrics.get("convexityRocPct")
    if roc is None:
        return None
    try:
        mag = abs(float(roc))
    except (TypeError, ValueError):
        return None
    if lo is not None and mag < lo:
        return False
    if hi is not None and mag > hi:
        return False
    return True


def _in_ratio_band(
    metrics: dict[str, Any],
    config: dict[str, Any],
    family: str,
) -> bool:
    family = normalize_family(family)
    if family in ("batman", "single", "symmetric"):
        r = metrics.get("debitToWidthRatio")
        if r is None:
            return False
        try:
            lo = float(config.get("debit_to_width_min"))
            hi = float(config.get("debit_to_width_max"))
        except (TypeError, ValueError):
            return True
        return lo <= r <= hi
    if family == "broken_wing":
        r = metrics.get("debitToPayoffRatio")
        if r is None:
            return False
        try:
            lo = float(config.get("target_debit_to_payoff_min"))
            hi = float(config.get("target_debit_to_payoff_max"))
        except (TypeError, ValueError):
            return True
        return lo <= r <= hi
    return True


def rank_structures(
    config: dict[str, Any],
    chain: dict[str, Any],
    *,
    strict_primary: bool = False,
    account_capital: float = 100_000.0,
) -> dict[str, Any]:
    """Return { ranked: RankedStructure[], summary, error? }."""
    v = validate(config)
    if not v["valid"]:
        return {
            "ok": False,
            "error": "invalid_config",
            "validation": v,
            "ranked": [],
        }

    provenance = dict(chain.get("provenance") or {"source": "stub", "label": "unknown"})
    structures = construct_structures(config, chain)
    spot = float(chain.get("spot") or 5000.0)
    max_cap = resolve_max_capital_dollars(config, account_capital=account_capital)
    family = normalize_family(config.get("butterfly_family"))
    mcq = config.get("min_convexity_quality")
    min_score = _QUALITY.get(str(mcq or ""), 0.0)

    candidates: list[dict[str, Any]] = []
    any_primary = False
    roc_lo, roc_hi = _roc_band(config)
    roc_band_set = roc_lo is not None or roc_hi is not None
    roc_uncomputable = False
    for st in structures:
        m = calculate_metrics(st, config, spot=spot)
        if m["maxLoss"] is None or float(m["maxLoss"]) != float(m["maxLoss"]):
            continue
        if float(m["maxLoss"]) <= 0 and float(m.get("netPremiumAbs") or 0) <= 0:
            continue
        # infinite check — reject absurd losses
        if float(m["maxLoss"]) > 1e12:
            continue
        if float(m["maxLoss"]) > max_cap + 1e-6:
            continue
        if not _in_ratio_band(m, config, family):
            continue
        if min_score and float(m.get("convexityScore") or 0) < min_score:
            continue
        roc_ok = _in_roc_band(m, config)
        if roc_ok is False:
            continue
        if roc_ok is None and roc_band_set:
            roc_uncomputable = True
        if _primary_computable(config, m):
            any_primary = True
        candidates.append({"structure": st, "metrics": m})

    pm = str(config.get("primary_metric") or "sortino").lower()
    if pm not in PRIMARY_METRICS:
        pm = "sortino"

    if strict_primary and not any_primary:
        return {
            "ok": False,
            "error": "primary_metric_uncomputable",
            "detail": (
                f"primary_metric {pm!r} has no distribution in Phase 1; "
                "unset strict_primary to use convexity_ratio_proxy"
            ),
            "ranked": [],
            "data_provenance": provenance,
        }

    use_proxy = not any_primary
    ranked_by = "convexity_ratio_proxy" if use_proxy else pm
    substituted = use_proxy

    def sort_key(item: dict[str, Any]) -> tuple:
        m = item["metrics"]
        if not use_proxy:
            key_map = {
                "distribution_shape": m.get("expectedDistributionShape") or 0.0,
                "sharpe": m.get("expectedSharpe") or 0.0,
                "sortino": m.get("expectedSortino") or 0.0,
                "calmar": m.get("expectedCalmar") or 0.0,
                "return_avg_dd": m.get("expectedReturnAvgDd") or 0.0,
            }
            # higher better
            return (-float(key_map.get(pm) or 0.0),)
        # proxy: higher convexity, then lower payoff ratio (None last)
        ratio = m.get("debitToPayoffRatio")
        width_r = m.get("debitToWidthRatio")
        return (
            -float(m.get("convexityScore") or 0.0),
            float(ratio) if ratio is not None else 1e9,
            float(width_r) if width_r is not None else 1e9,
        )

    candidates.sort(key=sort_key)

    ranked: list[dict[str, Any]] = []
    for i, item in enumerate(candidates, start=1):
        m = item["metrics"]
        if use_proxy:
            score = float(m.get("convexityScore") or 0.0)
        else:
            key_map = {
                "distribution_shape": m.get("expectedDistributionShape"),
                "sharpe": m.get("expectedSharpe"),
                "sortino": m.get("expectedSortino"),
                "calmar": m.get("expectedCalmar"),
                "return_avg_dd": m.get("expectedReturnAvgDd"),
            }
            score = float(key_map.get(pm) or 0.0)
        ranked.append(
            {
                "structure": item["structure"],
                "metrics": m,
                "rank": i,
                "score": score,
                "ranked_by": ranked_by,
                "primary_metric_substituted": substituted,
                "data_provenance": provenance,
                "reasons": (
                    ["proxy: primary metric uncomputable without backtest distribution"]
                    if substituted
                    else [f"sorted by {pm}"]
                ),
            }
        )

    return {
        "ok": True,
        "ranked": ranked,
        "summary": {
            "candidates": len(ranked),
            "ranked_by": ranked_by,
            "primary_metric": pm,
            "primary_metric_substituted": substituted,
            "convexity_roc_band": (
                {"min_pct": roc_lo, "max_pct": roc_hi} if roc_band_set else None
            ),
            "convexity_roc_uncomputable": bool(roc_band_set and roc_uncomputable),
            "data_provenance": provenance,
            "strict_primary": strict_primary,
        },
        "validation": v,
    }
