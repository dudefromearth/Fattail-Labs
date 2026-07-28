"""Wiki store characterization (p-wiki WK1) — parser, loader, reindex idempotency."""

import os
from pathlib import Path

import pytest

import db
import wiki_store
from config import ConfigError

PAGE = """---
title: {title}
kind: {kind}
status: {status}
tags: [alpha, beta]
sources: ["raw/sessions/x.md"]
updated: 2026-07-27
---

# {title}

Body with a [[{link}]] link and a labeled [[{link}|nice label]] repeat.
"""


def make_vault(tmp_path: Path) -> Path:
    root = tmp_path / "vault"
    (root / "wiki" / "topics").mkdir(parents=True)
    (root / "wiki" / "glossary").mkdir(parents=True)
    (root / "wiki").joinpath("index.md").write_text("# map\n")
    (root / "wiki" / "topics" / "alpha-topic.md").write_text(
        PAGE.format(title="Alpha Topic", kind="topic", status="published", link="beta-term")
    )
    (root / "wiki" / "topics" / "draft-topic.md").write_text(
        PAGE.format(title="Draft Topic", kind="topic", status="draft", link="alpha-topic")
    )
    (root / "wiki" / "glossary" / "beta-term.md").write_text(
        PAGE.format(title="Beta Term", kind="glossary", status="published", link="missing-page")
    )
    (root / "wiki" / "topics" / "no-frontmatter.md").write_text("just prose\n")
    return root


def test_wiki_root_fail_loud(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_WIKI_ROOT", "")
    with pytest.raises(ConfigError):
        wiki_store.wiki_root()
    monkeypatch.setenv("LABS_WIKI_ROOT", str(tmp_path))  # dir but not a checkout
    with pytest.raises(ConfigError):
        wiki_store.wiki_root()


def test_parse_frontmatter_and_lists():
    meta, body = wiki_store.parse_frontmatter(
        '---\ntitle: X\ntags: [a, "b c"]\nsources: []\n---\n\nBody\n'
    )
    assert meta["title"] == "X"
    assert wiki_store._parse_list(meta["tags"]) == ["a", "b c"]
    assert wiki_store._parse_list(meta["sources"]) == []
    assert body.startswith("Body")


def test_parse_wikilinks_dedup_and_labels():
    links = wiki_store.parse_wikilinks("[[a]] then [[a|label]] then [[b-c]]")
    assert links == ["a", "b-c"]


def test_load_pages_tolerant(tmp_path):
    root = make_vault(tmp_path)
    pages, warnings = wiki_store.load_pages(root)
    slugs = {p.slug for p in pages}
    assert slugs == {"alpha-topic", "draft-topic", "beta-term"}
    assert any("no-frontmatter" in w for w in warnings)
    alpha = next(p for p in pages if p.slug == "alpha-topic")
    assert alpha.status == "published" and alpha.kind == "topic"
    assert alpha.links == ["beta-term"]


def test_reindex_counts_and_idempotency(tmp_path):
    root = make_vault(tmp_path)
    with db.transaction() as conn:
        first = wiki_store.reindex(conn, root)
    with db.transaction() as conn:
        second = wiki_store.reindex(conn, root)
    assert first == second
    assert first["pages"] == 3
    assert first["published"] == 2
    assert first["drafts"] == 1
    assert first["unresolved_links"] == 1  # beta-term -> missing-page
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM wiki_pages_idx")
            assert cur.fetchone()["n"] == 3
            cur.execute(
                "SELECT resolved FROM wiki_links_idx WHERE from_slug='beta-term'"
            )
            assert cur.fetchone()["resolved"] == 0


@pytest.fixture(scope="session", autouse=True)
def restore_real_index():
    """After the suite, rebuild the index from the real checkout so the dev DB
    reflects LABS_WIKI_ROOT again (tests replace it with fixture vaults)."""
    yield
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    if raw and (Path(raw) / "wiki" / "index.md").is_file():
        with db.transaction() as conn:
            wiki_store.reindex(conn, Path(raw))
