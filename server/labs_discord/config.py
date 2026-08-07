"""Discord bridge config — fail loud when bridge enabled without token."""

from __future__ import annotations

import os
from dataclasses import dataclass


class BridgeConfigError(Exception):
    pass


@dataclass(frozen=True)
class BridgeConfig:
    enabled: bool
    bot_token: str
    guild_id: str
    connect_url: str
    # Prefer FatTail AI token; optional fallback documented in ops
    token_source: str


def _truthy(v: str) -> bool:
    return (v or "").strip().lower() in ("1", "true", "yes", "on")


def bridge_config(*, require_enabled: bool = False) -> BridgeConfig:
    enabled = _truthy(os.environ.get("LABS_DISCORD_BRIDGE", "0"))
    # Primary: FatTail AI Community bot. Fallback: 0-DTE bot only if explicitly allowed
    # or primary empty and 0DTE set (dev convenience — operator should set primary).
    token = (os.environ.get("LABS_DISCORD_BOT_TOKEN") or "").strip()
    source = "LABS_DISCORD_BOT_TOKEN"
    if not token:
        token = (os.environ.get("LABS_DISCORD_0DTE_BOT_TOKEN") or "").strip()
        source = "LABS_DISCORD_0DTE_BOT_TOKEN"
    guild = (
        (os.environ.get("LABS_DISCORD_GUILD_ID") or "").strip()
        or (os.environ.get("LABS_DISCORD_0DTE_GUILD_ID") or "").strip()
    )
    connect = (os.environ.get("LABS_DISCORD_CONNECT_URL") or "").strip()
    if not connect:
        connect = "https://fattail.ai/my-account/"

    if require_enabled or enabled:
        if not enabled and require_enabled:
            raise BridgeConfigError("LABS_DISCORD_BRIDGE is not enabled")
        if enabled and not token:
            raise BridgeConfigError(
                "LABS_DISCORD_BRIDGE=1 requires LABS_DISCORD_BOT_TOKEN "
                "(or LABS_DISCORD_0DTE_BOT_TOKEN for dev)"
            )

    return BridgeConfig(
        enabled=enabled,
        bot_token=token,
        guild_id=guild,
        connect_url=connect,
        token_source=source if token else "",
    )
