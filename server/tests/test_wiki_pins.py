"""S0 pin cache — start_here from git frontmatter, never a leftover fixture index."""

import os
from pathlib import Path

import pytest

import auth
import db
import wiki_store
from config import get_config
from main import app
from tests.conftest import LabsTestClient

COOKIE = get_config().session_cookie


def _cookie(role: str) -> dict:
    token = auth.issue_session(identity_id=0, issuer="internal", role=role)
    return {COOKIE: token}


def _page(title: str, status: str, pin: str, pin_order: str) -> str:
    return (
        f"---\ntitle: {title}\nkind: topic\nstatus: {status}\n"
        f"pin: {pin}\npin_order: {pin_order}\ntags: []\nsources: []\n"
        f"updated: 2026-08-23\n---\n\n# {title}\n\nBody.\n"
    )


@pytest.fixture(scope="module")
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


@pytest.fixture(scope="module")
def pin_vault(tmp_path_factory):
    root = tmp_path_factory.mktemp("pin-vault")
    topics = root / "wiki" / "topics"
    topics.mkdir(parents=True)
    (root / "wiki" / "index.md").write_text("# map\n")
    (topics / "pin-c.md").write_text(_page("Pin C", "published", "true", "30"))
    (topics / "pin-a.md").write_text(_page("Pin A", "published", "true", "10"))
    (topics / "pin-b.md").write_text(_page("Pin B", "published", "true", "20"))
    (topics / "pin-draft.md").write_text(_page("Pin Draft", "draft", "true", "5"))
    (topics / "unpin.md").write_text(_page("Unpinned", "published", "false", "1"))
    extra = 40
    for i in range(9):
        (topics / f"pin-extra-{i}.md").write_text(
            _page(f"Extra {i}", "published", "true", str(extra + i))
        )
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    yield root
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    if raw and (Path(raw) / "wiki" / "index.md").is_file():
        with db.transaction() as conn:
            wiki_store.reindex(conn, Path(raw))


def test_start_here_order_cap_and_draft_gate(client, pin_vault):
    member = client.get("/api/wiki/index", cookies=_cookie("observer"))
    assert member.status_code == 200
    start = member.json()["start_here"]
    slugs = [p["slug"] for p in start]
    assert slugs[0:3] == ["pin-a", "pin-b", "pin-c"]
    assert "pin-draft" not in slugs
    assert "unpin" not in slugs
    assert len(slugs) == 8
    assert all(p["status"] == "published" for p in start)

    admin = client.get("/api/wiki/index", cookies=_cookie("administrator"))
    assert admin.status_code == 200
    admin_slugs = [p["slug"] for p in admin.json()["start_here"]]
    assert "pin-draft" not in admin_slugs
    assert admin_slugs == slugs


def test_page_provenance_passthrough(client, pin_vault):
    root = pin_vault
    (root / "wiki" / "topics" / "pin-a.md").write_text(
        "---\ntitle: Pin A\nkind: topic\nstatus: published\npin: true\n"
        "pin_order: 10\ncompiled_by: oscar\napproved_by: coach\n"
        "tags: []\nsources: []\nupdated: 2026-08-23\n---\n\n# Pin A\n"
    )
    with db.transaction() as conn:
        wiki_store.reindex(conn, root)
    page = client.get("/api/wiki/pages/pin-a", cookies=_cookie("observer"))
    assert page.status_code == 200
    data = page.json()
    assert data["compiled_by"] == "oscar"
    assert data["approved_by"] == "coach"
    assert data["updated"] == "2026-08-23"
