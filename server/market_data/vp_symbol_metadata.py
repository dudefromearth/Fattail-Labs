"""VP-L3 symbol-metadata (session calendar). History is the first live consumer
of the registry ``metadata_ref`` join. Does not amend the VPS Engine spec.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

# CME Globex equity-index futures (ES/MES): Sun 18:00 ET → Fri 17:00 ET,
# daily halt 17:00–18:00 ET ≈ 23 hours of session per counted day.
_CME_EQUITY_INDEX: dict[str, Any] = {
    "session_id": "cme-equity-index-futures",
    # Dec 2026 ES listed ~Sep 2025 (Coach REQ-006). ~470 calendar days before 3rd Friday.
    "listing_lead_days": 470,
    "bars_per_session": {
        "1m": 1380,
        "5m": 276,
        "15m": 92,
        "1h": 23,
        "1d": 1,
    },
}

METADATA: dict[str, dict[str, Any]] = {
    "vps:symbol-metadata:ES": dict(_CME_EQUITY_INDEX),
    "vps:symbol-metadata:MES": dict(_CME_EQUITY_INDEX),
}


def metadata_ref_for(symbol: str) -> str:
    return f"vps:symbol-metadata:{symbol.upper()}"


def session_calendar(source: str) -> dict[str, Any]:
    ref = metadata_ref_for(source)
    row = METADATA.get(ref)
    if not row:
        raise KeyError(f"no VP-L3 session calendar for {ref}")
    return row


def bars_per_session(source: str, tf: str) -> int:
    cal = session_calendar(source)
    n = int(cal["bars_per_session"][tf])
    if n < 1:
        raise ValueError(f"bars_per_session {tf}={n}")
    return n


def walk_session_start(end: date, sessions: int) -> date:
    """Walk back `sessions` Globex session days (skip Saturday)."""
    d = end
    counted = 0
    guard = 0
    need = max(1, sessions)
    while counted < need and guard < 20000:
        guard += 1
        d -= timedelta(days=1)
        if d.weekday() == 5:
            continue
        counted += 1
    return d
