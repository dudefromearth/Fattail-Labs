"""Campaign phase report strip — read-time aggregates (Spec §6 · P8 · P13).

No second equity store. Free margin uses structure_risk_open (defined max loss),
never broker maintenance margin. API must not expose margin_at_risk.
"""

from __future__ import annotations

from typing import Any

import capital_domain as cap
from capital_positions import open_qty_and_avg_cost
from trade_log_domain.matching import match_open_close
from trade_log_domain.structure import (
    multiplier,
    net_cash_points,
    structure_wing_width,
    unit_qty,
)


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _structure_risk_dollars(trade: dict) -> float:
    """Defined max loss at open (points × mult × unit qty). Fallback: cost basis."""
    cash = net_cash_points(trade)
    width = structure_wing_width(trade)
    mult = float(multiplier(trade) or 100)
    uq = float(unit_qty(trade) or 1)
    risk_pts: float | None = None
    if cash is not None and width is not None and width > 0:
        if cash < 0:
            risk_pts = abs(cash)
        elif cash > 0:
            risk_pts = max(0.0, width - cash)
    if risk_pts is not None and risk_pts > 0:
        return risk_pts * mult * uq
    _, _, basis = open_qty_and_avg_cost(trade)
    return float(basis or 0)


def _load_trades_for_scope(cur, identity_id: int, account_id: int | None) -> list[dict]:
    """Book load for open matching — same path as Positions valuation."""
    from routes.trade_log.common import _load_member_book

    trades, _accounts = _load_member_book(cur, identity_id, account_id)
    return list(trades or [])


def _open_structures(cur, identity_id: int, account_id: int | None) -> list[dict]:
    trades = _load_trades_for_scope(cur, identity_id, account_id)
    matched = match_open_close(trades)
    return [m["open"] for m in matched if m.get("close") is None and m.get("open")]


def free_cash_for_scope(
    cur, identity_id: int, account_id: int | None
) -> tuple[float | None, int]:
    """balance − open cost basis. account_id null → identity total (OD-free-cash-scope)."""
    if account_id is not None:
        accounts = [
            a
            for a in cap.list_account_balances(cur, identity_id)
            if int(a["id"]) == int(account_id)
        ]
    else:
        accounts = list(cap.list_account_balances(cur, identity_id))
    if not accounts:
        return None, 0
    balance = sum(float(a.get("current_balance") or 0) for a in accounts)
    open_cost = 0.0
    n_open = 0
    if account_id is not None:
        opens = _open_structures(cur, identity_id, int(account_id))
        for t in opens:
            _, _, basis = open_qty_and_avg_cost(t)
            open_cost += float(basis or 0)
            n_open += 1
    else:
        # all modeled books
        for a in accounts:
            opens = _open_structures(cur, identity_id, int(a["id"]))
            for t in opens:
                _, _, basis = open_qty_and_avg_cost(t)
                open_cost += float(basis or 0)
                n_open += 1
    return balance - open_cost, n_open


def free_margin_for_scope(
    cur, identity_id: int, account_id: int | None
) -> tuple[float | None, float | None, float | None]:
    """(free_margin, bp, structure_risk_open). free_margin null if no BP."""
    if account_id is not None:
        accounts = [
            a
            for a in cap.list_account_balances(cur, identity_id)
            if int(a["id"]) == int(account_id)
        ]
    else:
        accounts = [
            a
            for a in cap.list_account_balances(cur, identity_id)
            if (a.get("status") or "active") == "active"
        ]
    bp_sum = 0.0
    bp_any = False
    for a in accounts:
        posture = (a.get("buying_power_posture") or "arbitrary").lower()
        bp_v = _f(a.get("buying_power_value"))
        if posture not in ("arbitrary",) and bp_v is not None:
            bp_sum += bp_v
            bp_any = True
        elif bp_v is not None and posture in ("declared", "self_reported", "live"):
            bp_sum += bp_v
            bp_any = True
        elif bp_v is not None:
            # self-reported value present even if posture arbitrary — use when set
            bp_sum += bp_v
            bp_any = True
    if not bp_any:
        # structure risk still useful to compute for transparency?
        risk = 0.0
        for a in accounts:
            for t in _open_structures(cur, identity_id, int(a["id"])):
                risk += _structure_risk_dollars(t)
        return None, None, risk if accounts else None

    risk = 0.0
    for a in accounts:
        for t in _open_structures(cur, identity_id, int(a["id"])):
            risk += _structure_risk_dollars(t)
    return bp_sum - risk, bp_sum, risk


def campaign_trading_pnls(cur, identity_id: int, campaign_id: int) -> list[float]:
    cur.execute(
        """SELECT pnl_amount FROM member_trade_log_trades
           WHERE identity_id = %s AND practice_campaign_id = %s
             AND pnl_amount IS NOT NULL
           ORDER BY exec_at ASC, id ASC""",
        (identity_id, campaign_id),
    )
    out: list[float] = []
    for r in cur.fetchall() or []:
        try:
            out.append(float(r["pnl_amount"]))
        except (TypeError, ValueError, KeyError):
            pass
    return out


def realized_dd_pct_of_allocation(
    pnls: list[float], allocation: float | None
) -> float | None:
    """P13 — peak-to-trough $ on campaign trading curve as % of allocation.

    Trading curve starts at 0 (fill P&L only). Denominator is campaign
    allocation (same base as declared max DD%), not peak equity and not
    master campaign-blind book.
    """
    if allocation is None or allocation <= 0:
        return None
    if not pnls:
        return 0.0
    running = 0.0
    peak = 0.0
    max_dd_dollars = 0.0  # most negative
    for p in pnls:
        running += float(p)
        peak = max(peak, running)
        max_dd_dollars = min(max_dd_dollars, running - peak)
    return abs(max_dd_dollars) / float(allocation) * 100.0


def strategy_mix(cur, identity_id: int, campaign_id: int) -> list[dict]:
    cur.execute(
        """SELECT COALESCE(NULLIF(TRIM(strategy), ''), 'UNKNOWN') AS strategy,
                  COUNT(*) AS n
           FROM member_trade_log_trades
           WHERE identity_id = %s AND practice_campaign_id = %s
           GROUP BY COALESCE(NULLIF(TRIM(strategy), ''), 'UNKNOWN')
           ORDER BY n DESC, strategy ASC""",
        (identity_id, campaign_id),
    )
    rows = cur.fetchall() or []
    total = sum(int(r["n"] or 0) for r in rows) or 0
    out = []
    for r in rows:
        n = int(r["n"] or 0)
        out.append(
            {
                "strategy": r.get("strategy") or "UNKNOWN",
                "count": n,
                "share": (n / total) if total else 0.0,
            }
        )
    return out


def build_phase_report(cur, identity_id: int, campaign_row: dict) -> dict:
    """Full strip payload. Never includes margin_at_risk key."""
    aid = campaign_row.get("account_id")
    try:
        account_id = int(aid) if aid is not None else None
    except (TypeError, ValueError):
        account_id = None
    free_cash, n_open = free_cash_for_scope(cur, identity_id, account_id)
    free_margin, bp, structure_risk = free_margin_for_scope(
        cur, identity_id, account_id
    )
    allocation = _f(campaign_row.get("starting_capital"))
    declared_dd = _f(campaign_row.get("max_drawdown_pct"))
    pnls = campaign_trading_pnls(cur, identity_id, int(campaign_row["id"]))
    realized = realized_dd_pct_of_allocation(pnls, allocation)
    mix = strategy_mix(cur, identity_id, int(campaign_row["id"]))
    return {
        "free_cash": free_cash,
        "free_margin": free_margin,
        "buying_power": bp,
        "structure_risk_open": structure_risk,
        "open_structure_count": n_open,
        "allocation": allocation,
        "declared_max_drawdown_pct": declared_dd,
        "realized_max_drawdown_pct": realized,
        "strategy_mix": mix,
        "scope": "account" if account_id is not None else "identity",
    }
