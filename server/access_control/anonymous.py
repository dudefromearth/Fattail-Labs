"""Anonymous status helper for sitemap (Spec §6.2)."""

from __future__ import annotations

from access_control.evaluate import evaluate
from access_control.types import AccessPolicy, TargetMeta
from access_control.viewer import viewer_from_parts


def anonymous_http_status(
    target_key: str,
    *,
    policy: AccessPolicy | None = None,
    meta: TargetMeta | None = None,
) -> int:
    """Map anonymous evaluate → HTTP status for sitemap inclusion (200 only)."""
    viewer = viewer_from_parts(identity_id=None, signed_in=False, is_admin=False)
    d = evaluate(target_key, viewer, policy=policy, meta=meta or TargetMeta())
    if d.allow:
        return 200
    if d.mode == "hide" or d.code == "hidden":
        return 404
    if d.mode == "redirect":
        return 302
    if d.code == "signin_required":
        return 401
    return 403
