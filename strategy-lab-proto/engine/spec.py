"""Strategy Spec — Basic mode fields (same IR shape for Pro later)."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from engine.sessions import (
    DTE_LABELS,
    ENTRY_FILL_LABELS,
    ENTRY_SESSION_LABELS,
    EntryFill,
    EntrySession,
)

# Long-only defined-risk structures (debit). Short/credit irons abandoned.
Structure = Literal["long_condor", "long_butterfly", "put_debit", "call_debit"]
# hold_expiry | take_profit (legacy "profit_50" normalized to take_profit)
ExitMode = Literal["hold_expiry", "take_profit", "profit_50"]
# Take profit measured as % of max profit, or % of defined risk (max loss = debit)
TakeProfitBasis = Literal["debit", "risk", "credit"]  # "credit" legacy → debit
# ATM = at-the-money body; OTM = out-of-the-money scan (Pro; uses R2R).
# Legacy "otm_r2r" normalizes to "otm".
StrikeMode = Literal["atm", "otm", "otm_r2r"]
# How target_r2r is applied when OTM. minimum = "12+" floor; nearest = closest match.
R2RRule = Literal["nearest", "minimum"]
# Direction vs spot — required with ATM and OTM: below | above | both.
BodySide = Literal["below", "above", "both"]
# Only 0 and 1 DTE supported (honest scope)
DTEChoice = Literal[0, 1]

STRUCTURE_LABELS: dict[str, str] = {
    "long_condor": "Long condor",
    "long_butterfly": "Long butterfly",
    "put_debit": "Put debit spread",
    "call_debit": "Call debit spread",
}

# Map abandoned short/credit keys → long/debit equivalents (saved Specs, UI).
STRUCTURE_ALIASES: dict[str, Structure] = {
    "iron_condor": "long_condor",
    "iron_butterfly": "long_butterfly",
    "put_credit": "put_debit",
    "call_credit": "call_debit",
    "long_condor": "long_condor",
    "long_butterfly": "long_butterfly",
    "put_debit": "put_debit",
    "call_debit": "call_debit",
    "butterfly": "long_butterfly",
    "condor": "long_condor",
    "ib": "long_butterfly",
    "ic": "long_condor",
}

STRIKE_MODE_LABELS: dict[str, str] = {
    "atm": "ATM",
    "otm": "OTM",
}

R2R_RULE_LABELS: dict[str, str] = {
    "nearest": "Nearest to target R2R",
    "minimum": "At least target R2R (e.g. 12+)",
}

BODY_SIDE_LABELS: dict[str, str] = {
    "below": "Below",
    "above": "Above",
    "both": "Both",
}

EXIT_MODE_LABELS: dict[str, str] = {
    "hold_expiry": "Hold to expiry",
    "take_profit": "Take profit",
}

TAKE_PROFIT_BASIS_LABELS: dict[str, str] = {
    "debit": "% of max profit",
    "risk": "% of risk (max loss / debit)",
    "credit": "% of max profit",  # legacy label
}


def normalize_structure(raw: str | None) -> Structure:
    """Map any known structure key (including legacy short/credit) to long/debit."""
    key = (raw or "").strip().lower()
    return STRUCTURE_ALIASES.get(key, "long_condor")


@dataclass
class RiskShell:
    max_loss_per_trade: float | None = None  # dollars; auto from structure if None
    max_loss_per_day: float = 500.0
    acknowledge_no_retune: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> "RiskShell":
        d = d or {}
        return cls(
            max_loss_per_trade=d.get("max_loss_per_trade"),
            max_loss_per_day=float(d.get("max_loss_per_day") or 500),
            acknowledge_no_retune=bool(d.get("acknowledge_no_retune")),
        )


@dataclass
class StrategySpec:
    """Basic Design Spec — progressive fields for Pro later."""

    name: str = "Untitled"
    hypothesis: str = ""
    underlying: str = "SPY"
    structure: Structure = "long_condor"
    wing_width: float = 5.0  # dollars between body/inner and outer wing
    # ATM / OTM switch. Basic forced to atm; Pro may choose otm (+ R2R).
    strike_mode: StrikeMode = "atm"
    # Target reward/risk = max_profit / max_loss = (wing − debit) / debit.
    # Used when strike_mode is OTM (and optionally min R2R on ATM in Pro).
    target_r2r: float = 0.33
    # nearest = closest to target; minimum = only accept R2R >= target.
    r2r_rule: R2RRule = "nearest"
    # Direction: below | above | both. Required with ATM and OTM.
    body_side: BodySide = "both"
    # Dollars offset of structure body from ATM/spot (strike grid).
    # Shift+drag on risk graph moves the entire position by this amount.
    body_offset: float = 0.0
    short_delta: float = 0.30  # legacy / unused when R2R mode active
    # --- DTE + session entry (fills at session clock / condition) ---
    dte: DTEChoice = 0  # 0 or 1 only
    entry_session: EntrySession = "afternoon"  # morning | afternoon | closing
    # session_time | condition | session_and_condition
    entry_fill: EntryFill = "session_time"
    entry_time_et: str = "14:30"  # derived from session on save; kept for display
    contracts: int = 1
    capital: float = 5000.0
    skip_fomc: bool = True
    open_move_max_pct: float | None = None  # e.g. 0.01 = ±1% (condition)
    exit_mode: ExitMode = "hold_expiry"
    # When exit_mode is take_profit (or legacy profit_50):
    take_profit_pct: float = 50.0  # e.g. 50 = 50%
    take_profit_basis: TakeProfitBasis = "debit"  # max profit vs defined risk
    # --- Friction (Basic uses defaults; Pro can edit) ---
    # Slippage: dollars per share of option premium vs mid (per leg fill model).
    slip_open: float = 0.05
    slip_close: float = 0.05
    # Commission: $ per option contract per side (open and close each charge).
    # e.g. 0.50 means $0.50 × legs × positions on open and again on close.
    commission_per_contract: float = 0.50
    # Fees: exchange/regulatory $ per option contract per side (same timing as commission).
    fees_per_contract: float = 0.10
    risk: RiskShell = field(default_factory=RiskShell)

    def n_legs(self) -> int:
        """Option contracts per position (for friction). Butterfly +1/−2/+1 = 4."""
        if self.structure == "long_condor":
            return 4
        if self.structure == "long_butterfly":
            return 4  # 1 + 2 + 1 contracts
        return 2  # debit verticals

    def friction_dollars_round_turn(self) -> float:
        """Total commission + fees for one round-turn structure (open + close)."""
        legs = self.n_legs()
        n = legs * int(self.contracts)
        per_side = self.commission_per_contract + self.fees_per_contract
        return 2.0 * n * per_side  # open + close

    def normalized_exit_mode(self) -> Literal["hold_expiry", "take_profit"]:
        """Map legacy profit_50 → take_profit @ 50% of max profit."""
        if self.exit_mode in ("take_profit", "profit_50"):
            return "take_profit"
        return "hold_expiry"

    def normalized_strike_mode(self) -> Literal["atm", "otm"]:
        """Map legacy otm_r2r → otm."""
        if self.strike_mode in ("otm", "otm_r2r"):
            return "otm"
        return "atm"

    def take_profit_settings(self) -> tuple[float, Literal["debit", "risk"]]:
        """Return (pct 0–100, basis). Legacy profit_50 / credit → 50% of max profit."""
        if self.exit_mode == "profit_50":
            return 50.0, "debit"
        pct = float(self.take_profit_pct) if self.take_profit_pct is not None else 50.0
        raw = self.take_profit_basis
        basis: Literal["debit", "risk"] = (
            "risk" if raw == "risk" else "debit"
        )
        return pct, basis

    def honesty_errors(self) -> list[str]:
        """Precept: never allow Specs that produce absolute fantasy results.

        Returns human-readable blockers (empty = ok to save/run).
        """
        errs: list[str] = []
        # Zero friction = free fantasy fills — forbidden in every mode
        if self.slip_open <= 0 and self.slip_close <= 0:
            errs.append(
                "Open and close slippage cannot both be $0 — that invents mid fills."
            )
        if self.commission_per_contract < 0 or self.fees_per_contract < 0:
            errs.append("Commission and fees cannot be negative.")
        if self.commission_per_contract <= 0 and self.fees_per_contract <= 0:
            errs.append(
                "Commission and fees cannot both be $0 — that invents free round-turns."
            )
        if self.contracts < 1:
            errs.append("Positions must be at least 1.")
        if self.wing_width <= 0:
            errs.append("Wing width must be positive.")
        if int(self.dte) not in (0, 1):
            errs.append("Only 0 DTE and 1 DTE are supported (no multi-week DTE fantasy).")
        if self.entry_session not in ("morning", "afternoon", "closing"):
            errs.append("Entry session must be morning, afternoon, or closing.")
        if self.entry_fill not in (
            "session_time",
            "condition",
            "session_and_condition",
        ):
            errs.append("Invalid entry fill mode.")
        if self.entry_fill in ("condition", "session_and_condition"):
            if self.open_move_max_pct is None and not self.skip_fomc:
                # FOMC is skip-not-condition; require at least one real condition
                errs.append(
                    "Condition-based entry needs a condition "
                    "(e.g. open-move band). FOMC skip alone is a day filter, not an entry signal."
                )
        if self.normalized_strike_mode() not in ("atm", "otm"):
            errs.append("Strike mode must be ATM or OTM.")
        if self.normalized_strike_mode() == "otm" and self.target_r2r <= 0:
            errs.append("Target R2R must be positive when OTM is selected.")
        if self.r2r_rule not in ("nearest", "minimum"):
            errs.append("R2R rule must be nearest or minimum.")
        if self.body_side not in ("below", "above", "both"):
            errs.append("Direction required: Below, Above, or Both.")
        em = self.normalized_exit_mode()
        if em == "take_profit":
            if self.take_profit_pct <= 0 or self.take_profit_pct > 100:
                errs.append("Take-profit % must be between 0 and 100 (exclusive of 0).")
            if self.take_profit_basis not in ("debit", "risk", "credit"):
                errs.append("Take-profit basis must be debit (max profit) or risk.")
        # Symbol / engine capability (Precept #1)
        try:
            from engine.universe import resolve

            u = resolve(self.underlying)
        except Exception:  # noqa: BLE001
            u = None
        if u is None:
            errs.append(
                f"Unknown symbol {self.underlying!r} — pick from the curated list "
                f"(or add it to the universe when data mapping is ready)."
            )
        elif not u.proto_0dte_options:
            errs.append(
                f"{u.symbol} ({u.name}) cannot run an options backtest here. "
                f"{u.notes or 'No options chain mapping for this engine/data vendor.'}"
            )
        return errs

    def plain_english(self) -> str:
        if self.normalized_exit_mode() == "hold_expiry":
            exit_s = "hold to expiry"
        else:
            pct, basis = self.take_profit_settings()
            if basis == "risk":
                exit_s = (
                    f"take profit at {pct:g}% of risk (max loss / debit) "
                    f"if daily close allows (proxy)"
                )
            else:
                exit_s = (
                    f"take profit at {pct:g}% of max profit "
                    f"if daily close allows (proxy)"
                )
        fomc = "skip FOMC days" if self.skip_fomc else "trade through FOMC"
        open_f = (
            f", only if open move ≤ ±{self.open_move_max_pct * 100:.1f}%"
            if self.open_move_max_pct
            else ""
        )
        label = STRUCTURE_LABELS.get(self.structure, self.structure.replace("_", " "))
        wing_bit = (
            f"ATM body + ${self.wing_width:g} wings"
            if self.structure == "long_butterfly" and self.strike_mode == "atm"
            else f"${self.wing_width:g} wings"
        )
        side_bit = BODY_SIDE_LABELS.get(self.body_side, self.body_side)
        off = float(getattr(self, "body_offset", 0.0) or 0.0)
        body_bit = f", body {off:+g}$ vs ATM" if abs(off) > 1e-9 else ""
        sm = self.normalized_strike_mode()
        if sm == "atm":
            strike_bit = f"ATM · direction {side_bit}{body_bit}"
            if self.r2r_rule == "minimum":
                strike_bit += f", only if R2R≥{self.target_r2r:g}"
        else:
            rule = "≥" if self.r2r_rule == "minimum" else "≈"
            strike_bit = (
                f"OTM · direction {side_bit}{body_bit} · R2R{rule}{self.target_r2r:g} "
                f"({'min' if self.r2r_rule == 'minimum' else 'nearest'})"
            )
        fr = (
            f"slippage ${self.slip_open:.2f}/${self.slip_close:.2f} open/close vs mid, "
            f"commission ${self.commission_per_contract:.2f}/contract/side, "
            f"fees ${self.fees_per_contract:.2f}/contract/side"
        )
        dte_s = DTE_LABELS.get(int(self.dte), f"{self.dte} DTE")
        sess = ENTRY_SESSION_LABELS.get(self.entry_session, self.entry_session)
        fill = ENTRY_FILL_LABELS.get(self.entry_fill, self.entry_fill)
        from engine.sessions import get_session

        fill_clock = get_session(self.entry_session).fill_et
        return (
            f"Buy a {self.underlying} {dte_s} {label} ({wing_bit}, {strike_bit}), "
            f"{self.contracts} position(s), entry {sess} @ ~{fill_clock} ET "
            f"({fill}), {fomc}{open_f}, {exit_s}, {fr}. "
            f"Fills prefer Massive 1-minute bars at session clock; day bars only if minutes missing "
            f"(labeled fallback). Capital context ${self.capital:,.0f}."
        )

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "StrategySpec":
        risk = RiskShell.from_dict(d.get("risk") if isinstance(d.get("risk"), dict) else None)
        raw_tp = d.get("take_profit_basis")
        if raw_tp == "risk":
            tp_basis: TakeProfitBasis = "risk"
        else:
            # legacy "credit" and anything else → debit (% of max profit)
            tp_basis = "debit"
        return cls(
            name=str(d.get("name") or "Untitled"),
            hypothesis=str(d.get("hypothesis") or ""),
            underlying=str(d.get("underlying") or "SPY").upper(),
            structure=normalize_structure(d.get("structure")),
            wing_width=float(d.get("wing_width") or 5),
            strike_mode=(
                "otm"
                if (d.get("strike_mode") in ("otm", "otm_r2r"))
                else "atm"
            ),  # type: ignore[arg-type]
            target_r2r=float(d.get("target_r2r") if d.get("target_r2r") is not None else 0.33),
            r2r_rule=(d.get("r2r_rule") or "nearest"),  # type: ignore[arg-type]
            body_side=(
                d.get("body_side")
                if d.get("body_side") in ("below", "above", "both")
                else "both"
            ),  # type: ignore[arg-type]
            body_offset=float(d.get("body_offset") or 0.0),
            short_delta=float(d.get("short_delta") or 0.30),
            dte=int(d.get("dte") if d.get("dte") is not None else 0),  # type: ignore[arg-type]
            entry_session=(d.get("entry_session") or "afternoon"),  # type: ignore[arg-type]
            entry_fill=(d.get("entry_fill") or "session_time"),  # type: ignore[arg-type]
            entry_time_et=str(d.get("entry_time_et") or "14:30"),
            contracts=int(d.get("contracts") or 1),
            capital=float(d.get("capital") or 5000),
            skip_fomc=bool(d.get("skip_fomc", True)),
            open_move_max_pct=(
                float(d["open_move_max_pct"])
                if d.get("open_move_max_pct") not in (None, "")
                else None
            ),
            exit_mode=d.get("exit_mode") or "hold_expiry",  # type: ignore[arg-type]
            take_profit_pct=float(
                d.get("take_profit_pct") if d.get("take_profit_pct") is not None else 50.0
            ),
            take_profit_basis=tp_basis,
            slip_open=float(d.get("slip_open") if d.get("slip_open") is not None else 0.05),
            slip_close=float(d.get("slip_close") if d.get("slip_close") is not None else 0.05),
            commission_per_contract=float(
                d.get("commission_per_contract")
                if d.get("commission_per_contract") is not None
                else 0.50
            ),
            fees_per_contract=float(
                d.get("fees_per_contract") if d.get("fees_per_contract") is not None else 0.10
            ),
            risk=risk,
        )

    @classmethod
    def template_afternoon_condor(cls) -> "StrategySpec":
        return cls(
            name="SPY afternoon long condor",
            hypothesis=(
                "Buying a defined-risk 0DTE long condor on SPY pays a debit for "
                "upside if price expands outside the body; wings cap the loss at the debit."
            ),
            structure="long_condor",
            wing_width=5.0,  # SPY $1 grid — default 5-wide
            dte=0,
            entry_session="afternoon",
            entry_fill="session_time",
            entry_time_et="14:30",
            contracts=1,
            capital=5000.0,
            skip_fomc=True,
            exit_mode="hold_expiry",
            risk=RiskShell(max_loss_per_day=500.0, acknowledge_no_retune=True),
        )

    @classmethod
    def template_afternoon_butterfly(cls) -> "StrategySpec":
        """Long butterfly: +1/−2/+1 all-call (or all-put via direction), debit."""
        return cls(
            name="SPY afternoon long butterfly",
            hypothesis=(
                "Buying a 0DTE long butterfly (+1/−2/+1) around SPY spot pays a "
                "debit that profits if price pins near the body; wings cap the loss."
            ),
            structure="long_butterfly",
            wing_width=5.0,  # SPY $1 grid — body ± 5
            dte=0,
            entry_session="afternoon",
            entry_fill="session_time",
            entry_time_et="14:30",
            contracts=1,
            capital=5000.0,
            skip_fomc=True,
            exit_mode="hold_expiry",
            risk=RiskShell(max_loss_per_day=500.0, acknowledge_no_retune=True),
        )

    @classmethod
    def from_template(cls, key: str) -> "StrategySpec":
        """Factory for Create UI template keys."""
        key = (key or "").strip().lower()
        st = normalize_structure(key)
        if st == "long_butterfly" or key in ("iron_butterfly", "butterfly", "ib"):
            return cls.template_afternoon_butterfly()
        if st == "put_debit" or key in ("put_debit", "put", "put_credit"):
            s = cls.template_afternoon_condor()
            s.structure = "put_debit"
            s.name = "SPY put debit 0DTE"
            s.hypothesis = (
                "Buying 0DTE put debit spreads pays a defined-risk debit that "
                "profits when SPY falls through the long strike."
            )
            return s
        if st == "call_debit" or key in ("call_debit", "call", "call_credit"):
            s = cls.template_afternoon_condor()
            s.structure = "call_debit"
            s.name = "SPY call debit 0DTE"
            s.hypothesis = (
                "Buying 0DTE call debit spreads pays a defined-risk debit that "
                "profits when SPY rises through the long strike."
            )
            return s
        # default long condor (also iron_condor legacy)
        return cls.template_afternoon_condor()
