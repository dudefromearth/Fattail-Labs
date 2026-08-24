"""Progress projection — pure forward model.

Every tier settles where monthly additions equal monthly losses, so a tier's
ceiling is adds / churn. That single identity decides whether a revenue target
is reachable at the current funnel, which is the question this page exists to
answer.

Cash basis: Observer fees and up-front annuals land in the month they are paid;
only the Activator and Navigator bases compound. No amortisation - the page
reports what hits the account, matching what an admin sees in WooCommerce.

Pure: no I/O, no clock, no config. Parameters are injected so admins can retune
the model without a deploy.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class ProjectionError(ValueError):
    """Raised on impossible inputs. Fail loud rather than emit a wrong curve."""


@dataclass(frozen=True)
class ModelInputs:
    observers_per_month: float
    upgrade_rate: float              # Observer -> any paid tier
    annual_rate: float               # Observer -> annual/lifetime
    navigator_share: float           # of upgraders, share choosing Navigator
    activator_churn: float
    navigator_churn: float
    observer_revenue: float          # per Observer signup, whole term
    activator_price: float
    navigator_price: float
    annual_price: float
    start_activators: int = 0
    start_navigators: int = 0

    def __post_init__(self) -> None:
        for name in ("activator_churn", "navigator_churn"):
            v = getattr(self, name)
            if not 0 < v <= 1:
                raise ProjectionError(f"{name} must be in (0, 1], got {v}")
        for name in ("upgrade_rate", "annual_rate", "navigator_share"):
            v = getattr(self, name)
            if not 0 <= v <= 1:
                raise ProjectionError(f"{name} must be in [0, 1], got {v}")
        if self.observers_per_month < 0:
            raise ProjectionError("observers_per_month must be >= 0")


@dataclass(frozen=True)
class MonthPoint:
    index: int
    activators: float
    navigators: float
    annuals: float
    observer_cash: float
    annual_cash: float
    activator_cash: float
    navigator_cash: float
    total_cash: float


def steady_state(adds_per_month: float, monthly_churn: float) -> float:
    """Where a tier settles. The whole model rests on this identity."""
    if not 0 < monthly_churn <= 1:
        raise ProjectionError(f"monthly_churn must be in (0, 1], got {monthly_churn}")
    if adds_per_month < 0:
        raise ProjectionError("adds_per_month must be >= 0")
    return adds_per_month / monthly_churn


def project(inputs: ModelInputs, months: int = 24) -> list[MonthPoint]:
    if months < 1:
        raise ProjectionError("months must be >= 1")
    upgrades = inputs.observers_per_month * inputs.upgrade_rate
    nav_adds = upgrades * inputs.navigator_share
    act_adds = upgrades - nav_adds
    annuals = inputs.observers_per_month * inputs.annual_rate

    activators = float(inputs.start_activators)
    navigators = float(inputs.start_navigators)
    out: list[MonthPoint] = []
    for i in range(1, months + 1):
        activators = activators * (1 - inputs.activator_churn) + act_adds
        navigators = navigators * (1 - inputs.navigator_churn) + nav_adds
        obs_cash = inputs.observers_per_month * inputs.observer_revenue
        ann_cash = annuals * inputs.annual_price
        act_cash = activators * inputs.activator_price
        nav_cash = navigators * inputs.navigator_price
        out.append(
            MonthPoint(
                index=i,
                activators=round(activators, 2),
                navigators=round(navigators, 2),
                annuals=round(annuals, 2),
                observer_cash=round(obs_cash, 2),
                annual_cash=round(ann_cash, 2),
                activator_cash=round(act_cash, 2),
                navigator_cash=round(nav_cash, 2),
                total_cash=round(obs_cash + ann_cash + act_cash + nav_cash, 2),
            )
        )
    return out


def settles_at(inputs: ModelInputs) -> float:
    """Cash per month once both bases have filled. The honest ceiling."""
    upgrades = inputs.observers_per_month * inputs.upgrade_rate
    nav_adds = upgrades * inputs.navigator_share
    act_adds = upgrades - nav_adds
    act = steady_state(act_adds, inputs.activator_churn)
    nav = steady_state(nav_adds, inputs.navigator_churn)
    return round(
        inputs.observers_per_month * inputs.observer_revenue
        + inputs.observers_per_month * inputs.annual_rate * inputs.annual_price
        + act * inputs.activator_price
        + nav * inputs.navigator_price,
        2,
    )


def months_to_target(inputs: ModelInputs, target: float, months: int = 36) -> int | None:
    """First month index reaching target, or None if it never does."""
    for point in project(inputs, months):
        if point.total_cash >= target:
            return point.index
    return None


def observers_needed_for(target: float, inputs: ModelInputs,
                         lo: float = 0.0, hi: float = 5000.0) -> float | None:
    """Observers per month whose steady state hits the target.

    Monotonic in observers_per_month, so a bisection is exact enough and cannot
    diverge. Returns None when even `hi` falls short.
    """
    if target <= 0:
        raise ProjectionError("target must be > 0")
    probe = lambda n: settles_at(_with_observers(inputs, n))  # noqa: E731
    if probe(hi) < target:
        return None
    for _ in range(60):
        mid = (lo + hi) / 2
        if probe(mid) < target:
            lo = mid
        else:
            hi = mid
    return round(hi, 1)


def _with_observers(inputs: ModelInputs, n: float) -> ModelInputs:
    return ModelInputs(
        observers_per_month=n,
        upgrade_rate=inputs.upgrade_rate,
        annual_rate=inputs.annual_rate,
        navigator_share=inputs.navigator_share,
        activator_churn=inputs.activator_churn,
        navigator_churn=inputs.navigator_churn,
        observer_revenue=inputs.observer_revenue,
        activator_price=inputs.activator_price,
        navigator_price=inputs.navigator_price,
        annual_price=inputs.annual_price,
        start_activators=inputs.start_activators,
        start_navigators=inputs.start_navigators,
    )
