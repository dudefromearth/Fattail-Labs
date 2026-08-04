"""Curated underlyings for Strategy Lab Design.

Quick lookup + honest capability flags + strike / wing-width grids.
Precept #1: do not offer symbols we cannot price truthfully in the current engine.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

AssetClass = Literal["index", "equity_etf", "futures"]


@dataclass(frozen=True)
class Underlying:
    """One tradable focus symbol for Spec + Massive mapping."""

    symbol: str  # user-facing, e.g. SPX, SPY, ES
    name: str
    asset_class: AssetClass
    # Massive / Polygon style tickers
    bar_ticker: str  # daily/minute bars for the underlier
    options_underlying: str  # /v3/reference/options/contracts underlying_ticker
    # Current prototype: equity & cash-settled index options day bars only
    proto_0dte_options: bool
    notes: str = ""
    # When futures (or other non-option underliers): preferred ETF for listed options
    etf_substitute: str | None = None
    # Option strike grid (typical near-term listed increment used for wing UI + snap)
    strike_increment: float = 1.0
    default_wing: float = 5.0  # default wing width in $ (multiple of increment)
    max_wing: float = 50.0

    @property
    def min_wing(self) -> float:
        return float(self.strike_increment)

    @property
    def label(self) -> str:
        tag = {
            "index": "Index",
            "equity_etf": "Stock/ETF",
            "futures": "Futures",
        }[self.asset_class]
        if self.proto_0dte_options:
            ready = f" · strikes ${self.strike_increment:g}"
        elif self.etf_substitute:
            ready = f" · use {self.etf_substitute} for options"
        else:
            ready = " · options N/A"
        return f"{self.symbol} — {self.name} ({tag}{ready})"


def _eq(
    symbol: str,
    name: str,
    *,
    strike: float = 1.0,
    default_wing: float = 5.0,
    max_wing: float = 50.0,
    notes: str = "",
) -> Underlying:
    return Underlying(
        symbol=symbol,
        name=name,
        asset_class="equity_etf",
        bar_ticker=symbol,
        options_underlying=symbol,
        proto_0dte_options=True,
        notes=notes,
        strike_increment=strike,
        default_wing=default_wing,
        max_wing=max_wing,
    )


def _idx(
    symbol: str,
    name: str,
    *,
    bar: str,
    strike: float,
    default_wing: float,
    max_wing: float = 100.0,
    notes: str = "",
) -> Underlying:
    return Underlying(
        symbol=symbol,
        name=name,
        asset_class="index",
        bar_ticker=bar,
        options_underlying=symbol,
        proto_0dte_options=True,
        notes=notes,
        strike_increment=strike,
        default_wing=default_wing,
        max_wing=max_wing,
    )


def _fut(
    symbol: str,
    name: str,
    *,
    etf_substitute: str,
    notes: str,
) -> Underlying:
    # Inherit strike grid from substitute ETF for display if user switches
    sub = None  # filled after table built if needed
    return Underlying(
        symbol=symbol,
        name=name,
        asset_class="futures",
        bar_ticker=symbol,
        options_underlying="",
        proto_0dte_options=False,
        notes=notes,
        etf_substitute=etf_substitute,
        strike_increment=1.0,
        default_wing=5.0,
        max_wing=50.0,
    )


# Strike increments are *typical near-term grids* for wing UI + snap (not every series).
_UNIVERSE: tuple[Underlying, ...] = (
    # Indexes
    _idx(
        "SPX",
        "S&P 500 Index",
        bar="I:SPX",
        strike=5.0,
        default_wing=25.0,
        max_wing=100.0,
        notes="Cash-settled; typical $5 strike grid; wider wings than SPY.",
    ),
    _idx(
        "XSP",
        "Mini-SPX",
        bar="I:XSP",
        strike=1.0,
        default_wing=5.0,
        max_wing=50.0,
        notes="Mini-SPX; ~$1 strikes; SPX-like structure smaller notional.",
    ),
    _idx(
        "NDX",
        "Nasdaq-100 Index",
        bar="I:NDX",
        strike=5.0,
        default_wing=25.0,
        max_wing=150.0,
        notes="Typical $5 (sometimes $10) strikes.",
    ),
    _idx(
        "RUT",
        "Russell 2000 Index",
        bar="I:RUT",
        strike=5.0,
        default_wing=20.0,
        max_wing=100.0,
    ),
    _idx(
        "VIX",
        "Cboe Volatility Index",
        bar="I:VIX",
        strike=0.5,
        default_wing=2.0,
        max_wing=20.0,
        notes="VIX options special (AM/Wed settlement) — use carefully. $0.50 strikes common.",
    ),
    # Stocks / ETFs — $1 grids on most liquid ETFs; $5 on high-priced names
    _eq("SPY", "SPDR S&P 500 ETF", strike=1.0, default_wing=5.0, max_wing=50.0),
    _eq("QQQ", "Invesco QQQ Trust", strike=1.0, default_wing=5.0, max_wing=50.0),
    _eq("IWM", "iShares Russell 2000 ETF", strike=1.0, default_wing=5.0, max_wing=40.0),
    _eq("DIA", "SPDR Dow Jones ETF", strike=1.0, default_wing=5.0, max_wing=40.0),
    _eq("USO", "United States Oil Fund", strike=0.5, default_wing=2.0, max_wing=20.0),
    _eq("GLD", "SPDR Gold Shares", strike=0.5, default_wing=2.5, max_wing=25.0),
    _eq("TLT", "iShares 20+ Year Treasury", strike=0.5, default_wing=2.0, max_wing=20.0),
    _eq("AAPL", "Apple", strike=1.0, default_wing=5.0, max_wing=40.0),
    _eq("MSFT", "Microsoft", strike=1.0, default_wing=5.0, max_wing=40.0),
    _eq("NVDA", "NVIDIA", strike=2.5, default_wing=10.0, max_wing=50.0),
    _eq("TSLA", "Tesla", strike=2.5, default_wing=10.0, max_wing=50.0),
    _eq("GOOG", "Alphabet Class C", strike=2.5, default_wing=10.0, max_wing=50.0),
    _eq("GOOGL", "Alphabet Class A", strike=2.5, default_wing=10.0, max_wing=50.0),
    _eq("AMZN", "Amazon", strike=2.5, default_wing=10.0, max_wing=50.0),
    _eq("META", "Meta Platforms", strike=2.5, default_wing=10.0, max_wing=50.0),
    # Futures — options path via ETF substitutes
    _fut(
        "ES",
        "E-mini S&P 500",
        etf_substitute="SPY",
        notes=(
            "Massive: futures only, not options on futures. "
            "ETF substitute for options: **SPY** (index options: SPX/XSP)."
        ),
    ),
    _fut(
        "NQ",
        "E-mini Nasdaq-100",
        etf_substitute="QQQ",
        notes=(
            "Massive: futures only, not options on futures. "
            "ETF substitute for options: **QQQ** (index options: NDX)."
        ),
    ),
    _fut(
        "CL",
        "Crude Oil",
        etf_substitute="USO",
        notes=(
            "Massive: futures only, not options on futures. "
            "ETF substitute for options: **USO**."
        ),
    ),
    _fut(
        "GC",
        "Gold",
        etf_substitute="GLD",
        notes=(
            "Massive: futures only, not options on futures. "
            "ETF substitute for options: **GLD**."
        ),
    ),
)

_BY_SYMBOL: dict[str, Underlying] = {u.symbol.upper(): u for u in _UNIVERSE}


def all_underlyings() -> list[Underlying]:
    return list(_UNIVERSE)


def get(symbol: str) -> Underlying | None:
    return _BY_SYMBOL.get((symbol or "").strip().upper())


def resolve(symbol: str) -> Underlying | None:
    """Resolve user text to a curated underlying (exact symbol match)."""
    return get(symbol)


def search(query: str, *, limit: int = 12) -> list[Underlying]:
    """Quick lookup: prefix/symbol/name/class substring."""
    q = (query or "").strip().lower()
    if not q:
        return list(_UNIVERSE)[:limit]
    scored: list[tuple[int, Underlying]] = []
    for u in _UNIVERSE:
        sym = u.symbol.lower()
        name = u.name.lower()
        blob = f"{sym} {name} {u.asset_class}"
        if q == sym:
            scored.append((0, u))
        elif sym.startswith(q):
            scored.append((1, u))
        elif q in sym or q in name or q in blob:
            scored.append((2, u))
    scored.sort(key=lambda t: (t[0], t[1].symbol))
    return [u for _, u in scored[:limit]]


def quick_picks() -> list[str]:
    """Chips under the symbol field — high-use names."""
    return ["SPY", "SPX", "XSP", "QQQ", "NDX", "IWM", "TSLA", "NVDA", "AAPL", "USO"]


def default_symbol() -> str:
    return "SPY"


def strike_increment(symbol: str) -> float:
    u = get(symbol)
    return float(u.strike_increment) if u else 1.0


def _clean_multiple(n: float, increment: float) -> float:
    snapped = n * float(increment)
    if abs(snapped - round(snapped)) < 1e-9:
        return float(round(snapped))
    return round(snapped, 10)


def snap_to_increment(value: float, increment: float, *, min_steps: int = 0) -> float:
    """Round to nearest multiple of increment (optional minimum step count)."""
    inc = float(increment)
    if inc <= 0:
        return float(value)
    v = float(value)
    n = round(v / inc)
    if n < min_steps:
        n = min_steps
    return _clean_multiple(n, inc)


def snap_wing_width(symbol: str, wing: float) -> float:
    """Snap wing width to the symbol's strike grid and clamp to min/max."""
    u = get(symbol)
    if not u:
        return max(1.0, snap_to_increment(wing, 1.0, min_steps=1))
    # Futures: use substitute ETF grid if still selected
    if u.etf_substitute and not u.proto_0dte_options:
        u = get(u.etf_substitute) or u
    snapped = snap_to_increment(wing, u.strike_increment, min_steps=1)
    snapped = max(u.min_wing, min(u.max_wing, snapped))
    return snap_to_increment(snapped, u.strike_increment, min_steps=1)


def wing_input_params(symbol: str) -> dict[str, float]:
    """min/max/step/default for Streamlit wing width control."""
    u = get(symbol)
    if not u:
        return {"min_value": 1.0, "max_value": 50.0, "step": 1.0, "default": 5.0}
    if u.etf_substitute and not u.proto_0dte_options:
        u = get(u.etf_substitute) or u
    return {
        "min_value": float(u.min_wing),
        "max_value": float(u.max_wing),
        "step": float(u.strike_increment),
        "default": float(snap_wing_width(u.symbol, u.default_wing)),
    }


def round_strike(price: float, symbol: str) -> float:
    """Round a price level to the symbol's strike grid (ATM body, etc.)."""
    u = get(symbol)
    inc = float(u.strike_increment) if u else 1.0
    if u and u.etf_substitute and not u.proto_0dte_options:
        inc = strike_increment(u.etf_substitute)
    if inc <= 0 or price <= 0:
        return float(round(price)) if price > 0 else 0.0
    return snap_to_increment(price, inc, min_steps=0)
