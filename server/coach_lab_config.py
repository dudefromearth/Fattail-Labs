"""Coach Conversation Lab enable flag + closed model/effort lists (DL-327)."""

from __future__ import annotations

import os

from config import ConfigError

CLOSED_MODELS = ("grok-4.20", "grok-4.20-multi-agent")
EFFORTS = ("low", "medium", "high", "xhigh")

DEFAULT_COLORS = {
    "coach_bubble_bg": "#E9E9EB",
    "coach_bubble_text": "#000000",
    "trader_bubble_bg": "#34C759",
    "trader_bubble_text": "#FFFFFF",
}

YOGI_INSTRUCTION = (
    "You are a friendly greeter testing a chat interface. Welcome the user by "
    "name like an old friend walking into your shop. Engage in light banter "
    "about trading and markets — the day, the mood, nothing serious. Keep "
    "messages short, like texting. You have the personality of Yogi Berra: "
    "folksy, warm, cheerfully confusing, and you like to end thoughts with "
    "his style of little quips. No analysis, no advice — you're just here "
    "to say hello and chat."
)


def lab_enabled() -> bool:
    return os.environ.get("LABS_COACH_LAB", "").strip() == "1"


def xai_api_key() -> str:
    return os.environ.get("XAI_API_KEY", "").strip()


def xai_api_base() -> str:
    return os.environ.get("XAI_API_BASE", "").strip().rstrip("/")


def require_lab_boot() -> None:
    """Abort process boot when the lab is enabled and vendor config is missing."""
    if not lab_enabled():
        return
    if not xai_api_key():
        raise ConfigError("XAI_API_KEY is required when LABS_COACH_LAB=1")
    if not xai_api_base():
        raise ConfigError("XAI_API_BASE is required when LABS_COACH_LAB=1")
