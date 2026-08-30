"""Time Machine hold resident-bytes. C11 watch — data, not a support ticket."""

from __future__ import annotations

import logging
from typing import Any

import db

log = logging.getLogger("labs.tm_hold")

THIN_HEAP_BYTES = 400 * 1024 * 1024


def record_hold_resident(
    identity_id: int,
    *,
    day: str,
    symbol: str,
    gen_count: int,
    heap_bytes: int | None,
    fidelity: float | None,
) -> None:
    """Best-effort. Never raise into the replay path."""
    try:
        if not identity_id or int(identity_id) == 0:
            return
        d = str(day).strip()[:10]
        sym = str(symbol).strip().upper()[:16]
        n = int(gen_count)
        if len(d) != 10 or not sym or n < 0:
            return
        heap = int(heap_bytes) if heap_bytes is not None else None
        if heap is not None and heap < 0:
            heap = None
        fid = float(fidelity) if fidelity is not None else None
        if fid is not None:
            fid = max(0.0, min(1.0, fid))
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO tm_hold_resident
                       (identity_id, day, symbol, gen_count, heap_bytes, fidelity)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (int(identity_id), d, sym, n, heap, fid),
                )
    except Exception as exc:  # noqa: BLE001
        log.warning("record_hold_resident failed: %s", exc)


def summarize_holds() -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM tm_hold_resident")
            n_all_row = cur.fetchone() or {}
            cur.execute(
                """
                SELECT
                  COUNT(*) AS n,
                  AVG(heap_bytes) AS heap_avg,
                  MIN(heap_bytes) AS heap_min,
                  MAX(heap_bytes) AS heap_max,
                  AVG(gen_count) AS gen_avg,
                  MAX(gen_count) AS gen_max,
                  SUM(heap_bytes >= %s) AS n_over_thin
                FROM tm_hold_resident
                WHERE heap_bytes IS NOT NULL
                """,
                (THIN_HEAP_BYTES,),
            )
            row = cur.fetchone() or {}
            cur.execute(
                """
                SELECT day, symbol, gen_count, heap_bytes, fidelity, created_at
                FROM tm_hold_resident
                WHERE heap_bytes IS NOT NULL
                ORDER BY heap_bytes DESC, created_at DESC
                LIMIT 8
                """
            )
            large = list(cur.fetchall() or [])
    n = int(row.get("n") or 0)
    return {
        "n_holds": int(n_all_row.get("n") or 0),
        "n": n,
        "heap_avg": int(row["heap_avg"]) if row.get("heap_avg") is not None else None,
        "heap_min": int(row["heap_min"]) if row.get("heap_min") is not None else None,
        "heap_max": int(row["heap_max"]) if row.get("heap_max") is not None else None,
        "gen_avg": float(row["gen_avg"]) if row.get("gen_avg") is not None else None,
        "gen_max": int(row["gen_max"]) if row.get("gen_max") is not None else None,
        "n_over_400mb": int(row.get("n_over_thin") or 0),
        "thin_threshold_bytes": THIN_HEAP_BYTES,
        "largest": [
            {
                "day": str(r.get("day")),
                "symbol": r.get("symbol"),
                "gen_count": int(r.get("gen_count") or 0),
                "heap_bytes": int(r.get("heap_bytes") or 0),
                "fidelity": float(r["fidelity"]) if r.get("fidelity") is not None else None,
                "created_at": r["created_at"].isoformat()
                if r.get("created_at") is not None
                else None,
            }
            for r in large
        ],
        "api_version": 1,
    }
