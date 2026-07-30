"""Journal Session structured_json schemas — Spec v0.2 §5 / §5.1 · JS2-1.

Code-owned checklists (same for J2 form and J3 agent). Never invent fields.
Hotel: invalidation is load-bearing for complete pre_market; uncertainty > false precision.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

# --- Field specs -------------------------------------------------------------

# required_for_complete: must be non-empty for "complete" seal (not partial).
# Absent is always allowed on open/partial rows (Spec: unreached = absent).

PRE_MARKET_FIELDS: tuple[dict[str, Any], ...] = (
    {
        "key": "instrument",
        "label": "Instrument",
        "hint": "What is in play (symbol / product).",
        "required_for_complete": False,
        "prefillable": True,
    },
    {
        "key": "thesis_direction",
        "label": "Thesis / direction",
        "hint": "Your directional or structural idea, in your words.",
        "required_for_complete": False,
        "prefillable": False,
    },
    {
        "key": "trigger_level",
        "label": "Trigger / level",
        "hint": "Condition or level that makes the plan actionable.",
        "required_for_complete": False,
        "prefillable": False,
    },
    {
        "key": "size_risk",
        "label": "Size / risk",
        "hint": "Size and/or risk frame you stated — risk before opportunity.",
        "required_for_complete": False,
        "prefillable": True,
    },
    {
        "key": "invalidation",
        "label": "Invalidation",
        "hint": (
            "What would prove the plan wrong or force stand-down. "
            "Your definition — not a broker stop. "
            "'I don't know' may be recorded as uncertainty."
        ),
        "required_for_complete": True,  # load-bearing (Hotel §5.1)
        "prefillable": False,
        "allows_uncertainty": True,
    },
    {
        "key": "watching",
        "label": "Watching",
        "hint": "What you monitor next (levels, events) — process, not prediction.",
        "required_for_complete": False,
        "prefillable": False,
    },
)

POST_SESSION_FIELDS: tuple[dict[str, Any], ...] = (
    {
        "key": "plan_diff",
        "label": "Plan vs actual",
        "hint": "How the day differed from the plan (process, not P&L story).",
        "required_for_complete": False,
        "prefillable": False,
    },
    {
        "key": "deviations",
        "label": "Deviations you name",
        "hint": "Member-named deviations only — no agent invention.",
        "required_for_complete": False,
        "prefillable": False,
    },
    {
        "key": "what_worked",
        "label": "What worked",
        "hint": "Your assertion — distinct from retrospective derived what-worked.",
        "required_for_complete": False,
        "prefillable": False,
    },
    {
        "key": "open_thread",
        "label": "Open thread",
        "hint": "Carry-forward note for the next sitting or retrospective.",
        "required_for_complete": False,
        "prefillable": False,
    },
)

CLEAN_DAY_FIELDS: tuple[dict[str, Any], ...] = (
    {
        "key": "differed_from_plan",
        "label": "Anything differ from plan?",
        "hint": "Yes / No in your words. Yes → consider a post_session entry.",
        "required_for_complete": True,
        "prefillable": False,
    },
)

REFLECTION_FIELDS: tuple[dict[str, Any], ...] = (
    {
        "key": "note",
        "label": "Reflection",
        "hint": "Light process note. Does not feed §6.5 as pre_market intent.",
        "required_for_complete": False,
        "prefillable": False,
    },
)

TAG_FIELD_SPECS: dict[str, tuple[dict[str, Any], ...]] = {
    "pre_market": PRE_MARKET_FIELDS,
    "post_session": POST_SESSION_FIELDS,
    "clean_day": CLEAN_DAY_FIELDS,
    "reflection": REFLECTION_FIELDS,
}

# Canonical key order for pre_market (also used by format_structured_intent)
PRE_MARKET_KEY_ORDER = tuple(f["key"] for f in PRE_MARKET_FIELDS)

UNCERTAINTY_MARKERS = frozenset(
    {
        "i don't know",
        "i dont know",
        "don't know",
        "dont know",
        "unknown",
        "no hard invalidation",
        "none",
        "n/a",
        "na",
        "uncertainty",
    }
)


def field_keys_for_tag(tag: str) -> frozenset[str]:
    specs = TAG_FIELD_SPECS.get(tag)
    if not specs:
        return frozenset()
    return frozenset(f["key"] for f in specs)


def schema_for_tag(tag: str) -> dict[str, Any]:
    """Public schema document for form/UI (JS2-2)."""
    specs = TAG_FIELD_SPECS.get(tag)
    if specs is None:
        return {
            "tag": tag,
            "known": False,
            "fields": [],
            "note": "Unknown tag — no structured checklist.",
        }
    return {
        "tag": tag,
        "known": True,
        "fields": [
            {
                "key": f["key"],
                "label": f["label"],
                "hint": f["hint"],
                "required_for_complete": bool(f.get("required_for_complete")),
                "prefillable": bool(f.get("prefillable")),
                "allows_uncertainty": bool(f.get("allows_uncertainty")),
            }
            for f in specs
        ],
        "complete_rule": (
            "All required_for_complete fields present (non-empty), "
            "or for invalidation an explicit uncertainty phrase."
            if tag == "pre_market"
            else "See required_for_complete on each field."
        ),
        "hotel_note": (
            "Invalidation is process definition, not stop advice. "
            "Never invent levels. 'I don't know' > false precision."
            if tag == "pre_market"
            else None
        ),
    }


def _is_present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def _is_uncertainty(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return value.strip().lower() in UNCERTAINTY_MARKERS


def normalize_structured(tag: str, raw: Any) -> dict[str, Any] | None:
    """Keep only known keys for tag; empty strings → omit (absent). Never invent."""
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise ValueError("structured must be an object or null")
    allowed = field_keys_for_tag(tag)
    if not allowed:
        # Unknown tag: store empty object only
        return {}
    out: dict[str, Any] = {}
    for key, val in raw.items():
        if key not in allowed:
            continue  # drop unknown keys (form-owned vocabulary)
        if isinstance(val, str):
            val = val.strip()
            if not val:
                continue
        if val is None:
            continue
        out[str(key)] = val
    return out


def checklist_status(tag: str, structured: dict | None) -> dict[str, Any]:
    """Evaluate completeness against code checklist."""
    specs = TAG_FIELD_SPECS.get(tag) or ()
    structured = structured or {}
    fields_out: list[dict[str, Any]] = []
    missing: list[str] = []
    for f in specs:
        key = f["key"]
        val = structured.get(key)
        present = _is_present(val)
        req = bool(f.get("required_for_complete"))
        # Explicit uncertainty phrases count as present for allows_uncertainty fields
        if (
            not present
            and req
            and f.get("allows_uncertainty")
            and isinstance(val, str)
            and _is_uncertainty(val)
        ):
            present = True
        satisfied = (not req) or present
        if req and not present:
            missing.append(key)
        fields_out.append(
            {
                "key": key,
                "label": f["label"],
                "present": present,
                "required_for_complete": req,
                "satisfied": satisfied,
            }
        )

    complete = len(missing) == 0
    return {
        "tag": tag,
        "complete": complete,
        "missing_required": missing,
        "fields": fields_out,
    }


def assert_complete_for_seal(tag: str, structured: dict | None) -> None:
    """Raise ValueError if require_complete seal and checklist incomplete."""
    st = checklist_status(tag, structured)
    if not st["complete"]:
        missing = ", ".join(st["missing_required"]) or "(unknown)"
        raise ValueError(
            f"Checklist incomplete for complete seal. Missing: {missing}. "
            "Use partial status, or fill required fields / record invalidation uncertainty."
        )


def prefill_structured(
    cur,
    identity_id: int,
    tag: str,
    journal_date: date,
) -> dict[str, Any]:
    """Trade log + prior pre_market structured — never invent invalidation/thesis."""
    if tag != "pre_market":
        return {}

    out: dict[str, Any] = {}

    # --- Prior pre_market (before this journal_date) with structured ---
    cur.execute(
        """SELECT structured_json FROM member_journal_sessions
           WHERE identity_id = %s
             AND tag = 'pre_market'
             AND status IN ('open', 'closed', 'partial', 'sealed')
             AND structured_json IS NOT NULL
             AND journal_date < %s
           ORDER BY journal_date DESC, id DESC
           LIMIT 1""",
        (identity_id, journal_date),
    )
    prior = cur.fetchone()
    if prior and prior.get("structured_json"):
        raw = prior["structured_json"]
        if isinstance(raw, str):
            import json

            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                raw = None
        if isinstance(raw, dict):
            for key in ("instrument", "size_risk"):
                if _is_present(raw.get(key)):
                    out[key] = raw[key]

    # --- Same-day trade log underliers / strategy ---
    day_start = datetime(journal_date.year, journal_date.month, journal_date.day)
    day_end = day_start + timedelta(days=1)
    cur.execute(
        """SELECT t.id, t.strategy, t.plan_md
           FROM member_trade_log_trades t
           WHERE t.identity_id = %s
             AND t.exec_at >= %s AND t.exec_at < %s
             AND (t.strategy IS NULL OR t.strategy <> 'NOTE')
           ORDER BY t.exec_at ASC
           LIMIT 20""",
        (identity_id, day_start, day_end),
    )
    trades = cur.fetchall()
    instruments: list[str] = []
    for t in trades:
        tid = int(t["id"])
        cur.execute(
            """SELECT underlier, symbol FROM member_trade_log_legs
               WHERE trade_id = %s AND identity_id = %s
               ORDER BY id ASC LIMIT 5""",
            (tid, identity_id),
        )
        for leg in cur.fetchall():
            u = (leg.get("underlier") or leg.get("symbol") or "").strip()
            if u and u not in instruments:
                instruments.append(u)
        strat = (t.get("strategy") or "").strip()
        if strat and strat not in instruments and not instruments:
            instruments.append(strat)

    if instruments and "instrument" not in out:
        out["instrument"] = ", ".join(instruments[:5])

    # Size/risk: never invent from P&L. Optional plan_md first line if short.
    # Skip auto size_risk from trades — risk must be member-stated (Hotel).

    return out


def all_schemas() -> dict[str, Any]:
    return {
        "tags": {tag: schema_for_tag(tag) for tag in TAG_FIELD_SPECS},
        "version": "1.0",
        "spec": "FatTail-Labs-Journal-Session-Spec-v0.2 §5 / §5.1",
    }
