"""Practice Trade Log domain — single source of truth (PH1-0 / PH1-1).

Pure functions only: no FastAPI, no DB, no session.
Port of web/lib/journalDayBook.ts + reportsBook domain formulas (behavior freeze).
"""

from trade_log_domain.day_book import (
    build_day_book,
    days_with_book_interest,
    fills_on_day,
    opens_on_day,
    union_day_book_items,
)
from trade_log_domain.matching import match_open_close
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl
from trade_log_domain.reports import build_reports_book
from trade_log_domain.structure import (
    multiplier,
    net_cash_points,
    structure_key,
    trade_expiry,
    trade_is_close_fill,
    unit_qty,
    ymd_from_exec,
)

__all__ = [
    "build_day_book",
    "build_reports_book",
    "days_with_book_interest",
    "enrich_trades_with_synthetic_pnl",
    "fills_on_day",
    "match_open_close",
    "multiplier",
    "net_cash_points",
    "opens_on_day",
    "realized_pnl",
    "structure_key",
    "trade_expiry",
    "trade_is_close_fill",
    "union_day_book_items",
    "unit_qty",
    "ymd_from_exec",
]
