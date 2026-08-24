"""SC-2 S7 push — artifact + intent, L12 no retry, hash on land."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import db
import wiki_agent_store as store
import wiki_store
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_wiki_agent_portal import _agent

ROOT = Path(__file__).resolve().parents[2]

FAT = (
    "# Defined risk as process control\n\n"
    "Size is the control. Traders name max loss before they name the entry. "
    "The page maps defined risk as a process outcome, not a promise. "
    "Keep the named failure states visible. Adherence is the metric. "
    "Drawdown is a process number when the source names it. "
    "Do not treat a template as a finished market. "
    "Stay with listed strikes and honest marks. "
    "Capital preservation is the first step. "
    "The wiki records the method, not a scoreboard."
)


@pytest.fixture(autouse=True)
def context_providers(monkeypatch):
    monkeypatch.setenv("LABS_WIKI_CONTEXT_PROVIDERS", "hub=/app")


@pytest.fixture()
def git_vault(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_NAME", "wiki-agent")
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_EMAIL", "wiki-agent@labs.fattail.ai")
    root = tmp_path / "vault"
    (root / "wiki" / "topics").mkdir(parents=True)
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


def setup_function() -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_source_watermarks WHERE source_id LIKE %s",
                ("admin-push-%",),
            )


def test_l12_thin_failed_partial_no_retry_no_page(git_vault):
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("administrator"),
            json={"artifact": "WIP", "intent": "note"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "failed-partial"
        assert data["reason"] == "insufficient_substance:too_thin"
        assert data["retries"] == 0
        assert data["page_path"] == ""
        assert data["payload"]["content_hash"]
        assert store.get_watermark(
            "admin_push", data["payload"]["source_id"]
        ) is None
        topics = list((git_vault / "wiki" / "topics").glob("sc2-*.md"))
        assert topics == []
        again = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("administrator"),
            json={"artifact": "WIP", "intent": "note"},
        )
        assert again.status_code == 200
        assert again.json()["retries"] == 0
        assert again.json()["status"] == "failed-partial"
        assert list((git_vault / "wiki" / "topics").glob("sc2-*.md")) == []
        log = subprocess.check_output(
            ["git", "log", "--oneline"], cwd=git_vault, text=True
        )
        assert log.strip().count("\n") + 1 == 1


def test_p1_land_records_hash_and_draft(git_vault):
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("administrator"),
            json={"artifact": FAT, "intent": "Member map of defined risk."},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "accepted"
        assert data["retries"] == 0
        digest = data["payload"]["content_hash"]
        assert len(digest) == 64
        assert data["watermark"]["content_hash"] == digest
        rel = data["page_path"]
        assert rel.startswith("wiki/topics/")
        assert (git_vault / rel).is_file()
        text = (git_vault / rel).read_text()
        assert "status: draft" in text
        assert "Size is the control" in text
        assert "profitable" not in text.lower()
        got = store.get_watermark("admin_push", data["payload"]["source_id"])
        assert got is not None
        assert got["content_hash"] == digest


def test_profit_claim_no_page(git_vault):
    body = FAT + " This fly is profitable if you size it."
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("administrator"),
            json={"artifact": body, "intent": "map"},
        )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "failed-partial"
    assert r.json()["reason"] == "profit_claim"
    assert list((git_vault / "wiki" / "topics").glob("sc2-*.md")) == []


def test_push_admin_only_and_no_schema_fields():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        obs = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("observer"),
            json={"artifact": FAT, "intent": "map"},
        )
        assert obs.status_code in (401, 403)
        key, _ = _agent("zz-sc2-bot", ["contracts:deliver"])
        ag = client.post(
            "/api/wiki-agent/push",
            headers={"Authorization": f"Bearer {key}"},
            json={"artifact": FAT, "intent": "map"},
        )
        assert ag.status_code == 403
        extra = client.post(
            "/api/wiki-agent/push",
            cookies=cookie_for("administrator"),
            json={
                "artifact": FAT,
                "intent": "map",
                "source_kind": "admin_push",
                "content_hash": "nope",
            },
        )
        assert extra.status_code == 400


def test_session_still_opens():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
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
    assert r.json()["kind"] == "session"
    assert r.json()["status"] == "validated"


def test_panel_artifact_intent_not_schema_form():
    panel = (ROOT / "web/components/wiki/WikiAgentPanel.tsx").read_text()
    layout = (ROOT / "web/app/app/wiki/layout.tsx").read_text()
    chrome = ROOT / "web/components/AppChrome.tsx"
    assert "if (!isAdmin) return null" in panel
    assert "wiki-agent-artifact" in panel
    assert "wiki-agent-intent" in panel
    assert "wiki-agent-handoff" in panel
    assert "Paste the finished page" in panel
    assert "source_kind" not in panel
    assert "content_hash" not in panel
    assert "origin_ref" not in panel
    assert "body_format" not in panel
    assert 'from "@/components/AppChrome"' not in panel
    assert 'from "@/components/AppChrome"' not in layout
    assert "HelpLauncher" not in panel
    assert "What should the wiki page cover?" in panel
    assert chrome.is_file()
