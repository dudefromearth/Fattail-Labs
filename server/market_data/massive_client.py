"""Massive REST client — option chain snapshots (fail loud).

Does not load Labs boot Config; uses env only when constructed so the main
API can boot without MASSIVE_API_KEY.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any


class MassiveClientError(RuntimeError):
    """Massive HTTP / config failure — map to fail-loud collector exit."""


def _require_env(name: str) -> str:
    v = (os.environ.get(name) or "").strip()
    if not v:
        raise MassiveClientError(f"Missing required environment variable: {name}")
    return v


class MassiveClient:
    """Thin urllib client — no extra deps beyond stdlib + project baseline."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_s: float = 60.0,
    ) -> None:
        self.api_key = (api_key or "").strip()
        if not self.api_key:
            self.api_key = (
                os.environ.get("MASSIVE_API_KEY") or os.environ.get("POLYGON_API_KEY") or ""
            ).strip()
        if not self.api_key:
            raise MassiveClientError(
                "Missing MASSIVE_API_KEY (or POLYGON_API_KEY fallback)"
            )
        raw_base = (base_url or os.environ.get("MASSIVE_API_BASE") or "").strip()
        self.base_url = (raw_base or "https://api.massive.com").rstrip("/")
        self.timeout_s = float(timeout_s)

    def _get_json(self, url: str) -> dict[str, Any]:
        # Prefer header auth; also support query key for older paths.
        if "apiKey=" not in url and "api_key=" not in url:
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}apiKey={urllib.parse.quote(self.api_key)}"
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "FatTail-Labs-chain-collector/1.0",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                body = resp.read().decode("utf-8")
                status = getattr(resp, "status", 200)
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")[:500]
            raise MassiveClientError(
                f"Massive HTTP {exc.code} for {url.split('?')[0]}: {err_body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise MassiveClientError(f"Massive network error: {exc}") from exc
        if status >= 400:
            raise MassiveClientError(f"Massive HTTP {status}: {body[:500]}")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as exc:
            raise MassiveClientError("Massive response was not JSON") from exc
        if not isinstance(data, dict):
            raise MassiveClientError("Massive response root must be an object")
        return data

    def fetch_option_chain(
        self,
        underlying: str,
        *,
        limit: int = 250,
        expiration_date: str | None = None,
        expiration_date_gte: str | None = None,
        expiration_date_lte: str | None = None,
        strike_price_gte: float | None = None,
        strike_price_lte: float | None = None,
        contract_type: str | None = None,
        max_pages: int = 500,
        page_pause_s: float = 0.05,
    ) -> list[dict[str, Any]]:
        """Paginate GET /v3/snapshot/options/{underlying} until exhausted.

        Massive max limit is 250 per page. Prefer strike + expiry filters for SPX.
        """
        underlying = (underlying or "").strip()
        if not underlying:
            raise MassiveClientError("underlying is required")
        if limit < 1 or limit > 250:
            raise MassiveClientError("limit must be 1..250")

        params: dict[str, str] = {"limit": str(limit), "order": "asc", "sort": "ticker"}
        if expiration_date:
            params["expiration_date"] = str(expiration_date).strip()[:10]
        if expiration_date_gte:
            params["expiration_date.gte"] = expiration_date_gte
        if expiration_date_lte:
            params["expiration_date.lte"] = expiration_date_lte
        if strike_price_gte is not None:
            params["strike_price.gte"] = str(float(strike_price_gte))
        if strike_price_lte is not None:
            params["strike_price.lte"] = str(float(strike_price_lte))
        if contract_type:
            params["contract_type"] = contract_type

        path = f"/v3/snapshot/options/{urllib.parse.quote(underlying, safe='')}"
        qs = urllib.parse.urlencode(params)
        url: str | None = f"{self.base_url}{path}?{qs}"

        results: list[dict[str, Any]] = []
        pages = 0
        while url:
            pages += 1
            if pages > max_pages:
                raise MassiveClientError(
                    f"Chain pagination exceeded max_pages={max_pages} "
                    f"({len(results)} contracts so far) — check filters"
                )
            data = self._get_json(url)
            batch = data.get("results") or []
            if not isinstance(batch, list):
                raise MassiveClientError("Massive results must be an array")
            for row in batch:
                if isinstance(row, dict):
                    results.append(row)
            next_url = data.get("next_url")
            if next_url:
                # next_url may already include apiKey from Massive; use as-is
                # if absolute, else join.
                nu = str(next_url).strip()
                if nu.startswith("http"):
                    url = nu
                else:
                    url = f"{self.base_url}{nu}"
                if page_pause_s > 0:
                    time.sleep(page_pause_s)
            else:
                url = None
        return results

    def fetch_last_trade(self, symbol: str) -> dict[str, Any]:
        """GET /v2/last/trade/{symbol} — last print for equities/ETFs."""
        symbol = (symbol or "").strip().upper()
        if not symbol:
            raise MassiveClientError("symbol required")
        path = f"/v2/last/trade/{urllib.parse.quote(symbol, safe='')}"
        return self._get_json(f"{self.base_url}{path}")

    def fetch_stock_snapshot(self, symbol: str) -> dict[str, Any]:
        """GET /v2/snapshot/locale/us/markets/stocks/tickers/{symbol}."""
        symbol = (symbol or "").strip().upper()
        if not symbol:
            raise MassiveClientError("symbol required")
        path = (
            "/v2/snapshot/locale/us/markets/stocks/tickers/"
            f"{urllib.parse.quote(symbol, safe='')}"
        )
        return self._get_json(f"{self.base_url}{path}")

    def fetch_aggs(
        self,
        symbol: str,
        *,
        multiplier: int,
        timespan: str,
        start: datetime | str,
        end: datetime | str,
        adjusted: bool = True,
        limit: int = 50000,
    ) -> list[dict[str, Any]]:
        """GET /v2/aggs/ticker/{symbol}/range/{mult}/{span}/{from}/{to}.

        Returns list of OHLC bars oldest→newest:
        ``{t: ms_epoch, o, h, l, c, v}``.
        Empty list when the provider has no results (caller fail-loud).
        """
        symbol = (symbol or "").strip().upper()
        if not symbol:
            raise MassiveClientError("symbol required")
        timespan = (timespan or "").strip().lower()
        if timespan not in ("minute", "hour", "day", "week", "month"):
            raise MassiveClientError(
                f"timespan must be minute|hour|day|week|month, got {timespan!r}"
            )
        mult = int(multiplier)
        if mult < 1 or mult > 1000:
            raise MassiveClientError("multiplier must be 1..1000")

        def _ymd(v: datetime | str) -> str:
            if isinstance(v, datetime):
                return v.astimezone(timezone.utc).date().isoformat()
            s = str(v).strip()
            if len(s) >= 10 and s[4] == "-":
                return s[:10]
            raise MassiveClientError(f"invalid date for aggs range: {v!r}")

        from_s, to_s = _ymd(start), _ymd(end)
        path = (
            f"/v2/aggs/ticker/{urllib.parse.quote(symbol, safe='')}"
            f"/range/{mult}/{timespan}/{from_s}/{to_s}"
        )
        qs = urllib.parse.urlencode(
            {
                "adjusted": "true" if adjusted else "false",
                "sort": "asc",
                "limit": str(max(1, min(50000, int(limit)))),
            }
        )
        data = self._get_json(f"{self.base_url}{path}?{qs}")
        results = data.get("results") if isinstance(data, dict) else None
        if not isinstance(results, list):
            return []
        out: list[dict[str, Any]] = []
        for row in results:
            if not isinstance(row, dict) or row.get("c") is None:
                continue
            try:
                out.append(
                    {
                        "t": int(row["t"]) if row.get("t") is not None else None,
                        "o": float(row["o"]) if row.get("o") is not None else None,
                        "h": float(row["h"]) if row.get("h") is not None else None,
                        "l": float(row["l"]) if row.get("l") is not None else None,
                        "c": float(row["c"]),
                        "v": float(row["v"]) if row.get("v") is not None else None,
                    }
                )
            except (TypeError, ValueError, KeyError):
                continue
        return [b for b in out if b.get("t") is not None]

    def fetch_daily_closes(
        self,
        symbol: str,
        *,
        days: int = 60,
    ) -> list[dict[str, Any]]:
        """Daily adjusted closes for correlation — range agg 1 day.

        Returns list of {t: YYYY-MM-DD, close: float} oldest→newest.
        """
        from datetime import date, timedelta

        symbol = (symbol or "").strip().upper()
        if not symbol:
            raise MassiveClientError("symbol required")
        days = max(5, min(500, int(days)))
        end = date.today()
        start = end - timedelta(days=days + 14)  # calendar buffer for weekends
        bars = self.fetch_aggs(
            symbol,
            multiplier=1,
            timespan="day",
            start=start.isoformat(),
            end=end.isoformat(),
        )
        out: list[dict[str, Any]] = []
        for row in bars:
            ts = row.get("t")
            day = ""
            if isinstance(ts, (int, float)):
                day = datetime.fromtimestamp(
                    float(ts) / 1000.0, tz=timezone.utc
                ).date().isoformat()
            try:
                out.append({"t": day, "close": float(row["c"])})
            except (TypeError, ValueError):
                continue
        if len(out) > days:
            out = out[-days:]
        return out

    def fetch_prev_day(self, symbol: str) -> dict[str, Any] | None:
        """GET /v2/aggs/ticker/{symbol}/prev — prior session OHLC for daily reference."""
        symbol = (symbol or "").strip().upper()
        if not symbol:
            raise MassiveClientError("symbol required")
        path = f"/v2/aggs/ticker/{urllib.parse.quote(symbol, safe='')}/prev"
        url = f"{self.base_url}{path}?{urllib.parse.urlencode({'adjusted': 'true'})}"
        try:
            data = self._get_json(url)
        except MassiveClientError:
            return None
        results = data.get("results") if isinstance(data, dict) else None
        if not isinstance(results, list) or not results:
            return None
        row = results[0]
        if not isinstance(row, dict):
            return None
        try:
            return {
                "open": float(row["o"]) if row.get("o") is not None else None,
                "high": float(row["h"]) if row.get("h") is not None else None,
                "low": float(row["l"]) if row.get("l") is not None else None,
                "close": float(row["c"]) if row.get("c") is not None else None,
                "volume": float(row["v"]) if row.get("v") is not None else None,
                "vwap": float(row["vw"]) if row.get("vw") is not None else None,
                "ts": row.get("t"),
            }
        except (TypeError, ValueError, KeyError):
            return None

    def fetch_underlier_mark(self, symbol: str) -> dict[str, Any]:
        """Best-effort mid/last for a shared-stream symbol.

        Prefers snapshot lastQuote mid, else last trade price.
        Returns {symbol, mid, bid, ask, last_trade, asof_ns, raw}.
        """
        symbol = (symbol or "").strip().upper()
        bid = ask = last = mid = None
        asof_ns = None
        raw: dict[str, Any] = {}

        try:
            snap = self.fetch_stock_snapshot(symbol)
            raw["snapshot"] = snap
            t = snap.get("ticker") if isinstance(snap, dict) else None
            if isinstance(t, dict):
                lq = t.get("lastQuote") or {}
                lt = t.get("lastTrade") or {}
                if isinstance(lq, dict):
                    # Polygon: P=ask, p=bid often; Massive may mirror
                    ask = lq.get("P") or lq.get("ask") or lq.get("a")
                    bid = lq.get("p") or lq.get("bid") or lq.get("b")
                    asof_ns = lq.get("t") or asof_ns
                if isinstance(lt, dict):
                    last = lt.get("p") or lt.get("price") or last
                    asof_ns = lt.get("t") or asof_ns
                day = t.get("day") or {}
                if isinstance(day, dict) and day.get("c"):
                    last = last or day.get("c")
        except MassiveClientError:
            pass

        if last is None and mid is None:
            trade = self.fetch_last_trade(symbol)
            raw["last_trade"] = trade
            res = trade.get("results") if isinstance(trade, dict) else None
            if isinstance(res, dict):
                last = res.get("p")
                asof_ns = res.get("t") or asof_ns

        if bid is not None and ask is not None:
            try:
                mid = (float(bid) + float(ask)) / 2.0
            except (TypeError, ValueError):
                mid = None
        if mid is None and last is not None:
            mid = float(last)
        if mid is None:
            raise MassiveClientError(f"no mid/last for {symbol}")

        return {
            "symbol": symbol,
            "mid": float(mid),
            "bid": float(bid) if bid is not None else None,
            "ask": float(ask) if ask is not None else None,
            "last_trade": float(last) if last is not None else float(mid),
            "asof_ns": asof_ns,
            "raw": raw,
        }
