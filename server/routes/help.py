"""Member help desk — ask questions, view own threads, post follow-ups.

Member session required; a member can only see/act on their OWN questions.
Spec: FatTail-Labs-Help-System-Spec-v1.0.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import help as help_domain
from guards import require_session

router = APIRouter(tags=["help"])

RATE_PER_HOUR = 10


def _iso(dt) -> str | None:
    return dt.isoformat() + "Z" if dt is not None else None


def _q_public(r: dict) -> dict:
    return {
        "id": int(r["id"]),
        "subject": r["subject"],
        "body": r["body"],
        "category": r["category"],
        "status": r["status"],
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
        "created_at": _iso(r.get("created_at")),
    }


@router.post("/api/help/questions")
async def create_question(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    subject = (body.get("subject") or "").strip()[:255]
    qbody = (body.get("body") or "").strip()
    category = (body.get("category") or "general").strip()[:64] or "general"
    page = (body.get("page_context") or "").strip()[:512] or None
    if not subject:
        raise HTTPException(status_code=422, detail="Subject is required")
    if not qbody:
        raise HTTPException(status_code=422, detail="Please describe your question")

    try:
        screenshot_path = help_domain.save_screenshot(body.get("screenshot_base64"))
    except help_domain.HelpError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail) from exc

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
                     (identity_id, email, subject, body, category, page_context, screenshot_path)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (iid, email, subject, qbody, category, page, screenshot_path),
            )
            qid = int(cur.lastrowid)

    help_domain.notify_admins_new_question(qid, subject, email or f"member {iid}")
    return {"ok": True, "id": qid}


@router.get("/api/help/questions")
def list_my_questions(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, subject, body, category, status, page_context,
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
                """SELECT id, identity_id, subject, body, category, status,
                          page_context, screenshot_path, created_at, updated_at, answered_at
                   FROM help_questions WHERE id = %s""",
                (question_id,),
            )
            q = cur.fetchone()
            if not q or int(q["identity_id"]) != iid:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """SELECT id, author_role, body, created_at FROM help_messages
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
                "SELECT id, identity_id, subject FROM help_questions WHERE id = %s",
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
            # A member follow-up re-opens the question for the team.
            cur.execute(
                "UPDATE help_questions SET status = 'open' WHERE id = %s AND status = 'answered'",
                (question_id,),
            )
    help_domain.notify_admins_new_question(question_id, f"(reply) {q['subject']}", f"member {iid}")
    return {"ok": True}
