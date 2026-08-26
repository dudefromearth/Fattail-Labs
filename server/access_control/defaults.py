"""Type defaults when no access_policies row exists — Spec §6.3.

Codifies **as-built** behavior until a policy is written. Full application of
these defaults (free_preview column, feature_gates table, tool membership) is
AC1-3 ``default_for_target_type``; this module is the constant table only.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from access_control.keys import TargetKind


class TypeDefaultKind(str, Enum):
    """Named default behaviors (no silent invent)."""

    # Public surface; optional feature_gates overlay (compat until AC7 merge).
    SURFACE_OPEN_FEATURE_GATE = "surface_open_feature_gate"
    # Catalog / course detail: public open shell.
    COURSE_OPEN = "course_open"
    # Module shell follows course openness (no separate gate as-built).
    MODULE_OPEN = "module_open"
    # Lesson: require session; free_preview OR can_access_member_content.
    LESSON_AS_BUILT = "lesson_as_built"
    # Resource attach: free_preview OR member content (as-built resources).
    RESOURCE_AS_BUILT = "resource_as_built"
    # App: require signed-in; status=soon soft; data floor; tool write gates.
    APP_AS_BUILT = "app_as_built"
    # Campaign targets without policy: deny (fail closed) + admin warning.
    CAMPAIGN_FAIL_CLOSED = "campaign_fail_closed"
    # IKI Knowledge app without policy: deny (fail closed) — Store Spec ST7.
    PRODUCT_FAIL_CLOSED = "product_fail_closed"


@dataclass(frozen=True, slots=True)
class TypeDefault:
    """Static description of as-built default for a target kind."""

    kind: TypeDefaultKind
    # High-level notes for admin UI / docs (not user-facing CTAs).
    summary: str
    require_signed_in: bool
    # If True, missing policy → DENY (campaigns). Else apply as-built path.
    fail_closed: bool
    # Course family grandfather default when a policy *is* later created.
    grandfather_enrollments_default: bool
    # Data-bearing read/export floor applies for these kinds (apps).
    data_bearing_floor: bool


TYPE_DEFAULTS: dict[TargetKind, TypeDefault] = {
    TargetKind.SURFACE: TypeDefault(
        kind=TypeDefaultKind.SURFACE_OPEN_FEATURE_GATE,
        summary=(
            "Surfaces open by default; existing feature_gates table may "
            "overlay countdown/waitlist until AC7 surface-policy merge."
        ),
        require_signed_in=False,
        fail_closed=False,
        grandfather_enrollments_default=False,
        data_bearing_floor=False,
    ),
    TargetKind.COURSE: TypeDefault(
        kind=TypeDefaultKind.COURSE_OPEN,
        summary="Course catalog/detail public shell open (SEO SSG).",
        require_signed_in=False,
        fail_closed=False,
        grandfather_enrollments_default=True,
        data_bearing_floor=False,
    ),
    TargetKind.MODULE: TypeDefault(
        kind=TypeDefaultKind.MODULE_OPEN,
        summary="Module open with course; no separate as-built gate.",
        require_signed_in=False,
        fail_closed=False,
        grandfather_enrollments_default=True,
        data_bearing_floor=False,
    ),
    TargetKind.LESSON: TypeDefault(
        kind=TypeDefaultKind.LESSON_AS_BUILT,
        summary=(
            "Signed-in required; free_preview lesson OK for any session; "
            "else can_access_member_content (alumni+ feature role OR any "
            "active membership including observer-trial)."
        ),
        require_signed_in=True,
        fail_closed=False,
        grandfather_enrollments_default=True,
        data_bearing_floor=False,
    ),
    TargetKind.RESOURCE: TypeDefault(
        kind=TypeDefaultKind.RESOURCE_AS_BUILT,
        summary=(
            "Resource free_preview or member content parity with lessons "
            "(Enrollment Access as-built)."
        ),
        require_signed_in=True,
        fail_closed=False,
        grandfather_enrollments_default=True,
        data_bearing_floor=False,
    ),
    TargetKind.APP: TypeDefault(
        kind=TypeDefaultKind.APP_AS_BUILT,
        summary=(
            "Signed-in; apps.status=soon → soft teaser; live apps use tool "
            "membership (observer-trial | activator+ | admin) for writes; "
            "data-bearing apps always retain owner read/export floor."
        ),
        require_signed_in=True,
        fail_closed=False,
        grandfather_enrollments_default=False,
        data_bearing_floor=True,
    ),
    TargetKind.PRODUCT: TypeDefault(
        kind=TypeDefaultKind.PRODUCT_FAIL_CLOSED,
        summary=(
            "IKI Knowledge app. No policy → DENY (fail closed). An unsold app "
            "is never open by omission. See IKI Store Spec ST7."
        ),
        require_signed_in=True,
        fail_closed=True,
        grandfather_enrollments_default=False,
        data_bearing_floor=False,
    ),
    TargetKind.CAMPAIGN: TypeDefault(
        kind=TypeDefaultKind.CAMPAIGN_FAIL_CLOSED,
        summary=(
            "No policy → DENY (fail closed). Admin UI warns if campaign live "
            "without policy."
        ),
        require_signed_in=True,
        fail_closed=True,
        grandfather_enrollments_default=False,
        data_bearing_floor=False,
    ),
}


def default_for_kind(kind: TargetKind) -> TypeDefault:
    """Return type default; fail loud if kind missing from table."""
    try:
        return TYPE_DEFAULTS[kind]
    except KeyError as exc:
        raise KeyError(
            f"No type default for TargetKind {kind!r} — table incomplete"
        ) from exc
