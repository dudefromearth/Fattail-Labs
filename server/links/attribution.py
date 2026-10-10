"""Attribution marker lifecycle (LK Phase 3a — see
Specs/Links-Attribution-Affiliates-Spec-v0_1.md).

Scoped to the native Stripe member-checkout path only. No WooCommerce,
no PayPal, no commission or payout math here (D8) — this module only
ever answers "which link, if any, is credited for this order."
"""

from __future__ import annotations

import pymysql

from links.marker import new_marker


def mint_marker(cur, slug: str) -> str:
    """A fresh marker for this link. Written whether or not it ever
    redeems into an order — first-touch semantics are enforced by the
    caller only minting when the visitor does not already carry one."""
    for _ in range(8):
        marker = new_marker()
        try:
            cur.execute(
                "INSERT INTO link_markers (marker, slug, issued_at) VALUES (%s, %s, UTC_TIMESTAMP(6))",
                (marker, slug),
            )
            return marker
        except pymysql.err.IntegrityError:
            continue
    raise RuntimeError("marker space exhausted")


def lookup_marker(cur, marker: str) -> dict | None:
    if not isinstance(marker, str) or not marker:
        return None
    cur.execute("SELECT marker, slug, issued_at FROM link_markers WHERE marker=%s", (marker,))
    return cur.fetchone()


def record_attribution(
    cur,
    *,
    marker: str,
    slug: str,
    identity_id: int,
    provider: str,
    external_ref: str,
    amount_cents: int | None,
    currency: str | None,
) -> bool:
    """Record one redeemed marker. Returns False (no-op, not an error) if
    this provider+external_ref was already recorded — webhooks can and do
    redeliver; attribution must not double-count an order."""
    try:
        cur.execute(
            """
            INSERT INTO link_attributions (
                marker, slug, identity_id, provider, external_ref,
                amount_cents, currency, occurred_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(6))
            """,
            (marker, slug, identity_id, provider, external_ref, amount_cents, currency),
        )
        return True
    except pymysql.err.IntegrityError:
        return False
