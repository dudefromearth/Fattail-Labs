"""Enrollment + progress: delta clamp, auto-complete at 90%
(Progress Tracking spec v1.0)."""

import pytest
from conftest import cookie_for

COURSE = "first-stop-the-bleeding"


@pytest.fixture()
def member(probe_identity):
    return cookie_for("navigator", probe_identity)


@pytest.fixture(scope="module")
def video_lesson(client):
    detail = client.get(f"/api/courses/{COURSE}").json()
    for m in detail["modules"]:
        for lesson in m["lessons"]:
            if lesson["kind"] == "video" and lesson["duration_seconds"] > 0:
                return lesson
    pytest.fail("seed must contain a video lesson with duration")


def test_enroll_round_trip(client, member):
    r = client.post(f"/api/courses/{COURSE}/enroll", cookies=member)
    assert r.status_code == 200
    assert r.json()["enrolled"] is True
    mine = client.get("/api/me/enrollments", cookies=member).json()["enrollments"]
    assert any(e["course"]["slug"] == COURSE for e in mine)


def test_progress_delta_clamped_to_60(client, member, video_lesson):
    r = client.post("/api/progress", cookies=member,
                    json={"course_slug": COURSE, "lesson_slug": video_lesson["slug"],
                          "watched_delta": 9999, "position": 10})
    assert r.status_code == 200
    assert r.json()["watch_seconds"] == 60  # fresh row: 9999 clamps to one MAX_DELTA


def test_watching_90_percent_auto_completes(client, member, video_lesson):
    duration = video_lesson["duration_seconds"]
    reports_needed = duration // 60 + 2  # 60s clamp per report
    completed = False
    for _ in range(min(reports_needed, 60)):
        r = client.post("/api/progress", cookies=member,
                        json={"course_slug": COURSE, "lesson_slug": video_lesson["slug"],
                              "watched_delta": 60, "position": duration})
        completed = r.json()["completed"]
        if completed:
            break
    assert completed


def test_progress_requires_session(client, video_lesson):
    r = client.post("/api/progress",
                    json={"course_slug": COURSE, "lesson_slug": video_lesson["slug"],
                          "watched_delta": 10, "position": 0})
    assert r.status_code == 401
