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
from trade_log_domain.day_net_calendar import (
    build_day_net_calendar,
    intensity_step,
)
from trade_log_domain.matching import match_open_close
from trade_log_domain.pnl import enrich_trades_with_synthetic_pnl, realized_pnl
from trade_log_domain.reports import build_reports_book
from trade_log_domain.structure import (
    average_entry_r2r,
    entry_r2r,
    multiplier,
    net_cash_points,
    structure_key,
    structure_wing_width,
    trade_expiry,
    trade_is_close_fill,
    unit_qty,
    ymd_from_exec,
)
from trade_log_domain.trade_chart import (
    build_markers,
    chart_window,
    normalize_tf,
    product_underlier,
    resolve_series_ticker,
    structure_strike_band,
)
from trade_log_domain.process_pack import (
    adherence_mix,
    build_process_pack,
    records_summary_from_trades,
)

__all__ = [
    "adherence_mix",
    "average_entry_r2r",
    "build_day_book",
    "build_day_net_calendar",
    "build_markers",
    "build_process_pack",
    "build_reports_book",
    "chart_window",
    "days_with_book_interest",
    "enrich_trades_with_synthetic_pnl",
    "entry_r2r",
    "fills_on_day",
    "intensity_step",
    "match_open_close",
    "multiplier",
    "net_cash_points",
    "normalize_tf",
    "opens_on_day",
    "product_underlier",
    "realized_pnl",
    "records_summary_from_trades",
    "resolve_series_ticker",
    "structure_key",
    "structure_strike_band",
    "structure_wing_width",
    "trade_expiry",
    "trade_is_close_fill",
    "union_day_book_items",
    "unit_qty",
    "ymd_from_exec",
]
