"""Journey gamification scores — derived on read (Spec v1.0).

No second store of progress. Pillars: reputation, personal_growth,
attendance_streak, contribution. Process metrics only — never P&L.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

import auth
import journal_session_domain as jsd

# Spec constants — change only with Spec version bump
PTS_COURSE_COMPLETED = 50
PTS_THREAD = 15
PTS_COMMENT_OTHER = 5
PTS_REVIEW = 10
PTS_LESSON_COMPLETED = 3
PTS_QUIZ_ATTEMPT = 5

W_REP = 1
W_GROW = 1
W_ATT = 8
STREAK_CAP = 12

EASTERN = ZoneInfo("America/New_York")
CHECKIN_OPENS = timedelta(minutes=15)
CHECKIN_CLOSES = timedelta(hours=4)

# Fail loud if weights are nonsense
for _name, _v in (
    ("W_REP", W_REP),
    ("W_GROW", W_GROW),
    ("W_ATT", W_ATT),
    ("STREAK_CAP", STREAK_CAP),
):
    if not isinstance(_v, int) or _v < 0:
        raise RuntimeError(f"journey_scores invalid constant {_name}={_v!r}")


def contribution(
    reputation: int, personal_growth: int, attendance_streak: int
) -> int:
    return (
        W_REP * max(0, reputation)
        + W_GROW * max(0, personal_growth)
        + W_ATT * min(max(0, attendance_streak), STREAK_CAP)
    )


def iso_week_key(d: date) -> tuple[int, int]:
    iso = d.isocalendar()
    return (iso.year, iso.week)


def checkin_week_keys(checkin_times: list[datetime]) -> set[tuple[int, int]]:
    """Eastern ISO (year, week) keys with ≥1 live check-in."""
    weeks: set[tuple[int, int]] = set()
    for ts in checkin_times:
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        weeks.add(iso_week_key(ts.astimezone(EASTERN).date()))
    return weeks


def attendance_streak_weeks(
    checkin_times: list[datetime], *, now: datetime | None = None
) -> int:
    """Consecutive Eastern ISO weeks with ≥1 check-in (Spec §3.3 grace)."""
    if not checkin_times:
        return 0
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    today_et = now.astimezone(EASTERN).date()
    weeks = checkin_week_keys(checkin_times)

    # Grace: if current week empty, start from last week
    cursor = today_et
    if iso_week_key(cursor) not in weeks:
        cursor = cursor - timedelta(days=7)

    streak = 0
    while iso_week_key(cursor) in weeks:
        streak += 1
        # jump to previous ISO week
        cursor = cursor - timedelta(days=7)
    return streak


# Live presence meter — EWMA of weekly show-up (1/0).
# Rewards consistency, punishes gaps; near-term weeks weigh more than older ones.
# half-life = weeks until an observation's weight is halved (α = 1 − 0.5^(1/H)).
LIVE_HALF_LIFE_WEEKS = 4.0


def live_ewma_alpha(half_life_weeks: float = LIVE_HALF_LIFE_WEEKS) -> float:
    """Smoothing factor for weekly presence EWMA (near-term heavier)."""
    h = float(half_life_weeks)
    if h <= 0:
        return 1.0
    return 1.0 - (0.5 ** (1.0 / h))


def live_week_presence_series(
    week_keys: set[tuple[int, int]],
    *,
    now: datetime | None = None,
    horizon_weeks: int = 16,
    grace_current_week: bool = True,
) -> list[int]:
    """Binary presence per Eastern ISO week, **oldest → newest**, length = horizon.

    Grace (same spirit as streak): if the current week has no check-in yet, do not
    treat mid-week as an absence — the series starts from last week. Empty weeks
    inside the window still score 0 and pull the EWMA down.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    horizon = max(1, int(horizon_weeks))
    today = now.astimezone(EASTERN).date()
    cursor = today
    if grace_current_week and iso_week_key(cursor) not in week_keys:
        cursor = cursor - timedelta(days=7)

    newest_first: list[int] = []
    for _ in range(horizon):
        newest_first.append(1 if iso_week_key(cursor) in week_keys else 0)
        cursor = cursor - timedelta(days=7)
    newest_first.reverse()
    return newest_first


def live_coverage_weeks(
    week_keys: set[tuple[int, int]],
    *,
    now: datetime | None = None,
    horizon_weeks: int = 16,
) -> tuple[int, int]:
    """Count weeks with a check-in in the last ``horizon_weeks`` Eastern ISO weeks.

    Flat count for display only (EWMA drives the meter). Includes current week
    even if empty so detail matches the calendar window. Returns
    ``(active_count, horizon_weeks)``.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    horizon = max(1, int(horizon_weeks))
    today = now.astimezone(EASTERN).date()
    active = 0
    cursor = today
    for _ in range(horizon):
        if iso_week_key(cursor) in week_keys:
            active += 1
        cursor = cursor - timedelta(days=7)
    return active, horizon


def live_presence_ewma(
    presence_oldest_first: list[int],
    *,
    half_life_weeks: float = LIVE_HALF_LIFE_WEEKS,
) -> float:
    """EWMA of binary weekly presence in [0, 1]. Empty series → 0.0."""
    if not presence_oldest_first:
        return 0.0
    alpha = live_ewma_alpha(half_life_weeks)
    s: float | None = None
    for x in presence_oldest_first:
        v = 1.0 if x else 0.0
        s = v if s is None else alpha * v + (1.0 - alpha) * s
    return 0.0 if s is None else max(0.0, min(1.0, s))


def live_presence_percent(
    checkin_times: list[datetime],
    *,
    now: datetime | None = None,
    streak_cap: int = 12,
    horizon_weeks: int | None = None,
    half_life_weeks: float = LIVE_HALF_LIFE_WEEKS,
) -> tuple[int, int, int, int]:
    """Live presence raw % for process meters.

    Returns ``(percent, streak, active_in_horizon, horizon)``.

    Formula (Journey Experience Spec §4.1 live):
      For each of the last ``horizon`` Eastern weeks (oldest → newest), x_t ∈ {0,1}
      (1 = ≥1 check-in). Grace: incomplete current week with no check-in is skipped.
      α = 1 − 0.5^(1/half_life)   # default half-life 4 weeks — near-term heavier
      s_t = α·x_t + (1−α)·s_{t−1}
      raw% = round(100 · s_final)

    Consistency (runs of 1s) lifts the EWMA; gaps and on/off patterns suppress it.
    Recent absences ding harder than equal-length absences further back.
    Leaderboard contribution still uses streak alone (Spec §3.4).
    ``streak_cap`` only sizes the default horizon when ``horizon_weeks`` is omitted.
    """
    cap = max(1, int(streak_cap))
    horizon = (
        max(1, int(horizon_weeks))
        if horizon_weeks is not None
        else max(cap * 2, 12)
    )
    streak = attendance_streak_weeks(checkin_times, now=now)
    keys = checkin_week_keys(checkin_times)
    active, horizon = live_coverage_weeks(
        keys, now=now, horizon_weeks=horizon
    )
    series = live_week_presence_series(
        keys, now=now, horizon_weeks=horizon, grace_current_week=True
    )
    ewma = live_presence_ewma(series, half_life_weeks=half_life_weeks)
    return _clamp_pct(100.0 * ewma), streak, active, horizon


def checkin_window_ok(starts_at: datetime, now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return starts_at - CHECKIN_OPENS <= now <= starts_at + CHECKIN_CLOSES


def compute_reputation(cur, identity_id: int) -> int:
    pts = 0
    cur.execute(
        """SELECT COUNT(*) AS n FROM enrollments
           WHERE identity_id = %s AND completed_at IS NOT NULL""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_COURSE_COMPLETED

    cur.execute(
        """SELECT COUNT(*) AS n FROM threads
           WHERE identity_id = %s AND status = 'visible'""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_THREAD

    cur.execute(
        """SELECT COUNT(*) AS n FROM comments c
           JOIN threads t ON c.thread_id = t.id
           WHERE c.identity_id = %s AND c.status = 'visible'
             AND t.status = 'visible'
             AND t.identity_id <> c.identity_id""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_COMMENT_OTHER

    cur.execute(
        """SELECT COUNT(*) AS n FROM reviews
           WHERE identity_id = %s AND status = 'visible'""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_REVIEW
    return pts


def compute_personal_growth(cur, identity_id: int) -> int:
    pts = 0
    cur.execute(
        """SELECT COUNT(*) AS n FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_LESSON_COMPLETED

    cur.execute(
        """SELECT COUNT(*) AS n FROM quiz_attempts
           WHERE identity_id = %s""",
        (identity_id,),
    )
    pts += int(cur.fetchone()["n"]) * PTS_QUIZ_ATTEMPT
    return pts


def load_checkin_times(cur, identity_id: int) -> list[datetime]:
    cur.execute(
        """SELECT checked_in_at FROM live_session_checkins
           WHERE identity_id = %s
           ORDER BY checked_in_at DESC
           LIMIT 500""",
        (identity_id,),
    )
    out: list[datetime] = []
    for r in cur.fetchall():
        ts = r["checked_in_at"]
        if ts is not None:
            out.append(ts)
    return out


def scores_for_identity(cur, identity_id: int, *, now: datetime | None = None) -> dict[str, int]:
    """Full private scores (always computed for the owner)."""
    rep = compute_reputation(cur, identity_id)
    growth = compute_personal_growth(cur, identity_id)
    streak = attendance_streak_weeks(load_checkin_times(cur, identity_id), now=now)
    return {
        "reputation": rep,
        "personal_growth": growth,
        "attendance_streak": streak,
        "contribution": contribution(rep, growth, streak),
    }


def _clamp_pct(n: float) -> int:
    return max(0, min(100, int(round(n))))


# Process Integrity composite — Spec v0.4 Option 1 (Coach DL-171) + Hard Spec §8.3 MT.
# Version bumps only with Journey Spec amend + characterization tests.
SCORING_MODEL_VERSION = "pi-weights-v1-option1+mt"

# Profile id → meter weights (integers sum to 100). Quality = adherence + retro.
# Fail loud if a resolve_meter_profile id is missing here.
PROCESS_METER_WEIGHTS: dict[str, dict[str, int]] = {
    "observer_trial": {
        "persistence": 15,
        "routine": 15,
        "learning": 15,
        "live": 10,
        "adherence": 25,
        "retrospective": 20,
    },
    "activator": {
        "persistence": 14,
        "routine": 14,
        "learning": 12,
        "live": 12,
        "adherence": 24,
        "retrospective": 24,
    },
    "navigator_monthly": {
        "persistence": 12,
        "routine": 12,
        "learning": 10,
        "live": 12,
        "adherence": 28,
        "retrospective": 26,
    },
    "navigator_annual": {
        "persistence": 14,
        "routine": 12,
        "learning": 10,
        "live": 12,
        "adherence": 26,
        "retrospective": 26,
    },
    "alumni": {
        "persistence": 15,
        "routine": 10,
        "learning": 25,
        "live": 10,
        "adherence": 20,
        "retrospective": 20,
    },
    "free_observer": {
        "persistence": 15,
        "routine": 15,
        "learning": 30,
        "live": 10,
        "adherence": 15,
        "retrospective": 15,
    },
    # Same as navigator_monthly (spec v0.4 §3.6)
    "administrator": {
        "persistence": 12,
        "routine": 12,
        "learning": 10,
        "live": 12,
        "adherence": 28,
        "retrospective": 26,
    },
}

# Seven-weight maps when Mental Toughness is non-empty (Hard Spec v1.0 §8.3 proposed;
# Coach GO H3 — integers sum 100). MT weight from Spec defaults.
PROCESS_METER_WEIGHTS_WITH_MT: dict[str, dict[str, int]] = {
    "observer_trial": {
        "persistence": 14,
        "routine": 14,
        "learning": 13,
        "live": 9,
        "adherence": 22,
        "retrospective": 18,
        "mental_toughness": 10,
    },
    "activator": {
        "persistence": 12,
        "routine": 12,
        "learning": 11,
        "live": 11,
        "adherence": 21,
        "retrospective": 21,
        "mental_toughness": 12,
    },
    "navigator_monthly": {
        "persistence": 11,
        "routine": 10,
        "learning": 9,
        "live": 11,
        "adherence": 24,
        "retrospective": 23,
        "mental_toughness": 12,
    },
    "navigator_annual": {
        "persistence": 12,
        "routine": 11,
        "learning": 9,
        "live": 11,
        "adherence": 23,
        "retrospective": 22,
        "mental_toughness": 12,
    },
    "alumni": {
        "persistence": 14,
        "routine": 9,
        "learning": 23,
        "live": 9,
        "adherence": 18,
        "retrospective": 19,
        "mental_toughness": 8,
    },
    "free_observer": {
        "persistence": 14,
        "routine": 14,
        "learning": 28,
        "live": 9,
        "adherence": 14,
        "retrospective": 13,
        "mental_toughness": 8,
    },
    "administrator": {
        "persistence": 11,
        "routine": 10,
        "learning": 9,
        "live": 11,
        "adherence": 24,
        "retrospective": 23,
        "mental_toughness": 12,
    },
}

for _pid, _wmap in PROCESS_METER_WEIGHTS.items():
    _s = sum(_wmap.values())
    if _s != 100:
        raise RuntimeError(
            f"PROCESS_METER_WEIGHTS[{_pid!r}] sum to {_s}, expected 100"
        )
for _pid, _wmap in PROCESS_METER_WEIGHTS_WITH_MT.items():
    _s = sum(_wmap.values())
    if _s != 100:
        raise RuntimeError(
            f"PROCESS_METER_WEIGHTS_WITH_MT[{_pid!r}] sum to {_s}, expected 100"
        )
    if "mental_toughness" not in _wmap:
        raise RuntimeError(
            f"PROCESS_METER_WEIGHTS_WITH_MT[{_pid!r}] missing mental_toughness"
        )


def process_weights_for_profile(
    profile_id: str, *, include_mental_toughness: bool = False
) -> dict[str, int]:
    """Return Option 1 weights; seven-map when MT is enrolled/active."""
    table = (
        PROCESS_METER_WEIGHTS_WITH_MT
        if include_mental_toughness
        else PROCESS_METER_WEIGHTS
    )
    w = table.get(profile_id)
    if not w:
        raise RuntimeError(
            f"process meter weights missing for profile {profile_id!r} "
            f"(include_mt={include_mental_toughness})"
        )
    return dict(w)


def adherence_raw_from_counts(
    n_trades: int, n_tagged: int, n_good: int
) -> tuple[int | None, bool]:
    """Dual-empty adherence (Spec v0.4 §3.5).

    Returns ``(raw_percent, empty)``:
    - no trades → empty (exclude from composite)
    - trades but none tagged → raw 0, not empty (do not renorm away)
    - some tagged → percent followed/partial among tagged
    """
    if n_trades <= 0:
        return None, True
    if n_tagged <= 0:
        return 0, False
    good = max(0, min(int(n_good), int(n_tagged)))
    return _clamp_pct(100.0 * good / float(n_tagged)), False


def weighted_overall_raw(
    meters: list[dict[str, Any]],
    weights: dict[str, int],
) -> tuple[int, dict[str, int]]:
    """Profile-weighted overall from meter raw percents (0–100 scale).

    ``overall_raw = round(Σ w_i · raw_i / Σ w_i)`` over non-empty, non-soon meters
    with w_i > 0. Raw is already percent — do **not** multiply by 100 again.
    Returns ``(overall_raw, applied_weights)``. If no scorable meters, (0, {}).
    """
    num = 0.0
    den = 0
    applied: dict[str, int] = {}
    for m in meters:
        if m.get("empty") or m.get("soon"):
            continue
        mid = str(m.get("id") or "")
        w = int(weights.get(mid, 0))
        if w <= 0:
            continue
        raw = int(m.get("raw_percent") or 0)
        num += w * raw
        den += w
        applied[mid] = w
    if den <= 0:
        return 0, {}
    return _clamp_pct(num / float(den)), applied


# Process integrity grades — trading-psych norms (process, not P&L / identity).
# Bands map to journal-style process scores: poor → excellent.
# Labels describe the work, not the person (Tango: no shame framing in copy).
#
# Tenure: fresh members do not start at Poor. Time-in-game pulls the graded %
# toward center (50) until the profile ramp completes — extremes (Poor /
# Excellent) must be earned. Weight uses a square ease-in so best/worst open slowly.
PROCESS_GRADE_BANDS: tuple[tuple[int, int, str, str, str, str], ...] = (
    # lo, hi, id, label, blurb, color_hex
    (0, 24, "poor", "Poor", "Off process — reinstall the routine", "#b91c1c"),
    (25, 49, "fair", "Fair", "Developing discipline — partial process", "#ea580c"),
    (50, 69, "good", "Good", "Solid process integrity", "#ca8a04"),
    (70, 84, "great", "Great", "Disciplined process — habits holding", "#16a34a"),
    (85, 100, "excellent", "Excellent", "Locked-in process integrity", "#047857"),
)

# Neutral band center for tenure pull (not a "score" — ungraded baseline).
GRADE_CENTER = 50
# Minimum calendar days before any Poor/Excellent can apply even after pull.
MIN_DAYS_FOR_EXTREME_GRADES = 7
# Establishing: no earned grade yet (too new and little/no practice signal).
ESTABLISHING_MAX_DAYS = 5


def process_grade(
    percent: int,
    *,
    establishing: bool = False,
) -> dict[str, Any]:
    """Map 0–100 process health to a graded scale (Poor…Excellent).

    If establishing=True (new member, no earned signal), return neutral
    "Establishing" — never Poor on day one.
    """
    if establishing:
        return {
            "id": "establishing",
            "label": "Establishing",
            "blurb": "Too early to grade — keep practicing to earn your process score",
            "color": "#64748b",
            "percent": _clamp_pct(percent),
            "band_low": 0,
            "band_high": 0,
            "establishing": True,
        }
    pct = _clamp_pct(percent)
    for lo, hi, gid, label, blurb, color in PROCESS_GRADE_BANDS:
        if lo <= pct <= hi:
            return {
                "id": gid,
                "label": label,
                "blurb": blurb,
                "color": color,
                "percent": pct,
                "band_low": lo,
                "band_high": hi,
                "establishing": False,
            }
    lo, hi, gid, label, blurb, color = PROCESS_GRADE_BANDS[-1]
    return {
        "id": gid,
        "label": label,
        "blurb": blurb,
        "color": color,
        "percent": pct,
        "band_low": lo,
        "band_high": hi,
        "establishing": False,
    }


def process_grade_scale() -> list[dict[str, Any]]:
    """Full scale for UI legend (Poor → Excellent)."""
    return [
        {
            "id": gid,
            "label": label,
            "band_low": lo,
            "band_high": hi,
            "color": color,
            "blurb": blurb,
        }
        for lo, hi, gid, label, blurb, color in PROCESS_GRADE_BANDS
    ]


def grade_tenure_weight(tenure_days: float, ramp_days: float) -> float:
    """0→1 weight of raw process vs center. Square ease-in: extremes open slowly."""
    if ramp_days <= 0:
        return 1.0
    t = min(1.0, max(0.0, float(tenure_days) / float(ramp_days)))
    return t * t


def apply_tenure_to_percent(
    raw_percent: int, tenure_days: float, ramp_days: float
) -> tuple[int, float]:
    """Pull graded % toward center until ramp completes.

    Fresh: near 50 (cannot be Poor or Excellent).
    Full ramp: graded % ≈ raw activity %.
    """
    raw = _clamp_pct(raw_percent)
    w = grade_tenure_weight(tenure_days, ramp_days)
    adjusted = GRADE_CENTER + (raw - GRADE_CENTER) * w
    return _clamp_pct(adjusted), w


def member_tenure_days(
    cur, identity_id: int, *, now: datetime | None = None
) -> float:
    """Days since identity (or earliest membership) — time in the game."""
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    starts: list[datetime] = []
    cur.execute(
        "SELECT created_at FROM identities WHERE identity_id = %s",
        (identity_id,),
    )
    row = cur.fetchone()
    if row and row.get("created_at"):
        starts.append(row["created_at"])
    cur.execute(
        """SELECT MIN(started_at) AS s FROM memberships
           WHERE identity_id = %s AND started_at IS NOT NULL""",
        (identity_id,),
    )
    m = cur.fetchone()
    if m and m.get("s"):
        starts.append(m["s"])
    if not starts:
        return 0.0
    earliest = min(starts)
    if getattr(earliest, "tzinfo", None) is None:
        earliest = earliest.replace(tzinfo=timezone.utc)
    delta = now - earliest
    return max(0.0, delta.total_seconds() / 86400.0)


# ---------------------------------------------------------------------------
# Process meter profiles — membership / tenure shapes the horizon (Coach).
# Observer trial: short focus window. Navigator monthly vs annual: longer arc.
# ---------------------------------------------------------------------------

def _profile(
    pid: str,
    label: str,
    horizon_label: str,
    *,
    persistence_weeks: int,
    persistence_target_weeks: int,
    routine_window_days: int = 7,
    routine_target_days: int = 5,
    learning_window_days: int = 14,
    learning_target_days: int = 5,
    adherence_window_days: int = 30,
    live_streak_cap: int = 12,
    live_horizon_weeks: int | None = None,
    grade_ramp_days: int | None = None,
    retro_horizon_days: int | None = 30,
    focus: str = "",
) -> dict[str, Any]:
    # Default ramp = full persistence horizon (must earn extremes over that arc).
    ramp = (
        grade_ramp_days
        if grade_ramp_days is not None
        else max(7, int(persistence_weeks) * 7)
    )
    # Coverage window for Live presence: long enough that a multi-month drought
    # before a comeback streak still dings the meter (default ~2× streak cap).
    live_h = (
        int(live_horizon_weeks)
        if live_horizon_weeks is not None
        else max(12, int(live_streak_cap) * 2)
    )
    return {
        "id": pid,
        "label": label,
        "horizon_label": horizon_label,
        "persistence_weeks": persistence_weeks,
        "persistence_target_weeks": persistence_target_weeks,
        "routine_window_days": routine_window_days,
        "routine_target_days": routine_target_days,
        "learning_window_days": learning_window_days,
        "learning_target_days": learning_target_days,
        "adherence_window_days": adherence_window_days,
        "live_streak_cap": live_streak_cap,
        "live_horizon_weeks": max(1, live_h),
        "grade_ramp_days": ramp,
        # Cadence meter H (Journey §4.1a) — None = E1 cannot create / n/a
        "retro_horizon_days": retro_horizon_days,
        "focus": focus,
    }


# Coach: Observer is here for ~6 weeks — meter focused on that window.
# (Observer membership is 6 weeks — Membership Spec; meter focus = 6 weeks of practice.)
METER_PROFILE_OBSERVER_TRIAL = _profile(
    "observer_trial",
    "Observer trial",
    "6-week focus",
    persistence_weeks=6,
    persistence_target_weeks=5,
    routine_window_days=7,
    routine_target_days=5,
    learning_window_days=14,
    learning_target_days=6,
    adherence_window_days=42,
    live_streak_cap=6,
    live_horizon_weeks=6,  # trial window only — no pre-trial drought ding
    grade_ramp_days=42,  # full trial before extremes fully open (tenure; not cadence)
    # Spec v0.51: teaching rhythm weekly (zero-DTE funnel) — cadence H only
    retro_horizon_days=7,
    focus=(
        "6-week focus: install the routine, show up most weeks, build trust — "
        "so continuing as Navigator is a natural next step, not a hard sell."
    ),
)

METER_PROFILE_NAVIGATOR_MONTHLY = _profile(
    "navigator_monthly",
    "Navigator · monthly",
    "Rolling month → quarter",
    persistence_weeks=12,
    persistence_target_weeks=8,
    adherence_window_days=30,
    live_streak_cap=12,
    live_horizon_weeks=16,  # ~4 months — couple-month droughts still visible
    grade_ramp_days=30,
    retro_horizon_days=30,
    focus="Month-to-month practice: steady weeks beat heroic spikes.",
)

METER_PROFILE_NAVIGATOR_ANNUAL = _profile(
    "navigator_annual",
    "Navigator · annual",
    "Season-long practice",
    persistence_weeks=26,
    persistence_target_weeks=18,
    adherence_window_days=60,
    live_streak_cap=12,
    live_horizon_weeks=20,  # season window for live coverage
    learning_window_days=21,
    learning_target_days=6,
    grade_ramp_days=90,  # season before full Excellent/Poor range
    retro_horizon_days=90,
    focus="Year-scale membership: persistence across months compounds.",
)

METER_PROFILE_ACTIVATOR = _profile(
    "activator",
    "Activator",
    "Rolling month",
    persistence_weeks=12,
    persistence_target_weeks=8,
    live_streak_cap=8,
    live_horizon_weeks=16,
    grade_ramp_days=30,
    retro_horizon_days=30,
    focus="Member practice loop — log, learn, show up.",
)

METER_PROFILE_ALUMNI = _profile(
    "alumni",
    "Course alumni",
    "Course library year",
    persistence_weeks=12,
    persistence_target_weeks=6,
    learning_window_days=21,
    learning_target_days=5,
    live_streak_cap=4,
    live_horizon_weeks=12,
    grade_ramp_days=21,
    retro_horizon_days=90,  # Spec v0.51 — library rhythm (not active trading loop)
    focus="Keep learning from the library; practice when you return.",
)

METER_PROFILE_FREE_OBSERVER = _profile(
    "free_observer",
    "Free account",
    "Getting started",
    persistence_weeks=4,
    persistence_target_weeks=3,
    learning_window_days=14,
    learning_target_days=3,
    live_streak_cap=4,
    live_horizon_weeks=8,
    grade_ramp_days=14,
    retro_horizon_days=None,  # E1 — cannot create retros
    focus="Previews and pathway — upgrade when you're ready to practice fully.",
)

METER_PROFILE_ADMIN = _profile(
    "administrator",
    "Admin",
    "Ops view (member defaults)",
    persistence_weeks=12,
    persistence_target_weeks=8,
    grade_ramp_days=30,
    retro_horizon_days=30,
    focus="Uses member defaults for personal practice metering.",
)

# Defaults for tests that still reference module constants
PERSISTENCE_WEEKS = METER_PROFILE_NAVIGATOR_MONTHLY["persistence_weeks"]
PERSISTENCE_TARGET_WEEKS = METER_PROFILE_NAVIGATOR_MONTHLY["persistence_target_weeks"]


def _period_days(started_at, period_end, now: datetime) -> float | None:
    """Estimate billing period length from membership dates."""
    if period_end is None:
        return None
    end = period_end
    if hasattr(end, "tzinfo") and end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    start = started_at
    if start is not None and hasattr(start, "tzinfo") and start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    # Prefer end - start when both present; else end - now remaining + guess
    if start is not None:
        delta = end - start
        return abs(delta.total_seconds()) / 86400.0
    now_u = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    # remaining only — weak signal
    rem = (end - now_u).total_seconds() / 86400.0
    if rem > 200:
        return 365.0
    if rem > 20:
        return 30.0
    return None


def resolve_meter_profile(
    cur, identity_id: int, role: str, *, now: datetime | None = None
) -> dict[str, Any]:
    """Pick process-meter profile from active memberships + role."""
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    if role == "administrator":
        return dict(METER_PROFILE_ADMIN)

    cur.execute(
        """SELECT p.slug, p.grants_role, m.started_at, m.current_period_end, m.status
           FROM memberships m
           JOIN plans p ON m.plan_id = p.id
           WHERE m.identity_id = %s
             AND m.status IN ('active', 'grace')
             AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
           ORDER BY m.started_at DESC""",
        (identity_id,),
    )
    rows = cur.fetchall()

    # Observer trial — short focused horizon (Coach: 6-week meter focus)
    for r in rows:
        if r["slug"] == "observer-trial":
            prof = dict(METER_PROFILE_OBSERVER_TRIAL)
            if r.get("started_at"):
                prof["membership_started_at"] = (
                    r["started_at"].isoformat()
                    if hasattr(r["started_at"], "isoformat")
                    else str(r["started_at"])
                )
            return prof

    # Navigator / coaching plans
    nav_rows = [
        r
        for r in rows
        if r["slug"] in ("navigator", "coaching") or r["grants_role"] == "navigator"
    ]
    # Exclude pure observer-trial already handled
    nav_rows = [r for r in nav_rows if r["slug"] != "observer-trial"]
    if nav_rows:
        r = nav_rows[0]
        days = _period_days(r.get("started_at"), r.get("current_period_end"), now)
        # ≥ ~180 days of period → annual; else monthly
        if days is not None and days >= 180:
            return dict(METER_PROFILE_NAVIGATOR_ANNUAL)
        # No period end on coaching legacy → treat as monthly rolling
        if days is None and r.get("current_period_end") is None:
            return dict(METER_PROFILE_NAVIGATOR_MONTHLY)
        return dict(METER_PROFILE_NAVIGATOR_MONTHLY)

    for r in rows:
        if r["slug"] in ("activator", "labs-membership") or r["grants_role"] == "activator":
            return dict(METER_PROFILE_ACTIVATOR)
        if r["slug"] == "courses-alumni" or r["grants_role"] == "alumni":
            return dict(METER_PROFILE_ALUMNI)

    if role == "navigator":
        # Role without classified plan (e.g. override) — monthly default
        return dict(METER_PROFILE_NAVIGATOR_MONTHLY)
    if role == "activator":
        return dict(METER_PROFILE_ACTIVATOR)
    if role == "alumni":
        return dict(METER_PROFILE_ALUMNI)
    return dict(METER_PROFILE_FREE_OBSERVER)


def _practice_week_keys(
    cur, identity_id: int, since: datetime, *, now: datetime
) -> set[tuple[int, int]]:
    """ISO (year, week) keys with any practice-advancing activity.

    Practice advances = Trade Log fills, journal notes, lesson completions,
    live check-ins. Not community posts (those are reputation).
    """
    weeks: set[tuple[int, int]] = set()

    def _add_dates(rows: list, key: str = "d") -> None:
        for r in rows:
            d = r[key]
            if d is None:
                continue
            if hasattr(d, "isocalendar"):
                iso = d.isocalendar()
                weeks.add((iso[0], iso[1]))

    cur.execute(
        """SELECT DISTINCT DATE(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at >= %s""",
        (identity_id, since),
    )
    _add_dates(cur.fetchall())

    cur.execute(
        """SELECT DISTINCT DATE(updated_at) AS d FROM member_tool_notes
           WHERE identity_id = %s AND surface IN ('journal', 'playbook', 'trade_log')
             AND updated_at >= %s""",
        (identity_id, since),
    )
    _add_dates(cur.fetchall())

    # Dual-read: journal session_started_at NY weeks count toward persistence
    for d in jsd.list_session_activity_ny_dates(cur, identity_id, since=since):
        if hasattr(d, "isocalendar"):
            iso = d.isocalendar()
            weeks.add((iso[0], iso[1]))

    cur.execute(
        """SELECT DISTINCT DATE(completed_at) AS d FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL
             AND completed_at >= %s""",
        (identity_id, since),
    )
    _add_dates(cur.fetchall())

    since_naive = since.replace(tzinfo=None) if since.tzinfo else since
    for ts in load_checkin_times(cur, identity_id):
        ts_naive = ts.replace(tzinfo=None) if getattr(ts, "tzinfo", None) else ts
        if ts_naive >= since_naive:
            d = ts_naive.date() if hasattr(ts_naive, "date") else ts_naive
            if hasattr(d, "isocalendar"):
                iso = d.isocalendar()
                weeks.add((iso[0], iso[1]))

    return weeks


def practice_persistence(
    week_keys: set[tuple[int, int]],
    *,
    now: datetime | None = None,
    horizon_weeks: int = 12,
    target_weeks: int = 8,
) -> tuple[int, int, int]:
    """Return (percent, weeks_with_practice, consecutive_practice_streak)."""
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    today = now.astimezone(EASTERN).date()
    horizon_weeks = max(1, int(horizon_weeks))
    target_weeks = max(1, int(target_weeks))

    window: list[tuple[int, int]] = []
    cursor = today
    for _ in range(horizon_weeks):
        window.append(iso_week_key(cursor))
        cursor = cursor - timedelta(days=7)
    active = sum(1 for w in window if w in week_keys)
    pct = _clamp_pct(100.0 * active / float(target_weeks))
    streak_cursor = today
    if iso_week_key(streak_cursor) not in week_keys:
        streak_cursor = streak_cursor - timedelta(days=7)
    streak = 0
    while iso_week_key(streak_cursor) in week_keys:
        streak += 1
        streak_cursor = streak_cursor - timedelta(days=7)
        if streak > 104:
            break
    return pct, active, streak


def _ny_date(dt: datetime) -> date:
    """Calendar date in America/New_York (cadence / attendance consistency)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(EASTERN).date()


def retrospective_cadence_raw(days_since: int, horizon_days: int) -> int:
    """Journey §4.1a formula. H = horizon_days, d = days_since completed."""
    H = max(1, int(horizon_days))
    d = max(0, int(days_since))
    if d <= H:
        return 100
    if d >= 2 * H:
        return 0
    return int(round(100.0 * (2 * H - d) / H))


def _can_create_retrospectives(cur, identity_id: int, role: str) -> bool:
    """E1 inverse — same entitlement idea as Spec §10.1 (no import cycle)."""
    if role == "administrator":
        return True
    try:
        if auth.role_at_least(role, "activator"):
            return True
    except Exception:
        pass
    cur.execute(
        """SELECT 1
           FROM memberships m
           JOIN plans p ON p.id = m.plan_id
           WHERE m.identity_id = %s
             AND p.slug = 'observer-trial'
             AND m.status IN ('active', 'grace')
             AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
           LIMIT 1""",
        (identity_id,),
    )
    return cur.fetchone() is not None


def _last_completed_retro_at(cur, identity_id: int) -> datetime | None:
    cur.execute(
        """SELECT completed_at FROM member_retrospectives
           WHERE identity_id = %s AND status = 'complete'
             AND completed_at IS NOT NULL
           ORDER BY completed_at DESC
           LIMIT 1""",
        (identity_id,),
    )
    row = cur.fetchone()
    if not row or not row.get("completed_at"):
        return None
    dt = row["completed_at"]
    if isinstance(dt, datetime) and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _practice_epoch_for_cadence(cur, identity_id: int) -> datetime | None:
    """Earliest practice signal or identity.created_at — None if unresolvable (E3)."""
    candidates: list[datetime] = []
    for sql in (
        "SELECT MIN(exec_at) AS t FROM member_trade_log_trades WHERE identity_id = %s",
        """SELECT MIN(created_at) AS t FROM member_tool_notes
           WHERE identity_id = %s AND surface IN ('journal', 'pre_market')""",
        "SELECT MIN(checked_in_at) AS t FROM live_session_checkins WHERE identity_id = %s",
        """SELECT MIN(completed_at) AS t FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL""",
        "SELECT created_at AS t FROM identities WHERE identity_id = %s",
    ):
        cur.execute(sql, (identity_id,))
        row = cur.fetchone()
        if row and row.get("t"):
            t = row["t"]
            if isinstance(t, datetime):
                if t.tzinfo is None:
                    t = t.replace(tzinfo=timezone.utc)
                candidates.append(t)
    if not candidates:
        return None
    return min(candidates)


def _retrospective_meter(
    cur,
    identity_id: int,
    *,
    role: str,
    profile: dict[str, Any],
    now: datetime,
    tenure_days: float,
    ramp_days: float,
    _meter,
) -> dict[str, Any]:
    """Journey §4.1a retrospective cadence — not soon; E1–E3 empty."""
    H = profile.get("retro_horizon_days")
    hint = (
        "Days since last completed retrospective vs your plan horizon — "
        "closing the review loop is part of process"
    )

    # E1 — cannot create
    if H is None or not _can_create_retrospectives(cur, identity_id, role):
        return _meter(
            "retrospective",
            "Retrospective cadence",
            hint,
            0,
            "Not available on this plan",
            empty=True,
            has_signal=False,
        )

    H = int(H)
    last_complete = _last_completed_retro_at(cur, identity_id)
    if last_complete is not None:
        anchor = last_complete
        clock = "last_complete"
    else:
        epoch = _practice_epoch_for_cadence(cur, identity_id)
        if epoch is None:
            # E3
            return _meter(
                "retrospective",
                "Retrospective cadence",
                hint,
                0,
                "Practice start unresolvable",
                empty=True,
                has_signal=False,
            )
        anchor = epoch
        clock = "practice_epoch"

    d = max(0, (_ny_date(now) - _ny_date(anchor)).days)

    # E2 — no complete yet and still within first horizon of grace
    if last_complete is None and d <= H:
        return _meter(
            "retrospective",
            "Retrospective cadence",
            hint,
            0,
            f"Grace period — first review due within {H} days of practice start",
            empty=True,
            has_signal=False,
        )

    raw = retrospective_cadence_raw(d, H)
    detail = (
        f"{d} day{'s' if d != 1 else ''} since "
        f"{'last completed retrospective' if clock == 'last_complete' else 'practice start'}"
        f" · horizon {H}d"
    )
    m = _meter(
        "retrospective",
        "Retrospective cadence",
        hint,
        raw,
        detail,
        has_signal=True,
    )
    m["days_since"] = d
    m["horizon_days"] = H
    m["nudge"] = d > H  # same H as meter — invitational only (Tango)
    m["clock"] = clock
    return m


def process_meters(
    cur,
    identity_id: int,
    *,
    role: str = "observer",
    now: datetime | None = None,
) -> dict[str, Any]:
    """Personal process health — profile-shaped habits + practice persistence.

    Meters are 0–100 process signals, not achievements. Never P&L.
    Profile (Observer 6-week focus vs Navigator monthly/annual) sets windows.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    profile = resolve_meter_profile(cur, identity_id, role, now=now)

    p_weeks = int(profile["persistence_weeks"])
    p_target = int(profile["persistence_target_weeks"])
    r_win = int(profile["routine_window_days"])
    r_tgt = int(profile["routine_target_days"])
    l_win = int(profile["learning_window_days"])
    l_tgt = int(profile["learning_target_days"])
    a_win = int(profile["adherence_window_days"])
    live_cap = max(1, int(profile["live_streak_cap"]))
    live_horizon = max(1, int(profile.get("live_horizon_weeks") or max(12, live_cap * 2)))

    now_naive = now.astimezone(timezone.utc).replace(tzinfo=None)
    routine_since = now_naive - timedelta(days=r_win)
    learn_since = now_naive - timedelta(days=l_win)
    adh_since = now_naive - timedelta(days=a_win)
    persistence_since = now_naive - timedelta(days=p_weeks * 7)

    cur.execute(
        """SELECT COUNT(DISTINCT DATE(completed_at)) AS n
           FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL
             AND completed_at >= %s""",
        (identity_id, learn_since),
    )
    learn_days = int(cur.fetchone()["n"] or 0)

    cur.execute(
        """SELECT
             COUNT(*) AS n_trades,
             SUM(CASE WHEN adherence IN ('followed', 'partial')
                      THEN 1 ELSE 0 END) AS good,
             SUM(CASE WHEN adherence IS NOT NULL
                       AND adherence NOT IN ('', 'unknown')
                      THEN 1 ELSE 0 END) AS tagged
           FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at >= %s""",
        (identity_id, adh_since),
    )
    adh = cur.fetchone()
    n_trades = int(adh["n_trades"] or 0)
    tagged = int(adh["tagged"] or 0)
    good = int(adh["good"] or 0)
    adherence_pct, adherence_empty = adherence_raw_from_counts(
        n_trades, tagged, good
    )

    checkins = load_checkin_times(cur, identity_id)
    live_pct, streak, live_active, live_h = live_presence_percent(
        checkins,
        now=now,
        streak_cap=live_cap,
        horizon_weeks=live_horizon,
    )

    # Dual-read Spec §2.1 / D2: trades ∪ legacy journal notes ∪
    # session_started_at NY days (so meters do not cliff when sessions ship)
    cur.execute(
        """SELECT DATE(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at >= %s""",
        (identity_id, routine_since),
    )
    routine_dates: set[date] = set()
    for row in cur.fetchall():
        if row["d"] is not None:
            routine_dates.add(row["d"])
    cur.execute(
        """SELECT DATE(updated_at) AS d FROM member_tool_notes
           WHERE identity_id = %s AND surface = 'journal'
             AND updated_at >= %s""",
        (identity_id, routine_since),
    )
    for row in cur.fetchall():
        if row["d"] is not None:
            routine_dates.add(row["d"])
    routine_dates |= jsd.list_session_activity_ny_dates(
        cur, identity_id, since=routine_since
    )
    routine_days = len(routine_dates)
    routine_pct = _clamp_pct(100.0 * routine_days / float(r_tgt))
    learning_pct = _clamp_pct(100.0 * learn_days / float(l_tgt))

    p_keys = _practice_week_keys(cur, identity_id, persistence_since, now=now)
    persist_pct, persist_active, practice_streak = practice_persistence(
        p_keys,
        now=now,
        horizon_weeks=p_weeks,
        target_weeks=p_target,
    )

    tenure_days = member_tenure_days(cur, identity_id, now=now)
    ramp_days = float(profile.get("grade_ramp_days") or max(7, p_weeks * 7))
    tenure_w = grade_tenure_weight(tenure_days, ramp_days)

    def _meter(
        mid: str,
        label: str,
        hint: str,
        raw_percent: int,
        detail: str,
        *,
        empty: bool = False,
        soon: bool = False,
        has_signal: bool = True,
    ) -> dict[str, Any]:
        raw = 0 if empty or soon else _clamp_pct(raw_percent)
        graded, _ = apply_tenure_to_percent(raw, tenure_days, ramp_days)
        # Sub-meters: establishing if brand new and no signal for this meter
        est = bool(
            (empty or soon)
            or (
                not has_signal
                and tenure_days < ESTABLISHING_MAX_DAYS
            )
        )
        # Block true Poor/Excellent on sub-meters until min days
        if (
            not est
            and tenure_days < MIN_DAYS_FOR_EXTREME_GRADES
            and graded <= 24
        ):
            graded = 25  # floor at Fair until tenure allows Poor
        if (
            not est
            and tenure_days < MIN_DAYS_FOR_EXTREME_GRADES
            and graded >= 85
        ):
            graded = 84  # cap at Great until tenure allows Excellent
        m: dict[str, Any] = {
            "id": mid,
            "label": label,
            "hint": hint,
            "percent": graded if not empty and not soon else raw,
            "raw_percent": raw,
            "detail": detail,
            "grade": process_grade(
                0 if empty or soon else graded, establishing=est and not soon
            ),
        }
        if empty:
            m["empty"] = True
        if soon:
            m["soon"] = True
        return m

    meters = [
        _meter(
            "persistence",
            "Practice persistence",
            (
                f"Weeks with Trade Log, Journal, lessons, or live check-in "
                f"(last {p_weeks} weeks; target {p_target}) — profile: {profile['label']}"
            ),
            persist_pct,
            (
                f"{persist_active} of last {p_weeks} weeks active"
                + (f" · {practice_streak}w streak" if practice_streak else "")
            ),
            has_signal=persist_active > 0,
        ),
        _meter(
            "routine",
            "Daily routine",
            (
                f"Trade log or journal days in the last {r_win} days "
                f"(target {r_tgt})"
            ),
            routine_pct,
            f"{routine_days} day{'s' if routine_days != 1 else ''} active",
            has_signal=routine_days > 0,
        ),
        _meter(
            "learning",
            "Learning rhythm",
            (
                f"Days with a completed lesson in the last {l_win} days "
                f"(target {l_tgt})"
            ),
            learning_pct,
            f"{learn_days} day{'s' if learn_days != 1 else ''} with lessons",
            has_signal=learn_days > 0,
        ),
        _meter(
            "live",
            "Live presence",
            (
                f"EWMA of weekly live check-ins over {live_h} weeks "
                f"(half-life {LIVE_HALF_LIFE_WEEKS:g}w — near-term consistency "
                f"weighs more; gaps and recent slack ding harder)"
            ),
            live_pct,
            (
                f"{live_pct}% EWMA · {streak}w streak · "
                f"{live_active}/{live_h} weeks present"
            ),
            has_signal=streak > 0 or live_active > 0,
        ),
    ]
    if adherence_empty:
        meters.append(
            _meter(
                "adherence",
                "Process adherence",
                "Tag adherence on Trade Log fills to meter plan-following",
                0,
                "No trades in window",
                empty=True,
                has_signal=False,
            )
        )
    else:
        adh_detail = (
            f"{good}/{tagged} tagged trades"
            if tagged > 0
            else f"0/{n_trades} tagged — untagged trades count as process gap"
        )
        meters.append(
            _meter(
                "adherence",
                "Process adherence",
                f"Trades tagged followed/partial (last {a_win} days) — not P&L",
                int(adherence_pct or 0),
                adh_detail,
                has_signal=n_trades > 0,
            )
        )

    meters.append(
        _retrospective_meter(
            cur,
            identity_id,
            role=role,
            profile=profile,
            now=now,
            tenure_days=tenure_days,
            ramp_days=ramp_days,
            _meter=_meter,
        )
    )

    # Mental Toughness — Hard Spec v1.0 §8; empty until active Hard enrollment
    import hard_domain as hard_dom

    mt_raw, mt_empty, mt_detail = hard_dom.mental_toughness_raw(
        cur, identity_id, today=now.astimezone(EASTERN).date()
    )
    if mt_empty:
        meters.append(
            _meter(
                "mental_toughness",
                "Mental toughness",
                (
                    "FatTail Hard / True 75 compliance when enrolled — empty until "
                    "you start a challenge (not a zero). aMCC / mental toughness "
                    "capacity training; process signal only."
                ),
                0,
                "Not enrolled in Hard",
                empty=True,
                has_signal=False,
            )
        )
    else:
        stats = (mt_detail.get("stats") or {}) if isinstance(mt_detail, dict) else {}
        en = (mt_detail.get("enrollment") or {}) if isinstance(mt_detail, dict) else {}
        detail = (
            f"{int(mt_raw or 0)}% · {stats.get('streak_days', 0)}d streak · "
            f"completion {int(round(100 * float(stats.get('completion_rate') or 0)))}% · "
            f"{en.get('variant_id') or 'hard'}"
        )
        meters.append(
            _meter(
                "mental_toughness",
                "Mental toughness",
                (
                    "Compliance with your active Hard challenge (streak + completion). "
                    "Not a brain scan — physiology cited on /app/toughness."
                ),
                int(mt_raw or 0),
                detail,
                has_signal=True,
            )
        )

    weights = process_weights_for_profile(
        str(profile["id"]), include_mental_toughness=not mt_empty
    )
    for m in meters:
        mid = str(m.get("id") or "")
        m["weight"] = (
            0
            if m.get("empty") or m.get("soon")
            else int(weights.get(mid, 0))
        )

    # Shadow: equal mean during migration (Spec v0.4 §3.10)
    scored_raw = [
        m["raw_percent"]
        for m in meters
        if not m.get("empty") and not m.get("soon")
    ]
    overall_raw_equal = (
        _clamp_pct(sum(scored_raw) / len(scored_raw)) if scored_raw else 0
    )
    overall_raw, weights_applied = weighted_overall_raw(meters, weights)
    overall_graded, _ = apply_tenure_to_percent(
        overall_raw, tenure_days, ramp_days
    )

    # Any practice signal across active meters?
    has_any_signal = any(
        (m.get("raw_percent") or 0) > 0
        for m in meters
        if not m.get("empty") and not m.get("soon")
    )
    establishing = (not has_any_signal and tenure_days < ESTABLISHING_MAX_DAYS) or (
        tenure_w < 0.02 and not has_any_signal
    )

    # Hard floors/ceilings on extremes until min tenure
    if not establishing and tenure_days < MIN_DAYS_FOR_EXTREME_GRADES:
        if overall_graded <= 24:
            overall_graded = 25
        if overall_graded >= 85:
            overall_graded = 84

    grade = process_grade(overall_graded, establishing=establishing)
    # Needle follows graded (earned) percent; establishing sits mid-scale
    display_pct = GRADE_CENTER if establishing else overall_graded

    return {
        "framing": "process_meter",
        "scoring_model_version": SCORING_MODEL_VERSION,
        "profile": {
            "id": profile["id"],
            "label": profile["label"],
            "horizon_label": profile["horizon_label"],
            "focus": profile.get("focus") or "",
            "retro_horizon_days": profile.get("retro_horizon_days"),
            "grade_ramp_days": profile.get("grade_ramp_days"),
        },
        "overall_percent": display_pct,
        "overall_raw_percent": overall_raw,
        # Shadow during pi-weights-v1 migration (Spec v0.4 §3.10) — equal mean of
        # non-empty meters; remove after cutover explainer period.
        "overall_raw_equal_mean": overall_raw_equal,
        "weights": weights,
        "weights_applied": weights_applied,
        "overall_label": (
            "Establishing your process — grades open as you practice"
            if establishing
            else _overall_label(overall_graded, profile["id"])
        ),
        "grade": grade,
        "grade_scale": process_grade_scale(),
        "tenure": {
            "days": round(tenure_days, 2),
            "ramp_days": int(ramp_days),
            "weight": round(tenure_w, 4),
            "establishing": establishing,
            "note": (
                "Time in the game weights your grade: extremes (Poor / Excellent) "
                "open gradually — you earn them, you don't start there."
            ),
        },
        "meters": meters,
        "window": {
            "routine_days": r_win,
            "routine_target_days": r_tgt,
            "learning_days": l_win,
            "learning_target_days": l_tgt,
            "adherence_days": a_win,
            "persistence_weeks": p_weeks,
            "persistence_target_weeks": p_target,
            "live_streak_cap": live_cap,
            "live_horizon_weeks": live_h,
            "grade_ramp_days": int(ramp_days),
        },
    }


def _overall_label(pct: int, profile_id: str = "") -> str:
    if profile_id == "observer_trial":
        if pct >= 80:
            return "Strong trial process — ready to continue as Navigator"
        if pct >= 50:
            return "Habit forming — keep practicing; Navigator keeps the path open"
        if pct >= 20:
            return "Early trial signal — log, learn, and show up this week"
        return "Trial window is short — start the routine now"
    if profile_id == "navigator_annual":
        if pct >= 80:
            return "Season-strong process — persistence compounding"
        if pct >= 50:
            return "Annual path: steady weeks over the long arc"
        if pct >= 20:
            return "Year membership — rebuild the practice rhythm"
        return "Long horizon — reinstall daily process"
    if pct >= 80:
        return "Strong process — habits and persistence compounding"
    if pct >= 50:
        return "Building persistence in the practice"
    if pct >= 20:
        return "Early process signal — keep showing up"
    return "Room to install the routine"


def public_contribution(
    reputation: int,
    personal_growth: int,
    attendance_streak: int,
    *,
    share_reputation: bool,
    share_personal_growth: bool,
    share_attendance: bool,
) -> int:
    """Board rank axis: only pillars the member chose to share.

    Hidden pillars contribute 0 so personal growth can stay private while
    community presence (rep / attendance) still builds public contribution.
    """
    return contribution(
        reputation if share_reputation else 0,
        personal_growth if share_personal_growth else 0,
        attendance_streak if share_attendance else 0,
    )


def leaderboard_rows(
    cur,
    *,
    viewer_identity_id: int,
    limit: int = 500,
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    """Opt-in members only; per-pillar share flags; null = not shared."""
    cur.execute(
        """SELECT identity_id, display_name, avatar_url,
                  share_reputation, share_personal_growth, share_attendance
           FROM identities
           WHERE journey_visible = 1
             AND TRIM(COALESCE(display_name, '')) <> ''
           ORDER BY identity_id ASC
           LIMIT %s""",
        (limit,),
    )
    members = cur.fetchall()
    rows: list[dict[str, Any]] = []
    for m in members:
        iid = int(m["identity_id"])
        s = scores_for_identity(cur, iid, now=now)
        share_rep = bool(m.get("share_reputation", 1))
        share_grow = bool(m.get("share_personal_growth", 0))
        share_att = bool(m.get("share_attendance", 1))
        pub = public_contribution(
            s["reputation"],
            s["personal_growth"],
            s["attendance_streak"],
            share_reputation=share_rep,
            share_personal_growth=share_grow,
            share_attendance=share_att,
        )
        rows.append(
            {
                "display_name": (m["display_name"] or "").strip(),
                "avatar_url": m["avatar_url"],
                "reputation": s["reputation"] if share_rep else None,
                "personal_growth": s["personal_growth"] if share_grow else None,
                "attendance_streak": s["attendance_streak"] if share_att else None,
                "contribution": pub,
                "shares": {
                    "reputation": share_rep,
                    "personal_growth": share_grow,
                    "attendance": share_att,
                },
                "is_self": iid == viewer_identity_id,
                "_iid": iid,
            }
        )
    rows.sort(
        key=lambda r: (-r["contribution"], r["display_name"].lower(), r["_iid"])
    )
    out: list[dict[str, Any]] = []
    for i, r in enumerate(rows, start=1):
        out.append(
            {
                "rank": i,
                "display_name": r["display_name"],
                "avatar_url": r["avatar_url"],
                "reputation": r["reputation"],
                "personal_growth": r["personal_growth"],
                "attendance_streak": r["attendance_streak"],
                "contribution": r["contribution"],
                "shares": r["shares"],
                "is_self": r["is_self"],
            }
        )
    return out


def rank_for_identity(rows: list[dict[str, Any]]) -> int | None:
    for r in rows:
        if r.get("is_self"):
            return int(r["rank"])
    return None
