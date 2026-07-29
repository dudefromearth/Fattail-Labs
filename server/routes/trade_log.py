"""Trade Log v1.1 — multi-leg blotter, accounts (broker|sim), Family B isolation.

Spec: FatTail-Labs-Trade-Log-Spec-v1.1 · Pass 1 (P1).
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import APIRouter, HTTPException, Request

import auth
import db
import trade_log_catalog as cat
from guards import require_session

router = APIRouter(tags=["trade-log"])


def _require_tool_member(claims: dict) -> None:
    role = claims["role"]
    if not (
        auth.role_at_least(role, "activator")
        or auth.role_at_least(role, "administrator")
    ):
        raise HTTPException(
            status_code=403,
            detail="Trade Log requires Activator membership or higher",
        )


def _storage_identity_id(cur, claims: dict) -> int:
    iid = int(claims["identity_id"])
    if iid != 0:
        cur.execute(
            "SELECT identity_id FROM identities WHERE identity_id = %s",
            (iid,),
        )
        if cur.fetchone() is None:
            raise HTTPException(
                status_code=400,
                detail="Identity not found — re-login or recreate account",
            )
        return iid
    cur.execute(
        """SELECT identity_id FROM identities
           WHERE email IN ('ernie@fattail.ai', 'coach@fattail.ai', 'dev-admin@labs.local')
              OR role_override = 'administrator'
           ORDER BY CASE email
             WHEN 'ernie@fattail.ai' THEN 0
             WHEN 'coach@fattail.ai' THEN 1
             WHEN 'dev-admin@labs.local' THEN 2
             ELSE 9 END, identity_id
           LIMIT 1"""
    )
    row = cur.fetchone()
    if row:
        return int(row["identity_id"])
    cur.execute(
        """INSERT INTO identities (email, display_name, role_override)
           VALUES ('dev-admin@labs.local', 'Labs Dev Admin', 'administrator')"""
    )
    return int(cur.lastrowid)


def _dec(v: Any) -> Decimal | None:
    if v is None or v == "":
        return None
    try:
        return Decimal(str(v))
    except (InvalidOperation, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"invalid number: {v!r}") from exc


def _parse_exec_at(raw: Any) -> datetime:
    if raw is None or raw == "":
        return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)
    if isinstance(raw, datetime):
        return raw.replace(microsecond=0)
    s = str(raw).strip().replace("Z", "")
    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(s[:19] if "T" in s or " " in s else s[:10], fmt)
            if fmt == "%Y-%m-%d":
                return dt.replace(hour=12, minute=0, second=0)
            return dt
        except ValueError:
            continue
    raise HTTPException(status_code=422, detail=f"invalid exec_at: {raw!r}")


def _account_row(r: dict) -> dict:
    return {
        "id": r["id"],
        "label": r["label"],
        "broker": r["broker"],
        "broker_label": r.get("broker_label"),
        "currency": r.get("currency") or "USD",
        "status": r["status"],
        "badge_color": r.get("badge_color"),
        "sort_order": r.get("sort_order") or 0,
        "notes_md": r.get("notes_md") or "",
        "venue_kind": cat.venue_kind(r["broker"]),
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        "updated_at": r["updated_at"].isoformat() if r.get("updated_at") else None,
    }


def _leg_row(r: dict) -> dict:
    return {
        "id": r["id"],
        "leg_index": r["leg_index"],
        "side": r["side"],
        "quantity": int(r["quantity"]),
        "pos_effect": r.get("pos_effect"),
        "asset_class": r.get("asset_class") or "equity_option",
        "underlier": r.get("underlier"),
        "symbol": r.get("symbol"),
        "expiry": r["expiry"].isoformat() if r.get("expiry") else None,
        "strike": float(r["strike"]) if r.get("strike") is not None else None,
        "right": r.get("option_right"),
        "multiplier": r.get("multiplier"),
        "fill_price": float(r["fill_price"]) if r.get("fill_price") is not None else 0,
        "fees": float(r["fees"]) if r.get("fees") is not None else None,
    }


def _trade_row(r: dict, legs: list[dict] | None = None) -> dict:
    return {
        "id": r["id"],
        "account_id": r["account_id"],
        "exec_at": r["exec_at"].isoformat(sep="T") if r.get("exec_at") else None,
        "asset_class": r.get("asset_class") or "equity_option",
        "strategy": r["strategy"],
        "order_type": r.get("order_type") or "LMT",
        "net_price": float(r["net_price"]) if r.get("net_price") is not None else None,
        "net_side": r.get("net_side"),
        "setup_md": r.get("setup_md") or "",
        "plan_md": r.get("plan_md") or "",
        "rules_md": r.get("rules_md") or "",
        "adherence": r.get("adherence") or "unknown",
        "deviation_md": r.get("deviation_md") or "",
        "lesson_md": r.get("lesson_md") or "",
        "pnl_amount": float(r["pnl_amount"]) if r.get("pnl_amount") is not None else None,
        "journal_entry_id": r.get("journal_entry_id"),
        "legs": legs if legs is not None else [],
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        "updated_at": r["updated_at"].isoformat() if r.get("updated_at") else None,
    }


def _count_active(cur, iid: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_trade_log_accounts
           WHERE identity_id = %s AND status = 'active'""",
        (iid,),
    )
    return int(cur.fetchone()["n"])


def _get_account(cur, iid: int, account_id: int) -> dict:
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, iid),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    return row


DEFAULT_ACCOUNT_LABEL = "Primary"
# Venue left unset until first import (adapter maps it) or first trade (user picks).
DEFAULT_ACCOUNT_VENUE = cat.UNSET_VENUE


def _ensure_default_account(cur, iid: int) -> dict:
    """Every entitled member gets one active Primary account on first access.

    Venue is **not** assumed (thinkorswim, FatTail, sim, …). It stays `unset`
    until the first import (detected adapter → venue) or first trade create
    (user-chosen broker/sim). Prefer any existing active account before insert.
    """
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s AND status = 'active'
           ORDER BY
             CASE label WHEN %s THEN 0 ELSE 1 END,
             sort_order ASC, id ASC
           LIMIT 1""",
        (iid, DEFAULT_ACCOUNT_LABEL),
    )
    row = cur.fetchone()
    if row:
        return row
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s AND label = %s
           ORDER BY id ASC LIMIT 1""",
        (iid, DEFAULT_ACCOUNT_LABEL),
    )
    primary = cur.fetchone()
    if primary:
        cur.execute(
            """UPDATE member_trade_log_accounts
               SET status = 'active'
               WHERE id = %s AND identity_id = %s""",
            (primary["id"], iid),
        )
        cur.execute(
            "SELECT * FROM member_trade_log_accounts WHERE id = %s",
            (primary["id"],),
        )
        return cur.fetchone()
    cur.execute(
        """INSERT INTO member_trade_log_accounts
             (identity_id, label, broker, status, sort_order, notes_md)
           VALUES (%s, %s, %s, 'active', 10, %s)""",
        (
            iid,
            DEFAULT_ACCOUNT_LABEL,
            DEFAULT_ACCOUNT_VENUE,
            "Default account — venue set on first import or first trade.",
        ),
    )
    cur.execute(
        "SELECT * FROM member_trade_log_accounts WHERE id = %s",
        (cur.lastrowid,),
    )
    return cur.fetchone()


def _maybe_set_account_venue(
    cur,
    iid: int,
    account_id: int,
    *,
    broker: str | None,
    broker_label: str | None = None,
    only_if_unset: bool = True,
) -> None:
    """Set account venue when still provisional (or always if only_if_unset=False)."""
    if not broker or broker not in cat.VENUE_CODES or broker == cat.UNSET_VENUE:
        return
    cur.execute(
        """SELECT broker FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, iid),
    )
    row = cur.fetchone()
    if not row:
        return
    if only_if_unset and row["broker"] != cat.UNSET_VENUE:
        return
    if broker in cat.OTHER_VENUES and not (broker_label or "").strip():
        broker_label = "Other"
    cur.execute(
        """UPDATE member_trade_log_accounts
           SET broker = %s, broker_label = %s
           WHERE id = %s AND identity_id = %s""",
        (broker, broker_label, account_id, iid),
    )


def _load_legs(cur, trade_id: int, iid: int) -> list[dict]:
    cur.execute(
        """SELECT * FROM member_trade_log_legs
           WHERE trade_id = %s AND identity_id = %s
           ORDER BY leg_index, id""",
        (trade_id, iid),
    )
    return [_leg_row(r) for r in cur.fetchall()]


def _load_trade(cur, trade_id: int, iid: int) -> dict:
    cur.execute(
        """SELECT * FROM member_trade_log_trades
           WHERE id = %s AND identity_id = %s""",
        (trade_id, iid),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Trade not found")
    return _trade_row(row, _load_legs(cur, trade_id, iid))


def _validate_leg(leg: dict, index: int) -> dict:
    if not isinstance(leg, dict):
        raise HTTPException(status_code=422, detail=f"legs[{index}] must be an object")
    side = (leg.get("side") or "").upper()
    if side not in cat.SIDES:
        raise HTTPException(status_code=422, detail=f"legs[{index}].side must be BUY|SELL")
    try:
        qty = int(leg.get("quantity"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=422, detail=f"legs[{index}].quantity must be an integer"
        ) from exc
    if qty < 1:
        raise HTTPException(status_code=422, detail=f"legs[{index}].quantity must be ≥ 1")
    pe = leg.get("pos_effect")
    if pe is not None and pe != "":
        pe = str(pe).upper()
        if pe not in cat.POS_EFFECTS:
            raise HTTPException(
                status_code=422,
                detail=f"legs[{index}].pos_effect must be TO_OPEN|TO_CLOSE",
            )
    else:
        pe = None
    ac = (leg.get("asset_class") or "equity_option").lower()
    if ac not in cat.ASSET_CLASSES:
        raise HTTPException(status_code=422, detail=f"legs[{index}].invalid asset_class")
    right = leg.get("right") or leg.get("option_right")
    if right:
        right = str(right).upper()
        if right not in cat.RIGHTS:
            raise HTTPException(status_code=422, detail=f"legs[{index}].right must be PUT|CALL")
    else:
        right = None
    fill = _dec(leg.get("fill_price") if leg.get("fill_price") is not None else 0)
    if fill is None:
        fill = Decimal("0")
    expiry = leg.get("expiry") or None
    if expiry == "":
        expiry = None
    strike = _dec(leg.get("strike"))
    return {
        "leg_index": int(leg.get("leg_index") if leg.get("leg_index") is not None else index),
        "side": side,
        "quantity": qty,
        "pos_effect": pe,
        "asset_class": ac,
        "underlier": (leg.get("underlier") or None) and str(leg.get("underlier")).strip()[:64],
        "symbol": (leg.get("symbol") or None) and str(leg.get("symbol")).strip()[:64],
        "expiry": expiry,
        "strike": strike,
        "option_right": right,
        "multiplier": int(leg["multiplier"]) if leg.get("multiplier") not in (None, "") else None,
        "fill_price": fill,
        "fees": _dec(leg.get("fees")),
    }


def _insert_legs(cur, trade_id: int, iid: int, account_id: int, legs: list[dict]) -> None:
    for i, raw in enumerate(legs):
        L = _validate_leg(raw, i)
        cur.execute(
            """INSERT INTO member_trade_log_legs
                 (trade_id, identity_id, account_id, leg_index, side, quantity,
                  pos_effect, asset_class, underlier, symbol, expiry, strike,
                  option_right, multiplier, fill_price, fees)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                trade_id,
                iid,
                account_id,
                L["leg_index"],
                L["side"],
                L["quantity"],
                L["pos_effect"],
                L["asset_class"],
                L["underlier"],
                L["symbol"],
                L["expiry"],
                L["strike"],
                L["option_right"],
                L["multiplier"],
                L["fill_price"],
                L["fees"],
            ),
        )


def _process_fields(body: dict) -> dict:
    adherence = (body.get("adherence") or "unknown").strip()
    if adherence not in cat.ADHERENCE:
        raise HTTPException(
            status_code=422,
            detail=f"adherence must be one of {sorted(cat.ADHERENCE)}",
        )
    pnl = body.get("pnl_amount")
    if pnl is not None and pnl != "":
        pnl = float(_dec(pnl))  # type: ignore[arg-type]
    else:
        pnl = None
    return {
        "setup_md": (body.get("setup_md") or "").strip(),
        "plan_md": (body.get("plan_md") or "").strip(),
        "rules_md": (body.get("rules_md") or "").strip(),
        "adherence": adherence,
        "deviation_md": (body.get("deviation_md") or "").strip(),
        "lesson_md": (body.get("lesson_md") or "").strip(),
        "pnl_amount": pnl,
    }


# --- Catalog -----------------------------------------------------------------


@router.get("/api/me/trade-log/venues")
def list_venues(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    # Hide provisional "unset" from pickers — only used server-side at provision
    venues = [v for v in cat.VENUES if v["code"] != cat.UNSET_VENUE]
    return {"venues": venues, "strategies": cat.STRATEGIES}


# --- Accounts ----------------------------------------------------------------


@router.get("/api/me/trade-log/accounts")
def list_accounts(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _ensure_default_account(cur, iid)
            cur.execute(
                """SELECT * FROM member_trade_log_accounts
                   WHERE identity_id = %s
                   ORDER BY status ASC, sort_order ASC, id ASC""",
                (iid,),
            )
            rows = cur.fetchall()
    return {"accounts": [_account_row(r) for r in rows]}


@router.post("/api/me/trade-log/accounts")
async def create_account(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    label = (body.get("label") or "").strip()
    if not label:
        raise HTTPException(status_code=422, detail="label is required")
    broker = (body.get("broker") or "").strip()
    if broker not in cat.VENUE_CODES or broker == cat.UNSET_VENUE:
        raise HTTPException(
            status_code=422,
            detail="broker (venue) is required — choose a broker, sim, or FatTail canonical",
        )
    broker_label = (body.get("broker_label") or "").strip() or None
    if broker in cat.OTHER_VENUES and not broker_label:
        raise HTTPException(status_code=422, detail="broker_label required when venue is other/other_sim")
    status = (body.get("status") or "active").strip()
    if status not in cat.ACCOUNT_STATUSES:
        raise HTTPException(status_code=422, detail="status must be active|archived")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if status == "active" and _count_active(cur, iid) >= cat.MAX_ACTIVE_ACCOUNTS:
                raise HTTPException(
                    status_code=422,
                    detail=f"At most {cat.MAX_ACTIVE_ACCOUNTS} active accounts — archive one first",
                )
            cur.execute(
                """INSERT INTO member_trade_log_accounts
                     (identity_id, label, broker, broker_label, currency, status,
                      badge_color, sort_order, notes_md)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    iid,
                    label[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or "USD")[:8],
                    status,
                    body.get("badge_color"),
                    int(body.get("sort_order") or 0),
                    (body.get("notes_md") or "").strip() or None,
                ),
            )
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                (cur.lastrowid,),
            )
            row = cur.fetchone()
    return _account_row(row)


@router.patch("/api/me/trade-log/accounts/{account_id}")
async def patch_account(account_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            row = _get_account(cur, iid, account_id)
            label = body.get("label", row["label"])
            if isinstance(label, str):
                label = label.strip()
            if not label:
                raise HTTPException(status_code=422, detail="label is required")
            broker = body.get("broker", row["broker"])
            if broker not in cat.VENUE_CODES:
                raise HTTPException(status_code=422, detail="invalid broker venue")
            # Allow leaving unset only if already unset; user cannot PATCH to unset
            if broker == cat.UNSET_VENUE and row["broker"] != cat.UNSET_VENUE:
                raise HTTPException(
                    status_code=422,
                    detail="choose a broker, sim, or FatTail canonical venue",
                )
            broker_label = body.get("broker_label", row.get("broker_label"))
            if broker_label is not None:
                broker_label = str(broker_label).strip() or None
            if broker in cat.OTHER_VENUES and not broker_label:
                raise HTTPException(
                    status_code=422,
                    detail="broker_label required when venue is other/other_sim",
                )
            status = body.get("status", row["status"])
            if status not in cat.ACCOUNT_STATUSES:
                raise HTTPException(status_code=422, detail="status must be active|archived")
            if (
                status == "active"
                and row["status"] != "active"
                and _count_active(cur, iid) >= cat.MAX_ACTIVE_ACCOUNTS
            ):
                raise HTTPException(
                    status_code=422,
                    detail=f"At most {cat.MAX_ACTIVE_ACCOUNTS} active accounts",
                )
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET label=%s, broker=%s, broker_label=%s, currency=%s, status=%s,
                       badge_color=%s, sort_order=%s, notes_md=%s
                   WHERE id=%s AND identity_id=%s""",
                (
                    str(label)[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or row.get("currency") or "USD")[:8],
                    status,
                    body.get("badge_color", row.get("badge_color")),
                    int(body["sort_order"]) if body.get("sort_order") is not None else row.get("sort_order") or 0,
                    (body.get("notes_md") if "notes_md" in body else row.get("notes_md")) or None,
                    account_id,
                    iid,
                ),
            )
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                (account_id,),
            )
            return _account_row(cur.fetchone())


# --- Trades ------------------------------------------------------------------


@router.get("/api/me/trade-log")
@router.get("/api/me/trade-log/trades")
def list_trades(request: Request, account_id: int | None = None) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            default_acct = _ensure_default_account(cur, iid)
            # Full multi-year books (e.g. 0DTE xlsx ≈ 700+ closes × open/close
            # pairs) must not be silently truncated — Reports equity depends on it.
            _TRADE_LIST_LIMIT = 10000
            if account_id is not None:
                _get_account(cur, iid, account_id)
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       WHERE identity_id = %s AND account_id = %s
                       ORDER BY exec_at DESC, id DESC LIMIT %s""",
                    (iid, account_id, _TRADE_LIST_LIMIT),
                )
            else:
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       WHERE identity_id = %s
                       ORDER BY exec_at DESC, id DESC LIMIT %s""",
                    (iid, _TRADE_LIST_LIMIT),
                )
            trades = []
            for r in cur.fetchall():
                trades.append(_trade_row(r, _load_legs(cur, r["id"], iid)))
            cur.execute(
                """SELECT * FROM member_trade_log_accounts
                   WHERE identity_id = %s
                   ORDER BY status ASC, sort_order ASC, id ASC""",
                (iid,),
            )
            accounts = [_account_row(a) for a in cur.fetchall()]
            # Surface default for clients (Import target, New trade)
            default_account_id = int(default_acct["id"])
    # Legacy key for old clients/tests that expect entries (prose-shaped)
    entries = [
        {
            "id": t["id"],
            "traded_on": (t["exec_at"] or "")[:10] if t.get("exec_at") else None,
            "setup_md": t["setup_md"],
            "plan_md": t["plan_md"],
            "rules_md": t["rules_md"],
            "adherence": t["adherence"],
            "deviation_md": t["deviation_md"],
            "lesson_md": t["lesson_md"],
            "pnl_amount": t["pnl_amount"],
            "created_at": t.get("created_at"),
            "updated_at": t.get("updated_at"),
        }
        for t in trades
    ]
    return {
        "trades": trades,
        "accounts": accounts,
        "default_account_id": default_account_id,
        "entries": entries,
    }


@router.get("/api/me/trade-log/trades/{trade_id}")
def get_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return _load_trade(cur, trade_id, iid)


@router.post("/api/me/trade-log")
@router.post("/api/me/trade-log/trades")
async def create_trade(request: Request) -> dict:
    """Create multi-leg trade, or legacy prose body → NOTE trade (no legs)."""
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    legs_in = body.get("legs")
    # Legacy MVP shape: process fields only
    if legs_in is None and body.get("strategy") is None and (
        body.get("setup_md") is not None or body.get("plan_md") is not None
    ):
        body = {
            **body,
            "strategy": "NOTE",
            "legs": [],
            "exec_at": body.get("traded_on") or body.get("exec_at"),
        }
        legs_in = []

    strategy = (body.get("strategy") or "CUSTOM").upper()
    if strategy not in cat.STRATEGY_CODES:
        raise HTTPException(status_code=422, detail=f"unknown strategy: {strategy}")
    asset_class = (body.get("asset_class") or "equity_option").lower()
    if asset_class not in cat.ASSET_CLASSES:
        raise HTTPException(status_code=422, detail="invalid asset_class")
    order_type = (body.get("order_type") or "LMT").upper()[:32]
    net_side = body.get("net_side")
    if net_side:
        net_side = str(net_side).upper()
        if net_side not in cat.NET_SIDES:
            raise HTTPException(status_code=422, detail="net_side must be DEBIT|CREDIT")
    else:
        net_side = None
    net_price = _dec(body.get("net_price"))
    proc = _process_fields(body)
    legs = legs_in if isinstance(legs_in, list) else []
    if strategy != "NOTE" and len(legs) == 0 and strategy not in ("CUSTOM", "NOTE"):
        # allow empty for STOCK etc if they send one leg — require ≥1 for non-NOTE
        if strategy not in ("NOTE",):
            pass  # allow zero legs for flexibility in P1; UI sends legs for spreads
    exec_at = _parse_exec_at(body.get("exec_at") or body.get("traded_on"))

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if body.get("account_id") is not None:
                acct = _get_account(cur, iid, int(body["account_id"]))
            else:
                acct = _ensure_default_account(cur, iid)
            account_id = int(acct["id"])
            # First trade may assign venue if still provisional
            chosen = (body.get("broker") or body.get("venue") or "").strip()
            if acct.get("broker") == cat.UNSET_VENUE:
                if not chosen or chosen == cat.UNSET_VENUE:
                    # Legacy prose NOTE without venue → FatTail canonical book
                    if strategy == "NOTE" and not chosen:
                        chosen = "fattail"
                    else:
                        raise HTTPException(
                            status_code=422,
                            detail={
                                "message": "Choose a venue for this account "
                                "(broker, sim, or FatTail canonical) on first trade",
                                "code": "VENUE_REQUIRED",
                            },
                        )
                _maybe_set_account_venue(
                    cur,
                    iid,
                    account_id,
                    broker=chosen,
                    broker_label=(body.get("broker_label") or None),
                    only_if_unset=True,
                )
            elif chosen and chosen != cat.UNSET_VENUE:
                # Optional: user may re-bind only if still unset (above); ignore re-pick
                pass
            cur.execute(
                """INSERT INTO member_trade_log_trades
                     (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                      net_price, net_side, setup_md, plan_md, rules_md, adherence,
                      deviation_md, lesson_md, pnl_amount)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    iid,
                    account_id,
                    exec_at,
                    asset_class,
                    strategy,
                    order_type,
                    net_price,
                    net_side,
                    proc["setup_md"],
                    proc["plan_md"],
                    proc["rules_md"],
                    proc["adherence"],
                    proc["deviation_md"],
                    proc["lesson_md"],
                    proc["pnl_amount"],
                ),
            )
            tid = int(cur.lastrowid)
            _insert_legs(cur, tid, iid, account_id, legs)
            out = _load_trade(cur, tid, iid)
    return out


@router.patch("/api/me/trade-log/trades/{trade_id}")
async def patch_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT * FROM member_trade_log_trades
                   WHERE id = %s AND identity_id = %s""",
                (trade_id, iid),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Trade not found")
            account_id = int(row["account_id"])
            if body.get("account_id") is not None:
                acct = _get_account(cur, iid, int(body["account_id"]))
                account_id = int(acct["id"])
            strategy = (body.get("strategy") or row["strategy"]).upper()
            if strategy not in cat.STRATEGY_CODES:
                raise HTTPException(status_code=422, detail="unknown strategy")
            asset_class = (body.get("asset_class") or row.get("asset_class") or "equity_option").lower()
            order_type = (body.get("order_type") or row.get("order_type") or "LMT").upper()[:32]
            net_side = body.get("net_side", row.get("net_side"))
            if net_side:
                net_side = str(net_side).upper()
                if net_side not in cat.NET_SIDES:
                    raise HTTPException(status_code=422, detail="net_side must be DEBIT|CREDIT")
            else:
                net_side = None
            net_price = (
                _dec(body["net_price"])
                if "net_price" in body
                else row.get("net_price")
            )
            exec_at = (
                _parse_exec_at(body["exec_at"])
                if body.get("exec_at") is not None
                else row["exec_at"]
            )
            merged = {
                "setup_md": body.get("setup_md", row.get("setup_md")),
                "plan_md": body.get("plan_md", row.get("plan_md")),
                "rules_md": body.get("rules_md", row.get("rules_md")),
                "adherence": body.get("adherence", row.get("adherence")),
                "deviation_md": body.get("deviation_md", row.get("deviation_md")),
                "lesson_md": body.get("lesson_md", row.get("lesson_md")),
                "pnl_amount": body.get("pnl_amount", row.get("pnl_amount")),
            }
            proc = _process_fields(merged)
            cur.execute(
                """UPDATE member_trade_log_trades
                   SET account_id=%s, exec_at=%s, asset_class=%s, strategy=%s,
                       order_type=%s, net_price=%s, net_side=%s,
                       setup_md=%s, plan_md=%s, rules_md=%s, adherence=%s,
                       deviation_md=%s, lesson_md=%s, pnl_amount=%s
                   WHERE id=%s AND identity_id=%s""",
                (
                    account_id,
                    exec_at,
                    asset_class,
                    strategy,
                    order_type,
                    net_price,
                    net_side,
                    proc["setup_md"],
                    proc["plan_md"],
                    proc["rules_md"],
                    proc["adherence"],
                    proc["deviation_md"],
                    proc["lesson_md"],
                    proc["pnl_amount"],
                    trade_id,
                    iid,
                ),
            )
            if "legs" in body:
                if not isinstance(body["legs"], list):
                    raise HTTPException(status_code=422, detail="legs must be a list")
                cur.execute(
                    "DELETE FROM member_trade_log_legs WHERE trade_id = %s AND identity_id = %s",
                    (trade_id, iid),
                )
                _insert_legs(cur, trade_id, iid, account_id, body["legs"])
            return _load_trade(cur, trade_id, iid)


@router.delete("/api/me/trade-log/{trade_id}")
@router.delete("/api/me/trade-log/trades/{trade_id}")
def delete_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """DELETE FROM member_trade_log_trades
                   WHERE id = %s AND identity_id = %s""",
                (trade_id, iid),
            )
            if cur.rowcount == 0:
                # legacy table fallback
                cur.execute(
                    """DELETE FROM member_trade_log_entries
                       WHERE id = %s AND identity_id = %s""",
                    (trade_id, iid),
                )
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "id": trade_id}


# --- Import / export (P2) ----------------------------------------------------


@router.get("/api/me/trade-log/adapters")
def list_adapters(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    return {"adapters": tio.ADAPTERS}


@router.get("/api/me/trade-log/export")
def export_trades(
    request: Request,
    account_id: int | None = None,
    format: str = "canonical",
) -> Any:
    """Export trades for download.

    ``format``:
      - ``canonical`` / ``json`` / ``fattail`` — FatTail ``.tradlog.json``
      - ``native`` — account venue's native format (ToS CSV if thinkorswim;
        canonical if fattail / unset)
      - ``thinkorswim`` / ``tos`` — ToS Account Trade History CSV
      - ``csv`` — flat generic legs CSV

    Prefer a single ``account_id`` for ``native`` so venue is unambiguous.
    """
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio
    from fastapi.responses import JSONResponse, PlainTextResponse, Response

    fmt_in = (format or "canonical").lower()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if account_id is not None:
                accts = [_get_account(cur, iid, account_id)]
            else:
                cur.execute(
                    """SELECT * FROM member_trade_log_accounts
                       WHERE identity_id = %s ORDER BY sort_order, id""",
                    (iid,),
                )
                accts = cur.fetchall()
            by_acct: dict[int, list] = {}
            flat: list = []
            for a in accts:
                aid = int(a["id"])
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       WHERE identity_id = %s AND account_id = %s
                       ORDER BY exec_at ASC, id ASC""",
                    (iid, aid),
                )
                rows = cur.fetchall()
                trades = []
                for r in rows:
                    t = _trade_row(r, _load_legs(cur, r["id"], iid))
                    trades.append(t)
                    flat.append(t)
                by_acct[aid] = trades
            accounts = [_account_row(a) for a in accts]

    # Resolve serializer: native uses first account's venue
    primary_broker = accounts[0]["broker"] if accounts else "fattail"
    if len(accounts) > 1 and fmt_in == "native":
        # Multi-account native is ambiguous — use canonical
        resolved = "canonical"
    else:
        resolved = tio.resolve_export_format(fmt_in, primary_broker)

    label = (accounts[0]["label"] if accounts else "account").replace(" ", "-")
    slug = "".join(c for c in label.lower() if c.isalnum() or c in "-_")[:40] or "account"

    if resolved == "thinkorswim":
        body = tio.export_thinkorswim(flat, account_label=accounts[0]["label"] if accounts else "")
        return Response(
            content=body,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}-tos-trade-history.csv"'
            },
        )
    if resolved == "csv_generic":
        return PlainTextResponse(
            tio.export_csv_flat(flat),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}-legs.csv"'
            },
        )
    # canonical FatTail JSON
    doc = tio.export_canonical(accounts, by_acct)
    # Ensure export marks fattail when user asked for canonical
    if fmt_in in ("canonical", "json", "fattail", "tradlog"):
        for acct in doc.get("accounts") or []:
            # Keep real broker on account metadata; format is always canonical
            pass
    return JSONResponse(
        doc,
        headers={
            "Content-Disposition": f'attachment; filename="{slug}.tradlog.json"'
        },
    )


@router.post("/api/me/trade-log/import/detect")
async def import_detect(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    body = await request.json()
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    detections = tio.detect(text)
    # Filename hint (client may send only a head sample of a large JSON file)
    fname = (body.get("filename") or "").lower()
    if fname.endswith(".tradlog.json") or (
        fname.endswith(".json") and "fattail" in fname
    ):
        detections = [{"id": "native", "confidence": 0.999}] + [
            d for d in detections if d["id"] != "native"
        ]
        detections.sort(key=lambda x: -x["confidence"])
    return {"detections": detections, "sample_len": len(text)}


@router.post("/api/me/trade-log/import/preview")
async def import_preview(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    body = await request.json()
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    adapter = (body.get("adapter") or "auto").lower()
    result = tio.parse("" if adapter == "auto" else adapter, text)
    # Cap preview size
    trades = result.get("trades") or []
    return {
        "adapter": result.get("adapter"),
        "trade_count": len(trades),
        "trades": trades[:50],
        "truncated": len(trades) > 50,
        "warnings": result.get("warnings") or [],
        "errors": result.get("errors") or [],
    }


@router.post("/api/me/trade-log/import/commit")
async def import_commit(request: Request) -> dict:
    """Parse and write trades into account_id (required). Idempotent on external_order_id."""
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    body = await request.json()
    account_id = body.get("account_id")
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    if not text:
        raise HTTPException(status_code=422, detail="text or base64 content required")
    adapter = (body.get("adapter") or "auto").lower()
    result = tio.parse("" if adapter == "auto" else adapter, text)
    if result.get("errors"):
        raise HTTPException(
            status_code=422,
            detail={"message": "parse failed", "errors": result["errors"]},
        )
    trades = result.get("trades") or []
    adapter_id = result.get("adapter") or adapter or "import"
    created = 0
    skipped = 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if account_id is None:
                acct = _ensure_default_account(cur, iid)
                account_id = int(acct["id"])
            else:
                acct = _get_account(cur, iid, int(account_id))
                account_id = int(account_id)
            # First import sets venue from adapter when still unset
            venue = cat.ADAPTER_DEFAULT_VENUE.get(adapter_id)
            if body.get("broker"):
                venue = str(body["broker"]).strip()
            if venue:
                _maybe_set_account_venue(
                    cur,
                    iid,
                    account_id,
                    broker=venue,
                    broker_label=body.get("broker_label"),
                    only_if_unset=True,
                )
            for t in trades:
                ext = t.get("external_order_id") or None
                if ext:
                    cur.execute(
                        """SELECT id FROM member_trade_log_trades
                           WHERE identity_id = %s AND account_id = %s
                             AND external_adapter = %s AND external_order_id = %s""",
                        (iid, account_id, adapter_id, ext),
                    )
                    if cur.fetchone():
                        skipped += 1
                        continue
                proc = {
                    "setup_md": t.get("setup_md") or "",
                    "plan_md": t.get("plan_md") or "",
                    "rules_md": t.get("rules_md") or "",
                    "adherence": t.get("adherence")
                    if t.get("adherence") in cat.ADHERENCE
                    else "unknown",
                    "deviation_md": t.get("deviation_md") or "",
                    "lesson_md": t.get("lesson_md") or "",
                    "pnl_amount": t.get("pnl_amount"),
                }
                exec_at = _parse_exec_at(t.get("exec_at"))
                strategy = t.get("strategy") or "CUSTOM"
                if strategy not in cat.STRATEGY_CODES:
                    strategy = "CUSTOM"
                net_price = _dec(t.get("net_price"))
                net_side = t.get("net_side")
                if net_side and net_side not in cat.NET_SIDES:
                    net_side = None
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, asset_class, strategy,
                          order_type, net_price, net_side, setup_md, plan_md, rules_md,
                          adherence, deviation_md, lesson_md, pnl_amount,
                          external_adapter, external_order_id)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        iid,
                        account_id,
                        exec_at,
                        (t.get("asset_class") or "equity_option").lower(),
                        strategy,
                        (t.get("order_type") or "LMT")[:32],
                        net_price,
                        net_side,
                        proc["setup_md"],
                        proc["plan_md"],
                        proc["rules_md"],
                        proc["adherence"],
                        proc["deviation_md"],
                        proc["lesson_md"],
                        proc["pnl_amount"],
                        adapter_id,
                        ext,
                    ),
                )
                tid = int(cur.lastrowid)
                _insert_legs(cur, tid, iid, account_id, t.get("legs") or [])
                created += 1
    return {
        "ok": True,
        "adapter": adapter_id,
        "account_id": account_id,
        "created": created,
        "skipped": skipped,
        "warnings": result.get("warnings") or [],
    }
