"""Member help desk — ask questions, get instant AI answers, escalate to humans.

Member session required; a member can only see/act on their OWN questions.

Flow: a member picks a topic (bug | struggling | general) and writes one message.
The AI concierge (help_ai) answers instantly from a member-facing knowledge base
with hard guardrails. If it can't answer — or the member asks for a person — the
thread escalates to the human help desk (admins notified). Bot-resolved threads do
NOT notify admins, so the human queue only holds what the bot couldn't handle.

AI answers are stored as help_messages with author_role='assistant'. Statuses:
  ai_pending  -> question created, awaiting first AI answer
  ai_resolved -> the bot is handling it (no human needed yet)
  open        -> escalated to / re-opened for the human team
  answered    -> a human has replied
  closed      -> resolved/closed by an admin

Spec: FatTail-Labs-Help-System-Spec-v1.0 + FatTail-Labs-Help-Concierge-Spec-v1.0.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

import db
import help as help_domain
import help_ai
from guards import require_session

log = logging.getLogger("labs.help")

router = APIRouter(tags=["help"])

RATE_PER_HOUR = 10
VALID_CATEGORIES = ("bug", "struggling", "general")


def _iso(dt) -> str | None:
    return dt.isoformat() + "Z" if dt is not None else None


def _q_public(r: dict) -> dict:
    return {
        "id": int(r["id"]),
        "subject": r["subject"],
        "body": r["body"],
        "category": r["category"],
        "status": r["status"],
        "closed_reason": r.get("closed_reason"),
        "page_context": r.get("page_context"),
        "screenshot_url": f"/api/media/{r['screenshot_path']}" if r.get("screenshot_path") else None,
        "created_at": _iso(r.get("created_at")),
        "updated_at": _iso(r.get("updated_at")),
        "answered_at": _iso(r.get("answered_at")),
    }


def _msg_public(r: dict) -> dict:
    return {
        "id": int(r["id"]),
        "author_role": r["author_role"],
        "body": r["body"],
        "rating": r.get("rating"),
        "created_at": _iso(r.get("created_at")),
    }


def _load_ai_thread(cur, qid: int, opening_body: str) -> list[dict]:
    """Conversation for the concierge, oldest-first: the opening member post plus
    public member/assistant messages (admin turns are excluded — once a human is in,
    the bot steps back)."""
    thread = [{"author_role": "member", "body": opening_body}]
    cur.execute(
        """SELECT author_role, body FROM help_messages
           WHERE question_id = %s AND visibility = 'public'
             AND author_role IN ('member','assistant')
           ORDER BY created_at ASC, id ASC""",
        (qid,),
    )
    for m in cur.fetchall():
        thread.append({"author_role": m["author_role"], "body": m["body"]})
    return thread


def _store_ai_reply(qid: int, reply: str, resolved: bool) -> None:
    """Insert the assistant message and move the question to its new status."""
    status = "ai_resolved" if resolved else "open"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO help_messages
                     (question_id, author_identity_id, author_role, body, visibility)
                   VALUES (%s, NULL, 'assistant', %s, 'public')""",
                (qid, reply),
            )
            if resolved:
                cur.execute(
                    "UPDATE help_questions SET status = 'ai_resolved' WHERE id = %s",
                    (qid,),
                )
            else:
                cur.execute(
                    "UPDATE help_questions SET status = 'open' WHERE id = %s",
                    (qid,),
                )
    return status


@router.post("/api/help/questions")
async def create_question(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    qbody = (body.get("body") or "").strip()
    category = (body.get("category") or "general").strip().lower()
    if category not in VALID_CATEGORIES:
        category = "general"
    page = (body.get("page_context") or "").strip()[:512] or None
    if not qbody:
        raise HTTPException(status_code=422, detail="Please type your question")
    # No separate subject box any more — derive a short subject for admin triage.
    subject = (body.get("subject") or "").strip()[:255] or qbody[:80]

    try:
        screenshot_path = help_domain.save_screenshot(body.get("screenshot_base64"))
    except help_domain.HelpError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail) from exc

    ai_on = help_ai.is_enabled()
    initial_status = "ai_pending" if ai_on else "open"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS n FROM help_questions
                   WHERE identity_id = %s AND created_at > (NOW() - INTERVAL 1 HOUR)""",
                (iid,),
            )
            if int(cur.fetchone()["n"]) >= RATE_PER_HOUR:
                raise HTTPException(
                    status_code=429,
                    detail="You've sent a lot of questions recently — please try again later.",
                )
            cur.execute("SELECT email FROM identities WHERE identity_id = %s", (iid,))
            row = cur.fetchone()
            email = (row["email"] if row else "") or ""
            cur.execute(
                """INSERT INTO help_questions
                     (identity_id, email, subject, body, category, page_context,
                      screenshot_path, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (iid, email, subject, qbody, category, page, screenshot_path, initial_status),
            )
            qid = int(cur.lastrowid)

    # AI answer happens OUTSIDE the DB transaction (network call).
    ai_payload = None
    resolved = False
    if ai_on:
        res = help_ai.answer(category, [{"author_role": "member", "body": qbody}])
        resolved = bool(res.get("resolved"))
        _store_ai_reply(qid, res["reply"], resolved)
        ai_payload = {"reply": res["reply"], "resolved": resolved}

    # Notify the human team only when a human is actually needed.
    if not ai_on or not resolved:
        help_domain.notify_admins_new_question(qid, subject, email or f"member {iid}")

    return {"ok": True, "id": qid, "status": ("ai_resolved" if resolved else "open"),
            "ai": ai_payload}


@router.get("/api/help/questions")
def list_my_questions(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, subject, body, category, status, closed_reason, page_context,
                          screenshot_path, created_at, updated_at, answered_at
                   FROM help_questions WHERE identity_id = %s
                   ORDER BY updated_at DESC, id DESC LIMIT 100""",
                (iid,),
            )
            rows = cur.fetchall()
    return {"questions": [_q_public(r) for r in rows]}


@router.get("/api/help/questions/{question_id}")
def get_my_question(question_id: int, request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, identity_id, subject, body, category, status, closed_reason,
                          page_context, screenshot_path, created_at, updated_at, answered_at
                   FROM help_questions WHERE id = %s""",
                (question_id,),
            )
            q = cur.fetchone()
            if not q or int(q["identity_id"]) != iid:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """SELECT id, author_role, body, rating, created_at FROM help_messages
                   WHERE question_id = %s AND visibility = 'public'
                   ORDER BY created_at ASC, id ASC""",
                (question_id,),
            )
            msgs = cur.fetchall()
    return {"question": _q_public(q), "messages": [_msg_public(m) for m in msgs]}


@router.post("/api/help/questions/{question_id}/messages")
async def add_my_message(question_id: int, request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    body = await request.json()
    text = (body.get("body") or "").strip() if isinstance(body, dict) else ""
    if not text:
        raise HTTPException(status_code=422, detail="Message is required")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, identity_id, subject, body, category, status FROM help_questions WHERE id = %s",
                (question_id,),
            )
            q = cur.fetchone()
            if not q or int(q["identity_id"]) != iid:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """INSERT INTO help_messages
                     (question_id, author_identity_id, author_role, body, visibility)
                   VALUES (%s, %s, 'member', %s, 'public')""",
                (question_id, iid, text),
            )
            status = q["status"]
            category = q["category"]
            opening = q["body"]

    # Bot is still handling this thread → let the concierge reply.
    if status in ("ai_resolved", "ai_pending") and help_ai.is_enabled():
        with db.transaction() as conn:
            with conn.cursor() as cur:
                thread = _load_ai_thread(cur, question_id, opening)
        res = help_ai.answer(category, thread)
        resolved = bool(res.get("resolved"))
        _store_ai_reply(question_id, res["reply"], resolved)
        if not resolved:
            help_domain.notify_admins_new_question(
                question_id, f"(escalated) {q['subject']}", f"member {iid}"
            )
        return {"ok": True, "ai": {"reply": res["reply"], "resolved": resolved}}

    # Human is in the loop (or AI off): a member follow-up re-opens for the team.
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE help_questions SET status = 'open' WHERE id = %s AND status = 'answered'",
                (question_id,),
            )
    help_domain.notify_admins_new_question(question_id, f"(reply) {q['subject']}", f"member {iid}")
    return {"ok": True, "ai": None}


@router.post("/api/help/questions/{question_id}/escalate")
async def escalate_to_human(question_id: int, request: Request) -> dict:
    """Member asks to talk to a person. Flags the thread for the team."""
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, identity_id, subject FROM help_questions WHERE id = %s",
                (question_id,),
            )
            q = cur.fetchone()
            if not q or int(q["identity_id"]) != iid:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """INSERT INTO help_messages
                     (question_id, author_identity_id, author_role, body, visibility)
                   VALUES (%s, NULL, 'assistant', %s, 'public')""",
                (question_id,
                 "No problem — I've passed this to our support team and they'll be in "
                 "touch shortly."),
            )
            cur.execute(
                "UPDATE help_questions SET status = 'open' WHERE id = %s",
                (question_id,),
            )
    help_domain.notify_admins_new_question(
        question_id, f"(human requested) {q['subject']}", f"member {iid}"
    )
    return {"ok": True}


CLOSE_REASONS = ("inactivity", "member", "resolved")


@router.post("/api/help/questions/{question_id}/close")
async def close_my_question(question_id: int, request: Request) -> dict:
    """Member (or the idle-timer) closes a bot-handled thread. Never closes a thread a
    human is actively on (open/answered) — the team still owes a reply there."""
    claims = require_session(request)
    iid = int(claims["identity_id"])
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001 — tolerate empty/invalid body
        body = {}
    reason = (body.get("reason") or "member").strip() if isinstance(body, dict) else "member"
    if reason not in CLOSE_REASONS:
        reason = "member"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, identity_id, status FROM help_questions WHERE id = %s",
                (question_id,),
            )
            q = cur.fetchone()
            if not q or int(q["identity_id"]) != iid:
                raise HTTPException(status_code=404, detail="Question not found")
            # Only close bot-handled threads; leave human/team threads untouched.
            if q["status"] not in ("ai_pending", "ai_resolved", "closed"):
                return {"ok": True, "status": q["status"], "skipped": "human in loop"}
            cur.execute(
                "UPDATE help_questions SET status = 'closed', closed_reason = %s WHERE id = %s",
                (reason, question_id),
            )
    return {"ok": True, "status": "closed", "reason": reason}


@router.post("/api/help/messages/{message_id}/rating")
async def rate_message(message_id: int, request: Request) -> dict:
    """Member rates one assistant answer 👍/👎. Feeds the self-improving loop."""
    claims = require_session(request)
    iid = int(claims["identity_id"])
    body = await request.json()
    rating = (body.get("rating") or "").strip().lower() if isinstance(body, dict) else ""
    if rating not in ("up", "down"):
        raise HTTPException(status_code=422, detail="rating must be 'up' or 'down'")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            # The message must be an assistant answer on a question this member owns.
            cur.execute(
                """SELECT m.id FROM help_messages m
                   JOIN help_questions q ON q.id = m.question_id
                   WHERE m.id = %s AND m.author_role = 'assistant' AND q.identity_id = %s""",
                (message_id, iid),
            )
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Message not found")
            cur.execute(
                "UPDATE help_messages SET rating = %s WHERE id = %s",
                (rating, message_id),
            )
    return {"ok": True, "rating": rating}
