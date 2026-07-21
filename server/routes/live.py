"""Live sessions (Live Sessions Spec v1.0): public schedule, double-gated join
URLs (role + T-15min window), ICS export, admin CRUD."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

import auth
import db
from config import get_config

router = APIRouter(tags=["live"])

VALID_KINDS = frozenset({"trading_room", "workshop"})
VALID_MIN_ROLES = frozenset({"activator", "navigator"})
JOIN_OPENS_BEFORE = timedelta(minutes=15)
JOIN_CLOSES_AFTER = timedelta(hours=4)


def _claims_or_none(request: Request) -> dict | None:
    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return None
    try:
        return auth.verify_session(token)
    except auth.AuthError:
        return None


def _require_admin(request: Request) -> dict:
    claims = _claims_or_none(request)
    if claims is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    if not auth.role_at_least(claims["role"], "administrator"):
        raise HTTPException(status_code=403, detail="Administrator role required")
    return claims


def _join_state(row, claims, now) -> dict:
    """Decide join visibility. join_url NEVER leaves unless both gates pass."""
    starts = row["starts_at"].replace(tzinfo=timezone.utc)
    if claims is None:
        return {"join_url": None, "join_locked": "sign_in"}
    if not auth.role_at_least(claims["role"], row["min_role"]):
        return {"join_url": None, "join_locked": "role"}
    if now < starts - JOIN_OPENS_BEFORE:
        return {"join_url": None, "join_locked": "too_early"}
    if now > starts + JOIN_CLOSES_AFTER:
        return {"join_url": None, "join_locked": "ended"}
    return {"join_url": row["join_url"], "join_locked": None}


def _serialize(row, claims, now, include_join: bool) -> dict:
    base = {
        "id": row["id"],
        "title": row["title"],
        "kind": row["kind"],
        "starts_at": row["starts_at"].replace(tzinfo=timezone.utc).isoformat(),
        "min_role": row["min_role"],
        "replay_course_slug": row.get("replay_slug"),
        "replay_course_title": row.get("replay_title"),
    }
    if include_join:
        base.update(_join_state(row, claims, now))
    return base


@router.get("/api/live/sessions")
def list_sessions(request: Request) -> dict:
    claims = _claims_or_none(request)
    now = datetime.now(timezone.utc)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT ls.id, ls.title, ls.kind, ls.starts_at, ls.join_url,
                          ls.min_role, c.slug AS replay_slug, c.title AS replay_title
                   FROM live_sessions ls
                   LEFT JOIN courses c
                     ON ls.replay_course_id = c.id AND c.status = 'published'
                   ORDER BY ls.starts_at ASC""",
            )
            rows = cur.fetchall()

    cutoff = now - JOIN_CLOSES_AFTER
    upcoming, past = [], []
    for row in rows:
        starts = row["starts_at"].replace(tzinfo=timezone.utc)
        if starts >= cutoff:
            upcoming.append(_serialize(row, claims, now, include_join=True))
        else:
            past.append(_serialize(row, claims, now, include_join=False))
    past.reverse()  # most recent first
    return {"upcoming": upcoming, "past": past[:20]}


@router.get("/api/live/sessions/{session_id}/ics")
def session_ics(session_id: int) -> PlainTextResponse:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT title, starts_at FROM live_sessions WHERE id = %s",
                (session_id,),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    start = row["starts_at"].replace(tzinfo=timezone.utc)
    end = start + timedelta(hours=1)
    fmt = "%Y%m%dT%H%M%SZ"
    ics = "\r\n".join(
        [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//FatTail Labs//Live Sessions//EN",
            "BEGIN:VEVENT",
            f"UID:fattail-labs-session-{session_id}",
            f"DTSTAMP:{datetime.now(timezone.utc).strftime(fmt)}",
            f"DTSTART:{start.strftime(fmt)}",
            f"DTEND:{end.strftime(fmt)}",
            f"SUMMARY:FatTail Labs — {row['title']}",
            "DESCRIPTION:Join from https://labs.fattail.ai/live",
            "END:VEVENT",
            "END:VCALENDAR",
            "",
        ]
    )
    return PlainTextResponse(
        ics,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="fattail-session-{session_id}.ics"'},
    )


# --- admin CRUD ---------------------------------------------------------------

def _validate_session(body: dict) -> dict:
    title = (body.get("title") or "").strip()
    kind = body.get("kind")
    starts_at = body.get("starts_at")
    min_role = body.get("min_role") or "activator"
    if not title:
        raise HTTPException(status_code=422, detail="title required")
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_KINDS)}")
    if min_role not in VALID_MIN_ROLES:
        raise HTTPException(status_code=422, detail=f"min_role must be one of {sorted(VALID_MIN_ROLES)}")
    try:
        starts = datetime.fromisoformat(str(starts_at).replace("Z", "+00:00"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="starts_at must be ISO datetime") from exc
    if starts.tzinfo is not None:
        starts = starts.astimezone(timezone.utc).replace(tzinfo=None)
    return {
        "title": title,
        "kind": kind,
        "starts_at": starts,
        "join_url": (body.get("join_url") or "").strip() or None,
        "min_role": min_role,
        "replay_course_id": body.get("replay_course_id"),
    }


@router.post("/api/admin/live-sessions")
async def create_session(request: Request) -> dict:
    _require_admin(request)
    f = _validate_session(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO live_sessions
                     (title, kind, starts_at, join_url, min_role, replay_course_id)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (f["title"], f["kind"], f["starts_at"], f["join_url"],
                 f["min_role"], f["replay_course_id"]),
            )
            return {"id": cur.lastrowid}


@router.put("/api/admin/live-sessions/{session_id}")
async def update_session(session_id: int, request: Request) -> dict:
    _require_admin(request)
    f = _validate_session(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE live_sessions SET title=%s, kind=%s, starts_at=%s,
                          join_url=%s, min_role=%s, replay_course_id=%s
                   WHERE id=%s""",
                (f["title"], f["kind"], f["starts_at"], f["join_url"],
                 f["min_role"], f["replay_course_id"], session_id),
            )
            cur.execute("SELECT 1 FROM live_sessions WHERE id = %s", (session_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@router.delete("/api/admin/live-sessions/{session_id}")
def delete_session(session_id: int, request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM live_sessions WHERE id = %s", (session_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}
