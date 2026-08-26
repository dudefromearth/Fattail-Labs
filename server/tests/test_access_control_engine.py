"""AC1-4 — Access Policy Engine characterization (pure; no HTTP)."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from access_control import (
    AccessPolicy,
    TargetMeta,
    effective_plans,
    evaluate,
    evaluate_many,
    expand_plans,
    viewer_from_parts,
)
from access_control.types import PreviewAs

NOW = datetime(2026, 8, 2, 12, 0, 0)


def V(**kw):
    kw.setdefault("now", NOW)
    return viewer_from_parts(**kw)


def pol(target="lesson:1", **kw) -> AccessPolicy:
    return AccessPolicy(target_key=target, **kw)


# --- expand / effective ---


def test_expand_observer_trial_to_navigator_allow():
    p = pol(selected_plans=("observer-trial",), exact_plans_only=False)
    assert "navigator" in effective_plans(p)
    d = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert d.allow and d.code == "ok"


def test_exact_plans_only_denies_navigator():
    p = pol(selected_plans=("observer-trial",), exact_plans_only=True)
    assert effective_plans(p) == frozenset({"observer-trial"})
    d = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert not d.allow
    assert d.code == "plan"


def test_alumni_not_auto_added_by_expand():
    assert "courses-alumni" not in expand_plans({"observer-trial"})
    assert "courses-alumni" not in expand_plans({"activator", "navigator"})


def test_min_role_observer_admits_alumni():
    p = pol(min_role="observer")
    d = evaluate(
        "lesson:2",
        V(identity_id=1, access_role="alumni", plan_slugs=("courses-alumni",)),
        policy=p,
    )
    assert d.allow


def test_plans_only_observer_selection_alumni_role_alone_denied():
    """Alumni role does not get commercial expand credit without min_role."""
    p = pol(selected_plans=("observer-trial",), exact_plans_only=False, min_role=None)
    d = evaluate(
        "lesson:3",
        V(identity_id=1, access_role="alumni", plan_slugs=("courses-alumni",)),
        policy=p,
    )
    assert not d.allow


def test_deny_plans_data_bearing_floor():
    p = pol(
        target="app:trade-log",
        deny_plans=("navigator",),
        min_role="administrator",
    )
    d = evaluate(
        "app:trade-log",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert d.allow
    assert d.code == "read_only_floor"
    assert d.capabilities == ("read", "export")
    assert "write" not in d.capabilities


def test_grandfather_course_enrollment():
    p = pol(
        target="course:10",
        min_role="navigator",
        grandfather_enrollments=True,
    )
    d = evaluate(
        "course:10",
        V(
            identity_id=1,
            access_role="observer",
            plan_slugs=(),
            enrolled_course_ids=(10,),
        ),
        policy=p,
    )
    assert d.allow and d.grandfathered and d.code == "grandfather"


def test_deny_plans_enrolled_no_grandfather():
    p = pol(
        target="course:10",
        deny_plans=("observer-trial",),
        min_role="navigator",
        grandfather_enrollments=True,
    )
    d = evaluate(
        "course:10",
        V(
            identity_id=1,
            access_role="observer",
            plan_slugs=("observer-trial",),
            enrolled_course_ids=(10,),
        ),
        policy=p,
    )
    assert not d.allow
    assert not d.grandfathered


def test_admin_no_preview_allow():
    d = evaluate(
        "campaign:x:lander",
        V(identity_id=9, session_role="administrator", is_admin=True),
        policy=None,
    )
    assert d.allow


def test_admin_with_preview_no_bypass():
    v = V(
        identity_id=9,
        session_role="administrator",
        is_admin=True,
        preview_as=PreviewAs(mode="anonymous"),
    )
    d = evaluate("campaign:x:lander", v, policy=None)
    assert not d.allow  # campaign fail-closed for anon preview


def test_time_window_before_open():
    p = pol(
        opens_at=NOW + timedelta(hours=1),
        min_role="observer",
    )
    d = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert not d.allow and d.code == "time"


def test_time_close_behavior_deny():
    p = pol(
        closes_at=NOW - timedelta(hours=1),
        close_behavior="deny",
        min_role="observer",
    )
    d = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert not d.allow and d.code == "time"


def test_time_close_behavior_default_falls_to_type_default():
    p = pol(
        target="course:1",
        closes_at=NOW - timedelta(hours=1),
        close_behavior="default",
        min_role="navigator",
    )
    # course type default is open
    d = evaluate(
        "course:1",
        V(identity_id=1, access_role="observer", plan_slugs=()),
        policy=p,
    )
    assert d.allow


def test_no_policy_campaign_fail_closed():
    d = evaluate(
        "campaign:launch:lander",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=None,
    )
    assert not d.allow and d.code == "denied"


def test_no_policy_course_open():
    d = evaluate(
        "course:5",
        V(identity_id=None, signed_in=False),
        policy=None,
    )
    assert d.allow


def test_no_policy_lesson_needs_member_or_preview():
    d = evaluate(
        "lesson:9",
        V(identity_id=1, access_role="observer", plan_slugs=()),
        policy=None,
        meta=TargetMeta(free_preview=False, member_content_ok=False),
    )
    assert not d.allow
    d2 = evaluate(
        "lesson:9",
        V(identity_id=1, access_role="observer", plan_slugs=()),
        policy=None,
        meta=TargetMeta(free_preview=True, member_content_ok=False),
    )
    assert d2.allow


def test_evaluate_many_n_keys():
    keys = [f"lesson:{i}" for i in range(1, 41)]
    p = pol(selected_plans=("observer-trial",))
    policies = {k: AccessPolicy(target_key=k, selected_plans=("observer-trial",)) for k in keys}
    out = evaluate_many(
        keys,
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policies=policies,
    )
    assert len(out) == 40
    assert all(out[k].allow for k in keys)


def test_plan_role_combine_and():
    p = pol(
        selected_plans=("navigator",),
        exact_plans_only=True,
        min_role="navigator",
        plan_role_combine="and",
    )
    # has plan but low role
    d = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="observer", plan_slugs=("navigator",)),
        policy=p,
    )
    assert not d.allow
    d2 = evaluate(
        "lesson:1",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert d2.allow


def test_signin_required():
    p = pol(require_signed_in=True, min_role="observer")
    d = evaluate("lesson:1", V(identity_id=None, signed_in=False), policy=p)
    assert not d.allow and d.code == "signin_required"


def test_new_slug_vocabulary_via_expand_mock(monkeypatch):
    """Spec §15.4 — mutating expansion table admits new higher-tier slug."""
    import access_control.constants as c

    monkeypatch.setattr(
        c,
        "COACHING_PLAN_SLUGS",
        frozenset({"coaching", "coaching-plus"}),
    )
    # re-import expand uses module constants — call expand_plans after patch
    from access_control.constants import expand_plans as ep

    out = ep({"navigator"})
    assert "coaching-plus" in out or "coaching" in out
    # With monkeypatch on COACHING used inside expand_plans in same module:
    out2 = c.expand_plans({"navigator"})
    assert "coaching-plus" in out2


# --- IKI Store ST-0: Knowledge app gating (Store Spec ST4, ST6, ST7, §4) ----


def test_product_with_no_policy_denies_even_for_navigator():
    """ST7 — an unsold Knowledge app is never open by omission."""
    d = evaluate(
        "product:heatmap-gex",
        V(identity_id=1, access_role="navigator", plan_slugs=("navigator",)),
        policy=None,
    )
    assert not d.allow
    assert d.code == "denied"


def test_product_with_no_policy_denies_anonymous():
    d = evaluate("product:heatmap-gex", V(identity_id=None, signed_in=False), policy=None)
    assert not d.allow


def _free_app_policy():
    """§4.1 free shape — a session and nothing else. No role floor, no plan."""
    return pol(
        target="product:starter-ladder",
        require_signed_in=True,
        min_role=None,
        selected_plans=None,
    )


def test_free_app_admits_a_signed_in_account_with_no_plan():
    """§4.1 — free means free to anyone with a login. The login is the price."""
    d = evaluate(
        "product:starter-ladder",
        V(identity_id=7, access_role="observer", plan_slugs=()),
        policy=_free_app_policy(),
    )
    assert d.allow and d.code == "ok"


def test_free_app_still_requires_a_session():
    d = evaluate(
        "product:starter-ladder",
        V(identity_id=None, signed_in=False, access_role="observer"),
        policy=_free_app_policy(),
    )
    assert not d.allow
    assert d.code == "signin_required"


def test_free_member_is_not_an_observer_subscriber():
    """A free signup lands on the role NAMED 'observer' but holds no plan.

    Guards the name collision in Store Spec §4.1: `min_role: observer` reads as a
    tier requirement and enforces nothing, because the ladder floor is also the
    no-plan fallback (identity.derive_role). A paying tier must be expressed as a
    PLAN constraint, never as the role name.
    """
    free = V(identity_id=7, access_role="observer", plan_slugs=())
    assert free.plan_slugs == ()

    # The misleading shape: admits the free signup despite naming a "tier".
    assert evaluate("product:x", free, policy=pol(target="product:x",
                                                  min_role="observer")).allow

    # The correct shape for "paying members only" excludes them.
    paying_only = pol(
        target="product:x",
        min_role=None,
        selected_plans=("observer-trial",),
        exact_plans_only=False,
    )
    assert not evaluate("product:x", free, policy=paying_only).allow


def test_paid_app_admits_only_the_buyer():
    """ST6 — exact_plans_only, so the app plan is the only key that opens it."""
    p = pol(
        target="product:heatmap-gex",
        min_role=None,
        selected_plans=("iki-heatmap-gex",),
        exact_plans_only=True,
    )
    buyer = V(identity_id=1, access_role="observer", plan_slugs=("iki-heatmap-gex",))
    assert evaluate("product:heatmap-gex", buyer, policy=p).allow


def test_paid_app_denies_navigator_who_has_not_bought_it():
    """ST4/ST5 — tier never leaks into per-app entitlement, and vice versa."""
    p = pol(
        target="product:heatmap-gex",
        min_role=None,
        selected_plans=("iki-heatmap-gex",),
        exact_plans_only=True,
    )
    d = evaluate(
        "product:heatmap-gex",
        V(identity_id=2, access_role="navigator", plan_slugs=("navigator",)),
        policy=p,
    )
    assert not d.allow
    assert d.code == "plan"


def test_app_plan_does_not_expand_into_tier_plans():
    """ST5 — an iki- slug is inert in cumulative expansion."""
    assert expand_plans({"iki-heatmap-gex"}) == frozenset({"iki-heatmap-gex"})
