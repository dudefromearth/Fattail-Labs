"""Strategy Lab run reports book — same shape as Practice Trade Log reports-book.

Built from closed Curate (sim) positions today; Deploy will swap/add Tradier-sourced
outcomes with the same DTO so UI stays shared.
"""

from __future__ import annotations

from datetime import date
from math import sqrt
from typing import Any


def _safe_float(v: Any, default: float = 0.0) -> float:
    try:
        if v is None:
            return default
        return float(v)
    except (TypeError, ValueError):
        return default


def build_run_reports_book(
    cur,
    identity_id: int,
    *,
    starting_capital: float = 50_000.0,
    source: str = "curate_sim",
) -> dict[str, Any]:
    """JSON-serializable reports book (compatible with web reportsBookFromServer)."""
    starting_capital = float(starting_capital)
    if starting_capital <= 0:
        starting_capital = 50_000.0

    cur.execute(
        """
        SELECT
          p.*,
          i.public_id AS instance_public_id,
          i.bound_version,
          s.name AS strategy_name,
          s.public_id AS strategy_public_id
        FROM strategy_lab_curate_positions p
        JOIN strategy_lab_curate_instances i ON i.id = p.instance_id
        JOIN strategy_lab_strategies s ON s.id = i.strategy_id
        WHERE p.identity_id = %s AND p.status = 'closed'
        ORDER BY COALESCE(p.closed_at, p.opened_at) ASC, p.id ASC
        """,
        (identity_id,),
    )
    closed = list(cur.fetchall())

    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_curate_positions
           WHERE identity_id = %s AND status = 'open'""",
        (identity_id,),
    )
    open_count = int(cur.fetchone()["n"])

    cum = 0.0
    peak = starting_capital
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
    strategy_counts: dict[str, int] = {}

    series: list[dict[str, Any]] = [
        {
            "t": "start",
            "equity": starting_capital,
            "drawdown_pct": 0.0,
            "peak": starting_capital,
            "trade_index": 0,
        }
    ]

    first_day = ""
    last_day = ""
    trade_index = 0

    for p in closed:
        pnl = p.get("realized_pnl_usd")
        if pnl is None:
            continue
        pnl = _safe_float(pnl)
        has_pnl_data = True
        cum += pnl
        pnls.append(pnl)
        name = str(p.get("strategy_name") or "strategy")
        strategy_counts[name] = strategy_counts.get(name, 0) + 1

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
        equity = starting_capital + cum
        peak = max(peak, equity)
        dd_pct = (equity - peak) / peak if peak > 0 else 0.0
        max_dd_pct = min(max_dd_pct, dd_pct)

        closed_at = p.get("closed_at") or p.get("opened_at")
        t_label = (
            closed_at.isoformat().replace("+00:00", "Z")
            if closed_at and hasattr(closed_at, "isoformat")
            else str(closed_at or trade_index)
        )
        day = t_label[:10] if len(t_label) >= 10 else t_label
        if not first_day:
            first_day = day
        last_day = day

        series.append(
            {
                "t": t_label,
                "equity": equity,
                "drawdown_pct": dd_pct,
                "peak": peak,
                "trade_index": trade_index,
                "trade_id": int(p["id"]),
            }
        )

    span_days = 0
    if first_day and last_day and len(first_day) == 10 and len(last_day) == 10:
        try:
            a = date.fromisoformat(first_day)
            b = date.fromisoformat(last_day)
            span_days = max(0, (b - a).days)
        except ValueError:
            span_days = 0

    end_balance = starting_capital + cum
    net_profit = cum
    total_return = (
        (net_profit / starting_capital) * 100 if starting_capital > 0 else 0.0
    )
    decided = winners + losers
    win_rate = (winners / decided * 100) if decided else 0.0
    avg_win = (sum_win / winners) if winners else 0.0
    avg_loss = (sum_loss / losers) if losers else 0.0
    win_loss_ratio = (avg_win / avg_loss) if avg_loss > 0 else None
    profit_factor = (
        (gross_profit / gross_loss) if gross_loss > 0 else (None if gross_profit > 0 else 0.0)
    )

    # Sample Sharpe on closed outcome returns (process metric, not marketing)
    sharpe = 0.0
    sharpe_n = 0
    if len(pnls) >= 2:
        mean = sum(pnls) / len(pnls)
        var = sum((x - mean) ** 2 for x in pnls) / (len(pnls) - 1)
        std = sqrt(var) if var > 0 else 0.0
        if std > 0:
            sharpe = mean / std
            sharpe_n = len(pnls)

    account_label = (
        "Strategy Lab · Curate sim (process book)"
        if source == "curate_sim"
        else "Strategy Lab · Deploy"
    )

    return {
        "account_label": account_label,
        "source": source,
        "source_note": (
            "Built from closed Curate sim packages until Tradier Deploy outcomes "
            "are provisioned. Same report structure as Practice Reports."
            if source == "curate_sim"
            else "Deploy run outcomes."
        ),
        "starting_capital": starting_capital,
        "series": series,
        "trade_count": trade_index,
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
        "sharpe_sample_size": sharpe_n,
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
