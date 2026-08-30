#!/usr/bin/env python3
"""Upsert LABS_SSR_ARCHIVE_TOKEN in .env from stdin. Never prints the value."""

from __future__ import annotations

import sys
from pathlib import Path

KEY = "LABS_SSR_ARCHIVE_TOKEN="


def upsert(env_path: Path, token: str) -> None:
    if len(token) < 32:
        raise SystemExit("token shorter than 32")
    line = f"{KEY}{token}\n"
    text = env_path.read_text() if env_path.exists() else ""
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    found = False
    for ln in lines:
        if ln.startswith(KEY):
            if not found:
                out.append(line)
                found = True
        else:
            out.append(ln)
    if not found:
        if out and not str(out[-1]).endswith("\n"):
            out.append("\n")
        out.append(line)
    env_path.write_text("".join(out))
    print(f"upserted {env_path} token_len={len(token)}", flush=True)


def main() -> int:
    env_path = Path(sys.argv[1] if len(sys.argv) > 1 else "/Users/ernie/Fattail-Labs/.env")
    token = sys.stdin.read().strip()
    upsert(env_path, token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
