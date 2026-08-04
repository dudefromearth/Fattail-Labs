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
