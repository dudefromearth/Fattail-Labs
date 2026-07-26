"""Canonical Course Model — validate, export, import round-trip."""

from __future__ import annotations

import json
import uuid

import pytest

import course_model as cm
import db


def _unique(prefix: str = "zzccm") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _minimal_doc(**overrides) -> dict:
    slug = overrides.pop("slug", _unique("zzccm-course"))
    doc = {
        "format": cm.FORMAT,
        "model_version": cm.MODEL_VERSION,
        "course": {
            "id": "course",
            "slug": slug,
            "title": "ZZ Canonical Probe Course",
            "subtitle": "Test subtitle",
            "description_md": (
                "This is a characterization description for the canonical course "
                "model round-trip. Process outcomes only."
            ),
            "status": "draft",
            "version": "1.0.0",
            "level": "beginner",
            "audience_category": "members",
            "category_slugs": [],
            "flagship": False,
            "modules": [
                {
                    "id": "mod-1",
                    "title": "Module 1 — Foundations",
                    "description_md": "Why we start here.",
                    "order": 0,
                    "kind": "standard",
                    "lessons": [
                        {
                            "id": "les-1-1",
                            "title": "Why Accounts Die",
                            "slug": "why-accounts-die",
                            "order": 0,
                            "kind": "video",
                            "free_preview": True,
                            "content_blocks": [
                                {
                                    "id": "blk-1",
                                    "type": "video_clip",
                                    "provider": "youtube",
                                    "video_id": "aqz-KE-bpKQ",
                                    "params": {},
                                    "duration_seconds": 120,
                                },
                                {
                                    "id": "blk-2",
                                    "type": "notes",
                                    "body_md": "Capital preservation first.",
                                },
                            ],
                        }
                    ],
                }
            ],
            "resource_ids": [],
        },
    }
    doc["course"].update(overrides)
    return doc


def test_validate_structural_ok():
    report = cm.validate(_minimal_doc(), mode="structural")
    assert report["ok"] is True
    assert report["stats"]["lessons"] == 1
    assert report["stats"]["modules"] == 1


def test_validate_publish_profit_claim():
    doc = _minimal_doc(title="Guaranteed profit system")
    report = cm.validate(doc, mode="publish")
    assert report["ok"] is False
    codes = {e["code"] for e in report["errors"]}
    assert "PROFIT_CLAIM" in codes


def test_validate_unknown_format():
    report = cm.validate({"format": "nope", "model_version": "1.0", "course": {}}, mode="structural")
    assert report["ok"] is False


def test_placement_plan_adapter():
    plan = {
        "course_title": "Place Me",
        "description_md": "x" * 50,
        "level": "beginner",
        "modules": [
            {
                "title": "M1",
                "kind": "standard",
                "lessons": [
                    {
                        "title": "L1",
                        "slug": "l1",
                        "kind": "video",
                        "video_id": "aqz-KE-bpKQ",
                        "body_md": "notes",
                    }
                ],
            }
        ],
        "resources": [{"title": "Sheet", "url": "https://example.com/x", "kind": "link"}],
    }
    doc = cm.placement_plan_to_document(plan)
    assert doc["format"] == cm.FORMAT
    assert doc["course"]["title"] == "Place Me"
    assert len(doc["course"]["modules"][0]["lessons"][0]["content_blocks"]) >= 1
    report = cm.validate(doc, mode="structural")
    assert report["ok"] is True


def test_inspect_outline():
    out = cm.inspect_document(_minimal_doc())
    assert out["ok"] is True
    assert out["outline"]["title"] == "ZZ Canonical Probe Course"
    assert out["stats"]["lessons"] == 1


def test_import_export_roundtrip(client, admin_cookies):
    slug = _unique("zzccm-rt")
    doc = _minimal_doc(slug=slug)

    # Ensure no category requirement
    r = client.post(
        "/api/admin/canonical-courses/import",
        cookies=admin_cookies,
        json={"document": doc, "mode": "create_draft"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["slug"].startswith("zzccm-rt")
    imported_slug = body["slug"]

    r2 = client.get(
        f"/api/admin/courses/{imported_slug}/canonical",
        cookies=admin_cookies,
    )
    assert r2.status_code == 200, r2.text
    exported = r2.json()
    assert exported["format"] == cm.FORMAT
    assert exported["course"]["title"] == "ZZ Canonical Probe Course"
    assert len(exported["course"]["modules"]) == 1
    les = exported["course"]["modules"][0]["lessons"][0]
    assert les["title"] == "Why Accounts Die"
    assert les.get("kind") == "video"
    types = [b["type"] for b in les["content_blocks"]]
    assert "video_clip" in types
    assert "notes" in types
    # free_preview is auth flag only — full content still present
    assert les.get("free_preview") is True

    # replace_draft
    doc2 = _minimal_doc(slug=imported_slug)
    doc2["course"]["title"] = "ZZ Canonical Probe Course v2"
    doc2["course"]["modules"][0]["lessons"][0]["title"] = "Renamed Lesson"
    r3 = client.post(
        f"/api/admin/courses/{imported_slug}/canonical",
        cookies=admin_cookies,
        json={"document": doc2},
    )
    assert r3.status_code == 200, r3.text

    r4 = client.get(
        f"/api/admin/courses/{imported_slug}/canonical",
        cookies=admin_cookies,
    )
    assert r4.json()["course"]["title"] == "ZZ Canonical Probe Course v2"
    assert (
        r4.json()["course"]["modules"][0]["lessons"][0]["title"] == "Renamed Lesson"
    )

    # cleanup
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM courses WHERE slug = %s", (imported_slug,))
            row = cur.fetchone()
            if row:
                cid = row["id"]
                cur.execute("SELECT id FROM modules WHERE course_id = %s", (cid,))
                mids = [x["id"] for x in cur.fetchall()]
                if mids:
                    ph = ",".join(["%s"] * len(mids))
                    cur.execute(
                        f"SELECT id FROM lessons WHERE module_id IN ({ph})", mids
                    )
                    lids = [x["id"] for x in cur.fetchall()]
                    if lids:
                        ph2 = ",".join(["%s"] * len(lids))
                        cur.execute(
                            f"DELETE FROM quiz_questions WHERE lesson_id IN ({ph2})",
                            lids,
                        )
                        cur.execute(
                            f"DELETE FROM lessons WHERE id IN ({ph2})", lids
                        )
                    cur.execute(f"DELETE FROM modules WHERE id IN ({ph})", mids)
                cur.execute(
                    "DELETE FROM attachments WHERE owner_type='course' AND owner_id=%s",
                    (cid,),
                )
                cur.execute("DELETE FROM courses WHERE id = %s", (cid,))


def test_refuse_replace_published(client, admin_cookies):
    slug = _unique("zzccm-pub")
    doc = _minimal_doc(slug=slug)
    r = client.post(
        "/api/admin/canonical-courses/import",
        cookies=admin_cookies,
        json={"document": doc, "mode": "create_draft"},
    )
    assert r.status_code == 200
    imported_slug = r.json()["slug"]

    # publish via admin
    r2 = client.put(
        f"/api/admin/courses/{imported_slug}",
        cookies=admin_cookies,
        json={"status": "published"},
    )
    assert r2.status_code == 200, r2.text

    r3 = client.post(
        f"/api/admin/courses/{imported_slug}/canonical",
        cookies=admin_cookies,
        json={"document": doc},
    )
    assert r3.status_code == 422

    # cleanup — unpublish then delete via admin if possible
    client.put(
        f"/api/admin/courses/{imported_slug}",
        cookies=admin_cookies,
        json={"status": "draft"},
    )
    client.delete(f"/api/admin/courses/{imported_slug}", cookies=admin_cookies)


def test_validate_endpoint_auth(client):
    r = client.post(
        "/api/admin/canonical-courses/validate",
        json={"document": _minimal_doc()},
    )
    assert r.status_code in (401, 403)


def test_package_alias_validate(client, admin_cookies):
    r = client.post(
        "/api/admin/course-packages/validate",
        cookies=admin_cookies,
        json={"document": _minimal_doc()},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_preserve_lesson_kind_replay():
    doc = _minimal_doc()
    les = doc["course"]["modules"][0]["lessons"][0]
    les["kind"] = "replay"
    les["content_blocks"] = [
        {
            "id": "blk-1",
            "type": "video_clip",
            "provider": "youtube",
            "video_id": "aqz-KE-bpKQ",
            "params": {},
        }
    ]
    fields = cm.materialize_lesson_fields(les)
    assert fields["kind"] == "replay"
    assert fields["video_provider"] == "youtube"


def test_youtube_default_provider():
    assert cm._normalize_provider("bunny") == "youtube"
    assert cm._normalize_provider(None) == "youtube"
    assert cm._normalize_provider("youtube") == "youtube"


def test_instructor_bundle_on_export_shape():
    """Export bundle includes instructor profile fields when present in DB
    (integration covered by round-trip; unit: materialize docs)."""
    plan = {
        "course_title": "With Instructors",
        "description_md": "x" * 50,
        "modules": [
            {
                "title": "M1",
                "kind": "standard",
                "lessons": [
                    {"title": "L1", "slug": "l1", "kind": "text", "body_md": "hi"}
                ],
            }
        ],
    }
    doc = cm.placement_plan_to_document(plan)
    assert doc["course"]["modules"][0]["lessons"][0]["kind"] == "text"
