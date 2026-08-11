"""Dual-side generation key parse/build (OPF4).

Normative Redis topic:
  mb:ladder:{chain_underlier}:{expiration}:w{N}:dual

``chain_underlier`` may itself contain a colon (e.g. ``I:SPX``), so keys are
parsed from the **ends**, never with a fixed-index split for feed/side.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


_EXP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_WINGS_RE = re.compile(r"^w(\d+)$", re.IGNORECASE)


@dataclass(frozen=True)
class LadderTopic:
    """Parsed dual (or legacy single-side) ladder interest/topic."""

    chain_underlier: str
    expiration: str
    wings: int
    dual: bool
    side: str | None  # only set for legacy single-side keys
    raw: str

    @property
    def product_hint(self) -> str:
        ul = self.chain_underlier
        if ul.upper().startswith("I:"):
            return ul[2:]
        return ul


def bus_ladder_key(chain_underlier: str, expiration: str, wings: int) -> str:
    """Canonical dual-side Redis key (OPF4 / HM15)."""
    return f"mb:ladder:{chain_underlier}:{expiration}:w{int(wings)}:dual"


def parse_ladder_topic(topic: str) -> LadderTopic | None:
    """Parse ``mb:ladder:…`` interest/topic. Returns None if not a ladder topic.

    Dual form (normative):
      mb:ladder:{underlier}:{YYYY-MM-DD}:w{N}:dual

    Legacy single-side (still recognized for feed hygiene / migration):
      mb:ladder:{underlier}:{YYYY-MM-DD}:{call|put}:w{N}
    """
    if not topic or not topic.startswith("mb:ladder:"):
        return None
    rest = topic[len("mb:ladder:") :]
    parts = rest.split(":")
    if len(parts) < 3:
        return None

    # Dual: ends with wN : dual  OR  underlier may split — ends with dual
    if parts[-1].lower() == "dual":
        if len(parts) < 3:
            return None
        wpart = parts[-2]
        m = _WINGS_RE.match(wpart)
        if not m:
            return None
        wings = int(m.group(1))
        exp = parts[-3]
        if not _EXP_RE.match(exp):
            return None
        underlier = ":".join(parts[:-3])
        if not underlier:
            return None
        return LadderTopic(
            chain_underlier=underlier,
            expiration=exp,
            wings=wings,
            dual=True,
            side=None,
            raw=topic,
        )

    # Legacy: …:exp:side:wN
    if len(parts) < 3:
        return None
    wpart = parts[-1]
    m = _WINGS_RE.match(wpart)
    if not m:
        return None
    wings = int(m.group(1))
    side = parts[-2].lower()
    if side not in ("call", "put"):
        return None
    exp = parts[-3]
    if not _EXP_RE.match(exp):
        return None
    underlier = ":".join(parts[:-3])
    if not underlier:
        return None
    return LadderTopic(
        chain_underlier=underlier,
        expiration=exp,
        wings=wings,
        dual=False,
        side=side,
        raw=topic,
    )


def topic_to_fetch_args(topic: LadderTopic) -> dict[str, Any]:
    """Args for chain_ladder._fetch_ladder_uncached from a parsed topic."""
    return {
        "chain_underlier": topic.chain_underlier,
        "expiration": topic.expiration,
        "wings": topic.wings,
        "side": topic.side or "call",  # dual fetch ignores side for Massive
        "dual": topic.dual,
        "write_key": (
            bus_ladder_key(topic.chain_underlier, topic.expiration, topic.wings)
            if topic.dual
            else topic.raw
        ),
    }
