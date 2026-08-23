"""Wiki Spec v1.2 W1 — admin-point, wiki-only stubs, capture, board, WK15."""

from __future__ import annotations

import pytest

from agent_auth import Actor
from tests.conftest import cookie_for

import board
import db
import wiki_compile_oscar as oscar
import wiki_compile_store as store
import wiki_compile_surfaces as surfaces
from wiki_compile_oscar import WikiCompileError
from wiki_compile_surfaces import CaptureError

FIX_SHA = "cccccccccccccccccccccccccccccccccccccccc"


def _tables_exist() -> bool:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES LIKE 'wiki_compile_candidates'")
            return cur.fetchone() is not None


pytestmark = pytest.mark.skipif(not _tables_exist(), reason="migration 132 not applied")


def _idx_count() -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM wiki_pages_idx")
            return int(cur.fetchone()["n"])


def _delete_probe_pages() -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_pages_idx WHERE slug LIKE 'zzwikicompile-%'"
            )


@pytest.fixture
def clean_candidates():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_compile_candidates "
                "WHERE identity_key LIKE 'iki.%' OR identity_key LIKE 'zzwiki%'"
            )
    _delete_probe_pages()
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_compile_candidates "
                "WHERE identity_key LIKE 'iki.%' OR identity_key LIKE 'zzwiki%'"
            )
    _delete_probe_pages()


def test_at_wa3_capture_strips_entity_and_query():
    raw = {
        "surface_key": "iki.runner",
        "state_key": None,
        "route": "/app/iki/runner?trade_id=999&foo=bar",
        "screenshot": "data:image/png;base64,xxxx",
        "page_text": "family B secret",
        "trade_id": "999",
    }
    out = surfaces.sanitize_capture(raw)
    assert set(out.keys()) == {"surface_key", "state_key", "route"}
    assert out["route"] == "/app/iki/runner"
    assert "999" not in out["route"]
    assert "screenshot" not in out
    assert "page_text" not in out
    with pytest.raises(CaptureError):
        surfaces.sanitize_capture(
            {
                "surface_key": "journal.entry",
                "route": "/app/journal?trade_id=1",
            }
        )


def test_help_both_disabled():
    with pytest.raises(WikiCompileError, match="wiki-only"):
        oscar.assert_wiki_target("help")
    with pytest.raises(WikiCompileError, match="wiki-only"):
        oscar.assert_wiki_target("both")
    oscar.assert_wiki_target("wiki")


def test_audience_widen_refused():
    with pytest.raises(WikiCompileError, match="widening"):
        oscar.assert_audience("member", "public")


def test_at_wk11_admin_point_idempotent(clean_candidates, client):
    cookies = cookie_for("administrator")
    body = {
        "surface_key": "iki.runner",
        "route": "/app/iki/runner",
        "note": "first",
    }
    a = client.post("/api/wiki/compile-candidates", json=body, cookies=cookies)
    assert a.status_code == 200, a.text
    b = client.post(
        "/api/wiki/compile-candidates",
        json={**body, "note": "second"},
        cookies=cookies,
    )
    assert b.status_code == 200
    assert a.json()["id"] == b.json()["id"]
    assert store.get_open_by_identity("iki.runner")["id"] == a.json()["id"]


def test_non_admin_compile_404(client):
    cookies = cookie_for("navigator")
    r = client.get("/api/wiki/compile-inbox", cookies=cookies)
    assert r.status_code == 404
    r = client.post(
        "/api/wiki/compile-candidates",
        json={"surface_key": "iki.runner", "route": "/app/iki/runner"},
        cookies=cookies,
    )
    assert r.status_code == 404


def test_at_wa4_compile_now_board_card(clean_candidates, client):
    cookies = cookie_for("administrator")
    r = client.post(
        "/api/wiki/compile-candidates",
        json={
            "surface_key": "iki.wiki.entry",
            "route": "/app/wiki",
            "compile_now": True,
            "target": "wiki",
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["disposition"] == "compiling"
    # Background task (AT-WA8) runs after the response in TestClient.
    row = store.get_open_by_identity("iki.wiki.entry")
    # compiling may already be compiled if background ran
    final = store.get_candidate(r.json()["id"])
    assert final is not None
    assert final["disposition"] in ("compiling", "compiled")
    if final["disposition"] == "compiled":
        assert final["compiled_content_ids"]
        item = board.get_item(int(final["compiled_content_ids"][0]))
        assert item["product_line"] == "wiki"
        assert item["status"] == "awaiting_approval"


def test_inbox_compile_and_dismiss(clean_candidates, client):
    cookies = cookie_for("administrator")
    r = client.post(
        "/api/wiki/compile-candidates",
        json={"surface_key": "iki.factory", "route": "/app/iki/factory"},
        cookies=cookies,
    )
    cid = r.json()["id"]
    d = client.post(
        f"/api/wiki/compile-candidates/{cid}/dismiss",
        json={"note": "not now"},
        cookies=cookies,
    )
    assert d.status_code == 200
    assert d.json()["disposition"] == "dismissed"

    r2 = client.post(
        "/api/wiki/compile-candidates",
        json={"surface_key": "iki.factory", "route": "/app/iki/factory"},
        cookies=cookies,
    )
    cid2 = r2.json()["id"]
    assert cid2 != cid  # WK8 re-surface after dismiss
    bad = client.post(
        f"/api/wiki/compile-candidates/{cid2}/compile",
        json={"target": "help"},
        cookies=cookies,
    )
    assert bad.status_code == 400
    ok = client.post(
        f"/api/wiki/compile-candidates/{cid2}/compile",
        json={"target": "wiki"},
        cookies=cookies,
    )
    assert ok.status_code == 200
    assert ok.json()["disposition"] == "compiling"


def test_at_wk13_publish_one_idx_row_no_reindex(clean_candidates, client, monkeypatch):
    """WK15: one wiki_pages_idx row. Must not reindex the dev DB."""
    monkeypatch.setattr(
        oscar,
        "_slug_for",
        lambda sk: "zzwikicompile-" + str(sk).replace(".", "-"),
    )

    def _reindex_forbidden(*_a, **_k):
        raise AssertionError("wiki_store.reindex must not run on publish")

    monkeypatch.setattr("wiki_store.reindex", _reindex_forbidden)
    monkeypatch.setattr("wiki_compile_oscar.wiki_store.reindex", _reindex_forbidden)

    before = _idx_count()
    cookies = cookie_for("administrator")
    r = client.post(
        "/api/wiki/compile-candidates",
        json={
            "surface_key": "iki.runner",
            "route": "/app/iki/runner",
            "compile_now": True,
        },
        cookies=cookies,
    )
    assert r.status_code == 200
    final = store.get_candidate(r.json()["id"])
    assert final and final["disposition"] == "compiled"
    item_id = int(final["compiled_content_ids"][0])
    admin = Actor(kind="human", id=0, label="test-admin", role="administrator")
    board.transition(item_id, admin, to_status="published")
    after = _idx_count()
    assert after == before + 1
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT slug, title, status, body_md FROM wiki_pages_idx "
                "WHERE slug = 'zzwikicompile-iki-runner'"
            )
            page = cur.fetchone()
    assert page is not None
    assert page["status"] == "published"
    assert "surface_key: `iki.runner`" in (page["body_md"] or "")
    _delete_probe_pages()
    assert _idx_count() == before
