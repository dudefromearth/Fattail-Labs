"""Wiki API characterization (p-wiki WK2/WK6) — maps to Interface Spec §8.1 rows."""

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import auth
import db
import wiki_store
from config import get_config
from main import app

COOKIE = get_config().session_cookie

FIXTURE = """---
title: {title}
kind: topic
status: {status}
tags: []
sources: []
updated: 2026-07-27
---

# {title}

Zzwikitest convexity paragraph with a [[{link}]] wikilink.
"""


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _cookie(role: str) -> dict:
    token = auth.issue_session(identity_id=0, issuer="internal", role=role)
    return {COOKIE: token}


@pytest.fixture(scope="module")
def seeded_index(tmp_path_factory):
    """Fixture vault indexed into the dev DB; real index restored at teardown."""
    root = tmp_path_factory.mktemp("vault")
    (root / "wiki" / "topics").mkdir(parents=True)
    (root / "wiki" / "index.md").write_text("# map\n")
    (root / "wiki" / "topics" / "zzwikitest-pub.md").write_text(
        FIXTURE.format(title="Zzwikitest Published", status="published", link="zzwikitest-draft")
    )
    (root / "wiki" / "topics" / "zzwikitest-draft.md").write_text(
        FIXTURE.format(title="Zzwikitest Draft", status="draft", link="zzwikitest-pub")
    )
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    yield root
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    if raw and (Path(raw) / "wiki" / "index.md").is_file():
        with db.transaction() as conn:
            wiki_store.reindex(conn, Path(raw))


def test_anonymous_401_everywhere(client, seeded_index):
    for path in (
        "/api/wiki/index",
        "/api/wiki/pages/zzwikitest-pub",
        "/api/wiki/search?q=x",
        "/api/wiki/graph",
    ):
        assert client.get(path).status_code == 401, path
    assert client.post("/api/admin/wiki/reindex").status_code == 401


def test_draft_gate_member_404_admin_200(client, seeded_index):
    # WI10
    member = client.get("/api/wiki/pages/zzwikitest-draft", cookies=_cookie("observer"))
    assert member.status_code == 404
    admin = client.get(
        "/api/wiki/pages/zzwikitest-draft", cookies=_cookie("administrator")
    )
    assert admin.status_code == 200
    assert admin.json()["status"] == "draft"


def test_page_payload_backlinks_and_links(client, seeded_index):
    # WI3/WI4 — draft links here; member sees it unresolved, admin resolved
    page = client.get("/api/wiki/pages/zzwikitest-pub", cookies=_cookie("observer"))
    assert page.status_code == 200
    data = page.json()
    assert data["title"] == "Zzwikitest Published"
    assert data["links"][0]["slug"] == "zzwikitest-draft"
    assert data["links"][0]["resolved"] is False  # draft invisible to member
    admin = client.get(
        "/api/wiki/pages/zzwikitest-pub", cookies=_cookie("administrator")
    ).json()
    assert admin["links"][0]["resolved"] is True
    # backlink: draft page links to pub; member must NOT see a draft backlink
    assert data["backlinks"] == []
    assert admin["backlinks"][0]["slug"] == "zzwikitest-draft"


def test_search_published_only_with_snippet(client, seeded_index):
    r = client.get("/api/wiki/search?q=zzwikitest", cookies=_cookie("observer"))
    assert r.status_code == 200
    results = r.json()["results"]
    slugs = [x["slug"] for x in results]
    assert "zzwikitest-pub" in slugs
    assert "zzwikitest-draft" not in slugs  # draft never leaks via search
    hit = results[0]
    assert hit["snippet"] and "zzwikitest" in hit["snippet"].lower()


def test_graph_excludes_drafts_for_members(client, seeded_index):
    r = client.get("/api/wiki/graph", cookies=_cookie("observer"))
    assert r.status_code == 200
    data = r.json()
    node_slugs = {n["slug"] for n in data["nodes"]}
    assert "zzwikitest-pub" in node_slugs
    assert "zzwikitest-draft" not in node_slugs
    assert all(
        e["from"] in node_slugs and e["to"] in node_slugs for e in data["edges"]
    )


def test_index_payload_shape(client, seeded_index):
    r = client.get("/api/wiki/index", cookies=_cookie("observer"))
    assert r.status_code == 200
    data = r.json()
    assert "start_here" in data and "recent" in data and "kinds" in data
    assert all(p["status"] == "published" for p in data["start_here"])


def test_reindex_admin_only_and_counts(client, seeded_index):
    member = client.post("/api/admin/wiki/reindex", cookies=_cookie("observer"))
    assert member.status_code == 403
    admin = client.post("/api/admin/wiki/reindex", cookies=_cookie("administrator"))
    assert admin.status_code == 200
    counts = admin.json()
    assert counts["pages"] >= 1 and "unresolved_links" in counts
