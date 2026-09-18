"""Evening packets. Clock gates + CP-1 still apply. StudioOne writes only after 16:00."""

from __future__ import annotations

import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
CT = ZoneInfo("America/Chicago")
REPO = Path(__file__).resolve().parents[3]
CARRY = REPO / "agents/p-volume-profile-service/gate-reports/VPS1-G-carry.md"


def after_close_et() -> bool:
    now = datetime.now(tz=ET)
    return now.hour > 16 or (now.hour == 16 and now.minute >= 0)


def in_halt_ct() -> bool:
    now = datetime.now(tz=CT)
    if now.weekday() >= 5:
        return False
    minutes = now.hour * 60 + now.minute
    return 17 * 60 <= minutes < 18 * 60


def vps2_act3() -> int:
    if not after_close_et():
        print("VPS2 ACT 3: HOLD clock (need >= 16:00 ET)", flush=True)
        return 2
    if not CARRY.is_file() or "**GO** for ingest" not in CARRY.read_text(encoding="utf-8"):
        print("VPS2 ACT 3: HOLD — VPS1-G carry is not GO", flush=True)
        return 2
    print("VPS2 ACT 3: GO cited. Engine install on StudioOne is this packet — not this morning.", flush=True)
    print("VPS2 ACT 3: ready (code+bin on StudioTwo already). StudioOne copy at halt/after-close.", flush=True)
    return 0


def vpsb_act_b() -> int:
    """Wait for the 17:00–18:00 CT halt; do not fail the queue at 16:05 ET."""
    print("VPSB ACT B: waiting for 17:00–18:00 CT halt", flush=True)
    while not in_halt_ct():
        now = datetime.now(tz=CT)
        if now.weekday() < 5 and now.hour >= 18:
            print("VPSB ACT B: missed halt window", flush=True)
            return 2
        time.sleep(30)
    print("VPSB ACT B: halt window — stop StudioTwo writer BEFORE StudioOne starts", flush=True)
    return 0


def tranche1() -> int:
    if not after_close_et():
        print("tranche 1: HOLD clock", flush=True)
        return 2
    print("tranche 1: newest-first 2026-09-16 descending (not started until ACT B lands)", flush=True)
    return 0


def backfill5() -> int:
    import subprocess

    if not after_close_et():
        print("backfill5: HOLD CP-1 clock (need >= 16:00 ET).", flush=True)
        return 2
    # Writes belong on StudioOne ingest root. StudioTwo does not mount FatTail2TB.
    rsync = subprocess.run(
        [
            "rsync",
            "-az",
            str(REPO / "server" / "market_data" / "vp_ingest") + "/",
            "ernie@192.168.1.111:/Users/ernie/Fattail-Labs/server/market_data/vp_ingest/",
        ]
    )
    if rsync.returncode != 0:
        print("backfill5: rsync vp_ingest to StudioOne failed", flush=True)
        return rsync.returncode
    proc = subprocess.run(
        [
            "ssh",
            "-o",
            "BatchMode=yes",
            "-i",
            str(Path.home() / ".ssh" / "id_studioone"),
            "-o",
            "IdentitiesOnly=yes",
            "ernie@192.168.1.111",
            "cd /Users/ernie/Fattail-Labs/server && .venv/bin/python -m market_data.vp_ingest.backfill --five",
        ]
    )
    print(f"backfill5 studioone exit={proc.returncode}", flush=True)
    return proc.returncode


def tonight_hot126() -> int:
    from market_data.vp_chunks import HORIZON_SESSIONS

    if HORIZON_SESSIONS != 126:
        print(f"tonight_hot126: FAIL horizon={HORIZON_SESSIONS} want 126", flush=True)
        return 2
    print("tonight_hot126: HORIZON_SESSIONS=126 live in this tree", flush=True)
    return 0


def tonight_streamer() -> int:
    from market_data.vp_api.app import app as vp_app

    routes = {getattr(r, "path", "") for r in vp_app.routes}
    if "/v1/stream/{source_symbol}" not in routes and "/v1/stream" not in routes:
        print(f"tonight_streamer: FAIL no stream route in {sorted(routes)[:12]}", flush=True)
        return 2
    print("tonight_streamer: GET /v1/stream seated (Contract v1.3)", flush=True)
    return 0


def tonight_capture() -> int:
    from market_data.vp_ingest.trade_symbols import stocks_subscribe_params, trade_capture_symbols

    syms = sorted(trade_capture_symbols())
    params = stocks_subscribe_params(syms)
    if "T.SPY" not in params or len(syms) < 8:
        print(f"tonight_capture: FAIL subscribe={params}", flush=True)
        return 2
    print(f"tonight_capture: registry subscribe {params} n={len(syms)}", flush=True)
    return 0


def tonight_minitwo_sa() -> int:
    mig = REPO / "migrations" / "154_sa_surface.sql"
    if not mig.is_file():
        print("tonight_minitwo_sa: FAIL 154_sa_surface.sql missing", flush=True)
        return 2
    print("tonight_minitwo_sa: 154 present; MiniTwo migrate is this packet's SSH after 16:00", flush=True)
    if not after_close_et():
        print("tonight_minitwo_sa: HOLD clock for MiniTwo migrate", flush=True)
        return 2
    import subprocess

    proc = subprocess.run(
        [
            "ssh",
            "-o",
            "BatchMode=yes",
            "MiniTwo",
            "cd /Users/ernie/Fattail-Labs/server && .venv/bin/python migrate.py",
        ],
        capture_output=True,
        text=True,
    )
    print(proc.stdout[-1500:] if proc.stdout else "", flush=True)
    print(proc.stderr[-500:] if proc.stderr else "", flush=True)
    return proc.returncode


def tonight_help_watch() -> int:
    out = (
        REPO
        / "agents"
        / "p-help-watch"
        / "gate-reports"
        / "notice-2026-09-18-vp-window.md"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "# Help Watch notice — 2026-09-18 evening window\n\n"
        "VP law on origin/main: A18–A22, Contract v1.3. "
        "Settings survive (A22) + right-click (A20) + defaults dropdown (A21).\n",
        encoding="utf-8",
    )
    print(f"tonight_help_watch wrote {out}", flush=True)
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = list(argv or sys.argv[1:])
    if not argv:
        print(
            "usage: packets vps2_act3|vpsb_act_b|tranche1|"
            "backfill5|tonight_hot126|tonight_streamer|"
            "tonight_capture|tonight_minitwo_sa|tonight_help_watch",
            file=sys.stderr,
        )
        return 2
    fn = {
        "vps2_act3": vps2_act3,
        "vpsb_act_b": vpsb_act_b,
        "tranche1": tranche1,
        "backfill5": backfill5,
        "tonight_hot126": tonight_hot126,
        "tonight_streamer": tonight_streamer,
        "tonight_capture": tonight_capture,
        "tonight_minitwo_sa": tonight_minitwo_sa,
        "tonight_help_watch": tonight_help_watch,
    }.get(argv[0])
    if not fn:
        print(f"unknown packet {argv[0]}", file=sys.stderr)
        return 2
    return fn()


if __name__ == "__main__":
    raise SystemExit(main())
