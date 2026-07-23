"""Admin AI / agent workbench API — operator-only model + task runtime.

Browser and operators exercise agents through these routes. Completions use
the agent model interface (Grok primary). Spec:
FatTail-Labs-Agent-Model-Interface-Spec-v1.0.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ai import describe_ai_status
from ai.agents import (
    AGENT_TASKS,
    default_fixture_inputs,
    list_seated_agents,
    list_tasks,
    run_agent_task,
)
from ai.types import AiConfigError, AiError, AiProviderError
from guards import require_admin

router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


class RunTaskBody(BaseModel):
    inputs: dict[str, Any] = Field(default_factory=dict)
    prefer: str | None = None
    temperature: float = 0.2
    max_tokens: int = 4096
    use_fixtures: bool = False


@router.get("/status")
def ai_status(request: Request) -> dict:
    require_admin(request)
    status = describe_ai_status()
    status["agents"] = list_seated_agents()
    return status


@router.get("/agents")
def ai_agents(request: Request) -> dict:
    require_admin(request)
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
    require_admin(request)
    try:
        inputs = default_fixture_inputs(callsign, task_id)
    except AiError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"callsign": callsign.lower(), "task_id": task_id, "inputs": inputs}


@router.post("/agents/{callsign}/tasks/{task_id}/run")
def ai_run_task(
    callsign: str, task_id: str, body: RunTaskBody, request: Request
) -> dict:
    """Run a catalogued agent task (live model). Requires API keys for the provider."""
    require_admin(request)
    inputs = dict(body.inputs or {})
    if body.use_fixtures or not inputs:
        try:
            fixtures = default_fixture_inputs(callsign, task_id)
        except AiError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        # Explicit inputs override fixture keys
        merged = {**fixtures, **{k: v for k, v in inputs.items() if v not in (None, "")}}
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

    return {
        "callsign": result.callsign,
        "task_id": result.task_id,
        "provider": result.provider,
        "model": result.model,
        "text": result.text,
        "markers_found": list(result.markers_found),
        "usage": result.usage,
        "charter_path": result.charter_path,
    }
