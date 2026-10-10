"""Billing webhook attribution/credit logic (routes/billing.py).

LK Phase 3a/3b: _attribute_checkout, _award_referral_credit, and
_handle_subscription's created-only credit award. These are plain
functions taking a cursor and a dict (the already-parsed webhook
object) — Stripe signature verification happens one layer up in
stripe_webhook() and is not exercised here; see billing.py's comment
that the SDK is used for signature verification only.

links/link_markers/link_attributions/credit_tier_rules carry no FK to
links (migrations/156_attribution.sql, 157_affiliates.sql), so probe
links are inserted directly rather than through links.store (which
would make a real reachability check for no reason here).
"""

from __future__ import annotations

import uuid

import db
import pytest

from links.attribution import mint_marker
from links.credits import balance
from routes.billing import PROVIDER, _attribute_checkout, _award_referral_credit, _handle_subscription

SLUG_A = "zztsta"
SLUG_B = "zztstb"
SLUGS = (SLUG_A, SLUG_B)


def _ref(prefix: str) -> str:
    return f"zztest-{prefix}-{uuid.uuid4().hex[:8]}"


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


# --- _attribute_checkout (AF-L1/AF-L2, D8) -----------------------------------


def test_attribute_checkout_noop_without_marker():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            result = _attribute_checkout(cur, {"id": _ref("cs"), "metadata": {}}, "5")
    assert result is None


def test_attribute_checkout_noop_when_meta_identity_is_not_digit():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG_A)
            result = _attribute_checkout(
                cur, {"id": _ref("cs"), "metadata": {"marker": marker}}, "not-a-digit"
            )
    assert result is None


def test_attribute_checkout_noop_for_unknown_marker(identities):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            result = _attribute_checkout(
                cur,
                {"id": _ref("cs"), "metadata": {"marker": "zzzzznotrea"}},
                str(identities["purchaser"]),
            )
    assert result is None


def test_attribute_checkout_records_and_is_idempotent(identities):
    ref = _ref("cs")
    obj = {"id": ref, "metadata": {}, "amount_total": 4900, "currency": "usd"}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG_A)
            obj["metadata"]["marker"] = marker
            first = _attribute_checkout(cur, obj, str(identities["purchaser"]))
    assert first == f"attributed to {SLUG_A}"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            second = _attribute_checkout(cur, obj, str(identities["purchaser"]))
            cur.execute(
                "SELECT COUNT(*) AS n, identity_id, amount_cents FROM link_attributions "
                "WHERE external_ref = %s GROUP BY identity_id, amount_cents",
                (ref,),
            )
            row = cur.fetchone()
    assert second == "attribution already recorded"
    assert row["n"] == 1
    assert row["identity_id"] == identities["purchaser"]
    assert row["amount_cents"] == 4900


# --- _award_referral_credit (AF-L9) ------------------------------------------


def test_award_referral_credit_noop_without_marker(identities):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            result = _award_referral_credit(cur, {"metadata": {}}, "zztest-price-x", identities["purchaser"])
    assert result is None


def test_award_referral_credit_noop_when_marker_unknown(identities):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            result = _award_referral_credit(
                cur, {"metadata": {"marker": "zzzzznotrea"}}, "zztest-price-x", identities["purchaser"]
            )
    assert result is None


def test_award_referral_credit_noop_when_link_has_no_owner(identities):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_A, owner=None)
            marker = mint_marker(cur, SLUG_A)
            result = _award_referral_credit(
                cur, {"metadata": {"marker": marker}}, "zztest-price-x", identities["purchaser"]
            )
    assert result is None


def test_award_referral_credit_noop_when_no_tier_rule_configured(identities):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _make_link(cur, SLUG_A, owner=identities["owner"])
            marker = mint_marker(cur, SLUG_A)
            result = _award_referral_credit(
                cur, {"metadata": {"marker": marker}}, "zztest-price-unmapped", identities["purchaser"]
            )
    assert result is None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 0


def test_award_referral_credit_awards_owner_not_purchaser(identities):
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
            result = _award_referral_credit(
                cur, {"id": sub_id, "metadata": {"marker": marker}}, price_id, identities["purchaser"]
            )
    assert result == f"10 credits to identity {identities['owner']}"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 10
            assert balance(cur, identities["purchaser"]) == 0


def test_award_referral_credit_flags_self_referral(identities):
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
            # The owner buys through their own link.
            result = _award_referral_credit(
                cur, {"id": sub_id, "metadata": {"marker": marker}}, price_id, owner
            )
            cur.execute(
                "SELECT self_referral FROM credit_events WHERE identity_id=%s AND external_ref=%s",
                (owner, sub_id),
            )
            row = cur.fetchone()
    assert "self-referral, flagged" in result
    assert bool(row["self_referral"]) is True


def test_award_referral_credit_idempotent_on_subscription_id(identities):
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
            sub = {"id": sub_id, "metadata": {"marker": marker}}
            first = _award_referral_credit(cur, sub, price_id, identities["purchaser"])
    assert first is not None and "10 credits" in first

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Stripe redelivers customer.subscription.created with the same id.
            second = _award_referral_credit(cur, sub, price_id, identities["purchaser"])
            bal = balance(cur, identities["owner"])
    assert second == "credit already awarded"
    assert bal == 10  # the redelivery did not double-award


# --- _handle_subscription wiring: credit award only when created=True -------


def _sub(*, purchaser_id: int, marker: str, price_id: str, sub_id: str) -> dict:
    return {
        "id": sub_id,
        "customer": "",
        "metadata": {"identity_id": str(purchaser_id), "marker": marker},
        "items": {"data": [{"price": {"id": price_id}}]},
        "status": "active",
    }


def test_handle_subscription_awards_credit_when_created_true(identities):
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
            sub = _sub(purchaser_id=identities["purchaser"], marker=marker, price_id=price_id, sub_id=sub_id)
            result = _handle_subscription(cur, sub, created=True)
    assert "10 credits" in result
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 10


def test_handle_subscription_skips_credit_when_created_false(identities):
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
            sub = _sub(purchaser_id=identities["purchaser"], marker=marker, price_id=price_id, sub_id=sub_id)
            # customer.subscription.updated / .deleted never award credit —
            # only the first customer.subscription.created delivery does.
            result = _handle_subscription(cur, sub, created=False)
    assert result == f"unmapped price {price_id}"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, identities["owner"]) == 0
