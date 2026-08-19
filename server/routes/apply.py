"""Public native apply submit — writes Cole's seven AC fields + tag 18.

Conversation times are server-owned slots (apply_slots). No Calendly.
Fail loud. Does not call waitlist sync_lead(). Spec:
FatTail-Native-Apply-Form-Spec-v0.1.md
"""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

from activecampaign import ACError
from apply_ac import APPLY_KEYS, write_application
from apply_invite import ApplyInviteError, is_when_valid, send_conversation_invite
from apply_slots import ApplySlotsError, add_slot, delete_slot, is_live_when
from apply_slots import list_all, list_live, public_payload, update_starts

router = APIRouter(tags=["apply"])


def _require_admin(request: Request) -> dict:
    from guards import require_admin

    return require_admin(request)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _require_listed_slot(when: str) -> str:
    raw = (when or "").strip()
    if not is_when_valid(raw):
        raise HTTPException(
            status_code=422,
            detail="ELEVEN_AM_ET must be a date-time from a listed conversation slot",
        )
    try:
        listed = is_live_when(raw)
    except Exception as exc:  # noqa: BLE001 — fail loud; do not invent a time
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


@router.get("/api/apply/slots")
def public_apply_slots() -> dict:
    """Applicant list — live slots only. Empty list is truthful, not invented."""
    try:
        slots = public_payload(list_live())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail="Apply slots store is not available",
        ) from exc
    return {"ok": True, "slots": slots}


@router.get("/api/admin/apply/slots")
def admin_list_apply_slots(request: Request) -> dict:
    _require_admin(request)
    try:
        slots = list_all()
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


@router.post("/api/apply")
async def submit_apply(request: Request) -> dict:
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001 — public form; fail loud on junk
        raise HTTPException(status_code=422, detail="JSON object required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    email = (body.get("email") or "").strip().lower()
    if not email or not EMAIL_RE.match(email) or len(email) > 320:
        raise HTTPException(status_code=422, detail="Valid email required")

    answers = {k: body.get(k) for k in APPLY_KEYS}
    missing = [k for k in APPLY_KEYS if not str(answers.get(k) or "").strip()]
    if missing:
        raise HTTPException(
            status_code=422,
            detail="Required answers missing: " + ", ".join(missing),
        )
    answers["ELEVEN_AM_ET"] = _require_listed_slot(
        str(answers.get("ELEVEN_AM_ET") or "")
    )

    try:
        result = write_application(email, answers)
    except ACError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {
        "ok": True,
        "contact_id": result["contact_id"],
        "tag_id": result["tag_id"],
    }


@router.post("/api/apply/invite")
async def send_apply_invite(request: Request) -> dict:
    """Mail an ICS REQUEST when they accept a listed conversation slot.

    Fail loud if SMTP is unset. The form still lets them keep the time.
    """
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
