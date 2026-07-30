"""Admin retrospective sequence prompt versions — Spec v0.7.1 §16 / R8.

Prohibitions stay in code (retrospective_agent.GUARDRAIL_BANS) — not editable here.
"""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

import db
from guards import require_admin
from routes.trade_log.common import _storage_identity_id

router = APIRouter(
    prefix="/api/admin/retrospective-prompts",
    tags=["admin-retrospective-prompts"],
)

_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$")


def _raise_422(msg: str) -> None:
    raise HTTPException(status_code=422, detail=msg)


@router.get("")
def list_prompt_versions(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, label, is_active, created_at, created_by,
                          LEFT(body_md, 200) AS body_preview,
                          CHAR_LENGTH(body_md) AS body_len
                   FROM retrospective_prompt_versions
                   ORDER BY is_active DESC, created_at DESC"""
            )
            rows = cur.fetchall() or []
    versions = [
        {
            "id": r["id"],
            "label": r["label"],
            "is_active": bool(r["is_active"]),
            "created_at": (
                r["created_at"].isoformat()
                if hasattr(r.get("created_at"), "isoformat")
                else r.get("created_at")
            ),
            "created_by": r.get("created_by"),
            "body_preview": r.get("body_preview") or "",
            "body_len": int(r["body_len"] or 0),
        }
        for r in rows
    ]
    return {"versions": versions}


@router.get("/{version_id}")
def get_prompt_version(request: Request, version_id: str) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by
                   FROM retrospective_prompt_versions WHERE id = %s""",
                (version_id,),
            )
            r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Prompt version not found")
    return {
        "version": {
            "id": r["id"],
            "label": r["label"],
            "body_md": r.get("body_md") or "",
            "is_active": bool(r["is_active"]),
            "created_at": (
                r["created_at"].isoformat()
                if hasattr(r.get("created_at"), "isoformat")
                else r.get("created_at")
            ),
            "created_by": r.get("created_by"),
        }
    }


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
                "SELECT id FROM retrospective_prompt_versions WHERE id = %s",
                (vid,),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Version id already exists")
            if activate:
                cur.execute(
                    "UPDATE retrospective_prompt_versions SET is_active = 0"
                )
            cur.execute(
                """INSERT INTO retrospective_prompt_versions
                     (id, body_md, label, is_active, created_by)
                   VALUES (%s, %s, %s, %s, %s)""",
                (vid, body_md, label, 1 if activate else 0, iid),
            )
            cur.execute(
                """SELECT id, label, body_md, is_active, created_at, created_by
                   FROM retrospective_prompt_versions WHERE id = %s""",
                (vid,),
            )
            r = cur.fetchone()
    return {
        "version": {
            "id": r["id"],
            "label": r["label"],
            "body_md": r.get("body_md") or "",
            "is_active": bool(r["is_active"]),
            "created_by": r.get("created_by"),
        }
    }


@router.post("/{version_id}/activate")
def activate_prompt_version(request: Request, version_id: str) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM retrospective_prompt_versions WHERE id = %s",
                (version_id,),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Prompt version not found")
            cur.execute("UPDATE retrospective_prompt_versions SET is_active = 0")
            cur.execute(
                """UPDATE retrospective_prompt_versions SET is_active = 1
                   WHERE id = %s""",
                (version_id,),
            )
    return {"ok": True, "active_id": version_id}
