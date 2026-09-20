"""Named-state ops snapshot. Disk + ps + /v1/health. Never Massive. Never bins."""

from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from market_data.vp_engine.coverage import load_coverage
from market_data.vp_ingest.store import archive_root

ET = ZoneInfo("America/New_York")
LIVE_S = 90
STALE_S = 15 * 60
NEEDLES = {
    "chain_feed": "market_data.chain_feed",
    "sym_feed": "market_data.sym_feed",
    "futures_feed": "market_data.vp_ingest.futures_feed",
    "vp_api": "market_data.vp_api",
    "vp_engine": "market_data.vp_engine.bin_loop",
}


def _now() -> datetime:
    return datetime.now(tz=ET)


def _age_s(mtime: float, now: datetime) -> float:
    return now.timestamp() - mtime


def _procs() -> dict[str, dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {
        k: {"running": False, "pid": None} for k in NEEDLES
    }
    try:
        raw = subprocess.check_output(
            ["ps", "-ax", "-o", "pid=,command="], text=True, timeout=2
        )
    except (OSError, subprocess.SubprocessError):
        return {k: {**v, "running": None} for k, v in found.items()}
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        pid_s, _, cmd = line.partition(" ")
        try:
            pid = int(pid_s)
        except ValueError:
            continue
        for key, needle in NEEDLES.items():
            if needle in cmd and not found[key]["running"]:
                found[key] = {"running": True, "pid": pid}
    return found


def _named_age(age: float | None, running: bool | None) -> str:
    if running is False:
        return "DOWN"
    if age is None:
        return "NO COVERAGE"
    if age <= LIVE_S:
        return "LIVE"
    if age <= STALE_S:
        return "STALE"
    return "STALE"


def _ingest_day(root: Path, source: str, day: str) -> Path:
    return root / "vp" / "ingest" / source / "trades" / f"day={day}" / "prints.jsonl.gz"


def _gaps_day(root: Path, source: str, day: str) -> Path:
    return root / "vp" / "ingest" / source / "gaps" / f"day={day}" / "gaps.jsonl"


def collector_panel(
    root: Path, source: str, procs: dict[str, dict[str, Any]], now: datetime, day: str
) -> dict[str, Any]:
    machine = os.uname().nodename
    if source == "SPY":
        proc = procs.get("sym_feed") or {}
    else:
        proc = procs.get("futures_feed") or {}
    prints = _ingest_day(root, source, day)
    mtime = prints.stat().st_mtime if prints.is_file() else None
    age = _age_s(mtime, now) if mtime is not None else None
    gpath = _gaps_day(root, source, day)
    gaps_today = 0
    open_absence = False
    if gpath.is_file() and gpath.stat().st_size:
        for line in gpath.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            rec = json.loads(line)
            gaps_today += 1
            if rec.get("kind") == "print_absence" and rec.get("state") == "open":
                open_absence = True
    state = _named_age(age, proc.get("running"))
    if open_absence:
        state = "GAPPED"
    if not prints.is_file() and not proc.get("running"):
        state = "NO COVERAGE"
    return {
        "source": source,
        "machine": machine,
        "pid": proc.get("pid"),
        "running": proc.get("running"),
        "last_print_age_s": round(age, 1) if age is not None else None,
        "gaps_today": gaps_today,
        "state": state,
        "day": day if prints.is_file() else None,
    }


def chain_panel(procs: dict[str, dict[str, Any]], now: datetime) -> dict[str, Any]:
    """CP-1 first. This box's chain_feed only — StudioOne chain is the consolidation host."""
    proc = procs.get("chain_feed") or {}
    log = Path.home() / "Library/Logs/fattail-labs/chain-feed.out.log"
    mtime = log.stat().st_mtime if log.is_file() else None
    age = _age_s(mtime, now) if mtime is not None else None
    last_line = None
    if log.is_file():
        try:
            last_line = log.read_text(encoding="utf-8", errors="replace").splitlines()[-1]
        except OSError:
            last_line = None
    if proc.get("running"):
        state = "LIVE" if age is None or age <= LIVE_S else "STALE"
    else:
        state = "DOWN"
    return {
        "pid": proc.get("pid"),
        "running": proc.get("running"),
        "freshness_s": round(age, 1) if age is not None else None,
        "last_snapshot": last_line,
        "state": state,
        "machine": os.uname().nodename,
        "note": "consolidated pane — chain_feed on this box is CP-1 SoR",
    }


def engine_panel(root: Path, cov: dict[str, Any], now: datetime) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for src in ("SPY", "ES", "MES"):
        row = cov.get(src) or {}
        binned = list(row.get("sessions_binned") or [])
        hist = root / "vp" / "engine" / src / "developing" / "histogram.json"
        gen = None
        age = None
        if hist.is_file():
            age = _age_s(hist.stat().st_mtime, now)
            try:
                gen = json.loads(hist.read_text(encoding="utf-8")).get("generation_id")
            except (OSError, json.JSONDecodeError):
                gen = None
        if not binned:
            state = "NO COVERAGE"
        elif age is not None and age > STALE_S:
            state = "STALE"
        else:
            state = "CURRENT"
        out[src] = {
            "sessions_binned": len(binned),
            "floor": row.get("floor"),
            "ceiling": row.get("ceiling"),
            "last_generation": gen,
            "state": state,
        }
    return out


def api_panel(cov: dict[str, Any], procs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    proc = procs.get("vp_api") or {}
    health_url = os.environ.get("LABS_VP_API_HEALTH") or "http://127.0.0.1:4010/v1/health"
    http_state = "DOWN"
    try:
        req = Request(health_url, method="GET")
        with urlopen(req, timeout=1.5) as resp:
            code = getattr(resp, "status", 200)
            http_state = "UP" if code in (200, 401, 403) else "DOWN"
    except HTTPError as exc:
        http_state = "UP" if exc.code in (401, 403) else "DOWN"
    except (URLError, OSError, TimeoutError):
        http_state = "STALE" if proc.get("running") else "DOWN"
    coverage = {}
    for src in ("SPY", "ES", "MES"):
        row = cov.get(src) or {}
        coverage[src] = {
            "floor_session": row.get("floor"),
            "ceiling_session": row.get("ceiling"),
            "sessions_binned": len(list(row.get("sessions_binned") or [])),
        }
    return {
        "state": http_state if proc.get("running") or http_state == "UP" else "DOWN",
        "pid": proc.get("pid"),
        "base": "http://127.0.0.1:4010",
        "contract": "v1.1",
        "coverage": coverage,
    }


def backfill_panel(cov: dict[str, Any]) -> dict[str, Any]:
    floors = {s: (cov.get(s) or {}).get("floor") for s in ("SPY", "ES", "MES")}
    if not any(floors.values()):
        state = "NO COVERAGE"
    else:
        state = "HOLD"
    return {
        "state": state,
        "tranche": "1 next=2026-09-16 (newest-first, not started)",
        "floors": floors,
        "integrity": "NOT CHECKED",
    }


def tonight_panel(repo: Path) -> dict[str, Any]:
    qpath = repo / "agents" / "p-volume-profile-service" / "evening-queue.json"
    items: list[str] = []
    if qpath.is_file():
        try:
            items = [str(i.get("id")) for i in json.loads(qpath.read_text()).get("items") or []]
        except (OSError, json.JSONDecodeError, TypeError):
            items = []
    carry = repo / "agents" / "p-volume-profile-service" / "gate-reports" / "VPS1-G-carry.md"
    go = carry.is_file() and "**GO**" in carry.read_text(encoding="utf-8")
    return {
        "vps1_g_rth": "GO" if go else "NOT FILED",
        "cutover": "DONE Engine+API+futures 2026-09-18",
        "queue": items,
        "next": items[0] if items else "empty",
        "tranche_1": "QUEUED 16:05" if "TRANCHE-1" in items else "NOT IN QUEUE",
        "state": "CURRENT" if go else "HELD",
    }


def consumers_panel(api: dict[str, Any], now: datetime) -> dict[str, Any]:
    api_up = api.get("state") == "UP"
    return {
        "minitwo_labs": {
            "target": "http://studioone.local:4010",
            "state": "UP" if api_up else "DOWN",
            "last_success": now.isoformat() if api_up else None,
            "note": "last-success = this box probed /v1/health (401/200=UP). MiniTwo access log not instrumented.",
        },
        "studiotwo_dev": {
            "target": "http://127.0.0.1:4010 (StudioTwo DEV sidecar)",
            "state": "NO COVERAGE",
            "last_refresh": None,
            "note": "DEV mirror is on StudioTwo; this pane does not poll it.",
        },
    }


def autorun_panel(repo: Path) -> dict[str, Any]:
    g = repo / "agents" / "p-volume-profile-service" / "gate-reports"
    files = sorted(g.glob("autorun-*.md")) if g.is_dir() else []
    if not files:
        return {
            "state": "NO COVERAGE",
            "last": None,
            "detail": "no autorun report yet — first fire 16:05 ET",
        }
    last = files[-1]
    text = last.read_text(encoding="utf-8")[:400]
    return {"state": "CURRENT", "last": last.name, "detail": text}


def build_snapshot(*, root: Path | None = None, repo: Path | None = None) -> dict[str, Any]:
    now = _now()
    ar = root or archive_root()
    repo = repo or Path(__file__).resolve().parents[3]
    cov = load_coverage(ar)
    procs = _procs()
    ingest_day = now.date().isoformat()
    trades = ar / "vp" / "ingest" / "ES" / "trades"
    if trades.is_dir():
        days = sorted(p.name.replace("day=", "") for p in trades.glob("day=*"))
        if days:
            ingest_day = days[-1]
    api = api_panel(cov, procs)
    return {
        "as_of": now.isoformat(),
        "host": os.uname().nodename,
        "store": str(ar),
        "read_only": True,
        "never_commands": True,
        "no_bins": True,
        "chain_feed": chain_panel(procs, now),
        "collectors": {
            "SPY": collector_panel(ar, "SPY", procs, now, ingest_day),
            "ES": collector_panel(ar, "ES", procs, now, ingest_day),
            "MES": collector_panel(ar, "MES", procs, now, ingest_day),
        },
        "engine": engine_panel(ar, cov, now),
        "api": api,
        "backfill": backfill_panel(cov),
        "consumers": consumers_panel(api, now),
        "tonight": tonight_panel(repo),
        "autorun": autorun_panel(repo),
    }
