"""Feature flag, percentage split, kill switch.

bucket = first 8 hex chars of sha256(visitor_key), as int, mod 100.
Admitted when the flag is on, the kill switch is off, and bucket < percent.
0% admits nobody. 100% admits everybody. A partial percent with no visitor
key fails closed (not admitted).
"""

from __future__ import annotations

import hashlib


def bucket_for(visitor_key: str) -> int:
    key = (visitor_key or "").strip()
    if not key:
        raise ValueError("visitor_key is required")
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 100


def admission(offers: dict, visitor_key: str | None) -> dict:
    flag = bool(offers["feature_flag"])
    kill = bool(offers["kill_switch"])
    percent = int(offers["traffic_percent"])
    key = (visitor_key or "").strip()
    if kill or not flag or percent <= 0:
        admitted = False
        bucket = None
    elif percent >= 100:
        admitted = True
        bucket = None
    elif not key:
        admitted = False
        bucket = None
    else:
        bucket = bucket_for(key)
        admitted = bucket < percent
    needs_visitor = flag and not kill and 0 < percent < 100 and not key
    return {
        "admitted": admitted,
        "needs_visitor": needs_visitor,
        "traffic_percent": percent,
        "feature_flag": flag,
        "kill_switch": kill,
        "bucket": bucket,
    }
