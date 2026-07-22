"""Live sessions (Live Sessions Spec v1.3): public schedule (one-off + recurring),
membership-category gating, double-gated join URLs (audience + T-15min window),
ICS export, admin CRUD.

Recurring sessions are stored as America/New_York wall-clock schedules and
materialized into concrete occurrences at read time — no cron, no generated rows.
"""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

import auth
import db
from config import get_config

router = APIRouter(tags=["live"])

VALID_KINDS = frozenset({"trading_room", "workshop", "show"})
# Membership-based content categories (spec v1.3): the single place audience
# maps to the role ladder. public = no gate; members = every membership;
# coaching = Observer & Navigator (trial Observers carry the navigator role).
CATEGORY_MIN_ROLE = {"public": None, "members": "activator", "coaching": "navigator"}
JOIN_OPENS_BEFORE = timedelta(minutes=15)
JOIN_CLOSES_AFTER = timedelta(hours=4)

EASTERN = ZoneInfo("America/New_York")
DAY_KEYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")  # date.weekday() order
ICS_BYDAY = {"mon": "MO", "tue": "TU", "wed": "WE", "thu": "TH",
             "fri": "FR", "sat": "SA", "sun": "SU"}
HORIZON_DAYS = 14


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


def _join_state(starts, category, join_url, claims, now) -> dict:
    """Decide join visibility. join_url NEVER leaves unless every gate passes."""
    min_role = CATEGORY_MIN_ROLE[category]
    if min_role is not None:
        if claims is None:
            return {"join_url": None, "join_locked": "sign_in"}
        if not auth.role_at_least(claims["role"], min_role):
            return {"join_url": None, "join_locked": "role"}
    if now < starts - JOIN_OPENS_BEFORE:
        return {"join_url": None, "join_locked": "too_early"}
    if now > starts + JOIN_CLOSES_AFTER:
        return {"join_url": None, "join_locked": "ended"}
    return {"join_url": join_url, "join_locked": None}


def _serialize(row, claims, now, include_join: bool) -> dict:
    starts = row["starts_at"].replace(tzinfo=timezone.utc)
    base = {
        "id": row["id"],
        "recurring": False,
        "title": row["title"],
        "kind": row["kind"],
        "starts_at": starts.isoformat(),
        "category": row["category"],
        "replay_course_slug": row.get("replay_slug"),
        "replay_course_title": row.get("replay_title"),
    }
    if include_join:
        base.update(_join_state(starts, row["category"], row["join_url"], claims, now))
    return base


def _time_seconds(value) -> int:
    """PyMySQL returns TIME columns as timedelta."""
    if isinstance(value, timedelta):
        return int(value.total_seconds())
    return value.hour * 3600 + value.minute * 60 + value.second


def _effective_fields(rec, ov) -> dict:
    """Merge an override row into its series: NULL/absent = inherit (v1.4)."""
    eff = {
        "title": rec["title"],
        "kind": rec["kind"],
        "start_time": rec["start_time"],
        "duration_minutes": rec["duration_minutes"],
        "join_url": rec["join_url"],
        "category": rec["category"],
    }
    if ov:
        for key in eff:
            if ov.get(key) is not None:
                eff[key] = ov[key]
    return eff


def _occurrences(rec, claims, now, first_day: date, last_day: date,
                 skip_ended: bool, overrides: dict) -> list[dict]:
    """Materialize a recurrence's concrete occurrences over [first_day, last_day)
    (ET dates), in UTC — respecting series bounds and per-occurrence overrides."""
    days = {d.strip() for d in rec["days"].split(",") if d.strip()}
    out = []
    day = first_day
    while day < last_day:
        step, day = day, day + timedelta(days=1)
        if DAY_KEYS[step.weekday()] not in days:
            continue
        if rec["start_date"] and step < rec["start_date"]:
            continue
        if rec["until_date"] and step > rec["until_date"]:
            continue
        ov = overrides.get((rec["id"], step))
        if ov and ov["cancelled"]:
            continue
        eff = _effective_fields(rec, ov)
        start_et = datetime(step.year, step.month, step.day, tzinfo=EASTERN) + timedelta(
            seconds=_time_seconds(eff["start_time"]))
        starts = start_et.astimezone(timezone.utc)
        if skip_ended and starts < now - JOIN_CLOSES_AFTER:
            continue
        entry = {
            "id": f"r{rec['id']}-{step.isoformat()}",
            "recurring": True,
            "recurrence_id": rec["id"],
            "occurrence_date": step.isoformat(),
            "modified": ov is not None,
            "title": eff["title"],
            "kind": eff["kind"],
            "starts_at": starts.isoformat(),
            "duration_minutes": eff["duration_minutes"],
            "ends_at": (starts + timedelta(minutes=eff["duration_minutes"])).isoformat(),
            "category": eff["category"],
            "replay_course_slug": None,
            "replay_course_title": None,
        }
        entry.update(_join_state(starts, eff["category"], eff["join_url"], claims, now))
        out.append(entry)
    return out


def _parse_month(month: str) -> tuple[date, date]:
    """'YYYY-MM' → [first day, first day of next month)."""
    try:
        y_s, m_s = month.split("-")
        y, m = int(y_s), int(m_s)
        assert 1 <= m <= 12 and 2020 <= y <= 2100
    except (ValueError, AssertionError) as exc:
        raise HTTPException(status_code=422, detail="month must be YYYY-MM") from exc
    first = date(y, m, 1)
    last = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
    return first, last


@router.get("/api/live/sessions")
def list_sessions(request: Request, month: str | None = None) -> dict:
    """Default: rolling upcoming horizon + replays (dashboard shape, v1.1).
    With ?month=YYYY-MM: every session of that ET month for the calendar,
    past occurrences included (join-locked 'ended'), plus replays."""
    claims = _claims_or_none(request)
    now = datetime.now(timezone.utc)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT ls.id, ls.title, ls.kind, ls.starts_at, ls.join_url,
                          ls.category, c.slug AS replay_slug, c.title AS replay_title
                   FROM live_sessions ls
                   LEFT JOIN courses c
                     ON ls.replay_course_id = c.id AND c.status = 'published'
                   ORDER BY ls.starts_at ASC""",
            )
            rows = cur.fetchall()
            cur.execute("SELECT * FROM live_recurrences WHERE active = 1")
            recurrences = cur.fetchall()
            cur.execute("SELECT * FROM live_recurrence_overrides")
            overrides = {
                (o["recurrence_id"], o["occurrence_date"]): o for o in cur.fetchall()
            }

    cutoff = now - JOIN_CLOSES_AFTER
    past = [
        _serialize(row, claims, now, include_join=False)
        for row in rows
        if row["starts_at"].replace(tzinfo=timezone.utc) < cutoff
    ]
    past.reverse()  # most recent first

    if month is not None:
        first_day, last_day = _parse_month(month)
        sessions = []
        for row in rows:
            starts_et = row["starts_at"].replace(tzinfo=timezone.utc).astimezone(EASTERN)
            if first_day <= starts_et.date() < last_day:
                sessions.append(_serialize(row, claims, now, include_join=True))
        for rec in recurrences:
            sessions.extend(
                _occurrences(rec, claims, now, first_day, last_day,
                             skip_ended=False, overrides=overrides)
            )
        sessions.sort(key=lambda s: s["starts_at"])
        return {"sessions": sessions, "past": past[:20]}

    today_et = now.astimezone(EASTERN).date()
    upcoming = [
        _serialize(row, claims, now, include_join=True)
        for row in rows
        if row["starts_at"].replace(tzinfo=timezone.utc) >= cutoff
    ]
    for rec in recurrences:
        upcoming.extend(
            _occurrences(rec, claims, now, today_et,
                         today_et + timedelta(days=HORIZON_DAYS + 1),
                         skip_ended=True, overrides=overrides)
        )
    upcoming.sort(key=lambda s: s["starts_at"])
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


@router.get("/api/live/recurrences/{recurrence_id}/ics")
def recurrence_ics(recurrence_id: int) -> PlainTextResponse:
    """A true repeating VEVENT: add once, holds forever. TZID keeps DST correct."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM live_recurrences WHERE id = %s AND active = 1",
                (recurrence_id,),
            )
            rec = cur.fetchone()
    if rec is None:
        raise HTTPException(status_code=404, detail="Recurring session not found")

    now = datetime.now(timezone.utc)
    days = {d.strip() for d in rec["days"].split(",") if d.strip()}
    seconds = _time_seconds(rec["start_time"])
    today_et = now.astimezone(EASTERN).date()
    first = next(
        today_et + timedelta(days=o)
        for o in range(8)
        if DAY_KEYS[(today_et + timedelta(days=o)).weekday()] in days
    )
    start_local = datetime(first.year, first.month, first.day) + timedelta(seconds=seconds)
    end_local = start_local + timedelta(minutes=rec["duration_minutes"])
    byday = ",".join(ICS_BYDAY[d] for d in DAY_KEYS if d in days)
    fmt = "%Y%m%dT%H%M%S"
    ics = "\r\n".join(
        [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//FatTail Labs//Live Sessions//EN",
            "BEGIN:VEVENT",
            f"UID:fattail-labs-recurrence-{recurrence_id}",
            f"DTSTAMP:{now.strftime(fmt)}Z",
            f"DTSTART;TZID=America/New_York:{start_local.strftime(fmt)}",
            f"DTEND;TZID=America/New_York:{end_local.strftime(fmt)}",
            f"RRULE:FREQ=WEEKLY;BYDAY={byday}",
            f"SUMMARY:FatTail Labs — {rec['title']}",
            "DESCRIPTION:Join from https://labs.fattail.ai/live",
            "END:VEVENT",
            "END:VCALENDAR",
            "",
        ]
    )
    return PlainTextResponse(
        ics,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="fattail-recurring-{recurrence_id}.ics"'},
    )


# --- admin CRUD: one-off sessions ---------------------------------------------

def _validate_session(body: dict) -> dict:
    title = (body.get("title") or "").strip()
    kind = body.get("kind")
    starts_at = body.get("starts_at")
    category = body.get("category") or "members"
    if not title:
        raise HTTPException(status_code=422, detail="title required")
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_KINDS)}")
    if category not in CATEGORY_MIN_ROLE:
        raise HTTPException(status_code=422, detail=f"category must be one of {sorted(CATEGORY_MIN_ROLE)}")
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
        "category": category,
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
                     (title, kind, starts_at, join_url, category, replay_course_id)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (f["title"], f["kind"], f["starts_at"], f["join_url"],
                 f["category"], f["replay_course_id"]),
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
                          join_url=%s, category=%s, replay_course_id=%s
                   WHERE id=%s""",
                (f["title"], f["kind"], f["starts_at"], f["join_url"],
                 f["category"], f["replay_course_id"], session_id),
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


# --- admin CRUD: recurring sessions -------------------------------------------

def _validate_recurrence(body: dict) -> dict:
    title = (body.get("title") or "").strip()
    kind = body.get("kind")
    category = body.get("category") or "members"
    raw_days = body.get("days")
    if not title:
        raise HTTPException(status_code=422, detail="title required")
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_KINDS)}")
    if category not in CATEGORY_MIN_ROLE:
        raise HTTPException(status_code=422, detail=f"category must be one of {sorted(CATEGORY_MIN_ROLE)}")
    if isinstance(raw_days, str):
        raw_days = [d for d in raw_days.split(",")]
    if not isinstance(raw_days, list):
        raise HTTPException(status_code=422, detail="days must be a list")
    days = [d.strip().lower() for d in raw_days if str(d).strip()]
    if not days or any(d not in DAY_KEYS for d in days):
        raise HTTPException(status_code=422, detail=f"days must be a non-empty subset of {list(DAY_KEYS)}")
    days = [d for d in DAY_KEYS if d in set(days)]  # canonical order, deduped
    start_time = str(body.get("start_time") or "")
    try:
        hh, mm = start_time.split(":")[:2]
        hh, mm = int(hh), int(mm)
        assert 0 <= hh <= 23 and 0 <= mm <= 59
    except (ValueError, AssertionError) as exc:
        raise HTTPException(status_code=422, detail="start_time must be HH:MM (America/New_York)") from exc
    duration = body.get("duration_minutes")
    if not isinstance(duration, int) or not 5 <= duration <= 480:
        raise HTTPException(status_code=422, detail="duration_minutes must be an int between 5 and 480")
    # Series end limit (spec v1.5): a concrete date, or N days from now — never
    # a rolling window. Neither → unbounded.
    until_date = body.get("until_date")
    until_days = body.get("until_days")
    today_et = datetime.now(timezone.utc).astimezone(EASTERN).date()
    if until_date is not None and until_days is not None:
        raise HTTPException(status_code=422, detail="pass until_date or until_days, not both")
    if until_days is not None:
        if not isinstance(until_days, int) or not 1 <= until_days <= 730:
            raise HTTPException(status_code=422, detail="until_days must be an int between 1 and 730")
        until_date = today_et + timedelta(days=until_days)
    elif until_date is not None:
        until_date = _parse_ymd(str(until_date))
        if until_date < today_et:
            raise HTTPException(status_code=422, detail="until_date is in the past")
    return {
        "title": title,
        "kind": kind,
        "days": ",".join(days),
        "start_time": f"{hh:02d}:{mm:02d}:00",
        "duration_minutes": duration,
        "join_url": (body.get("join_url") or "").strip() or None,
        "category": category,
        "active": 1 if body.get("active", True) else 0,
        "until_date": until_date,
    }


@router.get("/api/admin/live-recurrences")
def list_recurrences(request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM live_recurrences ORDER BY id ASC")
            rows = cur.fetchall()
    items = []
    for rec in rows:
        seconds = _time_seconds(rec["start_time"])
        items.append({
            "id": rec["id"],
            "title": rec["title"],
            "kind": rec["kind"],
            "days": rec["days"].split(","),
            "start_time": f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}",
            "duration_minutes": rec["duration_minutes"],
            "join_url": rec["join_url"],
            "category": rec["category"],
            "active": bool(rec["active"]),
            "start_date": rec["start_date"].isoformat() if rec["start_date"] else None,
            "until_date": rec["until_date"].isoformat() if rec["until_date"] else None,
        })
    return {"recurrences": items}


@router.post("/api/admin/live-recurrences")
async def create_recurrence(request: Request) -> dict:
    _require_admin(request)
    f = _validate_recurrence(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO live_recurrences
                     (title, kind, days, start_time, duration_minutes, join_url,
                      category, active, until_date)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (f["title"], f["kind"], f["days"], f["start_time"],
                 f["duration_minutes"], f["join_url"], f["category"], f["active"],
                 f["until_date"]),
            )
            return {"id": cur.lastrowid}


@router.put("/api/admin/live-recurrences/{recurrence_id}")
async def update_recurrence(recurrence_id: int, request: Request) -> dict:
    _require_admin(request)
    f = _validate_recurrence(await request.json())
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE live_recurrences SET title=%s, kind=%s, days=%s, start_time=%s,
                          duration_minutes=%s, join_url=%s, category=%s, active=%s,
                          until_date=%s
                   WHERE id=%s""",
                (f["title"], f["kind"], f["days"], f["start_time"], f["duration_minutes"],
                 f["join_url"], f["category"], f["active"], f["until_date"], recurrence_id),
            )
            cur.execute("SELECT 1 FROM live_recurrences WHERE id = %s", (recurrence_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Recurring session not found")
    return {"ok": True}


@router.delete("/api/admin/live-recurrences/{recurrence_id}")
def delete_recurrence(recurrence_id: int, request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM live_recurrences WHERE id = %s", (recurrence_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Recurring session not found")
    return {"ok": True}


# --- admin: Recurring Event Viewer (spec v1.4) --------------------------------

VALID_SCOPES = frozenset({"one", "future", "all"})


def _parse_ymd(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="date must be YYYY-MM-DD") from exc


def _recurrence_or_404(cur, recurrence_id: int) -> dict:
    cur.execute("SELECT * FROM live_recurrences WHERE id = %s", (recurrence_id,))
    rec = cur.fetchone()
    if rec is None:
        raise HTTPException(status_code=404, detail="Recurring session not found")
    return rec


def _require_occurrence(rec, day: date) -> None:
    """404 unless `day` is a real occurrence of the series (weekday + bounds)."""
    days = {d.strip() for d in rec["days"].split(",") if d.strip()}
    if (DAY_KEYS[day.weekday()] not in days
            or (rec["start_date"] and day < rec["start_date"])
            or (rec["until_date"] and day > rec["until_date"])):
        raise HTTPException(status_code=404, detail="No occurrence on that date")


def _validate_partial(body: dict) -> dict:
    """Validate only the fields present (v1.3 rules). Returns the clean subset."""
    fields: dict = {}
    if "title" in body:
        title = (body["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=422, detail="title cannot be empty")
        fields["title"] = title
    if "kind" in body:
        if body["kind"] not in VALID_KINDS:
            raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_KINDS)}")
        fields["kind"] = body["kind"]
    if "category" in body:
        if body["category"] not in CATEGORY_MIN_ROLE:
            raise HTTPException(status_code=422, detail=f"category must be one of {sorted(CATEGORY_MIN_ROLE)}")
        fields["category"] = body["category"]
    if "start_time" in body:
        try:
            hh, mm = str(body["start_time"]).split(":")[:2]
            hh, mm = int(hh), int(mm)
            assert 0 <= hh <= 23 and 0 <= mm <= 59
        except (ValueError, AssertionError) as exc:
            raise HTTPException(status_code=422, detail="start_time must be HH:MM (America/New_York)") from exc
        fields["start_time"] = f"{hh:02d}:{mm:02d}:00"
    if "duration_minutes" in body:
        duration = body["duration_minutes"]
        if not isinstance(duration, int) or not 5 <= duration <= 480:
            raise HTTPException(status_code=422, detail="duration_minutes must be an int between 5 and 480")
        fields["duration_minutes"] = duration
    if "join_url" in body:
        fields["join_url"] = (body["join_url"] or "").strip() or None
    return fields


@router.get("/api/admin/live-sessions/{session_id}")
def get_session_admin(session_id: int, request: Request) -> dict:
    _require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM live_sessions WHERE id = %s", (session_id,))
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": row["id"],
        "title": row["title"],
        "kind": row["kind"],
        "starts_at": row["starts_at"].replace(tzinfo=timezone.utc).isoformat(),
        "join_url": row["join_url"],
        "category": row["category"],
        "replay_course_id": row["replay_course_id"],
    }


@router.get("/api/admin/live-recurrences/{recurrence_id}/occurrences/{ymd}")
def get_occurrence_admin(recurrence_id: int, ymd: str, request: Request) -> dict:
    """Effective (series ⊕ override) fields for editor prefill."""
    _require_admin(request)
    day = _parse_ymd(ymd)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rec = _recurrence_or_404(cur, recurrence_id)
            _require_occurrence(rec, day)
            cur.execute(
                "SELECT * FROM live_recurrence_overrides "
                "WHERE recurrence_id = %s AND occurrence_date = %s",
                (recurrence_id, day),
            )
            ov = cur.fetchone()
    if ov and ov["cancelled"]:
        raise HTTPException(status_code=404, detail="Occurrence cancelled")
    eff = _effective_fields(rec, ov)
    seconds = _time_seconds(eff["start_time"])
    return {
        "recurrence_id": recurrence_id,
        "occurrence_date": day.isoformat(),
        "modified": ov is not None,
        "title": eff["title"],
        "kind": eff["kind"],
        "start_time": f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}",
        "duration_minutes": eff["duration_minutes"],
        "join_url": eff["join_url"],
        "category": eff["category"],
    }


def _split_series(cur, rec, day: date, fields: dict) -> int:
    """Scope 'future': bound the old series at day-1, clone it (with edits)
    starting at `day`, and move that day's-and-later overrides to the clone."""
    cur.execute(
        "UPDATE live_recurrences SET until_date = %s WHERE id = %s",
        (day - timedelta(days=1), rec["id"]),
    )
    seconds = _time_seconds(rec["start_time"])
    clone = {
        "title": rec["title"],
        "kind": rec["kind"],
        "days": rec["days"],
        "start_time": f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}:00",
        "duration_minutes": rec["duration_minutes"],
        "join_url": rec["join_url"],
        "category": rec["category"],
    }
    clone.update(fields)
    cur.execute(
        """INSERT INTO live_recurrences
             (title, kind, days, start_time, duration_minutes, join_url,
              category, active, start_date, until_date)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (clone["title"], clone["kind"], clone["days"], clone["start_time"],
         clone["duration_minutes"], clone["join_url"], clone["category"],
         rec["active"], day, rec["until_date"]),
    )
    new_id = cur.lastrowid
    cur.execute(
        "UPDATE live_recurrence_overrides SET recurrence_id = %s "
        "WHERE recurrence_id = %s AND occurrence_date >= %s",
        (new_id, rec["id"], day),
    )
    return new_id


@router.put("/api/admin/live-recurrences/{recurrence_id}/occurrences/{ymd}")
async def edit_occurrence(recurrence_id: int, ymd: str, request: Request) -> dict:
    _require_admin(request)
    day = _parse_ymd(ymd)
    body = await request.json()
    scope = body.get("scope")
    if scope not in VALID_SCOPES:
        raise HTTPException(status_code=422, detail=f"scope must be one of {sorted(VALID_SCOPES)}")
    fields = _validate_partial(body)
    if not fields:
        raise HTTPException(status_code=422, detail="no fields to update")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rec = _recurrence_or_404(cur, recurrence_id)
            _require_occurrence(rec, day)
            if scope == "one":
                cols = ", ".join(fields)
                updates = ", ".join(f"{c} = VALUES({c})" for c in fields)
                cur.execute(
                    f"""INSERT INTO live_recurrence_overrides
                          (recurrence_id, occurrence_date, {cols})
                        VALUES (%s, %s, {', '.join(['%s'] * len(fields))})
                        ON DUPLICATE KEY UPDATE {updates}, cancelled = 0""",
                    (recurrence_id, day, *fields.values()),
                )
                return {"scope": "one", "recurrence_id": recurrence_id}
            if scope == "future":
                new_id = _split_series(cur, rec, day, fields)
                return {"scope": "future", "recurrence_id": new_id}
            sets = ", ".join(f"{c} = %s" for c in fields)
            cur.execute(
                f"UPDATE live_recurrences SET {sets} WHERE id = %s",
                (*fields.values(), recurrence_id),
            )
            return {"scope": "all", "recurrence_id": recurrence_id}


@router.delete("/api/admin/live-recurrences/{recurrence_id}/occurrences/{ymd}")
def delete_occurrence(recurrence_id: int, ymd: str, request: Request,
                      scope: str = "one") -> dict:
    _require_admin(request)
    day = _parse_ymd(ymd)
    if scope not in VALID_SCOPES:
        raise HTTPException(status_code=422, detail=f"scope must be one of {sorted(VALID_SCOPES)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rec = _recurrence_or_404(cur, recurrence_id)
            _require_occurrence(rec, day)
            if scope == "one":
                cur.execute(
                    """INSERT INTO live_recurrence_overrides
                         (recurrence_id, occurrence_date, cancelled)
                       VALUES (%s, %s, 1)
                       ON DUPLICATE KEY UPDATE cancelled = 1""",
                    (recurrence_id, day),
                )
            elif scope == "future":
                cur.execute(
                    "UPDATE live_recurrences SET until_date = %s WHERE id = %s",
                    (day - timedelta(days=1), recurrence_id),
                )
                cur.execute(
                    "DELETE FROM live_recurrence_overrides "
                    "WHERE recurrence_id = %s AND occurrence_date >= %s",
                    (recurrence_id, day),
                )
            else:
                cur.execute("DELETE FROM live_recurrences WHERE id = %s", (recurrence_id,))
    return {"scope": scope}
