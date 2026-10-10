"""Admin Links API — Phase 3b owner surface (routes/links_admin.py).

Specs/Links-Attribution-Affiliates-Spec-v0_2.md AF-L3/D13: owner is an
identities.identity_id, settable at create/update time, surfaced on the
detail page with the owner's live credit balance. owner-search backs the
admin UI's owner picker.

Uses a real https://example.com destination (bounded reachability check,
same convention as test_links_w1.py) rather than mocking the network —
these are admin-API-level tests, not fence-law characterization tests.
"""

from __future__ import annotations

import uuid

import db
import pytest

GOOD = "https://example.com/zztest-admin-api"


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT slug FROM links WHERE label LIKE 'zztest-%'")
            slugs = [r["slug"] for r in cur.fetchall()]
            if slugs:
                marks = ",".join(["%s"] * len(slugs))
                cur.execute(f"DELETE FROM link_events WHERE slug IN ({marks})", slugs)
            cur.execute("DELETE FROM links WHERE label LIKE 'zztest-%'")


@pytest.fixture()
def owner_identity():
    import identity as identity_mod

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, f"zztest-owner-{uuid.uuid4().hex[:8]}@labs.test", "ZZ Owner Searchable"
            )
    yield iid
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM credit_events WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _create(client, admin_cookies, *, label, owner=None):
    body = {"destination": GOOD, "label": label}
    if owner is not None:
        body["owner"] = owner
    return client.post("/api/admin/links", cookies=admin_cookies, json=body)


def test_create_without_owner_succeeds(client, admin_cookies):
    r = _create(client, admin_cookies, label=f"zztest-no-owner-{uuid.uuid4().hex[:8]}")
    assert r.status_code == 200, r.text
    assert r.json()["link"]["owner"] is None


def test_create_with_owner_stores_identity_id(client, admin_cookies, owner_identity):
    r = _create(client, admin_cookies, label=f"zztest-owner-{uuid.uuid4().hex[:8]}", owner=owner_identity)
    assert r.status_code == 200, r.text
    assert r.json()["link"]["owner"] == str(owner_identity)


@pytest.mark.parametrize("bad_owner", ["not-an-int", 1.5, True, False])
def test_create_rejects_non_int_owner(client, admin_cookies, bad_owner):
    r = _create(client, admin_cookies, label=f"zztest-bad-owner-{uuid.uuid4().hex[:8]}", owner=bad_owner)
    assert r.status_code == 422


def test_update_sets_owner(client, admin_cookies, owner_identity):
    created = _create(client, admin_cookies, label=f"zztest-update-owner-{uuid.uuid4().hex[:8]}")
    slug = created.json()["link"]["slug"]
    r = client.patch(f"/api/admin/links/{slug}", cookies=admin_cookies, json={"owner": owner_identity})
    assert r.status_code == 200, r.text
    assert r.json()["link"]["owner"] == str(owner_identity)


def test_update_rejects_invalid_owner(client, admin_cookies):
    created = _create(client, admin_cookies, label=f"zztest-update-bad-owner-{uuid.uuid4().hex[:8]}")
    slug = created.json()["link"]["slug"]
    r = client.patch(f"/api/admin/links/{slug}", cookies=admin_cookies, json={"owner": "nope"})
    assert r.status_code == 422


def test_owner_search_requires_at_least_two_chars(client, admin_cookies, owner_identity):
    r = client.get("/api/admin/links/owner-search", cookies=admin_cookies, params={"q": "z"})
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_owner_search_matches_display_name(client, admin_cookies, owner_identity):
    r = client.get(
        "/api/admin/links/owner-search", cookies=admin_cookies, params={"q": "ZZ Owner Searchable"}
    )
    assert r.status_code == 200
    ids = [row["identity_id"] for row in r.json()["results"]]
    assert owner_identity in ids


def test_detail_owner_is_none_when_unset(client, admin_cookies):
    created = _create(client, admin_cookies, label=f"zztest-detail-no-owner-{uuid.uuid4().hex[:8]}")
    slug = created.json()["link"]["slug"]
    r = client.get(f"/api/admin/links/{slug}", cookies=admin_cookies)
    assert r.status_code == 200
    assert r.json()["owner"] is None


def test_detail_owner_block_shows_live_credit_balance(client, admin_cookies, owner_identity):
    from links.credits import award_credit

    created = _create(
        client, admin_cookies, label=f"zztest-detail-owner-{uuid.uuid4().hex[:8]}", owner=owner_identity
    )
    slug = created.json()["link"]["slug"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            award_credit(
                cur,
                identity_id=owner_identity,
                credits=5,
                reason="referral",
                external_ref=f"zztest-sub-{uuid.uuid4().hex[:8]}",
                attribution_id=None,
                self_referral=False,
            )
    r = client.get(f"/api/admin/links/{slug}", cookies=admin_cookies)
    assert r.status_code == 200
    owner = r.json()["owner"]
    assert owner["identity_id"] == owner_identity
    assert owner["credit_balance"] == 5
