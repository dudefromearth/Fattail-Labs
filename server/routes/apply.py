"""Public native apply — write Cole's seven AC fields + tag 18.

POST /api/apply is unauthenticated. CORS allowlist is fattail.ai only
(native Labs page is same-origin via the Next rewrite). Fail loud: AC
miss is not success. Does not inherit waitlist sync_lead() best-effort.

Spec: FatTail-Native-Apply-Form-Spec-v0.2.md · DL-450.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

import activecampaign
from activecampaign import (
    ACError,
    APPLY_FIELD_KEYS,
    APPLY_SKU_VALUES,
    APPLY_TAG_ID,
    APPLY_YES_NO,
)

log = logging.getLogger("labs.apply")

router = APIRouter(tags=["apply"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

APPLY_CORS_ORIGINS = frozenset(
    {
        "https://fattail.ai",
        "https://www.fattail.ai",
    }
)

FIELD_MAX: dict[str, int] = {
    "hell": 8000,
    "heaven": 8000,
    "money_timing": 4000,
    "coaching_sku": 200,
    "eleven_am_et": 16,
    "tried": 8000,
    "partner_support": 16,
}

YES_NO = {v.lower(): v for v in APPLY_YES_NO}


def _apply_cors_headers(request: Request, response: Response) -> Response:
    origin = (request.headers.get("origin") or "").strip().rstrip("/")
    if origin in APPLY_CORS_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Max-Age"] = "86400"
        response.headers["Vary"] = "Origin"
    return response


class ApplyCorsMiddleware(BaseHTTPMiddleware):
    """CORS for POST /api/apply from fattail.ai. Other routes unchanged."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path.rstrip("/") or "/"
        if path != "/api/apply":
            return await call_next(request)
        if request.method.upper() == "OPTIONS":
            return _apply_cors_headers(request, Response(status_code=204))
        response = await call_next(request)
        return _apply_cors_headers(request, response)


def _validate_body(body: Any) -> tuple[str, dict[str, str]]:
    if not isinstance(body, dict):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_body", "message": "JSON object required"},
        )

    fields: dict[str, str] = {}
    errors: dict[str, str] = {}

    email = str(body.get("email") or "").strip().lower()
    if not email:
        errors["email"] = "Email is required."
    elif not EMAIL_RE.match(email) or len(email) > 254:
        errors["email"] = "Enter a valid email."

    for key in APPLY_FIELD_KEYS:
        raw = str(body.get(key) or "").strip()
        if not raw:
            errors[key] = "This is required."
            continue
        if len(raw) > FIELD_MAX[key]:
            errors[key] = f"Keep this under {FIELD_MAX[key]} characters."
            continue
        if key == "coaching_sku":
            if raw not in APPLY_SKU_VALUES:
                errors[key] = "Choose a coaching option."
                continue
        if key in ("eleven_am_et", "partner_support"):
            mapped = YES_NO.get(raw.lower())
            if mapped is None:
                errors[key] = "Choose Yes or No."
                continue
            raw = mapped
        fields[key] = raw

    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "validation",
                "message": "Every field is required.",
                "fields": errors,
            },
        )
    return email, fields


@router.post("/api/apply")
def submit_apply(request: Request, body: dict) -> dict:
    email, fields = _validate_body(body)
    try:
        result = activecampaign.sync_apply(email, fields)
    except ACError as exc:
        log.warning("apply AC miss for %s: %s", email, exc)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ac_write_failed",
                "message": (
                    "We could not record your application. "
                    "Nothing was marked complete. Try again."
                ),
            },
        ) from exc
    except Exception as exc:  # noqa: BLE001 — fail the submit, never silent
        log.warning("apply unexpected error for %s: %s", email, exc)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ac_write_failed",
                "message": (
                    "We could not record your application. "
                    "Nothing was marked complete. Try again."
                ),
            },
        ) from exc

    if result.get("status") != "synced" or not result.get("contact_id"):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ac_write_failed",
                "message": (
                    "We could not record your application. "
                    "Nothing was marked complete. Try again."
                ),
            },
        )

    return {
        "ok": True,
        "contact_id": result["contact_id"],
        "tag_id": result.get("tag_id") or APPLY_TAG_ID,
    }


@router.options("/api/apply")
def apply_preflight() -> Response:
    # Middleware stamps CORS; this keeps FastAPI from 405 on OPTIONS.
    return Response(status_code=204)
