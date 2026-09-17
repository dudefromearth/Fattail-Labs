"""Dev sidecar on :4010. Does not touch Labs :3000 / :4000."""

from __future__ import annotations

import os

import uvicorn


def main() -> int:
    port = int(os.environ.get("LABS_VP_API_PORT") or "4010")
    uvicorn.run(
        "market_data.vp_api.app:app",
        host="127.0.0.1",
        port=port,
        reload=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
