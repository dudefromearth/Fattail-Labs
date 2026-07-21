"""Quizzes (Quizzes Spec v1.0): server-side grading, attempt records, admin
question CRUD. A quiz is a lesson kind; access follows the standard matrix."""

import json

from fastapi import APIRouter, HTTPException, Request

import auth
import db
from config import get_config
from routes.member import _lesson_for_access, require_session

router = APIRouter(tags=["quizzes"])

QUESTION_KINDS = frozenset({"multiple_choice", "binary", "short_answer"})


def _load(raw):
    return json.loads(raw) if isinstance(raw, (str, bytes)) else raw


def public_questions(cur, lesson_id: int) -> list[dict]:
    """Questions WITHOUT correct answers — safe for the lesson payload."""
    cur.execute(
        """SELECT id, kind, prompt_md, options_json FROM quiz_questions
           WHERE lesson_id = %s ORDER BY sort_order""",
        (lesson_id,),
    )
    return [
        {
            "id": q["id"],
            "kind": q["kind"],
            "prompt_md": q["prompt_md"],
            "options": _load(q["options_json"]) if q["options_json"] else None,
        }
        for q in cur.fetchall()
    ]


def _grade(kind: str, correct, answer) -> bool:
    if kind == "multiple_choice":
        try:
            return int(answer) == int(correct)
        except (TypeError, ValueError):
            return False
    if kind == "binary":
        return isinstance(answer, bool) and answer == bool(correct)
    if kind == "short_answer":
        if not isinstance(answer, str):
            return False
        normalized = answer.strip().lower()
        return any(normalized == str(a).strip().lower() for a in correct)
    return False


@router.post("/api/courses/{course_slug}/lessons/{lesson_slug}/quiz")
async def submit_quiz(course_slug: str, lesson_slug: str, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    answers = body.get("answers") or {}
    if not isinstance(answers, dict):
        raise HTTPException(status_code=422, detail="answers must be an object")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            lesson = _lesson_for_access(cur, course_slug, lesson_slug, claims["role"])
            if lesson["kind"] != "quiz":
                raise HTTPException(status_code=422, detail="Not a quiz lesson")
            cur.execute(
                """SELECT id, kind, correct_json, explanation_md FROM quiz_questions
                   WHERE lesson_id = %s ORDER BY sort_order""",
                (lesson["id"],),
            )
            questions = cur.fetchall()
            if not questions:
                raise HTTPException(status_code=422, detail="Quiz has no questions")

            results = []
            score = 0
            for q in questions:
                correct_value = _load(q["correct_json"])
                answer = answers.get(str(q["id"]), answers.get(q["id"]))
                ok = _grade(q["kind"], correct_value, answer)
                score += 1 if ok else 0
                results.append(
                    {
                        "question_id": q["id"],
                        "correct": ok,
                        "correct_answer": correct_value,
                        "explanation": q["explanation_md"],
                    }
                )

            cur.execute(
                """INSERT INTO quiz_attempts
                     (identity_id, lesson_id, score, total, answers_json)
                   VALUES (%s, %s, %s, %s, %s)""",
                (claims["identity_id"], lesson["id"], score, len(questions),
                 json.dumps(answers)),
            )
            # First submission completes the lesson (any score).
            cur.execute(
                """INSERT INTO lesson_progress
                     (identity_id, lesson_id, watch_seconds, last_position, completed_at)
                   VALUES (%s, %s, 0, 0, NOW())
                   ON DUPLICATE KEY UPDATE completed_at = COALESCE(completed_at, NOW())""",
                (claims["identity_id"], lesson["id"]),
            )
            from routes.member import _ensure_enrollment, _refresh_course_completion
            _ensure_enrollment(cur, claims["identity_id"], lesson["course_id"])
            _refresh_course_completion(cur, claims["identity_id"], lesson["course_id"])

    return {"score": score, "total": len(questions), "completed": True, "results": results}


@router.get("/api/me/quiz-results")
def my_quiz_results(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT qa.score, qa.total, qa.submitted_at,
                          l.slug AS lesson_slug, l.title AS lesson_title,
                          c.slug AS course_slug, c.title AS course_title
                   FROM quiz_attempts qa
                   JOIN lessons l ON qa.lesson_id = l.id
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE qa.identity_id = %s AND c.status = 'published'
                   ORDER BY qa.submitted_at DESC LIMIT 50""",
                (claims["identity_id"],),
            )
            rows = cur.fetchall()
    return {
        "attempts": [
            {
                "quiz_title": r["lesson_title"],
                "lesson_slug": r["lesson_slug"],
                "course_slug": r["course_slug"],
                "course_title": r["course_title"],
                "score": r["score"],
                "total": r["total"],
                "submitted_at": r["submitted_at"].isoformat(),
            }
            for r in rows
        ]
    }


# --- admin question CRUD ------------------------------------------------------

def _require_admin(request: Request) -> dict:
    claims = require_session(request)
    if not auth.role_at_least(claims["role"], "administrator"):
        raise HTTPException(status_code=403, detail="Administrator role required")
    return claims


def _validate_question(body: dict) -> dict:
    kind = body.get("kind")
    prompt = (body.get("prompt_md") or "").strip()
    if kind not in QUESTION_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(QUESTION_KINDS)}")
    if not prompt:
        raise HTTPException(status_code=422, detail="prompt_md required")
    options = body.get("options")
    correct = body.get("correct")
    if kind == "multiple_choice":
        if not isinstance(options, list) or len(options) < 2:
            raise HTTPException(status_code=422, detail="multiple_choice needs >=2 options")
        if not isinstance(correct, int) or not 0 <= correct < len(options):
            raise HTTPException(status_code=422, detail="correct must be a valid option index")
    elif kind == "binary":
        options = None
        if not isinstance(correct, bool):
            raise HTTPException(status_code=422, detail="correct must be true/false")
    else:  # short_answer
        options = None
        if not isinstance(correct, list) or not correct or not all(
            isinstance(a, str) and a.strip() for a in correct
        ):
            raise HTTPException(status_code=422, detail="correct must be a non-empty list of answers")
    return {
        "kind": kind,
        "prompt_md": prompt,
        "options_json": json.dumps(options) if options is not None else None,
        "correct_json": json.dumps(correct),
        "explanation_md": (body.get("explanation_md") or "").strip() or None,
    }


@router.get("/api/admin/lessons/{lesson_id}/questions")
def admin_questions(lesson_id: int, request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, kind, prompt_md, options_json, correct_json, explanation_md
                   FROM quiz_questions WHERE lesson_id = %s ORDER BY sort_order""",
                (lesson_id,),
            )
            rows = cur.fetchall()
    return {
        "questions": [
            {
                "id": r["id"],
                "kind": r["kind"],
                "prompt_md": r["prompt_md"],
                "options": _load(r["options_json"]) if r["options_json"] else None,
                "correct": _load(r["correct_json"]),
                "explanation_md": r["explanation_md"],
            }
            for r in rows
        ]
    }


@router.post("/api/admin/lessons/{lesson_id}/questions")
async def create_question(lesson_id: int, request: Request) -> dict:
    _require_admin(request)
    fields = _validate_question(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM lessons WHERE id = %s", (lesson_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Lesson not found")
            cur.execute(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM quiz_questions WHERE lesson_id = %s",
                (lesson_id,),
            )
            nxt = cur.fetchone()["nxt"]
            cur.execute(
                """INSERT INTO quiz_questions
                     (lesson_id, sort_order, kind, prompt_md, options_json,
                      correct_json, explanation_md)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (lesson_id, nxt, fields["kind"], fields["prompt_md"],
                 fields["options_json"], fields["correct_json"], fields["explanation_md"]),
            )
            return {"id": cur.lastrowid}


@router.put("/api/admin/questions/{question_id}")
async def update_question(question_id: int, request: Request) -> dict:
    _require_admin(request)
    fields = _validate_question(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE quiz_questions SET kind=%s, prompt_md=%s, options_json=%s,
                          correct_json=%s, explanation_md=%s WHERE id=%s""",
                (fields["kind"], fields["prompt_md"], fields["options_json"],
                 fields["correct_json"], fields["explanation_md"], question_id),
            )
            cur.execute("SELECT 1 FROM quiz_questions WHERE id = %s", (question_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Question not found")
    return {"ok": True}


@router.delete("/api/admin/questions/{question_id}")
def delete_question(question_id: int, request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM quiz_questions WHERE id = %s", (question_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Question not found")
    return {"ok": True}
