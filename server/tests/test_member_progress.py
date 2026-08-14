"""Enrollment + progress: delta clamp, auto-complete at 90%
(Progress Tracking spec v1.0)."""

import pytest
from conftest import cookie_for


@pytest.fixture()
def member(probe_identity):
    return cookie_for("navigator", probe_identity)


def test_enroll_round_trip(client, member, published_access_course):
    course = published_access_course["slug"]
    r = client.post(f"/api/courses/{course}/enroll", cookies=member)
    assert r.status_code == 200
    assert r.json()["enrolled"] is True
    mine = client.get("/api/me/enrollments", cookies=member).json()["enrollments"]
    assert any(e["course"]["slug"] == course for e in mine)


def test_progress_delta_clamped_to_60(client, member, published_access_course):
    course = published_access_course["slug"]
    lesson = published_access_course["free"]["slug"]
    r = client.post("/api/progress", cookies=member,
                    json={"course_slug": course, "lesson_slug": lesson,
                          "watched_delta": 9999, "position": 10})
    assert r.status_code == 200
    assert r.json()["watch_seconds"] == 60  # fresh row: 9999 clamps to one MAX_DELTA


def test_watching_90_percent_auto_completes(client, member, published_access_course):
    course = published_access_course["slug"]
    lesson = published_access_course["free"]["slug"]
    duration = 180
    reports_needed = duration // 60 + 2  # 60s clamp per report
    completed = False
    for _ in range(min(reports_needed, 60)):
        r = client.post("/api/progress", cookies=member,
                        json={"course_slug": course, "lesson_slug": lesson,
                              "watched_delta": 60, "position": duration})
        completed = r.json()["completed"]
        if completed:
            break
    assert completed


def test_progress_requires_session(client, published_access_course):
    course = published_access_course["slug"]
    lesson = published_access_course["free"]["slug"]
    r = client.post("/api/progress",
                    json={"course_slug": course, "lesson_slug": lesson,
                          "watched_delta": 10, "position": 0})
    assert r.status_code == 401


def test_mark_complete_toggle_on_and_off(client, member, published_access_course):
    """Switch is two-way: complete and undo (accidental marks)."""
    course = published_access_course["slug"]
    slug = published_access_course["free"]["slug"]
    client.post(f"/api/courses/{course}/enroll", cookies=member)
    on = client.post(
        "/api/progress/complete",
        cookies=member,
        json={"course_slug": course, "lesson_slug": slug, "completed": True},
    )
    assert on.status_code == 200
    assert on.json()["completed"] is True
    prog = client.get(f"/api/me/progress?course={course}", cookies=member).json()
    assert prog["lessons"][slug]["completed"] is True

    off = client.post(
        "/api/progress/complete",
        cookies=member,
        json={"course_slug": course, "lesson_slug": slug, "completed": False},
    )
    assert off.status_code == 200
    assert off.json()["completed"] is False
    prog2 = client.get(f"/api/me/progress?course={course}", cookies=member).json()
    assert prog2["lessons"][slug]["completed"] is False


def test_journey_reuses_enrollments_no_second_store(client, member, published_access_course):
    """Journey is a derived view (Member-Data-Privacy DS-2)."""
    course = published_access_course["slug"]
    client.post(f"/api/courses/{course}/enroll", cookies=member)
    r = client.get("/api/me/journey", cookies=member)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "enrollments+lesson_progress"
    assert "stats" in body and "courses" in body
    assert any(c["slug"] == course for c in body["courses"])
