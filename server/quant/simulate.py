"""Monte Carlo over FILLS on the archived path (ATRV v0.8 §3.7–3.10).

The price path is not random — it happened, it is in the store. Execution
is: did each leg fill, and where in the spread. So paths are drawn over fill
events, not timesteps, and the distribution is the object. There is no
endpoint that returns "the" P&L (AT-ATRV-19).

Every fill is taxed (AT-ATRV-15): friction (spread crossed + fees) and
probability (did it fill). Era-1 carries no depth, so the probability
component is `unfitted_pessimistic` and the response says so, with
`fidelity: era1_no_depth` (AT-ATRV-29).

Reproducibility: each path's random stream is a pure function of
(seed, strategy_id, path_index) — never a shared RNG, never thread-derived
(AT-ATRV-23). Every reduction is order-free (sorted arrays, integer counts),
so the result is byte-identical at any core count (QLAB §5.1).

Banned from the default payload: mean, Sharpe, win rate, single-path
drawdown, any featured single quantile, standard error (AT-ATRV-24, 30, 21).
"""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass
from typing import Sequence

from quant.store import DayStore

FIDELITY_ERA1 = "era1_no_depth"
FILL_MODEL_UNFITTED = "unfitted_pessimistic"
DISPLAY_LEGAL = ("ecdf", "bands", "modality", "no_fill_rate", "tax",
                 "stability", "fidelity", "assumptions", "n", "seed")
RESEARCHER_ONLY = ("tail_cvar",)
BAND_KEYS = ("p01", "p05", "p10", "p25", "p50", "p75", "p90", "p95", "p99")


class SimulateRefusal(ValueError):
    """A named refusal, not a distribution. Never a default."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}: {detail}")
        self.code, self.detail = code, detail


@dataclass(frozen=True)
class Leg:
    c: int          # contract index in the store
    qty: int        # signed; +1 long, -2 short body, etc.


@dataclass(frozen=True)
class Params:
    seed: int
    paths: int
    strategy_id: str
    p_fill: float                 # LABS_QUANT_FILL_P_UNFITTED
    fee_per_contract: float       # LABS_QUANT_FEE_PER_CONTRACT, dollars
    latency_snapshots: int = 1    # act no earlier than observed + latency (§3.6)
    multiplier: int = 100


def path_rng(seed: int, strategy_id: str, path_index: int) -> random.Random:
    h = hashlib.sha256(f"{seed}|{strategy_id}|{path_index}".encode()).digest()
    return random.Random(int.from_bytes(h[:8], "big"))


# ---------------------------------------------------------------- quotes

def _quote(st: DayStore, c: int, t: int) -> tuple[float, float | None, float | None] | None:
    """(mid, bid, ask) in price units, or None if the leg is absent/unpriced."""
    if not st.present(c, t):
        return None
    m = st.value("mid", c, t)
    if m is None:
        return None
    b = st.value("bid", c, t); a = st.value("ask", c, t)
    sc = st.scale("mid")
    return (m / sc, None if b is None else b / sc, None if a is None else a / sc)


def _half_spread(q: tuple[float, float | None, float | None]) -> float | None:
    m, b, a = q
    if b is not None and a is not None:
        return max((a - b) / 2.0, 0.0)
    if a is not None:
        return max(a - m, 0.0)
    if b is not None:
        return max(m - b, 0.0)
    return None


# ---------------------------------------------------------------- one path

def _fill(rng: random.Random, q, buying: bool, p_fill: float, *, force: bool):
    """Pessimistic fill: never better than a quarter of the half-spread
    inside the touch, drawn toward the full touch. `force` = cross the full
    spread (exit no-fill treatment)."""
    hs = _half_spread(q)
    if hs is None:
        return None, 0.0
    if not force and rng.random() > p_fill:
        return None, 0.0
    frac = 1.0 if force else 0.5 + 0.5 * rng.random()      # [0.5, 1.0] of half-spread
    friction = frac * hs
    price = q[0] + friction if buying else q[0] - friction
    return price, friction


def simulate_path(st: DayStore, legs: Sequence[Leg], t_in: int, t_out: int,
                  prm: Params, path_index: int) -> dict:
    rng = path_rng(prm.seed, prm.strategy_id, path_index)
    friction = 0.0; fees = 0.0; pnl = 0.0
    entry_nofill = False; exit_nofill = False
    per_leg = []
    for lg in legs:
        q_in = _quote(st, lg.c, t_in); q_out = _quote(st, lg.c, t_out)
        if q_in is None or q_out is None:
            raise SimulateRefusal("LEG_ABSENT_AT_INSTANT",
                                  f"contract {lg.c} unpriced at t={t_in if q_in is None else t_out}")
        buying_in = lg.qty > 0
        p_in, f_in = _fill(rng, q_in, buying_in, prm.p_fill, force=False)
        if p_in is None:
            entry_nofill = True
            per_leg.append({"c": lg.c, "entry": None, "exit": None, "friction": 0.0})
            continue
        p_out, f_out = _fill(rng, q_out, not buying_in, prm.p_fill, force=False)
        if p_out is None:
            exit_nofill = True
            p_out, f_out = _fill(rng, q_out, not buying_in, prm.p_fill, force=True)
        n = abs(lg.qty)
        leg_fric = (f_in + f_out) * n * prm.multiplier
        leg_fee = 2 * n * prm.fee_per_contract
        friction += leg_fric; fees += leg_fee
        pnl += lg.qty * (p_out - p_in) * prm.multiplier
        per_leg.append({"c": lg.c, "entry": p_in, "exit": p_out, "friction": leg_fric})
    if entry_nofill:
        # the trade did not happen. No partial credit, no P&L (§3.7).
        return {"traded": False, "entry_nofill": True, "exit_nofill": False,
                "pnl": None, "friction": 0.0, "fees": 0.0, "per_leg": per_leg}
    return {"traded": True, "entry_nofill": False, "exit_nofill": exit_nofill,
            "pnl": pnl - fees, "friction": friction, "fees": fees, "per_leg": per_leg}


# ---------------------------------------------------------------- shape

def _quantile(sorted_xs: list[float], p: float) -> float:
    if not sorted_xs:
        return float("nan")
    k = (len(sorted_xs) - 1) * p
    lo = int(k); hi = min(lo + 1, len(sorted_xs) - 1)
    return sorted_xs[lo] + (sorted_xs[hi] - sorted_xs[lo]) * (k - lo)


def bands_of(sorted_xs: list[float]) -> dict:
    ps = {"p01": .01, "p05": .05, "p10": .10, "p25": .25, "p50": .50,
          "p75": .75, "p90": .90, "p95": .95, "p99": .99}
    return {k: _quantile(sorted_xs, p) for k, p in ps.items()}


def modality_of(sorted_xs: list[float], bins: int = 24) -> dict:
    """Count modes on a smoothed histogram. Reported, never assumed unimodal
    (AT-ATRV-24). A 0DTE fly is bimodal as the normal case."""
    if len(sorted_xs) < 10:
        return {"n_modes": None, "modes": [], "valleys": [], "note": "too few paths"}
    lo, hi = sorted_xs[0], sorted_xs[-1]
    if hi <= lo:
        return {"n_modes": 1, "modes": [lo], "valleys": []}
    w = (hi - lo) / bins
    h = [0] * bins
    for x in sorted_xs:
        i = min(int((x - lo) / w), bins - 1); h[i] += 1
    sm = [(h[max(i-1, 0)] + h[i] + h[min(i+1, bins-1)]) / 3.0 for i in range(bins)]
    peak = max(sm); thresh = 0.10 * peak
    modes, valleys = [], []
    for i in range(bins):
        l = sm[i-1] if i > 0 else -1; r = sm[i+1] if i < bins-1 else -1
        if sm[i] >= thresh and sm[i] > l and sm[i] >= r:
            modes.append(lo + (i + 0.5) * w)
    for a, b in zip(modes, modes[1:]):
        ia, ib = int((a - lo) / w), int((b - lo) / w)
        j = min(range(ia, ib + 1), key=lambda k: sm[k])
        valleys.append(lo + (j + 0.5) * w)
    return {"n_modes": len(modes), "modes": modes, "valleys": valleys}


def ecdf_of(sorted_xs: list[float], points: int = 200) -> dict:
    n = len(sorted_xs)
    if n == 0:
        return {"x": [], "F": []}
    idx = sorted({int(i * (n - 1) / max(points - 1, 1)) for i in range(points)})
    return {"x": [sorted_xs[i] for i in idx], "F": [(i + 1) / n for i in idx]}


def stability_of(pnls: list[float], seed: int) -> dict:
    """Was N enough? Recompute the bands on a random half; report the largest
    band movement as a fraction of the full range. Order-free; assumes no
    moment (replaces the standard error, AT-ATRV-21)."""
    if len(pnls) < 20:
        return {"n_half_vs_n": None, "note": "too few paths"}
    rng = random.Random(seed ^ 0x5F3759DF)
    half = sorted(rng.sample(pnls, len(pnls) // 2))
    full = sorted(pnls)
    bf, bh = bands_of(full), bands_of(half)
    rng_ = (full[-1] - full[0]) or 1.0
    worst = max(abs(bf[k] - bh[k]) for k in BAND_KEYS) / rng_
    return {"n_half_vs_n": worst, "enough": worst < 0.05}


# ---------------------------------------------------------------- run

def simulate(st: DayStore, legs: Sequence[Leg], t_entry: int, t_exit: int,
             prm: Params) -> dict:
    if not legs:
        raise SimulateRefusal("NO_LEGS", "a strategy needs at least one leg")
    if prm.paths < 1:
        raise SimulateRefusal("BAD_N", "paths must be >= 1")
    t_in = t_entry + prm.latency_snapshots
    t_out = t_exit + prm.latency_snapshots
    if not (0 <= t_in < t_out < st.T):
        raise SimulateRefusal("BAD_WINDOW",
                              f"entry+latency={t_in}, exit+latency={t_out}, T={st.T}")

    results = [simulate_path(st, legs, t_in, t_out, prm, i) for i in range(prm.paths)]
    traded = [r for r in results if r["traded"]]
    pnls = sorted(r["pnl"] for r in traded)
    n_entry_nf = sum(1 for r in results if r["entry_nofill"])
    n_exit_nf = sum(1 for r in traded if r["exit_nofill"])

    fric = sorted(r["friction"] for r in traded)
    fees = sorted(r["fees"] for r in traded)
    leg_fric = {}
    for r in traded:
        for pl in r["per_leg"]:
            leg_fric.setdefault(pl["c"], []).append(pl["friction"])

    out = {
        "n": prm.paths, "n_traded": len(traded), "seed": prm.seed,
        "strategy_id": prm.strategy_id,
        "t_entry": t_entry, "t_exit": t_exit,
        "t_entry_acted": t_in, "t_exit_acted": t_out,
        "time_entry_ms": st.time_ms(t_in), "time_exit_ms": st.time_ms(t_out),
        "ecdf": ecdf_of(pnls),
        "bands": bands_of(pnls),                       # an ordered SET (AT-ATRV-30)
        "modality": modality_of(pnls),
        "no_fill_rate": {"entry": n_entry_nf / prm.paths,
                         "exit": (n_exit_nf / len(traded)) if traded else None},
        "tax": {
            "friction_bands": bands_of(fric), "fees_bands": bands_of(fees),
            "probability": prm.p_fill,
            "per_leg_friction_bands": {str(c): bands_of(sorted(v)) for c, v in leg_fric.items()},
            "per_side": "entry and exit both taxed; rolls are fills",
        },
        "stability": stability_of(pnls, prm.seed),
        "fidelity": FIDELITY_ERA1,
        "assumptions": {
            "fill_model": FILL_MODEL_UNFITTED, "p_fill": prm.p_fill,
            "fill_placement": "uniform on [0.5, 1.0] of the half-spread, never inside a quarter",
            "exit_no_fill": "cross the full spread, counted in no_fill_rate.exit",
            "entry_no_fill": "no trade, no partial credit, excluded from the distribution",
            "latency_snapshots": prm.latency_snapshots,
            "fee_per_contract": prm.fee_per_contract, "multiplier": prm.multiplier,
            "path_dependence": "price path is archived, not simulated (§3.8)",
            "stickiness": "n/a — realized path, no curve",
        },
        "display_legal": list(DISPLAY_LEGAL),
        "researcher_only": {
            "tail_cvar": {
                "worst_1pct": (sum(pnls[: max(1, len(pnls)//100)]) / max(1, len(pnls)//100)) if pnls else None,
                "best_1pct": (sum(pnls[-max(1, len(pnls)//100):]) / max(1, len(pnls)//100)) if pnls else None,
            },
        },
    }
    return out
