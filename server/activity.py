"""User activity capture + rollups for the admin Users section.

Two write paths, both best-effort (never raise to the caller — logging and
navigation must not fail if analytics writes fail):
  - record_login(): called from the auth session choke-point on every login.
  - record_pageview(): called from POST /api/pageview for authenticated members.

Plus pure helpers used by routes/users_admin.py for read-side aggregation
(notably estimate_sessions for gap-based time-on-platform).

Auth is stateless JWT, so login_events is the sole source of login history.
Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.
"""

from __future__ import annotations

import logging

import db

log = logging.getLogger("labs.activity")

# Inactivity gap that splits one browsing session from the next (GA-style).
SESSION_GAP_SECONDS = 30 * 60


def clean_path(path) -> str | None:
    """Normalise a client-reported path, or None if it should not be recorded.

    Strips query/fragment, requires a leading slash, and drops admin routes
    (operator navigation is not member engagement).
    """
    if not path:
        return None
    p = str(path).split("?", 1)[0].split("#", 1)[0].strip()
    if not p.startswith("/"):
        return None
    if p == "/admin" or p.startswith("/admin/"):
        return None
    return p[:512]


def record_login(identity_id: int, provider: str, role: str, *, request=None) -> None:
    """Record a successful login. Best-effort; never raises. Skips internal id 0."""
    try:
        if not identity_id or int(identity_id) == 0:
            return
    except (TypeError, ValueError):
        return
    ip = None
    ua = None
    if request is not None:
        try:
            ip = request.client.host if request.client else None
            ua = request.headers.get("user-agent")
        except Exception:  # noqa: BLE001
            ip, ua = None, None
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO login_events (identity_id, provider, role, ip, user_agent)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (
                        int(identity_id),
                        str(provider)[:64],
                        str(role)[:32],
                        (ip or None),
                        (ua[:512] if ua else None),
                    ),
                )
    except Exception as exc:  # noqa: BLE001 — analytics must not break login
        log.warning("record_login failed for identity %s: %s", identity_id, exc)


def record_pageview(identity_id: int, path) -> None:
    """Record one member page view. Best-effort; never raises. Skips id 0/admin."""
    try:
        if not identity_id or int(identity_id) == 0:
            return
    except (TypeError, ValueError):
        return
    p = clean_path(path)
    if p is None:
        return
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO page_views (identity_id, path) VALUES (%s, %s)",
                    (int(identity_id), p),
                )
    except Exception as exc:  # noqa: BLE001 — analytics must not break navigation
        log.warning("record_pageview failed for identity %s: %s", identity_id, exc)


def estimate_sessions(timestamps_epoch: list[int]) -> dict:
    """Gap-based sessionisation of navigation timestamps (epoch seconds).

    Events within SESSION_GAP_SECONDS of each other belong to one session; a
    larger gap starts a new one. Time-on-platform = sum of (last-first) within
    each session. A single-event session contributes 0 measurable seconds — we
    cannot know dwell on a lone page view without heartbeats, so we do not guess.

    Returns {"sessions": int, "seconds": int}.
    """
    ts = sorted(int(t) for t in timestamps_epoch)
    if not ts:
        return {"sessions": 0, "seconds": 0}
    sessions = 1
    seconds = 0
    start = prev = ts[0]
    for t in ts[1:]:
        if t - prev > SESSION_GAP_SECONDS:
            seconds += prev - start
            sessions += 1
            start = t
        prev = t
    seconds += prev - start
    return {"sessions": sessions, "seconds": seconds}
