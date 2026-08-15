"""Admin journal session prompt versions — Spec v0.6 §8.3 / J3 · DL-340."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

import db
import journal_session_agent as jsa
import journal_session_domain as jsd
from guards import require_admin
from routes.trade_log.common import _storage_identity_id

router = APIRouter(prefix="/api/admin/journal-prompts", tags=["admin-journal-prompts"])

_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$")
_STUB_PREFIX = "See server/journal_session_agent.py"


def _raise_422(msg: str) -> None:
    raise HTTPException(status_code=422, detail=msg)


def _effective_body(body_md: str | None) -> str:
    raw = (body_md or "").strip()
    if not raw or raw.startswith(_STUB_PREFIX) or len(raw) < 40:
        return jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1
    return raw


def _serialize_version(r: dict, *, full: bool = False) -> dict:
    out = {
        "id": r["id"],
        "label": r["label"],
        "is_active": bool(r["is_active"]),
        "reasoning_level": jsd.normalize_reasoning_level(r.get("reasoning_level")),
        "created_at": (
            r["created_at"].isoformat()
            if hasattr(r.get("created_at"), "isoformat")
            else r.get("created_at")
        ),
        "created_by": r.get("created_by"),
    }
    if full:
        out["body_md"] = _effective_body(r.get("body_md"))
    else:
        preview = r.get("body_preview")
        if preview is None:
            preview = (r.get("body_md") or "")[:200]
        out["body_preview"] = preview
        out["body_len"] = int(r.get("body_len") or len(r.get("body_md") or ""))
    return out


@router.get("")
def list_prompt_versions(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, label, is_active, created_at, created_by,
                          reasoning_level,
                          LEFT(body_md, 200) AS body_preview,
                          CHAR_LENGTH(body_md) AS body_len
                   FROM journal_session_prompt_versions
                   ORDER BY is_active DESC, created_at DESC"""
            )
            rows = cur.fetchall() or []
    return {"versions": [_serialize_version(r) for r in rows]}


@router.get("/active")
def get_active_prompt(request: Request) -> dict:
    """Effective instructions + reasoning for the Journal overlay."""
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            vid = jsd.active_prompt_version_id(cur)
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by,
                          reasoning_level
                   FROM journal_session_prompt_versions WHERE id = %s""",
                (vid,),
            )
            r = cur.fetchone()
    if not r:
        return {
            "version": {
                "id": "JOURNAL_SESSION_SYSTEM_PROMPT_V1",
                "label": "System prompt v1",
                "is_active": True,
                "reasoning_level": jsd.DEFAULT_REASONING_LEVEL,
                "body_md": jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1,
                "created_at": None,
                "created_by": None,
            }
        }
    return {"version": _serialize_version(r, full=True)}


@router.get("/{version_id}")
def get_prompt_version(request: Request, version_id: str) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by,
                          reasoning_level
                   FROM journal_session_prompt_versions WHERE id = %s""",
                (version_id,),
            )
            r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Prompt version not found")
    return {"version": _serialize_version(r, full=True)}


@router.post("")
async def create_prompt_version(request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    vid = str(body.get("id") or "").strip()
    label = str(body.get("label") or "").strip()
    body_md = str(body.get("body_md") or "").strip()
    activate = bool(body.get("activate", False))
    reasoning = jsd.normalize_reasoning_level(body.get("reasoning_level"))
    if body.get("reasoning_level") not in (None, "") and reasoning != str(
        body.get("reasoning_level") or ""
    ).strip().lower():
        if str(body.get("reasoning_level")).strip().lower() not in jsd.REASONING_LEVELS:
            _raise_422("reasoning_level must be low|medium|high")
    if not _ID_RE.match(vid):
        _raise_422("id must be 3–64 chars [A-Za-z0-9._-]")
    if not label:
        _raise_422("label required")
    if len(body_md) < 40:
        _raise_422("body_md too short")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                "SELECT id FROM journal_session_prompt_versions WHERE id = %s",
                (vid,),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Version id already exists")
            if activate:
                cur.execute(
                    "UPDATE journal_session_prompt_versions SET is_active = 0"
                )
            cur.execute(
                """INSERT INTO journal_session_prompt_versions
                     (id, body_md, label, is_active, created_by, reasoning_level)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (vid, body_md, label, 1 if activate else 0, iid, reasoning),
            )
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by,
                          reasoning_level
                   FROM journal_session_prompt_versions WHERE id = %s""",
                (vid,),
            )
            r = cur.fetchone()
    return {"version": _serialize_version(r, full=True)}


@router.patch("/{version_id}")
async def patch_prompt_version(request: Request, version_id: str) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    sets: list[str] = []
    args: list = []
    if "body_md" in body:
        body_md = str(body.get("body_md") or "").strip()
        if len(body_md) < 40:
            _raise_422("body_md too short")
        sets.append("body_md = %s")
        args.append(body_md)
    if "reasoning_level" in body:
        raw = str(body.get("reasoning_level") or "").strip().lower()
        if raw not in jsd.REASONING_LEVELS:
            _raise_422("reasoning_level must be low|medium|high")
        sets.append("reasoning_level = %s")
        args.append(raw)
    if "label" in body:
        label = str(body.get("label") or "").strip()
        if not label:
            _raise_422("label required")
        sets.append("label = %s")
        args.append(label)
    if not sets:
        _raise_422("nothing to update")
    args.append(version_id)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM journal_session_prompt_versions WHERE id = %s",
                (version_id,),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Prompt version not found")
            cur.execute(
                f"UPDATE journal_session_prompt_versions SET {', '.join(sets)} WHERE id = %s",
                args,
            )
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by,
                          reasoning_level
                   FROM journal_session_prompt_versions WHERE id = %s""",
                (version_id,),
            )
            r = cur.fetchone()
    return {"version": _serialize_version(r, full=True)}


@router.post("/{version_id}/activate")
def activate_prompt_version(request: Request, version_id: str) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM journal_session_prompt_versions WHERE id = %s",
                (version_id,),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Prompt version not found")
            cur.execute("UPDATE journal_session_prompt_versions SET is_active = 0")
            cur.execute(
                """UPDATE journal_session_prompt_versions SET is_active = 1
                   WHERE id = %s""",
                (version_id,),
            )
    return {"ok": True, "active_id": version_id}
