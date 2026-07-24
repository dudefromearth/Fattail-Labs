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
            cast_id=body.get("cast_id"),
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
async def place_item(item_id: int, request: Request) -> dict:
    """Phase D: apply placement to Labs drafts (create or replace draft structure)."""
    actor = require_human_admin_actor(request)
    body: dict = {}
    try:
        if int(request.headers.get("content-length") or 0) > 0:
            body = await request.json()
    except Exception:
        body = {}
    replace = bool(body.get("replace", True))
    try:
        import packages as packages_mod

        result = packages_mod.apply_placement(
            item_id, actor, replace=replace
        )
        return {"placement": result}
    except Exception as exc:
        from packages import PackageError

        if isinstance(exc, PackageError):
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        raise


@router.post("/items/{item_id}/produce-heygen")
async def produce_heygen(item_id: int, request: Request) -> dict:
    """Phase G2a/G2b: kick HeyGen (single or multi-lesson batch) → video_package.

    Body: {
      "dry_run": bool?,
      "orientation": "landscape"|"portrait"?,
      "max_renders": int?
    }
    Requires cast_id + script. Batch targets from lesson_plan / placement / script.
    Live jobs count against G3 daily/monthly budget.
    """
    actor = require_human_admin_actor(request)
    body: dict = {}
    try:
        if int(request.headers.get("content-length") or 0) > 0:
            body = await request.json()
    except Exception:
        body = {}
    dry_run = body.get("dry_run")
    if dry_run is not None:
        dry_run = bool(dry_run)
    orientation = body.get("orientation")
    max_renders = body.get("max_renders")
    if max_renders is not None:
        try:
            max_renders = int(max_renders)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="max_renders must be an integer"
            ) from exc
    try:
        import heygen_prod as heygen_mod

        result = heygen_mod.produce_video_package(
            item_id,
            actor,
            dry_run=dry_run,
            orientation=orientation,
            max_renders=max_renders,
        )
        item = board.get_item(item_id)
        return {"production": result, "item": item}
    except Exception as exc:
        from heygen_prod import HeyGenProdError

        if isinstance(exc, HeyGenProdError):
            msg = str(exc)
            code = 404 if "not found" in msg.lower() else 422
            raise HTTPException(status_code=code, detail=msg) from exc
        raise


@router.post("/items/{item_id}/refresh-heygen")
def refresh_heygen(item_id: int, request: Request) -> dict:
    """G5: poll HeyGen session status and rewrite latest video_package."""
    actor = require_human_admin_actor(request)
    try:
        import heygen_prod as heygen_mod

        result = heygen_mod.refresh_video_package(item_id, actor)
        item = board.get_item(item_id)
        return {"refresh": result, "item": item}
    except Exception as exc:
        from heygen_prod import HeyGenProdError

        if isinstance(exc, HeyGenProdError):
            msg = str(exc)
            code = 404 if "not found" in msg.lower() or "no video_package" in msg.lower() else 422
            raise HTTPException(status_code=code, detail=msg) from exc
        raise


@router.post("/items/{item_id}/youtube-map")
async def youtube_map(item_id: int, request: Request) -> dict:
    """G5: human fills YouTube ids onto video_package for Phase D placement."""
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        import heygen_prod as heygen_mod

        result = heygen_mod.set_youtube_map(
            item_id,
            actor,
            videos=body.get("videos"),
            trailer_video_id=body.get("trailer_video_id"),
        )
        item = board.get_item(item_id)
        return {"youtube_map": result, "item": item}
    except Exception as exc:
        from heygen_prod import HeyGenProdError

        if isinstance(exc, HeyGenProdError):
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        raise


@router.get("/heygen/budget")
def heygen_budget(request: Request) -> dict:
    """G3: daily/monthly HeyGen job budget snapshot."""
    _board_actor(request)
    import heygen_prod as heygen_mod

    return {"budget": heygen_mod.budget_snapshot()}


# --- Course Blueprint (Header + Outline, first validation product) -----------


def _blueprint_http(exc: Exception) -> HTTPException:
    import blueprint as blueprint_mod

    msg = str(exc)
    if isinstance(exc, blueprint_mod.BlueprintError):
        low = msg.lower()
        if "not found" in low:
            return HTTPException(status_code=404, detail=msg)
        if "only for product_line" in low:
            return HTTPException(status_code=422, detail=msg)
        if "only human" in low:
            return HTTPException(status_code=403, detail=msg)
        if "ai not configured" in low:
            return HTTPException(status_code=503, detail=msg)
        if "ai provider" in low:
            return HTTPException(status_code=502, detail=msg)
        return HTTPException(status_code=422, detail=msg)
    if isinstance(exc, board.BoardError):
        return _http(exc)
    return HTTPException(status_code=500, detail=msg)


@router.get("/items/{item_id}/blueprint")
def get_blueprint(item_id: int, request: Request) -> dict:
    """Latest Course Blueprint (Header + Outline + chat) or empty shell."""
    actor = _board_actor(request)
    import blueprint as blueprint_mod

    try:
        bp = blueprint_mod.get_blueprint(item_id)
        if bp is None:
            bp = blueprint_mod.ensure_blueprint(item_id, actor)
        return {"blueprint": bp}
    except Exception as exc:
        raise _blueprint_http(exc) from exc


@router.put("/items/{item_id}/blueprint")
async def put_blueprint(item_id: int, request: Request) -> dict:
    """Manual save of header/outline (form fallback). Human admin only."""
    actor = require_human_admin_actor(request)
    body = await request.json()
    import blueprint as blueprint_mod

    try:
        bp = blueprint_mod.save_blueprint(
            item_id,
            actor,
            header=body.get("header"),
            outline=body.get("outline"),
            chat=body.get("chat"),
        )
        return {"blueprint": bp}
    except Exception as exc:
        raise _blueprint_http(exc) from exc


@router.post("/items/{item_id}/blueprint/chat")
async def chat_blueprint(item_id: int, request: Request) -> dict:
    """AI chat turn that updates Header + Outline (non-streaming).

    Body: { "message": "...", "use_fixtures": false, "prefer": null,
            "temperature": 0.3, "max_tokens": 4096 }

    Prefer POST …/chat/stream for interactive UX.
    """
    try:
        actor = require_actor(request, scopes=["ai:run"])
    except HTTPException:
        actor = require_human_admin_actor(request)

    body = await request.json()
    import blueprint as blueprint_mod

    try:
        result = blueprint_mod.chat_blueprint(
            item_id,
            actor,
            message=body.get("message") or "",
            use_fixtures=bool(body.get("use_fixtures")),
            prefer=body.get("prefer"),
            temperature=float(
                body.get("temperature") if body.get("temperature") is not None else 0.3
            ),
            max_tokens=int(body.get("max_tokens") or 4096),
        )
        return result
    except Exception as exc:
        raise _blueprint_http(exc) from exc


@router.post("/items/{item_id}/blueprint/chat/stream")
async def chat_blueprint_stream(item_id: int, request: Request):
    """Streaming AI chat (SSE). Live Grok by default; use_fixtures optional.

    Body: same as /chat. Events: meta, user, delta, done, error.
    """
    from fastapi.responses import StreamingResponse
    import json as _json

    try:
        actor = require_actor(request, scopes=["ai:run"])
    except HTTPException:
        actor = require_human_admin_actor(request)

    body = await request.json()
    import blueprint as blueprint_mod

    message = body.get("message") or ""
    use_fixtures = bool(body.get("use_fixtures"))
    prefer = body.get("prefer")
    temperature = float(
        body.get("temperature") if body.get("temperature") is not None else 0.3
    )
    max_tokens = int(body.get("max_tokens") or 4096)

    def event_gen():
        try:
            for ev in blueprint_mod.chat_blueprint_stream(
                item_id,
                actor,
                message=message,
                use_fixtures=use_fixtures,
                prefer=prefer,
                temperature=temperature,
                max_tokens=max_tokens,
            ):
                yield f"data: {_json.dumps(ev, default=str)}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {_json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/items/{item_id}/blueprint/validate")
def validate_blueprint(item_id: int, request: Request) -> dict:
    """Run minimum validation bar (descriptions + structure)."""
    _board_actor(request)
    import blueprint as blueprint_mod

    try:
        return blueprint_mod.validate_item_blueprint(item_id)
    except Exception as exc:
        raise _blueprint_http(exc) from exc


@router.post("/items/{item_id}/blueprint/approve")
def approve_blueprint(item_id: int, request: Request) -> dict:
    """Human Approve Blueprint — unlocks post-blueprint factory steps."""
    actor = require_human_admin_actor(request)
    import blueprint as blueprint_mod

    try:
        bp = blueprint_mod.approve_blueprint(item_id, actor)
        return {"blueprint": bp, "item": board.get_item(item_id)}
    except Exception as exc:
        raise _blueprint_http(exc) from exc


@router.get("/quebec/status")
def quebec_status(request: Request) -> dict:
    """Poller config + last cycle (Quebec Poller Spec v1.0)."""
    _board_actor(request)
    import quebec as quebec_mod

    return quebec_mod.get_status()


@router.post("/quebec/tick")
async def quebec_tick(request: Request) -> dict:
    """Quebec cycle: advance columns; optional auto-produce next package stage.

    Human admin always allowed. Agents need board:operate and LABS_QUEBEC_AUTO=1
    (unless body.force and human).
    Body: { "max_actions": 20, "force": false, "produce": null|bool }
    """
    actor = _board_actor(request)
    body: dict = {}
    try:
        if int(request.headers.get("content-length") or 0) > 0:
            body = await request.json()
    except Exception:
        body = {}
    max_actions = int(body.get("max_actions") or 20)
    force = bool(body.get("force"))
    produce = body.get("produce")
    if produce is not None:
        produce = bool(produce)
    if force and not (actor.kind == "human" and actor.role == "administrator"):
        force = False
    try:
        import quebec as quebec_mod

        result = quebec_mod.tick(
            actor, max_actions=max_actions, force=force, produce=produce
        )
        return {"tick": result, "board": board.board_snapshot()}
    except Exception as exc:
        from quebec import QuebecError

        if isinstance(exc, QuebecError):
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        if isinstance(exc, board.BoardError):
            raise _http(exc) from exc
        raise
