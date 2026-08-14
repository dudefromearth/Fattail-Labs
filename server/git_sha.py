"""Resolve the running checkout SHA for /api/health (RB-02 / DL-G2)."""

from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

_SHA_RE = re.compile(r"^[0-9a-f]{7,40}$")
_cached: str | None = None
_REPO_ROOT = Path(__file__).resolve().parents[1]


def reset_git_sha_for_tests() -> None:
    global _cached
    _cached = None


def resolve_git_sha() -> str:
    """LABS_GIT_SHA if set and well-formed, else `git rev-parse HEAD`.

    Raises RuntimeError if neither yields a hex SHA. Health must not guess.
    """
    global _cached
    if _cached is not None:
        return _cached
    raw = (os.environ.get("LABS_GIT_SHA") or "").strip().lower()
    if raw:
        if not _SHA_RE.match(raw):
            raise RuntimeError(f"LABS_GIT_SHA is not a git SHA: {raw!r}")
        _cached = raw
        return _cached
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=str(_REPO_ROOT),
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise RuntimeError("git rev-parse HEAD failed") from exc
    sha = out.strip().lower()
    if not _SHA_RE.match(sha):
        raise RuntimeError(f"git rev-parse returned a non-SHA: {sha!r}")
    _cached = sha
    return _cached
