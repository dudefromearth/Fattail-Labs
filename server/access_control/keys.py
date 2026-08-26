"""Target key grammar — Spec v0.4 §4.2; India AC0-1 binding note.

Exact patterns (AC1-1):

| Kind     | Pattern                         | Example                    |
|----------|---------------------------------|----------------------------|
| surface  | surface:{name}                  | surface:catalog            |
| app      | app:{slug}                      | app:trade-log              |
| product  | product:{slug}                  | product:heatmap-gex        |
| course   | course:{id}                     | course:12                  |
| module   | module:{id}                     | module:34                  |
| lesson   | lesson:{id}                     | lesson:56                  |
| resource | resource:{id}                   | resource:78                |
| campaign | campaign:{slug}:{part}          | campaign:obs-launch:lander |

IDs are positive decimal integers (as-built numeric PKs).
Slugs/names: lowercase ``[a-z0-9][a-z0-9_-]*`` (1–128 chars).
Campaign *part*: same slug grammar (lander, email, etc.).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from access_control.constants import (
    ACCESS_UNGATEABLE_TARGETS,
    DATA_BEARING_APPS,
)

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,127}$")
_ID_RE = re.compile(r"^[1-9][0-9]{0,18}$")  # positive int as string


class TargetKind(str, Enum):
    SURFACE = "surface"
    APP = "app"
    PRODUCT = "product"
    COURSE = "course"
    MODULE = "module"
    LESSON = "lesson"
    RESOURCE = "resource"
    CAMPAIGN = "campaign"


_KIND_PREFIX: dict[str, TargetKind] = {k.value: k for k in TargetKind}

COURSE_FAMILY_KINDS: frozenset[TargetKind] = frozenset(
    {
        TargetKind.COURSE,
        TargetKind.MODULE,
        TargetKind.LESSON,
        TargetKind.RESOURCE,
    }
)


@dataclass(frozen=True, slots=True)
class TargetKey:
    """Parsed access target."""

    kind: TargetKind
    raw: str
    # surface name / app slug / campaign slug
    name: Optional[str] = None
    # numeric entity id for course family
    entity_id: Optional[int] = None
    # campaign part (lander, …)
    part: Optional[str] = None

    @property
    def is_course_family(self) -> bool:
        return self.kind in COURSE_FAMILY_KINDS


class TargetKeyError(ValueError):
    """Invalid target key grammar."""


def _require_slug(label: str, value: str) -> str:
    if not value or not _SLUG_RE.match(value):
        raise TargetKeyError(
            f"invalid {label}: {value!r} "
            f"(expected lowercase slug [a-z0-9][a-z0-9_-]* )"
        )
    return value


def _require_id(label: str, value: str) -> int:
    if not value or not _ID_RE.match(value):
        raise TargetKeyError(
            f"invalid {label}: {value!r} (expected positive integer id)"
        )
    return int(value)


def parse_target_key(raw: str) -> TargetKey:
    """Parse and validate a target key. Raises TargetKeyError on failure."""
    if not isinstance(raw, str) or not raw:
        raise TargetKeyError("target_key must be a non-empty string")
    key = raw.strip()
    if key != raw or " " in key:
        raise TargetKeyError(f"target_key must not have surrounding/internal spaces: {raw!r}")
    if len(key) > 512:
        raise TargetKeyError("target_key exceeds 512 characters")

    if key.count(":") < 1:
        raise TargetKeyError(f"target_key missing kind prefix: {key!r}")

    kind_s, rest = key.split(":", 1)
    kind = _KIND_PREFIX.get(kind_s)
    if kind is None:
        raise TargetKeyError(
            f"unknown target kind {kind_s!r}; "
            f"expected one of {sorted(_KIND_PREFIX)}"
        )
    if not rest:
        raise TargetKeyError(f"empty rest after {kind_s}:")

    if kind is TargetKind.SURFACE:
        name = _require_slug("surface name", rest)
        return TargetKey(kind=kind, raw=key, name=name)

    if kind is TargetKind.APP:
        name = _require_slug("app slug", rest)
        return TargetKey(kind=kind, raw=key, name=name)

    if kind is TargetKind.PRODUCT:
        name = _require_slug("product slug", rest)
        return TargetKey(kind=kind, raw=key, name=name)

    if kind in (
        TargetKind.COURSE,
        TargetKind.MODULE,
        TargetKind.LESSON,
        TargetKind.RESOURCE,
    ):
        entity_id = _require_id(f"{kind.value} id", rest)
        return TargetKey(kind=kind, raw=key, entity_id=entity_id)

    if kind is TargetKind.CAMPAIGN:
        # campaign:{slug}:{part} — part may contain no extra colon for v0.4
        if rest.count(":") != 1:
            raise TargetKeyError(
                f"campaign key must be campaign:{{slug}}:{{part}}, got {key!r}"
            )
        slug, part = rest.split(":", 1)
        slug = _require_slug("campaign slug", slug)
        part = _require_slug("campaign part", part)
        return TargetKey(kind=kind, raw=key, name=slug, part=part)

    raise TargetKeyError(f"unhandled kind {kind}")  # pragma: no cover


def validate_target_key(raw: str) -> str:
    """Return canonical raw key if valid; raise TargetKeyError otherwise."""
    return parse_target_key(raw).raw


def build_target_key(
    kind: TargetKind | str,
    *,
    name: str | None = None,
    entity_id: int | None = None,
    part: str | None = None,
) -> str:
    """Build a canonical target key from parts (fail loud on bad input)."""
    k = TargetKind(kind) if not isinstance(kind, TargetKind) else kind

    if k is TargetKind.SURFACE:
        if not name:
            raise TargetKeyError("surface requires name=")
        return validate_target_key(f"surface:{name}")

    if k is TargetKind.APP:
        if not name:
            raise TargetKeyError("app requires name= (slug)")
        return validate_target_key(f"app:{name}")

    if k is TargetKind.PRODUCT:
        if not name:
            raise TargetKeyError("product requires name= (slug)")
        return validate_target_key(f"product:{name}")

    if k in (
        TargetKind.COURSE,
        TargetKind.MODULE,
        TargetKind.LESSON,
        TargetKind.RESOURCE,
    ):
        if entity_id is None or int(entity_id) < 1:
            raise TargetKeyError(f"{k.value} requires positive entity_id=")
        return validate_target_key(f"{k.value}:{int(entity_id)}")

    if k is TargetKind.CAMPAIGN:
        if not name or not part:
            raise TargetKeyError("campaign requires name= and part=")
        return validate_target_key(f"campaign:{name}:{part}")

    raise TargetKeyError(f"unhandled kind {k}")  # pragma: no cover


def is_course_family(raw_or_parsed: str | TargetKey) -> bool:
    tk = (
        raw_or_parsed
        if isinstance(raw_or_parsed, TargetKey)
        else parse_target_key(raw_or_parsed)
    )
    return tk.is_course_family


def is_data_bearing_app_key(raw_or_parsed: str | TargetKey) -> bool:
    tk = (
        raw_or_parsed
        if isinstance(raw_or_parsed, TargetKey)
        else parse_target_key(raw_or_parsed)
    )
    return tk.kind is TargetKind.APP and tk.name in DATA_BEARING_APPS


def is_ungateable_target(raw: str) -> bool:
    """True if write must 422 (constant membership; invalid keys → False)."""
    try:
        key = validate_target_key(raw)
    except TargetKeyError:
        return False
    return key in ACCESS_UNGATEABLE_TARGETS
