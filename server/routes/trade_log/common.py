"""Trade Log route helpers — shared by accounts / trades / analytics / io."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import HTTPException

import auth
import db
import trade_log_catalog as cat
from config import get_config

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
    """Resolve claims identity for Family B storage.

    Real sessions (identity_id != 0) always use the claims identity.
    identity_id 0 is the internal/dev-admin session (auth_dev). The fallback that
    maps 0 → ernie/coach/dev-admin (or auto-creates dev-admin) is **dev-only**.
    Staging/production fail loud — never pick another member's book.
    """
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
    # identity_id 0 — internal session; storage fallback is LABS_ENV=dev only
    if get_config().env != "dev":
        raise HTTPException(
            status_code=401,
            detail="Invalid session identity for Trade Log",
        )
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
    out = {
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
    # Optional fill count (list_accounts JOIN) — helps Practice Context avoid empty books
    if "trade_count" in r and r["trade_count"] is not None:
        out["trade_count"] = int(r["trade_count"])
    return out


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
    (user-chosen broker/sim). Prefer the active account with the **most trades**
    so default_account_id is not an empty "Primary" when the book lives elsewhere.
    """
    cur.execute(
        """SELECT a.*
           FROM member_trade_log_accounts a
           LEFT JOIN member_trade_log_trades t
             ON t.account_id = a.id AND t.identity_id = a.identity_id
           WHERE a.identity_id = %s AND a.status = 'active'
           GROUP BY a.id
           ORDER BY COUNT(t.id) DESC,
             CASE a.label WHEN %s THEN 0 ELSE 1 END,
             a.sort_order ASC, a.id ASC
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
    """Single-trade legs (detail path). List path must use _load_legs_for_trades."""
    cur.execute(
        """SELECT * FROM member_trade_log_legs
           WHERE trade_id = %s AND identity_id = %s
           ORDER BY leg_index, id""",
        (trade_id, iid),
    )
    return [_leg_row(r) for r in cur.fetchall()]


_LEG_IN_CHUNK = 500


def _load_legs_for_trades(
    cur, trade_ids: list[int], iid: int
) -> dict[int, list[dict]]:
    """Batch-load legs for many trades — O(chunks), not one query per trade."""
    by_trade: dict[int, list[dict]] = {int(tid): [] for tid in trade_ids}
    if not trade_ids:
        return by_trade
    ids = [int(tid) for tid in trade_ids]
    for i in range(0, len(ids), _LEG_IN_CHUNK):
        chunk = ids[i : i + _LEG_IN_CHUNK]
        placeholders = ",".join(["%s"] * len(chunk))
        cur.execute(
            f"""SELECT * FROM member_trade_log_legs
               WHERE identity_id = %s AND trade_id IN ({placeholders})
               ORDER BY trade_id, leg_index, id""",
            (iid, *chunk),
        )
        for r in cur.fetchall():
            tid = int(r["trade_id"])
            if tid in by_trade:
                by_trade[tid].append(_leg_row(r))
    return by_trade


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


_TRADE_LIST_LIMIT = 10000


def _load_member_book(
    cur, iid: int, account_id: int | None = None
) -> tuple[list[dict], list[dict]]:
    """Batch-load trades+legs and accounts for analytics (identity-scoped)."""
    _ensure_default_account(cur, iid)
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
    rows = cur.fetchall()
    legs_by_trade = _load_legs_for_trades(cur, [int(r["id"]) for r in rows], iid)
    trades = [_trade_row(r, legs_by_trade.get(int(r["id"]), [])) for r in rows]
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s
           ORDER BY status ASC, sort_order ASC, id ASC""",
        (iid,),
    )
    accounts = [_account_row(a) for a in cur.fetchall()]
    return trades, accounts

