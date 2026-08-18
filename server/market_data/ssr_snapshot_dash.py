#!/usr/bin/env python3
"""Chain Snapshot dashboard — StudioOne localhost only.

Read-only view of the gold archive on disk. Does not call Massive.
Does not load Labs boot Config.

  LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data \\
    .venv/bin/python -m market_data.ssr_snapshot_dash

  open http://127.0.0.1:5055
"""

from __future__ import annotations

import json
import os
import subprocess
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
    today_ny,
)

NY = ZoneInfo("America/New_York")
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5055


def dash_host() -> str:
    raw = (os.environ.get("LABS_SSR_DASH_HOST") or DEFAULT_HOST).strip()
    if raw not in ("127.0.0.1", "localhost"):
        raise RuntimeError(
            f"LABS_SSR_DASH_HOST={raw!r} — dashboard binds localhost only"
        )
    return "127.0.0.1"


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
    """Live board reads the local SSD cache only.

    The gold volume has been stalling ``stat``/``open`` and must not sit
    on the HTTP request path. Friday's archive stays on disk for later.
    """
    return [live_cache_root()]


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
    if root is not None:
        folder = root / f"day={day.isoformat()}"
    else:
        folder = None
        for base in scan_roots():
            cand = base / f"day={day.isoformat()}"
            if cand.is_dir():
                folder = cand
                break
        if folder is None:
            folder = day_dir(day)
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


def count_day(day: date, *, root: Path | None = None) -> dict[str, Any]:
    """Filename counts only — no JSON parse (status poll)."""
    folder = (root / f"day={day.isoformat()}") if root is not None else day_dir(day)
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
    <div class="sub">StudioOne gold archive · localhost · read-only</div>
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
          <th>Rows</th><th>IV</th><th>Greeks</th><th>Hole</th>
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
  $('stats').innerHTML = [
    ['Snaps', t.snaps ?? 0, ''],
    ['Symbols', t.symbols_with_snaps ?? 0, ''],
    ['Latest IV', t.latest_with_iv ?? 0, t.latest_with_iv ? 'ok' : 'bad'],
    ['Latest greeks', t.latest_with_greeks ?? 0, t.latest_with_greeks ? 'ok' : ''],
    ['Latest holes', holeN, holeN ? 'bad' : 'ok'],
    ['Last snap', age(t.last_captured_at) || '—', '']
  ].map(([k,v,c]) => `<div class="card"><div class="k">${k}</div><div class="v ${c}">${v}</div></div>`).join('');
  const rows = (t.symbols || []).map(s => {
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

    def _json(self, code: int, doc: dict[str, Any]) -> None:
        raw = json.dumps(doc, default=str, indent=2).encode("utf-8")
        self._send(code, raw, "application/json; charset=utf-8")

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)
        try:
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
            self._json(404, {"error": "not found"})
        except Exception as exc:
            self._json(500, {"error": str(exc)})


def main(argv: list[str] | None = None) -> int:
    del argv
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
