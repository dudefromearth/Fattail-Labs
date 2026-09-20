"""Supervised Engine rebin. StudioTwo. No Massive. No :3000/:4000."""

from __future__ import annotations

import os
import time

from market_data.vp_engine.bin_landed import bin_developing

INTERVAL_S = int(os.environ.get("LABS_VP_BIN_INTERVAL_S") or "15")


def main() -> int:
    print(f"vp-engine bin_loop developing-only interval={INTERVAL_S}s", flush=True)
    while True:
        try:
            report = bin_developing()
            print(f"vp-engine developing {report}", flush=True)
        except Exception as exc:
            print(f"vp-engine bin_loop error: {exc}", flush=True)
        time.sleep(max(5, INTERVAL_S))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
