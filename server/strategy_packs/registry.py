"""Strategy pack registry."""

from __future__ import annotations

from typing import Any

from strategy_packs.packs import butterfly as butterfly_pack

_PACKS: dict[str, Any] = {
    butterfly_pack.PACK_ID: butterfly_pack,
}


def list_packs(*, enabled_only: bool = True) -> list[dict[str, Any]]:
    out = []
    for mod in _PACKS.values():
        m = mod.meta()
        if enabled_only and not m.get("isEnabled", True):
            continue
        out.append(m)
    return out


def get_pack(pack_id: str) -> Any | None:
    return _PACKS.get(pack_id)


def get_pack_or_raise(pack_id: str) -> Any:
    mod = get_pack(pack_id)
    if mod is None:
        raise KeyError(f"Unknown strategy pack: {pack_id}")
    if not mod.meta().get("isEnabled", True):
        raise KeyError(f"Strategy pack disabled: {pack_id}")
    return mod


def pack_detail(pack_id: str) -> dict[str, Any]:
    mod = get_pack_or_raise(pack_id)
    out: dict[str, Any] = {
        **mod.meta(),
        "schema": mod.get_schema(),
        "ui": mod.get_ui_definition(),
        "defaults": mod.get_default_configs(),
    }
    # FatTail house strategies (versioned, course-linked) when pack provides them
    if hasattr(mod, "get_house_designs"):
        out["house_designs"] = mod.get_house_designs()
    return out
