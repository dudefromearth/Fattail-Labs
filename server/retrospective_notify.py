"""Retrospective material-ready notification (Spec v0.7.1 §14 · R7).

Material-based, not chore-based. Once per period. Never during RTH.
Open-position check fails soft — never leaks position detail in logs.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import journal_session_domain as jsd
import member_notify as mn
import retrospective_domain as rd

log = logging.getLogger("labs.retrospective_notify")

# Soft thresholds for "material ready"
MIN_MATERIAL_TRADES = 1
MIN_MATERIAL_JOURNAL_DAYS = 1


def period_key_for_scope(
    *,
    prior_id: int | None,
    is_maiden: bool,
    identity_id: int,
) -> str:
    if prior_id is not None:
        return f"after:{int(prior_id)}"
    if is_maiden:
        return f"maiden:{int(identity_id)}"
    return f"open:{int(identity_id)}"


def check_open_positions(cur, identity_id: int) -> str:
    """Return ``clear`` | ``open`` | ``unavailable``.

    Trade log v1.1 does not model open/closed positions as a first-class flag.
    Spec §14: when unavailable, fail soft — do not block, do not leak.
    """
    try:
        # Probe that the book is queryable; no open-state column exists.
        cur.execute(
            """SELECT 1 FROM member_trade_log_trades
               WHERE identity_id = %s LIMIT 1""",
            (int(identity_id),),
        )
        cur.fetchone()
        # Unavailable: no honest open-position signal in schema
        return "unavailable"
    except Exception:
        # Fail soft — never surface exception detail about positions
        log.info(
            "open_position_check_unavailable identity=%s",
            int(identity_id),
        )
        return "unavailable"


def _material_counts(
    cur,
    identity_id: int,
    scope_start: datetime,
    scope_end: datetime,
    *,
    is_maiden: bool,
) -> dict[str, Any]:
    """Light material inventory for notification copy (in-app Family B only)."""
    op = ">=" if is_maiden else ">"
    start = rd._as_naive_utc(scope_start)
    end = rd._as_naive_utc(scope_end)

    cur.execute(
        f"""SELECT COUNT(*) AS n,
                   SUM(CASE WHEN adherence = 'broke' THEN 1 ELSE 0 END) AS broke
            FROM member_trade_log_trades
            WHERE identity_id = %s
              AND exec_at {op} %s AND exec_at <= %s""",
        (int(identity_id), start, end),
    )
    row = cur.fetchone() or {}
    trade_count = int(row.get("n") or 0)
    broke = int(row.get("broke") or 0)

    # Behavior tag applications in window (join sessions/trades)
    tag_rows = rd._collect_period_tag_rows(
        cur, identity_id, start, end, is_maiden=is_maiden
    )
    behavior: dict[str, int] = {}
    for r in tag_rows:
        if (r.get("category_key") or "").lower() != "behavior":
            continue
        lab = str(r.get("label") or r.get("slug") or "tag")
        behavior[lab] = behavior.get(lab, 0) + 1
    top_behavior = sorted(behavior.items(), key=lambda x: -x[1])

    journal_days = 0
    try:
        days = jsd.list_member_message_ny_dates(
            cur, identity_id, since=start, until=end
        )
        journal_days = len(days or [])
    except Exception:
        journal_days = 0

    return {
        "trade_count": trade_count,
        "broke_count": broke,
        "deviation_count": broke,  # process damage proxy for copy
        "journal_days": journal_days,
        "behavior_tags": [
            {"label": lab, "count": n} for lab, n in top_behavior[:3]
        ],
    }


def _has_enough_material(counts: dict[str, Any]) -> bool:
    if int(counts.get("trade_count") or 0) >= MIN_MATERIAL_TRADES:
        return True
    if int(counts.get("journal_days") or 0) >= MIN_MATERIAL_JOURNAL_DAYS:
        return True
    if counts.get("behavior_tags"):
        return True
    return False


def _material_copy(counts: dict[str, Any], *, cadence_days: int) -> tuple[str, str]:
    """Material preview — never 'your retrospective is due' (chore)."""
    unit = "week" if cadence_days == 7 else "period"
    title = f"Your {unit} is ready"
    parts: list[str] = []
    tc = int(counts.get("trade_count") or 0)
    if tc:
        parts.append(f"{tc} trade{'s' if tc != 1 else ''}")
    dev = int(counts.get("deviation_count") or 0)
    if dev:
        parts.append(f"{dev} deviation{'s' if dev != 1 else ''}")
    tags = counts.get("behavior_tags") or []
    if tags:
        t0 = tags[0]
        lab = t0.get("label") or "tag"
        n = int(t0.get("count") or 0)
        if n == 1:
            parts.append(f'you named "{lab}" once')
        else:
            parts.append(f'you named "{lab}" {n} times')
    jd = int(counts.get("journal_days") or 0)
    if not parts and jd:
        parts.append(
            f"{jd} journal day{'s' if jd != 1 else ''} of your words"
        )
    if not parts:
        body = f"Your {unit} has material waiting when you're ready."
    else:
        body = f"Your {unit} is ready — " + ", ".join(parts) + "."
    return title, body


def _period_elapsed(
    scope: dict[str, Any],
    cadence_days: int,
    *,
    now: datetime,
) -> bool:
    """Material available when enough calendar days have passed since prior complete
    (or maiden has any scope span). Not a due-date chore."""
    start = rd._as_naive_utc(scope["scope_start"])
    end = rd._as_naive_utc(now)
    span = max(0, (end - start).days)
    if scope.get("is_maiden"):
        # Maiden: ready when there is any practice span with material
        return span >= 0
    return span >= max(1, int(cadence_days) - 1)


def evaluate_and_maybe_notify(
    cur,
    identity_id: int,
    *,
    role: str = "activator",
    now: datetime | None = None,
    force_ignore_rth: bool = False,
) -> dict[str, Any]:
    """Evaluate material readiness and create at most one in-app notification.

    Returns status dict — never includes open-position detail on suppress paths.
    """
    now = now or datetime.now(timezone.utc)
    now_n = rd._as_naive_utc(now)

    policy = mn.channel_policy()

    # Entitlement
    if not rd.can_create_or_gather(cur, identity_id, role):
        return {
            "status": "skipped",
            "reason": "not_entitled",
            "channel_policy": policy,
            "notification": None,
        }

    # Already open retrospective — no material ping (they're already in it)
    open_r = rd.open_retrospective(cur, identity_id)
    if open_r:
        return {
            "status": "skipped",
            "reason": "open_retrospective",
            "channel_policy": policy,
            "notification": None,
        }

    scope = rd.resolve_scope(cur, identity_id, now=now)
    cadence = rd.effective_cadence_days(cur, identity_id, {"role": role})
    pkey = period_key_for_scope(
        prior_id=scope.get("prior_id"),
        is_maiden=bool(scope.get("is_maiden")),
        identity_id=identity_id,
    )

    # Once per period
    if mn.has_period_notification(
        cur, identity_id, kind=mn.KIND_RETRO_MATERIAL, period_key=pkey
    ):
        existing = None
        cur.execute(
            """SELECT id, kind, title, body, href, channel, period_key,
                      resource_type, resource_id, payload_json, email_status,
                      suppressed_reason, read_at, created_at
               FROM member_notifications
               WHERE identity_id = %s AND kind = %s AND period_key = %s
               LIMIT 1""",
            (int(identity_id), mn.KIND_RETRO_MATERIAL, pkey),
        )
        row = cur.fetchone()
        if row and row.get("suppressed_reason") is None:
            existing = mn.serialize_notification(row)
        return {
            "status": "already_sent",
            "reason": "once_per_period",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": existing,
        }

    # RTH gate
    if not force_ignore_rth and mn.is_regular_trading_hours(now):
        return {
            "status": "suppressed",
            "reason": "rth",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": None,
            # No position / market detail in logs
        }

    # Open positions — fail soft; if known open, suppress without detail
    pos = check_open_positions(cur, identity_id)
    if pos == "open":
        log.info(
            "retro_notify_suppressed reason=open_positions identity=%s",
            int(identity_id),
        )
        return {
            "status": "suppressed",
            "reason": "open_positions",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": None,
        }
    # unavailable → proceed (soft fail); clear → proceed

    if not _period_elapsed(scope, cadence, now=now_n):
        return {
            "status": "skipped",
            "reason": "period_not_elapsed",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": None,
        }

    counts = _material_counts(
        cur,
        identity_id,
        scope["scope_start"],
        now_n,
        is_maiden=bool(scope["is_maiden"]),
    )
    if not _has_enough_material(counts):
        return {
            "status": "skipped",
            "reason": "no_material",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": None,
        }

    title, body = _material_copy(counts, cadence_days=cadence)
    # Payload is Family B — in-app only (never emailed under current policy)
    payload = {
        "material": counts,
        "period_key": pkey,
        "channel": "in_app",
        "family_b": True,
        "open_position_check": pos,  # clear|unavailable only in success path
    }

    created = mn.create_in_app(
        cur,
        identity_id=identity_id,
        kind=mn.KIND_RETRO_MATERIAL,
        title=title,
        body=body,
        href="/app/retrospective",
        period_key=pkey,
        resource_type="retrospective_period",
        resource_id=pkey,
        payload=payload,
    )
    if created is None:
        return {
            "status": "already_sent",
            "reason": "once_per_period",
            "period_key": pkey,
            "channel_policy": policy,
            "notification": None,
        }

    return {
        "status": "created",
        "reason": None,
        "period_key": pkey,
        "channel_policy": policy,
        "notification": created,
    }
