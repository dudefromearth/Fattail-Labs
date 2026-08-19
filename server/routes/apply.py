"""Public native apply submit — writes Cole's seven AC fields + tag 18.

Fail loud. Does not call waitlist sync_lead(). Spec:
FatTail-Native-Apply-Form-Spec-v0.1.md
"""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

from activecampaign import ACError
from apply_ac import APPLY_KEYS, write_application

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
    eleven = str(answers.get("ELEVEN_AM_ET") or "").strip().lower()
    required = [k for k in APPLY_KEYS if k != "PARTNER_SUPPORT"]
    if eleven == "yes":
        required.append("PARTNER_SUPPORT")
    missing = [k for k in required if not str(answers.get(k) or "").strip()]
    if missing:
        raise HTTPException(
            status_code=422,
            detail="Required answers missing: " + ", ".join(missing),
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
