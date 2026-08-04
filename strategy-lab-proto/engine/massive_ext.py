"""Massive REST helpers for Strategy Lab prototype (extends Labs client patterns)."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any


def _server_on_path() -> None:
    """Allow import of market_data.MassiveClient when run from strategy-lab-proto."""
    here = Path(__file__).resolve()
    server = here.parents[2] / "server"
    if server.is_dir() and str(server) not in sys.path:
        sys.path.insert(0, str(server))


_server_on_path()

try:
    from market_data.massive_client import MassiveClient, MassiveClientError
except ImportError:  # standalone fallback

    class MassiveClientError(RuntimeError):
        pass

    class MassiveClient:  # type: ignore[no-redef]
        def __init__(self, *, api_key: str | None = None, base_url: str | None = None, timeout_s: float = 60.0):
            self.api_key = (api_key or os.environ.get("MASSIVE_API_KEY") or "").strip()
            if not self.api_key:
                raise MassiveClientError("Missing MASSIVE_API_KEY")
            self.base_url = (base_url or os.environ.get("MASSIVE_API_BASE") or "https://api.massive.com").rstrip("/")
            self.timeout_s = timeout_s

        def _get_json(self, url: str) -> dict[str, Any]:
            if "apiKey=" not in url:
                sep = "&" if "?" in url else "?"
                url = f"{url}{sep}apiKey={urllib.parse.quote(self.api_key)}"
            req = urllib.request.Request(
                url,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "FatTail-StrategyLab-Proto/0.1",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="GET",
            )
            try:
                with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                    body = resp.read().decode("utf-8")
            except urllib.error.HTTPError as exc:
                err = exc.read().decode("utf-8", errors="replace")[:500]
                raise MassiveClientError(f"Massive HTTP {exc.code}: {err}") from exc
            data = json.loads(body)
            if not isinstance(data, dict):
                raise MassiveClientError("Massive root must be object")
            return data

        def fetch_option_chain(self, underlying: str, **kwargs: Any) -> list[dict[str, Any]]:
            raise MassiveClientError("Chain snapshot requires full Labs MassiveClient")


# Known FOMC decision days (extend as needed). Basic skip list for prototype.
FOMC_DATES: set[str] = {
    "2024-01-31",
    "2024-03-20",
    "2024-05-01",
    "2024-06-12",
    "2024-07-31",
    "2024-09-18",
    "2024-11-07",
    "2024-12-18",
    "2025-01-29",
    "2025-03-19",
    "2025-05-07",
    "2025-06-18",
    "2025-07-30",
    "2025-09-17",
    "2025-10-29",
    "2025-12-10",
    "2026-01-28",
    "2026-03-18",
    "2026-04-29",
    "2026-06-17",
    "2026-07-29",
}


class MassiveLabClient:
    """Prototype data access: bars, contracts, option day aggs, live chain."""

    def __init__(self, client: MassiveClient | None = None) -> None:
        self.client = client or MassiveClient()
        self._cache: dict[str, Any] = {}

    @property
    def base_url(self) -> str:
        return self.client.base_url

    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        params = {k: v for k, v in (params or {}).items() if v is not None}
        qs = urllib.parse.urlencode(params, doseq=True)
        url = f"{self.base_url}{path}"
        if qs:
            url = f"{url}?{qs}"
        return self.client._get_json(url)  # noqa: SLF001 — shared thin client

    def _get_all_results(self, path: str, params: dict[str, Any], *, max_pages: int = 20) -> list[dict[str, Any]]:
        params = dict(params)
        params.setdefault("limit", 1000)
        qs = urllib.parse.urlencode(params)
        url: str | None = f"{self.base_url}{path}?{qs}"
        out: list[dict[str, Any]] = []
        pages = 0
        while url:
            pages += 1
            if pages > max_pages:
                break
            data = self.client._get_json(url)  # noqa: SLF001
            batch = data.get("results") or []
            if isinstance(batch, list):
                for row in batch:
                    if isinstance(row, dict):
                        out.append(row)
            nxt = data.get("next_url")
            if not nxt:
                break
            nu = str(nxt)
            url = nu if nu.startswith("http") else f"{self.base_url}{nu}"
            time.sleep(0.05)
        return out

    def stock_daily_bars(self, ticker: str, start: str, end: str) -> list[dict[str, Any]]:
        """Daily OHLCV for underlying. start/end YYYY-MM-DD."""
        key = f"bars:{ticker}:{start}:{end}"
        if key in self._cache:
            return self._cache[key]
        path = f"/v2/aggs/ticker/{urllib.parse.quote(ticker)}/range/1/day/{start}/{end}"
        data = self._get(path, {"adjusted": "true", "sort": "asc", "limit": 50000})
        rows = data.get("results") or []
        out: list[dict[str, Any]] = []
        for r in rows:
            if not isinstance(r, dict) or "t" not in r:
                continue
            ts = int(r["t"])
            d = datetime.utcfromtimestamp(ts / 1000.0).date().isoformat()
            out.append(
                {
                    "date": d,
                    "o": float(r.get("o") or 0),
                    "h": float(r.get("h") or 0),
                    "l": float(r.get("l") or 0),
                    "c": float(r.get("c") or 0),
                    "v": float(r.get("v") or 0),
                    "t": ts,
                }
            )
        self._cache[key] = out
        return out

    def list_option_contracts(
        self,
        underlying: str,
        *,
        expiration_date: str,
        contract_type: str | None = None,
        expired: bool = True,
    ) -> list[dict[str, Any]]:
        """Reference contracts for a single expiry (0DTE = expiration == session day)."""
        key = f"contracts:{underlying}:{expiration_date}:{contract_type}:{expired}"
        if key in self._cache:
            return self._cache[key]
        params: dict[str, Any] = {
            "underlying_ticker": underlying,
            "expiration_date": expiration_date,
            "limit": 1000,
            "sort": "strike_price",
            "order": "asc",
        }
        if contract_type:
            params["contract_type"] = contract_type
        # Massive/Polygon: expired=true for past 0DTE
        if expired:
            params["expired"] = "true"
        rows = self._get_all_results("/v3/reference/options/contracts", params)
        self._cache[key] = rows
        return rows

    def option_day_bar(self, options_ticker: str, day: str) -> dict[str, Any] | None:
        """Single-day OHLC for an option contract."""
        key = f"obar:{options_ticker}:{day}"
        if key in self._cache:
            return self._cache[key]
        path = (
            f"/v2/aggs/ticker/{urllib.parse.quote(options_ticker, safe='')}"
            f"/range/1/day/{day}/{day}"
        )
        try:
            data = self._get(path, {"adjusted": "true", "limit": 5})
        except MassiveClientError:
            self._cache[key] = None
            return None
        rows = data.get("results") or []
        if not rows:
            self._cache[key] = None
            return None
        r = rows[0]
        bar = {
            "o": float(r.get("o") or 0),
            "h": float(r.get("h") or 0),
            "l": float(r.get("l") or 0),
            "c": float(r.get("c") or 0),
            "v": float(r.get("v") or 0),
            "source": "day",
        }
        self._cache[key] = bar
        return bar

    def _minute_bars(self, ticker: str, day: str) -> list[dict[str, Any]]:
        """All 1-minute bars for a calendar day (ET session)."""
        key = f"min1:{ticker}:{day}"
        if key in self._cache:
            return self._cache[key]
        path = (
            f"/v2/aggs/ticker/{urllib.parse.quote(ticker, safe='')}"
            f"/range/1/minute/{day}/{day}"
        )
        try:
            data = self._get(path, {"adjusted": "true", "sort": "asc", "limit": 50000})
        except MassiveClientError:
            self._cache[key] = []
            return []
        rows = data.get("results") or []
        out: list[dict[str, Any]] = []
        for r in rows:
            if not isinstance(r, dict) or "t" not in r:
                continue
            ts = int(r["t"])
            out.append(
                {
                    "o": float(r.get("o") or 0),
                    "h": float(r.get("h") or 0),
                    "l": float(r.get("l") or 0),
                    "c": float(r.get("c") or 0),
                    "v": float(r.get("v") or 0),
                    "t": ts,
                    "source": "minute",
                }
            )
        self._cache[key] = out
        return out

    def bar_at_et(
        self,
        ticker: str,
        day: str,
        hhmm_et: str,
        *,
        prefer: str = "close",
    ) -> dict[str, Any] | None:
        """Nearest 1-minute bar at/after ET clock; None if no minute data.

        prefer: 'close' uses bar close as fill mid; 'open' uses bar open.
        """
        from engine.sessions import et_to_utc_ms

        target = et_to_utc_ms(day, hhmm_et)
        mins = self._minute_bars(ticker, day)
        if not mins:
            return None
        # Prefer first bar at or after target; else last bar before
        after = [b for b in mins if b["t"] >= target]
        if after:
            b = after[0]
        else:
            before = [b for b in mins if b["t"] < target]
            if not before:
                return None
            b = before[-1]
        px = float(b["c"] if prefer == "close" else b["o"])
        if px <= 0:
            px = float(b["c"] or b["o"] or 0)
        return {
            "o": float(b["o"]),
            "h": float(b["h"]),
            "l": float(b["l"]),
            "c": float(b["c"]),
            "v": float(b["v"]),
            "t": int(b["t"]),
            "fill": px,
            "source": "minute",
            "hhmm_et": hhmm_et,
        }

    def option_fill_bar(
        self,
        options_ticker: str,
        day: str,
        hhmm_et: str,
    ) -> dict[str, Any] | None:
        """Option fill at session time: minute bar preferred, else None (caller may skip)."""
        return self.bar_at_et(options_ticker, day, hhmm_et, prefer="close")

    def underlying_fill_price(
        self,
        ticker: str,
        day: str,
        hhmm_et: str,
        daily: dict[str, Any] | None = None,
    ) -> tuple[float, str]:
        """Return (price, source). Minute preferred; day open/close fallback labeled."""
        m = self.bar_at_et(ticker, day, hhmm_et, prefer="close")
        if m and m.get("fill", 0) > 0:
            return float(m["fill"]), "minute"
        if daily:
            # Fallback by session clock family (honest label)
            h = int(hhmm_et.split(":")[0])
            if h < 12:
                px = float(daily.get("o") or 0)
                return px, "day_open_fallback"
            if h >= 15:
                px = float(daily.get("c") or 0)
                return px, "day_close_fallback"
            # afternoon: mid of day range as last resort
            o, c = float(daily.get("o") or 0), float(daily.get("c") or 0)
            if o > 0 and c > 0:
                return (o + c) / 2.0, "day_mid_fallback"
            return c or o, "day_fallback"
        return 0.0, "missing"

    def live_chain_0dte(self, underlying: str) -> list[dict[str, Any]]:
        today = date.today().isoformat()
        return self.client.fetch_option_chain(
            underlying,
            expiration_date_gte=today,
            expiration_date_lte=today,
            limit=250,
            max_pages=20,
        )

    def ping(self) -> dict[str, Any]:
        """Cheap connectivity check."""
        data = self._get("/v2/aggs/ticker/SPY/range/1/day/2024-01-02/2024-01-05", {"limit": 5})
        n = len(data.get("results") or [])
        return {"ok": True, "spy_sample_bars": n, "base": self.base_url}


def default_date_window(days: int = 45) -> tuple[str, str]:
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=days + 20)  # pad for weekends
    return start.isoformat(), end.isoformat()
