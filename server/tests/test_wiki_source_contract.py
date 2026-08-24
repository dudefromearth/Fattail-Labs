"""SC-1 Source Contract envelope + watermark — v0.1.4."""

from __future__ import annotations

import pytest

import db
import wiki_agent_store as store
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_wiki_agent_portal import _agent


@pytest.fixture(autouse=True)
def context_providers(monkeypatch):
    monkeypatch.setenv("LABS_WIKI_CONTEXT_PROVIDERS", "hub=/app")
KIND = "help_guide"
SID = "zz-sc1-guide-1"


def _envelope(**overrides) -> dict:
    body = {
        "source_kind": KIND,
        "source_id": SID,
        "title": "Defined risk",
        "body": "Size is the control. Process over outcomes.",
        "body_format": "markdown",
        "intent": "Member guide for position size.",
        "origin_ref": "/help/zz-sc1-guide",
        "origin_owner": "zz-sc1-owner",
        "change_type": "created",
        "submitted_at": "2026-08-24T12:00:00Z",
        "content_hash": "sha256:sc1-fixture-hash",
    }
    body.update(overrides)
    return body


def _cleanup() -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_source_watermarks WHERE source_id LIKE %s",
                ("zz-sc1-%",),
            )
            cur.execute(
                "DELETE FROM wiki_contracts WHERE source LIKE %s AND kind = %s",
                ("zz-sc1-%", "source_contract"),
            )
            cur.execute(
                "DELETE FROM wiki_agent_sources WHERE slug LIKE %s",
                ("zz-sc1-%",),
            )


def setup_function() -> None:
    _cleanup()


def teardown_function() -> None:
    _cleanup()


def test_unknown_source_kind_rejected_ledger():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/contracts",
            cookies=cookie_for("administrator"),
            json=_envelope(source_kind="not_a_kind"),
        )
    assert r.status_code == 400, r.text
    detail = r.json()["detail"]
    assert detail["reject_reason"] == "unknown_source_kind"
    got = store.get_contract(detail["contract_id"])
    assert got["status"] == "rejected"
    assert got["reject_reason"] == "unknown_source_kind"
    assert store.get_watermark("not_a_kind", SID) is None


def test_incomplete_required_set_failed_partial_no_invention():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        body = _envelope()
        del body["title"]
        del body["body"]
        r = client.post(
            "/api/wiki-agent/contracts",
            cookies=cookie_for("administrator"),
            json=body,
        )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "failed-partial"
    assert data["contract_id"]
    assert "title" in data["reason"]
    assert "body" in data["reason"]
    assert data["reason"].startswith("incomplete_required_set:")
    payload = data.get("payload") or {}
    assert "title" not in payload
    assert "body" not in payload
    assert store.get_watermark(KIND, SID) is None
    got = store.get_contract(data["contract_id"])
    assert got["status"] == "failed-partial"
    assert "title" not in (got.get("payload") or {})


def test_valid_envelope_accepted_watermark_round_trip():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/contracts",
            cookies=cookie_for("administrator"),
            json=_envelope(acquired_by="skill"),
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "accepted"
        assert data["contract_id"]
        assert data.get("page_path") == ""
        assert "reason" not in data or data.get("reason") in ("", None)
        assert data["payload"]["title"] == "Defined risk"
        assert data["payload"]["acquired_by"] == "skill"
        mark = data["watermark"]
        assert mark["source_kind"] == KIND
        assert mark["source_id"] == SID
        assert mark["content_hash"] == "sha256:sc1-fixture-hash"
        assert "body" not in mark

        g = client.get(
            f"/api/wiki-agent/contracts/{data['contract_id']}",
            cookies=cookie_for("administrator"),
        )
        assert g.status_code == 200, g.text
        got = g.json()
        assert got["status"] == "accepted"
        assert got["contract_id"] == data["contract_id"]
        assert got["watermark"]["content_hash"] == "sha256:sc1-fixture-hash"

    stored = store.get_watermark(KIND, SID)
    assert stored is not None
    assert stored["content_hash"] == "sha256:sc1-fixture-hash"
    assert stored["contract_id"] == data["contract_id"]
    assert "body" not in stored


def test_unknown_acquired_by_rejected():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/contracts",
            cookies=cookie_for("administrator"),
            json=_envelope(acquired_by="telepathy"),
        )
    assert r.status_code == 400, r.text
    assert r.json()["detail"]["reject_reason"] == "unknown_acquired_by"


def test_agent_deliver_source_contract():
    key, cs = _agent("zz-sc1-agent", ["contracts:deliver"])
    store.upsert_source(
        "zz-sc1-owner",
        principal_callsign=cs,
        allowed_kind="source_contract",
    )
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/contracts",
            headers={"Authorization": f"Bearer {key}"},
            json=_envelope(source_id="zz-sc1-guide-agent"),
        )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "accepted"
    assert r.json()["watermark"]["source_id"] == "zz-sc1-guide-agent"


def test_observer_cannot_post_source_contract():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.post(
            "/api/wiki-agent/contracts",
            cookies=cookie_for("observer"),
            json=_envelope(source_id="zz-sc1-guide-obs"),
        )
    assert r.status_code in (401, 403)


def test_watermark_table_has_no_body_column():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM wiki_source_watermarks")
            cols = {row["Field"] for row in cur.fetchall()}
    assert "body" not in cols
    assert "body_md" not in cols
    assert cols >= {"source_kind", "source_id", "content_hash", "seen_at", "contract_id"}


def test_session_untouched_when_no_source_kind():
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
