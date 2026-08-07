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
