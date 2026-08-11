"""LegPricer — marks + IV cascade (OPF8 · OPF26 · §5.6)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

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


@dataclass
class LegIntent:
    leg_id: str
    side: str  # call|put
    strike: float
    expiration: str
    qty: float  # +long / -short
    product: str = "SPX"


def _mid_from_row(row: dict[str, Any] | None) -> float | None:
    if not row:
        return None
    mid = row.get("mid")
    if mid is not None:
        try:
            return float(mid)
        except (TypeError, ValueError):
            pass
    bid, ask = row.get("bid"), row.get("ask")
    try:
        if bid is not None and ask is not None:
            return (float(bid) + float(ask)) / 2.0
    except (TypeError, ValueError):
        pass
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

        mid = _mid_from_row(row)
        iv: float | None = None
        iv_source: IvSource = "missing"

        if freeze_iv_snapshot and intent.leg_id in freeze_iv_snapshot:
            iv = float(freeze_iv_snapshot[intent.leg_id])
            iv_source = "locked"
        else:
            iv, iv_source = self._cascade_iv(intent, gen, cmap, row)

        settlement = "pm"
        if self.facts:
            settlement = self.facts.product(intent.product).settlement  # type: ignore[assignment]

        tau_meta = compute_tau(
            intent.expiration,
            self.as_of_clock,
            settlement=settlement,  # type: ignore[arg-type]
        )

        return {
            "leg_id": intent.leg_id,
            "side": intent.side.lower(),
            "strike": float(intent.strike),
            "expiration": intent.expiration,
            "qty": float(intent.qty),
            "product": intent.product,
            "mid": mid,
            "bid": row.get("bid") if row else None,
            "ask": row.get("ask") if row else None,
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
