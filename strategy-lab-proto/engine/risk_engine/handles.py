"""Map MSC-style strike-handle drags → Spec shape fields.

Roles:
  wing  — outer legs; drag changes wing_width
  short — body / inner legs; drag changes OTM / body feel

Classic long butterfly (+1/−2/+1): body is the −2 middle (qty < 0),
wings are the +1 outers (qty > 0).

Long condor / debit verticals: body/inners are long (qty > 0),
outers are short (qty < 0).

Shift+drag: move entire position → body_offset.
"""

from __future__ import annotations

from typing import Any

from engine.risk_engine.legs import Package
from engine.spec import normalize_structure
from engine.universe import snap_wing_width, strike_increment


def _is_butterfly_pkg(pkg: Package) -> bool:
    """True if package looks like classic +1/−2/+1 same-right butterfly."""
    by_k: dict[float, int] = {}
    for lg in pkg.legs:
        by_k[lg.strike] = by_k.get(lg.strike, 0) + int(lg.qty)
    qtys = sorted(by_k.values())
    # net +1, −2, +1 (scaled by positions)
    if len(qtys) != 3:
        return False
    # ratios: outer longs, middle short twice
    mids = [q for q in by_k.values() if q < 0]
    wings = [q for q in by_k.values() if q > 0]
    if len(mids) != 1 or len(wings) != 2:
        return False
    return abs(mids[0]) == sum(wings) and wings[0] == wings[1]


def build_handles(pkg: Package, symbol: str) -> list[dict[str, Any]]:
    """Handle descriptors for the canvas (unique strikes + role)."""
    handles: list[dict[str, Any]] = []
    body = float(getattr(pkg, "body", None) or pkg.spot)
    is_fly = _is_butterfly_pkg(pkg)
    seen: set[float] = set()
    for lg in pkg.legs:
        if lg.strike in seen:
            continue
        seen.add(lg.strike)
        if is_fly:
            # +1/−2/+1: short middle = body, long outers = wings
            role = "short" if lg.qty < 0 else "wing"
        else:
            # Long condor / debit vertical: long body/inner, short wings
            role = "short" if lg.qty > 0 else "wing"
        side = (
            "put"
            if lg.strike < body - 1e-9
            else ("call" if lg.strike > body + 1e-9 else "body")
        )
        handles.append(
            {
                "strike": float(lg.strike),
                "role": role,
                "side": side,
                "qty": int(lg.qty),
                "right": lg.right,
            }
        )
    handles.sort(key=lambda h: h["strike"])
    return handles


def apply_handle_drag(
    *,
    structure: str,
    body_side: str,
    wing_width: float,
    strike_mode: str,
    body_offset: float,
    symbol: str,
    package: Package,
    event: dict[str, Any],
) -> dict[str, Any]:
    """Return updated shape fields from a strike_drag event.

    Keys: structure, body_side, wing_width, strike_mode, body_offset.
    """
    inc = strike_increment(symbol)
    wing = float(wing_width)
    mode = strike_mode if strike_mode in ("atm", "otm") else "atm"
    side = body_side if body_side in ("below", "above", "both") else "both"
    st = normalize_structure(structure)
    offset_now = float(body_offset or 0.0)
    if inc > 0:
        offset_now = round(offset_now / inc) * inc

    grab = float(event.get("grabbed_strike") or 0)
    new = float(event.get("new_strike") or grab)
    role = event.get("role") or "wing"
    hside = event.get("side") or "body"
    shift = bool(event.get("shift_key") or event.get("shiftKey"))
    body = float(getattr(package, "body", None) or package.spot)
    is_fly = st == "long_butterfly" or _is_butterfly_pkg(package)

    # MSC PnLChart only sends grabbedStrike/offset/shiftKey — infer role/side
    if role in ("auto", "wing", "short") and (
        event.get("role") in (None, "auto") or event.get("side") in (None, "auto")
    ):
        for lg in package.legs:
            if abs(float(lg.strike) - grab) < 1e-6:
                if is_fly:
                    role = "short" if lg.qty < 0 else "wing"
                else:
                    role = "short" if lg.qty > 0 else "wing"
                hside = (
                    "put"
                    if lg.strike < body - 1e-9
                    else ("call" if lg.strike > body + 1e-9 else "body")
                )
                break

    # Snap new strike to grid
    if inc > 0:
        new = round(new / inc) * inc
        raw_off = float(event.get("offset") or (new - grab))
        strike_steps = round(raw_off / inc) if inc > 0 else 0
        snapped_delta = strike_steps * inc
    else:
        snapped_delta = float(event.get("offset") or (new - grab))

    def _move_body(delta: float) -> dict[str, Any]:
        new_body_offset = offset_now + delta
        if inc > 0:
            new_body_offset = round(new_body_offset / inc) * inc
        return {
            "structure": st,
            "body_side": side,
            "wing_width": snap_wing_width(symbol, wing),
            "strike_mode": mode,
            "body_offset": float(new_body_offset),
        }

    # ── Shift+drag: move entire position along the price scale ───────────
    if shift:
        return _move_body(snapped_delta)

    # ── Wing resize ──────────────────────────────────────────────────────
    if role == "wing":
        # Distance from body center to outer wing strike
        wing = abs(new - body)
        wing = max(inc if inc > 0 else 1.0, wing)
        wing = snap_wing_width(symbol, wing)
        return {
            "structure": st,
            "body_side": side,
            "wing_width": wing,
            "strike_mode": mode,
            "body_offset": offset_now,
        }

    # ── Body / middle drag ───────────────────────────────────────────────
    if st == "long_butterfly" and hside == "body":
        return _move_body(snapped_delta)

    if st == "long_condor" and hside == "body":
        return _move_body(snapped_delta)

    # For fly, body short drag already handled; remaining = OTM shift feel
    if is_fly:
        return _move_body(snapped_delta)

    outers = [lg.strike for lg in package.legs if lg.qty < 0]
    if abs(new - body) < (inc * 0.5 if inc > 0 else 0.01):
        mode = "atm"
    else:
        mode = "otm"
        if hside == "put" and outers:
            outer_put = min(outers)
            wing = abs(new - outer_put)
        elif hside == "call" and outers:
            outer_call = max(outers)
            wing = abs(outer_call - new)
        else:
            wing = max(inc if inc > 0 else 1.0, wing)
        wing = max(inc if inc > 0 else 1.0, wing)
        wing = snap_wing_width(symbol, wing)

    return {
        "structure": st,
        "body_side": side,
        "wing_width": wing,
        "strike_mode": mode,
        "body_offset": offset_now,
    }
