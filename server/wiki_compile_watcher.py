"""Wiki compile watcher stub (Wiki Spec v1.2 W0 · SI #2).

Records last SHA on wiki_compile_watcher_state. First SHA writes zero
candidate rows (AT-WK5). Diffing kinds is W3+.

SHA input is named and fail-loud: CLI --sha / env LABS_WIKI_WATCHER_SHA /
test fixture. No silent default. No git rev-parse fallback. No MiniTwo poll.

Usage:
  python -m wiki_compile_watcher --sha <hex>
  LABS_WIKI_WATCHER_SHA=<hex> python -m wiki_compile_watcher
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any

from config import ConfigError

import db
import wiki_compile_store as store

_SHA_RE = re.compile(r"^[0-9a-f]{7,40}$")

ENV_SHA = "LABS_WIKI_WATCHER_SHA"

FIRST_SHA_SNAPSHOT = (
    "first SHA is a snapshot: must not write candidate rows (AT-WK5)"
)

MISSING_SHA = (
    f"Missing required SHA: pass --sha, set {ENV_SHA}, or pass a test fixture. "
    "No silent default."
)


class WikiCompileWatcherError(RuntimeError):
    """Named watcher failure (first-SHA snapshot, invalid SHA)."""


def require_sha(raw: str | None) -> str:
    if raw is None or not str(raw).strip():
        raise ConfigError(MISSING_SHA)
    sha = str(raw).strip().lower()
    if not _SHA_RE.match(sha):
        raise ConfigError(f"{ENV_SHA} is not a git SHA: {raw!r}")
    return sha


def resolve_sha_input(
    *,
    cli_sha: str | None = None,
    fixture: str | None = None,
) -> str:
    """Named SHA only. Fixture (tests) · CLI --sha · env. Never git rev-parse."""
    if fixture is not None:
        return require_sha(fixture)
    if cli_sha is not None:
        return require_sha(cli_sha)
    return require_sha(os.environ.get(ENV_SHA))


def record_sha(sha: str, *, conn=None) -> dict[str, Any]:
    """Persist last SHA. W0 stub never inserts candidate rows.

    On first SHA (previous last_sha is NULL): candidate count must stay 0.
    Named error FIRST_SHA_SNAPSHOT if it does not.
    """
    sha = require_sha(sha)

    def _run(c) -> dict[str, Any]:
        prev = store.get_watcher_state(c)
        first = prev["last_sha"] is None
        store.set_watcher_sha(c, sha)
        n = store.count_candidates(c)
        if first and n != 0:
            raise WikiCompileWatcherError(FIRST_SHA_SNAPSHOT)
        return {
            "last_sha": sha,
            "first_snapshot": first,
            "candidate_count": n,
        }

    if conn is not None:
        return _run(conn)
    with db.transaction() as c:
        return _run(c)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description=(
            "Wiki compile watcher stub: record last SHA, write zero candidates "
            "on first SHA (AT-WK5). SHA is required (CLI / env). No MiniTwo poll."
        )
    )
    p.add_argument(
        "--sha",
        default=None,
        help="Checkout revision this process already sees (7–40 hex).",
    )
    args = p.parse_args(argv)
    try:
        sha = resolve_sha_input(cli_sha=args.sha)
        result = record_sha(sha)
    except (ConfigError, WikiCompileWatcherError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
