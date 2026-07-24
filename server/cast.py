"""Studio cast registry — load AVATAR-*.md from docs/studio/cast/.

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0.md
Cast members are product assets. Source of truth is the in-repo markdown files.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

# server/cast.py → repo root
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CAST_DIR = REPO_ROOT / "docs" / "studio" / "cast"

_AVATAR_FILE_RE = re.compile(r"^AVATAR-(.+)\.md$", re.IGNORECASE)
_FIELD_RE = re.compile(r"^-\s*(Group ID|Voice ID|Voice Name|Default orientation)\s*:\s*(.+)$", re.I)
_ROLE_RE = re.compile(r"^\*\*(.+?)\*\*")


class CastError(Exception):
    pass


def cast_dir() -> Path:
    """Allow test override via LABS_CAST_DIR."""
    import os

    override = os.environ.get("LABS_CAST_DIR", "").strip()
    if override:
        return Path(override)
    return DEFAULT_CAST_DIR


def _parse_avatar_md(path: Path, cast_id: str) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    group_id: str | None = None
    voice_id: str | None = None
    voice_name: str | None = None
    orientation: str = "landscape"
    role: str | None = None
    appearance_lines: list[str] = []
    voice_lines: list[str] = []
    section: str | None = None

    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if stripped.startswith("## "):
            section = stripped[3:].strip().lower()
            continue
        if section == "heygen":
            m = _FIELD_RE.match(stripped)
            if m:
                key = m.group(1).lower()
                val = m.group(2).strip()
                if key == "group id":
                    group_id = val
                elif key == "voice id":
                    voice_id = val
                elif key == "voice name":
                    voice_name = val
                elif key == "default orientation":
                    orientation = val.lower()
        elif section == "role":
            if stripped.startswith("-") and not role:
                # e.g. "- **primary_coach** — …"
                inner = stripped.lstrip("- ").strip()
                rm = _ROLE_RE.match(inner)
                if rm:
                    role = rm.group(1).strip()
                else:
                    role = inner.split("—")[0].split("-")[0].strip()
        elif section == "appearance" and stripped.startswith("-"):
            appearance_lines.append(stripped.lstrip("- ").strip())
        elif section == "voice" and stripped.startswith("-"):
            voice_lines.append(stripped.lstrip("- ").strip())

    if not group_id:
        raise CastError(f"cast {cast_id}: missing HeyGen Group ID in {path.name}")
    if not voice_id:
        raise CastError(f"cast {cast_id}: missing HeyGen Voice ID in {path.name}")
    if orientation not in ("landscape", "portrait"):
        orientation = "landscape"

    return {
        "cast_id": cast_id,
        "name": cast_id.replace("-", " ").title(),
        "file": str(path.relative_to(REPO_ROOT)) if path.is_relative_to(REPO_ROOT) else str(path),
        "group_id": group_id,
        "voice_id": voice_id,
        "voice_name": voice_name,
        "orientation": orientation,
        "role": role,
        "appearance": appearance_lines,
        "voice_notes": voice_lines,
        "ready": bool(group_id and voice_id),
    }


def list_cast() -> list[dict[str, Any]]:
    d = cast_dir()
    if not d.is_dir():
        return []
    members: list[dict[str, Any]] = []
    for path in sorted(d.glob("AVATAR-*.md")):
        m = _AVATAR_FILE_RE.match(path.name)
        if not m:
            continue
        cast_id = m.group(1).upper()
        try:
            members.append(_parse_avatar_md(path, cast_id))
        except CastError:
            # Surface broken files as not-ready entries rather than hiding them
            members.append(
                {
                    "cast_id": cast_id,
                    "name": cast_id.replace("-", " ").title(),
                    "file": str(path),
                    "group_id": None,
                    "voice_id": None,
                    "voice_name": None,
                    "orientation": "landscape",
                    "role": None,
                    "appearance": [],
                    "voice_notes": [],
                    "ready": False,
                    "error": "missing Group ID or Voice ID",
                }
            )
    return members


def get_cast(cast_id: str) -> dict[str, Any]:
    cid = (cast_id or "").strip().upper()
    if not cid:
        raise CastError("cast_id required")
    # Accept bare id or AVATAR- prefix
    if cid.startswith("AVATAR-"):
        cid = cid[7:]
    path = cast_dir() / f"AVATAR-{cid}.md"
    if not path.is_file():
        raise CastError(f"unknown cast_id: {cid}")
    return _parse_avatar_md(path, cid)


def validate_cast_id(cast_id: str | None) -> str | None:
    """Return normalized cast_id or None; raise CastError if invalid non-empty."""
    if cast_id is None or str(cast_id).strip() == "":
        return None
    member = get_cast(str(cast_id))
    if not member.get("ready"):
        raise CastError(f"cast {member['cast_id']} is not ready (missing HeyGen IDs)")
    return member["cast_id"]
