"""Course Blueprint — Header + Outline, first validation product.

Skill: skills/course/course-blueprint/SKILL.md
Min bar: course description_md + every module description_md.
Primary UX: AI chat (Grok primary via agent model interface).
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

import agent_auth
import board
import db
import packages
from agent_auth import Actor
from collections.abc import Iterator

from ai.client import complete, complete_stream
from ai.types import AiConfigError, AiError, AiProviderError, CompletionResult

PRODUCT_LINE_COURSE = "course"

STATUS_DRAFT = "draft"
STATUS_PENDING = "pending_validation"
STATUS_APPROVED = "approved"
STATUS_SUPERSEDED = "superseded"

_PROFIT_PATTERNS = re.compile(
    r"\b(guaranteed?\s+profit|make\s+money|get\s+rich|passive\s+income|"
    r"you'?ll\s+make\s+it\s+back|financial\s+freedom\s+guaranteed)\b",
    re.I,
)

_SYSTEM_PROMPT = """You are November (instructional designer), a co-pilot helping build a FatTail Labs Course BLUEPRINT.

You are NOT the course. The structured JSON blueprint is the product and system of record.
Chat messages are working notes only; always return a complete updated header + outline.

The blueprint is ONLY:
1. HEADER — course_title, description_md (required), optional subtitle, level, trailer_intent
2. OUTLINE — modules[] each with title, description_md (required), and lessons[] stubs (title, optional outcomes)

Rules:
- Process outcomes only. NEVER profit claims, income promises, or "make it back" language.
- Capacity over dependency. Stop-the-bleeding / capital preservation first when relevant.
- Module descriptions are mandatory — not title-only modules.
- Lesson stubs need titles; full video/markdown come later — do not invent video ids.
- Prefer 2–6 modules for a full course unless the user asks otherwise.
- If intent is thin, ask a clarifying question in "assistant_message" AND still propose a best-effort blueprint.
- Keep assistant_message short; put curriculum substance in header/outline fields.

Respond with a single JSON object only (no markdown fences), shape:
{
  "assistant_message": "plain language reply to the operator",
  "header": {
    "course_title": "string",
    "subtitle": "string or null",
    "description_md": "markdown description — required when proposing a full draft",
    "level": "beginner|intermediate|advanced|null",
    "trailer_intent": "string or null"
  },
  "outline": {
    "modules": [
      {
        "title": "string",
        "description_md": "string — required",
        "lessons": [
          { "title": "string", "outcomes": ["optional"] }
        ]
      }
    ]
  }
}
"""


class BlueprintError(Exception):
    pass


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _ts(val: Any) -> str | None:
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat(sep=" ")
    return str(val)


def _json_loads(val: Any, default: Any) -> Any:
    if val is None:
        return default
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, (bytes, bytearray)):
        val = val.decode("utf-8")
    if isinstance(val, str):
        if not val.strip():
            return default
        return json.loads(val)
    return default


def empty_header(title: str = "") -> dict[str, Any]:
    return {
        "course_title": title or "",
        "subtitle": None,
        "description_md": "",
        "level": None,
        "trailer_intent": None,
    }


def empty_outline() -> dict[str, Any]:
    return {"modules": []}


def validate_blueprint(
    header: dict[str, Any] | None,
    outline: dict[str, Any] | None,
) -> dict[str, Any]:
    """Machine min bar: header description + module descriptions + structure."""
    errors: list[str] = []
    header = header or {}
    outline = outline or {}

    title = (header.get("course_title") or "").strip()
    if not title:
        errors.append("header.course_title is required")

    desc = (header.get("description_md") or "").strip()
    if not desc:
        errors.append("header.description_md is required (minimum validation bar)")
    elif _PROFIT_PATTERNS.search(desc):
        errors.append(
            "header.description_md fails doctrine lint (profit-claim language)"
        )

    modules = outline.get("modules")
    if not isinstance(modules, list) or len(modules) < 1:
        errors.append("outline.modules must contain at least one module")
        modules = []

    for i, mod in enumerate(modules):
        if not isinstance(mod, dict):
            errors.append(f"outline.modules[{i}] must be an object")
            continue
        if not (mod.get("title") or "").strip():
            errors.append(f"outline.modules[{i}].title is required")
        mdesc = (mod.get("description_md") or "").strip()
        if not mdesc:
            errors.append(
                f"outline.modules[{i}].description_md is required "
                "(minimum validation bar)"
            )
        elif _PROFIT_PATTERNS.search(mdesc):
            errors.append(
                f"outline.modules[{i}].description_md fails doctrine lint "
                "(profit-claim language)"
            )
        lessons = mod.get("lessons")
        if not isinstance(lessons, list) or len(lessons) < 1:
            errors.append(
                f"outline.modules[{i}].lessons must contain at least one lesson stub"
            )
            continue
        for j, les in enumerate(lessons):
            if not isinstance(les, dict):
                errors.append(f"outline.modules[{i}].lessons[{j}] must be an object")
                continue
            if not (les.get("title") or "").strip():
                errors.append(
                    f"outline.modules[{i}].lessons[{j}].title is required"
                )

    ok = len(errors) == 0
    min_desc = bool(desc) and all(
        isinstance(m, dict) and (m.get("description_md") or "").strip()
        for m in modules
    )
    return {
        "ok": ok,
        "min_descriptions_ok": bool(min_desc and ok),
        "errors": errors,
    }


def _require_course_item(item_id: int) -> dict:
    item = board.get_item(item_id)
    pl = (item.get("product_line") or "").strip()
    if pl != PRODUCT_LINE_COURSE:
        raise BlueprintError(
            f"blueprint is only for product_line=course, got {pl!r}"
        )
    return item


def _row_to_public(row: dict) -> dict:
    header = _json_loads(row.get("header_json"), {})
    outline = _json_loads(row.get("outline_json"), {"modules": []})
    chat = _json_loads(row.get("chat_json"), [])
    validation = _json_loads(row.get("validation_json"), None)
    if validation is None:
        validation = validate_blueprint(header, outline)
    return {
        "id": int(row["id"]),
        "content_item_id": int(row["content_item_id"]),
        "version": int(row["version"]),
        "status": row["status"],
        "header": header,
        "outline": outline,
        "chat": chat,
        "validation": validation,
        "last_ai_invocation_id": row.get("last_ai_invocation_id"),
        "approved_at": _ts(row.get("approved_at")),
        "approved_actor_kind": row.get("approved_actor_kind"),
        "approved_actor_id": row.get("approved_actor_id"),
        "approved_actor_label": row.get("approved_actor_label"),
        "created_at": _ts(row.get("created_at")),
        "updated_at": _ts(row.get("updated_at")),
    }


def get_blueprint(item_id: int) -> dict | None:
    """Latest blueprint for item, or None. Validates product_line=course."""
    _require_course_item(item_id)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM content_blueprints
                   WHERE content_item_id = %s
                   ORDER BY version DESC LIMIT 1""",
                (item_id,),
            )
            row = cur.fetchone()
    if not row:
        return None
    return _row_to_public(row)


def save_blueprint(
    item_id: int,
    actor: Actor,
    *,
    header: dict[str, Any] | None = None,
    outline: dict[str, Any] | None = None,
    chat: list | None = None,
    force_new_version: bool = False,
    last_ai_invocation_id: int | None = None,
) -> dict:
    """Create or update working blueprint; bump version if current is approved."""
    item = _require_course_item(item_id)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM content_blueprints
                   WHERE content_item_id = %s
                   ORDER BY version DESC LIMIT 1
                   FOR UPDATE""",
                (item_id,),
            )
            existing = cur.fetchone()

            if existing:
                prev_header = _json_loads(existing["header_json"], {})
                prev_outline = _json_loads(existing["outline_json"], {"modules": []})
                prev_chat = _json_loads(existing["chat_json"], [])
            else:
                prev_header = empty_header(item.get("title") or "")
                prev_outline = empty_outline()
                prev_chat = []

            hdr = dict(header) if header is not None else dict(prev_header)
            outl = dict(outline) if outline is not None else dict(prev_outline)
            cht = list(chat) if chat is not None else list(prev_chat)
            if not (hdr.get("course_title") or "").strip():
                hdr["course_title"] = item.get("title") or ""

            validation = validate_blueprint(hdr, outl)
            new_status = STATUS_PENDING if validation["ok"] else STATUS_DRAFT

            if existing is None:
                cur.execute(
                    """INSERT INTO content_blueprints
                       (content_item_id, version, status, header_json, outline_json,
                        chat_json, validation_json, last_ai_invocation_id)
                       VALUES (%s,1,%s,%s,%s,%s,%s,%s)""",
                    (
                        item_id,
                        new_status,
                        json.dumps(hdr),
                        json.dumps(outl),
                        json.dumps(cht),
                        json.dumps(validation),
                        last_ai_invocation_id,
                    ),
                )
                new_id = int(cur.lastrowid)
            elif existing["status"] == STATUS_APPROVED or force_new_version:
                if existing["status"] == STATUS_APPROVED:
                    cur.execute(
                        """UPDATE content_blueprints SET status = %s WHERE id = %s""",
                        (STATUS_SUPERSEDED, existing["id"]),
                    )
                new_version = int(existing["version"]) + 1
                cur.execute(
                    """INSERT INTO content_blueprints
                       (content_item_id, version, status, header_json, outline_json,
                        chat_json, validation_json, last_ai_invocation_id)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        item_id,
                        new_version,
                        new_status,
                        json.dumps(hdr),
                        json.dumps(outl),
                        json.dumps(cht),
                        json.dumps(validation),
                        last_ai_invocation_id,
                    ),
                )
                new_id = int(cur.lastrowid)
            else:
                inv = (
                    last_ai_invocation_id
                    if last_ai_invocation_id is not None
                    else existing.get("last_ai_invocation_id")
                )
                cur.execute(
                    """UPDATE content_blueprints
                       SET header_json = %s, outline_json = %s, chat_json = %s,
                           validation_json = %s, status = %s,
                           last_ai_invocation_id = %s
                       WHERE id = %s""",
                    (
                        json.dumps(hdr),
                        json.dumps(outl),
                        json.dumps(cht),
                        json.dumps(validation),
                        new_status,
                        inv,
                        existing["id"],
                    ),
                )
                new_id = int(existing["id"])

            cur.execute(
                """UPDATE content_items
                   SET blueprint_id = %s, blueprint_status = %s
                   WHERE id = %s""",
                (new_id, new_status, item_id),
            )

    result = get_blueprint(item_id)
    if not result:
        raise BlueprintError("failed to save blueprint")
    return result


def ensure_blueprint(item_id: int, actor: Actor) -> dict:
    existing = get_blueprint(item_id)
    if existing:
        return existing
    return save_blueprint(item_id, actor)


def validate_item_blueprint(item_id: int) -> dict:
    bp = get_blueprint(item_id)
    if not bp:
        item = _require_course_item(item_id)
        validation = validate_blueprint(
            empty_header(item.get("title") or ""), empty_outline()
        )
        return {
            "content_item_id": item_id,
            "blueprint": None,
            "validation": validation,
        }
    validation = validate_blueprint(bp["header"], bp["outline"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if bp["status"] != STATUS_APPROVED:
                status = STATUS_PENDING if validation["ok"] else STATUS_DRAFT
                cur.execute(
                    """UPDATE content_blueprints
                       SET validation_json = %s, status = %s
                       WHERE id = %s""",
                    (json.dumps(validation), status, bp["id"]),
                )
                cur.execute(
                    """UPDATE content_items SET blueprint_status = %s
                       WHERE id = %s AND blueprint_id = %s""",
                    (status, item_id, bp["id"]),
                )
    bp = get_blueprint(item_id)
    return {
        "content_item_id": item_id,
        "blueprint": bp,
        "validation": validation
        if bp is None
        else (bp.get("validation") or validation),
    }


def approve_blueprint(item_id: int, actor: Actor) -> dict:
    if actor.kind != "human" or actor.role != "administrator":
        raise BlueprintError("only human administrators may approve a blueprint")
    bp = get_blueprint(item_id)
    if not bp:
        raise BlueprintError("no blueprint to approve; chat or PUT a draft first")
    if bp["status"] == STATUS_APPROVED:
        return bp
    validation = validate_blueprint(bp["header"], bp["outline"])
    if not validation["ok"]:
        raise BlueprintError(
            "blueprint fails minimum validation: " + "; ".join(validation["errors"])
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE content_blueprints
                   SET status = %s, validation_json = %s,
                       approved_at = CURRENT_TIMESTAMP,
                       approved_actor_kind = %s,
                       approved_actor_id = %s,
                       approved_actor_label = %s
                   WHERE id = %s""",
                (
                    STATUS_APPROVED,
                    json.dumps(validation),
                    actor.kind,
                    actor.id,
                    actor.label,
                    bp["id"],
                ),
            )
            cur.execute(
                """UPDATE content_items
                   SET blueprint_status = %s, blueprint_id = %s
                   WHERE id = %s""",
                (STATUS_APPROVED, bp["id"], item_id),
            )

    plan_body = {
        "blueprint_id": bp["id"],
        "blueprint_version": bp["version"],
        "blueprint_status": STATUS_APPROVED,
        "course_title": bp["header"].get("course_title"),
        "subtitle": bp["header"].get("subtitle"),
        "level": bp["header"].get("level"),
        "description_md": bp["header"].get("description_md"),
        "modules": bp["outline"].get("modules") or [],
    }
    board.add_artifact(
        item_id,
        actor,
        stage="lesson_plan",
        title=f"Course blueprint v{bp['version']} (approved)",
        body_md="```json\n" + json.dumps(plan_body, indent=2) + "\n```",
    )
    agent_auth.record_event(
        actor,
        "board.blueprint.approve",
        resource=str(item_id),
        detail={"blueprint_id": bp["id"], "version": bp["version"]},
    )
    out = get_blueprint(item_id)
    if not out:
        raise BlueprintError("approve failed")
    return out


def _extract_json_object(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if not text:
        raise BlueprintError("empty model response")
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            data = json.loads(text[start : end + 1])
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError as exc:
            raise BlueprintError(f"model response is not valid JSON: {exc}") from exc
    raise BlueprintError("model response is not valid JSON")


def _fixture_chat_response(
    item: dict, user_message: str, prev: dict | None
) -> dict[str, Any]:
    title = (item.get("title") or "Untitled Course").strip()
    intent = (item.get("intent_md") or "").strip()
    desc = (
        f"This course helps traders with: {intent[:240] or 'process discipline'}.\n\n"
        "**By the end you will be able to** apply a clear capital-preservation process "
        "and decision quality habits — process outcomes only, no profit claims.\n\n"
        f"(Fixture draft for operator note: {user_message[:120]})"
    )
    header: dict[str, Any] = {
        "course_title": title,
        "subtitle": "Process-first curriculum",
        "description_md": desc,
        "level": "beginner",
        "trailer_intent": "30s: who it is for + one process outcome",
    }
    outline: dict[str, Any] = {
        "modules": [
            {
                "title": "Foundation",
                "description_md": (
                    "Why capital preservation and process come before optimization. "
                    "Sets the frame for the rest of the course."
                ),
                "lessons": [
                    {
                        "title": "The stop-the-bleeding mindset",
                        "outcomes": ["State the process-first priority"],
                    },
                    {
                        "title": "Defining risk before reward",
                        "outcomes": ["Define risk rules in plain language"],
                    },
                ],
            },
            {
                "title": "Practice",
                "description_md": (
                    "Hands-on application: checklists, journaling, and decision reviews "
                    "without profit theater."
                ),
                "lessons": [
                    {
                        "title": "Building your process checklist",
                        "outcomes": ["Draft a personal process checklist"],
                    },
                    {
                        "title": "Review loop",
                        "outcomes": ["Run a weekly process review"],
                    },
                ],
            },
        ]
    }
    if prev and (prev.get("header") or {}).get("description_md"):
        header = {**prev["header"], "course_title": title}
        if "shorter" in user_message.lower() and header.get("description_md"):
            header["description_md"] = (header["description_md"] or "")[:280] + "…"
    if prev and (prev.get("outline") or {}).get("modules"):
        outline = prev["outline"]
    return {
        "assistant_message": (
            "Here is a Course Blueprint draft (fixture mode). "
            "Header and module descriptions are filled so you can validate. "
            "Say what to change and we will revise."
        ),
        "header": header,
        "outline": outline,
    }


def _build_chat_messages(
    item: dict,
    message: str,
    prev: dict | None,
    prev_header: dict,
    prev_outline: dict,
    prev_chat: list,
) -> list[dict[str, str]]:
    context = {
        "card_title": item.get("title"),
        "intent_md": item.get("intent_md"),
        "inputs_md": item.get("inputs_md"),
        "acceptance_md": item.get("acceptance_md"),
        "current_header": prev_header,
        "current_outline": prev_outline,
    }
    messages: list[dict[str, str]] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
    ]
    for turn in prev_chat[-8:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": str(role), "content": str(content)})
    messages.append(
        {
            "role": "user",
            "content": (
                "Card context (JSON):\n"
                + json.dumps(context, indent=2)
                + "\n\nOperator message:\n"
                + message
            ),
        }
    )
    return messages


def _finalize_chat_turn(
    item_id: int,
    actor: Actor,
    *,
    item: dict,
    message: str,
    prev: dict | None,
    prev_header: dict,
    prev_outline: dict,
    prev_chat: list,
    user_entry: dict,
    parsed: dict,
    assistant_text: str,
    parse_error: bool,
    provider: str,
    model: str,
    usage: dict[str, int],
    inv_id: int | None,
    use_fixtures: bool,
    streamed: bool = False,
) -> dict:
    header = (
        parsed.get("header")
        if isinstance(parsed.get("header"), dict)
        else prev_header
    )
    outline = (
        parsed.get("outline")
        if isinstance(parsed.get("outline"), dict)
        else prev_outline
    )
    if not (header.get("course_title") or "").strip():
        header = {**header, "course_title": item.get("title") or ""}

    assistant_entry: dict[str, Any] = {
        "role": "assistant",
        "content": assistant_text,
        "at": _utcnow_iso(),
        "provider": provider,
        "model": model,
    }
    if parse_error:
        assistant_entry["parse_error"] = True
    if streamed:
        assistant_entry["streamed"] = True

    new_chat = prev_chat + [user_entry, assistant_entry]

    if parse_error:
        bp = save_blueprint(
            item_id,
            actor,
            chat=new_chat,
            last_ai_invocation_id=inv_id,
        )
    else:
        bp = save_blueprint(
            item_id,
            actor,
            header=header,
            outline=outline,
            chat=new_chat,
            last_ai_invocation_id=inv_id,
        )

    agent_auth.record_event(
        actor,
        "board.blueprint.chat",
        resource=str(item_id),
        detail={
            "blueprint_id": bp["id"],
            "fixture": use_fixtures,
            "provider": provider,
            "streamed": streamed,
            "validation_ok": bp.get("validation", {}).get("ok"),
            "parse_error": parse_error,
        },
    )

    return {
        "blueprint": bp,
        "assistant_message": assistant_text,
        "parse_error": parse_error,
        "ai": {
            "provider": provider,
            "model": model,
            "usage": usage,
            "invocation_id": inv_id,
            "fixture": use_fixtures,
            "streamed": streamed,
        },
    }


def chat_blueprint(
    item_id: int,
    actor: Actor,
    *,
    message: str,
    use_fixtures: bool = False,
    prefer: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> dict:
    """Append user message, run AI (or fixture), update blueprint."""
    message = (message or "").strip()
    if not message:
        raise BlueprintError("message is required")

    item = _require_course_item(item_id)
    prev = get_blueprint(item_id)
    prev_header = (prev or {}).get("header") or empty_header(item.get("title") or "")
    prev_outline = (prev or {}).get("outline") or empty_outline()
    prev_chat = list((prev or {}).get("chat") or [])

    user_entry = {
        "role": "user",
        "content": message,
        "at": _utcnow_iso(),
        "actor_label": actor.label,
    }

    inv_id: int | None = None
    provider = "fixture"
    model = "fixture"
    usage: dict[str, int] = {}
    parse_error = False

    if use_fixtures:
        parsed = _fixture_chat_response(item, message, prev)
        assistant_text = parsed.get("assistant_message") or "Blueprint updated."
    else:
        messages = _build_chat_messages(
            item, message, prev, prev_header, prev_outline, prev_chat
        )
        try:
            result: CompletionResult = complete(
                messages,
                agent="november",
                prefer=prefer,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except AiConfigError as exc:
            raise BlueprintError(f"AI not configured: {exc}") from exc
        except AiProviderError as exc:
            raise BlueprintError(f"AI provider error: {exc}") from exc
        except AiError as exc:
            raise BlueprintError(str(exc)) from exc

        provider = result.provider
        model = result.model
        usage = dict(result.usage or {})
        inv_id = packages.record_ai_invocation(
            actor,
            callsign="november",
            task_id="course_blueprint_chat",
            provider=provider,
            model=model,
            prefer=prefer,
            markers=["blueprint"],
            usage=usage,
            status="success",
            content_item_id=item_id,
        )
        try:
            parsed = _extract_json_object(result.text)
            assistant_text = (
                parsed.get("assistant_message")
                or parsed.get("message")
                or "Updated the blueprint draft."
            )
        except BlueprintError:
            parse_error = True
            assistant_text = result.text[:4000]
            parsed = {
                "header": prev_header,
                "outline": prev_outline,
                "assistant_message": assistant_text,
            }

    return _finalize_chat_turn(
        item_id,
        actor,
        item=item,
        message=message,
        prev=prev,
        prev_header=prev_header,
        prev_outline=prev_outline,
        prev_chat=prev_chat,
        user_entry=user_entry,
        parsed=parsed,
        assistant_text=assistant_text,
        parse_error=parse_error,
        provider=provider,
        model=model,
        usage=usage,
        inv_id=inv_id,
        use_fixtures=use_fixtures,
        streamed=False,
    )


def chat_blueprint_stream(
    item_id: int,
    actor: Actor,
    *,
    message: str,
    use_fixtures: bool = False,
    prefer: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> Iterator[dict[str, Any]]:
    """Yield SSE-friendly event dicts for streaming blueprint chat.

    Events:
      {type: "meta", ...}
      {type: "user", message}
      {type: "delta", text}          # token/chunk
      {type: "done", ...full result} # same shape as chat_blueprint return
      {type: "error", detail}
    """
    message = (message or "").strip()
    if not message:
        yield {"type": "error", "detail": "message is required"}
        return

    try:
        item = _require_course_item(item_id)
    except BlueprintError as exc:
        yield {"type": "error", "detail": str(exc)}
        return

    prev = get_blueprint(item_id)
    prev_header = (prev or {}).get("header") or empty_header(item.get("title") or "")
    prev_outline = (prev or {}).get("outline") or empty_outline()
    prev_chat = list((prev or {}).get("chat") or [])
    user_entry = {
        "role": "user",
        "content": message,
        "at": _utcnow_iso(),
        "actor_label": actor.label,
    }

    yield {
        "type": "meta",
        "content_item_id": item_id,
        "fixture": use_fixtures,
    }
    yield {"type": "user", "message": message, "at": user_entry["at"]}

    if use_fixtures:
        parsed = _fixture_chat_response(item, message, prev)
        assistant_text = parsed.get("assistant_message") or "Blueprint updated."
        # Fake stream for fixture UX
        step = max(12, len(assistant_text) // 24)
        for i in range(0, len(assistant_text), step):
            yield {"type": "delta", "text": assistant_text[i : i + step]}
        result = _finalize_chat_turn(
            item_id,
            actor,
            item=item,
            message=message,
            prev=prev,
            prev_header=prev_header,
            prev_outline=prev_outline,
            prev_chat=prev_chat,
            user_entry=user_entry,
            parsed=parsed,
            assistant_text=assistant_text,
            parse_error=False,
            provider="fixture",
            model="fixture",
            usage={},
            inv_id=None,
            use_fixtures=True,
            streamed=True,
        )
        yield {"type": "done", **result}
        return

    messages = _build_chat_messages(
        item, message, prev, prev_header, prev_outline, prev_chat
    )
    inv_id: int | None = None
    provider = "xai"
    model = ""
    usage: dict[str, int] = {}
    raw_parts: list[str] = []

    try:
        stream = complete_stream(
            messages,
            agent="november",
            prefer=prefer or "primary",
            temperature=temperature,
            max_tokens=max_tokens,
        )
        final: CompletionResult | None = None
        for chunk in stream:
            if isinstance(chunk, str):
                raw_parts.append(chunk)
                yield {"type": "delta", "text": chunk}
            else:
                final = chunk
        if final is None:
            # Should not happen if provider contract holds
            text = "".join(raw_parts).strip()
            if not text:
                yield {"type": "error", "detail": "empty stream"}
                return
            final = CompletionResult(
                text=text, provider="xai", model="unknown", usage={}
            )
        provider = final.provider
        model = final.model
        usage = dict(final.usage or {})
        inv_id = packages.record_ai_invocation(
            actor,
            callsign="november",
            task_id="course_blueprint_chat_stream",
            provider=provider,
            model=model,
            prefer=prefer or "primary",
            markers=["blueprint", "stream"],
            usage=usage,
            status="success",
            content_item_id=item_id,
        )
        parse_error = False
        try:
            parsed = _extract_json_object(final.text)
            assistant_text = (
                parsed.get("assistant_message")
                or parsed.get("message")
                or "Updated the blueprint draft."
            )
        except BlueprintError:
            parse_error = True
            assistant_text = final.text[:4000]
            parsed = {
                "header": prev_header,
                "outline": prev_outline,
                "assistant_message": assistant_text,
            }
        result = _finalize_chat_turn(
            item_id,
            actor,
            item=item,
            message=message,
            prev=prev,
            prev_header=prev_header,
            prev_outline=prev_outline,
            prev_chat=prev_chat,
            user_entry=user_entry,
            parsed=parsed,
            assistant_text=assistant_text,
            parse_error=parse_error,
            provider=provider,
            model=model,
            usage=usage,
            inv_id=inv_id,
            use_fixtures=False,
            streamed=True,
        )
        yield {"type": "done", **result}
    except AiConfigError as exc:
        yield {"type": "error", "detail": f"AI not configured: {exc}"}
    except AiProviderError as exc:
        yield {"type": "error", "detail": f"AI provider error: {exc}"}
    except AiError as exc:
        yield {"type": "error", "detail": str(exc)}
    except BlueprintError as exc:
        yield {"type": "error", "detail": str(exc)}
    except Exception as exc:  # noqa: BLE001 — surface stream failures
        yield {"type": "error", "detail": f"stream failed: {exc}"}
