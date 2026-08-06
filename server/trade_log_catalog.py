"""Trade Log v1.1 catalogs — venues (broker|sim) and strategies (Spec §4)."""

from __future__ import annotations

VENUES: list[dict] = [
    # provisional — auto-provision only; replaced on first import or first trade
    {"code": "unset", "label": "Not set yet", "kind": "live"},
    # FatTail native book (canonical import / manual without a broker)
    {"code": "fattail", "label": "FatTail Labs (canonical)", "kind": "live"},
    # live brokers / platforms
    {"code": "thinkorswim", "label": "thinkorswim / Schwab", "kind": "live"},
    {"code": "schwab", "label": "Schwab", "kind": "live"},
    {"code": "tastytrade", "label": "tastytrade", "kind": "live"},
    {"code": "ibkr", "label": "Interactive Brokers", "kind": "live"},
    {"code": "tradestation", "label": "TradeStation", "kind": "live"},
    {"code": "tradier", "label": "Tradier", "kind": "live"},
    {"code": "robinhood", "label": "Robinhood", "kind": "live"},
    {"code": "etrade", "label": "E*TRADE", "kind": "live"},
    {"code": "fidelity", "label": "Fidelity", "kind": "live"},
    {"code": "td", "label": "TD Ameritrade (legacy)", "kind": "live"},
    {"code": "coinbase", "label": "Coinbase", "kind": "live"},
    {"code": "binance", "label": "Binance", "kind": "live"},
    {"code": "kraken", "label": "Kraken", "kind": "live"},
    {"code": "other_crypto", "label": "Other crypto venue", "kind": "live"},
    {"code": "prop_firm", "label": "Prop firm", "kind": "live"},
    {"code": "other", "label": "Other broker", "kind": "live"},
    # sim
    {"code": "sim", "label": "Sim (generic)", "kind": "sim"},
    {"code": "paper", "label": "Paper / sim (generic)", "kind": "sim"},
    {"code": "thinkorswim_paper", "label": "thinkorswim paper", "kind": "sim"},
    {"code": "ibkr_paper", "label": "IBKR paper", "kind": "sim"},
    {"code": "tradestation_sim", "label": "TradeStation sim", "kind": "sim"},
    {"code": "other_sim", "label": "Other sim", "kind": "sim"},
]

VENUE_CODES = frozenset(v["code"] for v in VENUES)
OTHER_VENUES = frozenset({"other", "other_sim"})
# Provisional venue on auto-provisioned Primary — not a permanent choice
UNSET_VENUE = "unset"
# Map import adapter id → venue code when account is still unset
ADAPTER_DEFAULT_VENUE = {
    "thinkorswim": "thinkorswim",
    "native": "fattail",
    "csv_generic": "fattail",
    "tastytrade": "tastytrade",
    "ibkr": "ibkr",
    "tradestation": "tradestation",
    "schwab": "schwab",
}

STRATEGIES: list[dict] = [
    {"code": "SINGLE", "label": "Single", "group": "Basic"},
    {"code": "VERTICAL", "label": "Vertical", "group": "Spreads"},
    {"code": "BUTTERFLY", "label": "Butterfly", "group": "Spreads"},
    {"code": "CONDOR", "label": "Condor", "group": "Spreads"},
    {"code": "STRADDLE", "label": "Straddle", "group": "Spreads"},
    {"code": "STRANGLE", "label": "Strangle", "group": "Spreads"},
    {"code": "IRON_FLY", "label": "Iron Fly", "group": "Spreads"},
    {"code": "IRON_CONDOR", "label": "Iron Condor", "group": "Spreads"},
    {"code": "CALENDAR", "label": "Calendar", "group": "Spreads"},
    {"code": "DIAGONAL", "label": "Diagonal", "group": "Spreads"},
    {"code": "STOCK", "label": "Stock", "group": "Asset"},
    {"code": "FUTURE", "label": "Future", "group": "Asset"},
    {"code": "CRYPTO", "label": "Crypto", "group": "Asset"},
    {"code": "CUSTOM", "label": "Custom", "group": "Other"},
    {"code": "NOTE", "label": "Note", "group": "Other"},
]

STRATEGY_CODES = frozenset(s["code"] for s in STRATEGIES)

ASSET_CLASSES = frozenset(
    {
        "equity_option",
        "equity",
        "future",
        "future_option",  # ES/NQ options etc. (present in live books)
        "crypto",
        "crypto_option",
        "cash",
    }
)
SIDES = frozenset({"BUY", "SELL"})
POS_EFFECTS = frozenset({"TO_OPEN", "TO_CLOSE"})
RIGHTS = frozenset({"PUT", "CALL"})
ADHERENCE = frozenset({"followed", "partial", "broke", "unknown"})
NET_SIDES = frozenset({"DEBIT", "CREDIT"})
ACCOUNT_STATUSES = frozenset({"active", "archived"})
MAX_ACTIVE_ACCOUNTS = 10


def venue_kind(code: str) -> str:
    for v in VENUES:
        if v["code"] == code:
            return v["kind"]
    return "live"
