"""Content backlog & production board (Content Board Spec v1.0)."""

from __future__ import annotations

import pytest

import db


@pytest.fixture()
def card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Board butterfly free-preview",
            "intent_md": "Build free-preview lesson on defined risk from webinar notes.",
            "product_line": "course",
            "priority": 10,
            "acceptance_md": "Lesson plan + script + video package ready.",
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


def test_board_requires_auth(client):
    assert client.get("/api/admin/board").status_code == 401


def test_board_snapshot_and_vision(client, admin_cookies):
    r = client.get("/api/admin/board", cookies=admin_cookies)
    assert r.status_code == 200
    body = r.json()
    assert "draft" in body["columns"]
    assert "body_md" in body["vision"]
    assert "Stop the bleeding" in body["vision"]["body_md"] or "Content Vision" in body[
        "vision"
    ]["body_md"]


def test_create_and_kanban_flow(client, admin_cookies, card):
    assert card["status"] == "draft"
    iid = card["id"]

    # draft → queued
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "queued"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["item"]["status"] == "queued"

    # illegal jump draft path
    r_bad = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "published"},
    )
    assert r_bad.status_code == 422

    # pipeline
    for to in ("scheduled", "in_production"):
        extra = {"sub_stage": "research"} if to == "in_production" else {}
        r = client.post(
            f"/api/admin/board/items/{iid}/transition",
            cookies=admin_cookies,
            json={"to_status": to, **extra},
        )
        assert r.status_code == 200, r.text

    assert r.json()["item"]["sub_stage"] == "research"

    # open flag blocks awaiting_approval
    r = client.post(
        f"/api/admin/board/items/{iid}/flags",
        cookies=admin_cookies,
        json={
            "guardian": "hotel",
            "message": "Risk framing incomplete",
            "severity": "block",
        },
    )
    assert r.status_code == 200
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "awaiting_approval"},
    )
    assert r.status_code == 422
    assert "flag" in r.json()["detail"].lower()

    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    flag_id = detail["flags"][0]["id"]
    assert (
        client.post(
            f"/api/admin/board/flags/{flag_id}/clear",
            cookies=admin_cookies,
        ).status_code
        == 200
    )

    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "awaiting_approval"},
    )
    assert r.status_code == 200, r.text

    # approve
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "published"},
    )
    assert r.status_code == 200
    assert r.json()["item"]["status"] == "published"

    # on board snapshot under published
    snap = client.get("/api/admin/board", cookies=admin_cookies).json()
    ids = {c["id"] for c in snap["columns"]["published"]}
    assert iid in ids


def test_artifact_and_reject_reason(client, admin_cookies, card):
    iid = card["id"]
    client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "queued"},
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/artifacts",
        cookies=admin_cookies,
        json={
            "stage": "research_pack",
            "title": "Source pack v1",
            "body_md": "## Sources\nWebinar notes",
        },
    )
    assert r.status_code == 200
    assert len(r.json()["item"]["artifacts"]) == 1

    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "rejected", "reason": "Out of scope for this sprint"},
    )
    assert r.status_code == 200
    assert r.json()["item"]["status"] == "rejected"
    assert "sprint" in (r.json()["item"]["reject_reason"] or "")


def test_agent_board_operate_scope(client, admin_cookies):
    # mint quebec key with board:operate
    plist = client.get(
        "/api/admin/agents/principals", cookies=admin_cookies
    ).json()["principals"]
    quebec = next(p for p in plist if p["callsign"] == "quebec")
    r = client.post(
        f"/api/admin/agents/principals/{quebec['id']}/keys",
        cookies=admin_cookies,
        json={"scopes": ["board:operate", "ai:status"]},
    )
    assert r.status_code == 200
    key = r.json()["credential"]["key"]

    # agent cannot create cards
    r = client.post(
        "/api/admin/board/items",
        headers={"Authorization": f"Bearer {key}"},
        json={"title": "X", "intent_md": "Y"},
    )
    assert r.status_code == 401

    # admin creates, agent can move pipeline statuses
    card = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={"title": "ZZ Agent claim card", "intent_md": "Claim test"},
    ).json()["item"]
    iid = card["id"]
    client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "queued"},
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_status": "scheduled"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["item"]["status"] == "scheduled"
    assert r.json()["item"]["claimed_callsign"] == "quebec"

    # agent cannot publish
    client.post(
        f"/api/admin/board/items/{iid}/transition",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_status": "in_production", "sub_stage": "research"},
    )
    client.post(
        f"/api/admin/board/items/{iid}/transition",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_status": "awaiting_approval"},
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_status": "published"},
    )
    assert r.status_code == 422

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (iid,))
