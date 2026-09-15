"""PPL3 close integrity — four gates. Overrides are explicit payload flags.

Does not rewrite FIFO. Import commit does not call this (OD-25).
"""

from __future__ import annotations

from typing import Any

from trade_log_domain.matching import match_open_close, real_close_slices
from trade_log_domain.structure import structure_key, trade_is_close_fill, unit_qty


class CloseGateError(Exception):
    def __init__(self, code: str, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = f"{code}: {detail}"


def _truthy(v: Any) -> bool:
    if v is True:
        return True
    if isinstance(v, str) and v.strip().lower() in ("1", "true", "yes"):
        return True
    return False


def overrides_from_body(body: dict[str, Any] | None) -> dict[str, bool]:
    b = body or {}
    return {
        "allow_orphan_close": _truthy(b.get("allow_orphan_close")),
        "allow_account_mismatch": _truthy(b.get("allow_account_mismatch")),
        "allow_partial_units": _truthy(b.get("allow_partial_units")),
        "allow_structure_drift": _truthy(b.get("allow_structure_drift")),
    }


def intended_open_id_from_body(body: dict[str, Any] | None) -> int | None:
    raw = (body or {}).get("intended_open_id")
    if raw in (None, ""):
        return None
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return None
    return n if n > 0 else None


def _without_account(trade: dict[str, Any]) -> dict[str, Any]:
    return {**trade, "account_id": None}


def _exec_at_str(v: Any) -> str:
    if v is None:
        return ""
    if hasattr(v, "isoformat"):
        s = v.isoformat(sep="T")
        return s[:19] if len(s) >= 19 else s
    return str(v)


def _coerce_leg(leg: dict[str, Any]) -> dict[str, Any]:
    """Align a request-body leg with `_leg_row` so structure_key matches the book."""
    d = dict(leg)
    if d.get("strike") is not None:
        try:
            d["strike"] = float(d["strike"])
        except (TypeError, ValueError):
            pass
    if not d.get("right") and d.get("option_right"):
        d["right"] = d["option_right"]
    if not d.get("asset_class"):
        d["asset_class"] = "equity_option"
    exp = d.get("expiry")
    if exp is not None and hasattr(exp, "isoformat"):
        d["expiry"] = str(exp)[:10]
    elif isinstance(exp, str) and len(exp) >= 10:
        d["expiry"] = exp[:10]
    return d


def _for_match(trade: dict[str, Any]) -> dict[str, Any]:
    """Matcher sorts exec_at as strings; API drafts may still be datetime."""
    d = dict(trade)
    d["exec_at"] = _exec_at_str(d.get("exec_at"))
    d["legs"] = [_coerce_leg(l) for l in (d.get("legs") or []) if isinstance(l, dict)]
    return d


def paired_open_for_close(
    book: list[dict[str, Any]], close_t: dict[str, Any]
) -> dict[str, Any] | None:
    """FIFO pair for a proposed (or persisted) close.

    Walks ``closes[]`` including not-yet-persisted ids (0). Skips synthetic
    expire-worthless slices. Does not use ``real_close_slices`` (that helper
    drops id < 1, which would treat a POST draft as an orphan).
    """
    cid = close_t.get("id")
    matched = match_open_close([_for_match(t) for t in book] + [_for_match(close_t)])
    for m in matched:
        close = m.get("close") or {}
        if (
            cid is not None
            and close.get("id") == cid
            and not close.get("synthetic")
        ):
            return m.get("open")
        for sl in m.get("closes") or []:
            ct = sl.get("close") or {}
            if ct.get("synthetic"):
                continue
            if cid is not None and ct.get("id") == cid:
                return m.get("open")
    return None


def blocking_close_for_open(
    book: list[dict[str, Any]], open_id: int
) -> dict[str, Any] | None:
    matched = match_open_close([_for_match(t) for t in book])
    for m in matched:
        oid = (m.get("open") or {}).get("id")
        if oid != open_id:
            continue
        for sl in real_close_slices(m):
            if sl.get("id"):
                return sl
        close = m.get("close") or {}
        if close.get("id") and not close.get("synthetic") and int(close["id"]) > 0:
            return close
    return None


def _acct(trade: dict[str, Any] | None) -> int | None:
    if not trade:
        return None
    raw = trade.get("account_id")
    if raw is None:
        return None
    return int(raw)


def assert_close_gates(
    book: list[dict[str, Any]],
    proposed: dict[str, Any],
    *,
    intended_open: dict[str, Any] | None = None,
    overrides: dict[str, bool] | None = None,
) -> None:
    if not trade_is_close_fill(proposed):
        return
    ov = overrides or {}
    proposed = _for_match(proposed)
    book = [_for_match(t) for t in book]
    if intended_open is not None:
        intended_open = _for_match(intended_open)

    if intended_open is not None:
        draft = {
            **intended_open,
            "id": proposed.get("id"),
            "legs": proposed.get("legs") or [],
            "strategy": proposed.get("strategy") or intended_open.get("strategy"),
            "account_id": intended_open.get("account_id"),
        }
        if structure_key(draft) != structure_key(intended_open):
            if not ov.get("allow_structure_drift"):
                raise CloseGateError(
                    "structure_drift",
                    "Structure no longer matches the open.",
                )

    same_acct = [
        t
        for t in book
        if _acct(t) is not None
        and _acct(proposed) is not None
        and _acct(t) == _acct(proposed)
    ]
    paired = paired_open_for_close(same_acct, proposed)
    if paired is None:
        stripped_book = [_without_account(t) for t in book]
        stripped_close = _without_account(proposed)
        paired_any = paired_open_for_close(stripped_book, stripped_close)
        if paired_any is None:
            if not ov.get("allow_orphan_close"):
                raise CloseGateError(
                    "orphan_close",
                    "No open match for this close structure.",
                )
            return
        real = next(
            (t for t in book if t.get("id") == paired_any.get("id")),
            paired_any,
        )
        if not ov.get("allow_account_mismatch"):
            raise CloseGateError(
                "account_mismatch",
                "Close account differs from open account.",
            )
        paired = real

    if intended_open is not None and int(paired.get("id") or 0) != int(
        intended_open.get("id") or 0
    ):
        if not ov.get("allow_orphan_close"):
            raise CloseGateError(
                "orphan_close",
                f"Would pair with open #{paired.get('id')}, not #{intended_open.get('id')}.",
            )

    p_acct = paired.get("account_id")
    c_acct = proposed.get("account_id")
    if p_acct is not None and c_acct is not None and int(p_acct) != int(c_acct):
        if not ov.get("allow_account_mismatch"):
            raise CloseGateError(
                "account_mismatch",
                "Close account differs from open account.",
            )

    open_u = max(int(unit_qty(paired) or 1), 1)
    close_u = max(int(unit_qty(proposed) or 1), 1)
    if close_u != open_u and not ov.get("allow_partial_units"):
        raise CloseGateError(
            "partial_units",
            f"Close units ({close_u}) ≠ open units ({open_u}).",
        )
