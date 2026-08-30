#!/usr/bin/env python3
"""AT-SOAR-45: 60s baseline vs 60s full-pool load. Live-book cadence, not process-up.

Run on StudioOne. Load book: 2026-08-25 SPX. A new GAP or lost live snap fails.
"""

from __future__ import annotations

import json
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")
LOAD_DAY = "2026-08-25"
LOAD_SYM = "SPX"
BASE = "http://127.0.0.1:5055"


def _token() -> str:
    for line in Path("/Users/ernie/Fattail-Labs/.env").read_text().splitlines():
        if line.startswith("LABS_SSR_ARCHIVE_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("LABS_SSR_ARCHIVE_TOKEN missing")


def _get(path: str, token: str, timeout: float = 30) -> tuple[int, dict]:
    req = urllib.request.Request(
        BASE + path, headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        try:
            doc = json.loads(exc.read().decode())
        except Exception:
            doc = {"error": str(exc)}
        return exc.code, doc


def _live_window(symbol: str, start: datetime, end: datetime) -> dict:
    from datetime import date as date_cls

    from market_data.ssr_archive_read import (
        _ladder_recs,
        observed_cadence_and_gaps,
        reconstruct_book,
    )
    from market_data.ssr_live_capture import today_ny

    day = today_ny()
    folder = Path("/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture") / (
        f"day={day.isoformat()}"
    )
    recs = reconstruct_book(folder, symbol, day)
    ladder = _ladder_recs(recs)
    in_win = [
        r
        for r in ladder
        if r.t is not None and start <= r.t.astimezone(NY) < end
    ]
    cadence, gaps = observed_cadence_and_gaps(in_win)
    deltas: list[float] = []
    for a, b in zip(in_win, in_win[1:]):
        if a.t is None or b.t is None:
            continue
        d = (b.t - a.t).total_seconds()
        if d >= 0:
            deltas.append(d)
    ordered = sorted(deltas)

    def pct(p: float) -> float | None:
        if not ordered:
            return None
        i = min(len(ordered) - 1, max(0, int(round((p / 100) * (len(ordered) - 1)))))
        return float(ordered[i])

    return {
        "day": day.isoformat(),
        "symbol": symbol,
        "count": len(in_win),
        "median": cadence,
        "p95": pct(95),
        "gaps": gaps,
        "gap_count": len(gaps),
        "first": in_win[0].name if in_win else None,
        "last": in_win[-1].name if in_win else None,
    }


def _wait_clean(symbol: str, token: str) -> None:
    """Not the first minute: require 60s of live snaps with no GAP."""
    deadline = time.time() + 15 * 60
    while time.time() < deadline:
        end = datetime.now(NY)
        start = end - timedelta(seconds=60)
        win = _live_window(symbol, start, end)
        if win["count"] >= 8 and win["gap_count"] == 0:
            print(f"clean_60s count={win['count']} median={win['median']}", flush=True)
            return
        print(
            f"waiting_clean count={win['count']} gaps={win['gap_count']}",
            flush=True,
        )
        time.sleep(5)
    raise SystemExit("no clean 60s of live cadence within 15 minutes")


def _load(token: str, seconds: int, workers: int) -> dict:
    stop = time.time() + seconds
    hits = {"ok": 0, "err": 0}
    lock = threading.Lock()

    def worker() -> None:
        while time.time() < stop:
            code, doc = _get(
                f"/api/index?day={LOAD_DAY}&symbol={LOAD_SYM}", token, timeout=25
            )
            with lock:
                if code == 200 and not doc.get("hole"):
                    hits["ok"] += 1
                else:
                    hits["err"] += 1
            digest = str(doc.get("hash") or "")
            q = f"/api/fetch?day={LOAD_DAY}&symbol={LOAD_SYM}&level=0"
            if digest:
                q += f"&day_hash={digest}"
            code, _doc = _get(q, token, timeout=25)
            with lock:
                if code == 200:
                    hits["ok"] += 1
                else:
                    hits["err"] += 1

    threads = [threading.Thread(target=worker, daemon=True) for _ in range(workers)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return hits


def main() -> int:
    sys.path.insert(0, "/Users/ernie/Fattail-Labs/server")
    token = _token()
    print("at45 start", datetime.now(NY).isoformat(), flush=True)
    _wait_clean("SPX", token)
    base_end = datetime.now(NY)
    base_start = base_end - timedelta(seconds=60)
    baseline = _live_window("SPX", base_start, base_end)
    print("baseline", json.dumps(baseline), flush=True)
    load_start = datetime.now(NY)
    hits = _load(token, seconds=60, workers=4)
    load_end = datetime.now(NY)
    during = _live_window("SPX", load_start, load_end)
    print("load_hits", json.dumps(hits), flush=True)
    print("during", json.dumps(during), flush=True)
    fail = False
    reasons: list[str] = []
    if during["count"] < max(4, (baseline["count"] or 0) // 3):
        fail = True
        reasons.append("lost_snaps")
    if during["gap_count"] > baseline["gap_count"]:
        fail = True
        reasons.append("new_gap")
    out = {
        "at": "AT-SOAR-45",
        "when": datetime.now(NY).isoformat(),
        "load_book": f"{LOAD_DAY} {LOAD_SYM}",
        "baseline": baseline,
        "during_load": during,
        "hits": hits,
        "fail": fail,
        "reasons": reasons,
    }
    dest = Path("/Users/ernie/Fattail-Labs/agents/p-studioone-archive-read/evidence")
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / f"at45-{datetime.now(NY).strftime('%Y%m%d-%H%M%S')}.json"
    path.write_text(json.dumps(out, indent=2, default=str) + "\n")
    print("wrote", path, flush=True)
    print("RESULT", "FAIL" if fail else "PASS", ",".join(reasons) or "ok", flush=True)
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
