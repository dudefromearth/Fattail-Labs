"""Trade Log v1.1 catalogs — venues (broker|sim) and strategies (Spec §4)."""

from __future__ import annotations

VENUES: list[dict] = [
    # provisional — auto-provision only; upgraded to FatTail book on first use
    {"code": "unset", "label": "Not set yet", "kind": "live"},
    # Default book type: FatTail-canonical storage (multi-source CSV OK)
    {"code": "fattail", "label": "FatTail book (canonical)", "kind": "live"},
    # Optional book labels (not "connected brokers" — no live link). Prefer fattail.
    {"code": "thinkorswim", "label": "thinkorswim / Schwab (label only)", "kind": "live"},
    {"code": "schwab", "label": "Schwab (label only)", "kind": "live"},
    {"code": "tastytrade", "label": "tastytrade (label only)", "kind": "live"},
    {"code": "ibkr", "label": "Interactive Brokers (label only)", "kind": "live"},
    {"code": "tradestation", "label": "TradeStation (label only)", "kind": "live"},
    {"code": "tradier", "label": "Tradier (label only)", "kind": "live"},
    {"code": "robinhood", "label": "Robinhood (label only)", "kind": "live"},
    {"code": "etrade", "label": "E*TRADE (label only)", "kind": "live"},
    {"code": "fidelity", "label": "Fidelity (label only)", "kind": "live"},
    {"code": "td", "label": "TD Ameritrade (legacy label)", "kind": "live"},
    {"code": "coinbase", "label": "Coinbase (label only)", "kind": "live"},
    {"code": "binance", "label": "Binance (label only)", "kind": "live"},
    {"code": "kraken", "label": "Kraken (label only)", "kind": "live"},
    {"code": "other_crypto", "label": "Other crypto (label only)", "kind": "live"},
    {"code": "prop_firm", "label": "Prop firm (label only)", "kind": "live"},
    {"code": "other", "label": "Other (label only)", "kind": "live"},
    # sim books
    {"code": "sim", "label": "Sim (generic)", "kind": "sim"},
    {"code": "paper", "label": "Paper / sim (generic)", "kind": "sim"},
    {"code": "thinkorswim_paper", "label": "thinkorswim paper", "kind": "sim"},
    {"code": "ibkr_paper", "label": "IBKR paper", "kind": "sim"},
    {"code": "tradestation_sim", "label": "TradeStation sim", "kind": "sim"},
    {"code": "other_sim", "label": "Other sim", "kind": "sim"},
]

VENUE_CODES = frozenset(v["code"] for v in VENUES)
OTHER_VENUES = frozenset({"other", "other_sim"})
# Provisional on auto-provision — first use sets FatTail book (not a broker brand)
UNSET_VENUE = "unset"
# Canonical in-app book type (storage format is always FatTail tradlog)
CANONICAL_BOOK_VENUE = "fattail"
# Import adapters never brand the account. Provenance lives on each trade
# (external_adapter). Multi-source CSV → one FatTail book is intentional.
ADAPTER_DEFAULT_VENUE = {
    "thinkorswim": CANONICAL_BOOK_VENUE,
    "native": CANONICAL_BOOK_VENUE,
    "csv_generic": CANONICAL_BOOK_VENUE,
    "tastytrade": CANONICAL_BOOK_VENUE,
    "ibkr": CANONICAL_BOOK_VENUE,
    "tradestation": CANONICAL_BOOK_VENUE,
    "schwab": CANONICAL_BOOK_VENUE,
}
# Live broker-name codes that were historically set by CSV import mapping only
IMPORT_BRANDED_VENUES = frozenset(
    {
        "thinkorswim",
        "schwab",
        "tastytrade",
        "ibkr",
        "tradestation",
        "tradier",
        "robinhood",
        "etrade",
        "fidelity",
        "td",
        "coinbase",
        "binance",
        "kraken",
        "other_crypto",
        "prop_firm",
        "other",
    }
)

STRATEGIES: list[dict] = [
    {"code": "SINGLE", "label": "Single", "group": "Basic"},
    {"code": "VERTICAL", "label": "Vertical", "group": "Spreads"},
    {"code": "BUTTERFLY", "label": "Butterfly", "group": "Spreads"},
    {
        "code": "BROKEN_WING_FLY",
        "label": "Broken Wing Fly",
        "group": "Spreads",
    },
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
