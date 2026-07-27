"""Lesson access matrix: anon 401; free preview needs any session;
gated content needs alumni-or-better (Enrollment & Access spec)."""

import pytest
from conftest import cookie_for

COURSE = "first-stop-the-bleeding"


@pytest.fixture(scope="module")
def lesson_slugs(client):
    detail = client.get(f"/api/courses/{COURSE}").json()
    free, gated = None, None
    for m in detail["modules"]:
        for lesson in m["lessons"]:
            if lesson["free_preview"] and free is None:
                free = lesson["slug"]
            if not lesson["free_preview"] and gated is None:
                gated = lesson["slug"]
    assert free and gated, "seed must contain both free and gated lessons"
    return free, gated


def _module_and_lesson(client, lesson_slug: str):
    detail = client.get(f"/api/courses/{COURSE}").json()
    for m in detail["modules"]:
        for lesson in m["lessons"]:
            if lesson["slug"] == lesson_slug:
                return m["slug"], lesson_slug
    raise AssertionError(f"lesson {lesson_slug!r} not in catalog")


def _get(client, slug, cookies=None):
    mod, les = _module_and_lesson(client, slug)
    return client.get(
        f"/api/courses/{COURSE}/modules/{mod}/lessons/{les}",
        cookies=cookies or {},
    )


def test_anonymous_gets_401_even_for_free(client, lesson_slugs):
    free, gated = lesson_slugs
    assert _get(client, free).status_code == 401
    assert _get(client, gated).status_code == 401


def test_observer_gets_free_but_not_gated(client, lesson_slugs):
    free, gated = lesson_slugs
    c = cookie_for("observer", 901)
    assert _get(client, free, c).status_code == 200
    assert _get(client, gated, c).status_code == 403


def test_alumni_and_above_get_gated(client, lesson_slugs):
    _, gated = lesson_slugs
    for role in ("alumni", "activator", "navigator", "administrator"):
        assert _get(client, gated, cookie_for(role, 902)).status_code == 200


def test_lesson_payload_has_video_config(client, lesson_slugs):
    free, _ = lesson_slugs
    body = _get(client, free, cookie_for("observer", 901)).json()
    assert body["video"]["provider"] == "youtube"
    assert "youtube-nocookie.com" in body["video"]["embed_url"]


def test_public_landing_payload(client, lesson_slugs):
    """SEO landing endpoint: anonymous-safe, video never leaks,
    notes only for free previews."""
    free, gated = lesson_slugs
    mfree, _ = _module_and_lesson(client, free)
    mgated, _ = _module_and_lesson(client, gated)
    r = client.get(
        f"/api/courses/{COURSE}/modules/{mfree}/lessons/{free}/public"
    )
    assert r.status_code == 200
    body = r.json()
    assert body["free_preview"] is True
    assert body["course_title"]
    assert "video" not in body and "embed_url" not in str(body)

    r = client.get(
        f"/api/courses/{COURSE}/modules/{mgated}/lessons/{gated}/public"
    )
    assert r.status_code == 200
    body = r.json()
    assert body["free_preview"] is False
    assert body["body_md"] is None  # gated notes never go public


def test_public_landing_404s(client):
    assert (
        client.get(
            f"/api/courses/{COURSE}/modules/nope/lessons/nope/public"
        ).status_code
        == 404
    )
    r = client.get(
        "/api/courses/tail-hedging-workshop/modules/x/lessons/draft-lesson/public"
    )
    assert r.status_code == 404  # draft course: publicly invisible


def test_draft_lesson_title_updates_slug_and_admin_can_open(client, admin_cookies):
    """Draft rename keeps URL in sync; only admins can open unpublished lessons."""
    c = client.post(
        "/api/admin/courses",
        json={"title": "Draft Lesson Open Probe"},
        cookies=admin_cookies,
    )
    assert c.status_code == 200
    cslug = c.json()["slug"]
    try:
        mid = client.post(
            f"/api/admin/courses/{cslug}/modules",
            json={},
            cookies=admin_cookies,
        ).json()["module_id"]
        created = client.post(
            f"/api/admin/modules/{mid}/lessons",
            json={},
            cookies=admin_cookies,
        ).json()
        assert created["slug"] == "new-lesson"
        ren = client.put(
            f"/api/admin/lessons/{created['id']}",
            json={"title": "Capital Gates"},
            cookies=admin_cookies,
        )
        assert ren.status_code == 200
        assert ren.json()["slug"] == "capital-gates"
        assert ren.json()["title"] == "Capital Gates"
        detail = client.get(
            f"/api/admin/courses/{cslug}", cookies=admin_cookies
        ).json()
        mslug = detail["modules"][0]["slug"]
        open_r = client.get(
            f"/api/courses/{cslug}/modules/{mslug}/lessons/capital-gates",
            cookies=admin_cookies,
        )
        assert open_r.status_code == 200
        assert open_r.json()["title"] == "Capital Gates"
        assert (
            client.get(
                f"/api/courses/{cslug}/modules/{mslug}/lessons/capital-gates"
            ).status_code
            == 404
        )
        assert (
            client.get(
                f"/api/courses/{cslug}/modules/{mslug}/lessons/new-lesson",
                cookies=admin_cookies,
            ).status_code
            == 404
        )
    finally:
        client.delete(f"/api/admin/courses/{cslug}", cookies=admin_cookies)


def test_course_and_lesson_title_always_rewrite_slug(client, admin_cookies):
    """Name and URL stay in lockstep for courses and lessons (any status)."""
    c = client.post(
        "/api/admin/courses",
        json={"title": "Name Lock Course"},
        cookies=admin_cookies,
    )
    assert c.status_code == 200
    cslug = c.json()["slug"]
    assert cslug == "name-lock-course"
    try:
        ren = client.put(
            f"/api/admin/courses/{cslug}",
            json={"title": "Renamed Course"},
            cookies=admin_cookies,
        )
        assert ren.status_code == 200
        assert ren.json()["slug"] == "renamed-course"
        cslug = ren.json()["slug"]
        mid = client.post(
            f"/api/admin/courses/{cslug}/modules",
            json={},
            cookies=admin_cookies,
        ).json()["module_id"]
        lid = client.post(
            f"/api/admin/modules/{mid}/lessons",
            json={},
            cookies=admin_cookies,
        ).json()["id"]
        client.put(
            f"/api/admin/courses/{cslug}",
            json={"status": "published"},
            cookies=admin_cookies,
        )
        lren = client.put(
            f"/api/admin/lessons/{lid}",
            json={"title": "After Publish"},
            cookies=admin_cookies,
        )
        assert lren.status_code == 200
        assert lren.json()["slug"] == "after-publish"
        cren = client.put(
            f"/api/admin/courses/{cslug}",
            json={"title": "Still Sync"},
            cookies=admin_cookies,
        )
        assert cren.status_code == 200
        assert cren.json()["slug"] == "still-sync"
        cslug = cren.json()["slug"]
    finally:
        client.delete(f"/api/admin/courses/{cslug}", cookies=admin_cookies)


def test_course_title_conflict_returns_409(client, admin_cookies):
    a = client.post(
        "/api/admin/courses",
        json={"title": "Taken Name"},
        cookies=admin_cookies,
    ).json()["slug"]
    b = client.post(
        "/api/admin/courses",
        json={"title": "Other Course"},
        cookies=admin_cookies,
    ).json()["slug"]
    try:
        r = client.put(
            f"/api/admin/courses/{b}",
            json={"title": "Taken Name"},
            cookies=admin_cookies,
        )
        assert r.status_code == 409
        detail = r.json()["detail"]
        assert detail["code"] == "NAME_CONFLICT"
        assert "field" in detail
        # b still has original slug
        assert client.get(f"/api/admin/courses/{b}", cookies=admin_cookies).status_code == 200
    finally:
        client.delete(f"/api/admin/courses/{a}", cookies=admin_cookies)
        client.delete(f"/api/admin/courses/{b}", cookies=admin_cookies)


def test_same_lesson_name_ok_in_different_modules(client, admin_cookies):
    """Lesson slug unique per module; full path course/module/lesson is unique."""
    cslug = client.post(
        "/api/admin/courses",
        json={"title": "Multi Module Course"},
        cookies=admin_cookies,
    ).json()["slug"]
    try:
        m1 = client.post(
            f"/api/admin/courses/{cslug}/modules",
            json={"title": "Mod A"},
            cookies=admin_cookies,
        ).json()
        m2 = client.post(
            f"/api/admin/courses/{cslug}/modules",
            json={"title": "Mod B"},
            cookies=admin_cookies,
        ).json()
        l1 = client.post(
            f"/api/admin/modules/{m1['module_id']}/lessons",
            json={},
            cookies=admin_cookies,
        ).json()
        r1 = client.put(
            f"/api/admin/lessons/{l1['id']}",
            json={"title": "Shared Title"},
            cookies=admin_cookies,
        )
        assert r1.status_code == 200
        assert r1.json()["slug"] == "shared-title"
        l2 = client.post(
            f"/api/admin/modules/{m2['module_id']}/lessons",
            json={},
            cookies=admin_cookies,
        ).json()
        r2 = client.put(
            f"/api/admin/lessons/{l2['id']}",
            json={"title": "Shared Title"},
            cookies=admin_cookies,
        )
        assert r2.status_code == 200
        assert r2.json()["slug"] == "shared-title"
        # Different modules → different full paths
        assert m1["slug"] != m2["slug"]
        path1 = f"/api/courses/{cslug}/modules/{m1['slug']}/lessons/shared-title"
        path2 = f"/api/courses/{cslug}/modules/{m2['slug']}/lessons/shared-title"
        assert path1 != path2
        # Conflict only inside same module
        l3 = client.post(
            f"/api/admin/modules/{m1['module_id']}/lessons",
            json={},
            cookies=admin_cookies,
        ).json()
        r3 = client.put(
            f"/api/admin/lessons/{l3['id']}",
            json={"title": "Shared Title"},
            cookies=admin_cookies,
        )
        assert r3.status_code == 409
    finally:
        client.delete(f"/api/admin/courses/{cslug}", cookies=admin_cookies)
