"""Butterfly Strategy Pack — schema, validate, rank honesty."""

from __future__ import annotations

from strategy_packs.chain_stub import build_stub_chain
from strategy_packs.packs import butterfly as bp
from strategy_packs.registry import list_packs, pack_detail


def test_only_butterfly_enabled():
    packs = list_packs()
    assert len(packs) == 1
    assert packs[0]["id"] == "butterfly"


def test_schema_and_defaults():
    d = pack_detail("butterfly")
    assert d["schema"]["common"]
    assert "batman" in d["schema"]["variants"]
    assert "single" in d["schema"]["variants"]
    assert "broken_wing" in d["schema"]["variants"]
    # FatTail house designs (entry + management process)
    assert len(d["defaults"]) >= 5
    house = d.get("house_designs") or bp.get_house_designs()
    assert len(house) >= 5
    assert all(h.get("version") and h.get("course_refs") for h in house)
    batman_fields = {f["name"]: f for f in d["schema"]["variants"]["batman"]}
    assert "match_side_widths" in batman_fields
    assert "call_width_points" in batman_fields
    assert "put_width_points" in batman_fields
    bwb_fields = {f["name"]: f for f in d["schema"]["variants"]["broken_wing"]}
    assert bwb_fields["min_convexity_quality"]["required"] is False


def test_batman_is_dual_fly_package():
    cfg = next(
        c
        for c in bp.get_default_configs()
        if c.get("butterfly_family") == "batman"
    )
    chain = build_stub_chain()
    r = bp.rank_structures(cfg, chain)
    assert r["ok"] and r["ranked"]
    top = r["ranked"][0]["structure"]
    assert top.get("structure_kind") == "batman" or top.get("family") == "batman"
    assert len(top.get("legs") or []) == 6  # call 1/-2/1 + put 1/-2/1
    comps = top.get("components") or {}
    assert "call_fly" in comps and "put_fly" in comps


def test_house_designs_validate_and_dte_bands():
    for d in bp.get_house_designs():
        v = bp.validate(d["config"])
        assert v["valid"], (d["key"], v)
        assert d["config"].get("entry_conditions")
        assert d["config"].get("exit_rules")
        assert d.get("course_refs")
        assert d.get("immutable") is True
        assert d.get("member_may_remove") is False


def test_defaults_validate():
    for cfg in bp.get_default_configs():
        v = bp.validate(cfg)
        assert v["valid"], (cfg.get("name"), v)


def test_reject_win_rate_primary():
    cfg = dict(bp.get_default_configs()[0])
    cfg["primary_metric"] = "win_rate"
    v = bp.validate(cfg)
    assert not v["valid"]
    assert any("win" in e.lower() or "forbidden" in e.lower() for e in v["errors"])


def test_entry_criteria_and_exit_drivers():
    cfg = dict(bp.get_default_configs()[0])
    cfg["entry_conditions"] = {
        "criteria": ["vp_structure", "price_action", "gex", "order_flow"],
        "pseudocode": "HVN top holds mid-morning → next LVN",
    }
    cfg["exit_rules"] = {
        "dynamic_premium_decay_trailing": {"enabled": True, "mode": "rate"},
        "drivers": ["premium_decay", "time"],
        "pseudocode": "trail decay; flatten T-N",
    }
    v = bp.validate(cfg)
    assert v["valid"], v
    cfg["entry_conditions"] = {"criteria": ["vwap"]}
    v = bp.validate(cfg)
    assert not v["valid"]
    assert any("criteria" in e for e in v["errors"])
    cfg["entry_conditions"] = {"criteria": ["vp_structure"]}
    cfg["exit_rules"]["drivers"] = ["gamma"]
    v = bp.validate(cfg)
    assert not v["valid"]
    assert any("drivers" in e for e in v["errors"])


def test_convexity_roc_band_optional_and_ordered():
    cfg = dict(bp.get_default_configs()[0])
    assert bp.validate(cfg)["valid"]
    cfg["convexity_roc_min_pct"] = 20
    cfg["convexity_roc_max_pct"] = 40
    v = bp.validate(cfg)
    assert v["valid"], v
    cfg["convexity_roc_min_pct"] = 40
    cfg["convexity_roc_max_pct"] = 20
    v = bp.validate(cfg)
    assert not v["valid"]
    assert any("convexity_roc" in e for e in v["errors"])
    cfg["convexity_roc_min_pct"] = -5
    cfg["convexity_roc_max_pct"] = 20
    v = bp.validate(cfg)
    assert not v["valid"]
    cfg["convexity_roc_min_pct"] = 30
    cfg.pop("convexity_roc_max_pct", None)
    v = bp.validate(cfg)
    assert v["valid"], v
    r = bp.rank_structures(cfg, build_stub_chain())
    assert r["ok"]
    assert r["summary"]["convexity_roc_band"] == {"min_pct": 30.0, "max_pct": None}
    assert r["summary"]["convexity_roc_uncomputable"] is True
    assert r["ranked"][0]["metrics"]["convexityRocPct"] is None


def test_distribution_shape_is_valid_primary():
    d = pack_detail("butterfly")
    common = {f["name"]: f for f in d["schema"]["common"]}
    opts = common["primary_metric"]["options"]
    assert "distribution_shape" in opts
    assert opts[0] == "distribution_shape"
    cfg = dict(bp.get_default_configs()[0])
    cfg["primary_metric"] = "distribution_shape"
    v = bp.validate(cfg)
    assert v["valid"], v
    r = bp.rank_structures(cfg, build_stub_chain())
    assert r["ok"]
    assert r["summary"]["primary_metric"] == "distribution_shape"
    assert r["summary"]["primary_metric_substituted"] is True
    assert r["ranked"][0]["metrics"]["expectedDistributionShape"] is None


def test_reject_missing_decay_trailing():
    cfg = dict(bp.get_default_configs()[0])
    cfg["exit_rules"] = {"take_profit": {"enabled": True}}
    v = bp.validate(cfg)
    assert not v["valid"]


def test_rank_proxy_and_honesty_fields():
    cfg = bp.get_default_configs()[0]
    chain = build_stub_chain()
    r = bp.rank_structures(cfg, chain)
    assert r["ok"]
    assert r["summary"]["primary_metric_substituted"] is True
    assert r["summary"]["ranked_by"] == "convexity_ratio_proxy"
    assert len(r["ranked"]) > 0
    top = r["ranked"][0]
    assert top["ranked_by"] == "convexity_ratio_proxy"
    assert top["primary_metric_substituted"] is True
    assert top["data_provenance"]["source"] == "stub"
    assert top["metrics"]["convexityProvisional"] is True
    assert top["metrics"]["netPremiumAbs"] >= 0
    # ratios use abs premium (never negative for debit flies)
    if top["metrics"]["debitToWidthRatio"] is not None:
        assert top["metrics"]["debitToWidthRatio"] >= 0


def test_strict_primary_fails_loud():
    cfg = bp.get_default_configs()[0]
    r = bp.rank_structures(cfg, build_stub_chain(), strict_primary=True)
    assert r["ok"] is False
    assert r["error"] == "primary_metric_uncomputable"


def test_all_templates_rank():
    chain = build_stub_chain()
    for cfg in bp.get_default_configs():
        r = bp.rank_structures(cfg, chain)
        assert r["ok"] and len(r["ranked"]) > 0, cfg.get("name")
