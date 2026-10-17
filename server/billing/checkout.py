"""First purchase — the join between the Front Door and the billing engine.

Spec: Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md §8.1
Front Door: Specs/FatTail-Labs-Front-Door-Checkout-Spec-v0_1.md §5-§6

The Front Door today simulates payment (CK-SIM) and then calls its grant. This
module is what replaces the simulation: it takes the product the member chose
and a tokenised payment method, charges them once with the member present, and
creates the subscription that will renew.

It deliberately does NOT write the membership. The Front Door's grant already
does that, correctly, with its own rules about prior_member and Discord sync
(CK-WRITE, CK-PRIOR). Duplicating that here would create a second place where
access can be granted, which is exactly the dual-write problem §7.13 exists to
prevent. Instead this returns `membership_ends_at` and the grant uses it.

ORDER OF OPERATIONS. The ledger row is committed BEFORE the provider is called,
the same as a renewal (§5.3). A crash between the two leaves an open intent that
recovery resolves by asking the provider — never a silent charge with no record.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

from billing import catalog, ledger, periods, providers

log = logging.getLogger("labs.billing.checkout")


@dataclass
class StartResult:
    ok: bool
    outcome: str                       # providers.SUCCEEDED / SOFT_DECLINE / ...
    subscription_id: int | None = None
    charge_id: int | None = None
    charge_ref: str = ""
    intent_ref: str = ""
    membership_ends_at: datetime | None = None   # for the Front Door's grant
    amount_minor: int = 0
    decline_code: str = ""
    message: str = ""


class CheckoutError(Exception):
    pass


class AlreadySubscribed(CheckoutError):
    """This identity is already being billed — refuse rather than charge twice."""


def _existing_billing(cur, identity_id: int) -> dict | None:
    """Is this member ALREADY being billed, by us or by WooCommerce?

    THE PARALLEL-RUN HAZARD (spec §7.13, corrected 2026-10-17). While Woo keeps
    billing its 171 subscriptions and Labs takes new signups, nothing otherwise
    stops a member with a live Woo subscription buying again here. They would be
    charged by BOTH systems for overlapping access, and each charge looks
    perfectly legitimate to the system that made it.

    It is the most expensive mistake available in this model — a double charge is
    a refund and a trust problem at once — and among the cheapest to prevent.

    Checked in two directions:
      1. a Labs billing subscription that is still live
      2. an active or grace membership from a WordPress source, i.e. Woo
    """
    cur.execute(
        """SELECT id, plan_id, status FROM billing_subscriptions
            WHERE identity_id = %s
              AND status IN ('active','past_due','grace','pending_cancel')
            LIMIT 1""",
        (identity_id,))
    row = cur.fetchone()
    if row:
        return {"where": "labs", "detail": f"billing subscription #{row['id']} ({row['status']})"}

    cur.execute(
        """SELECT m.source, p.slug FROM memberships m
             JOIN plans p ON p.id = m.plan_id
            WHERE m.identity_id = %s
              AND m.status IN ('active','grace')
              AND m.source LIKE 'wordpress:%%'
            LIMIT 1""",
        (identity_id,))
    row = cur.fetchone()
    if row:
        return {"where": "woocommerce",
                "detail": f"{row['slug']} membership from {row['source']}"}
    return None


def _plan_id(cur, slug: str) -> int:
    cur.execute("SELECT id FROM plans WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if not row:
        # 503 at the route, matching the Front Door's CK-GRANT behaviour for a
        # missing plan row.
        raise CheckoutError(f"plan {slug!r} is not in the database")
    return int(row["id"])


def _remember_method(cur, *, identity_id: int, provider: str, customer_ref: str,
                     method_ref: str, kind: str = "card", brand: str = "",
                     last4: str = "", exp_month=None, exp_year=None) -> int:
    cur.execute(
        """INSERT INTO billing_payment_methods
             (identity_id, provider, customer_ref, method_ref, kind, brand, last4,
              exp_month, exp_year, is_default)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,1)
           ON DUPLICATE KEY UPDATE identity_id=VALUES(identity_id),
                                   customer_ref=VALUES(customer_ref),
                                   status='active'""",
        (identity_id, provider, customer_ref, method_ref, kind, brand, last4,
         exp_month, exp_year))
    cur.execute("SELECT id FROM billing_payment_methods WHERE provider=%s AND method_ref=%s",
                (provider, method_ref))
    return int(cur.fetchone()["id"])


def start(conn, *, identity_id: int, product_id: str, provider_name: str,
          customer_ref: str, method_ref: str, mode: str = "live",
          now: datetime | None = None, provider_for=None,
          allow_duplicate: bool = False) -> StartResult:
    """Charge the first payment and create the subscription.

    mode:
      live    charge for real
      shadow  do everything except call the provider (§10)
      off     refuse

    Returns a StartResult. The caller writes the membership using
    `membership_ends_at`; nothing here touches `memberships`.

    Raises AlreadySubscribed when the identity is already being billed — by Labs
    or by WooCommerce. `allow_duplicate=True` overrides, and exists only for an
    admin deliberately creating a second subscription. It should never be set
    from a member-facing path.
    """
    if mode == "off":
        raise CheckoutError("billing is off (LABS_BILLING_MODE=off)")
    product = catalog.resolve(product_id)      # raises UnknownProduct -> 422
    now = now or datetime.utcnow()

    # §7.13 — refuse BEFORE any money moves, not after.
    with conn.cursor() as cur:
        existing = _existing_billing(cur, identity_id)
    if existing and not allow_duplicate:
        log.warning("refusing duplicate purchase for identity=%s: %s",
                    identity_id, existing["detail"])
        raise AlreadySubscribed(
            "This account already has an active subscription "
            f"({existing['detail']}). Contact support to change plan rather than "
            "buying a second one.")

    # --- period + term --------------------------------------------------------
    if product.is_recurring:
        sched = periods.Schedule(
            anchor_at=now, interval_unit=product.interval_unit,
            interval_count=product.interval_count, period_index=0,
            max_periods=product.max_periods)
        period_start, period_end = sched.period_start(), sched.period_end()
        # Access runs to the end of the period just paid for — NOT the full term.
        # Cancelling in week 2 of Observer therefore ends access at week 3.
        membership_ends_at = period_end
        ends_at = (now + timedelta(days=product.term_days)) if product.term_days else None
    else:
        period_start = period_end = now
        membership_ends_at = None          # Lifetime: unlimited (CK-CATALOG)
        ends_at = None

    # --- durable intent, committed BEFORE the provider is called (§5.3) -------
    with conn.cursor() as cur:
        plan_id = _plan_id(cur, product.plan_slug)
        pm_id = _remember_method(cur, identity_id=identity_id, provider=provider_name,
                                 customer_ref=customer_ref, method_ref=method_ref,
                                 kind="paypal" if provider_name == "paypal" else "card")
        sub_id = None
        if product.is_recurring:
            cur.execute(
                """INSERT INTO billing_subscriptions
                     (identity_id, plan_id, status, provider, payment_method_id,
                      amount_minor, currency, amount_source, amount_locked,
                      interval_unit, interval_count, anchor_at, period_index,
                      current_period_start, next_charge_at, ends_at, max_periods,
                      discount_note)
                   VALUES (%s,%s,'active',%s,%s,%s,%s,'checkout',1,%s,%s,%s,0,%s,NULL,%s,%s,'')""",
                (identity_id, plan_id, provider_name, pm_id,
                 product.amount_minor, product.currency,
                 product.interval_unit, product.interval_count, now, period_start,
                 ends_at, product.max_periods))
            cur.execute("SELECT LAST_INSERT_ID() id")
            sub_id = int(cur.fetchone()["id"])

        charge = ledger.open_intent(
            cur, subscription_id=sub_id, identity_id=identity_id,
            provider=provider_name, period_start=period_start, period_end=period_end,
            period_index=0, attempt=1, amount_minor=product.amount_minor,
            currency=product.currency, shadow=(mode == "shadow"))
    conn.commit()        # ◀ the intent is durable before any money can move

    if mode == "shadow":
        return StartResult(True, providers.SUCCEEDED, sub_id, charge["id"],
                           membership_ends_at=membership_ends_at,
                           amount_minor=product.amount_minor,
                           message="shadow: no provider call")

    # --- the charge, with the member present ---------------------------------
    prov = (provider_for or providers.for_name)(provider_name)
    try:
        res = prov.charge(
            customer_ref=customer_ref, method_ref=method_ref,
            amount_minor=product.amount_minor, currency=product.currency,
            idempotency_key=charge["idempotency_key"],
            descriptor=f"FatTail {product.name}",
            metadata={"labs_charge_id": str(charge["id"]),
                      "product_id": product.product_id,
                      "idempotency_key": charge["idempotency_key"]},
            off_session=False,          # member is here: 3DS can challenge now
        )
    except providers.ProviderError as exc:
        # §7.15 — transport. The intent stays open for recovery; the member sees
        # a retryable error rather than a decline.
        log.error("checkout transport failure identity=%s: %s", identity_id, exc)
        return StartResult(False, providers.TRANSPORT_ERROR, sub_id, charge["id"],
                           amount_minor=product.amount_minor,
                           message="payment could not be completed, please try again")

    return _settle(conn, res, charge, sub_id, product, period_end,
                   membership_ends_at, now)


def _settle(conn, res, charge, sub_id, product, period_end,
            membership_ends_at, now) -> StartResult:
    with conn.cursor() as cur:
        if res.outcome == providers.SUCCEEDED:
            ledger.settle(cur, charge["id"], ledger.SUCCEEDED,
                          charge_ref=res.charge_ref, intent_ref=res.intent_ref)
            if sub_id:
                nxt = periods.Schedule(
                    anchor_at=now, interval_unit=product.interval_unit,
                    interval_count=product.interval_count, period_index=1,
                    max_periods=product.max_periods).next_charge_at()
                cur.execute(
                    """UPDATE billing_subscriptions
                          SET period_index=1, current_period_start=%s,
                              next_charge_at=%s, status='active'
                        WHERE id=%s""", (period_end, nxt, sub_id))
            conn.commit()
            return StartResult(True, res.outcome, sub_id, charge["id"],
                               charge_ref=res.charge_ref, intent_ref=res.intent_ref,
                               membership_ends_at=membership_ends_at,
                               amount_minor=product.amount_minor)

        if res.outcome == providers.PENDING:
            ledger.settle(cur, charge["id"], ledger.PROCESSING,
                          charge_ref=res.charge_ref, intent_ref=res.intent_ref)
            conn.commit()
            return StartResult(False, res.outcome, sub_id, charge["id"],
                               charge_ref=res.charge_ref,
                               amount_minor=product.amount_minor,
                               message="payment is still completing")

        if res.outcome == providers.REQUIRES_ACTION:
            ledger.settle(cur, charge["id"], ledger.REQUIRES_ACTION,
                          intent_ref=res.intent_ref, message=res.message)
            conn.commit()
            return StartResult(False, res.outcome, sub_id, charge["id"],
                               intent_ref=res.intent_ref,
                               amount_minor=product.amount_minor,
                               message="your bank needs to confirm this payment")

        # declined — the subscription exists but is not active, and no membership
        # is granted, because the caller only grants on ok=True.
        ledger.settle(cur, charge["id"], ledger.FAILED,
                      decline_code=res.decline_code, message=res.message)
        if sub_id:
            cur.execute("UPDATE billing_subscriptions SET status='past_due', "
                        "next_charge_at=NULL WHERE id=%s", (sub_id,))
        conn.commit()
    return StartResult(False, res.outcome, sub_id, charge["id"],
                       decline_code=res.decline_code,
                       amount_minor=product.amount_minor,
                       message="the card was declined" if res.decline_code else res.message)
