"""Trade Log v1.1 routes package — accounts / trades / analytics / io.

Public import path unchanged: ``from routes.trade_log import router``.
Helpers re-exported for tests that patch ``routes.trade_log._load_legs``.
"""

from fastapi import APIRouter

from routes.trade_log.accounts import router as accounts_router
from routes.trade_log.analytics import router as analytics_router
from routes.trade_log.common import (  # noqa: F401 — re-export for patches
    _load_legs,
    _load_legs_for_trades,
    _load_member_book,
    _storage_identity_id,
)
from routes.trade_log.io import router as io_router
from routes.trade_log.trades import router as trades_router

router = APIRouter(tags=["trade-log"])
router.include_router(accounts_router)
router.include_router(trades_router)
router.include_router(analytics_router)
router.include_router(io_router)
