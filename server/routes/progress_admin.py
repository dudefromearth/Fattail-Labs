"""Admin Progress — live growth telemetry across WooCommerce, YouTube and AC.

Read-only except for the model parameters, which admins tune so the projection
tracks reality without a deploy. Administrator session required on every route.

Spec: Specs/FatTail-Labs-Progress-Admin-Spec-v1.0.md · DL-530
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from guards import require_admin
from progress import refresh as refresh_mod
from progress import report as report_mod

log = logging.getLogger("labs.routes.progress")

router = APIRouter(prefix="/api/admin/progress", tags=["admin-progress"])


@router.get("")
def get_progress(request: Request) -> dict:
    require_admin(request)
    return report_mod.build()


@router.get("/params")
def get_params(request: Request) -> dict:
    require_admin(request)
    return {"params": report_mod.load_params()}


@router.put("/params/{key}")
async def put_param(key: str, request: Request) -> dict:
    actor = require_admin(request)
    body = await request.json()
    if "value" not in body:
        raise HTTPException(status_code=400, detail="value is required")
    try:
        value = float(body["value"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="value must be a number") from None
    try:
        updated = report_mod.set_param(key, value, actor.get("email"))
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown parameter {key}") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
    log.info("progress param %s set to %s by %s", key, value, actor.get("email"))
    return {"param": updated}


@router.post("/refresh")
def post_refresh(request: Request, source: str | None = None) -> dict:
    """Pull sources now. Per-source isolation: one failure never blocks the rest."""
    require_admin(request)
    if source:
        if source not in refresh_mod.SOURCES:
            raise HTTPException(status_code=404, detail=f"unknown source {source}")
        return {"results": [refresh_mod.refresh_source(source)]}
    return {"results": refresh_mod.refresh_all()}
