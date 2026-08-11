"""Mark provider for Curate — Market Bus underlier first, then MySQL, then stub.

Priority: overrides → ``mb:sym`` / dual-write MySQL → labeled stub (if allowed).
No per-member Massive/Tradier sockets.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from market_data import live_marks as lm
from market_data.underlier_marks import get_underlier_mark


class MarksError(RuntimeError):
    """Missing or invalid marks — fail loud."""


@dataclass(frozen=True)
class MarkQuote:
    symbol: str
    mid: float
    bid: float | None
    ask: float | None
    asof: str
    source: str
    label: str
    stale: bool = False
    age_seconds: float | None = None
    shared_stream: bool = False


# Labeled stub only when live stream not required / not available
_STUB_MIDS: dict[str, float] = {
    "SPX": 5200.0,
    "XSP": 520.0,
    "VIX": 18.0,
    "SPY": 520.0,
    "QQQ": 450.0,
    "IWM": 200.0,
    "GLD": 220.0,
    "TLT": 90.0,
    "SLV": 28.0,
    "USO": 70.0,
    "XLF": 42.0,
    "UNG": 15.0,
    "AAPL": 190.0,
    "MSFT": 420.0,
    "NVDA": 120.0,
    "AMZN": 185.0,
    "META": 500.0,
    "GOOGL": 175.0,
    "TSLA": 250.0,
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_mark(
    symbol: str,
    overrides: dict[str, Any] | None = None,
    *,
    cur=None,
) -> MarkQuote:
    """Return mid mark for symbol.

    Priority:
      1. Explicit overrides (tests / demos)
      2. Shared live stream DB (all members)
      3. Stub (only if LABS_LIVE_MARKS_REQUIRED is not set)
    """
    sym = (symbol or "").strip().upper()
    if not sym:
        raise MarksError("symbol required for mark")

    if isinstance(overrides, dict) and sym in overrides:
        raw = overrides[sym]
        if isinstance(raw, (int, float)):
            mid = float(raw)
            source = "curate_override"
            label = "Member/test mark override"
        elif isinstance(raw, dict) and "mid" in raw:
            mid = float(raw["mid"])
            source = str(raw.get("source") or "curate_override")
            label = str(raw.get("label") or "Mark override")
        else:
            raise MarksError(f"invalid mark override for {sym}")
        if mid <= 0:
            raise MarksError(f"mark mid must be > 0 for {sym}")
        return MarkQuote(
            symbol=sym,
            mid=mid,
            bid=mid * 0.999,
            ask=mid * 1.001,
            asof=_now_iso(),
            source=source,
            label=label,
            shared_stream=False,
        )

    # Bus-first underlier (mb:sym → MySQL dual-write); cur optional for MySQL
    try:
        live = get_underlier_mark(sym, cur=cur)
    except Exception as exc:
        live = None
        if lm.live_marks_required():
            raise MarksError(f"live marks unavailable for {sym}: {exc}") from exc
    if live is not None:
        if live.get("stale") and lm.live_marks_required():
            raise MarksError(
                f"shared live mark for {sym} is stale "
                f"(age={live.get('age_seconds')}s > {lm.stale_seconds()}s)"
            )
        plane = str(live.get("plane") or "unknown")
        return MarkQuote(
            symbol=sym,
            mid=float(live["mid"]),
            bid=live.get("bid"),
            ask=live.get("ask"),
            asof=str(live.get("asof") or _now_iso()),
            source=str(live.get("source") or plane),
            label=str(live.get("label") or f"Underlier mark ({plane})"),
            stale=bool(live.get("stale")),
            age_seconds=live.get("age_seconds"),
            shared_stream=True,
        )
    if lm.live_marks_required():
        raise MarksError(
            f"no shared live mark for {sym!r} — ensure sym_feed / Market Bus "
            f"(mb:sym) or live_stream dual-write is running"
        )

    # Stub fallback
    if lm.live_marks_required():
        raise MarksError(
            f"no mark for {sym!r} and live marks required (no stub allowed)"
        )
    if sym not in _STUB_MIDS:
        raise MarksError(
            f"no mark for {sym!r}: not in shared stream or stub map "
            f"(stub supports {sorted(_STUB_MIDS)}; "
            f"or add to market_symbol_universe + live_stream)"
        )
    mid = float(_STUB_MIDS[sym])
    return MarkQuote(
        symbol=sym,
        mid=mid,
        bid=mid * 0.999,
        ask=mid * 1.001,
        asof=_now_iso(),
        source="curate_stub_marks_v1",
        label="Stub mid — shared live stream not available (not live Massive)",
        shared_stream=False,
    )


def package_mark_from_pnl_frac(
    *,
    entry_price: float,
    max_profit_usd: float,
    max_loss_usd: float,
    pnl_frac: float,
) -> tuple[float, float]:
    """Map pnl_frac in [-1, 1] to (mark_price, unrealized_pnl)."""
    f = max(-1.0, min(1.0, float(pnl_frac)))
    if f >= 0:
        unrealized = f * float(max_profit_usd)
    else:
        unrealized = f * float(max_loss_usd)
    mark_price = float(entry_price) + unrealized
    return mark_price, unrealized
