"""Quebec poller / forward progress (Quebec Poller Spec v1.0)."""

from __future__ import annotations

import pytest

import db
import quebec as quebec_mod
from agent_auth import Actor


@pytest.fixture()
def admin_actor():
    return Actor(kind="human", id=0, label="test-admin", role="administrator")


@pytest.fixture()
def course_card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Quebec Poller Course",
            "intent_md": "Teach max loss before entry; process only.",
            "product_line": "course",
            "priority": 99,
            "cast_id": "DUDE-PRIMARY",
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


def test_quebec_status_endpoint(client, admin_cookies):
    r = client.get("/api/admin/board/quebec/status", cookies=admin_cookies)
    assert r.status_code == 200
    body = r.json()
    assert "config" in body
    assert "poller_enabled_env" in body["config"]


def test_tick_advances_queued(client, admin_cookies, course_card):
    iid = course_card["id"]
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/transition",
            cookies=admin_cookies,
            json={"to_status": "queued"},
        ).status_code
        == 200
    )
    r = client.post(
        "/api/admin/board/quebec/tick",
        cookies=admin_cookies,
        json={"force": True, "max_actions": 10, "produce": False},
    )
    assert r.status_code == 200, r.text
    assert r.json()["tick"]["action_count"] >= 1
    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    assert detail["status"] in ("scheduled", "in_production")


def test_tick_produce_adds_research_pack(
    client, admin_cookies, course_card, admin_actor, monkeypatch
):
    monkeypatch.setenv("LABS_QUEBEC_AUTO_PRODUCE_MODE", "fixtures")
    iid = course_card["id"]
    for to, extra in (
        ("queued", {}),
        ("scheduled", {}),
        ("in_production", {"sub_stage": "research"}),
    ):
        assert (
            client.post(
                f"/api/admin/board/items/{iid}/transition",
                cookies=admin_cookies,
                json={"to_status": to, **extra},
            ).status_code
            == 200
        ), to

    r = client.post(
        "/api/admin/board/quebec/tick",
        cookies=admin_cookies,
        json={"force": True, "max_actions": 5, "produce": True},
    )
    assert r.status_code == 200, r.text
    produced = r.json()["tick"].get("produced") or []
    assert any(p.get("stage") == "research_pack" for p in produced), r.json()["tick"]

    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    stages = [a["stage"] for a in detail["artifacts"]]
    assert "research_pack" in stages


def test_forward_progress_reaches_awaiting_approval(
    client, admin_cookies, course_card, admin_actor, monkeypatch
):
    """With produce=fixtures, poller can complete a course package over several cycles."""
    monkeypatch.setenv("LABS_QUEBEC_AUTO_PRODUCE_MODE", "fixtures")
    monkeypatch.setenv("LABS_QUEBEC_AUTO_PRODUCE", "1")
    monkeypatch.delenv("LABS_QUEBEC_AUTO_HEYGEN", raising=False)
    iid = course_card["id"]
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/transition",
            cookies=admin_cookies,
            json={"to_status": "queued"},
        ).status_code
        == 200
    )

    # Enough cycles for all stages + advances (one produce per cycle per card)
    for _ in range(12):
        quebec_mod.tick(
            admin_actor, force=True, max_actions=30, produce=True
        )
        detail = client.get(
            f"/api/admin/board/items/{iid}", cookies=admin_cookies
        ).json()["item"]
        if detail["status"] == "awaiting_approval":
            break

    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    assert detail["status"] == "awaiting_approval", detail
    stages = {a["stage"] for a in detail["artifacts"]}
    for need in (
        "research_pack",
        "lesson_plan",
        "script",
        "video_package",
        "placement_proposal",
        "vision_alignment",
    ):
        assert need in stages, stages

    # Still cannot skip human publish
    assert detail["status"] != "published"
