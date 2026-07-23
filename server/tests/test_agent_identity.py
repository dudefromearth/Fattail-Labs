"""Agent identity Phase A — principals, API keys, dual auth, actor events."""

from __future__ import annotations

import json

import pytest

import db
from ai.types import CompletionResult
from ai.agents import AGENT_TASKS, synthetic_success_output


@pytest.fixture()
def bravo_principal_id():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM agent_principals WHERE callsign = 'bravo'"
            )
            row = cur.fetchone()
            assert row, "migration 016 must seed bravo principal"
            return int(row["id"])


def test_list_principals_requires_human_admin(client):
    assert client.get("/api/admin/agents/principals").status_code == 401


def test_list_principals_seeded(client, admin_cookies):
    r = client.get("/api/admin/agents/principals", cookies=admin_cookies)
    assert r.status_code == 200
    callsigns = {p["callsign"] for p in r.json()["principals"]}
    assert {"bravo", "quebec", "november", "papa"} <= callsigns


def test_mint_and_agent_bearer_ai_status(client, admin_cookies, bravo_principal_id):
    r = client.post(
        f"/api/admin/agents/principals/{bravo_principal_id}/keys",
        cookies=admin_cookies,
        json={"name": "test", "scopes": ["ai:run", "ai:status"]},
    )
    assert r.status_code == 200, r.text
    key = r.json()["credential"]["key"]
    assert key.startswith("ftl_ag_")

    # Agent bearer can read AI status
    r2 = client.get(
        "/api/admin/ai/status",
        headers={"Authorization": f"Bearer {key}"},
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["actor"]["kind"] == "agent"
    assert r2.json()["actor"]["label"] == "bravo"

    # Agent cannot mint keys (human admin only)
    r3 = client.post(
        f"/api/admin/agents/principals/{bravo_principal_id}/keys",
        headers={"Authorization": f"Bearer {key}"},
        json={"name": "nope"},
    )
    assert r3.status_code == 401


def test_agent_run_task_with_fake_provider_and_event(
    client, admin_cookies, bravo_principal_id, monkeypatch
):
    r = client.post(
        f"/api/admin/agents/principals/{bravo_principal_id}/keys",
        cookies=admin_cookies,
        json={"scopes": ["ai:run", "ai:status"]},
    )
    key = r.json()["credential"]["key"]

    class FakeXai:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            spec = AGENT_TASKS["bravo"]["research_pack"]
            return CompletionResult(
                text=synthetic_success_output(spec),
                provider="xai",
                model=model,
            )

    import ai.client as client_mod

    monkeypatch.setattr(
        client_mod,
        "_default_factories",
        lambda: {"xai": FakeXai, "anthropic": lambda c: None},
    )

    r2 = client.post(
        "/api/admin/ai/agents/bravo/tasks/research_pack/run",
        headers={"Authorization": f"Bearer {key}"},
        json={"use_fixtures": True},
    )
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["actor"]["label"] == "bravo"
    assert "## Claims Inventory" in body["text"]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT actor_kind, actor_label, action, resource
                   FROM actor_events
                   WHERE action = 'ai.task.run'
                   ORDER BY id DESC LIMIT 1"""
            )
            ev = cur.fetchone()
    assert ev is not None
    assert ev["actor_kind"] == "agent"
    assert ev["actor_label"] == "bravo"
    assert ev["resource"] == "bravo/research_pack"


def test_revoked_key_rejected(client, admin_cookies, bravo_principal_id):
    r = client.post(
        f"/api/admin/agents/principals/{bravo_principal_id}/keys",
        cookies=admin_cookies,
        json={"scopes": ["ai:status"]},
    )
    cred = r.json()["credential"]
    key, kid = cred["key"], cred["key_id"]

    assert (
        client.post(
            f"/api/admin/agents/keys/{kid}/revoke",
            cookies=admin_cookies,
        ).status_code
        == 200
    )

    r2 = client.get(
        "/api/admin/ai/status",
        headers={"Authorization": f"Bearer {key}"},
    )
    assert r2.status_code == 401


def test_agent_missing_scope_forbidden(client, admin_cookies, bravo_principal_id):
    r = client.post(
        f"/api/admin/agents/principals/{bravo_principal_id}/keys",
        cookies=admin_cookies,
        json={"scopes": ["ai:status"]},  # no ai:run
    )
    key = r.json()["credential"]["key"]
    r2 = client.post(
        "/api/admin/ai/agents/bravo/tasks/research_pack/run",
        headers={"Authorization": f"Bearer {key}"},
        json={"use_fixtures": True},
    )
    assert r2.status_code == 403
