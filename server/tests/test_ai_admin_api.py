"""Admin AI workbench API — gateway for browser validation.

Auth + catalog tests always run. Live completion requires XAI_API_KEY.
"""

from __future__ import annotations

import os

import pytest

from ai.config import reset_ai_config


@pytest.fixture(autouse=True)
def _reset_ai():
    reset_ai_config()
    yield
    reset_ai_config()


def test_ai_status_requires_admin(client):
    r = client.get("/api/admin/ai/status")
    assert r.status_code == 401


def test_ai_status_admin_ok(client, admin_cookies):
    r = client.get("/api/admin/ai/status", cookies=admin_cookies)
    assert r.status_code == 200
    body = r.json()
    assert body["primary"]["provider"] == "xai"
    assert body["primary"]["model"] == "grok-4.5"
    assert "configured" in body["primary"]
    assert "bravo" in body["agents"]
    assert "quebec" in body["agents"]


def test_ai_agents_lists_tasks(client, admin_cookies):
    r = client.get("/api/admin/ai/agents", cookies=admin_cookies)
    assert r.status_code == 200
    agents = {a["callsign"]: a for a in r.json()["agents"]}
    assert "research_pack" in {t["id"] for t in agents["bravo"]["tasks"]}
    assert "lesson_plan" in {t["id"] for t in agents["november"]["tasks"]}


def test_ai_fixture_bravo(client, admin_cookies):
    r = client.get(
        "/api/admin/ai/agents/bravo/tasks/research_pack/fixture",
        cookies=admin_cookies,
    )
    assert r.status_code == 200
    inputs = r.json()["inputs"]
    assert "intent" in inputs and "source" in inputs


def test_ai_run_without_key_fails_loud(client, admin_cookies, monkeypatch):
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    reset_ai_config()
    r = client.post(
        "/api/admin/ai/agents/bravo/tasks/research_pack/run",
        cookies=admin_cookies,
        json={"use_fixtures": True},
    )
    assert r.status_code == 503
    assert "XAI_API_KEY" in r.json()["detail"]


@pytest.mark.skipif(
    not os.environ.get("XAI_API_KEY"),
    reason="live admin AI run requires XAI_API_KEY",
)
def test_ai_run_bravo_live_via_api(client, admin_cookies):
    """Live Grok through the same admin API the browser uses."""
    reset_ai_config()
    r = client.post(
        "/api/admin/ai/agents/bravo/tasks/research_pack/run",
        cookies=admin_cookies,
        json={"use_fixtures": True, "max_tokens": 1500},
        timeout=180.0,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["provider"] == "xai"
    assert body["callsign"] == "bravo"
    assert "## Claims Inventory" in body["text"]
    assert "Claims Inventory" in " ".join(body["markers_found"]) or any(
        "Claims" in m for m in body["markers_found"]
    )
