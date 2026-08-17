"""Site traffic capture + rollups for the admin Stats section.

record_landing() is called from POST /api/landing for EVERY visit (anonymous
included) — best-effort, never raises. The read helpers power the admin Stats
(Traffic) page: totals, users vs non-users, and acquisition (referrer + UTM).

DISTINCT from activity.py (page_views), which is authenticated in-app engagement.
Referrer + UTM are page-provided (not PII); raw IP is never stored.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import db

log = logging.getLogger("labs.traffic")

# Cheap bot filter — drop obvious crawlers/monitors from traffic counts.
_BOT_RE = re.compile(
    r"bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|"
    r"headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptimerobot|"
    r"curl|wget|python-requests|go-http-client|semrush|ahrefs|mj12|dotbot",
    re.I,
)

_UTM_KEYS = ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content")


def is_bot(user_agent: str | None) -> bool:
    if not user_agent:
        return True  # no UA → treat as non-human noise
    return bool(_BOT_RE.search(user_agent))


def _clean_path(path) -> str | None:
    if not path:
        return None
    p = str(path).split("?", 1)[0].split("#", 1)[0].strip()
    if not p.startswith("/"):
        return None
    if p == "/admin" or p.startswith("/admin/"):
        return None  # operator navigation is not site traffic
    return p[:512]


def _referrer_parts(referrer, self_host: str | None) -> tuple[str | None, str | None]:
    """Return (referrer_host, full_referrer) for EXTERNAL referrers only.

    Same-origin and empty referrers collapse to (None, None) — direct/internal.
    """
    if not referrer:
        return None, None
    ref = str(referrer).strip()[:512]
    try:
        host = (urlparse(ref).hostname or "").lower() or None
    except ValueError:
        return None, None
    if not host:
        return None, None
    if self_host and host == self_host.lower():
        return None, None  # internal referral — not an acquisition source
    return host[:255], ref


def _clean_utm(value) -> str | None:
    if value is None:
        return None
    v = str(value).strip()
    return v[:128] if v else None


def record_landing(
    *,
    visitor_id,
    identity_id,
    path,
    is_landing: bool,
    referrer,
    self_host: str | None,
    utm: dict | None,
    user_agent: str | None,
) -> None:
    """Record one visit. Best-effort; never raises. Drops admin paths + bots."""
    try:
        clean = _clean_path(path)
        if clean is None:
            return
        if is_bot(user_agent):
            return
        vid = None
        if visitor_id:
            v = re.sub(r"[^a-zA-Z0-9]", "", str(visitor_id))[:32]
            vid = v or None
        iid = None
        try:
            iid = int(identity_id) if identity_id else None
            if iid == 0:
                iid = None  # internal admin identity is not a site visitor
        except (TypeError, ValueError):
            iid = None
        ref_host, ref_full = _referrer_parts(referrer, self_host)
        u = utm or {}
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO landing_events
                         (visitor_id, identity_id, path, is_landing, referrer_host,
                          referrer, utm_source, utm_medium, utm_campaign, utm_term,
                          utm_content, user_agent)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        vid,
                        iid,
                        clean,
                        1 if is_landing else 0,
                        ref_host,
                        ref_full,
                        _clean_utm(u.get("utm_source")),
                        _clean_utm(u.get("utm_medium")),
                        _clean_utm(u.get("utm_campaign")),
                        _clean_utm(u.get("utm_term")),
                        _clean_utm(u.get("utm_content")),
                        (user_agent[:512] if user_agent else None),
                    ),
                )
    except Exception as exc:  # noqa: BLE001 — analytics must not break navigation
        log.warning("record_landing failed: %s", exc)


# --- Read-side aggregation (admin Stats) ------------------------------------

def _rows(cur) -> list[dict]:
    return list(cur.fetchall() or [])


def traffic_summary(days: int) -> dict:
    """Everything the Stats (Traffic) page needs, over the last ``days`` days.

    Acquisition breakdowns (referrer / UTM) are computed over LANDINGS
    (is_landing=1) — the session's entry, where the source is meaningful.
    """
    days = max(1, min(int(days or 30), 365))
    since = f"INTERVAL {days} DAY"
    out: dict = {"days": days}

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Totals + users vs non-users.
            cur.execute(
                f"""SELECT
                      COUNT(*) AS pageviews,
                      SUM(is_landing) AS sessions,
                      COUNT(DISTINCT visitor_id) AS visitors,
                      SUM(identity_id IS NOT NULL) AS authed_views,
                      SUM(identity_id IS NULL) AS anon_views,
                      COUNT(DISTINCT CASE WHEN identity_id IS NOT NULL THEN visitor_id END) AS authed_visitors,
                      COUNT(DISTINCT CASE WHEN identity_id IS NULL THEN visitor_id END) AS anon_visitors
                    FROM landing_events
                    WHERE created_at >= (NOW() - {since})"""
            )
            row = cur.fetchone() or {}
            out["totals"] = {
                "pageviews": int(row.get("pageviews") or 0),
                "sessions": int(row.get("sessions") or 0),
                "visitors": int(row.get("visitors") or 0),
                "authed_views": int(row.get("authed_views") or 0),
                "anon_views": int(row.get("anon_views") or 0),
                "authed_visitors": int(row.get("authed_visitors") or 0),
                "anon_visitors": int(row.get("anon_visitors") or 0),
            }

            # Daily series (landings), split authed / anon.
            cur.execute(
                f"""SELECT DATE(created_at) AS day,
                           SUM(is_landing) AS sessions,
                           SUM(CASE WHEN is_landing=1 AND identity_id IS NOT NULL THEN 1 ELSE 0 END) AS authed,
                           SUM(CASE WHEN is_landing=1 AND identity_id IS NULL THEN 1 ELSE 0 END) AS anon
                    FROM landing_events
                    WHERE created_at >= (NOW() - {since})
                    GROUP BY DATE(created_at) ORDER BY day"""
            )
            out["daily"] = [
                {
                    "day": str(r.get("day")),
                    "sessions": int(r.get("sessions") or 0),
                    "authed": int(r.get("authed") or 0),
                    "anon": int(r.get("anon") or 0),
                }
                for r in _rows(cur)
            ]

            # Acquisition breakdowns over landings.
            def _breakdown(column: str, label_when_null: str) -> list[dict]:
                cur.execute(
                    f"""SELECT COALESCE(NULLIF(TRIM({column}), ''), %s) AS label,
                               COUNT(*) AS sessions
                        FROM landing_events
                        WHERE is_landing = 1 AND created_at >= (NOW() - {since})
                        GROUP BY label ORDER BY sessions DESC LIMIT 15""",
                    (label_when_null,),
                )
                return [
                    {"label": str(r.get("label")), "sessions": int(r.get("sessions") or 0)}
                    for r in _rows(cur)
                ]

            out["by_source"] = _breakdown("utm_source", "(none)")
            out["by_medium"] = _breakdown("utm_medium", "(none)")
            out["by_campaign"] = _breakdown("utm_campaign", "(none)")
            out["by_referrer"] = _breakdown("referrer_host", "(direct)")
            out["by_landing_page"] = _breakdown("path", "(unknown)")

    return out
