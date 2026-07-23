"""Admin AI / agent workbench API — human admin or agent API key (Phase A).

Spec: FatTail-Labs-Agent-Model-Interface-Spec-v1.0 + Agent-Identity-Spec-v1.0.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

import agent_auth
from ai import describe_ai_status
from ai.agents import (
    AGENT_TASKS,
    default_fixture_inputs,
    list_seated_agents,
    list_tasks,
    run_agent_task,
)
from ai.types import AiConfigError, AiError, AiProviderError
from guards import require_actor

router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


class RunTaskBody(BaseModel):
    inputs: dict[str, Any] = Field(default_factory=dict)
    prefer: str | None = None
    temperature: float = 0.2
    max_tokens: int = 4096
    use_fixtures: bool = False
    content_item_id: int | None = None  # Phase C: attach result to board card


@router.get("/status")
def ai_status(request: Request) -> dict:
    actor = require_actor(request, scopes=["ai:status"])
    status = describe_ai_status()
    status["agents"] = list_seated_agents()
    status["actor"] = {
        "kind": actor.kind,
        "id": actor.id,
        "label": actor.label,
    }
    return status


@router.get("/agents")
def ai_agents(request: Request) -> dict:
    require_actor(request, scopes=["ai:status"])
    agents = []
    for cs in list_seated_agents():
        tasks = list_tasks(cs)
        agents.append(
            {
                "callsign": cs,
                "tasks": [
                    {
                        "id": tid,
                        "description": AGENT_TASKS[cs][tid].description,
                    }
                    for tid in tasks
                ],
            }
        )
    return {"agents": agents}


@router.get("/agents/{callsign}/tasks/{task_id}/fixture")
def ai_task_fixture(callsign: str, task_id: str, request: Request) -> dict:
    require_actor(request, scopes=["ai:run"])
    try:
        inputs = default_fixture_inputs(callsign, task_id)
    except AiError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"callsign": callsign.lower(), "task_id": task_id, "inputs": inputs}


@router.post("/agents/{callsign}/tasks/{task_id}/run")
def ai_run_task(
    callsign: str, task_id: str, body: RunTaskBody, request: Request
) -> dict:
    """Run a catalogued agent task (live model). Requires LLM API keys on server."""
    actor = require_actor(request, scopes=["ai:run"])
    inputs = dict(body.inputs or {})
    if body.use_fixtures or not inputs:
        try:
            fixtures = default_fixture_inputs(callsign, task_id)
        except AiError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        merged = {
            **fixtures,
            **{k: v for k, v in inputs.items() if v not in (None, "")},
        }
        inputs = merged

    try:
        result = run_agent_task(
            callsign,
            task_id,
            inputs,
            prefer=body.prefer,
            temperature=body.temperature,
            max_tokens=body.max_tokens,
        )
    except AiConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    agent_auth.record_event(
        actor,
        "ai.task.run",
        resource=f"{result.callsign}/{result.task_id}",
        detail={
            "provider": result.provider,
            "model": result.model,
            "markers": list(result.markers_found),
            "usage": result.usage,
            "content_item_id": body.content_item_id,
        },
    )

    attach = None
    if body.content_item_id is not None:
        try:
            import packages as packages_mod

            attach = packages_mod.attach_ai_result_to_item(
                actor,
                content_item_id=int(body.content_item_id),
                callsign=result.callsign,
                task_id=result.task_id,
                text=result.text,
                provider=result.provider,
                model=result.model,
                prefer=body.prefer,
                markers=list(result.markers_found),
                usage=dict(result.usage or {}),
            )
        except Exception as exc:
            from packages import PackageError

            if isinstance(exc, PackageError):
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            raise

    return {
        "callsign": result.callsign,
        "task_id": result.task_id,
        "provider": result.provider,
        "model": result.model,
        "text": result.text,
        "markers_found": list(result.markers_found),
        "usage": result.usage,
        "charter_path": result.charter_path,
        "actor": {"kind": actor.kind, "id": actor.id, "label": actor.label},
        "board_attach": attach,
    }
