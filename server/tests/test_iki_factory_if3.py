"""IF-3 characterization — Spec draft, plan-as-approval conveyor, Hold, Rework."""

from __future__ import annotations

import pytest

import db
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _agent, _create


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _cleanup():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_cards WHERE title LIKE %s",
                ("zz-if3-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _to_spec(client, title: str) -> dict:
    card = _create(client, title)
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "spec"},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def test_admin_research_to_spec_drafts_and_waits(client):
    card = _to_spec(client, "zz-if3-draft")
    assert card["lane"] == "spec"
    assert card["spec_ready"] is True
    assert card["spec_md"]
    assert "Template Specification" in card["spec_md"]
    assert card["waiting_reason"] == "waiting for plan"
    assert card["built_ready"] is False


def test_agent_cannot_research_to_spec(client):
    card = _create(client, "zz-if3-agent-rs")
    key = _agent("zz-if3-gemba", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "spec"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["card"]["lane"] == "research"


def test_spec_to_build_without_plan_rejected(client):
    card = _to_spec(client, "zz-if3-no-plan")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["reason"] == "waiting for plan"
    assert r.json()["detail"]["card"]["lane"] == "spec"


def test_plan_attach_conveyors_to_build(client):
    """IF-7 re-author (India-named, DL-539 GO IKI-FACTORY-IF7).

    BEFORE (shipped, IF-3-G PASS): patching plan_ref alone auto-advanced the
    card to Build in the same request — `auto_move_reason` populated with
    "plan attached... approval", and the transition log carried an
    auto_move=True entry for spec->build with no separate pull.

    AFTER (v1.0 §3.1, §3.4): "ready for Build" is unchanged — spec(s) +
    build plan attached, no blockers — but reaching Build is now a second,
    explicit pull. The patch alone leaves the card in "spec"; the pull's
    own reason text is what used to live in auto_move_reason (now empty,
    since nothing is auto); the transition is auto_move=False.
    """
    card = _to_spec(client, "zz-if3-plan")
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md"},
    )
    assert r.status_code == 200, r.text
    patched = r.json()["card"]
    assert patched["lane"] == "spec"  # patch alone does not advance
    assert patched["plan_ref"]
    assert not patched["auto_move_reason"]

    pulled = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert pulled.status_code == 200, pulled.text
    got = pulled.json()["card"]
    assert got["lane"] == "build"
    assert got["built_ready"] is True
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    move = next(t for t in trans if t["from_lane"] == "spec" and t["to_lane"] == "build")
    assert move["auto_move"] is False
    assert (move.get("reason") or "").strip()


def test_hold_blocks_conveyor_clear_resumes(client):
    """IF-7 re-author (India-named, DL-539 GO IKI-FACTORY-IF7).

    BEFORE (shipped, IF-3-G PASS): Hold blocked the AUTO-fire that patching
    plan_ref used to trigger — clearing Hold let the same patch's dormant
    conveyor effect resume, moving the card to Build without a further
    request.

    AFTER (v1.0 §3.6, charter invariant 5): there is no auto-fire left for
    Hold to block on a patch — patching plan_ref never moved the card
    either way. What Hold now blocks is the EXPLICIT pull itself: attempting
    to pull a held card to Build is rejected (422, HOLD_REASON) regardless
    of whether plan_ref is set; clearing Hold does not move anything by
    itself, but the pull that was rejected now succeeds when retried.
    """
    card = _to_spec(client, "zz-if3-hold")
    client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if3-hold-plan.md"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "spec"
    assert r.json()["card"]["hold"] is True

    blocked = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert blocked.status_code == 422, blocked.text
    assert "hold" in blocked.json()["detail"]["reason"].lower()
    assert blocked.json()["detail"]["card"]["lane"] == "spec"

    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r2.status_code == 200, r.text
    assert r2.json()["card"]["lane"] == "spec"  # clearing Hold moves nothing by itself

    pulled = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert pulled.status_code == 200, pulled.text
    assert pulled.json()["card"]["lane"] == "build"
    assert pulled.json()["card"]["built_ready"] is True


def test_gemba_cannot_choose_rework(client):
    card = _to_spec(client, "zz-if3-rework-agent")
    key = _agent("zz-if3-rework", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/status",
        headers={"Authorization": f"Bearer {key}"},
        json={"card_status": "rework", "rework_lane": "research"},
    )
    assert r.status_code in (401, 403, 422)


def test_admin_rework_to_research(client):
    card = _to_spec(client, "zz-if3-rework-admin")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/status",
        cookies=_admin(),
        json={"card_status": "rework", "rework_lane": "research"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "research"
    assert r.json()["card"]["card_status"] == "rework"
