"""Community message mirror (unit-level; Discord REST mocked)."""

from __future__ import annotations

from unittest.mock import patch

import db
from labs_discord import sync as dsync
from tests.conftest import cookie_for


def test_upsert_discord_message_idempotent():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM community_channels WHERE slug='general'"
            )
            ch_id = cur.fetchone()["id"]
            msg = {
                "id": "999888777666555444",
                "content": "hello from discord",
                "author": {
                    "id": "111222333444555666",
                    "username": "Tester",
                    "global_name": "Tester G",
                    "avatar": None,
                },
                "type": 0,
            }
            a = dsync.upsert_discord_message(cur, ch_id, msg)
            b = dsync.upsert_discord_message(cur, ch_id, msg)
            assert a and b and a == b
            cur.execute(
                "SELECT COUNT(*) AS n FROM community_messages WHERE discord_message_id=%s",
                ("999888777666555444",),
            )
            assert cur.fetchone()["n"] == 1
            cur.execute(
                "DELETE FROM community_messages WHERE discord_message_id=%s",
                ("999888777666555444",),
            )


def test_list_messages_api(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM community_channels WHERE slug='practice'")
            ch_id = cur.fetchone()["id"]
            dsync.upsert_discord_message(
                cur,
                ch_id,
                {
                    "id": "111000111000111000",
                    "content": "practice note",
                    "author": {"id": "1", "username": "P", "avatar": None},
                    "type": 0,
                },
            )
    from labs_discord.config import BridgeConfig

    with patch(
        "routes.community_app.bridge_config",
        return_value=BridgeConfig(
            enabled=False,
            bot_token="",
            guild_id="",
            connect_url="https://fattail.ai/my-account/",
            token_source="",
        ),
    ):
        r = client.get(
            "/api/me/community/channels/practice/messages",
            cookies=cookies,
        )
    assert r.status_code == 200, r.text
    bodies = [m["body"] for m in r.json()["messages"]]
    assert "practice note" in bodies
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM community_messages WHERE discord_message_id=%s",
                ("111000111000111000",),
            )
