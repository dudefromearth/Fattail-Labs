"""Butterfly UI definition."""

from __future__ import annotations

from typing import Any


def get_ui_definition() -> dict[str, Any]:
    return {
        "layout": "tabs",
        "livePreview": True,
        "sections": [
            {"id": "identity", "title": "Identity\n& Direction"},
            {"id": "structure", "title": "Structure\n& Style"},
            {"id": "risk", "title": "Risk\n& Capital"},
            {"id": "edge", "title": "Convexity\n& Debit"},
            {"id": "timing", "title": "Timing\n& Entry"},
            {"id": "exits", "title": "Exit\nRules"},
            {"id": "review", "title": "Review"},
        ],
    }
