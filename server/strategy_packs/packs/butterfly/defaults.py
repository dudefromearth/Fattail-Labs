"""Butterfly pack defaults = FatTail house designs (entry + management).

House catalog is authoritative in house_designs.py. Defaults list is the
config payloads for pack_detail templates + designer loaders.
"""

from __future__ import annotations

from typing import Any

from strategy_packs.packs.butterfly.house_designs import list_house_designs


def get_default_configs() -> list[dict[str, Any]]:
    """Return house design configs (ordered). Immutable house metadata is separate."""
    return [d["config"] for d in list_house_designs()]


def get_library_templates() -> list[dict[str, Any]]:
    """Alias for pack loaders that want full house design records."""
    return list_house_designs()
