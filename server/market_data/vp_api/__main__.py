"""Dev sidecar on :4010. Does not touch Labs :3000 / :4000."""

from __future__ import annotations

import os

import uvicorn


def main() -> int:
    port = int(os.environ.get("LABS_VP_API_PORT") or "4010")
    host = (os.environ.get("LABS_VP_API_HOST") or "127.0.0.1").strip()
    os.environ.setdefault("LABS_VP_WARMER", "1")
    from market_data.vp_warmer import start_background

    start_background()
    uvicorn.run(
        "market_data.vp_api.app:app",
        host=host,
        port=port,
        reload=False,
        timeout_keep_alive=75,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
