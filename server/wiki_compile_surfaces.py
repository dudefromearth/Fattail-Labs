"""Declared IKI/Wiki-local surface_key list (Wiki Spec v1.2 W1).

Capture sanitizer (AT-WA3): surface_key + optional declared state_key + route.
Never entity ids, never query string, never Family B, never page text.
"""

from __future__ import annotations

from urllib.parse import urlparse

from config import ConfigError

# W1 declared list. iki.runner is a string here, not a Runner edit.
DECLARED_SURFACES: dict[str, str] = {
    "iki.wiki.entry": "/app/wiki",
    "iki.wiki.article": "/app/wiki/",
    "iki.runner": "/app/iki/runner",
    "iki.factory": "/app/iki/factory",
}

# No state_key tokens declared in W1.
DECLARED_STATE_KEYS: frozenset[str] = frozenset()


class CaptureError(ValueError):
    """Named capture failure (unknown surface, entity leak, widen)."""


def surface_for_route(route: str) -> str | None:
    path = _route_path(route)
    if path == "/app/wiki":
        return "iki.wiki.entry"
    if path.startswith("/app/wiki/") and len(path) > len("/app/wiki/"):
        return "iki.wiki.article"
    if path == "/app/iki/runner" or path.startswith("/app/iki/runner/"):
        return "iki.runner"
    if path == "/app/iki/factory" or path.startswith("/app/iki/factory/"):
        return "iki.factory"
    return None


def _route_path(route: str) -> str:
    raw = (route or "").strip()
    if not raw:
        return ""
    if "://" in raw:
        return urlparse(raw).path or ""
    return raw.split("?", 1)[0].split("#", 1)[0]


def sanitize_capture(payload: dict) -> dict:
    """Return {surface_key, state_key, route} only. Drop everything else.

    AT-WA3: a URL carrying a trade id in search must not leak into the payload.
    """
    if not isinstance(payload, dict):
        raise CaptureError("capture payload must be an object")
    surface = str(payload.get("surface_key") or "").strip()
    if surface not in DECLARED_SURFACES:
        raise CaptureError(f"unknown surface_key: {surface!r}")
    state_raw = payload.get("state_key")
    state = None if state_raw in (None, "") else str(state_raw).strip()
    if state is not None and state not in DECLARED_STATE_KEYS:
        raise CaptureError("state_key must be a declared token (none in W1)")
    route = _route_path(str(payload.get("route") or ""))
    if not route.startswith("/"):
        raise CaptureError("route must be a path")
    expected = DECLARED_SURFACES[surface]
    if expected.endswith("/"):
        if not (route == expected.rstrip("/") or route.startswith(expected)):
            raise CaptureError("route does not match surface_key")
    elif route != expected and not route.startswith(expected + "/"):
        raise CaptureError("route does not match surface_key")
    return {
        "surface_key": surface,
        "state_key": state,
        "route": route,
    }


def identity_key(surface_key: str, state_key: str | None = None) -> str:
    if state_key:
        return f"{surface_key}#{state_key}"
    return surface_key


def require_declared_surface(surface_key: str) -> str:
    key = (surface_key or "").strip()
    if key not in DECLARED_SURFACES:
        raise ConfigError(f"unknown surface_key: {key!r}")
    return key
