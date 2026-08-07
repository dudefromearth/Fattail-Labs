"""First-mint provision: house bots in Curate, armed for sim."""

from __future__ import annotations

import secrets

import db
import identity as identity_mod
import strategy_lab_designs as sldes
from tests.conftest import cookie_for


def test_new_identity_gets_starter_curate_bots():
    email = f"zztest-mint-{secrets.token_hex(4)}@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Mint Probe")
            cur.execute(
                """SELECT name, phase, phase_state, attributes_json
                   FROM strategy_lab_strategies
                   WHERE identity_id = %s
                   ORDER BY id ASC""",
                (iid,),
            )
            bots = cur.fetchall()
            cur.execute(
                """SELECT status, strategy_public_id
                   FROM strategy_lab_curate_instances
                   WHERE identity_id = %s""",
                (iid,),
            )
            inst = cur.fetchall()

    assert len(bots) == len(sldes.STARTER_HOUSE_KEYS)
    assert all(b["phase"] == "curation" for b in bots)
    assert len(inst) == len(bots)
    assert all(i["status"] == "armed" for i in inst)

    # House binding present
    import json

    for b in bots:
        attrs = b["attributes_json"]
        if isinstance(attrs, str):
            attrs = json.loads(attrs)
        house = (attrs or {}).get("house_design@1") or {}
        assert house.get("key") in sldes.STARTER_HOUSE_KEYS
        assert house.get("version")
        assert house.get("source") == "house"


def test_second_mint_path_is_idempotent_no_duplicate():
    email = f"zztest-mint2-{secrets.token_hex(4)}@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Mint2")
            cur.execute(
                "SELECT COUNT(*) AS n FROM strategy_lab_strategies WHERE identity_id=%s",
                (iid,),
            )
            n_first = int(cur.fetchone()["n"])
            # get_or_create again must not re-provision
            iid2 = identity_mod.get_or_create_identity(cur, email, "Mint2")
            assert iid2 == iid
            cur.execute(
                "SELECT COUNT(*) AS n FROM strategy_lab_strategies WHERE identity_id=%s",
                (iid,),
            )
            n = int(cur.fetchone()["n"])
    assert n_first == len(sldes.STARTER_HOUSE_KEYS)
    assert n == n_first


def test_provision_direct_and_list_api(client):
    email = f"zztest-mint3-{secrets.token_hex(4)}@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Mint3")
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get("/api/me/strategy-lab/strategies", cookies=cookies)
    assert r.status_code == 200
    strats = r.json()["strategies"]
    assert len(strats) >= len(sldes.STARTER_HOUSE_KEYS)
    curate = [s for s in strats if s["phase"] == "curation"]
    assert len(curate) >= len(sldes.STARTER_HOUSE_KEYS)
    # house_design on strategy DTO
    with_house = [s for s in curate if s.get("house_design")]
    assert len(with_house) >= 1
    assert with_house[0]["house_design"].get("key")

    r = client.get("/api/me/strategy-lab/curate/comparison", cookies=cookies)
    assert r.status_code == 200
    bots = r.json().get("bots") or []
    assert len(bots) >= len(sldes.STARTER_HOUSE_KEYS)
    assert any(b.get("house_design_key") for b in bots)


def test_house_library_api_immutable_flags(client):
    cookies = cookie_for("navigator", identity_id=0)
    # need a real identity for session? cookie_for 0 is admin internal
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, f"zztest-lib-{secrets.token_hex(3)}@labs.test", "Lib"
            )
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get("/api/me/strategy-lab/designs", cookies=cookies)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("member_may_edit_house") is False
    assert j.get("member_may_remove_house") is False
    house = j.get("house") or []
    assert len(house) >= 5
    keys = {h["key"] for h in house}
    assert "0dte_otm_classic_butterfly" in keys
    assert "convex_stack" in keys
    assert "sigma_drift" in keys
    for h in house:
        assert h.get("immutable") is True
        assert h.get("member_may_remove") is False
        assert h.get("course_refs"), f"{h['key']} needs course_refs"
        assert h.get("version")
        assert "entry_conditions" in (h.get("config") or {})
        assert "exit_rules" in (h.get("config") or {})
