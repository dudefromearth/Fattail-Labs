"""MarketStaticFacts — continuous r + dividends (OPF21 · Spec §3.2)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal

from opf import config as opf_config

DividendMode = Literal["none", "continuous", "discrete"]


@dataclass
class ProductDiv:
    dividend_mode: DividendMode = "none"
    yield_continuous: float | None = None
    discrete: list[dict[str, Any]] = field(default_factory=list)
    settlement: Literal["am", "pm"] = "pm"
    exercise: Literal["european", "american"] = "european"


@dataclass
class MarketStaticFacts:
    as_of: str
    risk_free_rate: float  # continuous
    rate_source: str
    products: dict[str, ProductDiv] = field(default_factory=dict)

    def product(self, symbol: str) -> ProductDiv:
        key = (symbol or "").strip().upper()
        if key in self.products:
            return self.products[key]
        # defaults: index-style european none-div
        return ProductDiv()

    def q_continuous(self, symbol: str) -> float:
        p = self.product(symbol)
        if p.dividend_mode == "continuous" and p.yield_continuous is not None:
            return float(p.yield_continuous)
        return 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "as_of": self.as_of,
            "risk_free_rate": self.risk_free_rate,
            "rate_source": self.rate_source,
            "products": {
                k: {
                    "dividend_mode": v.dividend_mode,
                    "yield_continuous": v.yield_continuous,
                    "discrete": list(v.discrete),
                    "settlement": v.settlement,
                    "exercise": v.exercise,
                }
                for k, v in self.products.items()
            },
        }


def default_static_facts(
    *,
    products: dict[str, ProductDiv] | None = None,
    as_of: datetime | None = None,
) -> MarketStaticFacts:
    """Config SOFR proxy facts (OD-PF9 Accept). Fail-loud if rate invalid via config."""
    now = as_of or datetime.now(tz=timezone.utc)
    r = opf_config.risk_free_rate_continuous()
    prods = products or {
        "SPX": ProductDiv(
            dividend_mode="none",
            settlement="pm",
            exercise="european",
        ),
        "SPXW": ProductDiv(
            dividend_mode="none",
            settlement="pm",
            exercise="european",
        ),
    }
    return MarketStaticFacts(
        as_of=now.isoformat(),
        risk_free_rate=r,
        rate_source=opf_config.rate_source(),
        products=prods,
    )


def require_static_facts(facts: MarketStaticFacts | None) -> MarketStaticFacts:
    """OPF-L0-R1 / AT-L0-5: model_t0 requires MarketStaticFacts."""
    if facts is None:
        raise ValueError(
            "MarketStaticFacts required for model_t0 (OPF21 / AT-L0-5); "
            "configure LABS_OPF_RISK_FREE_RATE or pass facts"
        )
    if facts.risk_free_rate is None:
        raise ValueError("MarketStaticFacts.risk_free_rate missing")
    return facts
