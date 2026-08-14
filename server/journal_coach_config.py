"""Fail-loud Coach charter config (Journal Session v0.7 §4.4–4.5)."""

from __future__ import annotations

import os

EFFORT_KEYS = ("day_open", "surface", "extract", "mechanical_turn")
POSTURE_VALUES = ("forward", "laid_back")


class CoachConfigError(RuntimeError):
    """Missing or invalid LABS_COACH_* — fail loud."""


def require_coach_config() -> dict[str, str | dict[str, str]]:
    raw_posture = (os.environ.get("LABS_COACH_POSTURE_DEFAULT") or "").strip()
    if not raw_posture:
        raise CoachConfigError(
            "Missing required environment variable: LABS_COACH_POSTURE_DEFAULT"
        )
    posture = raw_posture.lower()
    if posture not in POSTURE_VALUES:
        raise CoachConfigError(
            f"LABS_COACH_POSTURE_DEFAULT must be one of {POSTURE_VALUES}, got {raw_posture!r}"
        )

    provider = (os.environ.get("LABS_COACH_MODEL_PROVIDER") or "").strip()
    model = (os.environ.get("LABS_COACH_MODEL") or "").strip()
    if not provider:
        raise CoachConfigError(
            "Missing required environment variable: LABS_COACH_MODEL_PROVIDER"
        )
    if not model:
        raise CoachConfigError("Missing required environment variable: LABS_COACH_MODEL")

    raw_map = (os.environ.get("LABS_COACH_EFFORT_MAP") or "").strip()
    if not raw_map:
        raise CoachConfigError(
            "Missing required environment variable: LABS_COACH_EFFORT_MAP"
        )
    effort: dict[str, str] = {}
    for part in raw_map.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" not in part:
            raise CoachConfigError(
                f"LABS_COACH_EFFORT_MAP entry {part!r} must be key:value"
            )
        k, v = part.split(":", 1)
        k, v = k.strip(), v.strip()
        if k not in EFFORT_KEYS:
            raise CoachConfigError(
                f"LABS_COACH_EFFORT_MAP unknown key {k!r} (closed set {EFFORT_KEYS})"
            )
        if not v:
            raise CoachConfigError(f"LABS_COACH_EFFORT_MAP empty value for {k}")
        effort[k] = v
    missing = [k for k in EFFORT_KEYS if k not in effort]
    if missing:
        raise CoachConfigError(
            f"LABS_COACH_EFFORT_MAP missing keys: {', '.join(missing)}"
        )
    return {
        "posture": posture,
        "provider": provider,
        "model": model,
        "effort_map": effort,
    }
