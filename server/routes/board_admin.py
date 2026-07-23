"""Content backlog & Kanban production board API (Content Board Spec v1.0)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

import board
from agent_auth import Actor
from guards import require_actor, require_human_admin_actor

router = APIRouter(prefix="/api/admin/board", tags=["admin-board"])


def _board_actor(request: Request) -> Actor:
    """Human admin or agent with board:operate."""
    return require_actor(request, scopes=["board:operate"])


def _http(exc: board.BoardError) -> HTTPException:
    msg = str(exc)
    code = 404 if "not found" in msg.lower() else 422
    return HTTPException(status_code=code, detail=msg)


@router.get("/vision")
def get_vision(request: Request) -> dict:
    _board_actor(request)
    try:
        return {"vision": board.get_vision()}
    except board.BoardError as exc:
        raise _http(exc) from exc


@router.put("/vision")
async def put_vision(request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        vision = board.set_vision(body.get("body_md") or "", actor)
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"vision": vision}


@router.get("")
def get_board(request: Request) -> dict:
    _board_actor(request)
    try:
        return board.board_snapshot()
    except board.BoardError as exc:
        raise _http(exc) from exc


@router.get("/items/{item_id}")
def get_item(item_id: int, request: Request) -> dict:
    _board_actor(request)
    try:
        return {"item": board.get_item(item_id)}
    except board.BoardError as exc:
        raise _http(exc) from exc


@router.post("/items")
async def create_item(request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        item = board.create_item(
            actor,
            title=body.get("title") or "",
            intent_md=body.get("intent_md") or "",
            acceptance_md=body.get("acceptance_md"),
            inputs_md=body.get("inputs_md"),
            product_line=body.get("product_line") or "course",
            priority=int(body.get("priority") or 0),
        )
    except board.BoardError as exc:
        raise _http(exc) from exc
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"item": item}


@router.patch("/items/{item_id}")
async def patch_item(item_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        item = board.update_item(item_id, actor, body)
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"item": item}


@router.post("/items/{item_id}/transition")
async def transition_item(item_id: int, request: Request) -> dict:
    actor = _board_actor(request)
    body = await request.json()
    try:
        item = board.transition(
            item_id,
            actor,
            to_status=body.get("to_status") or "",
            sub_stage=body.get("sub_stage"),
            reason=body.get("reason"),
            claimed_callsign=body.get("claimed_callsign"),
        )
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"item": item}


@router.post("/items/{item_id}/artifacts")
async def add_artifact(item_id: int, request: Request) -> dict:
    actor = _board_actor(request)
    body = await request.json()
    try:
        item = board.add_artifact(
            item_id,
            actor,
            stage=body.get("stage") or "",
            title=body.get("title") or "",
            body_md=body.get("body_md"),
            url=body.get("url"),
        )
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"item": item}


@router.post("/items/{item_id}/flags")
async def add_flag(item_id: int, request: Request) -> dict:
    actor = _board_actor(request)
    body = await request.json()
    try:
        item = board.add_flag(
            item_id,
            actor,
            guardian=body.get("guardian") or "",
            message=body.get("message") or "",
            severity=body.get("severity") or "block",
        )
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"item": item}


@router.post("/flags/{flag_id}/clear")
def clear_flag(flag_id: int, request: Request) -> dict:
    actor = _board_actor(request)
    try:
        item = board.clear_flag(flag_id, actor)
    except board.BoardError as exc:
        raise _http(exc) from exc
    return {"item": item}


@router.get("/items/{item_id}/package")
def get_package(item_id: int, request: Request) -> dict:
    _board_actor(request)
    try:
        import packages as packages_mod

        return packages_mod.package_detail(item_id)
    except Exception as exc:
        from packages import PackageError

        if isinstance(exc, PackageError):
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        raise


@router.post("/items/{item_id}/package/validate")
def validate_package(item_id: int, request: Request) -> dict:
    _board_actor(request)
    try:
        import packages as packages_mod

        checklist = packages_mod.package_checklist(item_id)
        try:
            packages_mod.validate_for_approval(item_id)
            return {"ok": True, "checklist": checklist}
        except packages_mod.PackageError as exc:
            return {"ok": False, "detail": str(exc), "checklist": checklist}
    except Exception as exc:
        from packages import PackageError

        if isinstance(exc, PackageError):
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        raise


@router.post("/items/{item_id}/place")
def place_item(item_id: int, request: Request) -> dict:
    """Phase D: apply placement to Labs drafts without requiring publish."""
    actor = require_human_admin_actor(request)
    try:
        import packages as packages_mod

        result = packages_mod.apply_placement(item_id, actor)
        return {"placement": result}
    except Exception as exc:
        from packages import PackageError

        if isinstance(exc, PackageError):
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        raise
