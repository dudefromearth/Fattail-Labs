"""Journal Day Net Calendar — derived realized day nets + intensity (Spec v0.2).

Hotel W0-2 aggregation rule (locked):
  Day R:R is the **unweighted arithmetic mean** of ``entry_r2r(open)`` for each
  matched structure whose **close realizes** on calendar day D (America/New_York
  date string from exec_at). Opens with undefined entry R:R are excluded from
  the mean; ``day_r2r_sample_n`` counts only included opens.

Day net is Σ realized P&L of closes (after synthetic enrich) on day D.
No Journal-side PnL fork beyond this pure module.
"""

from __future__ import annotations

from typing import Any

from trade_log_domain.matching import match_open_close
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl
from trade_log_domain.structure import entry_r2r, ymd_from_exec

# Spec §5.4 fixed buckets (USD |net|) → intensity_step 1..5
INTENSITY_BUCKETS: tuple[float, ...] = (50.0, 250.0, 1000.0, 5000.0)


def intensity_step(net: float | None) -> int:
    """0 = none; 1..5 from fixed buckets. Stable across periods."""
    if net is None:
        return 0
    try:
        a = abs(float(net))
    except (TypeError, ValueError):
        return 0
    if a != a:  # NaN
        return 0
    step = 1
    for bound in INTENSITY_BUCKETS:
        if a < bound:
            return step
        step += 1
    return 5


def tone_from_net(net: float | None, *, has_outcomes: bool) -> str:
    if not has_outcomes or net is None:
        return "none"
    if net > 0:
        return "credit"
    if net < 0:
        return "debit"
    return "flat"


def filter_trades_for_scope(
    trades: list[dict[str, Any]],
    *,
    practice_campaign_id: int | None = None,
    undirected: bool = False,
) -> list[dict[str, Any]]:
    """Post-amendment scope: campaign stamp exact; undirected = null stamp."""
    if undirected:
        return [t for t in trades if t.get("practice_campaign_id") in (None, "")]
    if practice_campaign_id is not None:
        cid = int(practice_campaign_id)
        return [
            t
            for t in trades
            if int(t.get("practice_campaign_id") or 0) == cid
        ]
    return list(trades)


def build_day_net_calendar(
    trades: list[dict[str, Any]],
    *,
    from_day: str,
    to_day: str,
    practice_campaign_id: int | None = None,
    undirected: bool = False,
) -> dict[str, Any]:
    """Pure: trades already identity- (and optionally account-) scoped by loader."""
    lo = from_day[:10]
    hi = to_day[:10]
    scoped = filter_trades_for_scope(
        trades,
        practice_campaign_id=practice_campaign_id,
        undirected=undirected,
    )
    enriched = enrich_trades_with_synthetic_pnl(scoped)
    matched = match_open_close(enriched)

    # day -> list of close pnls and open entry_r2r values
    nets: dict[str, float] = {}
    counts: dict[str, int] = {}
    r2rs: dict[str, list[float]] = {}

    by_id = {int(t["id"]): t for t in enriched}

    for m in matched:
        close = m.get("close")
        if not close:
            continue
        close_day = m.get("close_day") or ymd_from_exec(close.get("exec_at"))
        if not close_day or close_day < lo or close_day > hi:
            continue
        c = by_id.get(int(close["id"]))
        if not c:
            continue
        pnl = realized_pnl(c)
        if pnl is None:
            continue
        nets[close_day] = nets.get(close_day, 0.0) + float(pnl)
        counts[close_day] = counts.get(close_day, 0) + 1
        open_t = m.get("open")
        if open_t:
            r = entry_r2r(open_t)
            if r is not None and r > 0 and r == r:
                r2rs.setdefault(close_day, []).append(float(r))

    # Orphan closes (no match) with pnl on day
    matched_close_ids = {
        int(m["close"]["id"])
        for m in matched
        if m.get("close") is not None
    }
    for t in enriched:
        tid = int(t["id"])
        if tid in matched_close_ids:
            continue
        day = ymd_from_exec(t.get("exec_at"))
        if not day or day < lo or day > hi:
            continue
        pnl = realized_pnl(t)
        if pnl is None:
            continue
        # Only treat as outcome if close-like or has explicit pnl
        nets[day] = nets.get(day, 0.0) + float(pnl)
        counts[day] = counts.get(day, 0) + 1

    days_out: list[dict[str, Any]] = []
    period_net = 0.0
    credit_days = 0
    debit_days = 0
    outcome_days = 0

    for day in sorted(nets.keys()):
        net = round(nets[day] * 100) / 100
        n = counts.get(day, 0)
        has = n > 0
        tone = tone_from_net(net if has else None, has_outcomes=has)
        rs = r2rs.get(day) or []
        day_r2r = (sum(rs) / len(rs)) if rs else None
        if day_r2r is not None:
            day_r2r = round(day_r2r * 1000) / 1000
        period_net += net
        outcome_days += 1
        if net > 0:
            credit_days += 1
        elif net < 0:
            debit_days += 1
        days_out.append(
            {
                "date": day,
                "net": net,
                "outcome_count": n,
                "tone": tone,
                "intensity_step": intensity_step(net) if has else 0,
                "day_r2r": day_r2r,
                "day_r2r_sample_n": len(rs),
            }
        )

    return {
        "timezone": "America/New_York",
        "from": lo,
        "to": hi,
        "period": {
            "net": round(period_net * 100) / 100,
            "outcome_days": outcome_days,
            "credit_days": credit_days,
            "debit_days": debit_days,
        },
        "days": days_out,
    }
