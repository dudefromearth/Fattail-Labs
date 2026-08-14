"""Journal Session agent — Spec v0.4a §7 · §9 · §10.

Config (Coach GO DL-157; audit item 5):
  LABS_JOURNAL_AGENT_MODE = llm | local | off  (required at boot; no default)
  local = test/offline only; off = fail-loud agent turns.
  Member plain-text chat always available (primacy).

Local: once-only absence probes — does not simulate interlocutor dialogue.
LLM: §10 system constant + trade-log context; validator before render.
Double-fail → plain-text degrade (session stays open). No depth budgets.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import auth
import journal_session_domain as jsd
import journal_session_structured as jss
import journal_session_validator as jsv
import retrospective_domain as rd
from labs_member_ai_ethos import (
    DISTRESS_ACK_BODY,
    ETHOS_ID,
    compose_member_system_prompt,
    ethos_stamp,
    member_text_indicates_distress,
)

AGENT_MODE_OFF = "off"
AGENT_MODE_LOCAL = "local"
AGENT_MODE_LLM = "llm"
AGENT_SERVICE = jsd.AGENT_SERVICE  # labs-journal-session

# Spec §8.3 — surface role; composed with LABS_MEMBER_AI_ETHOS_V1_1 (North Star Spec v1.1)
JOURNAL_SESSION_SYSTEM_PROMPT_V1 = """You are conducting a trading journal interview for a FatTail Labs member. Your job is to
help the member produce a record that can be checked against what actually happened. You
are an interviewer and a recorder. You are not a coach, an analyst, or a critic.

Distress: if the member expresses crisis or self-harm, stop interviewing. Do not probe
process, cause, or habits. Acknowledge briefly only — code may hard-stop the turn.

What you do

Ask about things the member has not yet said. Your questions target absences — a missing
price level, a missing size, a missing condition that would prove the plan wrong. Press for
specificity and for claims that can later be checked. If the member says "watching for a
bounce," ask where. If they describe a plan with no invalidation, ask what would make them
wrong.

Aim for one true sentence in the member's own voice — one honest line that will be worth
reading back to them weeks from now. Not a summary. Not a completed form.

What you never do

- Never name a motive or an emotion. Do not say the member hesitated, was anxious, was
  fearful, was greedy, was revenge trading, lost discipline, or lost confidence. Motive
  comes from the member or it does not enter the record.
- Never assert a fact about the market, a chart, or a price that the member has not stated.
- Never give advice, propose a better plan, or say what the member should have done. Not
  even when asked. If asked, redirect: ask what they would do differently.
- Never evaluate. No praise, no "good trade," no "nice work," no approval of wins and no
  sympathy framing for losses.
- Give losses no more attention and no more turns than wins. Symmetry is required.
- Never state a profit or loss figure, even when it is visible to you.
- Never mention the member's process integrity grade, any meter, any streak, or any score.
- Never ask the member to be brief, to condense, or to summarize. Never comment on the
  length or the effort of what they wrote, in either direction.
- Never ask for something the trade log already tells you.
- Never interpret an uploaded image. Do not describe what a chart shows, name a pattern, or
  read a price from it. Ask the member what the image shows.
- Never fill a field the member left empty. Absent is a valid state.

How you ask

One question per turn. The question must target something absent, not something already
said. Plain language, short. No preamble, no restating what the member just told you back
at them before asking the next thing.

Start in the middle. You have the member's trade log. Do not ask what they traded — name it
and ask about the part you cannot know: "Three ES trades, two after 2pm. Talk to me about
the second one."

"I don't know" is a complete answer. Log it as uncertainty and move on. Never ask the same
thing twice. Forcing false precision is worse than accepting vagueness — a member who
states a level they do not believe has corrupted the record and has learned to perform for
you.

During market hours

If the market is open on this entry's date, you do not ask questions. You receive what the
member writes and acknowledge briefly or not at all.

Closing

Restate the member's plan in their terms — plan, invalidation, what they are watching — in
one compressed turn, and ask them to confirm or correct it. Then ask what they are watching
next. End on their words.
"""

# Local absence probes — once per key only (v0.4a §7.2); not a script quota
PRE_MARKET_PROBES: list[tuple[str, str]] = [
    ("invalidation", "What would prove this plan wrong — your invalidation, in your words?"),
    ("trigger_level", "What level or condition makes this plan actionable?"),
    ("thesis_direction", "What is the thesis or direction, in your words?"),
    ("size_risk", "What size or risk frame are you using?"),
    ("watching", "What are you watching next?"),
    ("instrument", "What instrument or product is this plan for?"),
]

POST_SESSION_PROBES: list[tuple[str, str]] = [
    ("plan_diff", "How did the day differ from the plan — process only, in your words?"),
    ("deviations", "What deviations do you name?"),
    ("what_worked", "What worked — your assertion only?"),
    ("open_thread", "Anything to carry forward as an open thread?"),
]

CLEAN_DAY_PROBE = ("differed_from_plan", "Did anything differ from the plan today?")
REFLECTION_PROBE = ("note", "What is worth recording from this sitting?")

PLAIN_TEXT_DEGRADE_DETAIL = (
    "Agent turn could not be rendered. Continue in plain text — "
    "your conversation stays open."
)
# Back-compat alias
FORM_FALLBACK_DETAIL = PLAIN_TEXT_DEGRADE_DETAIL
DEPTH_CAP: dict[str, int] = {}  # v0.4a: no depth budget


class AgentConfigError(RuntimeError):
    """Missing or disabled agent configuration — fail loud."""


class AgentTurnError(Exception):
    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def agent_mode() -> str:
    """Required env: llm | local | off. Missing or typo must not become llm."""
    from config import ConfigError

    raw = os.environ.get("LABS_JOURNAL_AGENT_MODE")
    if raw is None or not str(raw).strip():
        raise ConfigError(
            "Missing required environment variable: LABS_JOURNAL_AGENT_MODE"
        )
    mode = str(raw).strip().lower()
    if mode not in (AGENT_MODE_LLM, AGENT_MODE_LOCAL, AGENT_MODE_OFF):
        raise ConfigError(
            f"LABS_JOURNAL_AGENT_MODE must be llm|local|off, got {raw!r}"
        )
    return mode


def require_agent_configured() -> str:
    mode = agent_mode()
    if mode in (AGENT_MODE_OFF, "false", "0", "disabled"):
        raise AgentConfigError(
            "Journal session agent is off "
            "(LABS_JOURNAL_AGENT_MODE=off). Plain-text chat remains available."
        )
    if mode == AGENT_MODE_LOCAL:
        return mode
    if mode == AGENT_MODE_LLM:
        try:
            from ai.config import get_ai_config

            cfg = get_ai_config()
            if not cfg.primary_configured and not cfg.secondary_configured:
                raise AgentConfigError(
                    "LABS_JOURNAL_AGENT_MODE=llm but no AI provider key configured "
                    "(set XAI_API_KEY or ANTHROPIC_API_KEY, or use mode=local)"
                )
        except AgentConfigError:
            raise
        except Exception as e:
            raise AgentConfigError(f"AI config failed: {e}") from e
        return mode
    raise AgentConfigError(
        f"Unsupported LABS_JOURNAL_AGENT_MODE={mode!r} "
        f"(supported: {AGENT_MODE_LLM}|{AGENT_MODE_LOCAL}|{AGENT_MODE_OFF})"
    )


def can_run_agent_for_role(role: str, *, has_observer_trial: bool = False) -> bool:
    """Same Practice entitlement as session create / retro agent (D6)."""
    if role == "administrator":
        return True
    try:
        if auth.role_at_least(role, "activator"):
            return True
    except auth.AuthError:
        pass
    if has_observer_trial:
        return True
    return False


def has_active_observer_trial(cur, identity_id: int) -> bool:
    return rd.has_active_plan_slug(cur, identity_id, rd.OBSERVER_TRIAL_SLUG)


def depth_cap_for_tag(tag: str) -> int:
    """v0.4a: no depth budget — return a high ceiling for status UI only."""
    return 999


def count_agent_absence_turns(cur, session_id: int, identity_id: int) -> int:
    """Count non-silent agent turns (status UI only; not a hard cap)."""
    cur.execute(
        """SELECT body_md FROM member_journal_messages
           WHERE session_id = %s AND identity_id = %s AND author = 'agent'
           ORDER BY created_at ASC, id ASC""",
        (session_id, identity_id),
    )
    n = 0
    for row in cur.fetchall():
        body = str(row.get("body_md") or "")
        if body.startswith("[silent]"):
            continue
        if body.startswith("[confirm]"):
            continue
        n += 1
    return n


def _structured_from_row(row: dict) -> dict:
    sj = row.get("structured_json")
    if isinstance(sj, str):
        try:
            sj = json.loads(sj)
        except json.JSONDecodeError:
            return {}
    return sj if isinstance(sj, dict) else {}


def _field_present(structured: dict, key: str) -> bool:
    val = structured.get(key)
    if val is None:
        return False
    if isinstance(val, str):
        return bool(val.strip())
    return True


def _local_next_question(
    tag: str,
    structured: dict,
    raised: list[str],
) -> tuple[str | None, str | None, str | None]:
    """Return (body, kind, absence_key). Once-only keys; no depth budget."""
    raised_set = set(raised)

    if tag == "clean_day":
        key, q = CLEAN_DAY_PROBE
        if key in raised_set or _field_present(structured, key):
            return None, "done", None
        return q, "absence", key

    if tag == "reflection":
        key, q = REFLECTION_PROBE
        if key in raised_set or _field_present(structured, key):
            return None, "done", None
        return q, "absence", key

    probes = POST_SESSION_PROBES if tag == "post_session" else PRE_MARKET_PROBES
    for key, q in probes:
        if key in raised_set or _field_present(structured, key):
            continue
        return q, "absence", key
    return None, "done", None


def build_agent_status(
    cur,
    identity_id: int,
    session_id: int,
    *,
    role: str,
) -> dict[str, Any]:
    """Mode, entitlement — for UI (no hard depth cap in v0.4a)."""
    mode = agent_mode()
    trial = has_active_observer_trial(cur, identity_id)
    entitled = can_run_agent_for_role(role, has_observer_trial=trial)
    cur.execute(
        """SELECT id, tag, journal_date, status, structured_json,
                  absence_keys_raised_json
           FROM member_journal_sessions
           WHERE id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise AgentTurnError(404, jsd.NOT_FOUND_DETAIL)
    tag = str(row.get("tag") or "reflection")
    used = count_agent_absence_turns(cur, session_id, identity_id)
    configured = mode in (AGENT_MODE_LOCAL, AGENT_MODE_LLM)
    if mode == AGENT_MODE_LLM:
        try:
            require_agent_configured()
        except AgentConfigError:
            configured = False
    return {
        "mode": mode,
        "configured": configured and mode != AGENT_MODE_OFF,
        "entitled": entitled,
        "agent_service": AGENT_SERVICE,
        "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        "tag": tag,
        "depth_used": used,
        "depth_cap": depth_cap_for_tag(tag),
        "depth_remaining": depth_cap_for_tag(tag),
        "absence_keys_raised": jsd.get_absence_keys_raised(row),
        "system_prompt_constant": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        "plain_text_always": True,
        "form_fallback_available": True,  # legacy key; means plain-text degrade OK
        **ethos_stamp(),
    }


def run_agent_turn(
    cur,
    identity_id: int,
    session_id: int,
    *,
    role: str,
    member_body: str | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """One agent turn. D7 attribution. Primacy: member text always first if present."""
    try:
        mode = require_agent_configured()
    except AgentConfigError as e:
        raise AgentTurnError(
            503,
            str(e),
            extra={"plain_text_degrade": True, "form_fallback": True, "detail_code": "agent_off"},
        ) from e

    trial = has_active_observer_trial(cur, identity_id)
    if not can_run_agent_for_role(role, has_observer_trial=trial):
        raise AgentTurnError(403, jsd.CREATE_DENY_DETAIL)

    row = jsd._load_mutable_row(cur, identity_id, session_id)
    jd = jsd._as_date(row["journal_date"])
    jsd.assert_date_open(cur, identity_id, jd)
    tag = str(row.get("tag") or "reflection")
    at = now or jsd._now_utc()
    phase = jsd.derive_phase(jd, at, cur=cur)
    member_wrote = bool(member_body and str(member_body).strip())

    if member_wrote:
        jsd.append_member_message(
            cur, identity_id, session_id, body_md=str(member_body), now=at
        )
        cur.execute(
            f"""SELECT {jsd._SESSION_COLS}
               FROM member_journal_sessions
               WHERE id = %s AND identity_id = %s""",
            (session_id, identity_id),
        )
        row = cur.fetchone() or row

    structured = _structured_from_row(row)
    raised = jsd.get_absence_keys_raised(row)

    # Spec v1.2 §5.2 #9 / §5.4 — distress code gate: ALWAYS runs (even ETHOS_MODE=off).
    # Session stays open; non-distress later turns resume probes. Gate re-checks each turn.
    if member_wrote and member_text_indicates_distress(member_body):
        body = DISTRESS_ACK_BODY
        validated = _validate_with_retry(tag=tag, primary=body, kind="silent")
        if validated.get("form_fallback"):
            return {
                "message": None,
                "kind": "distress_hold",
                "phase": phase,
                "depth": build_agent_status(cur, identity_id, session_id, role=role),
                "form_fallback": True,
                "detail": (
                    "Interview paused for this turn. Keep writing anytime. "
                    "Crisis: US 988; https://www.iasp.info/suicidalthoughts/"
                ),
                "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
                "session_open": True,
                **ethos_stamp(),
            }
        msg = jsd.append_agent_message(
            cur, identity_id, session_id,
            body_md=validated["body"], phase=phase, now=at,
        )
        return {
            "message": msg,
            "kind": "distress_hold",
            "phase": phase,
            "depth": build_agent_status(cur, identity_id, session_id, role=role),
            "form_fallback": False,
            "detail": (
                "Interview questions stopped this turn; journal stays open. "
                "Continue writing to resume normal agent turns when ready."
            ),
            "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
            "validator": {"ok": True, "attempts": validated.get("attempts", 1)},
            "session_open": True,
            **ethos_stamp(),
        }

    # RTH: no unprompted questions — only ack if member wrote; else quiet
    if phase == "intraday" and not member_wrote:
        return {
            "message": None,
            "kind": "quiet",
            "phase": phase,
            "depth": build_agent_status(cur, identity_id, session_id, role=role),
            "form_fallback": False,
            "detail": "Market hours — agent waits until you write.",
            "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        }

    if phase == "intraday" and member_wrote:
        body = "[silent] Noted."
        validated = _validate_with_retry(tag=tag, primary=body, kind="silent")
        if validated.get("form_fallback"):
            return _form_fallback_payload(
                cur, identity_id, session_id, role=role, phase=phase,
                reason="validator_double_fail",
                violations=validated.get("violations") or [],
            )
        msg = jsd.append_agent_message(
            cur, identity_id, session_id,
            body_md=validated["body"], phase=phase, now=at,
        )
        return {
            "message": msg,
            "kind": "silent",
            "phase": phase,
            "depth": build_agent_status(cur, identity_id, session_id, role=role),
            "form_fallback": False,
            "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
            "validator": {"ok": True, "attempts": validated.get("attempts", 1)},
        }

    # Local probes (also used when llm fails over in future)
    question, kind, absence_key = _local_next_question(tag, structured, raised)

    if mode == AGENT_MODE_LLM and (kind != "done" or member_wrote):
        try:
            llm_body = _llm_turn(
                cur, identity_id, session_id, tag=tag, phase=phase,
                member_body=member_body if member_wrote else None,
                structured=structured, raised=raised,
            )
            if llm_body:
                question, kind, absence_key = llm_body, "absence", None
        except Exception:
            # Fall through to local if available
            if mode == AGENT_MODE_LLM and kind == "done":
                pass

    if kind == "done" or question is None:
        return {
            "message": None,
            "kind": "done",
            "phase": phase,
            "depth": build_agent_status(cur, identity_id, session_id, role=role),
            "form_fallback": False,
            "plain_text_degrade": False,
            "detail": (
                "No further absence probes right now. Chat stays open — "
                "write freely or invoke the structured pass if you want."
            ),
            "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        }

    validated = _validate_with_retry(tag=tag, primary=question, kind=kind or "absence")
    if validated.get("form_fallback"):
        return _form_fallback_payload(
            cur, identity_id, session_id, role=role, phase=phase,
            reason="validator_double_fail",
            violations=validated.get("violations") or [],
        )

    msg = jsd.append_agent_message(
        cur, identity_id, session_id,
        body_md=validated["body"], phase=phase, now=at,
    )
    if absence_key:
        jsd.mark_absence_key_raised(cur, identity_id, session_id, absence_key)
    return {
        "message": msg,
        "kind": kind,
        "phase": phase,
        "depth": build_agent_status(cur, identity_id, session_id, role=role),
        "form_fallback": False,
        "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        "agent_service": AGENT_SERVICE,
        "system_prompt_ref": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        "validator": {
            "ok": True,
            "attempts": validated.get("attempts", 1),
            "retried": validated.get("attempts", 1) > 1,
        },
    }


def _llm_turn(
    cur,
    identity_id: int,
    session_id: int,
    *,
    tag: str,
    phase: str,
    member_body: str | None,
    structured: dict,
    raised: list[str],
) -> str | None:
    """Optional LLM path — returns agent body or None to fall back to local."""
    from ai.client import complete

    # Recent transcript
    cur.execute(
        """SELECT author, body_md FROM member_journal_messages
           WHERE session_id = %s AND identity_id = %s
           ORDER BY created_at DESC, id DESC LIMIT 12""",
        (session_id, identity_id),
    )
    rows = list(reversed(cur.fetchall()))
    lines = []
    for r in rows:
        who = "Member" if r["author"] == "member" else "Agent"
        lines.append(f"{who}: {r['body_md']}")
    # Trade log day context (best effort)
    day_ctx = ""
    try:
        from trade_log_domain.day_book import day_book_for_identity

        jd = None
        cur.execute(
            "SELECT journal_date FROM member_journal_sessions WHERE id=%s",
            (session_id,),
        )
        r = cur.fetchone()
        if r:
            jd = jsd._as_date(r["journal_date"])
        if jd:
            book = day_book_for_identity(cur, identity_id, jd.isoformat())
            n = len((book or {}).get("items") or [])
            day_ctx = f"Trade log items on {jd.isoformat()}: {n}."
    except Exception:
        day_ctx = ""

    # Spec v0.5 §5.1 / §8.1 — Tag Manager labels as description only (never script/gate)
    tag_labels_ctx = ""
    try:
        import tag_domain as td

        assigns = td.list_assignments_for_object(
            cur,
            object_type="journal_session",
            object_id=session_id,
            identity_id=identity_id,
        )
        labels = []
        for a in assigns:
            t = a.get("tag") or {}
            lab = (t.get("label") or "").strip()
            if lab:
                labels.append(lab)
        if labels:
            tag_labels_ctx = (
                "Member tagged (context only; do not open interview or change "
                "behavior based on tags): " + ", ".join(labels) + "."
            )
        else:
            tag_labels_ctx = "Member tagged: (none)."
    except Exception:
        tag_labels_ctx = ""

    # Legacy column tag is not SoR — mention only as weak legacy if no TM labels
    legacy_tag = (tag or "").strip()
    legacy_bit = (
        f" Legacy session.tag={legacy_tag}."
        if legacy_tag and not tag_labels_ctx.startswith("Member tagged:")
        else ""
    )

    system = compose_member_system_prompt(JOURNAL_SESSION_SYSTEM_PROMPT_V1)
    user = (
        f"Phase={phase}. {tag_labels_ctx}{legacy_bit} "
        f"Structured confirmed fields={json.dumps(structured)}. "
        f"Absence keys already raised={raised}. {day_ctx}\n"
        f"Transcript:\n" + ("\n".join(lines) if lines else "(empty)")
        + "\n\nRespond with one short process question or brief acknowledgment only."
    )
    result = complete(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        agent="journal_session",
        temperature=0.2,
        max_tokens=256,
    )
    text = (result.content or "").strip()
    return text or None


def _validate_with_retry(
    *,
    tag: str,
    primary: str,
    kind: str,
) -> dict[str, Any]:
    """Validate primary body; on fail try safe fallback once; else form_fallback.

    Never inserts a violating turn. Logs violations in return payload for tests/ops.
    """
    log: list[dict[str, Any]] = []
    first = jsv.validate_agent_turn(primary)
    if first["ok"]:
        return {"body": primary, "attempts": 1, "violations_log": log}

    log.append({"attempt": 1, "violations": first["violations"], "body": primary})

    # One retry — safe scripted question (always single-Q process)
    retry_body = jsv.safe_fallback_question(tag)
    if kind == "silent":
        retry_body = "[silent] Noted."
    elif kind == "confirm":
        # Keep confirm prefix if primary was confirm
        retry_body = (
            "[confirm] Please confirm or correct your plan, invalidation, "
            "and what you are watching — in your words."
        )

    second = jsv.validate_agent_turn(retry_body)
    if second["ok"]:
        log.append({"attempt": 2, "violations": [], "body": retry_body})
        return {
            "body": retry_body,
            "attempts": 2,
            "violations_log": log,
            "retried": True,
        }

    log.append({"attempt": 2, "violations": second["violations"], "body": retry_body})
    # Double-fail — do not render; form path
    return {
        "form_fallback": True,
        "attempts": 2,
        "violations": second["violations"],
        "violations_log": log,
    }


def _form_fallback_payload(
    cur,
    identity_id: int,
    session_id: int,
    *,
    role: str,
    phase: str,
    reason: str,
    violations: list,
) -> dict[str, Any]:
    """§8.2 critical path: never dead partial — point at J2 form."""
    return {
        "message": None,
        "kind": "form_fallback",
        "phase": phase,
        "depth": build_agent_status(cur, identity_id, session_id, role=role),
        "form_fallback": True,
        "form_fallback_reason": reason,
        "detail": FORM_FALLBACK_DETAIL,
        "validator": {
            "ok": False,
            "attempts": 2,
            "violations": violations,
        },
        "prompt_version": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
        "checklist": None,  # filled by route if needed
    }


def validate_candidate_for_tests(body_md: str) -> dict[str, Any]:
    """Expose validator for characterization tests."""
    return jsv.validate_agent_turn(body_md)
