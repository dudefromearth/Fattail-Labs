"""Progress refresh — fetch each source, compute, snapshot.

Per-source isolation is the whole point: a dead YouTube token must not blank
the WooCommerce panel. Each source is fetched and stored independently, with
its own status and error, so the page can show three different freshness states
at once and never invents a zero for a source it could not reach.

Called by the launchd job (infra/launchd/ai.fattail.labs.progress-refresh) and
by POST /api/admin/progress/refresh.
"""

from __future__ import annotations

import datetime as dt
import json
import logging
import time

import db
from progress import sources_ac, sources_woo, sources_youtube

log = logging.getLogger("labs.progress.refresh")

SOURCES = {
    "woocommerce": sources_woo.fetch,
    "youtube": sources_youtube.fetch,
    "activecampaign": sources_ac.fetch,
}


def refresh_source(name: str, months: int = 8, now: dt.datetime | None = None) -> dict:
    """Fetch and store one source. Never raises — the outcome is the return value."""
    if name not in SOURCES:
        raise ValueError(f"unknown progress source {name!r}")
    started = time.monotonic()
    captured = now or dt.datetime.utcnow()
    try:
        payload = SOURCES[name](months=months, now=captured)
        status, error = "ok", None
    except Exception as exc:  # noqa: BLE001 — recorded, not swallowed
        payload, status, error = None, "failed", f"{type(exc).__name__}: {exc}"
        log.warning("progress source %s failed: %s", name, error)
    duration_ms = int((time.monotonic() - started) * 1000)
    with db.transaction() as cur:
        cur.execute(
            "INSERT INTO progress_snapshot "
            "(source, captured_at, status, error, duration_ms, payload) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (name, captured, status, error, duration_ms,
             json.dumps(payload) if payload is not None else None),
        )
    return {"source": name, "status": status, "error": error,
            "duration_ms": duration_ms,
            "counts": (payload or {}).get("counts") if payload else None}


def refresh_all(months: int = 8) -> list[dict]:
    now = dt.datetime.utcnow()
    return [refresh_source(name, months=months, now=now) for name in SOURCES]


def latest(source: str) -> dict | None:
    """Most recent SUCCESSFUL snapshot for a source, payload decoded."""
    with db.transaction() as cur:
        cur.execute(
            "SELECT captured_at, payload FROM progress_snapshot "
            "WHERE source = %s AND status = 'ok' ORDER BY captured_at DESC LIMIT 1",
            (source,),
        )
        row = cur.fetchone()
    if not row:
        return None
    payload = row["payload"]
    if isinstance(payload, str):
        payload = json.loads(payload)
    return {"captured_at": row["captured_at"], "payload": payload}


def last_attempt(source: str) -> dict | None:
    """Most recent attempt of any status — how a failure surfaces on the page."""
    with db.transaction() as cur:
        cur.execute(
            "SELECT captured_at, status, error FROM progress_snapshot "
            "WHERE source = %s ORDER BY captured_at DESC LIMIT 1",
            (source,),
        )
        return cur.fetchone()


def prune(keep_days: int = 30) -> int:
    """Snapshots are telemetry, not a ledger. Old rows go."""
    cutoff = dt.datetime.utcnow() - dt.timedelta(days=keep_days)
    with db.transaction() as cur:
        cur.execute("DELETE FROM progress_snapshot WHERE captured_at < %s", (cutoff,))
        return cur.rowcount


if __name__ == "__main__":  # launchd entry point
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    for result in refresh_all():
        log.info("refresh %s -> %s", result["source"], result["status"])
    prune()
