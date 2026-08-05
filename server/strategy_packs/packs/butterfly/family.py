"""Butterfly family keys — product language.

Batman = dual package: one call fly + one put fly, each wing-symmetric.
Usually matched widths; call/put width can differ when match_side_widths is false.
Single = one call or put fly only.
Broken wing = asymmetric single-side BWB.
"""

from __future__ import annotations

from typing import Any


def normalize_family(raw: Any) -> str:
    f = str(raw or "").strip().lower()
    if f in ("batman", "symmetric", "dual", "balanced_batman"):
        return "batman"
    if f in ("single", "single_fly", "one_sided"):
        return "single"
    if f in ("broken_wing", "bwb"):
        return "broken_wing"
    return f or "batman"


def is_batman(config: dict[str, Any]) -> bool:
    return normalize_family(config.get("butterfly_family")) == "batman"
