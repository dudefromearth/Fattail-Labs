"""Identity-level capital: balances, movements, trading curve, master DD.

Specs: Capital v0.3 · Funding v0.2 · Staleness v0.1
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any


class CapitalError(Exception):
    def __init__(self, code: int, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(detail)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _export_key(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    s = str(raw).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except ValueError as exc:
        raise CapitalError(422, f"invalid datetime: {raw!r}") from exc


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def account_fill_pnl_sum(cur, identity_id: int, account_id: int) -> float:
    cur.execute(
        """SELECT COALESCE(SUM(pnl_amount), 0) AS s
           FROM member_trade_log_trades
           WHERE identity_id = %s AND account_id = %s
             AND pnl_amount IS NOT NULL""",
        (identity_id, account_id),
    )
    return float((cur.fetchone() or {}).get("s") or 0)


def account_movements_sum(cur, identity_id: int, account_id: int) -> float:
    cur.execute(
        """SELECT COALESCE(SUM(amount), 0) AS s
           FROM member_account_cash_movements
           WHERE identity_id = %s AND account_id = %s""",
        (identity_id, account_id),
    )
    return float((cur.fetchone() or {}).get("s") or 0)


def current_balance(cur, identity_id: int, account_id: int, *, starting: float | None) -> float:
    """Ring 1: start + fill P&L + cash movements."""
    start = float(starting or 0)
    return start + account_fill_pnl_sum(cur, identity_id, account_id) + account_movements_sum(
        cur, identity_id, account_id
    )


def list_account_balances(cur, identity_id: int) -> list[dict]:
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s
           ORDER BY status ASC, sort_order ASC, id ASC""",
        (identity_id,),
    )
    out = []
    total = 0.0
    for r in cur.fetchall() or []:
        aid = int(r["id"])
        start = _f(r.get("starting_balance"))
        bal = current_balance(cur, identity_id, aid, starting=start)
        if r.get("status") == "active" or bal != 0:
            total += bal
        bp_as = r.get("buying_power_as_of")
        out.append(
            {
                "id": aid,
                "label": r.get("label") or "",
                "broker": r.get("broker"),
                "status": r.get("status") or "active",
                "starting_balance": start,
                "starting_balance_set": start is not None,
                "fill_pnl_sum": account_fill_pnl_sum(cur, identity_id, aid),
                "movements_sum": account_movements_sum(cur, identity_id, aid),
                "current_balance": bal,
                # V5 interim: stated = derived (OD-SV not shipped)
                "stated_value": None,
                "account_value": bal,
                "account_value_kind": "derived",
                "buying_power_posture": r.get("buying_power_posture") or "arbitrary",
                "buying_power_value": _f(r.get("buying_power_value")),
                "buying_power_as_of": (
                    bp_as.isoformat() + "Z" if hasattr(bp_as, "isoformat") else None
                ),
            }
        )
    return out


def patch_account_buying_power(
    cur, identity_id: int, account_id: int, body: dict
) -> dict:
    """Per-account BP (Positions View Spec v0.2 · PV-2)."""
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise CapitalError(404, "Account not found")
    posture = body.get("buying_power_posture", row.get("buying_power_posture") or "arbitrary")
    posture = str(posture or "arbitrary").lower()
    if posture not in ("arbitrary", "self_report", "live_sync"):
        raise CapitalError(422, "invalid buying_power_posture")
    if "buying_power_value" in body:
        bp_v = _f(body.get("buying_power_value"))
    else:
        bp_v = _f(row.get("buying_power_value"))
    bp_as = row.get("buying_power_as_of")
    if "buying_power_value" in body or body.get("buying_power_posture") is not None:
        if posture == "self_report" and bp_v is not None:
            bp_as = _utcnow()
        elif posture == "arbitrary":
            bp_v = None
            bp_as = None
    cur.execute(
        """UPDATE member_trade_log_accounts
           SET buying_power_posture = %s,
               buying_power_value = %s,
               buying_power_as_of = %s
           WHERE id = %s AND identity_id = %s""",
        (posture, bp_v, bp_as, account_id, identity_id),
    )
    return next(
        a for a in list_account_balances(cur, identity_id) if a["id"] == account_id
    )


def total_net_capital(cur, identity_id: int) -> float:
    return sum(float(a["current_balance"]) for a in list_account_balances(cur, identity_id))


def trading_curve_pnls(cur, identity_id: int) -> list[float]:
    """Fill P&L only, chronological — all accounts (campaign-blind)."""
    cur.execute(
        """SELECT pnl_amount FROM member_trade_log_trades
           WHERE identity_id = %s AND pnl_amount IS NOT NULL
           ORDER BY exec_at ASC, id ASC""",
        (identity_id,),
    )
    out: list[float] = []
    for r in cur.fetchall() or []:
        try:
            out.append(float(r["pnl_amount"]))
        except (TypeError, ValueError):
            continue
    return out


def realized_dd_dollars(pnls: list[float]) -> float:
    """Peak-to-trough dollars on trading curve (starts at 0). Funding §3.4."""
    if not pnls:
        return 0.0
    cum = 0.0
    peak = 0.0
    max_dd = 0.0
    for p in pnls:
        cum += p
        peak = max(peak, cum)
        max_dd = max(max_dd, peak - cum)
    return max_dd


def get_or_create_prefs(cur, identity_id: int) -> dict:
    cur.execute(
        "SELECT * FROM member_capital_prefs WHERE identity_id = %s",
        (identity_id,),
    )
    row = cur.fetchone()
    if row:
        return _serialize_prefs(row)
    cur.execute(
        """INSERT INTO member_capital_prefs
             (identity_id, tolerated_master_drawdown, tolerated_master_drawdown_form,
              buying_power_posture, export_key)
           VALUES (%s, 6, 'percent', 'arbitrary', %s)""",
        (identity_id, _export_key("cap")),
    )
    cur.execute(
        "SELECT * FROM member_capital_prefs WHERE identity_id = %s",
        (identity_id,),
    )
    return _serialize_prefs(cur.fetchone())


def _serialize_prefs(row: dict) -> dict:
    return {
        "tolerated_master_drawdown": _f(row.get("tolerated_master_drawdown")),
        "tolerated_master_drawdown_form": row.get("tolerated_master_drawdown_form")
        or "percent",
        "buying_power_posture": row.get("buying_power_posture") or "arbitrary",
        "buying_power_value": _f(row.get("buying_power_value")),
        "buying_power_as_of": (
            row["buying_power_as_of"].isoformat() + "Z"
            if row.get("buying_power_as_of")
            else None
        ),
        "balances_confirmed_at": (
            row["balances_confirmed_at"].isoformat() + "Z"
            if row.get("balances_confirmed_at")
            else None
        ),
        "export_key": row.get("export_key"),
    }


def patch_prefs(cur, identity_id: int, body: dict) -> dict:
    prefs = get_or_create_prefs(cur, identity_id)
    tol = body.get("tolerated_master_drawdown", ...)
    form = body.get("tolerated_master_drawdown_form", ...)
    posture = body.get("buying_power_posture", ...)
    bp_val = body.get("buying_power_value", ...)
    confirm = body.get("confirm_balances")

    tol_v = prefs["tolerated_master_drawdown"] if tol is ... else _f(tol)
    form_v = (
        prefs["tolerated_master_drawdown_form"]
        if form is ...
        else str(form or "percent").lower()
    )
    if form_v not in ("percent", "dollars"):
        raise CapitalError(422, "tolerated_master_drawdown_form must be percent|dollars")
    pos_v = (
        prefs["buying_power_posture"]
        if posture is ...
        else str(posture or "arbitrary").lower()
    )
    if pos_v not in ("arbitrary", "self_report", "live_sync"):
        raise CapitalError(422, "invalid buying_power_posture")
    bp_v = prefs["buying_power_value"] if bp_val is ... else _f(bp_val)
    bp_as_of = prefs.get("buying_power_as_of")
    if bp_val is not ... and pos_v == "self_report":
        bp_as_of_dt = _utcnow()
    else:
        bp_as_of_dt = _parse_dt(bp_as_of) if isinstance(bp_as_of, str) else None

    conf_dt = None
    if confirm:
        conf_dt = _utcnow()
    else:
        cur.execute(
            "SELECT balances_confirmed_at FROM member_capital_prefs WHERE identity_id=%s",
            (identity_id,),
        )
        r = cur.fetchone() or {}
        conf_dt = r.get("balances_confirmed_at")

    cur.execute(
        """UPDATE member_capital_prefs
           SET tolerated_master_drawdown = %s,
               tolerated_master_drawdown_form = %s,
               buying_power_posture = %s,
               buying_power_value = %s,
               buying_power_as_of = %s,
               balances_confirmed_at = COALESCE(%s, balances_confirmed_at)
           WHERE identity_id = %s""",
        (
            tol_v,
            form_v,
            pos_v,
            bp_v,
            bp_as_of_dt,
            conf_dt if confirm else None,
            identity_id,
        ),
    )
    if confirm and conf_dt:
        cur.execute(
            """UPDATE member_capital_prefs
               SET balances_confirmed_at = %s WHERE identity_id = %s""",
            (conf_dt, identity_id),
        )
    return get_or_create_prefs(cur, identity_id)


def tolerance_budget_dollars(prefs: dict, total_capital: float) -> float | None:
    val = prefs.get("tolerated_master_drawdown")
    if val is None:
        return None
    form = prefs.get("tolerated_master_drawdown_form") or "percent"
    if form == "dollars":
        return float(val)
    return (float(val) / 100.0) * float(total_capital)


def capital_overview(cur, identity_id: int) -> dict:
    accounts = list_account_balances(cur, identity_id)
    total = sum(float(a["current_balance"]) for a in accounts if a.get("status") == "active")
    # include non-active with nonzero balance for honesty
    total = sum(float(a["current_balance"]) for a in accounts)
    prefs = get_or_create_prefs(cur, identity_id)
    pnls = trading_curve_pnls(cur, identity_id)
    realized = realized_dd_dollars(pnls)
    budget = tolerance_budget_dollars(prefs, total)
    over = budget is not None and realized > budget
    return {
        "accounts": accounts,
        "total_net_capital": total,
        "prefs": prefs,
        "master_drawdown": {
            "realized_dd_dollars": realized,
            "tolerance_budget_dollars": budget,
            "over_budget": over,
            "sample_n": len(pnls),
        },
        "witnesses": {
            "master_dd": (
                f"Trading drawdown ${realized:,.0f} vs budget "
                f"${budget:,.0f}"
                if over and budget is not None
                else None
            ),
        },
    }


def list_movements(cur, identity_id: int, account_id: int) -> list[dict]:
    cur.execute(
        """SELECT * FROM member_account_cash_movements
           WHERE identity_id = %s AND account_id = %s
           ORDER BY occurred_at DESC, id DESC""",
        (identity_id, account_id),
    )
    out = []
    for r in cur.fetchall() or []:
        out.append(
            {
                "id": int(r["id"]),
                "account_id": int(r["account_id"]),
                "amount": float(r["amount"]),
                "occurred_at": r["occurred_at"].isoformat() if r.get("occurred_at") else None,
                "recorded_at": r["recorded_at"].isoformat() if r.get("recorded_at") else None,
                "note": r.get("note") or "",
                "reverses_movement_id": (
                    int(r["reverses_movement_id"])
                    if r.get("reverses_movement_id") is not None
                    else None
                ),
            }
        )
    return out


def add_movement(
    cur,
    identity_id: int,
    account_id: int,
    *,
    amount: float,
    occurred_at: Any = None,
    note: str | None = None,
    reverses_movement_id: int | None = None,
) -> dict:
    if amount == 0:
        raise CapitalError(422, "amount must be non-zero (validation, not enforcement)")
    when = _parse_dt(occurred_at) or _utcnow()
    cur.execute(
        """SELECT id FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, identity_id),
    )
    if not cur.fetchone():
        raise CapitalError(404, "Account not found")
    cur.execute(
        """INSERT INTO member_account_cash_movements
             (identity_id, account_id, amount, occurred_at, recorded_at, note,
              reverses_movement_id, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            identity_id,
            account_id,
            float(amount),
            when,
            _utcnow(),
            (note or "").strip() or None,
            reverses_movement_id,
            _export_key("mvt"),
        ),
    )
    mid = int(cur.lastrowid)
    cur.execute(
        "SELECT * FROM member_account_cash_movements WHERE id = %s",
        (mid,),
    )
    r = cur.fetchone() or {}
    return {
        "id": mid,
        "account_id": account_id,
        "amount": float(r.get("amount") or amount),
        "occurred_at": r["occurred_at"].isoformat() if r.get("occurred_at") else None,
        "recorded_at": r["recorded_at"].isoformat() if r.get("recorded_at") else None,
        "note": r.get("note") or "",
        "reverses_movement_id": (
            int(r["reverses_movement_id"])
            if r.get("reverses_movement_id") is not None
            else None
        ),
    }
