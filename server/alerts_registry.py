"""Frozen Alerts Manager suite registry (ALM §3.1)."""

from __future__ import annotations

import os

REGISTRY: dict[str, dict] = {
    "analyzer_risk_graph": {
        "suite": "options_lab",
        "types": ("canvas", "position"),
    },
    "options_lab_heatmap": {
        "suite": "options_lab",
        "types": (),
    },
}

SEVERITIES = frozenset({"info", "low", "medium", "high", "critical"})
CLASSES = frozenset({"threshold", "algo", "prompt", "system"})


def alerts_manager_enabled() -> bool:
    raw = (os.environ.get("LABS_ALERTS_MANAGER") or "").strip().lower()
    if not raw or raw in ("0", "false", "no", "off"):
        return False
    if raw in ("1", "true", "yes", "on"):
        return True
    raise RuntimeError(
        f"LABS_ALERTS_MANAGER must be 0|1|true|false|yes|no|on|off, got {raw!r}"
    )


def lookup(source_system: str) -> dict | None:
    return REGISTRY.get(source_system)
