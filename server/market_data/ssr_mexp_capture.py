"""SSR-MEXP capture (DL-792 / DL-795): listed 1–MAX_DTE books as ADDITIONAL books.

The front (session-day) book is written by `ssr_live_capture.LiveTap.capture_chain`
exactly as before. This module only ever ADDS files under
`chain/<SYM>/exp=YYYY-MM-DD/snap-*.json` and an additive `books` array / PROVENANCE
`layout_era`. Master switch `LABS_SSR_MEXP=off|on`, default OFF: with the switch off
nothing here reads, touches, writes or logs.

Spec: Specs/FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md (§4 band,
§5 tiers, §6 lead/follow, §7 layout). Plan: docs/ops/MEXP-CAPTURE-PLAN.md.
"""

from __future__ import annotations

import json
import math
import os
import sys
import time
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable, Mapping

MEXP_KEY = "LABS_SSR_MEXP"
NEAR_MAX_TRADING_DTE = 2  # spec §5: T1 = 1-2 DTE, T2 = 3-5
DEFAULT_SYMBOLS = (
    "SPX,XSP,SPY,QQQ,IWM,GLD,TLT,SLV,USO,XLF,UNG,"
    "AAPL,AMZN,NVDA,TSLA,GOOGL,META,MSFT"
)
WINGS_CAP = 50  # routes.chain_ladder._MAX_DUAL_WINGS: the feed clamps silently above this
LAYOUT_ERA = 2
MISS_LOG_EVERY_S = 300.0


class MexpConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class MexpConfig:
    on: bool
    symbols: tuple[str, ...] = ()
    max_books: int = 1
    every_next_s: float = 15.0
    every_far_s: float = 60.0
    lead_wings: int = 5
    wings_max: int = WINGS_CAP
    budget_s: float = 0.75


def _num(env: Mapping[str, str], key: str, default: str, cast: Callable[[str], Any],
         lo: float, hi: float) -> Any:
    raw = (env.get(key) or "").strip() or default
    try:
        value = cast(raw)
    except ValueError as exc:
        raise MexpConfigError(f"{key}={raw!r} is not a valid {cast.__name__}") from exc
    if not (lo <= value <= hi):
        raise MexpConfigError(f"{key}={value} outside [{lo}, {hi}]")
    return value


def load_config(env: Mapping[str, str] | None = None) -> MexpConfig:
    """Parse the MEXP knobs. Switch off -> only the switch is validated (inert).

    Fail loud: an unknown switch value, or any malformed/out-of-range knob while the
    switch is on, raises naming the key. No silent fallback for a bad value.
    """
    e = os.environ if env is None else env
    sw = (e.get(MEXP_KEY) or "").strip().lower() or "off"
    if sw not in ("on", "off"):
        raise MexpConfigError(f"{MEXP_KEY}={sw!r} must be 'on' or 'off'")
    if sw == "off":
        return MexpConfig(on=False)
    syms = tuple(
        s.strip().upper()
        for s in ((e.get("LABS_SSR_MEXP_SYMBOLS") or "").strip() or DEFAULT_SYMBOLS).split(",")
        if s.strip()
    )
    if not syms:
        raise MexpConfigError("LABS_SSR_MEXP_SYMBOLS is empty while LABS_SSR_MEXP=on")
    return MexpConfig(
        on=True,
        symbols=syms,
        max_books=_num(e, "LABS_SSR_MEXP_MAX_DTE", "5", int, 1, 5),
        every_next_s=_num(e, "LABS_SSR_CHAIN_EVERY_S_NEXT", "15", float, 2.0, 120.0),
        every_far_s=_num(e, "LABS_SSR_CHAIN_EVERY_S_FAR", "60", float, 2.0, 300.0),
        lead_wings=_num(e, "LABS_SSR_MEXP_LEAD_WINGS", "5", int, 0, 25),
        wings_max=_num(e, "LABS_SSR_MEXP_WINGS_MAX", str(WINGS_CAP), int, 5, WINGS_CAP),
        budget_s=_num(e, "LABS_SSR_MEXP_BUDGET_S", "0.75", float, 0.05, 5.0),
    )


# --- pure helpers (offline-testable) -------------------------------------------------


def select_next_expirations(listed: list[str], day: date, n: int) -> list[str]:
    """First `n` LISTED dates strictly after the session day. Never derived."""
    iso = day.isoformat()
    return sorted({d[:10] for d in listed if d and d[:10] > iso})[:n]


def select_listed_dte_window(listed: list[str], day: date, max_dte: int) -> list[str]:
    """Listed expirations with 1 ≤ trading DTE ≤ max_dte. Never derived.

    The session-day (0DTE) book is the front tap. This is 1–MAX_DTE, i.e. the
    rest of Coach's 0–5 DTE window.
    """
    out: list[str] = []
    iso = day.isoformat()
    for d in sorted({x[:10] for x in listed if x}):
        if d <= iso:
            continue
        try:
            t = trading_dte(day, d)
        except ValueError:
            continue
        if 1 <= t <= max_dte:
            out.append(d)
    return out


def trading_dte(day: date, exp: str) -> int:
    """Weekdays in (day, exp]. Holidays are not knowable here and count as days
    (a slightly wider band: the safe direction)."""
    end = date.fromisoformat(exp)
    n, d = 0, day
    while d < end:
        d += timedelta(days=1)
        if d.weekday() < 5:
            n += 1
    return n


def band_scale(t_dte: int) -> float:
    """sqrt(T) with T = 1 + trading_dte (the front book is T = 1). Spec §4."""
    return math.sqrt(1 + max(0, t_dte))


def book_wings(base_wings: int, t_dte: int, lead_wings: int, wings_max: int) -> int:
    return min(wings_max, int(math.ceil(base_wings * band_scale(t_dte))) + lead_wings)


def tier_for(t_dte: int) -> str:
    return "T1" if t_dte <= NEAR_MAX_TRADING_DTE else "T2"


def book_dir(day_root: Path, symbol: str, exp: str) -> Path:
    return day_root / "chain" / symbol.upper() / f"exp={exp}"


def _module(tap: Any) -> Any:
    """The module the tap class lives in (handles `python -m` __main__ vs import)."""
    return sys.modules[type(tap).__module__]


class MexpCapture:
    """Owns all extra-book state for one LiveTap. Constructed only via load_config."""

    def __init__(self, cfg: MexpConfig) -> None:
        self.cfg = cfg
        self.snaps = 0
        self._day: str | None = None
        self._expiries: dict[str, list[str]] = {}  # symbol -> next expirations (day-scoped)
        self._expiry_retry: dict[str, float] = {}
        self._last: dict[tuple[str, str], float] = {}
        self._miss_logged: dict[tuple[str, str], float] = {}
        self._prov_done = False
        self._budget_logged = 0.0

    # -- day scoping ---------------------------------------------------------------
    def _roll(self, tap: Any) -> None:
        iso = tap.day.isoformat()
        if self._day != iso:
            self._day = iso
            self._expiries = {}
            self._expiry_retry = {}
            self._last = {}
            self._miss_logged = {}
            self._prov_done = False

    def _eligible(self, tap: Any) -> list[dict[str, Any]]:
        if not self.cfg.on or tap.day.weekday() >= 5:
            return []
        self._roll(tap)
        return [
            r
            for r in tap.scheduled_chain_rows()
            if str(r.get("symbol") or "").upper() in self.cfg.symbols
        ]

    # -- expiry resolution ---------------------------------------------------------
    def next_books(self, tap: Any, row: dict[str, Any]) -> list[str]:
        cap = _module(tap)
        sym = str(row.get("symbol") or "").upper()
        if sym in self._expiries:
            return self._expiries[sym]
        now = time.time()
        if now < self._expiry_retry.get(sym, 0.0):
            return []
        listed = list(cap.listed_expiration_dates(row))
        try:
            listed += list(cap.scan_listed_expirations(row, tap.day))
        except Exception as exc:  # noqa: BLE001 — the scan is best-effort
            print(f"mexp_scan_fail {sym}: {exc}", flush=True)
        exps = select_listed_dte_window(listed, tap.day, self.cfg.max_books)
        if exps:
            self._expiries[sym] = exps
            print(f"mexp_books {sym} day={tap.day.isoformat()} next={','.join(exps)}", flush=True)
        else:
            self._expiry_retry[sym] = now + 600.0
            print(f"mexp_no_next_listed {sym} day={tap.day.isoformat()}", flush=True)
        return exps

    # -- interest ------------------------------------------------------------------
    def _plan(self, tap: Any, row: dict[str, Any], exp: str) -> dict[str, Any]:
        cap = _module(tap)
        t = trading_dte(tap.day, exp)
        base = cap.wings()
        w = book_wings(base, t, self.cfg.lead_wings, self.cfg.wings_max)
        tier = tier_for(t)
        return {
            "exp": exp,
            "trading_dte": t,
            "dte": (date.fromisoformat(exp) - tap.day).days,
            "wings": w,
            "base_wings": base,
            "scale": round(band_scale(t), 4),
            "tier": tier,
            "every_s": self.cfg.every_next_s if tier == "T1" else self.cfg.every_far_s,
            "topics": cap.ladder_topics(row, exp, w),
        }

    def touch_interest(self, tap: Any) -> None:
        for row in self._eligible(tap):
            for exp in self.next_books(tap, row):
                for topic in self._plan(tap, row, exp)["topics"]:
                    tap.store.touch_interest(topic)

    # -- capture -------------------------------------------------------------------
    def capture(self, tap: Any) -> int:
        """Write every due extra book. Returns snaps written. Budgeted; per-book isolated."""
        rows = self._eligible(tap)
        if not rows:
            return 0
        deadline = time.monotonic() + self.cfg.budget_s
        written = 0
        for row in rows:
            for exp in self.next_books(tap, row):
                sym = str(row.get("symbol") or "").upper()
                plan = self._plan(tap, row, exp)
                if time.time() - self._last.get((sym, exp), 0.0) < plan["every_s"]:
                    continue
                if time.monotonic() > deadline:
                    if time.time() - self._budget_logged > MISS_LOG_EVERY_S:
                        self._budget_logged = time.time()
                        print(f"mexp_budget_exceeded {self.cfg.budget_s}s; books skipped", flush=True)
                    return written
                self._last[(sym, exp)] = time.time()
                try:
                    written += self._capture_one(tap, row, sym, plan)
                except Exception as exc:  # noqa: BLE001 — never reaches the front book
                    print(f"mexp_fail {sym} exp={exp}: {exc}", flush=True)
        return written

    def _generation(self, tap: Any, plan: dict[str, Any]) -> tuple[dict[str, Any] | None, str]:
        cap = _module(tap)
        for topic in plan["topics"]:
            hit = tap.store.get_json(topic)
            if cap.LiveTap.generation_has_rows(hit):
                return hit, topic
        for topic in plan["topics"]:  # ask the feed for it; a miss is not a hole
            tap.store.touch_interest(topic)
        return None, plan["topics"][0]

    def _capture_one(self, tap: Any, row: dict[str, Any], sym: str, plan: dict[str, Any]) -> int:
        cap = _module(tap)
        exp = plan["exp"]
        payload, topic = self._generation(tap, plan)
        if payload is None:
            key = (sym, exp)
            if time.time() - self._miss_logged.get(key, 0.0) > MISS_LOG_EVERY_S:
                self._miss_logged[key] = time.time()
                print(f"mexp_chain_miss {sym} exp={exp} topic={topic}", flush=True)
            return 0
        captured = cap.now_ny()
        utc = captured.astimezone(cap.UTC)
        name = f"snap-{utc.strftime('%H%M%S')}{utc.strftime('%f')[:3]}Z.json"
        n, ivs, greeks = tap._row_iv_greeks(payload)
        doc: dict[str, Any] = {
            "provenance": cap.PROVENANCE,
            "captured_at": captured.isoformat(),
            "phase": tap._phase(),
            "symbol": sym,
            "expiration": exp,
            "topic": topic,
            "generation": payload,
            "hole": None,
            "chain_cadence_s": plan["every_s"],
            "chain_cadence": f"{plan['every_s']:g}s",
            "row_count": payload.get("row_count") or n or None,
            "iv_count": ivs,
            "greek_count": greeks,
        }
        dest = cap.write_snap(book_dir(tap.cache_day(), sym, exp) / name, cap.dump_snap(doc))
        self.snaps += 1
        self._book_counts(tap, sym, plan, dest.name, doc)
        self._mark_provenance(tap)
        return 1

    # -- bookkeeping (each isolated; a failure never affects a written snap) -----------
    def _book_counts(self, tap: Any, sym: str, plan: dict[str, Any], filename: str,
                     doc: dict[str, Any]) -> None:
        try:
            from market_data.ssr_snap_counts import record_book_snap

            record_book_snap(
                tap.day,
                sym,
                filename,
                {
                    "expiration": plan["exp"],
                    "dte": plan["dte"],
                    "trading_dte": plan["trading_dte"],
                    "tier": plan["tier"],
                    "band": {
                        "wings": plan["wings"],
                        "base_wings": plan["base_wings"],
                        "scale": plan["scale"],
                        "lead_wings": self.cfg.lead_wings,
                    },
                    "cadence_s": plan["every_s"],
                    "captured_at": doc["captured_at"],
                    "row_count": doc["row_count"],
                    "iv_count": doc["iv_count"],
                    "greek_count": doc["greek_count"],
                    "topic": doc["topic"],
                    "path": "exp_dir",
                },
                store=getattr(tap, "store", None),
                day_root=tap.cache_day(),
            )
        except Exception as exc:  # noqa: BLE001
            print(f"mexp_counts_failed {sym} {exc}", flush=True)

    def _mark_provenance(self, tap: Any) -> None:
        """Add layout_era once the first extra snap of the day is on disk."""
        if self._prov_done:
            return
        try:
            path = tap.cache_day() / "PROVENANCE.json"
            doc = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
            if not isinstance(doc, dict):
                doc = {}
            if doc.get("layout_era") != LAYOUT_ERA:
                doc["layout_era"] = LAYOUT_ERA
                doc["capture_max_dte"] = self.cfg.max_books
                doc["front_layout"] = "legacy"
                doc["mexp_symbols"] = list(self.cfg.symbols)
                tmp = path.with_name(path.name + ".partial")
                tmp.write_text(json.dumps(doc, default=str, indent=2, sort_keys=False) + "\n",
                               encoding="utf-8")
                tmp.replace(path)
            self._prov_done = True
        except Exception as exc:  # noqa: BLE001
            print(f"mexp_provenance_failed {exc}", flush=True)
