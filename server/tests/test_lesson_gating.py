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


def _get(client, slug, cookies=None):
    return client.get(f"/api/courses/{COURSE}/lessons/{slug}", cookies=cookies or {})


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
