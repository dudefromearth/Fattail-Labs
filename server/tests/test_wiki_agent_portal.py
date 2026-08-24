"""WA-1 portal characterization — Wiki Agent Spec v0.1.2."""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import agent_auth
import auth
import db
import wiki_agent_git
import wiki_agent_store as store
import wiki_store
from config import get_config
from main import app
from tests.conftest import LabsTestClient, cookie_for

COOKIE = get_config().session_cookie


@pytest.fixture(autouse=True)
def context_providers(monkeypatch):
    monkeypatch.setenv("LABS_WIKI_CONTEXT_PROVIDERS", "hub=/app")


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _agent(callsign: str, scopes: list[str]) -> tuple[str, str]:
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
    minted = agent_auth.mint_key(pid, name="wa1", scopes=scopes)
    return minted["key"], callsign


def _source_body(source: str = "courseware") -> dict:
    return {
        "contract_version": "1",
        "kind": "source_change",
        "source": source,
        "refs": [
            {
                "kind": "lesson",
                "id": "42",
                "canonical_url": "/course/probe/lesson/42",
            }
        ],
        "payload": {
            "change": "updated",
            "entity": {
                "kind": "lesson",
                "id": "42",
                "canonical_url": "/course/probe/lesson/42",
            },
            "summary": "Lesson title changed.",
            "content_pointer": "/api/lessons/42",
        },
    }


def test_schema_invalid_rejected_ledger(client):
    key, _ = _agent("zz-wa1-schema", ["contracts:deliver"])
    store.upsert_source(
        "zz-src-schema",
        principal_callsign="zz-wa1-schema",
        allowed_kind="source_change",
    )
    r = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        json={"contract_version": "1", "kind": "nope", "source": "zz-src-schema", "payload": {}},
    )
    assert r.status_code == 400, r.text
    detail = r.json()["detail"]
    assert detail["reject_reason"] == "schema_invalid"
    cid = detail["contract_id"]
    got = store.get_contract(cid)
    assert got["status"] == "rejected"
    assert got["reject_reason"] == "schema_invalid"


def test_unregistered_principal_valid_schema_distinct(client):
    key, _ = _agent("zz-wa1-stranger", ["contracts:deliver"])
    store.upsert_source(
        "zz-src-stranger",
        principal_callsign="zz-wa1-owner",
        allowed_kind="source_change",
    )
    r = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        json=_source_body("zz-src-stranger"),
    )
    assert r.status_code == 403, r.text
    detail = r.json()["detail"]
    assert detail["reject_reason"] == "unregistered_principal"
    assert detail["reject_reason"] != "schema_invalid"
    got = store.get_contract(detail["contract_id"])
    assert got["status"] == "rejected"


def test_valid_registered_agent_returns_contract_id(client):
    key, cs = _agent("zz-wa1-courseware", ["contracts:deliver"])
    store.upsert_source(
        "zz-src-ok",
        principal_callsign=cs,
        allowed_kind="source_change",
    )
    r = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        json=_source_body("zz-src-ok"),
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "validated"
    assert data["contract_id"]
    assert data["sealed_at"] is None
    assert "body_md" not in data
    g = client.get(
        f"/api/wiki-agent/contracts/{data['contract_id']}",
        headers={"Authorization": f"Bearer {key}"},
    )
    assert g.status_code == 200
    assert g.json()["contract_id"] == data["contract_id"]
    assert g.json()["status"] == "validated"


def test_reindex_scope_cannot_deliver(client):
    key, cs = _agent("zz-wa1-reindex", ["wiki:reindex"])
    store.upsert_source(
        "zz-src-reindex",
        principal_callsign=cs,
        allowed_kind="source_change",
    )
    r = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        json=_source_body("zz-src-reindex"),
    )
    assert r.status_code == 403


def test_session_open_admin_cookie_no_sealed_transcript(client):
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("administrator"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "refs": [],
            "payload": {
                "context": {"surface": "wiki", "route": "/app/wiki", "entity": None}
            },
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["kind"] == "session"
    assert data["status"] == "validated"
    assert data["sealed_at"] is None
    transcript = data["payload"]["transcript"]
    assert transcript and transcript[0]["role"] == "agent"
    assert "wiki" in transcript[0]["content"]
    assert "/app/wiki" in transcript[0]["content"]
    assert data["payload"]["admin"] == 0


def test_session_rejects_agent_bearer(client):
    key, _ = _agent("zz-wa1-session-bot", ["contracts:deliver"])
    r = client.post(
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
    assert r.status_code == 403
    assert r.json()["detail"]["reject_reason"] == "session_requires_human"


def test_observer_cannot_open_session(client):
    r = client.post(
        "/api/wiki-agent/contracts",
        cookies=cookie_for("observer"),
        json={
            "contract_version": "1",
            "kind": "session",
            "source": "admin-session",
            "payload": {"context": {"surface": "wiki", "route": "/app/wiki"}},
        },
    )
    assert r.status_code in (401, 403)


def test_family_b_ref_rejected(client):
    key, cs = _agent("zz-wa1-fam", ["contracts:deliver"])
    store.upsert_source(
        "zz-src-fam",
        principal_callsign=cs,
        allowed_kind="source_change",
    )
    body = _source_body("zz-src-fam")
    body["refs"][0]["canonical_url"] = "/app/trade-log/1"
    body["payload"]["entity"]["canonical_url"] = "/app/trade-log/1"
    r = client.post(
        "/api/wiki-agent/contracts",
        headers={"Authorization": f"Bearer {key}"},
        json=body,
    )
    assert r.status_code == 400
    assert r.json()["detail"]["reject_reason"] == "family_b_ref"


def test_fixture_git_commit_contains_contract_id(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_NAME", "wiki-agent")
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_EMAIL", "wiki-agent@labs.fattail.ai")
    root = tmp_path / "vault"
    (root / "wiki" / "concepts").mkdir(parents=True)
    (root / "wiki" / "index.md").write_text("# map\n")
    subprocess.run(["git", "init"], cwd=root, check=True, capture_output=True)
    subprocess.run(["git", "add", "-A"], cwd=root, check=True)
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
    cid = "01TESTCONTRACTULID00000001"[:26]
    body = (
        "---\ntitle: WA-1 fixture\nkind: concept\nstatus: draft\n"
        f"session_contract_id: {cid}\n---\n\n# WA-1 fixture\n"
    )
    sha = wiki_agent_git.commit_fixture_draft(
        root,
        contract_id=cid,
        relative_path="wiki/concepts/wa1-fixture.md",
        body=body,
    )
    log = subprocess.check_output(
        ["git", "log", "-1", "--format=%s%n%an%n%ae"], cwd=root, text=True
    )
    assert cid in log
    assert "wiki-agent" in log
    assert sha
    # Did not reindex member DB.
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM wiki_pages_idx")
            n = cur.fetchone()["n"]
    raw = __import__("os").environ.get("LABS_WIKI_ROOT", "").strip()
    if raw and (Path(raw) / "wiki" / "index.md").is_file():
        pages, _ = wiki_store.load_pages(Path(raw))
        assert n == len(pages)
