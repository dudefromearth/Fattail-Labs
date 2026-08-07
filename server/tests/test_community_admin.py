"""Admin Community Discord channel map (C1d-lite)."""

from __future__ import annotations

import secrets

import db
from tests.conftest import cookie_for


def test_admin_community_requires_admin(client, probe_identity):
    r = client.get(
        "/api/admin/community",
        cookies=cookie_for("activator", probe_identity),
    )
    assert r.status_code in (401, 403)


def test_admin_list_and_map_channel(client):
    cookies = cookie_for("administrator", 0)
    r = client.get("/api/admin/community", cookies=cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "channels" in body
    assert body["stats"]["active"] >= 4
    general = next(c for c in body["channels"] if c["slug"] == "general")
    pid = general["id"]

    guild = "123456789012345678"
    channel = "987654321098765432"
    r2 = client.patch(
        f"/api/admin/community/channels/{pid}",
        cookies=cookies,
        json={
            "discord_guild_id": guild,
            "discord_channel_id": channel,
        },
    )
    assert r2.status_code == 200, r2.text
    ch = r2.json()["channel"]
    assert ch["discord_guild_id"] == guild
    assert ch["discord_channel_id"] == channel
    assert ch["mapped"] is True

    # invalid snowflake
    r3 = client.patch(
        f"/api/admin/community/channels/{pid}",
        cookies=cookies,
        json={"discord_channel_id": "not-a-snowflake"},
    )
    assert r3.status_code == 400


def test_admin_create_and_archive_channel(client):
    cookies = cookie_for("administrator", 0)
    title = f"ZZ Admin Chan {secrets.token_hex(3)}"
    r = client.post(
        "/api/admin/community/channels",
        cookies=cookies,
        json={
            "title": title,
            "discord_guild_id": "111111111111111111",
            "discord_channel_id": "222222222222222222",
        },
    )
    assert r.status_code == 200, r.text
    ch = r.json()["channel"]
    assert ch["title"] == title
    assert ch["kind"] == "topic"
    assert ch["mapped"] is True
    pid = ch["id"]

    r2 = client.post(
        f"/api/admin/community/channels/{pid}/archive",
        cookies=cookies,
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["channel"]["archived_at"] is not None

    # cleanup
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM community_channels WHERE public_id = %s", (pid,)
            )


def test_admin_rejects_journey_app_key(client):
    cookies = cookie_for("administrator", 0)
    r = client.post(
        "/api/admin/community/channels",
        cookies=cookies,
        json={"title": "Journey leak", "app_key": "journey", "kind": "app_home"},
    )
    assert r.status_code == 400
