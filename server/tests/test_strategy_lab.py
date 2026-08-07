"""Strategy Lab — ownership isolation, phase machine, portability."""

from __future__ import annotations

import json
from pathlib import Path

import db
import identity as identity_mod
import strategy_lab_domain as sld

REPO = Path(__file__).resolve().parents[2]
FIXTURE = REPO / "fixtures" / "strategy-lab" / "exercise-pack-v1.json"


def test_normalize_phase_aliases():
    assert sld.normalize_phase("design") == "development"
    assert sld.normalize_phase("campaign") == "deployment"
    assert sld.normalize_phase("killed") == "bin"


def test_development_states_order():
    keys = sld.state_keys("development")
    assert keys[0] == "hypothesis"
    assert keys[-1] == "deployed"
    assert sld.ready_for_curation("deployed")
    assert not sld.ready_for_curation("hypothesis")


def test_next_state():
    assert sld.next_state("development", "hypothesis") == "model"
    assert sld.next_state("development", "deployed") is None
    assert sld.next_state("curation", "monitored") is None
    assert sld.next_state("deployment", "strategy") == "capital_allocation"


def test_meta_payload():
    m = sld.meta_payload()
    assert len(m["phases"]) == 4
    assert m["max_per_phase"] == 100
    dev = next(p for p in m["phases"] if p["key"] == "development")
    keys = [s["key"] for s in dev["states"]]
    assert keys == ["hypothesis", "model", "is_test", "oos_test", "deployed"]
    labels = {s["key"]: s["label"] for s in dev["states"]}
    assert labels["is_test"] == "Back test"
    assert labels["oos_test"] == "Forward walk"


def test_create_blank_newborn(client):
    """Blank origin mints Design newborn at hypothesis with birth@1."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-birth@labs.test", "ZZ Strategy Lab Birth"
            )
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    r = client.post(
        "/api/me/strategy-lab/strategies",
        json={"origin": "blank", "name": "Baby bot"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    s = r.json()["strategy"]
    assert s["name"] == "Baby bot"
    assert s["phase"] == "development"
    assert s["phase_state"] == "hypothesis"
    birth = (s.get("attributes") or {}).get("birth@1") or {}
    assert birth.get("kind") == "blank"
    progress = (s.get("attributes") or {}).get("design_progress@1") or {}
    assert progress.get("next_section") == "identity"
    assert progress.get("ready_for_risk") is False
    log = s.get("lifecycle_log") or []
    assert any(e.get("event") == "created" and e.get("origin") == "blank" for e in log)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )


def test_create_from_house_ready_for_risk(client):
    """House origin applies design, phase_state=model, next_section=risk."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-house-create@labs.test", "ZZ House Create"
            )
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    r = client.post(
        "/api/me/strategy-lab/strategies",
        json={
            "origin": "house",
            "house_key": "0dte_otm_classic_butterfly",
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    s = r.json()["strategy"]
    assert s["phase"] == "development"
    assert s["phase_state"] == "model"
    birth = (s.get("attributes") or {}).get("birth@1") or {}
    assert birth.get("kind") == "house"
    assert birth.get("house_key") == "0dte_otm_classic_butterfly"
    progress = (s.get("attributes") or {}).get("design_progress@1") or {}
    assert progress.get("ready_for_risk") is True
    assert progress.get("next_section") == "risk"
    assert "identity" in (progress.get("completed_sections") or [])
    assert "structure" in (progress.get("completed_sections") or [])
    house = s.get("house_design") or (s.get("attributes") or {}).get("house_design@1")
    assert house and (house.get("key") == "0dte_otm_classic_butterfly")
    cfg = (s.get("attributes") or {}).get("butterfly_config@1") or {}
    assert cfg.get("dte_type") or cfg.get("butterfly_family")
    log = s.get("lifecycle_log") or []
    assert any(e.get("event") == "created" for e in log)
    assert any(e.get("event") == "house_design_apply" for e in log)
    assert any(e.get("event") == "ready_for_risk" for e in log)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )


def test_development_validation_gate(client):
    """Back test → forward walk required before promote to Curation."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-val@labs.test", "ZZ Strategy Lab Val"
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    # create strategy
    r = client.post(
        "/api/me/strategy-lab/strategies",
        json={"name": "Val gate"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    sid = r.json()["strategy"]["id"]

    # promote without validation → 422
    r = client.post(
        f"/api/me/strategy-lab/strategies/{sid}/promote",
        cookies=cookies,
    )
    assert r.status_code == 422

    # forward walk before backtest → 422
    r = client.post(
        f"/api/me/strategy-lab/strategies/{sid}/forward-walk",
        cookies=cookies,
    )
    assert r.status_code == 422

    r = client.post(
        f"/api/me/strategy-lab/strategies/{sid}/backtest",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["strategy"]["phase_state"] == "is_test"
    assert r.json()["result"]["status"] == "pass"

    r = client.post(
        f"/api/me/strategy-lab/strategies/{sid}/forward-walk",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["strategy"]["phase_state"] == "deployed"
    assert r.json().get("ready_for_curation") is True

    r = client.get(
        f"/api/me/strategy-lab/strategies/{sid}/validation",
        cookies=cookies,
    )
    assert r.status_code == 200
    assert r.json()["ready_for_curation"] is True
    assert r.json()["gaps"] == []

    r = client.post(
        f"/api/me/strategy-lab/strategies/{sid}/promote",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["strategy"]["phase"] == "curation"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )


def test_exercise_pack_covers_all_states():
    pack = sld.build_exercise_pack()
    assert pack["format"] == sld.FORMAT_ID
    assert pack["lab"]["counts"]["total"] == 20
    seen = {(s["phase"], s["phase_state"]) for s in pack["strategies"]}
    for phase in sld.PHASES:
        for sk, _lab in sld.PHASE_STATES[phase]:
            assert (phase, sk) in seen
    assert FIXTURE.is_file(), "run domain build to refresh fixture"
    on_disk = json.loads(FIXTURE.read_text())
    assert on_disk["format"] == sld.FORMAT_ID
    assert len(on_disk["strategies"]) == 20


def test_import_export_round_trip_replace(client):
    """replace_lab import → export portable fields match (probe identity)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-io@labs.test", "ZZ Strategy Lab IO"
            )

    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    pack = sld.build_exercise_pack(email="zztest-strategy-lab-io@labs.test")

    # Preview
    r = client.post(
        "/api/me/strategy-lab/import/preview",
        json={"document": pack, "policy": "replace_lab"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    prev = r.json()
    assert prev["summary"]["create"] == 20

    # Commit replace
    r = client.post(
        "/api/me/strategy-lab/import/commit",
        json={
            "document": pack,
            "policy": "replace_lab",
            "confirm": "REPLACE_LAB",
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["created"] == 20
    assert body["purged"] >= 0

    # Export
    r = client.get("/api/me/strategy-lab/export", cookies=cookies)
    assert r.status_code == 200, r.text
    exported = r.json()
    assert exported["format"] == sld.FORMAT_ID
    assert exported["lab"]["counts"]["total"] == 20
    assert "identity_id" not in json.dumps(exported)
    assert "db_id" not in json.dumps(exported)

    # Second additive import → all skip
    r = client.post(
        "/api/me/strategy-lab/import/commit",
        json={"document": pack, "policy": "additive"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["created"] == 0
    assert r.json()["skipped"] == 20

    # Cleanup
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )


def test_replace_returns_recovery_id(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-rec@labs.test", "ZZ Strategy Lab Rec"
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    pack = sld.build_exercise_pack()
    r = client.post(
        "/api/me/strategy-lab/import/commit",
        json={
            "document": pack,
            "policy": "replace_lab",
            "confirm": "REPLACE_LAB",
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("recovery_id")
    # list recoveries
    r2 = client.get("/api/me/strategy-lab/recoveries", cookies=cookies)
    assert r2.status_code == 200
    assert any(x["recovery_id"] == body["recovery_id"] for x in r2.json()["recoveries"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM strategy_lab_recoveries WHERE identity_id = %s",
                (iid,),
            )


def test_packs_api(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-packs@labs.test", "ZZ Strategy Lab Packs"
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get("/api/me/strategy-lab/packs", cookies=cookies)
    assert r.status_code == 200
    assert r.json()["packs"][0]["id"] == "butterfly"
    r = client.get("/api/me/strategy-lab/packs/butterfly", cookies=cookies)
    assert r.status_code == 200
    assert "schema" in r.json()
    cfg = r.json()["defaults"][0]
    r = client.post(
        "/api/me/strategy-lab/packs/butterfly/validate",
        json={"config": cfg},
        cookies=cookies,
    )
    assert r.status_code == 200
    assert r.json()["valid"] is True
    r = client.post(
        "/api/me/strategy-lab/packs/butterfly/rank",
        json={"config": cfg},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["summary"]["primary_metric_substituted"] is True
    assert len(body["ranked"]) > 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )


def test_import_requires_replace_confirm(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-strategy-lab-io2@labs.test", "ZZ Strategy Lab IO2"
            )
    from tests.conftest import cookie_for

    cookies = cookie_for("navigator", identity_id=iid)
    pack = sld.build_exercise_pack()
    r = client.post(
        "/api/me/strategy-lab/import/commit",
        json={"document": pack, "policy": "replace_lab"},
        cookies=cookies,
    )
    assert r.status_code == 422
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )
