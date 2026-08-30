"""Tick-volume page for the Chain Snapshot dash. Bins only. Read-only."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

SYMBOLS = (
    "SPY", "QQQ", "IWM", "GLD", "TLT", "SLV", "USO", "XLF",
    "UNG", "AAPL", "AMZN", "NVDA", "TSLA", "GOOGL", "META", "MSFT",
)


def bins_root() -> Path:
    raw = (os.environ.get("LABS_VP_BINS_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return Path("/Users/ernie/FatTail-Intelligence/.cache/vp_bins/vp_bins_v3")


def pull_root() -> Path:
    return Path("/Users/ernie/FatTail-Intelligence/.cache/vp_bins/pulls")


def market_root() -> Path:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return Path("/Volumes/FatTail2TB/fattail-market-data")


def _tail(path: Path, n: int = 3) -> str:
    if not path.is_file():
        return ""
    try:
        lines = path.read_text(errors="replace").splitlines()
    except OSError:
        return ""
    return "\n".join(lines[-n:])


def _pull_running(sym: str) -> bool:
    try:
        import subprocess
        out = subprocess.check_output(["pgrep", "-lf", "raw_campaign"], text=True)
    except Exception:
        return False
    return f"--symbol {sym}" in out or f"--symbol {sym} " in out


def _raw_days(sym: str) -> int:
    root = market_root() / "raw" / sym / "trades"
    if not root.is_dir():
        return 0
    return sum(1 for _ in root.glob("year=*/month=*/day=*/part-000.parquet"))


def summarize_volume_bins() -> dict[str, Any]:
    rows = []
    for sym in SYMBOLS:
        meta_path = bins_root() / sym / "_meta.json"
        meta: dict[str, Any] = {}
        if meta_path.is_file():
            try:
                meta = json.loads(meta_path.read_text())
            except Exception as exc:
                meta = {"status": "meta_error", "error": str(exc)}
        pull_log = pull_root() / sym / "nohup.out"
        rows.append({
            "symbol": sym,
            "status": meta.get("status") or ("pulling" if _pull_running(sym) else "waiting"),
            "total_volume": meta.get("total_volume"),
            "n_bins": meta.get("n_bins"),
            "last_day": meta.get("last_day"),
            "days_ok": meta.get("days_ok"),
            "raw_days": _raw_days(sym),
            "pull_running": _pull_running(sym),
            "pull_tail": _tail(pull_log, 2),
        })
    return {"symbols": rows, "bins_root": str(bins_root())}


VOLUME_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Tick Volume</title>
<style>
  :root {
    --bg: #0b0d10; --panel: #14181e; --line: #262c36; --text: #e8edf4;
    --muted: #8b95a5; --ok: #3dd68c; --bad: #ff6b6b; --idle: #8b95a5; --ext: #f5c542;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  header { padding: 20px 24px 12px; border-bottom: 1px solid var(--line);
    display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: 18px; font-weight: 620; margin: 0 0 4px; letter-spacing: .02em; }
  .sub { color: var(--muted); font-size: 12px; }
  nav a { color: var(--muted); text-decoration: none; margin-right: 14px; }
  nav a.on { color: var(--text); }
  main { padding: 16px 24px 40px; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums; vertical-align: top; }
  th { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
  .ok { color: var(--ok); } .bad { color: var(--bad); } .idle { color: var(--idle); } .run { color: var(--ext); }
  .tail { color: var(--muted); font-size: 11px; white-space: pre-wrap; max-width: 420px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>Tick Volume</h1>
    <div class="sub">Bins only · OPF/Massive pull · no raw tape kept</div>
  </div>
  <nav>
    <a href="/">Chain Snapshot</a>
    <a class="on" href="/volume">Tick Volume</a>
  </nav>
</header>
<main>
  <section class="card">
    <table>
      <thead>
        <tr>
          <th>Symbol</th><th>Pull</th><th>Raw days</th><th>Bins</th>
          <th>Volume</th><th>Last day</th><th>Log</th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </section>
</main>
<script>
const $ = (id) => document.getElementById(id);
function fmtV(v){
  if (v == null) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(0)+'k';
  return String(Math.round(n));
}
async function load(){
  const doc = await (await fetch('/api/volume-bins')).json();
  const rows = (doc.symbols || []).map(s => {
    const pull = s.pull_running ? '<span class="run">running</span>' : '<span class="idle">idle</span>';
    const st = s.status || 'waiting';
    const stc = st === 'ok' ? 'ok' : (st === 'no_source' || st === 'waiting' ? 'idle' : 'run');
    return `<tr>
      <td>${s.symbol}</td>
      <td>${pull}</td>
      <td>${s.raw_days ?? 0}</td>
      <td class="${stc}">${st}</td>
      <td>${fmtV(s.total_volume)}</td>
      <td>${s.last_day || '—'}</td>
      <td class="tail">${(s.pull_tail || '').replace(/</g,'&lt;')}</td>
    </tr>`;
  }).join('');
  $('rows').innerHTML = rows || '<tr><td colspan="7" class="idle">No symbols.</td></tr>';
}
load();
setInterval(load, 4000);
</script>
</body>
</html>
"""
