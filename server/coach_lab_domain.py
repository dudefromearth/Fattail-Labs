"""Coach Conversation Lab domain — per-admin transcripts (DL-327)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

import db
from coach_lab_config import (
    CLOSED_MODELS,
    DEFAULT_COLORS,
    EFFORTS,
    xai_api_base,
    xai_api_key,
)

UNAVAILABLE = "unavailable"


class LabError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def first_name_from_display(display_name: str | None) -> str | None:
    raw = (display_name or "").strip()
    if not raw:
        return None
    token = raw.split()[0]
    if not any(c.isalpha() for c in token):
        return None
    return token


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _row_config(row: dict) -> dict:
    return {
        "instruction_text": row["instruction_text"],
        "instruction_version": int(row["instruction_version"]),
        "model": row["model"],
        "effort": row["effort"],
        "voice_enabled": bool(row["voice_enabled"]),
        "coach_bubble_bg": row["coach_bubble_bg"],
        "coach_bubble_text": row["coach_bubble_text"],
        "trader_bubble_bg": row["trader_bubble_bg"],
        "trader_bubble_text": row["trader_bubble_text"],
        "updated_by": row.get("updated_by"),
        "updated_at": _iso(row.get("updated_at")),
        "models": list(CLOSED_MODELS),
        "efforts": list(EFFORTS),
    }


def get_config() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM coach_lab_config WHERE id = 1")
            row = cur.fetchone()
    if not row:
        raise LabError("lab config missing", 500)
    return _row_config(row)


def put_config(identity_id: int, body: dict) -> dict:
    cfg = get_config()
    instruction = body.get("instruction_text")
    model = body.get("model", cfg["model"])
    effort = body.get("effort", cfg["effort"])
    voice_enabled = body.get("voice_enabled", cfg["voice_enabled"])
    colors = {
        "coach_bubble_bg": body.get("coach_bubble_bg", cfg["coach_bubble_bg"]),
        "coach_bubble_text": body.get("coach_bubble_text", cfg["coach_bubble_text"]),
        "trader_bubble_bg": body.get("trader_bubble_bg", cfg["trader_bubble_bg"]),
        "trader_bubble_text": body.get("trader_bubble_text", cfg["trader_bubble_text"]),
    }
    if model not in CLOSED_MODELS:
        raise LabError(f"unknown model {model!r}")
    if effort not in EFFORTS:
        raise LabError(f"unknown effort {effort!r}")
    if voice_enabled and not (
        os_env_voice_configured()
    ):
        raise LabError("voice not configured", 400)

    bump = (
        instruction is not None
        and str(instruction) != cfg["instruction_text"]
    )
    new_text = str(instruction) if instruction is not None else cfg["instruction_text"]
    new_version = cfg["instruction_version"] + 1 if bump else cfg["instruction_version"]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE coach_lab_config SET
                     instruction_text = %s,
                     instruction_version = %s,
                     model = %s,
                     effort = %s,
                     voice_enabled = %s,
                     coach_bubble_bg = %s,
                     coach_bubble_text = %s,
                     trader_bubble_bg = %s,
                     trader_bubble_text = %s,
                     updated_by = %s
                   WHERE id = 1""",
                (
                    new_text,
                    new_version,
                    model,
                    effort,
                    1 if voice_enabled else 0,
                    colors["coach_bubble_bg"],
                    colors["coach_bubble_text"],
                    colors["trader_bubble_bg"],
                    colors["trader_bubble_text"],
                    identity_id,
                ),
            )
    return get_config()


def os_env_voice_configured() -> bool:
    import os

    return any(
        os.environ.get(k, "").strip()
        for k in ("XAI_VOICE_API_KEY", "XAI_VOICE_KEY", "XAI_VOICE_URL")
    )


def display_name_for(identity_id: int) -> str:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT display_name FROM identities WHERE identity_id = %s",
                (identity_id,),
            )
            row = cur.fetchone()
    return (row or {}).get("display_name") or ""


def _serialize_message(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "role": row["role"],
        "body_md": row["body_md"],
        "at": _iso(row["at"]),
        "model": row.get("model"),
        "effort": row.get("effort"),
    }


def _serialize_conversation(row: dict, messages: list[dict] | None = None) -> dict:
    out = {
        "id": int(row["id"]),
        "started_by": int(row["started_by"]),
        "started_at": _iso(row["started_at"]),
        "ended_at": _iso(row.get("ended_at")),
        "instruction_version": int(row["instruction_version"]),
        "model": row["model"],
        "effort": row["effort"],
    }
    if messages is not None:
        out["messages"] = [_serialize_message(m) for m in messages]
    return out


def _load_messages(cur, conversation_id: int) -> list[dict]:
    cur.execute(
        """SELECT id, role, body_md, at, model, effort
           FROM coach_lab_messages
           WHERE conversation_id = %s
           ORDER BY at ASC, id ASC""",
        (conversation_id,),
    )
    return list(cur.fetchall() or [])


def _create_conversation(cur, identity_id: int, cfg: dict) -> dict:
    cur.execute(
        """INSERT INTO coach_lab_conversations
             (started_by, instruction_version, model, effort)
           VALUES (%s, %s, %s, %s)""",
        (identity_id, cfg["instruction_version"], cfg["model"], cfg["effort"]),
    )
    cid = int(cur.lastrowid)
    cur.execute("SELECT * FROM coach_lab_conversations WHERE id = %s", (cid,))
    return cur.fetchone()


def current_conversation(identity_id: int, *, create: bool = True) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE started_by = %s AND ended_at IS NULL
                   ORDER BY started_at DESC, id DESC
                   LIMIT 1""",
                (identity_id,),
            )
            row = cur.fetchone()
            if not row and create:
                cfg = get_config()
                row = _create_conversation(cur, identity_id, cfg)
            if not row:
                return {"conversation": None, "messages": []}
            msgs = _load_messages(cur, int(row["id"]))
    return {"conversation": _serialize_conversation(row, msgs)}


def list_conversations(identity_id: int) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT c.*,
                          (SELECT body_md FROM coach_lab_messages m
                           WHERE m.conversation_id = c.id
                           ORDER BY m.at ASC, m.id ASC LIMIT 1) AS first_line
                   FROM coach_lab_conversations c
                   WHERE c.started_by = %s AND c.ended_at IS NOT NULL
                   ORDER BY c.started_at DESC""",
                (identity_id,),
            )
            rows = list(cur.fetchall() or [])
    out = []
    for r in rows:
        item = _serialize_conversation(r)
        item["first_line"] = (r.get("first_line") or "")[:140]
        out.append(item)
    return out


def get_conversation(identity_id: int, conversation_id: int) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE id = %s AND started_by = %s""",
                (conversation_id, identity_id),
            )
            row = cur.fetchone()
            if not row:
                raise LabError("conversation not found", 404)
            msgs = _load_messages(cur, int(row["id"]))
    return {"conversation": _serialize_conversation(row, msgs)}


def complete_lab(
    *,
    messages: list[dict[str, str]],
    model: str,
    effort: str,
    timeout: float = 60.0,
) -> str:
    """Call xAI. Tests monkeypatch this. Do not change Help/Journal callers."""
    if model not in CLOSED_MODELS:
        raise LabError(f"unknown model {model!r}", 400)
    if effort not in EFFORTS:
        raise LabError(f"unknown effort {effort!r}", 400)
    key = xai_api_key()
    base = xai_api_base()
    if not key or not base:
        raise LabError(UNAVAILABLE, 503)
    url = f"{base}/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "reasoning_effort": effort,
    }
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
            )
    except httpx.HTTPError as exc:
        raise LabError(UNAVAILABLE, 503) from exc
    if resp.status_code >= 400:
        raise LabError(UNAVAILABLE, 503)
    try:
        data = resp.json()
        text = ((data.get("choices") or [{}])[0].get("message") or {}).get(
            "content"
        )
    except ValueError as exc:
        raise LabError(UNAVAILABLE, 503) from exc
    if not isinstance(text, str) or not text.strip():
        raise LabError(UNAVAILABLE, 503)
    return text.strip()


def _history_for_model(instruction: str, msgs: list[dict]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = [{"role": "system", "content": instruction}]
    for m in msgs:
        role = "assistant" if m["role"] == "coach" else "user"
        out.append({"role": role, "content": m["body_md"]})
    return out


def greet(identity_id: int, display_name: str) -> dict:
    """Idempotent arrival greeting. Zero coach turns → one persisted greeting."""
    cfg = get_config()
    first = first_name_from_display(display_name)
    extra = (
        f" The person's first name is {first}. Greet them by that name."
        if first
        else " No first name is available. Greet them without inventing a name."
    )
    instruction = cfg["instruction_text"] + extra

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE started_by = %s AND ended_at IS NULL
                   ORDER BY started_at DESC, id DESC
                   LIMIT 1
                   FOR UPDATE""",
                (identity_id,),
            )
            row = cur.fetchone()
            if not row:
                row = _create_conversation(cur, identity_id, cfg)
            cid = int(row["id"])
            cur.execute(
                """SELECT COUNT(*) AS n FROM coach_lab_messages
                   WHERE conversation_id = %s AND role = 'coach'""",
                (cid,),
            )
            n = int((cur.fetchone() or {}).get("n") or 0)
            if n > 0:
                msgs = _load_messages(cur, cid)
                return {"conversation": _serialize_conversation(row, msgs)}

    try:
        text = complete_lab(
            messages=[{"role": "system", "content": instruction}],
            model=cfg["model"],
            effort=cfg["effort"],
        )
    except LabError:
        return {**current_conversation(identity_id), "unavailable": True}

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE id = %s AND started_by = %s
                   FOR UPDATE""",
                (cid, identity_id),
            )
            row = cur.fetchone()
            if not row:
                raise LabError("conversation not found", 404)
            cur.execute(
                """SELECT COUNT(*) AS n FROM coach_lab_messages
                   WHERE conversation_id = %s AND role = 'coach'""",
                (cid,),
            )
            n = int((cur.fetchone() or {}).get("n") or 0)
            if n == 0:
                cur.execute(
                    """INSERT INTO coach_lab_messages
                         (conversation_id, role, body_md, model, effort)
                       VALUES (%s, 'coach', %s, %s, %s)""",
                    (cid, text, cfg["model"], cfg["effort"]),
                )
            msgs = _load_messages(cur, cid)
    return {"conversation": _serialize_conversation(row, msgs)}


def chat(identity_id: int, text: str) -> dict:
    body = (text or "").strip()
    if not body:
        raise LabError("text is required", 400)
    cfg = get_config()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE started_by = %s AND ended_at IS NULL
                   ORDER BY started_at DESC, id DESC
                   LIMIT 1
                   FOR UPDATE""",
                (identity_id,),
            )
            row = cur.fetchone()
            if not row:
                row = _create_conversation(cur, identity_id, cfg)
            cid = int(row["id"])
            cur.execute(
                """INSERT INTO coach_lab_messages
                     (conversation_id, role, body_md)
                   VALUES (%s, 'trader', %s)""",
                (cid, body),
            )
            prior = _load_messages(cur, cid)
            instruction = cfg["instruction_text"]

    try:
        reply = complete_lab(
            messages=_history_for_model(instruction, prior),
            model=cfg["model"],
            effort=cfg["effort"],
        )
    except LabError:
        return {**current_conversation(identity_id), "unavailable": True}

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO coach_lab_messages
                     (conversation_id, role, body_md, model, effort)
                   VALUES (%s, 'coach', %s, %s, %s)""",
                (cid, reply, cfg["model"], cfg["effort"]),
            )
    return current_conversation(identity_id)


def reset(identity_id: int, display_name: str) -> dict:
    cfg = get_config()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE started_by = %s AND ended_at IS NULL
                   ORDER BY started_at DESC, id DESC
                   LIMIT 1
                   FOR UPDATE""",
                (identity_id,),
            )
            row = cur.fetchone()
            if row:
                cur.execute(
                    """SELECT COUNT(*) AS n FROM coach_lab_messages
                       WHERE conversation_id = %s AND role = 'trader'""",
                    (int(row["id"]),),
                )
                traders = int((cur.fetchone() or {}).get("n") or 0)
                if traders == 0:
                    cur.execute(
                        "DELETE FROM coach_lab_conversations WHERE id = %s",
                        (int(row["id"]),),
                    )
                else:
                    cur.execute(
                        """UPDATE coach_lab_conversations
                           SET ended_at = CURRENT_TIMESTAMP
                           WHERE id = %s""",
                        (int(row["id"]),),
                    )
            _create_conversation(cur, identity_id, cfg)
    return greet(identity_id, display_name)


def export_markdown(identity_id: int, conversation_id: int) -> str:
    data = get_conversation(identity_id, conversation_id)
    conv = data["conversation"]
    lines = [
        f"# Conversation started {conv['started_at']}",
        f"opened-with: model={conv['model']} effort={conv['effort']} "
        f"instruction_version={conv['instruction_version']}",
        "",
    ]
    for m in conv["messages"]:
        stamp = m.get("model") or ""
        effort = m.get("effort") or ""
        meta = f" · {stamp}/{effort}" if stamp else ""
        lines.append(f"**{m['role']}** · {m['at']}{meta}")
        lines.append(m["body_md"])
        lines.append("")
    return "\n".join(lines)


def export_all_json(identity_id: int) -> dict:
    cfg = get_config()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM coach_lab_conversations
                   WHERE started_by = %s
                   ORDER BY started_at ASC""",
                (identity_id,),
            )
            rows = list(cur.fetchall() or [])
            convs = []
            for r in rows:
                msgs = _load_messages(cur, int(r["id"]))
                convs.append(_serialize_conversation(r, msgs))
    return {
        "config_snapshot_keys": ["instruction_version", "model", "effort"],
        "defaults": DEFAULT_COLORS,
        "current_config": {
            "instruction_version": cfg["instruction_version"],
            "model": cfg["model"],
            "effort": cfg["effort"],
        },
        "conversations": convs,
    }
