"""Presence heartbeat — POST /api/presence.

Authenticated members only: records last_seen for the "online now" status on the
admin Users page. Returns {ok, authed} so the client can stop heartbeating for
anonymous visitors (nothing to record). Always 200; never leaks auth state beyond
the boolean the member's own browser already knows.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import presence
from guards import claims_or_none

router = APIRouter(tags=["presence"])


@router.post("/api/presence")
async def heartbeat(request: Request) -> dict:
    claims = claims_or_none(request)
    if not claims:
        return {"ok": True, "authed": False}
    try:
        identity_id = int(claims.get("identity_id", 0))
    except (TypeError, ValueError):
        identity_id = 0
    if identity_id == 0:
        return {"ok": True, "authed": False}
    presence.touch(identity_id)
    return {"ok": True, "authed": True}
