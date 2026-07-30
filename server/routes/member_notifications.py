"""Member notification inbox API (Spec v0.7.1 §14 · R7).

In-app only for Family B material. Channel policy is returned with evaluate.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

import db
import member_notify as mn
import retrospective_notify as rn
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["member-notifications"])


@router.get("/api/me/notifications")
def list_notifications(
    request: Request,
    unread_only: bool = Query(False),
    kind: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            items = mn.list_for_identity(
                cur,
                iid,
                unread_only=unread_only,
                kind=kind,
                limit=limit,
            )
            n_unread = mn.unread_count(cur, iid)
    return {
        "notifications": items,
        "unread_count": n_unread,
        "channel_policy": mn.channel_policy(),
    }


@router.post("/api/me/notifications/{notification_id}/read")
def read_notification(request: Request, notification_id: int) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            ok = mn.mark_read(cur, iid, notification_id)
    if not ok:
        # Idempotent — already read or not found
        return {"ok": True, "already": True}
    return {"ok": True}


@router.post("/api/me/retrospectives/notify-eval")
def evaluate_retro_notification(request: Request) -> dict:
    """Evaluate material readiness and create at most one in-app notification.

    Idempotent: once per period. Suppresses during RTH. Open-position check
    fails soft (never leaks position detail).
    """
    claims = require_session(request)
    role = str(claims.get("role") or "observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            result = rn.evaluate_and_maybe_notify(
                cur, iid, role=role
            )
    return result


@router.get("/api/me/retrospectives/channel-policy")
def retro_channel_policy(request: Request) -> dict:
    """Mike channel policy lock — in-app first; no Family B email yet."""
    require_session(request)
    return {"channel_policy": mn.channel_policy()}
