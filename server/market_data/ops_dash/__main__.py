"""Do not bind a dashboard. Live pane is StudioOne Chain Snapshot :5055."""

from __future__ import annotations

import sys

from market_data.ops_dash import LIVE_PANE


def main() -> int:
    print(
        f"No second dashboard. Live pane: {LIVE_PANE} "
        "(Chain Snapshot · GET /api/vp-ops).",
        file=sys.stderr,
        flush=True,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
