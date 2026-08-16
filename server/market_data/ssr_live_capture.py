#!/usr/bin/env python3
"""SSR live tap — read-only sample of the OPF / Market Bus plane.

Does not call Massive. Existing chain_feed + sym_feed are the writers.
Holds standing interest on SPY 0DTE so the plane stays warm.

  LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0 \\
    .venv/bin/python -m market_data.ssr_live_capture

  .venv/bin/python -m market_data.ssr_live_capture --status

Write-once under LABS_MARKET_DATA_ROOT/ssr/live_capture/day=YYYY-MM-DD/.
Rolls to the next weekday so this process is the standing archive.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

NY = ZoneInfo("America/New_York")
UTC = ZoneInfo("UTC")

PRODUCT = "SPY"
WINGS = 25
MARK_SYMBOLS = ("SPY", "VIX", "VIX1D")
PROVENANCE = "live_capture"

INTEREST_EVERY_S = 15.0
MARK_EVERY_S = 5.0
CHAIN_EVERY_S = 300.0
STATUS_EVERY_S = 60.0

PRE_END = (9, 30)
RTH_END = (16, 0)
EXT_END = (20, 0)
WAKE_HM = (4, 0)


def now_ny() -> datetime:
    return datetime.now(NY)


def today_ny() -> date:
    return now_ny().date()


def data_root() -> Path:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return Path("/Volumes/FatTail2TB/fattail-market-data").resolve()


def day_dir(day: date) -> Path:
    return data_root() / "ssr" / "live_capture" / f"day={day.isoformat()}"


def phase_at(ts: datetime) -> str:
    hm = (ts.hour, ts.minute)
    if ts.weekday() >= 5:
        return "weekend"
    if hm < PRE_END:
        return "pre"
    if hm < RTH_END:
        return "rth"
    if hm < EXT_END:
        return "extended"
    return "closed"


def next_weekday(d: date) -> date:
    n = d + timedelta(days=1)
    while n.weekday() >= 5:
        n += timedelta(days=1)
    return n


def next_wake(ts: datetime) -> datetime:
    """Next 04:00 ET weekday (today if still before wake on a weekday)."""
    d = ts.date()
    if ts.weekday() < 5:
        wake = datetime(d.year, d.month, d.day, *WAKE_HM, tzinfo=NY)
        if ts < wake:
            return wake
        if phase_at(ts) != "closed":
            return ts
    nxt = next_weekday(d)
    return datetime(nxt.year, nxt.month, nxt.day, *WAKE_HM, tzinfo=NY)


def write_once(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    dest = path
    n = 1
    while dest.exists():
        dest = path.with_name(f"{path.stem}__{n}{path.suffix}")
        n += 1
    tmp = dest.with_name(dest.name + ".partial")
    tmp.write_text(text, encoding="utf-8")
    if dest.exists():
        tmp.unlink(missing_ok=True)
        raise FileExistsError(str(dest))
    tmp.rename(dest)
    return dest


def append_jsonl(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(doc, default=str, separators=(",", ":"))
    with path.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def dump_json(doc: dict[str, Any]) -> str:
    return json.dumps(doc, default=str, indent=2, sort_keys=False) + "\n"


class LiveTap:
    def __init__(self) -> None:
        os.environ.setdefault("LABS_MARKET_BUS", "1")
        os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/0")
        from market_data.market_bus.store import BusStore

        self.store = BusStore()
        self.day = today_ny()
        self.root = day_dir(self.day)
        self.last_mark = 0.0
        self.last_chain = 0.0
        self.last_interest = 0.0
        self.last_status = 0.0
        self.snaps = 0
        self.mark_lines = 0
        self.last_chain_hash: str | None = None
        self.last_chain_as_of: str | None = None
        self.holes: list[str] = []
        self.finalized = False

    def topic(self, day: date) -> str:
        return f"mb:ladder:{PRODUCT}:{day.isoformat()}:w{WINGS}:dual"

    def ensure_day(self) -> None:
        d = today_ny()
        if d == self.day:
            return
        self._finalize_if_needed()
        self.day = d
        self.root = day_dir(self.day)
        self.snaps = 0
        self.mark_lines = 0
        self.last_chain = 0.0
        self.last_chain_hash = None
        self.last_chain_as_of = None
        self.holes = []
        self.finalized = False
        self._ensure_dirs()

    def _ensure_dirs(self) -> None:
        for sub in ("chain", "marks", "status"):
            (self.root / sub).mkdir(parents=True, exist_ok=True)
        readme = self.root / "PROVENANCE.json"
        if not readme.exists():
            write_once(
                readme,
                dump_json(
                    {
                        "provenance": PROVENANCE,
                        "day": self.day.isoformat(),
                        "product": PRODUCT,
                        "wings": WINGS,
                        "topic": self.topic(self.day),
                        "root": str(self.root),
                        "started_at": now_ny().isoformat(),
                    }
                ),
            )

    def touch_interest(self) -> None:
        topic = self.topic(self.day)
        self.store.touch_interest(topic)
        self.last_interest = time.time()

    def _phase(self) -> str:
        return phase_at(now_ny())

    def capture_marks(self) -> dict[str, Any]:
        captured = now_ny()
        out: dict[str, Any] = {
            "provenance": PROVENANCE,
            "captured_at": captured.isoformat(),
            "phase": self._phase(),
            "symbols": {},
        }
        for sym in MARK_SYMBOLS:
            doc = self.store.get_json(f"mb:sym:{sym}")
            out["symbols"][sym] = doc
            if doc is None:
                hole = f"MARK MISSING {sym}"
                if hole not in self.holes:
                    self.holes.append(hole)
            else:
                append_jsonl(
                    self.root / "marks" / f"{sym.lower()}.jsonl",
                    {
                        "provenance": PROVENANCE,
                        "captured_at": captured.isoformat(),
                        "phase": self._phase(),
                        **doc,
                    },
                )
                self.mark_lines += 1
        sess = self.store.get_json("mb:session:market_status")
        if sess is not None:
            append_jsonl(
                self.root / "marks" / "session.jsonl",
                {
                    "provenance": PROVENANCE,
                    "captured_at": captured.isoformat(),
                    "phase": self._phase(),
                    **sess,
                },
            )
        out["session"] = sess
        return out

    def capture_chain(self) -> dict[str, Any]:
        captured = now_ny()
        utc = captured.astimezone(UTC)
        topic = self.topic(self.day)
        payload = self.store.get_json(topic)
        hole = None if payload else "NO CHAIN"
        if hole and hole not in self.holes:
            self.holes.append(hole)
        doc = {
            "provenance": PROVENANCE,
            "captured_at": captured.isoformat(),
            "phase": self._phase(),
            "topic": topic,
            "generation": payload,
            "hole": hole,
        }
        if payload:
            self.last_chain_hash = str(payload.get("content_hash") or "") or None
            self.last_chain_as_of = str(
                payload.get("as_of") or payload.get("asof") or ""
            ) or None
            rows = payload.get("rows") or []
            ivs = 0
            if isinstance(rows, list):
                for r in rows:
                    if not isinstance(r, dict):
                        continue
                    if r.get("iv") is not None:
                        ivs += 1
                    for side in ("call", "put"):
                        sd = r.get(side)
                        if isinstance(sd, dict) and sd.get("iv") is not None:
                            ivs += 1
            doc["row_count"] = payload.get("row_count") or (
                len(rows) if isinstance(rows, list) else None
            )
            doc["iv_count"] = ivs
        name = f"snap-{utc.strftime('%H%M%S')}Z.json"
        dest = write_once(self.root / "chain" / name, dump_json(doc))
        self.snaps += 1
        self.last_chain = time.time()
        doc["path"] = str(dest)
        return doc

    def tick_status(self, *, kind: str = "tick") -> dict[str, Any]:
        marks = {
            s: self.store.get_json(f"mb:sym:{s}") for s in MARK_SYMBOLS
        }
        doc = {
            "kind": kind,
            "provenance": PROVENANCE,
            "at": now_ny().isoformat(),
            "phase": self._phase(),
            "day": self.day.isoformat(),
            "snaps": self.snaps,
            "mark_lines": self.mark_lines,
            "last_chain_hash": self.last_chain_hash,
            "last_chain_as_of": self.last_chain_as_of,
            "holes": list(self.holes),
            "marks": {
                s: (
                    None
                    if m is None
                    else {
                        "mid": m.get("mid"),
                        "source": m.get("source"),
                        "ts": m.get("ts"),
                    }
                )
                for s, m in marks.items()
            },
        }
        append_jsonl(self.root / "status" / "ticks.jsonl", doc)
        self.last_status = time.time()
        return doc

    def checklist_bits(self) -> dict[str, str]:
        chain_ok = self.snaps > 0 and "NO CHAIN" not in self.holes
        # Opening snap IV: scan chain files for any iv_count > 0
        iv_ok = False
        chain_dir = self.root / "chain"
        if chain_dir.is_dir():
            for p in sorted(chain_dir.glob("snap-*.json")):
                try:
                    d = json.loads(p.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                if int(d.get("iv_count") or 0) > 0:
                    iv_ok = True
                    break
                gen = d.get("generation") or {}
                rows = gen.get("rows") if isinstance(gen, dict) else None
                if isinstance(rows, list):
                    for r in rows:
                        if isinstance(r, dict) and r.get("iv") is not None:
                            iv_ok = True
                            break
                if iv_ok:
                    break
        spy_mark = self.store.get_json("mb:sym:SPY") or {}
        vix = self.store.get_json("mb:sym:VIX")
        vix1d = self.store.get_json("mb:sym:VIX1D")
        vix_src = None
        if isinstance(vix, dict):
            vix_src = vix.get("source")
        tape_path = self.root / "tape" / "SPY-trades.parquet"
        if tape_path.is_file() and tape_path.stat().st_size > 200_000:
            tape = "TAPE OK"
        else:
            tape = "NO TAPE"  # prints are not on the plane; after-close pull may fill tape/
        chain = "CHAIN OK" if chain_ok else "NO CHAIN"
        iv = "IV OK" if iv_ok else "IV NO"
        if vix is None and vix1d is None:
            vix_bit = "VIX NO"
        elif vix_src == "massive_proxy_v1" or (
            isinstance(vix, dict) and "proxy" in str(vix.get("label") or "").lower()
        ):
            vix_bit = "VIX OK (labeled proxy)"
        else:
            vix_bit = "VIX OK"
        return {
            "TAPE": tape,
            "CHAIN": chain,
            "IV": iv,
            "VIX": vix_bit,
            "spy_mark_source": str(spy_mark.get("source") or ""),
            "vix_source": str(vix_src or ""),
        }

    def _finalize_if_needed(self) -> None:
        if self.finalized:
            return
        dest = self.root / "CHECKLIST.json"
        if dest.exists():
            self.finalized = True
            return
        bits = self.checklist_bits()
        chain_dir = self.root / "chain"
        snaps_on_disk = (
            len(list(chain_dir.glob("snap-*.json"))) if chain_dir.is_dir() else self.snaps
        )
        write_once(
            dest,
            dump_json(
                {
                    "provenance": PROVENANCE,
                    "day": self.day.isoformat(),
                    "finalized_at": now_ny().isoformat(),
                    "snaps": snaps_on_disk,
                    "snaps_this_process": self.snaps,
                    "mark_lines": self.mark_lines,
                    "holes": list(self.holes),
                    "checklist": bits,
                }
            ),
        )
        manifest = self.root / "MANIFEST.json"
        if not manifest.exists():
            write_once(
                manifest,
                dump_json(
                    {
                        "provenance": PROVENANCE,
                        "day": self.day.isoformat(),
                        "product": PRODUCT,
                        "wings": WINGS,
                        "topic": self.topic(self.day),
                        "snaps": self.snaps,
                        "mark_lines": self.mark_lines,
                        "root": str(self.root),
                    }
                ),
            )
        self.finalized = True

    def sleep_if_closed(self) -> None:
        ph = self._phase()
        if ph not in ("closed", "weekend"):
            return
        self._finalize_if_needed()
        wake = next_wake(now_ny())
        sec = max(1.0, (wake - now_ny()).total_seconds())
        print(
            f"session_end phase={ph} sleep_until={wake.isoformat()} ({sec:.0f}s)",
            flush=True,
        )
        # Sleep in chunks so SIGTERM is prompt
        end = time.time() + sec
        while time.time() < end:
            time.sleep(min(30.0, end - time.time()))

    def run(self) -> int:
        self._ensure_dirs()
        print(f"live_tap root={self.root}", flush=True)
        # Immediate pre-market dump
        self.touch_interest()
        # Wait for the existing feed to publish the first generation.
        deadline = time.time() + 45.0
        while time.time() < deadline:
            self.touch_interest()
            if self.store.get_json(self.topic(self.day)) is not None:
                break
            time.sleep(2.0)
        marks = self.capture_marks()
        chain = self.capture_chain()
        st = self.tick_status(kind="start")
        print(
            json.dumps(
                {
                    "event": "premarket_dump",
                    "phase": self._phase(),
                    "snaps": self.snaps,
                    "chain_hole": chain.get("hole"),
                    "iv_count": chain.get("iv_count"),
                    "marks": {
                        s: (
                            None
                            if marks["symbols"].get(s) is None
                            else {
                                "mid": marks["symbols"][s].get("mid"),
                                "source": marks["symbols"][s].get("source"),
                            }
                        )
                        for s in MARK_SYMBOLS
                    },
                    "checklist": self.checklist_bits(),
                    "status": st,
                },
                default=str,
            ),
            flush=True,
        )
        while True:
            self.ensure_day()
            self.sleep_if_closed()
            self.ensure_day()
            self._ensure_dirs()
            now = time.time()
            if now - self.last_interest >= INTEREST_EVERY_S:
                self.touch_interest()
            if now - self.last_mark >= MARK_EVERY_S:
                self.capture_marks()
                self.last_mark = now
            if now - self.last_chain >= CHAIN_EVERY_S:
                self.capture_chain()
            if now - self.last_status >= STATUS_EVERY_S:
                self.tick_status()
            time.sleep(1.0)


def print_status() -> int:
    d = today_ny()
    root = day_dir(d)
    ticks = root / "status" / "ticks.jsonl"
    last: dict[str, Any] | None = None
    if ticks.is_file():
        for line in ticks.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                last = json.loads(line)
            except json.JSONDecodeError:
                continue
    snaps = len(list((root / "chain").glob("snap-*.json"))) if (root / "chain").is_dir() else 0
    bits = {}
    chk = root / "CHECKLIST.json"
    if chk.is_file():
        try:
            bits = json.loads(chk.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            bits = {"error": "checklist unreadable"}
    print(
        json.dumps(
            {
                "day": d.isoformat(),
                "phase": phase_at(now_ny()),
                "root": str(root),
                "snaps_on_disk": snaps,
                "last_tick": last,
                "checklist_file": bits or None,
            },
            default=str,
            indent=2,
        )
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="SSR live tap (plane reader)")
    p.add_argument("--status", action="store_true")
    p.add_argument("--once", action="store_true", help="pre-market dump only")
    args = p.parse_args(argv)
    if args.status:
        return print_status()
    tap = LiveTap()
    if args.once:
        tap._ensure_dirs()
        tap.touch_interest()
        time.sleep(1.0)
        tap.capture_marks()
        tap.capture_chain()
        print(json.dumps(tap.tick_status(kind="once"), default=str))
        return 0
    try:
        return tap.run()
    except KeyboardInterrupt:
        tap._finalize_if_needed()
        print("interrupted — checklist written if missing", flush=True)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
