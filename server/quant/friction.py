"""Fill-friction model — ATRV v0.10 §3.7.1 (BUILD, DL-679).

The unit is a complex order at a net limit, resting in the archived path.
Fills whole at the limit or not at all, never better. Unfitted: P(fill
within the window) as a constant hazard. `legged` is the v0.9 contrast and
lives in simulate._fill, not here.

Tick is declared per book ($0.01 for XSP). The store has no tick rule.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from quant.store import DayStore


class FrictionRefusal(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}: {detail}")
        self.code, self.detail = code, detail

TICK_BY_BOOK = {"XSP": 0.01}  # declared data, labelled (O-R5)

ORDER_TYPES = ("complex", "legged")
WINDOW_S = (10, 20, 30, 60)
IMPROVE_TICKS = (0, 1)
MAX_RESEATS = (0, 1, 2, 3)
REGIME_FACTOR = (0.5, 0.75, 1.0)
OFFSET_TICKS = (-1, 0, 1, 2, "natural")
ABS_CHIPS = (0.30, 0.50, 1.00)
ABS_MIN, ABS_MAX, ABS_STEP = 0.05, 5.00, 0.01
CELL_CEILING = 64

DEFAULTS = {
    "order_type": "complex",
    "limit": {"kind": "offset", "ticks": 1},
    "window_s": 30,
    "reseat": {"improve_ticks": 1, "max_reseats": 2},
    "regime_factor": 1.0,
}


class ControlOffGrid(FrictionRefusal):
    def __init__(self, axis: str, got, grid) -> None:
        super().__init__("CONTROL_OFF_GRID", f"{axis}={got!r} is not on the grid {grid}")
        self.axis = axis


def _on_abs_grid(v: float) -> bool:
    if not (ABS_MIN - 1e-12 <= v <= ABS_MAX + 1e-12):
        return False
    n = round(v / ABS_STEP)
    return abs(v - n * ABS_STEP) < 1e-9


@dataclass(frozen=True)
class Controls:
    """One on-grid control tuple. Echoed verbatim in assumptions.controls."""
    order_type: str = "complex"
    limit_kind: str = "offset"          # abs | offset
    limit_abs: float | None = None
    offset_ticks: int | str = 1         # -1,0,1,2 or "natural"
    window_s: int = 30
    improve_ticks: int = 1
    max_reseats: int = 2
    regime_factor: float = 1.0

    def as_echo(self) -> dict:
        limit: dict
        if self.limit_kind == "abs":
            limit = {"kind": "abs", "debit": self.limit_abs}
        elif self.offset_ticks == "natural":
            limit = {"kind": "offset", "ticks": "natural"}
        else:
            limit = {"kind": "offset", "ticks": int(self.offset_ticks)}
        return {
            "order_type": self.order_type,
            "limit": limit,
            "window_s": self.window_s,
            "reseat": {"improve_ticks": self.improve_ticks, "max_reseats": self.max_reseats},
            "regime_factor": self.regime_factor,
        }

    def validate(self) -> None:
        if self.order_type not in ORDER_TYPES:
            raise ControlOffGrid("order_type", self.order_type, list(ORDER_TYPES))
        if self.window_s not in WINDOW_S:
            raise ControlOffGrid("window_s", self.window_s, list(WINDOW_S))
        if self.improve_ticks not in IMPROVE_TICKS:
            raise ControlOffGrid("reseat.improve_ticks", self.improve_ticks, list(IMPROVE_TICKS))
        if self.max_reseats not in MAX_RESEATS:
            raise ControlOffGrid("reseat.max_reseats", self.max_reseats, list(MAX_RESEATS))
        if self.regime_factor not in REGIME_FACTOR:
            raise ControlOffGrid("regime_factor", self.regime_factor, list(REGIME_FACTOR))
        if self.limit_kind == "abs":
            if self.limit_abs is None or not _on_abs_grid(float(self.limit_abs)):
                raise ControlOffGrid(
                    "limit.abs",
                    self.limit_abs,
                    f"$0.01 grid in [{ABS_MIN}, {ABS_MAX}]",
                )
        elif self.limit_kind == "offset":
            if self.offset_ticks not in OFFSET_TICKS:
                raise ControlOffGrid("limit.offset.ticks", self.offset_ticks, list(OFFSET_TICKS))
        else:
            raise ControlOffGrid("limit.kind", self.limit_kind, ["abs", "offset"])


def parse_controls(raw: dict | None) -> Controls:
    if not raw:
        c = Controls()
        c.validate()
        return c
    if not isinstance(raw, dict):
        raise ControlOffGrid("controls", type(raw).__name__, "object")
    ot = raw.get("order_type", DEFAULTS["order_type"])
    lim = raw.get("limit", DEFAULTS["limit"])
    if not isinstance(lim, dict):
        raise ControlOffGrid("limit", lim, "{kind: abs|offset, ...}")
    kind = lim.get("kind")
    abs_v = lim.get("debit") if kind == "abs" else None
    off = lim.get("ticks", 1) if kind == "offset" else 1
    rs = raw.get("reseat", DEFAULTS["reseat"])
    if not isinstance(rs, dict):
        raise ControlOffGrid("reseat", rs, "{improve_ticks, max_reseats}")
    c = Controls(
        order_type=str(ot),
        limit_kind=str(kind) if kind is not None else "offset",
        limit_abs=None if abs_v is None else float(abs_v),
        offset_ticks=off if off == "natural" else int(off) if kind == "offset" else 1,
        window_s=int(raw.get("window_s", DEFAULTS["window_s"])),
        improve_ticks=int(rs.get("improve_ticks", 1)),
        max_reseats=int(rs.get("max_reseats", 2)),
        regime_factor=float(raw.get("regime_factor", DEFAULTS["regime_factor"])),
    )
    c.validate()
    return c


def grids() -> dict:
    """Serving seam (O1). Not a second source of truth — data lives here."""
    return {
        "order_type": list(ORDER_TYPES),
        "limit": {
            "kinds": ["abs", "offset"],
            "abs_chips": list(ABS_CHIPS),
            "abs_grid": {"min": ABS_MIN, "max": ABS_MAX, "step": ABS_STEP},
            "offset_ticks": list(OFFSET_TICKS),
        },
        "window_s": list(WINDOW_S),
        "reseat": {"improve_ticks": list(IMPROVE_TICKS), "max_reseats": list(MAX_RESEATS)},
        "regime_factor": list(REGIME_FACTOR),
        "defaults": DEFAULTS,
        "tick_by_book": dict(TICK_BY_BOOK),
        "cell_ceiling": CELL_CEILING,
        "abs_chips_note": "page chips are Coach's 10%-of-width examples; API accepts the $0.01 grid",
    }


def tick_for(book: str) -> float:
    if book not in TICK_BY_BOOK:
        raise FrictionRefusal("TICK_UNDECLARED", f"no declared tick for book {book!r}")
    return TICK_BY_BOOK[book]


def hazard_unfitted(p: float, k: int) -> float:
    """Constant hazard so 1-(1-h)^K = p. Never scaled by regime_factor (D7)."""
    if k < 1:
        return 0.0
    if p >= 1.0:
        return 1.0
    if p <= 0.0:
        return 0.0
    return 1.0 - (1.0 - p) ** (1.0 / k)


def window_indices(st: DayStore, t0: int, window_s: int) -> list[int]:
    """K = snapshots actually inside [t0_ms, t0_ms + window_s seconds] (D6)."""
    if not (0 <= t0 < st.T):
        return []
    t0_ms = st.time_ms(t0)
    cap = t0_ms + int(window_s) * 1000
    out = []
    for t in range(t0, st.T):
        ms = st.time_ms(t)
        if ms > cap:
            break
        out.append(t)
    return out


def _px(st: DayStore, field: str, c: int, t: int) -> float | None:
    if not st.present(c, t):
        return None
    v = st.value(field, c, t)
    if v is None:
        return None
    return v / st.scale(field)


def complex_quotes(st: DayStore, legs: Sequence, t: int) -> dict:
    """natural / mid / one_sided_legs / tick. Null-bid on a sell leg → natural None (F3)."""
    tick = tick_for(st.book)
    mid = 0.0
    nat_buy = 0.0
    nat_sell = 0.0
    buy_ok = True
    sell_ok = True
    one_sided: list[dict] = []
    n_null_bid = 0
    for lg in legs:
        bid = _px(st, "bid", lg.c, t)
        ask = _px(st, "ask", lg.c, t)
        m = _px(st, "mid", lg.c, t)
        if m is None:
            buy_ok = sell_ok = False
            one_sided.append({"c": lg.c, "qty": lg.qty, "reason": "no_mid"})
            continue
        mid += lg.qty * m
        if bid is None:
            n_null_bid += 1
        if lg.qty > 0:
            if ask is None:
                buy_ok = False
                one_sided.append({"c": lg.c, "qty": lg.qty, "reason": "null_ask"})
            else:
                nat_buy += lg.qty * ask
            if bid is None:
                sell_ok = False
                one_sided.append({"c": lg.c, "qty": lg.qty, "reason": "null_bid"})
            else:
                nat_sell += lg.qty * bid
        else:
            q = abs(lg.qty)
            if bid is None:
                buy_ok = False
                one_sided.append({"c": lg.c, "qty": lg.qty, "reason": "null_bid"})
            else:
                nat_buy -= q * bid
            if ask is None:
                sell_ok = False
                one_sided.append({"c": lg.c, "qty": lg.qty, "reason": "null_ask"})
            else:
                nat_sell -= q * ask
    return {
        "mid": mid,
        "natural_buy": nat_buy if buy_ok else None,
        "natural_sell": nat_sell if sell_ok else None,
        "one_sided_legs": one_sided,
        "null_bid_legs": n_null_bid,
        "tick": tick,
        "mark_basis": "vendor_ask_over_2",
    }


def resolve_limit(q: dict, controls: Controls, side: str) -> float | None:
    """side is 'buy' (opening debit) or 'sell' (closing credit in debit-space)."""
    if controls.limit_kind == "abs":
        return float(controls.limit_abs)
    mid = q["mid"]
    tick = q["tick"]
    nat = q["natural_buy"] if side == "buy" else q["natural_sell"]
    if controls.offset_ticks == "natural":
        return nat
    off = int(controls.offset_ticks)
    if side == "buy":
        return mid + off * tick
    return mid - off * tick


def _marketable(q: dict, limit: float, side: str) -> bool:
    nat = q["natural_buy"] if side == "buy" else q["natural_sell"]
    if nat is None:
        return False
    if side == "buy":
        return limit + 1e-12 >= nat
    return limit - 1e-12 <= nat


@dataclass
class RestResult:
    filled: bool
    t_fill: int | None
    limit: float | None
    mid_at_fill: float | None
    K: int
    reseats_used: int
    window_s: int


def rest_order(st: DayStore, legs: Sequence, side: str, t0: int,
               controls: Controls, rng, p_fill: float,
               *, limit_override: float | None = None) -> RestResult:
    """Rest in the path. Fill at the limit or not at all. Never better (F1/F4)."""
    limit = limit_override
    reseats = 0
    t_cur = t0
    last_k = 0
    while True:
        idx = window_indices(st, t_cur, controls.window_s)
        last_k = len(idx)
        h = hazard_unfitted(p_fill, len(idx))
        for t in idx:
            q = complex_quotes(st, legs, t)
            nat_key = "natural_buy" if side == "buy" else "natural_sell"
            if q[nat_key] is None:
                continue
            if limit is None:
                limit = resolve_limit(q, controls, side)
                if limit is None:
                    continue
            if rng.random() <= h:
                return RestResult(True, t, limit, q["mid"], len(idx), reseats, controls.window_s)
        if reseats >= controls.max_reseats or controls.improve_ticks == 0:
            return RestResult(False, None, limit, None, last_k, reseats, controls.window_s)
        # re-seat: more aggressive by improve_ticks
        tick = tick_for(st.book)
        if limit is None:
            return RestResult(False, None, None, None, last_k, reseats, controls.window_s)
        if side == "buy":
            limit = limit + controls.improve_ticks * tick
        else:
            limit = limit - controls.improve_ticks * tick
        reseats += 1
        t_cur = idx[-1] + 1 if idx else t_cur + 1
        if t_cur >= st.T:
            return RestResult(False, None, limit, None, last_k, reseats, controls.window_s)


def load_fit(path: str | None) -> dict | None:
    """Absent path → unfitted. Set-but-bad is a boot concern (config)."""
    if not path:
        return None
    p = Path(path)
    doc = json.loads(p.read_text())
    if not doc.get("fit_id"):
        raise FrictionRefusal("FIT_UNUSABLE", "fit.json has no fit_id")
    return doc


def n_contracts(legs: Sequence) -> int:
    return sum(abs(lg.qty) for lg in legs)
