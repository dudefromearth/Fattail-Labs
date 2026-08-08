"""Characterization tests — help concierge v1.1 (feedback + inactivity close).

Spec: FatTail-Labs-Help-Concierge-Spec-v1.1. Data is inserted directly (no live
model needed); probe rows clean up via identity cascade.
"""

from __future__ import annotations

import db
from tests.conftest import cookie_for


def _mk_question(iid: int, status: str = "ai_resolved") -> tuple[int, int]:
    """A member question with one assistant answer. Returns (question_id, msg_id)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO help_questions (identity_id, email, subject, body, category, status)
                   VALUES (%s, '', 'probe', 'probe body', 'general', %s)""",
                (iid, status),
            )
            qid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO help_messages (question_id, author_role, body, visibility)
                   VALUES (%s, 'assistant', 'here is your answer', 'public')""",
                (qid,),
            )
            mid = int(cur.lastrowid)
    return qid, mid


def _rating(mid: int) -> str | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT rating FROM help_messages WHERE id = %s", (mid,))
            return cur.fetchone()["rating"]


def _status(qid: int) -> str:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT status FROM help_questions WHERE id = %s", (qid,))
            return cur.fetchone()["status"]


# --- feedback (👍/👎) --------------------------------------------------------


def test_rate_assistant_message_stores(client, probe_identity):
    qid, mid = _mk_question(probe_identity)
    ck = cookie_for("navigator", probe_identity)
    r = client.post(f"/api/help/messages/{mid}/rating", json={"rating": "up"}, cookies=ck)
    assert r.status_code == 200 and r.json()["rating"] == "up"
    assert _rating(mid) == "up"


def test_rate_invalid_value_rejected(client, probe_identity):
    qid, mid = _mk_question(probe_identity)
    ck = cookie_for("navigator", probe_identity)
    r = client.post(f"/api/help/messages/{mid}/rating", json={"rating": "meh"}, cookies=ck)
    assert r.status_code == 422


def test_rate_other_members_message_404(client, probe_identity):
    qid, mid = _mk_question(probe_identity)
    other = cookie_for("navigator", probe_identity + 987654)  # not the owner
    r = client.post(f"/api/help/messages/{mid}/rating", json={"rating": "up"}, cookies=other)
    assert r.status_code in (401, 404)


# --- inactivity close --------------------------------------------------------


def test_close_bot_thread(client, probe_identity):
    qid, _ = _mk_question(probe_identity, "ai_resolved")
    ck = cookie_for("navigator", probe_identity)
    r = client.post(f"/api/help/questions/{qid}/close", json={"reason": "inactivity"}, cookies=ck)
    assert r.status_code == 200 and r.json()["status"] == "closed"
    assert _status(qid) == "closed"


def test_close_skips_thread_the_team_is_on(client, probe_identity):
    qid, _ = _mk_question(probe_identity, "open")  # human in the loop
    ck = cookie_for("navigator", probe_identity)
    r = client.post(f"/api/help/questions/{qid}/close", json={"reason": "member"}, cookies=ck)
    assert r.status_code == 200 and r.json().get("skipped")
    assert _status(qid) == "open"  # untouched — team still owes a reply
