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
    card = _to_spec(client, "zz-if3-plan")
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md"},
    )
    assert r.status_code == 200, r.text
    got = r.json()["card"]
    assert got["lane"] == "build"
    assert got["built_ready"] is True
    assert got["plan_ref"]
    assert got["auto_move_reason"]
    assert "plan attached" in got["auto_move_reason"].lower()
    assert "approval" in got["auto_move_reason"].lower()
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    assert any(t["from_lane"] == "spec" and t["to_lane"] == "build" and t["auto_move"] for t in trans)


def test_hold_blocks_conveyor_clear_resumes(client):
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
    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r2.status_code == 200, r.text
    assert r2.json()["card"]["lane"] == "build"
    assert r2.json()["card"]["built_ready"] is True


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
