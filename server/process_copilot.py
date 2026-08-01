"""Process co-pilot — card-scoped AI chat for the full production lifecycle.

Unlike blueprint chat (structure-only), this peer can peer in at any column,
explain readiness, diagnose missing stages, and draft fix artifacts.
Chat is provenance + assistance; package stages remain system of record.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Iterator

import agent_auth
import board
import db
import packages as packages_mod
import process_copilot_knowledge as knowledge
from agent_auth import Actor
from ai.client import complete
from ai.types import AiConfigError, AiError, AiProviderError

_SYSTEM_PROMPT = """You are the FatTail Labs **Process Co-pilot** — a high-reasoning Grok peer
for the production board. You combine (1) the STATIC KNOWLEDGE PACK and (2) the LIVE CARD
SNAPSHOT. Never invent process truth that contradicts either source.

## Your job
1. **Taxonomy fluency** — Explain goals/shapes of product lines (course, tutorial,
   youtube_long, campaign, and legacy coaching_short/thematic_short/other).
2. **Workflow fluency** — Board columns, package stages, blueprint vs package gates,
   course factory skill order, UI controls (cockpit, blueprint workspace, cast/HeyGen).
3. **Card fluency** — Using the LIVE snapshot: where this card is, what is done/missing/blocked.
4. **Direction** — Single best next operator action, mapped to a concrete board UI control.
5. **Repair** — Draft missing artifacts, diagnose flags, suggest product_line changes if mismatched.
6. **Doctrine** — Process outcomes only; capacity over dependency; no profit guarantees.
7. **Honesty** — Stages are complete only if present in the live checklist/artifacts.

## Reasoning style (use full capability)
- When the operator asks conceptual questions (“what is a coaching short?”), answer from the
  KNOWLEDGE PACK first, then relate to THIS card if relevant.
- When the operator asks status/next steps, lead with RED/GREEN + missing stages from LIVE data.
- If LIVE data and taxonomy conflict (e.g. intent wants a multi-module course but product_line
  is coaching_short), call that out and recommend the correct product_line.
- Prefer precise stage keys AND human labels.
- Be concise but complete; use short bullets; do not refuse process questions that are in-pack.

## You are NOT
- A silent publisher or auto-transition engine (advise; operator clicks).
- Allowed to invent completed stages.
- A replacement for Approve Blueprint / Approve Package human gates.
- Free to dump CGE idea-finder / holy-trifecta into course-create (those stay acquisition-only).

## Output tools
When drafting package content for the operator to apply:

```artifact
stage: research_pack|lesson_plan|script|script_edit_brief|video_package|placement_proposal|vision_alignment
title: Short title
---
markdown body here
```

When recommending a board move (advisory only):

```action
transition: queued|scheduled|in_production|awaiting_approval
sub_stage: research|design|script|produce|package|null
reason: one line
```

Lead with the answer. Then status. Then next move. Then optional drafts.
"""


class ProcessCopilotError(Exception):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _json_loads(raw: Any, default: Any) -> Any:
    if raw is None:
        return default
    if isinstance(raw, (list, dict)):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return default


def get_chat(item_id: int) -> dict[str, Any]:
    board.get_item(item_id)  # raises if missing
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT chat_json, last_ai_invocation_id, updated_at
                   FROM content_item_process_chat WHERE content_item_id = %s""",
                (item_id,),
            )
            row = cur.fetchone()
    if not row:
        return {
            "content_item_id": item_id,
            "chat": [],
            "last_ai_invocation_id": None,
            "updated_at": None,
        }
    return {
        "content_item_id": item_id,
        "chat": _json_loads(row["chat_json"], []),
        "last_ai_invocation_id": row.get("last_ai_invocation_id"),
        "updated_at": row["updated_at"].isoformat(sep=" ")
        if hasattr(row.get("updated_at"), "isoformat")
        else row.get("updated_at"),
    }


def _save_chat(
    item_id: int,
    chat: list[dict[str, Any]],
    last_ai_invocation_id: int | None = None,
) -> dict[str, Any]:
    payload = json.dumps(chat, ensure_ascii=False)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO content_item_process_chat
                   (content_item_id, chat_json, last_ai_invocation_id)
                   VALUES (%s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                     chat_json = VALUES(chat_json),
                     last_ai_invocation_id = COALESCE(
                       VALUES(last_ai_invocation_id), last_ai_invocation_id
                     )""",
                (item_id, payload, last_ai_invocation_id),
            )
    return get_chat(item_id)


def build_context_snapshot(item_id: int) -> dict[str, Any]:
    item = board.get_item(item_id)
    checklist = None
    try:
        checklist = packages_mod.package_checklist(item_id)
    except Exception as exc:  # noqa: BLE001
        checklist = {"error": str(exc)}

    bp = None
    try:
        import blueprint as blueprint_mod

        bp_row = blueprint_mod.get_blueprint(item_id)
        if bp_row:
            bp = {
                "status": bp_row.get("status"),
                "version": bp_row.get("version"),
                "header_title": (bp_row.get("header") or {}).get("course_title"),
                "module_count": len((bp_row.get("outline") or {}).get("modules") or []),
                "validation_ok": (bp_row.get("validation") or {}).get("ok"),
            }
    except Exception:  # noqa: BLE001
        bp = None

    arts = []
    for a in item.get("artifacts") or []:
        body = a.get("body_md") or ""
        arts.append(
            {
                "id": a.get("id"),
                "stage": a.get("stage"),
                "title": a.get("title"),
                "actor_label": a.get("actor_label"),
                "body_chars": len(body),
                "body_preview": body[:400],
            }
        )

    return {
        "card": {
            "id": item.get("id"),
            "title": item.get("title"),
            "product_line": item.get("product_line"),
            "status": item.get("status"),
            "sub_stage": item.get("sub_stage"),
            "cast_id": item.get("cast_id"),
            "priority": item.get("priority"),
            "intent_md": (item.get("intent_md") or "")[:2000],
            "acceptance_md": (item.get("acceptance_md") or "")[:800],
            "inputs_md": (item.get("inputs_md") or "")[:1500],
            "claimed_callsign": item.get("claimed_callsign"),
            "blueprint_status": item.get("blueprint_status"),
            "placed_course_slug": item.get("placed_course_slug"),
        },
        "package_checklist": checklist,
        "blueprint": bp,
        "artifacts": arts,
        "open_flags": [
            {
                "guardian": f.get("guardian"),
                "severity": f.get("severity"),
                "message": f.get("message"),
            }
            for f in (item.get("flags") or [])
            if f.get("status") == "open"
        ],
        "recent_transitions": (item.get("transitions") or [])[:12],
        "course_factory_order": [
            "blueprint_approve (course only)",
            "research_pack",
            "lesson_plan",
            "script",
            "script_edit_brief (optional, preferred for live HeyGen)",
            "video_package",
            "placement_proposal",
            "vision_alignment",
            "awaiting_approval → human Approve Package",
        ],
    }


def _fixture_reply(snapshot: dict[str, Any], message: str) -> str:
    card = snapshot.get("card") or {}
    cl = snapshot.get("package_checklist") or {}
    missing = cl.get("missing_stages") or []
    status = card.get("status")
    bp = card.get("blueprint_status")
    pl = card.get("product_line") or "other"
    msg_l = (message or "").lower()

    # Conceptual / taxonomy questions
    tax = knowledge.PRODUCT_TAXONOMY
    entry = tax["first_class_v1"].get(pl) or tax["legacy_board_lines"].get(pl)
    if any(
        k in msg_l
        for k in (
            "what is a",
            "what's a",
            "goal of",
            "taxonomy",
            "coaching short",
            "youtube long",
            "product line",
            "what is the goal",
        )
    ):
        lines = [
            f"**Product line knowledge** (pack {knowledge.KNOWLEDGE_VERSION})",
            "",
        ]
        # Prefer the line they asked about if named
        asked = None
        for key, meta in {**tax["first_class_v1"], **tax["legacy_board_lines"]}.items():
            label = (meta.get("label") or key).lower()
            if key.replace("_", " ") in msg_l or label.lower() in msg_l:
                asked = (key, meta)
                break
        if asked:
            key, meta = asked
            lines.append(f"### `{key}` — {meta.get('label', key)}")
            if meta.get("goal"):
                lines.append(f"**Goal:** {meta['goal']}")
            if meta.get("finished_shape"):
                lines.append(f"**Finished shape:** {meta['finished_shape']}")
            if meta.get("v1_note"):
                lines.append(f"**v1 note:** {meta['v1_note']}")
            if meta.get("not"):
                lines.append(f"**Not:** {meta['not']}")
            stages = knowledge.package_contracts().get(key, {}).get("required_stages")
            if stages:
                lines.append(f"**Required package stages:** {', '.join(stages)}")
        else:
            lines.append("**First-class v1 types:** course · tutorial · youtube_long · campaign")
            lines.append(
                "**Legacy board lines:** coaching_short · thematic_short · other "
                "(still on board; not frozen factory v1)."
            )
            if entry:
                lines.append("")
                lines.append(
                    f"This card is `{pl}` — {entry.get('goal') or entry.get('label')}"
                )
        lines.append("")
        lines.append(
            f"**This card:** #{card.get('id')} · column `{status}` · missing {missing or 'none'}."
        )
        return "\n".join(lines)

    lines = [
        f"**Process co-pilot** on card #{card.get('id')} — {card.get('title')}",
        f"- Column: `{status}` · product_line: `{pl}` · blueprint: `{bp}`",
        f"- Package complete: {cl.get('complete')} · missing: {missing or 'none'}",
        f"- Open flags: {len(snapshot.get('open_flags') or [])}",
        "",
        f"You asked: _{message[:200]}_",
        "",
    ]
    if entry and entry.get("goal"):
        lines.append(f"**What `{pl}` is for:** {entry['goal']}")
        lines.append("")
    if pl == "course" and bp != "approved":
        lines.append(
            "**Next:** Approve the Course Blueprint (Header + Outline) before treating "
            "scripts/video as factory progress."
        )
    elif missing:
        stage = missing[0]
        lines.append(f"**Next focus stage:** `{stage}` — add or produce that artifact.")
        if stage == "script":
            lines.append(
                "```artifact\n"
                "stage: script\n"
                "title: Lesson VO pack (fixture draft)\n"
                "---\n"
                "# Script\n\n"
                "Plan-locked VO placeholder. Replace with real lesson scripts.\n"
                "```"
            )
    elif status == "in_production":
        lines.append("**Next:** Submit for approval when checklist is complete.")
    elif status == "awaiting_approval":
        lines.append("**Next:** Human Approve Package or request revision.")
    else:
        lines.append("**Next:** Queue / claim / start production as appropriate for the column.")
    return "\n".join(lines)


def _build_messages(
    snapshot: dict[str, Any],
    chat: list[dict[str, Any]],
    user_message: str,
) -> list[dict[str, str]]:
    pl = (snapshot.get("card") or {}).get("product_line") or "course"
    contracts = (knowledge.package_contracts() or {}).get(pl) or {}
    pl_focus = {
        "this_product_line": pl,
        "required_stages_for_this_line": contracts.get("required_stages"),
        "taxonomy_entry": (
            knowledge.PRODUCT_TAXONOMY["first_class_v1"].get(pl)
            or knowledge.PRODUCT_TAXONOMY["legacy_board_lines"].get(pl)
            or {"note": "unknown product_line — use package_contracts keys"}
        ),
    }

    messages: list[dict[str, str]] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "system",
            "content": (
                "STATIC KNOWLEDGE PACK (workflow + taxonomy + package contracts + "
                "course factory + operator playbook). Ground conceptual answers here.\n"
                + knowledge.knowledge_pack_json()
            ),
        },
        {
            "role": "system",
            "content": (
                "THIS PRODUCT LINE FOCUS (derived):\n"
                + json.dumps(pl_focus, indent=2, default=str)
            ),
        },
        {
            "role": "system",
            "content": (
                "LIVE CARD SNAPSHOT (JSON — ground truth for status/done/missing). "
                "Never contradict this for completion claims.\n"
                + json.dumps(snapshot, default=str)[:24000]
            ),
        },
    ]
    # Keep history short so Grok stays under proxy/timeout budgets
    for turn in chat[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            text = str(content)
            if len(text) > 2500:
                text = text[:2400] + "\n…[truncated for context budget]"
            messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": user_message})
    return messages


def chat(
    item_id: int,
    actor: Actor,
    *,
    message: str,
    use_fixtures: bool = False,
    prefer: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2500,
) -> dict[str, Any]:
    message = (message or "").strip()
    if not message:
        raise ProcessCopilotError("message required")

    snapshot = build_context_snapshot(item_id)
    state = get_chat(item_id)
    chat_turns: list[dict[str, Any]] = list(state.get("chat") or [])

    user_turn = {
        "role": "user",
        "content": message,
        "at": _now_iso(),
        "actor_label": actor.label,
    }
    chat_turns.append(user_turn)

    inv_id = None
    used_fixture = bool(use_fixtures)
    fallback_note = ""

    if use_fixtures:
        reply = _fixture_reply(snapshot, message)
        provider, model = "fixture", "process-copilot-fixture"
    else:
        try:
            result = complete(
                _build_messages(snapshot, chat_turns[:-1], message),
                agent="quebec",
                prefer=prefer,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            reply = (result.text or "").strip()
            if not reply:
                raise ProcessCopilotError("empty model response")
            provider = result.provider
            model = result.model
            try:
                usage = getattr(result, "usage", None) or {}
                if hasattr(usage, "__dict__") and not isinstance(usage, dict):
                    usage = dict(usage.__dict__)
                inv_id = packages_mod.record_ai_invocation(
                    actor,
                    callsign="quebec",
                    task_id="process_copilot_chat",
                    provider=str(provider),
                    model=str(model),
                    prefer=prefer,
                    markers=["process_copilot"],
                    usage=usage if isinstance(usage, dict) else {},
                    content_item_id=item_id,
                )
            except Exception:  # noqa: BLE001
                inv_id = None
        except (AiConfigError, AiProviderError, AiError) as exc:
            # Always answer — never leave the operator with a silent UI.
            # Config/key issues fall back to local process guidance.
            used_fixture = True
            provider, model = "fixture", "process-copilot-fallback"
            fallback_note = (
                f"⚠️ Live AI unavailable ({exc}). "
                "Using local process guidance from this card’s checklist. "
                "Set `XAI_API_KEY` (and restart API) for full Grok co-pilot.\n\n"
            )
            reply = fallback_note + _fixture_reply(snapshot, message)

    assistant_turn = {
        "role": "assistant",
        "content": reply,
        "at": _now_iso(),
        "provider": provider,
        "model": model,
    }
    chat_turns.append(assistant_turn)
    # keep last 80 turns
    chat_turns = chat_turns[-80:]
    try:
        saved = _save_chat(item_id, chat_turns, last_ai_invocation_id=inv_id)
    except Exception as exc:  # noqa: BLE001
        # Still return a reply even if persistence fails (table missing, etc.)
        raise ProcessCopilotError(
            f"co-pilot reply ready but failed to save chat: {exc}"
        ) from exc

    agent_auth.record_event(
        actor,
        "board.process_copilot.chat",
        resource=str(item_id),
        detail={
            "chars": len(reply),
            "fixture": used_fixture,
            "fallback": bool(fallback_note),
        },
    )

    return {
        "content_item_id": item_id,
        "assistant_message": reply,
        "chat": saved["chat"],
        "snapshot_summary": {
            "status": snapshot["card"].get("status"),
            "missing_stages": (snapshot.get("package_checklist") or {}).get(
                "missing_stages"
            ),
            "blueprint_status": snapshot["card"].get("blueprint_status"),
        },
        "ai": {
            "provider": provider,
            "model": model,
            "invocation_id": inv_id,
            "fixture": used_fixture,
            "fallback": bool(fallback_note),
        },
    }


def parse_proposed_artifacts(assistant_message: str) -> list[dict[str, str]]:
    """Extract ```artifact blocks for one-click apply in the UI."""
    out: list[dict[str, str]] = []
    for m in re.finditer(
        r"```artifact\s*\n(.*?)```", assistant_message or "", flags=re.DOTALL | re.I
    ):
        block = m.group(1).strip()
        if "---" in block:
            head, body = block.split("---", 1)
        else:
            head, body = block, ""
        stage, title = "script", "Co-pilot draft"
        for line in head.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                k, v = k.strip().lower(), v.strip()
                if k == "stage":
                    stage = v
                elif k == "title":
                    title = v
        out.append({"stage": stage, "title": title, "body_md": body.strip()})
    return out
