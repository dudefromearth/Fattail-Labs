"""Migration 147 — artifact approval, the real Live gate, and price.

Three holes this closes, all in Staged:

1. produce_staged_artifact() set status='ready', so "the AI finished" and
   "a human approved" were one state. There was no approval step at all.
2. Nothing stopped a card reaching Live with all four artifacts untouched.
   _mark_staged sets staged_ready=1 on arrival, and that WAS the gate.
3. free_vs_paid='paid' was reachable with no price anywhere in the system
   (Factory Spec v1.1 section 8.6 had no field to read).

Spec: Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md
"""

from __future__ import annotations

import db
import iki_factory
import pytest
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _agent
from tests.test_iki_factory_if4 import _product, _to_build, _to_staged

KINDS = ("product", "landing_page", "store_placement", "help_page")


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _cleanup():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_cards WHERE title LIKE %s", ("zz-appr-%",)
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _staged_card(client, title: str) -> dict:
    return _to_staged(client, _to_build(client, title)["id"])


def _produce_all(client, card_id: int) -> None:
    key = _agent("zz-appr-gemba", ["factory:operate"])
    for kind in KINDS:
        r = client.post(
            f"/api/admin/iki-factory/cards/{card_id}/staged/{kind}",
            headers={"Authorization": f"Bearer {key}"},
            json={"body": f"zz-appr body for {kind}"},
        )
        assert r.status_code == 200, r.text


def _approve_all(client, card_id: int) -> None:
    for kind in KINDS:
        r = client.post(
            f"/api/admin/iki-factory/cards/{card_id}/staged/{kind}/approve",
            cookies=_admin(),
        )
        assert r.status_code == 200, r.text


def _move_live(client, card_id: int):
    return client.post(
        f"/api/admin/iki-factory/cards/{card_id}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )


# --- 2. the gate ------------------------------------------------------------


def test_approval_is_not_yet_a_live_gate(client):
    """CURRENT, DELIBERATE behaviour — pinned so a change is never silent.

    IF-8 ruled artifact status "tracked and visible, not enforced as a switch
    condition" (test_staged_to_live_gated_on_staged_ready_and_product_not_
    artifacts). So an unapproved card still reaches Live today.

    The mechanism to enforce it exists and is proven below; turning it on is
    a Coach ruling plus a decision-log entry, at which point THIS test flips
    to asserting 422.
    """
    card = _staged_card(client, "zz-appr-gate")
    assert _product(client, card["id"]).status_code == 200
    assert iki_factory.staged_all_approved(card["id"]) is False
    r = _move_live(client, card["id"])
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "live"


def test_produced_is_not_approved(client):
    """The core distinction migration 147 introduces: before it, producing an
    artifact set status='ready' and that was terminal — the AI finishing and a
    human approving were one state."""
    card = _staged_card(client, "zz-appr-produced")
    _produce_all(client, card["id"])
    arts = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}/staged", cookies=_admin()
    ).json()["staged_artifacts"]
    assert {a["status"] for a in arts} == {"ready"}
    assert all(a["approved"] is False for a in arts)
    assert iki_factory.staged_all_approved(card["id"]) is False

    _approve_all(client, card["id"])
    arts = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}/staged", cookies=_admin()
    ).json()["staged_artifacts"]
    assert {a["status"] for a in arts} == {"approved"}
    assert all(a["approved"] is True for a in arts)
    assert all(a["approved_by_label"] for a in arts)
    assert iki_factory.staged_all_approved(card["id"]) is True


def test_fully_approved_card_reaches_live(client):
    card = _staged_card(client, "zz-appr-happy")
    assert _product(client, card["id"]).status_code == 200
    _produce_all(client, card["id"])
    _approve_all(client, card["id"])
    got = _move_live(client, card["id"]).json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True


# --- 1. approval semantics --------------------------------------------------


def test_cannot_approve_what_was_never_produced(client):
    card = _staged_card(client, "zz-appr-empty")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/staged/product/approve",
        cookies=_admin(),
    )
    assert r.status_code >= 400
    assert "not been produced" in r.text


def test_agent_may_produce_but_never_approve(client):
    """v1.1 section 8.3 — Gemba prepares everything and stops."""
    card = _staged_card(client, "zz-appr-agent")
    _produce_all(client, card["id"])
    key = _agent("zz-appr-gemba2", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/staged/product/approve",
        headers={"Authorization": f"Bearer {key}"},
    )
    assert r.status_code >= 400


def test_rejection_requires_a_reason_and_clears_approval(client):
    """The reason is the rework brief Gemba works against."""
    card = _staged_card(client, "zz-appr-reject")
    _produce_all(client, card["id"])
    _approve_all(client, card["id"])

    bare = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/staged/landing_page/reject",
        cookies=_admin(),
        json={"reason": ""},
    )
    assert bare.status_code >= 400

    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/staged/landing_page/reject",
        cookies=_admin(),
        json={"reason": "Outcome claim in the hero line — remove it."},
    )
    assert r.status_code == 200, r.text
    art = r.json()["artifact"]
    assert art["status"] == "blocked"
    assert art["approved"] is False
    assert "Outcome claim" in art["blocked_reason"]
    assert r.json()["all_approved"] is False

    # ...and the card is no longer fully approved
    assert iki_factory.staged_all_approved(card["id"]) is False


# --- 3. price ---------------------------------------------------------------


def test_paid_without_price_cannot_go_live(client):
    card = _staged_card(client, "zz-appr-noprice")
    assert _product(client, card["id"], free_vs_paid="paid").status_code == 200
    _produce_all(client, card["id"])
    _approve_all(client, card["id"])
    r = _move_live(client, card["id"])
    assert r.status_code == 422, r.text
    assert "price" in r.json()["detail"]["reason"].lower()
    assert r.json()["detail"]["card"]["lane"] == "staged"


def test_paid_with_price_goes_live(client):
    card = _staged_card(client, "zz-appr-priced")
    r = _product(
        client,
        card["id"],
        free_vs_paid="paid",
        price_cents=2900,
        price_currency="usd",
        price_period="month",
    )
    assert r.status_code == 200, r.text
    got_card = r.json()["card"]
    assert got_card["price_cents"] == 2900
    assert got_card["price_currency"] == "USD"  # normalised
    _produce_all(client, card["id"])
    _approve_all(client, card["id"])
    got = _move_live(client, card["id"]).json()["card"]
    assert got["lane"] == "live"


def test_free_must_not_carry_a_price(client):
    card = _staged_card(client, "zz-appr-freeprice")
    r = _product(client, card["id"], free_vs_paid="free", price_cents=999,
                 price_currency="USD", price_period="month")
    assert r.status_code >= 400
    assert "free product must not carry a price" in r.text.lower()


def test_price_validation(client):
    card = _staged_card(client, "zz-appr-badprice")
    for bad in (
        {"price_cents": 0},
        {"price_cents": -5},
        {"price_cents": "lots"},
        {"price_currency": "DOLLARS"},
        {"price_period": "fortnightly"},
    ):
        r = client.patch(
            f"/api/admin/iki-factory/cards/{card['id']}",
            cookies=_admin(),
            json=bad,
        )
        assert r.status_code >= 400, f"{bad} should be rejected"


def test_free_card_needs_no_price_to_go_live(client):
    """Free is the common case and must stay frictionless."""
    card = _staged_card(client, "zz-appr-free")
    assert _product(client, card["id"], free_vs_paid="free").status_code == 200
    _produce_all(client, card["id"])
    _approve_all(client, card["id"])
    assert _move_live(client, card["id"]).json()["card"]["lane"] == "live"
