"""Admin notification inbox API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import notify
from guards import require_admin

router = APIRouter(prefix="/api/admin/notifications", tags=["admin-notifications"])


def _identity_id(request: Request) -> int:
    claims = require_admin(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        # dev-login internal admin has no identity row — no inbox rows target id 0
        # Return empty; operators should use real admin identities in staging/prod.
        return 0
    return iid


@router.get("")
def list_notifications(request: Request, unread: int = 0, limit: int = 50) -> dict:
    iid = _identity_id(request)
    if iid == 0:
        return {"notifications": [], "note": "dev internal admin has no identity inbox"}
    items = notify.list_for_identity(iid, unread_only=bool(unread), limit=limit)
    return {"notifications": items}


@router.get("/unread-count")
def unread_count(request: Request) -> dict:
    iid = _identity_id(request)
    if iid == 0:
        return {"count": 0}
    return {"count": notify.unread_count(iid)}


@router.post("/{notification_id}/read")
def read_one(notification_id: int, request: Request) -> dict:
    iid = _identity_id(request)
    if iid == 0:
        return {"ok": True, "updated": False}
    ok = notify.mark_read(iid, notification_id)
    return {"ok": True, "updated": ok}


@router.post("/read-all")
def read_all(request: Request) -> dict:
    iid = _identity_id(request)
    if iid == 0:
        return {"ok": True, "updated": 0}
    n = notify.mark_all_read(iid)
    return {"ok": True, "updated": n}
