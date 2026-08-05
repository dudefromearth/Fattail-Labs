"""Butterfly structure metrics (Pack Spec §4.6)."""

from __future__ import annotations

from typing import Any

# Multiplier $/point per contract for index-like underlyings (SPX-style)
POINT_MULTIPLIER = 100.0


def _expiry_payoff_per_share(
    legs: list[dict[str, Any]],
    spot: float,
) -> float:
    """European-style expiry intrinsic P&L per share vs entry (signed)."""
    total = 0.0
    for lg in legs:
        k = float(lg["strike"])
        qty = int(lg["qty"])
        side = lg["side"]
        right = lg["right"]
        entry = float(lg.get("entry_price") or 0.0)
        if right == "call":
            intrinsic = max(0.0, spot - k)
        else:
            intrinsic = max(0.0, k - spot)
        # long pays entry, short receives entry
        if side == "buy":
            total += qty * (intrinsic - entry)
        else:
            total += qty * (entry - intrinsic)
    return total


def calculate_metrics(
    structure: dict[str, Any],
    config: dict[str, Any],
    *,
    spot: float | None = None,
) -> dict[str, Any]:
    legs = structure.get("legs") or []
    if not legs:
        return {
            "debitOrCredit": 0.0,
            "maxProfit": 0.0,
            "maxLoss": 0.0,
            "netPremiumAbs": 0.0,
            "debitToPayoffRatio": None,
            "debitToWidthRatio": None,
            "convexityScore": 0.0,
            "convexityProvisional": True,
            "expectedSharpe": None,
            "expectedSortino": None,
            "expectedCalmar": None,
            "expectedReturnAvgDd": None,
        }

    # Net premium per share: buy positive cost, sell negative cost
    net_per_share = 0.0
    for lg in legs:
        entry = float(lg.get("entry_price") or 0.0)
        qty = int(lg["qty"])
        if lg["side"] == "buy":
            net_per_share += qty * entry
        else:
            net_per_share -= qty * entry

    # Prefer construct's net_debit if present
    if structure.get("net_debit_per_share") is not None:
        net_per_share = float(structure["net_debit_per_share"])

    debit_or_credit = net_per_share  # debit > 0
    net_abs = abs(debit_or_credit)

    width = float(structure.get("width_points") or 0.0)
    if width <= 0 and len(legs) >= 3:
        strikes = sorted(float(lg["strike"]) for lg in legs)
        width = strikes[-1] - strikes[0]

    # Sample expiry payoff across body ± 2 widths
    strikes_all = [float(lg["strike"]) for lg in legs]
    body = sorted(strikes_all)[len(strikes_all) // 2]
    s0 = spot if spot is not None else body
    samples: list[float] = []
    span = max(width * 2, 20.0)
    for i in range(41):
        s = s0 - span + (2 * span) * i / 40.0
        if s <= 0:
            continue
        samples.append(_expiry_payoff_per_share(legs, s))

    max_profit_ps = max(samples) if samples else 0.0
    # Defined-risk long fly: max loss is finite.
    # Symmetric 1/-2/1: max loss ≈ net debit.
    # Broken wing: debit + residual wing gap (points per share).
    strikes_sorted = sorted(strikes_all)
    lo_k, hi_k = strikes_sorted[0], strikes_sorted[-1]
    body_k = body
    wing_gap = abs((hi_k - body_k) - (body_k - lo_k))
    family = str(structure.get("family") or config.get("butterfly_family") or "")
    # Batman packages two flies; residual gap on a single 1/-2/1 is not the model
    if structure.get("structure_kind") == "batman" or family in ("batman", "symmetric"):
        # Package max loss ≈ total debit (two long debit flies)
        max_loss_ps = net_abs if debit_or_credit >= 0 else abs(min(samples or [0]))
    elif debit_or_credit >= 0:
        if family == "broken_wing" or wing_gap > 1e-6:
            max_loss_ps = net_abs + wing_gap
        else:
            max_loss_ps = net_abs
    else:
        # credit defined-risk: loss from sampling, floored by wing gap
        min_pnl_ps = min(samples) if samples else -wing_gap
        max_loss_ps = abs(min(0.0, min_pnl_ps))
        if max_loss_ps <= 0:
            max_loss_ps = wing_gap if wing_gap > 0 else net_abs

    # Peak profit at least (width - debit) for debit flies when sampling under-states
    if debit_or_credit > 0 and width > 0:
        theo_peak = max(0.0, width - debit_or_credit)
        max_profit_ps = max(max_profit_ps, theo_peak)

    # Dollars (1 contract set)
    max_profit = max_profit_ps * POINT_MULTIPLIER
    max_loss = max_loss_ps * POINT_MULTIPLIER
    debit_dollars = debit_or_credit * POINT_MULTIPLIER
    net_abs_dollars = abs(debit_dollars)

    d_payoff = None
    if max_profit > 1e-9:
        d_payoff = net_abs_dollars / max_profit

    d_width = None
    if width > 1e-9:
        # premium per share / width points (dimensionless coaching ratio)
        d_width = net_abs / width

    # Provisional convexity heuristic (deterministic)
    score = 50.0
    if d_payoff is not None:
        # lower ratio → higher score
        score += max(0.0, 30.0 * (1.0 - min(d_payoff, 1.0)))
    if d_width is not None:
        # prefer mid-low width ratios
        target = 0.05
        score += max(0.0, 20.0 * (1.0 - min(abs(d_width - target) / 0.1, 1.0)))
    if max_profit <= 0:
        score = 0.0
    score = max(0.0, min(100.0, score))

    return {
        "debitOrCredit": round(debit_dollars, 4),
        "maxProfit": round(max_profit, 4),
        "maxLoss": round(max_loss, 4),
        "netPremiumAbs": round(net_abs_dollars, 4),
        "debitToPayoffRatio": None if d_payoff is None else round(d_payoff, 6),
        "debitToWidthRatio": None if d_width is None else round(d_width, 6),
        "convexityScore": round(score, 2),
        "convexityProvisional": True,
        "expectedSharpe": None,
        "expectedSortino": None,
        "expectedCalmar": None,
        "expectedReturnAvgDd": None,
    }
