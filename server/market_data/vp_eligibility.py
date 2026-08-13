"""VP product eligibility + proxy / quarantine (Spec §5.5 / §7.2 / AT-R11)."""

from __future__ import annotations

from typing import Any

ALGO_VERSION = "vp_bins_v3"
PRODUCTION_BINS_FROZEN = False  # C-0 / P2-3 — do not write production bins

QUARANTINED = frozenset({"VIX", "VIX1D", "I:VIX", "I:VIX1D"})
# Product → native series used for raw (one physical SPY tape)
PROXY_SERIES = {
    "SPX": "SPY",
    "I:SPX": "SPY",
    "XSP": "SPY",
    "I:XSP": "SPY",
}

NATIVE_SERIES = frozenset(
    {
        "SPY",
        "QQQ",
        "IWM",
        "GLD",
        "TLT",
        "SLV",
        "USO",
        "XLF",
        "UNG",
        "AAPL",
        "AMZN",
        "NVDA",
        "TSLA",
        "GOOGL",
        "META",
        "MSFT",
    }
)


class VpEligibilityError(ValueError):
    def __init__(self, detail: str, *, code: str = "ineligible") -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code


def normalize_symbol(symbol: str) -> str:
    return (symbol or "").strip().upper()


def assert_not_quarantined(symbol: str) -> str:
    s = normalize_symbol(symbol)
    bare = s.split(":")[-1] if ":" in s else s
    if s in QUARANTINED or bare in {"VIX", "VIX1D"}:
        raise VpEligibilityError(
            "VIX/VIX1D are quarantined — no volume-profile product "
            "(VIXY is not a valid price map)",
            code="quarantined",
        )
    return s


def resolve_series(symbol: str) -> dict[str, Any]:
    """Map a product symbol to the raw series ticker + proxy labels."""
    product = assert_not_quarantined(symbol)
    bare = product.split(":")[-1] if product.startswith("I:") else product
    if bare in PROXY_SERIES or product in PROXY_SERIES:
        series = PROXY_SERIES.get(product) or PROXY_SERIES[bare]
        return {
            "symbol": bare,
            "series_ticker": series,
            "proxy_of": bare,
            "price_space": "series",
            "native": False,
        }
    if product not in NATIVE_SERIES and bare not in NATIVE_SERIES:
        raise VpEligibilityError(
            f"{product} is not on the VP21 native/proxy list",
            code="unknown_symbol",
        )
    return {
        "symbol": bare,
        "series_ticker": bare,
        "proxy_of": None,
        "price_space": "series",
        "native": True,
    }
