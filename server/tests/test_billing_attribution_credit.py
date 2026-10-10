"""Billing webhook attribution/credit logic (routes/billing.py).

LK Phase 3a/3b: checkout.session.completed attribution and the
customer.subscription.created-only referral credit award. These go
through the real POST /api/billing/webhook endpoint — including real
Stripe-Signature HMAC verification — not the private helper functions
(_attribute_checkout / _award_referral_credit / _handle_subscription)
directly; signature verification and the event-type dispatch in
stripe_webhook() are production code paths worth exercising for real,
not stood in for.

STRIPE_WEBHOOK_SECRET is not configured in this dev .env (no live
Stripe webhook exists yet to point at it), so each test sets a
test-only secret via monkeypatch + config.reset_config_for_tests(),
the same pattern test_rate_limit_m1.py uses for env-driven config.

links/link_markers/link_attributions/credit_tier_rules carry no FK to
links (migrations/156_attribution.sql, 157_affiliates.sql), so probe
links are inserted directly rather than through links.store (which
would make a real reachability check for no reason here).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid

import db
import pytest

from config import reset_config_for_tests
from links.attribution import mint_marker
from links.credits import balance

SLUG_A = "zztsta"
SLUG_B = "zztstb"
SLUGS = (SLUG_A, SLUG_B)
WEBHOOK_SECRET = "zztest_webhook_secret"


def _ref(prefix: str) -> str:
    return f"zztest-{prefix}-{uuid.uuid4().hex[:8]}"


@pytest.fixture(autouse=True)
def webhook_secret(monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)
    reset_config_for_tests()
    yield WEBHOOK_SECRET
    reset_config_for_tests()


@pytest.fixture()
def identities():
    import identity as identity_mod

    with db.transaction() as conn:
        with conn.cursor() as cur:
            owner = identity_mod.get_or_create_identity(
                cur, f"zztest-bill-owner-{uuid.uuid4().hex[:8]}@labs.test", "ZZ Bill Owner"
            )
            purchaser = identity_mod.get_or_create_identity(
                cur, f"zztest-bill-purchaser-{uuid.uuid4().hex[:8]}@labs.test", "ZZ Bill Purchaser"
            )
    yield {"owner": owner, "purchaser": purchaser}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            ids = (owner, purchaser)
            marks = ",".join(["%s"] * len(ids))
            cur.execute(f"DELETE FROM credit_events WHERE identity_id IN ({marks})", ids)
            cur.execute(f"DELETE FROM identities WHERE identity_id IN ({marks})", ids)


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marks = ",".join(["%s"] * len(SLUGS))
            cur.execute(f"DELETE FROM link_markers WHERE slug IN ({marks})", SLUGS)
            cur.execute(f"DELETE FROM link_attributions WHERE slug IN ({marks})", SLUGS)
            cur.execute(f"DELETE FROM links WHERE slug IN ({marks})", SLUGS)
            cur.execute("DELETE FROM credit_tier_rules WHERE price_id LIKE 'zztest-%'")


def _make_link(cur, slug: str, owner: int | None = None) -> None:
    cur.execute(
        """
        INSERT INTO links (slug, destination, label, active, `static`, owner)
        VALUES (%s, %s, %s, 1, 0, %s)
        ON DUPLICATE KEY UPDATE owner = VALUES(owner)
        """,
        (slug, "https://example.com/zztest-billing", f"zztest-billing-{slug}", str(owner) if owner else None),
    )


def _sign(body: bytes, secret: str) -> str:
    ts = str(int(time.time()))
    signed_payload = f"{ts}.{body.decode()}".encode()
    sig = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


def _post_event(client, event_type: str, obj: dict, secret: str):
    event = {
        "id": f"evt_{uuid.uuid4().hex[:16]}",
        "object": "event",
        "type": event_type,
        "data": {"object": obj},
    }
    body = json.dumps(event).encode()
    return client.post(
        "/api/billing/webhook",
        content=body,
        headers={"Stripe-Signature": _sign(body, secret), "Content-Type": "application/json"},
    )


def _checkout_completed(*, session_id, identity_id, marker=None, amount_total=4900, currency="usd"):
    metadata = {"identity_id": str(identity_id)}
    if marker:
        metadata["marker"] = marker
    return {
        "id": session_id,
        "object": "checkout.session",
        "metadata": metadata,
        "amount_total": amount_total,
        "currency": currency,
    }


def _subscription(*, sub_id, identity_id, price_id, marker=None, status="active"):
    metadata = {"identity_id": str(identity_id)}
    if marker:
        metadata["marker"] = marker
    return {
        "id": sub_id,
        "object": "subscription",
        "customer": "",
        "metadata": metadata,
        "items": {"object": "list", "data": [{"price": {"object": "price", "id": price_id}}]},
        "status": status,
    }


# --- signature verification --------------------------------------------------


def test_webhook_rejects_bad_signature(client):
    body = json.dumps({"id": "evt_zztest", "object": "event", "type": "ping", "data": {"object": {}}}).encode()
    r = client.post(
        "/api/billing/webhook",
        content=body,
        headers={"Stripe-Signature": "t=1,v1=deadbeef", "Content-Type": "application/json"},
    )
    assert r.status_code == 400


# --- checkout.session.completed -> link attribution (AF-L1/AF-L2, D8) -------


def test_checkout_completed_noop_without_marker(client, identities, webhook_secret):
    obj = _checkout_completed(session_id=_ref("cs"), identity_id=identities["purchaser"])
    r = _post_event(client, "checkout.session.completed", obj, webhook_secret)
    assert r.status_code == 200
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS n FROM link_attributions WHERE external_ref = %s", (obj["id"],)
            )
            assert cur.fetchone()["n"] == 0


def test_checkout_completed_attributes_and_redelivery_is_idempotent(client, identities, webhook_secret):
    ref = _ref("cs")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG_A)
    obj = _checkout_completed(session_id=ref, identity_id=identities["purchaser"], marker=marker)

    first = _post_event(client, "checkout.session.completed", obj, webhook_secret)
    assert first.status_code == 200, first.text
    assert "attributed" in first.json()["result"]

    # Stripe redelivers the same event.
    second = _post_event(client, "checkout.session.completed", obj, webhook_secret)
    assert second.status_code == 200
    assert second.json()["result"] == "attribution already recorded"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS n, identity_id, amount_cents FROM link_attributions "
                "WHERE external_ref = %s GROUP BY identity_id, amount_cents",
                (ref,),
            )
            row = cur.fetchone()
    assert row["n"] == 1
    assert row["identity_id"] == identities["purchaser"]
    assert row["amount_cents"] == 4900


# --- customer.subscription.created -> referral credit (AF-L9) --------------


def test_subscription_created_awards_credit_to_link_owner(client, identities, webhook_secret):
    price_id = f"zztest-price-{uuid.uuid4().hex[:8]}"
    sub_id = _ref("sub")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_A, owner=identities["owner"])
            marker = mint_marker(cur, SLUG_A)
            cur.execute(
                "INSERT INTO credit_tier_rules (price_id, credits, label) VALUES (%s, %s, %s)",
                (price_id, 10, "zztest-annual"),
            )
    sub = _subscription(
        sub_id=sub_id, identity_id=identities["purchaser"], price_id=price_id, marker=marker
    )
    r = _post_event(client, "customer.subscription.created", sub, webhook_secret)
    assert r.status_code == 200, r.text
    assert "10 credits" in r.json()["result"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 10
            assert balance(cur, identities["purchaser"]) == 0


def test_subscription_updated_does_not_award_credit(client, identities, webhook_secret):
    """Only the first customer.subscription.created delivery awards a
    referral credit — .updated and .deleted deliveries for the same
    subscription must not (D13/AF-L9: once per earned subscription)."""
    price_id = f"zztest-price-{uuid.uuid4().hex[:8]}"
    sub_id = _ref("sub")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_B, owner=identities["owner"])
            marker = mint_marker(cur, SLUG_B)
            cur.execute(
                "INSERT INTO credit_tier_rules (price_id, credits, label) VALUES (%s, %s, %s)",
                (price_id, 10, "zztest-annual"),
            )
    sub = _subscription(
        sub_id=sub_id, identity_id=identities["purchaser"], price_id=price_id, marker=marker
    )
    r = _post_event(client, "customer.subscription.updated", sub, webhook_secret)
    assert r.status_code == 200, r.text
    assert r.json()["result"] == f"unmapped price {price_id}"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 0


def test_subscription_created_redelivery_does_not_double_award(client, identities, webhook_secret):
    price_id = f"zztest-price-{uuid.uuid4().hex[:8]}"
    sub_id = _ref("sub")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_A, owner=identities["owner"])
            marker = mint_marker(cur, SLUG_A)
            cur.execute(
                "INSERT INTO credit_tier_rules (price_id, credits, label) VALUES (%s, %s, %s)",
                (price_id, 10, "zztest-annual"),
            )
    sub = _subscription(
        sub_id=sub_id, identity_id=identities["purchaser"], price_id=price_id, marker=marker
    )
    first = _post_event(client, "customer.subscription.created", sub, webhook_secret)
    assert "10 credits" in first.json()["result"]

    # Stripe redelivers customer.subscription.created with the same id.
    second = _post_event(client, "customer.subscription.created", sub, webhook_secret)
    assert "credit already awarded" in second.json()["result"]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 10


def test_subscription_created_self_referral_is_flagged_not_blocked(client, identities, webhook_secret):
    price_id = f"zztest-price-{uuid.uuid4().hex[:8]}"
    sub_id = _ref("sub")
    owner = identities["owner"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_A, owner=owner)
            marker = mint_marker(cur, SLUG_A)
            cur.execute(
                "INSERT INTO credit_tier_rules (price_id, credits, label) VALUES (%s, %s, %s)",
                (price_id, 1, "zztest-observer"),
            )
    # The link owner buys through their own link.
    sub = _subscription(sub_id=sub_id, identity_id=owner, price_id=price_id, marker=marker)
    r = _post_event(client, "customer.subscription.created", sub, webhook_secret)
    assert "self-referral, flagged" in r.json()["result"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT self_referral FROM credit_events WHERE identity_id=%s AND external_ref=%s",
                (owner, sub_id),
            )
            row = cur.fetchone()
    assert bool(row["self_referral"]) is True
