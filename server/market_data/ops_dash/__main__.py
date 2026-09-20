"""RETIRED StudioTwo interim. Single pane is StudioOne Chain Snapshot :5055."""

from __future__ import annotations

import sys

CONSOLIDATED = "http://studioone.local:5055"


def main() -> int:
    print(
        "ops_dash RETIRED. Single ops pane: "
        f"{CONSOLIDATED} (Chain Snapshot · GET /api/vp-ops). "
        "Do not bind :5056.",
        file=sys.stderr,
        flush=True,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
