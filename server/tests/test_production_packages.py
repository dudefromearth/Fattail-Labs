"""Phase C packages + Phase D placement start."""

from __future__ import annotations

import pytest

import db
import packages as packages_mod
from agent_auth import Actor
from ai.agents import AGENT_TASKS, synthetic_success_output
from ai.types import CompletionResult


@pytest.fixture()
def admin_actor():
    return Actor(kind="human", id=0, label="test-admin", role="administrator")


@pytest.fixture()
def course_card(client, admin_cookies):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Package Course Card",
            "intent_md": "Teach defined risk in one free-preview lesson.",
            "product_line": "course",
        },
    )
    assert r.status_code == 200
    item = r.json()["item"]
    yield item
    slug = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT placed_course_slug FROM content_items WHERE id = %s",
                (item["id"],),
            )
            row = cur.fetchone()
            if row:
                slug = row.get("placed_course_slug")
            cur.execute("DELETE FROM content_items WHERE id = %s", (item["id"],))
    if slug:
        client.delete(f"/api/admin/courses/{slug}", cookies=admin_cookies)


def test_incomplete_package_blocked(client, admin_cookies, course_card):
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
        )
    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "awaiting_approval"},
    )
    assert r.status_code == 422
    v = client.post(
        f"/api/admin/board/items/{iid}/package/validate",
        cookies=admin_cookies,
    )
    assert v.status_code == 200
    assert v.json()["ok"] is False
    assert "research_pack" in v.json()["checklist"]["missing_stages"]


def test_complete_package_freeze_and_place(
    client, admin_cookies, course_card, admin_actor
):
    iid = course_card["id"]
    packages_mod.ensure_stub_artifacts_for_tests(iid, admin_actor, "course")
    for to, extra in (
        ("queued", {}),
        ("scheduled", {}),
        ("in_production", {"sub_stage": "package"}),
        ("awaiting_approval", {}),
    ):
        r = client.post(
            f"/api/admin/board/items/{iid}/transition",
            cookies=admin_cookies,
            json={"to_status": to, **extra},
        )
        assert r.status_code == 200, r.text

    detail = client.get(
        f"/api/admin/board/items/{iid}", cookies=admin_cookies
    ).json()["item"]
    assert detail["latest_package_id"]
    assert detail["package"]["checklist"]["complete"] is True
    assert detail["package"]["latest_package"]["status"] == "pending"

    r = client.post(
        f"/api/admin/board/items/{iid}/transition",
        cookies=admin_cookies,
        json={"to_status": "published"},
    )
    assert r.status_code == 200, r.text
    item = r.json()["item"]
    assert item["status"] == "published"
    slug = item["placed_course_slug"]
    assert slug
    # draft course exists
    r = client.get(f"/api/admin/courses/{slug}", cookies=admin_cookies)
    assert r.status_code == 200


def test_ai_run_attaches_to_card(client, admin_cookies, course_card, monkeypatch):
    iid = course_card["id"]

    class FakeXai:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            spec = AGENT_TASKS["bravo"]["research_pack"]
            return CompletionResult(
                text=synthetic_success_output(spec),
                provider="xai",
                model=model,
            )

    import ai.client as client_mod

    monkeypatch.setattr(
        client_mod,
        "_default_factories",
        lambda: {"xai": FakeXai, "anthropic": lambda c: None},
    )

    r = client.post(
        "/api/admin/ai/agents/bravo/tasks/research_pack/run",
        cookies=admin_cookies,
        json={"use_fixtures": True, "content_item_id": iid},
    )
    assert r.status_code == 200, r.text
    assert r.json()["board_attach"]["stage"] == "research_pack"
    assert r.json()["board_attach"]["artifact_id"]

    pkg = client.get(
        f"/api/admin/board/items/{iid}/package", cookies=admin_cookies
    ).json()
    stages = {s["stage"]: s for s in pkg["checklist"]["stages"]}
    assert stages["research_pack"]["complete"] is True
