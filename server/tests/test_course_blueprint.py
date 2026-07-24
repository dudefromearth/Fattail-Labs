"""Course Blueprint API — first validated product (Header + Outline + chat)."""

from __future__ import annotations

import pytest

import db


@pytest.fixture()
def course_card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Blueprint Stop the Bleeding 101",
            "intent_md": "Teach capital preservation process before any optimization.",
            "product_line": "course",
            "priority": 5,
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM content_blueprints WHERE content_item_id = %s",
                (item["id"],),
            )
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


@pytest.fixture()
def yt_card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ YT Long not blueprint",
            "intent_md": "A long form video",
            "product_line": "youtube_long",
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


def test_blueprint_requires_auth(client, course_card):
    assert (
        client.get(f"/api/admin/board/items/{course_card['id']}/blueprint").status_code
        == 401
    )


def test_blueprint_course_only(client, admin_cookies, yt_card):
    r = client.get(
        f"/api/admin/board/items/{yt_card['id']}/blueprint",
        cookies=admin_cookies,
    )
    assert r.status_code == 422
    assert "course" in r.json()["detail"].lower()


def test_get_ensures_empty_blueprint(client, admin_cookies, course_card):
    iid = course_card["id"]
    r = client.get(f"/api/admin/board/items/{iid}/blueprint", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    bp = r.json()["blueprint"]
    assert bp["content_item_id"] == iid
    assert bp["status"] == "draft"
    assert bp["header"]["course_title"]
    assert bp["validation"]["ok"] is False
    assert any("description_md" in e for e in bp["validation"]["errors"])


def test_validate_min_bar_descriptions(client, admin_cookies, course_card):
    iid = course_card["id"]
    # empty / incomplete
    client.get(f"/api/admin/board/items/{iid}/blueprint", cookies=admin_cookies)
    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/validate",
        cookies=admin_cookies,
    )
    assert r.status_code == 200
    assert r.json()["validation"]["ok"] is False

    # put complete blueprint
    r = client.put(
        f"/api/admin/board/items/{iid}/blueprint",
        cookies=admin_cookies,
        json={
            "header": {
                "course_title": course_card["title"],
                "description_md": (
                    "Learn a capital-preservation process. "
                    "By the end you can run a weekly risk review."
                ),
                "level": "beginner",
            },
            "outline": {
                "modules": [
                    {
                        "title": "Foundation",
                        "description_md": "Why process comes first.",
                        "lessons": [{"title": "Mindset", "outcomes": ["State priority"]}],
                    }
                ]
            },
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["blueprint"]["validation"]["ok"] is True
    assert r.json()["blueprint"]["status"] == "pending_validation"

    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/validate",
        cookies=admin_cookies,
    )
    assert r.status_code == 200
    assert r.json()["validation"]["ok"] is True


def test_approve_requires_min_bar_then_succeeds(client, admin_cookies, course_card):
    iid = course_card["id"]
    client.get(f"/api/admin/board/items/{iid}/blueprint", cookies=admin_cookies)

    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/approve",
        cookies=admin_cookies,
    )
    assert r.status_code == 422

    client.put(
        f"/api/admin/board/items/{iid}/blueprint",
        cookies=admin_cookies,
        json={
            "header": {
                "course_title": course_card["title"],
                "description_md": "Full description with process outcomes for traders.",
            },
            "outline": {
                "modules": [
                    {
                        "title": "M1",
                        "description_md": "Module one covers the foundation.",
                        "lessons": [{"title": "L1"}],
                    }
                ]
            },
        },
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/approve",
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["blueprint"]["status"] == "approved"
    assert body["item"]["blueprint_status"] == "approved"
    # lesson_plan artifact from approve
    item = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    stages = [a["stage"] for a in item.get("artifacts") or []]
    assert "lesson_plan" in stages


def test_chat_fixture_fills_descriptions(client, admin_cookies, course_card):
    iid = course_card["id"]
    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/chat",
        cookies=admin_cookies,
        json={
            "message": "Draft a blueprint from the intent",
            "use_fixtures": True,
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["parse_error"] is False
    assert body["ai"]["fixture"] is True
    bp = body["blueprint"]
    assert bp["validation"]["ok"] is True, bp["validation"]
    assert len(bp["chat"]) >= 2
    assert bp["chat"][0]["role"] == "user"
    assert bp["chat"][1]["role"] == "assistant"
    assert (bp["header"].get("description_md") or "").strip()
    mods = bp["outline"]["modules"]
    assert len(mods) >= 1
    assert all((m.get("description_md") or "").strip() for m in mods)

    # approve after chat
    r = client.post(
        f"/api/admin/board/items/{iid}/blueprint/approve",
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["blueprint"]["status"] == "approved"


def test_chat_stream_fixture_sse(client, admin_cookies, course_card):
    iid = course_card["id"]
    with client.stream(
        "POST",
        f"/api/admin/board/items/{iid}/blueprint/chat/stream",
        cookies=admin_cookies,
        json={
            "message": "Stream a fixture blueprint",
            "use_fixtures": True,
        },
    ) as r:
        assert r.status_code == 200, r.text
        assert "text/event-stream" in (r.headers.get("content-type") or "")
        raw = "".join(r.iter_text())
    assert "data: " in raw
    assert '"type": "delta"' in raw or '"type":"delta"' in raw
    assert '"type": "done"' in raw or '"type":"done"' in raw
    # persisted
    g = client.get(
        f"/api/admin/board/items/{iid}/blueprint", cookies=admin_cookies
    )
    assert g.status_code == 200
    assert g.json()["blueprint"]["validation"]["ok"] is True


def test_module_without_description_fails_validation(client, admin_cookies, course_card):
    iid = course_card["id"]
    r = client.put(
        f"/api/admin/board/items/{iid}/blueprint",
        cookies=admin_cookies,
        json={
            "header": {
                "course_title": "X",
                "description_md": "Course level description is here.",
            },
            "outline": {
                "modules": [
                    {
                        "title": "Only a title",
                        "description_md": "",
                        "lessons": [{"title": "L1"}],
                    }
                ]
            },
        },
    )
    assert r.status_code == 200
    assert r.json()["blueprint"]["validation"]["ok"] is False
    assert any(
        "description_md" in e for e in r.json()["blueprint"]["validation"]["errors"]
    )
