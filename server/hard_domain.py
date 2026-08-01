"""FatTail Hard / Mental Toughness domain — Hard Spec v1.0 (H1).

Identity isolation only. Config-driven variants — fail loud if unknown.
Timezone for day boundaries: America/New_York (Spec §11).
"""

from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

EASTERN = ZoneInfo("America/New_York")

PROGRAM_KINDS = frozenset({"true_75", "fattail_hard"})
ENROLLMENT_STATUSES = frozenset({"active", "paused", "completed", "exited"})

# Fail loud: every enroll must resolve a published variant.
# Tasks: required booleans for daily complete.
# FatTail ladder: 20 / 40 / 75 days (Coach — breakthrough periods).
# miss_policy "restart": any failed/missed day returns you to day one (no grace).
_FATTAIL_TASKS = [
    {"id": "movement", "label": "Movement / workout (menu)", "required": True},
    {"id": "reading", "label": "Reading (10 pages non-fiction)", "required": True},
    {"id": "diet", "label": "Diet integrity (variant rules)", "required": True},
    {"id": "water", "label": "Water (body-weight scaled guidance)", "required": True},
    {"id": "progress_record", "label": "Progress record", "required": True},
    {"id": "no_alcohol", "label": "Alcohol rule (variant)", "required": True},
]

HARD_VARIANTS: dict[str, dict[str, Any]] = {
    "true_75_honor": {
        "program_kind": "true_75",
        "label": "True 75 Hard (honor system)",
        "credit": "Andy Frisella — True 75 Hard, offered as-is with full credit",
        "sprint_days": 75,
        "progressive": False,
        "photo_required": False,  # H4 for Labs photo upload; honor record still OK
        "miss_policy": "restart",
        "tasks": [
            {"id": "workout_1", "label": "Workout 1 (45 min)", "required": True},
            {"id": "workout_2", "label": "Workout 2 (45 min)", "required": True},
            {"id": "diet", "label": "Diet (no cheat meals)", "required": True},
            {"id": "water", "label": "Water goal", "required": True},
            {"id": "reading", "label": "10 pages non-fiction", "required": True},
            {"id": "progress_record", "label": "Progress photo/record", "required": True},
            {"id": "no_alcohol", "label": "No alcohol", "required": True},
        ],
    },
    "fattail_sprint_20": {
        "program_kind": "fattail_hard",
        "label": "FatTail Hard — 20-day program",
        "credit": None,
        "sprint_days": 20,
        "progressive": True,
        "photo_required": False,
        "miss_policy": "restart",
        "tasks": list(_FATTAIL_TASKS),
    },
    "fattail_sprint_40": {
        "program_kind": "fattail_hard",
        "label": "FatTail Hard — 40-day program",
        "credit": None,
        "sprint_days": 40,
        "progressive": True,
        "photo_required": False,
        "miss_policy": "restart",
        "tasks": list(_FATTAIL_TASKS),
    },
    "fattail_sprint_75": {
        "program_kind": "fattail_hard",
        "label": "FatTail Hard — 75-day program",
        "credit": None,
        "sprint_days": 75,
        "progressive": True,
        "photo_required": False,
        "miss_policy": "restart",
        "tasks": list(_FATTAIL_TASKS),
    },
}

# Coach product copy — How these programs work (member-facing).
HOW_IT_WORKS: dict[str, Any] = {
    "title": "How these programs work",
    "headline": "These programs develop Mental Toughness.",
    "body": [
        (
            "You work by following the program for the prescribed number of days "
            "and doing all the required activities each day, without fail."
        ),
        (
            "If you fail any activity, you must start the program from day one. "
            "No partial credit. No sliding scale."
        ),
        (
            "This is not easy — but it is the most effective way to cause real "
            "change in your physiology and mindset."
        ),
        (
            "You will become mentally tough if you progress through the entire "
            "set of programs."
        ),
        (
            "Many people are not prepared for how the program will change their "
            "lives and their priorities — particularly no drinking and no "
            "cheating on the diet. Plan for that before you start."
        ),
        (
            "Life still happens: vacations, weddings, holidays, work travel, "
            "family obligations. Those moments will challenge your resolve. "
            "The rules do not pause for them. That is part of the training."
        ),
    ],
    # Life / priority shift (Coach) — honest, capacity framing.
    "life_and_priorities": {
        "title": "What will actually change",
        "body": [
            (
                "This program reorders your day. Sleep, food, movement, and "
                "what you say yes to on a Saturday night stop being optional "
                "background noise — they become the work."
            ),
            (
                "No drinking and no cheating on the diet surprise people the "
                "most. Social habits, celebrations, and “just this once” "
                "pressure will push hard. Expect it. Decide in advance that "
                "those lines do not move."
            ),
            (
                "Vacations, weddings, holidays, and other real-life events will "
                "test you. Completing the program means holding the rules "
                "through those days — or accepting a restart from day one if "
                "you break them."
            ),
        ],
    },
    # Progressive ladder psychology (Coach) — capacity framing, not shame.
    "ladder": {
        "title": "The 20 → 40 → 75 path",
        "intro": (
            "FatTail Hard is a ladder of breakthrough periods. You choose the "
            "next rung when you are ready — never a membership requirement."
        ),
        "rungs": [
            {
                "days": 20,
                "title": "20 days",
                "blurb": (
                    "Finish 20 and you might want to stop. That is normal. "
                    "You may also choose to go on to 40. Some people need to "
                    "complete 20 twice before 40 feels possible — that is not "
                    "failure; it is building capacity."
                ),
            },
            {
                "days": 40,
                "title": "40 days",
                "blurb": (
                    "At 40, most people hit a major period of despair. Expect "
                    "it. If you get through that stretch without quitting the "
                    "rules, you can make it to the end."
                ),
            },
            {
                "days": 75,
                "title": "75 days",
                "blurb": (
                    "The far end of the ladder. Reach it by stacking completed "
                    "rungs — not by skipping the hard middle."
                ),
            },
        ],
    },
    "rules": [
        "All required daily activities must be completed every day.",
        "Miss or fail any required activity → restart from day one.",
        "No alcohol and no diet cheating — social events do not pause the rules.",
        "Vacations, weddings, and “life happens” still count as program days.",
        "FatTail Hard ladder: 20 → 40 → 75 (breakthrough periods).",
        "Repeating 20 before attempting 40 is allowed and often wise.",
        "True 75 Hard is offered as-is with full credit to Andy Frisella.",
        "Voluntary — never a membership requirement; never P&L theater.",
    ],
    # Optional YouTube id (11-char). Null until Coach records/publishes intro.
    "intro_video_id": None,
    "intro_video_title": "How Toughness programs work",
}

# Short enroll blurbs per FatTail length (Coach ladder psychology).
FATTAIL_LADDER_BLURB: dict[str, str] = {
    "fattail_sprint_20": (
        "First breakthrough period. Finish it — then decide. You might stop; "
        "you might go on to 40. Completing 20 twice before 40 is normal capacity "
        "building, not a setback."
    ),
    "fattail_sprint_40": (
        "Where most people hit a major period of despair. Get through it under "
        "the rules and the end of the ladder becomes real."
    ),
    "fattail_sprint_75": (
        "Full ladder length. Best attempted after you have proven 20 and 40 — "
        "not as a first jump."
    ),
}

for _vid, _v in HARD_VARIANTS.items():
    if _v["program_kind"] not in PROGRAM_KINDS:
        raise RuntimeError(f"HARD_VARIANTS[{_vid!r}] bad program_kind")
    if int(_v["sprint_days"]) < 1:
        raise RuntimeError(f"HARD_VARIANTS[{_vid!r}] sprint_days must be >= 1")
    if not _v.get("tasks"):
        raise RuntimeError(f"HARD_VARIANTS[{_vid!r}] needs tasks")


class HardDomainError(ValueError):
    """Domain validation / conflict — map to 4xx in routes."""


def today_eastern(*, now: datetime | None = None) -> date:
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return now.astimezone(EASTERN).date()


def list_variants_public() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for vid, v in HARD_VARIANTS.items():
        out.append(
            {
                "variant_id": vid,
                "program_kind": v["program_kind"],
                "label": v["label"],
                "credit": v.get("credit"),
                "sprint_days": int(v["sprint_days"]),
                "progressive": bool(v.get("progressive")),
                "photo_required": bool(v.get("photo_required")),
                "miss_policy": v.get("miss_policy") or "restart",
                "ladder_blurb": FATTAIL_LADDER_BLURB.get(vid),
                "tasks": list(v["tasks"]),
            }
        )
    return out


def how_it_works_public() -> dict[str, Any]:
    """Member-facing How it works block (copy + optional intro video).

    Video id: HOW_IT_WORKS default, overridden by env HARD_INTRO_VIDEO_ID when set
    (11-char YouTube id or watch URL normalized by the web client).
    """
    env_vid = (os.environ.get("HARD_INTRO_VIDEO_ID") or "").strip() or None
    video_id = env_vid or HOW_IT_WORKS.get("intro_video_id")
    ladder = HOW_IT_WORKS.get("ladder") or {}
    life = HOW_IT_WORKS.get("life_and_priorities") or {}
    return {
        "title": HOW_IT_WORKS["title"],
        "headline": HOW_IT_WORKS["headline"],
        "body": list(HOW_IT_WORKS["body"]),
        "life_and_priorities": {
            "title": life.get("title"),
            "body": list(life.get("body") or []),
        },
        "ladder": {
            "title": ladder.get("title"),
            "intro": ladder.get("intro"),
            "rungs": list(ladder.get("rungs") or []),
        },
        "rules": list(HOW_IT_WORKS["rules"]),
        "intro_video_id": video_id,
        "intro_video_title": HOW_IT_WORKS.get("intro_video_title"),
    }


def get_variant(variant_id: str) -> dict[str, Any]:
    v = HARD_VARIANTS.get(variant_id)
    if not v:
        raise HardDomainError(f"Unknown variant_id {variant_id!r}")
    return v


def _row_enrollment(r: dict) -> dict[str, Any]:
    return {
        "id": int(r["id"]),
        "identity_id": int(r["identity_id"]),
        "program_kind": r["program_kind"],
        "variant_id": r["variant_id"],
        "status": r["status"],
        "sprint_days": int(r["sprint_days"]),
        "started_at": r["started_at"].isoformat(sep=" ")
        if r.get("started_at") is not None
        else None,
        "ended_at": r["ended_at"].isoformat(sep=" ")
        if r.get("ended_at") is not None
        else None,
        "consent": _parse_json(r.get("consent_json")),
    }


def _parse_json(raw: Any) -> Any:
    if raw is None:
        return None
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    return None


def get_active_enrollment(cur, identity_id: int) -> dict[str, Any] | None:
    cur.execute(
        """SELECT * FROM member_hard_enrollments
           WHERE identity_id = %s AND status = 'active'
           ORDER BY id DESC LIMIT 1""",
        (identity_id,),
    )
    r = cur.fetchone()
    return _row_enrollment(r) if r else None


def get_enrollment(cur, identity_id: int, enrollment_id: int) -> dict[str, Any] | None:
    cur.execute(
        """SELECT * FROM member_hard_enrollments
           WHERE id = %s AND identity_id = %s""",
        (enrollment_id, identity_id),
    )
    r = cur.fetchone()
    return _row_enrollment(r) if r else None


def enroll(
    cur,
    identity_id: int,
    *,
    program_kind: str,
    variant_id: str,
    consent: dict[str, Any] | None = None,
) -> dict[str, Any]:
    program_kind = str(program_kind or "").strip()
    variant_id = str(variant_id or "").strip()
    if program_kind not in PROGRAM_KINDS:
        raise HardDomainError(
            f"program_kind must be one of {sorted(PROGRAM_KINDS)}"
        )
    variant = get_variant(variant_id)
    if variant["program_kind"] != program_kind:
        raise HardDomainError(
            f"variant {variant_id!r} is program_kind {variant['program_kind']!r}, "
            f"not {program_kind!r}"
        )
    existing = get_active_enrollment(cur, identity_id)
    if existing:
        raise HardDomainError(
            "Already have an active Hard enrollment — pause or exit first"
        )
    consent_s = json.dumps(consent) if consent is not None else None
    cur.execute(
        """INSERT INTO member_hard_enrollments
             (identity_id, program_kind, variant_id, status, sprint_days, consent_json)
           VALUES (%s, %s, %s, 'active', %s, %s)""",
        (
            identity_id,
            program_kind,
            variant_id,
            int(variant["sprint_days"]),
            consent_s,
        ),
    )
    eid = int(cur.lastrowid)
    row = get_enrollment(cur, identity_id, eid)
    if not row:
        raise RuntimeError("hard enroll insert vanished")
    return row


def set_status(
    cur,
    identity_id: int,
    enrollment_id: int,
    *,
    status: str,
) -> dict[str, Any]:
    status = str(status or "").strip()
    if status not in ENROLLMENT_STATUSES:
        raise HardDomainError(f"status must be one of {sorted(ENROLLMENT_STATUSES)}")
    en = get_enrollment(cur, identity_id, enrollment_id)
    if not en:
        raise HardDomainError("Enrollment not found")
    cur_st = en["status"]
    if cur_st in ("exited", "completed") and status != cur_st:
        raise HardDomainError(f"Enrollment already {cur_st}")
    if status == "active":
        other = get_active_enrollment(cur, identity_id)
        if other and int(other["id"]) != enrollment_id:
            raise HardDomainError("Another active enrollment exists")
        if cur_st not in ("active", "paused"):
            raise HardDomainError(f"Cannot resume from {cur_st}")
        cur.execute(
            """UPDATE member_hard_enrollments
               SET status = 'active', ended_at = NULL
               WHERE id = %s AND identity_id = %s""",
            (enrollment_id, identity_id),
        )
    elif status == "paused":
        if cur_st != "active":
            raise HardDomainError("Only active enrollments can be paused")
        cur.execute(
            """UPDATE member_hard_enrollments
               SET status = 'paused'
               WHERE id = %s AND identity_id = %s""",
            (enrollment_id, identity_id),
        )
    else:
        # exited | completed
        if cur_st not in ("active", "paused"):
            raise HardDomainError(f"Cannot set {status} from {cur_st}")
        cur.execute(
            """UPDATE member_hard_enrollments
               SET status = %s, ended_at = CURRENT_TIMESTAMP
               WHERE id = %s AND identity_id = %s""",
            (status, enrollment_id, identity_id),
        )
    row = get_enrollment(cur, identity_id, enrollment_id)
    if not row:
        raise RuntimeError("hard status update vanished")
    return row


def _required_task_ids(variant_id: str) -> list[str]:
    v = get_variant(variant_id)
    return [str(t["id"]) for t in v["tasks"] if t.get("required")]


def day_complete(variant_id: str, tasks: dict[str, Any]) -> bool:
    if not isinstance(tasks, dict):
        return False
    for tid in _required_task_ids(variant_id):
        if not tasks.get(tid):
            return False
    return True


def _enrollment_start_date(cur, enrollment_id: int, *, today: date) -> date:
    cur.execute(
        "SELECT started_at FROM member_hard_enrollments WHERE id = %s",
        (enrollment_id,),
    )
    raw = cur.fetchone()
    start_ts = raw["started_at"] if raw else None
    if start_ts is not None and getattr(start_ts, "tzinfo", None) is None:
        return start_ts.date() if hasattr(start_ts, "date") else today
    if start_ts is not None:
        return start_ts.astimezone(EASTERN).date()
    return today


def restart_attempt(
    cur,
    identity_id: int,
    enrollment_id: int,
    *,
    reason: str,
    today: date | None = None,
) -> dict[str, Any]:
    """Miss policy: clear daily logs and reset attempt to day one (Coach)."""
    today = today or today_eastern()
    en = get_enrollment(cur, identity_id, enrollment_id)
    if not en:
        raise HardDomainError("Enrollment not found")
    if en["status"] != "active":
        raise HardDomainError("Enrollment is not active")
    cur.execute(
        """DELETE FROM member_hard_daily_logs
           WHERE enrollment_id = %s AND identity_id = %s""",
        (enrollment_id, identity_id),
    )
    cur.execute(
        """UPDATE member_hard_enrollments
           SET started_at = CURRENT_TIMESTAMP, ended_at = NULL
           WHERE id = %s AND identity_id = %s""",
        (enrollment_id, identity_id),
    )
    return {
        "restarted": True,
        "reason": reason,
        "attempt_day": 1,
        "as_of": today.isoformat(),
    }


def apply_miss_restart_if_needed(
    cur,
    identity_id: int,
    enrollment_id: int,
    *,
    today: date | None = None,
) -> dict[str, Any] | None:
    """If a prior calendar day after start was not complete → day one.

    Today may still be in progress (incomplete mid-day does not restart).
    """
    today = today or today_eastern()
    en = get_enrollment(cur, identity_id, enrollment_id)
    if not en or en["status"] != "active":
        return None
    try:
        variant = get_variant(en["variant_id"])
    except HardDomainError:
        return None
    if (variant.get("miss_policy") or "restart") != "restart":
        return None
    start_d = _enrollment_start_date(cur, enrollment_id, today=today)
    if start_d >= today:
        return None
    completes = set(list_complete_dates(cur, identity_id, enrollment_id))
    # Every calendar day from start through yesterday must be complete.
    d = start_d
    yesterday = today - timedelta(days=1)
    while d <= yesterday:
        if d not in completes:
            return restart_attempt(
                cur,
                identity_id,
                enrollment_id,
                reason="missed_or_failed_day",
                today=today,
            )
        d = d + timedelta(days=1)
    return None


def upsert_daily_log(
    cur,
    identity_id: int,
    enrollment_id: int,
    *,
    log_date: date,
    tasks: dict[str, Any],
    progress_note: str | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    today = today or today_eastern()
    # Prior-day miss check before accepting a new log.
    apply_miss_restart_if_needed(
        cur, identity_id, enrollment_id, today=today
    )
    en = get_enrollment(cur, identity_id, enrollment_id)
    if not en:
        raise HardDomainError("Enrollment not found")
    if en["status"] != "active":
        raise HardDomainError("Enrollment is not active")
    if not isinstance(tasks, dict):
        raise HardDomainError("tasks must be an object")
    complete = day_complete(en["variant_id"], tasks)
    tasks_s = json.dumps(tasks)
    note = (progress_note or "").strip() or None
    if note is not None:
        note = note[:4000]
    cur.execute(
        """INSERT INTO member_hard_daily_logs
             (enrollment_id, identity_id, log_date, tasks_json, complete, progress_note)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
             tasks_json = VALUES(tasks_json),
             complete = VALUES(complete),
             progress_note = VALUES(progress_note)""",
        (
            enrollment_id,
            identity_id,
            log_date,
            tasks_s,
            1 if complete else 0,
            note,
        ),
    )
    # Explicit fail on a past day (not today mid-progress) → restart.
    restart_info = None
    if not complete and log_date < today:
        try:
            variant = get_variant(en["variant_id"])
        except HardDomainError:
            variant = {}
        if (variant.get("miss_policy") or "restart") == "restart":
            restart_info = restart_attempt(
                cur,
                identity_id,
                enrollment_id,
                reason="failed_day",
                today=today,
            )
            return {
                "id": 0,
                "enrollment_id": enrollment_id,
                "log_date": log_date.isoformat(),
                "tasks": tasks,
                "complete": False,
                "progress_note": note,
                "restart": restart_info,
            }
    cur.execute(
        """SELECT * FROM member_hard_daily_logs
           WHERE enrollment_id = %s AND log_date = %s""",
        (enrollment_id, log_date),
    )
    r = cur.fetchone()
    if not r:
        raise RuntimeError("hard daily log upsert vanished")
    out = {
        "id": int(r["id"]),
        "enrollment_id": int(r["enrollment_id"]),
        "log_date": r["log_date"].isoformat()
        if hasattr(r["log_date"], "isoformat")
        else str(r["log_date"]),
        "tasks": _parse_json(r["tasks_json"]) or {},
        "complete": bool(r["complete"]),
        "progress_note": r.get("progress_note"),
    }
    if restart_info:
        out["restart"] = restart_info
    return out


def list_complete_dates(
    cur, identity_id: int, enrollment_id: int
) -> list[date]:
    cur.execute(
        """SELECT log_date FROM member_hard_daily_logs
           WHERE identity_id = %s AND enrollment_id = %s AND complete = 1
           ORDER BY log_date ASC""",
        (identity_id, enrollment_id),
    )
    out: list[date] = []
    for r in cur.fetchall():
        d = r["log_date"]
        if hasattr(d, "year"):
            out.append(d)
    return out


def compliance_stats(
    cur,
    identity_id: int,
    enrollment_id: int,
    *,
    today: date | None = None,
) -> dict[str, Any]:
    """Streak + completion rate for active enrollment window."""
    en = get_enrollment(cur, identity_id, enrollment_id)
    if not en:
        raise HardDomainError("Enrollment not found")
    today = today or today_eastern()
    completes = set(list_complete_dates(cur, identity_id, enrollment_id))
    # Streak: walk back from today (or yesterday if today incomplete — grace not applied for MT raw yet)
    streak = 0
    cursor = today
    if cursor not in completes:
        cursor = cursor - timedelta(days=1)
    while cursor in completes:
        streak += 1
        cursor = cursor - timedelta(days=1)

    started = en.get("started_at")
    if started and isinstance(started, str):
        # iso from row helper — re-fetch raw if needed
        pass
    cur.execute(
        "SELECT started_at FROM member_hard_enrollments WHERE id = %s",
        (enrollment_id,),
    )
    raw = cur.fetchone()
    start_ts = raw["started_at"] if raw else None
    if start_ts is not None and getattr(start_ts, "tzinfo", None) is None:
        start_d = start_ts.date() if hasattr(start_ts, "date") else today
    elif start_ts is not None:
        start_d = start_ts.astimezone(EASTERN).date()
    else:
        start_d = today

    days_elapsed = max(1, (today - start_d).days + 1)
    window = min(days_elapsed, int(en["sprint_days"]))
    # count complete days in [today - (window-1), today]
    window_start = today - timedelta(days=window - 1)
    complete_in_window = sum(
        1 for d in completes if window_start <= d <= today
    )
    completion_rate = complete_in_window / float(window)
    return {
        "streak_days": streak,
        "complete_days_total": len(completes),
        "complete_days_window": complete_in_window,
        "window_days": window,
        "completion_rate": round(completion_rate, 4),
        "today_complete": today in completes,
    }


def mental_toughness_raw(
    cur,
    identity_id: int,
    *,
    today: date | None = None,
) -> tuple[int | None, bool, dict[str, Any]]:
    """Return (raw_percent | None, empty, detail).

    Empty when no active enrollment. When enrolled, raw is 0–100 (never empty).
    """
    en = get_active_enrollment(cur, identity_id)
    if not en:
        return None, True, {"reason": "not_enrolled"}
    stats = compliance_stats(
        cur, identity_id, int(en["id"]), today=today
    )
    cap = max(1, int(en["sprint_days"]))
    streak_pct = 100.0 * min(stats["streak_days"], cap) / float(cap)
    completion_pct = 100.0 * float(stats["completion_rate"])
    raw = int(round(0.5 * streak_pct + 0.5 * completion_pct))
    raw = max(0, min(100, raw))
    return raw, False, {"enrollment": en, "stats": stats, "raw": raw}


def me_snapshot(cur, identity_id: int, *, today: date | None = None) -> dict[str, Any]:
    today = today or today_eastern()
    active = get_active_enrollment(cur, identity_id)
    restart_event = None
    if active:
        restart_event = apply_miss_restart_if_needed(
            cur, identity_id, int(active["id"]), today=today
        )
        if restart_event:
            active = get_active_enrollment(cur, identity_id)
    variants = list_variants_public()
    mt_raw, mt_empty, mt_detail = mental_toughness_raw(
        cur, identity_id, today=today
    )
    out: dict[str, Any] = {
        "today": today.isoformat(),
        "variants": variants,
        "how_it_works": how_it_works_public(),
        "active_enrollment": active,
        "mental_toughness": {
            "empty": mt_empty,
            "raw_percent": mt_raw,
            "detail": {
                k: v
                for k, v in mt_detail.items()
                if k != "enrollment" or not mt_empty
            },
        },
        "physiology": {
            "required_cite": True,
            "primary": {
                "citation": (
                    "Touroutoglou, A., Andreano, J., Dickerson, B. C., & "
                    "Barrett, L. F. (2020). The tenacious brain: How the "
                    "anterior mid-cingulate contributes to achieving goals. "
                    "Cortex, 123, 12–29."
                ),
                "doi": "https://doi.org/10.1016/j.cortex.2019.09.011",
            },
            "note": (
                "Hard trains mental toughness under voluntary load (aMCC / "
                "willpower literature). MT scores compliance — not a brain scan."
            ),
        },
    }
    if restart_event:
        out["restart"] = restart_event
    if active:
        stats = compliance_stats(
            cur, identity_id, int(active["id"]), today=today
        )
        out["compliance"] = stats
        try:
            v = get_variant(active["variant_id"])
            out["variant"] = {
                "variant_id": active["variant_id"],
                "label": v["label"],
                "tasks": v["tasks"],
                "credit": v.get("credit"),
                "miss_policy": v.get("miss_policy") or "restart",
                "sprint_days": int(v["sprint_days"]),
            }
        except HardDomainError:
            out["variant"] = None
    return out
