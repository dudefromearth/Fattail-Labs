"""SPEC-14 — CP-1 post-close StudioOne job. Reads pinned snapshots only."""

from __future__ import annotations

import argparse
import json

from symbology.spec import SpecLoadRefused, load_specs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Load pinned contract spec snapshots")
    parser.add_argument(
        "--session-open",
        action="store_true",
        help="Refuse (CP-1). Specs load only post-close.",
    )
    args = parser.parse_args(argv)
    try:
        out = load_specs(session_open=bool(args.session_open))
    except SpecLoadRefused as exc:
        raise SystemExit(f"refused: {exc}") from exc
    print(json.dumps(out, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
