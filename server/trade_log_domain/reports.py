"""Reports book: equity series, drawdown, stats. Port of buildReportsBook core."""

from __future__ import annotations

from datetime import date
from math import sqrt
from typing import Any

from trade_log_domain.matching import match_open_close
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl


def build_reports_book(
    trades: list[dict[str, Any]],
    accounts: list[dict[str, Any]],
    account_filter: int | str,
    starting_capital: float,
) -> dict[str, Any]:
    """
    account_filter: int account id or \"all\".
    Returns JSON-serializable dict (no Infinity — use null for unbounded PF/ratio).
    """
    enriched = enrich_trades_with_synthetic_pnl(trades)
    if account_filter == "all" or account_filter is None:
        filtered = enriched
    else:
        aid = int(account_filter)
        filtered = [t for t in enriched if int(t.get("account_id") or 0) == aid]

    if account_filter == "all" or account_filter is None:
        account_label = "All accounts"
    else:
        aid = int(account_filter)
        account_label = next(
            (a.get("label") for a in accounts if int(a.get("id") or 0) == aid),
            f"Account {aid}",
        )

    matched = match_open_close(filtered)
    open_count = sum(1 for m in matched if m["close"] is None)

    sorted_t = sorted(
        filtered,
        key=lambda t: (t.get("exec_at") or "", int(t.get("id") or 0)),
    )

    cum = 0.0
    peak = float(starting_capital)
    max_dd_pct = 0.0
    pnls: list[float] = []
    gross_profit = 0.0
    gross_loss = 0.0
    winners = 0
    losers = 0
    sum_win = 0.0
    sum_loss = 0.0
    largest_win = 0.0
    largest_loss = 0.0
    has_pnl_data = False

    first_day = (sorted_t[0].get("exec_at") or "")[:10] if sorted_t else ""
    last_day = (sorted_t[-1].get("exec_at") or "")[:10] if sorted_t else ""
    span_days = 0
    if first_day and last_day and len(first_day) == 10 and len(last_day) == 10:
        try:
            a = date.fromisoformat(first_day)
            b = date.fromisoformat(last_day)
            span_days = max(0, (b - a).days)
        except ValueError:
            span_days = 0

    series: list[dict[str, Any]] = [
        {
            "t": first_day or "start",
            "equity": float(starting_capital),
            "drawdown_pct": 0.0,
            "peak": float(starting_capital),
            "trade_index": 0,
        }
    ]

    trade_index = 0
    for t in sorted_t:
        pnl = realized_pnl(t)
        if pnl is not None:
            has_pnl_data = True
            cum += pnl
            pnls.append(pnl)
            if pnl > 0:
                winners += 1
                sum_win += pnl
                gross_profit += pnl
                largest_win = max(largest_win, pnl)
            elif pnl < 0:
                losers += 1
                sum_loss += -pnl
                gross_loss += -pnl
                largest_loss = min(largest_loss, pnl)
        trade_index += 1
        equity = float(starting_capital) + cum
        peak = max(peak, equity)
        dd_pct = (equity - peak) / peak if peak > 0 else 0.0
        max_dd_pct = min(max_dd_pct, dd_pct)
        series.append(
            {
                "t": t.get("exec_at") or str(t.get("id")),
                "equity": equity,
                "drawdown_pct": dd_pct,
                "peak": peak,
                "trade_index": trade_index,
                "trade_id": int(t["id"]),
            }
        )

    end_balance = float(starting_capital) + cum
    net_profit = cum
    total_return = (
        (net_profit / float(starting_capital)) * 100 if starting_capital > 0 else 0.0
    )
    decided = winners + losers
    win_rate = (winners / decided) * 100 if decided > 0 else 0.0
    if gross_loss > 0:
        profit_factor: float | None = gross_profit / gross_loss
    elif gross_profit > 0:
        profit_factor = None  # unbounded (TS Infinity)
    else:
        profit_factor = 0.0
    avg_win = sum_win / winners if winners > 0 else 0.0
    avg_loss = sum_loss / losers if losers > 0 else 0.0
    if avg_loss > 0:
        win_loss_ratio: float | None = avg_win / avg_loss
    elif avg_win > 0:
        win_loss_ratio = None
    else:
        win_loss_ratio = 0.0

    sharpe = 0.0
    if len(pnls) > 1:
        mean = cum / len(pnls)
        variance = sum((p - mean) ** 2 for p in pnls) / (len(pnls) - 1)
        std = sqrt(variance)
        sharpe = (mean / std) * sqrt(len(pnls)) if std > 0 else 0.0

    strategy_counts: dict[str, int] = {}
    for t in filtered:
        s = str(t.get("strategy") or "UNKNOWN")
        strategy_counts[s] = strategy_counts.get(s, 0) + 1

    return {
        "account_label": account_label,
        "starting_capital": float(starting_capital),
        "series": series,
        "trade_count": len(filtered),
        "has_pnl_data": has_pnl_data,
        "end_balance": end_balance,
        "max_drawdown_pct": max_dd_pct,
        "open_count": open_count,
        "winners": winners,
        "losers": losers,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "win_loss_ratio": win_loss_ratio,
        "sharpe": sharpe,
        "sharpe_sample_size": len(pnls),
        "stats": {
            "span_days": span_days,
            "gross_profit": gross_profit,
            "gross_loss": gross_loss,
            "net_profit": net_profit,
            "total_return_pct": total_return,
            "win_rate": win_rate,
            "profit_factor": profit_factor,
            "largest_win": largest_win,
            "largest_loss": largest_loss,
        },
        "outcome_pnls": pnls,
        "strategy_counts": strategy_counts,
    }
