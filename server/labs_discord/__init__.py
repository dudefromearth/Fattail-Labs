"""Labs Discord bridge — second window on FatTail AI (and optional 0-DTE).

Member OAuth stays on fattail.ai. This package is bot REST (+ optional poll/backfill).
"""

from labs_discord.config import bridge_config, BridgeConfig
from labs_discord.rest import DiscordRest, DiscordRestError

__all__ = ["bridge_config", "BridgeConfig", "DiscordRest", "DiscordRestError"]
