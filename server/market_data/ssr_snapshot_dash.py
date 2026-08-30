#!/usr/bin/env python3
"""Chain Snapshot dashboard — StudioOne localhost only.

Read-only view of the gold archive on disk. Does not call Massive.
Does not load Labs boot Config.

  LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data \\
    .venv/bin/python -m market_data.ssr_snapshot_dash

  open http://127.0.0.1:5055
"""

from __future__ import annotations

import gzip
import json
import os
import secrets
import subprocess
import threading
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from zoneinfo import ZoneInfo

from market_data.ssr_live_capture import (
    CHAIN_EVERY_S,
    day_dir,
    data_root,
    next_wake,
    now_ny,
    phase_at,
    snap_write_root,
    today_ny,
)

NY = ZoneInfo("America/New_York")
# 0.0.0.0 so http://studioone.local:5055 works from the LAN.
# 127.0.0.1 is localhost-only. Not MiniTwo. Not the public internet.
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 5055
_ALLOWED_HOSTS = frozenset({"0.0.0.0", "127.0.0.1", "localhost", "::"})
# Spec §6.2 — Labs archive API. Collector HTML and /api/status stay open.
ARCHIVE_API_PATHS = frozenset(
    {
        "/api/coverage",
        "/api/index",
        "/api/fetch",
        "/api/marks",
        "/api/cadence",
        "/api/health",
        "/api/stats",
    }
)
ARCHIVE_AUTH = {"error": "ARCHIVE AUTH", "api_version": 1}
ARCHIVE_NOT_CONFIGURED = {"error": "ARCHIVE NOT CONFIGURED", "api_version": 1}
ARCHIVE_BUSY = {"error": "ARCHIVE BUSY", "api_version": 1}


class _ArchiveGate:
    """Pool 4, queue 8, 30 s wait. Health does not take a slot."""

    def __init__(self) -> None:
        self._pool = threading.Semaphore(4)
        self._lock = threading.Lock()
        self._queued = 0

    def acquire(self) -> bool:
        with self._lock:
            if self._queued >= 8:
                return False
            self._queued += 1
        try:
            return self._pool.acquire(timeout=30)
        finally:
            with self._lock:
                self._queued -= 1

    def release(self) -> None:
        self._pool.release()


_ARCHIVE_GATE = _ArchiveGate()


def dash_host() -> str:
    raw = (os.environ.get("LABS_SSR_DASH_HOST") or DEFAULT_HOST).strip()
    if raw not in _ALLOWED_HOSTS:
        raise RuntimeError(
            f"LABS_SSR_DASH_HOST={raw!r} must be 0.0.0.0 (LAN) or 127.0.0.1 (this Mac only)"
        )
    return "127.0.0.1" if raw == "localhost" else raw


def archive_token() -> str | None:
    """Bearer for archive routes. Absent → 501, not 200. Present and short = fail loud."""
    raw = (os.environ.get("LABS_SSR_ARCHIVE_TOKEN") or "").strip()
    if not raw:
        return None
    if len(raw) < 32:
        raise RuntimeError(
            "LABS_SSR_ARCHIVE_TOKEN is present but shorter than 32 characters"
        )
    return raw


def bearer_authorized(header: str | None, expected: str) -> bool:
    if not header:
        return False
    parts = header.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False
    got = parts[1].strip()
    if len(got) != len(expected):
        return False
    return secrets.compare_digest(got, expected)


def dash_port() -> int:
    raw = (os.environ.get("LABS_SSR_DASH_PORT") or "").strip()
    if not raw:
        return DEFAULT_PORT
    try:
        port = int(raw)
    except ValueError as exc:
        raise RuntimeError("LABS_SSR_DASH_PORT must be an integer") from exc
    if port < 1024 or port > 65535:
        raise RuntimeError(f"LABS_SSR_DASH_PORT={port} outside 1024–65535")
    return port


def capture_root() -> Path:
    return data_root() / "ssr" / "live_capture"


def live_cache_root() -> Path:
    from market_data.ssr_live_capture import cache_root

    return cache_root() / "ssr" / "live_capture"


def scan_roots() -> list[Path]:
    """Archive root first (FatTail2TB). SSD cache is leftover days until copied."""
    roots = [capture_root()]
    leftover = live_cache_root()
    if leftover.is_dir() and leftover.resolve() != capture_root().resolve():
        roots.append(leftover)
    return roots


def list_days(root: Path | None = None) -> list[str]:
    bases = [root] if root is not None else scan_roots()
    days: set[str] = set()
    for base in bases:
        if not base or not base.is_dir():
            continue
        for child in base.iterdir():
            if child.is_dir() and child.name.startswith("day="):
                days.add(child.name.removeprefix("day="))
    return sorted(days, reverse=True)


def _snap_paths_by_symbol(chain_dir: Path) -> dict[str, list[Path]]:
    """Group snap files. Nested chain/{SYM}/… or Friday-flat chain/snap-*.json."""
    out: dict[str, list[Path]] = {}
    if not chain_dir.is_dir():
        return out
    flat: list[Path] = []
    for child in chain_dir.iterdir():
        if child.is_dir():
            snaps = sorted(p for p in child.glob("snap-*.json") if p.is_file())
            if snaps:
                out[child.name.upper()] = snaps
        elif child.name.startswith("snap-") and child.suffix == ".json":
            flat.append(child)
    if flat:
        out.setdefault("SPY", [])
        out["SPY"] = sorted(out["SPY"] + flat, key=lambda p: p.name)
    return out


def _header(doc: dict[str, Any], fallback_symbol: str) -> dict[str, Any]:
    symbol = str(doc.get("symbol") or "").strip().upper()
    if not symbol:
        topic = str(doc.get("topic") or "")
        parts = topic.split(":")
        # mb:ladder:SPY:2026-08-14:w25:dual  or  mb:ladder:I:SPX:...
        if len(parts) >= 3 and parts[0] == "mb" and parts[1] == "ladder":
            symbol = parts[2].upper()
            if symbol == "I" and len(parts) >= 4:
                symbol = parts[3].upper()
        if not symbol:
            symbol = fallback_symbol
    hole = doc.get("hole")
    return {
        "symbol": symbol,
        "captured_at": doc.get("captured_at"),
        "phase": doc.get("phase"),
        "expiration": doc.get("expiration"),
        "topic": doc.get("topic"),
        "hole": hole,
        "row_count": doc.get("row_count"),
        "iv_count": doc.get("iv_count"),
        "greek_count": doc.get("greek_count"),
        "chain_cadence": doc.get("chain_cadence"),
        "chain_cadence_s": doc.get("chain_cadence_s"),
    }


def _read_header(path: Path, fallback_symbol: str) -> dict[str, Any] | None:
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(doc, dict):
        return None
    head = _header(doc, fallback_symbol)
    head["file"] = path.name
    head["bytes"] = path.stat().st_size
    return head


def summarize_day(day: date, *, root: Path | None = None) -> dict[str, Any]:
    if root is None:
        from market_data.ssr_snap_counts import (
            dash_view,
            day_folder,
            ensure_counts,
        )
        from market_data.market_bus.store import get_store

        folder = day_folder(day)
        try:
            store = get_store()
        except Exception:
            store = None
        doc = ensure_counts(day, store=store, day_root=folder)
        view = dash_view(doc, root=folder)
        view["exists"] = folder.is_dir()
        return view
    folder = root / f"day={day.isoformat()}"
    chain_dir = folder / "chain"
    by_sym = _snap_paths_by_symbol(chain_dir)
    symbols: list[dict[str, Any]] = []
    total = 0
    holes = 0
    ivs = 0
    greeks = 0
    last_at: str | None = None
    for sym, paths in sorted(by_sym.items()):
        total += len(paths)
        latest = paths[-1]
        head = _read_header(latest, sym) or {
            "symbol": sym,
            "file": latest.name,
            "hole": "UNREADABLE",
        }
        if head.get("hole"):
            holes += 1
        if int(head.get("iv_count") or 0) > 0:
            ivs += 1
        if int(head.get("greek_count") or 0) > 0:
            greeks += 1
        cap = str(head.get("captured_at") or "")
        if cap and (last_at is None or cap > last_at):
            last_at = cap
        # cadence sample: last 12 filenames (no JSON parse)
        recent = [p.name for p in paths[-12:]]
        symbols.append(
            {
                **head,
                "snaps": len(paths),
                "first": paths[0].name,
                "last": latest.name,
                "recent": recent,
            }
        )
    cadence = None
    cad_path = folder / "CADENCE.json"
    if cad_path.is_file():
        try:
            cadence = json.loads(cad_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            cadence = {"error": "unreadable"}
    checklist = None
    chk = folder / "CHECKLIST.json"
    if chk.is_file():
        try:
            checklist = json.loads(chk.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            checklist = {"error": "unreadable"}
    return {
        "day": day.isoformat(),
        "root": str(folder),
        "exists": folder.is_dir(),
        "snaps": total,
        "symbols_with_snaps": len(symbols),
        "latest_holes": holes,
        "latest_with_iv": ivs,
        "latest_with_greeks": greeks,
        "last_captured_at": last_at,
        "cadence": cadence,
        "checklist": checklist,
        "symbols": symbols,
    }


def process_bits() -> dict[str, Any]:
    wanted = {
        "tap": "market_data.ssr_live_capture",
        "chain_feed": "market_data.chain_feed",
        "sym_feed": "market_data.sym_feed",
        "dash": "market_data.ssr_snapshot_dash",
    }
    found: dict[str, bool] = {k: False for k in wanted}
    try:
        raw = subprocess.check_output(
            ["ps", "-ax", "-o", "command="], text=True, timeout=2
        )
    except (OSError, subprocess.SubprocessError):
        return {k: None for k in wanted}
    for line in raw.splitlines():
        for key, needle in wanted.items():
            if needle in line:
                found[key] = True
    return found


def _available_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import available, parse_day, parse_days, parse_symbols

    symbols = parse_symbols((qs.get("symbols") or qs.get("symbol") or [""])[0])
    days = parse_days((qs.get("days") or [""])[0])
    start_raw = (qs.get("from") or [""])[0]
    end_raw = (qs.get("to") or [""])[0]
    start = parse_day(start_raw) if start_raw else None
    end = parse_day(end_raw) if end_raw else None
    return available(days=days or None, start=start, end=end, symbols=symbols)


def _retrieve_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import (
        DEFAULT_STEP_S,
        parse_day,
        parse_days,
        parse_symbols,
        retrieve,
    )

    symbols = parse_symbols((qs.get("symbols") or qs.get("symbol") or [""])[0])
    days = parse_days((qs.get("days") or qs.get("day") or [""])[0])
    if not days:
        raw = (qs.get("day") or [""])[0]
        if raw:
            days = [parse_day(raw)]
    step_raw = (qs.get("step_s") or [""])[0]
    step_s = int(step_raw) if step_raw else DEFAULT_STEP_S
    return retrieve(days, symbols, step_s=step_s)


def _coverage_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import coverage, parse_day, parse_days, parse_symbols

    symbols = parse_symbols((qs.get("symbols") or qs.get("symbol") or [""])[0])
    days = parse_days((qs.get("days") or [""])[0])
    start_raw = (qs.get("from") or [""])[0]
    end_raw = (qs.get("to") or [""])[0]
    start = parse_day(start_raw) if start_raw else None
    end = parse_day(end_raw) if end_raw else None
    return coverage(days=days or None, start=start, end=end, symbols=symbols)


def _index_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import day_index, parse_day, parse_symbols

    day_raw = (qs.get("day") or [""])[0]
    if not day_raw:
        raise ValueError("day required")
    symbols = parse_symbols((qs.get("symbol") or qs.get("symbols") or [""])[0])
    if len(symbols) != 1:
        raise ValueError("exactly one symbol required")
    expiration = (qs.get("expiration") or [""])[0].strip() or None
    return day_index(parse_day(day_raw), symbols[0], expiration=expiration)


def _marks_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import (
        _parse_iso,
        day_marks,
        parse_day,
        parse_symbols,
    )

    day_raw = (qs.get("day") or [""])[0]
    if not day_raw:
        raise ValueError("day required")
    t_raw = (qs.get("t") or qs.get("as_of") or [""])[0]
    inst = _parse_iso(t_raw or None)
    if inst is None:
        raise ValueError("t required")
    symbols = parse_symbols((qs.get("symbols") or qs.get("symbol") or [""])[0])
    return day_marks(parse_day(day_raw), symbols, inst)


def _fetch_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import (
        _parse_iso,
        day_fetch,
        parse_day,
        parse_symbols,
    )

    day_raw = (qs.get("day") or [""])[0]
    if not day_raw:
        raise ValueError("day required")
    symbols = parse_symbols((qs.get("symbol") or qs.get("symbols") or [""])[0])
    if len(symbols) != 1:
        raise ValueError("exactly one symbol required")
    level_raw = (qs.get("level") or ["0"])[0]
    try:
        level = int(level_raw)
    except ValueError as exc:
        raise ValueError("level must be 0..6") from exc
    start = _parse_iso((qs.get("from") or [""])[0] or None)
    end = _parse_iso((qs.get("to") or [""])[0] or None)
    day_hash = (qs.get("day_hash") or [""])[0] or None
    expiration = (qs.get("expiration") or [""])[0].strip() or None
    from_raw = (qs.get("from_index") or [""])[0]
    from_index = int(from_raw) if from_raw else None
    return day_fetch(
        parse_day(day_raw),
        symbols[0],
        level,
        expiration=expiration,
        start=start,
        end=end,
        day_hash=day_hash,
        from_index=from_index,
    )


def _cadence_from_qs(qs: dict[str, list[str]]) -> dict[str, Any]:
    from market_data.ssr_archive_read import cadence_stats, parse_day, parse_days, parse_symbols

    symbols = parse_symbols((qs.get("symbols") or qs.get("symbol") or [""])[0])
    days = parse_days((qs.get("days") or qs.get("day") or [""])[0])
    if not days:
        raise ValueError("day or days required")
    if not symbols:
        raise ValueError("symbol or symbols required")
    books = [cadence_stats(d, s) for d in days for s in symbols]
    return {"api_version": 1, "books": books}


def _stats_from_disk() -> dict[str, Any]:
    from market_data.ssr_archive_read import API_VERSION, archive_root

    path = archive_root() / "STATS.json"
    if not path.is_file():
        return {"api_version": API_VERSION, "hole": "STATS STALE"}
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"api_version": API_VERSION, "hole": "STATS STALE"}
    if not isinstance(doc, dict):
        return {"api_version": API_VERSION, "hole": "STATS STALE"}
    doc.setdefault("api_version", API_VERSION)
    return doc


def _health_doc() -> dict[str, Any]:
    from market_data.ssr_archive_read import health

    bits = process_bits()
    return health(tap_running=bool(bits.get("tap")))


def count_day(day: date, *, root: Path | None = None) -> dict[str, Any]:
    """Filename counts only — live path uses the count ledger."""
    if root is None:
        return summarize_day(day)
    folder = root / f"day={day.isoformat()}"
    by_sym = _snap_paths_by_symbol(folder / "chain")
    return {
        "day": day.isoformat(),
        "exists": folder.is_dir(),
        "snaps": sum(len(v) for v in by_sym.values()),
        "symbols_with_snaps": len(by_sym),
        "symbols": [
            {"symbol": sym, "snaps": len(paths), "last": paths[-1].name}
            for sym, paths in sorted(by_sym.items())
        ],
    }


def live_status(*, archive_root: Path | None = None) -> dict[str, Any]:
    """Clock + phase only. Disk lists live on /api/days and /api/day."""
    del archive_root
    ts = now_ny()
    wake = next_wake(ts)
    return {
        "now": ts.isoformat(),
        "phase": phase_at(ts),
        "day": ts.date().isoformat(),
        "wake": wake.isoformat(),
        "chain_every_s": CHAIN_EVERY_S,
        "data_root": str(data_root()),
        "write_root": str(snap_write_root() / f"day={ts.date().isoformat()}"),
        "days": [],
        "processes": {},
        "today": {},
    }


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Chain Snapshot</title>
<style>
  :root {
    --bg: #0b0d10;
    --panel: #14181e;
    --line: #262c36;
    --text: #e8edf4;
    --muted: #8b95a5;
    --pre: #6ea8fe;
    --rth: #3dd68c;
    --ext: #f5c542;
    --closed: #ff6b6b;
    --ok: #3dd68c;
    --bad: #ff6b6b;
    --idle: #8b95a5;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  header { padding: 20px 24px 12px; border-bottom: 1px solid var(--line);
    display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: 18px; font-weight: 620; margin: 0 0 4px; letter-spacing: .02em; }
  .sub { color: var(--muted); font-size: 12px; }
  .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; word-break: break-all; max-width: 72ch; margin-top: 6px; }
  .chips { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .chip { padding: 4px 10px; border-radius: 999px; font-size: 12px;
    border: 1px solid var(--line); background: var(--panel); }
  .chip.gth { color: #c4a5ff; border-color: #4a3870; }
  .chip.pre { color: var(--pre); border-color: #2a4a7a; }
  .chip.rth { color: var(--rth); border-color: #1f5c3d; }
  .chip.extended { color: var(--ext); border-color: #6a5414; }
  .chip.closed, .chip.weekend { color: var(--closed); border-color: #6a2a2a; }
  main { padding: 16px 24px 40px; display: grid; gap: 16px; }
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
  .k { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
  .v { font-size: 22px; font-variant-numeric: tabular-nums; margin-top: 4px; }
  .ok { color: var(--ok); } .bad { color: var(--bad); } .idle { color: var(--idle); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums; }
  th { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
  select { background: var(--bg); color: var(--text); border: 1px solid var(--line);
    border-radius: 8px; padding: 6px 10px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
  .dot.on { background: var(--ok); } .dot.off { background: var(--bad); }
</style>
</head>
<body>
<header>
  <div>
    <h1>Chain Snapshot</h1>
    <div class="sub">StudioOne live counts · Redis + COUNTS.json · read-only</div>
    <div class="sub path" id="write-root">writing —</div>
  </div>
  <div class="chips">
    <span id="phase" class="chip">—</span>
    <span id="clock" class="chip">—</span>
    <span id="cadence" class="chip">—</span>
    <span id="wake" class="chip">—</span>
    <label class="sub">Day <select id="day"></select></label>
  </div>
</header>
<main>
  <section class="row" id="procs"></section>
  <section class="row" id="stats"></section>
  <section class="card">
    <div class="k">Symbols</div>
    <table>
      <thead>
        <tr>
          <th>Symbol</th><th>Snaps</th><th>Last</th><th>Phase</th>
          <th>Rows</th><th>IV</th><th>Greeks</th><th>Status</th>
        </tr>
      </thead>
      <tbody id="syms"></tbody>
    </table>
  </section>
</main>
<script>
const $ = (id) => document.getElementById(id);
let selected = null;
function phaseClass(p){ return ['gth','pre','rth','extended','closed','weekend'].includes(p) ? p : ''; }
function fmt(ts){
  if(!ts) return '—';
  try { return new Date(ts).toLocaleString('en-US', { timeZone:'America/New_York', hour12:false }); }
  catch { return ts; }
}
function age(ts){
  if(!ts) return '';
  const s = (Date.now() - new Date(ts).getTime())/1000;
  if (s < 90) return Math.round(s)+'s';
  if (s < 3600) return Math.round(s/60)+'m';
  return Math.round(s/3600)+'h';
}
function proc(name, on){
  const cls = on === true ? 'on' : on === false ? 'off' : 'off';
  const lab = on === true ? 'up' : on === false ? 'down' : '—';
  return `<div class="card"><div class="k">${name}</div><div class="v"><span class="dot ${cls}"></span>${lab}</div></div>`;
}
function paint(st, dayDoc){
  const ph = st.phase || '—';
  $('phase').textContent = ph.toUpperCase();
  $('phase').className = 'chip ' + phaseClass(ph);
  $('clock').textContent = fmt(st.now);
  $('cadence').textContent = (st.chain_every_s || '—') + 's cadence';
  $('wake').textContent = 'wake ' + fmt(st.wake);
  $('write-root').textContent = st.write_root ? ('writing ' + st.write_root) : 'writing —';
  const days = st.days || [];
  const cur = selected || st.day;
  if ($('day').options.length !== days.length) {
    $('day').innerHTML = days.map(d => `<option value="${d}">${d}</option>`).join('');
  }
  $('day').value = cur;
  const p = st.processes || {};
  $('procs').innerHTML = [
    proc('tap', p.tap), proc('chain_feed', p.chain_feed),
    proc('sym_feed', p.sym_feed), proc('dash', p.dash)
  ].join('');
  const t = dayDoc || {};
  const holeN = t.latest_holes || 0;
  const skipN = t.not_today || 0;
  $('stats').innerHTML = [
    ['Snaps', t.snaps ?? 0, ''],
    ['On today', t.symbols_with_snaps ?? 0, ''],
    ['Not today', skipN, skipN ? 'idle' : ''],
    ['Latest IV', t.latest_with_iv ?? 0, t.latest_with_iv ? 'ok' : (t.symbols_with_snaps ? 'bad' : 'idle')],
    ['Latest holes', holeN, holeN ? 'bad' : 'ok'],
    ['Last snap', age(t.last_captured_at) || '—', '']
  ].map(([k,v,c]) => `<div class="card"><div class="k">${k}</div><div class="v ${c}">${v}</div></div>`).join('');
  const rows = (t.symbols || []).map(s => {
    if (s.not_today) {
      const nx = s.next_expiration ? ' · next ' + s.next_expiration : '';
      return `<tr class="idle">
      <td>${s.symbol || ''}</td>
      <td>${s.snaps ?? 0}</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td class="idle">NOT TODAY${nx}</td>
    </tr>`;
    }
    const hole = s.hole ? String(s.hole) : '';
    return `<tr>
      <td>${s.symbol || ''}</td>
      <td>${s.snaps ?? 0}</td>
      <td>${fmt(s.captured_at)} <span class="sub">${age(s.captured_at)}</span></td>
      <td>${s.phase || '—'}</td>
      <td>${s.row_count ?? '—'}</td>
      <td class="${(s.iv_count||0)>0?'ok':'bad'}">${s.iv_count ?? '—'}</td>
      <td class="${(s.greek_count||0)>0?'ok':''}">${s.greek_count ?? '—'}</td>
      <td class="${hole?'bad':'ok'}">${hole || 'ok'}</td>
    </tr>`;
  }).join('');
  $('syms').innerHTML = rows || '<tr><td colspan="8" class="idle">No snaps on disk for this day.</td></tr>';
}
async function load(){
  const st = await (await fetch('/api/status')).json();
  try {
    const p = await (await fetch('/api/procs')).json();
    st.processes = p.processes || {};
  } catch (e) { st.processes = {}; }
  try {
    const dd = await (await fetch('/api/days')).json();
    st.days = dd.days || [];
  } catch (e) { st.days = st.days || []; }
  const day = selected || st.day;
  let dayDoc = st.today;
  try {
    dayDoc = await (await fetch('/api/day?day=' + encodeURIComponent(day))).json();
  } catch (e) { /* keep counts */ }
  paint(st, dayDoc);
}
$('day').addEventListener('change', (e) => { selected = e.target.value; load(); });
load();
setInterval(load, 2000);
</script>
</body>
</html>
"""


class QuietHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

    def server_bind(self) -> None:
        """Bind without getfqdn / mDNS reverse lookup (that hung on StudioOne)."""
        import socket as _socket

        self.socket.setsockopt(_socket.SOL_SOCKET, _socket.SO_REUSEADDR, 1)
        self.socket.bind(self.server_address)
        self.server_address = self.socket.getsockname()
        host, port = self.server_address[:2]
        self.server_name = host
        self.server_port = port


class Handler(BaseHTTPRequestHandler):
    def address_string(self) -> str:
        # Never reverse-DNS 127.0.0.1 — mDNS lookup hung the first bind.
        return self.client_address[0]

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"dash {self.address_string()} {fmt % args}", flush=True)

    def _send(self, code: int, body: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(
        self,
        code: int,
        doc: dict[str, Any],
        *,
        etag: str | None = None,
        retry_after: str | None = None,
    ) -> None:
        raw = json.dumps(doc, default=str, separators=(",", ":")).encode("utf-8")
        accept = (self.headers.get("Accept-Encoding") or "").lower()
        encoding = None
        if "gzip" in accept:
            raw = gzip.compress(raw, compresslevel=4)
            encoding = "gzip"
        inm = (self.headers.get("If-None-Match") or "").strip().strip('"')
        if etag and inm and inm == etag:
            self.send_response(304)
            self.send_header("ETag", f'"{etag}"')
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        if retry_after:
            self.send_header("Retry-After", retry_after)
        if encoding:
            self.send_header("Content-Encoding", encoding)
        if etag:
            self.send_header("ETag", f'"{etag}"')
        self.end_headers()
        self.wfile.write(raw)

    def _serve_archive(self, path: str, qs: dict[str, list[str]]) -> None:
        from market_data.ssr_archive_read import hole_http_status

        if path == "/api/health":
            self._json(200, _health_doc())
            return
        if path == "/api/coverage":
            doc = _coverage_from_qs(qs)
            self._json(200, doc)
            return
        if path == "/api/index":
            try:
                doc = _index_from_qs(qs)
            except ValueError as exc:
                self._json(422, {"error": str(exc)})
                return
            code = hole_http_status(doc.get("hole"), error=doc.get("error"))
            self._json(code, doc, etag=str(doc.get("hash") or "") or None)
            return
        if path == "/api/fetch":
            try:
                doc = _fetch_from_qs(qs)
            except ValueError as exc:
                self._json(422, {"error": str(exc)})
                return
            code = hole_http_status(doc.get("hole"), error=doc.get("error"))
            self._json(code, doc, etag=str(doc.get("hash") or "") or None)
            return
        if path == "/api/marks":
            try:
                doc = _marks_from_qs(qs)
            except ValueError as exc:
                self._json(422, {"error": str(exc)})
                return
            code = hole_http_status(doc.get("hole"), error=doc.get("error"))
            self._json(code, doc)
            return
        if path == "/api/cadence":
            try:
                doc = _cadence_from_qs(qs)
            except ValueError as exc:
                self._json(422, {"error": str(exc)})
                return
            self._json(200, doc)
            return
        if path == "/api/stats":
            doc = _stats_from_disk()
            code = 200 if not doc.get("hole") else 200
            self._json(code, doc)
            return
        self._json(404, {"error": "not found"})

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)
        try:
            if path in ARCHIVE_API_PATHS:
                expected = archive_token()
                if expected is None:
                    print(
                        f"ARCHIVE NOT CONFIGURED: {path} with no LABS_SSR_ARCHIVE_TOKEN",
                        flush=True,
                    )
                    self._json(501, dict(ARCHIVE_NOT_CONFIGURED))
                    return
                if not bearer_authorized(
                    self.headers.get("Authorization"), expected
                ):
                    self._json(401, dict(ARCHIVE_AUTH))
                    return
                pooled = path != "/api/health"
                if pooled and not _ARCHIVE_GATE.acquire():
                    self._json(429, dict(ARCHIVE_BUSY), retry_after="2")
                    return
                try:
                    self._serve_archive(path, qs)
                finally:
                    if pooled:
                        _ARCHIVE_GATE.release()
                return
            if path in ("/", "/index.html"):
                self._send(200, PAGE.encode("utf-8"), "text/html; charset=utf-8")
                return
            if path == "/api/status":
                self._json(200, live_status())
                return
            if path == "/api/procs":
                self._json(200, {"processes": process_bits()})
                return
            if path == "/api/days":
                self._json(200, {"days": list_days()})
                return
            if path == "/api/day":
                raw = (qs.get("day") or [""])[0]
                day = date.fromisoformat(raw) if raw else today_ny()
                self._json(200, summarize_day(day))
                return
            if path == "/api/available":
                self._json(200, _available_from_qs(qs))
                return
            if path in ("/api/retrieve", "/api/chain"):
                try:
                    doc = _retrieve_from_qs(qs)
                except ValueError as exc:
                    self._json(422, {"error": str(exc)})
                    return
                self._json(200, doc)
                return
            self._json(404, {"error": "not found"})
        except Exception as exc:
            self._json(500, {"error": str(exc)})


def main(argv: list[str] | None = None) -> int:
    del argv
    archive_token()
    host = dash_host()
    port = dash_port()
    httpd = QuietHTTPServer((host, port), Handler)
    print(
        f"chain_snapshot_dash http://{host}:{port} root={capture_root()}",
        flush=True,
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("dash stop", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
