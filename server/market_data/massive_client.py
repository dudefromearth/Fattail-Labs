"""Massive REST client — option chain snapshots (fail loud).

Does not load Labs boot Config; uses env only when constructed so the main
API can boot without MASSIVE_API_KEY.
"""

from __future__ import annotations

import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

import json


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
        self.api_key = (api_key or "").strip() or _require_env("MASSIVE_API_KEY")
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
        expiration_date_gte: str | None = None,
        expiration_date_lte: str | None = None,
        contract_type: str | None = None,
        max_pages: int = 500,
        page_pause_s: float = 0.05,
    ) -> list[dict[str, Any]]:
        """Paginate GET /v3/snapshot/options/{underlying} until exhausted.

        Massive max limit is 250 per page. Full SPX chains need many pages.
        """
        underlying = (underlying or "").strip()
        if not underlying:
            raise MassiveClientError("underlying is required")
        if limit < 1 or limit > 250:
            raise MassiveClientError("limit must be 1..250")

        params: dict[str, str] = {"limit": str(limit), "order": "asc", "sort": "ticker"}
        if expiration_date_gte:
            params["expiration_date.gte"] = expiration_date_gte
        if expiration_date_lte:
            params["expiration_date.lte"] = expiration_date_lte
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
