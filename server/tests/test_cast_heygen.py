"""Phase G1 cast registry + G2a HeyGen produce → video_package."""

from __future__ import annotations

import json

import pytest

import cast as cast_mod
import db
import heygen_prod as heygen_mod
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
            "title": "ZZ Cast HeyGen Card",
            "intent_md": "Teach max loss with cast presenter.",
            "product_line": "course",
            "cast_id": "DUDE-PRIMARY",
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


def test_list_cast_registry(client, admin_cookies):
    r = client.get("/api/admin/cast", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["count"] >= 2
    ids = {m["cast_id"] for m in data["cast"]}
    assert "DUDE-PRIMARY" in ids
    assert "DUDE-ALT" in ids
    primary = next(m for m in data["cast"] if m["cast_id"] == "DUDE-PRIMARY")
    assert primary["ready"] is True
    assert primary["group_id"]
    assert primary["voice_id"]
    assert primary["role"] == "primary_coach"


def test_get_cast_member(client, admin_cookies):
    r = client.get("/api/admin/cast/DUDE-ALT", cookies=admin_cookies)
    assert r.status_code == 200
    m = r.json()["cast"]
    assert m["cast_id"] == "DUDE-ALT"
    assert m["group_id"].startswith("9f72")


def test_get_cast_missing(client, admin_cookies):
    r = client.get("/api/admin/cast/NO-SUCH-AVATAR", cookies=admin_cookies)
    assert r.status_code == 404


def test_create_card_with_cast(client, admin_cookies, course_card):
    assert course_card["cast_id"] == "DUDE-PRIMARY"


def test_assign_cast_patch(client, admin_cookies, course_card):
    iid = course_card["id"]
    r = client.patch(
        f"/api/admin/board/items/{iid}",
        cookies=admin_cookies,
        json={"cast_id": "DUDE-ALT"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["item"]["cast_id"] == "DUDE-ALT"

    r = client.patch(
        f"/api/admin/board/items/{iid}",
        cookies=admin_cookies,
        json={"cast_id": None},
    )
    assert r.status_code == 200
    assert r.json()["item"]["cast_id"] is None


def test_invalid_cast_rejected(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Bad Cast",
            "intent_md": "Should fail",
            "cast_id": "NOT-A-REAL-CAST",
        },
    )
    assert r.status_code == 422
    # cleanup if somehow created
    if r.status_code == 200:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM content_items WHERE id = %s",
                    (r.json()["item"]["id"],),
                )


def test_produce_requires_script(client, admin_cookies, course_card):
    iid = course_card["id"]
    r = client.post(
        f"/api/admin/board/items/{iid}/produce-heygen",
        cookies=admin_cookies,
        json={"dry_run": True},
    )
    assert r.status_code == 422
    assert "script" in r.json()["detail"].lower()


def test_produce_requires_cast(client, admin_cookies, admin_actor):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ No Cast Produce",
            "intent_md": "Missing cast",
            "product_line": "course",
        },
    )
    assert r.status_code == 200
    iid = r.json()["item"]["id"]
    try:
        client.post(
            f"/api/admin/board/items/{iid}/artifacts",
            cookies=admin_cookies,
            json={
                "stage": "script",
                "title": "script",
                "body_md": "## Voiceover\nDefine max loss before entry.\n",
            },
        )
        r2 = client.post(
            f"/api/admin/board/items/{iid}/produce-heygen",
            cookies=admin_cookies,
            json={"dry_run": True},
        )
        assert r2.status_code == 422
        assert "cast" in r2.json()["detail"].lower()
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM content_items WHERE id = %s", (iid,))


def test_produce_dry_run_writes_video_package(client, admin_cookies, course_card):
    iid = course_card["id"]
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/artifacts",
            cookies=admin_cookies,
            json={
                "stage": "script",
                "title": "lesson script",
                "body_md": (
                    "## Cast\nDUDE-PRIMARY\n## Timing\n60s\n"
                    "## Voiceover\nName your max loss before you click buy.\n"
                    "## On-Screen\nMax loss box\n## Production Notes\nCalm tone\n"
                ),
            },
        ).status_code
        == 200
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/produce-heygen",
        cookies=admin_cookies,
        json={"dry_run": True},
    )
    assert r.status_code == 200, r.text
    prod = r.json()["production"]
    assert prod["dry_run"] is True
    pkg = prod["video_package"]
    assert pkg["provider"] == "heygen"
    assert pkg["status"] == "dry_run"
    assert pkg["cast_id"] == "DUDE-PRIMARY"
    assert pkg["group_id"]
    assert pkg["renders"][0]["session_id"].startswith("dry-run-")

    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    stages = [a["stage"] for a in detail["artifacts"]]
    assert "video_package" in stages
    vp = next(a for a in detail["artifacts"] if a["stage"] == "video_package")
    body = json.loads(vp["body_md"])
    assert body["cast_id"] == "DUDE-PRIMARY"

    # Package checklist sees video_package stage
    checklist = client.get(
        f"/api/admin/board/items/{iid}/package", cookies=admin_cookies
    ).json()
    stage_map = {s["stage"]: s for s in checklist["checklist"]["stages"]}
    assert stage_map["video_package"]["complete"] is True


def test_cast_module_parse():
    members = cast_mod.list_cast()
    assert any(m["cast_id"] == "DUDE-PRIMARY" for m in members)
    m = cast_mod.get_cast("dude-primary")
    assert m["cast_id"] == "DUDE-PRIMARY"
    assert cast_mod.validate_cast_id("DUDE-ALT") == "DUDE-ALT"
    assert cast_mod.validate_cast_id(None) is None
    assert cast_mod.validate_cast_id("") is None


def test_orientation_for_shorts():
    assert heygen_mod._orientation_for_product_line("coaching_short") == "portrait"
    assert heygen_mod._orientation_for_product_line("course") == "landscape"
