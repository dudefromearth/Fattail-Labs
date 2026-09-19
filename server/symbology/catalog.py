"""SYM-4.0 roll catalog and calendar front-picker (server SoT).

Month letters live here so clients do not hardcode them. Activity rows stay
named-not-built (D8). Holiday calendars are not this packet.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

HOUSE_PRESET_ID = "ts-es-106X"

# CME month codes, index 1–12. Quarterly ES/MES use H M U Z.
MONTH_CODES = "FGHJKMNQUVXZ"
CODE_TO_MONTH = {code: i + 1 for i, code in enumerate(MONTH_CODES)}
MONTH_TO_CODE = {i + 1: code for i, code in enumerate(MONTH_CODES)}
QUARTERLY_MONTHS = (3, 6, 9, 12)

MONTH_NAMES = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

ROLL_ROWS: tuple[dict[str, Any], ...] = (
    {
        "id": "ts-es-106X",
        "rule": "1st nearest; 6 trading days before expiration",
        "kind": "calendar",
        "status": "live",
        "default": True,
        "applyable": True,
        "caption": None,
        "trading_days_before": 6,
    },
    {
        "id": "cme-customary",
        "rule": "Monday of expiration week (CME customary lead-month date)",
        "kind": "calendar",
        "status": "live",
        "default": False,
        "applyable": True,
        "caption": None,
        "trading_days_before": None,
        "monday_of_expiry_week": True,
    },
    {
        "id": "ib-3X",
        "rule": "3 trading days before expiration",
        "kind": "calendar",
        "status": "live",
        "default": False,
        "applyable": True,
        "caption": "IB quote-line",
        "trading_days_before": 3,
    },
    {
        "id": "conv-8X",
        "rule": "8 trading days before expiration",
        "kind": "calendar",
        "status": "live",
        "default": False,
        "applyable": True,
        "caption": "industry convention (includes tastytrade-style week before expiration)",
        "trading_days_before": 8,
    },
    {
        "id": "tv-1VO",
        "rule": "First session next-month daily volume exceeds front",
        "kind": "activity",
        "status": "named-not-built",
        "default": False,
        "applyable": False,
        "caption": None,
        "reason_code": "needs-the-daily-volume-path",
        "trading_days_before": None,
    },
    {
        "id": "ts-1IN",
        "rule": "First session next-month OI exceeds front",
        "kind": "activity",
        "status": "named-not-built",
        "default": False,
        "applyable": False,
        "caption": None,
        "reason_code": "needs-the-daily-volume-path",
        "trading_days_before": None,
    },
    {
        "id": "ts-2VO",
        "rule": "Two consecutive sessions next volume > front",
        "kind": "activity",
        "status": "named-not-built",
        "default": False,
        "applyable": False,
        "caption": None,
        "reason_code": "needs-the-daily-volume-path",
        "trading_days_before": None,
    },
)

_BY_ID = {str(row["id"]): row for row in ROLL_ROWS}


def catalog_public() -> dict[str, Any]:
    rows = []
    for raw in ROLL_ROWS:
        item = {
            "id": raw["id"],
            "rule": raw["rule"],
            "kind": raw["kind"],
            "status": raw["status"],
            "default": bool(raw["default"]),
            "applyable": bool(raw["applyable"]),
        }
        if raw.get("caption"):
            item["caption"] = raw["caption"]
        if raw["status"] == "named-not-built":
            from symbology.reasons import payload

            item["reason"] = payload(str(raw["reason_code"]))
        rows.append(item)
    return {
        "house_preset_id": HOUSE_PRESET_ID,
        "adjustment": "none",
        "rows": rows,
    }


def preset_row(preset_id: str) -> dict[str, Any] | None:
    return _BY_ID.get(preset_id)


def third_friday(year: int, month: int) -> date:
    first = date(year, month, 1)
    delta = (4 - first.weekday()) % 7  # Friday = 4
    return first + timedelta(days=delta + 14)


def trading_days_before(expiry: date, n: int) -> date:
    d = expiry
    left = n
    while left > 0:
        d -= timedelta(days=1)
        if d.weekday() < 5:
            left -= 1
    return d


def monday_of_week(day: date) -> date:
    return day - timedelta(days=day.weekday())


def quarterly_from(as_of: date, *, count: int = 6) -> list[tuple[int, int, str]]:
    """Upcoming ES/MES quarterlies as (year, month, code), as-of including current month."""
    y, m = as_of.year, as_of.month
    out: list[tuple[int, int, str]] = []
    # Walk forward from this month until `count` quarterlies with expiry >= as_of.
    guard = 0
    while len(out) < count and guard < 48:
        guard += 1
        if m in QUARTERLY_MONTHS:
            exp = third_friday(y, m)
            if exp >= as_of:
                out.append((y, m, MONTH_TO_CODE[m]))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out


def contract_symbol(root: str, year: int, month_code: str) -> str:
    return f"{root}{month_code}{year:04d}"


def expiration_for_contract(symbol: str) -> date | None:
    parsed = parse_long_form(symbol)
    if parsed is None:
        return None
    _root, year, month = parsed
    return third_friday(year, month)


def parse_long_form(symbol: str) -> tuple[str, int, int] | None:
    """Return (root, year, month) for ROOT + month-code + 4-digit year."""
    s = symbol.strip().upper()
    if len(s) < 6:
        return None
    year_s = s[-4:]
    if not year_s.isdigit():
        return None
    code = s[-5:-4]
    if code not in CODE_TO_MONTH:
        return None
    root = s[:-5]
    if not root.isalpha():
        return None
    return root, int(year_s), CODE_TO_MONTH[code]


def trigger_date(expiry: date, preset: dict[str, Any]) -> date:
    n = preset.get("trading_days_before")
    if n is not None:
        return trading_days_before(expiry, int(n))
    if preset.get("monday_of_expiry_week"):
        return monday_of_week(expiry)
    raise ValueError(f"preset {preset.get('id')} has no calendar trigger")


def pick_front(
    contracts: list[str],
    *,
    as_of: date,
    preset_id: str,
) -> str | None:
    """1st nearest listed contract that has not yet triggered the preset roll."""
    preset = _BY_ID.get(preset_id)
    if preset is None:
        raise KeyError(preset_id)
    if preset["status"] != "live":
        raise KeyError(preset_id)
    dated: list[tuple[date, str]] = []
    for sym in contracts:
        exp = expiration_for_contract(sym)
        if exp is None:
            continue
        if exp < as_of:
            continue
        dated.append((exp, sym))
    dated.sort()
    for exp, sym in dated:
        trig = trigger_date(exp, preset)
        # Trigger fires on session N; pointer writes after that close.
        # On the trigger date itself the old front still shows.
        if as_of <= trig:
            return sym
    return dated[0][1] if dated else None


def pick_nth(
    contracts: list[str],
    *,
    as_of: date,
    preset_id: str,
    n: int,
) -> str | None:
    """n=1 front, n=2 second, after applying the same calendar filter as pick_front."""
    if n < 1:
        raise ValueError("n must be >= 1")
    preset = _BY_ID.get(preset_id)
    if preset is None or preset["status"] != "live":
        raise KeyError(preset_id)
    dated: list[tuple[date, str]] = []
    for sym in contracts:
        exp = expiration_for_contract(sym)
        if exp is None or exp < as_of:
            continue
        dated.append((exp, sym))
    dated.sort()
    live: list[str] = []
    for exp, sym in dated:
        trig = trigger_date(exp, preset)
        if as_of <= trig or live:
            live.append(sym)
    if not live:
        live = [sym for _exp, sym in dated]
    if n - 1 < len(live):
        return live[n - 1]
    return None
