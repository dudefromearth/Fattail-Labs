"""Admin affiliate registry + credit-tier rules
(routes/affiliates_admin.py, LK Phase 3b).

Specs/Links-Attribution-Affiliates-Spec-v0_2.md: AF-L4/AF-L12 — never
self-serve, every affiliate row starts pending, only an admin approval
provisions an identity.
"""

from __future__ import annotations

import uuid

import db
import pytest

EMAIL_PREFIX = "zztest-affiliate-"
PRICE_PREFIX = "zztest-price-"


def _email() -> str:
    return f"{EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@labs.test"


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id FROM affiliates WHERE email LIKE %s", (f"{EMAIL_PREFIX}%",))
            ids = [r["identity_id"] for r in cur.fetchall() if r["identity_id"]]
            cur.execute("DELETE FROM affiliates WHERE email LIKE %s", (f"{EMAIL_PREFIX}%",))
            cur.execute("DELETE FROM credit_tier_rules WHERE price_id LIKE %s", (f"{PRICE_PREFIX}%",))
            if ids:
                marks = ",".join(["%s"] * len(ids))
                cur.execute(f"DELETE FROM credit_events WHERE identity_id IN ({marks})", ids)
                cur.execute(f"DELETE FROM identity_links WHERE identity_id IN ({marks})", ids)
                cur.execute(f"DELETE FROM identities WHERE identity_id IN ({marks})", ids)


def test_create_requires_name(client, admin_cookies):
    r = client.post("/api/admin/affiliates", cookies=admin_cookies, json={"email": _email()})
    assert r.status_code == 422


def test_create_requires_valid_email(client, admin_cookies):
    r = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test", "email": "not-an-email"}
    )
    assert r.status_code == 422


def test_create_defaults_to_pending_with_no_identity(client, admin_cookies):
    email = _email()
    r = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test", "email": email}
    )
    assert r.status_code == 200, r.text
    row = r.json()["affiliate"]
    assert row["status"] == "pending"
    assert row["identity_id"] is None
    assert row["email"] == email


def test_create_duplicate_email_409(client, admin_cookies):
    email = _email()
    first = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test", "email": email}
    )
    assert first.status_code == 200
    dupe = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test Again", "email": email}
    )
    assert dupe.status_code == 409


def test_list_includes_null_credit_balance_when_unapproved(client, admin_cookies):
    email = _email()
    client.post("/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test", "email": email})
    r = client.get("/api/admin/affiliates", cookies=admin_cookies)
    assert r.status_code == 200
    row = next(a for a in r.json()["affiliates"] if a["email"] == email)
    assert row["credit_balance"] is None


def test_update_unknown_affiliate_404(client, admin_cookies):
    r = client.patch("/api/admin/affiliates/999999999", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 404


def test_update_rejects_invalid_status(client, admin_cookies):
    email = _email()
    created = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test", "email": email}
    )
    aff_id = created.json()["affiliate"]["id"]
    r = client.patch(f"/api/admin/affiliates/{aff_id}", cookies=admin_cookies, json={"status": "banana"})
    assert r.status_code == 422


def test_approve_provisions_identity_and_sets_approved_fields(client, admin_cookies):
    email = _email()
    created = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test Approve", "email": email}
    )
    aff_id = created.json()["affiliate"]["id"]
    r = client.patch(f"/api/admin/affiliates/{aff_id}", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 200, r.text
    row = r.json()["affiliate"]
    assert row["status"] == "approved"
    assert row["identity_id"] is not None
    assert row["approved_at"] is not None

    r2 = client.get("/api/admin/affiliates", cookies=admin_cookies)
    listed = next(a for a in r2.json()["affiliates"] if a["email"] == email)
    assert listed["credit_balance"] == 0  # provisioned, no credit events yet


def test_approve_reuses_existing_identity_for_matching_email(client, admin_cookies):
    import identity as identity_mod

    email = _email()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            existing_id = identity_mod.get_or_create_identity(cur, email, "ZZ Existing Member")

    created = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Existing Member", "email": email}
    )
    aff_id = created.json()["affiliate"]["id"]
    r = client.patch(f"/api/admin/affiliates/{aff_id}", cookies=admin_cookies, json={"status": "approved"})
    assert r.status_code == 200, r.text
    assert r.json()["affiliate"]["identity_id"] == existing_id


def test_revoke_after_approve_keeps_identity_id(client, admin_cookies):
    email = _email()
    created = client.post(
        "/api/admin/affiliates", cookies=admin_cookies, json={"name": "ZZ Test Revoke", "email": email}
    )
    aff_id = created.json()["affiliate"]["id"]
    approved = client.patch(f"/api/admin/affiliates/{aff_id}", cookies=admin_cookies, json={"status": "approved"})
    identity_id = approved.json()["affiliate"]["identity_id"]
    revoked = client.patch(f"/api/admin/affiliates/{aff_id}", cookies=admin_cookies, json={"status": "revoked"})
    assert revoked.status_code == 200
    assert revoked.json()["affiliate"]["status"] == "revoked"
    assert revoked.json()["affiliate"]["identity_id"] == identity_id


def test_tier_rules_upsert_list_and_delete(client, admin_cookies):
    price_id = f"{PRICE_PREFIX}{uuid.uuid4().hex[:8]}"
    created = client.post(
        "/api/admin/affiliates/tier-rules",
        cookies=admin_cookies,
        json={"price_id": price_id, "credits": 10, "label": "zztest-annual"},
    )
    assert created.status_code == 200, created.text
    assert created.json()["rule"] == {"price_id": price_id, "credits": 10, "label": "zztest-annual"}

    listed = client.get("/api/admin/affiliates/tier-rules", cookies=admin_cookies)
    assert any(r["price_id"] == price_id and r["credits"] == 10 for r in listed.json()["rules"])

    # Upsert on the same price_id updates in place, not a second row.
    updated = client.post(
        "/api/admin/affiliates/tier-rules",
        cookies=admin_cookies,
        json={"price_id": price_id, "credits": 25, "label": "zztest-lifetime"},
    )
    assert updated.status_code == 200
    listed2 = client.get("/api/admin/affiliates/tier-rules", cookies=admin_cookies)
    matches = [r for r in listed2.json()["rules"] if r["price_id"] == price_id]
    assert len(matches) == 1
    assert matches[0]["credits"] == 25
    assert matches[0]["label"] == "zztest-lifetime"

    deleted = client.delete(f"/api/admin/affiliates/tier-rules/{price_id}", cookies=admin_cookies)
    assert deleted.status_code == 200
    listed3 = client.get("/api/admin/affiliates/tier-rules", cookies=admin_cookies)
    assert not any(r["price_id"] == price_id for r in listed3.json()["rules"])


@pytest.mark.parametrize(
    "body",
    [
        {"credits": 10, "label": "zztest-x"},  # missing price_id
        {"price_id": "zztest-price-x", "label": "zztest-x"},  # missing credits
        {"price_id": "zztest-price-x", "credits": -1, "label": "zztest-x"},  # negative
        {"price_id": "zztest-price-x", "credits": "ten", "label": "zztest-x"},  # wrong type
        {"price_id": "zztest-price-x", "credits": True, "label": "zztest-x"},  # bool
    ],
)
def test_tier_rules_reject_invalid_payloads(client, admin_cookies, body):
    r = client.post("/api/admin/affiliates/tier-rules", cookies=admin_cookies, json=body)
    assert r.status_code == 422
