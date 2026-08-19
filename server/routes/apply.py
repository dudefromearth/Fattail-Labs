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
from apply_score import ApplyScoreError, endings_live, list_hosts, public_hosts
from apply_score import resolve_ending, settings as score_settings, update_host
from apply_score import walk_path
from apply_slots import ApplySlotsError, add_slot, delete_slot, is_live_when
from apply_slots import list_all as list_all_slots
from apply_slots import list_live, public_payload as public_slots
from apply_slots import update_host as update_slot_host
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


def _require_listed_slot(when: str, host: str | None = None) -> str:
    raw = (when or "").strip()
    if not is_when_valid(raw):
        raise HTTPException(
            status_code=422,
            detail="ELEVEN_AM_ET must be a date-time from a listed conversation slot",
        )
    try:
        listed = is_live_when(raw, host) if host else is_live_when(raw)
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


def _score_bundle(questions: list[dict]) -> dict:
    live = endings_live(questions)
    try:
        conf = score_settings()
        hosts = public_hosts(list_hosts())
    except Exception:
        conf = {
            "tie_ending": "trial",
            "trial_url": "https://fattail.ai/try",
            "trial_price": "$17/wk",
            "trial_term": "six weeks",
        }
        hosts = [
            {"slug": "coach", "display_name": "Coach (Ernie)"},
            {"slug": "lakesia", "display_name": "Lakesia"},
        ]
    return {
        "endings_live": live,
        "tie_ending": conf["tie_ending"],
        "trial_url": conf["trial_url"],
        "trial_price": conf["trial_price"],
        "trial_term": conf["trial_term"],
        "hosts": hosts,
    }


@router.get("/api/apply/form")
def public_apply_form() -> dict:
    rows = _load_questions()
    questions = public_payload(rows)
    try:
        slots = public_slots(list_live())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    score = _score_bundle(rows)
    return {
        "ok": True,
        "questions": questions,
        "slots": slots,
        "score": score,
    }


@router.get("/api/apply/slots")
def public_apply_slots(host: str | None = None) -> dict:
    key = (host or "").strip() or None
    if key and key not in ("coach", "lakesia"):
        raise HTTPException(status_code=422, detail="host must be coach or lakesia")
    try:
        slots = public_slots(list_live(key) if key else list_live())
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


@router.get("/api/admin/apply/hosts")
def admin_list_hosts(request: Request) -> dict:
    _require_admin(request)
    try:
        hosts = list_hosts()
        conf = score_settings()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply score map is not available",
        ) from exc
    return {"ok": True, "hosts": hosts, "score": conf}


@router.patch("/api/admin/apply/hosts/{slug}")
async def admin_patch_host(slug: str, request: Request) -> dict:
    _require_admin(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    try:
        host = update_host(slug, body)
    except ApplyScoreError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True, "host": host}


@router.post("/api/admin/apply/slots")
async def admin_add_apply_slot(request: Request) -> dict:
    _require_admin(request)
    host = "coach"
    try:
        body = await request.json()
        if isinstance(body, dict) and body.get("host"):
            host = str(body.get("host") or "coach")
    except Exception:
        host = "coach"
    try:
        slot = add_slot(host)
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
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    try:
        slot = None
        if "starts_et" in body:
            slot = update_starts(slot_id, str(body.get("starts_et") or ""))
        if "host" in body:
            slot = update_slot_host(slot_id, str(body.get("host") or ""))
        if slot is None:
            raise HTTPException(status_code=422, detail="starts_et or host is required")
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
    live_endings = endings_live(questions)
    try:
        conf = score_settings()
    except Exception:
        conf = {"tie_ending": "trial"}
    path = walk_path(questions, answers, skip_calendar=live_endings)
    try:
        all_slots = list_live()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc

    misses: list[str] = []
    for q in path:
        host_slots = all_slots
        if q.get("qtype") == "calendar" and live_endings:
            continue
        miss = content_check(q, answers.get(q["slug"], ""), live_slots=host_slots)
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

    ending = (
        resolve_ending(questions, answers, tie_ending=conf.get("tie_ending", "trial"))
        if live_endings
        else None
    )
    if live_endings and ending is None:
        raise HTTPException(status_code=422, detail="Apply ending did not resolve")

    when = (body.get("when") or body.get("ELEVEN_AM_ET") or "").strip()
    ac_answers = mapped_ac_answers(questions, answers)
    mapped_keys = list(ac_answers.keys())

    if ending == "trial":
        ac_answers.pop("ELEVEN_AM_ET", None)
        mapped_keys = [k for k in mapped_keys if k != "ELEVEN_AM_ET"]
    elif ending in ("coach", "lakesia"):
        host_slots = [s for s in all_slots if s.get("host") == ending]
        if not host_slots:
            raise HTTPException(
                status_code=422,
                detail=f"No live {ending} conversation times are configured.",
            )
        when = _require_listed_slot(when, ending)
        ac_answers["ELEVEN_AM_ET"] = when
        if "ELEVEN_AM_ET" not in mapped_keys:
            mapped_keys.append("ELEVEN_AM_ET")
    else:
        for key in list(mapped_keys):
            if key == "ELEVEN_AM_ET":
                ac_answers[key] = _require_listed_slot(ac_answers[key])

    try:
        result = write_application(email, ac_answers, mapped_keys=mapped_keys)
    except ACError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        store_submission(
            email,
            path,
            answers,
            ac_contact_id=str(result.get("contact_id") or "") or None,
            ending=ending,
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
        "ending": ending,
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
    host = (body.get("host") or "").strip() or None
    if host == "trial":
        raise HTTPException(
            status_code=422,
            detail="Trial ending does not send a calendar invite",
        )
    if host and host not in ("coach", "lakesia"):
        raise HTTPException(status_code=422, detail="host must be coach or lakesia")
    if not email or not EMAIL_RE.match(email) or len(email) > 320:
        raise HTTPException(status_code=422, detail="Valid email required")
    when = _require_listed_slot(when, host)
    try:
        return send_conversation_invite(email, when, host)
    except ApplyInviteError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
