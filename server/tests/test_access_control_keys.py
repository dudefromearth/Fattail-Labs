"""AC1-1 pure tests: target keys, plan expand, type defaults (no DB/HTTP)."""

from __future__ import annotations

import pytest

from access_control import (
    ACCESS_UNGATEABLE_TARGETS,
    ALUMNI_PLAN_SLUGS,
    DATA_BEARING_APPS,
    KNOWN_PLAN_SLUGS,
    ROLE_LADDER,
    TYPE_DEFAULTS,
    TargetKind,
    build_target_key,
    default_for_kind,
    expand_plans,
    is_course_family,
    is_data_bearing_app_key,
    is_ungateable_target,
    parse_target_key,
    validate_target_key,
)
from access_control.keys import TargetKeyError
from auth import ROLE_ORDER


def test_role_ladder_matches_auth():
    assert ROLE_LADDER == ROLE_ORDER


def test_alumni_not_in_commercial_known_expand_sources():
    assert "courses-alumni" in ALUMNI_PLAN_SLUGS
    assert "courses-alumni" in KNOWN_PLAN_SLUGS
    # expand never adds alumni
    expanded = expand_plans({"observer-trial"})
    assert "courses-alumni" not in expanded
    assert "navigator" in expanded
    assert "coaching" in expanded
    assert "activator" in expanded
    assert "labs-membership" in expanded
    assert "iki-lab" not in expanded
    assert expand_plans({"iki-lab"}) == frozenset({"iki-lab"})


def test_expand_observer_trial_admits_higher_commercial():
    out = expand_plans(["observer-trial"])
    assert out == frozenset(
        {
            "observer-trial",
            "activator",
            "labs-membership",
            "navigator",
            "coaching",
        }
    )


def test_expand_exact_empty():
    assert expand_plans([]) == frozenset()
    assert expand_plans(set()) == frozenset()


def test_expand_navigator_adds_coaching_only_up():
    out = expand_plans({"navigator"})
    assert out == frozenset({"navigator", "coaching"})
    assert "observer-trial" not in out


def test_expand_does_not_strip_explicit_alumni_in_selected():
    # If admin put alumni in selected (exact path later), leave it; don't add.
    out = expand_plans({"courses-alumni"})
    assert out == frozenset({"courses-alumni"})


def test_parse_surface_app_course_family_campaign():
    assert parse_target_key("surface:login").kind is TargetKind.SURFACE
    assert parse_target_key("app:trade-log").name == "trade-log"
    assert parse_target_key("course:12").entity_id == 12
    assert parse_target_key("module:3").entity_id == 3
    assert parse_target_key("lesson:99").entity_id == 99
    assert parse_target_key("resource:7").entity_id == 7
    ck = parse_target_key("campaign:obs-launch:lander")
    assert ck.kind is TargetKind.CAMPAIGN
    assert ck.name == "obs-launch"
    assert ck.part == "lander"


def test_build_roundtrip():
    assert build_target_key(TargetKind.LESSON, entity_id=56) == "lesson:56"
    assert build_target_key("app", name="journal") == "app:journal"
    assert (
        build_target_key(TargetKind.CAMPAIGN, name="x", part="email")
        == "campaign:x:email"
    )


def test_invalid_keys():
    bad = [
        "",
        "lesson",
        "lesson:",
        "lesson:0",
        "lesson:-1",
        "lesson:01",
        "foo:bar",
        "surface:Bad Name",
        "app:",
        "campaign:only-slug",
        "campaign:a:b:c",
        " course:1",
        "course:1 ",
    ]
    for k in bad:
        with pytest.raises(TargetKeyError):
            parse_target_key(k)


def test_ungateable_and_data_bearing():
    assert is_ungateable_target("surface:login")
    assert "surface:login" in ACCESS_UNGATEABLE_TARGETS
    assert not is_ungateable_target("surface:catalog")
    assert is_data_bearing_app_key("app:trade-log")
    assert is_data_bearing_app_key("app:journal")
    assert is_data_bearing_app_key("app:playbook")
    assert not is_data_bearing_app_key("app:reports")
    assert DATA_BEARING_APPS == frozenset(
        {"trade-log", "journal", "playbook", "strategy-lab"}
    )


def test_course_family():
    assert is_course_family("course:1")
    assert is_course_family("lesson:2")
    assert not is_course_family("app:trade-log")
    assert not is_course_family("surface:home")


def test_type_defaults_cover_all_kinds():
    for kind in TargetKind:
        d = default_for_kind(kind)
        assert d is TYPE_DEFAULTS[kind]
    assert TYPE_DEFAULTS[TargetKind.CAMPAIGN].fail_closed is True
    assert TYPE_DEFAULTS[TargetKind.LESSON].require_signed_in is True
    assert TYPE_DEFAULTS[TargetKind.COURSE].require_signed_in is False
    assert TYPE_DEFAULTS[TargetKind.APP].data_bearing_floor is True
    assert TYPE_DEFAULTS[TargetKind.COURSE].grandfather_enrollments_default is True


def test_validate_returns_canonical():
    assert validate_target_key("lesson:42") == "lesson:42"


# --- IKI Store ST-0: product target kind (Store Spec §4.3, ST7) --------------


def test_product_key_round_trips():
    tk = parse_target_key("product:heatmap-gex")
    assert tk.kind is TargetKind.PRODUCT
    assert tk.name == "heatmap-gex"
    assert tk.raw == "product:heatmap-gex"
    assert tk.entity_id is None
    assert build_target_key(TargetKind.PRODUCT, name="heatmap-gex") == (
        "product:heatmap-gex"
    )
    assert validate_target_key("product:heatmap-gex") == "product:heatmap-gex"


@pytest.mark.parametrize(
    "bad",
    [
        "product:",
        "product:Heatmap",
        "product:-leading",
        "product:has space",
        "product",
    ],
)
def test_product_key_rejects_bad_slugs(bad):
    with pytest.raises(TargetKeyError):
        parse_target_key(bad)


def test_product_build_requires_name():
    with pytest.raises(TargetKeyError):
        build_target_key(TargetKind.PRODUCT)


def test_product_is_not_course_family_or_data_bearing():
    assert not is_course_family("product:heatmap-gex")
    # A Knowledge app is sold, not member-authored — no read/export floor.
    assert not is_data_bearing_app_key("product:trade-log")


def test_product_default_is_fail_closed():
    d = default_for_kind(TargetKind.PRODUCT)
    assert d.fail_closed is True
    assert d.require_signed_in is True
    assert d.data_bearing_floor is False
    assert d.grandfather_enrollments_default is False
