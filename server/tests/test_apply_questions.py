"""Characterization — apply question types and content checks."""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from apply_questions import content_check, email_from_answers, mapped_ac_answers
from apply_questions import public_payload


SLOTS = [{"starts_et": "2026-08-25T11:00", "live": True}]


def _q(**kwargs):
    base = {
        "id": 1,
        "slug": "q",
        "ask": "Ask",
        "hint": "",
        "qtype": "free_text",
        "options": [],
        "ac_key": None,
        "ac_field_id": None,
        "is_email": False,
        "sort_order": 10,
    }
    base.update(kwargs)
    return base


def test_free_text_requires_non_empty():
    q = _q(qtype="free_text")
    assert content_check(q, "") == "This answer is required."
    assert content_check(q, "  ") == "This answer is required."
    assert content_check(q, "keep") is None


def test_free_text_email_must_be_valid():
    q = _q(qtype="free_text", is_email=True, slug="email")
    assert content_check(q, "") == "A valid email is required."
    assert content_check(q, "not-an-email") == "A valid email is required."
    assert content_check(q, "a@b.co") is None


def test_binary_needs_exactly_two_and_a_pick():
    broken = _q(qtype="binary", options=["Yes"])
    assert content_check(broken, "Yes") == "This question is missing its two choices."
    q = _q(qtype="binary", options=["In", "Out"])
    assert content_check(q, "") == "Pick one of the two choices."
    assert content_check(q, "Maybe") == "Pick one of the two choices."
    assert content_check(q, "In") is None


def test_radio_needs_two_or_more_and_exactly_one():
    broken = _q(qtype="radio", options=["Only"])
    assert content_check(broken, "Only") == "This question needs two or more choices."
    q = _q(qtype="radio", options=["A", "B", "C"])
    assert content_check(q, "") == "Pick one of the listed choices."
    assert content_check(q, "D") == "Pick one of the listed choices."
    assert content_check(q, "B") is None


def test_calendar_fails_loud_without_slots():
    q = _q(qtype="calendar", slug="ELEVEN_AM_ET")
    assert (
        content_check(q, "2026-08-25T11:00", live_slots=[])
        == "No live conversation times are configured."
    )
    assert content_check(q, "2026-08-25T15:00", live_slots=SLOTS) == (
        "Pick one of the listed times."
    )
    assert content_check(q, "2026-08-25T11:00", live_slots=SLOTS) is None


def test_continue_needs_no_answer():
    assert content_check(_q(qtype="continue", slug="intro"), "") is None


def test_mapped_ac_answers_only_cole_ids():
    questions = [
        _q(slug="HEAVEN", ac_key="HEAVEN", ac_field_id="4"),
        _q(slug="extra", ac_key=None, ac_field_id=None),
        _q(slug="invented", ac_key="NEW_SALES", ac_field_id="99"),
    ]
    answers = {"HEAVEN": "keep", "extra": "note", "invented": "nope"}
    out = mapped_ac_answers(questions, answers)
    assert out == {"HEAVEN": "keep"}


def test_email_from_answers_uses_is_email_slug():
    questions = [_q(slug="email", is_email=True), _q(slug="HEAVEN")]
    assert (
        email_from_answers(questions, {"email": "A@B.co", "HEAVEN": "x"}) == "a@b.co"
    )


def test_public_payload_omits_ac_ids():
    out = public_payload(
        [_q(slug="HEAVEN", ac_key="HEAVEN", ac_field_id="4")]
    )
    assert "ac_key" not in out[0]
    assert "ac_field_id" not in out[0]
    assert out[0]["slug"] == "HEAVEN"


def test_admin_questions_require_admin(monkeypatch):
    from fastapi import FastAPI, HTTPException
    from fastapi.testclient import TestClient
    from routes.apply import router

    def deny(_request):
        raise HTTPException(status_code=403, detail="administrator required")

    monkeypatch.setattr("routes.apply._require_admin", deny)
    app = FastAPI()
    app.include_router(router)
    r = TestClient(app).get("/api/admin/apply/questions")
    assert r.status_code == 403
    assert r.json().get("ok") is not True
