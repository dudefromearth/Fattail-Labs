"""WA-4 session lifecycle, context-into-entry, drain, admin-only (Spec v0.1.3)."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import agent_auth
import db
import wiki_agent_linkage as linkage
import wiki_agent_session as session
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
    minted = agent_auth.mint_key(pid, name="wa4", scopes=scopes)
    return minted["key"]


def _open_body(**ctx_extra):
    ctx = {
        "surface": "strategy-lab",
        "route": "/app/strategy-lab",
        "entity": {
            "kind": "strategy",
            "id": "house-defined-risk",
            "canonical_url": "/app/strategy-lab/design",
        },
    }
    ctx.update(ctx_extra)
    return {
        "contract_version": "1",
        "kind": "session",
        "source": "admin-session",
        "refs": [],
        "payload": {"context": ctx},
    }


def test_open_cites_strategy_lab_context(client):
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    )
    assert r.status_code == 200, r.text
    data = r.json()
    turn = data["payload"]["transcript"][0]
    assert turn["role"] == "agent"
    assert "strategy-lab" in turn["content"]
    assert "/app/strategy-lab" in turn["content"]
    assert "house-defined-risk" in turn["content"]
    assert data["sealed_at"] is None


def test_accrete_seal_and_mutate_rejected(client):
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    ).json()
    cid = opened["contract_id"]
    acc = client.post(
        f"/api/wiki-agent/contracts/{cid}/turns",
        cookies=cookie_for("administrator"),
        json={"content": "Cover defined risk as process, not a profit claim."},
    )
    assert acc.status_code == 200, acc.text
    transcript = acc.json()["payload"]["transcript"]
    assert any(t.get("role") == "admin" and "defined risk" in t.get("content", "") for t in transcript)
    sealed = client.post(
        f"/api/wiki-agent/contracts/{cid}/seal",
        cookies=cookie_for("administrator"),
    )
    assert sealed.status_code == 200, sealed.text
    assert sealed.json()["sealed_at"]
    rejected = client.post(
        f"/api/wiki-agent/contracts/{cid}/turns",
        cookies=cookie_for("administrator"),
        json={"content": "after seal"},
    )
    assert rejected.status_code == 409, rejected.text
    assert rejected.json()["detail"]["reject_reason"] == "session_sealed"


def test_follow_on_new_contract_refs_sealed(client):
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    ).json()
    cid = opened["contract_id"]
    client.post(
        f"/api/wiki-agent/contracts/{cid}/seal",
        cookies=cookie_for("administrator"),
    )
    follow = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [
                {
                    "kind": "wiki_contract",
                    "id": cid,
                    "canonical_url": f"/api/wiki-agent/contracts/{cid}",
                }
            ],
            "payload": {
                "context": {
                    "surface": "strategy-lab",
                    "route": "/app/strategy-lab",
                    "entity": None,
                }
            },
        },
    )
    assert follow.status_code == 200, follow.text
    data = follow.json()
    assert data["contract_id"] != cid
    assert data["refs"][0]["id"] == cid
    live = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    ).json()
    bad = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [
                {
                    "kind": "wiki_contract",
                    "id": live["contract_id"],
                    "canonical_url": f"/api/wiki-agent/contracts/{live['contract_id']}",
                }
            ],
            "payload": {
                "context": {"surface": "wiki", "route": "/app/wiki", "entity": None}
            },
        },
    )
    assert bad.status_code == 400
    assert bad.json()["detail"]["reject_reason"] == "follow_on_unsealed"


def test_context_into_entry_and_wa2_board_path(client, git_vault):
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    ).json()
    cid = opened["contract_id"]
    client.post(
        f"/api/wiki-agent/contracts/{cid}/turns",
        cookies=cookie_for("administrator"),
        json={"content": "Page should frame defined risk as process control."},
    )
    drafted = client.post(
        f"/api/wiki-agent/contracts/{cid}/draft",
        cookies=cookie_for("administrator"),
    )
    assert drafted.status_code == 200, drafted.text
    row = drafted.json()
    assert row["status"] == "awaiting_approval"
    assert row["commit_shas"]
    assert row["board_card_ids"]
    rel = f"wiki/concepts/wa4-session-{cid.lower()}.md"
    path = git_vault / rel
    assert path.is_file(), path
    text = path.read_text()
    assert f"session_contract_id: {cid}" in text
    assert "calling_surface: strategy-lab" in text
    assert "calling_route: /app/strategy-lab" in text
    assert "calling_entity_id: house-defined-risk" in text
    assert "house-defined-risk" in text
    assert "Candidate linkages" in text
    assert "status: draft" in text
    log = subprocess.check_output(
        ["git", "log", "-1", "--format=%s%n%an"], cwd=git_vault, text=True
    )
    assert cid in log
    assert "wiki-agent" in log
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status FROM content_items WHERE id = %s",
                (row["board_card_ids"][0],),
            )
            card = cur.fetchone()
    assert card["status"] == "awaiting_approval"


def test_member_and_bearer_rejected_admin_affordance(client):
    member_open = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("navigator"),
        json=_open_body(),
    )
    assert member_open.status_code in (403, 404), member_open.text
    member_aff = client.get(
        "/api/wiki-agent/session/affordance",
        cookies=cookie_for("navigator"),
    )
    assert member_aff.status_code == 404
    admin_aff = client.get(
        "/api/wiki-agent/session/affordance",
        cookies=cookie_for("administrator"),
    )
    assert admin_aff.status_code == 200
    assert admin_aff.json()["render"] is True
    key = _agent("zz-wa4-session-bot", ["contracts:deliver"])
    bearer = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        cookies=cookie_for("administrator"),
        json=_open_body(),
    )
    assert bearer.status_code == 403
    assert bearer.json()["detail"]["reject_reason"] == "session_requires_human"
    opened = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=_open_body(),
    ).json()
    acc = client.post(
        f"/api/wiki-agent/contracts/{opened['contract_id']}/turns",
        headers={"Authorization": f"Bearer {key}"},
        cookies=cookie_for("administrator"),
        json={"content": "nope"},
    )
    assert acc.status_code == 403
    assert acc.json()["detail"]["reject_reason"] == "session_requires_human"


def test_family_b_entity_rejected(client):
    body = _open_body()
    body["payload"]["context"]["entity"] = {
        "kind": "fill",
        "id": "1",
        "canonical_url": "/app/trade-log/1",
    }
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json=body,
    )
    assert r.status_code == 400
    assert r.json()["detail"]["reject_reason"] == "family_b_ref"


def test_drain_one_item_decrements_queue(client, git_vault, monkeypatch):
    monkeypatch.setenv("LABS_WIKI_LINKAGE_DRAIN_N", "1")
    cid = "01WA4DRAINCONTRACTULID00001"[:26]
    before = linkage.queued_count()
    from_slug = f"wa4-drain-{os.getpid()}-{before}"
    linkage.queue_reverse(cid, from_slug, "defined-risk", 2.5)
    assert linkage.queued_count() == before + 1
    r = client.post(
        "/api/wiki-agent/linkage-queue/drain",
        cookies=cookie_for("administrator"),
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["drained"] == 1
    assert data["card_ids"]
    assert data["queued_remaining"] == before
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status FROM content_items WHERE id = %s",
                (data["card_ids"][0],),
            )
            card = cur.fetchone()
    assert card["status"] == "awaiting_approval"


def test_drain_n_fail_loud(client, monkeypatch):
    monkeypatch.delenv("LABS_WIKI_LINKAGE_DRAIN_N", raising=False)
    with pytest.raises(ConfigError, match="LABS_WIKI_LINKAGE_DRAIN_N"):
        session.drain_n()
    r = client.post(
        "/api/wiki-agent/linkage-queue/drain",
        cookies=cookie_for("administrator"),
    )
    assert r.status_code == 500
    assert "LABS_WIKI_LINKAGE_DRAIN_N" in r.text


def test_mount_point_not_appchrome():
    layout = (ROOT / "web/app/app/wiki/layout.tsx").read_text()
    panel = (ROOT / "web/components/wiki/WikiAgentPanel.tsx").read_text()
    chrome = ROOT / "web/components/AppChrome.tsx"
    assert "WikiAgentPanel" in layout
    assert 'from "@/components/AppChrome"' not in layout
    assert 'from "@/components/AppChrome"' not in panel
    assert "useIsAdmin" in panel
    assert "if (!isAdmin) return null" in panel
    assert "wiki-agent-panel" in panel
    assert "wiki-agent-admin-open" in panel
    assert "Draft on the board — you still approve." in panel
    assert "Wiki agent" in panel
    assert "What should the wiki page cover?" in panel
    assert chrome.is_file()
    # Rider 1: this packet must not modify AppChrome.
    # Presence of the file is not a touch; grep the git index at gate time.
