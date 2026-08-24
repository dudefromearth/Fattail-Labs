"""Progress findings — deterministic threshold rules.

Every finding states the number that fired it and the threshold it crossed, so
an admin can audit any claim on the page without reading code. No language
model writes advice here: a wrong recommendation on a growth dashboard is worse
than no recommendation.

Adding a rule = one entry in RULES. Each returns a Finding or None.
Severity: critical (money is leaving) > warning (trend is wrong) > info.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Callable


@dataclass(frozen=True)
class Finding:
    key: str
    severity: str          # critical | warning | good | info
    title: str
    detail: str
    trigger: str           # the measured number, formatted for display
    threshold: str         # what it was compared against

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _pct(v: float | None) -> str:
    return "unavailable" if v is None else f"{v * 100:.1f}%"


def _usd(v: float | None) -> str:
    return "unavailable" if v is None else f"${v:,.0f}"


def _latest_complete(rows: list[dict], field: str = "rate") -> dict | None:
    """Most recent month that is neither partial nor empty. Partial months lie."""
    for row in reversed(rows or []):
        if row.get("partial"):
            continue
        if row.get(field) is not None:
            return row
    return None


def rule_conversion_floor(ctx: dict) -> Finding | None:
    rows = [r for r in ctx.get("observer_funnel", []) if r.get("mature")]
    row = _latest_complete(rows)
    if not row:
        return None
    floor = ctx["params"]["conversion_floor"]
    if row["rate"] >= floor:
        return Finding("conversion_floor", "good", "Observer conversion is holding",
                       f"The {row['month']} cohort converted {row['upgraded']} of "
                       f"{row['signups']} within 28 days.",
                       _pct(row["rate"]), f"floor {_pct(floor)}")
    return Finding("conversion_floor", "critical", "Observer conversion is below floor",
                   f"The {row['month']} cohort converted {row['upgraded']} of "
                   f"{row['signups']}. The upgrade path is what turns intake into "
                   f"revenue; more traffic will not fix a rate problem.",
                   _pct(row["rate"]), f"floor {_pct(floor)}")


def rule_activator_churn(ctx: dict) -> Finding | None:
    row = _latest_complete(ctx.get("churn_activator", []))
    if not row:
        return None
    ceiling = ctx["params"]["activator_churn_ceiling"]
    if row["rate"] <= ceiling:
        return Finding("activator_churn", "good", "Activator retention is healthy",
                       f"{row['lost']} of {row['at_risk']} cancelled in {row['month']}.",
                       _pct(row["rate"]), f"ceiling {_pct(ceiling)}")
    return Finding("activator_churn", "warning", "Activator churn above ceiling",
                   f"{row['lost']} of {row['at_risk']} cancelled in {row['month']}.",
                   _pct(row["rate"]), f"ceiling {_pct(ceiling)}")


def rule_navigator_churn(ctx: dict) -> Finding | None:
    row = _latest_complete(ctx.get("churn_navigator", []))
    if not row:
        return None
    ceiling = ctx["params"]["navigator_churn_ceiling"]
    if row["rate"] <= ceiling:
        return None
    small = row["at_risk"] < 20
    detail = (f"{row['lost']} of {row['at_risk']} cancelled in {row['month']}. "
              "Navigator is the highest-value recurring tier, so each loss costs "
              "roughly 2.75x an Activator.")
    if small:
        detail += (f" Note the base is only {row['at_risk']} - one cancellation moves "
                   "this several points, so treat the direction as real and the level "
                   "as approximate.")
    return Finding("navigator_churn", "warning", "Navigator churn above ceiling",
                   detail, _pct(row["rate"]), f"ceiling {_pct(ceiling)}")


def rule_target_gap(ctx: dict) -> Finding | None:
    settles = ctx.get("settles_at")
    target = ctx["params"]["monthly_revenue_target"]
    if settles is None:
        return None
    if settles >= target:
        return Finding("target_gap", "good", "Current funnel reaches the target",
                       "At today's intake and conversion the book settles above the "
                       "target once the bases fill.",
                       _usd(settles), f"target {_usd(target)}")
    needed = ctx.get("observers_needed")
    today = ctx.get("observers_per_month")
    extra = ""
    if needed and today is not None:
        extra = (f" Reaching it needs about {needed:,.0f} Observers a month "
                 f"({needed / 30:.1f} a day) against {today:,.0f} today.")
    return Finding("target_gap", "critical", "Current funnel cannot reach the target",
                   "Every tier settles at additions divided by churn. At today's "
                   "numbers that ceiling is below the target, so no campaign closes "
                   "the gap." + extra,
                   _usd(settles), f"target {_usd(target)}")


def rule_reach_trend(ctx: dict) -> Finding | None:
    rows = ctx.get("youtube_months") or []
    complete = [r for r in rows if not r.get("partial")]
    if len(complete) < 3:
        return None
    latest = complete[-1]
    peak = max(complete, key=lambda r: r.get("views") or 0)
    if not peak.get("views"):
        return None
    ratio = (latest.get("views") or 0) / peak["views"]
    if ratio >= 0.7:
        return None
    return Finding("reach_trend", "warning", "Channel reach is well below peak",
                   f"{latest['month']} drew {latest.get('views', 0):,} views against "
                   f"{peak['views']:,} in {peak['month']}. Observer intake tracks views "
                   "far more closely than it tracks how often Ernie publishes.",
                   f"{ratio * 100:.0f}% of peak", "70% of peak")


def rule_campaign_fatigue(ctx: dict) -> Finding | None:
    rows = ctx.get("campaign_months") or []
    complete = [r for r in rows if not r.get("partial") and r.get("ctr") is not None]
    if not complete:
        return None
    latest = complete[-1]
    floor = ctx["params"]["campaign_ctr_floor"]
    if latest["ctr"] >= floor:
        return None
    return Finding("campaign_fatigue", "warning", "Email click-through below floor",
                   f"{latest['month']} sent {latest.get('sent', 0):,} emails at "
                   f"{_pct(latest['ctr'])} click-through. Opens holding while clicks "
                   "fall is the signature of an over-mailed list, not weak creative.",
                   _pct(latest["ctr"]), f"floor {_pct(floor)}")


def rule_stale_sources(ctx: dict) -> Finding | None:
    stale = sorted(ctx.get("stale_sources") or [])
    if not stale:
        return None
    return Finding("stale_sources", "warning", "Some sources are stale",
                   "Figures below exclude these sources rather than showing them as "
                   "zero. Check the refresh job and each source's credentials.",
                   ", ".join(stale), f"older than {ctx['params']['snapshot_stale_hours']:.0f}h")


RULES: tuple[Callable[[dict], Finding | None], ...] = (
    rule_target_gap,
    rule_conversion_floor,
    rule_navigator_churn,
    rule_activator_churn,
    rule_reach_trend,
    rule_campaign_fatigue,
    rule_stale_sources,
)

_ORDER = {"critical": 0, "warning": 1, "good": 2, "info": 3}


def evaluate(ctx: dict) -> list[dict]:
    """Run every rule. A rule that cannot decide returns None and is skipped."""
    found = [f for f in (rule(ctx) for rule in RULES) if f is not None]
    found.sort(key=lambda f: _ORDER.get(f.severity, 9))
    return [f.as_dict() for f in found]
