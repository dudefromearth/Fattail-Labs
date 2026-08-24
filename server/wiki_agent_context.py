"""Context-provider registry (Wiki Spec v0.2.1 III.3 · WU-1).

Config-driven, fail-loud. First provider: /app hub (exact route, not a prefix
of /app/wiki). Unregistered routes return no entity (route-context session).
"""

from __future__ import annotations

import os

from config import ConfigError

ENV = "LABS_WIKI_CONTEXT_PROVIDERS"

HUB_ENTITY = {
    "kind": "hub",
    "id": "apps",
    "canonical_url": "/app",
}


def provider_map() -> dict[str, str]:
    raw = os.environ.get(ENV, "").strip()
    if not raw:
        raise ConfigError(f"Missing required environment variable: {ENV}")
    out: dict[str, str] = {}
    for part in raw.split(","):
        item = part.strip()
        if not item:
            continue
        if "=" not in item:
            raise ConfigError(
                f"{ENV} entries must be slug=route, got {item!r}"
            )
        slug, route = item.split("=", 1)
        slug = slug.strip()
        route = route.strip()
        if not slug or not route.startswith("/"):
            raise ConfigError(
                f"{ENV} entries must be slug=/path, got {item!r}"
            )
        if "?" in route or "#" in route:
            raise ConfigError(f"{ENV} route must not carry query or fragment")
        out[slug] = route.rstrip("/") or "/"
    if not out:
        raise ConfigError(f"{ENV} must list at least one slug=route")
    return out


def normalize_route(route: str) -> str:
    path = str(route or "").split("?")[0].split("#")[0].strip()
    if not path.startswith("/"):
        return path
    return path.rstrip("/") or "/"


def match_provider(route: str) -> str | None:
    """Exact registered route only (hub=/app matches /app, not /app/wiki)."""
    path = normalize_route(route)
    mapping = provider_map()
    for slug, registered in mapping.items():
        if path == registered:
            return slug
    return None


def entity_for_slug(slug: str) -> dict:
    if slug == "hub":
        return dict(HUB_ENTITY)
    raise ConfigError(f"no entity factory for context provider {slug!r}")


def enrich(route: str) -> dict | None:
    slug = match_provider(route)
    if slug is None:
        return None
    return entity_for_slug(slug)


def resolve(route: str) -> dict:
    path = normalize_route(route)
    slug = match_provider(path)
    if slug is None:
        return {
            "registered": False,
            "provider": None,
            "route": path,
            "entity": None,
        }
    return {
        "registered": True,
        "provider": slug,
        "route": path,
        "entity": entity_for_slug(slug),
    }
