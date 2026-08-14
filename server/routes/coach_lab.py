"""Admin Coach Conversation Lab API — DL-327. Registered only when enabled."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

import coach_lab_domain as cld
from coach_lab_config import lab_enabled
from guards import require_admin

router = APIRouter(prefix="/api/admin/coach-lab", tags=["admin-coach-lab"])


def _actor(request: Request) -> tuple[int, str]:
    claims = require_admin(request)
    iid = int(claims.get("identity_id") or 0)
    if iid <= 0:
        raise HTTPException(status_code=400, detail="real identity required")
    return iid, cld.display_name_for(iid)


def _gate() -> None:
    if not lab_enabled():
        raise HTTPException(status_code=404, detail="Not found")


def _wrap(exc: cld.LabError) -> HTTPException:
    return HTTPException(status_code=exc.status, detail=str(exc))


@router.get("/config")
def get_config(request: Request) -> dict:
    _gate()
    require_admin(request)
    try:
        return {"config": cld.get_config()}
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.put("/config")
def put_config(request: Request, body: dict) -> dict:
    _gate()
    iid, _ = _actor(request)
    try:
        return {"config": cld.put_config(iid, body or {})}
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.get("/conversation")
def get_conversation(request: Request) -> dict:
    _gate()
    iid, _ = _actor(request)
    return cld.current_conversation(iid)


@router.get("/conversations")
def list_conversations(request: Request) -> dict:
    _gate()
    iid, _ = _actor(request)
    return {"conversations": cld.list_conversations(iid)}


@router.get("/conversations/{conversation_id}")
def get_one(request: Request, conversation_id: int) -> dict:
    _gate()
    iid, _ = _actor(request)
    try:
        return cld.get_conversation(iid, conversation_id)
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.post("/greet")
def greet(request: Request) -> dict:
    _gate()
    iid, name = _actor(request)
    try:
        return cld.greet(iid, name)
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.post("/chat")
async def chat(request: Request) -> dict:
    _gate()
    iid, _ = _actor(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="text is required")
    try:
        return cld.chat(iid, str(body.get("text") or ""))
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.post("/reset")
def reset(request: Request) -> dict:
    _gate()
    iid, name = _actor(request)
    try:
        return cld.reset(iid, name)
    except cld.LabError as exc:
        raise _wrap(exc) from exc


@router.get("/conversations/{conversation_id}/export.md")
def export_md(request: Request, conversation_id: int) -> PlainTextResponse:
    _gate()
    iid, _ = _actor(request)
    try:
        text = cld.export_markdown(iid, conversation_id)
    except cld.LabError as exc:
        raise _wrap(exc) from exc
    return PlainTextResponse(text, media_type="text/markdown")


@router.get("/export.json")
def export_json(request: Request) -> dict:
    _gate()
    iid, _ = _actor(request)
    return cld.export_all_json(iid)
