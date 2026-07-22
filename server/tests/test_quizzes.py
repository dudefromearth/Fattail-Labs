"""Quizzes: answers never leak to the client; server grading
(Quizzes spec v1.0)."""

import json

import pytest
from conftest import cookie_for


@pytest.fixture(scope="module")
def quiz_lesson(client, admin_cookies):
    """(course_slug, lesson_slug, lesson_id, answer_key) for a seeded quiz."""
    for course in client.get("/api/courses").json()["courses"]:
        detail = client.get(f"/api/courses/{course['slug']}").json()
        for m in detail["modules"]:
            for lesson in m["lessons"]:
                if lesson["kind"] != "quiz":
                    continue
                admin = client.get(f"/api/admin/courses/{course['slug']}",
                                   cookies=admin_cookies).json()
                lid = next(
                    al["id"]
                    for am in admin["modules"] for al in am["lessons"]
                    if al["slug"] == lesson["slug"]
                )
                qs = client.get(f"/api/admin/lessons/{lid}/questions",
                                cookies=admin_cookies).json()["questions"]
                if qs:
                    return course["slug"], lesson["slug"], lid, qs
    pytest.skip("no seeded quiz lesson found")


def test_public_questions_hide_answers(client, quiz_lesson):
    course, lesson, _, _ = quiz_lesson
    body = client.get(f"/api/courses/{course}/lessons/{lesson}",
                      cookies=cookie_for("navigator", 902)).json()
    assert body["questions"], "quiz lesson must expose its questions"
    blob = json.dumps(body["questions"])
    assert "correct" not in blob
    assert "explanation" not in blob


def test_perfect_submission_scores_100(client, quiz_lesson, probe_identity):
    course, lesson, _, key = quiz_lesson
    answers = {}
    for q in key:
        correct = q["correct"]
        answers[str(q["id"])] = correct[0] if isinstance(correct, list) else correct
    member = cookie_for("navigator", probe_identity)
    r = client.post(f"/api/courses/{course}/lessons/{lesson}/quiz",
                    cookies=member, json={"answers": answers})
    assert r.status_code == 200
    body = r.json()
    assert body["score"] == body["total"]
