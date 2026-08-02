"""Journal Session domain — Spec v0.4a · J1+.

Chat primary; optional tags; status open|closed; seal only on retro complete.
Isolation: identity_id only. Create entitlement: D6 / Practice membership.
"""

from __future__ import annotations

import json
from datetime import date, datetime, time, timezone
from typing import Any
from zoneinfo import ZoneInfo

import journal_session_structured as jss
import retrospective_domain as rd

# --- constants (Spec v0.4a §5 · §6 · §8) --------------------------------------

VALID_TAGS = frozenset(
    {"pre_market", "post_session", "clean_day", "reflection"}
)
# retrospective tag navigates only — never persists a session row
NAVIGATE_ONLY_TAGS = frozenset({"retrospective"})

# v0.4a product: open|closed. Legacy partial|sealed accepted on read filters only.
VALID_STATUS = frozenset({"open", "closed", "partial", "sealed"})
PRODUCT_STATUS = frozenset({"open", "closed"})
MUTABLE_STATUS = frozenset({"open", "partial"})  # partial treated open post-migration
VALID_AUTHOR = frozenset({"member", "agent"})
VALID_PHASE = frozenset(
    {"pre_open", "intraday", "post_close", "off_session", "later_day"}
)

AGENT_SERVICE = "labs-journal-session"

CREATE_DENY_DETAIL = (
    "Journal sessions require an active Observer trial plan, "
    "Activator or Navigator membership, or administrator access"
)

CLOSED_DATE_DETAIL = (
    "This journal date is closed after a completed retrospective. "
    "It cannot accept new sessions."
)
CLOSED_SESSION_DETAIL = (
    "This journal entry is closed after a completed retrospective "
    "and cannot be changed."
)
SEALED_DETAIL = CLOSED_SESSION_DETAIL  # alias for older call sites
MEMBER_SEAL_DEPRECATED = (
    "Member seal is removed in Journal Session v0.4a. "
    "Sessions close only when a retrospective covering the date completes."
)
NOT_FOUND_DETAIL = "Journal session not found"

# Defaults if market_calendar_config missing (boot paths load config — fail loud on empty table in strict mode)
_NY = ZoneInfo("America/New_York")
_RTH_OPEN = time(9, 30)
_RTH_CLOSE = time(16, 0)
_CAL_CACHE: dict[str, Any] | None = None


class JournalSessionError(Exception):
    """Domain error with HTTP-ish code for routes."""

    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def can_create_session(cur, identity_id: int, role: str) -> bool:
    """D6 parity with Retrospective create (observer-trial | activator+ | admin)."""
    return rd.can_create_or_gather(cur, identity_id, role)


def _as_date(value: Any) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    s = str(value).strip()[:10]
    return date.fromisoformat(s)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _iso(dt: datetime | date | None) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc).isoformat()
        return dt.isoformat()
    return dt.isoformat()


def load_market_calendar(cur=None) -> dict[str, Any]:
    """Spec §8 — market calendar config. Fail loud if table empty when cur provided."""
    global _CAL_CACHE
    if cur is None:
        if _CAL_CACHE is not None:
            return _CAL_CACHE
        return {
            "tz": _NY,
            "rth_open": _RTH_OPEN,
            "rth_close": _RTH_CLOSE,
            "holidays": set(),
            "half_days": {},
        }
    cur.execute(
        """SELECT rth_open_local, rth_close_local, tz_name, holidays_json, half_days_json
           FROM market_calendar_config WHERE id = 1"""
    )
    row = cur.fetchone()
    if not row:
        raise JournalSessionError(
            503,
            "Market calendar is not configured (market_calendar_config empty)",
        )
    tz_name = str(row.get("tz_name") or "America/New_York")
    try:
        tz = ZoneInfo(tz_name)
    except Exception as e:
        raise JournalSessionError(
            503, f"Market calendar timezone invalid: {tz_name}"
        ) from e
    open_t = row["rth_open_local"]
    close_t = row["rth_close_local"]
    if not isinstance(open_t, time):
        parts = str(open_t).split(":")
        open_t = time(int(parts[0]), int(parts[1]))
    if not isinstance(close_t, time):
        parts = str(close_t).split(":")
        close_t = time(int(parts[0]), int(parts[1]))
    holidays: set[str] = set()
    hj = row.get("holidays_json")
    if isinstance(hj, str):
        try:
            hj = json.loads(hj)
        except json.JSONDecodeError:
            hj = []
    if isinstance(hj, list):
        holidays = {str(x)[:10] for x in hj}
    half: dict[str, Any] = {}
    hd = row.get("half_days_json")
    if isinstance(hd, str):
        try:
            hd = json.loads(hd)
        except json.JSONDecodeError:
            hd = {}
    if isinstance(hd, dict):
        half = hd
    _CAL_CACHE = {
        "tz": tz,
        "rth_open": open_t,
        "rth_close": close_t,
        "holidays": holidays,
        "half_days": half,
    }
    return _CAL_CACHE


def derive_phase(journal_date: date, message_at: datetime, *, cur=None) -> str:
    """Spec v0.4a §8 — phase from message UTC vs journal_date + market calendar."""
    cal = load_market_calendar(cur)
    tz = cal["tz"]
    msg = message_at
    if msg.tzinfo is None:
        msg = msg.replace(tzinfo=timezone.utc)
    local = msg.astimezone(tz)
    local_day = local.date()

    if local_day > journal_date:
        return "later_day"
    if local_day < journal_date:
        return "pre_open"

    day_iso = local_day.isoformat()
    if day_iso in cal["holidays"] or local.weekday() >= 5:
        return "off_session"

    rth_open = cal["rth_open"]
    rth_close = cal["rth_close"]
    half = cal["half_days"].get(day_iso)
    if isinstance(half, dict) and half.get("close"):
        parts = str(half["close"]).split(":")
        rth_close = time(int(parts[0]), int(parts[1]))

    t = local.time()
    if t < rth_open:
        return "pre_open"
    if t >= rth_close:
        return "post_close"
    return "intraday"


def session_band(
    journal_date: date, message_at: datetime, *, cur=None
) -> str:
    """Week-view band for a message timestamp (Spec v0.6 §1.6).

    GX before open · AM open→midpoint · PM midpoint→close · CL after close
    or later_day. Off-session (weekend/holiday): local-clock halves map to
    GX/AM/PM/CL as interim until Coach lock §17-12.
    """
    cal = load_market_calendar(cur)
    tz = cal["tz"]
    msg = message_at
    if msg.tzinfo is None:
        msg = msg.replace(tzinfo=timezone.utc)
    local = msg.astimezone(tz)
    local_day = local.date()
    t = local.time()

    # Later-written material about this journal date → CL (spec §1.6)
    if local_day > journal_date:
        return "cl"

    rth_open = cal["rth_open"]
    rth_close = cal["rth_close"]
    day_iso = journal_date.isoformat()
    half = cal["half_days"].get(day_iso)
    if isinstance(half, dict) and half.get("close"):
        parts = str(half["close"]).split(":")
        rth_close = time(int(parts[0]), int(parts[1]))

    off = (
        day_iso in cal["holidays"]
        or journal_date.weekday() >= 5
        or local_day != journal_date
    )
    if off and local_day <= journal_date:
        # Interim: four quarters of the local day
        mins = local.hour * 60 + local.minute
        if mins < 6 * 60:
            return "gx"
        if mins < 12 * 60:
            return "am"
        if mins < 18 * 60:
            return "pm"
        return "cl"

    open_m = rth_open.hour * 60 + rth_open.minute
    close_m = rth_close.hour * 60 + rth_close.minute
    mid_m = (open_m + close_m) // 2
    tm = t.hour * 60 + t.minute
    if tm < open_m:
        return "gx"
    if tm < mid_m:
        return "am"
    if tm < close_m:
        return "pm"
    return "cl"


def week_activity_bands(
    cur,
    identity_id: int,
    date_from: date,
    date_to: date,
) -> dict[str, dict]:
    """Member-message band activity for Week map (agent turns ignored)."""
    cur.execute(
        """SELECT s.id AS session_id, s.journal_date, m.id AS message_id, m.created_at
           FROM member_journal_sessions s
           JOIN member_journal_messages m
             ON m.session_id = s.id AND m.identity_id = s.identity_id
           WHERE s.identity_id = %s
             AND s.journal_date >= %s AND s.journal_date <= %s
             AND m.author = 'member'
           ORDER BY m.created_at ASC, m.id ASC""",
        (identity_id, date_from, date_to),
    )
    out: dict[str, dict] = {}
    for r in cur.fetchall():
        jd = r["journal_date"]
        day_key = jd.isoformat() if hasattr(jd, "isoformat") else str(jd)[:10]
        created = r["created_at"]
        if created is None:
            continue
        if getattr(created, "tzinfo", None) is None:
            created = created.replace(tzinfo=timezone.utc)
        band = session_band(_as_date(jd), created, cur=cur)
        slot = out.setdefault(
            day_key,
            {
                "session_id": int(r["session_id"]),
                "bands": {"gx": False, "am": False, "pm": False, "cl": False},
                "first_message_id_by_band": {},
            },
        )
        if not slot["bands"].get(band):
            slot["bands"][band] = True
            slot["first_message_id_by_band"][band] = int(r["message_id"])
        # Prefer earliest session id for the day
        if int(r["session_id"]) < int(slot["session_id"]):
            slot["session_id"] = int(r["session_id"])
    return out


def get_closure(cur, identity_id: int, journal_date: date) -> dict | None:
    cur.execute(
        """SELECT identity_id, journal_date, closed_by_retrospective_id, closed_at
           FROM member_journal_date_closures
           WHERE identity_id = %s AND journal_date = %s""",
        (identity_id, journal_date),
    )
    return cur.fetchone()


def assert_date_open(cur, identity_id: int, journal_date: date) -> None:
    row = get_closure(cur, identity_id, journal_date)
    if row:
        extra: dict[str, Any] = {
            "journal_date": journal_date.isoformat(),
            "reason": "date_closed",
        }
        rid = row.get("closed_by_retrospective_id")
        if rid is not None:
            extra["closed_by_retrospective_id"] = int(rid)
            extra["link"] = f"/app/retrospective/{int(rid)}"
            extra["closing_retrospective_id"] = int(rid)
        raise JournalSessionError(409, CLOSED_DATE_DETAIL, extra=extra)


def dates_to_close_for_retro(
    scope_start: datetime | date,
    scope_end: datetime | date,
) -> list[date]:
    """NY calendar dates in the retro window strictly before gather (scope_end) day.

    Spec §10: close whole days < gather date; gather date stays open.
    Window: from scope_start's calendar day through the day before gather_date.
    """
    if isinstance(scope_start, datetime):
        start_d = _naive_utc(scope_start).date()
    else:
        start_d = scope_start
    if isinstance(scope_end, datetime):
        # Gather date = NY calendar day of scope_end
        end_dt = scope_end
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
        gather_d = end_dt.astimezone(_NY).date()
    else:
        gather_d = scope_end

    if start_d >= gather_d:
        return []
    out: list[date] = []
    d = start_d
    from datetime import timedelta

    while d < gather_d:
        out.append(d)
        d = d + timedelta(days=1)
    return out


def apply_closures_on_retro_complete(
    cur,
    identity_id: int,
    *,
    retrospective_id: int,
    scope_start: datetime | date,
    scope_end: datetime | date,
    now: datetime | None = None,
) -> list[str]:
    """Scope-true date closures + close open sessions on those dates (v0.4a §12).

    Returns list of closed date ISO strings (including already-closed).
    Never reopens an existing closure (ON DUPLICATE keeps closed_at).
    """
    closed_at = _naive_utc(now or _now_utc())
    dates = dates_to_close_for_retro(scope_start, scope_end)
    written: list[str] = []
    for d in dates:
        cur.execute(
            """INSERT INTO member_journal_date_closures
                 (identity_id, journal_date, closed_by_retrospective_id, closed_at)
               VALUES (%s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE
                 closed_by_retrospective_id = COALESCE(closed_by_retrospective_id, VALUES(closed_by_retrospective_id)),
                 closed_at = closed_at""",
            (identity_id, d, retrospective_id, closed_at),
        )
        # Denorm + product status on sessions for this date
        cur.execute(
            """UPDATE member_journal_sessions
               SET status = 'closed',
                   closed_by_retrospective_id = %s,
                   closed_at = %s
               WHERE identity_id = %s AND journal_date = %s
                 AND status IN ('open', 'partial', 'sealed')""",
            (retrospective_id, closed_at, identity_id, d),
        )
        written.append(d.isoformat())
    return written


def list_closures(
    cur,
    identity_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict[str, Any]]:
    clauses = ["identity_id = %s"]
    params: list[Any] = [identity_id]
    if date_from is not None:
        clauses.append("journal_date >= %s")
        params.append(date_from)
    if date_to is not None:
        clauses.append("journal_date <= %s")
        params.append(date_to)
    where = " AND ".join(clauses)
    cur.execute(
        f"""SELECT identity_id, journal_date, closed_by_retrospective_id, closed_at
           FROM member_journal_date_closures
           WHERE {where}
           ORDER BY journal_date ASC""",
        tuple(params),
    )
    out = []
    for r in cur.fetchall():
        jd = r["journal_date"]
        out.append(
            {
                "journal_date": jd.isoformat() if hasattr(jd, "isoformat") else str(jd),
                "closed_by_retrospective_id": (
                    int(r["closed_by_retrospective_id"])
                    if r.get("closed_by_retrospective_id") is not None
                    else None
                ),
                "closed_at": _iso(r.get("closed_at")),
                "link": (
                    f"/app/retrospective/{int(r['closed_by_retrospective_id'])}"
                    if r.get("closed_by_retrospective_id") is not None
                    else None
                ),
            }
        )
    return out


def preview_closures_for_retro(
    cur,
    identity_id: int,
    *,
    scope_start: datetime | date,
    scope_end: datetime | date,
) -> dict[str, Any]:
    """Dates + open sessions that will close on complete (v0.4a §13)."""
    dates = dates_to_close_for_retro(scope_start, scope_end)
    iso = [d.isoformat() for d in dates]
    if isinstance(scope_end, datetime):
        end_dt = scope_end if scope_end.tzinfo else scope_end.replace(tzinfo=timezone.utc)
        gather = end_dt.astimezone(_NY).date().isoformat()
    else:
        gather = scope_end.isoformat()

    open_sessions: list[dict[str, Any]] = []
    if dates:
        cur.execute(
            f"""SELECT id, journal_date, tag, status, structured_json
               FROM member_journal_sessions
               WHERE identity_id = %s
                 AND journal_date IN ({",".join(["%s"] * len(dates))})
                 AND status IN ('open', 'partial')
               ORDER BY journal_date ASC, id ASC""",
            (identity_id, *dates),
        )
        for r in cur.fetchall():
            jd = r["journal_date"]
            sj = r.get("structured_json")
            has_structured = bool(sj) and sj not in ("null", "{}", None)
            open_sessions.append(
                {
                    "id": int(r["id"]),
                    "journal_date": jd.isoformat() if hasattr(jd, "isoformat") else str(jd)[:10],
                    "tag": r.get("tag"),
                    "has_structured": has_structured,
                }
            )

    return {
        "gather_date": gather,
        "dates_to_close": iso,
        "gather_date_stays_open": True,
        "open_sessions_to_close": open_sessions,
        "open_session_count": len(open_sessions),
        "warning": (
            f"This closes {', '.join(iso) if iso else '(no dates)'} "
            f"to new journal entries and attachments. "
            f"{len(open_sessions)} conversation(s) still open will be closed. "
            f"Today/gather date ({gather}) stays open."
            if iso
            else f"No prior dates to close. Gather date ({gather}) stays open."
        ),
    }


def _session_tags(cur, session_id: int) -> list[str]:
    cur.execute(
        """SELECT tag FROM member_journal_session_tags
           WHERE session_id = %s ORDER BY tag ASC""",
        (session_id,),
    )
    return [str(r["tag"]) for r in cur.fetchall()]


def _set_session_tags(cur, session_id: int, tags: list[str]) -> None:
    cur.execute(
        "DELETE FROM member_journal_session_tags WHERE session_id = %s",
        (session_id,),
    )
    for t in tags:
        if t in NAVIGATE_ONLY_TAGS:
            continue
        if t not in VALID_TAGS:
            continue
        cur.execute(
            """INSERT IGNORE INTO member_journal_session_tags (session_id, tag)
               VALUES (%s, %s)""",
            (session_id, t),
        )


def serialize_session(
    row: dict,
    *,
    messages: list[dict] | None = None,
    tags: list[str] | None = None,
) -> dict:
    sj = row.get("structured_json")
    if isinstance(sj, str):
        try:
            sj = json.loads(sj)
        except json.JSONDecodeError:
            sj = None
    tag = row.get("tag")
    tag_s = str(tag) if tag else None
    tag_list = tags if tags is not None else ([tag_s] if tag_s else [])
    primary = tag_list[0] if tag_list else (tag_s or "reflection")
    out: dict[str, Any] = {
        "id": int(row["id"]),
        "identity_id": int(row["identity_id"]),
        "tag": tag_s,  # legacy single
        "tags": tag_list,
        "journal_date": _iso(row["journal_date"]) if row.get("journal_date") else None,
        "session_started_at": _iso(row.get("session_started_at")),
        "status": row["status"],
        "structured": sj if isinstance(sj, dict) else sj,
        "checklist": jss.checklist_status(
            primary, sj if isinstance(sj, dict) else None
        ),
        "export_key": row.get("export_key"),
        "spawned_retrospective_id": (
            int(row["spawned_retrospective_id"])
            if row.get("spawned_retrospective_id") is not None
            else None
        ),
        "closed_by_retrospective_id": (
            int(row["closed_by_retrospective_id"])
            if row.get("closed_by_retrospective_id") is not None
            else None
        ),
        "closed_at": _iso(row.get("closed_at")) if row.get("closed_at") else None,
        "prompt_version_id": row.get("prompt_version_id"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }
    if messages is not None:
        out["messages"] = [serialize_message(m) for m in messages]
    return out


def serialize_message(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "session_id": int(row["session_id"]),
        "identity_id": int(row["identity_id"]),
        "author": row["author"],
        "agent_service": row.get("agent_service"),
        "body_md": row["body_md"],
        "phase": row["phase"],
        "created_at": _iso(row.get("created_at")),
    }


def create_session(
    cur,
    identity_id: int,
    *,
    tag: str | None = None,
    tags: list[str] | None = None,
    journal_date: date | str,
    structured: dict | None = None,
    prefill: bool = False,
    now: datetime | None = None,
) -> dict:
    """Create open conversation. Tags optional (v0.4a). tag= for legacy single-tag create."""
    tag_list: list[str] = []
    if tags:
        for t in tags:
            t = str(t or "").strip()
            if not t:
                continue
            if t in NAVIGATE_ONLY_TAGS:
                raise JournalSessionError(
                    422,
                    "Tag 'retrospective' does not create a journal session — "
                    "use the retrospective navigate path.",
                )
            if t not in VALID_TAGS:
                raise JournalSessionError(
                    422,
                    f"Invalid tag. Allowed: {', '.join(sorted(VALID_TAGS))}",
                )
            if t not in tag_list:
                tag_list.append(t)
    primary = str(tag or "").strip() if tag else (tag_list[0] if tag_list else "")
    if primary:
        if primary in NAVIGATE_ONLY_TAGS:
            raise JournalSessionError(
                422,
                "Tag 'retrospective' does not create a journal session — "
                "use the retrospective navigate path.",
            )
        if primary not in VALID_TAGS:
            raise JournalSessionError(
                422,
                f"Invalid tag. Allowed: {', '.join(sorted(VALID_TAGS))}",
            )
        if primary not in tag_list:
            tag_list.insert(0, primary)
    # Schema checklist uses primary or reflection default
    schema_tag = primary or "reflection"

    jd = _as_date(journal_date)
    assert_date_open(cur, identity_id, jd)
    started = _naive_utc(now or _now_utc())
    # Warm calendar cache (fail loud if empty)
    load_market_calendar(cur)

    # Spec v0.6 §3 — one conversation per date: return existing if present.
    cur.execute(
        """SELECT id FROM member_journal_sessions
           WHERE identity_id = %s AND journal_date = %s
           ORDER BY session_started_at ASC, id ASC
           LIMIT 1""",
        (identity_id, jd),
    )
    existing = cur.fetchone()
    if existing:
        return get_session(
            cur, identity_id, int(existing["id"]), include_messages=True
        )

    merged: dict | None = None
    if prefill and primary:
        merged = dict(jss.prefill_structured(cur, identity_id, primary, jd))
    if structured is not None:
        try:
            normalized = jss.normalize_structured(schema_tag, structured)
        except ValueError as e:
            raise JournalSessionError(422, str(e)) from e
        if merged is None:
            merged = normalized
        elif normalized:
            merged = {**merged, **normalized}
    elif merged is not None:
        try:
            merged = jss.normalize_structured(schema_tag, merged)
        except ValueError as e:
            raise JournalSessionError(422, str(e)) from e

    sj = json.dumps(merged) if merged else None
    legacy_tag = primary if primary else None
    prompt_vid = active_prompt_version_id(cur)
    cur.execute(
        """INSERT INTO member_journal_sessions
             (identity_id, tag, journal_date, session_started_at, status,
              structured_json, export_key, spawned_retrospective_id,
              prompt_version_id)
           VALUES (%s, %s, %s, %s, 'open', %s, NULL, NULL, %s)""",
        (identity_id, legacy_tag, jd, started, sj, prompt_vid),
    )
    sid = int(cur.lastrowid)
    if tag_list:
        _set_session_tags(cur, sid, tag_list)
    return get_session(cur, identity_id, sid, include_messages=True)


def active_prompt_version_id(cur) -> str | None:
    """Stamp for new sessions (Spec v0.6 §8.3 / J3)."""
    try:
        cur.execute(
            """SELECT id FROM journal_session_prompt_versions
               WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"""
        )
        row = cur.fetchone()
        if row:
            return str(row["id"])
    except Exception:
        pass
    return "JOURNAL_SESSION_SYSTEM_PROMPT_V1"


_SESSION_COLS = """id, identity_id, tag, journal_date, session_started_at, status,
                  structured_json, export_key, spawned_retrospective_id,
                  closed_by_retrospective_id, closed_at,
                  absence_keys_raised_json, prompt_version_id,
                  created_at, updated_at"""


def get_session(
    cur,
    identity_id: int,
    session_id: int,
    *,
    include_messages: bool = True,
) -> dict | None:
    cur.execute(
        f"""SELECT {_SESSION_COLS}
           FROM member_journal_sessions
           WHERE id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    messages = None
    if include_messages:
        cur.execute(
            """SELECT id, session_id, identity_id, author, agent_service,
                      body_md, phase, created_at
               FROM member_journal_messages
               WHERE session_id = %s AND identity_id = %s
               ORDER BY created_at ASC, id ASC""",
            (session_id, identity_id),
        )
        messages = list(cur.fetchall())
    tags = _session_tags(cur, session_id)
    return serialize_session(row, messages=messages, tags=tags)


def list_sessions(
    cur,
    identity_id: int,
    *,
    journal_date: date | str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[dict]:
    limit = max(1, min(int(limit), 200))
    clauses = ["identity_id = %s"]
    params: list[Any] = [identity_id]
    if journal_date is not None:
        clauses.append("journal_date = %s")
        params.append(_as_date(journal_date))
    if status is not None:
        st = str(status).strip()
        if st not in VALID_STATUS:
            raise JournalSessionError(422, f"Invalid status filter: {st}")
        clauses.append("status = %s")
        params.append(st)
    params.append(limit)
    where = " AND ".join(clauses)
    cur.execute(
        f"""SELECT {_SESSION_COLS}
           FROM member_journal_sessions
           WHERE {where}
           ORDER BY session_started_at DESC, id DESC
           LIMIT %s""",
        tuple(params),
    )
    out = []
    for r in cur.fetchall():
        tags = _session_tags(cur, int(r["id"]))
        out.append(serialize_session(r, tags=tags))
    return out


def _load_mutable_row(cur, identity_id: int, session_id: int) -> dict:
    cur.execute(
        f"""SELECT {_SESSION_COLS}
           FROM member_journal_sessions
           WHERE id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise JournalSessionError(404, NOT_FOUND_DETAIL)
    st = str(row["status"])
    if st in ("closed", "sealed"):
        raise JournalSessionError(409, CLOSED_SESSION_DETAIL)
    if st not in MUTABLE_STATUS and st != "open":
        raise JournalSessionError(409, f"Session status '{st}' is not mutable")
    return row


def append_member_message(
    cur,
    identity_id: int,
    session_id: int,
    *,
    body_md: str,
    now: datetime | None = None,
) -> dict:
    """J1: member-authored turns only. Agent path is J3."""
    body = str(body_md or "")
    if not body.strip():
        raise JournalSessionError(422, "body_md is required")
    row = _load_mutable_row(cur, identity_id, session_id)
    jd = _as_date(row["journal_date"])
    assert_date_open(cur, identity_id, jd)
    at = now or _now_utc()
    phase = derive_phase(jd, at)
    created = _naive_utc(at)
    cur.execute(
        """INSERT INTO member_journal_messages
             (session_id, identity_id, author, agent_service, body_md, phase, created_at)
           VALUES (%s, %s, 'member', NULL, %s, %s, %s)""",
        (session_id, identity_id, body, phase, created),
    )
    mid = int(cur.lastrowid)
    cur.execute(
        """SELECT id, session_id, identity_id, author, agent_service,
                  body_md, phase, created_at
           FROM member_journal_messages WHERE id = %s""",
        (mid,),
    )
    return serialize_message(cur.fetchone())


def append_agent_message(
    cur,
    identity_id: int,
    session_id: int,
    *,
    body_md: str,
    phase: str | None = None,
    now: datetime | None = None,
) -> dict:
    """J3: server-only agent turn. D7 — agent_service always labs-journal-session.

    Client must never set author=agent; only this path inserts agent rows.
    """
    body = str(body_md or "")
    if not body.strip():
        raise JournalSessionError(422, "body_md is required")
    row = _load_mutable_row(cur, identity_id, session_id)
    jd = _as_date(row["journal_date"])
    assert_date_open(cur, identity_id, jd)
    at = now or _now_utc()
    ph = phase or derive_phase(jd, at)
    if ph not in VALID_PHASE:
        raise JournalSessionError(422, f"Invalid phase: {ph}")
    created = _naive_utc(at)
    cur.execute(
        """INSERT INTO member_journal_messages
             (session_id, identity_id, author, agent_service, body_md, phase, created_at)
           VALUES (%s, %s, 'agent', %s, %s, %s, %s)""",
        (session_id, identity_id, AGENT_SERVICE, body, ph, created),
    )
    mid = int(cur.lastrowid)
    cur.execute(
        """SELECT id, session_id, identity_id, author, agent_service,
                  body_md, phase, created_at
           FROM member_journal_messages WHERE id = %s""",
        (mid,),
    )
    return serialize_message(cur.fetchone())


def patch_session(
    cur,
    identity_id: int,
    session_id: int,
    *,
    structured: Any = None,
    structured_set: bool = False,
    merge: bool = True,
) -> dict:
    """Update structured_json before seal. identity_id in body is never used.

    merge=True (default): overlay onto existing structured (form field saves).
    merge=False: replace with normalized payload only.
    """
    row = _load_mutable_row(cur, identity_id, session_id)
    if structured_set:
        tag = str(row["tag"] or "reflection")
        try:
            incoming = jss.normalize_structured(tag, structured)
        except ValueError as e:
            raise JournalSessionError(422, str(e)) from e
        if merge and incoming is not None:
            existing = row.get("structured_json")
            if isinstance(existing, str):
                try:
                    existing = json.loads(existing)
                except json.JSONDecodeError:
                    existing = {}
            if not isinstance(existing, dict):
                existing = {}
            merged = {**existing, **incoming}
            # Re-normalize to drop empties / unknown
            try:
                incoming = jss.normalize_structured(tag, merged)
            except ValueError as e:
                raise JournalSessionError(422, str(e)) from e
        sj = json.dumps(incoming) if incoming is not None else None
        cur.execute(
            """UPDATE member_journal_sessions
               SET structured_json = %s
               WHERE id = %s AND identity_id = %s AND status IN ('open', 'partial')""",
            (sj, session_id, identity_id),
        )
        if cur.rowcount == 0:
            raise JournalSessionError(409, CLOSED_SESSION_DETAIL)
    return get_session(cur, identity_id, session_id, include_messages=True)


def seal_session(
    cur,
    identity_id: int,
    session_id: int,
    *,
    require_complete: bool = False,
) -> dict:
    """Deprecated v0.4a — no product close. Optional checklist validate only; stay open.

    Sessions close only on retrospective complete (§12). Retained for one release so
    older clients do not hard-fail; status is never set to sealed/closed here.
    """
    row = _load_mutable_row(cur, identity_id, session_id)
    assert_date_open(cur, identity_id, _as_date(row["journal_date"]))
    if require_complete:
        sj = row.get("structured_json")
        if isinstance(sj, str):
            try:
                sj = json.loads(sj)
            except json.JSONDecodeError:
                sj = None
        try:
            jss.assert_complete_for_seal(
                str(row.get("tag") or "reflection"),
                sj if isinstance(sj, dict) else None,
            )
        except ValueError as e:
            raise JournalSessionError(422, str(e)) from e
    # Leave open — member seal does not close the conversation
    return get_session(cur, identity_id, session_id, include_messages=True)


def mark_partial(cur, identity_id: int, session_id: int) -> dict:
    """Deprecated v0.4a — partial status removed; leave open (interruption costs nothing)."""
    row = _load_mutable_row(cur, identity_id, session_id)
    # Ensure open
    if str(row["status"]) != "open":
        cur.execute(
            """UPDATE member_journal_sessions SET status = 'open'
               WHERE id = %s AND identity_id = %s AND status = 'partial'""",
            (session_id, identity_id),
        )
    return get_session(cur, identity_id, session_id, include_messages=True)


def set_tags(
    cur, identity_id: int, session_id: int, tags: list[str]
) -> dict:
    """Replace multi-tags while open (context only)."""
    _load_mutable_row(cur, identity_id, session_id)
    cleaned: list[str] = []
    for t in tags:
        t = str(t or "").strip()
        if t in VALID_TAGS and t not in cleaned:
            cleaned.append(t)
    _set_session_tags(cur, session_id, cleaned)
    primary = cleaned[0] if cleaned else None
    cur.execute(
        """UPDATE member_journal_sessions SET tag = %s
           WHERE id = %s AND identity_id = %s""",
        (primary, session_id, identity_id),
    )
    return get_session(cur, identity_id, session_id, include_messages=True)


def get_absence_keys_raised(row: dict) -> list[str]:
    raw = row.get("absence_keys_raised_json")
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return []
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return []


def mark_absence_key_raised(
    cur, identity_id: int, session_id: int, key: str
) -> None:
    row = _load_mutable_row(cur, identity_id, session_id)
    keys = get_absence_keys_raised(row)
    if key in keys:
        return
    keys.append(key)
    cur.execute(
        """UPDATE member_journal_sessions
           SET absence_keys_raised_json = %s
           WHERE id = %s AND identity_id = %s""",
        (json.dumps(keys), session_id, identity_id),
    )


# --- Dual-read (Spec §2.1 · JS1-3) --------------------------------------------

_PRE_MARKET_FIELD_ORDER = jss.PRE_MARKET_KEY_ORDER


def session_started_ny_date(dt: datetime | None) -> date | None:
    """D2 — routine / activity day key from session_started_at (UTC → America/New_York)."""
    if dt is None:
        return None
    if not isinstance(dt, datetime):
        return None
    msg = dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
    return msg.astimezone(_NY).date()


def _parse_structured(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            val = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return val if isinstance(val, dict) else None
    return None


def format_structured_intent(structured: dict | None) -> str:
    """Member-confirmed fields only — never invent missing keys (J2 gate)."""
    if not structured:
        return ""
    parts: list[str] = []
    for key in _PRE_MARKET_FIELD_ORDER:
        if key not in structured:
            continue
        val = structured.get(key)
        if val is None or val == "":
            continue
        parts.append(f"{key}: {val}")
    for key, val in structured.items():
        if key in _PRE_MARKET_FIELD_ORDER:
            continue
        if val is None or val == "":
            continue
        parts.append(f"{key}: {val}")
    return " · ".join(parts)


def list_member_message_ny_dates(
    cur,
    identity_id: int,
    *,
    since: datetime | None = None,
    until: datetime | None = None,
) -> set[date]:
    """Routine days — Spec Retrospective v0.7.1 §12.2 / Journal Session amendment.

    A routine day is a local America/New_York calendar day on which the member
    authored at least one journal message (by message timestamp), independent of
    the session's journal_date. Agent turns do not count.
    """
    clauses = [
        "m.identity_id = %s",
        "m.author = 'member'",
    ]
    params: list[Any] = [identity_id]
    if since is not None:
        clauses.append("m.created_at >= %s")
        params.append(_naive_utc(since))
    if until is not None:
        clauses.append("m.created_at <= %s")
        params.append(_naive_utc(until))
    where = " AND ".join(clauses)
    cur.execute(
        f"""SELECT m.created_at FROM member_journal_messages m
           WHERE {where}""",
        tuple(params),
    )
    out: set[date] = set()
    for row in cur.fetchall():
        d = session_started_ny_date(row.get("created_at"))
        if d is not None:
            out.add(d)
    return out


def list_session_activity_ny_dates(
    cur,
    identity_id: int,
    scope_start: datetime | None = None,
    scope_end: datetime | None = None,
    *,
    is_maiden: bool = True,
    since: datetime | None = None,
    until: datetime | None = None,
) -> set[date]:
    """Journal activity NY days for meters.

    Spec v0.7.1 §12.2: prefer **member message** timestamps (routine day).
    Falls back to session_started_at only when no message window is usable.
    """
    if since is not None:
        return list_member_message_ny_dates(
            cur, identity_id, since=since, until=until
        )
    if scope_start is not None and scope_end is not None:
        # Scope uses message times when present; dual-read session start for empty
        msgs = list_member_message_ny_dates(
            cur,
            identity_id,
            since=scope_start if is_maiden else scope_start,
            until=scope_end,
        )
        # Also include session starts in window for pre-message-era dual-read
        op = ">=" if is_maiden else ">"
        cur.execute(
            f"""SELECT session_started_at FROM member_journal_sessions
               WHERE identity_id = %s
                 AND status IN ('open', 'closed', 'partial', 'sealed')
                 AND session_started_at {op} %s AND session_started_at <= %s""",
            (identity_id, _naive_utc(scope_start), _naive_utc(scope_end)),
        )
        out = set(msgs)
        for row in cur.fetchall():
            d = session_started_ny_date(row.get("session_started_at"))
            if d is not None:
                out.add(d)
        return out
    return list_member_message_ny_dates(cur, identity_id)


def pre_market_intents_from_sessions(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> list[dict[str, Any]]:
    """§6.5 dual-read: pre_market sessions (any status) keyed by journal_date.

    Intent from structured + pre_open member turns only — never invents fields.
    Includes open sessions (v0.4a: no member seal required).
    """
    start_d = _naive_utc(scope_start).date()
    end_d = _naive_utc(scope_end).date()
    # Tag via join or legacy column
    if is_maiden:
        cur.execute(
            """SELECT s.id, s.journal_date, s.structured_json, s.status
               FROM member_journal_sessions s
               LEFT JOIN member_journal_session_tags t ON t.session_id = s.id
               WHERE s.identity_id = %s
                 AND (s.tag = 'pre_market' OR t.tag = 'pre_market')
                 AND s.status IN ('open', 'closed', 'partial', 'sealed')
                 AND s.journal_date >= %s AND s.journal_date <= %s
               GROUP BY s.id
               ORDER BY s.journal_date ASC, s.id ASC""",
            (identity_id, start_d, end_d),
        )
    else:
        cur.execute(
            """SELECT s.id, s.journal_date, s.structured_json, s.status
               FROM member_journal_sessions s
               LEFT JOIN member_journal_session_tags t ON t.session_id = s.id
               WHERE s.identity_id = %s
                 AND (s.tag = 'pre_market' OR t.tag = 'pre_market')
                 AND s.status IN ('open', 'closed', 'partial', 'sealed')
                 AND s.journal_date > %s AND s.journal_date <= %s
               GROUP BY s.id
               ORDER BY s.journal_date ASC, s.id ASC""",
            (identity_id, start_d, end_d),
        )
    rows = cur.fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        sid = int(r["id"])
        jd = r.get("journal_date")
        if isinstance(jd, datetime):
            day = jd.date().isoformat()
        elif isinstance(jd, date):
            day = jd.isoformat()
        else:
            day = str(jd)[:10]

        structured = _parse_structured(r.get("structured_json"))
        intent_parts: list[str] = []
        structured_text = format_structured_intent(structured)
        if structured_text:
            intent_parts.append(structured_text)

        cur.execute(
            """SELECT body_md FROM member_journal_messages
               WHERE session_id = %s AND identity_id = %s
                 AND author = 'member' AND phase = 'pre_open'
               ORDER BY created_at ASC, id ASC""",
            (sid, identity_id),
        )
        for m in cur.fetchall():
            body = str(m.get("body_md") or "").strip()
            if body:
                intent_parts.append(body)

        if not intent_parts:
            continue

        out.append(
            {
                "day": day,
                "stated_intent": "\n".join(intent_parts),
                "session_id": sid,
                "note_id": None,
                "source": "journal_session",
            }
        )
    return out
