"""Retrospective gather + dual report (Spec v0.5 R1b+).

Process-first; P&L is neutral book context. Isolation key: identity_id only.
Create entitlement: Spec §10.1 (plan-aware trial).

Report JSON contract (Charlie / Alpha): Architecture/12-retrospective-report-dto.md
  - As-built gather emits version \"0.2\" (pnl + process + integrity_review).
  - RT2-2 target version \"0.5\" (book_performance, deviations, what_worked, …).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Literal, NotRequired, TypedDict

import auth
import journey_scores as js
from identity import ACTIVE_STATUSES
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl


VALID_STATUS = frozenset(
    {"draft", "gathering", "ready", "complete", "abandoned"}
)
OPEN_STATUSES = frozenset({"draft", "gathering", "ready"})

# Spec §10.1 — Observer trial plan slug (live memberships, not role-only)
OBSERVER_TRIAL_SLUG = "observer-trial"

CREATE_DENY_DETAIL = (
    "Retrospectives require an active Observer trial plan, "
    "Activator or Navigator membership, or administrator access"
)

# Spec constants (Hotel / §6.3) — RT2-2 uses these; fail loud, no UI-only magic
MIN_INFERENCE_N = 20
JOURNAL_GAP_DAYS = 3
MAX_DEVIATIONS = 5
MAX_WHAT_WORKED = 3
# Spec §7.2 — activity-rate floor; window length ratio (seed: 21d vs 63d not comparable)
ACTIVITY_MIN_WINDOW_DAYS = 14
WINDOW_LENGTH_RATIO_MAX = 3.0  # comparable only if longer/shorter < 3 (strict)

# Spec §18 / §9.2 — habit plans (R4)
MAX_ACTIVE_HABIT_PLANS = 2
OBSERVABLE_SIGNALS = frozenset(
    {"adherence_rate", "routine_days", "live_checkins", "lesson_days"}
)
HABIT_STATUSES = frozenset(
    {"proposed", "active", "kept", "partial", "lapsed", "retired"}
)
HABIT_TERMINAL = frozenset({"kept", "partial", "lapsed", "retired"})
CARRY_FORWARD_EMPTY_MSG = (
    "No plans carried in — this is where they'll appear next time."
)

REPORT_VERSION_ASBUILT = "0.2"
REPORT_VERSION_TARGET = "0.5"

SAMPLE_BANNER = (
    "This is a small sample. It describes what happened; "
    "it does not measure process quality."
)
BOOK_COLLAPSED_SUMMARY = (
    "Book performance (results) — neutral sample from this window. "
    "Expand when you want the numbers."
)


# --- RT2-1 TypedDict contract (target 0.5; gather fills in RT2-2) ---------------


class ReportMeta(TypedDict):
    is_maiden: bool
    scope_start: str
    scope_end: str
    window_days: int
    trade_count: int
    min_inference_n: int


class DeviationItem(TypedDict):
    kind: str
    label: str
    count: int
    rate: float | None
    most_recent_at: str | None
    deep_link: str | None
    note: str | None


class WhatWorkedItem(TypedDict):
    observation: str
    evidence: str
    window_n: int


class BookPerformance(TypedDict):
    framing: str
    headline: str
    collapsed_summary: str
    trade_count: int
    trades_with_pnl: int
    min_inference_n: int
    sample_below_min: bool
    sample_banner: str | None
    net_pnl: float | None
    winners: int
    losers: int
    note: str
    by_account: NotRequired[Any]


class IntegrityReview(TypedDict):
    headline: str
    grade: str | None
    grade_id: str | None
    blurb: str | None
    overall_percent: float | None
    overall_raw_percent: NotRequired[float | None]
    establishing: NotRequired[bool]
    direction: str | None
    drivers: list[dict[str, Any]]
    note: str


class ReportV05(TypedDict):
    """Target report_json after RT2-2. See Architecture/12-retrospective-report-dto.md."""

    version: Literal["0.5"]
    meta: ReportMeta
    carry_forward: dict[str, Any] | None
    process: dict[str, Any]
    integrity_review: IntegrityReview
    deviations: list[DeviationItem]
    what_worked: list[WhatWorkedItem]
    expected_vs_actual: list[dict[str, Any]] | None
    book_performance: BookPerformance



def has_active_plan_slug(cur, identity_id: int, slug: str) -> bool:
    """True if identity has an unexpired active/grace membership for plan slug."""
    placeholders = ",".join(["%s"] * len(ACTIVE_STATUSES))
    cur.execute(
        f"""SELECT 1
            FROM memberships m
            JOIN plans p ON p.id = m.plan_id
            WHERE m.identity_id = %s
              AND p.slug = %s
              AND m.status IN ({placeholders})
              AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
            LIMIT 1""",
        (identity_id, slug, *ACTIVE_STATUSES),
    )
    return cur.fetchone() is not None


def count_active_habit_plans(cur, identity_id: int, *, for_update: bool = False) -> int:
    """Count status=active habit plans (Spec §18 cap)."""
    sql = """SELECT COUNT(*) AS n FROM member_habit_plans
             WHERE identity_id = %s AND status = 'active'"""
    if for_update:
        sql += " FOR UPDATE"
    cur.execute(sql, (identity_id,))
    return int(cur.fetchone()["n"] or 0)


def serialize_habit_plan(row: dict) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "identity_id": int(row["identity_id"]),
        "retrospective_id": (
            int(row["retrospective_id"]) if row.get("retrospective_id") else None
        ),
        "title": row.get("title") or "",
        "habit": row.get("habit") or "",
        "why_process": row.get("why_process") or "",
        "observable_signal": row.get("observable_signal") or "",
        "status": row.get("status") or "proposed",
        "activated_at": _iso(row.get("activated_at")),
        "retired_at": _iso(row.get("retired_at")),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def list_habit_plans(cur, identity_id: int) -> list[dict[str, Any]]:
    cur.execute(
        """SELECT * FROM member_habit_plans
           WHERE identity_id = %s
           ORDER BY
             FIELD(status, 'active', 'proposed', 'partial', 'kept', 'lapsed', 'retired'),
             id DESC
           LIMIT 100""",
        (identity_id,),
    )
    return [serialize_habit_plan(r) for r in cur.fetchall()]


def get_habit_plan(cur, identity_id: int, plan_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_habit_plans
           WHERE id = %s AND identity_id = %s""",
        (plan_id, identity_id),
    )
    return cur.fetchone()


def validate_observable_signal(signal: str) -> str:
    s = (signal or "").strip()
    if s not in OBSERVABLE_SIGNALS:
        raise ValueError(
            "observable_signal must be one of: "
            + ", ".join(sorted(OBSERVABLE_SIGNALS))
        )
    return s


def validate_habit_status(status: str) -> str:
    s = (status or "").strip()
    if s not in HABIT_STATUSES:
        raise ValueError(
            "status must be one of: " + ", ".join(sorted(HABIT_STATUSES))
        )
    return s


def can_transition_habit(from_status: str, to_status: str) -> bool:
    if from_status == to_status:
        return True
    if from_status == "proposed":
        return to_status in ("active", "retired")
    if from_status == "active":
        return to_status in ("kept", "partial", "lapsed", "retired")
    # terminal states are sticky except member may re-retire
    return False


def build_carry_forward(cur, identity_id: int, *, is_maiden: bool) -> dict | None:
    """Spec §6.0 — null for maiden; empty_message when no activated plans."""
    if is_maiden:
        return None
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_habit_plans
           WHERE identity_id = %s AND activated_at IS NOT NULL""",
        (identity_id,),
    )
    ever = int(cur.fetchone()["n"] or 0)
    if ever == 0:
        return {"plans": [], "empty_message": CARRY_FORWARD_EMPTY_MSG}
    cur.execute(
        """SELECT * FROM member_habit_plans
           WHERE identity_id = %s
             AND status IN ('active', 'kept', 'partial', 'lapsed')
           ORDER BY id ASC
           LIMIT 20""",
        (identity_id,),
    )
    rows = cur.fetchall()
    plans = []
    for r in rows:
        plans.append(
            {
                "id": int(r["id"]),
                "title": r.get("title") or "",
                "habit": r.get("habit") or "",
                "observable_signal": r.get("observable_signal") or "",
                "committed_on": _iso(r.get("activated_at") or r.get("created_at")),
                "signal_this_window": None,  # RT4-2 / rates later
                "signal_prior_window": None,
                "signal_unit": r.get("observable_signal") or "",
                "self_assessment": (
                    r["status"]
                    if r.get("status") in ("kept", "partial", "lapsed")
                    else None
                ),
                "status": r.get("status"),
            }
        )
    return {
        "plans": plans,
        "empty_message": CARRY_FORWARD_EMPTY_MSG if not plans else None,
    }


def can_create_or_gather(cur, identity_id: int, role: str) -> bool:
    """Spec §10.1: admin OR activator+ OR active observer-trial plan.

    Plan check is live against memberships — do not rely on grants_role alone
    (trial currently grants navigator, which is accidental for entitlement).
    """
    if role == "administrator":
        return True
    try:
        if auth.role_at_least(role, "activator"):
            return True
    except auth.AuthError:
        return False
    return has_active_plan_slug(cur, identity_id, OBSERVER_TRIAL_SLUG)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).isoformat()
    return dt.isoformat()


def _as_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _parse_exec(ts: Any) -> datetime | None:
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return _as_naive_utc(ts)
    s = str(ts).replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(s)
        return _as_naive_utc(d)
    except ValueError:
        return None


def practice_epoch(cur, identity_id: int) -> datetime:
    """Earliest practice signal, else identity.created_at."""
    candidates: list[datetime] = []

    cur.execute(
        """SELECT MIN(exec_at) AS t FROM member_trade_log_trades
           WHERE identity_id = %s""",
        (identity_id,),
    )
    r = cur.fetchone()
    if r and r.get("t"):
        candidates.append(_as_naive_utc(r["t"]))

    cur.execute(
        """SELECT MIN(created_at) AS t FROM member_tool_notes
           WHERE identity_id = %s""",
        (identity_id,),
    )
    r = cur.fetchone()
    if r and r.get("t"):
        candidates.append(_as_naive_utc(r["t"]))

    cur.execute(
        """SELECT MIN(checked_in_at) AS t FROM live_session_checkins
           WHERE identity_id = %s""",
        (identity_id,),
    )
    r = cur.fetchone()
    if r and r.get("t"):
        candidates.append(_as_naive_utc(r["t"]))

    cur.execute(
        """SELECT MIN(completed_at) AS t FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL""",
        (identity_id,),
    )
    r = cur.fetchone()
    if r and r.get("t"):
        candidates.append(_as_naive_utc(r["t"]))

    cur.execute(
        "SELECT created_at FROM identities WHERE identity_id = %s",
        (identity_id,),
    )
    r = cur.fetchone()
    if r and r.get("created_at"):
        candidates.append(_as_naive_utc(r["created_at"]))

    if not candidates:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    return min(candidates)


def last_complete_retrospective(cur, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT id, completed_at, scope_start, scope_end, title, report_json
           FROM member_retrospectives
           WHERE identity_id = %s AND status = 'complete'
             AND completed_at IS NOT NULL
           ORDER BY completed_at DESC
           LIMIT 1""",
        (identity_id,),
    )
    return cur.fetchone()


def open_retrospective(cur, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT id, status FROM member_retrospectives
           WHERE identity_id = %s AND status IN ('draft', 'gathering', 'ready')
           ORDER BY id DESC
           LIMIT 1""",
        (identity_id,),
    )
    return cur.fetchone()


def resolve_scope(
    cur, identity_id: int, *, now: datetime | None = None
) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    now_n = _as_naive_utc(now)
    prev = last_complete_retrospective(cur, identity_id)
    if prev and prev.get("completed_at"):
        start = _as_naive_utc(prev["completed_at"])
        return {
            "is_maiden": False,
            "scope_start": start,
            "scope_end": now_n,
            "prior_id": int(prev["id"]),
            "prior_completed_at": _iso(prev["completed_at"]),
        }
    start = practice_epoch(cur, identity_id)
    return {
        "is_maiden": True,
        "scope_start": start,
        "scope_end": now_n,
        "prior_id": None,
        "prior_completed_at": None,
    }


def _in_scope(ex: datetime, scope_start: datetime, scope_end: datetime, *, is_maiden: bool) -> bool:
    """Maiden [start, end]; subsequent (start, end] — Option C boundary at completed_at."""
    if is_maiden:
        return scope_start <= ex <= scope_end
    return scope_start < ex <= scope_end


def _window_days(scope_start: datetime, scope_end: datetime) -> int:
    d0 = _as_naive_utc(scope_start).date()
    d1 = _as_naive_utc(scope_end).date()
    return max(1, (d1 - d0).days + 1)


def _per_week(count: int | float, window_days: int) -> float | None:
    if window_days <= 0:
        return None
    return round(float(count) / (window_days / 7.0), 2)


def _filter_trades(
    trades: list[dict],
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> list[dict]:
    enriched = enrich_trades_with_synthetic_pnl(trades)
    filtered: list[dict] = []
    for t in enriched:
        ex = _parse_exec(t.get("exec_at"))
        if ex is None:
            continue
        if _in_scope(ex, scope_start, scope_end, is_maiden=is_maiden):
            filtered.append(t)
    filtered.sort(key=lambda t: _parse_exec(t.get("exec_at")) or scope_start)
    return filtered


def _book_performance(filtered: list[dict]) -> dict[str, Any]:
    """Spec §6.6 — neutral sample + Hotel sample gate."""
    net = 0.0
    winners = losers = 0
    with_pnl = 0
    adherence = {"followed": 0, "partial": 0, "broke": 0, "unknown": 0, "other": 0}
    for t in filtered:
        pnl = realized_pnl(t)
        if pnl is not None:
            with_pnl += 1
            net += float(pnl)
            if pnl > 0:
                winners += 1
            elif pnl < 0:
                losers += 1
        adh = (t.get("adherence") or "unknown").strip().lower()
        if adh in adherence:
            adherence[adh] += 1
        else:
            adherence["other"] += 1

    trade_count = len(filtered)
    below = trade_count < MIN_INFERENCE_N
    return {
        "framing": "book_performance_neutral",
        "headline": "Book performance (results)",
        "collapsed_summary": BOOK_COLLAPSED_SUMMARY,
        "trade_count": trade_count,
        "trades_with_pnl": with_pnl,
        "min_inference_n": MIN_INFERENCE_N,
        "sample_below_min": below,
        "sample_banner": SAMPLE_BANNER if below else None,
        "net_pnl": round(net, 2) if with_pnl else None,
        "winners": winners,
        "losers": losers,
        "adherence_counts": adherence,
        "by_account": None,
        "note": (
            "Neutral book context for process review — not a success score "
            "and not marketing performance."
        ),
    }


def _process_performance(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    window_days: int,
) -> dict[str, Any]:
    """Spec §6.1 — process rates (no P&L)."""
    op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT COUNT(DISTINCT DATE(exec_at)) AS n
           FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at {op} %s AND exec_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    trade_days = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT COUNT(*) AS n FROM member_tool_notes
           WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    journal_notes = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT COUNT(DISTINCT DATE(created_at)) AS n FROM member_tool_notes
           WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    journal_days = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT COUNT(*) AS n FROM live_session_checkins
           WHERE identity_id = %s AND checked_in_at {op} %s AND checked_in_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    checkins = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT COUNT(*) AS n FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL
             AND completed_at {op} %s AND completed_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    lessons = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT COUNT(DISTINCT DATE(completed_at)) AS n FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL
             AND completed_at {op} %s AND completed_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    lesson_days = int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT
             SUM(CASE WHEN adherence = 'followed' THEN 1 ELSE 0 END) AS followed,
             SUM(CASE WHEN adherence = 'partial' THEN 1 ELSE 0 END) AS partial,
             SUM(CASE WHEN adherence = 'broke' THEN 1 ELSE 0 END) AS broke,
             SUM(CASE WHEN adherence NOT IN ('followed','partial','broke')
                      OR adherence IS NULL THEN 1 ELSE 0 END) AS unknown_or_other,
             COUNT(*) AS total
           FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at {op} %s AND exec_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    adh = cur.fetchone() or {}
    followed = int(adh.get("followed") or 0)
    partial = int(adh.get("partial") or 0)
    broke = int(adh.get("broke") or 0)
    unknown = int(adh.get("unknown_or_other") or 0)
    total = int(adh.get("total") or 0)
    fp_rate = None
    if total > 0:
        fp_rate = round((followed + partial) / total, 4)

    # Union activity days for routine rate
    activity_days = trade_days  # trade days already distinct
    # journal-only days may add — approximate with max of journal_days vs trade_days
    # Better: activity_days_per_week uses distinct trade OR journal days
    cur.execute(
        f"""SELECT COUNT(*) AS n FROM (
              SELECT DATE(exec_at) AS d FROM member_trade_log_trades
               WHERE identity_id = %s AND exec_at {op} %s AND exec_at <= %s
              UNION
              SELECT DATE(created_at) AS d FROM member_tool_notes
               WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s
            ) u""",
        (identity_id, scope_start, scope_end, identity_id, scope_start, scope_end),
    )
    activity_days = int(cur.fetchone()["n"] or 0)

    return {
        "framing": "process_performance",
        "headline": "Process performance",
        "window_days": window_days,
        "adherence": {
            "followed": followed,
            "partial": partial,
            "broke": broke,
            "unknown_or_other": unknown,
            "total": total,
            "followed_or_partial_rate": fp_rate,
        },
        "routine": {
            "trade_days": trade_days,
            "journal_notes": journal_notes,
            "journal_days": journal_days,
            "activity_days": activity_days,
            "activity_days_per_week": _per_week(activity_days, window_days),
        },
        "live": {
            "checkins": checkins,
            "checkins_per_week": _per_week(checkins, window_days),
        },
        "learning": {
            "lessons_completed": lessons,
            "lesson_days": lesson_days,
            "lesson_days_per_week": _per_week(lesson_days, window_days),
        },
        # Legacy flat fields for v0.2 fallback consumers
        "trade_days": trade_days,
        "journal_notes": journal_notes,
        "live_checkins": checkins,
        "lessons_completed": lessons,
        "note": "How you practiced in this window — habits, not P&L theater.",
    }


def _integrity_review(
    cur, identity_id: int, *, role: str, direction: str | None
) -> dict[str, Any]:
    """Spec §6.2 — Journey process meters snapshot."""
    process = js.process_meters(cur, identity_id, role=role)
    grade = process.get("grade") or {}
    drivers = [
        {
            "id": m.get("id"),
            "label": m.get("label"),
            "percent": m.get("percent"),
            "grade": (m.get("grade") or {}).get("label"),
            "detail": m.get("detail"),
        }
        for m in (process.get("meters") or [])
        if not m.get("soon")
    ]
    return {
        "headline": "Process Integrity review",
        "grade": grade.get("label"),
        "grade_id": grade.get("id"),
        "blurb": grade.get("blurb"),
        "overall_percent": process.get("overall_percent"),
        "overall_raw_percent": process.get("overall_raw_percent"),
        "establishing": bool(grade.get("establishing")),
        "profile": process.get("profile"),
        "direction": direction,
        "drivers": drivers,
        "note": (
            "Integrity describes how you practiced — not whether the book "
            "made money."
        ),
    }


def _activity_dates(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> set:
    from datetime import date as date_cls

    op = ">=" if is_maiden else ">"
    dates: set = set()
    cur.execute(
        f"""SELECT DISTINCT DATE(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at {op} %s AND exec_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    for row in cur.fetchall():
        if row["d"]:
            dates.add(row["d"] if isinstance(row["d"], date_cls) else row["d"])
    cur.execute(
        f"""SELECT DISTINCT DATE(created_at) AS d FROM member_tool_notes
           WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    for row in cur.fetchall():
        if row["d"]:
            dates.add(row["d"] if isinstance(row["d"], date_cls) else row["d"])
    return dates


def _deviations(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    filtered_trades: list[dict],
) -> list[dict[str, Any]]:
    """Spec §6.3 — max MAX_DEVIATIONS, facts at n=1 OK."""
    from datetime import date as date_cls
    from datetime import timedelta

    items: list[dict[str, Any]] = []

    # Adherence broke
    broke_trades = [
        t
        for t in filtered_trades
        if (t.get("adherence") or "").strip().lower() == "broke"
    ]
    total = len(filtered_trades)
    if broke_trades:
        last = broke_trades[-1]
        last_ex = _parse_exec(last.get("exec_at"))
        items.append(
            {
                "kind": "adherence_broke",
                "label": "Trades tagged broke",
                "count": len(broke_trades),
                "rate": round(len(broke_trades) / total, 4) if total else None,
                "most_recent_at": _iso(last_ex),
                "deep_link": "/app/trade-log",
                "note": None,
            }
        )

    # Journal/activity gaps ≥ JOURNAL_GAP_DAYS consecutive calendar days
    active = _activity_dates(
        cur, identity_id, scope_start, scope_end, is_maiden=is_maiden
    )
    d0 = _as_naive_utc(scope_start).date()
    d1 = _as_naive_utc(scope_end).date()
    gap_runs = 0
    gap_days_total = 0
    most_recent_gap_end: date_cls | None = None
    run = 0
    cur_d = d0
    while cur_d <= d1:
        if cur_d not in active:
            run += 1
        else:
            if run >= JOURNAL_GAP_DAYS:
                gap_runs += 1
                gap_days_total += run
                most_recent_gap_end = cur_d - timedelta(days=1)
            run = 0
        cur_d += timedelta(days=1)
    if run >= JOURNAL_GAP_DAYS:
        gap_runs += 1
        gap_days_total += run
        most_recent_gap_end = d1

    if gap_runs > 0:
        items.append(
            {
                "kind": "journal_activity_gap",
                "label": (
                    f"Journal/activity gap ≥ {JOURNAL_GAP_DAYS} calendar days"
                ),
                "count": gap_runs,
                "rate": None,
                "most_recent_at": (
                    most_recent_gap_end.isoformat() if most_recent_gap_end else None
                ),
                "deep_link": "/app/journal",
                "note": f"{gap_days_total} empty day(s) across {gap_runs} gap(s)",
            }
        )

    # Rank by count then recency; cap
    def _sort_key(it: dict) -> tuple:
        return (-int(it.get("count") or 0), it.get("most_recent_at") or "")

    items.sort(key=_sort_key)
    return items[:MAX_DEVIATIONS]


def _day_key(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    d = _as_naive_utc(dt).date()
    return d.isoformat()


def _what_worked(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    filtered_trades: list[dict],
) -> list[dict[str, Any]]:
    """Spec §6.4 — process-only; max MAX_WHAT_WORKED. No P&L figures printed."""
    items: list[dict[str, Any]] = []
    # Longest followed run
    best = 0
    run = 0
    for t in filtered_trades:
        if (t.get("adherence") or "").strip().lower() == "followed":
            run += 1
            best = max(best, run)
        else:
            run = 0
    if best >= 2:
        items.append(
            {
                "observation": f"{best} consecutive trades tagged followed",
                "evidence": "adherence run",
                "window_n": best,
            }
        )
    followed_n = sum(
        1
        for t in filtered_trades
        if (t.get("adherence") or "").strip().lower() == "followed"
    )
    if followed_n >= 3 and best < followed_n:
        items.append(
            {
                "observation": f"{followed_n} trades tagged followed in window",
                "evidence": "adherence count",
                "window_n": followed_n,
            }
        )

    # Best journal stretch (consecutive calendar days with a journal note)
    op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT DISTINCT DATE(created_at) AS d FROM member_tool_notes
           WHERE identity_id = %s
             AND surface IN ('journal', 'pre_market')
             AND created_at {op} %s AND created_at <= %s
           ORDER BY d""",
        (identity_id, scope_start, scope_end),
    )
    jdays = []
    from datetime import date as date_cls
    from datetime import timedelta

    for row in cur.fetchall():
        d = row["d"]
        if d is None:
            continue
        if not isinstance(d, date_cls):
            continue
        jdays.append(d)
    stretch = 0
    best_stretch = 0
    prev: date_cls | None = None
    for d in jdays:
        if prev is not None and d == prev + timedelta(days=1):
            stretch += 1
        else:
            stretch = 1
        best_stretch = max(best_stretch, stretch)
        prev = d
    if best_stretch >= 3:
        items.append(
            {
                "observation": (
                    f"{best_stretch} straight days with a journal entry"
                ),
                "evidence": "journal routine stretch",
                "window_n": best_stretch,
            }
        )

    # Adverse condition: followed on a day when that day's book net < 0
    # Process fact only — never print the P&L figure (Hotel/Tango)
    day_pnl: dict[str, float] = {}
    day_followed: dict[str, int] = {}
    for t in filtered_trades:
        ex = _parse_exec(t.get("exec_at"))
        dk = _day_key(ex)
        if not dk:
            continue
        pnl = realized_pnl(t)
        if pnl is not None:
            day_pnl[dk] = day_pnl.get(dk, 0.0) + float(pnl)
        if (t.get("adherence") or "").strip().lower() == "followed":
            day_followed[dk] = day_followed.get(dk, 0) + 1
    adverse_days = 0
    for dk, n_fol in day_followed.items():
        if n_fol >= 1 and day_pnl.get(dk, 0.0) < 0:
            adverse_days += 1
    if adverse_days >= 1:
        items.append(
            {
                "observation": (
                    "Followed on a day when the book finished negative"
                    if adverse_days == 1
                    else (
                        f"Followed process on {adverse_days} days when the book "
                        "finished negative"
                    )
                ),
                "evidence": "adherence under adverse book day",
                "window_n": adverse_days,
            }
        )

    return items[:MAX_WHAT_WORKED]


def _strip_pre_market_prefix(body: str) -> str:
    """Return member text verbatim after optional type markers — no paraphrase."""
    s = body or ""
    lower = s.lstrip().lower()
    for prefix in (
        "pre_market:",
        "pre-market:",
        "[pre_market]",
        "# pre_market",
        "# premarket",
    ):
        if lower.startswith(prefix):
            # Preserve original after prefix length on stripped left
            lead = len(s) - len(s.lstrip())
            return s[lead + len(prefix) :].lstrip(" \t")
    return s


def _is_pre_market_note(surface: str, body: str) -> bool:
    surf = (surface or "").strip().lower()
    if surf == "pre_market":
        return True
    if surf != "journal":
        return False
    lower = (body or "").lstrip().lower()
    return (
        lower.startswith("pre_market:")
        or lower.startswith("pre-market:")
        or lower.startswith("[pre_market]")
        or lower.startswith("# pre_market")
        or lower.startswith("# premarket")
    )


def _expected_vs_actual(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    filtered_trades: list[dict],
) -> list[dict[str, Any]] | None:
    """Spec §6.5 — null when no pre_market notes in window."""
    op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT id, surface, body_md, created_at
           FROM member_tool_notes
           WHERE identity_id = %s
             AND created_at {op} %s AND created_at <= %s
           ORDER BY created_at ASC""",
        (identity_id, scope_start, scope_end),
    )
    notes = cur.fetchall()
    pre_rows = [
        r
        for r in notes
        if _is_pre_market_note(str(r.get("surface") or ""), str(r.get("body_md") or ""))
    ]
    if not pre_rows:
        return None

    trades_by_day: dict[str, list[dict]] = {}
    for t in filtered_trades:
        dk = _day_key(_parse_exec(t.get("exec_at")))
        if not dk:
            continue
        trades_by_day.setdefault(dk, []).append(t)

    out: list[dict[str, Any]] = []
    for r in pre_rows:
        created = r.get("created_at")
        if created is not None and not isinstance(created, datetime):
            continue
        day = _day_key(created if isinstance(created, datetime) else None)
        if not day:
            continue
        intent = _strip_pre_market_prefix(str(r.get("body_md") or ""))
        day_trades = trades_by_day.get(day) or []
        if day_trades:
            parts = []
            for t in day_trades:
                adh = (t.get("adherence") or "unknown").strip().lower()
                sym = t.get("strategy") or t.get("symbol") or "trade"
                parts.append(f"{sym} ({adh})")
            executed = f"{len(day_trades)} trade(s): " + "; ".join(parts[:12])
        else:
            executed = "No trades logged this day"
        out.append(
            {
                "day": day,
                "stated_intent": intent,  # verbatim after marker strip only
                "what_executed": executed,
                "gap": None,  # member-authored later
                "note_id": int(r["id"]) if r.get("id") else None,
            }
        )
    return out if out else None


def _num(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _window_days_from_report(report: dict) -> int:
    meta = report.get("meta") or {}
    wd = meta.get("window_days")
    if wd is not None:
        try:
            return max(1, int(wd))
        except (TypeError, ValueError):
            pass
    proc = report.get("process") or {}
    wd2 = proc.get("window_days")
    if wd2 is not None:
        try:
            return max(1, int(wd2))
        except (TypeError, ValueError):
            pass
    return 1


def _trade_count_from_report(report: dict) -> int:
    meta = report.get("meta") or {}
    if meta.get("trade_count") is not None:
        try:
            return int(meta["trade_count"])
        except (TypeError, ValueError):
            pass
    book = report.get("book_performance") or report.get("pnl") or {}
    try:
        return int(book.get("trade_count") or 0)
    except (TypeError, ValueError):
        return 0


def _weeks_label(window_days: int) -> str:
    """Human window label for Spec §7.3 headings."""
    weeks = max(1, round(window_days / 7))
    if weeks == 1:
        return "1 week"
    return f"{weeks} weeks"


def compare_metric(
    metric: str,
    *,
    current_value: float | None,
    current_window_days: int,
    current_n: int,
    previous_value: float | None,
    previous_window_days: int,
    previous_n: int,
    kind: str,
) -> dict[str, Any]:
    """Spec §7.2 — one normalized comparison row.

    kind:
      - activity: window_days floor ACTIVITY_MIN_WINDOW_DAYS
      - adherence: trade n floor MIN_INFERENCE_N
      - integrity: graded % (window ratio only)
      - book: trade n floor MIN_INFERENCE_N
    """
    comparable = True
    reason: str | None = None

    if kind == "activity":
        if (
            current_window_days < ACTIVITY_MIN_WINDOW_DAYS
            or previous_window_days < ACTIVITY_MIN_WINDOW_DAYS
        ):
            comparable = False
            reason = "window_days_below_14"
    elif kind in ("adherence", "book"):
        if current_n < MIN_INFERENCE_N or previous_n < MIN_INFERENCE_N:
            comparable = False
            reason = "sample_below_min_inference_n"

    shorter = min(current_window_days, previous_window_days)
    longer = max(current_window_days, previous_window_days)
    if shorter > 0 and (longer / shorter) >= WINDOW_LENGTH_RATIO_MAX:
        # ≥ 3× (includes 21d vs 63d) — Spec “more than 3×” applied as not comparable at 3×
        comparable = False
        reason = reason or "window_length_ratio_ge_3x"

    if current_value is None or previous_value is None:
        comparable = False
        reason = reason or "missing_value"

    return {
        "metric": metric,
        "current": {
            "value": current_value,
            "window_days": current_window_days,
            "n": current_n,
        },
        "previous": {
            "value": previous_value,
            "window_days": previous_window_days,
            "n": previous_n,
        },
        "comparable": comparable,
        "comparable_reason": reason,
    }


def _build_comparison_metrics(
    current_report: dict, prior_report: dict
) -> list[dict[str, Any]]:
    """Normalized rate rows from two report_json snapshots."""
    cur_wd = _window_days_from_report(current_report)
    pri_wd = _window_days_from_report(prior_report)
    cur_trades = _trade_count_from_report(current_report)
    pri_trades = _trade_count_from_report(prior_report)

    cur_p = current_report.get("process") or {}
    pri_p = prior_report.get("process") or {}
    cur_routine = cur_p.get("routine") or {}
    pri_routine = pri_p.get("routine") or {}
    cur_live = cur_p.get("live") or {}
    pri_live = pri_p.get("live") or {}
    cur_learn = cur_p.get("learning") or {}
    pri_learn = pri_p.get("learning") or {}
    cur_adh = cur_p.get("adherence") or {}
    pri_adh = pri_p.get("adherence") or {}

    cur_ir = current_report.get("integrity_review") or {}
    if not cur_ir.get("grade"):
        cur_ir = (cur_p.get("integrity") or {})
    pri_ir = prior_report.get("integrity_review") or {}
    if not pri_ir.get("grade"):
        pri_ir = (pri_p.get("integrity") or {})

    cur_book = current_report.get("book_performance") or current_report.get("pnl") or {}
    pri_book = prior_report.get("book_performance") or prior_report.get("pnl") or {}

    cur_net = _num(cur_book.get("net_pnl"))
    pri_net = _num(pri_book.get("net_pnl"))
    cur_per_trade = (
        round(cur_net / cur_trades, 4) if cur_net is not None and cur_trades > 0 else None
    )
    pri_per_trade = (
        round(pri_net / pri_trades, 4) if pri_net is not None and pri_trades > 0 else None
    )

    rows = [
        compare_metric(
            "routine_days_per_week",
            current_value=_num(cur_routine.get("activity_days_per_week")),
            current_window_days=cur_wd,
            current_n=int(cur_routine.get("activity_days") or 0),
            previous_value=_num(pri_routine.get("activity_days_per_week")),
            previous_window_days=pri_wd,
            previous_n=int(pri_routine.get("activity_days") or 0),
            kind="activity",
        ),
        compare_metric(
            "live_checkins_per_week",
            current_value=_num(cur_live.get("checkins_per_week")),
            current_window_days=cur_wd,
            current_n=int(cur_live.get("checkins") or 0),
            previous_value=_num(pri_live.get("checkins_per_week")),
            previous_window_days=pri_wd,
            previous_n=int(pri_live.get("checkins") or 0),
            kind="activity",
        ),
        compare_metric(
            "lesson_days_per_week",
            current_value=_num(cur_learn.get("lesson_days_per_week")),
            current_window_days=cur_wd,
            current_n=int(cur_learn.get("lesson_days") or cur_learn.get("lessons_completed") or 0),
            previous_value=_num(pri_learn.get("lesson_days_per_week")),
            previous_window_days=pri_wd,
            previous_n=int(
                pri_learn.get("lesson_days") or pri_learn.get("lessons_completed") or 0
            ),
            kind="activity",
        ),
        compare_metric(
            "adherence_followed_partial_rate",
            current_value=_num(cur_adh.get("followed_or_partial_rate")),
            current_window_days=cur_wd,
            current_n=int(cur_adh.get("total") or cur_trades),
            previous_value=_num(pri_adh.get("followed_or_partial_rate")),
            previous_window_days=pri_wd,
            previous_n=int(pri_adh.get("total") or pri_trades),
            kind="adherence",
        ),
        compare_metric(
            "integrity_overall_percent",
            current_value=_num(cur_ir.get("overall_percent")),
            current_window_days=cur_wd,
            current_n=cur_wd,
            previous_value=_num(pri_ir.get("overall_percent")),
            previous_window_days=pri_wd,
            previous_n=pri_wd,
            kind="integrity",
        ),
        compare_metric(
            "book_net_per_trade",
            current_value=cur_per_trade,
            current_window_days=cur_wd,
            current_n=cur_trades,
            previous_value=pri_per_trade,
            previous_window_days=pri_wd,
            previous_n=pri_trades,
            kind="book",
        ),
    ]
    return rows


def _comparison(
    cur, identity_id: int, current_report: dict, prior_id: int | None
) -> dict:
    """Spec §7 normalized comparison (RT3-1)."""
    if not prior_id:
        return {
            "has_prior": False,
            "version": REPORT_VERSION_TARGET,
            "label": "Maiden journey — this becomes your baseline",
            "metrics": [],
            "deltas": None,
        }
    cur.execute(
        """SELECT id, completed_at, report_json, title, scope_start, scope_end
           FROM member_retrospectives WHERE id = %s AND identity_id = %s""",
        (prior_id, identity_id),
    )
    prior = cur.fetchone()
    if not prior:
        return {
            "has_prior": False,
            "version": REPORT_VERSION_TARGET,
            "label": "No prior snapshot",
            "metrics": [],
            "deltas": None,
        }

    prior_report = prior.get("report_json")
    if isinstance(prior_report, str):
        try:
            prior_report = json.loads(prior_report)
        except json.JSONDecodeError:
            prior_report = {}
    prior_report = prior_report or {}

    cur_wd = _window_days_from_report(current_report)
    pri_wd = _window_days_from_report(prior_report)
    # If prior lacks meta (legacy), estimate from stored scope
    if pri_wd <= 1 and prior.get("scope_start") and prior.get("scope_end"):
        try:
            pri_wd = _window_days(prior["scope_start"], prior["scope_end"])
        except Exception:
            pass

    metrics = _build_comparison_metrics(current_report, prior_report)

    # Integrity direction only when integrity metric is comparable
    integrity_row = next(
        (m for m in metrics if m["metric"] == "integrity_overall_percent"),
        None,
    )
    direction = None
    integrity_delta = None
    if integrity_row and integrity_row.get("comparable"):
        cur_pct = integrity_row["current"]["value"]
        pri_pct = integrity_row["previous"]["value"]
        if cur_pct is not None and pri_pct is not None:
            integrity_delta = round(float(cur_pct) - float(pri_pct), 1)
            direction = "stable"
            if integrity_delta >= 5:
                direction = "improved"
            elif integrity_delta <= -5:
                direction = "slipped"

    cur_ir = current_report.get("integrity_review") or {}
    pri_ir = prior_report.get("integrity_review") or {}
    if not pri_ir.get("grade"):
        pri_ir = (prior_report.get("process") or {}).get("integrity") or {}

    label = (
        f"This window ({_weeks_label(cur_wd)}) vs previous "
        f"({_weeks_label(pri_wd)})"
    )

    return {
        "has_prior": True,
        "version": REPORT_VERSION_TARGET,
        "label": label,
        "current_window_days": cur_wd,
        "previous_window_days": pri_wd,
        "prior_id": int(prior["id"]),
        "prior_completed_at": _iso(prior.get("completed_at")),
        "prior_title": prior.get("title") or "",
        "metrics": metrics,
        # Compat / integrity summary (no delta language when not comparable)
        "prior_integrity_grade": pri_ir.get("grade"),
        "current_integrity_grade": cur_ir.get("grade"),
        "integrity_percent_delta": integrity_delta,
        "integrity_direction": direction,
        "note": (
            "Rates with denominators only. When not comparable, values are shown "
            "side by side without delta or trend language."
        ),
    }


def gather_report(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    prior_id: int | None,
    role: str,
    trades: list[dict],
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Build process-first report + comparison (Spec v0.5 / Architecture/12)."""
    scope_start = _as_naive_utc(scope_start)
    scope_end = _as_naive_utc(scope_end)
    window_days = _window_days(scope_start, scope_end)
    filtered = _filter_trades(
        trades, scope_start, scope_end, is_maiden=is_maiden
    )
    book = _book_performance(filtered)
    process = _process_performance(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        window_days=window_days,
    )
    # Direction filled after comparison for non-maiden; maiden null
    integrity = _integrity_review(cur, identity_id, role=role, direction=None)
    deviations = _deviations(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        filtered_trades=filtered,
    )
    what_worked = _what_worked(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        filtered_trades=filtered,
    )
    expected_vs_actual = _expected_vs_actual(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        filtered_trades=filtered,
    )

    report: dict[str, Any] = {
        "version": REPORT_VERSION_TARGET,
        "meta": {
            "is_maiden": is_maiden,
            "scope_start": _iso(scope_start),
            "scope_end": _iso(scope_end),
            "window_days": window_days,
            "trade_count": book["trade_count"],
            "min_inference_n": MIN_INFERENCE_N,
        },
        "carry_forward": build_carry_forward(
            cur, identity_id, is_maiden=is_maiden
        ),
        "process": process,
        "integrity_review": integrity,
        "deviations": deviations,
        "what_worked": what_worked,
        "expected_vs_actual": expected_vs_actual,
        "book_performance": book,
        # Compat aliases for v0.2 consumers / Charlie fallbacks
        "is_maiden": is_maiden,
        "scope_start": _iso(scope_start),
        "scope_end": _iso(scope_end),
        "pnl": book,
    }

    comparison = _comparison(cur, identity_id, report, prior_id)
    if comparison.get("has_prior") and comparison.get("integrity_direction"):
        report["integrity_review"]["direction"] = comparison["integrity_direction"]

    return report, comparison


def serialize_row(row: dict) -> dict[str, Any]:
    def _json_field(v):
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return v
        if isinstance(v, (bytes, bytearray)):
            v = v.decode("utf-8")
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v

    return {
        "id": int(row["id"]),
        "status": row["status"],
        "is_maiden": bool(row.get("is_maiden")),
        "scope_start": _iso(row.get("scope_start")),
        "scope_end": _iso(row.get("scope_end")),
        "title": row.get("title") or "",
        "body_md": row.get("body_md") or "",
        "report": _json_field(row.get("report_json")),
        "comparison": _json_field(row.get("comparison_json")),
        "agent": _json_field(row.get("agent_json")),
        "completed_at": _iso(row.get("completed_at")),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }
