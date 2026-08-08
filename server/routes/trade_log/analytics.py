"""Trade Log analytics read-model routes (domain)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

import db
from guards import require_session
from routes.trade_log.common import (
    _load_member_book,
    _require_tool_member,
    _storage_identity_id,
)

router = APIRouter(tags=["trade-log"])

@router.get("/api/me/trade-log/analytics/day-book")
def analytics_day_book(
    request: Request,
    day: str,
    account_id: int | None = None,
) -> dict:
    """Journal day book: open / activity / union for a calendar day (YMD)."""
    claims = require_session(request)
    _require_tool_member(claims)
    if not day or len(day) < 10 or day[4] != "-" or day[7] != "-":
        raise HTTPException(
            status_code=422, detail="day must be YYYY-MM-DD"
        )
    day_ymd = day[:10]
    from trade_log_domain import build_day_book

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trades, _accounts = _load_member_book(cur, iid, account_id)
    return build_day_book(trades, day_ymd)


@router.get("/api/me/trade-log/analytics/days-interest")
def analytics_days_interest(
    request: Request,
    from_day: str,
    to_day: str,
    account_id: int | None = None,
) -> dict:
    """Calendar dots: days with activity or open interest in [from_day, to_day]."""
    claims = require_session(request)
    _require_tool_member(claims)
    for label, val in (("from_day", from_day), ("to_day", to_day)):
        if not val or len(val) < 10 or val[4] != "-" or val[7] != "-":
            raise HTTPException(
                status_code=422, detail=f"{label} must be YYYY-MM-DD"
            )
    from trade_log_domain import days_with_book_interest

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trades, _accounts = _load_member_book(cur, iid, account_id)
    days = days_with_book_interest(trades, from_day[:10], to_day[:10])
    return {"from": from_day[:10], "to": to_day[:10], "days": days}


@router.get("/api/me/trade-log/analytics/reports-book")
def analytics_reports_book(
    request: Request,
    account_id: int | None = None,
    starting_capital: float = 50000.0,
    from_day: str | None = None,
    to_day: str | None = None,
) -> dict:
    """Reports home: equity series, drawdown, stats (domain build_reports_book).

    Optional from_day/to_day (YYYY-MM-DD) adopt Practice Context date as the
    analysis window (Practice Context Spec v0.2 §0.1 / open #6).
    """
    claims = require_session(request)
    _require_tool_member(claims)
    if starting_capital < 0:
        raise HTTPException(status_code=422, detail="starting_capital must be ≥ 0")
    for label, val in (("from_day", from_day), ("to_day", to_day)):
        if val is not None and (
            len(val) < 10 or val[4] != "-" or val[7] != "-"
        ):
            raise HTTPException(
                status_code=422, detail=f"{label} must be YYYY-MM-DD"
            )
    from trade_log_domain import build_reports_book

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trades, accounts = _load_member_book(cur, iid, account_id)
    if from_day or to_day:
        lo = (from_day or "0000-01-01")[:10]
        hi = (to_day or "9999-12-31")[:10]
        trades = [
            t
            for t in trades
            if (t.get("exec_at") or "")[:10] >= lo
            and (t.get("exec_at") or "")[:10] <= hi
        ]
    filt: int | str = "all" if account_id is None else int(account_id)
    return build_reports_book(trades, accounts, filt, float(starting_capital))


@router.get("/api/me/trade-log/analytics/process-pack")
def analytics_process_pack(
    request: Request,
    account_id: int | None = None,
    from_day: str | None = None,
    to_day: str | None = None,
    series_bucket: str = "day",
) -> dict:
    """Phase 2 process report pack: adherence mix, rate series, campaign summary.

    Tag frequency remains on Phase 0 ``/api/me/tags/usage`` (no fork).
    Never returns P&L or win-rate-by-process-label.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    for label, val in (("from_day", from_day), ("to_day", to_day)):
        if val is not None and (
            len(val) < 10 or val[4] != "-" or val[7] != "-"
        ):
            raise HTTPException(
                status_code=422, detail=f"{label} must be YYYY-MM-DD"
            )
    if series_bucket not in ("day", "week"):
        raise HTTPException(
            status_code=422, detail="series_bucket must be day|week"
        )

    from trade_log_domain import build_process_pack
    import practice_spine_domain as psd

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trades, _accounts = _load_member_book(cur, iid, account_id)
            try:
                campaigns = psd.list_campaigns(cur, iid)
            except Exception:
                # Campaign tables not migrated yet — pack still returns adherence
                campaigns = []

    return build_process_pack(
        trades,
        campaigns=campaigns,
        from_day=from_day,
        to_day=to_day,
        account_id=account_id,
        series_bucket=series_bucket,
    )


@router.get("/api/me/trade-log/records/summary")
def records_summary(
    request: Request,
    account_ids: str | None = None,
    from_day: str | None = None,
    to_day: str | None = None,
    # Spec §10.2 uses from= / to=
    from_q: str | None = Query(None, alias="from"),
    to_q: str | None = Query(None, alias="to"),
) -> dict:
    """Spec §10.2 records/summary — thin process-first adapter.

    ``pnl_sum`` always null (opt-in later). Prefer analytics/process-pack for
    campaign + series; this endpoint lands by_adherence for contract honesty.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    from_day = from_day or from_q
    to_day = to_day or to_q
    for label, val in (("from_day", from_day), ("to_day", to_day)):
        if val is not None and (
            len(val) < 10 or val[4] != "-" or val[7] != "-"
        ):
            raise HTTPException(
                status_code=422, detail=f"{label} must be YYYY-MM-DD"
            )
    ids: list[int] | None = None
    if account_ids:
        try:
            ids = [int(x.strip()) for x in account_ids.split(",") if x.strip()]
        except ValueError as exc:
            raise HTTPException(
                status_code=422, detail="account_ids must be comma-separated ints"
            ) from exc

    from trade_log_domain import records_summary_from_trades

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trades, accounts = _load_member_book(cur, iid, None)
    return records_summary_from_trades(
        trades,
        accounts,
        from_day=from_day,
        to_day=to_day,
        account_ids=ids,
    )
