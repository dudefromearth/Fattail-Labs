"""IF-1 characterization — IKI Factory Spec v0.1.5 · GO IF-1."""

from __future__ import annotations

from pathlib import Path

import pytest

import agent_auth
import db
from config import get_config
from main import app
from tests.conftest import LabsTestClient, cookie_for

COOKIE = get_config().session_cookie
ROOT = Path(__file__).resolve().parents[2]


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
                ("zz-if1-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _agent(callsign: str, scopes: list[str]) -> str:
    try:
        row = agent_auth.create_principal(callsign, callsign)
        pid = int(row["id"])
    except agent_auth.AgentAuthError:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM agent_principals WHERE callsign = %s",
                    (callsign,),
                )
                found = cur.fetchone()
                assert found
                pid = int(found["id"])
    minted = agent_auth.mint_key(pid, name="if1", scopes=scopes)
    return minted["key"]


def _deposit(client, title: str = "zz-if1-idea") -> dict:
    """Create-backlog only (v1.0 §2.1) — no pull. IF-7: the card lands in
    the backlog lane and stays there; nothing moves it automatically."""
    r = client.post(
        "/api/admin/iki-factory/cards",
        cookies=_admin(),
        json={"title": title},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def _pull_to_research(client, card_id: int) -> dict:
    r = client.post(
        f"/api/admin/iki-factory/cards/{card_id}/move",
        cookies=_admin(),
        json={"to_lane": "research"},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def _create(client, title: str = "zz-if1-idea") -> dict:
    """Setup convenience for every other test file: deposit + explicit pull
    to research. IF-7 (v1.0 §3.1): this used to be one automatic step inside
    `create_idea`; it is now two explicit calls. Every existing caller that
    just needs "a card already in research" keeps working unchanged."""
    card = _deposit(client, title)
    return _pull_to_research(client, card["id"])


def test_unauthenticated_401(client):
    r = client.get("/api/admin/iki-factory/cards")
    assert r.status_code == 401


def test_non_admin_403(client):
    r = client.get(
        "/api/admin/iki-factory/cards",
        cookies=cookie_for("navigator"),
    )
    assert r.status_code == 403


def test_create_idea_pickup_stub(client):
    """IF-7 re-author (India-named, DL-539 GO IKI-FACTORY-IF7).

    BEFORE (shipped, IF-1-G PASS): `_create` posted once and asserted the
    card was ALREADY in "research" — `create_idea` auto-jumped it there in
    the same transaction, auto_move_reason populated, and a single
    (ideas -> research, auto=True) transition existed alongside the
    (None -> ideas, auto=False) creation entry.

    AFTER (v1.0 §2.1, §3.1): deposit alone proves nothing moves — the card
    stays in "backlog", auto_move_reason is empty, no research has been
    attempted. A second, explicit pull is required to reach research, and
    that pull is what now carries the old "picked up" reason and triggers
    the IF-2 empty-registry fail-loud check. The transition log gains a
    third property: every entry's `auto_move` is False, because there is
    no more auto path left to set it True.
    """
    deposited = _deposit(client, "zz-if1-pickup")
    assert deposited["lane"] == "backlog"
    assert "priority" not in deposited
    assert not deposited["auto_move_reason"]
    assert not deposited["blocked_reason"]

    pulled = _pull_to_research(client, deposited["id"])
    assert pulled["lane"] == "research"
    # IF-2: empty registry fail-loud (no invented findings) — still fires,
    # now on the explicit pull rather than on creation.
    assert pulled["blocked_reason"]
    assert "skill" in pulled["blocked_reason"].lower()

    r = client.get(
        f"/api/admin/iki-factory/cards/{deposited['id']}",
        cookies=_admin(),
    )
    assert r.status_code == 200, r.text
    trans = r.json()["transitions"]
    lanes = [(t["from_lane"], t["to_lane"], t["auto_move"]) for t in trans]
    assert (None, "backlog", False) in lanes
    assert ("backlog", "research", False) in lanes
    # IF-7's core guarantee: nothing here is auto anymore.
    assert not any(t["auto_move"] for t in trans)
    assert all((t.get("reason") or "").strip() for t in trans)


def test_admin_research_to_spec_allowed(client):
    card = _create(client, "zz-if1-admin-rs")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "spec"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "spec"


def test_gemba_bearer_research_to_spec_rejected(client):
    card = _create(client, "zz-if1-agent-rs")
    key = _agent("zz-if1-gemba", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "spec"},
    )
    assert r.status_code == 422, r.text
    detail = r.json()["detail"]
    assert "Admin" in detail["reason"]
    assert detail["card"]["lane"] == "research"
    got = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
    ).json()["card"]
    assert got["lane"] == "research"
    assert got["blocked_reason"]
    assert "Admin" in got["blocked_reason"]


def test_spec_to_build_waiting_for_plan(client):
    card = _create(client, "zz-if1-plan")
    client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "spec"},
    )
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["reason"] == "waiting for plan"
    assert r.json()["detail"]["card"]["lane"] == "spec"


def test_skip_forward_rejected(client):
    card = _create(client, "zz-if1-skip")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["card"]["lane"] == "research"


def test_hold_persists(client):
    card = _create(client, "zz-if1-hold")
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["hold"] is True
    got = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
    ).json()["card"]
    assert got["hold"] is True


def test_does_not_write_content_items(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM content_items")
            before = int(cur.fetchone()["n"])
    _create(client, "zz-if1-no-content")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM content_items")
            after = int(cur.fetchone()["n"])
    assert after == before


def test_factory_board_lives_on_suite_pill():
    page = (ROOT / "web/app/app/iki/factory/page.tsx").read_text()
    assert "IkiFactoryBoard" in page
    assert "IkiFactoryLiveCatalog" not in page
    admin = (ROOT / "web/app/admin/iki-factory/page.tsx").read_text()
    assert 'redirect("/app/iki/factory")' in admin
    suite = (ROOT / "web/lib/ikiSuite.ts").read_text()
    assert 'id: "about"' in suite
    assert 'id: "catalog"' in suite
    assert 'id: "runner"' in suite
    assert 'href: "/app/iki/runner"' in suite
    about = (ROOT / "web/app/app/iki/about/page.tsx").read_text()
    catalog = (ROOT / "web/app/app/iki/catalog/page.tsx").read_text()
    assert "IkiComingBanner" in about
    assert "IkiWikiPanel" in about
    assert "WikiSearchWidget" in (ROOT / "web/components/iki/IkiWikiPanel.tsx").read_text()
    assert "IkiComingBanner" in catalog
    assert "IkiWikiPanel" not in catalog
    banner = (ROOT / "web/lib/ikiSuite.ts").read_text()
    assert 'IKI_ABOUT_BANNER_COPY = ""' in banner
    assert 'IKI_CATALOG_BANNER_COPY = ""' in banner
