"""Policy load + effective_plans (expand at evaluate) — Spec §4.3.1."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Mapping, Optional, Sequence

from access_control.constants import expand_plans
from access_control.types import AccessPolicy


def effective_plans(policy: AccessPolicy) -> frozenset[str]:
    """Evaluate-time plan set from stored intent (never write-time expand)."""
    selected = policy.selected_plans
    if not selected:
        return frozenset()
    if policy.exact_plans_only:
        return frozenset(selected)
    return expand_plans(selected)


def _parse_json_list(raw: Any) -> Optional[tuple[str, ...]]:
    if raw is None:
        return None
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw or raw == "null":
            return None
        raw = json.loads(raw)
    if not isinstance(raw, (list, tuple)):
        raise TypeError(f"expected JSON list for plan fields, got {type(raw)!r}")
    return tuple(str(x) for x in raw)


def _parse_json_obj(raw: Any) -> Optional[dict[str, Any]]:
    if raw is None:
        return None
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw or raw == "null":
            return None
        raw = json.loads(raw)
    if not isinstance(raw, dict):
        raise TypeError(f"expected JSON object, got {type(raw)!r}")
    return raw


def _as_dt(raw: Any) -> Optional[datetime]:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    raise TypeError(f"expected datetime, got {type(raw)!r}")


def policy_from_row(row: Mapping[str, Any]) -> AccessPolicy:
    """Map access_policies DB row → AccessPolicy."""
    mode = str(row.get("mode") or "hard")
    if mode not in ("hard", "soft", "hide", "redirect"):
        mode = "hard"
    combine = str(row.get("plan_role_combine") or "or")
    if combine not in ("or", "and"):
        combine = "or"
    close_b = str(row.get("close_behavior") or "default")
    if close_b not in ("default", "deny"):
        close_b = "default"
    return AccessPolicy(
        target_key=str(row["target_key"]),
        enabled=bool(row.get("enabled", 1)),
        mode=mode,  # type: ignore[arg-type]
        min_role=(str(row["min_role"]) if row.get("min_role") else None),
        selected_plans=_parse_json_list(row.get("selected_plans_json")),
        exact_plans_only=bool(row.get("exact_plans_only", 0)),
        all_plans=_parse_json_list(row.get("all_plans_json")),
        deny_plans=_parse_json_list(row.get("deny_plans_json")),
        plan_role_combine=combine,  # type: ignore[arg-type]
        require_signed_in=bool(row.get("require_signed_in", 1)),
        opens_at=_as_dt(row.get("opens_at")),
        closes_at=_as_dt(row.get("closes_at")),
        close_behavior=close_b,  # type: ignore[arg-type]
        deny_ui=_parse_json_obj(row.get("deny_ui_json")),
        time_ui=_parse_json_obj(row.get("time_ui_json")),
        campaign_id=(
            int(row["campaign_id"]) if row.get("campaign_id") is not None else None
        ),
        grandfather_enrollments=bool(row.get("grandfather_enrollments", 1)),
        label=str(row.get("label") or ""),
        notes=(str(row["notes"]) if row.get("notes") is not None else None),
        version=int(row.get("version") or 1),
    )


def load_policy(cur, target_key: str) -> Optional[AccessPolicy]:
    cur.execute(
        "SELECT * FROM access_policies WHERE target_key = %s",
        (target_key,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    return policy_from_row(row)


def load_policies_many(cur, keys: Sequence[str]) -> dict[str, AccessPolicy]:
    """Batch load — missing keys omitted (type default applies)."""
    if not keys:
        return {}
    # de-dupe preserve order
    seen: list[str] = []
    for k in keys:
        if k not in seen:
            seen.append(k)
    placeholders = ",".join(["%s"] * len(seen))
    cur.execute(
        f"SELECT * FROM access_policies WHERE target_key IN ({placeholders})",
        tuple(seen),
    )
    out: dict[str, AccessPolicy] = {}
    for row in cur.fetchall():
        p = policy_from_row(row)
        out[p.target_key] = p
    return out
