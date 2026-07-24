"""Admin cast registry API (Phase G1).

Read-only list/get over docs/studio/cast/AVATAR-*.md.
Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0.md
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import cast as cast_mod
from guards import require_human_admin_actor

router = APIRouter(prefix="/api/admin/cast", tags=["admin-cast"])


@router.get("")
def list_cast(request: Request) -> dict:
    require_human_admin_actor(request)
    members = cast_mod.list_cast()
    return {"cast": members, "count": len(members)}


@router.get("/{cast_id}")
def get_cast(cast_id: str, request: Request) -> dict:
    require_human_admin_actor(request)
    try:
        member = cast_mod.get_cast(cast_id)
    except cast_mod.CastError as exc:
        msg = str(exc)
        code = 404 if "unknown cast" in msg.lower() else 422
        raise HTTPException(status_code=code, detail=msg) from exc
    return {"cast": member}
