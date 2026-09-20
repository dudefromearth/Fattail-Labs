"""REQ-009 v0.2 AT-SPEC-1…11. Isolation: symbology spec + grain. No LIM/QFRIC/XS/PPL."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from market_data.vp_engine.coverage import VP_ROW
from symbology import spec as spec_mod
from symbology.spec import (
    BadAsOf,
    SpecGrainMismatch,
    SpecIncomplete,
    SpecLoadRefused,
    activation_state,
    assert_native_grain,
    format_price,
    grain_for,
    load_specs,
    lookup_for_http,
    spec_at,
    tick_value_of,
)
from tests.conftest import cookie_for

MEMBER = cookie_for("navigator")
ROOT = Path(__file__).resolve().parents[2]
SNAP = ROOT / "server" / "symbology" / "spec_snapshots"


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.setenv("LABS_SYMBOLOGY_API_BASE", "inprocess")
    spec_mod.reset_specs_for_tests()
    yield
    spec_mod.reset_specs_for_tests()


def _get(client, path, **params):
    return client.get(path, params=params or None, cookies=MEMBER)


def test_at_spec_1_es_body(client):
    r = _get(client, "/symbology/v1/spec/ES")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["big_point_value"] == 50
    assert body["tick_value"] == 12.5
    assert body["tick_size"] == 0.25
    assert body["citation"]["url"].endswith("e-mini-sandp500.contractSpecs.html")
    assert body["as_of"] == "2026-09-18"
    assert "session_summary" not in body


def test_at_spec_2_mes_own_page(client):
    r = _get(client, "/symbology/v1/spec/MES")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["big_point_value"] == 5
    assert body["tick_value"] == 1.25
    es = _get(client, "/symbology/v1/spec/ES").json()
    assert body["calendar_id"] == es["calendar_id"]
    assert "micro-e-mini-sandp500.contractSpecs.html" in body["citation"]["url"]
    assert "faq" not in body["citation"]["url"].lower()


def test_at_spec_3_snapshots_store_neither_derived_nor_caption():
    for path in SNAP.glob("*.json"):
        rec = json.loads(path.read_text(encoding="utf-8"))
        assert "tick_value" not in rec, path.name
        assert "session_summary" not in rec, path.name


def test_at_spec_4_zb_fractional_unlisted(client):
    zb = spec_mod.current_spec("ZB")
    assert zb is not None
    assert format_price(115.5, zb) == "115'16"
    assert zb["product_codes"]["clearport"] == "17"
    assert zb["product_codes"]["clearing"] == "17"
    r = _get(client, "/symbology/v1/spec/ZB")
    assert r.status_code == 404, r.text


def test_at_spec_5_spy_404(client):
    r = _get(client, "/symbology/v1/spec/SPY")
    assert r.status_code == 404, r.text


def test_at_spec_6_grain_and_vp_row():
    assert grain_for("ES") == 0.25
    assert grain_for("MES") == 0.25
    assert grain_for("ESZ2026") == 0.25
    assert grain_for("SPY") == 0.10
    assert "ES" not in VP_ROW
    assert "MES" not in VP_ROW
    assert VP_ROW == {"SPY": 0.10}
    assert assert_native_grain("ES", 0.25) == 0.25
    with pytest.raises(SpecGrainMismatch):
        assert_native_grain("ES", 0.10)
    with pytest.raises(SpecIncomplete):
        grain_for("NQ")


def test_at_spec_7_grep_allowlist():
    allow = {
        ROOT / "Specs" / "FatTail-Labs-Contract-Specifications-Registry-Spec-v0.1.md",
        ROOT / "Specs" / "FatTail-Labs-Contract-Specifications-Registry-Spec-v0.2.md",
        ROOT / "server" / "sa_dev" / "service.py",  # R0-3 until blessed delete
    }
    allow.update(SNAP.glob("*.json"))
    consumers = [
        ROOT / "server" / "market_data" / "vp_engine" / "coverage.py",
        ROOT / "server" / "market_data" / "vp_engine" / "window_bins.py",
        ROOT / "server" / "market_data" / "vp_engine" / "rebuild.py",
        ROOT / "server" / "market_data" / "vp_api" / "app.py",
        ROOT / "web" / "lib" / "symbology" / "picker.ts",
        ROOT / "server" / "symbology" / "service.py",
    ]
    for path in consumers:
        text = path.read_text(encoding="utf-8")
        if path in allow:
            continue
        if path.name == "coverage.py":
            assert "ES" not in VP_ROW
            assert '"ES"' not in text or "no ES/MES" in text
            continue
        assert "HMUZ" not in text, path
        assert "VP_ROW.get(" not in text, path


def test_at_spec_8_as_of_past_version():
    spec_mod.install_version_for_tests(
        {
            "symbol": "ES",
            "title": "E-mini S&P 500 Futures",
            "spec_version": 0,
            "as_of": "2020-01-02",
            "citation": {
                "exchange": "CME",
                "title": "old",
                "url": "https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html",
                "retrieved_at": "2020-01-02T00:00:00-06:00",
                "snapshot": "server/symbology/spec_snapshots/ES.json",
            },
            "exchange": "CME",
            "product_codes": {"globex": "ES", "clearport": "ES", "clearing": "ES"},
            "tick_size": 0.25,
            "big_point_value": 50,
            "display_shape": {"kind": "decimal", "precision": 2},
            "months": ["H", "M", "U", "Z"],
            "periodicity": "quarterly",
            "settlement": "cash",
            "calendar_id": "cme-equity-index-globex",
            "member_visible": True,
        }
    )
    old = spec_at("ES", as_of="2020-06-01")
    assert old is not None
    assert old["as_of"] == "2020-01-02"
    now = spec_at("ES", as_of=None)
    assert now is not None
    assert now["as_of"] == "2026-09-18"


def test_at_spec_8_bad_as_of_422(client):
    r = _get(client, "/symbology/v1/spec/ES", as_of="not-a-date")
    assert r.status_code == 422, r.text


def test_at_spec_9_grandfather_and_new_activation():
    artifact = {"kind": "prints", "as_of": "2026-09-18", "max_age": 30}
    # prints kind stays COMING (model-kind blocked). Chart-kind artifact:
    chart = {"kind": "session", "as_of": "2026-09-18", "max_age": 30}
    state, reason = activation_state(
        "ES", kind="chart", artifact=chart, now_iso="2026-09-20"
    )
    assert state == "ACTIVE"
    assert reason is None
    state, reason = activation_state(
        "NQ", kind="chart", artifact=chart, now_iso="2026-09-20"
    )
    assert state == "COMING"
    assert reason == "SPEC INCOMPLETE"
    del artifact


def test_at_spec_10_title_from_spec():
    from symbology.spec import title_for_root

    assert title_for_root("ES") == "E-mini S&P 500 Futures"
    assert title_for_root("MES") == "Micro E-mini S&P 500 Futures"
    picker = (ROOT / "web" / "lib" / "symbology" / "picker.ts").read_text(
        encoding="utf-8"
    )
    assert 'title: "E-mini S&P 500 Futures"' not in picker
    assert "ROOT_CHROME.title" not in picker
    service = (ROOT / "server" / "symbology" / "service.py").read_text(encoding="utf-8")
    assert "DISPLAY_TITLES" not in service


def test_at_spec_11_hop_does_not_scrape():
    hop = (ROOT / "server" / "routes" / "symbology.py").read_text(encoding="utf-8")
    assert "cmegroup.com" not in hop
    assert "import httpx" not in hop
    assert "massive" not in hop.lower()
    fn = hop[hop.index("def get_spec") : hop.index("def get_spec") + 800]
    assert "_maybe_hop" in fn
    assert "lookup_for_http" in fn


def test_loader_refuses_while_session_open():
    with pytest.raises(SpecLoadRefused):
        load_specs(session_open=True)
    out = load_specs(session_open=False)
    assert out["ok"] is True
    assert "ES" in out["roots"]


def test_tick_value_computed_not_stored():
    rec = spec_mod.current_spec("ES")
    assert rec is not None
    assert "tick_value" not in rec
    assert tick_value_of(rec) == 12.5


def test_lookup_unknown_none():
    assert lookup_for_http("NQ", as_of=None, member_surface=True) is None
    with pytest.raises(BadAsOf):
        lookup_for_http("ES", as_of="13/09/2026", member_surface=True)
