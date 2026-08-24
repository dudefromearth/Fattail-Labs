"""WU-1 floating agent under chrome ruling B — Wiki Spec v0.2.1."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import agent_auth
import db
import wiki_agent_context as ctxmod
import wiki_agent_store as store
import wiki_store
from config import ConfigError, get_config
from main import app
from tests.conftest import LabsTestClient, cookie_for

COOKIE = get_config().session_cookie
ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(autouse=True)
def context_providers(monkeypatch):
    monkeypatch.setenv("LABS_WIKI_CONTEXT_PROVIDERS", "hub=/app")


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


@pytest.fixture()
def git_vault(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_NAME", "wiki-agent")
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_EMAIL", "wiki-agent@labs.fattail.ai")
    root = tmp_path / "vault"
    (root / "wiki" / "concepts").mkdir(parents=True)
    (root / "wiki").joinpath("index.md").write_text("# map\n")
    subprocess.run(["git", "init"], cwd=root, check=True, capture_output=True)
    subprocess.run(["git", "add", "-A"], cwd=root, check=True, capture_output=True)
    subprocess.run(
        [
            "git",
            "-c",
            "user.name=seed",
            "-c",
            "user.email=seed@labs.fattail.ai",
            "commit",
            "-m",
            "seed",
        ],
        cwd=root,
        check=True,
        capture_output=True,
    )
    monkeypatch.setenv("LABS_WIKI_ROOT", str(root))
    yield root
    real = Path("/Users/ernie/lab-wiki")
    if (real / "wiki" / "index.md").is_file():
        os.environ["LABS_WIKI_ROOT"] = str(real)
        with db.transaction() as conn:
            wiki_store.reindex(conn, real)


def _agent(callsign: str, scopes: list[str]) -> str:
    try:
        row = agent_auth.create_principal(callsign, callsign)
        pid = int(row["id"])
    except agent_auth.AgentAuthError:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM agent_principals WHERE callsign = %s",
                    (callsign,),
                )
                found = cur.fetchone()
                assert found
                pid = int(found["id"])
    minted = agent_auth.mint_key(pid, name="wu1", scopes=scopes)
    return minted["key"]


def test_hub_provider_enriches_entity(client):
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [],
            "payload": {
                "context": {"surface": "hub", "route": "/app", "entity": None}
            },
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    ent = data["payload"]["context"]["entity"]
    assert ent == {"kind": "hub", "id": "apps", "canonical_url": "/app"}
    turn = data["payload"]["transcript"][0]["content"]
    assert "hub" in turn
    assert "/app" in turn
    assert "apps" in turn
    assert "first registered provider" in turn.lower() or "Hub is the first" in turn


def test_unregistered_surface_is_route_context(client):
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [],
            "payload": {
                "context": {
                    "surface": "wiki",
                    "route": "/app/wiki",
                    "entity": None,
                }
            },
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["payload"]["context"]["entity"] is None
    turn = data["payload"]["transcript"][0]["content"]
    assert "route-context" in turn
    assert "none on screen" in turn


def test_hub_prefix_does_not_capture_wiki_route(client):
    r = client.get(
        "/api/wiki-agent/context",
        cookies=cookie_for("administrator"),
        params={"route": "/app/wiki"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["registered"] is False
    assert data["entity"] is None
    hub = client.get(
        "/api/wiki-agent/context",
        cookies=cookie_for("administrator"),
        params={"route": "/app"},
    )
    assert hub.status_code == 200
    assert hub.json()["registered"] is True
    assert hub.json()["entity"]["id"] == "apps"


def test_accrete_does_not_draft(client, git_vault):
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [],
            "payload": {
                "context": {
                    "surface": "wiki",
                    "route": "/app/wiki",
                    "entity": None,
                }
            },
        },
    ).json()
    cid = opened["contract_id"]
    head1 = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=git_vault, text=True
    ).strip()
    acc = client.post(
        f"/api/wiki-agent/contracts/{cid}/turns",
        cookies=cookie_for("administrator"),
        json={"content": "Propose a page about defined risk."},
    )
    assert acc.status_code == 200, acc.text
    assert "proposal" in acc.json()["payload"]["transcript"][-1]["content"].lower()
    row = store.get_contract(cid)
    assert row["commit_shas"] == []
    assert row["board_card_ids"] == []
    head2 = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=git_vault, text=True
    ).strip()
    assert head1 == head2


def test_explicit_draft_still_wa2_path(client, git_vault):
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [],
            "payload": {
                "context": {
                    "surface": "hub",
                    "route": "/app",
                    "entity": None,
                }
            },
        },
    ).json()
    cid = opened["contract_id"]
    drafted = client.post(
        f"/api/wiki-agent/contracts/{cid}/draft",
        cookies=cookie_for("administrator"),
    )
    assert drafted.status_code == 200, drafted.text
    row = drafted.json()
    assert row["status"] == "awaiting_approval"
    assert row["commit_shas"]
    assert row["board_card_ids"]


def test_non_admin_and_bearer(client):
    member_open = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("navigator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "payload": {"context": {"surface": "wiki", "route": "/app/wiki"}},
        },
    )
    assert member_open.status_code in (403, 404)
    aff = client.get(
        "/api/wiki-agent/session/affordance",
        cookies=cookie_for("navigator"),
    )
    assert aff.status_code == 404
    ctx = client.get(
        "/api/wiki-agent/context",
        cookies=cookie_for("navigator"),
        params={"route": "/app"},
    )
    assert ctx.status_code in (403, 404)
    key = _agent("zz-wu1-bot", ["contracts:deliver"])
    bearer = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "payload": {"context": {"surface": "wiki", "route": "/app/wiki"}},
        },
    )
    assert bearer.status_code == 403
    assert bearer.json()["detail"]["reject_reason"] == "session_requires_human"


def test_providers_fail_loud(monkeypatch, client):
    monkeypatch.delenv("LABS_WIKI_CONTEXT_PROVIDERS", raising=False)
    with pytest.raises(ConfigError, match="LABS_WIKI_CONTEXT_PROVIDERS"):
        ctxmod.provider_map()
    r = client.get(
        "/api/wiki-agent/context",
        cookies=cookie_for("administrator"),
        params={"route": "/app"},
    )
    assert r.status_code == 500
    assert "LABS_WIKI_CONTEXT_PROVIDERS" in r.text


def test_mount_ruling_b_one_orb():
    layout = (ROOT / "web/app/app/wiki/layout.tsx").read_text()
    panel = (ROOT / "web/components/wiki/WikiAgentPanel.tsx").read_text()
    assert "WikiAgentPanel" in layout
    assert "WikiAgentLauncher" not in layout
    assert "WikiAgentLauncher" not in panel
    assert 'from "@/components/AppChrome"' not in layout
    assert 'from "@/components/AppChrome"' not in panel
    assert "HelpLauncher" not in panel
    assert "bg-emerald" not in panel
    assert "if (!isAdmin) return null" in panel
    assert "wiki-agent-panel" in panel
    assert "you still approve" in panel
    assert "Nothing files" in panel
    assert (ROOT / "web/components/wiki/WikiAgentLauncher.tsx").exists() is False
