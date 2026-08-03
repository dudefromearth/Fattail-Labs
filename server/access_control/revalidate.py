"""Map policy target keys → revalidation tags/paths (Spec G7). Stub-safe."""

from __future__ import annotations

import logging
from typing import Iterable

from access_control.keys import TargetKeyError, parse_target_key

log = logging.getLogger("labs.access_control.revalidate")


def tags_for_target(target_key: str) -> list[str]:
    try:
        tk = parse_target_key(target_key)
    except TargetKeyError:
        return []
    tags = [f"access:{target_key}", f"access-kind:{tk.kind.value}"]
    if tk.kind.value == "course" and tk.entity_id:
        tags.append(f"course:{tk.entity_id}")
    if tk.kind.value in ("lesson", "module", "resource") and tk.entity_id:
        tags.append(f"{tk.kind.value}:{tk.entity_id}")
    if tk.kind.value == "app" and tk.name:
        tags.append(f"app:{tk.name}")
    if tk.kind.value == "surface" and tk.name:
        tags.append(f"surface:{tk.name}")
    return tags


def revalidate_for_targets(keys: Iterable[str]) -> dict:
    """Collect tags for Next revalidation. Logs; does not call external HTTP here.

    AC6 wires the Next `/api/revalidate` caller when env is present.
    """
    all_tags: list[str] = []
    for k in keys:
        all_tags.extend(tags_for_target(k))
    # de-dupe
    seen: list[str] = []
    for t in all_tags:
        if t not in seen:
            seen.append(t)
    log.info("access policy revalidate tags: %s", seen)
    return {"tags": seen, "paths": []}
