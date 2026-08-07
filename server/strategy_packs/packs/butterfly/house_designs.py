"""FatTail house strategies — immutable for members; admin versions only.

These are the strategies taught in FatTail courses. Full process configs
include entry + management (exit) rules. Members may apply, configure a bot
from them, or copy-and-rebuild — they cannot remove house entries or publish
new house versions.

Binding on a bot (attributes.house_design@1) carries key + version into
Curate and Deploy for provenance.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# Current catalog revision of the house library itself (not per-design).
HOUSE_CATALOG_VERSION = "1.0.0"
PACK_ID = "butterfly"
PACK_VERSION = "1.0.0"

_DEFAULT_EXIT = {
    "dynamic_premium_decay_trailing": {
        "enabled": True,
        "mode": "rate",
        "notes": "Trail on premium decay rate — FatTail process exit (required)",
    },
    "take_profit": {"enabled": False},
    "time_stop": {"enabled": False},
    "discretionary_notes": "",
}


def _exit(
    *,
    trail_notes: str,
    take_profit: bool = False,
    tp_notes: str = "",
    time_stop: bool = False,
    time_notes: str = "",
    discretionary: str = "",
) -> dict[str, Any]:
    rules = deepcopy(_DEFAULT_EXIT)
    rules["dynamic_premium_decay_trailing"]["notes"] = trail_notes
    if take_profit:
        rules["take_profit"] = {
            "enabled": True,
            "notes": tp_notes or "Process take-profit when edge is realized",
        }
    if time_stop:
        rules["time_stop"] = {
            "enabled": True,
            "notes": time_notes or "Time/DTE stop per house process",
        }
    if discretionary:
        rules["discretionary_notes"] = discretionary
    return rules


def _entry(**kwargs: Any) -> dict[str, Any]:
    """Structured entry process (stored in entry_conditions)."""
    base = {
        "process": "fattail_house",
        "requires_defined_risk": True,
        "notes": "",
    }
    base.update(kwargs)
    return base


def _ref(
    course_slug: str,
    course_title: str,
    module_slug: str,
    lesson_slug: str,
    lesson_title: str,
) -> dict[str, str]:
    return {
        "course_slug": course_slug,
        "course_title": course_title,
        "module_slug": module_slug,
        "lesson_slug": lesson_slug,
        "lesson_title": lesson_title,
        "href": f"/course/{course_slug}/{module_slug}/{lesson_slug}",
    }


# Course map (published Labs catalog)
_REF_CLASSIC = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "0-dte-strategies",
    "classic-otm-butterfly",
    "Classic OTM Butterfly",
)
_REF_BATMAN = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "0-dte-strategies",
    "batman-strategy-edge-case-for-chaos",
    "Batman Strategy – Edge Case For Chaos",
)
_REF_TIMEWARP = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "0-dte-strategies",
    "time-warp-multi-day-strategy",
    "Time Warp – Multi-Day Strategy",
)
_REF_MORNING = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "morning-routine",
    "otm-fly-direction-and-width",
    "OTM Fly Direction and Width",
)
_REF_RISK = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "risk-profit-management",
    "profit-management-framework",
    "Profit Management Framework",
)
_REF_CAMPAIGN_CLASSIC = _ref(
    "campaigns",
    "Campaigns",
    "0dte-tactical-0-2-dte",
    "classic-otm-butterfly-trade",
    "Classic OTM Butterfly Trade",
)
_REF_CONVEX_MOD = {
    "course_slug": "campaigns",
    "course_title": "Campaigns",
    "module_slug": "convex-stack-3-5-dte",
    "lesson_slug": "",
    "lesson_title": "Convex Stack (3-5 DTE) module",
    "href": "/course/campaigns",
}
_REF_SIGMA = _ref(
    "campaigns",
    "Campaigns",
    "unified-deployment",
    "convexity-stack-sigma-drift",
    "Convexity Stack + Sigma Drift",
)
_REF_CHOOSING = _ref(
    "0-dte-foundations",
    "0-DTE Foundations",
    "0-dte-strategies",
    "choosing-a-strategy",
    "Choosing a Strategy",
)


def _cfg(**extra: Any) -> dict[str, Any]:
    c: dict[str, Any] = {
        "pack_id": PACK_ID,
        "pack_version": PACK_VERSION,
        "underlying": "SPX",
        "primary_metric": "sortino",
        "max_capital_at_risk": 1000.0,
        "max_capital_unit": "dollars",
        "exit_rules": deepcopy(_DEFAULT_EXIT),
        "entry_conditions": _entry(),
    }
    c.update(extra)
    return c


def _design(
    *,
    key: str,
    version: str,
    name: str,
    summary: str,
    dte_label: str,
    family_label: str,
    course_refs: list[dict[str, str]],
    config: dict[str, Any],
    sort_order: int,
    variants: list[str] | None = None,
) -> dict[str, Any]:
    cfg = deepcopy(config)
    cfg["name"] = name
    cfg.setdefault("description", summary)
    cfg["house_design_key"] = key
    cfg["house_design_version"] = version
    return {
        "key": key,
        "version": version,
        "name": name,
        "summary": summary,
        "pack_id": PACK_ID,
        "pack_version": PACK_VERSION,
        "dte_label": dte_label,
        "family_label": family_label,
        "immutable": True,
        "source": "house",
        "maintainer": "admin",
        "member_may_remove": False,
        "member_may_edit_house": False,
        "member_may_apply": True,
        "member_may_copy_rebuild": True,
        "course_refs": course_refs,
        "variants": variants or [],
        "sort_order": sort_order,
        "config": cfg,
    }


# ── House catalog (ordered). Keys stable forever; versions bump only by admin. ──

def list_house_designs() -> list[dict[str, Any]]:
    """Return immutable house catalog (deep copies)."""
    designs = [
        _design(
            key="0dte_otm_classic_butterfly",
            version="1.0.0",
            name="0DTE OTM Classic Butterfly",
            summary=(
                "FatTail classic single-side OTM butterfly for 0-DTE. "
                "Entry: morning IV + structure levels; manage with premium-decay trail."
            ),
            dte_label="0 DTE",
            family_label="Single OTM butterfly",
            course_refs=[_REF_CLASSIC, _REF_MORNING, _REF_RISK, _REF_CAMPAIGN_CLASSIC],
            sort_order=10,
            config=_cfg(
                butterfly_family="single",
                direction="call",
                symmetric_regime="mid_vix",
                dte_type="0dte",
                width_style="variable",
                debit_to_width_min=0.04,
                debit_to_width_max=0.10,
                timing="morning",
                max_capital_at_risk=500.0,
                entry_conditions=_entry(
                    style="otm_classic",
                    session="rth_morning",
                    structure_map="volume_profile",
                    width_from="morning_iv",
                    direction_from="structure_bias",
                    notes=(
                        "Entry after morning IV read and structure event "
                        "(0-DTE Foundations · Morning Routine + Classic OTM)."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Manage premium decay; protect asymmetry (Classic OTM process)",
                    take_profit=True,
                    tp_notes="Partial / full TP per profit-management framework",
                    discretionary="Do not chase; re-enter only on process signal",
                ),
            ),
        ),
        _design(
            key="1_2dte_timewarp_batman",
            version="1.0.0",
            name="1–2 DTE Timewarp Batman",
            summary=(
                "Time Warp multi-day Batman package (call + put flies). "
                "1–2 DTE window; dual-side convexity for overnight/next-day process."
            ),
            dte_label="1–2 DTE",
            family_label="Batman (dual fly)",
            course_refs=[_REF_TIMEWARP, _REF_BATMAN, _REF_CHOOSING, _REF_RISK],
            sort_order=20,
            variants=["1_2dte_timewarp_trend_single"],
            config=_cfg(
                butterfly_family="batman",
                symmetric_regime="campaign",
                dte_type="1_2_dte",
                width_style="wide",
                match_side_widths=True,
                debit_to_width_min=0.02,
                debit_to_width_max=0.06,
                timing="before_close",
                frequency_per_week=2,
                max_capital_at_risk=1500.0,
                entry_conditions=_entry(
                    style="timewarp",
                    session="before_close_or_defined_window",
                    hold="multi_session",
                    notes=(
                        "Time Warp multi-day entry (0-DTE Foundations · Time Warp). "
                        "Batman package for two-sided convexity."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Multi-day manage: trail premium decay across sessions",
                    time_stop=True,
                    time_notes="Exit by DTE max / campaign end — no naked overnight without plan",
                    discretionary="Timewarp is a campaign process, not a single-print scalp",
                ),
            ),
        ),
        _design(
            key="1_2dte_timewarp_trend_single",
            version="1.0.0",
            name="1–2 DTE Timewarp Trend Single",
            summary=(
                "Time Warp as single-side trend follower (1–2 DTE). "
                "Same multi-day process as Timewarp Batman; structure is one fly with trend."
            ),
            dte_label="1–2 DTE",
            family_label="Single fly · trend",
            course_refs=[_REF_TIMEWARP, _REF_CHOOSING, _REF_MORNING, _REF_RISK],
            sort_order=25,
            variants=["1_2dte_timewarp_batman"],
            config=_cfg(
                butterfly_family="single",
                direction="call",
                symmetric_regime="mid_vix",
                dte_type="1_2_dte",
                width_style="variable",
                debit_to_width_min=0.04,
                debit_to_width_max=0.10,
                timing="before_close",
                directional_bias="with_trend",
                max_capital_at_risk=800.0,
                entry_conditions=_entry(
                    style="timewarp_trend",
                    session="before_close_or_defined_window",
                    hold="multi_session",
                    trend_filter=True,
                    notes=(
                        "Time Warp trend-follower single (course: Time Warp + structure direction). "
                        "Copy of house process; choose call/put with trend."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Trail premium decay; respect trend invalidation",
                    time_stop=True,
                    time_notes="Exit by DTE max or trend break per process",
                ),
            ),
        ),
        _design(
            key="0dte_high_vol_batman",
            version="1.0.0",
            name="0DTE High Vol Batman",
            summary=(
                "Batman dual-fly for chaotic / high-VIX 0-DTE regimes. "
                "Wide package, both sides; edge-case structure taught as Batman for chaos."
            ),
            dte_label="0 DTE",
            family_label="Batman (dual fly)",
            course_refs=[_REF_BATMAN, _REF_CHOOSING, _REF_MORNING, _REF_RISK],
            sort_order=30,
            config=_cfg(
                butterfly_family="batman",
                symmetric_regime="high_vix",
                dte_type="0dte",
                width_style="wide",
                match_side_widths=True,
                debit_to_width_min=0.02,
                debit_to_width_max=0.05,
                timing="any",
                vix_1d_mode="auto",
                max_capital_at_risk=1500.0,
                entry_conditions=_entry(
                    style="high_vol_batman",
                    session="rth",
                    regime="high_vix_or_chaos",
                    vix_1d="respect_daily_vix",
                    notes=(
                        "Batman for chaos (0-DTE Foundations · Batman Strategy). "
                        "Enter only when regime matches high-vol / edge-case process."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Aggressive premium-decay trail in high vol; protect capital first",
                    take_profit=True,
                    tp_notes="Bank process outcomes; no profit theater",
                    discretionary="If regime flips mid-day, reassess — do not invent a new strategy",
                ),
            ),
        ),
        _design(
            key="convex_stack",
            version="1.0.0",
            name="Convex Stack",
            summary=(
                "Campaign convexity stack at 2–4 DTE. "
                "Structure + volume-profile map; multi-day management process."
            ),
            dte_label="2–4 DTE",
            family_label="Batman · campaign stack",
            course_refs=[_REF_CONVEX_MOD, _REF_SIGMA, _REF_RISK],
            sort_order=40,
            config=_cfg(
                butterfly_family="batman",
                symmetric_regime="campaign",
                dte_type="2_4_dte",
                width_style="fixed_30_50",
                match_side_widths=True,
                debit_to_width_min=0.02,
                debit_to_width_max=0.06,
                timing="any",
                frequency_per_week=2,
                primary_metric="calmar",
                max_capital_at_risk=2000.0,
                entry_conditions=_entry(
                    style="convex_stack",
                    session="campaign_window",
                    structure_map="volume_profile_convexity",
                    hold="multi_day",
                    notes=(
                        "Convex Stack campaign entry (Campaigns · Convex Stack module). "
                        "Map convexity with volume profile; stack defined-risk flies."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Campaign manage: trail decay; roll/stack only per process",
                    time_stop=True,
                    time_notes="Respect 2–4 DTE band end; no silent extension",
                    discretionary="Stack is a campaign life cycle — see Campaigns course",
                ),
            ),
        ),
        _design(
            key="sigma_drift",
            version="1.0.0",
            name="Sigma Drift",
            summary=(
                "Longer campaign sleeve 5–10 DTE (sigma / drift process). "
                "Unified deployment with Convex Stack in Campaigns curriculum."
            ),
            dte_label="5–10 DTE",
            family_label="Batman · campaign drift",
            course_refs=[_REF_SIGMA, _REF_CONVEX_MOD, _REF_RISK],
            sort_order=50,
            config=_cfg(
                butterfly_family="batman",
                symmetric_regime="campaign",
                dte_type="5_10_dte",
                width_style="wide",
                match_side_widths=True,
                debit_to_width_min=0.02,
                debit_to_width_max=0.07,
                timing="any",
                frequency_per_week=1,
                primary_metric="calmar",
                max_capital_at_risk=2500.0,
                entry_conditions=_entry(
                    style="sigma_drift",
                    session="campaign_window",
                    hold="multi_day_week",
                    notes=(
                        "Sigma Drift campaign (Campaigns · Convexity Stack + Sigma Drift). "
                        "Slower cadence; defined risk; process over prediction."
                    ),
                ),
                exit_rules=_exit(
                    trail_notes="Slower trail; campaign-scale premium decay management",
                    time_stop=True,
                    time_notes="Exit by upper DTE band (10) or campaign plan end",
                    discretionary="Pair with Convex Stack in unified deployment process",
                ),
            ),
        ),
    ]
    return [deepcopy(d) for d in designs]


def get_house_design(key: str, version: str | None = None) -> dict[str, Any] | None:
    """Lookup house design by key; optional exact version (default = catalog version)."""
    key = (key or "").strip()
    for d in list_house_designs():
        if d["key"] != key:
            continue
        if version is None or d["version"] == version:
            return deepcopy(d)
    return None


def list_house_design_summaries() -> list[dict[str, Any]]:
    """Public list without full config (for light UI)."""
    out = []
    for d in list_house_designs():
        out.append(
            {
                "key": d["key"],
                "version": d["version"],
                "name": d["name"],
                "summary": d["summary"],
                "pack_id": d["pack_id"],
                "dte_label": d["dte_label"],
                "family_label": d["family_label"],
                "immutable": True,
                "source": "house",
                "maintainer": "admin",
                "member_may_remove": False,
                "member_may_edit_house": False,
                "member_may_apply": True,
                "member_may_copy_rebuild": True,
                "course_refs": d["course_refs"],
                "variants": d.get("variants") or [],
                "sort_order": d["sort_order"],
            }
        )
    return out


def house_design_config(key: str, version: str | None = None) -> dict[str, Any] | None:
    d = get_house_design(key, version)
    return deepcopy(d["config"]) if d else None
