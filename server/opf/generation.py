"""L1 Contract generation store + pricing epoch (OPF5 · OPF23 · OPF32)."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from opf.strike import canonical_strike, contract_map_key


@dataclass
class GenerationKey:
    product: str
    chain_underlier: str
    expiration: str  # YYYY-MM-DD
    wings: int

    def bus_key(self) -> str:
        from opf.keys import bus_ladder_key

        return bus_ladder_key(self.chain_underlier, self.expiration, self.wings)


@dataclass
class ChainGeneration:
    key: GenerationKey
    rows: list[dict[str, Any]]
    spot: float | None
    as_of: str
    content_hash: str
    dual_side: bool = True
    excluded_adjusted_count: int = 0
    raw: dict[str, Any] = field(default_factory=dict)

    def contract_map(self) -> dict[str, dict[str, Any]]:
        """Map contract_map_key → row (with canonical strike)."""
        out: dict[str, dict[str, Any]] = {}
        for row in self.rows:
            side = str(row.get("side") or "").lower()
            strike = row.get("strike")
            if side not in ("call", "put") or strike is None:
                continue
            k = contract_map_key(side, strike)
            r = dict(row)
            r["strike_canonical"] = canonical_strike(strike)
            r["map_key"] = k
            out[k] = r
        return out


class ContractStore:
    """In-process multi-exp generation store (server SoR for foundation)."""

    def __init__(self) -> None:
        self._gens: dict[str, ChainGeneration] = {}

    def put(self, gen: ChainGeneration) -> None:
        self._gens[gen.key.bus_key()] = gen

    def get(self, key: GenerationKey | str) -> ChainGeneration | None:
        bk = key if isinstance(key, str) else key.bus_key()
        return self._gens.get(bk)

    def get_by_expiration(
        self, product: str, expiration: str
    ) -> ChainGeneration | None:
        for g in self._gens.values():
            if g.key.product == product and g.key.expiration == expiration:
                return g
        return None

    def list_keys(self) -> list[str]:
        return list(self._gens.keys())

    def clear(self) -> None:
        self._gens.clear()

    def from_ladder_payload(
        self,
        payload: dict[str, Any],
        *,
        product: str | None = None,
        wings: int | None = None,
    ) -> ChainGeneration:
        """Ingest a chain_ladder dual-side payload into a generation."""
        prod = product or str(payload.get("product") or payload.get("underlier") or "")
        exp = str(payload.get("expiration") or "")[:10]
        ul = str(payload.get("underlier") or payload.get("chain_underlier") or "")
        w = int(wings if wings is not None else payload.get("wings_effective") or payload.get("wings") or 25)
        rows = list(payload.get("rows") or [])
        # dual rows may be nested under call/put or flat with side
        if rows and "side" not in (rows[0] or {}):
            # try dual structure: rows are strikes with call/put fields
            flat: list[dict[str, Any]] = []
            for r in rows:
                strike = r.get("strike")
                for side in ("call", "put"):
                    side_data = r.get(side)
                    if isinstance(side_data, dict):
                        flat.append(
                            {
                                "strike": strike,
                                "side": side,
                                **{k: v for k, v in side_data.items() if k != "strike"},
                            }
                        )
                    elif r.get("mid") is not None and r.get("side"):
                        flat.append(r)
            if flat:
                rows = flat
        key = GenerationKey(
            product=prod,
            chain_underlier=ul,
            expiration=exp,
            wings=w,
        )
        gen = ChainGeneration(
            key=key,
            rows=rows,
            spot=_f(payload.get("spot")),
            as_of=str(payload.get("as_of") or payload.get("fetched_at") or _now_iso()),
            content_hash=str(payload.get("content_hash") or ""),
            dual_side=bool(payload.get("dual_side", True)),
            excluded_adjusted_count=int(payload.get("excluded_adjusted_count") or 0),
            raw=payload,
        )
        self.put(gen)
        return gen


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _parse_as_of_ms(as_of: str | None) -> float | None:
    if not as_of:
        return None
    try:
        s = as_of.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp() * 1000.0
    except ValueError:
        return None


def build_epoch(
    generations: list[ChainGeneration],
    *,
    spot: float | None = None,
) -> dict[str, Any]:
    """Pricing epoch with max_skew_ms and epoch_quality (OPF23)."""
    gens_meta: dict[str, dict[str, Any]] = {}
    times: list[float] = []
    incomplete = False
    for g in generations:
        gens_meta[g.key.expiration] = {
            "content_hash": g.content_hash,
            "as_of": g.as_of,
        }
        if not g.rows:
            incomplete = True
        ms = _parse_as_of_ms(g.as_of)
        if ms is not None:
            times.append(ms)
    max_skew = 0.0
    if len(times) >= 2:
        max_skew = max(times) - min(times)
    elif len(times) == 1:
        max_skew = 0.0

    if incomplete or not generations:
        quality = "incomplete"
    elif max_skew > 0:
        quality = "skewed" if max_skew > 0 else "ok"
        # still "ok" if under threshold — caller applies LABS_OPF_MAX_SKEW_MS
        quality = "skewed" if max_skew > 1e-6 else "ok"
    else:
        quality = "ok"

    spot_v = spot
    if spot_v is None:
        for g in generations:
            if g.spot is not None:
                spot_v = g.spot
                break

    return {
        "spot": spot_v,
        "generations": gens_meta,
        "max_skew_ms": float(max_skew),
        "epoch_quality": quality,
        "built_at": _now_iso(),
        "mono_ms": time.time() * 1000.0,
    }


def epoch_quality_for_day_trade(
    epoch: dict[str, Any],
    *,
    max_skew_ms: int,
    mode: str = "fail_loud",
) -> tuple[str, str | None]:
    """Return (quality, error_or_None). Fail loud default when skewed beyond cap."""
    if epoch.get("epoch_quality") == "incomplete":
        return "incomplete", "epoch incomplete: missing generation rows"
    skew = float(epoch.get("max_skew_ms") or 0)
    if skew > max_skew_ms:
        if mode == "fail_loud":
            return (
                "skewed",
                f"max_skew_ms={skew:.0f} exceeds LABS_OPF_MAX_SKEW_MS={max_skew_ms}",
            )
        return "skewed", None
    return "ok", None
