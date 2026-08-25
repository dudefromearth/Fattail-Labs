"""IF-2 characterization — research registry, window, no padding."""

from __future__ import annotations

import pytest

import db
import iki_factory_research as research
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _cleanup as _cleanup_if1
from tests.test_iki_factory_if1 import _create


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _cleanup_if2():
    _cleanup_if1()
    research.clear_impls()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_cards WHERE title LIKE %s",
                ("zz-if2-%",),
            )
            cur.execute(
                "DELETE FROM iki_factory_skills WHERE skill_id LIKE %s",
                ("zz-if2-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup_if2()
    yield
    _cleanup_if2()


def test_gemba_principal_exists(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status FROM agent_principals WHERE callsign = %s",
                ("gemba",),
            )
            row = cur.fetchone()
    assert row, "gemba principal missing"
    assert row["status"] == "active"


def test_empty_registry_blocks_no_children(client):
    card = _create(client, "zz-if2-empty")
    assert card["blocked_reason"]
    assert "will not invent" in card["blocked_reason"].lower() or "no skills" in card["blocked_reason"].lower()
    kids = [
        c
        for c in client.get(
            "/api/admin/iki-factory/cards",
            cookies=cookie_for("administrator"),
        ).json()["cards"]
        if c.get("lineage_parent_id") == card["id"]
    ]
    assert kids == []


def test_unregistered_skill_rejected():
    with pytest.raises(Exception) as ei:
        research.invoke("no-such-skill", "0.0", {"title": "x"})
    assert "not in the versioned registry" in str(ei.value).lower() or "unregistered" in str(ei.value).lower()


def _three(_idea):
    return [
        {
            "title": f"zz-if2-find-{i}",
            "rank": i,
            "reason": f"Source pack {i} matched the idea.",
            "sources": [f"wiki/concepts/zz-if2-{i}.md"],
        }
        for i in range(1, 4)
    ]


def _twelve(_idea):
    return [
        {
            "title": f"zz-if2-many-{i}",
            "rank": i,
            "reason": f"Evidence {i} from the registry run.",
            "sources": [f"docs/zz-if2-{i}.md"],
        }
        for i in range(1, 13)
    ]


def test_three_findings_not_padded_to_ten(client):
    research.register_skill("zz-if2-three", "0.1")
    research.register_impl("zz-if2-three", "0.1", _three)
    card = _create(client, "zz-if2-three-idea")
    assert not card.get("blocked_reason")
    kids = [
        c
        for c in client.get(
            "/api/admin/iki-factory/cards",
            cookies=cookie_for("administrator"),
        ).json()["cards"]
        if c.get("lineage_parent_id") == card["id"]
    ]
    assert len(kids) == 3
    assert all(c.get("rank") is not None for c in kids)
    assert all(c.get("rank_reason") for c in kids)
    assert all(c.get("sources") for c in kids)


def test_twelve_findings_cap_ten_remainder(client):
    research.register_skill("zz-if2-twelve", "0.1")
    research.register_impl("zz-if2-twelve", "0.1", _twelve)
    card = _create(client, "zz-if2-twelve-idea")
    kids = [
        c
        for c in client.get(
            "/api/admin/iki-factory/cards",
            cookies=cookie_for("administrator"),
        ).json()["cards"]
        if c.get("lineage_parent_id") == card["id"]
    ]
    assert len(kids) == 10
    rem = card.get("remainder") or []
    assert len(rem) == 2


def test_window_expiry_visible(client):
    card = _create(client, "zz-if2-window")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET blocked_reason = NULL,
                       waiting_reason = 'waiting for skills',
                       research_window_ends_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR
                 WHERE id = %s
                """,
                (card["id"],),
            )
    r = client.post(
        "/api/admin/iki-factory/research-tick",
        cookies=cookie_for("administrator"),
    )
    assert r.status_code == 200, r.text
    assert r.json()["expired"] >= 1
    got = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=cookie_for("administrator"),
    ).json()["card"]
    assert got["blocked_reason"]
    assert "24" in got["blocked_reason"] or "expired" in got["blocked_reason"].lower()
