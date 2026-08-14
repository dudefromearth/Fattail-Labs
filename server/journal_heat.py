"""Request-time derived open-book heat gate (Journal Session v0.7 §5.2)."""

from __future__ import annotations

import logging
from typing import Any

log = logging.getLogger("labs.journal_heat")


def identity_has_unmatched_open(cur, identity_id: int) -> bool:
    """True if any unmatched open exists on any *active* account right now.

    Journal date is not an input. Fail-closed: any load/match error → True.
    """
    try:
        from routes.trade_log.common import _load_member_book
        from trade_log_domain.matching import match_open_close

        trades, accounts = _load_member_book(cur, int(identity_id), None)
        active_ids = {
            int(a["id"])
            for a in (accounts or [])
            if str(a.get("status") or "active") == "active" and a.get("id") is not None
        }
        scoped = [
            t
            for t in (trades or [])
            if int(t.get("account_id") or 0) in active_ids or not active_ids
        ]
        if not scoped:
            return False
        matched = match_open_close(scoped)
        return any(m.get("close") is None for m in matched)
    except Exception as exc:
        log.warning(
            "open-book check failed identity=%s — restrain: %s",
            identity_id,
            exc,
        )
        return True


def looks_like_analysis_request(text: str | None) -> bool:
    """Member asked for a read / opinion — heat must still refuse analysis."""
    t = (text or "").strip().lower()
    if not t:
        return False
    needles = (
        "what do you think",
        "what should i",
        "should i",
        "analyze",
        "analyse",
        "your take",
        "your opinion",
        "is this a good",
        "do you like",
        "would you",
    )
    return any(n in t for n in needles)
