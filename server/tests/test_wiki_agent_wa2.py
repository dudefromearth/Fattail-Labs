"""WA-2 pollers + Oscar discharge — Wiki Agent Spec v0.1.2."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import db
import wiki_agent_discharge as discharge
import wiki_agent_pointers as pointers
import wiki_agent_poller as poller
import wiki_agent_store as store
import wiki_store
from ai.types import CompletionResult
from config import get_config
from main import app
from tests.conftest import LabsTestClient, cookie_for
from wiki_agent_http import GetOnlyClient, WikiAgentHttpError

COOKIE = get_config().session_cookie
GUIDE = Path(__file__).resolve().parents[2] / "agents/p-wiki/hotel-agent-draft-guidelines.md"


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
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    # fixture overwrote env; restore real checkout index
    real = Path("/Users/ernie/lab-wiki")
    if (real / "wiki" / "index.md").is_file():
        os.environ["LABS_WIKI_ROOT"] = str(real)
        with db.transaction() as conn:
            wiki_store.reindex(conn, real)


def _safe_complete(messages, **kwargs):
    sysmsg = messages[0]["content"]
    assert "No invention" in sysmsg
    return CompletionResult(
        text=(
            "---\ntitle: Process page\nkind: concept\nstatus: draft\n"
            "tags: []\nsources: []\n---\n\n"
            "Defined risk. Size is the control. Process over outcomes.\n"
        ),
        provider="xai",
        model="test",
    )


def test_hotel_guidelines_on_disk():
    assert GUIDE.is_file()
    text = GUIDE.read_text()
    assert "No invention" in text
    assert "profit" in text.lower()


def test_poller_get_only_and_pointer_rows():
    catalog = {
        "courses": [
            {"id": "9", "slug": "zz-wa2-course", "title": "Process"},
        ]
    }
    detail = {
        "id": "9",
        "slug": "zz-wa2-course",
        "title": "Process",
        "description_md": "Defined risk.",
    }

    def get_json(url):
        if url == "/api/courses":
            return catalog
        if url == "/api/courses/zz-wa2-course":
            return detail
        raise LookupError(url)

    http = GetOnlyClient(get_json)
    events = poller.poll_courseware(http)
    assert http.calls == [
        ("GET", "/api/courses"),
        ("GET", "/api/courses/zz-wa2-course"),
    ]
    assert all(m == "GET" for m, _ in http.calls)
    with pytest.raises(WikiAgentHttpError, match="only GET"):
        http.request("POST", "/api/courses")
    assert pointers.count("courseware") >= 1
    assert events and events[0]["payload"]["change"] == "created"
    # unchanged second poll
    http2 = GetOnlyClient(get_json)
    ev2 = poller.poll_courseware(http2)
    assert ev2 == []


def test_help_poller_and_retire():
    def get_json(url):
        if url != "/help-catalog":
            raise LookupError(url)
        return {
            "articles": [
                {
                    "id": "kb-risk",
                    "title": "Defined risk",
                    "body": "Size is the control.",
                    "canonical_url": "/guide/risk",
                }
            ]
        }

    http = GetOnlyClient(get_json)
    ev = poller.poll_help(http, list_url="/help-catalog")
    assert ev[0]["source"] == "help"
    assert pointers.get("help", "help_article", "kb-risk")

    def empty(url):
        return {"articles": []}

    http_e = GetOnlyClient(empty)
    retired = poller.poll_help(http_e, list_url="/help-catalog")
    assert retired and retired[0]["payload"]["change"] == "retired"


def test_discharge_draft_board_member_404(git_vault, client, monkeypatch):
    monkeypatch.setattr(discharge, "complete", _safe_complete)
    body = {
        "id": "9",
        "title": "Process",
        "description_md": "Defined risk. Size is the control.",
    }
    http = GetOnlyClient(lambda url: body if url == "/api/courses/zz-wa2-course" else (_ for _ in ()).throw(LookupError(url)))
    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "courseware",
        "refs": [{"kind": "course", "id": "9", "canonical_url": "/course/zz-wa2-course"}],
        "payload": {
            "change": "created",
            "entity": {"kind": "course", "id": "9", "canonical_url": "/course/zz-wa2-course"},
            "summary": "Course created",
            "content_pointer": "/api/courses/zz-wa2-course",
        },
    }
    row = store.insert_contract(envelope=env, principal="wiki-poller", status="validated")
    out = discharge.discharge(row["contract_id"], http)
    assert out["status"] == "awaiting_approval"
    assert out["commit_shas"]
    assert out["board_card_ids"]
    slug = "wa2-courseware-9"
    with db.transaction() as conn:
        wiki_store.reindex(conn, git_vault)
    member = client.get(f"/api/wiki/pages/{slug}", cookies=cookie_for("observer"))
    assert member.status_code == 404
    admin = client.get(f"/api/wiki/pages/{slug}", cookies=cookie_for("administrator"))
    assert admin.status_code == 200
    assert admin.json()["status"] == "draft"
    assert discharge.PROFIT_RE.search(admin.json()["body_md"]) is None
    log = subprocess.check_output(
        ["git", "log", "-1", "--format=%s"], cwd=git_vault, text=True
    )
    assert row["contract_id"] in log


def test_updated_and_retired_annotate_not_delete(git_vault, monkeypatch):
    monkeypatch.setattr(discharge, "complete", _safe_complete)
    payload = {"id": "9", "title": "Process", "description_md": "Defined risk."}
    http = GetOnlyClient(lambda url: payload)
    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "courseware",
        "refs": [{"kind": "course", "id": "9", "canonical_url": "/course/x"}],
        "payload": {
            "change": "updated",
            "entity": {"kind": "course", "id": "9", "canonical_url": "/course/x"},
            "summary": "updated",
            "content_pointer": "/pointer",
        },
    }
    row = store.insert_contract(envelope=env, principal="wiki-poller", status="validated")
    discharge.discharge(row["contract_id"], http)
    rel = Path("wiki/concepts/wa2-courseware-9.md")
    assert (git_vault / rel).is_file()
    env2 = dict(env)
    env2["payload"] = dict(env["payload"], change="retired", summary="gone")
    row2 = store.insert_contract(envelope=env2, principal="wiki-poller", status="validated")
    discharge.discharge(row2["contract_id"], http)
    text = (git_vault / rel).read_text()
    assert (git_vault / rel).is_file()
    assert "retired" in text.lower()


def test_bad_pointer_at_start_failed_no_partial(git_vault):
    def boom(url):
        raise WikiAgentHttpError("404")

    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "courseware",
        "refs": [{"kind": "course", "id": "missing", "canonical_url": "/course/missing"}],
        "payload": {
            "change": "updated",
            "entity": {"kind": "course", "id": "missing", "canonical_url": "/course/missing"},
            "summary": "x",
            "content_pointer": "/missing",
        },
    }
    row = store.insert_contract(envelope=env, principal="wiki-poller", status="validated")
    out = discharge.discharge(row["contract_id"], GetOnlyClient(boom))
    assert out["status"] == "failed"
    assert "bad_pointer" in out["failure_reason"]
    assert out["board_card_ids"] == []


def test_failed_partial_after_draft_bytes(git_vault, monkeypatch):
    monkeypatch.setattr(discharge, "complete", _safe_complete)

    def boom_commit(*a, **k):
        raise RuntimeError("induced git fail")

    monkeypatch.setattr(discharge.wiki_agent_git, "commit_paths", boom_commit)
    http = GetOnlyClient(lambda url: {"id": "7", "title": "X", "description_md": "Defined risk."})
    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "help",
        "refs": [{"kind": "help_article", "id": "7", "canonical_url": "/guide/x"}],
        "payload": {
            "change": "created",
            "entity": {"kind": "help_article", "id": "7", "canonical_url": "/guide/x"},
            "summary": "new",
            "content_pointer": "/guide/x",
        },
    }
    row = store.insert_contract(envelope=env, principal="wiki-poller", status="validated")
    out = discharge.discharge(row["contract_id"], http)
    assert out["status"] == "failed"
    assert out["board_card_ids"]
    rel = git_vault / "wiki/concepts/wa2-help-7.md"
    assert rel.is_file()
    import board

    card = board.get_item(int(out["board_card_ids"][0]))
    assert "failed-partial" in card["title"]


def test_profit_claim_fails_before_write(git_vault, monkeypatch):
    def bad(messages, **kwargs):
        return CompletionResult(
            text="This strategy is profitable.", provider="xai", model="t"
        )

    monkeypatch.setattr(discharge, "complete", bad)
    http = GetOnlyClient(lambda url: {"id": "1"})
    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "courseware",
        "refs": [{"kind": "course", "id": "1", "canonical_url": "/course/1"}],
        "payload": {
            "change": "created",
            "entity": {"kind": "course", "id": "1", "canonical_url": "/course/1"},
            "summary": "x",
            "content_pointer": "/p",
        },
    }
    row = store.insert_contract(envelope=env, principal="wiki-poller", status="validated")
    out = discharge.discharge(row["contract_id"], http)
    assert out["status"] == "failed"
    assert out["failure_reason"] == "profit_claim"


def test_real_courses_list_is_get(client):
    calls = []

    def get_json(url):
        calls.append(("GET", url))
        r = client.get(url)
        assert r.status_code == 200
        return r.json()

    http = GetOnlyClient(get_json)
    poller.poll_courseware(http)
    assert calls and all(m == "GET" for m, u in calls)
    assert calls[0] == ("GET", "/api/courses")
