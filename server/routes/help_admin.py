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
            # Tiered triage order (chronological within each tier):
            #   0 Open (new)        status=open, never answered — needs first reply
            #   0 ai_pending        AI hasn't responded yet
            #   1 Responded         status=open but answered_at set — member wrote
            #                       back after we answered (re-opened; needs a look)
            #   2 Answered          team replied, member hasn't come back
            #   3 ai_resolved       bot resolved it, no human action needed
            #   4 Closed            done — sinks to the bottom
            # team_reply_count = real public replies from the team (excludes the
            # AI assistant and internal notes) so the queue shows whether a human
            # has actually replied, not just the bot.
            cur.execute(
                f"""SELECT q.id, q.email, q.subject, q.category, q.status,
                           q.created_at, q.updated_at, q.answered_at,
                           q.screenshot_path,
                    (SELECT COUNT(*) FROM help_messages m WHERE m.question_id = q.id) AS reply_count,
                    (SELECT COUNT(*) FROM help_messages m WHERE m.question_id = q.id
                        AND m.author_role = 'admin' AND m.visibility = 'public') AS team_reply_count
                    FROM help_questions q
                    {where}
                    ORDER BY
                      CASE
                        WHEN q.status = 'open' AND q.answered_at IS NULL    THEN 0
                        WHEN q.status = 'ai_pending'                        THEN 0
                        WHEN q.status = 'open' AND q.answered_at IS NOT NULL THEN 1
                        WHEN q.status = 'answered'                          THEN 2
                        WHEN q.status = 'ai_resolved'                       THEN 3
                        WHEN q.status = 'closed'                            THEN 4
                        ELSE 5
                      END ASC,
                      q.updated_at DESC, q.id DESC
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
                "team_reply_count": int(r["team_reply_count"] or 0),
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


def _one(cur, sql: str, params: tuple = ()) -> dict:
    cur.execute(sql, params)
    return cur.fetchone() or {}


def _all(cur, sql: str, params: tuple = ()) -> list[dict]:
    cur.execute(sql, params)
    return cur.fetchall() or []


@router.get("/analytics")
def analytics(request: Request) -> dict:
    """Concierge + help-desk analytics and the escalation-driven doc-gap report.

    Two data sources: help_questions/help_messages give the all-time picture
    (volume, response/resolution time, backlog hotspots, AI ratings); help_ai_events
    gives forward-looking deflection, cost, and the doc-gap signal (reference_hit=0 =
    the AI had NO reference doc to answer from)."""
    require_admin(request)
    out: dict = {"range_days": 30}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out["by_status"] = {
                r["status"]: int(r["n"])
                for r in _all(cur, "SELECT status, COUNT(*) n FROM help_questions GROUP BY status")
            }
            out["total"] = sum(out["by_status"].values())

            out["volume_30d"] = [
                {"day": str(r["d"]), "n": int(r["n"])}
                for r in _all(cur,
                    """SELECT DATE(created_at) d, COUNT(*) n FROM help_questions
                       WHERE created_at >= (NOW() - INTERVAL 30 DAY)
                       GROUP BY DATE(created_at) ORDER BY d""")
            ]

            row = _one(cur,
                "SELECT SUM(status='ai_resolved') ai_res, COUNT(*) n FROM help_questions")
            total = int(row.get("n") or 0)
            ai_res = int(row.get("ai_res") or 0)
            out["ai_resolve_rate_all_time"] = round(ai_res / total, 3) if total else None

            fr = _one(cur,
                """SELECT AVG(TIMESTAMPDIFF(SECOND, q.created_at, fr.t))/3600 avg_h, COUNT(*) n
                   FROM help_questions q JOIN (
                     SELECT question_id, MIN(created_at) t FROM help_messages
                     WHERE author_role='admin' AND visibility='public' GROUP BY question_id
                   ) fr ON fr.question_id = q.id""")
            out["first_response_avg_hours"] = round(float(fr["avg_h"]), 1) if fr.get("avg_h") is not None else None
            out["first_response_count"] = int(fr.get("n") or 0)

            rs = _one(cur,
                """SELECT AVG(TIMESTAMPDIFF(SECOND, created_at, answered_at))/3600 avg_h, COUNT(*) n
                   FROM help_questions WHERE answered_at IS NOT NULL""")
            out["resolution_avg_hours"] = round(float(rs["avg_h"]), 1) if rs.get("avg_h") is not None else None
            out["resolution_count"] = int(rs.get("n") or 0)

            out["reopened_now"] = int(_one(cur,
                "SELECT COUNT(*) n FROM help_questions WHERE status='open' AND answered_at IS NOT NULL").get("n") or 0)

            rt = _one(cur,
                """SELECT SUM(rating='up') up, SUM(rating='down') down
                   FROM help_messages WHERE author_role='assistant' AND rating IS NOT NULL""")
            out["ratings"] = {"up": int(rt.get("up") or 0), "down": int(rt.get("down") or 0)}

            # Escalation hotspots = the doc backlog: open tickets with no team reply,
            # grouped by the app area the member was on.
            out["hotspots"] = [
                {"area": r["area"], "n": int(r["n"])}
                for r in _all(cur,
                    """SELECT COALESCE(NULLIF(q.page_context,''),'(unknown)') area, COUNT(*) n
                       FROM help_questions q
                       WHERE q.status='open' AND NOT EXISTS (
                         SELECT 1 FROM help_messages m WHERE m.question_id=q.id
                           AND m.author_role='admin' AND m.visibility='public')
                       GROUP BY area ORDER BY n DESC LIMIT 15""")
            ]

            out["bad_answers"] = [
                {"question_id": int(r["question_id"]), "subject": r["subject"],
                 "created_at": _iso(r["created_at"]), "excerpt": r["excerpt"]}
                for r in _all(cur,
                    """SELECT m.question_id, q.subject, m.created_at, LEFT(m.body,160) excerpt
                       FROM help_messages m JOIN help_questions q ON q.id=m.question_id
                       WHERE m.author_role='assistant' AND m.rating='down'
                       ORDER BY m.created_at DESC LIMIT 10""")
            ]

            # Forward-looking event metrics (empty until the AI runs post-deploy).
            try:
                ev = _one(cur,
                    """SELECT COUNT(*) total, SUM(resolved) resolved, SUM(reference_hit=0) doc_miss,
                              SUM(cost_usd) cost_total, AVG(cost_usd) avg_cost
                       FROM help_ai_events WHERE event_type IN ('answer','followup')""")
                ev_total = int(ev.get("total") or 0)
                ev_res = int(ev.get("resolved") or 0)
                out["events"] = {
                    "total": ev_total,
                    "resolved": ev_res,
                    "deflection_rate": round(ev_res / ev_total, 3) if ev_total else None,
                    "doc_miss": int(ev.get("doc_miss") or 0),
                    "cost_total_usd": round(float(ev.get("cost_total") or 0), 4),
                    "avg_cost_usd": round(float(ev["avg_cost"]), 5) if ev.get("avg_cost") is not None else None,
                    "cost_per_resolution_usd": round(float(ev.get("cost_total") or 0) / ev_res, 5) if ev_res else None,
                }
                out["doc_gaps"] = [
                    {"topic": r["topic"], "area": r["area"], "n": int(r["n"])}
                    for r in _all(cur,
                        """SELECT COALESCE(topic,'(none)') topic,
                                  COALESCE(NULLIF(page_context,''),'(unknown)') area, COUNT(*) n
                           FROM help_ai_events
                           WHERE reference_hit=0 AND event_type IN ('answer','followup')
                           GROUP BY topic, area ORDER BY n DESC LIMIT 15""")
                ]
            except Exception:  # noqa: BLE001 — table may not exist pre-migration
                out["events"] = {"total": 0, "resolved": 0, "deflection_rate": None,
                                 "doc_miss": 0, "cost_total_usd": 0, "avg_cost_usd": None,
                                 "cost_per_resolution_usd": None}
                out["doc_gaps"] = []
    return out
