"""Tradier OAuth + Brokerage REST client (read-only).

Endpoints + flow per Tradier's own docs (see the spec §3–§5):
  authorize   GET  {api_base}/v1/oauth/authorize?client_id=&scope=read&state=
  token       POST {api_base}/v1/oauth/accesstoken   (HTTP Basic client_id:client_secret)
  profile     GET  {api_base}/v1/user/profile
  history     GET  {api_base}/v1/accounts/{id}/history?type=trade|option&page=&limit=
  gainloss    GET  {api_base}/v1/accounts/{id}/gainloss?page=&limit=

Tradier defaults to XML — every REST call sends `Accept: application/json`.
Sync httpx; the FastAPI routes are sync `def` (threadpool), so blocking I/O is fine.
"""

from __future__ import annotations

import base64
from typing import Any
from urllib.parse import urlencode

import httpx

from integrations.tradier.config import TradierConfig


class TradierError(RuntimeError):
    """Any non-2xx or malformed Tradier response (message is safe to log)."""


class TradierClient:
    def __init__(self, cfg: TradierConfig) -> None:
        self._cfg = cfg

    # --- OAuth ---------------------------------------------------------------

    def authorize_url(self, state: str) -> str:
        """The URL to 302 the member to (they log in + approve on Tradier)."""
        if not self._cfg.oauth_configured:
            raise TradierError("Tradier OAuth is not configured")
        q = urlencode(
            {
                "client_id": self._cfg.client_id,
                "scope": "read",
                "state": state,
                "redirect_uri": self._cfg.redirect_uri,
            }
        )
        return f"{self._cfg.api_base}/v1/oauth/authorize?{q}"

    def _basic_auth_header(self) -> str:
        raw = f"{self._cfg.client_id}:{self._cfg.client_secret}".encode("utf-8")
        return "Basic " + base64.b64encode(raw).decode("ascii")

    def exchange_code(self, code: str) -> dict[str, Any]:
        """Authorization code → tokens. Returns Tradier's token JSON:
        {access_token, refresh_token?, scope, expires_in, token_type}."""
        return self._token_request(
            {"grant_type": "authorization_code", "code": code}
        )

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        """Refresh an access token (only if refresh tokens are partner-enabled)."""
        return self._token_request(
            {"grant_type": "refresh_token", "refresh_token": refresh_token}
        )

    def _token_request(self, body: dict[str, str]) -> dict[str, Any]:
        if not self._cfg.oauth_configured:
            raise TradierError("Tradier OAuth is not configured")
        url = f"{self._cfg.api_base}/v1/oauth/accesstoken"
        try:
            resp = httpx.post(
                url,
                data=body,
                headers={
                    "Authorization": self._basic_auth_header(),
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=self._cfg.timeout_seconds,
            )
        except httpx.HTTPError as exc:
            raise TradierError(f"token request failed: {exc}") from exc
        if resp.status_code != 200:
            raise TradierError(
                f"token request rejected (HTTP {resp.status_code})"
            )
        try:
            return resp.json()
        except ValueError as exc:
            raise TradierError("token response was not JSON") from exc

    # --- Data (Bearer token) -------------------------------------------------

    def _get(self, access_token: str, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        url = f"{self._cfg.api_base}{path}"
        try:
            resp = httpx.get(
                url,
                params=params or {},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
                timeout=self._cfg.timeout_seconds,
            )
        except httpx.HTTPError as exc:
            raise TradierError(f"GET {path} failed: {exc}") from exc
        if resp.status_code == 401:
            raise TradierError("Tradier rejected the token (401 — reconnect needed)")
        if resp.status_code != 200:
            raise TradierError(f"GET {path} → HTTP {resp.status_code}")
        try:
            return resp.json()
        except ValueError as exc:
            raise TradierError(f"GET {path} response was not JSON") from exc

    def get_profile(self, access_token: str) -> dict[str, Any]:
        """GET /v1/user/profile → {profile:{account:[{account_number,...}] | {...}}}."""
        return self._get(access_token, "/v1/user/profile")

    def list_account_numbers(self, access_token: str) -> list[str]:
        """Account numbers from the profile (Tradier gives a single object or a list)."""
        prof = (self.get_profile(access_token) or {}).get("profile") or {}
        acct = prof.get("account")
        rows = acct if isinstance(acct, list) else [acct] if acct else []
        return [
            str(r.get("account_number"))
            for r in rows
            if isinstance(r, dict) and r.get("account_number")
        ]

    def get_history(
        self,
        access_token: str,
        account_id: str,
        *,
        type_: str = "trade",
        page: int = 1,
        limit: int = 100,
    ) -> dict[str, Any]:
        """One page of account history for a given event type ('trade' or 'option')."""
        return self._get(
            access_token,
            f"/v1/accounts/{account_id}/history",
            {"type": type_, "page": page, "limit": limit},
        )

    def iter_history_events(
        self, access_token: str, account_id: str, *, type_: str = "trade", limit: int = 100
    ) -> list[dict[str, Any]]:
        """All history events of a type across pages (history.event[])."""
        return _collect_pages(
            lambda page: self.get_history(
                access_token, account_id, type_=type_, page=page, limit=limit
            ),
            container="history",
            item_key="event",
        )

    def get_gainloss(
        self, access_token: str, account_id: str, *, page: int = 1, limit: int = 100
    ) -> dict[str, Any]:
        """One page of realized gain/loss (closed positions)."""
        return self._get(
            access_token,
            f"/v1/accounts/{account_id}/gainloss",
            {"page": page, "limit": limit},
        )

    def iter_gainloss(
        self, access_token: str, account_id: str, *, limit: int = 100
    ) -> list[dict[str, Any]]:
        """All closed positions across pages (gainloss.closed_position[])."""
        return _collect_pages(
            lambda page: self.get_gainloss(access_token, account_id, page=page, limit=limit),
            container="gainloss",
            item_key="closed_position",
        )


def _as_list(v: Any) -> list[dict[str, Any]]:
    """Tradier returns a bare object for a single item, a list for many, null for none."""
    if v is None:
        return []
    if isinstance(v, list):
        return [x for x in v if isinstance(x, dict)]
    if isinstance(v, dict):
        return [v]
    return []


def _collect_pages(fetch, *, container: str, item_key: str, max_pages: int = 200) -> list[dict[str, Any]]:
    """Walk Tradier's page/total_pages envelope, flattening item_key from each page."""
    out: list[dict[str, Any]] = []
    page = 1
    while page <= max_pages:
        payload = fetch(page) or {}
        node = payload.get(container)
        # Tradier returns the string "null" (or a null node) when there are no rows.
        if not isinstance(node, dict):
            break
        out.extend(_as_list(node.get(item_key)))
        try:
            total = int(node.get("total_pages") or 1)
        except (TypeError, ValueError):
            total = 1
        if page >= total:
            break
        page += 1
    return out
