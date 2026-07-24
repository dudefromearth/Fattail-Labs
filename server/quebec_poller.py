#!/usr/bin/env python3
"""Quebec automatic board poller.

Run (production launchd or manual)::

    cd server && set -a && source ../.env && set +a
    export LABS_QUEBEC_POLLER=1
    export LABS_QUEBEC_AUTO_PRODUCE=1          # optional: fill package stages
    export LABS_QUEBEC_AUTO_PRODUCE_MODE=fixtures  # or live|auto
    .venv/bin/python quebec_poller.py

Spec: FatTail-Labs-Quebec-Poller-Spec-v1.0.md
"""

from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path

# Ensure server/ is on path when launched as script
SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [quebec-poller] %(levelname)s %(message)s",
)
log = logging.getLogger("quebec_poller")


def main() -> int:
    import quebec as quebec_mod

    if not quebec_mod.poller_enabled():
        log.error(
            "LABS_QUEBEC_POLLER is not set to 1 — refusing to run "
            "(set LABS_QUEBEC_POLLER=1 to enable automatic board progress)"
        )
        return 2

    interval = quebec_mod.poll_interval_seconds()
    log.info(
        "starting poller interval=%ss auto_produce=%s mode=%s heygen=%s max_actions=%s",
        interval,
        quebec_mod.auto_produce_enabled(),
        quebec_mod.produce_mode(),
        quebec_mod.auto_heygen_enabled(),
        quebec_mod.max_actions_default(),
    )

    while True:
        try:
            result = quebec_mod.forward_progress()
            log.info(
                "cycle ok actions=%s produced=%s errors=%s",
                result.get("action_count"),
                len(result.get("produced") or []),
                len(result.get("errors") or []),
            )
            for a in (result.get("actions") or [])[:10]:
                log.info("  action %s", a)
            for e in (result.get("errors") or [])[:5]:
                log.warning("  error %s", e)
        except Exception:
            log.exception("cycle failed")
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
