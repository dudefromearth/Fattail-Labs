"""Characterization: site appearance API (Human Interface Spec v1.0 §10)."""

from __future__ import annotations

import appearance


def test_default_document_validates():
    doc = appearance.default_document()
    clean = appearance.validate_document(doc)
    assert clean["schema_version"] == appearance.SCHEMA_VERSION
    assert clean["brand"]["tint"] == "emerald"


def test_reject_unknown_top_level_key():
    doc = appearance.default_document()
    doc["evil_css"] = "body{display:none}"
    try:
        appearance.validate_document(doc)
        assert False, "expected 422"
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 422


def test_reject_custom_font():
    doc = appearance.default_document()
    doc["appearance"]["font"] = "comic_sans"
    try:
        appearance.validate_document(doc)
        assert False, "expected 422"
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 422


def test_reject_non_allowlisted_nav_href():
    doc = appearance.default_document()
    doc["member_chrome"]["nav"] = [
        {
            "id": "x",
            "label": "Evil",
            "href": "https://evil.example",
            "visibility": "always",
        }
    ]
    try:
        appearance.validate_document(doc)
        assert False, "expected 422"
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 422


def test_tint_swatch_enum(client):
    r = client.get("/api/appearance")
    assert r.status_code == 200
    body = r.json()
    assert "appearance" in body
    assert body["appearance"]["brand"]["tint"] in appearance.ALLOWED_TINTS


def test_admin_draft_publish_roundtrip(client, admin_cookies):
    r = client.get("/api/admin/appearance", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    draft = r.json()["draft"]
    draft["brand"]["tint"] = "blue"
    draft["brand"]["display_name"] = "Labs HIG Test"
    put = client.put(
        "/api/admin/appearance/draft",
        cookies=admin_cookies,
        json={"appearance": draft},
    )
    assert put.status_code == 200, put.text
    assert put.json()["appearance"]["brand"]["tint"] == "blue"

    pub = client.post(
        "/api/admin/appearance/publish",
        cookies=admin_cookies,
        json={"note": "test"},
    )
    assert pub.status_code == 200, pub.text

    public = client.get("/api/appearance")
    assert public.status_code == 200
    assert public.json()["appearance"]["brand"]["tint"] == "blue"

    # restore emerald so other sessions stay predictable
    draft["brand"]["tint"] = "emerald"
    draft["brand"]["display_name"] = "FatTail Labs"
    client.put(
        "/api/admin/appearance/draft",
        cookies=admin_cookies,
        json={"appearance": draft},
    )
    client.post(
        "/api/admin/appearance/publish",
        cookies=admin_cookies,
        json={"note": "restore default tint"},
    )
