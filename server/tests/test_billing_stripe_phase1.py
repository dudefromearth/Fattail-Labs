"""Phase-one native Stripe billing verification (no live keys, no Stripe network).

Spec: Specs/FatTail-Labs-Native-Billing-Stripe-Spec-v1.0.md §5 "Now (no keys)".

Covers disabled mode, Stripe-Signature (SDK test header / v1 HMAC), a signed
simulated lifecycle (link → active → grace → expired/observer), and an
unmapped price that must not change membership.

Stripe API is never called. Webhook handling is the offline path in
routes/billing.py (signature check, then plain JSON). STRIPE_SECRET_KEY stays
unset. A test webhook secret is injected the same way as
test_billing_attribution_credit.py (monkeypatch + reset_config_for_tests).
"""

from __future__ import annotations

import json
import time
import uuid

import pytest
import stripe

import db
import identity as identity_mod
import providers
from config import get_config, reset_config_for_tests
from tests.conftest import cookie_for

WEBHOOK_SECRET = "zzphase1_webhook_secret_not_live"
PROVIDER = "stripe"


def _ref(prefix: str) -> str:
    return f"zzphase1-{prefix}-{uuid.uuid4().hex[:10]}"


@pytest.fixture()
def stripe_off(monkeypatch):
    """No Stripe key and no webhook secret — billing must not exist."""
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    reset_config_for_tests()
    cfg = get_config()
    assert cfg.stripe_secret_key is None
    assert cfg.stripe_webhook_secret is None
    yield
    reset_config_for_tests()


@pytest.fixture()
def webhook_secret(monkeypatch):
    """Signing secret only. No API key, so Price.retrieve / Checkout cannot run."""
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)
    reset_config_for_tests()
    assert get_config().stripe_secret_key is None
    assert get_config().stripe_webhook_secret == WEBHOOK_SECRET
    yield WEBHOOK_SECRET
    reset_config_for_tests()


@pytest.fixture()
def probe_member():
    """A fresh identity with no membership. Cleaned up afterwards."""
    email = f"{_ref('member')}@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            identity_id = identity_mod.get_or_create_identity(cur, email, "ZZ Phase1")
    yield identity_id
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM memberships WHERE identity_id = %s", (identity_id,)
            )
            cur.execute(
                "DELETE FROM identity_links WHERE identity_id = %s", (identity_id,)
            )
            cur.execute(
                "DELETE FROM identities WHERE identity_id = %s", (identity_id,)
            )


@pytest.fixture()
def mapped_activator_price():
    """Map a probe Stripe price onto the standing activator plan. No new tables."""
    price_id = _ref("price")
    created_plan = False
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, grants_role FROM plans WHERE slug = 'activator'"
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    "INSERT INTO plans (slug, name, grants_role) "
                    "VALUES ('activator', 'Activator', 'activator')"
                )
                plan_id = int(cur.lastrowid)
                created_plan = True
                grants = "activator"
            else:
                plan_id = int(row["id"])
                grants = row["grants_role"]
            cur.execute(
                """INSERT INTO provider_plan_map (provider, external_key, plan_id)
                   VALUES (%s, %s, %s)""",
                (PROVIDER, price_id, plan_id),
            )
    yield {"price_id": price_id, "plan_id": plan_id, "grants_role": grants}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM provider_plan_map WHERE provider = %s AND external_key = %s",
                (PROVIDER, price_id),
            )
            if created_plan:
                cur.execute("DELETE FROM plans WHERE id = %s AND slug = 'activator'", (plan_id,))


def _sign(body: bytes, secret: str) -> str:
    """Stripe v1 scheme: ``t=<unix>,v1=HMAC_SHA256(secret, f"{t}.{payload}")``.

    stripe 12.5.1 verifies this in ``WebhookSignature.verify_header`` /
    ``Webhook.construct_event`` and no longer ships a public
    ``generate_header`` helper. The MAC is the SDK's own
    ``WebhookSignature._compute_signature`` so the test cannot drift from
    the verifier.
    """
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{body.decode('utf-8')}"
    signature = stripe.WebhookSignature._compute_signature(signed_payload, secret)
    return f"t={timestamp},{stripe.WebhookSignature.EXPECTED_SCHEME}={signature}"


def _post_event(client, event_type: str, obj: dict, secret: str, *, signature: str | None = None):
    event = {
        "id": f"evt_{uuid.uuid4().hex[:16]}",
        "object": "event",
        "type": event_type,
        "data": {"object": obj},
    }
    body = json.dumps(event).encode()
    header = signature if signature is not None else _sign(body, secret)
    return client.post(
        "/api/billing/webhook",
        content=body,
        headers={"Stripe-Signature": header, "Content-Type": "application/json"},
    )


def _membership(identity_id: int) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT m.status, m.source, m.external_ref, p.slug, p.grants_role
                   FROM memberships m
                   JOIN plans p ON p.id = m.plan_id
                   WHERE m.identity_id = %s AND m.source = %s""",
                (identity_id, PROVIDER),
            )
            return cur.fetchone()


def _role(identity_id: int) -> str:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.derive_role(cur, identity_id)


def _stripe_customer(identity_id: int) -> str | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.resolve_stripe_customer(cur, identity_id)


# --- a. disabled mode --------------------------------------------------------


def test_disabled_stripe_provider_is_not_registered(stripe_off):
    """SSO registry stays the two WordPress providers. Stripe is absent."""
    regs = providers.registry()
    assert set(regs) == {"wordpress:fattail", "wordpress:0-dte"}
    assert "stripe" not in regs
    for provider in regs.values():
        assert provider.name.startswith("wordpress:")


def test_disabled_plans_reports_disabled(client, stripe_off):
    r = client.get("/api/billing/plans")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["enabled"] is False
    assert isinstance(body["plans"], list)
    for plan in body["plans"]:
        assert plan["prices"] == []


def test_disabled_checkout_reports_disabled(client, stripe_off):
    r = client.post("/api/billing/checkout", json={"price_id": "price_zzphase1"})
    assert r.status_code == 503, r.text
    assert "not configured" in r.json()["detail"].lower()


def test_disabled_webhook_reports_disabled(client, stripe_off):
    body = b"{}"
    r = client.post(
        "/api/billing/webhook",
        content=body,
        headers={"Stripe-Signature": "t=1,v1=deadbeef", "Content-Type": "application/json"},
    )
    assert r.status_code == 503, r.text
    assert "not configured" in r.json()["detail"].lower()


def test_disabled_portal_reports_disabled(client, stripe_off, probe_member):
    """Spec §1: every billing endpoint reports disabled when Stripe is unset.

    Kept as a real assertion. If the portal still falls through to WooCommerce
    My Account, this xfails with the response in the reason rather than editing
    routes/billing.py.
    """
    r = client.post("/api/billing/portal", cookies=cookie_for("observer", probe_member))
    assert r.status_code != 401, r.text
    if r.status_code != 503:
        pytest.xfail(
            "BUG vs Native Billing spec §1 (card/billing surfaces stay off "
            "when Stripe config is removed; every billing endpoint reports "
            "disabled). POST /api/billing/portal with a session and no "
            f"STRIPE_SECRET_KEY returned {r.status_code} {r.text[:400]!r} "
            "instead of 503 'Billing is not configured'. "
            "create_portal skips _require_enabled and falls through to "
            "_woo_billing_url (WordPress My Account)."
        )
    assert "not configured" in r.json()["detail"].lower()


# --- b. webhook signature ----------------------------------------------------


def test_webhook_valid_signature_accepted(client, webhook_secret):
    r = _post_event(client, "ping", {"id": "obj_zzphase1"}, webhook_secret)
    assert r.status_code == 200, r.text
    assert r.json()["received"] is True
    assert r.json()["result"] == "ignored"


def test_webhook_bad_signature_400(client, webhook_secret):
    r = _post_event(
        client,
        "ping",
        {"id": "obj_zzphase1"},
        webhook_secret,
        signature="t=1,v1=deadbeef",
    )
    assert r.status_code == 400, r.text
    assert "signature" in r.json()["detail"].lower()


# --- c. simulated lifecycle --------------------------------------------------


def test_signed_lifecycle_link_active_grace_expired_observer(
    client, webhook_secret, probe_member, mapped_activator_price
):
    identity_id = probe_member
    price_id = mapped_activator_price["price_id"]
    customer_id = _ref("cus")
    sub_id = _ref("sub")
    assert _role(identity_id) == "observer"
    assert _membership(identity_id) is None
    assert _stripe_customer(identity_id) is None

    checkout = _post_event(
        client,
        "checkout.session.completed",
        {
            "id": _ref("cs"),
            "object": "checkout.session",
            "customer": customer_id,
            "metadata": {"identity_id": str(identity_id)},
        },
        webhook_secret,
    )
    assert checkout.status_code == 200, checkout.text
    assert checkout.json()["result"] == "customer linked"
    assert _stripe_customer(identity_id) == customer_id
    assert _membership(identity_id) is None
    assert _role(identity_id) == "observer"

    def subscription(status: str) -> dict:
        return {
            "id": sub_id,
            "object": "subscription",
            "customer": customer_id,
            "status": status,
            "metadata": {"identity_id": str(identity_id)},
            "items": {
                "object": "list",
                "data": [{"price": {"object": "price", "id": price_id}}],
            },
        }

    created = _post_event(
        client,
        "customer.subscription.created",
        subscription("active"),
        webhook_secret,
    )
    assert created.status_code == 200, created.text
    assert created.json()["result"] == "membership active"
    mem = _membership(identity_id)
    assert mem is not None
    assert mem["status"] == "active"
    assert mem["slug"] == "activator"
    assert mem["source"] == PROVIDER
    assert mem["external_ref"] == sub_id
    assert _role(identity_id) == mapped_activator_price["grants_role"] == "activator"

    grace = _post_event(
        client,
        "customer.subscription.updated",
        subscription("past_due"),
        webhook_secret,
    )
    assert grace.status_code == 200, grace.text
    assert grace.json()["result"] == "membership grace"
    assert _membership(identity_id)["status"] == "grace"
    # Grace still confers the plan (identity.ACTIVE_STATUSES includes grace).
    assert _role(identity_id) == "activator"

    deleted = _post_event(
        client,
        "customer.subscription.deleted",
        subscription("canceled"),
        webhook_secret,
    )
    assert deleted.status_code == 200, deleted.text
    assert "membership expired" in deleted.json()["result"]
    assert _membership(identity_id)["status"] == "expired"
    assert _role(identity_id) == "observer"
    # The customer link survives expiry; membership truth is the webhook.
    assert _stripe_customer(identity_id) == customer_id


# --- d. unmapped price -------------------------------------------------------


def test_unmapped_price_ignored_membership_unchanged(
    client, webhook_secret, probe_member
):
    identity_id = probe_member
    customer_id = _ref("cus")
    price_id = _ref("price_unmapped")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM provider_plan_map WHERE provider = %s AND external_key = %s",
                (PROVIDER, price_id),
            )
            assert cur.fetchone() is None
            identity_mod.ensure_link(cur, identity_id, PROVIDER, customer_id)

    before_role = _role(identity_id)
    before_mem = _membership(identity_id)
    assert before_role == "observer"
    assert before_mem is None

    r = _post_event(
        client,
        "customer.subscription.created",
        {
            "id": _ref("sub"),
            "object": "subscription",
            "customer": customer_id,
            "status": "active",
            "metadata": {"identity_id": str(identity_id)},
            "items": {
                "object": "list",
                "data": [{"price": {"object": "price", "id": price_id}}],
            },
        },
        webhook_secret,
    )
    assert r.status_code == 200, r.text
    assert r.json()["received"] is True
    assert r.json()["result"] == f"unmapped price {price_id}"
    assert _membership(identity_id) is None
    assert _role(identity_id) == "observer"
    assert _stripe_customer(identity_id) == customer_id
