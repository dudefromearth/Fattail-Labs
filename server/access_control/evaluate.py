"""Access evaluation algorithm — Spec v0.4 §5."""

from __future__ import annotations

from typing import Iterable, Mapping, Optional, Sequence

from auth import role_at_least
from access_control.defaults import default_for_kind
from access_control.keys import (
    TargetKind,
    TargetKey,
    is_course_family,
    is_data_bearing_app_key,
    parse_target_key,
)
from access_control.policy import effective_plans
from access_control.types import (
    AccessDecision,
    AccessPolicy,
    Capability,
    PreviewAs,
    TargetMeta,
    ViewerContext,
)

_FULL_CAPS: tuple[Capability, ...] = ("read", "export", "write")
_READ_EXPORT: tuple[Capability, ...] = ("read", "export")
_READ_ONLY: tuple[Capability, ...] = ("read",)


def apply_preview_as(viewer: ViewerContext) -> ViewerContext:
    """Replace evaluation identity when preview cookie set (Spec §4.1)."""
    pa = viewer.preview_as
    if pa is None:
        return viewer
    if pa.mode == "anonymous":
        return ViewerContext(
            identity_id=None,
            signed_in=False,
            is_admin=False,
            session_role="observer",
            access_role="observer",
            plan_slugs=(),
            enrolled_course_ids=(),  # never inherit
            campaign_tags=viewer.campaign_tags,
            now=viewer.now,
            preview_as=pa,
        )
    # signed_in preview
    role = pa.access_role or "observer"
    return ViewerContext(
        identity_id=viewer.identity_id,  # real id retained for write-suppress elsewhere
        signed_in=True,
        is_admin=False,
        session_role=role,
        access_role=role,
        plan_slugs=tuple(pa.plan_slugs),
        enrolled_course_ids=tuple(pa.enrolled_course_ids),  # default empty
        campaign_tags=viewer.campaign_tags,
        now=viewer.now,
        preview_as=pa,
    )


def _evaluated_as(
    ctx: ViewerContext, *, effective: frozenset[str] | None = None
) -> dict:
    return {
        "access_role": ctx.access_role,
        "plan_slugs": list(ctx.plan_slugs),
        "enrolled_course_ids": list(ctx.enrolled_course_ids),
        "effective_plans": sorted(effective) if effective is not None else [],
    }


def _allow(
    target_key: str,
    ctx: ViewerContext,
    *,
    code: str = "ok",
    mode: str = "hard",
    capabilities: tuple[Capability, ...] = _FULL_CAPS,
    ui: Optional[dict] = None,
    grandfathered: bool = False,
    effective: frozenset[str] | None = None,
) -> AccessDecision:
    return AccessDecision(
        allow=True,
        code=code,  # type: ignore[arg-type]
        mode=mode,  # type: ignore[arg-type]
        target_key=target_key,
        capabilities=capabilities,
        ui=ui,
        evaluated_as=_evaluated_as(ctx, effective=effective),
        grandfathered=grandfathered,
    )


def _deny(
    target_key: str,
    ctx: ViewerContext,
    *,
    code: str,
    mode: str = "hard",
    ui: Optional[dict] = None,
    effective: frozenset[str] | None = None,
) -> AccessDecision:
    # hide mode → code hidden; capabilities empty
    if mode == "hide":
        code = "hidden"
    return AccessDecision(
        allow=False,
        code=code,  # type: ignore[arg-type]
        mode=mode,  # type: ignore[arg-type]
        target_key=target_key,
        capabilities=(),
        ui=ui,
        evaluated_as=_evaluated_as(ctx, effective=effective),
        grandfathered=False,
    )


def _course_id_for(tk: TargetKey, meta: TargetMeta) -> Optional[int]:
    if tk.kind is TargetKind.COURSE:
        return tk.entity_id
    return meta.course_id


def default_for_target_type(
    target_key: str,
    ctx: ViewerContext,
    *,
    meta: Optional[TargetMeta] = None,
) -> AccessDecision:
    """As-built defaults when no enabled policy row (Spec §6.3)."""
    meta = meta or TargetMeta()
    tk = parse_target_key(target_key)
    td = default_for_kind(tk.kind)

    if td.fail_closed:
        return _deny(target_key, ctx, code="denied", mode="hard")

    if td.require_signed_in and not ctx.signed_in:
        return _deny(target_key, ctx, code="signin_required", mode="hard")

    if tk.kind is TargetKind.SURFACE:
        return _allow(target_key, ctx, code="ok", mode="hard")

    if tk.kind in (TargetKind.COURSE, TargetKind.MODULE):
        return _allow(target_key, ctx, code="ok", mode="hard")

    if tk.kind in (TargetKind.LESSON, TargetKind.RESOURCE):
        if meta.free_preview:
            return _allow(target_key, ctx, code="ok", mode="hard")
        if meta.member_content_ok or ctx.is_admin:
            return _allow(target_key, ctx, code="ok", mode="hard")
        # Free observer no membership
        return _deny(target_key, ctx, code="role", mode="hard")

    if tk.kind is TargetKind.APP:
        # Data-bearing floor for signed-in owners always at least read/export
        data = is_data_bearing_app_key(tk)
        status = (meta.app_status or "live").lower()
        if status == "soon":
            # Soft teaser; still allow read shell for signed-in
            if data:
                return _allow(
                    target_key,
                    ctx,
                    code="ok",
                    mode="soft",
                    capabilities=_READ_EXPORT if meta.tool_write_ok else _READ_EXPORT,
                )
            return _allow(
                target_key,
                ctx,
                code="ok",
                mode="soft",
                capabilities=_READ_ONLY,
            )
        if meta.tool_write_ok or ctx.is_admin:
            return _allow(target_key, ctx, code="ok", mode="hard", capabilities=_FULL_CAPS)
        if data:
            return _allow(
                target_key,
                ctx,
                code="read_only_floor",
                mode="soft",
                capabilities=_READ_EXPORT,
            )
        return _deny(target_key, ctx, code="role", mode="hard")

    if tk.kind is TargetKind.CAMPAIGN:
        return _deny(target_key, ctx, code="denied", mode="hard")

    return _deny(target_key, ctx, code="denied", mode="hard")


def evaluate(
    target_key: str,
    viewer: ViewerContext,
    *,
    policy: Optional[AccessPolicy] = None,
    meta: Optional[TargetMeta] = None,
) -> AccessDecision:
    """Core evaluate — Spec §5.

    *policy* may be injected (tests) or None (= type default path).
    Caller that uses DB should load policy first and pass it in, or use
    ``evaluate_loaded`` / ``require_access``.
    """
    meta = meta or TargetMeta()
    # Admin bypass unless previewing
    if viewer.is_admin and viewer.preview_as is None:
        return _allow(
            target_key,
            viewer,
            code="ok",
            mode="hard",
            capabilities=_FULL_CAPS,
        )

    ctx = apply_preview_as(viewer)

    if policy is None or not policy.enabled:
        return default_for_target_type(target_key, ctx, meta=meta)

    mode = policy.mode

    if policy.opens_at is not None and ctx.now < policy.opens_at:
        return _deny(
            target_key,
            ctx,
            code="time",
            mode=mode,
            ui=policy.time_ui,
        )
    if policy.closes_at is not None and ctx.now >= policy.closes_at:
        if policy.close_behavior == "deny":
            return _deny(
                target_key,
                ctx,
                code="time",
                mode=mode,
                ui=policy.time_ui,
            )
        return default_for_target_type(target_key, ctx, meta=meta)

    if policy.require_signed_in and not ctx.signed_in:
        return _deny(
            target_key,
            ctx,
            code="signin_required",
            mode=mode,
            ui=policy.deny_ui,
        )

    deny_set = frozenset(policy.deny_plans or ())
    blocklisted = bool(deny_set and (set(ctx.plan_slugs) & deny_set))

    effective = effective_plans(policy)
    plans_constrained = bool(effective)
    role_constrained = bool(policy.min_role)

    plans_ok = (not plans_constrained) or bool(set(ctx.plan_slugs) & effective)
    if policy.all_plans:
        plans_ok = plans_ok and all(p in ctx.plan_slugs for p in policy.all_plans)

    role_ok = True
    if role_constrained:
        try:
            role_ok = role_at_least(ctx.access_role, policy.min_role or "observer")
        except Exception:
            role_ok = False

    if plans_constrained and role_constrained:
        if policy.plan_role_combine == "or":
            member_ok = plans_ok or role_ok
        else:
            member_ok = plans_ok and role_ok
    elif plans_constrained:
        member_ok = plans_ok
    elif role_constrained:
        member_ok = role_ok
    else:
        member_ok = True

    tk = parse_target_key(target_key)
    data_bearing = is_data_bearing_app_key(tk)

    if blocklisted:
        member_ok = False
        # no grandfather
        if data_bearing and ctx.signed_in:
            return _allow(
                target_key,
                ctx,
                code="read_only_floor",
                mode="soft",
                capabilities=_READ_EXPORT,
                effective=effective,
            )
        deny_code = "plan"
        return _deny(
            target_key,
            ctx,
            code=deny_code,
            mode=mode,
            ui=policy.deny_ui,
            effective=effective,
        )

    if not member_ok:
        course_id = _course_id_for(tk, meta)
        if (
            policy.grandfather_enrollments
            and is_course_family(tk)
            and course_id is not None
            and course_id in ctx.enrolled_course_ids
        ):
            return _allow(
                target_key,
                ctx,
                code="grandfather",
                mode=mode,
                capabilities=_FULL_CAPS,
                grandfathered=True,
                effective=effective,
            )
        if data_bearing and ctx.signed_in:
            return _allow(
                target_key,
                ctx,
                code="read_only_floor",
                mode="soft",
                capabilities=_READ_EXPORT,
                effective=effective,
            )
        # Prefer plan code if plans constrained and failed; else role
        if plans_constrained and not plans_ok:
            code = "plan"
        elif role_constrained and not role_ok:
            code = "role"
        else:
            code = "denied"
        return _deny(
            target_key,
            ctx,
            code=code,
            mode=mode,
            ui=policy.deny_ui,
            effective=effective,
        )

    return _allow(
        target_key,
        ctx,
        code="ok",
        mode=mode,
        capabilities=_FULL_CAPS,
        effective=effective,
    )


def evaluate_many(
    keys: Sequence[str],
    viewer: ViewerContext,
    *,
    policies: Optional[Mapping[str, AccessPolicy]] = None,
    meta_by_key: Optional[Mapping[str, TargetMeta]] = None,
) -> dict[str, AccessDecision]:
    """Batch evaluate — one path for catalog (Spec G evaluate_many)."""
    policies = policies or {}
    meta_by_key = meta_by_key or {}
    return {
        k: evaluate(
            k,
            viewer,
            policy=policies.get(k),
            meta=meta_by_key.get(k),
        )
        for k in keys
    }
