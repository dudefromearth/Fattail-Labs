"""FIFO open→close structure matching. Port of matchOpenClose.

Safety: refuse to pair open→close when the hold span is absurdly long
(e.g. spreadsheet year typo 2026-05-12 open → 2027-05-12 close). That pairing
used to keep the structure in open interest for a full year on every journal day.

Quantity: a close consumes unit_qty(close) from FIFO opens of the same
structure_key (GCD-normalized). Closing 1 of a 5-unit open leaves 4 open.

Expiry: remaining units whose option expiry is on or before as_of are treated
as expired-worthless (synthetic TO_CLOSE at 0 on the expiry date).
"""

from __future__ import annotations

from datetime import date
from typing import Any

from trade_log_domain.structure import (
    structure_key,
    trade_expiry,
    trade_is_close_fill,
    unit_qty,
    ymd_from_exec,
)

# Max calendar days open→close for a matched pair. Legitimate multi-day holds
# in the 0DTE book are ~1 week; a year-long pair is always bad data.
# Unmatched opens past this window are also dropped from open-interest display.
MAX_STRUCTURE_HOLD_DAYS = 30

SYNTHETIC_EXPIRED_WORTHLESS = "expired_worthless"


def _parse_ymd(s: str | None) -> date | None:
    if not s or len(s) < 10 or s[4] != "-" or s[7] != "-":
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def calendar_days_between(open_day: str, close_day: str) -> int | None:
    """Inclusive calendar span in days (same day → 0). None if unparseable."""
    a, b = _parse_ymd(open_day), _parse_ymd(close_day)
    if a is None or b is None:
        return None
    return (b - a).days


def hold_within_limit(open_day: str, close_day: str) -> bool:
    """True if close may be paired with open under MAX_STRUCTURE_HOLD_DAYS."""
    span = calendar_days_between(open_day, close_day)
    if span is None:
        return False
    if span < 0:
        return False
    return span <= MAX_STRUCTURE_HOLD_DAYS


def slot_remaining(m: dict[str, Any]) -> int:
    open_u = int(m.get("open_units") or 0)
    closed_u = int(m.get("closed_units") or 0)
    return max(0, open_u - closed_u)


def slot_is_open(m: dict[str, Any]) -> bool:
    """True when the open still has unmatched (non-expired) units."""
    if m.get("close") is not None:
        return False
    return slot_remaining(m) > 0


def _synthetic_expire_close(open_t: dict[str, Any], exp: str) -> dict[str, Any]:
    """Virtual TO_CLOSE at 0 on the expiry date (not persisted)."""
    oid = int(open_t.get("id") or 0)
    legs: list[dict[str, Any]] = []
    for leg in open_t.get("legs") or []:
        nl = dict(leg)
        nl["side"] = "SELL" if (leg.get("side") or "").upper() == "BUY" else "BUY"
        nl["pos_effect"] = "TO_CLOSE"
        nl["fill_price"] = 0
        legs.append(nl)
    return {
        "id": -oid if oid else None,
        "account_id": open_t.get("account_id"),
        "exec_at": f"{exp}T16:00:00",
        "strategy": open_t.get("strategy"),
        "asset_class": open_t.get("asset_class"),
        "order_type": "EXPIRED",
        "net_price": 0,
        "net_side": None,
        "legs": legs,
        "synthetic": SYNTHETIC_EXPIRED_WORTHLESS,
        "pnl_amount": None,
        "entry_source": open_t.get("entry_source") or "import",
    }


def match_open_close(
    trades: list[dict[str, Any]],
    as_of: str | None = None,
) -> list[dict[str, Any]]:
    """Return list of {open, open_day, close, close_day, open_units, closed_units, closes}.

    FIFO by structure_key, quantity-aware. A close is **not** paired to an open
    when the hold would exceed MAX_STRUCTURE_HOLD_DAYS (orphaned close; open
    stays unmatched unless it later expires).

    Remaining units whose ``trade_expiry`` is on or before ``as_of`` (default:
    today) receive a synthetic expired-worthless close dated on the expiry.
    """
    as_of_day = (as_of or date.today().isoformat())[:10]
    sorted_t = sorted(
        trades,
        key=lambda t: (t.get("exec_at") or "", int(t.get("id") or 0)),
    )
    queues: dict[str, list[dict[str, Any]]] = {}
    result: list[dict[str, Any]] = []

    for t in sorted_t:
        day = ymd_from_exec(t.get("exec_at"))
        if not day:
            continue
        if t.get("strategy") == "NOTE" and not (t.get("legs") or []):
            continue

        key = structure_key(t)
        is_close = trade_is_close_fill(t)
        units = max(int(unit_qty(t) or 1), 1)

        if not is_close:
            m = {
                "open": t,
                "open_day": day,
                "close": None,
                "close_day": None,
                "open_units": units,
                "closed_units": 0,
                "closes": [],
            }
            queues.setdefault(key, []).append(m)
            result.append(m)
            continue

        remaining_close = units
        q = queues.get(key) or []
        for open_slot in q:
            if remaining_close <= 0:
                break
            leftover = slot_remaining(open_slot)
            if leftover <= 0:
                continue
            if not hold_within_limit(str(open_slot["open_day"]), day):
                continue
            take = min(leftover, remaining_close)
            open_slot["closed_units"] = int(open_slot["closed_units"]) + take
            remaining_close -= take
            open_slot["closes"].append(
                {"close": t, "close_day": day, "units": take}
            )
            if slot_remaining(open_slot) <= 0:
                open_slot["close"] = t
                open_slot["close_day"] = day

    for m in result:
        leftover = slot_remaining(m)
        if leftover <= 0:
            continue
        exp = trade_expiry(m["open"])
        if not exp or exp > as_of_day:
            continue
        synth = _synthetic_expire_close(m["open"], exp)
        m["closes"].append({"close": synth, "close_day": exp, "units": leftover})
        m["closed_units"] = int(m["open_units"])
        m["close"] = synth
        m["close_day"] = exp

    return result


STATUS_OPEN = "Open"
STATUS_COMPLETE = "Complete"
STATUS_ORPHAN = "Orphan close"


def blotter_status_by_id(trades: list[dict[str, Any]]) -> dict[int, str]:
    """Autofilter Status tokens — same grain as client ``positionBadge``.

    Open / Complete / Orphan close. Trades with no named state are omitted
    (client NONE_TOKEN).
    """
    matches = match_open_close(trades)
    complete_open_ids: set[int] = set()
    open_ids: set[int] = set()
    paired_close_ids: set[int] = set()
    for m in matches:
        oid = m.get("open") or {}
        oid_n = oid.get("id")
        if oid_n is None:
            continue
        close = m.get("close")
        if close is not None:
            complete_open_ids.add(int(oid_n))
            if not close.get("synthetic") and close.get("id"):
                paired_close_ids.add(int(close["id"]))
            for sl in m.get("closes") or []:
                ct = sl.get("close") or {}
                if ct.get("synthetic") or not ct.get("id"):
                    continue
                paired_close_ids.add(int(ct["id"]))
        elif slot_is_open(m):
            open_ids.add(int(oid_n))
    out: dict[int, str] = {}
    for t in trades:
        tid = t.get("id")
        if tid is None:
            continue
        tid = int(tid)
        if trade_is_close_fill(t):
            out[tid] = (
                STATUS_COMPLETE if tid in paired_close_ids else STATUS_ORPHAN
            )
            continue
        if not (t.get("legs") or []):
            continue
        if tid in complete_open_ids:
            out[tid] = STATUS_COMPLETE
        elif tid in open_ids:
            out[tid] = STATUS_OPEN
    return out
