"""Positions valuation — open book × Market Bus underliers + OPF packages.

Spec: Accounts & Capital and Positions View v0.2
Plane: bus-first underlier (mb:sym) · option package-quote (OPF).
V17: stale-for-ticking ≠ unusable-for-valuation (weekend rule).
OD-MC: cash omitted from deployability until match-cash ratified.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from market_data import live_marks as lm
from market_data.open_book_marks import quote_open_option_structure
from market_data.underlier_marks import (
    ensure_fresh_underlier_marks,
    get_underlier_mark,
)
from trade_log_domain.matching import match_open_close
from trade_log_domain.structure import (
    multiplier,
    net_cash_points,
    structure_key,
    trade_is_close_fill,
    unit_qty,
)


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _underlier(trade: dict) -> str | None:
    for leg in trade.get("legs") or []:
        u = (leg.get("underlier") or leg.get("symbol") or "").strip().upper()
        if u:
            return u
    return None


def _asset_class(trade: dict) -> str:
    ac = (trade.get("asset_class") or "").lower()
    if ac:
        return ac
    for leg in trade.get("legs") or []:
        lac = (leg.get("asset_class") or "").lower()
        if lac:
            return lac
    return "equity_option"


def _is_equity_like(trade: dict) -> bool:
    """True for share positions (STOCK strategy or equity legs, no option fields)."""
    if str(trade.get("strategy") or "").upper() == "STOCK":
        return True
    ac = _asset_class(trade)
    if ac in ("equity", "stock"):
        return True
    legs = trade.get("legs") or []
    if not legs:
        return False
    return all(
        str(l.get("asset_class") or ac).lower() in ("equity", "stock")
        or (
            not l.get("expiry")
            and l.get("strike") is None
            and not l.get("right")
            and not l.get("option_right")
        )
        for l in legs
    )


def structure_display_name(trade: dict) -> str:
    """Human structure name for the position row."""
    under = _underlier(trade) or "?"
    strat = (trade.get("strategy") or "CUSTOM").upper()
    if _is_equity_like(trade):
        return under
    strikes = []
    for leg in trade.get("legs") or []:
        if leg.get("strike") is not None:
            try:
                strikes.append(float(leg["strike"]))
            except (TypeError, ValueError):
                pass
    strikes = sorted(set(strikes))
    if strikes:
        body = "/".join(
            str(int(s)) if s == int(s) else str(s) for s in strikes
        )
        label = {
            "BUTTERFLY": "fly",
            "IRON_CONDOR": "IC",
            "VERTICAL": "vert",
            "CALENDAR": "cal",
            "DIAGONAL": "diag",
        }.get(strat, strat.lower())
        return f"{under} {body} {label}"
    return f"{under} {strat}"


def _contract_multiplier(trade: dict) -> int:
    """Dollar multiplier for valuation.

    Equity-like rows (shares, no option fields) always use 1 — even when the
    trade/leg ``asset_class`` is mis-tagged as equity_option (common on import).
    Options keep the 100× (or structure.multiplier) contract factor.
    """
    if _is_equity_like(trade):
        return 1
    return int(multiplier(trade) or 100)


def open_qty_and_avg_cost(trade: dict) -> tuple[float, float | None, float | None]:
    """Return (signed_qty, avg_cost_per_share_or_point, cost_basis_dollars).

    Equity: qty = net open shares; cost basis = Σ |fill| × qty × 1.
    Options: unit structure qty; cost basis from net debit/credit × mult × unit_qty.
    """
    legs = trade.get("legs") or []
    mult = _contract_multiplier(trade)
    if _is_equity_like(trade):
        net_q = 0.0
        cost_sum = 0.0
        for leg in legs:
            q = abs(float(leg.get("quantity") or 0))
            side = (leg.get("side") or "").upper()
            pe = (leg.get("pos_effect") or "").upper()
            px = _f(leg.get("fill_price")) or 0.0
            signed = q if side == "BUY" else -q
            # TO_CLOSE flips economically when present alone
            if pe == "TO_CLOSE":
                signed = -signed
            net_q += signed
            cost_sum += abs(signed) * px * mult  # mult is 1 for equity
        qty = abs(net_q) if net_q != 0 else abs(
            sum(float(l.get("quantity") or 0) for l in legs)
        )
        if qty <= 0:
            qty = 1.0
        avg = (cost_sum / qty) if qty else None
        # Long equity cost basis positive cash out
        basis = cost_sum if net_q >= 0 else cost_sum
        return float(net_q if net_q != 0 else qty), avg, basis

    uq = float(unit_qty(trade))
    ncp = net_cash_points(trade)
    if ncp is not None:
        # Debit (negative cash points) → positive cost basis paid
        basis = abs(ncp) * mult * uq
        avg = abs(ncp)
        return uq, avg, basis
    # Fallback leg sum
    cost = 0.0
    for leg in legs:
        q = abs(float(leg.get("quantity") or 0))
        px = _f(leg.get("fill_price")) or 0.0
        cost += q * px * mult
    return uq if uq else 1.0, None, cost


def positions_valuation(
    cur,
    identity_id: int,
    *,
    account_id: int | None = None,
    campaign_id: int | None = None,
    undirected: bool | None = None,
    asset_class: str | None = None,
    load_book,  # callable(cur, iid, account_id|None) -> (trades, accounts)
) -> dict:
    """Open structures × marks join (bus underliers + OPF option packages)."""
    trades, accounts = load_book(cur, identity_id, account_id)
    # Campaign registry titles for chips
    cur.execute(
        """SELECT id, title, is_ledger, badge_color FROM member_practice_campaigns
           WHERE identity_id = %s AND is_ledger = 0""",
        (identity_id,),
    )
    camp_by_id = {
        int(r["id"]): {
            "id": int(r["id"]),
            "title": r.get("title") or f"#{r['id']}",
            "badge_color": r.get("badge_color") or None,
        }
        for r in (cur.fetchall() or [])
    }

    matched = match_open_close(trades)
    opens = [m for m in matched if m.get("close") is None]

    # Refresh stale underliers for equity opens (bus + MySQL) before marking
    underliers: list[str] = []
    for m in opens:
        t0 = m.get("open") or {}
        if _is_equity_like(t0):
            u = _underlier(t0)
            if u:
                underliers.append(u)
    try:
        ensure_fresh_underlier_marks(cur, underliers, max_age_s=12.0)
    except Exception:
        pass

    # Heartbeat / marks as-of (true age — never blank for closed market)
    hb = lm.get_heartbeat(cur) if hasattr(lm, "get_heartbeat") else None
    marks_as_of: str | None = None
    marks_ages: list[float] = []

    by_account: dict[int, list[dict]] = {}
    degraded: list[str] = []

    for m in opens:
        t = m["open"]
        aid = int(t.get("account_id") or 0)
        if account_id is not None and aid != int(account_id):
            continue
        stamp = t.get("practice_campaign_id")
        stamp_i = int(stamp) if stamp not in (None, "") else None
        if campaign_id is not None:
            if stamp_i != int(campaign_id):
                continue
        if undirected is True and stamp_i is not None:
            continue
        if undirected is False and stamp_i is None:
            continue

        ac = _asset_class(t)
        ac_filter = (asset_class or "").lower()
        if ac_filter in ("equities", "equity", "stock"):
            if not _is_equity_like(t):
                continue
        elif ac_filter in ("options", "option", "equity_option"):
            if _is_equity_like(t):
                continue

        qty, avg_cost, cost_basis = open_qty_and_avg_cost(t)
        under = _underlier(t)
        equity_like = _is_equity_like(t)
        # Always 1 for shares; 100 for options — never trust mis-tagged asset_class
        mult = _contract_multiplier(t)
        # Bus-first underlier (mb:sym → MySQL fallback)
        mark = get_underlier_mark(under, cur=cur) if under and equity_like else None
        value_source = "underlier_mark"
        mark_meta: dict | None = None
        mid: float | None = None
        day: float | None = None
        value: float | None = None

        if equity_like:
            # A6: when stream mid missing, fall back to official prev_close (not silent $0).
            if mark:
                prev = _f(mark.get("prev_close"))
                mid_raw = mark.get("mid")
                mid = float(mid_raw) if mid_raw is not None else None
                if mid is None and prev is not None:
                    mid = prev
                    value_source = "prev_close"
                if mid is not None:
                    day = (
                        (mid - prev)
                        if prev is not None and value_source == "underlier_mark"
                        else None
                    )
                    value = mid * abs(qty) * mult  # mult=1 for equity
                    if mark.get("asof"):
                        marks_as_of = marks_as_of or str(mark["asof"])
                    if mark.get("age_seconds") is not None:
                        marks_ages.append(float(mark["age_seconds"]))
                    mark_meta = {
                        "engine": "underlier",
                        "plane": mark.get("plane") or "unknown",
                        "source": mark.get("source"),
                    }
                else:
                    if under not in degraded:
                        degraded.append(under)
            else:
                if under and under not in degraded:
                    degraded.append(under)
        else:
            # Option structures: OPF package-quote over dual-side generations
            pq = quote_open_option_structure(t)
            mark_meta = pq.get("mark_meta") if isinstance(pq.get("mark_meta"), dict) else {}
            if pq.get("complete") and pq.get("package_debit_per_share") is not None:
                d_ps = float(pq["package_debit_per_share"])
                mid = d_ps  # points per share (package natural debit)
                # Absolute market value of the open package-set (long debit > 0)
                if pq.get("mark_dollars") is not None:
                    value = abs(float(pq["mark_dollars"]))
                else:
                    value = abs(d_ps) * float(mult) * abs(float(qty) or 1.0)
                value_source = "package_mark"
            else:
                # Degraded: labeled at-cost only (no silent $0)
                mid = None
                value = None
                if under and under not in degraded:
                    degraded.append(under)
                mark_meta = {
                    **(mark_meta or {}),
                    "degraded_reason": pq.get("error") or "incomplete_package",
                }

        at_cost = cost_basis
        if value is None and at_cost is not None:
            display_value = at_cost
            value_label = "at_cost"
            unrealized = None
        else:
            display_value = value
            value_label = value_source  # underlier_mark | prev_close | package_mark
            unrealized = (
                (value - at_cost)
                if value is not None and at_cost is not None
                else None
            )
        day_gl = (
            day * abs(qty) * mult
            if day is not None and equity_like
            else None
        )

        camp_chip = None
        if stamp_i is not None and stamp_i in camp_by_id:
            camp_chip = {
                "campaign_id": stamp_i,
                "title": camp_by_id[stamp_i]["title"],
                "stamped_by": t.get("stamped_by"),
                "badge_color": camp_by_id[stamp_i].get("badge_color"),
            }

        row = {
            "trade_id": int(t["id"]),
            "account_id": aid,
            "symbol": structure_display_name(t),
            "underlier": under,
            "asset_class": "equity" if equity_like else "option",
            "strategy": t.get("strategy"),
            "qty": qty,
            "avg_cost": avg_cost,
            "cost_basis": at_cost,
            "last": mid,
            "day": day,
            "day_gl": day_gl,
            "value": display_value,
            "value_label": value_label,
            "unrealized": unrealized,
            "campaign": camp_chip,  # null = undirected absence
            "exec_at": t.get("exec_at"),
            "degraded": mid is None or value_label == "at_cost",
            "mark_meta": mark_meta,
        }
        by_account.setdefault(aid, []).append(row)

    # Account meta + BP + marked totals (no match-cash — OD-MC omit cash)
    acct_meta = {int(a["id"]): a for a in accounts}
    # Load BP columns if present
    cur.execute(
        """SELECT id, label, broker, status, starting_balance,
                  buying_power_posture, buying_power_value, buying_power_as_of
           FROM member_trade_log_accounts
           WHERE identity_id = %s""",
        (identity_id,),
    )
    bp_rows = {int(r["id"]): r for r in (cur.fetchall() or [])}

    groups = []
    grand_value = 0.0
    grand_day_gl = 0.0
    grand_unrealized = 0.0
    grand_n = 0

    for aid, rows in sorted(by_account.items(), key=lambda x: x[0]):
        meta = bp_rows.get(aid) or acct_meta.get(aid) or {}
        # % of account uses marked-derived total of positions only (no cash OD-MC)
        pos_value = sum(float(r["value"] or 0) for r in rows)
        pos_day = sum(float(r["day_gl"] or 0) for r in rows if r.get("day_gl") is not None)
        pos_u = sum(
            float(r["unrealized"] or 0) for r in rows if r.get("unrealized") is not None
        )
        for r in rows:
            v = r.get("value")
            denom = pos_value if pos_value else None
            r["pct_acct"] = (
                (float(v) / denom * 100.0) if v is not None and denom else None
            )
        bp_as = meta.get("buying_power_as_of")
        groups.append(
            {
                "account_id": aid,
                "label": meta.get("label") or acct_meta.get(aid, {}).get("label") or f"#{aid}",
                "broker": meta.get("broker") or acct_meta.get(aid, {}).get("broker"),
                "status": meta.get("status") or "active",
                "buying_power": {
                    "posture": meta.get("buying_power_posture") or "arbitrary",
                    "value": _f(meta.get("buying_power_value")),
                    "as_of": (
                        bp_as.isoformat() + "Z"
                        if hasattr(bp_as, "isoformat")
                        else (str(bp_as) if bp_as else None)
                    ),
                },
                # Cash omitted until OD-MC (V6 / PV-4)
                "cash": None,
                "cash_omitted_reason": "match_cash_pending",
                "positions": rows,
                "totals": {
                    "value": pos_value,
                    "day_gl": pos_day,
                    "unrealized": pos_u,
                    "n": len(rows),
                    "definition": "marked_derived",  # V5a
                },
            }
        )
        grand_value += pos_value
        grand_day_gl += pos_day
        grand_unrealized += pos_u
        grand_n += len(rows)

    # Oldest mark age for header honesty
    max_age = max(marks_ages) if marks_ages else None
    if hb and hb.get("last_ok_at") and max_age is None:
        marks_as_of = marks_as_of or hb.get("last_ok_at")
        max_age = hb.get("last_ok_age_seconds")

    hb_stale = False
    try:
        if hasattr(lm, "is_heartbeat_stale"):
            hb_stale = bool(lm.is_heartbeat_stale(hb))
    except Exception:
        hb_stale = False

    return {
        "marks_as_of": marks_as_of,
        "marks_age_seconds": max_age,
        "marks_plane": "market_bus_v1",
        "stream_heartbeat": hb,
        "stream_heartbeat_stale": hb_stale,
        # V17: do not blank on tick-stale
        "valuation_uses_latest_mark": True,
        "degraded_symbols": degraded,
        "campaigns": list(camp_by_id.values()),
        "accounts": groups,
        "grand_total": {
            "value": grand_value,
            "day_gl": grand_day_gl,
            "unrealized": grand_unrealized,
            "n": grand_n,
            "definition": "marked_derived",
        },
        "filters": {
            "account_id": account_id,
            "campaign_id": campaign_id,
            "undirected": undirected,
            "asset_class": asset_class,
        },
    }
