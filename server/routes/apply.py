"""Public native apply submit — writes Cole's seven AC fields + tag 18.

Fail loud. Does not call waitlist sync_lead(). Spec:
FatTail-Native-Apply-Form-Spec-v0.1.md
"""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

from activecampaign import ACError
from apply_ac import APPLY_KEYS, write_application
from apply_invite import ApplyInviteError, is_when_valid, send_conversation_invite

router = APIRouter(tags=["apply"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
    eleven = str(answers.get("ELEVEN_AM_ET") or "").strip()
    if not is_when_valid(eleven):
        raise HTTPException(
            status_code=422,
            detail="ELEVEN_AM_ET must be a date-time in America/New_York",
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
    """Mail an ICS REQUEST when they accept the conversation time.

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
    if not is_when_valid(when):
        raise HTTPException(
            status_code=422,
            detail="Pick a date and time in America/New_York",
        )
    try:
        return send_conversation_invite(email, when)
    except ApplyInviteError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
