"""Process report pack v1 (Phase 2 Match Hygiene — TD2-7).

Process-first aggregates only:
  - adherence mix (followed / partial / broke / unknown)
  - adherence_rate series by day
  - campaign summary (trades + adherence; no P&L hero)

No tag×P&L, no win-rate-by-tag, no expectancy theater.
Pure functions — no FastAPI / DB.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

_ADHERENCE_KEYS = ("followed", "partial", "broke", "unknown")


def _norm_adherence(raw: Any) -> str:
    s = str(raw or "unknown").strip().lower()
    if s in _ADHERENCE_KEYS:
        return s
    # legacy / loose synonyms
    if s in ("follow", "yes", "true", "ok"):
        return "followed"
    if s in ("part", "mixed"):
        return "partial"
    if s in ("break", "broke_rule", "no", "false"):
        return "broke"
    return "unknown"


def _day(exec_at: Any) -> str | None:
    if not exec_at:
        return None
    s = str(exec_at)
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return None


def filter_window(
    trades: list[dict[str, Any]],
    *,
    from_day: str | None = None,
    to_day: str | None = None,
    account_id: int | None = None,
) -> list[dict[str, Any]]:
    lo = (from_day or "0000-01-01")[:10] if from_day else None
    hi = (to_day or "9999-12-31")[:10] if to_day else None
    out: list[dict[str, Any]] = []
    for t in trades:
        if account_id is not None and int(t.get("account_id") or 0) != int(account_id):
            continue
        # NOTES without process still count for campaign volume if linked
        day = _day(t.get("exec_at"))
        if lo and (not day or day < lo):
            continue
        if hi and (not day or day > hi):
            continue
        out.append(t)
    return out


def adherence_mix(trades: list[dict[str, Any]]) -> dict[str, Any]:
    """Counts + rates for the process question: was I process-true?"""
    counts: dict[str, int] = {k: 0 for k in _ADHERENCE_KEYS}
    for t in trades:
        # Skip pure NOTE stubs with no legs and blank adherence — optional
        a = _norm_adherence(t.get("adherence"))
        counts[a] = counts.get(a, 0) + 1
    decided = counts["followed"] + counts["partial"] + counts["broke"]
    rate = (counts["followed"] / decided) if decided > 0 else None
    # partial counts as not full follow; process honesty rate:
    strict_rate = rate
    with_partial = (
        (counts["followed"] + 0.5 * counts["partial"]) / decided
        if decided > 0
        else None
    )
    return {
        "counts": counts,
        "trade_count": sum(counts.values()),
        "decided_count": decided,
        "adherence_rate": strict_rate,  # followed / decided
        "adherence_rate_with_partial_credit": with_partial,
        "labels": {
            "followed": "Followed",
            "partial": "Partial",
            "broke": "Broke",
            "unknown": "Not labeled",
        },
    }


def adherence_rate_series(
    trades: list[dict[str, Any]],
    *,
    bucket: str = "day",
) -> list[dict[str, Any]]:
    """Per-bucket adherence_rate for sparkline / series chart.

    rate = followed / (followed+partial+broke); unknown excluded from denominator.
    """
    if bucket not in ("day", "week"):
        bucket = "day"
    buckets: dict[str, Counter[str]] = defaultdict(Counter)
    for t in trades:
        day = _day(t.get("exec_at"))
        if not day:
            continue
        key = day
        if bucket == "week":
            # ISO week start Monday as key YYYY-Www
            from datetime import date

            try:
                d = date.fromisoformat(day)
            except ValueError:
                continue
            iso = d.isocalendar()
            key = f"{iso.year}-W{iso.week:02d}"
        buckets[key][_norm_adherence(t.get("adherence"))] += 1

    points: list[dict[str, Any]] = []
    for t_key in sorted(buckets.keys()):
        c = buckets[t_key]
        followed = int(c.get("followed", 0))
        partial = int(c.get("partial", 0))
        broke = int(c.get("broke", 0))
        unknown = int(c.get("unknown", 0))
        decided = followed + partial + broke
        rate = (followed / decided) if decided > 0 else None
        points.append(
            {
                "t": t_key,
                "v": rate,
                "followed": followed,
                "partial": partial,
                "broke": broke,
                "unknown": unknown,
                "decided": decided,
                "trade_count": decided + unknown,
            }
        )
    return points


def campaign_summaries(
    trades: list[dict[str, Any]],
    campaigns: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Per-campaign trade + adherence mix. Empty list if no campaigns.

    Hidden (not broken) when campaigns is empty — caller may omit UI.
    Never includes P&L or win-rate.
    """
    if not campaigns:
        return []

    by_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for t in trades:
        cid = t.get("practice_campaign_id")
        if cid is None:
            continue
        try:
            by_id[int(cid)].append(t)
        except (TypeError, ValueError):
            continue

    out: list[dict[str, Any]] = []
    for camp in campaigns:
        try:
            cid = int(camp["id"])
        except (KeyError, TypeError, ValueError):
            continue
        linked = by_id.get(cid, [])
        mix = adherence_mix(linked)
        out.append(
            {
                "campaign_id": cid,
                "title": camp.get("title") or f"Campaign {cid}",
                "status": camp.get("status"),
                "starts_at": camp.get("starts_at"),
                "ends_at": camp.get("ends_at"),
                "trade_count": mix["trade_count"],
                "by_adherence": mix["counts"],
                "adherence_rate": mix["adherence_rate"],
                "decided_count": mix["decided_count"],
            }
        )
    # Active first, then by title
    status_rank = {"active": 0, "completed": 1, "archived": 2, "planned": 3}
    out.sort(
        key=lambda r: (
            status_rank.get(str(r.get("status") or "").lower(), 9),
            str(r.get("title") or ""),
        )
    )
    return out


def build_process_pack(
    trades: list[dict[str, Any]],
    *,
    campaigns: list[dict[str, Any]] | None = None,
    from_day: str | None = None,
    to_day: str | None = None,
    account_id: int | None = None,
    series_bucket: str = "day",
) -> dict[str, Any]:
    """Full process pack payload for Reports."""
    windowed = filter_window(
        trades, from_day=from_day, to_day=to_day, account_id=account_id
    )
    mix = adherence_mix(windowed)
    camps = campaign_summaries(windowed, campaigns or [])
    return {
        "from": (from_day[:10] if from_day else None),
        "to": (to_day[:10] if to_day else None),
        "account_id": account_id,
        "trade_count": mix["trade_count"],
        "adherence": mix,
        "adherence_rate_series": adherence_rate_series(
            windowed, bucket=series_bucket
        ),
        "campaigns": camps,
        "has_campaigns": len(camps) > 0,
        # Tag frequency stays on existing Phase 0 tag usage API (no fork).
        "tag_usage_path": "/api/me/tags/usage",
        "process_only": True,
    }


def records_summary_from_trades(
    trades: list[dict[str, Any]],
    accounts: list[dict[str, Any]],
    *,
    from_day: str | None = None,
    to_day: str | None = None,
    account_ids: list[int] | None = None,
) -> dict[str, Any]:
    """Thin Spec §10.2 records/summary adapter — process counts, pnl omitted."""
    if account_ids:
        id_set = set(int(x) for x in account_ids)
        filtered = [t for t in trades if int(t.get("account_id") or 0) in id_set]
        scope = "subset"
    else:
        filtered = list(trades)
        scope = "all_active"
    filtered = filter_window(filtered, from_day=from_day, to_day=to_day)

    by_account_counts: Counter[int] = Counter()
    by_strategy: Counter[str] = Counter()
    by_adherence: Counter[str] = Counter()
    open_vs_close = Counter()
    for t in filtered:
        by_account_counts[int(t.get("account_id") or 0)] += 1
        by_strategy[str(t.get("strategy") or "CUSTOM")] += 1
        by_adherence[_norm_adherence(t.get("adherence"))] += 1
        from trade_log_domain.structure import trade_is_close_fill

        if trade_is_close_fill(t):
            open_vs_close["TO_CLOSE"] += 1
        else:
            open_vs_close["TO_OPEN"] += 1

    acct_label = {int(a["id"]): a for a in accounts if a.get("id") is not None}
    by_account = []
    for aid, n in sorted(by_account_counts.items()):
        meta = acct_label.get(aid) or {}
        by_account.append(
            {
                "account_id": aid,
                "label": meta.get("label") or f"Account {aid}",
                "broker": meta.get("broker"),
                "trade_count": n,
            }
        )

    return {
        "from": (from_day[:10] if from_day else None),
        "to": (to_day[:10] if to_day else None),
        "account_ids": sorted(by_account_counts.keys()),
        "scope": scope,
        "trade_count": len(filtered),
        "by_account": by_account,
        "by_strategy": dict(by_strategy),
        "by_adherence": dict(by_adherence),
        "by_venue_kind": None,  # optional later
        "open_vs_close_fills": dict(open_vs_close),
        "pnl_sum": None,  # process-first default
        "pnl_by_account": None,
    }
