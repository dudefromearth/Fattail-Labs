"""IF-6 characterization — vocabulary + work-item slice.

Spec: Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md · BUILD AUTHORITY · DL-582
Plan: docs/IKI-Factory-Pipeline-Spec-v0.6-Full-Agent-Bench-Plan-v1.1.md · IF-6

Additive only. Movement/conveyor behavior is out of scope here — see
test_iki_factory_if1/if3/if4.py, unmodified by this slice.
"""

from __future__ import annotations

import io

import db
import pytest
from config import get_config
from main import app
from tests.conftest import LabsTestClient, cookie_for

COOKIE = get_config().session_cookie


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _cleanup():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_cards WHERE title LIKE %s",
                ("zz-if6-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _create(client, title: str = "zz-if6-idea", **extra) -> dict:
    body = {"title": title, **extra}
    r = client.post("/api/admin/iki-factory/cards", cookies=_admin(), json=body)
    assert r.status_code == 200, r.text
    return r.json()["card"]


def test_originator_defaults_to_coach(client):
    card = _create(client)
    assert card["originator_kind"] == "coach"
    assert card["originator_label"]  # the acting admin's label


def test_originator_outside_requires_label(client):
    r = client.post(
        "/api/admin/iki-factory/cards",
        cookies=_admin(),
        json={"title": "zz-if6-outside", "originator_kind": "outside"},
    )
    assert r.status_code == 422, r.text


def test_originator_outside_recorded(client):
    card = _create(
        client,
        title="zz-if6-outside-ok",
        originator_kind="outside",
        originator_label="Competitor landing page, 2026-08-25",
    )
    assert card["originator_kind"] == "outside"
    assert card["originator_label"] == "Competitor landing page, 2026-08-25"


def test_description_round_trips_on_create_and_patch(client):
    card = _create(client, description="What it is, why it matters.")
    assert card["description"] == "What it is, why it matters."
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"description": "Updated body."},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["description"] == "Updated body."


def test_link_attachment_round_trips(client):
    card = _create(client)
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments/link",
        cookies=_admin(),
        json={"url": "https://example.com/paper.pdf", "label": "Source paper"},
    )
    assert r.status_code == 200, r.text
    attachment = r.json()["attachment"]
    assert attachment["kind"] == "link"
    assert attachment["url"] == "https://example.com/paper.pdf"

    got = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments", cookies=_admin()
    )
    assert got.status_code == 200, got.text
    assert len(got.json()["attachments"]) == 1

    deleted = client.delete(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments/{attachment['id']}",
        cookies=_admin(),
    )
    assert deleted.status_code == 200, deleted.text
    after = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments", cookies=_admin()
    )
    assert after.json()["attachments"] == []


def test_link_attachment_requires_url(client):
    card = _create(client)
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments/link",
        cookies=_admin(),
        json={"label": "no url"},
    )
    assert r.status_code == 422, r.text


def test_upload_attachment_round_trips(client):
    card = _create(client)
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments/upload",
        cookies=_admin(),
        files={"file": ("chart.png", io.BytesIO(png_bytes), "image/png")},
    )
    assert r.status_code == 200, r.text
    attachment = r.json()["attachment"]
    assert attachment["kind"] == "upload"
    assert attachment["filename"] == "chart.png"
    assert attachment["size_bytes"] == len(png_bytes)
    assert attachment["url"]

    fetched = client.get(attachment["url"], cookies=_admin())
    assert fetched.status_code == 200
    assert fetched.content == png_bytes


def test_upload_attachment_rejects_unsupported_type(client):
    card = _create(client)
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/attachments/upload",
        cookies=_admin(),
        files={"file": ("script.exe", io.BytesIO(b"\x00\x01"), "application/octet-stream")},
    )
    assert r.status_code == 415, r.text


def test_priority_cut(client):
    """IF-7 re-author, same GO as the priority cut itself (DL-539 GO
    IKI-FACTORY-IF7). Supersedes this file's own
    test_priority_unchanged_and_still_required_on_create, which correctly
    scoped priority as untouched for IF-6 — additive-only, and removing it
    would have touched shipped IF-1 code/tests, out of scope for that GO.
    IF-7's own named scope is exactly that removal (v1.0 §2.2).

    A `priority` key sent on create is silently ignored, not rejected — no
    invented validation error for a field that no longer means anything —
    matching the create route's existing lenient-body convention. Patching
    it is different: `patch_card` has always been strict about unknown
    fields, and priority is now exactly that.
    """
    card = _create(client, priority="high")
    assert "priority" not in card

    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"priority": "low"},
    )
    assert r.status_code == 422, r.text
    assert "priority" in r.json()["detail"]


def test_unknown_patch_field_still_rejected(client):
    card = _create(client)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"nonsense_field": 1},
    )
    assert r.status_code == 422, r.text
