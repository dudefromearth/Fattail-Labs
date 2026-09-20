"""VP-L1: Engine payloads may not carry analysis nouns as labels."""

from __future__ import annotations

import json
from typing import Any

FORBIDDEN = (
    "poc",
    "value area",
    "vah",
    "val",
    "vwap",
    "hvn",
    "lvn",
    "node",
    "edge",
    "crevasse",
    "crevice",
    "cliff",
    "level",
    "target",
    "forecast",
    "support",
    "resistance",
)

ALLOWED_TOP = frozenset(
    {
        "kind",
        "symbol",
        "session_date",
        "vp_row",
        "status",
        "flags",
        "gaps",
        "bins",
        "total_volume",
        "parameter_hash",
        "generation_id",
        "excluded_volume",
        "approximation",
    }
)


def lint(payload: dict[str, Any]) -> list[str]:
    blob = json.dumps(payload, sort_keys=True).lower()
    # Spec §7 enum: bar_vwap / bar_close are flags, not analysis nouns.
    blob = blob.replace("bar_vwap", "").replace("bar_close", "")
    hits = [w for w in FORBIDDEN if w in blob]
    return hits


def assert_clean(payload: dict[str, Any]) -> None:
    hits = lint(payload)
    if hits:
        raise ValueError(f"VP-L1 forbidden labels in Engine payload: {hits}")
