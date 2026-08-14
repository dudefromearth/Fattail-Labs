#!/usr/bin/env python3
"""Fail loud unless a GO artifact names the given ID.

Bill RB-08 / DL-328. Chat GO is not authority.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def normalize_id(item_id: str) -> str:
    raw = (item_id or "").strip()
    if not raw:
        raise ValueError("empty GO id")
    return raw.upper()


def _field(text: str, name: str) -> str | None:
    m = re.search(rf"^{name}:\s*(.+?)\s*$", text, flags=re.MULTILINE)
    return m.group(1).strip() if m else None


def _is_go_file(path: Path, item_id: str) -> bool:
    if not path.is_file():
        return False
    text = path.read_text(encoding="utf-8")
    found_id = _field(text, "id")
    status = _field(text, "status")
    if found_id is None or status is None:
        return False
    return found_id == item_id and status == "GO"


def find_go(item_id: str, root: Path | None = None) -> Path | None:
    root = root or REPO_ROOT
    item_id = normalize_id(item_id)
    canonical = root / "agents" / "go" / f"{item_id}.md"
    if _is_go_file(canonical, item_id):
        return canonical
    reports = root / "agents"
    if reports.is_dir():
        for pattern in (
            f"*/gate-reports/{item_id}-0-coach-go.md",
            f"*/gate-reports/{item_id}-coach-go.md",
        ):
            for path in reports.glob(pattern):
                if _is_go_file(path, item_id):
                    return path
    return None


def check(item_id: str, root: Path | None = None) -> tuple[bool, str]:
    try:
        item_id = normalize_id(item_id)
    except ValueError as exc:
        return False, str(exc)
    path = find_go(item_id, root=root)
    if path is None:
        return (
            False,
            f"REFUSE: no GO artifact for {item_id}\n"
            f"  expected: agents/go/{item_id}.md with `id: {item_id}` and `status: GO`\n"
            "  Chat GO is not authority. Copy agents/go/TEMPLATE.md.",
        )
    return True, str(path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Abort unless a dated GO file names this ID (DL-328)."
    )
    parser.add_argument("--id", required=True, help="Bill or packet id, e.g. RB-08 or CL-1")
    parser.add_argument(
        "--root",
        default=str(REPO_ROOT),
        help="Repo root (tests may override)",
    )
    args = parser.parse_args(argv)
    ok, msg = check(args.id, root=Path(args.root))
    if not ok:
        print(msg, file=sys.stderr)
        return 1
    print(f"GO: {normalize_id(args.id)} -> {msg}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
