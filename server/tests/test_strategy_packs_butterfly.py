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
    assert "symmetric" in d["schema"]["variants"]
    assert "broken_wing" in d["schema"]["variants"]
    assert len(d["defaults"]) == 6
    # min_convexity_quality optional on schema
    bwb_fields = {f["name"]: f for f in d["schema"]["variants"]["broken_wing"]}
    assert bwb_fields["min_convexity_quality"]["required"] is False


def test_defaults_validate():
    for cfg in bp.get_default_configs():
        v = bp.validate(cfg)
        assert v["valid"], (cfg.get("name"), v)


def test_reject_win_rate_primary():
    cfg = dict(bp.get_default_configs()[0])
    cfg["primary_metric"] = "win_rate"
    v = bp.validate(cfg)
    assert not v["valid"]
    assert any("risk-adjusted" in e or "win" in e.lower() for e in v["errors"])


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
