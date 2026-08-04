"""Admin help desk — triage queue, full threads, answer, set status.

Admin session required. Answers stored in help_messages; a PUBLIC admin answer
marks the question answered and notifies the member (in-app + email).
Spec: FatTail-Labs-Help-System-Spec-v1.0.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import help as help_domain
from guards import require_admin

router = APIRouter(prefix="/api/admin/help", tags=["admin-help"])


def _iso(dt) -> str | None:
    return dt.isoformat() + "Z" if dt is not None else None


@router.get("/questions")
def list_questions(
    request: Request, status: str = "all", search: str = "", limit: int = 50, offset: int = 0
) -> dict:
    require_admin(request)
    limit = max(1, min(int(limit), 200))
    offset = max(0, int(offset))
    clauses, params = [], []
    if status in help_domain.STATUSES:
        clauses.append("q.status = %s")
        params.append(status)
    if search.strip():
        like = f"%{search.strip()}%"
        clauses.append("(q.subject LIKE %s OR q.email LIKE %s OR q.body LIKE %s)")
        params += [like, like, like]
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS n FROM help_questions q {where}", tuple(params))
            total = int(cur.fetchone()["n"])
            cur.execute(
                f"""SELECT q.id, q.email, q.subject, q.category, q.status,
                           q.created_at, q.updated_at, q.answered_at,
                           q.screenshot_path,
                    (SELECT COUNT(*) FROM help_messages m WHERE m.question_id = q.id) AS reply_count
                    FROM help_questions q
                    {where}
                    ORDER BY (q.status = 'open') DESC, q.updated_at DESC, q.id DESC
                    LIMIT %s OFFSET %s""",
                tuple(params) + (limit, offset),
            )
            rows = cur.fetchall()
    return {
        "questions": [
            {
                "id": int(r["id"]), "email": r["email"], "subject": r["subject"],
                "category": r["category"], "status": r["status"],
                "reply_count": int(r["reply_count"] or 0),
                "has_screenshot": bool(r.get("screenshot_path")),
                "created_at": _iso(r["created_at"]), "updated_at": _iso(r["updated_at"]),
                "answered_at": _iso(r["answered_at"]),
            }
            for r in rows
        ],
        "total": total, "limit": limit, "offset": offset, "status": status, "search": search,
    }


@router.get("/questions/{question_id}")
def get_question(question_id: int, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, identity_id, email, subject, body, category, status,
                          page_context, screenshot_path, created_at, updated_at, answered_at
                   FROM help_questions WHERE id = %s""",
                (question_id,),
            )
            q = cur.fetchone()
            if not q:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """SELECT id, author_identity_id, author_role, body, visibility, created_at
                   FROM help_messages WHERE question_id = %s
                   ORDER BY created_at ASC, id ASC""",
                (question_id,),
            )
            msgs = cur.fetchall()
    return {
        "question": {
            "id": int(q["id"]), "identity_id": int(q["identity_id"]), "email": q["email"],
            "subject": q["subject"], "body": q["body"], "category": q["category"],
            "status": q["status"], "page_context": q.get("page_context"),
            "screenshot_url": f"/api/media/{q['screenshot_path']}" if q.get("screenshot_path") else None,
            "created_at": _iso(q["created_at"]), "updated_at": _iso(q["updated_at"]),
            "answered_at": _iso(q["answered_at"]),
        },
        "messages": [
            {
                "id": int(m["id"]), "author_role": m["author_role"],
                "visibility": m["visibility"], "body": m["body"],
                "created_at": _iso(m["created_at"]),
            }
            for m in msgs
        ],
    }


@router.post("/questions/{question_id}/messages")
async def answer_question(question_id: int, request: Request) -> dict:
    claims = require_admin(request)
    admin_id = int(claims.get("identity_id") or 0) or None
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    text = (body.get("body") or "").strip()
    visibility = body.get("visibility", "public")
    if visibility not in ("public", "internal"):
        raise HTTPException(status_code=422, detail="visibility must be public|internal")
    if not text:
        raise HTTPException(status_code=422, detail="Message is required")

    email_after = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, identity_id, email, subject FROM help_questions WHERE id = %s",
                (question_id,),
            )
            q = cur.fetchone()
            if not q:
                raise HTTPException(status_code=404, detail="Question not found")
            cur.execute(
                """INSERT INTO help_messages
                     (question_id, author_identity_id, author_role, body, visibility)
                   VALUES (%s, %s, 'admin', %s, %s)""",
                (question_id, admin_id, text, visibility),
            )
            msg_id = int(cur.lastrowid)
            if visibility == "public":
                cur.execute(
                    "UPDATE help_questions SET status = 'answered', answered_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (question_id,),
                )
                # Member in-app notification inside this txn (best-effort).
                help_domain.notify_member_answered_inapp(
                    cur, identity_id=int(q["identity_id"]), question_id=question_id,
                    subject=q["subject"], message_id=msg_id,
                )
                email_after = (q["email"], q["subject"])

    # Email after commit so SMTP latency never holds the transaction.
    if email_after:
        help_domain.email_member_answered(
            member_email=email_after[0], question_id=question_id, subject=email_after[1]
        )
    return {"ok": True}


@router.patch("/questions/{question_id}/status")
async def set_status(question_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    new_status = (body.get("status") or "").strip() if isinstance(body, dict) else ""
    if new_status not in help_domain.STATUSES:
        raise HTTPException(
            status_code=422, detail=f"status must be one of {help_domain.STATUSES}"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            answered_set = ", answered_at = CURRENT_TIMESTAMP" if new_status == "answered" else ""
            cur.execute(
                f"UPDATE help_questions SET status = %s{answered_set} WHERE id = %s",
                (new_status, question_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Question not found")
    return {"ok": True, "status": new_status}
