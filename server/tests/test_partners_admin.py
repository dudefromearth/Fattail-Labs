"""Admin partner registry (routes/partners_admin.py, LK Phase 4b).

Specs/Links-Growth-Acquisition-Spec-v0_1.md PM-L1-PM-L5, ruled by
Specs/Links-Growth-Acquisition-Spec-v0_2.md §2: deliberately separate
from the affiliates/credit-tier registry (cash or comp'd membership,
never store credit); never self-serve; no cash ledger/invoice/payable
field anywhere in this surface (PM-L3/Q11); a comp-membership grant is
a real identity.upsert_membership() call, never a faked checkout
(PM-L4).
"""

from __future__ import annotations

import uuid

import db
import pytest

EMAIL_PREFIX = "zztest-partner-"
_PROBE_PLAN_ID = 1  # plans.id=1 "labs-membership" — a real, stable seeded plan row


def _email() -> str:
    return f"{EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@labs.test"


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id FROM partners WHERE email LIKE %s", (f"{EMAIL_PREFIX}%",))
            ids = [r["identity_id"] for r in cur.fetchall() if r["identity_id"]]
            cur.execute("DELETE FROM partners WHERE email LIKE %s", (f"{EMAIL_PREFIX}%",))
            if ids:
                marks = ",".join(["%s"] * len(ids))
                cur.execute(f"DELETE FROM memberships WHERE identity_id IN ({marks}) AND source = 'partner-comp'", ids)
                cur.execute(f"DELETE FROM identity_links WHERE identity_id IN ({marks})", ids)
                cur.execute(f"DELETE FROM identities WHERE identity_id IN ({marks})", ids)


def _create_cash(client, admin_cookies, *, cents=5000, email=None):
    return client.post(
        "/api/admin/partners",
        cookies=admin_cookies,
        json={"name": "ZZ Test Partner", "email": email or _email(), "terms_type": "cash", "terms_cents": cents},
    )


def _create_comp(client, admin_cookies, *, plan_id=_PROBE_PLAN_ID, email=None):
    return client.post(
        "/api/admin/partners",
        cookies=admin_cookies,
        json={
            "name": "ZZ Test Partner Comp",
            "email": email or _email(),
            "terms_type": "comp_membership",
            "terms_plan_id": plan_id,
        },
    )


def test_create_requires_name(client, admin_cookies):
    r = client.post(
        "/api/admin/partners",
        cookies=admin_cookies,
        json={"email": _email(), "terms_type": "cash", "terms_cents": 5000},
    )
    assert r.status_code == 422


def test_create_requires_valid_email(client, admin_cookies):
    r = client.post(
        "/api/admin/partners",
        cookies=admin_cookies,
        json={"name": "ZZ", "email": "not-an-email", "terms_type": "cash", "terms_cents": 5000},
    )
    assert r.status_code == 422


@pytest.mark.parametrize(
    "body",
    [
        {"terms_type": "banana"},  # invalid terms_type
        {"terms_type": "cash"},  # missing terms_cents
        {"terms_type": "cash", "terms_cents": -1},  # non-positive
        {"terms_type": "cash", "terms_cents": "500"},  # wrong type
        {"terms_type": "comp_membership"},  # missing terms_plan_id
        {"terms_type": "comp_membership", "terms_plan_id": True},  # bool
        {"terms_type": "comp_membership", "terms_plan_id": 999999999},  # unknown plan
    ],
)
def test_create_rejects_invalid_terms(client, admin_cookies, body):
    r = client.post(
        "/api/admin/partners",
        cookies=admin_cookies,
        json={"name": "ZZ Test", "email": _email(), **body},
    )
    assert r.status_code == 422


def test_create_cash_defaults_to_pending_with_no_identity(client, admin_cookies):
    r = _create_cash(client, admin_cookies, cents=2500)
    assert r.status_code == 200, r.text
    row = r.json()["partner"]
    assert row["status"] == "pending"
    assert row["identity_id"] is None
    assert row["terms_type"] == "cash"
    assert row["terms_cents"] == 2500
    assert row["terms_plan_id"] is None


def test_create_comp_membership_defaults_to_pending(client, admin_cookies):
    r = _create_comp(client, admin_cookies)
    assert r.status_code == 200, r.text
    row = r.json()["partner"]
    assert row["terms_type"] == "comp_membership"
    assert row["terms_plan_id"] == _PROBE_PLAN_ID
    assert row["terms_cents"] is None


def test_create_duplicate_email_409(client, admin_cookies):
    email = _email()
    first = _create_cash(client, admin_cookies, email=email)
    assert first.status_code == 200
    dupe = _create_cash(client, admin_cookies, email=email)
    assert dupe.status_code == 409


def test_list_shows_zero_signups_when_unapproved(client, admin_cookies):
    email = _email()
    _create_cash(client, admin_cookies, email=email, cents=5000)
    r = client.get("/api/admin/partners", cookies=admin_cookies)
    row = next(p for p in r.json()["partners"] if p["email"] == email)
    assert row["signups"] == 0
    assert row["total_cents"] is None


def test_update_unknown_partner_404(client, admin_cookies):
    r = client.patch("/api/admin/partners/999999999", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 404


def test_update_rejects_invalid_status(client, admin_cookies):
    created = _create_cash(client, admin_cookies)
    partner_id = created.json()["partner"]["id"]
    r = client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "banana"})
    assert r.status_code == 422


def test_approve_provisions_identity_and_sets_approved_fields(client, admin_cookies):
    created = _create_cash(client, admin_cookies, cents=5000)
    partner_id = created.json()["partner"]["id"]
    r = client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 200, r.text
    row = r.json()["partner"]
    assert row["status"] == "approved"
    assert row["identity_id"] is not None
    assert row["approved_at"] is not None


def test_approve_reuses_existing_identity_for_matching_email(client, admin_cookies):
    import identity as identity_mod

    email = _email()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            existing_id = identity_mod.get_or_create_identity(cur, email, "ZZ Existing Member")

    created = _create_cash(client, admin_cookies, email=email)
    partner_id = created.json()["partner"]["id"]
    r = client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 200, r.text
    assert r.json()["partner"]["identity_id"] == existing_id


def test_pending_partner_link_is_inert(client, admin_cookies):
    """Mirrors AF-L4's existing affiliate pattern: a pending partner has
    no identity to own anything with until approved."""
    created = _create_cash(client, admin_cookies)
    assert created.json()["partner"]["identity_id"] is None
    assert created.json()["partner"]["status"] == "pending"


def test_signups_and_total_computed_from_attributions(client, admin_cookies):
    from links.attribution import mint_marker, record_attribution

    email = _email()
    created = _create_cash(client, admin_cookies, email=email, cents=5000)
    partner_id = created.json()["partner"]["id"]
    approved = client.patch(
        f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"}
    )
    owner_identity_id = approved.json()["partner"]["identity_id"]

    slug = "zztstp"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO links (slug, destination, label, active, `static`, owner) "
                "VALUES (%s, %s, %s, 1, 0, %s) ON DUPLICATE KEY UPDATE owner=VALUES(owner)",
                (slug, "https://example.com/zztest-partner", "zztest-partner-link", str(owner_identity_id)),
            )
            marker1 = mint_marker(cur, slug)
            marker2 = mint_marker(cur, slug)
            record_attribution(
                cur, marker=marker1, slug=slug, identity_id=999001, provider="stripe",
                external_ref=f"zztest-{uuid.uuid4().hex[:8]}", amount_cents=None, currency=None,
            )
            record_attribution(
                cur, marker=marker2, slug=slug, identity_id=999002, provider="stripe",
                external_ref=f"zztest-{uuid.uuid4().hex[:8]}", amount_cents=None, currency=None,
            )
    try:
        r = client.get("/api/admin/partners", cookies=admin_cookies)
        row = next(p for p in r.json()["partners"] if p["email"] == email)
        assert row["signups"] == 2
        assert row["total_cents"] == 10000
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM link_markers WHERE slug = %s", (slug,))
                cur.execute("DELETE FROM link_attributions WHERE slug = %s", (slug,))
                cur.execute("DELETE FROM links WHERE slug = %s", (slug,))


def test_grant_membership_requires_comp_membership_terms(client, admin_cookies):
    created = _create_cash(client, admin_cookies)
    partner_id = created.json()["partner"]["id"]
    client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"})
    r = client.post(f"/api/admin/partners/{partner_id}/grant-membership", cookies=admin_cookies)
    assert r.status_code == 422


def test_grant_membership_requires_approval_first(client, admin_cookies):
    created = _create_comp(client, admin_cookies)
    partner_id = created.json()["partner"]["id"]
    r = client.post(f"/api/admin/partners/{partner_id}/grant-membership", cookies=admin_cookies)
    assert r.status_code == 422


def test_grant_membership_calls_upsert_membership_directly(client, admin_cookies, monkeypatch):
    """PM-L4: a real identity.upsert_membership() call, never a Stripe
    API call or a simulated checkout."""
    import identity as identity_mod
    import stripe

    created = _create_comp(client, admin_cookies, plan_id=_PROBE_PLAN_ID)
    partner_id = created.json()["partner"]["id"]
    approved = client.patch(
        f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"}
    )
    owner_identity_id = approved.json()["partner"]["identity_id"]

    def _forbid_stripe(*args, **kwargs):
        raise AssertionError("Stripe API must not be called by a comp-membership grant")

    monkeypatch.setattr(stripe.checkout.Session, "create", _forbid_stripe)

    r = client.post(f"/api/admin/partners/{partner_id}/grant-membership", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    assert r.json() == {"granted": True}

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status, source, external_ref FROM memberships WHERE identity_id=%s AND plan_id=%s",
                (owner_identity_id, _PROBE_PLAN_ID),
            )
            row = cur.fetchone()
    assert row is not None
    assert row["status"] == "active"
    assert row["source"] == "partner-comp"
    assert row["external_ref"] == f"partner:{partner_id}"


def test_grant_membership_is_idempotent(client, admin_cookies):
    created = _create_comp(client, admin_cookies)
    partner_id = created.json()["partner"]["id"]
    client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"})
    first = client.post(f"/api/admin/partners/{partner_id}/grant-membership", cookies=admin_cookies)
    second = client.post(f"/api/admin/partners/{partner_id}/grant-membership", cookies=admin_cookies)
    assert first.status_code == 200
    assert second.status_code == 200


def test_no_response_contains_invoice_or_payable_fields(client, admin_cookies):
    """PM-L3/Q11: no invoice, payable, or owed-amount tracking field
    anywhere in this surface — mirrors the existing affiliate AT-6."""
    created = _create_cash(client, admin_cookies)
    partner_id = created.json()["partner"]["id"]
    client.patch(f"/api/admin/partners/{partner_id}", cookies=admin_cookies, json={"status": "approved"})
    r = client.get("/api/admin/partners", cookies=admin_cookies)
    blob = str(r.json()).lower()
    for forbidden in ("invoice", "payable", "owed", "payout"):
        assert forbidden not in blob
