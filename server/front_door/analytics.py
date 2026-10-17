"""Checkout drop-off counts. Rows are visitor events, not member profiles."""

from __future__ import annotations

EVENTS = frozenset(
    {
        "view",
        "product_selected",
        "terms_checked",
        "handoff",
        "dropoff",
        "confirmation",
        "nudge_shown",
    }
)

_DONE = frozenset({"handoff", "confirmation"})


class AnalyticsError(ValueError):
    pass


def normalize_event(body: dict) -> dict:
    if not isinstance(body, dict):
        raise AnalyticsError("event must be an object")
    name = body.get("event")
    if name not in EVENTS:
        raise AnalyticsError(f"unknown analytics event {name!r}")
    visitor = body.get("visitor_key")
    if not isinstance(visitor, str) or len(visitor.strip()) < 8:
        raise AnalyticsError("visitor_key is required")
    entry = body.get("entry")
    if entry is not None and entry not in {"start", "watch", "order", "confirm"}:
        raise AnalyticsError("entry is not a front-door page")
    product_id = body.get("product_id")
    if product_id is not None and not isinstance(product_id, str):
        raise AnalyticsError("product_id must be a string or null")
    origin = body.get("origin")
    if origin not in {"website", "email", "qr"}:
        origin = None
    email = body.get("email")
    if not isinstance(email, str) or not email.strip():
        email = None
    else:
        email = email.strip().lower()
    return {
        "event": name,
        "visitor_key": visitor.strip(),
        "entry": entry,
        "product_id": product_id,
        "step": body.get("step") if isinstance(body.get("step"), str) else None,
        "origin": origin,
        "email": email,
    }


def dropoff_summary(rows: list[dict]) -> dict:
    by_visitor: dict[str, set[str]] = {}
    for row in rows:
        by_visitor.setdefault(row["visitor_key"], set()).add(row["event"])
    started = 0
    completed = 0
    explicit_drop = 0
    for events in by_visitor.values():
        if "view" in events or "product_selected" in events:
            started += 1
            if events & _DONE:
                completed += 1
            elif "dropoff" in events:
                explicit_drop += 1
    dropped = started - completed
    by_origin = {
        name: {"started": 0, "completed": 0, "dropped": 0}
        for name in ("website", "email", "qr", "unknown")
    }
    origin_for: dict[str, str] = {}
    for row in rows:
        key = row["visitor_key"]
        origin = row.get("origin")
        if key not in origin_for and origin in by_origin:
            origin_for[key] = origin
    for key, events in by_visitor.items():
        if "view" not in events and "product_selected" not in events:
            continue
        bucket = by_origin[origin_for.get(key, "unknown")]
        bucket["started"] += 1
        if events & _DONE:
            bucket["completed"] += 1
        else:
            bucket["dropped"] += 1
    return {
        "visitors": len(by_visitor),
        "checkout_started": started,
        "handoff_or_confirmation": completed,
        "dropped": dropped,
        "explicit_dropoff_events": explicit_drop,
        "by_origin": by_origin,
    }
