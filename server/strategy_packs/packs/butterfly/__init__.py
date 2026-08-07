"""Butterfly Strategy Pack v1.0.0."""

from __future__ import annotations

from typing import Any

from strategy_packs.packs.butterfly import defaults, house_designs, schema, ui, validation
from strategy_packs.packs.butterfly.construct import construct_structures
from strategy_packs.packs.butterfly.metrics import calculate_metrics
from strategy_packs.packs.butterfly.rank import rank_structures
from strategy_packs.packs.butterfly.search import build_search_query

PACK_ID = "butterfly"
PACK_VERSION = "1.0.0"
PACK_NAME = "Butterfly Family"
PACK_DESCRIPTION = (
    "FatTail house strategies (Classic OTM, Timewarp, High Vol Batman, "
    "Convex Stack, Sigma Drift) — taught in courses. Defined-risk butterflies "
    "with entry + management process. House versions are admin-maintained only."
)


def meta() -> dict[str, Any]:
    return {
        "id": PACK_ID,
        "name": PACK_NAME,
        "version": PACK_VERSION,
        "description": PACK_DESCRIPTION,
        "isEnabled": True,
    }


def get_schema() -> dict[str, Any]:
    return schema.get_schema()


def get_ui_definition() -> dict[str, Any]:
    return ui.get_ui_definition()


def get_default_configs() -> list[dict[str, Any]]:
    return defaults.get_default_configs()


def get_house_designs() -> list[dict[str, Any]]:
    return house_designs.list_house_designs()


def validate(config: dict[str, Any]) -> dict[str, Any]:
    return validation.validate(config)


def before_promote_to_curation(config: dict[str, Any]) -> bool:
    return validation.before_promote_to_curation(config)


__all__ = [
    "PACK_ID",
    "PACK_VERSION",
    "meta",
    "get_schema",
    "get_ui_definition",
    "get_default_configs",
    "get_house_designs",
    "validate",
    "build_search_query",
    "construct_structures",
    "calculate_metrics",
    "rank_structures",
    "before_promote_to_curation",
]
