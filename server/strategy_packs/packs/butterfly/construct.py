"""Construct defined-risk butterfly structures from config + chain.

Batman (coach language): a *package* of two wing-symmetric flies —
one all-call + one all-put — usually same width, with optional per-side width.
"""

from __future__ import annotations

from typing import Any

from strategy_packs.packs.butterfly.family import normalize_family


def _mid(chain: dict[str, Any], right: str, strike: float) -> float:
    book = chain["calls"] if right == "call" else chain["puts"]
    row = book.get(str(strike)) or book.get(str(float(strike)))
    if not row:
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
    return [step * 6, step * 8, step * 10, step * 12]


def _resolve_side_widths(
    config: dict[str, Any],
    base_width: float,
) -> tuple[float, float]:
    """Return (call_width, put_width). Usually equal; may differ."""
    match = config.get("match_side_widths")
    if match is None:
        match = True
    match = bool(match)
    if match:
        return base_width, base_width
    try:
        cw = float(config.get("call_width_points") or base_width)
    except (TypeError, ValueError):
        cw = base_width
    try:
        pw = float(config.get("put_width_points") or base_width)
    except (TypeError, ValueError):
        pw = base_width
    return max(1.0, cw), max(1.0, pw)


def _body_centers(spot: float, step: float, *, n: int = 5) -> list[float]:
    center = round(spot / step) * step
    offsets = [0, -step, step, -2 * step, 2 * step][:n]
    return [center + off for off in offsets]


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
    debit = max(0.05, float(debit_per_share))
    body_mid = (2.0 * wing_price - debit) / 2.0
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


def _live_fly_legs(
    chain: dict[str, Any],
    right: str,
    lo: float,
    body: float,
    hi: float,
    dte: int,
) -> tuple[list[dict[str, Any]], float] | None:
    p_lo = _mid(chain, right, lo)
    p_mid = _mid(chain, right, body)
    p_hi = _mid(chain, right, hi)
    debit = p_lo - 2.0 * p_mid + p_hi
    if debit <= 0:
        return None
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
    return legs, debit


def _target_debit_ps(config: dict[str, Any], width: float, family: str, idx: int) -> float:
    if family in ("batman", "single", "symmetric"):
        try:
            lo = float(config.get("debit_to_width_min") or 0.02)
            hi = float(config.get("debit_to_width_max") or 0.05)
        except (TypeError, ValueError):
            lo, hi = 0.02, 0.05
        t = lo + (hi - lo) * ((idx % 5) / 4.0 if hi > lo else 0.0)
        return max(0.05, t * width)
    try:
        lo = float(config.get("target_debit_to_payoff_min") or 0.05)
        hi = float(config.get("target_debit_to_payoff_max") or 0.25)
    except (TypeError, ValueError):
        lo, hi = 0.05, 0.25
    t = lo + (hi - lo) * ((idx % 5) / 4.0 if hi > lo else 0.0)
    return max(0.05, t * width * 0.5)


def _one_symmetric_fly(
    chain: dict[str, Any],
    *,
    right: str,
    body: float,
    width: float,
    dte: int,
    is_stub: bool,
    config: dict[str, Any],
    family: str,
    idx: int,
) -> dict[str, Any] | None:
    half = width / 2.0
    lo, hi = body - half, body + half
    if lo <= 0:
        return None
    if is_stub:
        debit = _target_debit_ps(config, width, family, idx)
        legs = _fly_legs(right, lo, body, hi, dte, debit_per_share=debit)
    else:
        built = _live_fly_legs(chain, right, lo, body, hi, dte)
        if built is None:
            return None
        legs, debit = built
    return {
        "right": right,
        "width_points": width,
        "body": body,
        "lo": lo,
        "hi": hi,
        "legs": legs,
        "net_debit_per_share": debit,
    }


def construct_structures(
    config: dict[str, Any],
    chain: dict[str, Any],
) -> list[dict[str, Any]]:
    spot = float(chain.get("spot") or 5000.0)
    step = float(chain.get("strike_step") or 5.0)
    dte = int(chain.get("dte") or 0)
    direction = str(config.get("direction") or "call").lower()
    family = normalize_family(config.get("butterfly_family"))
    structures: list[dict[str, Any]] = []
    n = 0
    is_stub = (chain.get("provenance") or {}).get("source") == "stub"

    # ── Batman: call fly + put fly package ─────────────────────────────
    if family == "batman":
        for base_w in _width_candidates(config, step):
            call_w, put_w = _resolve_side_widths(config, base_w)
            for body in _body_centers(spot, step, n=5):
                n += 1
                call_fly = _one_symmetric_fly(
                    chain,
                    right="call",
                    body=body,
                    width=call_w,
                    dte=dte,
                    is_stub=is_stub,
                    config=config,
                    family="batman",
                    idx=n,
                )
                put_fly = _one_symmetric_fly(
                    chain,
                    right="put",
                    body=body,
                    width=put_w,
                    dte=dte,
                    is_stub=is_stub,
                    config=config,
                    family="batman",
                    idx=n + 1,
                )
                if not call_fly or not put_fly:
                    continue
                legs = list(call_fly["legs"]) + list(put_fly["legs"])
                total_debit = float(call_fly["net_debit_per_share"]) + float(
                    put_fly["net_debit_per_share"]
                )
                total_width = call_w + put_w
                structures.append(
                    {
                        "id": (
                            f"batman-c{int(call_w)}-p{int(put_w)}"
                            f"-b{int(body)}-{n}"
                        ),
                        "family": "batman",
                        "structure_kind": "batman",
                        "label": "Batman (call fly + put fly)",
                        "call_width_points": call_w,
                        "put_width_points": put_w,
                        "width_points": total_width,
                        "body": body,
                        "legs": legs,
                        "net_debit_per_share": total_debit,
                        "components": {
                            "call_fly": {
                                "width_points": call_w,
                                "lo": call_fly["lo"],
                                "body": call_fly["body"],
                                "hi": call_fly["hi"],
                                "net_debit_per_share": call_fly[
                                    "net_debit_per_share"
                                ],
                            },
                            "put_fly": {
                                "width_points": put_w,
                                "lo": put_fly["lo"],
                                "body": put_fly["body"],
                                "hi": put_fly["hi"],
                                "net_debit_per_share": put_fly[
                                    "net_debit_per_share"
                                ],
                            },
                        },
                    }
                )
        return structures

    # ── Single fly (one side) ──────────────────────────────────────────
    if family == "single":
        rights = (
            ["call"]
            if direction == "call"
            else ["put"]
            if direction == "put"
            else ["call", "put"]
        )
        for width in _width_candidates(config, step):
            for body in _body_centers(spot, step, n=5):
                for right in rights:
                    n += 1
                    fly = _one_symmetric_fly(
                        chain,
                        right=right,
                        body=body,
                        width=width,
                        dte=dte,
                        is_stub=is_stub,
                        config=config,
                        family="single",
                        idx=n,
                    )
                    if not fly:
                        continue
                    structures.append(
                        {
                            "id": f"single-{right}-{int(fly['lo'])}-{int(body)}-{int(fly['hi'])}-{n}",
                            "family": "single",
                            "structure_kind": "single_fly",
                            "right": right,
                            "width_points": width,
                            "legs": fly["legs"],
                            "net_debit_per_share": fly["net_debit_per_share"],
                        }
                    )
        return structures

    # ── Broken wing ────────────────────────────────────────────────────
    side = str(config.get("broken_wing_side") or "lower").lower()
    rights = (
        ["call"]
        if direction == "call"
        else ["put"]
        if direction == "put"
        else ["call", "put"]
    )
    for width in _width_candidates(config, step)[:3]:
        short_w = width
        long_w = width * 1.5
        for body in _body_centers(spot, step, n=3):
            for right in rights:
                if side == "lower":
                    lo, hi = body - long_w, body + short_w
                else:
                    lo, hi = body - short_w, body + long_w
                if lo <= 0:
                    continue
                n += 1
                w_eff = max(body - lo, hi - body)
                if is_stub:
                    debit = _target_debit_ps(config, w_eff, "broken_wing", n)
                    legs = _fly_legs(
                        right, lo, body, hi, dte, debit_per_share=debit
                    )
                else:
                    built = _live_fly_legs(chain, right, lo, body, hi, dte)
                    if built is None:
                        continue
                    legs, debit = built
                structures.append(
                    {
                        "id": f"bwb-{right}-{side}-{int(lo)}-{int(body)}-{int(hi)}-{n}",
                        "family": "broken_wing",
                        "structure_kind": "broken_wing",
                        "right": right,
                        "width_points": w_eff,
                        "broken_wing_side": side,
                        "legs": legs,
                        "net_debit_per_share": debit,
                    }
                )

    return structures
