"""Build ViewerContext from request / claims — AC1-3."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional, Sequence

from access_control.types import PreviewAs, ViewerContext


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def viewer_from_parts(
    *,
    identity_id: Optional[int],
    session_role: str = "observer",
    access_role: Optional[str] = None,
    plan_slugs: Sequence[str] = (),
    enrolled_course_ids: Sequence[int] = (),
    is_admin: Optional[bool] = None,
    signed_in: Optional[bool] = None,
    campaign_tags: Sequence[str] = (),
    now: Optional[datetime] = None,
    preview_as: Optional[PreviewAs] = None,
) -> ViewerContext:
    """Pure constructor for tests and request adapters."""
    role = session_role if session_role else "observer"
    ar = access_role if access_role is not None else role
    admin = bool(is_admin) if is_admin is not None else (role == "administrator")
    sid = bool(signed_in) if signed_in is not None else (identity_id is not None)
    return ViewerContext(
        identity_id=identity_id,
        signed_in=sid,
        is_admin=admin,
        session_role=role,
        access_role=ar,
        plan_slugs=tuple(plan_slugs),
        enrolled_course_ids=tuple(int(x) for x in enrolled_course_ids),
        campaign_tags=tuple(campaign_tags),
        now=now or _utcnow_naive(),
        preview_as=preview_as,
    )


def load_plan_slugs(cur, identity_id: int) -> tuple[str, ...]:
    """Active membership plan slugs for identity (parity with identity.ACTIVE_STATUSES)."""
    import identity as identity_mod

    statuses = identity_mod.ACTIVE_STATUSES
    placeholders = ",".join(["%s"] * len(statuses))
    cur.execute(
        f"""SELECT p.slug FROM memberships m
           JOIN plans p ON p.id = m.plan_id
           WHERE m.identity_id = %s
             AND m.status IN ({placeholders})
             AND (m.current_period_end IS NULL OR m.current_period_end > NOW())""",
        (identity_id, *statuses),
    )
    return tuple(str(r["slug"]) for r in cur.fetchall())


def load_enrolled_course_ids(cur, identity_id: int) -> tuple[int, ...]:
    cur.execute(
        """SELECT course_id FROM enrollments
           WHERE identity_id = %s""",
        (identity_id,),
    )
    return tuple(int(r["course_id"]) for r in cur.fetchall())


def viewer_from_claims(
    cur,
    claims: Optional[dict[str, Any]],
    *,
    preview_as: Optional[PreviewAs] = None,
    now: Optional[datetime] = None,
) -> ViewerContext:
    """Build viewer using live memberships + feature_role (as-built identity)."""
    if not claims:
        return viewer_from_parts(
            identity_id=None,
            session_role="observer",
            signed_in=False,
            is_admin=False,
            now=now,
            preview_as=preview_as,
        )

    iid = int(claims["identity_id"])
    session_role = str(claims.get("role") or "observer")
    if iid == 0 and session_role == "administrator":
        # Dev/internal admin session
        return viewer_from_parts(
            identity_id=0,
            session_role="administrator",
            access_role="administrator",
            is_admin=True,
            signed_in=True,
            now=now,
            preview_as=preview_as,
        )

    import identity as identity_mod

    access_role = identity_mod.feature_role(cur, iid, session_role)
    plans = load_plan_slugs(cur, iid)
    try:
        enrolled = load_enrolled_course_ids(cur, iid)
    except Exception:
        # enrollments table may be absent in some envs — fail open empty
        enrolled = ()

    return viewer_from_parts(
        identity_id=iid,
        session_role=session_role,
        access_role=access_role,
        plan_slugs=plans,
        enrolled_course_ids=enrolled,
        is_admin=(access_role == "administrator" or session_role == "administrator"),
        signed_in=True,
        now=now,
        preview_as=preview_as,
    )


def parse_preview_cookie(raw: Optional[str]) -> Optional[PreviewAs]:
    """Parse ft_access_preview cookie value (JSON). Invalid → None (fail closed)."""
    if not raw:
        return None
    import json

    try:
        data = json.loads(raw)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    mode = data.get("mode")
    if mode not in ("anonymous", "signed_in"):
        return None
    plans = data.get("plan_slugs") or []
    enroll = data.get("enrolled_course_ids")
    # Spec: default [] — never inherit if omitted
    if enroll is None:
        enroll = []
    return PreviewAs(
        mode=mode,
        access_role=data.get("access_role"),
        plan_slugs=tuple(str(p) for p in plans),
        enrolled_course_ids=tuple(int(x) for x in enroll),
    )
