#!/usr/bin/env python3
"""Full-estate RAW market data campaign (VP Spec v0.4 · VP21).

Writes Parquet day partitions under LABS_MARKET_DATA_ROOT
(default: /Volumes/FatTail2TB/fattail-market-data).

  .venv/bin/python -m market_data.raw_campaign --help
  .venv/bin/python -m market_data.raw_campaign --all
  .venv/bin/python -m market_data.raw_campaign --symbol SPY --kinds trades,quotes,aggs_1s

Resume: skips days that already have a .ok marker next to the parquet part.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

# Ensure server/ on path when run as module
_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

from market_data.massive_client import MassiveClient, MassiveClientError  # noqa: E402

# Native VP-eligible series (Spec §7.1) — one physical store per ticker
DEFAULT_SYMBOLS = (
    "SPY",
    "QQQ",
    "IWM",
    "GLD",
    "TLT",
    "SLV",
    "USO",
    "XLF",
    "UNG",
    "AAPL",
    "AMZN",
    "NVDA",
    "TSLA",
    "GOOGL",
    "META",
    "MSFT",
)

KINDS = ("trades", "quotes", "aggs_1s")

# Practical full-history start (Massive stocks history goes earlier; blank days ok)
DEFAULT_START = date(2004, 1, 2)


def market_data_root() -> Path:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return Path("/Volumes/FatTail2TB/fattail-market-data").resolve()


def is_weekday(d: date) -> bool:
    return d.weekday() < 5


def daterange(start: date, end: date) -> Iterable[date]:
    cur = start
    while cur <= end:
        if is_weekday(cur):
            yield cur
        cur += timedelta(days=1)


def day_paths(root: Path, series: str, kind: str, day: date) -> tuple[Path, Path]:
    part = (
        root
        / "raw"
        / series.upper()
        / kind
        / f"year={day.year:04d}"
        / f"month={day.month:02d}"
        / f"day={day.day:02d}"
        / "part-000.parquet"
    )
    ok = part.with_suffix(part.suffix + ".ok")
    return part, ok


def write_parquet(rows: list[dict[str, Any]], path: Path, *, kind: str | None = None) -> int:
    import pyarrow.parquet as pq

    path.parent.mkdir(parents=True, exist_ok=True)
    if kind:
        from market_data.parquet_schema import table_for

        table = table_for(kind, rows)
        pq.write_table(table, path, compression="zstd")
        return len(rows)
    import pyarrow as pa

    if not rows:
        # Empty marker day — still write empty table for resume honesty
        table = pa.table({"_empty": pa.array([], type=pa.bool_())})
        pq.write_table(table, path, compression="zstd")
        return 0
    cols: dict[str, list[Any]] = {}
    keys: set[str] = set()
    for r in rows:
        keys.update(r.keys())
    for k in sorted(keys):
        cols[k] = []
    for r in rows:
        for k in keys:
            v = r.get(k)
            if isinstance(v, (list, dict)):
                cols[k].append(json.dumps(v, separators=(",", ":"), default=str))
            else:
                cols[k].append(v)
    table = pa.table(cols)
    pq.write_table(table, path, compression="zstd")
    return len(rows)


def mark_ok(ok_path: Path, meta: dict[str, Any]) -> None:
    ok_path.write_text(json.dumps(meta, indent=2, default=str) + "\n")


def already_done(ok_path: Path) -> bool:
    return ok_path.is_file() and ok_path.stat().st_size > 0


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    root = market_data_root()
    log_dir = root / "jobs" / "logs"
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
        with open(log_dir / "raw_campaign.log", "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def fetch_kind(
    client: MassiveClient,
    series: str,
    kind: str,
    day: date,
) -> list[dict[str, Any]]:
    d = day.isoformat()
    if kind == "trades":
        return client.fetch_trades_day(series, d)
    if kind == "quotes":
        return client.fetch_quotes_day(series, d)
    if kind == "aggs_1s":
        return client.fetch_aggs(
            series,
            multiplier=1,
            timespan="second",
            start=d,
            end=d,
            adjusted=True,
            limit=50000,
        )
    raise ValueError(f"unknown kind {kind}")


def process_day(
    client: MassiveClient,
    root: Path,
    series: str,
    kind: str,
    day: date,
    *,
    force: bool = False,
    attempt: int = 0,
) -> dict[str, Any]:
    part, ok = day_paths(root, series, kind, day)
    if already_done(ok) and not force:
        return {"status": "skip", "day": day.isoformat(), "kind": kind, "series": series}
    t0 = time.time()
    try:
        rows = fetch_kind(client, series, kind, day)
        n = write_parquet(rows, part, kind=kind)
        meta = {
            "status": "ok",
            "series": series,
            "kind": kind,
            "day": day.isoformat(),
            "rows": n,
            "path": str(part),
            "seconds": round(time.time() - t0, 3),
            "at": datetime.now(timezone.utc).isoformat(),
        }
        mark_ok(ok, meta)
        # clear prior fail marker
        fail_path = part.with_suffix(part.suffix + ".fail.json")
        if fail_path.is_file():
            fail_path.unlink()
        return meta
    except MassiveClientError as e:
        msg = str(e)
        code = "403" if "403" in msg else ("429" if "429" in msg else "err")
        if code == "429" or attempt < 4:
            wait = 60 if code == "429" else min(30, 2 ** attempt)
            log(f"RETRY {series} {kind} {day} code={code} wait={wait}s attempt={attempt}")
            time.sleep(wait)
            return process_day(
                client, root, series, kind, day, force=force, attempt=attempt + 1
            )
        meta = {
            "status": "fail",
            "series": series,
            "kind": kind,
            "day": day.isoformat(),
            "code": code,
            "error": msg[:500],
            "at": datetime.now(timezone.utc).isoformat(),
        }
        fail_path = part.with_suffix(part.suffix + ".fail.json")
        fail_path.parent.mkdir(parents=True, exist_ok=True)
        fail_path.write_text(json.dumps(meta, indent=2) + "\n")
        return meta
    except Exception as e:
        # IncompleteRead / URLError etc. — retry
        if attempt < 5:
            wait = min(45, 3 * (attempt + 1))
            log(
                f"RETRY {series} {kind} {day} {type(e).__name__} "
                f"wait={wait}s attempt={attempt}"
            )
            time.sleep(wait)
            return process_day(
                client, root, series, kind, day, force=force, attempt=attempt + 1
            )
        meta = {
            "status": "fail",
            "series": series,
            "kind": kind,
            "day": day.isoformat(),
            "code": "exc",
            "error": f"{type(e).__name__}: {e}"[:500],
            "trace": traceback.format_exc()[-800:],
            "at": datetime.now(timezone.utc).isoformat(),
        }
        fail_path = part.with_suffix(part.suffix + ".fail.json")
        fail_path.parent.mkdir(parents=True, exist_ok=True)
        fail_path.write_text(json.dumps(meta, indent=2) + "\n")
        return meta


def run_campaign(
    *,
    symbols: list[str],
    kinds: list[str],
    start: date,
    end: date,
    force: bool = False,
) -> None:
    root = market_data_root()
    root.mkdir(parents=True, exist_ok=True)
    (root / "raw").mkdir(exist_ok=True)
    (root / "binned").mkdir(exist_ok=True)
    (root / "jobs" / "logs").mkdir(parents=True, exist_ok=True)
    (root / "state").mkdir(exist_ok=True)

    if not root.exists():
        raise SystemExit(f"LABS_MARKET_DATA_ROOT missing: {root}")

    client = MassiveClient()
    log(
        f"START root={root} symbols={symbols} kinds={kinds} "
        f"range={start}..{end} force={force}"
    )
    state_path = root / "state" / "campaign_progress.jsonl"

    # Kind-outer: finish trades estate before denser quotes/1s (VP bins need trades)
    for kind in kinds:
        for series in symbols:
            log(f"=== {series} {kind} ===")
            ok_n = skip_n = fail_n = 0
            for day in daterange(start, end):
                meta = process_day(
                    client, root, series, kind, day, force=force
                )
                st = meta.get("status")
                if st == "ok":
                    ok_n += 1
                    if ok_n % 20 == 0 or int(meta.get("rows") or 0) > 100_000:
                        log(
                            f"  {series} {kind} {day} rows={meta.get('rows')} "
                            f"s={meta.get('seconds')}"
                        )
                elif st == "skip":
                    skip_n += 1
                else:
                    fail_n += 1
                    log(
                        f"  FAIL {series} {kind} {day} {meta.get('code')} "
                        f"{str(meta.get('error', ''))[:120]}"
                    )
                with open(state_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(meta, default=str) + "\n")
                if st == "ok":
                    time.sleep(0.02)
            log(f"DONE {series} {kind} ok={ok_n} skip={skip_n} fail={fail_n}")

    log("CAMPAIGN COMPLETE")


def parse_date(s: str) -> date:
    return date.fromisoformat(s.strip()[:10])


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="VP21 full-estate raw campaign")
    p.add_argument("--all", action="store_true", help="All default symbols")
    p.add_argument("--symbol", action="append", dest="symbols", default=[])
    p.add_argument(
        "--kinds",
        default="trades,quotes,aggs_1s",
        help="Comma list: trades,quotes,aggs_1s",
    )
    p.add_argument("--start", default=DEFAULT_START.isoformat())
    p.add_argument(
        "--end",
        default=datetime.now(timezone.utc).date().isoformat(),
    )
    p.add_argument("--force", action="store_true")
    args = p.parse_args(argv)

    symbols = [s.upper() for s in (args.symbols or [])]
    if args.all or not symbols:
        symbols = list(DEFAULT_SYMBOLS)
    kinds = [k.strip() for k in args.kinds.split(",") if k.strip()]
    for k in kinds:
        if k not in KINDS:
            print(f"unknown kind {k}", file=sys.stderr)
            return 2

    run_campaign(
        symbols=symbols,
        kinds=kinds,
        start=parse_date(args.start),
        end=parse_date(args.end),
        force=bool(args.force),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
