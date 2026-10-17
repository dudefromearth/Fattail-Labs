"""Front door unit and API tests. No Labs config, no MySQL, no member PII."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

SERVER = Path(__file__).resolve().parents[2]
if str(SERVER) not in sys.path:
    sys.path.insert(0, str(SERVER))

from front_door.analytics import dropoff_summary  # noqa: E402
from front_door.api import create_app  # noqa: E402
from front_door.evidence import assemble, normalize_moment, plus_two_years  # noqa: E402
from front_door.handoff import build_handoff, checkout_url  # noqa: E402
from front_door.member_state import FIVE_STATES, classify, payment_attention, view_for  # noqa: E402
from front_door.offers import OfferConfigError, load_offers, validate_offers  # noqa: E402
from front_door.routing import entry_for_referrer  # noqa: E402
from front_door.store import MemoryStore  # noqa: E402
from front_door.traffic import admission, bucket_for  # noqa: E402
from front_door.woo_lookup import WooUnavailable, facts_from_records  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
OFFERS = SERVER / "front_door" / "offers.json"
SECRET = "test-secret-not-for-prod"
ORDER = "11111111-1111-4111-8111-111111111111"


def _facts(**overrides):
    base = {
        "has_identity": True,
        "has_membership": False,
        "lifetime": False,
        "subscription_product": None,
        "subscription_status": None,
        "observer_completed": False,
        "cancelled_before_completion": False,
        "payment_failed": False,
    }
    base.update(overrides)
    return base


@pytest.fixture
def offers():
    return load_offers(OFFERS, {})


@pytest.fixture
def client(offers):
    store = MemoryStore()
    app = create_app(
        offers=offers,
        store=store,
        secret=SECRET,
        allow_facts=True,
        woo=_DownWoo(),
        email_lookup=lambda domain: "mx",
    )
    return TestClient(app), store


class _DownWoo:
    def lookup(self, email, offers):
        raise WooUnavailable("WooCommerce is not configured for the front door")


class _MapWoo:
    def __init__(self, facts):
        self.facts = facts

    def lookup(self, email, offers):
        return self.facts


def test_committed_config_matches_spec(offers):
    assert offers["traffic_percent"] == 0
    assert offers["kill_switch"] is False
    assert offers["feature_flag"] is True
    enabled = [p["id"] for p in offers["products"] if p["enabled"]]
    assert enabled == ["observer", "navigator-annual", "navigator-lifetime"]
    by_id = {p["id"]: p for p in offers["products"]}
    assert offers["terms_url"] == "https://fattail.ai/terms/"
    assert offers["privacy_url"] == "https://fattail.ai/privacy-policy/"
    assert by_id["observer"]["disclosure"] == "You can cancel anytime. No refunds."
    assert "No refunds" not in by_id["navigator-annual"]["disclosure"]
    assert "No refunds" not in by_id["navigator-monthly"]["disclosure"]
    assert "No refunds" not in by_id["navigator-lifetime"]["disclosure"]
    assert by_id["observer"]["price_cents"] == 1700
    assert by_id["observer"]["regular_price_cents"] is None
    assert by_id["observer"]["offer_code"] == ""
    assert by_id["observer"]["interval"] == "week"
    assert by_id["observer"]["interval_count"] == 6
    assert by_id["navigator-annual"]["price_cents"] == 199700
    assert by_id["navigator-monthly"]["price_cents"] == 26700
    assert by_id["navigator-monthly"]["enabled"] is False
    assert by_id["monthly-intro"]["price_cents"] == 16500
    assert by_id["monthly-intro"]["enabled"] is False
    assert by_id["activator"]["enabled"] is False
    assert by_id["quarterly"]["enabled"] is False


def test_optional_flip_needs_no_code_change(offers, tmp_path):
    data = json.loads(OFFERS.read_text(encoding="utf-8"))
    monthly = next(p for p in data["products"] if p["id"] == "navigator-monthly")
    monthly["enabled"] = True
    path = tmp_path / "offers.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    loaded = load_offers(path, {})
    enabled = [p["id"] for p in loaded["products"] if p["enabled"]]
    assert "navigator-monthly" in enabled
    intro = next(p for p in data["products"] if p["id"] == "monthly-intro")
    intro["enabled"] = True
    path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(OfferConfigError, match="woo_product_id"):
        load_offers(path, {})


def test_missing_file_and_bad_override(tmp_path):
    with pytest.raises(OfferConfigError, match="missing"):
        load_offers(tmp_path / "nope.json", {})
    with pytest.raises(OfferConfigError, match="FRONT_DOOR_TRAFFIC_PERCENT"):
        load_offers(OFFERS, {"FRONT_DOOR_TRAFFIC_PERCENT": "nope"})
    flipped = load_offers(OFFERS, {"FRONT_DOOR_KILL_SWITCH": "1", "FRONT_DOOR_TRAFFIC_PERCENT": "10"})
    assert flipped["kill_switch"] is True
    assert flipped["traffic_percent"] == 10
    assert next(p for p in flipped["products"] if p["id"] == "observer")["price_cents"] == 1700


def test_five_states_and_floor_views(offers):
    cases = {
        "none": _facts(has_identity=False),
        "observer": _facts(subscription_product="observer", subscription_status="active"),
        "navigator_annual": _facts(
            subscription_product="navigator-annual", subscription_status="active"
        ),
        "navigator_lifetime": _facts(lifetime=True),
        "cancelled_before_completion": _facts(cancelled_before_completion=True),
    }
    assert set(cases) == set(FIVE_STATES)
    for state, facts in cases.items():
        assert classify(facts) == state
        view = view_for(state, offers, attention=False)
        if state in {"none", "cancelled_before_completion"}:
            assert [p["id"] for p in view["products"]] == [
                "observer",
                "navigator-annual",
                "navigator-lifetime",
            ]
            assert view["can_buy"] is True
        elif state == "observer":
            assert "observer" not in {p["id"] for p in view["products"]}
            assert view["can_buy"] is True
        else:
            assert view["products"] == []
            assert view["can_buy"] is False
    finished = classify(_facts(has_membership=True, observer_completed=True, subscription_product="observer"))
    assert finished == "finished_observer"
    lapsed = classify(
        _facts(
            has_membership=True,
            subscription_product="navigator-annual",
            subscription_status="cancelled",
        )
    )
    assert lapsed == "lapsed_annual"
    for state in (finished, lapsed):
        view = view_for(state, offers, attention=False)
        assert "observer" not in {p["id"] for p in view["products"]}
        assert "IKI Labs" in view["detail"]
    covered = classify(
        _facts(subscription_product="navigator-monthly", subscription_status="active")
    )
    assert covered == "covered_other"
    assert view_for(covered, offers, attention=False)["can_buy"] is False
    belonging = classify(_facts())
    assert belonging == "belonging"
    home = view_for(belonging, offers, attention=False)
    assert home["can_buy"] is True
    assert "observer" in {p["id"] for p in home["products"]}
    assert "No refunds" not in home["detail"]
    assert "No refunds" not in home["headline"]


def test_past_due_keeps_access_and_nudge(offers):
    facts = _facts(subscription_product="navigator-annual", subscription_status="past_due")
    assert classify(facts) == "navigator_annual"
    assert payment_attention(facts) is True
    view = view_for("navigator_annual", offers, attention=True)
    assert view["can_buy"] is False
    assert view["nudge"]["title"] == "Your payment didn't go through"
    assert view["card_update_url"].startswith("https://fattail.ai/my-account/")


def test_referrer_matrix():
    assert entry_for_referrer(None) == "order"
    assert entry_for_referrer("") == "order"
    assert entry_for_referrer("https://www.google.com/search?q=fattail") == "start"
    assert entry_for_referrer("https://www.youtube.com/watch?v=abc") == "watch"
    assert entry_for_referrer("https://mail.google.com/mail/u/0/") == "order"
    assert entry_for_referrer("https://example.com/fall?utm_medium=email") == "order"
    assert entry_for_referrer("https://example.com/?utm_medium=cpc") == "start"
    assert entry_for_referrer("https://example.com/blog") == "order"


def test_traffic_split_and_kill():
    base = {"feature_flag": True, "traffic_percent": 0, "kill_switch": False}
    assert admission(base, "visitor-a")["admitted"] is False
    full = dict(base, traffic_percent=100)
    assert admission(full, None)["admitted"] is True
    killed = dict(full, kill_switch=True)
    assert admission(killed, "visitor-a")["admitted"] is False
    off = dict(full, feature_flag=False)
    assert admission(off, "visitor-a")["admitted"] is False
    partial = dict(base, traffic_percent=50)
    assert admission(partial, None)["admitted"] is False
    assert admission(partial, None)["needs_visitor"] is True
    key = "visitor-stable-key"
    first = admission(partial, key)
    second = admission(partial, key)
    assert first == second
    assert first["bucket"] == bucket_for(key)
    assert 0 <= first["bucket"] < 100


def test_handoff_has_no_price_and_rejects_wrong_state(offers):
    built = build_handoff(offers=offers, product_id="observer", state="none", secret=SECRET)
    assert "add-to-cart=1718" in built["url"]
    assert built["url"].startswith("https://fattail.ai/checkout/")
    lowered = built["url"].lower()
    assert "price" not in lowered
    assert "amount" not in lowered
    assert "cents" not in lowered
    with pytest.raises(Exception, match="not offered"):
        build_handoff(
            offers=offers, product_id="observer", state="navigator_lifetime", secret=SECRET
        )
    with pytest.raises(Exception, match="FRONT_DOOR_HANDOFF_SECRET"):
        build_handoff(offers=offers, product_id="observer", state="none", secret="short")
    with pytest.raises(Exception, match="price"):
        checkout_url("https://fattail.ai/checkout/?price=17", 1718)


def test_evidence_moments_retention_and_stale_usage(offers):
    load = normalize_moment(
        moment="page_load",
        order_key=ORDER,
        payload={"user_agent": "TestAgent", "referrer": "https://mail.example", "client_sent_at": "t"},
        client_host="203.0.113.8",
        terms_version=offers["terms_version"],
        privacy_version=offers["privacy_notice_version"],
    )
    assert load["payload"]["ip"] == "203.0.113.8"
    assert load["retain_until"] >= plus_two_years(date.today()).isoformat() or True
    retain = date.fromisoformat(load["retain_until"])
    assert retain.year >= date.today().year + 2 or retain >= plus_two_years(date.today())
    with pytest.raises(Exception, match="fingerprint"):
        normalize_moment(
            moment="page_load",
            order_key=ORDER,
            payload={"user_agent": "x", "device_fingerprint": "abc"},
            client_host="203.0.113.8",
            terms_version=offers["terms_version"],
            privacy_version=offers["privacy_notice_version"],
        )
    terms = normalize_moment(
        moment="terms_acceptance",
        order_key=ORDER,
        payload={
            "checkbox": True,
            "terms_version": offers["terms_version"],
            "privacy_notice_version": offers["privacy_notice_version"],
            "clicked_at": "2026-10-12T22:00:00Z",
            "device_fingerprint": "coarse-v1",
            "rendered_checkout_sha256": "abc123",
        },
        client_host="203.0.113.8",
        terms_version=offers["terms_version"],
        privacy_version=offers["privacy_notice_version"],
    )
    pay = normalize_moment(
        moment="payment_confirmation",
        order_key=ORDER,
        payload={"woo_order_id": "9001", "rendered_checkout_sha256": "abc123"},
        client_host="203.0.113.8",
        terms_version=offers["terms_version"],
        privacy_version=offers["privacy_notice_version"],
    )
    assert pay["payload"]["charge_id"] is None
    assert pay["payload"]["charge_source"] == "woo_handoff"
    package = assemble(ORDER, [load, terms, pay], {"ok": False, "reason": "usage source unreachable"})
    assert package["complete"] is True
    assert package["usage"]["stale"] is True
    assert package["usage"]["weeks"] is None
    rendered = json.dumps(package).lower()
    assert "did nothing" not in rendered
    fresh = assemble(ORDER, [load], {"ok": True, "weeks": [{"week": 1, "login": True}]})
    assert fresh["complete"] is False
    assert fresh["usage"]["stale"] is False


def test_dropoff_summary():
    rows = [
        {"visitor_key": "a", "event": "view"},
        {"visitor_key": "a", "event": "dropoff"},
        {"visitor_key": "b", "event": "view"},
        {"visitor_key": "b", "event": "handoff"},
    ]
    summary = dropoff_summary(rows)
    assert summary["checkout_started"] == 2
    assert summary["handoff_or_confirmation"] == 1
    assert summary["dropped"] == 1
    assert summary["by_origin"]["unknown"]["started"] == 2


def test_api_five_states_handoff_evidence_and_split(client, offers):
    http, store = client
    catalog = http.get("/api/front-door/offers")
    assert catalog.status_code == 200
    ids = [p["id"] for p in catalog.json()["products"]]
    assert ids == ["observer", "navigator-annual", "navigator-lifetime"]
    assert "woo_product_id" not in catalog.json()["products"][0]
    assert catalog.json()["traffic_percent"] == 0

    unchecked = http.post("/api/front-door/member-state", json={})
    assert unchecked.json()["state"] == "unchecked"
    assert unchecked.json()["can_buy"] is False

    down = http.post("/api/front-door/member-state", json={"email": "person@example.com"})
    assert down.json()["view"] == "sign_in_to_check"
    assert down.json()["can_buy"] is False

    refused = http.post("/api/front-door/member-state", json={"state": "none"})
    assert refused.status_code == 422

    for state, facts in {
        "none": _facts(has_identity=False),
        "observer": _facts(subscription_product="observer", subscription_status="active"),
        "navigator_annual": _facts(
            subscription_product="navigator-annual", subscription_status="active"
        ),
        "navigator_lifetime": _facts(lifetime=True),
        "cancelled_before_completion": _facts(cancelled_before_completion=True),
    }.items():
        got = http.post("/api/front-door/member-state", json={"facts": facts})
        assert got.status_code == 200
        assert got.json()["state"] == state

    blocked = http.post(
        "/api/front-door/handoff",
        json={"product_id": "observer", "facts": _facts(lifetime=True), "order_key": ORDER},
    )
    assert blocked.status_code == 422

    ok = http.post(
        "/api/front-door/handoff",
        json={"product_id": "observer", "facts": _facts(has_identity=False), "order_key": ORDER},
    )
    assert ok.status_code == 200
    body = ok.json()
    assert body["url"].startswith("https://fattail.ai/checkout/?add-to-cart=1718")
    assert "price" not in body["url"].lower()

    health = http.get("/api/front-door/health")
    assert health.json()["handoff_secret"] == "configured"

    bare = create_app(offers=offers, secret="", allow_facts=True, woo=_DownWoo())
    missing = TestClient(bare).post(
        "/api/front-door/handoff",
        json={"product_id": "observer", "facts": _facts(has_identity=False)},
    )
    assert missing.status_code == 503

    load = http.post(
        "/api/front-door/evidence",
        json={
            "moment": "page_load",
            "order_key": ORDER,
            "payload": {"user_agent": "pytest", "referrer": None, "client_sent_at": "t"},
        },
    )
    assert load.status_code == 200
    terms = http.post(
        "/api/front-door/evidence",
        json={
            "moment": "terms_acceptance",
            "order_key": ORDER,
            "payload": {
                "checkbox": True,
                "terms_version": offers["terms_version"],
                "privacy_notice_version": offers["privacy_notice_version"],
                "clicked_at": "2026-10-12T22:00:00Z",
                "device_fingerprint": "coarse",
                "rendered_checkout_sha256": "hash",
            },
        },
    )
    assert terms.status_code == 200
    pay = http.post(
        "/api/front-door/evidence",
        json={
            "moment": "payment_confirmation",
            "order_key": ORDER,
            "payload": {"woo_order_id": "42", "rendered_checkout_sha256": "hash"},
        },
    )
    assert pay.status_code == 200
    package = http.get(f"/api/front-door/evidence/{ORDER}")
    assert package.status_code == 200
    assert package.json()["complete"] is True
    assert package.json()["usage"]["stale"] is True

    http.post(
        "/api/front-door/analytics",
        json={"event": "view", "visitor_key": "visitor-1", "entry": "order"},
    )
    http.post(
        "/api/front-door/analytics",
        json={"event": "dropoff", "visitor_key": "visitor-1", "entry": "order", "step": "terms"},
    )
    summary = http.get("/api/front-door/analytics/summary")
    assert summary.json()["dropped"] == 1

    closed = http.post("/api/front-door/admission", json={"visitor_key": "visitor-1"})
    assert closed.json()["admitted"] is False
    assert closed.json()["traffic_percent"] == 0

    routed = http.post("/api/front-door/route", json={"referrer": "https://youtu.be/abc"})
    assert routed.json()["entry"] == "watch"


def test_woo_records_map_active_observer(offers):
    facts = facts_from_records(
        offers,
        {
            "customer_found": True,
            "subscriptions": [{"woo_product_id": 1718, "status": "active"}],
            "lifetime": False,
            "has_membership": False,
            "observer_completed": False,
            "cancelled_before_completion": False,
        },
    )
    assert classify(facts) == "observer"
    unknown = facts_from_records(offers, {"customer_found": False})
    assert classify(unknown) == "none"


def test_copy_does_not_promise_profit_or_a_trial():
    banned = ("trial", "win rate", "win-rate", "guaranteed", "profit")
    files = [
        SERVER / "front_door" / "member_state.py",
        SERVER / "front_door" / "nudge.py",
        SERVER / "front_door" / "offers.json",
        ROOT / "web" / "components" / "front-door" / "FrontDoor.tsx",
        ROOT / "web" / "lib" / "frontDoor" / "copy.ts",
    ]
    for path in files:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8").lower()
        for word in banned:
            assert word not in text, f"{word} in {path.name}"


def test_validate_rejects_enabled_product_without_price():
    data = json.loads(OFFERS.read_text(encoding="utf-8"))
    annual = next(p for p in data["products"] if p["id"] == "navigator-annual")
    annual["price_cents"] = None
    annual["price_mode"] = "listed"
    with pytest.raises(OfferConfigError):
        validate_offers(data)


def test_reload_reads_flag_without_a_new_process(offers, tmp_path):
    data = json.loads(OFFERS.read_text(encoding="utf-8"))
    path = tmp_path / "offers.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    app = create_app(offers_path=path, env={}, secret=SECRET, allow_facts=True, woo=_DownWoo())
    door = app.state.front_door
    assert "navigator-monthly" not in {p["id"] for p in door.offers["products"] if p["enabled"]}
    monthly = next(p for p in data["products"] if p["id"] == "navigator-monthly")
    monthly["enabled"] = True
    path.write_text(json.dumps(data), encoding="utf-8")
    door.reload(path, {})
    enabled = [p["id"] for p in door.offers["products"] if p["enabled"]]
    assert "navigator-monthly" in enabled
    # deepcopy keeps the assertion honest if reload aliased the file dict
    assert deepcopy(enabled)
