"""Wiki Agent git writer — server commits; no model credentials (WA1)."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from config import ConfigError


def _require_author() -> tuple[str, str]:
    name = os.environ.get("LABS_WIKI_AGENT_GIT_NAME", "").strip()
    email = os.environ.get("LABS_WIKI_AGENT_GIT_EMAIL", "").strip()
    if not name:
        raise ConfigError("Missing required environment variable: LABS_WIKI_AGENT_GIT_NAME")
    if not email:
        raise ConfigError("Missing required environment variable: LABS_WIKI_AGENT_GIT_EMAIL")
    return name, email


def commit_paths(root: Path, *, contract_id: str, relative_paths: list[str], message: str | None = None) -> str:
    name, email = _require_author()
    root = Path(root)
    if not relative_paths:
        raise ConfigError("nothing to commit")
    subprocess.run(["git", "add", "--", *relative_paths], cwd=root, check=True)
    msg = message or f"wiki-agent {contract_id} draft"
    subprocess.run(
        [
            "git",
            "-c",
            f"user.name={name}",
            "-c",
            f"user.email={email}",
            "commit",
            "-m",
            msg,
        ],
        cwd=root,
        check=True,
    )
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=root, text=True
    ).strip()


def commit_fixture_draft(
    root: Path,
    *,
    contract_id: str,
    relative_path: str,
    body: str,
) -> str:
    """Write one draft file and commit it. Returns commit SHA."""
    root = Path(root)
    dest = (root / relative_path).resolve()
    if not str(dest).startswith(str(root.resolve())):
        raise ConfigError("fixture path escapes LABS_WIKI_ROOT")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(body, encoding="utf-8")
    return commit_paths(
        root,
        contract_id=contract_id,
        relative_paths=[relative_path],
        message=f"wiki-agent {contract_id} fixture draft",
    )
