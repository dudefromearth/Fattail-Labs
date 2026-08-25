"""IKI Factory Live catalog + publication signal (IF-4).

Member list is Live only. The publication signal is the Live transition —
no Wiki envelope, no source_kind, no contract id.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import iki_factory
from guards import require_session

router = APIRouter(tags=["iki-factory-live"])


@router.get("/api/iki-factory/publication-signal")
def get_publication_signal() -> dict:
    """Pollable Live transitions. Drafts are never listed."""
    return {"signals": iki_factory.list_publication_signals()}


@router.get("/api/iki-factory/live")
def get_live_catalog(request: Request) -> dict:
    require_session(request)
    return {"templates": iki_factory.list_live()}


@router.get("/api/iki-factory/live/{card_id}")
def get_live_one(card_id: int, request: Request) -> dict:
    require_session(request)
    try:
        return {"template": iki_factory.get_live(card_id)}
    except iki_factory.FactoryError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
