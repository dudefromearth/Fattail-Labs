"""Phase G2b–G5: batch HeyGen, budgets, Quebec tick, refresh / youtube map."""

from __future__ import annotations

import json

import pytest

import db
import heygen_prod as heygen_mod
import packages as packages_mod
from agent_auth import Actor


@pytest.fixture()
def admin_actor():
    return Actor(kind="human", id=0, label="test-admin", role="administrator")


@pytest.fixture()
def card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Phase G Rest Card",
            "intent_md": "Multi-lesson cast production for G2b–G5.",
            "product_line": "course",
            "cast_id": "DUDE-PRIMARY",
            "priority": 50,
        },
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    yield item
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM heygen_job_ledger WHERE content_item_id = %s",
                (item["id"],),
            )
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))


def _add_script(client, admin_cookies, iid: int) -> None:
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/artifacts",
            cookies=admin_cookies,
            json={
                "stage": "script",
                "title": "scripts",
                "body_md": (
                    "## Cast\nDUDE-PRIMARY\n## Timing\n\n"
                    "## Voiceover\nDefault VO for single path.\n"
                    "## On-Screen\nMax loss\n## Production Notes\nok\n"
                ),
            },
        ).status_code
        == 200
    )


def _add_lesson_plan_two_videos(client, admin_cookies, iid: int) -> None:
    plan = {
        "course_title": "ZZ Multi Lesson",
        "modules": [
            {
                "title": "Foundations",
                "kind": "standard",
                "lessons": [
                    {
                        "title": "Name max loss",
                        "slug": "name-max-loss",
                        "kind": "video",
                        "body_md": "VO: state max loss before entry.",
                    },
                    {
                        "title": "Worked butterfly",
                        "slug": "worked-butterfly",
                        "kind": "video",
                        "body_md": "VO: walk the debit risk.",
                    },
                    {
                        "title": "Checklist",
                        "slug": "checklist",
                        "kind": "text",
                        "body_md": "No video.",
                    },
                ],
            }
        ],
    }
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/artifacts",
            cookies=admin_cookies,
            json={
                "stage": "lesson_plan",
                "title": "plan",
                "body_md": json.dumps(plan),
            },
        ).status_code
        == 200
    )


def test_batch_plan_targets_skip_text_lessons(card):
    targets = heygen_mod.plan_render_targets(
        card["id"],
        title=card["title"],
        product_line="course",
        script_body="## Voiceover\nfallback\n",
    )
    # no lesson_plan yet → single default
    assert len(targets) == 1
    assert targets[0]["slug"] == "lesson-1"


def test_batch_dry_run_two_video_lessons(client, admin_cookies, card):
    iid = card["id"]
    _add_script(client, admin_cookies, iid)
    _add_lesson_plan_two_videos(client, admin_cookies, iid)

    r = client.post(
        f"/api/admin/board/items/{iid}/produce-heygen",
        cookies=admin_cookies,
        json={"dry_run": True},
    )
    assert r.status_code == 200, r.text
    pkg = r.json()["production"]["video_package"]
    assert pkg["batch"] is True
    assert pkg["render_count"] == 2
    slugs = {x["slug"] for x in pkg["renders"]}
    assert slugs == {"name-max-loss", "worked-butterfly"}
    assert all(x["status"] == "dry_run" for x in pkg["renders"])

    # ledger dry_run rows exist
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS c FROM heygen_job_ledger
                   WHERE content_item_id = %s AND dry_run = 1""",
                (iid,),
            )
            assert int(cur.fetchone()["c"]) == 2


def test_budget_snapshot_endpoint(client, admin_cookies):
    r = client.get("/api/admin/board/heygen/budget", cookies=admin_cookies)
    assert r.status_code == 200
    b = r.json()["budget"]
    assert "daily_limit" in b
    assert "daily_used" in b
    assert "monthly_limit" in b
    assert b["max_batch"] >= 1


def test_budget_blocks_live_when_exhausted(client, admin_cookies, card, monkeypatch):
    iid = card["id"]
    _add_script(client, admin_cookies, iid)
    monkeypatch.setenv("LABS_HEYGEN_DAILY_JOB_LIMIT", "0")
    monkeypatch.setenv("LABS_HEYGEN_DRY_RUN", "0")
    # ensure produce tries live path
    r = client.post(
        f"/api/admin/board/items/{iid}/produce-heygen",
        cookies=admin_cookies,
        json={"dry_run": False},
    )
    assert r.status_code == 422
    assert "budget" in r.json()["detail"].lower() or "daily" in r.json()["detail"].lower()


def test_refresh_dry_run_package(client, admin_cookies, card):
    iid = card["id"]
    _add_script(client, admin_cookies, iid)
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/produce-heygen",
            cookies=admin_cookies,
            json={"dry_run": True},
        ).status_code
        == 200
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/refresh-heygen",
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["refresh"]["video_package"]["status"] == "dry_run"


def test_youtube_map(client, admin_cookies, card):
    iid = card["id"]
    _add_script(client, admin_cookies, iid)
    assert (
        client.post(
            f"/api/admin/board/items/{iid}/produce-heygen",
            cookies=admin_cookies,
            json={"dry_run": True},
        ).status_code
        == 200
    )
    r = client.post(
        f"/api/admin/board/items/{iid}/youtube-map",
        cookies=admin_cookies,
        json={"videos": {"lesson-1": "dQw4w9WgXcQ"}, "trailer_video_id": "aqz-KE-bpKQ"},
    )
    assert r.status_code == 200, r.text
    pkg = r.json()["youtube_map"]["video_package"]
    assert pkg["videos"]["lesson-1"] == "dQw4w9WgXcQ"
    assert pkg["trailer_video_id"] == "aqz-KE-bpKQ"


def test_quebec_tick_advances_queued(client, admin_cookies, card):
    iid = card["id"]
    # draft → queued
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
        json={"force": True, "max_actions": 10},
    )
    assert r.status_code == 200, r.text
    tick = r.json()["tick"]
    assert tick["action_count"] >= 1
    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    # one tick should get at least to scheduled or in_production
    assert detail["status"] in ("scheduled", "in_production")


def test_quebec_tick_submits_for_approval_when_complete(
    client, admin_cookies, card, admin_actor
):
    iid = card["id"]
    packages_mod.ensure_stub_artifacts_for_tests(iid, admin_actor, "course")
    for to, extra in (
        ("queued", {}),
        ("scheduled", {}),
        ("in_production", {"sub_stage": "package"}),
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
        json={"force": True, "max_actions": 10},
    )
    assert r.status_code == 200, r.text
    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    assert detail["status"] == "awaiting_approval"
    assert detail["latest_package_id"]


def test_plan_from_script_beats():
    body = """## Lesson: Hook
Say the problem.
## Lesson: Teach
Define max loss.
## Lesson: Close
One practice.
"""
    # plan_render_targets needs item_id DB lookup for lesson_plan first —
    # without item use only script path via empty stages: call helper with fake id
    # that has no artifacts — use 0 and expect single if no matches... 
    # Actually section split needs no DB if no artifacts.
    # item_id 0 will return no artifacts
    targets = heygen_mod.plan_render_targets(
        0, title="T", product_line="course", script_body=body
    )
    assert len(targets) == 3
    assert targets[0]["title"] == "Hook"
