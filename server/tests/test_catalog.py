"""Public catalog: published-only, card fields, draft invisibility."""

DRAFT_SLUG = "tail-hedging-workshop"  # seeded draft fixture


def test_catalog_lists_published_only(client):
    r = client.get("/api/courses")
    assert r.status_code == 200
    courses = r.json()["courses"]
    assert len(courses) >= 5
    slugs = {c["slug"] for c in courses}
    assert "first-stop-the-bleeding" in slugs
    assert DRAFT_SLUG not in slugs


def test_card_payload_shape(client):
    c = client.get("/api/courses").json()["courses"][0]
    for key in ("slug", "title", "hero_image_url", "card_color", "level",
                "lesson_count", "total_duration_seconds", "categories",
                "instructors", "review_count", "avg_rating"):
        assert key in c
    # dropped in migration 011 — must never come back silently
    assert "card_image_url" not in c
    assert "card_blurb_md" not in c


def test_draft_detail_is_404_publicly(client):
    assert client.get(f"/api/courses/{DRAFT_SLUG}").status_code == 404


def test_draft_visible_via_admin_api(client, admin_cookies):
    r = client.get(f"/api/admin/courses/{DRAFT_SLUG}", cookies=admin_cookies)
    assert r.status_code == 200
    assert r.json()["status"] == "draft"


def test_admin_course_requires_admin(client):
    from conftest import cookie_for
    assert client.get(f"/api/admin/courses/{DRAFT_SLUG}").status_code == 401
    r = client.get(f"/api/admin/courses/{DRAFT_SLUG}", cookies=cookie_for("navigator", 902))
    assert r.status_code == 403
