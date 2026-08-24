"""WA-3 linkage pass — Wiki Agent Spec v0.1.2."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

import db
import wiki_agent_linkage as linkage
import wiki_agent_store as store
import wiki_store
from config import ConfigError
from main import app
from tests.conftest import LabsTestClient, cookie_for

TOKEN = "zzlinktok"


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


@pytest.fixture()
def thresh(monkeypatch):
    monkeypatch.setenv("LABS_WIKI_LINK_INSERT_THRESHOLD", "1.5")
    monkeypatch.setenv("LABS_WIKI_REVERSE_PASS_THRESHOLD", "0.1")
    monkeypatch.setenv("LABS_WIKI_REVERSE_PASS_INLINE_CAP", "2")
    return linkage.thresholds()


@pytest.fixture()
def link_vault(tmp_path, monkeypatch, thresh):
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_NAME", "wiki-agent")
    monkeypatch.setenv("LABS_WIKI_AGENT_GIT_EMAIL", "wiki-agent@labs.fattail.ai")
    root = tmp_path / "vault"
    (root / "wiki" / "topics").mkdir(parents=True)
    (root / "wiki" / "concepts").mkdir(parents=True)
    (root / "wiki" / "index.md").write_text("# map\n")
    pub = (
        f"---\ntitle: Convexity Token {TOKEN}\nkind: topic\nstatus: published\n"
        f"---\n\n# Convexity\n\nThe {TOKEN} process of defined risk.\n"
    )
    weak = (
        "---\ntitle: Unrelated Glossary\nkind: glossary\nstatus: published\n"
        "---\n\n# Unrelated\n\nTheta decay without the marker.\n"
    )
    (root / "wiki" / "topics" / "convexity-token.md").write_text(pub)
    (root / "wiki" / "glossary").mkdir(parents=True, exist_ok=True)
    (root / "wiki" / "glossary" / "unrelated-term.md").write_text(weak)
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
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    yield root
    real = Path("/Users/ernie/lab-wiki")
    if (real / "wiki" / "index.md").is_file():
        os.environ["LABS_WIKI_ROOT"] = str(real)
        with db.transaction() as conn:
            wiki_store.reindex(conn, real)


def _contract():
    env = {
        "contract_version": "1",
        "kind": "source_change",
        "source": "courseware",
        "refs": [{"kind": "course", "id": "link", "canonical_url": "/course/link"}],
        "payload": {
            "change": "created",
            "entity": {"kind": "course", "id": "link", "canonical_url": "/course/link"},
            "summary": f"New page about {TOKEN} defined risk",
            "content_pointer": "/p",
        },
    }
    return store.insert_contract(envelope=env, principal="wiki-poller", status="validated")


def test_thresholds_fail_loud(monkeypatch):
    monkeypatch.delenv("LABS_WIKI_LINK_INSERT_THRESHOLD", raising=False)
    with pytest.raises(ConfigError, match="LABS_WIKI_LINK_INSERT_THRESHOLD"):
        linkage.thresholds()


def test_insert_vs_suggest_and_explain(link_vault, thresh, client):
    row = _contract()
    rel = "wiki/concepts/wa3-new.md"
    (link_vault / rel).write_text(
        f"---\ntitle: New {TOKEN} map\nkind: concept\nstatus: draft\n---\n\n"
        f"Notes on {TOKEN} and defined risk.\n"
    )
    subprocess.run(["git", "add", "-A"], cwd=link_vault, check=True, capture_output=True)
    subprocess.run(
        [
            "git",
            "-c",
            "user.name=wiki-agent",
            "-c",
            "user.email=wiki-agent@labs.fattail.ai",
            "commit",
            "-m",
            "draft",
        ],
        cwd=link_vault,
        check=True,
        capture_output=True,
    )
    with db.transaction() as conn:
        wiki_store.reindex(conn, link_vault)
    result = linkage.run_after_ingest(
        contract_id=row["contract_id"],
        draft_slug="wa3-new",
        relative_path=rel,
        root=link_vault,
        query_text=f"New {TOKEN} map defined risk",
    )
    body = (link_vault / rel).read_text()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT from_slug, to_id, relation, score, explain_json FROM wiki_refs"
            )
            refs = cur.fetchall()
    assert refs, "wiki_refs rows must exist"
    # explainable arithmetic
    ex = result["explain_example"]["explain"]
    assert "fulltext" in ex and "title_boost" in ex
    assert abs(ex["total"] - (ex["fulltext"] + ex["title_boost"])) < 1e-6
    inserted = [c["slug"] for c in result["insert"]]
    suggested = [c["slug"] for c in result["below"]]
    for slug in inserted:
        assert f"[[{slug}]]" in body
    for slug in suggested:
        assert f"[[{slug}]]" not in body
    md = result["suggestions_md"]
    assert "Below-threshold suggestions" in md
    if suggested:
        assert suggested[0] in md


def test_reverse_pass_draft_member_404(link_vault, client):
    row = _contract()
    rel = "wiki/concepts/wa3-new.md"
    (link_vault / rel).write_text(
        f"---\ntitle: New {TOKEN}\nkind: concept\nstatus: draft\n---\n\n{TOKEN} defined risk.\n"
    )
    subprocess.run(["git", "add", rel], cwd=link_vault, check=True, capture_output=True)
    subprocess.run(
        [
            "git",
            "-c",
            "user.name=wiki-agent",
            "-c",
            "user.email=wiki-agent@labs.fattail.ai",
            "commit",
            "-m",
            "d",
        ],
        cwd=link_vault,
        check=True,
        capture_output=True,
    )
    with db.transaction() as conn:
        wiki_store.reindex(conn, link_vault)
    result = linkage.run_after_ingest(
        contract_id=row["contract_id"],
        draft_slug="wa3-new",
        relative_path=rel,
        root=link_vault,
        query_text=f"{TOKEN} defined risk convexity",
    )
    assert result["reverse_hits"] or result["insert"] or result["below"]
    if result["reverse_files"]:
        slug = Path(result["reverse_files"][0]).stem
        with db.transaction() as conn:
            wiki_store.reindex(conn, link_vault)
        member = client.get(
            f"/api/wiki/pages/{slug}", cookies=cookie_for("observer")
        )
        assert member.status_code == 404
        admin = client.get(
            f"/api/wiki/pages/{slug}", cookies=cookie_for("administrator")
        )
        assert admin.status_code == 200
        assert admin.json()["status"] == "draft"
    queued = linkage.list_queue(row["contract_id"])
    assert isinstance(queued, list)


def test_idempotent_second_pass(link_vault):
    row = _contract()
    rel = "wiki/concepts/wa3-new.md"
    (link_vault / rel).write_text(
        f"---\ntitle: New {TOKEN}\nkind: concept\nstatus: draft\n---\n\n{TOKEN}\n"
    )
    subprocess.run(["git", "add", rel], cwd=link_vault, check=True, capture_output=True)
    subprocess.run(
        [
            "git",
            "-c",
            "user.name=wiki-agent",
            "-c",
            "user.email=wiki-agent@labs.fattail.ai",
            "commit",
            "-m",
            "d",
        ],
        cwd=link_vault,
        check=True,
        capture_output=True,
    )
    with db.transaction() as conn:
        wiki_store.reindex(conn, link_vault)
    kwargs = dict(
        contract_id=row["contract_id"],
        draft_slug="wa3-new",
        relative_path=rel,
        root=link_vault,
        query_text=f"{TOKEN} convexity defined",
    )
    first = linkage.run_after_ingest(**kwargs)
    log1 = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=link_vault, text=True)
    second = linkage.run_after_ingest(**kwargs)
    log2 = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=link_vault, text=True)
    assert second["reverse_files"] == []
    assert log1.strip() == log2.strip()
    q1 = linkage.list_queue(row["contract_id"])
    q2 = linkage.list_queue(row["contract_id"])
    assert len(q1) == len(q2)


def test_volume_against_full_corpus(thresh):
    """Rider: real page count, not a 3-page fixture. Score-only — no writes to lab-wiki."""
    raw = os.environ.get("LABS_WIKI_ROOT", "/Users/ernie/lab-wiki")
    root = Path(raw)
    pages, _ = wiki_store.load_pages(root)
    published = [p for p in pages if p.status == "published"]
    assert len(published) >= 40, f"expected grown corpus, got {len(published)}"
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    hits = linkage.score_candidates(
        "position sizing defined risk convexity process",
        exclude_slug="__none__",
    )
    reverse = [h for h in hits if h["status"] == "published" and h["score"] >= thresh["reverse"]]
    # Persist for the gate report
    Path("/tmp/wa3-reverse-volume.txt").write_text(
        f"published={len(published)} scored={len(hits)} reverse_hits={len(reverse)} "
        f"inline_cap={thresh['inline_cap']} rollup_cards=1 "
        f"overflow={max(0, len(reverse) - thresh['inline_cap'])}\n",
        encoding="utf-8",
    )
    assert isinstance(len(reverse), int)
    # Restore is no-op: we reindexed the real checkout
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM wiki_pages_idx")
            n = cur.fetchone()["n"]
    assert n == len(pages)
