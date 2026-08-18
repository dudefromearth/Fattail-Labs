#!/usr/bin/env python3
"""SSR live tap — read-only sample of the OPF / Market Bus plane.

Does not call Massive. Existing chain_feed + sym_feed are the writers.
Holds standing interest on **every enabled Admin universe symbol**
so the plane stays warm. Disk cadence is 2–5s (default 2).

  LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0 \\
    .venv/bin/python -m market_data.ssr_live_capture

  .venv/bin/python -m market_data.ssr_live_capture --status

Write-once under LABS_MARKET_DATA_ROOT/ssr/live_capture/day=YYYY-MM-DD/.
Rolls to the next weekday so this process is the standing archive.

LABS_SSR_HARDENING default off = poll-all (today). Flag=1 polls only
in-session symbols from data/ssr/session-map.json (mtime reload).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

from market_data.ssr_session_map import (  # noqa: E402
    SessionMap,
    hardening_on,
    load_session_map,
    session_map_path,
)

NY = ZoneInfo("America/New_York")
UTC = ZoneInfo("UTC")

WINGS_DEFAULT = 25
PROVENANCE = "live_capture"

INTEREST_EVERY_S = 15.0
MARK_EVERY_S = 5.0
UNIVERSE_EVERY_S = 60.0
# Coach: 2–5s gold snaps. 5-min is forbidden. Friday 2026-08-14 stays 5-min as captured.
CHAIN_EVERY_S_MIN = 2.0
CHAIN_EVERY_S_MAX = 5.0
CHAIN_EVERY_S_DEFAULT = 2.0
STATUS_EVERY_S = 60.0
FRIDAY_5MIN_DAY = date(2026, 8, 14)


def chain_every_s() -> float:
    """Disk cadence for OPF chain snaps. Must be in [2, 5]. Fail loud outside."""
    raw = (os.environ.get("LABS_SSR_CHAIN_EVERY_S") or "").strip()
    if not raw:
        return CHAIN_EVERY_S_DEFAULT
    try:
        value = float(raw)
    except ValueError as exc:
        raise RuntimeError(
            "LABS_SSR_CHAIN_EVERY_S must be a float in [2, 5] (OD-6)"
        ) from exc
    if value < CHAIN_EVERY_S_MIN or value > CHAIN_EVERY_S_MAX:
        raise RuntimeError(
            f"LABS_SSR_CHAIN_EVERY_S={value} outside [2, 5] — 5-min is forbidden"
        )
    return value


def wings() -> int:
    raw = (os.environ.get("LABS_SSR_WINGS") or "").strip()
    if not raw:
        return WINGS_DEFAULT
    v = int(raw)
    if v < 5 or v > 100:
        raise RuntimeError(f"LABS_SSR_WINGS={v} outside [5, 100]")
    return v


def listed_expiration_dates(row: dict[str, Any]) -> list[str]:
    """Listed expirations from the Admin universe calendar. Never invents a day."""
    raw = row.get("next_expirations_json")
    dates: list[str] = []
    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, str) and item:
                dates.append(item[:10])
            elif isinstance(item, dict) and item.get("expiration"):
                dates.append(str(item["expiration"])[:10])
    elif isinstance(raw, dict):
        inner = raw.get("expirations") or raw.get("dates") or []
        if isinstance(inner, list):
            dates = [str(x)[:10] for x in inner if x]
    return sorted({d for d in dates if d})


def expires_on(row: dict[str, Any], day: date) -> bool:
    """True only when `day` is a listed expiration for this symbol."""
    return day.isoformat() in listed_expiration_dates(row)


def front_expiration(row: dict[str, Any], day: date) -> str | None:
    """Expiry used for today's snap: the session day, and only if it is listed.

    Do not fall back to the calendar day when the name does not expire
    today (AAPL on a Tuesday). That invented a 0DTE Massive does not have.
    """
    key = day.isoformat()
    return key if key in listed_expiration_dates(row) else None


def scan_listed_expirations(row: dict[str, Any], day: date) -> list[str]:
    """Ask Massive which dates are listed (date scan only, not a full chain)."""
    product = str(row.get("symbol") or "").strip().upper()
    underlier = str(row.get("feed_symbol") or product).strip() or product
    if not underlier:
        return []
    try:
        from routes.chain_ladder import _scan_expirations_live
    except Exception:
        return []
    try:
        return list(_scan_expirations_live(underlier, days=45, limit=16, today=day))
    except Exception as exc:
        print(f"expiry_scan_fail {product}: {exc}", flush=True)
        return []


def persist_listed_calendar(symbol: str, dates: list[str]) -> None:
    try:
        import db
        from market_data import universe_admin as ua

        with db.transaction() as conn:
            with conn.cursor() as cur:
                ua.write_chain_calendar(cur, symbol, expirations=dates)
    except Exception as exc:
        print(f"expiry_persist_fail {symbol}: {exc}", flush=True)


def ladder_topics(row: dict[str, Any], exp: str, wing: int) -> list[str]:
    product = str(row.get("symbol") or "").strip().upper()
    feed = (row.get("feed_symbol") or product).strip()
    keys = [f"mb:ladder:{product}:{exp}:w{wing}:dual"]
    if feed and feed.upper() != product:
        keys.append(f"mb:ladder:{feed}:{exp}:w{wing}:dual")
    return keys


def load_enabled_universe() -> list[dict[str, Any]]:
    """Admin enabled set. Env LABS_SSR_SYMBOLS=A,B overrides if set."""
    raw = (os.environ.get("LABS_SSR_SYMBOLS") or "").strip()
    if raw:
        return [{"symbol": s.strip().upper(), "feed_symbol": None} for s in raw.split(",") if s.strip()]
    import db
    from market_data import universe_admin as ua

    with db.transaction() as conn:
        with conn.cursor() as cur:
            return ua.list_all(cur, enabled_only=True)


def chain_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Option-chain symbols only. Reference marks (VIX / VIX1D) stay on the mark tape."""
    out: list[dict[str, Any]] = []
    for row in rows:
        role = str(row.get("role") or "tradeable").strip().lower()
        if role == "reference":
            continue
        if str(row.get("symbol") or "").strip():
            out.append(row)
    return out


CHAIN_EVERY_S = chain_every_s()
WINGS = wings()

# Maximum published window (Massive + Cboe), America/New_York:
#   Massive stocks: pre 4:00 AM–9:30 AM, RTH 9:30 AM–4:00 PM, after 4:00–8:00 PM.
#   Equity options: RTH; select names GTH 7:30–9:25 AM + Curb 4:00–4:15 PM (from 2026-08-17).
#   SPX / XSP / VIX / RUT GTH: 8:15 PM–9:25 AM (Sun–Thu nights).
# Sleep only Friday 8:00 PM → Sunday 8:15 PM. Weeknights stay up for overnight GTH.
PRE_START = (4, 0)
PRE_END = (9, 30)
RTH_END = (16, 0)
EXT_END = (20, 0)
GTH_START = (20, 15)
WAKE_HM = PRE_START


def now_ny() -> datetime:
    return datetime.now(NY)


def today_ny() -> date:
    return now_ny().date()


def data_root() -> Path:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return Path("/Volumes/FatTail2TB/fattail-market-data")


def day_dir(day: date) -> Path:
    return data_root() / "ssr" / "live_capture" / f"day={day.isoformat()}"


def phase_at(ts: datetime) -> str:
    hm = (ts.hour, ts.minute)
    wd = ts.weekday()
    if wd == 5:
        return "weekend"
    if wd == 6:
        return "gth" if hm >= GTH_START else "weekend"
    if hm < PRE_START:
        return "gth"
    if hm < PRE_END:
        return "pre"
    if hm < RTH_END:
        return "rth"
    if hm < EXT_END:
        return "extended"
    if wd == 4:
        return "closed"
    return "gth"


def next_weekday(d: date) -> date:
    n = d + timedelta(days=1)
    while n.weekday() >= 5:
        n += timedelta(days=1)
    return n


def next_wake(ts: datetime) -> datetime:
    """Next collect start: Sunday 8:15 PM ET GTH, or now if the plane is in session."""
    if phase_at(ts) not in ("closed", "weekend"):
        return ts
    d = ts.date()
    wd = ts.weekday()
    if wd == 6:
        return datetime(d.year, d.month, d.day, *GTH_START, tzinfo=NY)
    if wd == 5:
        nxt = d + timedelta(days=1)
        return datetime(nxt.year, nxt.month, nxt.day, *GTH_START, tzinfo=NY)
    days_to_sunday = (6 - wd) % 7
    if days_to_sunday == 0:
        days_to_sunday = 7
    nxt = d + timedelta(days=days_to_sunday)
    return datetime(nxt.year, nxt.month, nxt.day, *GTH_START, tzinfo=NY)


def cache_root() -> Path:
    raw = (os.environ.get("LABS_SSR_CACHE_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return (Path.home() / "Library" / "Caches" / "fattail-ssr").resolve()


def _write_text(path: Path, text: str) -> Path:
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


def write_once(path: Path, text: str) -> Path:
    return _write_text(path, text)


def write_snap(path: Path, text: str) -> Path:
    """Local SSD first so a stalled gold volume cannot stop the tap."""
    try:
        rel = path.relative_to(data_root())
    except ValueError:
        rel = Path("ssr") / "live_capture" / path.name
    local = cache_root() / rel
    written = _write_text(local, text)
    # Gold volume has been stalling open(); copy is opt-in after the disk is healthy.
    if (os.environ.get("LABS_SSR_GOLD_COPY") or "").strip() == "1":
        def _gold() -> None:
            try:
                _write_text(path, text)
            except OSError as exc:
                print(f"gold_write_fail {path}: {exc}", flush=True)

        threading.Thread(target=_gold, daemon=True).start()
    return written


def dump_snap(doc: dict[str, Any]) -> str:
    return json.dumps(doc, default=str, separators=(",", ":")) + "\n"


def append_jsonl(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(doc, default=str, separators=(",", ":"))
    with path.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def append_jsonl_live(path: Path, doc: dict[str, Any]) -> None:
    try:
        rel = path.relative_to(data_root())
    except ValueError:
        rel = Path(path.name)
    append_jsonl(cache_root() / rel, doc)
    if (os.environ.get("LABS_SSR_GOLD_COPY") or "").strip() == "1":
        def _gold() -> None:
            try:
                append_jsonl(path, doc)
            except OSError as exc:
                print(f"gold_append_fail {path}: {exc}", flush=True)

        threading.Thread(target=_gold, daemon=True).start()


def dump_json(doc: dict[str, Any]) -> str:
    return json.dumps(doc, default=str, indent=2, sort_keys=False) + "\n"


class LiveTap:
    def __init__(self, store: Any | None = None) -> None:
        if store is None:
            os.environ.setdefault("LABS_MARKET_BUS", "1")
            os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/0")
            from market_data.market_bus.store import BusStore

            store = BusStore()
        self.store = store
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
        self.no_session: list[str] = []
        self.finalized = False
        self.universe: list[dict[str, Any]] = []
        self.last_universe = 0.0
        self._session_map: SessionMap | None = None
        self._schedule_phase: str | None = None
        self._no_session_logged: set[str] = set()
        self._calendars_ready: date | None = None
        self._no_expiry_day: str | None = None
        self._no_expiry_logged: set[str] = set()

    def refresh_universe(self) -> list[dict[str, Any]]:
        now = time.time()
        if self.universe and now - self.last_universe < UNIVERSE_EVERY_S:
            return self.universe
        try:
            rows = load_enabled_universe()
        except Exception as exc:
            print(f"universe load fail: {exc}", flush=True)
            rows = self.universe or [{"symbol": "SPY", "feed_symbol": None}]
        self.universe = [r for r in rows if str(r.get("symbol") or "").strip()]
        self.last_universe = now
        return self.universe

    def topic(self, day: date, row: dict[str, Any] | None = None) -> str:
        if row is None:
            row = {"symbol": "SPY"}
        exp = front_expiration(row, day)
        if not exp:
            raise RuntimeError(
                f"{row.get('symbol')} has no listed expiration on {day.isoformat()}"
            )
        return ladder_topics(row, exp, WINGS)[0]

    def all_topics(self, day: date) -> list[str]:
        out: list[str] = []
        for row in self.scheduled_chain_rows():
            exp = front_expiration(row, day)
            if not exp:
                continue
            out.extend(ladder_topics(row, exp, WINGS))
        return out

    def _load_session_map(self, *, force: bool = False) -> SessionMap:
        path = session_map_path()
        if self._session_map is None or self._session_map.path != path:
            self._session_map = load_session_map(path, force=True)
            return self._session_map
        self._session_map.maybe_reload(force=force)
        return self._session_map

    def _hydrate_listed_calendars(self) -> None:
        """Once per NY day: fill empty/stale calendars from the listed tape."""
        if getattr(self, "_calendars_ready", None) == self.day:
            return
        today = self.day.isoformat()
        changed = False
        for row in chain_rows(self.refresh_universe()):
            dates = listed_expiration_dates(row)
            if any(d >= today for d in dates):
                continue
            live = scan_listed_expirations(row, self.day)
            product = str(row.get("symbol") or "").upper()
            if live:
                row["next_expirations_json"] = live
                persist_listed_calendar(product, live)
                changed = True
                print(
                    f"expiry_calendar {product} {','.join(live[:8])}",
                    flush=True,
                )
            else:
                print(f"expiry_calendar_empty {product} from={today}", flush=True)
        if changed:
            self.last_universe = 0.0
            self.refresh_universe()
        self._calendars_ready = self.day

    def _note_no_expiry(self, symbol: str) -> None:
        day_s = self.day.isoformat()
        if getattr(self, "_no_expiry_day", None) != day_s:
            self._no_expiry_day = day_s
            self._no_expiry_logged: set[str] = set()
        if symbol in self._no_expiry_logged:
            return
        self._no_expiry_logged.add(symbol)
        print(f"no expiry {symbol} day={day_s}", flush=True)
        try:
            from market_data.ssr_snap_counts import record_not_today

            row = next(
                (
                    r
                    for r in self.refresh_universe()
                    if str(r.get("symbol") or "").upper() == symbol
                ),
                None,
            )
            dates = listed_expiration_dates(row or {})
            nxt = min((d for d in dates if d > day_s), default=None)
            record_not_today(
                self.day,
                symbol,
                next_expiration=nxt,
                listed=dates,
                store=getattr(self, "store", None),
                day_root=self.cache_day(),
            )
        except Exception as exc:  # noqa: BLE001
            print(f"ssr_counts_not_today_failed {symbol} {exc}", flush=True)

    def _note_no_session(self, symbol: str, phase: str) -> None:
        if self._schedule_phase != phase:
            self._schedule_phase = phase
            self._no_session_logged = set()
            self.no_session = []
        if symbol in self._no_session_logged:
            return
        self._no_session_logged.add(symbol)
        self.no_session.append(symbol)
        print(f"no session {symbol} phase={phase}", flush=True)

    def scheduled_chain_rows(self) -> list[dict[str, Any]]:
        self._hydrate_listed_calendars()
        rows = chain_rows(self.refresh_universe())
        if hardening_on():
            phase = self._phase()
            force = self._schedule_phase is not None and self._schedule_phase != phase
            smap = self._load_session_map(force=force)
            if self._schedule_phase != phase:
                self._schedule_phase = phase
                self._no_session_logged = set()
                self.no_session = []
            filtered: list[dict[str, Any]] = []
            for row in rows:
                product = str(row.get("symbol") or "").upper()
                if smap.in_session(product, phase):
                    filtered.append(row)
                else:
                    self._note_no_session(product, phase)
            rows = filtered
        scheduled: list[dict[str, Any]] = []
        for row in rows:
            product = str(row.get("symbol") or "").upper()
            if expires_on(row, self.day):
                scheduled.append(row)
            else:
                self._note_no_expiry(product)
        return scheduled

    def chain_cycle(self) -> dict[str, Any]:
        """One poll unit: interest + chain snap for the scheduled set."""
        self.touch_interest()
        return self.capture_chain()

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
        self.no_session = []
        self._no_session_logged = set()
        self._schedule_phase = None
        self._calendars_ready = None
        self._no_expiry_day = None
        self._no_expiry_logged = set()
        self.finalized = False
        self._ensure_dirs()

    def cache_day(self) -> Path:
        return cache_root() / "ssr" / "live_capture" / f"day={self.day.isoformat()}"

    def _ensure_dirs(self) -> None:
        root = self.cache_day()
        for sub in ("chain", "marks", "status"):
            (root / sub).mkdir(parents=True, exist_ok=True)
        for row in chain_rows(self.refresh_universe()):
            (root / "chain" / str(row["symbol"]).upper()).mkdir(
                parents=True, exist_ok=True
            )
        readme = root / "PROVENANCE.json"
        if not readme.exists():
            write_snap(
                self.root / "PROVENANCE.json",
                dump_json(
                    {
                        "provenance": PROVENANCE,
                        "day": self.day.isoformat(),
                        "product": "universe",
                        "symbols": [
                            str(r.get("symbol") or "").upper()
                            for r in self.refresh_universe()
                        ],
                        "wings": WINGS,
                        "root": str(self.root),
                        "started_at": now_ny().isoformat(),
                    }
                ),
            )
        cadence = root / "CADENCE.json"
        if not cadence.exists():
            write_snap(
                self.root / "CADENCE.json",
                dump_json(
                    {
                        "day": self.day.isoformat(),
                        "chain_cadence": "2-5s",
                        "chain_every_s": CHAIN_EVERY_S,
                        "wings": WINGS,
                        "symbols": [str(r.get("symbol") or "").upper() for r in self.refresh_universe()],
                        "ruling": "OD-6",
                        "notes": (
                            "OPF chain snaps with full greeks at 2–5s for every "
                            "enabled universe symbol. Max published window: Massive "
                            "4:00 AM–8:00 PM ET plus Cboe overnight GTH 8:15 PM–9:25 AM "
                            "(weeknights). Sleep only Friday 8:00 PM → Sunday 8:15 PM. "
                            "Friday 2026-08-14 remains 5-min as captured."
                        ),
                    }
                ),
            )

    def touch_interest(self) -> None:
        for topic in self.all_topics(self.day):
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
        mark_syms = [str(r.get("symbol") or "").upper() for r in self.refresh_universe()]
        for extra in ("VIX", "VIX1D"):
            if extra not in mark_syms:
                mark_syms.append(extra)
        for sym in mark_syms:
            doc = self.store.get_json(f"mb:sym:{sym}")
            out["symbols"][sym] = doc
            if doc is None:
                hole = f"MARK MISSING {sym}"
                if hole not in self.holes:
                    self.holes.append(hole)
            else:
                append_jsonl_live(
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

    def _row_iv_greeks(self, payload: dict[str, Any]) -> tuple[int, int, int]:
        rows = payload.get("rows") or []
        ivs = 0
        greeks = 0
        n = 0
        if isinstance(rows, list):
            for r in rows:
                if not isinstance(r, dict):
                    continue
                n += 1
                if r.get("iv") is not None:
                    ivs += 1
                if all(r.get(k) is not None for k in ("delta", "gamma", "theta", "vega")):
                    greeks += 1
                for side in ("call", "put"):
                    sd = r.get(side)
                    if isinstance(sd, dict) and sd.get("iv") is not None:
                        ivs += 1
                    if isinstance(sd, dict) and all(
                        sd.get(k) is not None for k in ("delta", "gamma", "theta", "vega")
                    ):
                        greeks += 1
        return n, ivs, greeks

    def capture_chain(self) -> dict[str, Any]:
        captured = now_ny()
        utc = captured.astimezone(UTC)
        name = f"snap-{utc.strftime('%H%M%S')}{utc.strftime('%f')[:3]}Z.json"
        last: dict[str, Any] = {"hole": "NO CHAIN", "symbols": []}
        for row in self.scheduled_chain_rows():
            product = str(row.get("symbol") or "").upper()
            exp = front_expiration(row, self.day)
            if not exp:
                continue
            payload = None
            topic_used = None
            for topic in ladder_topics(row, exp, WINGS):
                payload = self.store.get_json(topic)
                if payload:
                    topic_used = topic
                    break
            hole = None if payload else f"NO CHAIN {product}"
            if hole and hole not in self.holes:
                self.holes.append(hole)
            doc: dict[str, Any] = {
                "provenance": PROVENANCE,
                "captured_at": captured.isoformat(),
                "phase": self._phase(),
                "symbol": product,
                "expiration": exp,
                "topic": topic_used or ladder_topics(row, exp, WINGS)[0],
                "generation": payload,
                "hole": hole,
                "chain_cadence_s": CHAIN_EVERY_S,
                "chain_cadence": "2-5s",
            }
            if payload:
                n, ivs, greeks = self._row_iv_greeks(payload)
                self.last_chain_hash = str(payload.get("content_hash") or "") or None
                self.last_chain_as_of = str(
                    payload.get("as_of") or payload.get("asof") or ""
                ) or None
                doc["row_count"] = payload.get("row_count") or n or None
                doc["iv_count"] = ivs
                doc["greek_count"] = greeks
            dest = write_snap(
                self.root / "chain" / product / name,
                dump_snap(doc),
            )
            self.snaps += 1
            doc["path"] = str(dest)
            try:
                from market_data.ssr_snap_counts import record_snap

                record_snap(
                    self.day,
                    product,
                    dest.name,
                    {
                        "captured_at": doc.get("captured_at"),
                        "phase": doc.get("phase"),
                        "hole": doc.get("hole"),
                        "row_count": doc.get("row_count"),
                        "iv_count": doc.get("iv_count"),
                        "greek_count": doc.get("greek_count"),
                        "expiration": doc.get("expiration"),
                        "topic": doc.get("topic"),
                    },
                    store=self.store,
                    day_root=self.cache_day(),
                )
            except Exception as exc:  # noqa: BLE001 — board cache must not stop the tap
                print(f"ssr_counts_write_failed {product} {exc}", flush=True)
            last = doc
            last.setdefault("symbols", [])
        self.last_chain = time.time()
        return last

    def tick_status(self, *, kind: str = "tick") -> dict[str, Any]:
        mark_syms = [str(r.get("symbol") or "").upper() for r in self.refresh_universe()]
        for extra in ("VIX", "VIX1D"):
            if extra not in mark_syms:
                mark_syms.append(extra)
        marks = {s: self.store.get_json(f"mb:sym:{s}") for s in mark_syms}
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
        append_jsonl_live(self.root / "status" / "ticks.jsonl", doc)
        self.last_status = time.time()
        return doc

    def checklist_bits(self) -> dict[str, str]:
        chain_ok = self.snaps > 0 and not any(
            str(h).startswith("NO CHAIN") for h in self.holes
        )
        # Latest snap per symbol from the count ledger — never glob the day.
        iv_ok = False
        try:
            from market_data.ssr_snap_counts import load_counts

            counts = load_counts(
                self.day, store=self.store, day_root=self.cache_day()
            ) or {}
            latest: list[Path] = []
            chain_dir = self.cache_day() / "chain"
            for sym, row in (counts.get("symbols") or {}).items():
                last = str((row or {}).get("last") or "")
                if last:
                    latest.append(chain_dir / str(sym).upper() / last)
            for p in latest:
                try:
                    d = json.loads(p.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                if int(d.get("iv_count") or 0) > 0:
                    iv_ok = True
                    break
                gen = d.get("generation") or {}
                rows = gen.get("rows") if isinstance(gen, dict) else None
                if isinstance(rows, list) and any(
                    isinstance(r, dict) and r.get("iv") is not None for r in rows
                ):
                    iv_ok = True
                    break
        except Exception:  # noqa: BLE001 — checklist is advisory
            iv_ok = False
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
        dest = self.cache_day() / "CHECKLIST.json"
        if dest.exists():
            self.finalized = True
            return
        bits = self.checklist_bits()
        chain_dir = self.cache_day() / "chain"
        snaps_on_disk = (
            len(list(chain_dir.glob("**/snap-*.json"))) if chain_dir.is_dir() else self.snaps
        )
        write_snap(
            self.root / "CHECKLIST.json",
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
        manifest = self.cache_day() / "MANIFEST.json"
        if not manifest.exists():
            write_snap(
                self.root / "MANIFEST.json",
                dump_json(
                    {
                        "provenance": PROVENANCE,
                        "day": self.day.isoformat(),
                        "product": "universe",
                        "symbols": [
                            str(r.get("symbol") or "").upper()
                            for r in self.refresh_universe()
                        ],
                        "wings": WINGS,
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
        wake = next_wake(now_ny())
        sec = max(1.0, (wake - now_ny()).total_seconds())
        print(
            f"session_end phase={ph} sleep_until={wake.isoformat()} ({sec:.0f}s)",
            flush=True,
        )
        self._finalize_if_needed()
        # Sleep in chunks so SIGTERM is prompt
        end = time.time() + sec
        while time.time() < end:
            time.sleep(min(30.0, end - time.time()))

    def run(self) -> int:
        self._ensure_dirs()
        print(f"live_tap root={self.root}", flush=True)
        if self._phase() in ("closed", "weekend"):
            print(
                f"closed_start phase={self._phase()} — sleep until next collect window",
                flush=True,
            )
            while self._phase() in ("closed", "weekend"):
                self.ensure_day()
                self.sleep_if_closed()
        # Immediate pre-market dump
        self.touch_interest()
        # Wait for the existing feed to publish the first generation.
        deadline = time.time() + 8.0
        while time.time() < deadline:
            self.touch_interest()
            if any(self.store.get_json(t) for t in self.all_topics(self.day)):
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
                    "symbols": [str(r.get("symbol") or "").upper() for r in self.refresh_universe()],
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
                        for s in marks["symbols"]
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
    snaps = len(list((root / "chain").glob("**/snap-*.json"))) if (root / "chain").is_dir() else 0
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
