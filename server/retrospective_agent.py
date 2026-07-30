"""Retrospective agent analyze — Spec v0.5 §8 (R5) · Coach DL-126/127 parity.

Config (optional env; analyze fails loud if mode off/missing):
  LABS_RETRO_AGENT_MODE=local|off   (default off — product-wide, not tier-based)

Observer (incl. observer-trial) has the **same** agent access as Navigator when
agent mode is on. LABS_RETRO_AGENT_TRIAL is ignored (legacy env; no longer gates).

Local mode builds deterministic, process-anchored output from the staged report
(no external LLM). Validation always runs before store.
"""

from __future__ import annotations

import os
from typing import Any

import retrospective_domain as rd

AGENT_MODE_OFF = "off"
AGENT_MODE_LOCAL = "local"

ANCHOR_TYPES = frozenset({"process_event", "adherence_tag", "journal_passage"})


class AgentConfigError(RuntimeError):
    """Missing or disabled agent configuration — fail loud."""


class AgentValidationError(ValueError):
    """Invalid agent payload — fail loud at boundary."""


def agent_mode() -> str:
    return (os.environ.get("LABS_RETRO_AGENT_MODE") or AGENT_MODE_OFF).strip().lower()


def trial_agent_enabled() -> bool:
    """Deprecated: trial no longer separately gated (Observer = Navigator).

    Kept for tests/ops that still set LABS_RETRO_AGENT_TRIAL; always treated as
    parity path via can_run_agent_for_role.
    """
    return (os.environ.get("LABS_RETRO_AGENT_TRIAL") or "").strip() in (
        "1",
        "true",
        "yes",
        "on",
    )


def require_agent_configured() -> str:
    mode = agent_mode()
    if mode in ("", AGENT_MODE_OFF, "false", "0", "disabled"):
        raise AgentConfigError(
            "Retrospective agent is not configured "
            "(set LABS_RETRO_AGENT_MODE=local to enable local analysis)"
        )
    if mode != AGENT_MODE_LOCAL:
        raise AgentConfigError(
            f"Unsupported LABS_RETRO_AGENT_MODE={mode!r} "
            f"(supported: {AGENT_MODE_LOCAL})"
        )
    return mode


def can_run_agent_for_role(role: str, *, has_observer_trial: bool = False) -> bool:
    """Practice agent entitlement — Coach DL-126/127: Observer = Navigator.

    When agent mode is configured, allow:
    - administrator
    - role activator+ (includes Navigator; Activator legacy)
    - active observer-trial membership (even if claims.role is still observer)

    Free no-plan (no trial, not activator+) remains denied.
    """
    if role == "administrator":
        return True
    try:
        if __import__("auth").role_at_least(role, "activator"):
            return True
    except Exception:
        pass
    # Observer trial plan = full Practice parity (not a diminished tier)
    if has_observer_trial:
        return True
    return False


def _is_pnl_only_anchor(anchors: list) -> bool:
    """True if no process/adherence/journal anchor (P&L-only forbidden as origin)."""
    if not anchors:
        return True
    for a in anchors:
        if isinstance(a, dict):
            t = (a.get("type") or "").strip()
            if t in ANCHOR_TYPES and (a.get("ref") or "").strip():
                return False
        elif isinstance(a, str) and a.strip():
            # bare string allowed as process_event ref shorthand
            return False
    return True


def validate_agent_output(
    payload: dict[str, Any],
    *,
    trade_count: int,
    process_what_worked_available: bool,
) -> dict[str, Any]:
    """Spec §8.2 — fail loud on invalid structure."""
    if not isinstance(payload, dict):
        raise AgentValidationError("agent output must be a JSON object")

    what_worked = payload.get("what_worked")
    if what_worked is None:
        what_worked = []
    if not isinstance(what_worked, list):
        raise AgentValidationError("what_worked must be a list")

    concerns = payload.get("concerns")
    if concerns is None:
        concerns = []
    if not isinstance(concerns, list):
        raise AgentValidationError("concerns must be a list")

    hyps = payload.get("root_cause_hypotheses")
    if hyps is None:
        hyps = []
    if not isinstance(hyps, list):
        raise AgentValidationError("root_cause_hypotheses must be a list")

    plans = payload.get("habit_plans")
    if plans is None:
        plans = []
    if not isinstance(plans, list):
        raise AgentValidationError("habit_plans must be a list")

    # Symmetry: concerns without what_worked when data exists → fail
    if process_what_worked_available and concerns and not what_worked:
        raise AgentValidationError(
            "what_worked required when concerns are present and process data exists"
        )
    if process_what_worked_available and not what_worked and not concerns:
        # still require at least empty what_worked list is ok; if report had items, prefer non-empty
        pass

    sample_below = trade_count < rd.MIN_INFERENCE_N
    cleaned_hyps: list[dict] = []
    for h in hyps:
        if not isinstance(h, dict):
            raise AgentValidationError("each hypothesis must be an object")
        anchors = h.get("anchors") or []
        if not isinstance(anchors, list) or not anchors:
            raise AgentValidationError("hypothesis anchors must be a non-empty list")
        # Normalize anchors
        norm_anchors = []
        for a in anchors:
            if isinstance(a, str) and a.strip():
                norm_anchors.append(
                    {"type": "process_event", "ref": a.strip()}
                )
            elif isinstance(a, dict):
                t = (a.get("type") or "process_event").strip()
                ref = (a.get("ref") or "").strip()
                if not ref:
                    raise AgentValidationError("hypothesis anchor ref required")
                if t not in ANCHOR_TYPES:
                    raise AgentValidationError(
                        f"hypothesis anchor type must be one of {sorted(ANCHOR_TYPES)}"
                    )
                norm_anchors.append({"type": t, "ref": ref})
            else:
                raise AgentValidationError("invalid hypothesis anchor")
        if _is_pnl_only_anchor(norm_anchors):
            raise AgentValidationError(
                "hypothesis must cite process_event, adherence_tag, or journal_passage "
                "(P&L may not be sole basis)"
            )
        supports = h.get("supports") or []
        if sample_below and supports:
            # Suppress outcome-corroborated hypotheses below sample gate
            supports_txt = " ".join(str(s).lower() for s in supports)
            if any(
                k in supports_txt
                for k in ("pnl", "p&l", "profit", "loss", "winner", "net result")
            ):
                continue  # drop outcome-corroborated under sample gate
        cleaned_hyps.append(
            {
                "hypothesis": str(h.get("hypothesis") or "").strip(),
                "anchors": norm_anchors,
                "supports": list(supports) if isinstance(supports, list) else [],
                "conflicts": list(h.get("conflicts") or [])
                if isinstance(h.get("conflicts"), list)
                else [],
            }
        )
        if not cleaned_hyps[-1]["hypothesis"]:
            raise AgentValidationError("hypothesis text required")

    cleaned_plans: list[dict] = []
    for p in plans[: rd.MAX_ACTIVE_HABIT_PLANS]:
        if not isinstance(p, dict):
            raise AgentValidationError("each habit_plan must be an object")
        try:
            signal = rd.validate_observable_signal(
                str(p.get("observable_signal") or "")
            )
        except ValueError as exc:
            raise AgentValidationError(str(exc)) from exc
        cleaned_plans.append(
            {
                "title": str(p.get("title") or "").strip()[:255],
                "habit": str(p.get("habit") or "").strip()[:512],
                "why_process": str(p.get("why_process") or ""),
                "observable_signal": signal,
                "check_in": str(p.get("check_in") or "weekly"),
                "status": "proposed",
            }
        )
        if not cleaned_plans[-1]["title"] and not cleaned_plans[-1]["habit"]:
            raise AgentValidationError("habit_plan title or habit required")

    cleaned_ww = []
    for w in what_worked[: rd.MAX_WHAT_WORKED]:
        if not isinstance(w, dict):
            raise AgentValidationError("what_worked items must be objects")
        obs = str(w.get("observation") or "").strip()
        if not obs:
            raise AgentValidationError("what_worked observation required")
        cleaned_ww.append(
            {
                "observation": obs,
                "evidence": str(w.get("evidence") or ""),
                "window_n": int(w.get("window_n") or 0),
            }
        )

    cleaned_concerns = []
    for c in concerns[:10]:
        if not isinstance(c, dict):
            raise AgentValidationError("concerns must be objects")
        area = str(c.get("area") or "").strip()
        if not area:
            raise AgentValidationError("concern area required")
        cleaned_concerns.append(
            {
                "area": area,
                "evidence": str(c.get("evidence") or ""),
                "severity": str(c.get("severity") or "med"),
                "anchors": list(c.get("anchors") or [])
                if isinstance(c.get("anchors"), list)
                else [],
            }
        )

    return {
        "what_worked": cleaned_ww,
        "concerns": cleaned_concerns,
        "root_cause_hypotheses": cleaned_hyps,
        "habit_plans": cleaned_plans,
        "meta": {
            "mode": agent_mode(),
            "trade_count": trade_count,
            "sample_below_min": sample_below,
        },
    }


def local_analyze(report: dict[str, Any]) -> dict[str, Any]:
    """Deterministic facilitator output from staged process report (no LLM)."""
    book = report.get("book_performance") or report.get("pnl") or {}
    trade_count = int(
        (report.get("meta") or {}).get("trade_count")
        or book.get("trade_count")
        or 0
    )
    process = report.get("process") or {}
    deviations = report.get("deviations") or []
    existing_ww = report.get("what_worked") or []

    what_worked = list(existing_ww)[: rd.MAX_WHAT_WORKED]
    if not what_worked:
        adh = process.get("adherence") or {}
        followed = int(adh.get("followed") or 0)
        if followed >= 2:
            what_worked.append(
                {
                    "observation": f"{followed} trades tagged followed in window",
                    "evidence": "adherence count",
                    "window_n": followed,
                }
            )
        routine = process.get("routine") or {}
        act = routine.get("activity_days_per_week")
        if act is not None and float(act) >= 2:
            what_worked.append(
                {
                    "observation": f"Activity rhythm ~{act} days/week",
                    "evidence": "routine rate",
                    "window_n": int(routine.get("activity_days") or 0),
                }
            )

    concerns = []
    hyps = []
    for d in deviations[:5]:
        if not isinstance(d, dict):
            continue
        kind = str(d.get("kind") or "process")
        label = str(d.get("label") or kind)
        count = d.get("count")
        concerns.append(
            {
                "area": label,
                "evidence": str(d.get("note") or f"count={count}"),
                "severity": "med" if (count or 0) >= 2 else "low",
                "anchors": [f"deviation:{kind}"],
            }
        )
        anchor_type = (
            "adherence_tag" if kind == "adherence_broke" else "process_event"
        )
        hyps.append(
            {
                "hypothesis": (
                    f"Process gap may relate to: {label} "
                    f"(observed {count} time(s) in window)"
                ),
                "anchors": [
                    {
                        "type": anchor_type,
                        "ref": kind if kind else label,
                    }
                ],
                "supports": [str(d.get("note") or label)],
                "conflicts": [],
            }
        )

    # Sample gate: do not attach P&L supports when below min
    if trade_count < rd.MIN_INFERENCE_N:
        for h in hyps:
            h["supports"] = [
                s
                for s in h.get("supports") or []
                if not any(
                    k in str(s).lower()
                    for k in ("pnl", "p&l", "profit", "loss")
                )
            ]

    plans = []
    if any(
        isinstance(d, dict) and d.get("kind") == "adherence_broke"
        for d in deviations
    ):
        plans.append(
            {
                "title": "Tag adherence same day",
                "habit": "Mark followed/partial/broke on each trade the day it closes",
                "why_process": "Makes deviations reviewable without memory bias",
                "observable_signal": "adherence_rate",
                "check_in": "daily",
                "status": "proposed",
            }
        )
    if any(
        isinstance(d, dict) and d.get("kind") == "journal_activity_gap"
        for d in deviations
    ):
        plans.append(
            {
                "title": "Close journal gaps",
                "habit": "Note or log activity at least every other practice day",
                "why_process": "Routine continuity is process integrity",
                "observable_signal": "routine_days",
                "check_in": "weekly",
                "status": "proposed",
            }
        )

    return {
        "what_worked": what_worked,
        "concerns": concerns,
        "root_cause_hypotheses": hyps,
        "habit_plans": plans[: rd.MAX_ACTIVE_HABIT_PLANS],
    }


def run_analyze(
    report: dict[str, Any],
    *,
    role: str,
    has_observer_trial: bool,
) -> dict[str, Any]:
    """Config + entitlement + local generate + validate."""
    if not can_run_agent_for_role(role, has_observer_trial=has_observer_trial):
        raise PermissionError(
            "Agent analysis requires Observer, Navigator, Activator, or admin "
            "(same Practice entitlement as create/gather)"
        )
    require_agent_configured()
    raw = local_analyze(report)
    book = report.get("book_performance") or report.get("pnl") or {}
    trade_count = int(
        (report.get("meta") or {}).get("trade_count")
        or book.get("trade_count")
        or 0
    )
    ww_available = bool(report.get("what_worked")) or bool(
        (report.get("process") or {}).get("adherence", {}).get("followed")
    )
    return validate_agent_output(
        raw,
        trade_count=trade_count,
        process_what_worked_available=ww_available,
    )
