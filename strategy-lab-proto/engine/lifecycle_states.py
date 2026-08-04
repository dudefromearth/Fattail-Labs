"""Phase-local strategy states for Strategy Lab life cycle.

Phases (bins):
  development → curation → deployment · bin (off-ramp)

Development "Deployed" means ready for curation (sim/live capable handoff).
Deployment "Strategy" is the handoff *from* curation into the deploy phase.
"""

from __future__ import annotations

from typing import Any

# Canonical phase keys (UI + store)
PHASES: tuple[str, ...] = ("development", "curation", "deployment", "bin")

PHASE_LABELS: dict[str, str] = {
    "development": "Development",
    "curation": "Curation",
    "deployment": "Deployment",
    "bin": "Bin",
}

# Legacy aliases → canonical phase
PHASE_ALIASES: dict[str, str] = {
    "development": "development",
    "develop": "development",
    "design": "development",  # renamed Design → Development
    "curation": "curation",
    "curate": "curation",
    "deployment": "deployment",
    "deploy": "deployment",
    "campaign": "deployment",
    "bin": "bin",
    "killed": "bin",
    "archive": "bin",
}

# Ordered states per phase: (key, label)
DEVELOPMENT_STATES: list[tuple[str, str]] = [
    ("hypothesis", "Hypothesis"),
    ("model", "Model"),
    ("is_test", "In-sample test"),
    ("oos_test", "OOS test"),
    ("deployed", "Deployed"),  # ready for curation / sim or live
]

CURATION_STATES: list[tuple[str, str]] = [
    ("categorized", "Categorized"),
    ("grouped", "Grouped"),
    ("position_sized", "Position sized"),
    ("monitored", "Monitored"),
]

# Deployment includes run-control variants as peer states under step 4
DEPLOYMENT_STATES: list[tuple[str, str]] = [
    ("strategy", "Strategy"),  # handoff from curation — ready to schedule
    ("capital_allocation", "Capital allocation"),
    ("scheduled", "Scheduled"),
    ("started", "Started"),
    ("paused", "Paused"),
    ("stopped", "Stopped"),
    ("ended", "Ended"),
    ("pruned", "Pruned"),
    ("retrospective", "Retrospective"),
]

BIN_STATES: list[tuple[str, str]] = [
    ("retired", "Retired"),
    ("trashed", "Trashed"),
]

PHASE_STATES: dict[str, list[tuple[str, str]]] = {
    "development": DEVELOPMENT_STATES,
    "curation": CURATION_STATES,
    "deployment": DEPLOYMENT_STATES,
    "bin": BIN_STATES,
}

# Default phase_state when entering a phase
DEFAULT_PHASE_STATE: dict[str, str] = {
    "development": "hypothesis",
    "curation": "categorized",
    "deployment": "strategy",
    "bin": "retired",
}

# Map legacy design_state / health → development phase_state
_LEGACY_DESIGN_TO_DEV: dict[str, str] = {
    "new": "hypothesis",
    "in_process": "model",
    "mature": "deployed",
    "sick": "model",
    "hypothesis": "hypothesis",
    "model": "model",
    "is_test": "is_test",
    "oos_test": "oos_test",
    "deployed": "deployed",
}


def normalize_phase(raw: str | None) -> str:
    key = (raw or "development").strip().lower()
    return PHASE_ALIASES.get(key, "development")


def state_keys(phase: str) -> list[str]:
    return [k for k, _ in PHASE_STATES.get(normalize_phase(phase), [])]


def state_label(phase: str, state_key: str) -> str:
    phase = normalize_phase(phase)
    for k, lab in PHASE_STATES.get(phase, []):
        if k == state_key:
            return lab
    return state_key.replace("_", " ").title()


def state_order(phase: str) -> dict[str, int]:
    return {k: i for i, (k, _) in enumerate(PHASE_STATES.get(normalize_phase(phase), []))}


def default_state(phase: str) -> str:
    return DEFAULT_PHASE_STATE.get(normalize_phase(phase), "hypothesis")


def normalize_phase_state(phase: str, raw: str | None, *, legacy_row: dict[str, Any] | None = None) -> str:
    """Return a valid phase_state for the given phase."""
    phase = normalize_phase(phase)
    keys = state_keys(phase)
    if not keys:
        return "active"
    candidate = (raw or "").strip().lower()
    if candidate in keys:
        return candidate
    # Legacy design_state / health when entering development
    if phase == "development" and legacy_row:
        leg = str(
            legacy_row.get("design_state")
            or legacy_row.get("health")
            or ""
        ).lower()
        mapped = _LEGACY_DESIGN_TO_DEV.get(leg)
        if mapped in keys:
            return mapped
    # Bin disposition
    if phase == "bin":
        if candidate in ("retired", "trashed"):
            return candidate
        if legacy_row and legacy_row.get("kill_reason"):
            return "retired"
        return "trashed"
    return default_state(phase)


def next_state(phase: str, current: str) -> str | None:
    """Next ordered state within phase, or None if at end."""
    keys = state_keys(phase)
    if current not in keys:
        return keys[0] if keys else None
    i = keys.index(current)
    if i + 1 < len(keys):
        return keys[i + 1]
    return None


def ready_for_curation(phase_state: str) -> bool:
    """Development Deployed → eligible for curation."""
    return phase_state == "deployed"
