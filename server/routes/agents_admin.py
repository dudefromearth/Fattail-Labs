"""Human-admin management of agent principals and API keys (Agent Identity Spec v1.0)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

import agent_auth
from guards import require_human_admin_actor

router = APIRouter(prefix="/api/admin/agents", tags=["admin-agents"])


@router.get("/principals")
def list_principals(request: Request) -> dict:
    require_human_admin_actor(request)
    return {"principals": agent_auth.list_principals()}


@router.post("/principals")
async def create_principal(request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    try:
        p = agent_auth.create_principal(
            body.get("callsign") or "",
            body.get("display_name") or "",
        )
    except agent_auth.AgentAuthError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    agent_auth.record_event(
        actor,
        "agent.principal.create",
        resource=p["callsign"],
        detail={"principal_id": p["id"]},
    )
    return {"principal": p}


@router.patch("/principals/{principal_id}")
async def patch_principal(principal_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body = await request.json()
    status = body.get("status")
    if status is None:
        raise HTTPException(status_code=422, detail="status required")
    try:
        p = agent_auth.set_principal_status(int(principal_id), str(status))
    except agent_auth.AgentAuthError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    agent_auth.record_event(
        actor,
        "agent.principal.status",
        resource=p["callsign"],
        detail={"status": p["status"]},
    )
    return {"principal": p}


@router.post("/principals/{principal_id}/keys")
async def mint_key(principal_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    body: dict[str, Any] = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    try:
        minted = agent_auth.mint_key(
            int(principal_id),
            name=str(body.get("name") or "default"),
            scopes=body.get("scopes"),
        )
    except agent_auth.AgentAuthError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    agent_auth.record_event(
        actor,
        "agent.key.mint",
        resource=str(principal_id),
        detail={"key_id": minted["key_id"], "scopes": minted["scopes"]},
    )
    # raw key returned once
    return {"credential": minted}


@router.post("/keys/{key_id}/revoke")
def revoke_key(key_id: int, request: Request) -> dict:
    actor = require_human_admin_actor(request)
    try:
        agent_auth.revoke_key(int(key_id))
    except agent_auth.AgentAuthError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    agent_auth.record_event(
        actor, "agent.key.revoke", resource=str(key_id), detail={}
    )
    return {"ok": True, "key_id": key_id}
