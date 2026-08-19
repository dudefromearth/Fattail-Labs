"""Public native apply — server questions + Cole AC fields + tag 18.

No Calendly. Fail loud. Does not call waitlist sync_lead(). Spec:
FatTail-Native-Apply-Form-Spec-v0.1.md
"""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

from activecampaign import ACError
from apply_ac import APPLY_KEYS, write_application
from apply_invite import ApplyInviteError, is_when_valid, send_conversation_invite
from apply_questions import ApplyQuestionsError, add_question, content_check
from apply_questions import delete_question, email_from_answers, list_all
from apply_questions import mapped_ac_answers, move_question, public_payload
from apply_questions import store_submission, update_question
from apply_slots import ApplySlotsError, add_slot, delete_slot, is_live_when
from apply_slots import list_all as list_all_slots
from apply_slots import list_live, public_payload as public_slots
from apply_slots import update_starts

router = APIRouter(tags=["apply"])


def _require_admin(request: Request) -> dict:
    from guards import require_admin

    return require_admin(request)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _load_questions() -> list[dict]:
    try:
        rows = list_all()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply questions store is not available",
        ) from exc
    if not rows:
        raise HTTPException(
            status_code=503,
            detail="Apply questions are not configured",
        )
    return rows


def _require_listed_slot(when: str) -> str:
    raw = (when or "").strip()
    if not is_when_valid(raw):
        raise HTTPException(
            status_code=422,
            detail="ELEVEN_AM_ET must be a date-time from a listed conversation slot",
        )
    try:
        listed = is_live_when(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    if not listed:
        raise HTTPException(
            status_code=422,
            detail="That time is not a live conversation slot",
        )
    return raw


@router.get("/api/apply/form")
def public_apply_form() -> dict:
    questions = public_payload(_load_questions())
    try:
        slots = public_slots(list_live())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    return {"ok": True, "questions": questions, "slots": slots}


@router.get("/api/apply/slots")
def public_apply_slots() -> dict:
    try:
        slots = public_slots(list_live())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    return {"ok": True, "slots": slots}


@router.get("/api/admin/apply/questions")
def admin_list_questions(request: Request) -> dict:
    _require_admin(request)
    return {"ok": True, "questions": _load_questions()}


@router.post("/api/admin/apply/questions")
def admin_add_question(request: Request) -> dict:
    _require_admin(request)
    try:
        question = add_question()
    except ApplyQuestionsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "question": question}


@router.patch("/api/admin/apply/questions/{question_id}")
async def admin_patch_question(question_id: int, request: Request) -> dict:
    _require_admin(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    try:
        question = update_question(question_id, body)
    except ApplyQuestionsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "question": question}


@router.post("/api/admin/apply/questions/{question_id}/move")
async def admin_move_question(question_id: int, request: Request) -> dict:
    _require_admin(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    direction = str((body or {}).get("direction") or "").strip()
    if direction not in ("up", "down"):
        raise HTTPException(status_code=422, detail="direction must be up or down")
    try:
        questions = move_question(question_id, direction)
    except ApplyQuestionsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "questions": questions}


@router.delete("/api/admin/apply/questions/{question_id}")
def admin_delete_question(question_id: int, request: Request) -> dict:
    _require_admin(request)
    try:
        delete_question(question_id)
    except ApplyQuestionsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True}


@router.get("/api/admin/apply/slots")
def admin_list_apply_slots(request: Request) -> dict:
    _require_admin(request)
    try:
        slots = list_all_slots()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    return {"ok": True, "slots": slots}


@router.post("/api/admin/apply/slots")
def admin_add_apply_slot(request: Request) -> dict:
    _require_admin(request)
    try:
        slot = add_slot()
    except ApplySlotsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "slot": slot}


@router.patch("/api/admin/apply/slots/{slot_id}")
async def admin_patch_apply_slot(slot_id: int, request: Request) -> dict:
    _require_admin(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict) or "starts_et" not in body:
        raise HTTPException(status_code=422, detail="starts_et is required")
    try:
        slot = update_starts(slot_id, str(body.get("starts_et") or ""))
    except ApplySlotsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "slot": slot}


@router.delete("/api/admin/apply/slots/{slot_id}")
def admin_delete_apply_slot(slot_id: int, request: Request) -> dict:
    _require_admin(request)
    try:
        delete_slot(slot_id)
    except ApplySlotsError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True}


def _answers_from_body(body: dict, questions: list[dict]) -> dict[str, str]:
    blob = body.get("answers")
    src = blob if isinstance(blob, dict) else body
    out: dict[str, str] = {}
    for q in questions:
        slug = q["slug"]
        raw = src.get(slug)
        if raw is None and q.get("ac_key"):
            raw = src.get(q["ac_key"])
        if raw is None and q.get("is_email"):
            raw = body.get("email")
        out[slug] = "" if raw is None else str(raw)
    return out


@router.post("/api/apply")
async def submit_apply(request: Request) -> dict:
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    questions = _load_questions()
    answers = _answers_from_body(body, questions)
    try:
        slots = list_live()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc

    misses: list[str] = []
    for q in questions:
        miss = content_check(q, answers.get(q["slug"], ""), live_slots=slots)
        if miss:
            misses.append(f"{q['slug']}: {miss}")
    if misses:
        raise HTTPException(
            status_code=422,
            detail="Required answers missing: " + "; ".join(misses),
        )

    email = email_from_answers(questions, answers)
    if not email or not EMAIL_RE.match(email) or len(email) > 320:
        raise HTTPException(status_code=422, detail="Valid email required")

    ac_answers = mapped_ac_answers(questions, answers)
    mapped_keys = list(ac_answers.keys())
    for key in mapped_keys:
        if key == "ELEVEN_AM_ET":
            ac_answers[key] = _require_listed_slot(ac_answers[key])

    try:
        result = write_application(email, ac_answers, mapped_keys=mapped_keys)
    except ACError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        store_submission(
            email,
            questions,
            answers,
            ac_contact_id=str(result.get("contact_id") or "") or None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="The application wrote to ActiveCampaign but did not store on the server",
        ) from exc

    return {
        "ok": True,
        "contact_id": result["contact_id"],
        "tag_id": result["tag_id"],
    }


@router.post("/api/apply/invite")
async def send_apply_invite(request: Request) -> dict:
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    email = (body.get("email") or "").strip().lower()
    when = (body.get("when") or body.get("ELEVEN_AM_ET") or "").strip()
    if not email or not EMAIL_RE.match(email) or len(email) > 320:
        raise HTTPException(status_code=422, detail="Valid email required")
    when = _require_listed_slot(when)
    try:
        return send_conversation_invite(email, when)
    except ApplyInviteError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
