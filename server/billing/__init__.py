"""FatTail Labs native billing engine.

Spec: Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md

Labs owns the subscription: the plan, the schedule, the retry ladder, the grace
window and the money ledger. Stripe and PayPal hold only a reusable
authorization and charge it when this package tells them to.

    billing.worker     the renewal cycle          python -m billing.worker
    billing.ledger     the ONLY writer of billing_charges
    billing.periods    pure date arithmetic
    billing.recovery   crash recovery + nightly reconciliation
    billing.webhooks   durable, de-duplicated provider event ingestion
    billing.providers  Stripe / PayPal adapters

Config-gated: with no provider credentials the package imports cleanly and every
entry point reports disabled. The standalone guarantee holds.
"""
