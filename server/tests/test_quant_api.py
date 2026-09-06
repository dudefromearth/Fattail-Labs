"""Route contract: 501 when unconfigured, named refusals, no archive touched."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from quant.build import build_day
from tests.quant_fixture import write_day

pytest.importorskip("zstandard")


@pytest.fixture()
def app(tmp_path, monkeypatch):
    arch = write_day(tmp_path / "arch", snaps=80)
    build_day(arch, tmp_path / "store", "2026-09-04", "XSP", greeks_quantum=6, verify=False)
    for k in ("LABS_QUANT_STORE_ROOT", "LABS_QUANT_GREEKS_QUANTUM",
              "LABS_QUANT_FEE_PER_CONTRACT", "LABS_QUANT_FILL_P_UNFITTED"):
        monkeypatch.delenv(k, raising=False)
    import routes.quant as rq
    monkeypatch.setattr(rq, "require_session", lambda request: {"sub": "test"})
    from quant.store import open_day
    open_day.cache_clear()
    a = FastAPI(); a.include_router(rq.router)
    return a, tmp_path / "store"


def _configure(monkeypatch, root: Path):
    monkeypatch.setenv("LABS_QUANT_STORE_ROOT", str(root))
    monkeypatch.setenv("LABS_QUANT_GREEKS_QUANTUM", "6")
    monkeypatch.setenv("LABS_QUANT_FEE_PER_CONTRACT", "0.65")
    monkeypatch.setenv("LABS_QUANT_FILL_P_UNFITTED", "0.85")


def test_unconfigured_is_a_named_501(app):
    a, _ = app
    r = TestClient(a).get("/api/me/quant/days")
    assert r.status_code == 501 and r.json()["error"] == "QUANT STORE NOT CONFIGURED"


def test_partial_config_fails_loud(app, monkeypatch):
    a, root = app
    monkeypatch.setenv("LABS_QUANT_STORE_ROOT", str(root))
    from config import ConfigError
    with pytest.raises(ConfigError):
        TestClient(a, raise_server_exceptions=True).get("/api/me/quant/days")


def test_days_series_mark_simulate(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    c = TestClient(a)
    d = c.get("/api/me/quant/days").json()
    assert d["days"][0]["book"] == "XSP" and d["days"][0]["C"] > 0

    s = c.get("/api/me/quant/series", params={"day": "2026-09-04", "book": "XSP",
                                               "contracts": "630C,630P", "fields": "mid,iv"}).json()
    assert len(s["values"]["mid"]) == 2 and len(s["present"][0]) == s["T"]
    assert s["quantised"] == {"mid": False, "iv": True}

    m = c.get("/api/me/quant/mark", params={"day": "2026-09-04", "book": "XSP",
                                             "legs": "628C:+1,630C:-2,632C:+1"}).json()
    assert len(m["mark"]) == m["t1"] and "withheld" in m

    sim = c.post("/api/me/quant/simulate", json={"day": "2026-09-04", "book": "XSP",
                                                 "legs": "628C:+1,630C:-2,632C:+1",
                                                 "t_entry": 3, "t_exit": 60, "paths": 200, "seed": 7}).json()
    assert "ecdf" in sim and "p50" not in sim and sim["fidelity"] == "era1_no_depth"
    assert sim["provenance"]["greeks_quantum_decimals"] == 6


def test_unknown_contract_is_named(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    r = TestClient(a).get("/api/me/quant/mark", params={"day": "2026-09-04", "book": "XSP",
                                                         "legs": "999C:+1"})
    assert r.status_code == 404 and "CONTRACT_NOT_IN_BOOK" in r.json()["detail"]


def test_absent_leg_is_a_409_refusal_not_a_number(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    r = TestClient(a).post("/api/me/quant/simulate", json={"day": "2026-09-04", "book": "XSP",
                                                            "legs": "619C:+1", "t_entry": 0,
                                                            "t_exit": 70, "paths": 50})
    assert r.status_code == 409 and r.json()["detail"]["refusal"] == "LEG_ABSENT_AT_INSTANT"


def test_idealised_label_at_zero_latency(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    r = TestClient(a).post("/api/me/quant/simulate", json={"day": "2026-09-04", "book": "XSP",
                                                            "legs": "630C:+1", "t_entry": 2,
                                                            "t_exit": 60, "paths": 50,
                                                            "latency_snapshots": 0}).json()
    assert r["assumptions"]["label"] == "idealised"


def test_chain_at_t_is_the_snapshot_at_or_before_never_a_blend(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    c = TestClient(a)
    sp = c.get("/api/me/quant/spot", params={"day": "2026-09-04", "book": "XSP"}).json()
    t_ms = sp["time_ms"][10] + 1300                       # inside the 2 s gap after t=10
    r = c.get("/api/me/quant/chain", params={"day": "2026-09-04", "book": "XSP", "t_ms": t_ms}).json()
    assert r["t"] == 10 and r["lag_ms"] == 1300 and r["time_ms"] == sp["time_ms"][10]
    sides = {(row["strike"], row["side"]) for row in r["rows"]}
    assert (630.0, "C") in sides and (630.0, "P") in sides   # both sides survive
    assert r["quantised"]["delta"] is True
    before = c.get("/api/me/quant/chain", params={"day": "2026-09-04", "book": "XSP",
                                                  "t_ms": sp["time_ms"][0] - 1})
    assert before.status_code == 404 and "BEFORE_FIRST_SNAPSHOT" in before.json()["detail"]


def test_controls_grid_endpoint_and_off_grid_422(app, monkeypatch):
    a, root = app
    _configure(monkeypatch, root)
    c = TestClient(a)
    g = c.get("/api/me/quant/controls").json()
    assert g["cell_ceiling"] == 64 and 30 in g["window_s"]
    assert g["defaults"]["order_type"] == "complex"
    bad = c.post("/api/me/quant/simulate", json={"day": "2026-09-04", "book": "XSP",
                                                 "legs": "630C:+1", "t_entry": 2, "t_exit": 60,
                                                 "paths": 20, "controls": {"window_s": 15}})
    assert bad.status_code == 422 and bad.json()["detail"]["refusal"] == "CONTROL_OFF_GRID"
    ceil = c.post("/api/me/quant/sweep", json={"day": "2026-09-04", "book": "XSP",
                                               "legs": "630C:+1", "t_from": 2, "t_to": 40,
                                               "t_exit": 60, "step": 5, "paths_per_entry": 5,
                                               "controls_sweep": [{}] * 65})
    assert ceil.status_code == 422 and ceil.json()["detail"]["refusal"] == "CELL_CEILING"
    ok = c.post("/api/me/quant/sweep", json={"day": "2026-09-04", "book": "XSP",
                                             "legs": "628C:+1,630C:-2,632C:+1",
                                             "t_from": 3, "t_to": 40, "t_exit": 70,
                                             "step": 5, "paths_per_entry": 10, "seed": 7})
    assert ok.status_code == 200 and ok.json()["entries"] > 1
