"""Access Control code constants — Spec v0.4 §§4.2–4.3.

No env silent defaults. Plan expansion is pure and evaluate-time only
(store intent on write; never persist expanded sets).
"""

from __future__ import annotations

from typing import AbstractSet, Iterable

# Role ladder — must match auth.ROLE_ORDER / Identity Access Spec.
ROLE_LADDER: tuple[str, ...] = (
    "observer",
    "alumni",
    "activator",
    "navigator",
    "administrator",
)

# --- Commercial plan buckets (Spec §4.3.1) — used by expand_plans at evaluate ---

OBSERVER_PLAN_SLUGS: frozenset[str] = frozenset({"observer-trial"})
ACTIVATOR_PLAN_SLUGS: frozenset[str] = frozenset({"activator", "labs-membership"})
NAVIGATOR_PLAN_SLUGS: frozenset[str] = frozenset({"navigator"})
COACHING_PLAN_SLUGS: frozenset[str] = frozenset({"coaching"})

# Non-commercial — never auto-added by expand_plans (Spec §4.3.2).
ALUMNI_PLAN_SLUGS: frozenset[str] = frozenset({"courses-alumni"})
# IKI Lab subscription — not on the commercial role ladder (DL-604).
IKI_LAB_PLAN_SLUGS: frozenset[str] = frozenset({"iki-lab"})

# All known Labs plan slugs for write-path allowlist validation (AC2).
KNOWN_PLAN_SLUGS: frozenset[str] = (
    OBSERVER_PLAN_SLUGS
    | ACTIVATOR_PLAN_SLUGS
    | NAVIGATOR_PLAN_SLUGS
    | COACHING_PLAN_SLUGS
    | ALUMNI_PLAN_SLUGS
    | IKI_LAB_PLAN_SLUGS
)

# --- Ungateable surfaces (Spec §4.2.1) — write validation rejects PUT ---

ACCESS_UNGATEABLE_TARGETS: frozenset[str] = frozenset(
    {
        "surface:login",
        "surface:signup",
        "surface:logout",
        "surface:membership",
        "surface:forgot-password",
        "surface:reset-password",
        "surface:me",
    }
)

# --- Data-bearing apps (Spec §4.2.2) — read/export floor for signed-in owner ---

# Member-authored Family B apps: read/export floor always for signed-in owner.
# Spec §4.2.2 — includes strategy-lab (strategies, whole-lab export).
DATA_BEARING_APPS: frozenset[str] = frozenset(
    {
        "trade-log",
        "journal",
        "playbook",
        "strategy-lab",
    }
)

# Policy modes (Spec §4.4)
POLICY_MODES: frozenset[str] = frozenset({"hard", "soft", "hide", "redirect"})

# Plan/role combine (Spec §4.3)
PLAN_ROLE_COMBINE: frozenset[str] = frozenset({"or", "and"})


def expand_plans(selected: AbstractSet[str] | Iterable[str]) -> frozenset[str]:
    """Commercial cumulative expansion — evaluate-time only (Spec §4.3.1).

    Alumni is **never** added. Empty input → empty set.
    """
    selected_set = set(selected)
    if not selected_set:
        return frozenset()

    out = set(selected_set)
    if out & OBSERVER_PLAN_SLUGS:
        out |= ACTIVATOR_PLAN_SLUGS | NAVIGATOR_PLAN_SLUGS | COACHING_PLAN_SLUGS
    if out & ACTIVATOR_PLAN_SLUGS:
        out |= NAVIGATOR_PLAN_SLUGS | COACHING_PLAN_SLUGS
    if out & NAVIGATOR_PLAN_SLUGS:
        out |= COACHING_PLAN_SLUGS
    # Explicitly never add alumni via expansion even if caller mixed it in.
    # (selected may include courses-alumni as exact intent; leave as-is only
    # if it was already in selected — do not add it.)
    return frozenset(out)
