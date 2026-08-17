"""Landing / traffic ingest — records EVERY visit (anonymous included).

Public endpoint; always 200, never leaks auth state. Captures acquisition data
(referrer + UTM) and a first-party visitor token so the admin Stats page can show
how many people land, where from, and users vs non-users. Best-effort — a failed
write never affects the visitor. Admin paths and bots are dropped in traffic.py.

DISTINCT from /api/pageview (activity.py), which records only authenticated member
in-app navigation for the Users/Flow analytics.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import traffic
from guards import claims_or_none

router = APIRouter(tags=["landing"])


@router.post("/api/landing")
async def track_landing(request: Request) -> dict:
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001 — tolerate empty/invalid body
        body = {}
    if not isinstance(body, dict):
        body = {}

    identity_id = 0
    claims = claims_or_none(request)
    if claims:
        try:
            identity_id = int(claims.get("identity_id", 0))
        except (TypeError, ValueError):
            identity_id = 0

    utm = body.get("utm") if isinstance(body.get("utm"), dict) else {}
    self_host = None
    try:
        self_host = (request.headers.get("host") or "").split(":", 1)[0] or None
    except Exception:  # noqa: BLE001
        self_host = None

    traffic.record_landing(
        visitor_id=body.get("visitor_id"),
        identity_id=identity_id,
        path=body.get("path"),
        is_landing=bool(body.get("is_landing")),
        referrer=body.get("referrer"),
        self_host=self_host,
        utm=utm,
        user_agent=request.headers.get("user-agent"),
    )
    return {"ok": True}
