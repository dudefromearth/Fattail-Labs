"""Butterfly UI definition."""

from __future__ import annotations

from typing import Any


def get_ui_definition() -> dict[str, Any]:
    return {
        "layout": "stepper",
        "livePreview": True,
        "sections": [
            {"id": "identity", "title": "Strategy Identity & Direction"},
            {"id": "structure", "title": "Structure & Style"},
            {"id": "risk", "title": "Risk & Capital"},
            {"id": "edge", "title": "Convexity & Debit Rules"},
            {"id": "timing", "title": "Timing, Regime & Entry"},
            {"id": "exits", "title": "Exit Rules"},
            {"id": "review", "title": "Review & Create Version"},
        ],
    }
