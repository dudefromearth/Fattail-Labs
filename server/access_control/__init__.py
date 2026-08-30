"""Access Policy Engine — Spec v0.4 BUILD AUTHORITY.

AC1-1: keys, plan buckets, type defaults
AC1-2: access_policies DDL
AC1-3: evaluate / evaluate_many / require_access
"""

from __future__ import annotations

from access_control.constants import (
    ACCESS_UNGATEABLE_TARGETS,
    ACTIVATOR_PLAN_SLUGS,
    ALUMNI_PLAN_SLUGS,
    COACHING_PLAN_SLUGS,
    DATA_BEARING_APPS,
    IKI_LAB_PLAN_SLUGS,
    KNOWN_PLAN_SLUGS,
    NAVIGATOR_PLAN_SLUGS,
    OBSERVER_PLAN_SLUGS,
    ROLE_LADDER,
    expand_plans,
)
from access_control.defaults import (
    TYPE_DEFAULTS,
    TypeDefaultKind,
    default_for_kind,
)
from access_control.evaluate import (
    apply_preview_as,
    default_for_target_type,
    evaluate,
    evaluate_many,
)
from access_control.keys import (
    TargetKind,
    TargetKey,
    build_target_key,
    is_course_family,
    is_data_bearing_app_key,
    is_ungateable_target,
    parse_target_key,
    validate_target_key,
)
from access_control.policy import effective_plans, load_policies_many, load_policy, policy_from_row
from access_control.require import require_access
from access_control.types import (
    AccessDecision,
    AccessPolicy,
    PreviewAs,
    TargetMeta,
    ViewerContext,
)
from access_control.viewer import viewer_from_claims, viewer_from_parts

__all__ = [
    "ACCESS_UNGATEABLE_TARGETS",
    "ACTIVATOR_PLAN_SLUGS",
    "ALUMNI_PLAN_SLUGS",
    "COACHING_PLAN_SLUGS",
    "DATA_BEARING_APPS",
    "IKI_LAB_PLAN_SLUGS",
    "KNOWN_PLAN_SLUGS",
    "NAVIGATOR_PLAN_SLUGS",
    "OBSERVER_PLAN_SLUGS",
    "ROLE_LADDER",
    "TYPE_DEFAULTS",
    "AccessDecision",
    "AccessPolicy",
    "PreviewAs",
    "TargetKind",
    "TargetKey",
    "TargetMeta",
    "TypeDefaultKind",
    "ViewerContext",
    "apply_preview_as",
    "build_target_key",
    "default_for_kind",
    "default_for_target_type",
    "effective_plans",
    "evaluate",
    "evaluate_many",
    "expand_plans",
    "is_course_family",
    "is_data_bearing_app_key",
    "is_ungateable_target",
    "load_policies_many",
    "load_policy",
    "parse_target_key",
    "policy_from_row",
    "require_access",
    "validate_target_key",
    "viewer_from_claims",
    "viewer_from_parts",
]
