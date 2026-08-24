"""SC-3 P2 poll — GET-only S1/S2, L10 hash wins, disposition always."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import db
import wiki_agent_pointers as pointers
import wiki_agent_poller as poller
import wiki_agent_push as push
import wiki_agent_store as store
import wiki_store
from wiki_agent_http import GetOnlyClient, WikiAgentHttpError

FAT = (
    "Size is the control. Traders name max loss before they name the entry. "
    "The page maps defined risk as a process outcome, not a promise. "
    "Keep the named failure states visible. Adherence is the metric. "
    "Drawdown is a process number when the source names it. "
    "Do not treat a template as a finished market. "
    "Stay with listed strikes and honest marks. "
    "Capital preservation is the first step. "
    "The wiki records the method, not a scoreboard."
)


@pytest.fixture()
def git_vault(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_NAME", "wiki-agent")
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_EMAIL", "wiki-agent@labs.fattail.ai")
    root = tmp_path / "vault"
    (root / "wiki" / "topics").mkdir(parents=True)
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
                ("zz-sc3-%",),
            )
            cur.execute(
                "DELETE FROM wiki_pointers WHERE ref_id LIKE %s",
                ("zz-sc3-%",),
            )


def _course_http(body: str, *, slug: str = "zz-sc3-course", cid: str = "zz-sc3-9"):
    catalog = {"courses": [{"id": cid, "slug": slug, "title": "Process", "status": "published"}]}
    detail = {
        "id": cid,
        "slug": slug,
        "title": "Process",
        "status": "published",
        "description_md": body,
    }

    def get_json(url):
        if url == "/api/courses":
            return catalog
        if url == f"/api/courses/{slug}":
            return detail
        raise LookupError(url)

    return GetOnlyClient(get_json), detail


def test_poller_get_only():
    http, _ = _course_http(FAT)
    poller.poll_courses_source(http, land=False)
    assert http.calls == [
        ("GET", "/api/courses"),
        ("GET", "/api/courses/zz-sc3-course"),
    ]
    assert all(m == "GET" for m, _ in http.calls)
    with pytest.raises(WikiAgentHttpError, match="only GET"):
        http.request("POST", "/api/courses")


def test_l10_signal_new_same_hash_no_compose(git_vault):
    digest = push.content_hash(FAT)
    store.upsert_watermark(
        source_kind="course",
        source_id="zz-sc3-9",
        content_hash=digest,
        contract_id="01sc3l10hashwin00000000000",
    )
    assert pointers.get("courseware", "course", "zz-sc3-9") is None
    http, _ = _course_http(FAT)
    rows = poller.poll_courses_source(http, land=True)
    assert len(rows) == 1
    row = rows[0]
    assert row["signal"] == "created"
    assert row["content_hash"] == digest
    assert row["reason"] == "hash_unchanged"
    assert row["composed"] is False
    assert row["page_path"] == ""
    assert list((git_vault / "wiki" / "topics").glob("sc3-*.md")) == []
    log = subprocess.check_output(["git", "log", "--oneline"], cwd=git_vault, text=True)
    assert log.strip().count("\n") + 1 == 1


def test_published_change_envelope_and_watermark(git_vault):
    http, _ = _course_http(FAT)
    rows = poller.poll_courses_source(http, land=True)
    assert len(rows) == 1
    row = rows[0]
    assert row["status"] == "accepted"
    assert row["composed"] is True
    assert row["content_hash"]
    wm = store.get_watermark("course", "zz-sc3-9")
    assert wm is not None
    assert wm["content_hash"] == row["content_hash"]
    assert (git_vault / row["page_path"]).is_file()
    http2, _ = _course_http(FAT)
    again = poller.poll_courses_source(http2, land=True)
    assert again[0]["reason"] == "hash_unchanged"
    assert again[0]["composed"] is False


def test_missing_signal_still_hashes():
    digest = push.content_hash(FAT)
    store.upsert_watermark(
        source_kind="course",
        source_id="zz-sc3-9",
        content_hash=digest,
        contract_id="01sc3nosig0000000000000000",
    )
    http, _ = _course_http(FAT)
    rows = poller.poll_courses_source(http, land=False)
    assert rows[0]["reason"] == "hash_unchanged"
    assert all(m == "GET" for m, _ in http.calls)


def test_help_source_and_draft_skipped():
    def get_json(url):
        if url != "/help-catalog":
            raise LookupError(url)
        return {
            "articles": [
                {
                    "id": "zz-sc3-help",
                    "title": "Defined risk",
                    "body": FAT,
                    "canonical_url": "/guide/risk",
                    "status": "published",
                },
                {
                    "id": "zz-sc3-draft",
                    "title": "WIP",
                    "body": FAT,
                    "status": "draft",
                },
            ]
        }

    http = GetOnlyClient(get_json)
    rows = poller.poll_help_source(http, list_url="/help-catalog", land=False)
    assert all(m == "GET" for m, _ in http.calls)
    ids = {r["source_id"] for r in rows}
    assert ids == {"zz-sc3-help"}
    assert rows[0]["source_kind"] == "help_guide"
    assert rows[0]["status"] == "accepted"


def test_tick_script_names_local_cadence_not_minitwo():
    text = (Path(__file__).resolve().parents[1] / "wiki_source_poll_tick.py").read_text()
    assert "15 minutes" in text
    assert "MiniTwo is NOT required" in text
    assert "GetOnlyClient" in text
