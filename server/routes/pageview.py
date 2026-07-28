"""Page-view ingest — records authenticated member navigation for engagement
analytics (admin Users section).

Public endpoint, but only records when a valid member session is present; the
response is always 200 and never leaks auth state. Anonymous visitors, the
internal admin identity (0), and /admin routes are ignored.

Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import activity
from guards import claims_or_none

router = APIRouter(tags=["pageview"])


@router.post("/api/pageview")
async def track_pageview(request: Request) -> dict:
    claims = claims_or_none(request)
    if claims:
        try:
            identity_id = int(claims.get("identity_id", 0))
        except (TypeError, ValueError):
            identity_id = 0
        if identity_id != 0:
            try:
                body = await request.json()
            except Exception:  # noqa: BLE001 — tolerate empty/invalid body
                body = {}
            path = body.get("path") if isinstance(body, dict) else None
            activity.record_pageview(identity_id, path)
    return {"ok": True}
