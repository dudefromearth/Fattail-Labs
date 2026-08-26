"""Trade Log route helpers — shared by accounts / trades / analytics / io."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import HTTPException

import auth
import db
import retrospective_domain as rd
import trade_log_catalog as cat
from config import get_config
from trade_log_domain.matching import blotter_status_by_id

# DL-126 / DL-128: Observer membership = Navigator Practice access (Trade Log,
# Reports). Free no-plan observer stays denied. Same gate as Journal / Retro.
_TOOL_DENY_DETAIL = (
    "Trade Log and Reports require an active Observer trial or Navigator "
    "membership (or Activator legacy / administrator)"
)


def _require_tool_member(claims: dict, *, capability: str = "write") -> None:
    """Practice suite entitlement + Access Control app:trade-log policy.

    As-built: admin | activator+ | observer-trial.
    When a policy exists: evaluate capabilities; data-bearing floor keeps read/export.
    """
    role = str(claims.get("role") or "observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            tool_ok = rd.can_create_or_gather(cur, iid, role)
            try:
                from access_control.evaluate import evaluate
                from access_control.policy import load_policy
                from access_control.types import TargetMeta
                from access_control.viewer import viewer_from_claims

                policy = load_policy(cur, "app:trade-log")
                viewer = viewer_from_claims(cur, claims)
                meta = TargetMeta(tool_write_ok=tool_ok, app_status="live")
                decision = evaluate(
                    "app:trade-log", viewer, policy=policy, meta=meta
                )
                if decision.allow and decision.has_capability(capability):
                    return
                if decision.allow and capability == "write":
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "message": "Trade Log write not permitted for this access level",
                            "access": decision.to_public_dict(),
                        },
                    )
                if not decision.allow:
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "message": _TOOL_DENY_DETAIL,
                            "access": decision.to_public_dict(),
                        },
                    )
            except HTTPException:
                raise
            except Exception:
                # Fail to as-built if engine path errors
                if tool_ok:
                    return
                raise HTTPException(status_code=403, detail=_TOOL_DENY_DETAIL)
            if tool_ok and capability in ("read", "export"):
                return
            if tool_ok and capability == "write":
                return
    raise HTTPException(status_code=403, detail=_TOOL_DENY_DETAIL)


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
    start = r.get("starting_balance")
    try:
        starting_balance = float(start) if start is not None else None
    except (TypeError, ValueError):
        starting_balance = None
    bp_val = r.get("buying_power_value")
    try:
        buying_power_value = float(bp_val) if bp_val is not None else None
    except (TypeError, ValueError):
        buying_power_value = None
    bp_as = r.get("buying_power_as_of")
    out = {
        "id": r["id"],
        "label": r["label"],
        "broker": r["broker"],
        "broker_label": r.get("broker_label"),
        "currency": r.get("currency") or "USD",
        "starting_balance": starting_balance,
        "buying_power_posture": r.get("buying_power_posture") or "arbitrary",
        "buying_power_value": buying_power_value,
        "buying_power_as_of": (
            bp_as.isoformat() + "Z" if hasattr(bp_as, "isoformat") else None
        ),
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


def _coerce_leg_expiry(r: dict) -> str | None:
    """ISO date from the stored column, or from a ToS futures Symbol if null."""
    raw = r.get("expiry")
    if raw:
        if hasattr(raw, "isoformat"):
            return raw.isoformat()
        s = str(raw)
        return s[:10] if len(s) >= 10 else s
    symbol = r.get("symbol")
    if not symbol:
        return None
    from trade_log_io import _parse_expiry

    return _parse_expiry(str(symbol))


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
        "expiry": _coerce_leg_expiry(r),
        "strike": float(r["strike"]) if r.get("strike") is not None else None,
        "right": r.get("option_right"),
        "multiplier": r.get("multiplier"),
        "fill_price": float(r["fill_price"]) if r.get("fill_price") is not None else 0,
        "fees": float(r["fees"]) if r.get("fees") is not None else None,
    }


# Provenance of a fill — three distinct channels (never collapse import into automated).
# manual     = member typed / structure form / sheet
# import     = file or paste adapter (ToS, CSV, canonical pack)
# automated  = Strategy Lab process runtime or other Labs automations (not import)
ENTRY_SOURCES = frozenset({"manual", "import", "automated"})


def _normalize_entry_source(raw: object | None, *, default: str = "manual") -> str:
    s = str(raw or default).strip().lower()
    # Legacy synonym from early 081 wording
    if s == "machine":
        s = "automated"
    if s not in ENTRY_SOURCES:
        return default
    return s


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
        "external_adapter": r.get("external_adapter"),
        "entry_source": _normalize_entry_source(r.get("entry_source")),
        "import_id": (
            int(r["import_id"]) if r.get("import_id") is not None else None
        ),
        "trash_reason": r.get("trash_reason"),
        "playbook_entry_id": (
            int(r["playbook_entry_id"]) if r.get("playbook_entry_id") is not None else None
        ),
        "practice_campaign_id": (
            int(r["practice_campaign_id"])
            if r.get("practice_campaign_id") is not None
            else None
        ),
        "stamped_by": (
            str(r["stamped_by"]) if r.get("stamped_by") not in (None, "") else None
        ),
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


# Member-facing default account label (provisioned furniture; renamable).
DEFAULT_ACCOUNT_LABEL = "Default"
# Legacy provisioned label — still recognized as the standing home.
LEGACY_DEFAULT_ACCOUNT_LABEL = "Primary"
# New books are FatTail-canonical (multi-source import OK). Not a connected broker.
DEFAULT_ACCOUNT_VENUE = cat.CANONICAL_BOOK_VENUE


def _ensure_default_account(cur, iid: int) -> dict:
    """Every entitled member gets one active default account on first access.

    Accounts are **FatTail books**, not broker connections. CSV/import source
    is recorded per trade (`external_adapter`); it does **not** brand the
    account. Prefer the active account with the **most trades** so the standing
    home is not an empty book when fills live elsewhere.
    """
    cur.execute(
        """SELECT a.*
           FROM member_trade_log_accounts a
           LEFT JOIN member_trade_log_trades t
             ON t.account_id = a.id AND t.identity_id = a.identity_id
           WHERE a.identity_id = %s AND a.status = 'active'
           GROUP BY a.id
           ORDER BY COUNT(t.id) DESC,
             CASE a.label
               WHEN %s THEN 0
               WHEN %s THEN 1
               ELSE 2
             END,
             a.sort_order ASC, a.id ASC
           LIMIT 1""",
        (iid, DEFAULT_ACCOUNT_LABEL, LEGACY_DEFAULT_ACCOUNT_LABEL),
    )
    # Amendment Top-Level Account: account only — never invent ledger furniture.
    row = cur.fetchone()
    if row:
        # Soft-migrate legacy Primary + unset venue on standing stock book (C4)
        if row.get("label") == LEGACY_DEFAULT_ACCOUNT_LABEL:
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET label = %s
                   WHERE id = %s AND identity_id = %s AND label = %s""",
                (
                    DEFAULT_ACCOUNT_LABEL,
                    row["id"],
                    iid,
                    LEGACY_DEFAULT_ACCOUNT_LABEL,
                ),
            )
        if (row.get("broker") or "") in ("", "unset"):
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET broker = %s
                   WHERE id = %s AND identity_id = %s
                     AND (broker IS NULL OR broker = '' OR broker = 'unset')""",
                (DEFAULT_ACCOUNT_VENUE, row["id"], iid),
            )
        if row.get("label") == LEGACY_DEFAULT_ACCOUNT_LABEL or (
            row.get("broker") or ""
        ) in ("", "unset"):
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                (row["id"],),
            )
            return cur.fetchone() or row
        return row
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s AND label IN (%s, %s)
           ORDER BY CASE label WHEN %s THEN 0 ELSE 1 END, id ASC LIMIT 1""",
        (
            iid,
            DEFAULT_ACCOUNT_LABEL,
            LEGACY_DEFAULT_ACCOUNT_LABEL,
            DEFAULT_ACCOUNT_LABEL,
        ),
    )
    standing = cur.fetchone()
    if standing:
        cur.execute(
            """UPDATE member_trade_log_accounts
               SET status = 'active'
               WHERE id = %s AND identity_id = %s""",
            (standing["id"], iid),
        )
        # Soft-migrate legacy "Primary" label → "Default" when still the stock name
        if standing.get("label") == LEGACY_DEFAULT_ACCOUNT_LABEL:
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET label = %s
                   WHERE id = %s AND identity_id = %s AND label = %s""",
                (
                    DEFAULT_ACCOUNT_LABEL,
                    standing["id"],
                    iid,
                    LEGACY_DEFAULT_ACCOUNT_LABEL,
                ),
            )
        if (standing.get("broker") or "") in ("", "unset"):
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET broker = %s
                   WHERE id = %s AND identity_id = %s
                     AND (broker IS NULL OR broker = '' OR broker = 'unset')""",
                (DEFAULT_ACCOUNT_VENUE, standing["id"], iid),
            )
        cur.execute(
            "SELECT * FROM member_trade_log_accounts WHERE id = %s",
            (standing["id"],),
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
            "FatTail book — stores canonical trades; multi-source CSV import OK.",
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


# Analytics / export / open-book compute may need a large window (multi-year).
_TRADE_BOOK_LIMIT = 10000
# Blotter UI default page — keep client memory bounded (lazy “load more”).
_TRADE_PAGE_DEFAULT = 80
_TRADE_PAGE_MAX = 200

# O3 Status matching is in-memory on the SQL-filtered book. Above this we
# fail loud — never a page-local Status under a full-book Autofilter UI.
_BLOTTER_STATUS_BUDGET = _TRADE_BOOK_LIMIT
_STATUS_BUDGET_DETAIL = (
    "Status filter needs the full account book in memory. This book exceeds "
    f"{_TRADE_BOOK_LIMIT} trades. Not applying a page-local Status filter."
)


def _load_accounts(cur, iid: int) -> list[dict]:
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s
           ORDER BY status ASC, sort_order ASC, id ASC""",
        (iid,),
    )
    return [_account_row(a) for a in cur.fetchall()]


def _rows_to_trades(cur, rows: list, iid: int) -> list[dict]:
    if not rows:
        return []
    legs_by_trade = _load_legs_for_trades(cur, [int(r["id"]) for r in rows], iid)
    return [_trade_row(r, legs_by_trade.get(int(r["id"]), [])) for r in rows]


def _adherence_filter_clauses(
    adherence_mode: str | None,
    from_day: str | None = None,
    to_day: str | None = None,
) -> tuple[list[str], list[Any]]:
    """Optional blotter filters for Journey F2 (meter complement).

    ``adherence_mode=drift`` → adherence NOT IN (followed, partial)
    i.e. broke + unknown (and any non-good value). Window optional via from/to day
    on DATE(exec_at).
    """
    clauses: list[str] = []
    args: list[Any] = []
    mode = (adherence_mode or "").strip().lower()
    if mode == "drift":
        # Meter good = followed + partial among tagged; complement = not those.
        clauses.append(
            "(adherence IS NULL OR adherence NOT IN ('followed', 'partial'))"
        )
    if from_day:
        clauses.append("DATE(exec_at) >= %s")
        args.append(str(from_day)[:10])
    if to_day:
        clauses.append("DATE(exec_at) <= %s")
        args.append(str(to_day)[:10])
    return clauses, args


def _criteria_filter_clauses(
    iid: int,
    *,
    strategy: str | None = None,
    net_side: str | None = None,
    pos_effect: str | None = None,
    symbol: str | None = None,
) -> tuple[list[str], list[Any]]:
    """AND-combined search criteria for the allocation tool."""
    clauses: list[str] = []
    args: list[Any] = []
    st = (strategy or "").strip()
    if st:
        clauses.append("strategy = %s")
        args.append(st[:40])
    side = (net_side or "").strip().upper()
    if side in ("CREDIT", "DEBIT"):
        clauses.append("UPPER(COALESCE(net_side, '')) = %s")
        args.append(side)
    effect = (pos_effect or "").strip().upper()
    if effect in ("TO_OPEN", "TO_CLOSE"):
        clauses.append(
            """id IN (
                SELECT trade_id FROM member_trade_log_legs
                 WHERE identity_id = %s AND pos_effect = %s
            )"""
        )
        args.extend([iid, effect])
    sym = (symbol or "").strip()
    if sym:
        like = f"%{sym[:40]}%"
        clauses.append(
            """id IN (
                SELECT trade_id FROM member_trade_log_legs
                 WHERE identity_id = %s
                   AND (COALESCE(symbol, '') LIKE %s
                        OR COALESCE(underlier, '') LIKE %s)
            )"""
        )
        args.extend([iid, like, like])
    return clauses, args


def _csv_values(
    raw: str | None, *, upper: bool = False, lim: int = 48, cap: int = 80
) -> list[str]:
    if not raw:
        return []
    out: list[str] = []
    for part in str(raw).split(","):
        p = part.strip()
        if upper:
            p = p.upper()
        if p:
            out.append(p[:lim])
        if len(out) >= cap:
            break
    return out


def _find_filter_clauses(
    iid: int,
    *,
    strategies: str | None = None,
    sides: str | None = None,
    effects: str | None = None,
    symbols: str | None = None,
    years: str | None = None,
    months: str | None = None,
    days: str | None = None,
    campaigns: str | None = None,
) -> tuple[list[str], list[Any]]:
    """Multi-value AutoFilter AND-clauses for Find and tag."""
    clauses: list[str] = []
    args: list[Any] = []
    st = _csv_values(strategies)
    if st:
        clauses.append("strategy IN (" + ",".join(["%s"] * len(st)) + ")")
        args.extend(st)
    sd = [s for s in _csv_values(sides, upper=True) if s in ("CREDIT", "DEBIT", "—")]
    sd = ["CREDIT" if s == "—" else s for s in sd]
    # "—" means blank side
    raw_sides = _csv_values(sides, upper=True)
    if raw_sides:
        blanks = "—" in raw_sides or "" in raw_sides
        named = [s for s in raw_sides if s in ("CREDIT", "DEBIT")]
        parts: list[str] = []
        if named:
            parts.append(
                "UPPER(COALESCE(net_side, '')) IN ("
                + ",".join(["%s"] * len(named))
                + ")"
            )
            args.extend(named)
        if blanks:
            parts.append("(net_side IS NULL OR net_side = '')")
        if parts:
            clauses.append("(" + " OR ".join(parts) + ")")
    fx = [e for e in _csv_values(effects, upper=True) if e in ("TO_OPEN", "TO_CLOSE")]
    if fx:
        clauses.append(
            """id IN (
                SELECT trade_id FROM member_trade_log_legs
                 WHERE identity_id = %s AND pos_effect IN ("""
            + ",".join(["%s"] * len(fx))
            + "))"
        )
        args.extend([iid, *fx])
    sy = _csv_values(symbols)
    if sy:
        clauses.append(
            """id IN (
                SELECT trade_id FROM member_trade_log_legs
                 WHERE identity_id = %s
                   AND (COALESCE(symbol, '') IN ("""
            + ",".join(["%s"] * len(sy))
            + ") OR COALESCE(underlier, '') IN ("
            + ",".join(["%s"] * len(sy))
            + "))"
            ")"
        )
        args.extend([iid, *sy, *sy])
    date_parts: list[str] = []
    yr = [y for y in _csv_values(years, lim=4, cap=40) if len(y) == 4 and y.isdigit()]
    if yr:
        date_parts.append(
            "DATE_FORMAT(exec_at, '%%Y') IN (" + ",".join(["%s"] * len(yr)) + ")"
        )
        args.extend(yr)
    mo = [m[:7] for m in _csv_values(months, lim=7, cap=120) if len(m) >= 7]
    if mo:
        date_parts.append(
            "DATE_FORMAT(exec_at, '%%Y-%%m') IN ("
            + ",".join(["%s"] * len(mo))
            + ")"
        )
        args.extend(mo)
    dy = [d[:10] for d in _csv_values(days, lim=10, cap=400) if len(d) >= 10]
    if dy:
        date_parts.append(
            "DATE(exec_at) IN (" + ",".join(["%s"] * len(dy)) + ")"
        )
        args.extend(dy)
    if date_parts:
        clauses.append("(" + " OR ".join(date_parts) + ")")
    toks = _csv_values(campaigns)
    if toks:
        none = any(t.lower() == "none" for t in toks)
        ids: list[int] = []
        for t in toks:
            if t.lower() == "none":
                continue
            try:
                ids.append(int(t))
            except ValueError:
                continue
        parts = []
        if none:
            parts.append("practice_campaign_id IS NULL")
        if ids:
            parts.append(
                "practice_campaign_id IN (" + ",".join(["%s"] * len(ids)) + ")"
            )
            args.extend(ids)
        if parts:
            clauses.append("(" + " OR ".join(parts) + ")")
    return clauses, args


def _search_q_clauses(q: str | None, iid: int) -> tuple[list[str], list[Any]]:
    """Symbol / underlier / strategy search (allocation manager)."""
    term = (q or "").strip()
    if not term:
        return [], []
    like = f"%{term[:80]}%"
    return (
        [
            """(strategy LIKE %s OR id IN (
                  SELECT trade_id FROM member_trade_log_legs
                   WHERE identity_id = %s
                     AND (COALESCE(symbol, '') LIKE %s
                          OR COALESCE(underlier, '') LIKE %s)
                ))"""
        ],
        [like, iid, like, like],
    )


def _campaign_stamp_filter_clauses(
    cur,
    iid: int,
    practice_campaign_id: int | None,
    *,
    campaign_mode: str | None = None,
) -> tuple[list[str], list[Any]]:
    """Campaign stamp filter.

    Named charters: exact stamp match.
    ``campaign_mode=unallocated``: no campaign stamp (one or none).
    **Ledger / account default** (``is_ledger`` or ``is_default``): no extra
    campaign clause — the account filter already scopes the book. Selecting the
    default campaign means "this account's full blotter," not only rows stamped
    to the ledger id (avoids empty view when fills sit on sibling campaigns).
    """
    mode = (campaign_mode or "").strip().lower() or None
    if mode == "unallocated":
        return ["practice_campaign_id IS NULL"], []
    if practice_campaign_id is None:
        return [], []
    camp_id = int(practice_campaign_id)
    cur.execute(
        """SELECT id, is_default, is_ledger, account_id FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (camp_id, iid),
    )
    row = cur.fetchone()
    if not row:
        # Unknown / other identity — match nothing
        return ["1 = 0"], []
    is_book_home = bool(int(row.get("is_ledger") or 0)) or bool(
        int(row.get("is_default") or 0)
    )
    if is_book_home:
        # Account scope (if any) already applied by caller — show whole book
        return [], []
    return ["practice_campaign_id = %s"], [camp_id]


def _playbook_stamp_filter_clauses(
    playbook_entry_id: int | None,
    *,
    playbook_mode: str | None = None,
) -> tuple[list[str], list[Any]]:
    """Playbook stamp filter.

    - omit / all: no clause
    - ``playbook_mode=unaffiliated``: playbook_entry_id IS NULL (named default)
    - positive id: exact link
    """
    mode = (playbook_mode or "").strip().lower()
    if mode == "unaffiliated":
        return ["playbook_entry_id IS NULL"], []
    if playbook_entry_id is not None:
        return ["playbook_entry_id = %s"], [int(playbook_entry_id)]
    return [], []


def _load_member_book(
    cur,
    iid: int,
    account_id: int | None = None,
    *,
    practice_campaign_id: int | None = None,
    campaign_mode: str | None = None,
    playbook_entry_id: int | None = None,
    playbook_mode: str | None = None,
    adherence_mode: str | None = None,
    from_day: str | None = None,
    to_day: str | None = None,
    q: str | None = None,
    strategy: str | None = None,
    net_side: str | None = None,
    pos_effect: str | None = None,
    symbol: str | None = None,
) -> tuple[list[dict], list[dict]]:
    """Batch-load trades+legs and accounts for analytics (identity-scoped).

    Full-book style load (capped). Prefer :func:`_load_member_book_page` for UI lists.
    Optional spine filters (Phase 1): campaign and/or playbook entry.
    Optional F2 adherence_mode=drift (+ day window).
    """
    _ensure_default_account(cur, iid)
    clauses = ["identity_id = %s"]
    args: list[Any] = [iid]
    if account_id is not None:
        _get_account(cur, iid, account_id)
        clauses.append("account_id = %s")
        args.append(account_id)
    camp_c, camp_a = _campaign_stamp_filter_clauses(
        cur, iid, practice_campaign_id, campaign_mode=campaign_mode
    )
    clauses.extend(camp_c)
    args.extend(camp_a)
    q_c, q_a = _search_q_clauses(q, iid)
    clauses.extend(q_c)
    args.extend(q_a)
    cr_c, cr_a = _criteria_filter_clauses(
        iid,
        strategy=strategy,
        net_side=net_side,
        pos_effect=pos_effect,
        symbol=symbol,
    )
    clauses.extend(cr_c)
    args.extend(cr_a)
    pb_c, pb_a = _playbook_stamp_filter_clauses(
        playbook_entry_id, playbook_mode=playbook_mode
    )
    clauses.extend(pb_c)
    args.extend(pb_a)
    extra, extra_args = _adherence_filter_clauses(
        adherence_mode, from_day=from_day, to_day=to_day
    )
    clauses.extend(extra)
    args.extend(extra_args)
    where = " AND ".join(clauses)
    args.append(_TRADE_BOOK_LIMIT)
    cur.execute(
        f"""SELECT * FROM member_trade_log_trades
            WHERE {where}
            ORDER BY exec_at DESC, id DESC LIMIT %s""",
        tuple(args),
    )
    rows = cur.fetchall()
    trades = _rows_to_trades(cur, rows, iid)
    return trades, _load_accounts(cur, iid)


def _parse_list_cursor(cursor: str | None) -> tuple[str | None, int | None]:
    """Cursor format: ``{exec_at_iso}|{id}`` from previous page last row."""
    if not cursor or not str(cursor).strip():
        return None, None
    parts = str(cursor).strip().split("|", 1)
    if len(parts) != 2:
        return None, None
    try:
        return parts[0], int(parts[1])
    except ValueError:
        return None, None


def _encode_list_cursor(trade: dict) -> str | None:
    exec_at = trade.get("exec_at")
    tid = trade.get("id")
    if not exec_at or tid is None:
        return None
    # MySQL DATETIME comparison prefers space separator, not ISO T
    s = str(exec_at).replace("T", " ").replace("Z", "")
    if len(s) > 19:
        s = s[:19]
    return f"{s}|{int(tid)}"


def _load_member_book_page(
    cur,
    iid: int,
    account_id: int | None = None,
    *,
    limit: int = _TRADE_PAGE_DEFAULT,
    cursor: str | None = None,
    practice_campaign_id: int | None = None,
    campaign_mode: str | None = None,
    playbook_entry_id: int | None = None,
    playbook_mode: str | None = None,
    adherence_mode: str | None = None,
    from_day: str | None = None,
    to_day: str | None = None,
    q: str | None = None,
    strategy: str | None = None,
    net_side: str | None = None,
    pos_effect: str | None = None,
    symbol: str | None = None,
    strategies: str | None = None,
    sides: str | None = None,
    effects: str | None = None,
    symbols: str | None = None,
    years: str | None = None,
    months: str | None = None,
    days: str | None = None,
    campaigns: str | None = None,
    statuses: str | None = None,
    positions_only: bool = False,
) -> tuple[list[dict], list[dict], bool, str | None, int, int]:
    """Paginated trades for blotter. Newest first.

    Returns has_more, next_cursor, match_count (filtered book), book_count
    (standing scope, no Autofilter).
    """
    _ensure_default_account(cur, iid)
    limit = max(1, min(int(limit or _TRADE_PAGE_DEFAULT), _TRADE_PAGE_MAX))
    before_exec, before_id = _parse_list_cursor(cursor)
    # Fetch limit+1 to detect has_more
    fetch_n = limit + 1

    clauses = ["identity_id = %s"]
    args: list[Any] = [iid]
    if account_id is not None:
        _get_account(cur, iid, account_id)
        clauses.append("account_id = %s")
        args.append(account_id)
    camp_c, camp_a = _campaign_stamp_filter_clauses(
        cur, iid, practice_campaign_id, campaign_mode=campaign_mode
    )
    clauses.extend(camp_c)
    args.extend(camp_a)
    q_c, q_a = _search_q_clauses(q, iid)
    clauses.extend(q_c)
    args.extend(q_a)
    cr_c, cr_a = _criteria_filter_clauses(
        iid,
        strategy=strategy,
        net_side=net_side,
        pos_effect=pos_effect,
        symbol=symbol,
    )
    clauses.extend(cr_c)
    args.extend(cr_a)
    pb_c, pb_a = _playbook_stamp_filter_clauses(
        playbook_entry_id, playbook_mode=playbook_mode
    )
    clauses.extend(pb_c)
    args.extend(pb_a)
    extra, extra_args = _adherence_filter_clauses(
        adherence_mode, from_day=from_day, to_day=to_day
    )
    clauses.extend(extra)
    args.extend(extra_args)
    standing_where = " AND ".join(clauses)
    standing_args = list(args)
    cur.execute(
        f"SELECT COUNT(*) AS n FROM member_trade_log_trades WHERE {standing_where}",
        tuple(standing_args),
    )
    book_count = int((cur.fetchone() or {}).get("n") or 0)

    fd_c, fd_a = _find_filter_clauses(
        iid,
        strategies=strategies,
        sides=sides,
        effects=effects,
        symbols=symbols,
        years=years,
        months=months,
        days=days,
        campaigns=campaigns,
    )
    clauses.extend(fd_c)
    args.extend(fd_a)

    status_toks = [
        t
        for t in _csv_values(statuses)
        if t in ("Open", "Complete", "Orphan close", "none")
    ]

    where = " AND ".join(clauses)
    accounts = _load_accounts(cur, iid)

    if status_toks:
        cur.execute(
            f"""SELECT * FROM member_trade_log_trades
                WHERE {where}
                ORDER BY exec_at DESC, id DESC LIMIT %s""",
            tuple(args + [_BLOTTER_STATUS_BUDGET + 1]),
        )
        raw = list(cur.fetchall())
        if len(raw) > _BLOTTER_STATUS_BUDGET:
            raise HTTPException(status_code=422, detail=_STATUS_BUDGET_DETAIL)
        pool = _rows_to_trades(cur, raw, iid)
        st_map = blotter_status_by_id(pool)
        want = set(status_toks)
        picked = []
        for t in pool:
            token = st_map.get(int(t["id"])) or "none"
            if token in want:
                picked.append(t)
        match_count = len(picked)
        if before_exec is not None and before_id is not None:
            picked = [
                t
                for t in picked
                if _cursor_before(t, before_exec, before_id)
            ]
        has_more = len(picked) > limit
        trades = picked[:limit]
        next_cursor = (
            _encode_list_cursor(trades[-1]) if has_more and trades else None
        )
        return trades, accounts, has_more, next_cursor, match_count, book_count

    cur.execute(
        f"SELECT COUNT(*) AS n FROM member_trade_log_trades WHERE {where}",
        tuple(args),
    )
    match_count = int((cur.fetchone() or {}).get("n") or 0)

    if positions_only:
        join = _position_leg_join_sql().format(alias="t")
        pred = _position_row_predicate("t")
        base = f"""SELECT t.* FROM (
                      SELECT * FROM member_trade_log_trades
                       WHERE {where}
                    ) t
                    {join}
                   WHERE {pred}"""
        pos_args = args + [iid]
        if before_exec is not None and before_id is not None:
            cur.execute(
                f"""{base}
                      AND (t.exec_at < %s OR (t.exec_at = %s AND t.id < %s))
                    ORDER BY t.exec_at DESC, t.id DESC LIMIT %s""",
                tuple(pos_args + [before_exec, before_exec, before_id, fetch_n]),
            )
        else:
            cur.execute(
                f"""{base}
                    ORDER BY t.exec_at DESC, t.id DESC LIMIT %s""",
                tuple(pos_args + [fetch_n]),
            )
    elif before_exec is not None and before_id is not None:
        cur.execute(
            f"""SELECT * FROM member_trade_log_trades
                WHERE {where}
                  AND (exec_at < %s OR (exec_at = %s AND id < %s))
                ORDER BY exec_at DESC, id DESC LIMIT %s""",
            tuple(args + [before_exec, before_exec, before_id, fetch_n]),
        )
    else:
        cur.execute(
            f"""SELECT * FROM member_trade_log_trades
                WHERE {where}
                ORDER BY exec_at DESC, id DESC LIMIT %s""",
            tuple(args + [fetch_n]),
        )
    rows = list(cur.fetchall())
    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]
    trades = _rows_to_trades(cur, rows, iid)
    next_cursor = _encode_list_cursor(trades[-1]) if has_more and trades else None
    return trades, accounts, has_more, next_cursor, match_count, book_count


def _cursor_before(trade: dict, before_exec: str, before_id: int) -> bool:
    exec_at = str(trade.get("exec_at") or "").replace("T", " ").replace("Z", "")
    if len(exec_at) > 19:
        exec_at = exec_at[:19]
    be = str(before_exec).replace("T", " ").replace("Z", "")
    if len(be) > 19:
        be = be[:19]
    tid = int(trade.get("id") or 0)
    if exec_at < be:
        return True
    if exec_at == be and tid < before_id:
        return True
    return False


def _position_leg_join_sql() -> str:
    """Leg aggregates so a close-out is not a second position."""
    return """
    LEFT JOIN (
      SELECT trade_id,
             SUM(CASE WHEN pos_effect = 'TO_CLOSE' THEN 1 ELSE 0 END) AS n_close,
             SUM(CASE WHEN pos_effect = 'TO_OPEN' THEN 1 ELSE 0 END) AS n_open
        FROM member_trade_log_legs
       WHERE identity_id = %s
       GROUP BY trade_id
    ) _posleg ON _posleg.trade_id = {alias}.id
    """


def _position_book_from_sql(alias: str = "t") -> str:
    """FROM + WHERE for this identity's position rows (not notes / close-outs).

    Two %s placeholders, both identity_id (leg-join then owner).
    """
    join = _position_leg_join_sql().format(alias=alias)
    pred = _position_row_predicate(alias)
    return (
        f"member_trade_log_trades {alias} {join} "
        f"WHERE {alias}.identity_id = %s AND {pred}"
    )


def _position_row_predicate(alias: str = "x") -> str:
    """A position is a typed structure (single / vertical / butterfly / …).

    Close-out rows (more TO_CLOSE legs than TO_OPEN) are the same position,
    not another. Notes are not positions. Untyped market rows count as Single.
    """
    return (
        f"COALESCE({alias}.strategy, '') <> 'NOTE' "
        f"AND COALESCE(_posleg.n_close, 0) <= COALESCE(_posleg.n_open, 0)"
    )


def found_set_stats(
    cur,
    iid: int,
    *,
    strategies: str | None = None,
    sides: str | None = None,
    effects: str | None = None,
    symbols: str | None = None,
    years: str | None = None,
    months: str | None = None,
    days: str | None = None,
    campaigns: str | None = None,
) -> dict:
    """Date span + position count for the current Find and tag filters."""
    clauses = ["identity_id = %s", "exec_at IS NOT NULL"]
    args: list[Any] = [iid]
    fd_c, fd_a = _find_filter_clauses(
        iid,
        strategies=strategies,
        sides=sides,
        effects=effects,
        symbols=symbols,
        years=years,
        months=months,
        days=days,
        campaigns=campaigns,
    )
    clauses.extend(fd_c)
    args.extend(fd_a)
    where = " AND ".join(clauses)
    join = _position_leg_join_sql().format(alias="x")
    pred = _position_row_predicate("x")
    cur.execute(
        f"""SELECT DATE(MIN(x.exec_at)) AS first_day,
                   DATE(MAX(x.exec_at)) AS last_day,
                   COUNT(*) AS position_count
              FROM (
                    SELECT * FROM member_trade_log_trades
                     WHERE {where}
                   ) x
              {join}
             WHERE {pred}""",
        tuple(args + [iid]),
    )
    row = cur.fetchone() or {}

    def ymd(v: object) -> str | None:
        if v is None:
            return None
        s = str(v)
        return s[:10] if len(s) >= 10 else s

    item_join = _position_leg_join_sql().format(alias="t")
    item_pred = _position_row_predicate("t")
    cur.execute(
        f"""SELECT t.id, t.practice_campaign_id, t.exec_at
              FROM (
                    SELECT * FROM member_trade_log_trades
                     WHERE {where}
                   ) t
              {item_join}
             WHERE {item_pred}
             ORDER BY t.exec_at DESC, t.id DESC
             LIMIT %s""",
        tuple(args + [iid, _TRADE_BOOK_LIMIT]),
    )
    items = [
        {
            "id": int(r["id"]),
            "practice_campaign_id": (
                None
                if r.get("practice_campaign_id") is None
                else int(r["practice_campaign_id"])
            ),
            "exec_at": ymd(r.get("exec_at")),
        }
        for r in (cur.fetchall() or [])
    ]
    return {
        "first_day": ymd(row.get("first_day")),
        "last_day": ymd(row.get("last_day")),
        "position_count": int(row.get("position_count") or 0),
        "items": items,
    }


def trade_distincts(cur, iid: int) -> dict:
    """AutoFilter choices from the found-set universe (positions only).

    Close-outs and NOTE fills are not listed — selecting a listed value must
    be able to retrieve at least one position (not a false empty set).
    """
    book = _position_book_from_sql("t")
    pos_args = (iid, iid)

    def _ymd(v: object) -> str | None:
        if v is None:
            return None
        s = str(v)
        return s[:10] if len(s) >= 10 else s

    cur.execute(
        f"""SELECT DISTINCT DATE(t.exec_at) AS d
              FROM {book}
               AND t.exec_at IS NOT NULL
             ORDER BY d DESC
             LIMIT 4000""",
        pos_args,
    )
    days = [x for x in (_ymd(r.get("d")) for r in (cur.fetchall() or [])) if x]
    months: list[str] = []
    seen_m: set[str] = set()
    for d in days:
        ym = d[:7]
        if ym not in seen_m:
            seen_m.add(ym)
            months.append(ym)
    cur.execute(
        f"""SELECT DISTINCT t.strategy AS strategy
              FROM {book}
               AND t.strategy IS NOT NULL AND t.strategy <> ''
             ORDER BY t.strategy""",
        pos_args,
    )
    strategies = [str(r["strategy"]) for r in (cur.fetchall() or [])]
    cur.execute(
        f"""SELECT DISTINCT UPPER(t.net_side) AS s
              FROM {book}
               AND t.net_side IS NOT NULL AND t.net_side <> ''""",
        pos_args,
    )
    sides = sorted({str(r["s"]) for r in (cur.fetchall() or []) if r.get("s")})
    cur.execute(
        f"""SELECT DISTINCT l.pos_effect AS pos_effect
              FROM member_trade_log_legs l
             WHERE l.identity_id = %s
               AND l.pos_effect IN ('TO_OPEN', 'TO_CLOSE')
               AND l.trade_id IN (SELECT t.id FROM {book})""",
        (iid, *pos_args),
    )
    effects = sorted(
        {str(r["pos_effect"]) for r in (cur.fetchall() or []) if r.get("pos_effect")}
    )
    cur.execute(
        f"""SELECT DISTINCT COALESCE(NULLIF(l.underlier, ''), NULLIF(l.symbol, '')) AS sym
              FROM member_trade_log_legs l
             WHERE l.identity_id = %s
               AND l.trade_id IN (SELECT t.id FROM {book})
               AND COALESCE(NULLIF(l.underlier, ''), NULLIF(l.symbol, '')) IS NOT NULL
             ORDER BY sym
             LIMIT 400""",
        (iid, *pos_args),
    )
    symbols = [str(r["sym"]) for r in (cur.fetchall() or []) if r.get("sym")]
    cur.execute(
        f"""SELECT DISTINCT t.practice_campaign_id AS practice_campaign_id
              FROM {book}""",
        pos_args,
    )
    campaigns = []
    seen_none = False
    ids: list[int] = []
    for r in cur.fetchall() or []:
        cid = r.get("practice_campaign_id")
        if cid is None:
            seen_none = True
        else:
            ids.append(int(cid))
    if seen_none:
        campaigns.append({"id": None, "title": "None"})
    if ids:
        cur.execute(
            f"""SELECT id, title FROM member_practice_campaigns
                 WHERE identity_id = %s AND id IN ({",".join(["%s"] * len(ids))})""",
            tuple([iid, *ids]),
        )
        titles = {int(r["id"]): str(r["title"] or f"#{r['id']}") for r in (cur.fetchall() or [])}
        for i in sorted(ids):
            campaigns.append({"id": i, "title": titles.get(i, f"#{i}")})
    return {
        "days": days,
        "months": months,
        "strategies": strategies,
        "sides": sides,
        "effects": effects,
        "symbols": symbols,
        "campaigns": campaigns,
    }


def blotter_distincts(cur, iid: int, account_id: int | None) -> dict:
    """Account-book Autofilter lists (trades, not Find and Badge positions).

    Status distincts require in-memory match. Over ``_BLOTTER_STATUS_BUDGET``
    fails loud (O3).
    """
    clauses = ["identity_id = %s"]
    args: list[Any] = [iid]
    if account_id is not None:
        _get_account(cur, iid, account_id)
        clauses.append("account_id = %s")
        args.append(account_id)
    where = " AND ".join(clauses)

    def _ymd(v: object) -> str | None:
        if v is None:
            return None
        s = str(v)
        return s[:10] if len(s) >= 10 else s

    cur.execute(
        f"""SELECT DISTINCT DATE(exec_at) AS d
              FROM member_trade_log_trades
             WHERE {where} AND exec_at IS NOT NULL
             ORDER BY d DESC
             LIMIT 4000""",
        tuple(args),
    )
    days = [x for x in (_ymd(r.get("d")) for r in (cur.fetchall() or [])) if x]
    cur.execute(
        f"""SELECT DISTINCT strategy AS strategy
              FROM member_trade_log_trades
             WHERE {where} AND strategy IS NOT NULL AND strategy <> ''
             ORDER BY strategy""",
        tuple(args),
    )
    strategies = [str(r["strategy"]) for r in (cur.fetchall() or [])]
    cur.execute(
        f"""SELECT DISTINCT COALESCE(NULLIF(l.underlier, ''), NULLIF(l.symbol, '')) AS sym
              FROM member_trade_log_legs l
             WHERE l.identity_id = %s
               AND l.trade_id IN (
                    SELECT id FROM member_trade_log_trades WHERE {where}
               )
               AND COALESCE(NULLIF(l.underlier, ''), NULLIF(l.symbol, '')) IS NOT NULL
             ORDER BY sym
             LIMIT 400""",
        tuple([iid, *args]),
    )
    symbols = [str(r["sym"]) for r in (cur.fetchall() or []) if r.get("sym")]
    cur.execute(
        f"""SELECT DISTINCT practice_campaign_id
              FROM member_trade_log_trades WHERE {where}""",
        tuple(args),
    )
    campaigns: list[str] = []
    seen_none = False
    ids: list[int] = []
    for r in cur.fetchall() or []:
        cid = r.get("practice_campaign_id")
        if cid is None:
            seen_none = True
        else:
            ids.append(int(cid))
    if seen_none:
        campaigns.append("none")
    campaigns.extend(str(i) for i in sorted(ids))

    cur.execute(
        f"""SELECT * FROM member_trade_log_trades
             WHERE {where}
             ORDER BY exec_at DESC, id DESC LIMIT %s""",
        tuple(args + [_BLOTTER_STATUS_BUDGET + 1]),
    )
    raw = list(cur.fetchall())
    if len(raw) > _BLOTTER_STATUS_BUDGET:
        raise HTTPException(status_code=422, detail=_STATUS_BUDGET_DETAIL)
    pool = _rows_to_trades(cur, raw, iid)
    st_map = blotter_status_by_id(pool)
    statuses = sorted({st_map[int(t["id"])] for t in pool if int(t["id"]) in st_map})
    if any(int(t["id"]) not in st_map for t in pool):
        statuses.append("none")
    return {
        "days": days,
        "strategies": strategies,
        "symbols": symbols,
        "campaigns": campaigns,
        "statuses": statuses,
    }

