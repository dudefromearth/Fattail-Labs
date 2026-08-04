"""Position legs for Labs Risk Graph (no MSC Position/Contract dependency).

Builds typed option legs from StrategySpec geometry. Entry prices are
**dollars per share** (not cents) — cost basis dollars = entry × mult × qty.

Long-only (debit) structures:
  • long butterfly — classic +1 / −2 / +1, **all calls or all puts**
  • long condor — long inners, short outer wings
  • debit verticals — long / short same right
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from engine.spec import StrategySpec, normalize_structure
from engine.universe import snap_wing_width, strike_increment

Right = Literal["call", "put"]


@dataclass(frozen=True)
class OptionLeg:
    """One option leg for the risk engine."""

    strike: float
    qty: int  # + long / − short (contracts already expanded by positions)
    right: Right
    entry_price: float  # $/share; debit long legs carry package premium
    iv: float | None = None  # per-leg IV for Mkt mode; None → package σ


def _time_years(spec: StrategySpec) -> float:
    """Fractional years to expiry for premium reprice (matches risk_graph host)."""
    dte = int(getattr(spec, "dte", 0) or 0)
    session = getattr(spec, "entry_session", None) or "afternoon"
    left = {"morning": 0.75, "afternoon": 0.40, "closing": 0.12}.get(session, 0.40)
    if dte <= 0:
        return max(left, 0.25) / 365.0
    return (dte + left) / 365.0


def _default_iv(spec: StrategySpec) -> float:
    """Flat IV for premium reprice — higher for 0DTE-ish."""
    dte = int(getattr(spec, "dte", 0) or 0)
    if dte <= 0:
        return 0.22
    if dte == 1:
        return 0.18
    return 0.16


def _bs_net_debit_per_share(
    legs: list[tuple[float, int, Right]],
    *,
    spot: float,
    time_years: float,
    sigma: float,
    wing: float,
) -> float:
    """Package mid debit — MSC card algebra: abs(Σ qty × mid).

    MSC RiskGraphPanel unlocked cards use chain mids the same way. Labs uses BS
    as mid. No ATM-decay invent (that inverted max-loss vs moneyness).
    """
    from engine.risk_engine.pricing import bs_price

    if spot <= 0 or time_years <= 0 or sigma <= 0 or not legs:
        return float(min(wing * 0.35, max(0.10, wing * 0.25)))
    price = 0.0
    for strike, qty, right in legs:
        unit = bs_price(
            spot, float(strike), time_years, 0.0, sigma, right == "call"
        )
        price += float(qty) * unit
    # Long package: Σ qty×mid > 0 (debit paid). Cap to wing (defined risk width).
    return float(min(wing * 0.95, max(0.05, abs(price))))


def _est_debit_fallback(spec: StrategySpec, wing: float) -> float:
    """R2R-target / wing fraction when BS reprice unavailable.

    For debit: R2R = (wing − debit) / debit → debit = wing / (1 + R2R).
    """
    r = float(getattr(spec, "target_r2r", 0) or 0)
    rule = getattr(spec, "r2r_rule", "nearest") or "nearest"
    if rule == "minimum" and r > 0:
        # debit such that (wing-d)/d = r → d = wing/(1+r)
        d = wing / (1.0 + r)
        return float(min(wing * 0.95, max(0.05, d)))
    return float(min(wing * 0.35, max(0.10, wing * 0.25)))


def _spot_default(spec: StrategySpec) -> float:
    u = (spec.underlying or "SPY").upper()
    defaults = {
        "SPY": 560.0,
        "QQQ": 480.0,
        "IWM": 220.0,
        "SPX": 5600.0,
        "XSP": 560.0,
        "NDX": 20000.0,
        "RUT": 2200.0,
        "VIX": 16.0,
        "AAPL": 220.0,
        "NVDA": 130.0,
        "TSLA": 250.0,
        "USO": 75.0,
        "GLD": 240.0,
    }
    return float(defaults.get(u, 100.0))


@dataclass(frozen=True)
class Package:
    """Structure package ready for curve generation."""

    legs: tuple[OptionLeg, ...]
    spot: float  # market ref (ATM), chart yellow line
    body: float  # structure center = spot + body_offset (Shift+drag)
    wing: float
    credit: float  # net debit $/share (field name kept for payload compat; always debit)
    multiplier: int  # 100 * positions
    max_profit: float  # $
    max_loss: float  # $ (positive magnitude of max risk = debit paid)
    breakevens: tuple[float, ...]
    label: str

    @property
    def debit(self) -> float:
        """Net debit paid per share (alias of credit field)."""
        return self.credit


def build_package(
    spec: StrategySpec,
    *,
    spot: float | None = None,
    credit: float | None = None,
) -> Package:
    """Build a single-package Package from StrategySpec (long/debit only)."""
    symbol = spec.underlying
    wing = snap_wing_width(symbol, float(spec.wing_width))
    inc = strike_increment(symbol)
    spot_x = float(spot if spot is not None else _spot_default(spec))
    atm = round(spot_x / inc) * inc if inc > 0 else spot_x
    # Shift entire structure along the strike ladder (MSC Shift+drag)
    raw_off = float(getattr(spec, "body_offset", 0.0) or 0.0)
    if inc > 0:
        raw_off = round(raw_off / inc) * inc
    body = atm + raw_off
    n_pos = max(1, int(spec.contracts))
    mult = 100 * n_pos
    st = normalize_structure(spec.structure)
    side = getattr(spec, "body_side", None) or "both"
    mode = (
        spec.normalized_strike_mode()
        if hasattr(spec, "normalized_strike_mode")
        else "atm"
    )

    # ── Long butterfly: classic +1 / −2 / +1, all calls or all puts ─────
    is_fly = st == "long_butterfly"
    is_ic = st == "long_condor"
    # Direction picks the right: below → puts, above/both → calls
    fly_right: Right = "put" if side == "below" else "call"

    want_put = st == "put_debit" or (
        is_ic and (side == "below" or side == "both")
    )
    want_call = st == "call_debit" or (
        is_ic and (side == "above" or side == "both")
    )
    if st == "put_debit":
        want_put, want_call = True, False
    elif st == "call_debit":
        want_put, want_call = False, True

    # Geometry first (qty/right/strike only) — then reprice debit at *spot*
    geo: list[tuple[float, int, Right]] = []
    fly_body = body
    if is_fly:
        # OTM: slide the whole fly center further OTM
        if mode == "otm":
            step = max(inc if inc > 0 else 1.0, min(wing * 2, body * 0.02))
            if side == "below":
                fly_body = body - step
            elif side == "above":
                fly_body = body + step
            # both: keep ATM body
        if inc > 0:
            fly_body = round(fly_body / inc) * inc
        # +1 low, −2 mid, +1 high — same right throughout
        geo = [
            (fly_body - wing, +n_pos, fly_right),
            (fly_body, -2 * n_pos, fly_right),
            (fly_body + wing, +n_pos, fly_right),
        ]
        body = fly_body  # structure center = middle strike
    else:
        if want_put:
            if mode == "otm" or is_ic:
                put_long = body - max(inc, wing) if (mode == "otm" or is_ic) else body
                if is_ic and mode != "otm":
                    put_long = body - wing
            else:
                put_long = body
            if mode == "otm" and not is_ic:
                put_long = body - max(inc, min(wing * 2, body * 0.02))
            put_long = round(put_long / inc) * inc if inc > 0 else put_long
            # Put debit: long higher put, short lower put
            geo.extend([(put_long, +n_pos, "put"), (put_long - wing, -n_pos, "put")])
        if want_call:
            if mode == "otm" or is_ic:
                call_long = body + max(inc, wing) if (mode == "otm" or is_ic) else body
                if is_ic and mode != "otm":
                    call_long = body + wing
            else:
                call_long = body
            if mode == "otm" and not is_ic:
                call_long = body + max(inc, min(wing * 2, body * 0.02))
            call_long = round(call_long / inc) * inc if inc > 0 else call_long
            # Call debit: long lower call, short higher call
            geo.extend([(call_long, +n_pos, "call"), (call_long + wing, -n_pos, "call")])

    if credit is not None:
        deb = float(min(wing * 0.95, max(0.05, credit)))
    else:
        deb = _bs_net_debit_per_share(
            geo,
            spot=spot_x,
            time_years=_time_years(spec),
            sigma=_default_iv(spec),
            wing=wing,
        )
        if not geo:
            deb = _est_debit_fallback(spec, wing)

    legs: list[OptionLeg] = []
    be: list[float] = []

    if is_fly:
        tot = min(wing * 0.95, max(0.05, deb))
        # Wing longs carry debit; body short entry 0 for cost-basis algebra
        legs = [
            OptionLeg(body - wing, +n_pos, fly_right, tot / 2.0),
            OptionLeg(body, -2 * n_pos, fly_right, 0.0),
            OptionLeg(body + wing, +n_pos, fly_right, tot / 2.0),
        ]
        label = f"Long {'put' if fly_right == 'put' else 'call'} butterfly"
        max_loss = tot * mult
        max_profit = (wing - tot) * mult
        # Peak at body; BEs between wings: body ± (wing − debit) from center
        # equivalently body − wing + debit and body + wing − debit
        be = [body - wing + tot, body + wing - tot]
        deb = tot
    else:
        put_debit = deb if want_put and not want_call else (deb * 0.5 if want_put else 0.0)
        call_debit = deb if want_call and not want_put else (deb * 0.5 if want_call else 0.0)
        if want_put and want_call:
            tot = min(wing * 0.95, max(0.05, deb))
            put_debit = call_debit = tot / 2.0
            deb = tot

        put_legs = [(k, q, r) for k, q, r in geo if r == "put"]
        call_legs = [(k, q, r) for k, q, r in geo if r == "call"]
        for k, q, r in put_legs:
            # Longs carry package debit allocation
            entry = put_debit if q > 0 else 0.0
            legs.append(OptionLeg(k, q, r, entry))
        for k, q, r in call_legs:
            entry = call_debit if q > 0 else 0.0
            legs.append(OptionLeg(k, q, r, entry))

        if want_put and want_call:
            label = "Long condor"
            max_loss = deb * mult
            max_profit = (wing - deb) * mult
            longs = sorted(lg.strike for lg in legs if lg.qty > 0)
            be = [longs[0] - deb, longs[-1] + deb]
        elif want_put:
            label = "Put debit"
            max_loss = deb * mult
            max_profit = (wing - deb) * mult
            long_k = max(lg.strike for lg in legs if lg.qty > 0)
            be = [long_k - deb]
        else:
            label = "Call debit"
            max_loss = deb * mult
            max_profit = (wing - deb) * mult
            long_k = min(lg.strike for lg in legs if lg.qty > 0)
            be = [long_k + deb]

    return Package(
        legs=tuple(legs),
        spot=spot_x,  # market ATM — yellow spot line stays put
        body=body,  # structure center (spot + body_offset)
        wing=wing,
        credit=deb,  # debit premium (compat field name)
        multiplier=100,  # per contract; qty already includes positions
        max_profit=max_profit,
        max_loss=max_loss,
        breakevens=tuple(be),
        label=label,
    )
