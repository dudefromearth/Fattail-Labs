"""require_access — HTTP hook-ready gate (Spec §8.3). No public decision route."""

from __future__ import annotations

from typing import Literal, Optional

from fastapi import HTTPException, Request

import db
from access_control.evaluate import evaluate
from access_control.policy import load_policy
from access_control.types import AccessDecision, TargetMeta
from access_control.viewer import parse_preview_cookie, viewer_from_claims
from guards import claims_or_none

CapabilityName = Literal["read", "export", "write"]

PREVIEW_COOKIE = "ft_access_preview"


def require_access(
    request: Request,
    target_key: str,
    *,
    capability: CapabilityName = "read",
    meta: Optional[TargetMeta] = None,
) -> AccessDecision:
    """Evaluate policy for request; raise 401/403/404 as appropriate.

    Returns AccessDecision on allow (including read_only_floor for read/export).
    Does **not** expose a public probe API — call from resource handlers only.
    """
    claims = claims_or_none(request)
    preview_raw = request.cookies.get(PREVIEW_COOKIE)
    preview = parse_preview_cookie(preview_raw)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            viewer = viewer_from_claims(cur, claims, preview_as=preview)
            policy = load_policy(cur, target_key)

    decision = evaluate(target_key, viewer, policy=policy, meta=meta)

    if decision.allow and decision.has_capability(capability):
        return decision

    if decision.allow and not decision.has_capability(capability):
        # e.g. read_only_floor but capability=write
        raise HTTPException(
            status_code=403,
            detail={
                "code": decision.code,
                "message": "Write not permitted for this access level",
                "access": decision.to_public_dict(),
            },
        )

    if decision.code == "signin_required":
        raise HTTPException(
            status_code=401,
            detail={
                "code": "signin_required",
                "message": "Sign in required",
                "access": decision.to_public_dict(),
            },
        )

    if decision.mode == "hide" or decision.code == "hidden":
        raise HTTPException(status_code=404, detail="Not found")

    raise HTTPException(
        status_code=403,
        detail={
            "code": decision.code,
            "message": "Access denied",
            "access": decision.to_public_dict(),
        },
    )
