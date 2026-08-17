"""PackagePricer — natural debit + epoch meta (OPF6–7 · OPF23)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from opf import config as opf_config
from opf.engines.mark_sum import mark_sum_package
from opf.generation import ContractStore, build_epoch, epoch_quality_for_day_trade
from opf.leg import LegIntent, LegPricer
from opf.lock import LockState
from opf.session import build_opf_session, generation_as_of_from
from opf.static_facts import MarketStaticFacts


@dataclass
class StrategyIntent:
    strategy_id: str
    legs: list[LegIntent]
    structure: str = "custom"  # calendar | diagonal | fly | custom
    packages: float = 1.0
    product: str = "SPX"
    meta: dict[str, Any] = field(default_factory=dict)


class PackagePricer:
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
        self.leg_pricer = LegPricer(
            store,
            facts=facts,
            vix=vix,
            vix1d=vix1d,
            as_of_clock=as_of_clock,
        )
        self.as_of_clock = as_of_clock

    def quote(
        self,
        intent: StrategyIntent,
        *,
        lock: LockState | None = None,
        require_epoch_ok: bool = True,
    ) -> dict[str, Any]:
        freeze_iv = None
        freeze_marks = None
        if lock and lock.mode == "locked":
            if lock.freeze_iv and lock.leg_iv_snapshot:
                freeze_iv = lock.leg_iv_snapshot
            if lock.freeze_marks and lock.leg_mark_snapshot:
                freeze_marks = {
                    m["leg_id"]: m for m in lock.leg_mark_snapshot if m.get("leg_id")
                }

        leg_marks = [
            self.leg_pricer.price_leg(
                leg,
                freeze_iv_snapshot=freeze_iv,
                freeze_mark_snapshot=freeze_marks,
            )
            for leg in intent.legs
        ]

        # epoch from unique expirations
        gens = []
        seen: set[str] = set()
        for leg in intent.legs:
            g = self.store.get_by_expiration(leg.product, leg.expiration)
            if g and g.key.bus_key() not in seen:
                gens.append(g)
                seen.add(g.key.bus_key())
        epoch = build_epoch(gens)
        quality, skew_err = epoch_quality_for_day_trade(
            epoch,
            max_skew_ms=opf_config.max_skew_ms(),
            mode=opf_config.skew_mode(),
        )

        def _with_session(payload: dict[str, Any]) -> dict[str, Any]:
            payload["opf_session"] = _session_for_quote(
                intent,
                leg_marks,
                epoch.get("generations") if isinstance(epoch, dict) else None,
                facts=self.facts,
                as_of_clock=self.as_of_clock,
            )
            return payload

        if quality == "ok" and epoch.get("epoch_quality") == "ok":
            epoch["epoch_quality"] = "ok"
        elif skew_err and require_epoch_ok and opf_config.skew_mode() == "fail_loud":
            if float(epoch.get("max_skew_ms") or 0) > opf_config.max_skew_ms():
                return _with_session(
                    {
                        "complete": False,
                        "error": skew_err,
                        "skew_fail": True,
                        "epoch": epoch,
                        "leg_marks": leg_marks,
                        "package_debit_per_share": None,
                        "max_skew_ms": epoch.get("max_skew_ms"),
                        "epoch_quality": "skewed_fail",
                        "generations_used": epoch.get("generations"),
                    }
                )

        marks_sum = mark_sum_package(leg_marks)
        d_nat = marks_sum.get("debit_per_share")
        complete = bool(marks_sum.get("complete"))

        d_basis = d_nat
        basis_source = "natural_mid"
        if lock and lock.mode == "locked":
            d_basis = lock.package_debit_per_share
            basis_source = lock.lock_source

        # Pre-open / held / theo package labeling (OPF mark SoR)
        mark_mode, mark_disclaimer, pre_open_basis = _package_mark_mode(leg_marks)
        if complete and (lock is None or lock.mode != "locked") and pre_open_basis:
            basis_source = pre_open_basis

        packages = float(intent.packages or 1.0)
        mark_dollars = None
        if d_basis is not None and complete:
            # OPF30: dollars per package-set
            mark_dollars = float(d_basis) * 100.0 * packages

        return _with_session(
            {
                "strategy_id": intent.strategy_id,
                "structure": intent.structure,
                "complete": complete,
                "package_debit_per_share": d_nat if complete else None,
                "basis_debit_per_share": d_basis if (complete or (lock and lock.mode == "locked")) else None,
                "basis_source": basis_source,
                "mark_mode": mark_mode,
                "mark_disclaimer": mark_disclaimer,
                "mark_dollars": mark_dollars,
                "packages": packages,
                "leg_marks": leg_marks,
                "max_skew_ms": epoch.get("max_skew_ms"),
                "epoch_quality": epoch.get("epoch_quality"),
                "generations_used": epoch.get("generations"),
                "epoch": epoch,
                "pnl_unit": "usd_per_package_set",
                "error": None if complete else f"incomplete legs: {marks_sum.get('missing_legs')}",
            }
        )


def _package_mark_mode(
    leg_marks: list[dict[str, Any]],
) -> tuple[str, str | None, str | None]:
    """Aggregate leg mark_source → package mark_mode + member disclaimer.

    Returns (mark_mode, disclaimer|None, basis_source override|None).
    """
    sources = [
        str(m.get("mark_source") or "missing")
        for m in leg_marks
        if m.get("mid") is not None
    ]
    if not sources:
        return "incomplete", None, None

    unique = set(sources)
    if unique == {"nbbo"}:
        return "live", None, "natural_mid"

    held = {"last_trade", "day_close"}
    theo = {"theo_bs"}
    non_live = unique - {"nbbo"}

    if non_live and not (unique & {"nbbo"}):
        if non_live <= held:
            mode = "pre_open_held"
            basis = "pre_open_held"
            disclaimer = (
                "Theoretical package until the market opens — marks are last-session "
                "held prices (last trade / prior close), not live NBBO."
            )
        elif non_live <= theo or (non_live & theo):
            mode = "pre_open_theo"
            basis = "pre_open_theo"
            disclaimer = (
                "Theoretical package until the market opens — marks use model pricing "
                "(and/or last-session evidence) because live option quotes are not available."
            )
        else:
            mode = "pre_open_mixed"
            basis = "pre_open_mixed"
            disclaimer = (
                "Theoretical package until the market opens — combination of held and "
                "model marks; not live NBBO."
            )
        return mode, disclaimer, basis

    # Mix of live + held/theo
    if non_live:
        return (
            "mixed",
            "Some legs use pre-open held/model marks — not a pure live NBBO package.",
            "pre_open_mixed",
        )
    return "live", None, "natural_mid"


def _session_for_quote(
    intent: StrategyIntent,
    leg_marks: list[dict[str, Any]],
    generations_used: dict[str, Any] | None,
    *,
    facts: MarketStaticFacts | None,
    as_of_clock: datetime | None,
) -> dict[str, Any]:
    """Session/print envelope beside mark_mode (H2). Not Law B residual (H4)."""
    extras = [m.get("as_of") for m in leg_marks if isinstance(m, dict)]
    gen_as_of = generation_as_of_from(generations_used, extra=extras)
    sources = [str(m.get("mark_source") or "") for m in leg_marks]
    expirations = [leg.expiration for leg in intent.legs]
    settlement = "pm"
    if facts is not None:
        settlement = facts.product(intent.product).settlement
    return build_opf_session(
        generation_as_of=gen_as_of,
        mark_sources=sources,
        expirations=expirations,
        settlement=settlement,
        product=intent.product,
        as_of_clock=as_of_clock,
    )
