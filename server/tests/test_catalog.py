"""Public catalog: published-only, card fields, draft invisibility."""

LIVE_PUBLISHED = "fattail-foundations"


def test_catalog_lists_published_only(client, draft_probe_course):
    r = client.get("/api/courses")
    assert r.status_code == 200
    courses = r.json()["courses"]
    assert len(courses) >= 5
    slugs = {c["slug"] for c in courses}
    assert LIVE_PUBLISHED in slugs
    assert draft_probe_course not in slugs


def test_card_payload_shape(client):
    c = client.get("/api/courses").json()["courses"][0]
    for key in ("slug", "title", "hero_image_url", "card_color", "level",
                "lesson_count", "total_duration_seconds", "categories",
                "instructors", "review_count", "avg_rating"):
        assert key in c
    # dropped in migration 011 — must never come back silently
    assert "card_image_url" not in c
    assert "card_blurb_md" not in c


def test_draft_detail_is_404_publicly(client, draft_probe_course):
    assert client.get(f"/api/courses/{draft_probe_course}").status_code == 404


def test_draft_visible_via_admin_api(client, admin_cookies, draft_probe_course):
    r = client.get(f"/api/admin/courses/{draft_probe_course}", cookies=admin_cookies)
    assert r.status_code == 200
    assert r.json()["status"] == "draft"


def test_admin_catalog_includes_drafts(client, admin_cookies, draft_probe_course):
    """Admins list drafts on /courses so create/save does not lose them."""
    r = client.get("/api/admin/courses", cookies=admin_cookies)
    assert r.status_code == 200
    courses = r.json()["courses"]
    assert isinstance(courses, list)
    by_slug = {c["slug"]: c for c in courses}
    assert draft_probe_course in by_slug
    assert by_slug[draft_probe_course]["status"] == "draft"
    public = {c["slug"] for c in client.get("/api/courses").json()["courses"]}
    assert draft_probe_course not in public
    assert client.get("/api/admin/courses").status_code == 401


def test_admin_course_requires_admin(client, draft_probe_course, probe_identity):
    from conftest import cookie_for
    assert client.get(f"/api/admin/courses/{draft_probe_course}").status_code == 401
    r = client.get(
        f"/api/admin/courses/{draft_probe_course}",
        cookies=cookie_for("navigator", probe_identity),
    )
    assert r.status_code == 403


def test_public_categories_for_hubs(client):
    """SEO spec v1.2: hub data — slug, name, copy, published-only counts."""
    r = client.get("/api/categories")
    assert r.status_code == 200
    cats = r.json()["categories"]
    assert len(cats) >= 9
    by_slug = {c["slug"]: c for c in cats}
    assert by_slug["risk-sizing"]["description_md"]
    # counts reflect published courses only: every count within bounds
    published = len(client.get("/api/courses").json()["courses"])
    for c in cats:
        assert 0 <= c["course_count"] <= published
