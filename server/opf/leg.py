"""LegPricer — marks + IV cascade (OPF8 · OPF26 · §5.6).

Pre-market mark law (OPF package SoR):
  When live NBBO is missing or zeroed (Massive extended-hours), form a usable
  leg mid from held last-session evidence, then European BSM theo from chain IV.
  Always emit ``mark_source`` so UI can disclaimer non-live marks.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from opf.engines.bsm import bsm_european_price
from opf.generation import ChainGeneration, ContractStore
from opf.static_facts import MarketStaticFacts
from opf.strike import contract_map_key
from opf.tau import calendar_dte, tau as compute_tau


IvSource = Literal[
    "exact",
    "nearest",
    "closest_dte",
    "stored",
    "atm_exp",
    "vix",
    "locked",
    "missing",
]

# How the leg mid was formed — package aggregates these for basis_source / disclaimer
MarkSource = Literal[
    "nbbo",
    "last_trade",
    "day_close",
    "theo_bs",
    "locked",
    "missing",
]


@dataclass
class LegIntent:
    leg_id: str
    side: str  # call|put
    strike: float
    expiration: str
    qty: float  # +long / -short
    product: str = "SPX"


def _positive_px(v: Any) -> float | None:
    """Parse price; Massive premarket often sends bid/ask/midpoint = 0 (no book)."""
    if v is None or v == "":
        return None
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if x <= 0:
        return None
    return x


def resolve_leg_mid(
    row: dict[str, Any] | None,
    *,
    side: str,
    strike: float,
    spot: float | None,
    tau: float | None,
    iv: float | None,
    r: float = 0.05,
    q: float = 0.0,
) -> tuple[float | None, MarkSource]:
    """OPF leg mid cascade (live → held → theo).

    1. Live NBBO mid or (bid+ask)/2 with positive prices
    2. Last trade / day close (held prior-session marks)
    3. European BSM from spot + IV + τ (theoretical until open)
    """
    # Missing listed contract → incomplete (do not invent a mark for ghost strikes)
    if row is None:
        return None, "missing"

    # 1) Live book — reject zeros (premarket wipe of NBBO)
    bid = _positive_px(row.get("bid"))
    ask = _positive_px(row.get("ask"))
    mid = _positive_px(row.get("mid"))
    # If ladder already tagged mid_source=nbbo with positive mid, trust it
    tagged = row.get("mid_source")
    if mid is not None and tagged == "nbbo":
        return mid, "nbbo"
    if mid is not None and tagged in (None, "", "nbbo") and bid is not None and ask is not None:
        return mid, "nbbo"
    if bid is not None and ask is not None:
        return (bid + ask) / 2.0, "nbbo"
    if mid is not None and tagged == "nbbo":
        return mid, "nbbo"

    # 2) Held session evidence (still on Massive snapshot pre-open)
    last = _positive_px(row.get("last"))
    if last is None:
        last = _positive_px(row.get("last_trade_price"))
    if last is None and isinstance(row.get("last_trade"), dict):
        lt = row["last_trade"]
        last = _positive_px(lt.get("price") or lt.get("p"))
    day_close = _positive_px(row.get("day_close"))
    if day_close is None and isinstance(row.get("day"), dict):
        day_close = _positive_px(row["day"].get("close"))

    # Respect ladder held tags when mid already filled from chain_ladder
    if mid is not None and tagged == "last_trade":
        return mid, "last_trade"
    if mid is not None and tagged == "day_close":
        return mid, "day_close"

    if last is not None:
        return last, "last_trade"
    if day_close is not None:
        return day_close, "day_close"
    if mid is not None and mid > 0:
        # Untagged positive mid (tests / live hydrate) — treat as nbbo
        return mid, "nbbo"

    # 3) Theoretical European mid from chain IV (usable pre-open)
    if (
        spot is not None
        and spot > 0
        and iv is not None
        and iv > 0
        and tau is not None
        and tau > 0
        and strike > 0
    ):
        try:
            px = bsm_european_price(
                float(spot),
                float(strike),
                float(tau),
                float(r),
                float(q),
                float(iv),
                side,
            )
            if px is not None and px > 0:
                return float(px), "theo_bs"
        except (TypeError, ValueError):
            pass

    return None, "missing"


def _mid_from_row(row: dict[str, Any] | None) -> float | None:
    """Backward-compatible: NBBO-only mid (no held/theo). Prefer resolve_leg_mid."""
    mid, _src = resolve_leg_mid(row, side="call", strike=0.0, spot=None, tau=None, iv=None)
    if _src == "nbbo":
        return mid
    # Legacy callers only wanted quote mid — if resolve fell through without
    # spot/iv, still return held mid when present on the row path above.
    if _src in ("last_trade", "day_close"):
        return mid
    return None


def _iv_from_row(row: dict[str, Any] | None) -> float | None:
    if not row:
        return None
    iv = row.get("iv")
    if iv is None:
        return None
    try:
        v = float(iv)
        # Massive sometimes sends percent
        if v > 3.0:
            v = v / 100.0
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


class LegPricer:
    def __init__(
        self,
        store: ContractStore,
        *,
        facts: MarketStaticFacts | None = None,
        vix: float | None = None,
        vix1d: float | None = None,
        as_of_clock: datetime | None = None,
    ) -> None:
        self.store = store
        self.facts = facts
        self.vix = vix
        self.vix1d = vix1d
        self.as_of_clock = as_of_clock

    def price_leg(
        self,
        intent: LegIntent,
        *,
        freeze_iv_snapshot: dict[str, float] | None = None,
        freeze_mark_snapshot: dict[str, dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Resolve LegMark for one intent."""
        if freeze_mark_snapshot and intent.leg_id in freeze_mark_snapshot:
            snap = dict(freeze_mark_snapshot[intent.leg_id])
            snap["leg_id"] = intent.leg_id
            snap["qty"] = intent.qty
            return snap

        gen = self.store.get_by_expiration(intent.product, intent.expiration)
        cmap = gen.contract_map() if gen else {}
        key = contract_map_key(intent.side, intent.strike)
        row = cmap.get(key)

        iv: float | None = None
        iv_source: IvSource = "missing"

        if freeze_iv_snapshot and intent.leg_id in freeze_iv_snapshot:
            iv = float(freeze_iv_snapshot[intent.leg_id])
            iv_source = "locked"
        else:
            iv, iv_source = self._cascade_iv(intent, gen, cmap, row)

        settlement = "pm"
        r = 0.05
        q = 0.0
        if self.facts:
            prod = self.facts.product(intent.product)
            settlement = prod.settlement  # type: ignore[assignment]
            r = float(self.facts.risk_free_rate)
            q = float(self.facts.q_continuous(intent.product))

        tau_meta = compute_tau(
            intent.expiration,
            self.as_of_clock,
            settlement=settlement,  # type: ignore[arg-type]
        )

        spot = float(gen.spot) if gen and gen.spot is not None else None
        mid, mark_source = resolve_leg_mid(
            row,  # None if strike not on generation — fail incomplete
            side=intent.side,
            strike=float(intent.strike),
            spot=spot,
            tau=float(tau_meta["tau"]) if tau_meta.get("tau") is not None else None,
            iv=iv if row is not None else None,  # no theo for unlisted legs
            r=r,
            q=q,
        )

        bid = _positive_px(row.get("bid")) if row else None
        ask = _positive_px(row.get("ask")) if row else None

        return {
            "leg_id": intent.leg_id,
            "side": intent.side.lower(),
            "strike": float(intent.strike),
            "expiration": intent.expiration,
            "qty": float(intent.qty),
            "product": intent.product,
            "mid": mid,
            "bid": bid,
            "ask": ask,
            "mark_source": mark_source,
            "iv": iv,
            "iv_source": iv_source,
            "tau": tau_meta["tau"],
            "tau_meta": tau_meta,
            "as_of": gen.as_of if gen else None,
            "generation_hash": gen.content_hash if gen else None,
            "map_key": key,
            "quality": "ok" if mid is not None else "incomplete",
        }

    def _cascade_iv(
        self,
        intent: LegIntent,
        gen: ChainGeneration | None,
        cmap: dict[str, dict[str, Any]],
        exact_row: dict[str, Any] | None,
    ) -> tuple[float | None, IvSource]:
        # 1 exact
        iv = _iv_from_row(exact_row)
        if iv is not None:
            return iv, "exact"

        side = intent.side.lower()
        strike = float(intent.strike)

        # 2 nearest same exp/side
        if gen:
            same = [
                r
                for r in gen.rows
                if str(r.get("side", "")).lower() == side and _iv_from_row(r) is not None
            ]
            if same:
                nearest = min(same, key=lambda r: abs(float(r["strike"]) - strike))
                ivn = _iv_from_row(nearest)
                if ivn is not None:
                    return ivn, "nearest"

        # 3 closest_dte other generation same product
        best: tuple[int, float] | None = None
        target_dte = calendar_dte(intent.expiration, self.as_of_clock)
        for g in [self.store.get(k) for k in self.store.list_keys()]:
            if g is None or g.key.product != intent.product:
                continue
            dte = calendar_dte(g.key.expiration, self.as_of_clock)
            for r in g.rows:
                if str(r.get("side", "")).lower() != side:
                    continue
                ivr = _iv_from_row(r)
                if ivr is None:
                    continue
                dist = abs(dte - target_dte)
                if best is None or dist < best[0]:
                    best = (dist, ivr)
        if best is not None:
            return best[1], "closest_dte"

        # 5 atm_exp — ATM IV same expiration
        if gen and gen.spot is not None:
            atm_side = [
                r
                for r in gen.rows
                if str(r.get("side", "")).lower() == side and _iv_from_row(r) is not None
            ]
            if atm_side:
                atm = min(atm_side, key=lambda r: abs(float(r["strike"]) - float(gen.spot)))
                iva = _iv_from_row(atm)
                if iva is not None:
                    return iva, "atm_exp"

        # 6 vix — OC5a: native VIX/VIX1D only (already filtered by caller)
        dte = calendar_dte(intent.expiration, self.as_of_clock)
        if dte <= 1 and self.vix1d is not None and self.vix1d > 0:
            return float(self.vix1d) / 100.0 if self.vix1d > 3 else float(self.vix1d), "vix"
        if self.vix is not None and self.vix > 0:
            return float(self.vix) / 100.0 if self.vix > 3 else float(self.vix), "vix"

        return None, "missing"
