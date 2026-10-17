"""Provider event processing.  Spec §6.3 / §6.4.

Webhooks are how a provider tells us what really happened. They are the only
trustworthy word on an async capture, a dispute, or a 3DS confirmation the
member completed on their own time.

THREE RULES, all learned the hard way elsewhere in this estate:

1. PERSIST BEFORE PROCESSING. The event is stored and acknowledged first; the
   work happens after. Providers retry aggressively and Stripe disables
   endpoints that fail repeatedly, so storage is the acknowledgement.

2. ORDER IS NOT GUARANTEED. A `deleted` can arrive before the `updated` that
   preceded it. Every handler compares against what we already know and refuses
   to move a charge backwards — §6.4.

3. AN EVENT NEVER INVENTS A CHARGE. It can only settle one we already opened.
   If there is no matching ledger row the event is recorded and ignored, loudly.
   This matters doubly here: Stripe fans account-level events to EVERY endpoint,
   so this handler will also receive events from WooCommerce's own charges on
   the shared account. Those have no Labs ledger row and must be left alone.
"""

from __future__ import annotations

import logging

from billing import ledger

log = logging.getLogger("labs.billing.events")

# Stripe event -> what it means for a charge we opened.
_STRIPE_TERMINAL = {
    "payment_intent.succeeded": ledger.SUCCEEDED,
    "payment_intent.payment_failed": ledger.FAILED,
    "payment_intent.canceled": ledger.ABANDONED,
}
_PAYPAL_TERMINAL = {
    "PAYMENT.CAPTURE.COMPLETED": ledger.SUCCEEDED,
    "PAYMENT.CAPTURE.DENIED": ledger.FAILED,
    "PAYMENT.CAPTURE.REVERSED": ledger.FAILED,
}


def _charge_by_ref(cur, provider: str, *refs: str) -> dict | None:
    """Find OUR ledger row for a provider reference. None means the event is
    about something we did not charge — almost certainly WooCommerce."""
    for ref in [r for r in refs if r]:
        cur.execute(
            """SELECT * FROM billing_charges
                WHERE provider=%s AND (provider_charge_ref=%s OR provider_intent_ref=%s)
                ORDER BY id DESC LIMIT 1""",
            (provider, ref, ref))
        row = cur.fetchone()
        if row:
            return row
    return None


def _advance_subscription(cur, charge: dict) -> None:
    """A charge settling succeeded out-of-band still has to move the schedule on,
    or the worker will try the same period again."""
    if not charge["subscription_id"]:
        return
    cur.execute("SELECT * FROM billing_subscriptions WHERE id=%s", (charge["subscription_id"],))
    sub = cur.fetchone()
    if not sub or int(sub["period_index"]) > int(charge["period_index"]):
        return     # already advanced past this period — nothing to do
    from billing import periods
    nxt = periods.Schedule(
        anchor_at=sub["anchor_at"], interval_unit=sub["interval_unit"],
        interval_count=sub["interval_count"], period_index=int(charge["period_index"]) + 1,
        ends_at=sub["ends_at"], max_periods=sub["max_periods"])
    cur.execute(
        """UPDATE billing_subscriptions
              SET period_index=%s, current_period_start=%s, next_charge_at=%s,
                  status=%s, retry_count=0, next_retry_at=NULL
            WHERE id=%s""",
        (nxt.period_index, nxt.period_start(), nxt.next_charge_at(),
         "expired" if nxt.is_terminal() else "active", sub["id"]))


def handle_stripe(cur, event: dict) -> str:
    kind = event.get("type") or ""
    obj = ((event.get("data") or {}).get("object")) or {}
    pi_id = obj.get("id", "")

    if kind in _STRIPE_TERMINAL:
        charge = _charge_by_ref(cur, "stripe", pi_id)
        if charge is None:
            # Shared Stripe account: this is almost certainly a WooCommerce
            # charge. Recorded, not acted on.
            return f"ignored {kind}: no Labs ledger row for {pi_id}"
        target = _STRIPE_TERMINAL[kind]
        if charge["status"] in (ledger.SUCCEEDED, ledger.FAILED, ledger.ABANDONED):
            return f"already {charge['status']}, ignoring {kind} (§6.4)"
        err = obj.get("last_payment_error") or {}
        ledger.settle(cur, charge["id"], target,
                      charge_ref=pi_id if target == ledger.SUCCEEDED else "",
                      intent_ref=pi_id,
                      decline_code=err.get("decline_code") or err.get("code") or "",
                      message=f"webhook {kind}")
        if target == ledger.SUCCEEDED:
            _advance_subscription(cur, charge)
        return f"charge {charge['id']} -> {target}"

    if kind == "payment_intent.requires_action":
        charge = _charge_by_ref(cur, "stripe", pi_id)
        if charge and charge["status"] in (ledger.INTENT, ledger.PROCESSING):
            ledger.settle(cur, charge["id"], ledger.REQUIRES_ACTION,
                          intent_ref=pi_id, message="3DS required")
            return f"charge {charge['id']} -> requires_action"
        return "ignored requires_action"

    if kind == "charge.refunded":
        pi = obj.get("payment_intent", "")
        charge = _charge_by_ref(cur, "stripe", pi, obj.get("id", ""))
        return f"refund noted for charge {charge['id']}" if charge else "ignored refund"

    if kind.startswith("charge.dispute."):
        pi = (obj.get("payment_intent") or "")
        charge = _charge_by_ref(cur, "stripe", pi)
        if charge:
            # §7.11 — never auto-revoke access. Alert and let a human decide; a
            # dispute is often a confused member, and auto-revoking guarantees
            # escalation.
            log.error("DISPUTE on charge %s (%s) — access NOT revoked, review needed",
                      charge["id"], pi)
            return f"dispute recorded on charge {charge['id']} — ALERT"
        return "ignored dispute (not ours)"

    if kind == "payment_method.automatically_updated":
        # §7.8 — the card updater replaced a card for us. Free churn prevention.
        return "card auto-updated by Stripe"

    return f"ignored {kind}"


def handle_paypal(cur, event: dict) -> str:
    kind = event.get("event_type") or ""
    res = event.get("resource") or {}
    cap_id = res.get("id", "")
    invoice = res.get("invoice_id", "")

    if kind in _PAYPAL_TERMINAL:
        charge = _charge_by_ref(cur, "paypal", cap_id)
        if charge is None and invoice:
            # invoice_id IS our idempotency key (§6.2) — the permanent link
            # back to the ledger row even when the capture id is new to us.
            cur.execute("""SELECT * FROM billing_charges
                            WHERE provider='paypal' AND idempotency_key=%s
                            ORDER BY id DESC LIMIT 1""", (invoice,))
            charge = cur.fetchone()
        if charge is None:
            return f"ignored {kind}: no Labs ledger row for {cap_id}/{invoice}"
        target = _PAYPAL_TERMINAL[kind]
        if charge["status"] in (ledger.SUCCEEDED, ledger.FAILED, ledger.ABANDONED):
            return f"already {charge['status']}, ignoring {kind} (§6.4)"
        ledger.settle(cur, charge["id"], target,
                      charge_ref=cap_id if target == ledger.SUCCEEDED else "",
                      message=f"webhook {kind}")
        if target == ledger.SUCCEEDED:
            _advance_subscription(cur, charge)
        return f"charge {charge['id']} -> {target}"

    if kind == "VAULT.PAYMENT-TOKEN.DELETED":
        # The member revoked us from inside their own PayPal account, with no
        # warning. Without this event the first we would know is a failed
        # renewal (§6.2). Mark the method dead and put them in grace so the
        # dunning sequence asks them to reconnect.
        token = res.get("id", "")
        cur.execute("UPDATE billing_payment_methods SET status='revoked' "
                    "WHERE provider='paypal' AND method_ref=%s", (token,))
        cur.execute("""UPDATE billing_subscriptions s
                         JOIN billing_payment_methods m ON m.id = s.payment_method_id
                          SET s.status='grace'
                        WHERE m.provider='paypal' AND m.method_ref=%s
                          AND s.status='active'""", (token,))
        log.warning("PayPal token %s revoked by the member — subscriptions moved to grace", token)
        return f"vault token {token} revoked -> grace"

    if kind == "CUSTOMER.DISPUTE.CREATED":
        log.error("PAYPAL DISPUTE %s — access NOT revoked, review needed", res.get("dispute_id", ""))
        return "dispute recorded — ALERT"

    if kind == "PAYMENT.CAPTURE.REFUNDED":
        return "refund noted"

    return f"ignored {kind}"
