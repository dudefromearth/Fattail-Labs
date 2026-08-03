"""Access Control domain types — Spec v0.4 §§4.1, 4.3, 4.5."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal, Optional, Sequence

PolicyMode = Literal["hard", "soft", "hide", "redirect"]
DecisionCode = Literal[
    "ok",
    "signin_required",
    "role",
    "plan",
    "time",
    "denied",
    "hidden",
    "grandfather",
    "read_only_floor",
]
Capability = Literal["read", "export", "write"]


@dataclass(frozen=True, slots=True)
class PreviewAs:
    """Admin preview cookie payload (Spec §4.1)."""

    mode: Literal["anonymous", "signed_in"]
    access_role: Optional[str] = None
    plan_slugs: tuple[str, ...] = ()
    # Default empty — never inherit admin enrollments
    enrolled_course_ids: tuple[int, ...] = ()


@dataclass(frozen=True, slots=True)
class ViewerContext:
    identity_id: Optional[int]
    signed_in: bool
    is_admin: bool
    session_role: str
    access_role: str
    plan_slugs: tuple[str, ...]
    enrolled_course_ids: tuple[int, ...]
    campaign_tags: tuple[str, ...] = ()
    now: datetime = field(default_factory=datetime.utcnow)
    preview_as: Optional[PreviewAs] = None


@dataclass(frozen=True, slots=True)
class AccessPolicy:
    """In-memory policy — intent storage (selected_plans not expanded)."""

    target_key: str
    enabled: bool = True
    mode: PolicyMode = "hard"
    min_role: Optional[str] = None
    selected_plans: Optional[tuple[str, ...]] = None
    exact_plans_only: bool = False
    all_plans: Optional[tuple[str, ...]] = None
    deny_plans: Optional[tuple[str, ...]] = None
    plan_role_combine: Literal["or", "and"] = "or"
    require_signed_in: bool = True
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    close_behavior: Literal["default", "deny"] = "default"
    deny_ui: Optional[dict[str, Any]] = None
    time_ui: Optional[dict[str, Any]] = None
    campaign_id: Optional[int] = None
    grandfather_enrollments: bool = True
    label: str = ""
    notes: Optional[str] = None
    version: int = 1


@dataclass(frozen=True, slots=True)
class TargetMeta:
    """Optional as-built facts for type defaults / grandfather resolution.

    Not part of policy rows — loaded from content tables when evaluating
    live resources (lessons free_preview, course id for hierarchy, app status).
    """

    free_preview: bool = False
    course_id: Optional[int] = None
    app_status: Optional[str] = None  # soon | live | external
    # As-built practice-suite write entitlement (observer-trial | activator+)
    tool_write_ok: bool = False
    # can_access_member_content equivalent for lesson/resource defaults
    member_content_ok: bool = False


@dataclass(frozen=True, slots=True)
class AccessDecision:
    allow: bool
    code: DecisionCode
    mode: PolicyMode
    target_key: str
    capabilities: tuple[Capability, ...]
    ui: Optional[dict[str, Any]] = None
    evaluated_as: dict[str, Any] = field(default_factory=dict)
    grandfathered: bool = False

    def has_capability(self, capability: str) -> bool:
        return capability in self.capabilities

    def to_public_dict(self) -> dict[str, Any]:
        """Resource-embedded access payload (Spec §8.1) — no target probe."""
        out: dict[str, Any] = {
            "allow": self.allow,
            "capabilities": list(self.capabilities),
            "code": self.code,
            "mode": self.mode,
            "grandfathered": self.grandfathered,
        }
        if self.ui is not None:
            out["ui"] = self.ui
        return out
