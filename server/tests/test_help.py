"""Characterization tests — member help desk.

Spec: FatTail-Labs-Help-System-Spec-v1.0. Notifications are monkeypatched so no
live SMTP/admin-notify fires. Probe rows clean up via identity/question cascade.
"""

from __future__ import annotations

import base64

import db
import help as help_domain
from tests.conftest import cookie_for

# 1x1 transparent PNG
_PNG = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA"
    "60e6kgAAAABJRU5ErkJggg=="
)


def _count(table: str, **where) -> int:
    cols = " AND ".join(f"{k} = %s" for k in where)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS n FROM {table} WHERE {cols}", tuple(where.values()))
            return int(cur.fetchone()["n"])


# --- screenshot storage ------------------------------------------------------


def test_save_screenshot_valid():
    path = help_domain.save_screenshot(_PNG)
    assert path and path.startswith("help/") and path.endswith(".png")


def test_save_screenshot_invalid_returns_none():
    assert help_domain.save_screenshot("not-base64!!") is None
    assert help_domain.save_screenshot(None) is None


def test_save_screenshot_too_large():
    big = base64.b64encode(b"\x00" * (6 * 1024 * 1024)).decode()
    try:
        help_domain.save_screenshot(big)
        assert False, "expected HelpError"
    except help_domain.HelpError as exc:
        assert exc.status == 413


# --- member flow -------------------------------------------------------------


def test_ask_list_thread_and_ownership(client, probe_identity, monkeypatch):
    monkeypatch.setattr("help.notify_admins_new_question", lambda *a, **k: None)
    cookies = cookie_for("navigator", probe_identity)

    r = client.post("/api/help/questions",
                    json={"subject": "How do I reset?", "body": "Stuck on lesson 2", "category": "courses"},
                    cookies=cookies)
    assert r.status_code == 200, r.text
    qid = r.json()["id"]
    assert _count("help_questions", id=qid, identity_id=probe_identity) == 1

    r2 = client.get("/api/help/questions", cookies=cookies)
    assert r2.status_code == 200
    assert any(q["id"] == qid for q in r2.json()["questions"])

    r3 = client.get(f"/api/help/questions/{qid}", cookies=cookies)
    assert r3.status_code == 200
    assert r3.json()["question"]["subject"] == "How do I reset?"

    # A different member cannot read it.
    other = cookie_for("navigator", 999999)
    assert client.get(f"/api/help/questions/{qid}", cookies=other).status_code == 404


def test_missing_fields_rejected(client, probe_identity, monkeypatch):
    monkeypatch.setattr("help.notify_admins_new_question", lambda *a, **k: None)
    cookies = cookie_for("navigator", probe_identity)
    # Subject is optional (derived from body). Empty body is rejected.
    assert client.post("/api/help/questions", json={"subject": "", "body": "x"}, cookies=cookies).status_code == 200
    assert client.post("/api/help/questions", json={"subject": "x", "body": ""}, cookies=cookies).status_code == 422


def test_anonymous_cannot_ask(client):
    assert client.post("/api/help/questions", json={"subject": "x", "body": "y"}).status_code == 401


# --- admin flow --------------------------------------------------------------


def test_admin_requires_admin(client, probe_identity):
    assert client.get("/api/admin/help/questions").status_code in (401, 403)
    assert client.get("/api/admin/help/questions",
                      cookies=cookie_for("navigator", probe_identity)).status_code == 403


def test_admin_answer_marks_answered_and_notifies(client, admin_cookies, probe_identity, monkeypatch):
    monkeypatch.setattr("help.notify_admins_new_question", lambda *a, **k: None)
    inapp, email = {}, {}
    monkeypatch.setattr("help.notify_member_answered_inapp",
                        lambda cur, **k: inapp.update(k))
    monkeypatch.setattr("help.email_member_answered", lambda **k: email.update(k))

    cookies = cookie_for("navigator", probe_identity)
    qid = client.post("/api/help/questions", json={"subject": "Q", "body": "B"}, cookies=cookies).json()["id"]

    # public answer -> answered + notify
    r = client.post(f"/api/admin/help/questions/{qid}/messages",
                    json={"body": "Here's the fix", "visibility": "public"}, cookies=admin_cookies)
    assert r.status_code == 200, r.text
    d = client.get(f"/api/admin/help/questions/{qid}", cookies=admin_cookies).json()
    assert d["question"]["status"] == "answered"
    assert inapp.get("question_id") == qid
    assert email.get("question_id") == qid

    # member sees the public reply; internal note stays hidden
    client.post(f"/api/admin/help/questions/{qid}/messages",
                json={"body": "secret note", "visibility": "internal"}, cookies=admin_cookies)
    mine = client.get(f"/api/help/questions/{qid}", cookies=cookies).json()
    bodies = [m["body"] for m in mine["messages"]]
    assert "Here's the fix" in bodies
    assert "secret note" not in bodies


def test_admin_set_status(client, admin_cookies, probe_identity, monkeypatch):
    monkeypatch.setattr("help.notify_admins_new_question", lambda *a, **k: None)
    cookies = cookie_for("navigator", probe_identity)
    qid = client.post("/api/help/questions", json={"subject": "Q2", "body": "B2"}, cookies=cookies).json()["id"]
    r = client.patch(f"/api/admin/help/questions/{qid}/status", json={"status": "closed"}, cookies=admin_cookies)
    assert r.status_code == 200 and r.json()["status"] == "closed"
    assert client.patch(f"/api/admin/help/questions/{qid}/status", json={"status": "bogus"}, cookies=admin_cookies).status_code == 422
