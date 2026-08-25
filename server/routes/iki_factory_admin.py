"""IKI Factory admin API (IF-1, IF-6). Human admin + factory:operate agent."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import Response

import iki_factory
import iki_factory_media as media
from agent_auth import Actor
from guards import require_actor, require_human_admin_actor

router = APIRouter(prefix="/api/admin/iki-factory", tags=["admin-iki-factory"])


def _factory_actor(request: Request) -> Actor:
    return require_actor(request, scopes=["factory:operate"])


def _http(exc: Exception) -> HTTPException:
    if isinstance(exc, iki_factory.FactoryMoveError):
        return HTTPException(
            status_code=422,
            detail={"reason": exc.reason, "card": exc.card},
        )
    msg = str(exc)
    code = 404 if "not found" in msg.lower() else 422
    return HTTPException(status_code=code, detail=msg)


@router.get("/skills")
def get_skills(request: Request) -> dict:
    _factory_actor(request)
    import iki_factory_research as research

    return {"skills": research.list_skills()}


@router.post("/research-tick")
def post_research_tick(request: Request) -> dict:
    _factory_actor(request)
    import iki_factory_research as research

    n = research.expire_open_windows()
    return {"expired": n}


@router.get("/cards")
def get_cards(request: Request, card_status: str = "active") -> dict:
    _factory_actor(request)
    try:
        return {"cards": iki_factory.list_cards(card_status=card_status)}
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc


@router.get("/cards/{card_id}")
def get_card(card_id: int, request: Request) -> dict:
    _factory_actor(request)
    try:
        return {
            "card": iki_factory.get_card(card_id),
            "transitions": iki_factory.list_transitions(card_id),
            "attachments": iki_factory.list_attachments(card_id),
        }
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc


@router.post("/cards")
async def post_card(request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        card = iki_factory.create_idea(
            actor,
            title=body.get("title") or "",
            notes=body.get("notes"),
            description=body.get("description"),
            originator_kind=body.get("originator_kind"),
            originator_label=body.get("originator_label"),
        )
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"card": card}


@router.get("/cards/{card_id}/attachments")
def get_attachments(card_id: int, request: Request) -> dict:
    _factory_actor(request)
    try:
        return {"attachments": iki_factory.list_attachments(card_id)}
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc


@router.post("/cards/{card_id}/attachments/link")
async def post_attachment_link(card_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        attachment = iki_factory.add_link_attachment(
            card_id, actor, url=body.get("url") or "", label=body.get("label")
        )
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"attachment": attachment}


@router.post("/cards/{card_id}/attachments/upload")
async def post_attachment_upload(
    card_id: int, request: Request, file: UploadFile, label: str | None = None
) -> dict:
    actor = require_human_admin_actor(request)
    try:
        iki_factory.get_card(card_id)
        data = await file.read()
        saved = media.save_upload(
            card_id, file.filename or "upload", file.content_type or "", data
        )
        attachment = iki_factory.add_upload_attachment(
            card_id,
            actor,
            filename=file.filename or saved["stored_name"],
            content_type=file.content_type or "application/octet-stream",
            size_bytes=len(data),
            storage_path=saved["storage_path"],
            served_url=saved["served_url"],
            label=label,
        )
    except media.MediaError as exc:
        raise HTTPException(status_code=exc.code, detail=exc.detail) from exc
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"attachment": attachment}


@router.get("/cards/{card_id}/attachments/file/{stored_name}")
def get_attachment_file(card_id: int, stored_name: str, request: Request) -> Response:
    _factory_actor(request)
    try:
        data = media.read_upload(card_id, stored_name)
    except media.MediaError as exc:
        raise HTTPException(status_code=exc.code, detail=exc.detail) from exc
    return Response(content=data)


@router.delete("/cards/{card_id}/attachments/{attachment_id}")
def delete_attachment(card_id: int, attachment_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    try:
        iki_factory.delete_attachment(card_id, attachment_id, actor)
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"ok": True}


@router.patch("/cards/{card_id}")
async def patch_card(card_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        card = iki_factory.patch_card(card_id, actor, body)
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"card": card}


@router.post("/cards/{card_id}/move")
async def post_move(card_id: int, request: Request) -> dict:
    """Pull, not push (IF-7). Backlog→Research: Gemba or a human (§3.3).
    Every other transition's actor restriction is enforced in
    `validate_move`. There is no `auto` flag anymore — every call here is
    an explicit pull by whoever is authenticated."""
    actor = _factory_actor(request)
    body = await request.json()
    try:
        card = iki_factory.move_card(
            card_id,
            actor,
            to_lane=body.get("to_lane") or "",
            reason=body.get("reason"),
        )
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"card": card}


@router.post("/cards/{card_id}/status")
async def post_status(card_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        card = iki_factory.set_status(
            card_id,
            actor,
            card_status=body.get("card_status") or "",
            rework_lane=body.get("rework_lane"),
        )
    except iki_factory.FactoryError as exc:
        raise _http(exc) from exc
    return {"card": card}
