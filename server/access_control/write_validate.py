"""Policy write validation — Spec §§4.2.1, 4.2.2, 8.2. Expand never on write."""

from __future__ import annotations

from typing import Any, Optional
from urllib.parse import urlparse

from access_control.constants import (
    ACCESS_UNGATEABLE_TARGETS,
    DATA_BEARING_APPS,
    KNOWN_PLAN_SLUGS,
    PLAN_ROLE_COMBINE,
    POLICY_MODES,
    ROLE_LADDER,
)
from access_control.keys import TargetKeyError, parse_target_key, validate_target_key

# Hosts allowed for mode=redirect and deny CTAs (extend carefully).
CTA_HOST_ALLOWLIST: frozenset[str] = frozenset(
    {
        "labs.fattail.ai",
        "labs-stage.fattail.ai",
        "localhost",
        "127.0.0.1",
        "fattail.ai",
        "www.fattail.ai",
        "0-dte.com",
        "www.0-dte.com",
        "firstmovers.ai",
        "www.firstmovers.ai",
    }
)

DATA_BEARING_FLOOR_MSG = (
    "Data-bearing apps cannot hard-lock or hide member read/export. "
    "Use soft mode with plan/role constraints so writes can be denied while "
    "read/export remain available."
)


class PolicyWriteError(Exception):
    def __init__(self, message: str, *, field: str | None = None):
        super().__init__(message)
        self.message = message
        self.field = field


def _as_plan_list(raw: Any, field: str) -> Optional[list[str]]:
    if raw is None:
        return None
    if not isinstance(raw, (list, tuple)):
        raise PolicyWriteError(f"{field} must be a list of plan slugs or null", field=field)
    out = [str(x).strip() for x in raw]
    for s in out:
        if s not in KNOWN_PLAN_SLUGS:
            raise PolicyWriteError(
                f"unknown plan slug {s!r} in {field}; known={sorted(KNOWN_PLAN_SLUGS)}",
                field=field,
            )
    return out


def _check_href(url: str | None, field: str) -> None:
    if not url:
        return
    u = str(url).strip()
    if u.startswith("/"):
        return  # relative OK
    parsed = urlparse(u)
    if parsed.scheme not in ("http", "https"):
        raise PolicyWriteError(f"{field} must be http(s) or site-relative", field=field)
    host = (parsed.hostname or "").lower()
    if host not in CTA_HOST_ALLOWLIST:
        raise PolicyWriteError(
            f"{field} host {host!r} not in allowlist",
            field=field,
        )


def validate_policy_write(target_key: str, body: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize write body → row fields (intent only; no expand)."""
    try:
        key = validate_target_key(target_key)
        tk = parse_target_key(key)
    except TargetKeyError as exc:
        raise PolicyWriteError(str(exc), field="target_key") from exc

    if key in ACCESS_UNGATEABLE_TARGETS:
        raise PolicyWriteError(
            f"target {key} is ungateable (remedy surface)",
            field="target_key",
        )

    mode = str(body.get("mode") or "hard")
    if mode not in POLICY_MODES:
        raise PolicyWriteError(
            f"mode must be one of {sorted(POLICY_MODES)}",
            field="mode",
        )

    # Data-bearing: hard/hide forbidden (422 only — no coerce)
    if tk.kind.value == "app" and tk.name in DATA_BEARING_APPS:
        if mode in ("hard", "hide"):
            raise PolicyWriteError(DATA_BEARING_FLOOR_MSG, field="mode")

    min_role = body.get("min_role")
    if min_role is not None and min_role != "":
        min_role = str(min_role)
        if min_role not in ROLE_LADDER:
            raise PolicyWriteError(
                f"min_role must be one of {list(ROLE_LADDER)} or null",
                field="min_role",
            )
    else:
        min_role = None

    selected = _as_plan_list(body.get("selected_plans"), "selected_plans")
    all_plans = _as_plan_list(body.get("all_plans"), "all_plans")
    deny_plans = _as_plan_list(body.get("deny_plans"), "deny_plans")

    combine = str(body.get("plan_role_combine") or "or")
    if combine not in PLAN_ROLE_COMBINE:
        raise PolicyWriteError("plan_role_combine must be or|and", field="plan_role_combine")

    close_behavior = str(body.get("close_behavior") or "default")
    if close_behavior not in ("default", "deny"):
        raise PolicyWriteError("close_behavior must be default|deny", field="close_behavior")

    deny_ui = body.get("deny_ui")
    time_ui = body.get("time_ui")
    if deny_ui is not None and not isinstance(deny_ui, dict):
        raise PolicyWriteError("deny_ui must be object or null", field="deny_ui")
    if time_ui is not None and not isinstance(time_ui, dict):
        raise PolicyWriteError("time_ui must be object or null", field="time_ui")

    if isinstance(deny_ui, dict):
        _check_href(deny_ui.get("cta_href") or deny_ui.get("primary_href"), "deny_ui.cta_href")
    if mode == "redirect":
        _check_href(body.get("redirect_href") or (deny_ui or {}).get("href"), "redirect_href")

    enabled = body.get("enabled")
    if enabled is None:
        enabled = True

    return {
        "target_key": key,
        "enabled": 1 if enabled else 0,
        "mode": mode,
        "min_role": min_role,
        "selected_plans": selected,
        "exact_plans_only": bool(body.get("exact_plans_only") or False),
        "all_plans": all_plans,
        "deny_plans": deny_plans,
        "plan_role_combine": combine,
        "require_signed_in": bool(
            body["require_signed_in"] if "require_signed_in" in body else True
        ),
        "opens_at": body.get("opens_at"),
        "closes_at": body.get("closes_at"),
        "close_behavior": close_behavior,
        "deny_ui": deny_ui,
        "time_ui": time_ui,
        "campaign_id": body.get("campaign_id"),
        "grandfather_enrollments": bool(
            body["grandfather_enrollments"]
            if "grandfather_enrollments" in body
            else True
        ),
        "label": str(body.get("label") or "")[:255],
        "notes": body.get("notes"),
    }
