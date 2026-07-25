"""Appearance API — Human Interface Spec v1.0 §10.6."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import appearance
from guards import claims_or_none, require_admin

router = APIRouter(tags=["appearance"])


@router.get("/api/appearance")
def public_appearance(request: Request) -> dict:
    """Published appearance. Admins may request draft via ?appearance=draft."""
    want_draft = (request.query_params.get("appearance") or "").strip() == "draft"
    if want_draft:
        claims = claims_or_none(request)
        if claims and claims.get("role") == "administrator":
            bundle = appearance.get_admin_bundle()
            return {"appearance": bundle["draft"], "source": "draft"}
    return {"appearance": appearance.get_published(), "source": "published"}


@router.get("/api/admin/appearance")
def admin_appearance(request: Request) -> dict:
    require_admin(request)
    return appearance.get_admin_bundle()


@router.put("/api/admin/appearance/draft")
async def put_draft(request: Request) -> dict:
    claims = require_admin(request)
    body = await request.json()
    doc = body.get("appearance", body)
    clean = appearance.save_draft(doc, identity_id=claims.get("identity_id"))
    return {"appearance": clean, "status": "draft_saved"}


@router.post("/api/admin/appearance/publish")
async def publish_appearance(request: Request) -> dict:
    claims = require_admin(request)
    body: dict = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    note = (body or {}).get("note")
    # identity_id 0 = internal/dev admin session (cookie_for fixture / dev-login)
    identity_id = int(claims.get("identity_id") if claims.get("identity_id") is not None else 0)
    clean = appearance.publish(identity_id, note=note)
    return {"appearance": clean, "status": "published"}


@router.post("/api/admin/appearance/discard")
def discard_appearance(request: Request) -> dict:
    require_admin(request)
    clean = appearance.discard_draft()
    return {"appearance": clean, "status": "draft_discarded"}


@router.get("/api/admin/appearance/schema")
def appearance_schema(request: Request) -> dict:
    require_admin(request)
    return appearance.schema_public()
