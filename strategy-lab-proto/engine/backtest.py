"""Basic 0DTE structure backtest using Massive daily option bars.

Limitations (documented in UI):
- Entry priced from option **day open** (not exact 14:30 minute chain).
- Settlement from option **day close** / natural 0DTE decay path on daily bars.
- Wing selection: OTM shorts by strike steps near short_delta proxy (~width from spot).
- API rate: caches aggressively; window should stay modest (e.g. 30–60 calendar days).

This is a Design-stage prototype for process UX + Massive connectivity — not
institutional fill fidelity.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from engine.massive_ext import FOMC_DATES, MassiveLabClient
from engine.spec import StrategySpec


@dataclass
class TradeRow:
    day: str
    structure: str
    legs: dict[str, Any]
    credit: float
    pnl: float
    exit_reason: str
    max_loss: float
    spot_open: float
    spot_close: float
    commissions: float = 0.0
    fees: float = 0.0
    pnl_before_costs: float = 0.0


@dataclass
class BacktestResult:
    spec_name: str
    start: str
    end: str
    trades: list[TradeRow] = field(default_factory=list)
    skips: list[dict[str, str]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def metrics(self) -> dict[str, Any]:
        pnls = [t.pnl for t in self.trades]
        n = len(pnls)
        wins = sum(1 for p in pnls if p > 0)
        losses = sum(1 for p in pnls if p < 0)
        total = sum(pnls)
        # equity path
        eq = 0.0
        peak = 0.0
        max_dd = 0.0
        for p in pnls:
            eq += p
            peak = max(peak, eq)
            max_dd = min(max_dd, eq - peak)
        avg = total / n if n else 0.0
        win_rate = wins / n if n else 0.0
        gross_win = sum(p for p in pnls if p > 0)
        gross_loss = abs(sum(p for p in pnls if p < 0))
        pf = (gross_win / gross_loss) if gross_loss > 1e-9 else (999.0 if gross_win > 0 else 0.0)
        # IS / OOS split 70/30 by trade count
        split = max(1, int(n * 0.7)) if n else 0
        is_pnl = sum(pnls[:split]) if n else 0.0
        oos_pnl = sum(pnls[split:]) if n else 0.0
        if n < 8:
            holdout = "too_few_trades"
        elif oos_pnl > 0 and is_pnl > 0:
            holdout = "ok"
        elif oos_pnl > is_pnl * 0.3 and oos_pnl > -abs(is_pnl) * 0.5:
            holdout = "weaker"
        else:
            holdout = "broken"
        return {
            "total_pnl": round(total, 2),
            "max_drawdown": round(max_dd, 2),
            "win_rate": round(win_rate, 4),
            "n_trades": n,
            "n_wins": wins,
            "n_losses": losses,
            "avg_pnl": round(avg, 2),
            "profit_factor": round(pf, 2),
            "is_pnl": round(is_pnl, 2),
            "oos_pnl": round(oos_pnl, 2),
            "holdout": holdout,
            "n_skips": len(self.skips),
        }

    def verdict(self) -> str:
        m = self.metrics()
        n = m["n_trades"]
        h = m["holdout"]
        if n == 0:
            return "No trades — kill or widen rules / date window."
        if h == "too_few_trades":
            return f"Only {n} trades — sample too small. Keep designing or extend window."
        if h == "broken":
            return "Train looked different from holdout — holdout is weak. Kill or redesign."
        if h == "weaker":
            return "Holdout still alive but weaker than train. Keep testing carefully."
        if m["total_pnl"] > 0 and m["max_drawdown"] > -m["total_pnl"]:
            return "Holdout OK and total P/L positive — candidate for Curation (still not a promise)."
        return "Mixed results — keep designing or kill with a written reason."


def _round_strike(spot: float, symbol: str) -> float:
    from engine.universe import round_strike

    return round_strike(spot, symbol)


def _atm_body(spot: float, symbol: str) -> float:
    return _round_strike(spot, symbol)


def _r2r(debit: float, wing: float) -> float | None:
    """Reward-to-risk = max_profit / max_loss for defined-risk debit structures.

    max_loss = debit (per share). max_profit ≈ wing − debit.
    R2R = (wing − debit) / debit. Fat reward vs small debit → high R2R.
    """
    d = float(debit)
    risk = d  # max loss is the debit paid
    reward = float(wing) - d
    if risk <= 1e-9 or reward < 0:
        return None
    return reward / risk


def _r2r_rule(spec: StrategySpec) -> str:
    r = getattr(spec, "r2r_rule", None) or "nearest"
    return r if r in ("nearest", "minimum") else "nearest"


def _body_side(spec: StrategySpec) -> str:
    s = getattr(spec, "body_side", None) or "both"
    return s if s in ("below", "above", "both") else "both"


def _run_units(spec: StrategySpec) -> list[str]:
    """What to simulate this day: ic | fly | put | call.

    Body side is required: below | above | both. No empty choice.
    Long-only: long_condor / long_butterfly / put_debit / call_debit
    (legacy short keys normalized via spec.structure + normalize_structure).
    """
    from engine.spec import normalize_structure

    side = _body_side(spec)
    st = normalize_structure(spec.structure)
    if st == "put_debit":
        return ["put"]
    if st == "call_debit":
        return ["call"]
    if st == "long_butterfly":
        # Classic +1/−2/+1 fly; direction picks put vs call (handled in sim)
        return ["fly"]
    if st == "long_condor":
        if side == "below":
            return ["put"]
        if side == "above":
            return ["call"]
        return ["ic"]  # single 4-leg long condor
    return ["put"]


def _better_r2r_candidate(
    *,
    rule: str,
    target: float,
    r: float,
    best: tuple | None,
    payload: tuple,
) -> tuple | None:
    """best is (sort_key, ...) where lower sort_key wins for nearest; for minimum
    we keep candidates with r>=target and prefer higher r (then closer to target).
    payload is the full best tuple starting with sort key.
    """
    if rule == "minimum":
        if r + 1e-12 < target:
            return best
        # Prefer higher R2R, then closer to target
        sort_key = (-r, abs(r - target))
        cand = (sort_key,) + payload
        if best is None or sort_key < best[0]:
            return cand
        return best
    # nearest
    sort_key = (abs(r - target),)
    cand = (sort_key,) + payload
    if best is None or sort_key < best[0]:
        return cand
    return best


def _vertical_debit_open(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    long_k: float,
    short_k: float,
    right: str,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
) -> tuple[float, str, str, dict[str, Any], dict[str, Any]] | None:
    """Return (debit_after_slip, long_ticker, short_ticker, long_bar, short_bar).

    Debit vertical: buy long_k, sell short_k (same right).
    """
    lc = _find_contract(contracts, strike=long_k, right=right)
    sc = _find_contract(contracts, strike=short_k, right=right)
    if not sc or not lc:
        return None
    lt, st = _ticker_of(lc), _ticker_of(sc)
    if not st or not lt:
        return None
    lb = _option_bar(client, lt, day, fill_hhmm, role="entry")
    sb = _option_bar(client, st, day, fill_hhmm, role="entry")
    if not sb or not lb:
        return None
    long_mid = _mid_from_bar(lb, open_side=True)
    short_mid = _mid_from_bar(sb, open_side=True)
    # Buy long (pay mid+slip), sell short (receive mid−slip)
    debit = max(
        0.0,
        (long_mid + spec.slip_open) - (short_mid - spec.slip_open),
    )
    return debit, lt, st, lb, sb


# Back-compat alias used by older call sites
def _vertical_credit_open(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    short_k: float,
    long_k: float,
    right: str,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
) -> tuple[float, str, str, dict[str, Any], dict[str, Any]] | None:
    """Legacy name: debit open with long_k/short_k swapped from credit naming.

    Credit args were (short_k, long_k); debit is buy former-short, sell former-long.
    """
    return _vertical_debit_open(
        client,
        contracts,
        day,
        long_k=short_k,  # buy the inner (was short on credit)
        short_k=long_k,  # sell the outer (was long on credit)
        right=right,
        spec=spec,
        fill_hhmm=fill_hhmm,
    )


def _pick_vertical_strikes(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    spot: float,
    wing: float,
    side: str,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
    max_otm_steps: int = 8,
) -> tuple[float, float, float | None]:
    """Return (long_k, short_k, matched_r2r) for a debit vertical.

    Put debit: long higher put (body), short lower (body − wing).
    Call debit: long lower call (body), short higher (body + wing).
    Pro OTM: scan OTM long strikes (fixed wing) with R2R nearest/minimum.
    """
    from engine.universe import snap_wing_width, strike_increment

    symbol = spec.underlying
    wing = snap_wing_width(symbol, wing)
    body = _atm_body(spot, symbol)
    inc = strike_increment(symbol)
    right = "put" if side == "put" else "call"
    mode = (
        spec.normalized_strike_mode()
        if hasattr(spec, "normalized_strike_mode")
        else ("otm" if spec.strike_mode in ("otm", "otm_r2r") else "atm")
    )

    target = float(spec.target_r2r)
    rule = _r2r_rule(spec)

    def atm_pair() -> tuple[float, float]:
        long_k = body
        short_k = (
            _round_strike(body - wing, symbol)
            if side == "put"
            else _round_strike(body + wing, symbol)
        )
        return long_k, short_k

    if mode == "atm":
        long_k, short_k = atm_pair()
        if rule != "minimum":
            return long_k, short_k, None
        priced = _vertical_debit_open(
            client,
            contracts,
            day,
            long_k,
            short_k,
            right,
            spec,
            fill_hhmm=fill_hhmm,
        )
        if not priced:
            return long_k, short_k, None
        r = _r2r(priced[0], wing)
        if r is None or r + 1e-12 < target:
            return long_k, short_k, -1.0
        return long_k, short_k, r

    best: tuple | None = None
    for step in range(1, max_otm_steps + 1):
        if side == "put":
            long_k = _round_strike(body - step * inc, symbol)
            short_k = _round_strike(long_k - wing, symbol)
            if long_k >= body:
                continue
        else:
            long_k = _round_strike(body + step * inc, symbol)
            short_k = _round_strike(long_k + wing, symbol)
            if long_k <= body:
                continue
        priced = _vertical_debit_open(
            client,
            contracts,
            day,
            long_k,
            short_k,
            right,
            spec,
            fill_hhmm=fill_hhmm,
        )
        if not priced:
            continue
        debit = priced[0]
        r = _r2r(debit, wing)
        if r is None:
            continue
        best = _better_r2r_candidate(
            rule=rule, target=target, r=r, best=best, payload=(long_k, short_k, r)
        )
    if best is None:
        if rule == "minimum":
            return atm_pair()[0], atm_pair()[1], -1.0
        long_k, short_k = atm_pair()
        return long_k, short_k, None
    return best[1], best[2], best[3]


def _pick_iron_condor_strikes(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    spot: float,
    wing: float,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
    max_otm_steps: int = 8,
) -> tuple[float, float, float, float, float | None]:
    """put_long, put_short, call_long, call_short, matched_r2r (long condor / fly).

    Long: buy inners (put_long / call_long), sell outers (put_short / call_short).
    Naming kept so sims can map tickers consistently.
    """
    from engine.universe import snap_wing_width, strike_increment

    symbol = spec.underlying
    wing = snap_wing_width(symbol, wing)
    body = _atm_body(spot, symbol)
    mode = (
        spec.normalized_strike_mode()
        if hasattr(spec, "normalized_strike_mode")
        else ("otm" if spec.strike_mode in ("otm", "otm_r2r") else "atm")
    )
    target = float(spec.target_r2r)
    rule = _r2r_rule(spec)
    inc = strike_increment(symbol)

    def atm_ic() -> tuple[float, float, float, float]:
        # put_long, put_outer, call_long, call_outer
        return (
            body,
            _round_strike(body - wing, symbol),
            body,
            _round_strike(body + wing, symbol),
        )

    if mode == "atm":
        pl, po, cl, co = atm_ic()
        if rule != "minimum":
            return pl, po, cl, co, None
        put = _vertical_debit_open(
            client, contracts, day, pl, po, "put", spec, fill_hhmm=fill_hhmm
        )
        call = _vertical_debit_open(
            client, contracts, day, cl, co, "call", spec, fill_hhmm=fill_hhmm
        )
        if not put or not call:
            return pl, po, cl, co, -1.0
        r = _r2r(put[0] + call[0], wing)
        if r is None or r + 1e-12 < target:
            return pl, po, cl, co, -1.0
        return pl, po, cl, co, r

    # OTM long condor: same OTM step both sides
    best: tuple | None = None
    for step in range(1, max_otm_steps + 1):
        pl = _round_strike(body - step * inc, symbol)
        po = _round_strike(pl - wing, symbol)
        cl = _round_strike(body + step * inc, symbol)
        co = _round_strike(cl + wing, symbol)
        put = _vertical_debit_open(
            client, contracts, day, pl, po, "put", spec, fill_hhmm=fill_hhmm
        )
        call = _vertical_debit_open(
            client, contracts, day, cl, co, "call", spec, fill_hhmm=fill_hhmm
        )
        if not put or not call:
            continue
        debit = put[0] + call[0]
        r = _r2r(debit, wing)
        if r is None:
            continue
        best = _better_r2r_candidate(
            rule=rule, target=target, r=r, best=best, payload=(pl, po, cl, co, r)
        )
    if best is None:
        pl, po, cl, co = atm_ic()
        if rule == "minimum":
            return pl, po, cl, co, -1.0
        return pl, po, cl, co, None
    return best[1], best[2], best[3], best[4], best[5]


def _find_contract(
    contracts: list[dict[str, Any]],
    *,
    strike: float,
    right: str,
) -> dict[str, Any] | None:
    right = right.lower()
    best = None
    best_diff = 1e18
    for c in contracts:
        ct = (c.get("contract_type") or c.get("type") or "").lower()
        if ct not in (right, right[:1]):
            # call/put
            if right.startswith("c") and "call" not in ct:
                continue
            if right.startswith("p") and "put" not in ct:
                continue
        try:
            k = float(c.get("strike_price") or c.get("strike") or 0)
        except (TypeError, ValueError):
            continue
        diff = abs(k - strike)
        if diff < best_diff:
            best_diff = diff
            best = c
    if best is None or best_diff > 1.01:
        return None
    return best


def _ticker_of(c: dict[str, Any]) -> str:
    return str(c.get("ticker") or c.get("details", {}).get("ticker") or "")


def _mid_from_bar(bar: dict[str, Any], *, open_side: bool) -> float:
    if not bar:
        return 0.0
    if bar.get("fill"):
        return float(bar["fill"])
    o, c = float(bar.get("o") or 0), float(bar.get("c") or 0)
    if open_side:
        return o if o > 0 else c
    return c if c > 0 else o


def _option_bar(
    client: MassiveLabClient,
    ticker: str,
    day: str,
    hhmm_et: str,
    *,
    role: str,
) -> dict[str, Any] | None:
    """Entry: minute at session clock. Exit: minute at closing / day close."""
    if role == "entry":
        b = client.option_fill_bar(ticker, day, hhmm_et)
        if b:
            return b
        # No silent open fantasy for afternoon/closing — prefer skip via None
        # Morning-only soft fallback: day open labeled
        from engine.sessions import get_session

        # try day bar as last resort only if morning session
        h = int(hhmm_et.split(":")[0])
        dayb = client.option_day_bar(ticker, day)
        if dayb and h < 12:
            dayb = dict(dayb)
            dayb["fill"] = float(dayb.get("o") or dayb.get("c") or 0)
            dayb["source"] = "day_open_fallback"
            return dayb if dayb["fill"] > 0 else None
        if dayb and h >= 15:
            dayb = dict(dayb)
            dayb["fill"] = float(dayb.get("c") or dayb.get("o") or 0)
            dayb["source"] = "day_close_fallback"
            return dayb if dayb["fill"] > 0 else None
        if dayb:
            dayb = dict(dayb)
            o, c = float(dayb.get("o") or 0), float(dayb.get("c") or 0)
            dayb["fill"] = (o + c) / 2 if o and c else (c or o)
            dayb["source"] = "day_mid_fallback"
            return dayb if dayb["fill"] > 0 else None
        return None
    # exit
    b = client.option_fill_bar(ticker, day, hhmm_et)
    if b:
        return b
    dayb = client.option_day_bar(ticker, day)
    if dayb:
        dayb = dict(dayb)
        dayb["fill"] = float(dayb.get("c") or dayb.get("o") or 0)
        dayb["source"] = "day_close_fallback"
        return dayb if dayb["fill"] > 0 else None
    return None


def _credit_with_slip(mid: float, slip: float, *, sell: bool) -> float:
    """Adverse slip: selling → lower credit; buying → higher debit."""
    if sell:
        return max(0.0, mid - slip)
    return mid + slip


def _evaluate_exit(
    spec: StrategySpec,
    *,
    credit: float,
    debit_close: float,
    wing: float,
) -> tuple[str, float]:
    """Return (exit_reason, pnl_per_share) before contracts multiplier.

    Debit structures: ``credit`` arg is **open debit paid**; ``debit_close`` is
    **credit received on close** (sell the package). P/L = close_credit − open_debit.

    Take-profit:
    - **% of max profit** (basis debit): target = pct% × (wing − open_debit)
    - **% of risk**: target = pct% × open_debit (max loss = debit paid)
    """
    open_debit = max(0.0, float(credit))
    close_credit = max(0.0, float(debit_close))
    realized = close_credit - open_debit

    if spec.normalized_exit_mode() == "take_profit" and open_debit > 0:
        pct, basis = spec.take_profit_settings()
        frac = max(0.0, min(1.0, pct / 100.0))
        if basis == "risk":
            max_loss = open_debit
            target_profit = frac * max_loss
            if realized + 1e-12 >= target_profit:
                return "take_profit_risk", realized
        else:
            # % of max profit
            max_profit = max(0.0, float(wing) - open_debit)
            target_profit = frac * max_profit
            if realized + 1e-12 >= target_profit:
                return "take_profit_debit", realized

    return "expiry_close", realized


def run_backtest(
    client: MassiveLabClient,
    spec: StrategySpec,
    *,
    start: str,
    end: str,
    max_days: int = 40,
) -> BacktestResult:
    result = BacktestResult(spec_name=spec.name, start=start, end=end)

    # Precept: never run absolute fantasy Specs
    honesty = spec.honesty_errors()
    if honesty:
        for e in honesty:
            result.errors.append(f"Honesty block: {e}")
        return result

    from engine.sessions import get_session
    from engine.universe import resolve

    sess = get_session(getattr(spec, "entry_session", None) or "afternoon")
    fill_hhmm = sess.fill_et
    dte = int(getattr(spec, "dte", 0) or 0)

    result.notes.append(
        f"HONEST SCOPE: entry fill @ {sess.label} ~{fill_hhmm} ET "
        f"(mode={getattr(spec, 'entry_fill', 'session_time')}); "
        f"prefer Massive 1-minute bars; day-bar fallback labeled. "
        f"DTE={dte} (0=same day expiry, 1=next session expiry)."
    )
    und = resolve(spec.underlying)
    bar_ticker = und.bar_ticker if und else spec.underlying
    opt_under = und.options_underlying if und else spec.underlying

    result.notes.append(
        f"Underlying={spec.underlying} bars={bar_ticker} options={opt_under} "
        f"structure={spec.structure} wings=${spec.wing_width:g} "
        f"strikes={getattr(spec, 'normalized_strike_mode', lambda: spec.strike_mode)()} "
        f"direction={getattr(spec, 'body_side', 'both')}"
        + (
            f" r2r={spec.target_r2r:g}/{getattr(spec, 'r2r_rule', 'nearest')}"
            if getattr(spec, "normalized_strike_mode", lambda: "atm")() == "otm"
            or getattr(spec, "r2r_rule", "") == "minimum"
            else ""
        )
    )
    result.notes.append(
        f"Friction: open/close slippage ${spec.slip_open:.2f}/${spec.slip_close:.2f} vs mid; "
        f"commission ${spec.commission_per_contract:.2f}/contract/side; "
        f"fees ${spec.fees_per_contract:.2f}/contract/side "
        f"(~${spec.friction_dollars_round_turn():.2f} round-turn at {spec.n_legs()} legs × "
        f"{spec.contracts} position(s))."
    )

    try:
        bars = client.stock_daily_bars(bar_ticker, start, end)
    except Exception as exc:  # noqa: BLE001 — surface to UI
        result.errors.append(f"Failed to load underlying bars ({bar_ticker}): {exc}")
        return result

    if not bars:
        result.errors.append("No underlying bars in range — check symbol, plan access, and dates.")
        return result

    # Limit API load
    bars = bars[-max_days:]
    session_dates = [b["date"] for b in bars]
    result.notes.append(
        f"Using last {len(bars)} sessions (max_days={max_days}); "
        f"entry session={sess.key} fill~{fill_hhmm} ET; dte={dte}."
    )

    from engine.sessions import (
        condition_passes_open_move,
        expiration_for_entry,
        should_enter,
    )

    exit_hhmm = "15:45"  # closing session proxy for exits

    for idx, bar in enumerate(bars):
        day = bar["date"]
        spot_o, spot_c = bar["o"], bar["c"]
        if spot_o <= 0:
            result.skips.append({"day": day, "reason": "bad_underlying_open"})
            continue

        if spec.skip_fomc and day in FOMC_DATES:
            result.skips.append({"day": day, "reason": "fomc"})
            continue

        prior_c = bars[idx - 1]["c"] if idx > 0 else None
        cond_ok, cond_reason = condition_passes_open_move(
            open_move_max_pct=spec.open_move_max_pct,
            spot_open=spot_o,
            prior_close=prior_c,
        )
        enter_ok, enter_reason = should_enter(
            fill_mode=getattr(spec, "entry_fill", None) or "session_time",
            condition_ok=cond_ok,
            condition_reason=cond_reason,
        )
        if not enter_ok:
            result.skips.append({"day": day, "reason": enter_reason or "no_entry"})
            continue

        # Spot at session fill time (minute preferred)
        spot_entry, spot_src = client.underlying_fill_price(
            bar_ticker, day, fill_hhmm, daily=bar
        )
        if spot_entry <= 0:
            result.skips.append({"day": day, "reason": "no_spot_at_session"})
            continue

        expiry = expiration_for_entry(day, dte, session_dates)
        if not expiry:
            result.skips.append({"day": day, "reason": "no_expiry_1dte"})
            continue

        try:
            contracts = client.list_option_contracts(
                opt_under,
                expiration_date=expiry,
                expired=True,
            )
        except Exception as exc:  # noqa: BLE001
            result.skips.append({"day": day, "reason": f"contracts_error:{exc}"[:80]})
            continue

        if not contracts:
            try:
                contracts = client.list_option_contracts(
                    opt_under,
                    expiration_date=expiry,
                    expired=False,
                )
            except Exception:
                contracts = []
        if not contracts:
            result.skips.append({"day": day, "reason": "no_contracts"})
            continue

        wing = float(spec.wing_width)
        mult = 100 * int(spec.contracts)
        # Exit on expiry day (0DTE: same day; 1DTE: next session)
        expiry_daily = bar if expiry == day else next(
            (b for b in bars if b["date"] == expiry), None
        )
        spot_exit = float((expiry_daily or bar).get("c") or spot_c)

        units = _run_units(spec)
        any_trade = False
        for unit in units:
            try:
                if unit == "ic":
                    trade = _sim_iron_condor(
                        client,
                        contracts,
                        day,
                        spot_entry,
                        spot_exit,
                        wing,
                        mult,
                        spec,
                        fill_hhmm=fill_hhmm,
                        exit_day=expiry,
                        exit_hhmm=exit_hhmm,
                        spot_src=spot_src,
                    )
                elif unit == "fly":
                    trade = _sim_iron_butterfly(
                        client,
                        contracts,
                        day,
                        spot_entry,
                        spot_exit,
                        wing,
                        mult,
                        spec,
                        fill_hhmm=fill_hhmm,
                        exit_day=expiry,
                        exit_hhmm=exit_hhmm,
                        spot_src=spot_src,
                    )
                elif unit in ("put", "call"):
                    trade = _sim_vertical(
                        client,
                        contracts,
                        day,
                        spot_entry,
                        spot_exit,
                        wing,
                        mult,
                        spec,
                        side=unit,
                        fill_hhmm=fill_hhmm,
                        exit_day=expiry,
                        exit_hhmm=exit_hhmm,
                        spot_src=spot_src,
                    )
                else:
                    result.skips.append({"day": day, "reason": f"unknown_unit:{unit}"})
                    continue
            except Exception as exc:  # noqa: BLE001
                result.skips.append({"day": day, "reason": f"sim_error:{exc}"[:80]})
                continue

            if trade is None:
                result.skips.append(
                    {"day": day, "reason": f"legs_unavailable_{unit}"}
                )
                continue

            trade.legs = dict(trade.legs or {})
            trade.legs["body_side"] = _body_side(spec)
            trade.legs["unit"] = unit
            result.trades.append(_apply_trading_costs(trade, spec))
            any_trade = True

        if not any_trade and not any(
            s.get("day") == day for s in result.skips[-5:]
        ):
            result.skips.append({"day": day, "reason": "no_qualifying_side"})

    return result


def _apply_trading_costs(trade: TradeRow, spec: StrategySpec) -> TradeRow:
    """Subtract commissions + fees (open and close) from trade P/L.

    Counted per option contract per side. Legs inferred from structure.
    """
    legs = spec.n_legs()
    n = legs * int(spec.contracts)
    commission = 2.0 * n * float(spec.commission_per_contract)  # open + close
    fees = 2.0 * n * float(spec.fees_per_contract)
    before = trade.pnl
    trade.pnl_before_costs = round(before, 2)
    trade.commissions = round(commission, 2)
    trade.fees = round(fees, 2)
    trade.pnl = round(before - commission - fees, 2)
    return trade


def _sim_vertical(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    spot_entry: float,
    spot_exit: float,
    wing: float,
    mult: int,
    spec: StrategySpec,
    *,
    side: str,
    fill_hhmm: str,
    exit_day: str,
    exit_hhmm: str,
    spot_src: str = "minute",
) -> TradeRow | None:
    """Long debit vertical: buy long_k, sell short_k."""
    from engine.universe import snap_wing_width
    from engine.spec import normalize_structure

    wing = snap_wing_width(spec.underlying, wing)
    long_k, short_k, matched_r2r = _pick_vertical_strikes(
        client, contracts, day, spot_entry, wing, side, spec, fill_hhmm=fill_hhmm
    )
    if matched_r2r is not None and matched_r2r < 0:
        return None  # min R2R not met
    right = "put" if side == "put" else "call"
    priced = _vertical_debit_open(
        client,
        contracts,
        day,
        long_k,
        short_k,
        right,
        spec,
        fill_hhmm=fill_hhmm,
    )
    if not priced:
        return None
    open_debit, lt, st, _, _ = priced
    lb = _option_bar(client, lt, exit_day, exit_hhmm, role="exit")
    sb = _option_bar(client, st, exit_day, exit_hhmm, role="exit")
    if not sb or not lb:
        return None

    long_close = _mid_from_bar(lb, open_side=False)
    short_close = _mid_from_bar(sb, open_side=False)
    # Close debit package: sell long (receive mid−slip), buy short (pay mid+slip)
    close_credit = max(
        0.0,
        (long_close - spec.slip_close) - (short_close + spec.slip_close),
    )

    reason, pnl_share = _evaluate_exit(
        spec, credit=open_debit, debit_close=close_credit, wing=wing
    )
    pnl = pnl_share * mult
    max_loss = open_debit * mult  # max risk = debit paid
    st_name = normalize_structure(spec.structure)
    if st_name not in ("put_debit", "call_debit"):
        st_name = "put_debit" if side == "put" else "call_debit"
    return TradeRow(
        day=day,
        structure=st_name,
        legs={
            "long": lt,
            "short": st,
            "long_k": long_k,
            "short_k": short_k,
            "strike_mode": spec.strike_mode,
            "matched_r2r": matched_r2r,
            "entry_fill_et": fill_hhmm,
            "exit_day": exit_day,
            "spot_src": spot_src,
            "dte": getattr(spec, "dte", 0),
        },
        credit=round(open_debit, 4),  # stores open debit premium
        pnl=round(pnl, 2),
        exit_reason=reason,
        max_loss=round(max_loss, 2),
        spot_open=spot_entry,
        spot_close=spot_exit,
        pnl_before_costs=round(pnl, 2),
    )


def _sim_iron_butterfly(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    spot_entry: float,
    spot_exit: float,
    wing: float,
    mult: int,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
    exit_day: str,
    exit_hhmm: str,
    spot_src: str = "minute",
) -> TradeRow | None:
    """Long butterfly: classic +1/−2/+1 all-call or all-put (debit).

    Direction: below → puts; above/both → calls.
    """
    from engine.universe import snap_wing_width, strike_increment

    wing = snap_wing_width(spec.underlying, wing)
    symbol = spec.underlying
    body = _atm_body(spot_entry, symbol)
    inc = strike_increment(symbol)
    side = _body_side(spec)
    right = "put" if side == "below" else "call"
    mode = (
        spec.normalized_strike_mode()
        if hasattr(spec, "normalized_strike_mode")
        else "atm"
    )
    if mode == "otm":
        step = max(inc if inc > 0 else 1.0, min(wing * 2, body * 0.02))
        if side == "below":
            body = _round_strike(body - step, symbol)
        elif side == "above":
            body = _round_strike(body + step, symbol)

    k_low = _round_strike(body - wing, symbol)
    k_mid = _round_strike(body, symbol)
    k_high = _round_strike(body + wing, symbol)

    legs_c = {
        "lo": _find_contract(contracts, strike=k_low, right=right),
        "mid": _find_contract(contracts, strike=k_mid, right=right),
        "hi": _find_contract(contracts, strike=k_high, right=right),
    }
    if not all(legs_c.values()):
        return None
    tickers = {k: _ticker_of(v) for k, v in legs_c.items()}  # type: ignore[arg-type]
    if not all(tickers.values()):
        return None
    entry_bars = {
        k: _option_bar(client, t, day, fill_hhmm, role="entry") for k, t in tickers.items()
    }
    exit_bars = {
        k: _option_bar(client, t, exit_day, exit_hhmm, role="exit")
        for k, t in tickers.items()
    }
    if not all(entry_bars.values()) or not all(exit_bars.values()):
        return None

    def open_px(k: str, sell: bool) -> float:
        mid = _mid_from_bar(entry_bars[k], open_side=True)  # type: ignore[arg-type]
        return mid - spec.slip_open if sell else mid + spec.slip_open

    def close_px(k: str, buy_to_close: bool) -> float:
        mid = _mid_from_bar(exit_bars[k], open_side=False)  # type: ignore[arg-type]
        return mid + spec.slip_close if buy_to_close else mid - spec.slip_close

    # Open debit: buy 1 low + buy 1 high − sell 2 mid
    open_debit = (
        open_px("lo", False)
        + open_px("hi", False)
        - 2.0 * open_px("mid", True)
    )
    open_debit = max(0.0, open_debit)
    # Close: sell 1 low + sell 1 high − buy 2 mid
    close_credit = (
        close_px("lo", False)
        + close_px("hi", False)
        - 2.0 * close_px("mid", True)
    )
    close_credit = max(0.0, close_credit)

    # Optional min R2R filter
    matched_r2r = _r2r(open_debit, wing)
    rule = _r2r_rule(spec)
    target = float(spec.target_r2r)
    if rule == "minimum" and (
        matched_r2r is None or matched_r2r + 1e-12 < target
    ):
        return None

    reason, pnl_share = _evaluate_exit(
        spec, credit=open_debit, debit_close=close_credit, wing=wing
    )
    pnl = pnl_share * mult
    max_loss = open_debit * mult

    return TradeRow(
        day=day,
        structure="long_butterfly",
        legs={
            "tickers": tickers,
            "strikes": {
                "low": k_low,
                "mid": k_mid,
                "high": k_high,
            },
            "right": right,
            "qty": {"low": 1, "mid": -2, "high": 1},
            "strike_mode": spec.strike_mode,
            "matched_r2r": matched_r2r,
            "entry_fill_et": fill_hhmm,
            "exit_day": exit_day,
            "spot_src": spot_src,
            "dte": getattr(spec, "dte", 0),
        },
        credit=round(open_debit, 4),
        pnl=round(pnl, 2),
        exit_reason=reason,
        max_loss=round(max_loss, 2),
        spot_open=spot_entry,
        spot_close=spot_exit,
        pnl_before_costs=round(pnl, 2),
    )


def _sim_iron_condor(
    client: MassiveLabClient,
    contracts: list[dict[str, Any]],
    day: str,
    spot_entry: float,
    spot_exit: float,
    wing: float,
    mult: int,
    spec: StrategySpec,
    *,
    fill_hhmm: str,
    exit_day: str,
    exit_hhmm: str,
    spot_src: str = "minute",
) -> TradeRow | None:
    """Long condor: long inners, short outers (debit)."""
    from engine.universe import snap_wing_width

    wing = snap_wing_width(spec.underlying, wing)
    pl, po, cl, co, matched_r2r = _pick_iron_condor_strikes(
        client, contracts, day, spot_entry, wing, spec, fill_hhmm=fill_hhmm
    )
    if matched_r2r is not None and matched_r2r < 0:
        return None
    legs_c = {
        "lp": _find_contract(contracts, strike=pl, right="put"),
        "sp": _find_contract(contracts, strike=po, right="put"),
        "lc": _find_contract(contracts, strike=cl, right="call"),
        "sc": _find_contract(contracts, strike=co, right="call"),
    }
    if not all(legs_c.values()):
        return None
    tickers = {k: _ticker_of(v) for k, v in legs_c.items()}  # type: ignore[arg-type]
    if not all(tickers.values()):
        return None
    entry_bars = {
        k: _option_bar(client, t, day, fill_hhmm, role="entry") for k, t in tickers.items()
    }
    exit_bars = {
        k: _option_bar(client, t, exit_day, exit_hhmm, role="exit")
        for k, t in tickers.items()
    }
    if not all(entry_bars.values()) or not all(exit_bars.values()):
        return None

    def open_px(k: str, sell: bool) -> float:
        mid = _mid_from_bar(entry_bars[k], open_side=True)  # type: ignore[arg-type]
        return mid - spec.slip_open if sell else mid + spec.slip_open

    def close_px(k: str, buy_to_close: bool) -> float:
        mid = _mid_from_bar(exit_bars[k], open_side=False)  # type: ignore[arg-type]
        return mid + spec.slip_close if buy_to_close else mid - spec.slip_close

    open_debit = (
        open_px("lp", False)
        - open_px("sp", True)
        + open_px("lc", False)
        - open_px("sc", True)
    )
    open_debit = max(0.0, open_debit)
    close_credit = (
        close_px("lp", False)
        - close_px("sp", True)
        + close_px("lc", False)
        - close_px("sc", True)
    )
    close_credit = max(0.0, close_credit)

    reason, pnl_share = _evaluate_exit(
        spec, credit=open_debit, debit_close=close_credit, wing=wing
    )
    pnl = pnl_share * mult
    max_loss = open_debit * mult

    return TradeRow(
        day=day,
        structure="long_condor",
        legs={
            "tickers": tickers,
            "strikes": {
                "put_long": pl,
                "put_short": po,
                "call_long": cl,
                "call_short": co,
            },
            "strike_mode": spec.strike_mode,
            "matched_r2r": matched_r2r,
            "entry_fill_et": fill_hhmm,
            "exit_day": exit_day,
            "spot_src": spot_src,
            "dte": getattr(spec, "dte", 0),
        },
        credit=round(open_debit, 4),
        pnl=round(pnl, 2),
        exit_reason=reason,
        max_loss=round(max_loss, 2),
        spot_open=spot_entry,
        spot_close=spot_exit,
        pnl_before_costs=round(pnl, 2),
    )
