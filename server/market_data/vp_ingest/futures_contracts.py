"""Front + next contract from Massive futures contracts API. No hardcoded months.

Live HTTP is StudioOne-only. Tests inject results.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
import re
from datetime import date
from typing import Any, Callable

PRODUCTS = ("ES", "MES")
ROLL_DAYS = 8  # subscribe next when front is inside this many days of last trade
# Outright month codes only — no calendar spreads (MESH5-MESZ5).
_OUTRIGHT = re.compile(r"^(ES|MES)[FGHJKMNQUVXZ]\d{1,2}$")


def product_of_ticker(ticker: str) -> str | None:
    t = (ticker or "").upper()
    if t.startswith("MES"):
        return "MES"
    if t.startswith("ES"):
        return "ES"
    return None


def pick_roll_set(
    contracts: list[dict[str, Any]],
    *,
    as_of: date | None = None,
    roll_days: int = ROLL_DAYS,
) -> list[str]:
    """Every *active* ES/MES ticker from reference data (roll week ⇒ both listed)."""
    chosen: list[str] = []
    for c in contracts:
        ticker = str(c.get("ticker") or "").upper()
        if not ticker:
            continue
        product = str(
            c.get("product_code") or product_of_ticker(ticker) or ""
        ).upper()
        if product not in PRODUCTS:
            continue
        if not _OUTRIGHT.match(ticker):
            continue
        ltd = str(c.get("last_trade_date") or "")[:10]
        if as_of and ltd and ltd < as_of.isoformat():
            continue
        if ticker not in chosen:
            chosen.append(ticker)
    # Front + next per product (nearest last_trade_date first).
    by_p: dict[str, list[tuple[str, str]]] = {p: [] for p in PRODUCTS}
    # Re-walk contracts for sort keys
    meta = {str(c.get("ticker") or "").upper(): str(c.get("last_trade_date") or "9999-12-31")[:10] for c in contracts}
    for t in chosen:
        p = product_of_ticker(t)
        if p:
            by_p[p].append((meta.get(t, "9999-12-31"), t))
    out: list[str] = []
    for p in PRODUCTS:
        rows = sorted(by_p[p], key=lambda x: x[0])
        for _ltd, t in rows[:2]:
            if t not in out:
                out.append(t)
    return out


def fetch_active_contracts(
    *,
    get_json: Callable[[str], dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """GET /futures/v1/contracts?product_code=&active=true. Inject get_json in tests."""
    if get_json is None:
        get_json = _http_get_json
    rows: list[dict[str, Any]] = []
    for product in PRODUCTS:
        today = date.today().isoformat()
        url = (
            f"/futures/v1/contracts?product_code={urllib.parse.quote(product)}"
            f"&active=true&type=single&limit=50&date={today}"
        )
        for _ in range(12):
            data = get_json(url)
            results = data.get("results") if isinstance(data, dict) else None
            if isinstance(results, list):
                for r in results:
                    if isinstance(r, dict):
                        r.setdefault("product_code", product)
                        rows.append(r)
            nxt = data.get("next_url") if isinstance(data, dict) else None
            if not nxt:
                break
            url = str(nxt)
    return rows


def _http_get_json(path: str) -> dict[str, Any]:
    key = (os.environ.get("MASSIVE_API_KEY") or os.environ.get("POLYGON_API_KEY") or "").strip()
    if not key:
        raise RuntimeError("MASSIVE_API_KEY required for futures contracts")
    base = (os.environ.get("MASSIVE_API_BASE") or "https://api.massive.com").rstrip("/")
    if path.startswith("http"):
        url = path
        if "apiKey=" not in url:
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}apiKey={urllib.parse.quote(key)}"
    else:
        url = f"{base}{path}"
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}apiKey={urllib.parse.quote(key)}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {key}",
            "User-Agent": "FatTail-Labs-vp-futures/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))
