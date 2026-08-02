"""Retrospective sequence agent — Spec v0.7.1 §16 · R8.

Holds the ceremony sequence. Does not interpret, diagnose, or prescribe.
Assembly only — the trader supplies judgment.

Config (optional env; analyze fails loud if mode off/missing):
  LABS_RETRO_AGENT_MODE=local|off   (default off — product-wide, not tier-based)

Observer (incl. observer-trial) has the **same** agent access as Navigator when
agent mode is on. Local mode builds deterministic sequence + assembly from the
staged report (no external LLM). Guardrails are enforced in code before render.
"""

from __future__ import annotations

import os
import re
from typing import Any

import retrospective_domain as rd

AGENT_MODE_OFF = "off"
AGENT_MODE_LOCAL = "local"

# Default stamped prompt id (seeded by mig 057)
DEFAULT_PROMPT_VERSION_ID = "RETROSPECTIVE_SEQUENCE_PROMPT_V1"

ANCHOR_TYPES = frozenset({"process_event", "adherence_tag", "journal_passage"})

# Spec §16 — nine ceremony steps (must match UI CEREMONY_STEPS order)
CEREMONY_STEPS: list[dict[str, Any]] = [
    {
        "id": 1,
        "key": "commitments",
        "title": "Commitments",
        "focus_question": (
            "Which carried plans did you keep, partial, or let lapse — "
            "in process terms only?"
        ),
    },
    {
        "id": 2,
        "key": "practice",
        "title": "Practice",
        "focus_question": (
            "Looking at this period's practice readings only — what stands out "
            "without judging yourself?"
        ),
    },
    {
        "id": 3,
        "key": "obstacles",
        "title": "Obstacles",
        "focus_question": (
            "What did you name this period — tags you applied and words you wrote?"
        ),
    },
    {
        "id": 4,
        "key": "clustered",
        "title": "Where it clustered",
        "focus_question": (
            "Where did deviations and tags co-occur? Observation only — "
            "you name the cause next."
        ),
    },
    {
        "id": 5,
        "key": "cause",
        "title": "What I name as the cause",
        "focus_question": (
            "In your words — what got in the way? The system does not diagnose."
        ),
    },
    {
        "id": 6,
        "key": "worked",
        "title": "What worked",
        "focus_question": (
            "What process strengths show in this window — not P&L theater?"
        ),
    },
    {
        "id": 7,
        "key": "eva",
        "title": "Expected versus actual",
        "focus_question": (
            "Where did pre-open intent and what executed diverge — process only?"
        ),
    },
    {
        "id": 8,
        "key": "onething",
        "title": "The one thing",
        "focus_question": (
            "What one checkable commitment will you own? "
            "The system does not prescribe it."
        ),
    },
    {
        "id": 9,
        "key": "book",
        "title": "The book",
        "focus_question": (
            "When you want the numbers, open the book sample — neutral context only."
        ),
    },
]

# Code-enforced prohibitions (Spec §16) — not admin-editable
GUARDRAIL_BANS: tuple[str, ...] = (
    "you should have",
    "you must",
    "you need to",
    "you ought",
    "i recommend",
    "i suggest you",
    "try to be",
    "be more patient",
    "stop being",
    "you were impatient",
    "you felt",
    "you seemed",
    "you always",
    "you never",
    "good job",
    "well done",
    "poor performance",
    "you failed",
    "expectancy",
    "profit factor",
    "your grade",
    "your streak",
    "process produces money",
)

# Prescription patterns — agent must not invent corrective actions
PRESCRIPTION_BANS: tuple[str, ...] = (
    "you should",
    "you must",
    "corrective action:",
    "do this next",
    "fix your habit to",
    "i prescribe",
)


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

    Prefer identity.role_meets when a DB cursor is available; this helper
    keeps the has_observer_trial flag for call sites that already checked.
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


def assert_no_guardrail_violation(text: str, *, field: str = "text") -> None:
    """Code guardrails before any agent turn renders (Spec §16)."""
    low = (text or "").lower()
    for ban in GUARDRAIL_BANS + PRESCRIPTION_BANS:
        if ban in low:
            raise AgentValidationError(
                f"guardrail violation in {field}: banned phrase {ban!r}"
            )
    # P&L figures in process copy
    if re.search(r"\$\s*-?\d", text or ""):
        raise AgentValidationError(
            f"guardrail violation in {field}: P&L figure not allowed in process copy"
        )


def active_prompt_version_id(cur) -> str:
    """Stamp id for new retrospectives / sequence runs (mirror Journal J3)."""
    try:
        cur.execute(
            """SELECT id FROM retrospective_prompt_versions
               WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"""
        )
        row = cur.fetchone()
        if row and row.get("id"):
            return str(row["id"])
    except Exception:
        pass
    return DEFAULT_PROMPT_VERSION_ID


def load_active_prompt_body(cur) -> tuple[str, str]:
    """Return (version_id, body_md) for the active prompt."""
    vid = active_prompt_version_id(cur)
    try:
        cur.execute(
            """SELECT id, body_md FROM retrospective_prompt_versions
               WHERE id = %s""",
            (vid,),
        )
        row = cur.fetchone()
        if row:
            return str(row["id"]), str(row.get("body_md") or "")
    except Exception:
        pass
    return vid, ""


def _step_inventory(report: dict[str, Any], step_id: int) -> list[dict[str, Any]]:
    """Assembly only — cite staged report inventory for a ceremony step."""
    items: list[dict[str, Any]] = []
    if step_id == 1:
        cf = report.get("carry_forward") or {}
        for p in (cf.get("plans") or [])[:5]:
            if isinstance(p, dict):
                items.append(
                    {
                        "kind": "habit_plan",
                        "label": str(p.get("title") or p.get("habit") or "plan"),
                        "source": "carry_forward",
                    }
                )
    elif step_id == 2:
        pi = report.get("period_indicator") or {}
        if pi:
            items.append(
                {
                    "kind": "period_indicator",
                    "label": str(pi.get("headline") or pi.get("status") or "period"),
                    "source": "period_indicator",
                }
            )
        for r in (pi.get("readings") or [])[:4]:
            if isinstance(r, dict):
                items.append(
                    {
                        "kind": "reading",
                        "label": str(r.get("label") or r.get("id") or "reading"),
                        "source": "period_indicator",
                    }
                )
    elif step_id == 3:
        em = report.get("emotion_mirror") or {}
        for t in (em.get("behavior_tags") or [])[:5]:
            if isinstance(t, dict):
                items.append(
                    {
                        "kind": "behavior_tag",
                        "label": str(t.get("mirror") or t.get("label") or "tag"),
                        "source": "emotion_mirror",
                    }
                )
        for d in (report.get("deviations") or [])[:5]:
            if isinstance(d, dict):
                items.append(
                    {
                        "kind": "deviation",
                        "label": str(d.get("label") or d.get("kind") or "deviation"),
                        "source": "deviations",
                    }
                )
    elif step_id == 4:
        for s in ((report.get("clustering") or {}).get("statements") or [])[:5]:
            if isinstance(s, dict):
                items.append(
                    {
                        "kind": "co_occurrence",
                        "label": str(s.get("observation") or s.get("kind") or ""),
                        "source": "clustering",
                    }
                )
    elif step_id == 6:
        for w in (report.get("what_worked") or [])[: rd.MAX_WHAT_WORKED]:
            if isinstance(w, dict):
                items.append(
                    {
                        "kind": "what_worked",
                        "label": str(w.get("observation") or ""),
                        "source": "what_worked",
                    }
                )
        em = report.get("emotion_mirror") or {}
        for t in (em.get("insight_tags") or [])[:3]:
            if isinstance(t, dict):
                items.append(
                    {
                        "kind": "insight_tag",
                        "label": str(t.get("mirror") or t.get("label") or ""),
                        "source": "emotion_mirror",
                    }
                )
    elif step_id == 7:
        for row in (report.get("expected_vs_actual") or [])[:5]:
            if isinstance(row, dict):
                items.append(
                    {
                        "kind": "eva",
                        "label": str(row.get("day") or "day"),
                        "source": "expected_vs_actual",
                    }
                )
    # steps 5, 8, 9: trader-authored / book — inventory optional
    return [i for i in items if (i.get("label") or "").strip()]


def build_sequence_guide(
    report: dict[str, Any],
    *,
    prompt_version_id: str,
    focused_step: int | None = None,
    body_md: str = "",
    cause_filled: bool = False,
) -> dict[str, Any]:
    """Spec §16 — sequence keeper: order, one question, inventory, nothing-here.

    Does not prescribe corrective actions. Guardrails run on all prompts.
    """
    focus = int(focused_step or 1)
    if focus < 1 or focus > 9:
        focus = 1

    steps_out: list[dict[str, Any]] = []
    for spec in CEREMONY_STEPS:
        sid = int(spec["id"])
        inv = _step_inventory(report, sid)
        q = str(spec["focus_question"])
        assert_no_guardrail_violation(q, field=f"step_{sid}_question")

        if sid == 5:
            nothing = not cause_filled and not inv
            status = "answered" if cause_filled else ("empty" if nothing else "ready")
        elif sid == 8:
            # Trader owns commitment — agent never fills it
            status = "ready"
            nothing = False
        elif sid == 9:
            book = report.get("book_performance") or report.get("pnl")
            nothing = not book
            status = "empty" if nothing else "ready"
        else:
            nothing = len(inv) == 0
            status = "empty" if nothing else "ready"

        step_payload = {
            "id": sid,
            "key": spec["key"],
            "title": spec["title"],
            "focus_question": q,
            "status": status,
            "nothing_here": nothing,
            "inventory": inv,
            "is_focused": sid == focus,
        }
        # One question only when focused (anti multi-question turns)
        if sid != focus:
            step_payload["focus_question_hidden"] = True
        steps_out.append(step_payload)

    focused = next(s for s in steps_out if s["is_focused"])
    turn = {
        "step_id": focused["id"],
        "question": focused["focus_question"],
        "inventory": focused["inventory"],
        "nothing_here": focused["nothing_here"],
        "instruction": (
            "Answer this step or mark nothing here. "
            "The agent does not fill empty fields or prescribe."
        ),
    }
    assert_no_guardrail_violation(turn["question"], field="turn.question")
    assert_no_guardrail_violation(turn["instruction"], field="turn.instruction")

    return {
        "role": "sequence_keeper",
        "version": "0.7.1",
        "prompt_version_id": prompt_version_id,
        "focused_step": focus,
        "steps": steps_out,
        "turn": turn,
        "guardrails": {
            "enforced_in_code": True,
            "admin_editable": False,
            "bans_sample": list(GUARDRAIL_BANS[:8]),
            "no_prescription": True,
            "one_question_per_turn": True,
        },
        # Assembly mirrors report — trader judgment still required
        "assembly": {
            "what_worked": list(report.get("what_worked") or [])[: rd.MAX_WHAT_WORKED],
            "deviations": list(report.get("deviations") or [])[: rd.MAX_DEVIATIONS],
            "clustering_statements": list(
                ((report.get("clustering") or {}).get("statements") or [])[:5]
            ),
        },
        # Spec §16: agent does not prescribe — empty plans from sequence path
        "habit_plans": [],
        "what_worked": list(report.get("what_worked") or [])[: rd.MAX_WHAT_WORKED],
        "concerns": [],
        "root_cause_hypotheses": [],
        "meta": {
            "mode": agent_mode(),
            "prompt_version_id": prompt_version_id,
            "role": "sequence_keeper",
            "prescribes": False,
        },
        "prompt_body_preview": (body_md or "")[:240],
    }


def local_analyze(report: dict[str, Any]) -> dict[str, Any]:
    """Legacy name — R8 sequence path (no prescription)."""
    return build_sequence_guide(
        report,
        prompt_version_id=DEFAULT_PROMPT_VERSION_ID,
        focused_step=1,
    )


def run_analyze(
    report: dict[str, Any],
    *,
    role: str,
    has_observer_trial: bool,
    prompt_version_id: str | None = None,
    focused_step: int | None = None,
    cause_filled: bool = False,
    prompt_body: str = "",
) -> dict[str, Any]:
    """Config + entitlement + sequence guide + guardrails (Spec §16)."""
    if not can_run_agent_for_role(role, has_observer_trial=has_observer_trial):
        raise PermissionError(
            "Sequence agent requires Observer, Navigator, Activator, or admin "
            "(same Practice entitlement as create/gather)"
        )
    require_agent_configured()
    pvid = (prompt_version_id or DEFAULT_PROMPT_VERSION_ID).strip()
    guide = build_sequence_guide(
        report,
        prompt_version_id=pvid,
        focused_step=focused_step,
        body_md=prompt_body,
        cause_filled=cause_filled,
    )
    # Full-payload guardrail scan
    assert_no_guardrail_violation(
        str(guide.get("turn") or {}), field="turn"
    )
    for s in guide.get("steps") or []:
        assert_no_guardrail_violation(
            str(s.get("focus_question") or ""),
            field=f"step_{s.get('id')}",
        )
    # No habit plans from agent (prescription ban)
    if guide.get("habit_plans"):
        raise AgentValidationError("sequence agent must not prescribe habit_plans")
    return guide
