"""Stripe merchant-initiated billing.  Spec §6.1.

Stripe is the payment PROCESSOR here, fully integrated. What is NOT used is
Stripe BILLING — no Subscriptions, Prices, Invoices or Customer Portal — because
that is the layer that would own the schedule, and Labs owning the schedule is
the point of v2.0 (§0.2). The restricted key should not even grant Subscriptions.

This is exactly the relationship WooCommerce already has with Stripe today.
"""

from __future__ import annotations

import logging

import stripe

from billing.providers.base import (
    ChargeResult, ProviderError, RefundResult,
    HARD_DECLINE, PENDING, REQUIRES_ACTION, SOFT_DECLINE, SUCCEEDED,
    classify,
)

log = logging.getLogger("labs.billing.stripe")

# stripe-python moved exceptions to the top level in v7 and kept stripe.error as
# a deprecated alias. Resolve once, defensively, so this works across 11..12.
_CardError = getattr(stripe, "CardError", None) or stripe.error.CardError
_StripeError = getattr(stripe, "StripeError", None) or stripe.error.StripeError
_ConnErr = getattr(stripe, "APIConnectionError", None) or stripe.error.APIConnectionError
_RateErr = getattr(stripe, "RateLimitError", None) or stripe.error.RateLimitError
_ApiErr = getattr(stripe, "APIError", None) or stripe.error.APIError


def build_payment_intent_params(*, customer_ref: str, method_ref: str,
                                amount_minor: int, currency: str,
                                descriptor: str = "",
                                metadata: dict | None = None,
                                off_session: bool = True) -> dict:
    """The exact PaymentIntent body. Pure, so the shape is unit-testable without
    a network or a key.

    TWO DIFFERENT CHARGES, and conflating them is a real bug:

    off_session=True  — a RENEWAL. The member is not here. `off_session` plus
        `confirm` is what makes it merchant-initiated; drop either and Stripe
        expects a browser, and every renewal fails.

    off_session=False — the FIRST charge at checkout. The member IS here, so
        3DS can challenge them interactively and succeed, instead of coming
        back later as requires_action and an email. It also sets
        setup_future_usage=off_session, which is what earns the mandate that
        makes later renewals work at all. Skipping it means the card is saved
        but not authorised for unattended use.
    """
    if not isinstance(amount_minor, int) or isinstance(amount_minor, bool):
        raise TypeError("amount_minor must be int minor units")
    params = {
        "amount": amount_minor,
        "currency": currency.lower(),
        "customer": customer_ref,
        "payment_method": method_ref,
        "confirm": True,
        "metadata": dict(metadata or {}),
    }
    if off_session:
        params["off_session"] = True
    else:
        params["setup_future_usage"] = "off_session"
    if descriptor:
        params["description"] = descriptor[:350]
    return params


class StripeProvider:
    name = "stripe"

    def __init__(self, secret_key: str):
        if not secret_key:
            raise ValueError("StripeProvider requires a secret key")
        self._key = secret_key

    # --- charge ---------------------------------------------------------------

    def charge(self, *, customer_ref: str, method_ref: str, amount_minor: int,
               currency: str, idempotency_key: str, descriptor: str = "",
               metadata: dict | None = None, off_session: bool = True) -> ChargeResult:
        """One off-session charge against a saved PaymentMethod.

        IDEMPOTENCY, AND ITS LIMIT: Stripe keys expire after 24 HOURS. A retry of
        the same period more than a day later is NOT deduped by Stripe. That is
        precisely why uq_chg_period_attempt (§4.3) is the primary defence and this
        key is only the intra-day secondary. Never invert that reliance.
        """
        params = build_payment_intent_params(
            customer_ref=customer_ref, method_ref=method_ref,
            amount_minor=amount_minor, currency=currency,
            descriptor=descriptor, metadata=metadata, off_session=off_session)
        try:
            pi = stripe.PaymentIntent.create(
                api_key=self._key, idempotency_key=idempotency_key, **params
            )
        except _CardError as exc:
            return self._from_card_error(exc)
        except (_ConnErr, _RateErr) as exc:
            # §7.15 — transport, NOT a decline.
            raise ProviderError(f"stripe transport: {exc}") from exc
        except _ApiErr as exc:
            raise ProviderError(f"stripe api error: {exc}") from exc
        except _StripeError as exc:
            # Anything else (invalid request, auth) is a real fault worth seeing.
            log.error("stripe charge failed key=%s: %s", idempotency_key, exc)
            raise ProviderError(f"stripe: {exc}") from exc
        return self._from_intent(pi)

    def _from_intent(self, pi) -> ChargeResult:
        status = pi.get("status")
        ref = pi.get("id", "")
        if status == "succeeded":
            return ChargeResult(SUCCEEDED, charge_ref=ref, intent_ref=ref, raw=dict(pi))
        if status == "processing":
            return ChargeResult(PENDING, charge_ref=ref, intent_ref=ref, raw=dict(pi))
        if status in ("requires_action", "requires_confirmation", "requires_source_action"):
            return ChargeResult(REQUIRES_ACTION, intent_ref=ref,
                                message="customer authentication required", raw=dict(pi))
        if status == "requires_payment_method":
            err = (pi.get("last_payment_error") or {})
            code = err.get("decline_code") or err.get("code") or ""
            outcome = classify(code) if code else SOFT_DECLINE
            if outcome is REQUIRES_ACTION:
                outcome = SOFT_DECLINE
            return ChargeResult(outcome, intent_ref=ref, decline_code=code,
                                message=err.get("message", "payment method declined"),
                                raw=dict(pi))
        return ChargeResult(SOFT_DECLINE, intent_ref=ref,
                            message=f"unexpected status {status}", raw=dict(pi))

    def _from_card_error(self, exc) -> ChargeResult:
        err = getattr(exc, "error", None)
        code = (getattr(err, "decline_code", None) or getattr(exc, "code", None) or "")
        pi = getattr(err, "payment_intent", None) or {}
        intent_ref = (pi or {}).get("id", "") if isinstance(pi, dict) else getattr(pi, "id", "")
        outcome = classify(code)
        if code == "authentication_required":
            # §7.6 — 3DS is NOT a decline. No retry counted; the member confirms.
            return ChargeResult(REQUIRES_ACTION, intent_ref=intent_ref,
                                decline_code=code, message=str(exc))
        return ChargeResult(outcome if outcome in (SOFT_DECLINE, HARD_DECLINE) else SOFT_DECLINE,
                            intent_ref=intent_ref, decline_code=code, message=str(exc))

    # --- recovery -------------------------------------------------------------

    def lookup(self, *, idempotency_key: str,
               charge_ref: str | None = None) -> ChargeResult | None:
        """§7.2 — 'did this actually charge?'

        Two routes, because Stripe's idempotency replay only lasts 24h:
          1. a known PaymentIntent id -> retrieve it directly
          2. otherwise search by the labs_charge_id we stamped into metadata,
             which has no expiry

        Returns None for 'cannot say', which must quarantine, never retry.
        """
        try:
            if charge_ref:
                pi = stripe.PaymentIntent.retrieve(charge_ref, api_key=self._key)
                return self._from_intent(pi)
            labs_id = idempotency_key.rsplit(":", 2)[0] if ":" in idempotency_key else None
            res = stripe.PaymentIntent.search(
                api_key=self._key,
                query=f'metadata["idempotency_key"]:"{idempotency_key}"',
                limit=1,
            )
            data = res.get("data") or []
            if data:
                return self._from_intent(data[0])
            log.warning("stripe lookup found nothing for %s (labs=%s)", idempotency_key, labs_id)
            return None
        except (_ConnErr, _RateErr, _ApiErr) as exc:
            log.error("stripe lookup transport failure: %s", exc)
            return None
        except _StripeError as exc:
            log.error("stripe lookup failed: %s", exc)
            return None

    # --- refunds --------------------------------------------------------------

    def refund(self, *, charge_ref: str, amount_minor: int,
               idempotency_key: str, reason: str = "") -> RefundResult:
        try:
            r = stripe.Refund.create(
                api_key=self._key, idempotency_key=idempotency_key,
                payment_intent=charge_ref, amount=amount_minor,
                **({"reason": reason} if reason in
                   ("duplicate", "fraudulent", "requested_by_customer") else {}),
            )
        except _StripeError as exc:
            return RefundResult(False, message=str(exc))
        return RefundResult(r.get("status") in ("succeeded", "pending"),
                            refund_ref=r.get("id", ""), message=r.get("status", ""))
