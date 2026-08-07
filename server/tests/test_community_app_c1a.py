"""Community app C1a — channels seed, apps card, shelves (no Discord mirror)."""

from __future__ import annotations

import db
from tests.conftest import cookie_for


def test_seed_channels_four_no_journey_wiki():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT slug, kind, app_key FROM community_channels
                   WHERE archived_at IS NULL ORDER BY sort_order"""
            )
            rows = cur.fetchall()
    slugs = [r["slug"] for r in rows]
    assert "general" in slugs
    assert "practice" in slugs
    assert "strategy-lab" in slugs
    assert "toughness" in slugs
    assert "journey" not in slugs
    assert "wiki" not in slugs
    assert len(slugs) >= 4
    # uniqueness
    assert len(slugs) == len(set(slugs))
    by_slug = {r["slug"]: r for r in rows}
    assert by_slug["practice"]["app_key"] == "practice"
    assert by_slug["strategy-lab"]["app_key"] == "strategy-lab"
    assert by_slug["toughness"]["app_key"] == "toughness"
    assert by_slug["general"]["app_key"] in (None, "")


def test_apps_hub_has_community():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT slug, title, status FROM apps WHERE slug = 'community'"
            )
            row = cur.fetchone()
    assert row is not None
    assert row["title"] == "Community"
    assert row["status"] == "live"


def test_board_api_requires_session(client):
    r = client.get("/api/me/community/board")
    assert r.status_code in (401, 403)


def test_board_api_channels_and_fattail_shelf(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get("/api/me/community/board", cookies=cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    channels = body["channels"]
    slugs = [c["slug"] for c in channels]
    assert slugs == ["general", "practice", "strategy-lab", "toughness"] or set(
        slugs
    ) >= {"general", "practice", "strategy-lab", "toughness"}
    assert "journey" not in slugs
    assert "wiki" not in slugs

    house = body["fattail_shelf"]["house"]
    assert len(house) >= 1
    assert all(h.get("key") and h.get("version") for h in house)
    assert all(h.get("member_may_remove") is False for h in house)
    # no P&L fields on shelf cards
    for h in house:
        assert "pnl" not in h
        assert "p_and_l" not in h
        assert "roi" not in h

    assert "message_sync" in body
    assert isinstance(body["member_shares"], list)
    # Discord link comes from SSO claims; probe identity starts unlinked
    assert body["discord"]["linked"] is False


def test_channel_by_app_key(client, probe_identity):
    cookies = cookie_for("navigator", probe_identity)
    r = client.get(
        "/api/me/community/apps/strategy-lab/channel", cookies=cookies
    )
    assert r.status_code == 200, r.text
    assert r.json()["channel"]["slug"] == "strategy-lab"

    r2 = client.get("/api/me/community/apps/journey/channel", cookies=cookies)
    assert r2.status_code == 404

    r3 = client.get("/api/me/community/apps/wiki/channel", cookies=cookies)
    assert r3.status_code == 404


def test_messages_list_ok(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get(
        "/api/me/community/channels/general/messages", cookies=cookies
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body["messages"], list)
    assert "sync_enabled" in body
    assert "can_post" in body


def test_fattail_shelf_endpoint(client, probe_identity):
    cookies = cookie_for("observer", probe_identity)
    r = client.get("/api/me/community/shelves/fattail", cookies=cookies)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["member_may_remove_house"] is False
    assert len(data["house"]) >= 1
