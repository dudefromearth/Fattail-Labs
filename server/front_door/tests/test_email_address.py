"""Order-form email: shape, then whether the domain accepts mail."""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from front_door.api import create_app  # noqa: E402
from front_door.email_address import (  # noqa: E402
    EmailAddressError,
    assert_receives_mail,
    normalize_email,
)
from front_door.offers import load_offers  # noqa: E402

OFFERS = Path(__file__).resolve().parents[1] / "offers.json"
FORMAT = "Enter a complete email address, like name@domain.com."
DOMAIN = "That domain does not accept email."


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "   ",
        "ada",
        "ada@",
        "@fattail.ai",
        "ada@fattail",
        "ada@fattail.c",
        "ada @fattail.ai",
        "ada@fat tail.ai",
        "ada@fattail..ai",
        ".ada@fattail.ai",
        "ada.@fattail.ai",
        "ada@-fattail.ai",
        "a" * 65 + "@fattail.ai",
    ],
)
def test_rejects_a_malformed_address(raw):
    with pytest.raises(EmailAddressError, match=FORMAT):
        normalize_email(raw)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("  Ada@Fattail.AI ", "ada@fattail.ai"),
        ("preview-check@gmail.com", "preview-check@gmail.com"),
        ("a.b+tag@domain.co.uk", "a.b+tag@domain.co.uk"),
    ],
)
def test_accepts_a_proper_address(raw, expected):
    assert normalize_email(raw) == expected


def test_null_mx_and_missing_domain_are_not_real():
    with pytest.raises(EmailAddressError, match=DOMAIN):
        assert_receives_mail("ada@example.com", lookup=lambda domain: "null_mx")
    with pytest.raises(EmailAddressError, match=DOMAIN):
        assert_receives_mail("ada@missing.test", lookup=lambda domain: "nxdomain")


def test_member_state_and_handoff_refuse_a_domain_that_does_not_accept_mail():
    offers = load_offers(OFFERS, {})
    app = create_app(
        offers=offers,
        secret="test-secret-not-for-prod",
        allow_facts=True,
        email_lookup=lambda domain: "null_mx",
    )
    http = TestClient(app)
    checked = http.post("/api/front-door/member-state", json={"email": "ada@example.com"})
    assert checked.status_code == 422
    assert checked.json()["detail"] == DOMAIN
    handoff = http.post(
        "/api/front-door/handoff",
        json={"product_id": "observer", "email": "ada@example.com", "order_key": "order-1"},
    )
    assert handoff.status_code == 422
    assert handoff.json()["detail"] == DOMAIN


def test_blank_email_stays_unchecked():
    offers = load_offers(OFFERS, {})
    app = create_app(offers=offers, secret="test-secret-not-for-prod", allow_facts=True)
    http = TestClient(app)
    blank = http.post("/api/front-door/member-state", json={"email": "   "})
    assert blank.status_code == 200
    assert blank.json()["state"] == "unchecked"
    assert blank.json()["can_buy"] is False
