"""Construct defined-risk butterfly structures from config + chain."""

from __future__ import annotations

from typing import Any


def _mid(chain: dict[str, Any], right: str, strike: float) -> float:
    book = chain["calls"] if right == "call" else chain["puts"]
    row = book.get(str(strike)) or book.get(str(float(strike)))
    if not row:
        # nearest strike
        strikes = chain.get("strikes") or []
        if not strikes:
            return 1.0
        nearest = min(strikes, key=lambda k: abs(float(k) - strike))
        row = book.get(str(nearest), {"mid": 1.0})
    return float(row.get("mid") or 1.0)


def _width_candidates(config: dict[str, Any], step: float) -> list[float]:
    style = str(config.get("width_style") or "wide")
    wmin = config.get("width_points_min")
    wmax = config.get("width_points_max")
    if wmin is not None and wmax is not None:
        try:
            lo, hi = float(wmin), float(wmax)
            widths = []
            w = lo
            while w <= hi + 1e-9:
                widths.append(w)
                w += step * 2
            return widths or [lo]
        except (TypeError, ValueError):
            pass
    if style == "narrow":
        return [step * 2, step * 4]
    if style == "fixed_30_50":
        return [30.0, 40.0, 50.0]
    if style == "variable":
        return [step * 4, step * 6, step * 8, step * 10]
    # wide
    return [step * 6, step * 8, step * 10, step * 12]


def _body_strikes(
    spot: float,
    step: float,
    direction: str,
    *,
    n: int = 5,
) -> list[tuple[str, float]]:
    """Return list of (right, body_strike)."""
    center = round(spot / step) * step
    out: list[tuple[str, float]] = []
    rights = (
        ["call"]
        if direction == "call"
        else ["put"]
        if direction == "put"
        else ["call", "put"]
    )
    offsets = [0, -step, step, -2 * step, 2 * step][:n]
    for right in rights:
        for off in offsets:
            out.append((right, center + off))
    return out


def _fly_legs(
    right: str,
    lo: float,
    body: float,
    hi: float,
    dte: int,
    *,
    debit_per_share: float,
    wing_price: float = 0.05,
) -> list[dict[str, Any]]:
    """Build 1/-2/1 legs with synthetic mids so net debit matches target.

    Long wings ≈ wing_price each; short body priced so:
      wing + wing - 2*body_mid = debit  ⇒  body_mid = (2*wing - debit)/2
    """
    debit = max(0.05, float(debit_per_share))
    body_mid = (2.0 * wing_price - debit) / 2.0
    # If body would be non-positive, raise wing mids slightly
    if body_mid <= 0.05:
        wing_price = debit / 2.0 + 0.5
        body_mid = (2.0 * wing_price - debit) / 2.0
    return [
        {
            "right": right,
            "side": "buy",
            "strike": lo,
            "qty": 1,
            "dte": dte,
            "entry_price": round(wing_price, 4),
        },
        {
            "right": right,
            "side": "sell",
            "strike": body,
            "qty": 2,
            "dte": dte,
            "entry_price": round(body_mid, 4),
        },
        {
            "right": right,
            "side": "buy",
            "strike": hi,
            "qty": 1,
            "dte": dte,
            "entry_price": round(wing_price, 4),
        },
    ]


def _target_debit_ps(config: dict[str, Any], width: float, family: str, idx: int) -> float:
    """Pick a debit/share inside coaching bands for stub construct."""
    if family == "symmetric":
        try:
            lo = float(config.get("debit_to_width_min") or 0.02)
            hi = float(config.get("debit_to_width_max") or 0.05)
        except (TypeError, ValueError):
            lo, hi = 0.02, 0.05
        # vary across candidates inside band
        t = lo + (hi - lo) * ((idx % 5) / 4.0 if hi > lo else 0.0)
        return max(0.05, t * width)
    # BWB: debit_to_payoff ≈ debit/maxProfit; maxProfit ~ width for flies
    try:
        lo = float(config.get("target_debit_to_payoff_min") or 0.05)
        hi = float(config.get("target_debit_to_payoff_max") or 0.25)
    except (TypeError, ValueError):
        lo, hi = 0.05, 0.25
    t = lo + (hi - lo) * ((idx % 5) / 4.0 if hi > lo else 0.0)
    # approximate max profit ~ width points → debit ≈ t * width
    return max(0.05, t * width * 0.5)


def construct_structures(
    config: dict[str, Any],
    chain: dict[str, Any],
) -> list[dict[str, Any]]:
    spot = float(chain.get("spot") or 5000.0)
    step = float(chain.get("strike_step") or 5.0)
    dte = int(chain.get("dte") or 0)
    direction = str(config.get("direction") or "balanced").lower()
    family = str(config.get("butterfly_family") or "symmetric").lower()
    structures: list[dict[str, Any]] = []
    n = 0
    is_stub = (chain.get("provenance") or {}).get("source") == "stub"

    if family == "symmetric":
        for width in _width_candidates(config, step):
            half = width / 2.0
            for right, body in _body_strikes(spot, step, direction):
                lo, hi = body - half, body + half
                if lo <= 0:
                    continue
                n += 1
                if is_stub:
                    debit = _target_debit_ps(config, width, family, n)
                    legs = _fly_legs(right, lo, body, hi, dte, debit_per_share=debit)
                else:
                    # Live chain: use mids (may filter out of band later)
                    p_lo = _mid(chain, right, lo)
                    p_mid = _mid(chain, right, body)
                    p_hi = _mid(chain, right, hi)
                    debit = p_lo - 2.0 * p_mid + p_hi
                    if debit <= 0:
                        continue
                    legs = [
                        {
                            "right": right,
                            "side": "buy",
                            "strike": lo,
                            "qty": 1,
                            "dte": dte,
                            "entry_price": p_lo,
                        },
                        {
                            "right": right,
                            "side": "sell",
                            "strike": body,
                            "qty": 2,
                            "dte": dte,
                            "entry_price": p_mid,
                        },
                        {
                            "right": right,
                            "side": "buy",
                            "strike": hi,
                            "qty": 1,
                            "dte": dte,
                            "entry_price": p_hi,
                        },
                    ]
                structures.append(
                    {
                        "id": f"sym-{right}-{int(lo)}-{int(body)}-{int(hi)}-{n}",
                        "family": "symmetric",
                        "right": right,
                        "width_points": width,
                        "legs": legs,
                        "net_debit_per_share": debit if is_stub else (
                            legs[0]["entry_price"]
                            - 2 * legs[1]["entry_price"]
                            + legs[2]["entry_price"]
                        ),
                    }
                )

    else:  # broken_wing
        side = str(config.get("broken_wing_side") or "lower").lower()
        for width in _width_candidates(config, step)[:3]:
            short_w = width
            long_w = width * 1.5
            for right, body in _body_strikes(spot, step, direction, n=3):
                if side == "lower":
                    lo, hi = body - long_w, body + short_w
                else:
                    lo, hi = body - short_w, body + long_w
                if lo <= 0:
                    continue
                n += 1
                w_eff = max(body - lo, hi - body)
                if is_stub:
                    debit = _target_debit_ps(config, w_eff, family, n)
                    legs = _fly_legs(right, lo, body, hi, dte, debit_per_share=debit)
                else:
                    p_lo = _mid(chain, right, lo)
                    p_mid = _mid(chain, right, body)
                    p_hi = _mid(chain, right, hi)
                    debit = p_lo - 2.0 * p_mid + p_hi
                    if debit <= 0:
                        continue
                    legs = [
                        {
                            "right": right,
                            "side": "buy",
                            "strike": lo,
                            "qty": 1,
                            "dte": dte,
                            "entry_price": p_lo,
                        },
                        {
                            "right": right,
                            "side": "sell",
                            "strike": body,
                            "qty": 2,
                            "dte": dte,
                            "entry_price": p_mid,
                        },
                        {
                            "right": right,
                            "side": "buy",
                            "strike": hi,
                            "qty": 1,
                            "dte": dte,
                            "entry_price": p_hi,
                        },
                    ]
                structures.append(
                    {
                        "id": f"bwb-{right}-{side}-{int(lo)}-{int(body)}-{int(hi)}-{n}",
                        "family": "broken_wing",
                        "right": right,
                        "width_points": w_eff,
                        "broken_wing_side": side,
                        "legs": legs,
                        "net_debit_per_share": debit if is_stub else (
                            legs[0]["entry_price"]
                            - 2 * legs[1]["entry_price"]
                            + legs[2]["entry_price"]
                        ),
                    }
                )

    return structures
