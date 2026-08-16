"""Retrospective gather + dual report (Spec v0.5 R1b+).

Process-first; P&L is neutral book context. Isolation key: identity_id only.
Create entitlement: Spec §10.1 (plan-aware trial).

Report JSON contract (Charlie / Alpha): Architecture/12-retrospective-report-dto.md
  - As-built gather emits version \"0.2\" (pnl + process + integrity_review).
  - RT2-2 target version \"0.5\" (book_performance, deviations, what_worked, …).
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from typing import Any, Literal, NotRequired, TypedDict

import auth
import identity as identity_mod
import journal_session_domain as jsd
import journey_scores as js
from identity import ACTIVE_STATUSES, OBSERVER_TRIAL_SLUG
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl


VALID_STATUS = frozenset(
    {"draft", "gathering", "ready", "complete", "abandoned"}
)
OPEN_STATUSES = frozenset({"draft", "gathering", "ready"})

CREATE_DENY_DETAIL = (
    "Retrospectives require an active Observer trial or Navigator membership "
    "(or Activator legacy / administrator)"
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

# Coach 2026-08-13 — start readiness (gentle, overridable). Not Option C.
# Recommended when elapsed calendar days ≥ 7 OR trades in the next window ≥ 5.
START_READY_MIN_DAYS = 7
START_READY_MIN_TRADES = 5

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
    return identity_mod.has_active_plan_slug(cur, identity_id, slug)


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
    """Spec §10.1 / DL-128: Practice access = activator+ on the feature ladder.

    Active Observer membership elevates feature_role to navigator (same as
    Navigator for the term). Free no-plan remains denied.
    """
    return identity_mod.role_meets(cur, identity_id, role, "activator")


def next_period_index(cur, identity_id: int) -> int:
    """Ordinal complete+open count for baseline/trend floors (Spec v0.7.1)."""
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_retrospectives
           WHERE identity_id = %s AND status IN ('complete', 'draft', 'gathering', 'ready')""",
        (identity_id,),
    )
    return int(cur.fetchone()["n"] or 0) + 1


# Cadence setting bounds (trader-owned; forward-only when changed)
CADENCE_DAYS_MIN = 1
CADENCE_DAYS_MAX = 90
# Slack days beyond cadence before we call the span "interrupted" (§9)
INTERRUPTION_SLACK_DAYS = 2


def effective_cadence_days(cur, identity_id: int, claims: dict | None = None) -> int:
    """Trader setting if set; else meter-profile retro_horizon_days (default 7).

    Spec: cadence is the trader setting, not the meter profile — profile is
    fallback only when the trader has never set a preference.
    """
    try:
        cur.execute(
            "SELECT retro_cadence_days FROM identities WHERE identity_id = %s",
            (identity_id,),
        )
        row = cur.fetchone()
        if row and row.get("retro_cadence_days") is not None:
            d = int(row["retro_cadence_days"])
            if d > 0:
                return d
    except Exception:
        pass
    # Profile default — weekly for daily traders
    try:
        import journey_scores as js

        role = str((claims or {}).get("role") or "observer")
        profile = js.resolve_meter_profile(cur, identity_id, role)
        H = profile.get("retro_horizon_days")
        if H is not None and int(H) > 0:
            return int(H)
    except Exception:
        pass
    return 7


def set_retro_cadence_days(
    cur,
    identity_id: int,
    cadence_days: int,
    *,
    effective_from: Any = None,
) -> int:
    """Set trader cadence and append forward-only history (Spec v0.7.1 §12).

    Never rewrites ``cadence_days_at_period`` on past retrospectives.
    """
    from datetime import date as date_cls

    d = int(cadence_days)
    if d < CADENCE_DAYS_MIN or d > CADENCE_DAYS_MAX:
        raise ValueError(
            f"cadence_days must be {CADENCE_DAYS_MIN}–{CADENCE_DAYS_MAX}"
        )
    cur.execute(
        "UPDATE identities SET retro_cadence_days = %s WHERE identity_id = %s",
        (d, int(identity_id)),
    )
    if effective_from is None:
        eff = date_cls.today()
    elif isinstance(effective_from, date_cls):
        eff = effective_from
    elif isinstance(effective_from, datetime):
        eff = _as_naive_utc(effective_from).date()
    else:
        eff = date_cls.fromisoformat(str(effective_from)[:10])
    cur.execute(
        """INSERT INTO member_retro_cadence_history
             (identity_id, cadence_days, effective_from)
           VALUES (%s, %s, %s)""",
        (int(identity_id), d, eff),
    )
    return d


def period_was_interrupted(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    cadence_days: int,
) -> bool:
    """True when a prior period was missed — span >> one cadence (Spec §9).

    Maiden / first retrospective is never interrupted (long baseline is expected).
    Requires a prior complete retrospective.
    """
    prior = last_complete_retrospective(cur, identity_id)
    if prior is None:
        return False
    start = _as_naive_utc(scope_start)
    end = _as_naive_utc(scope_end)
    span = max(0, (end - start).days)
    cadence = max(1, int(cadence_days))
    return span > cadence + INTERRUPTION_SLACK_DAYS


def _format_day_month(dt: datetime | Any) -> str:
    """e.g. '14 July' — no leading zero on day."""
    if isinstance(dt, datetime):
        d = _as_naive_utc(dt)
    else:
        # date
        d = datetime(dt.year, dt.month, dt.day)
    months = (
        "January February March April May June July August "
        "September October November December"
    ).split()
    return f"{d.day} {months[d.month - 1]}"


def _format_scope_range(scope_start: datetime, scope_end: datetime) -> str:
    """e.g. '8–25 July' or '28 June – 12 July'."""
    a = _as_naive_utc(scope_start)
    b = _as_naive_utc(scope_end)
    months = (
        "January February March April May June July August "
        "September October November December"
    ).split()
    if a.year == b.year and a.month == b.month:
        return f"{a.day}–{b.day} {months[b.month - 1]}"
    if a.year == b.year:
        return (
            f"{a.day} {months[a.month - 1]} – "
            f"{b.day} {months[b.month - 1]}"
        )
    return (
        f"{a.day} {months[a.month - 1]} {a.year} – "
        f"{b.day} {months[b.month - 1]} {b.year}"
    )


def _span_instead_of_one(span_days: int, cadence_days: int) -> str:
    """'three weeks instead of one' / 'two periods instead of one'."""
    cadence = max(1, int(cadence_days))
    periods = max(2, int(round(span_days / float(cadence))))
    words = {
        2: "two",
        3: "three",
        4: "four",
        5: "five",
        6: "six",
        7: "seven",
        8: "eight",
    }
    n = words.get(periods, str(periods))
    unit = "week" if cadence == 7 else "period"
    plural = "s" if periods != 1 else ""
    return f"{n} {unit}{plural} instead of one"


def build_interruption_notice(
    *,
    interrupted: bool,
    scope_start: datetime | Any,
    scope_end: datetime | Any,
    cadence_days: int | None,
    is_maiden: bool = False,
    prior_completed_at: datetime | Any | None = None,
) -> dict[str, Any] | None:
    """Spec §9 — stated, not scolded. Names the actual span.

    Returns None when not interrupted (including maiden).
    """
    if not interrupted or is_maiden:
        return None
    start = _as_naive_utc(scope_start) if scope_start is not None else None
    end = _as_naive_utc(scope_end) if scope_end is not None else None
    if start is None or end is None:
        return None
    cadence = max(1, int(cadence_days or 7))
    span_days = max(0, (end - start).days)
    # Missed window starts at prior complete (= scope_start for non-maiden)
    missed_anchor = prior_completed_at or start
    if not isinstance(missed_anchor, datetime):
        try:
            missed_anchor = _as_naive_utc(missed_anchor)  # type: ignore[arg-type]
        except Exception:
            missed_anchor = start
    else:
        missed_anchor = _as_naive_utc(missed_anchor)

    scope_label = _format_scope_range(start, end)
    missed_label = f"the week of {_format_day_month(missed_anchor)}"
    if cadence != 7:
        missed_label = f"the period starting {_format_day_month(missed_anchor)}"
    instead = _span_instead_of_one(span_days, cadence)
    notice = (
        f"Your cadence was interrupted — no review completed for "
        f"{missed_label}. This one covers {scope_label}, {instead}."
    )
    return {
        "interrupted": True,
        "tone": "stated_not_scolded",
        "span_days": span_days,
        "expected_cadence_days": cadence,
        "scope_start": _iso(start),
        "scope_end": _iso(end),
        "scope_label": scope_label,
        "missed_label": missed_label,
        "instead_of_one": instead,
        "notice": notice,
        "note": (
            "Named so comparison across unequal windows is not silently wrong."
        ),
    }


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


def elapsed_calendar_days(scope_start: datetime, scope_end: datetime) -> int:
    """Whole calendar days from start date to end date (same day = 0)."""
    d0 = _as_naive_utc(scope_start).date()
    d1 = _as_naive_utc(scope_end).date()
    return max(0, (d1 - d0).days)


def count_trades_in_scope(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> int:
    """Identity-wide fills in the prospective window (same half-open as gather)."""
    start = _as_naive_utc(scope_start)
    end = _as_naive_utc(scope_end)
    op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT COUNT(*) AS n FROM member_trade_log_trades
            WHERE identity_id = %s
              AND exec_at {op} %s AND exec_at <= %s""",
        (int(identity_id), start, end),
    )
    row = cur.fetchone() or {}
    return int(row.get("n") or 0)


def start_readiness_notice(
    *,
    days: int,
    trades: int,
    min_days: int = START_READY_MIN_DAYS,
    min_trades: int = START_READY_MIN_TRADES,
    is_maiden: bool = False,
) -> str:
    """Tango — stated, not scolded. Override is always allowed."""
    day_word = "day" if days == 1 else "days"
    trade_word = "trade" if trades == 1 else "trades"
    min_day_word = "day" if min_days == 1 else "days"
    min_trade_word = "trade" if min_trades == 1 else "trades"
    if is_maiden:
        return (
            f"A recommended retrospective has at least {min_days} {min_day_word} "
            f"or {min_trades} {min_trade_word} of practice. This look-back has "
            f"{days} {day_word} and {trades} {trade_word}. You can start anyway "
            f"— a first review is still valid."
        )
    return (
        f"A recommended retrospective has at least {min_days} {min_day_word} "
        f"or {min_trades} {min_trade_word} since the last review. This window "
        f"has {days} {day_word} and {trades} {trade_word}. You can start anyway "
        f"if this is the look-back you want."
    )


def build_start_readiness(
    cur,
    identity_id: int,
    scope: dict[str, Any],
    *,
    now: datetime | None = None,
    min_days: int = START_READY_MIN_DAYS,
    min_trades: int = START_READY_MIN_TRADES,
) -> dict[str, Any]:
    """Gentle start floors — never a create gate (Coach 2026-08-13).

    Recommended when ``days >= min_days`` OR ``trades >= min_trades``.
    Create/gather stay allowed when recommended is false.
    """
    end = _as_naive_utc(now or scope.get("scope_end") or datetime.now(timezone.utc))
    start = scope["scope_start"]
    is_maiden = bool(scope.get("is_maiden"))
    days = elapsed_calendar_days(start, end)
    trades = count_trades_in_scope(
        cur,
        identity_id,
        start,
        end,
        is_maiden=is_maiden,
    )
    days_n = max(1, int(min_days))
    trades_n = max(1, int(min_trades))
    meets_days = days >= days_n
    meets_trades = trades >= trades_n
    recommended = meets_days or meets_trades
    return {
        "recommended": recommended,
        "overridable": True,
        "days": days,
        "trades": trades,
        "min_days": days_n,
        "min_trades": trades_n,
        "meets_days": meets_days,
        "meets_trades": meets_trades,
        "notice": (
            None
            if recommended
            else start_readiness_notice(
                days=days,
                trades=trades,
                min_days=days_n,
                min_trades=trades_n,
                is_maiden=is_maiden,
            )
        ),
    }


def _report_trade_count(report: Any) -> int | None:
    if not isinstance(report, dict):
        return None
    meta = report.get("meta") if isinstance(report.get("meta"), dict) else {}
    book = report.get("book_performance") if isinstance(
        report.get("book_performance"), dict
    ) else {}
    for src in (meta, book, report):
        if not isinstance(src, dict):
            continue
        raw = src.get("trade_count")
        if raw is None:
            continue
        try:
            return max(0, int(raw))
        except (TypeError, ValueError):
            continue
    return None


def _parse_report_json(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _fmt_avg_number(value: float | int) -> str:
    n = float(value)
    if abs(n - round(n)) < 1e-9:
        return str(int(round(n)))
    return f"{n:.1f}"


def cadence_history_summary(
    *,
    period_count: int,
    avg_days: float | int | None,
    avg_trades: float | int | None,
    maiden_days: int | None = None,
    maiden_trades: int | None = None,
) -> str | None:
    """Tango — fact only. Never 'behind your usual' / due-date language."""
    if period_count >= 2 and avg_days is not None and avg_trades is not None:
        return (
            f"Your past reviews averaged {_fmt_avg_number(avg_days)} days and "
            f"{_fmt_avg_number(avg_trades)} trades ({period_count} reviews)."
        )
    if period_count == 1 and avg_days is not None and avg_trades is not None:
        day_word = "day" if float(avg_days) == 1 else "days"
        trade_word = "trade" if float(avg_trades) == 1 else "trades"
        return (
            f"Your last review was {_fmt_avg_number(avg_days)} {day_word} and "
            f"{_fmt_avg_number(avg_trades)} {trade_word}."
        )
    if maiden_days is not None and maiden_trades is not None:
        day_word = "day" if maiden_days == 1 else "days"
        trade_word = "trade" if maiden_trades == 1 else "trades"
        return (
            f"Your first review covered {maiden_days} {day_word} and "
            f"{maiden_trades} {trade_word}. An average starts after the next "
            f"completed review."
        )
    return None


def build_cadence_history(cur, identity_id: int) -> dict[str, Any]:
    """Derived historical cadence — completed retros only. No second store.

    Maiden is reported separately: a long first look-back is not a cadence cycle.
    """
    cur.execute(
        """SELECT id, is_maiden, scope_start, scope_end, report_json
           FROM member_retrospectives
           WHERE identity_id = %s
             AND status = 'complete'
             AND completed_at IS NOT NULL
           ORDER BY completed_at ASC, id ASC""",
        (int(identity_id),),
    )
    rows = cur.fetchall() or []

    cadence_days: list[int] = []
    cadence_trades: list[int] = []
    maiden_days: int | None = None
    maiden_trades: int | None = None

    for row in rows:
        start = row.get("scope_start")
        end = row.get("scope_end")
        if start is None or end is None:
            continue
        days = elapsed_calendar_days(start, end)
        report = _parse_report_json(row.get("report_json"))
        trades = _report_trade_count(report)
        if trades is None:
            trades = count_trades_in_scope(
                cur,
                identity_id,
                start,
                end,
                is_maiden=bool(row.get("is_maiden")),
            )
        if bool(row.get("is_maiden")):
            maiden_days = days
            maiden_trades = trades
            continue
        cadence_days.append(days)
        cadence_trades.append(trades)

    n = len(cadence_days)
    avg_days: float | int | None = None
    avg_trades: float | int | None = None
    if n:
        d_mean = sum(cadence_days) / n
        t_mean = sum(cadence_trades) / n
        avg_days = int(round(d_mean)) if abs(d_mean - round(d_mean)) < 1e-9 else round(d_mean, 1)
        avg_trades = (
            int(round(t_mean)) if abs(t_mean - round(t_mean)) < 1e-9 else round(t_mean, 1)
        )

    last_days = cadence_days[-1] if cadence_days else None
    last_trades = cadence_trades[-1] if cadence_trades else None
    summary = cadence_history_summary(
        period_count=n,
        avg_days=avg_days,
        avg_trades=avg_trades,
        maiden_days=maiden_days,
        maiden_trades=maiden_trades,
    )
    return {
        "period_count": n,
        "avg_days": avg_days,
        "avg_trades": avg_trades,
        "last_days": last_days,
        "last_trades": last_trades,
        "maiden_days": maiden_days,
        "maiden_trades": maiden_trades,
        "summary": summary,
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
    # Dual-read §2.1 — count sealed/partial/open sessions in window too
    cur.execute(
        f"""SELECT COUNT(*) AS n FROM member_journal_sessions
           WHERE identity_id = %s
             AND status IN ('open', 'partial', 'sealed')
             AND session_started_at {op} %s AND session_started_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    journal_notes += int(cur.fetchone()["n"] or 0)

    cur.execute(
        f"""SELECT DISTINCT DATE(created_at) AS d FROM member_tool_notes
           WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    journal_day_set: set = set()
    from datetime import date as date_cls

    for row in cur.fetchall():
        d = row["d"]
        if d is not None:
            journal_day_set.add(d if isinstance(d, date_cls) else d)
    journal_day_set |= jsd.list_session_activity_ny_dates(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )
    journal_days = len(journal_day_set)

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
    # Dual-read: trades ∪ note days ∪ session_started_at NY days (Spec §2.1)
    cur.execute(
        f"""SELECT DATE(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at {op} %s AND exec_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    activity_set: set = set()
    for row in cur.fetchall():
        if row["d"] is not None:
            activity_set.add(row["d"])
    cur.execute(
        f"""SELECT DATE(created_at) AS d FROM member_tool_notes
           WHERE identity_id = %s AND created_at {op} %s AND created_at <= %s""",
        (identity_id, scope_start, scope_end),
    )
    for row in cur.fetchall():
        if row["d"] is not None:
            activity_set.add(row["d"])
    activity_set |= jsd.list_session_activity_ny_dates(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )
    activity_days = len(activity_set)

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
    """Legacy rolling Journey snapshot — retained for comparison metrics.

    Ceremony UI must use ``period_indicator`` (Spec v0.7.1 §7), not this
    rolling grade, so period and rolling never share one frame.
    """
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
        "context": "rolling",  # Journey health — not for ceremony co-display
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
            "Rolling Journey snapshot for comparison only — ceremony uses "
            "period_indicator (Spec v0.7.1 §7)."
        ),
    }


def build_period_indicator(
    process: dict[str, Any] | None,
    book: dict[str, Any] | None,
    *,
    window_days: int,
    direction: str | None = None,
) -> dict[str, Any]:
    """Spec v0.7.1 §7 — period-scoped indicator for the ceremony only.

    One instrument, two contexts, never one frame: this object is **period**
    only. Rolling Journey meters must not appear here.
    """
    process = process or {}
    book = book or {}
    trade_count = int(book.get("trade_count") or 0)
    min_n = int(MIN_INFERENCE_N)
    routine = process.get("routine") or {}
    live = process.get("live") or {}
    learning = process.get("learning") or {}
    adherence = process.get("adherence") or {}

    readings: list[dict[str, Any]] = [
        {
            "id": "routine",
            "label": "Routine (activity days / week)",
            "value": routine.get("activity_days_per_week"),
            "unit": "days_per_week",
        },
        {
            "id": "adherence",
            "label": "Adherence (followed + partial)",
            "value": adherence.get("followed_or_partial_rate"),
            "unit": "rate",
        },
        {
            "id": "live",
            "label": "Live check-ins / week",
            "value": live.get("checkins_per_week"),
            "unit": "per_week",
        },
        {
            "id": "learning",
            "label": "Lesson days / week",
            "value": learning.get("lesson_days_per_week"),
            "unit": "per_week",
        },
    ]

    if trade_count < min_n:
        return {
            "context": "period",
            "status": "not_enough_yet",
            "headline": "Not enough yet",
            "summary": (
                f"This period has {trade_count} trade"
                f"{'' if trade_count == 1 else 's'} — below the floor "
                f"({min_n}) for grading. The ceremony still holds; "
                "statistics wait."
            ),
            "pattern": None,
            "readings": readings,
            "window_days": window_days,
            "trade_count": trade_count,
            "min_inference_n": min_n,
            # Explicit: no rolling payload co-located
            "rolling": None,
        }

    # Pattern language — conduct, never character (Tango)
    if direction in (None, "stable", ""):
        status = "steady"
        pattern = "Nothing moved much this period — steady is a valid reading."
        headline = "Steady"
    elif direction == "improved":
        status = "pattern"
        pattern = (
            "Several practice readings are up from a comparable prior period."
        )
        headline = "Practice readings moved up"
    elif direction == "slipped":
        status = "pattern"
        pattern = (
            "Several practice readings are down from a comparable prior period "
            "— look at the inventory below, not at yourself."
        )
        headline = "Practice readings moved down"
    else:
        status = "pattern"
        pattern = f"Practice direction vs prior: {direction}."
        headline = "Practice readings"

    return {
        "context": "period",
        "status": status,
        "headline": headline,
        "summary": pattern,
        "pattern": pattern,
        "readings": readings,
        "window_days": window_days,
        "trade_count": trade_count,
        "min_inference_n": min_n,
        "direction": direction,
        "rolling": None,
    }


# Spec v0.7.1 §8.1a — lexicon category → ceremony step (Hotel · Tango)
# Tag frequency never feeds meters/grades/indicator (§8.1b).
LEXICON_CEREMONY_MAP: list[dict[str, Any]] = [
    {
        "system_key": "behavior",
        "label": "Behavior",
        "ceremony_steps": [3],
        "role": "obstacles_mirror",
        "note": "Emotional-behavioral vocabulary the trader applied.",
    },
    {
        "system_key": "context",
        "label": "Context",
        "ceremony_steps": [4],
        "role": "clustering_conditions",
        "note": "External conditions the trader marked (no regime inference).",
    },
    {
        "system_key": "process",
        "label": "Process",
        "ceremony_steps": [2, 8],
        "role": "adherence_and_commit",
        "note": "Process labels for adherence review and forward commit.",
    },
    {
        "system_key": "insight",
        "label": "Insight",
        "ceremony_steps": [6],
        "role": "what_worked_candidates",
        "note": "Lessons and biases the trader named — candidates for step 6.",
    },
]

EMOTION_MIRROR_EMPTY = (
    "Nothing from Behavior tags or your journal words this period. "
    "Your language shows up here when you use it."
)

# Banned diagnosis fragments for mirror strings (Tango / §16)
_DIAGNOSIS_BAN = (
    "you were ",
    "you felt ",
    "you seemed ",
    "you are ",
    "you always ",
    "diagnos",
    "impatient this",
    "anxious this",
    "emotional state",
)

MAX_EMOTION_TAG_ITEMS = 12
MAX_JOURNAL_WORD_EXCERPTS = 5
MAX_JOURNAL_EXCERPT_CHARS = 160

# Spec v0.7.1 §12 — trends need a floor (4–6 cycles); assert none below
TREND_MIN_CYCLES = 4
MAX_CLUSTER_STATEMENTS = 5
MAX_CORRELATION_STATEMENTS = 4
# Banned P&L / performance correlation surface language (Hotel · Sierra)
CORRELATION_BANNED_METRICS = frozenset(
    {"pnl", "p&l", "expectancy", "win_rate", "win rate", "profit", "net_pnl"}
)


def lexicon_ceremony_map() -> list[dict[str, Any]]:
    """Static Spec §8.1a map — pure data, no DB."""
    return [dict(row) for row in LEXICON_CEREMONY_MAP]


def _day_str(v: Any) -> str | None:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        try:
            return v.isoformat()[:10]
        except Exception:
            pass
    s = str(v).strip()
    return s[:10] if s else None


def _count_phrase(n: int) -> str:
    if n == 1:
        return "once"
    if n == 2:
        return "twice"
    return f"{n} times"


def _mirror_behavior_line(
    label: str, count: int, days: list[str]
) -> str:
    """Trader-language mirror only — never a character diagnosis (§8.1)."""
    lab = (label or "").strip() or "that tag"
    base = f'You named "{lab}" {_count_phrase(count)} this period'
    # Day clustering when we have concrete days the trader tagged
    uniq = sorted({d for d in days if d})
    if not uniq:
        return base + "."
    if len(uniq) == 1:
        return f"{base} — on {uniq[0]}."
    if len(uniq) == 2:
        return f"{base} — on {uniq[0]} and {uniq[1]}."
    # Cap listed days; remainder as count
    head = uniq[:3]
    rest = len(uniq) - 3
    listed = ", ".join(head)
    if rest > 0:
        return f"{base} — days include {listed} (+{rest} more)."
    return f"{base} — days include {listed}."


def _assert_mirror_not_diagnosis(text: str) -> None:
    low = (text or "").lower()
    for ban in _DIAGNOSIS_BAN:
        if ban in low:
            raise ValueError(
                f"emotion mirror diagnosis leak ({ban!r}): {text!r}"
            )


def _collect_period_tag_rows(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> list[dict[str, Any]]:
    """Tag assignments on journal sessions + trades inside the period window."""
    scope_start = _as_naive_utc(scope_start)
    scope_end = _as_naive_utc(scope_end)
    d0 = scope_start.date()
    d1 = scope_end.date()
    op = ">=" if is_maiden else ">"
    rows: list[dict[str, Any]] = []

    # Journal sessions by journal_date (NY trading day for the conversation)
    date_op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT a.tag_id, a.object_type, a.object_id, a.created_at,
                  t.slug, t.label, t.category_id,
                  c.system_key AS category_key, c.label AS category_label,
                  s.journal_date AS day
           FROM tag_assignments a
           JOIN tags t ON t.id = a.tag_id
           LEFT JOIN tag_categories c ON c.id = t.category_id
           JOIN member_journal_sessions s
             ON s.id = a.object_id AND a.object_type = 'journal_session'
           WHERE a.identity_id = %s
             AND s.identity_id = %s
             AND s.journal_date {date_op} %s
             AND s.journal_date <= %s""",
        (int(identity_id), int(identity_id), d0, d1),
    )
    for r in cur.fetchall() or []:
        rows.append(dict(r))

    # Trades by exec_at
    cur.execute(
        f"""SELECT a.tag_id, a.object_type, a.object_id, a.created_at,
                  t.slug, t.label, t.category_id,
                  c.system_key AS category_key, c.label AS category_label,
                  DATE(tr.exec_at) AS day
           FROM tag_assignments a
           JOIN tags t ON t.id = a.tag_id
           LEFT JOIN tag_categories c ON c.id = t.category_id
           JOIN member_trade_log_trades tr
             ON tr.id = a.object_id AND a.object_type = 'trade'
           WHERE a.identity_id = %s
             AND tr.identity_id = %s
             AND tr.exec_at {op} %s
             AND tr.exec_at <= %s""",
        (int(identity_id), int(identity_id), scope_start, scope_end),
    )
    for r in cur.fetchall() or []:
        rows.append(dict(r))

    return rows


def _member_journal_excerpts(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> list[dict[str, Any]]:
    """Member-authored journal text only — no agent turns (§8.1)."""
    scope_start = _as_naive_utc(scope_start)
    scope_end = _as_naive_utc(scope_end)
    d0 = scope_start.date()
    d1 = scope_end.date()
    date_op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT m.id AS message_id, m.body_md, m.created_at,
                  s.id AS session_id, s.journal_date
           FROM member_journal_messages m
           JOIN member_journal_sessions s ON s.id = m.session_id
           WHERE m.identity_id = %s
             AND s.identity_id = %s
             AND m.author = 'member'
             AND s.journal_date {date_op} %s
             AND s.journal_date <= %s
           ORDER BY m.created_at DESC, m.id DESC
           LIMIT 40""",
        (int(identity_id), int(identity_id), d0, d1),
    )
    out: list[dict[str, Any]] = []
    for r in cur.fetchall() or []:
        body = str(r.get("body_md") or "").strip()
        if not body:
            continue
        # Collapse whitespace; keep the trader's wording
        body = " ".join(body.split())
        if len(body) < 8:
            continue
        excerpt = body
        if len(excerpt) > MAX_JOURNAL_EXCERPT_CHARS:
            excerpt = excerpt[: MAX_JOURNAL_EXCERPT_CHARS - 1].rstrip() + "…"
        day = _day_str(r.get("journal_date"))
        item = {
            "day": day,
            "excerpt": excerpt,
            "session_id": int(r["session_id"]),
            "message_id": int(r["message_id"]),
            "source": "member_message",
            "mirror": (
                f'From your journal on {day}: "{excerpt}"'
                if day
                else f'From your journal: "{excerpt}"'
            ),
        }
        _assert_mirror_not_diagnosis(item["mirror"])
        out.append(item)
        if len(out) >= MAX_JOURNAL_WORD_EXCERPTS:
            break
    return out


def build_emotion_mirror(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> dict[str, Any]:
    """Spec v0.7.1 §8.1 — Behavior tags + member journal words only.

    Mirror language names what the trader applied/wrote. Never diagnoses
    character or emotional state. Tag counts never feed indicator/meters.
    """
    tag_rows = _collect_period_tag_rows(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )

    # Aggregate by category + tag
    by_cat: dict[str, dict[int, dict[str, Any]]] = {}
    for r in tag_rows:
        key = (r.get("category_key") or "").strip().lower() or "uncategorized"
        tid = int(r["tag_id"])
        bucket = by_cat.setdefault(key, {})
        if tid not in bucket:
            bucket[tid] = {
                "tag_id": tid,
                "slug": r.get("slug"),
                "label": r.get("label") or r.get("slug") or "tag",
                "category_key": key,
                "category_label": r.get("category_label"),
                "count": 0,
                "days": [],
                "object_types": set(),
                "most_recent_at": None,
            }
        item = bucket[tid]
        item["count"] += 1
        day = _day_str(r.get("day"))
        if day and day not in item["days"]:
            item["days"].append(day)
        ot = r.get("object_type")
        if ot:
            item["object_types"].add(ot)
        ca = r.get("created_at")
        ca_iso = _iso(ca) if ca is not None else None
        if ca_iso and (
            item["most_recent_at"] is None or ca_iso > item["most_recent_at"]
        ):
            item["most_recent_at"] = ca_iso

    def _sorted_items(cat_key: str) -> list[dict[str, Any]]:
        items = list(by_cat.get(cat_key, {}).values())
        items.sort(
            key=lambda it: (
                -int(it["count"]),
                it.get("most_recent_at") or "",
                str(it.get("label") or ""),
            )
        )
        out: list[dict[str, Any]] = []
        for it in items[:MAX_EMOTION_TAG_ITEMS]:
            days = sorted(it["days"])
            label = str(it["label"])
            mirror = _mirror_behavior_line(label, int(it["count"]), days)
            _assert_mirror_not_diagnosis(mirror)
            out.append(
                {
                    "tag_id": it["tag_id"],
                    "slug": it["slug"],
                    "label": label,
                    "category_key": it["category_key"],
                    "category_label": it["category_label"],
                    "count": int(it["count"]),
                    "days": days,
                    "object_types": sorted(it["object_types"]),
                    "most_recent_at": it["most_recent_at"],
                    "mirror": mirror,
                    "source": "tag",
                }
            )
        return out

    behavior = _sorted_items("behavior")
    context = _sorted_items("context")
    process = _sorted_items("process")
    insight = _sorted_items("insight")

    journal_words = _member_journal_excerpts(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )

    statements: list[str] = [b["mirror"] for b in behavior]
    for j in journal_words:
        statements.append(j["mirror"])

    return {
        "source_policy": "trader_tags_and_member_words_only",
        "prohibits": "system_emotional_diagnosis",
        "feeds_indicator": False,  # §8.1b — explicit contract
        "behavior_tags": behavior,
        "context_tags": context,
        "process_tags": process,
        "insight_tags": insight,
        "journal_words": journal_words,
        "statements": statements,
        "empty_message": EMOTION_MIRROR_EMPTY,
        "has_content": bool(behavior or journal_words),
    }


def _trade_day_sets(
    filtered_trades: list[dict],
) -> tuple[set[str], set[str], dict[str, int]]:
    """Return (all_trade_days, broke_days, broke_count_by_day) as ISO date strings."""
    all_days: set[str] = set()
    broke_days: set[str] = set()
    broke_by_day: dict[str, int] = {}
    for t in filtered_trades:
        ex = _parse_exec(t.get("exec_at"))
        day = _day_key(ex)
        if not day:
            continue
        all_days.add(day)
        adh = (t.get("adherence") or "").strip().lower()
        if adh == "broke":
            broke_days.add(day)
            broke_by_day[day] = broke_by_day.get(day, 0) + 1
    return all_days, broke_days, broke_by_day


def _tag_days_by_category(
    emotion_mirror: dict[str, Any] | None, category_key: str
) -> dict[str, list[str]]:
    """label → list of days from emotion_mirror category buckets."""
    em = emotion_mirror or {}
    key = {
        "behavior": "behavior_tags",
        "context": "context_tags",
        "process": "process_tags",
        "insight": "insight_tags",
    }.get(category_key, "behavior_tags")
    out: dict[str, list[str]] = {}
    for item in em.get(key) or []:
        label = str(item.get("label") or item.get("slug") or "tag")
        days = [str(d) for d in (item.get("days") or []) if d]
        if days:
            out[label] = days
    return out


def build_clustering(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
    filtered_trades: list[dict],
    emotion_mirror: dict[str, Any] | None,
) -> dict[str, Any]:
    """Spec v0.7.1 §8.2 — co-occurrence as observation only; trader names cause.

    Never invents market regime. Context tags are the external conditions.
    """
    trade_days, broke_days, _broke_by = _trade_day_sets(filtered_trades)
    statements: list[dict[str, Any]] = []

    # Routine days (member message NY local — §12.2), period-scoped
    routine_raw = jsd.list_member_message_ny_dates(
        cur,
        identity_id,
        since=_as_naive_utc(scope_start),
        until=_as_naive_utc(scope_end),
    )
    # Normalize to ISO date strings
    routine_days: set[str] = set()
    for d in routine_raw or []:
        ds = _day_str(d)
        if ds:
            routine_days.add(ds)

    # --- Context tags ∩ broke days ---
    for label, days in _tag_days_by_category(emotion_mirror, "context").items():
        shared = sorted(set(days) & broke_days)
        if not shared:
            continue
        if len(shared) == 1:
            obs = (
                f'Your rule-break trades clustered on the day you marked '
                f'"{label}" ({shared[0]}).'
            )
        else:
            listed = ", ".join(shared[:4])
            more = len(shared) - 4
            tail = f" (+{more} more)" if more > 0 else ""
            obs = (
                f'Your rule-break trades clustered on days you marked '
                f'"{label}": {listed}{tail}.'
            )
        statements.append(
            {
                "kind": "context_tag_x_deviation",
                "observation": obs,
                "days": shared,
                "tag_label": label,
                "source": "trader_tags",
            }
        )

    # --- Behavior tags ∩ broke days ---
    for label, days in _tag_days_by_category(emotion_mirror, "behavior").items():
        shared = sorted(set(days) & broke_days)
        if len(shared) < 1:
            continue
        if len(shared) == 1:
            obs = (
                f'You applied "{label}" on a day that also had a rule-break trade '
                f"({shared[0]})."
            )
        else:
            listed = ", ".join(shared[:4])
            obs = (
                f'You applied "{label}" on {len(shared)} days that also had '
                f"rule-break trades: {listed}."
            )
        statements.append(
            {
                "kind": "behavior_tag_x_deviation",
                "observation": obs,
                "days": shared,
                "tag_label": label,
                "source": "trader_tags",
            }
        )

    # --- Deviations on days without routine (skipped morning / no journal msg) ---
    if broke_days and trade_days:
        no_routine_broke = sorted(broke_days - routine_days)
        with_routine_broke = sorted(broke_days & routine_days)
        if len(no_routine_broke) >= 1 and len(no_routine_broke) >= len(
            with_routine_broke
        ):
            if len(no_routine_broke) == 1:
                obs = (
                    "Rule-break trades clustered on a day without a member "
                    f"journal message ({no_routine_broke[0]})."
                )
            else:
                listed = ", ".join(no_routine_broke[:3])
                more = len(no_routine_broke) - 3
                tail = f" (+{more} more)" if more > 0 else ""
                obs = (
                    f"Rule-break trades clustered on {len(no_routine_broke)} "
                    f"days without a member journal message: {listed}{tail}."
                )
            statements.append(
                {
                    "kind": "no_routine_x_deviation",
                    "observation": obs,
                    "days": no_routine_broke,
                    "source": "routine_day_x_adherence",
                }
            )

    # Cap and rank: more days first
    statements.sort(key=lambda s: (-len(s.get("days") or []), s.get("kind") or ""))
    statements = statements[:MAX_CLUSTER_STATEMENTS]

    return {
        "statements": statements,
        "broke_days": sorted(broke_days),
        "routine_days_in_window": sorted(routine_days),
        "trade_days": sorted(trade_days),
        "empty_message": (
            "No co-occurrence stood out this period — inventory only."
        ),
        "note": (
            "Observations stop at co-occurrence. You name the cause (step 5)."
        ),
        "has_content": bool(statements),
    }


def _extract_rate_snapshot(report: dict[str, Any] | None) -> dict[str, Any]:
    """Rate-normalized snapshot from a stored or current report (counts → rates)."""
    rep = report or {}
    meta = rep.get("meta") or {}
    process = rep.get("process") or {}
    book = rep.get("book_performance") or rep.get("pnl") or {}
    adh = process.get("adherence") or {}
    routine = process.get("routine") or {}
    trade_count = int(
        book.get("trade_count")
        or meta.get("trade_count")
        or adh.get("total")
        or 0
    )
    broke = int(adh.get("broke") or 0)
    window_days = int(meta.get("window_days") or process.get("window_days") or 0)
    avoidable = (
        round(broke / trade_count, 4) if trade_count > 0 else None
    )
    # Tag frequency as counts (reported, never scored) — rate per trade when possible
    em = rep.get("emotion_mirror") or {}
    tag_rates: list[dict[str, Any]] = []
    for t in (em.get("behavior_tags") or [])[:5]:
        c = int(t.get("count") or 0)
        tag_rates.append(
            {
                "slug": t.get("slug"),
                "label": t.get("label"),
                "count": c,
                "per_trade": (
                    round(c / trade_count, 4) if trade_count > 0 else None
                ),
            }
        )
    return {
        "trade_count": trade_count,
        "window_days": window_days,
        "avoidable_loss_rate": avoidable,  # broke / trades — process damage, not $
        "broke_count": broke,
        "followed_or_partial_rate": adh.get("followed_or_partial_rate"),
        "routine_days_per_week": routine.get("activity_days_per_week"),
        "behavior_tag_rates": tag_rates,
    }


def _list_completed_report_snapshots(
    cur, identity_id: int
) -> list[dict[str, Any]]:
    """Prior complete retrospectives for trend series (oldest first)."""
    cur.execute(
        """SELECT id, period_index, report_json, scope_start, scope_end,
                  completed_at, title
           FROM member_retrospectives
           WHERE identity_id = %s AND status = 'complete'
           ORDER BY completed_at ASC, id ASC""",
        (int(identity_id),),
    )
    out: list[dict[str, Any]] = []
    for row in cur.fetchall() or []:
        rep = row.get("report_json")
        if isinstance(rep, (bytes, bytearray)):
            rep = rep.decode("utf-8")
        if isinstance(rep, str):
            try:
                rep = json.loads(rep)
            except json.JSONDecodeError:
                rep = {}
        rep = rep or {}
        snap = _extract_rate_snapshot(rep)
        pidx = row.get("period_index")
        out.append(
            {
                "retrospective_id": int(row["id"]),
                "period_index": int(pidx) if pidx is not None else len(out) + 1,
                "completed_at": _iso(row.get("completed_at")),
                "title": row.get("title") or "",
                **snap,
            }
        )
    return out


def _series_direction(values: list[float | None]) -> str | None:
    """Simple last-vs-first direction when enough non-null points exist."""
    nums = [float(v) for v in values if v is not None]
    if len(nums) < TREND_MIN_CYCLES:
        return None
    first = nums[0]
    last = nums[-1]
    # Relative band: 10% of range or absolute 0.02 for rates
    span = max(abs(last - first), 1e-9)
    delta = last - first
    if abs(delta) < max(0.02, 0.05 * (max(nums) - min(nums) + 1e-9)):
        return "flat"
    return "up" if delta > 0 else "down"


def build_period_trends(
    cur,
    identity_id: int,
    current_report: dict[str, Any],
    *,
    period_index: int | None,
) -> dict[str, Any]:
    """Spec v0.7.1 §12 — rate-normalized trends; no assert below cycle floor."""
    prior = _list_completed_report_snapshots(cur, identity_id)
    current_snap = _extract_rate_snapshot(current_report)
    current_point = {
        "retrospective_id": None,
        "period_index": int(period_index) if period_index is not None else (len(prior) + 1),
        "completed_at": None,
        "title": "This period",
        "is_current": True,
        **current_snap,
    }
    points = prior + [current_point]
    cycle_count = len(points)
    floor = TREND_MIN_CYCLES
    readable = cycle_count >= floor

    def _metric_series(
        mid: str, label: str, unit: str, getter
    ) -> dict[str, Any]:
        series_pts = []
        vals: list[float | None] = []
        for p in points:
            v = getter(p)
            vals.append(v)
            series_pts.append(
                {
                    "period_index": p.get("period_index"),
                    "value": v,
                    "window_days": p.get("window_days"),
                    "trade_count": p.get("trade_count"),
                    "is_current": bool(p.get("is_current")),
                }
            )
        direction = _series_direction(vals) if readable else None
        return {
            "id": mid,
            "label": label,
            "unit": unit,
            "points": series_pts,
            "direction": direction,
            "trend_asserted": bool(readable and direction is not None),
        }

    series = [
        _metric_series(
            "avoidable_loss_rate",
            "Avoidable-loss rate (rule-breaks per trade)",
            "rate",
            lambda p: p.get("avoidable_loss_rate"),
        ),
        _metric_series(
            "followed_or_partial_rate",
            "Followed + partial rate",
            "rate",
            lambda p: p.get("followed_or_partial_rate"),
        ),
        _metric_series(
            "routine_days_per_week",
            "Routine activity days / week",
            "days_per_week",
            lambda p: p.get("routine_days_per_week"),
        ),
    ]

    # Tag frequency over periods (trader's language; reported, never scored)
    tag_labels: dict[str, str] = {}
    for p in points:
        for t in p.get("behavior_tag_rates") or []:
            slug = str(t.get("slug") or "")
            if slug:
                tag_labels[slug] = str(t.get("label") or slug)
    tag_trends = []
    for slug, label in list(tag_labels.items())[:6]:
        def _getter(p, s=slug):
            for t in p.get("behavior_tag_rates") or []:
                if t.get("slug") == s:
                    # Prefer rate when trade_count allows
                    if t.get("per_trade") is not None:
                        return t.get("per_trade")
                    return float(t.get("count") or 0)
            return 0.0 if p.get("trade_count") else None

        tag_trends.append(
            _metric_series(
                f"tag:{slug}",
                f'Tag frequency — "{label}" (per trade)',
                "per_trade",
                _getter,
            )
        )

    if not readable:
        status = "building_baseline"
        message = (
            f"Building your baseline — {cycle_count} cycle"
            f"{'' if cycle_count == 1 else 's'} so far "
            f"(trend floor is {floor}). Rates are shown without a direction."
        )
    else:
        status = "trend_readable"
        message = (
            f"Rate-normalized across {cycle_count} cycles "
            f"(floor {floor}). Counts are never compared raw across unequal windows."
        )

    return {
        "status": status,
        "cycle_count": cycle_count,
        "min_cycles": floor,
        "message": message,
        "series": series,
        "tag_frequency_series": tag_trends,
        "feeds_indicator": False,
        "note": (
            "Trends use rates only. Tag frequency is reported, never scored (§8.1b)."
        ),
    }


def build_correlation(
    filtered_trades: list[dict],
    *,
    emotion_mirror: dict[str, Any] | None,
    clustering: dict[str, Any] | None,
) -> dict[str, Any]:
    """Spec v0.7.1 §13 — behavior ↔ process / avoidable damage. Never P&L.

    Within-book comparison of rule-following vs rule-breaking process outcomes.
    No win rate, expectancy, or dollar P&L correlation surfaces.
    """
    statements: list[dict[str, Any]] = []
    total = len(filtered_trades)
    broke = [
        t
        for t in filtered_trades
        if (t.get("adherence") or "").strip().lower() == "broke"
    ]
    followed = [
        t
        for t in filtered_trades
        if (t.get("adherence") or "").strip().lower() == "followed"
    ]
    partial = [
        t
        for t in filtered_trades
        if (t.get("adherence") or "").strip().lower() == "partial"
    ]
    broke_n = len(broke)
    followed_n = len(followed)
    partial_n = len(partial)
    plan_n = followed_n + partial_n

    # --- Layer: behavior to process damage (adherence only, not $) ---
    if total >= 1 and (broke_n > 0 or plan_n > 0):
        broke_rate = round(broke_n / total, 4) if total else None
        plan_rate = round(plan_n / total, 4) if total else None
        statements.append(
            {
                "layer": "behavior_to_damage",
                "kind": "adherence_split",
                "observation": (
                    f"In this window: {broke_n} rule-break trade"
                    f"{'' if broke_n == 1 else 's'} "
                    f"({broke_rate:.0%} of {total}) vs "
                    f"{plan_n} followed/partial "
                    f"({plan_rate:.0%} of {total}). "
                    "Process damage only — not a P&L comparison."
                ),
                "metrics": {
                    "broke_count": broke_n,
                    "followed_or_partial_count": plan_n,
                    "trade_count": total,
                    "broke_rate": broke_rate,
                    "followed_or_partial_rate": plan_rate,
                },
            }
        )

    # Behavior-tagged object days vs broke (from clustering)
    em = emotion_mirror or {}
    for t in (em.get("behavior_tags") or [])[:4]:
        label = str(t.get("label") or t.get("slug") or "tag")
        days = set(str(d) for d in (t.get("days") or []) if d)
        if not days:
            continue
        _, broke_days, _ = _trade_day_sets(filtered_trades)
        shared = days & broke_days
        if not shared:
            continue
        statements.append(
            {
                "layer": "behavior_to_process",
                "kind": "tag_x_rule_break",
                "observation": (
                    f'Days you named "{label}" overlapped rule-break trade days '
                    f"on {len(shared)} day{'s' if len(shared) != 1 else ''} "
                    f"({', '.join(sorted(shared)[:4])}"
                    f"{'…' if len(shared) > 4 else ''}). "
                    "Co-occurrence in your data — not a market claim."
                ),
                "tag_label": label,
                "days": sorted(shared),
            }
        )

    # Routine skip vs rule breaks (from clustering payload when present)
    cl = clustering or {}
    for s in cl.get("statements") or []:
        if s.get("kind") == "no_routine_x_deviation":
            statements.append(
                {
                    "layer": "behavior_to_process",
                    "kind": "routine_skip_x_deviation",
                    "observation": s.get("observation"),
                    "days": s.get("days") or [],
                }
            )
            break

    statements = statements[:MAX_CORRELATION_STATEMENTS]

    # Hard invariant: metrics dicts never carry P&L / expectancy keys
    for s in statements:
        metrics = s.get("metrics") or {}
        for k in metrics:
            kl = str(k).lower()
            for ban in ("pnl", "expectancy", "win_rate", "profit", "net_pnl"):
                if ban == kl or ban in kl:
                    raise ValueError(
                        f"correlation metrics leaked banned key {k!r}"
                    )
        # Observation may *deny* P&L ("not a P&L comparison") but must not
        # report expectancy/win-rate as findings
        obs = str(s.get("observation") or "").lower()
        for phrase in (
            "expectancy of",
            "win rate of",
            "net pnl",
            "profit factor",
            "$",
        ):
            if phrase in obs:
                raise ValueError(
                    f"correlation observation leaked performance phrase {phrase!r}"
                )

    return {
        "layers": [
            {
                "id": "behavior_to_process",
                "label": "Behavior to process",
                "statements": [
                    s for s in statements if s.get("layer") == "behavior_to_process"
                ],
            },
            {
                "id": "behavior_to_damage",
                "label": "Behavior to avoidable process damage",
                "statements": [
                    s for s in statements if s.get("layer") == "behavior_to_damage"
                ],
            },
        ],
        "statements": statements,
        "excludes": ["pnl", "win_rate", "expectancy", "profit"],
        "empty_message": (
            "Not enough paired process observations for a correlation read yet."
        ),
        "has_content": bool(statements),
        "note": (
            "Correlate behavior to avoidable process damage. Never to P&L (§13)."
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
    # Dual-read §2.1 — session_started_at NY day
    dates |= jsd.list_session_activity_ny_dates(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )
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
    # Dual-read §2.1 — session activity days (NY)
    jdays.extend(
        sorted(
            jsd.list_session_activity_ny_dates(
                cur,
                identity_id,
                scope_start,
                scope_end,
                is_maiden=is_maiden,
            )
        )
    )
    jdays = sorted(set(jdays))
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
    """Spec §6.5 — dual-read legacy notes + pre_market sessions (Spec §2.1).

    Null when neither source contributes intent in the window.
    """
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

    trades_by_day: dict[str, list[dict]] = {}
    for t in filtered_trades:
        dk = _day_key(_parse_exec(t.get("exec_at")))
        if not dk:
            continue
        trades_by_day.setdefault(dk, []).append(t)

    def _executed_for_day(day: str) -> str:
        day_trades = trades_by_day.get(day) or []
        if day_trades:
            parts = []
            for t in day_trades:
                adh = (t.get("adherence") or "unknown").strip().lower()
                sym = t.get("strategy") or t.get("symbol") or "trade"
                parts.append(f"{sym} ({adh})")
            return f"{len(day_trades)} trade(s): " + "; ".join(parts[:12])
        return "No trades logged this day"

    out: list[dict[str, Any]] = []
    for r in pre_rows:
        created = r.get("created_at")
        if created is not None and not isinstance(created, datetime):
            continue
        day = _day_key(created if isinstance(created, datetime) else None)
        if not day:
            continue
        intent = _strip_pre_market_prefix(str(r.get("body_md") or ""))
        out.append(
            {
                "day": day,
                "stated_intent": intent,  # verbatim after marker strip only
                "what_executed": _executed_for_day(day),
                "gap": None,  # member-authored later
                "note_id": int(r["id"]) if r.get("id") else None,
                "session_id": None,
                "source": "tool_note",
            }
        )

    # Dual-read: journal sessions (tag=pre_market, partial|sealed)
    for item in jsd.pre_market_intents_from_sessions(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    ):
        day = item["day"]
        out.append(
            {
                "day": day,
                "stated_intent": item["stated_intent"],
                "what_executed": _executed_for_day(day),
                "gap": None,
                "note_id": None,
                "session_id": item.get("session_id"),
                "source": "journal_session",
            }
        )

    out.sort(key=lambda x: (x.get("day") or "", x.get("source") or ""))
    return out if out else None


def _session_day_key(raw: Any) -> str | None:
    if isinstance(raw, datetime):
        return raw.date().isoformat()
    if isinstance(raw, date):
        return raw.isoformat()
    if raw is None:
        return None
    s = str(raw).strip()
    return s[:10] if len(s) >= 10 else None


def _structured_dict(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def _clip_text(v: Any, *, limit: int = 400) -> str:
    s = " ".join(str(v or "").split())
    if not s:
        return ""
    return s if len(s) <= limit else s[: limit - 1] + "…"


def build_journal_compile(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> dict[str, Any]:
    """Compile Journal structured fields + member notes for the ceremony."""
    start_d = _as_naive_utc(scope_start).date()
    end_d = _as_naive_utc(scope_end).date()
    op = ">=" if is_maiden else ">"
    cur.execute(
        f"""SELECT id, journal_date, structured_json
            FROM member_journal_sessions
            WHERE identity_id = %s
              AND journal_date {op} %s AND journal_date <= %s
            ORDER BY journal_date ASC, id ASC""",
        (int(identity_id), start_d, end_d),
    )
    said: list[dict[str, str]] = []
    in_the_way: list[dict[str, str]] = []
    worked: list[dict[str, str]] = []
    next_thing: list[dict[str, str]] = []
    notes: list[dict[str, str]] = []

    def _add(bucket: list[dict[str, str]], day: str, text: Any) -> None:
        t = _clip_text(text)
        if not t:
            return
        if any(x["text"] == t and x["day"] == day for x in bucket):
            return
        bucket.append({"day": day, "text": t})

    for row in cur.fetchall() or []:
        day = _session_day_key(row.get("journal_date")) or ""
        st = _structured_dict(row.get("structured_json"))
        for key in ("thesis_direction", "trigger_level", "watching", "instrument"):
            _add(said, day, st.get(key))
        for key in ("plan_diff", "deviations", "differed_from_plan"):
            _add(in_the_way, day, st.get(key))
        _add(worked, day, st.get("what_worked"))
        _add(next_thing, day, st.get("open_thread"))
        _add(next_thing, day, st.get("note"))
        cur.execute(
            """SELECT body_md, phase FROM member_journal_messages
               WHERE session_id = %s AND identity_id = %s AND author = 'member'
               ORDER BY created_at ASC, id ASC""",
            (int(row["id"]), int(identity_id)),
        )
        for msg in cur.fetchall() or []:
            body = msg.get("body_md")
            phase = str(msg.get("phase") or "")
            if phase == "pre_open":
                _add(said, day, body)
            else:
                _add(notes, day, body)

    suggested_one_thing = next_thing[-1]["text"] if next_thing else ""
    suggested_cause = (
        in_the_way[-1]["text"] if in_the_way else (notes[-1]["text"] if notes else "")
    )
    empty = not (said or in_the_way or worked or next_thing or notes)
    return {
        "said": said,
        "in_the_way": in_the_way,
        "worked": worked,
        "next": next_thing,
        "notes": notes,
        "suggested_cause": suggested_cause or None,
        "suggested_one_thing": suggested_one_thing or None,
        "empty": empty,
    }


def attach_journal_compile(cur, identity_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    """Live-compile on GET so older gathered retros still show the week."""
    start = payload.get("scope_start")
    end = payload.get("scope_end")
    if not start or not end:
        return payload
    try:
        start_dt = datetime.fromisoformat(str(start).replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(str(end).replace("Z", "+00:00"))
    except ValueError:
        return payload
    compiled = build_journal_compile(
        cur,
        identity_id,
        start_dt,
        end_dt,
        is_maiden=bool(payload.get("is_maiden")),
    )
    report = payload.get("report")
    if not isinstance(report, dict):
        report = {}
        payload["report"] = report
    report["journal_compile"] = compiled
    return payload


def build_period_brief(
    process: dict[str, Any],
    book: dict[str, Any],
    journal_compile: dict[str, Any],
    *,
    scope_start: datetime,
    scope_end: datetime,
    window_days: int,
    last_one_thing: str | None,
) -> dict[str, Any]:
    """Standard period infographic DTO — same tiles for every member."""
    routine = process.get("routine") or {}
    live = process.get("live") or {}
    learning = process.get("learning") or {}
    adherence = process.get("adherence") or {}
    said = [
        x
        for x in (journal_compile.get("said") or [])
        + (journal_compile.get("notes") or [])
        if isinstance(x, dict)
    ]
    preview = [
        {"day": str(x.get("day") or ""), "text": str(x.get("text") or "")}
        for x in said[:4]
        if x.get("text")
    ]
    trade_count = int(book.get("trade_count") or adherence.get("total") or 0)
    followed = int(adherence.get("followed") or 0)
    partial = int(adherence.get("partial") or 0)
    return {
        "title": "Since last review",
        "scope_start": _iso(scope_start),
        "scope_end": _iso(scope_end),
        "window_days": int(window_days),
        "tiles": {
            "window_days": int(window_days),
            "journal_days": int(routine.get("journal_days") or 0),
            "journal_notes": int(journal_compile.get("session_count") or 0)
            or int(routine.get("journal_notes") or 0),
            "trade_count": trade_count,
            "trade_days": int(routine.get("trade_days") or 0),
            "followed_or_partial": followed + partial,
            "adherence_total": int(adherence.get("total") or 0),
            "live_checkins": int(live.get("checkins") or 0),
            "lessons_completed": int(learning.get("lessons_completed") or 0),
        },
        "last_one_thing": (last_one_thing or "").strip() or None,
        "journal_preview": preview,
        "empty_journal": bool(journal_compile.get("empty")),
        "note": "Same layout for every member. Process counts — not a P&L scoreboard.",
    }


def _last_completed_one_thing(cur, identity_id: int) -> str | None:
    try:
        cur.execute(
            """SELECT one_thing_md, body_md FROM member_retrospectives
               WHERE identity_id = %s AND status = 'complete'
               ORDER BY COALESCE(completed_at, created_at) DESC, id DESC
               LIMIT 1""",
            (int(identity_id),),
        )
        row = cur.fetchone()
    except Exception:
        return None
    if not row:
        return None
    one = (row.get("one_thing_md") or "").strip()
    if one:
        return one
    body = (row.get("body_md") or "").strip()
    return body or None


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
        "journal_compile": build_journal_compile(
            cur,
            identity_id,
            scope_start,
            scope_end,
            is_maiden=is_maiden,
        ),
        "book_performance": book,
        # Compat aliases for v0.2 consumers / Charlie fallbacks
        "is_maiden": is_maiden,
        "scope_start": _iso(scope_start),
        "scope_end": _iso(scope_end),
        "pnl": book,
    }
    report["period_brief"] = build_period_brief(
        process,
        book,
        report["journal_compile"],
        scope_start=scope_start,
        scope_end=scope_end,
        window_days=window_days,
        last_one_thing=_last_completed_one_thing(cur, identity_id),
    )

    comparison = _comparison(cur, identity_id, report, prior_id)
    direction = None
    if comparison.get("has_prior") and comparison.get("integrity_direction"):
        direction = comparison["integrity_direction"]
        report["integrity_review"]["direction"] = direction

    # Spec v0.7.1 §7 — ceremony indicator (period only; no rolling co-frame)
    report["period_indicator"] = build_period_indicator(
        process,
        book,
        window_days=window_days,
        direction=direction,
    )

    # Spec v0.7.1 §8.1 / §8.1a — emotion mirror + lexicon map (R4)
    # Tag frequency never reaches period_indicator (asserted in tests).
    report["emotion_mirror"] = build_emotion_mirror(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
    )
    report["lexicon_ceremony_map"] = lexicon_ceremony_map()

    # Spec v0.7.1 §8.2 / §12 / §13 — clustering, trends, correlation (R5)
    report["clustering"] = build_clustering(
        cur,
        identity_id,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        filtered_trades=filtered,
        emotion_mirror=report["emotion_mirror"],
    )
    report["correlation"] = build_correlation(
        filtered,
        emotion_mirror=report["emotion_mirror"],
        clustering=report["clustering"],
    )
    # Trends: prior completes + this period (rate-normalized; floor TREND_MIN_CYCLES)
    report["trends"] = build_period_trends(
        cur,
        identity_id,
        report,
        period_index=None,
    )

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

    interrupted = bool(row.get("interrupted"))
    is_maiden = bool(row.get("is_maiden"))
    cadence_at = (
        int(row["cadence_days_at_period"])
        if row.get("cadence_days_at_period") is not None
        else None
    )
    report = _json_field(row.get("report_json"))
    # Spec §9 — interruption notice before ceremony body (structured + copy)
    interruption = None
    if interrupted and not is_maiden:
        # Prefer notice already stamped into report at gather
        if isinstance(report, dict) and isinstance(report.get("interruption"), dict):
            interruption = report["interruption"]
        else:
            interruption = build_interruption_notice(
                interrupted=True,
                scope_start=row.get("scope_start"),
                scope_end=row.get("scope_end"),
                cadence_days=cadence_at,
                is_maiden=is_maiden,
                prior_completed_at=row.get("scope_start"),
            )
        # Keep report in sync for ceremony consumers
        if isinstance(report, dict) and interruption is not None:
            report = {**report, "interruption": interruption}

    return {
        "id": int(row["id"]),
        "status": row["status"],
        "is_maiden": is_maiden,
        "scope_start": _iso(row.get("scope_start")),
        "scope_end": _iso(row.get("scope_end")),
        "title": row.get("title") or "",
        "body_md": row.get("body_md") or "",
        "one_thing_md": row.get("one_thing_md") or "",
        "report": report,
        "comparison": _json_field(row.get("comparison_json")),
        "agent": _json_field(row.get("agent_json")),
        "prompt_version_id": row.get("prompt_version_id"),
        "cadence_days_at_period": cadence_at,
        "period_index": (
            int(row["period_index"]) if row.get("period_index") is not None else None
        ),
        "interrupted": interrupted,
        "interruption": interruption,
        "completed_at": _iso(row.get("completed_at")),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }
