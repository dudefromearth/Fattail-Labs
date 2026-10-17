"""Discord REST API v10 — bot token only."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

log = logging.getLogger("labs.discord.rest")

API = "https://discord.com/api/v10"


class DiscordRestError(Exception):
    def __init__(self, message: str, *, status: int | None = None, body: str = ""):
        super().__init__(message)
        self.status = status
        self.body = body


class DiscordRest:
    def __init__(self, bot_token: str):
        if not bot_token:
            raise DiscordRestError("bot token required")
        self._token = bot_token

    def _request(
        self,
        method: str,
        path: str,
        *,
        body: dict | None = None,
        params: dict | None = None,
    ) -> Any:
        url = f"{API}{path}"
        if params:
            url += "?" + urllib.parse.urlencode(
                {k: v for k, v in params.items() if v is not None}
            )
        data = None
        headers = {
            "Authorization": f"Bot {self._token}",
            "User-Agent": "FatTailLabs-CommunityBridge (labs.fattail.ai, 1.0)",
        }
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return None
                return json.loads(raw)
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            log.warning(
                "discord REST %s %s -> %s", method, path, exc.code
            )
            raise DiscordRestError(
                f"Discord API {exc.code}: {err_body[:200]}",
                status=exc.code,
                body=err_body,
            ) from exc
        except urllib.error.URLError as exc:
            raise DiscordRestError(f"Discord network error: {exc}") from exc

    def get_channel_messages(
        self,
        channel_id: str,
        *,
        after: str | None = None,
        before: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        params: dict[str, Any] = {"limit": max(1, min(int(limit), 100))}
        if after:
            params["after"] = after
        if before:
            params["before"] = before
        data = self._request(
            "GET", f"/channels/{channel_id}/messages", params=params
        )
        return data if isinstance(data, list) else []

    def create_message(
        self,
        channel_id: str,
        content: str,
        *,
        username_hint: str | None = None,
    ) -> dict:
        """Post as bot. Content should already include honest attribution if needed."""
        text = (content or "").strip()
        if not text:
            raise DiscordRestError("empty message")
        if len(text) > 1900:
            text = text[:1900] + "…"
        return self._request(
            "POST",
            f"/channels/{channel_id}/messages",
            body={"content": text},
        )

    def get_guild_member(self, guild_id: str, user_id: str) -> dict | None:
        try:
            return self._request(
                "GET", f"/guilds/{guild_id}/members/{user_id}"
            )
        except DiscordRestError as exc:
            if exc.status == 404:
                return None
            raise


    # --- guild roles -------------------------------------------------------
    #
    # These five exist because routes/front_door_access.py calls them and they
    # were never written: list_guild_roles, add_guild_member, create_guild_role,
    # add_guild_member_role, remove_guild_member_role. That code would raise
    # AttributeError the first time a member connected Discord, which is why the
    # Front Door spec records the Discord flow as "not walked".
    #
    # ⚠️ THEY AUTHENTICATE WITH THE BOT TOKEN AND NOTHING ELSE.
    # The WooCommerce vendor plugin gates its role grant on the MEMBER's OAuth
    # access token while authenticating as the bot — the member token is
    # irrelevant to the request, so a lapsed one skips the grant silently while
    # the scheduled job still reports success. That single line is why
    # fotw-discord-role-reconcile.php had to be written. Do not reproduce it.

    def list_guild_roles(self, guild_id: str) -> list[dict]:
        """Every role in the guild. Needed to resolve a role NAME to an id."""
        return self._request("GET", f"/guilds/{guild_id}/roles") or []

    def create_guild_role(self, guild_id: str, name: str, *,
                          hoist: bool = False) -> dict:
        return self._request("POST", f"/guilds/{guild_id}/roles",
                             json={"name": name, "hoist": hoist}) or {}

    def add_guild_member(self, guild_id: str, user_id: str,
                         access_token: str) -> dict | None:
        """Put a member INTO the guild.

        This is the one call that legitimately needs the member's OAuth token —
        Discord will not let a bot add someone who has not consented. Used once
        at connect time and never stored.
        """
        return self._request("PUT", f"/guilds/{guild_id}/members/{user_id}",
                             json={"access_token": access_token})

    def add_guild_member_role(self, guild_id: str, user_id: str,
                              role_id: str) -> bool:
        """Grant a role. Bot token only — no member token involved."""
        self._request("PUT",
                      f"/guilds/{guild_id}/members/{user_id}/roles/{role_id}")
        return True

    def remove_guild_member_role(self, guild_id: str, user_id: str,
                                 role_id: str) -> bool:
        """Revoke a role. Bot token only."""
        self._request("DELETE",
                      f"/guilds/{guild_id}/members/{user_id}/roles/{role_id}")
        return True
