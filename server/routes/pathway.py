"""Pathway assessment (Pathway Spec v1.0): 4-question intake -> deterministic
course sequence. Step 1 is ALWAYS the flagship — positioning made mechanical."""

import json

from fastapi import APIRouter, HTTPException, Request

import db
from guards import require_session
from routes.member import _course_summary

router = APIRouter(tags=["pathway"])

FLAGSHIP = "first-stop-the-bleeding"

QUESTIONS = {
    "experience": {"new", "some", "experienced"},
    "account": {"bleeding", "flat", "growing"},
    "struggle": {"risk", "chasing", "routine", "edge"},
    "time": {"minutes", "hour", "more"},
}


def build_sequence(answers: dict) -> list[str]:
    """Spec §2. Deterministic; step 1 is the flagship for every answer set."""
    seq = [FLAGSHIP]
    if answers["experience"] == "new":
        seq.append("options-foundations")
    seq.append("zero-dte-essentials")
    struggle = answers["struggle"]
    if struggle == "chasing":
        seq.append("trader-psychology")
    elif struggle == "routine":
        seq.append("the-trading-routine")
    elif struggle == "risk":
        seq.append("sizing-and-capital-gates")
    seq.append("butterfly-foundations")
    for slug in ("sizing-and-capital-gates", "trader-psychology", "the-trading-routine"):
        if slug not in seq:
            seq.append(slug)
    seq += ["convexity-and-asymmetry", "the-fat-tail-doctrine", "marketswarm-platform-primer"]
    # Dedupe preserving order.
    seen: set[str] = set()
    return [s for s in seq if not (s in seen or seen.add(s))]


def _overlay(cur, identity_id: int, slugs: list[str]) -> list[dict]:
    if not slugs:
        return []
    placeholders = ",".join(["%s"] * len(slugs))
    cur.execute(
        f"""SELECT id, slug, title, level FROM courses
            WHERE slug IN ({placeholders}) AND status = 'published'""",
        slugs,
    )
    by_slug = {r["slug"]: r for r in cur.fetchall()}
    steps = []
    for slug in slugs:
        course = by_slug.get(slug)
        if course is None:
            continue  # unpublished/missing courses drop out of the rendered path
        summary = _course_summary(cur, identity_id, course["id"])
        steps.append(
            {
                "slug": slug,
                "title": course["title"],
                "level": course["level"],
                "percent": summary["percent"],
                "done": summary["total"] > 0 and summary["done"] >= summary["total"],
                "resume": summary["resume"],
            }
        )
    return steps


@router.get("/api/me/pathway")
def get_pathway(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT assessment_json, course_sequence_json FROM pathways WHERE identity_id = %s",
                (claims["identity_id"],),
            )
            row = cur.fetchone()
            if row is None:
                return {"pathway": None}
            answers = json.loads(row["assessment_json"]) if isinstance(
                row["assessment_json"], (str, bytes)
            ) else row["assessment_json"]
            slugs = json.loads(row["course_sequence_json"]) if isinstance(
                row["course_sequence_json"], (str, bytes)
            ) else row["course_sequence_json"]
            steps = _overlay(cur, claims["identity_id"], slugs)
    return {"pathway": {"answers": answers, "steps": steps}}


@router.post("/api/me/pathway")
async def set_pathway(request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    answers = body.get("answers") or {}
    for key, valid in QUESTIONS.items():
        if answers.get(key) not in valid:
            raise HTTPException(
                status_code=422,
                detail=f"answer for '{key}' must be one of {sorted(valid)}",
            )
    answers = {k: answers[k] for k in QUESTIONS}
    sequence = build_sequence(answers)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO pathways (identity_id, assessment_json, course_sequence_json)
                   VALUES (%s, %s, %s)
                   ON DUPLICATE KEY UPDATE assessment_json = VALUES(assessment_json),
                                           course_sequence_json = VALUES(course_sequence_json)""",
                (claims["identity_id"], json.dumps(answers), json.dumps(sequence)),
            )
            steps = _overlay(cur, claims["identity_id"], sequence)
    return {"pathway": {"answers": answers, "steps": steps}}
