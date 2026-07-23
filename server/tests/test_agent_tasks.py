"""Agent task runtime — each studio agent can perform its catalog tasks.

Uses injected fake providers (no live API keys). Charters are loaded from
agents/bench/*.md. Spec: FatTail-Labs-Agent-Model-Interface-Spec-v1.0 (+ agent runtime).
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

import ai
from ai.agents import (
    AGENT_TASKS,
    STUDIO_AGENTS,
    build_messages,
    default_fixture_inputs,
    list_seated_agents,
    list_tasks,
    load_charter,
    run_agent_task,
    synthetic_success_output,
    validate_task_output,
)
from ai.config import reset_ai_config
from ai.types import AiError, CompletionResult

REPO = Path(__file__).resolve().parents[2]
BENCH = REPO / "agents" / "bench"


@pytest.fixture(autouse=True)
def _clean_ai_env(monkeypatch):
    for key in list(os.environ):
        if key.startswith("LABS_AI_") or key in (
            "XAI_API_KEY",
            "ANTHROPIC_API_KEY",
        ):
            monkeypatch.delenv(key, raising=False)
    reset_ai_config()
    yield
    reset_ai_config()


def _fake_providers(recorder: list | None = None):
    """Provider that returns synthetic valid output and records agent routing."""

    class FakeXai:
        def __init__(self, cfg):
            self.cfg = cfg

        def complete(self, messages, *, model, temperature, max_tokens):
            user = next(m.content for m in messages if m.role == "user")
            system = next(m.content for m in messages if m.role == "system")
            callsign = "unknown"
            for line in system.splitlines():
                if line.startswith("You are the FatTail Labs agent "):
                    callsign = line.split()[-1].rstrip(".").lower()
                    break

            # User templates embed required section headers — pick best-matching task.
            best_spec = None
            best_hits = -1
            for spec in AGENT_TASKS.get(callsign, {}).values():
                hits = sum(1 for m in spec.required_markers if m in user)
                if hits > best_hits:
                    best_hits = hits
                    best_spec = spec
            if best_spec is None:
                raise AssertionError(f"no tasks for callsign {callsign!r}")

            if recorder is not None:
                recorder.append(
                    {
                        "callsign": callsign,
                        "task_id": best_spec.id,
                        "model": model,
                        "provider": "xai",
                        "system_has_charter": "--- CHARTER ---" in system,
                        "user_len": len(user),
                    }
                )
            return CompletionResult(
                text=synthetic_success_output(best_spec),
                provider="xai",
                model=model,
                usage={"input_tokens": 10, "output_tokens": 20},
            )

    return {"xai": FakeXai, "anthropic": lambda c: None}


# --- catalog / charter integrity -------------------------------------------------


def test_all_studio_agents_have_charters_and_tasks():
    seated = list_seated_agents(BENCH)
    assert set(seated) == set(STUDIO_AGENTS), (
        f"missing seated agents: {set(STUDIO_AGENTS) - set(seated)}; "
        f"extra: {set(seated) - set(STUDIO_AGENTS)}"
    )
    for cs in seated:
        charter = load_charter(cs, root=BENCH)
        assert "IDENTITY" in charter or "You are" in charter
        assert list_tasks(cs)


def test_each_charter_file_exists_for_catalog():
    for cs in STUDIO_AGENTS:
        path = BENCH / f"{cs}.md"
        assert path.is_file(), f"missing charter {path}"


@pytest.mark.parametrize("callsign", sorted(STUDIO_AGENTS))
def test_build_messages_includes_charter_and_inputs(callsign):
    for task_id in list_tasks(callsign):
        inputs = default_fixture_inputs(callsign, task_id)
        messages, spec, path = build_messages(
            callsign, task_id, inputs, root=BENCH
        )
        assert path.name == f"{callsign}.md"
        assert messages[0].role == "system"
        assert "--- CHARTER ---" in messages[0].content
        assert callsign.upper() in messages[0].content
        assert messages[1].role == "user"
        for key, val in inputs.items():
            assert str(val) in messages[1].content
        assert spec.id == task_id


def test_missing_input_fails_loud():
    with pytest.raises(AiError, match="missing required input"):
        build_messages(
            "bravo",
            "research_pack",
            {"intent": "x"},  # missing source
            root=BENCH,
        )


def test_unknown_agent_fails_loud():
    with pytest.raises(AiError, match="unknown agent"):
        list_tasks("not-an-agent")


def test_unknown_task_fails_loud():
    with pytest.raises(AiError, match="unknown task"):
        build_messages("bravo", "dance", {"intent": "x", "source": "y"}, root=BENCH)


# --- validation -----------------------------------------------------------------


def test_validate_task_output_requires_markers():
    spec = AGENT_TASKS["bravo"]["research_pack"]
    with pytest.raises(AiError, match="missing required sections"):
        validate_task_output("hello only", spec)
    found = validate_task_output(synthetic_success_output(spec), spec)
    assert len(found) == len(spec.required_markers)


# --- every agent × task runs end-to-end via model interface ----------------------


def _all_agent_tasks():
    rows = []
    for cs in sorted(STUDIO_AGENTS):
        for tid in list_tasks(cs):
            rows.append((cs, tid))
    return rows


@pytest.mark.parametrize("callsign,task_id", _all_agent_tasks())
def test_agent_can_perform_task(callsign, task_id):
    recorder: list = []
    inputs = default_fixture_inputs(callsign, task_id)
    result = run_agent_task(
        callsign,
        task_id,
        inputs,
        root=BENCH,
        providers=_fake_providers(recorder),
    )
    assert result.callsign == callsign
    assert result.task_id == task_id
    assert result.provider == "xai"
    assert result.model == "grok-4.5"
    assert result.markers_found
    assert len(result.markers_found) == len(
        AGENT_TASKS[callsign][task_id].required_markers
    )
    assert recorder, "provider was not invoked"
    assert recorder[0]["system_has_charter"] is True
    assert recorder[0]["callsign"] == callsign


def test_pipeline_course_path_agents_in_order():
    """Quebec seed → Bravo → November → Romeo → Papa → Hotel (order smoke)."""
    pipeline = [
        ("quebec", "seed_from_backlog"),
        ("bravo", "research_pack"),
        ("november", "lesson_plan"),
        ("romeo", "lesson_script"),
        ("papa", "placement_proposal"),
        ("hotel", "accuracy_review"),
        ("tango", "member_experience_review"),
    ]
    providers = _fake_providers()
    texts = []
    for cs, tid in pipeline:
        r = run_agent_task(
            cs,
            tid,
            default_fixture_inputs(cs, tid),
            root=BENCH,
            providers=providers,
        )
        texts.append((cs, r.text[:40]))
        assert r.provider == "xai"
    assert [c for c, _ in texts] == [c for c, _ in pipeline]


def test_agent_prefer_secondary_routes_model(monkeypatch):
    monkeypatch.setenv("LABS_AI_AGENT_HOTEL_PREFER", "secondary")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "a" * 40)
    reset_ai_config()

    class FakeClaude:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            spec = AGENT_TASKS["hotel"]["accuracy_review"]
            return CompletionResult(
                text=synthetic_success_output(spec),
                provider="anthropic",
                model=model,
            )

    r = run_agent_task(
        "hotel",
        "accuracy_review",
        default_fixture_inputs("hotel", "accuracy_review"),
        root=BENCH,
        providers={"xai": lambda c: None, "anthropic": FakeClaude},
    )
    assert r.provider == "anthropic"
    assert r.model == "claude-sonnet-4-5"


def test_empty_model_output_fails_validation():
    class EmptyXai:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            return CompletionResult(text="   ", provider="xai", model=model)

    with pytest.raises(AiError, match="empty output"):
        run_agent_task(
            "bravo",
            "research_pack",
            default_fixture_inputs("bravo", "research_pack"),
            root=BENCH,
            providers={"xai": EmptyXai, "anthropic": lambda c: None},
        )


@pytest.mark.skipif(
    not os.environ.get("XAI_API_KEY"),
    reason="live Grok smoke requires XAI_API_KEY",
)
def test_live_bravo_research_pack_smoke():
    """Optional live call — run with XAI_API_KEY set (not required in CI)."""
    reset_ai_config()
    result = run_agent_task(
        "bravo",
        "research_pack",
        default_fixture_inputs("bravo", "research_pack"),
        root=BENCH,
        max_tokens=1200,
    )
    assert result.provider == "xai"
    assert "## Claims Inventory" in result.text
