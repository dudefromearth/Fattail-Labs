"""Links Phase 3b — credit ledger (links/credits.py).

Specs/Links-Attribution-Affiliates-Spec-v0_2.md: AF-L9 (tier rules keyed
by Stripe price, not plan/role), AF-L10 (store credit only, never cash),
and the "balance is always derived by summing credit_events" invariant —
no second balance field to drift.
"""

from __future__ import annotations

import uuid

import db
import pytest

from links.credits import award_credit, balance, spend_credit, tier_rule

PRICE_PREFIX = "zztest-price-"
EXTERNAL_PREFIX = "zztest-sub-"


def _price_id() -> str:
    return f"{PRICE_PREFIX}{uuid.uuid4().hex[:8]}"


def _external_ref() -> str:
    return f"{EXTERNAL_PREFIX}{uuid.uuid4().hex[:8]}"


@pytest.fixture()
def probe_identity_id():
    import identity as identity_mod

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, f"zztest-credits-{uuid.uuid4().hex[:8]}@labs.test", "ZZ Credits Probe"
            )
    yield iid
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM credit_events WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM credit_tier_rules WHERE price_id LIKE %s", (f"{PRICE_PREFIX}%",)
            )
            cur.execute(
                "DELETE FROM credit_events WHERE external_ref LIKE %s", (f"{EXTERNAL_PREFIX}%",)
            )


def test_tier_rule_missing_price_returns_none():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert tier_rule(cur, _price_id()) is None


def test_tier_rule_returns_configured_row():
    price_id = _price_id()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO credit_tier_rules (price_id, credits, label) VALUES (%s, %s, %s)",
                (price_id, 10, "zztest-annual"),
            )
            row = tier_rule(cur, price_id)
    assert row == {"price_id": price_id, "credits": 10, "label": "zztest-annual"}


def test_balance_with_no_events_is_zero(probe_identity_id):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert balance(cur, probe_identity_id) == 0


def test_balance_is_derived_from_summed_events(probe_identity_id):
    ref_a, ref_b = _external_ref(), _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert award_credit(
                cur,
                identity_id=probe_identity_id,
                credits=10,
                reason="referral",
                external_ref=ref_a,
                attribution_id=None,
                self_referral=False,
            )
            assert award_credit(
                cur,
                identity_id=probe_identity_id,
                credits=1,
                reason="referral",
                external_ref=ref_b,
                attribution_id=None,
                self_referral=False,
            )
            assert spend_credit(
                cur, identity_id=probe_identity_id, credits=4, checkout_session_id=_external_ref()
            )
            assert balance(cur, probe_identity_id) == 7


def test_award_credit_is_idempotent_on_identity_reason_external_ref(probe_identity_id):
    ref = _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            first = award_credit(
                cur,
                identity_id=probe_identity_id,
                credits=25,
                reason="referral",
                external_ref=ref,
                attribution_id=None,
                self_referral=False,
            )
    assert first is True
    with db.transaction() as conn:
        with conn.cursor() as cur:
            # A redelivered webhook: same (identity_id, reason, external_ref).
            second = award_credit(
                cur,
                identity_id=probe_identity_id,
                credits=25,
                reason="referral",
                external_ref=ref,
                attribution_id=None,
                self_referral=False,
            )
            bal = balance(cur, probe_identity_id)
    assert second is False
    assert bal == 25  # the redelivery did not double-count


def test_award_credit_different_external_ref_is_not_deduped(probe_identity_id):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for _ in range(3):
                assert award_credit(
                    cur,
                    identity_id=probe_identity_id,
                    credits=1,
                    reason="referral",
                    external_ref=_external_ref(),
                    attribution_id=None,
                    self_referral=False,
                )
            assert balance(cur, probe_identity_id) == 3


def test_award_credit_stores_self_referral_flag(probe_identity_id):
    ref = _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            award_credit(
                cur,
                identity_id=probe_identity_id,
                credits=1,
                reason="referral",
                external_ref=ref,
                attribution_id=None,
                self_referral=True,
            )
            cur.execute(
                "SELECT self_referral FROM credit_events WHERE identity_id=%s AND external_ref=%s",
                (probe_identity_id, ref),
            )
            row = cur.fetchone()
    assert bool(row["self_referral"]) is True


def test_spend_credit_rejects_non_positive_credits(probe_identity_id):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert spend_credit(cur, identity_id=probe_identity_id, credits=0, checkout_session_id=_external_ref()) is False
            assert spend_credit(cur, identity_id=probe_identity_id, credits=-5, checkout_session_id=_external_ref()) is False
            assert balance(cur, probe_identity_id) == 0


def test_spend_credit_stores_a_negative_delta(probe_identity_id):
    ref = _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert spend_credit(cur, identity_id=probe_identity_id, credits=3, checkout_session_id=ref)
            cur.execute(
                "SELECT delta, reason FROM credit_events WHERE identity_id=%s AND external_ref=%s",
                (probe_identity_id, ref),
            )
            row = cur.fetchone()
    assert row["delta"] == -3
    assert row["reason"] == "redeem"
