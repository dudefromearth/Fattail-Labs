"""Tradier brokerage integration routes (read-only sync into the Trade Log).

Spec: Specs/FatTail-Labs-Tradier-Integration-Spec-v0.1.md

FAIL-CLOSED: every acting endpoint requires config.is_enabled (partner OAuth creds +
token encryption key). Until those are set in the API env the feature is inert — the
status endpoint reports available:false (so the UI hides the button) and connect/
callback/sync return 404. Read-only scope only; we never place trades or see a password.
"""

from __future__ import annotations

import secrets
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

import db
from config import get_config
from guards import require_session
from integrations.tradier import token_crypto
from integrations.tradier.client import TradierClient, TradierError
from integrations.tradier.config import get_tradier_config
from routes.trade_log.commit import commit_trades
from routes.trade_log.common import (
    _ensure_default_account,
    _get_account,
    _require_tool_member,
    _storage_identity_id,
)

router = APIRouter(tags=["integrations", "tradier"])

_STATE_COOKIE = "ft_tradier_state"
_PROVIDER = "tradier"


def _require_enabled() -> None:
    if not get_tradier_config().is_enabled:
        # 404, not 403: when unconfigured the capability simply does not exist.
        raise HTTPException(status_code=404, detail="Tradier integration is not enabled")


def _trade_log_url() -> str:
    origin = (get_config().web_origin or "").rstrip("/")
    return f"{origin}/app/trade-log" if origin else "/app/trade-log"


def _connection_row(cur: Any, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_broker_connections
           WHERE identity_id = %s AND provider = %s""",
        (identity_id, _PROVIDER),
    )
    return cur.fetchone()


# --- Status (safe when disabled) --------------------------------------------

@router.get("/api/me/integrations/tradier")
def tradier_status(request: Request) -> dict:
    """Connection status for the UI. Never errors on disabled — reports availability."""
    claims = require_session(request)
    _require_tool_member(claims)
    cfg = get_tradier_config()
    if not cfg.is_enabled:
        return {"available": False, "connected": False, "missing": cfg.missing()}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            row = _connection_row(cur, iid)
    if not row or row.get("status") != "connected":
        return {"available": True, "connected": False}
    return {
        "available": True,
        "connected": True,
        "broker_account_id": row.get("broker_account_id"),
        "last_synced_at": row.get("last_synced_at"),
        "last_sync_count": row.get("last_sync_count"),
        "status": row.get("status"),
    }


# --- OAuth connect -----------------------------------------------------------

@router.get("/api/me/integrations/tradier/connect")
def tradier_connect(request: Request) -> RedirectResponse:
    """302 to Tradier's authorize page; stash a CSRF state in an HttpOnly cookie."""
    _require_enabled()
    claims = require_session(request)
    _require_tool_member(claims)
    state = secrets.token_urlsafe(24)
    client = TradierClient(get_tradier_config())
    resp = RedirectResponse(url=client.authorize_url(state), status_code=302)
    resp.set_cookie(
        _STATE_COOKIE,
        state,
        max_age=600,  # authorization codes expire in 10 min
        httponly=True,
        secure=True,
        samesite="lax",
        domain=get_config().cookie_domain or None,
    )
    return resp


# --- OAuth callback ----------------------------------------------------------

@router.get("/api/integrations/tradier/callback")
def tradier_callback(request: Request, code: str = "", state: str = "") -> RedirectResponse:
    """Verify state, exchange code for tokens, store them encrypted."""
    _require_enabled()
    claims = require_session(request)
    _require_tool_member(claims)

    expected = request.cookies.get(_STATE_COOKIE) or ""
    if not state or not expected or not secrets.compare_digest(state, expected):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    if not token_crypto.is_available():
        raise HTTPException(status_code=500, detail="Token encryption is unavailable")

    client = TradierClient(get_tradier_config())
    try:
        tok = client.exchange_code(code)
    except TradierError as exc:
        raise HTTPException(status_code=502, detail=f"Tradier token exchange failed: {exc}") from exc

    access = tok.get("access_token")
    if not access:
        raise HTTPException(status_code=502, detail="Tradier did not return an access token")
    refresh = tok.get("refresh_token")
    scope = tok.get("scope")
    expires_in = tok.get("expires_in")

    # Best-effort: pre-select the account if there's exactly one.
    broker_account_id = None
    try:
        accounts = client.list_account_numbers(access)
        if len(accounts) == 1:
            broker_account_id = accounts[0]
    except TradierError:
        pass

    access_enc = token_crypto.encrypt(access)
    refresh_enc = token_crypto.encrypt(refresh) if refresh else None

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """INSERT INTO member_broker_connections
                     (identity_id, provider, broker_account_id, access_token_enc,
                      refresh_token_enc, token_expires_at, scope, status)
                   VALUES (%s, %s, %s, %s, %s,
                           DATE_ADD(NOW(), INTERVAL %s SECOND), %s, 'connected')
                   ON DUPLICATE KEY UPDATE
                     broker_account_id = COALESCE(VALUES(broker_account_id), broker_account_id),
                     access_token_enc  = VALUES(access_token_enc),
                     refresh_token_enc = VALUES(refresh_token_enc),
                     token_expires_at  = VALUES(token_expires_at),
                     scope             = VALUES(scope),
                     status            = 'connected',
                     last_error        = NULL,
                     connected_at      = NOW()""",
                (
                    iid,
                    _PROVIDER,
                    broker_account_id,
                    access_enc,
                    refresh_enc,
                    int(expires_in) if str(expires_in or "").isdigit() else 86400,
                    str(scope)[:120] if scope else None,
                ),
            )

    resp = RedirectResponse(url=f"{_trade_log_url()}?tradier=connected", status_code=302)
    resp.delete_cookie(_STATE_COOKIE, domain=get_config().cookie_domain or None)
    return resp


# --- Sync --------------------------------------------------------------------

@router.post("/api/me/integrations/tradier/sync")
async def tradier_sync(request: Request) -> dict:
    """Pull history + gainloss, transform, commit as one import batch (idempotent)."""
    _require_enabled()
    claims = require_session(request)
    _require_tool_member(claims)
    from integrations.tradier import transform as tfm

    body = await request.json()
    account_id = body.get("account_id")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            row = _connection_row(cur, iid)
            if not row or row.get("status") != "connected":
                raise HTTPException(status_code=409, detail="Tradier is not connected")
            access = token_crypto.decrypt(row.get("access_token_enc"))
            if not access:
                raise HTTPException(status_code=409, detail="Stored Tradier token is unreadable")
            broker_account = row.get("broker_account_id")

            # Resolve the Trade Log account to import into.
            if account_id is None:
                acct = _ensure_default_account(cur, iid)
                account_id = int(acct["id"])
            else:
                _get_account(cur, iid, int(account_id))
                account_id = int(account_id)

            client = TradierClient(get_tradier_config())
            try:
                if not broker_account:
                    accts = client.list_account_numbers(access)
                    if not accts:
                        raise HTTPException(status_code=409, detail="No Tradier account found")
                    broker_account = accts[0]
                    cur.execute(
                        """UPDATE member_broker_connections SET broker_account_id = %s
                           WHERE identity_id = %s AND provider = %s""",
                        (broker_account, iid, _PROVIDER),
                    )
                trade_events = client.iter_history_events(access, broker_account, type_="trade")
                option_events = client.iter_history_events(access, broker_account, type_="option")
                closed = client.iter_gainloss(access, broker_account)
            except TradierError as exc:
                cur.execute(
                    """UPDATE member_broker_connections
                          SET status = 'error', last_error = %s
                        WHERE identity_id = %s AND provider = %s""",
                    (str(exc)[:255], iid, _PROVIDER),
                )
                raise HTTPException(status_code=502, detail=f"Tradier sync failed: {exc}") from exc

            result = tfm.transform(
                account_id=str(broker_account),
                trade_events=trade_events,
                option_events=option_events,
                closed_positions=closed,
            )
            trades = result["trades"]
            committed = commit_trades(
                cur,
                iid,
                account_id,
                tfm.ADAPTER_ID,
                trades,
                source_filename=None,
                label=f"Tradier sync · {broker_account}",
            )
            cur.execute(
                """UPDATE member_broker_connections
                      SET last_synced_at = NOW(), last_sync_count = %s,
                          status = 'connected', last_error = NULL
                    WHERE identity_id = %s AND provider = %s""",
                (committed["created"], iid, _PROVIDER),
            )

    return {
        "ok": True,
        "account_id": account_id,
        "import_id": committed["import_id"],
        "created": committed["created"],
        "skipped": committed["skipped"],
        "warnings": result.get("warnings") or [],
    }


# --- Disconnect --------------------------------------------------------------

@router.delete("/api/me/integrations/tradier")
def tradier_disconnect(request: Request) -> dict:
    """Clear tokens + mark revoked. Imported trades stay (they're normal batches)."""
    _require_enabled()
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """UPDATE member_broker_connections
                      SET status = 'revoked', access_token_enc = NULL,
                          refresh_token_enc = NULL, token_expires_at = NULL
                    WHERE identity_id = %s AND provider = %s""",
                (iid, _PROVIDER),
            )
    return {"ok": True, "connected": False}
