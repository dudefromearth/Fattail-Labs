#!/usr/bin/env python3
"""Historical options estate for SPY + SPX family (no SPX index volume).

Stores contract catalogs and per-contract daily OHLCV under LABS_MARKET_DATA_ROOT.

  .venv/bin/python -m market_data.options_campaign --help
  .venv/bin/python -m market_data.options_campaign --underlyings SPY,SPX,SPXW

SPX index tape is not pulled (no native volume). SPXW is the weekly SPX book
returned by Massive chain snapshots on I:SPX.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

from market_data.massive_client import MassiveClient, MassiveClientError  # noqa: E402

DEFAULT_UNDERLYINGS = ("SPY", "SPX", "SPXW")
OPTIONS_HISTORY_START = date(2014, 6, 2)


def market_data_root() -> Path:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return Path("/Volumes/sabrant2tb/fattail-market-data").resolve()


def safe_ticker(ticker: str) -> str:
    return (ticker or "").strip().replace(":", "_").replace("/", "_")


def catalog_paths(root: Path, underlying: str, bucket: str) -> tuple[Path, Path]:
    part = (
        root
        / "raw"
        / underlying.upper()
        / "options"
        / "contracts"
        / bucket
        / "part-000.parquet"
    )
    return part, part.with_suffix(part.suffix + ".ok")


def aggs_paths(root: Path, underlying: str, ticker: str) -> tuple[Path, Path]:
    part = (
        root
        / "raw"
        / underlying.upper()
        / "options"
        / "aggs_1d"
        / f"ticker={safe_ticker(ticker)}"
        / "part-000.parquet"
    )
    return part, part.with_suffix(part.suffix + ".ok")


def already_done(ok_path: Path) -> bool:
    return ok_path.is_file() and ok_path.stat().st_size > 0


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        log_dir = market_data_root() / "jobs" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        with open(log_dir / "options_campaign.log", "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def write_rows(rows: list[dict[str, Any]], path: Path) -> int:
    import pyarrow as pa
    import pyarrow.parquet as pq

    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        table = pa.table({"_empty": pa.array([], type=pa.bool_())})
        pq.write_table(table, path, compression="zstd")
        return 0
    keys: set[str] = set()
    for r in rows:
        keys.update(r.keys())
    cols: dict[str, list[Any]] = {k: [] for k in sorted(keys)}
    for r in rows:
        for k in keys:
            v = r.get(k)
            if isinstance(v, (list, dict)):
                cols[k].append(json.dumps(v, separators=(",", ":"), default=str))
            else:
                cols[k].append(v)
    pq.write_table(pa.table(cols), path, compression="zstd")
    return len(rows)


def mark_ok(ok_path: Path, meta: dict[str, Any]) -> None:
    ok_path.write_text(json.dumps(meta, indent=2, default=str) + "\n")


def load_catalog_tickers(part: Path) -> list[dict[str, Any]]:
    if not part.is_file():
        return []
    import pyarrow.parquet as pq

    table = pq.read_table(part)
    return [dict(r) for r in table.to_pylist()]


def fetch_catalog(
    client: MassiveClient,
    underlying: str,
    *,
    expired: bool,
    attempt: int = 0,
) -> list[dict[str, Any]]:
    try:
        return client.fetch_options_contracts(underlying, expired=expired)
    except (MassiveClientError, TimeoutError, OSError) as e:
        msg = str(e)
        if attempt < 5:
            wait = 60 if "429" in msg else min(45, 8 * (attempt + 1))
            log(
                f"RETRY catalog {underlying} expired={expired} "
                f"{type(e).__name__} wait={wait}s"
            )
            time.sleep(wait)
            return fetch_catalog(
                client, underlying, expired=expired, attempt=attempt + 1
            )
        raise


def fetch_contract_aggs(
    client: MassiveClient,
    ticker: str,
    start: str,
    end: str,
    *,
    attempt: int = 0,
) -> list[dict[str, Any]]:
    try:
        return client.fetch_aggs(
            ticker,
            multiplier=1,
            timespan="day",
            start=start,
            end=end,
            adjusted=True,
            limit=50000,
        )
    except (MassiveClientError, TimeoutError, OSError) as e:
        msg = str(e)
        if attempt < 5:
            wait = 60 if "429" in msg else min(45, 8 * (attempt + 1))
            log(f"RETRY aggs {ticker} {type(e).__name__} wait={wait}s")
            time.sleep(wait)
            return fetch_contract_aggs(
                client, ticker, start, end, attempt=attempt + 1
            )
        raise


def write_catalog(
    client: MassiveClient,
    root: Path,
    underlying: str,
    bucket: str,
    *,
    force: bool,
) -> dict[str, Any]:
    part, ok = catalog_paths(root, underlying, bucket)
    if already_done(ok) and not force:
        return {"status": "skip", "underlying": underlying, "bucket": bucket}
    t0 = time.time()
    log(f"FETCH catalog {underlying} {bucket}")
    rows = fetch_catalog(client, underlying, expired=(bucket == "expired"))
    n = write_rows(rows, part)
    meta = {
        "status": "ok",
        "kind": "options_contracts",
        "underlying": underlying,
        "bucket": bucket,
        "rows": n,
        "path": str(part),
        "seconds": round(time.time() - t0, 3),
        "at": datetime.now(timezone.utc).isoformat(),
    }
    mark_ok(ok, meta)
    log(f"CATALOG {underlying} {bucket} rows={n} s={meta['seconds']}")
    return meta


def write_aggs(
    client: MassiveClient,
    root: Path,
    underlying: str,
    contract: dict[str, Any],
    *,
    force: bool,
    today: date,
) -> dict[str, Any]:
    ticker = str(contract.get("ticker") or "").strip()
    if not ticker:
        return {"status": "fail", "code": "no_ticker", "underlying": underlying}
    part, ok = aggs_paths(root, underlying, ticker)
    if already_done(ok) and not force:
        return {"status": "skip", "ticker": ticker, "underlying": underlying}
    exp_raw = str(contract.get("expiration_date") or "")[:10]
    try:
        exp = date.fromisoformat(exp_raw) if exp_raw else today
    except ValueError:
        exp = today
    end = min(exp, today)
    start = OPTIONS_HISTORY_START
    t0 = time.time()
    try:
        rows = fetch_contract_aggs(client, ticker, start.isoformat(), end.isoformat())
        for row in rows:
            if isinstance(row, dict):
                row.setdefault("ticker", ticker)
                row.setdefault("underlying_ticker", underlying)
        n = write_rows(rows, part)
        meta = {
            "status": "ok",
            "kind": "options_aggs_1d",
            "underlying": underlying,
            "ticker": ticker,
            "rows": n,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "path": str(part),
            "seconds": round(time.time() - t0, 3),
            "at": datetime.now(timezone.utc).isoformat(),
        }
        mark_ok(ok, meta)
        return meta
    except Exception as e:
        meta = {
            "status": "fail",
            "kind": "options_aggs_1d",
            "underlying": underlying,
            "ticker": ticker,
            "code": "exc",
            "error": f"{type(e).__name__}: {e}"[:500],
            "trace": traceback.format_exc()[-400:],
            "at": datetime.now(timezone.utc).isoformat(),
        }
        fail = part.with_suffix(part.suffix + ".fail.json")
        fail.parent.mkdir(parents=True, exist_ok=True)
        fail.write_text(json.dumps(meta, indent=2) + "\n")
        return meta


def run_campaign(
    *,
    underlyings: list[str],
    phase: str,
    force: bool,
    pause_s: float,
) -> None:
    root = market_data_root()
    root.mkdir(parents=True, exist_ok=True)
    (root / "jobs" / "logs").mkdir(parents=True, exist_ok=True)
    (root / "state").mkdir(exist_ok=True)
    client = MassiveClient(timeout_s=90.0)
    today = datetime.now(timezone.utc).date()
    log(
        f"START options root={root} underlyings={underlyings} "
        f"phase={phase} force={force}"
    )
    state_path = root / "state" / "options_campaign_progress.jsonl"

    for underlying in underlyings:
        if phase in {"all", "catalog"}:
            for bucket in ("active", "expired"):
                meta = write_catalog(
                    client, root, underlying, bucket, force=force
                )
                with open(state_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(meta, default=str) + "\n")

        if phase not in {"all", "aggs"}:
            continue

        contracts: list[dict[str, Any]] = []
        for bucket in ("active", "expired"):
            part, ok = catalog_paths(root, underlying, bucket)
            if not already_done(ok):
                log(f"SKIP aggs {underlying} — catalog {bucket} not ready")
                continue
            contracts.extend(load_catalog_tickers(part))
        log(f"=== {underlying} options aggs_1d n_contracts={len(contracts)} ===")
        ok_n = skip_n = fail_n = 0
        for i, contract in enumerate(contracts, start=1):
            meta = write_aggs(
                client, root, underlying, contract, force=force, today=today
            )
            st = meta.get("status")
            if st == "ok":
                ok_n += 1
                if ok_n % 25 == 0 or int(meta.get("rows") or 0) > 200:
                    log(
                        f"  {underlying} {meta.get('ticker')} "
                        f"rows={meta.get('rows')} s={meta.get('seconds')}"
                    )
            elif st == "skip":
                skip_n += 1
            else:
                fail_n += 1
                log(
                    f"  FAIL {underlying} {meta.get('ticker')} "
                    f"{str(meta.get('error', ''))[:120]}"
                )
            with open(state_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(meta, default=str) + "\n")
            if st == "ok" and pause_s > 0:
                time.sleep(pause_s)
            if i % 500 == 0:
                log(
                    f"  {underlying} progress {i}/{len(contracts)} "
                    f"ok={ok_n} skip={skip_n} fail={fail_n}"
                )
        log(f"DONE {underlying} options aggs ok={ok_n} skip={skip_n} fail={fail_n}")

    log("OPTIONS CAMPAIGN COMPLETE")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="SPY + SPX options historical campaign")
    p.add_argument(
        "--underlyings",
        default=",".join(DEFAULT_UNDERLYINGS),
        help="Comma list. Default SPY,SPX,SPXW. No index volume.",
    )
    p.add_argument(
        "--phase",
        choices=("all", "catalog", "aggs"),
        default="all",
    )
    p.add_argument("--force", action="store_true")
    p.add_argument(
        "--pause-s",
        type=float,
        default=0.25,
        help="Sleep after each successful contract pull (yield to SPY volume job)",
    )
    args = p.parse_args(argv)
    underlyings = [s.strip().upper() for s in args.underlyings.split(",") if s.strip()]
    if not underlyings:
        print("no underlyings", file=sys.stderr)
        return 2
    run_campaign(
        underlyings=underlyings,
        phase=args.phase,
        force=bool(args.force),
        pause_s=max(0.0, float(args.pause_s)),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
