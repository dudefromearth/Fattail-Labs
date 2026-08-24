"""WU-2 public wiki read — Wiki Spec v0.2.1 III.2."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

import db
import wiki_store
from main import app
from tests.conftest import LabsTestClient, cookie_for

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = """---
title: {title}
kind: topic
status: {status}
tags: []
sources: []
updated: 2026-08-23
---

# {title}

Public map of defined risk. Size is the control. Process over outcomes.
"""


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


@pytest.fixture()
def vault(tmp_path):
    root = tmp_path / "vault"
    (root / "wiki" / "topics").mkdir(parents=True)
    (root / "wiki" / "index.md").write_text("# map\n")
    pub = root / "wiki" / "topics" / "zz-wu2-pub.md"
    draft = root / "wiki" / "topics" / "zz-wu2-draft.md"
    pub.write_text(
        FIXTURE.format(title="Wu2 Published", status="published")
    )
    draft.write_text(FIXTURE.format(title="Wu2 Draft", status="draft"))
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    yield root, pub, draft
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    if raw and (Path(raw) / "wiki" / "index.md").is_file():
        with db.transaction() as conn:
            wiki_store.reindex(conn, Path(raw))


def test_anon_published_200_draft_404(client, vault):
    pub = client.get("/api/wiki/pages/zz-wu2-pub")
    assert pub.status_code == 200, pub.text
    assert pub.json()["status"] == "published"
    assert "identity_id" not in pub.json()
    assert pub.json()["lead"]
    assert client.get("/api/wiki/pages/zz-wu2-draft").status_code == 404
    member = client.get(
        "/api/wiki/pages/zz-wu2-draft", cookies=cookie_for("navigator")
    )
    assert member.status_code == 404
    admin = client.get(
        "/api/wiki/pages/zz-wu2-draft", cookies=cookie_for("administrator")
    )
    assert admin.status_code == 200
    assert admin.json()["status"] == "draft"


def test_unpublish_drops_public_and_sitemap(client, vault):
    _root, pub, _draft = vault
    assert client.get("/api/wiki/pages/zz-wu2-pub").status_code == 200
    sm = client.get("/api/wiki/sitemap")
    assert sm.status_code == 200
    slugs = [p["slug"] for p in sm.json()["pages"]]
    assert "zz-wu2-pub" in slugs
    assert "zz-wu2-draft" not in slugs
    pub.write_text(FIXTURE.format(title="Wu2 Published", status="draft"))
    with db.transaction() as conn:
        wiki_store.reindex(conn, _root)
    assert client.get("/api/wiki/pages/zz-wu2-pub").status_code == 404
    slugs2 = [p["slug"] for p in client.get("/api/wiki/sitemap").json()["pages"]]
    assert "zz-wu2-pub" not in slugs2


def test_contamination_and_family_b_absent():
    wiki_dir = ROOT / "web/app/app/wiki"
    entry = (wiki_dir / "page.tsx").read_text()
    article = (wiki_dir / "[slug]/page.tsx").read_text()
    search = (wiki_dir / "search/page.tsx").read_text()
    graph = (wiki_dir / "graph/page.tsx").read_text()
    for text in (entry, article, search, graph):
        assert "Sign in to" not in text
    assert 'title: "In your practice"' not in article
    jsonld = (ROOT / "web/lib/wiki/articleJsonLd.ts").read_text()
    assert '@type": "Article"' in jsonld
    assert '@type": "Course"' not in jsonld
    assert '@type": "Offer"' not in jsonld
    sitemap = (ROOT / "web/app/sitemap.ts").read_text()
    assert "/api/wiki/sitemap" in sitemap
    assert (ROOT / "agents/p-wiki/reviews/WU-2-0-sierra.md").is_file()
    assert (ROOT / "agents/p-wiki/reviews/WU-2-1-mike.md").is_file()


def test_freeze_untouched():
    # Presence only — git diff --stat at the gate.
    assert (ROOT / "web/components/AppChrome.tsx").is_file()
    assert (ROOT / "web/app/layout.tsx").is_file()
    assert (ROOT / "web/components/HelpLauncher.tsx").is_file()
