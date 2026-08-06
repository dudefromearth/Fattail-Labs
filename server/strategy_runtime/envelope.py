"""Risk envelope checks for Curate / Process Runtime."""

from __future__ import annotations

from typing import Any


DEFAULT_ENVELOPE: dict[str, Any] = {
    "allocation_usd": 10_000.0,
    "max_positions_concurrent": 3,
    "max_positions_per_day": 5,
    "max_positions_per_symbol": 1,
    "defined_risk_only": True,
    "allow_manual_open": True,
    "take_profit_frac_of_max_profit": 0.5,
    "stop_multiple_of_premium_risked": 2.0,
    "scan_symbol": "SPY",
    "scan_risk_per_open_usd": 500.0,
}


def normalize_envelope(raw: dict[str, Any] | None) -> dict[str, Any]:
    out = dict(DEFAULT_ENVELOPE)
    if isinstance(raw, dict):
        for k, v in raw.items():
            if k in out or k in (
                "allocation_usd",
                "max_positions_concurrent",
                "max_positions_per_day",
                "max_positions_per_symbol",
                "defined_risk_only",
                "allow_manual_open",
                "take_profit_frac_of_max_profit",
                "stop_multiple_of_premium_risked",
                "scan_symbol",
                "scan_risk_per_open_usd",
                "max_new_risk_when_stressed",
            ):
                out[k] = v
    # coerce numbers
    out["allocation_usd"] = float(out["allocation_usd"])
    out["max_positions_concurrent"] = int(out["max_positions_concurrent"])
    out["max_positions_per_day"] = int(out["max_positions_per_day"])
    out["max_positions_per_symbol"] = int(out["max_positions_per_symbol"])
    out["defined_risk_only"] = bool(out["defined_risk_only"])
    out["allow_manual_open"] = bool(out["allow_manual_open"])
    out["take_profit_frac_of_max_profit"] = float(
        out["take_profit_frac_of_max_profit"]
    )
    out["stop_multiple_of_premium_risked"] = float(
        out["stop_multiple_of_premium_risked"]
    )
    out["scan_risk_per_open_usd"] = float(out["scan_risk_per_open_usd"])
    out["scan_symbol"] = str(out.get("scan_symbol") or "SPY").upper()
    if out["allocation_usd"] <= 0:
        raise ValueError("envelope.allocation_usd must be > 0")
    if out["max_positions_concurrent"] < 1:
        raise ValueError("envelope.max_positions_concurrent must be >= 1")
    if out["scan_risk_per_open_usd"] <= 0:
        raise ValueError("envelope.scan_risk_per_open_usd must be > 0")
    return out


def check_open_allowed(
    envelope: dict[str, Any],
    *,
    open_count: int,
    opens_today: int,
    open_for_symbol: int,
    risk_usd: float,
    cash_usd: float,
) -> tuple[bool, str | None]:
    """Return (ok, reason_code)."""
    if open_count >= int(envelope["max_positions_concurrent"]):
        return False, "envelope_max_positions_concurrent"
    if opens_today >= int(envelope["max_positions_per_day"]):
        return False, "envelope_max_positions_per_day"
    if open_for_symbol >= int(envelope["max_positions_per_symbol"]):
        return False, "envelope_max_positions_per_symbol"
    if risk_usd > float(cash_usd) + 1e-9:
        return False, "envelope_insufficient_cash"
    if risk_usd > float(envelope["allocation_usd"]) + 1e-9:
        return False, "envelope_allocation"
    if envelope.get("defined_risk_only") and risk_usd <= 0:
        return False, "envelope_defined_risk_only"
    return True, None
