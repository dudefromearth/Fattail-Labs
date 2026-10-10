"""Credit ledger (LK Phase 3b — see
Specs/Links-Attribution-Affiliates-Spec-v0_2.md). Store credit toward
the credit-holder's own next membership tier, never cash, never a
discount for anyone else (AF-L10). Balance is always derived by
summing credit_events — no separate balance field to drift (AF-L9).
"""

from __future__ import annotations

import pymysql

CREDIT_VALUE_CENTS = 2500  # $25/credit — proposed default, Coach-adjustable (not law)


def tier_rule(cur, price_id: str) -> dict | None:
    """Keyed by Stripe price, not plan/role — Annual vs Lifetime Navigator
    are the same role (plans.grants_role) but different prices, and a
    billing-term distinction can only exist at that level."""
    cur.execute("SELECT price_id, credits, label FROM credit_tier_rules WHERE price_id=%s", (price_id,))
    return cur.fetchone()


def balance(cur, identity_id: int) -> int:
    cur.execute(
        "SELECT COALESCE(SUM(delta), 0) AS n FROM credit_events WHERE identity_id=%s",
        (identity_id,),
    )
    return int(cur.fetchone()["n"])


def award_credit(
    cur,
    *,
    identity_id: int,
    credits: int,
    reason: str,
    external_ref: str,
    attribution_id: int | None,
    self_referral: bool,
) -> bool:
    """Idempotent on (identity_id, reason, external_ref) — external_ref is
    the Stripe subscription id (the object customer.subscription.created
    actually carries; attribution_id may not exist yet when this fires,
    Stripe does not order these two webhooks). Returns False, not an
    error, on a redelivered event."""
    try:
        cur.execute(
            """
            INSERT INTO credit_events (
                identity_id, delta, reason, attribution_id, external_ref, self_referral, occurred_at
            ) VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(6))
            """,
            (identity_id, credits, reason, attribution_id, external_ref, 1 if self_referral else 0),
        )
        return True
    except pymysql.err.IntegrityError:
        return False


def spend_credit(cur, *, identity_id: int, credits: int, checkout_session_id: str) -> bool:
    """Records a redemption. Never spends more than the current balance —
    caller must have already capped the offered discount at balance."""
    if credits <= 0:
        return False
    try:
        cur.execute(
            """
            INSERT INTO credit_events (
                identity_id, delta, reason, external_ref, occurred_at
            ) VALUES (%s, %s, 'redeem', %s, UTC_TIMESTAMP(6))
            """,
            (identity_id, -abs(credits), checkout_session_id),
        )
        return True
    except pymysql.err.IntegrityError:
        return False
