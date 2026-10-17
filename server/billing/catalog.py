"""The checkout catalog — product id -> plan, price, and billing shape.

Spec: Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md §8.1, §16

WHY THIS EXISTS. The Front Door checkout
(Specs/FatTail-Labs-Front-Door-Checkout-Spec-v0_1.md) knows each product's plan
and an access term in DAYS, and the prices live in web/lib/frontDoor/offers.json
— a front-end file. So today the server cannot answer "what does this cost?",
which is fine while CK-SIM means nothing is charged, and not fine the moment a
real charge happens.

Prices must be server-side and authoritative. The browser sends a product id and
nothing else (CK-CARD), so a tampered client cannot change what it pays.

DAYS vs INTERVAL. The Front Door grants N days of access. Billing renews on an
interval. They are two views of the same thing and must not drift:

    term_days  is what the MEMBERSHIP row gets, so access expiry keeps working
               exactly as the Front Door spec describes
    interval   is what the SUBSCRIPTION renews on

For a renewing product the membership end date is pushed forward by each
successful charge, so "31 days" stops being a one-off grant and becomes "paid
up until the next charge succeeds". A member who cancels in week 2 of Observer
then loses access at the end of week 3 — the period they paid for — rather than
keeping the full 42 days they did not.

PRICES verified 2026-10-16 against the live WooCommerce products and against
offers.json. They agree. If they ever disagree, WooCommerce is not the authority
for a Labs checkout — this file is — but a disagreement means someone changed a
price in one place only, and that is worth stopping for.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Product:
    product_id: str          # what the Front Door sends
    name: str
    plan_slug: str           # Labs plans.slug
    amount_minor: int        # authoritative price, in cents
    currency: str = "USD"
    interval_unit: str | None = None   # None => one-off, no renewal
    interval_count: int = 1
    max_periods: int | None = None     # finite term (Observer)
    term_days: int | None = None       # membership access window per period
    regular_amount_minor: int | None = None   # struck-through anchor, display only

    @property
    def is_recurring(self) -> bool:
        return self.interval_unit is not None

    @property
    def total_commitment_minor(self) -> int:
        """What the member will pay in total if they run the full term.
        Observer is $17 x 6 = $102, which is the number the chooser shows."""
        if self.max_periods:
            return self.amount_minor * self.max_periods
        return self.amount_minor


# Order matters: this is the order the chooser presents (CK-CATALOG).
PRODUCTS: dict[str, Product] = {
    "observer": Product(
        product_id="observer", name="Observer", plan_slug="observer-trial",
        amount_minor=1700, interval_unit="week", interval_count=1,
        max_periods=6, term_days=42,
    ),
    "navigator-monthly": Product(
        product_id="navigator-monthly", name="Navigator Monthly", plan_slug="navigator",
        amount_minor=26700, interval_unit="month", interval_count=1, term_days=31,
    ),
    "quarterly": Product(
        product_id="quarterly", name="Navigator Quarterly", plan_slug="navigator",
        amount_minor=59700, regular_amount_minor=80100,
        interval_unit="month", interval_count=3, term_days=92,
    ),
    "navigator-annual": Product(
        product_id="navigator-annual", name="Navigator Annual", plan_slug="navigator",
        amount_minor=199700, regular_amount_minor=299700,
        interval_unit="year", interval_count=1, term_days=366,
    ),
    "navigator-lifetime": Product(
        product_id="navigator-lifetime", name="Navigator Lifetime", plan_slug="navigator",
        amount_minor=300000, regular_amount_minor=499700,
        interval_unit=None, term_days=None,      # one-off, never renews
    ),
}

# Public link aliases accepted on /access/order (CK-CATALOG).
ALIASES = {
    "trial": "observer",
    "monthly": "navigator-monthly",
    "quarterly": "quarterly",
    "annual": "navigator-annual",
    "lifetime": "navigator-lifetime",
}


class UnknownProduct(KeyError):
    pass


def resolve(product_id: str) -> Product:
    """Product id or public alias -> Product. Raises UnknownProduct.

    The canonical id is what gets stored, never the alias (CK-CATALOG)."""
    key = (product_id or "").strip().lower()
    key = ALIASES.get(key, key)
    try:
        return PRODUCTS[key]
    except KeyError as exc:
        raise UnknownProduct(product_id) from exc


def as_catalog() -> list[dict]:
    """Serialisable catalog for the checkout UI. Includes the total commitment so
    the chooser never has to multiply a price by a term itself."""
    return [
        {
            "id": p.product_id, "name": p.name, "plan": p.plan_slug,
            "amount_minor": p.amount_minor, "currency": p.currency,
            "regular_amount_minor": p.regular_amount_minor,
            "interval_unit": p.interval_unit, "interval_count": p.interval_count,
            "max_periods": p.max_periods, "term_days": p.term_days,
            "recurring": p.is_recurring,
            "total_commitment_minor": p.total_commitment_minor,
        }
        for p in PRODUCTS.values()
    ]


def assert_matches_front_door(front_door_products: dict) -> list[str]:
    """Cross-check this catalog against the Front Door's PRODUCTS table.

    Two tables describing the same five products will drift. This returns the
    disagreements so a test can fail loudly rather than a member being granted
    one thing and billed another.
    """
    problems: list[str] = []
    for pid, fd in front_door_products.items():
        try:
            p = resolve(pid)
        except UnknownProduct:
            problems.append(f"{pid}: in the Front Door but not in the billing catalog")
            continue
        if fd.get("plan") != p.plan_slug:
            problems.append(f"{pid}: plan {fd.get('plan')!r} vs {p.plan_slug!r}")
        if fd.get("days") != p.term_days:
            problems.append(f"{pid}: term {fd.get('days')} days vs {p.term_days}")
    for pid in PRODUCTS:
        if pid not in front_door_products:
            problems.append(f"{pid}: in the billing catalog but not in the Front Door")
    return problems
