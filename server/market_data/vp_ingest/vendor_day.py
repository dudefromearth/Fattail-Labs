"""Date-addressed vendor day files for VP backfill.

Primary path: Massive REST (per-symbol day). Flat-file S3 is the bulk
endpoint Coach named — attempted when MASSIVE_S3_ACCESS_KEY_ID is set.
No S3 keys in Labs env today: named blocker, REST used.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from datetime import date
from pathlib import Path
from typing import Any, Iterable

from market_data.vp_ingest.conditions import annotate
from market_data.vp_ingest.futures_contracts import (
    PRODUCTS,
    fetch_active_contracts,
    pick_roll_set,
    product_of_ticker,
)
from market_data.vp_ingest.store import prints_path


FLAT_ENDPOINT = "https://files.massive.com"
FLAT_BUCKET = "flatfiles"
STOCKS_TRADES_PREFIX = "us_stocks_sip/trades_v1"
CME_TRADES_PREFIX = "us_futures_cme/trades_v1"


def flat_files_blocker() -> str | None:
    key = (os.environ.get("MASSIVE_S3_ACCESS_KEY_ID") or os.environ.get("AWS_ACCESS_KEY_ID") or "").strip()
    secret = (
        os.environ.get("MASSIVE_S3_SECRET_ACCESS_KEY") or os.environ.get("AWS_SECRET_ACCESS_KEY") or ""
    ).strip()
    if not key or not secret:
        return (
            "flat-files S3 not configured: MASSIVE_S3_ACCESS_KEY_ID / "
            "MASSIVE_S3_SECRET_ACCESS_KEY absent (Massive File Browser keys, "
            "not POLYGON_API_KEY). Date-addressed REST /v3/trades and "
            "/futures/v1/trades are the entitled path."
        )
    return None


def stocks_flat_key(day: date) -> str:
    return f"{STOCKS_TRADES_PREFIX}/{day.year:04d}/{day.month:02d}/{day.isoformat()}.csv.gz"


def cme_flat_key(day: date) -> str:
    return f"{CME_TRADES_PREFIX}/{day.year:04d}/{day.month:02d}/{day.isoformat()}.csv.gz"


def rest_stock_to_rec(row: dict[str, Any], *, symbol: str) -> dict[str, Any]:
    """Map Massive /v3/trades row to the live WS print record."""
    sip = int(row.get("sip_timestamp") or row.get("participant_timestamp") or 0)
    pt = int(row.get("participant_timestamp") or 0)
    # Live WS stores t in ms. sip is ns.
    t_ms = sip // 1_000_000 if sip >= 10**15 else sip
    pt_ms = pt // 1_000_000 if pt >= 10**15 else (pt or None)
    cond = row.get("conditions") or row.get("c") or []
    if not isinstance(cond, list):
        cond = [cond] if cond is not None else []
    cond_ids = [int(x) for x in cond if x is not None]
    labels = annotate(cond_ids)
    size = row.get("size") if row.get("size") is not None else row.get("s")
    rec = {
        "sym": symbol.upper(),
        "p": row.get("price") if row.get("price") is not None else row.get("p"),
        "s": size,
        "ds": str(size) if size is not None else None,
        "x": row.get("exchange") if row.get("exchange") is not None else row.get("x"),
        "c": cond_ids,
        "t": t_ms,
        "pt": pt_ms,
        "q": row.get("sequence_number"),
        "i": str(row.get("id") or "") or None,
        "auction": bool(labels["auction"]),
        "oddlot": bool(labels["oddlot"]),
        "unknown_condition_ids": labels["unknown_condition_ids"],
        "vendor": "massive_rest_v3_trades",
    }
    return rec


def rest_futures_to_rec(row: dict[str, Any]) -> dict[str, Any] | None:
    ticker = str(row.get("ticker") or row.get("sym") or "").upper()
    product = product_of_ticker(ticker)
    if product not in PRODUCTS:
        return None
    ts = row.get("timestamp") if row.get("timestamp") is not None else row.get("t")
    rec: dict[str, Any] = {
        "sym": product,
        "contract": ticker,
        "p": row.get("price") if row.get("price") is not None else row.get("p"),
        "s": row.get("size") if row.get("size") is not None else row.get("s"),
        "t": ts,
        "vendor": "massive_rest_futures_v1_trades",
    }
    sed = row.get("session_end_date")
    if sed:
        rec["session_end_date"] = str(sed)[:10]
    if row.get("sequence_number") is not None:
        rec["q"] = row.get("sequence_number")
    return rec


def manifest_path(root: Path, source: str, day: date) -> Path:
    return prints_path(root, source, day).with_name("manifest.json")


def load_manifest(root: Path, source: str, day: date) -> dict[str, Any] | None:
    path = manifest_path(root, source, day)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_day_prints(
    root: Path,
    source: str,
    day: date,
    recs: Iterable[dict[str, Any]],
    *,
    vendor: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Atomic gzip jsonl + manifest. Resumable callers skip when complete."""
    path = prints_path(root, source, day)
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(path.name + ".part")
    n = 0
    with gzip.open(part, "wt", encoding="utf-8") as fh:
        for rec in recs:
            fh.write(json.dumps(rec, separators=(",", ":"), ensure_ascii=True) + "\n")
            n += 1
    part.replace(path)
    man = {
        "source": source.upper(),
        "session": day.isoformat(),
        "vendor": vendor,
        "count": n,
        "sha256": sha256_file(path),
        "bytes": path.stat().st_size,
        "complete": True,
        "flat_files_blocker": flat_files_blocker(),
        **(extra or {}),
    }
    manifest_path(root, source, day).write_text(
        json.dumps(man, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return man


def already_complete(root: Path, source: str, day: date) -> bool:
    man = load_manifest(root, source, day)
    path = prints_path(root, source, day)
    return bool(man and man.get("complete") and path.is_file() and int(man.get("count") or 0) > 0)


def fetch_spy_day(day: date, *, client: Any | None = None) -> list[dict[str, Any]]:
    from market_data.massive_client import MassiveClient

    c = client or MassiveClient()
    rows = c.fetch_trades_day("SPY", day.isoformat())
    return [rest_stock_to_rec(r, symbol="SPY") for r in rows if isinstance(r, dict)]


def fetch_futures_product_day(
    product: str,
    day: date,
    *,
    client: Any | None = None,
    get_json: Any | None = None,
) -> list[dict[str, Any]]:
    from market_data.massive_client import MassiveClient

    c = client or MassiveClient()
    product = product.upper()
    contracts = fetch_active_contracts(get_json=get_json)
    tickers = [
        t
        for t in pick_roll_set(contracts, as_of=day)
        if product_of_ticker(t) == product
    ]
    if not tickers:
        # still query front-style product codes if roll set empty
        tickers = [t for t in pick_roll_set(contracts, as_of=None) if product_of_ticker(t) == product]
    out: list[dict[str, Any]] = []
    seen: set[tuple[Any, Any, Any]] = set()
    for ticker in tickers:
        rows = c.fetch_futures_trades_session(ticker, day.isoformat())
        for r in rows:
            rec = rest_futures_to_rec(r)
            if rec is None:
                continue
            rec["session_end_date"] = day.isoformat()
            key = (rec.get("contract"), rec.get("t"), rec.get("q"))
            if key in seen:
                continue
            seen.add(key)
            out.append(rec)
    out.sort(key=lambda r: (int(r.get("t") or 0), str(r.get("contract") or "")))
    return out
