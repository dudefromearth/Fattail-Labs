"""IF-4 characterization — Published first, Woo stub, no Wiki."""

from __future__ import annotations

import inspect
from pathlib import Path

import pytest

import db
import iki_factory
import iki_factory_woo as woo
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _agent
from tests.test_iki_factory_if3 import _to_spec

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture()
def client():
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def _cleanup():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_cards WHERE title LIKE %s",
                ("zz-if4-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _member():
    return cookie_for("navigator")


def _to_build(client, title: str) -> dict:
    """IF-7: plan attach no longer auto-conveyors to Build (India-named
    function). A separate, explicit pull is required; this helper absorbs
    that so every other IF-4 test keeps its unchanged contract — a
    build-ready card back from this call."""
    card = _to_spec(client, title)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if4-plan.md"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "spec"
    pulled = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert pulled.status_code == 200, pulled.text
    got = pulled.json()["card"]
    assert got["lane"] == "build"
    assert got["built_ready"] is True
    return got


def _to_staged(client, card_id: int) -> dict:
    """IF-8 (v1.0 §3.3): Build → Staged is Gemba's pull, as build agent —
    not the admin's, unlike every other forward pull so far. An agent
    actor is required."""
    key = _agent("zz-if4-gemba", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card_id}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "staged"},
    )
    assert r.status_code == 200, r.text
    got = r.json()["card"]
    assert got["lane"] == "staged"
    assert got["staged_ready"] is True
    return got


def _product(client, card_id: int, **extra):
    body = {
        "product_type": "template",
        "product_tier": "navigator",
        "free_vs_paid": "free",
        **extra,
    }
    return client.patch(
        f"/api/admin/iki-factory/cards/{card_id}",
        cookies=_admin(),
        json=body,
    )


def test_missing_product_spec_stays_staged(client):
    """IF-8: Live is reachable only from Staged now (v1.0 §8.1) — the
    "waiting for product spec" rejection this test proves has moved one
    lane down from where it lived pre-IF-8 (Build), unchanged in every
    other respect."""
    card = _to_build(client, "zz-if4-no-product")
    staged = _to_staged(client, card["id"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["reason"] == "waiting for product spec"
    assert r.json()["detail"]["card"]["lane"] == "staged"


def test_hold_blocks_deploy_clear_resumes(client):
    """IF-7 re-author. Same mechanism as the India-named
    test_product_spec_writes_published_then_stub, not itself named, but
    directly invalidated by the same patch_card-tail removal (Delta
    IF-6-G, not-measured item 4) — flagged and rewritten alongside it.

    BEFORE (shipped, IF-4-G PASS): Hold blocked the patch's auto-deploy;
    clearing Hold let that same patch's dormant effect resume, moving the
    card to Live without a further request.

    AFTER: patching product fields never deploys either way. What Hold
    blocks now is the explicit "pull to Live" call itself; clearing Hold
    does not deploy anything by itself — the pull that was rejected now
    succeeds when retried.
    """
    card = _to_build(client, "zz-if4-hold")
    staged = _to_staged(client, card["id"])
    client.patch(
        f"/api/admin/iki-factory/cards/{staged['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    r = _product(client, staged["id"])
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "staged"

    blocked = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert blocked.status_code == 422, blocked.text
    assert "hold" in blocked.json()["detail"]["reason"].lower()

    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{staged['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r2.status_code == 200, r.text
    assert r2.json()["card"]["lane"] == "staged"  # clearing Hold deploys nothing by itself

    pulled = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert pulled.status_code == 200, pulled.text
    got = pulled.json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["woo_reason"] == woo.WOO_STUB_REASON
    assert got["store_visible"] is False
    assert got["woo_product_id"] is None


def test_product_spec_writes_published_then_stub(client):
    """IF-7 re-author (India-named, DL-539 GO IKI-FACTORY-IF7).

    BEFORE (shipped, IF-4-G PASS): patching product type/tier/free-vs-paid
    auto-deployed to Live in the same request — `auto_move_reason` carried
    "invariant #7", and the build->live transition was auto_move=True.

    AFTER (v1.0 §8.2, §8.3): the product-spec fields are still the human
    promotion (invariant #7 unchanged) — Coach enters them, that IS the
    gate — but reaching Live is now a separate, explicit pull. The patch
    alone leaves the card in "build"; auto_move_reason is empty since
    nothing is auto; the transition is auto_move=False, and its own reason
    text is what carries "invariant #7" now.

    IF-8 addendum: Live is reachable only from Staged now (v1.0 §8.1), one
    lane further than when this test was first re-authored — the pull to
    Staged (Gemba, as build agent) is inserted before the product patch.
    """
    card = _to_build(client, "zz-if4-live")
    staged = _to_staged(client, card["id"])
    r = _product(client, staged["id"])
    assert r.status_code == 200, r.text
    patched = r.json()["card"]
    assert patched["lane"] == "staged"  # patch alone does not deploy
    assert not patched["auto_move_reason"]

    pulled = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert pulled.status_code == 200, pulled.text
    got = pulled.json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["obtainable"] is True
    assert got["live_at"]
    assert got["publication_hash"]
    assert got["woo_reason"] == woo.WOO_STUB_REASON
    assert got["store_visible"] is False
    assert got["woo_product_id"] is None
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    deploy = next(t for t in trans if t["from_lane"] == "staged" and t["to_lane"] == "live")
    assert deploy["auto_move"] is False
    assert "invariant #7" in (deploy.get("reason") or "").lower()
    sig = client.get("/api/iki-factory/publication-signal").json()["signals"]
    match = [s for s in sig if s["id"] == got["id"]]
    assert len(match) == 1
    assert set(match[0]) == {"id", "title", "live_at", "content_hash"}
    assert match[0]["content_hash"] == got["publication_hash"]
    assert match[0]["title"] == "zz-if4-live"


def test_woo_stub_does_not_return_success():
    step = woo.woo_step({"id": 1, "title": "x"})
    assert step["ok"] is False
    assert step["stubbed"] is True
    assert step["reason"] == woo.WOO_STUB_REASON
    src = inspect.getsource(woo)
    assert "NAMED STUB" in src
    assert "httpx" not in src
    assert "LABS_WOO" not in src


def _deploy(client, card_id: int) -> dict:
    """IF-7: patching product fields no longer deploys — the explicit pull
    that used to be automatic is now this call."""
    r = client.post(
        f"/api/admin/iki-factory/cards/{card_id}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def test_woo_absence_leaves_published_not_build(client):
    card = _to_build(client, "zz-if4-woo-stub")
    _to_staged(client, card["id"])
    _product(client, card["id"])
    got = _deploy(client, card["id"])
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["woo_reason"] == woo.WOO_STUB_REASON


def test_paid_not_obtainable_free_is(client):
    free = _to_build(client, "zz-if4-free")
    paid = _to_build(client, "zz-if4-paid")
    _to_staged(client, free["id"])
    _to_staged(client, paid["id"])
    _product(client, free["id"], free_vs_paid="free")
    _product(client, paid["id"], free_vs_paid="paid")
    _deploy(client, free["id"])
    _deploy(client, paid["id"])
    listed = client.get("/api/iki-factory/live", cookies=_admin()).json()["templates"]
    by_id = {t["id"]: t for t in listed}
    assert by_id[free["id"]]["obtainable"] is True
    assert by_id[paid["id"]]["obtainable"] is False
    assert by_id[paid["id"]]["published"] is True


def test_catalog_visibility_by_id(client):
    build = _to_build(client, "zz-if4-hidden")
    live = _to_build(client, "zz-if4-shown")
    _to_staged(client, live["id"])
    _product(client, live["id"])
    _deploy(client, live["id"])
    listed = client.get("/api/iki-factory/live", cookies=_admin()).json()["templates"]
    ids = {t["id"] for t in listed}
    assert live["id"] in ids
    assert build["id"] not in ids
    hidden = client.get(
        f"/api/iki-factory/live/{build['id']}",
        cookies=_admin(),
    )
    assert hidden.status_code == 404
    shown = client.get(
        f"/api/iki-factory/live/{live['id']}",
        cookies=_admin(),
    )
    assert shown.status_code == 200, shown.text
    assert shown.json()["template"]["id"] == live["id"]
    assert shown.json()["template"]["published"] is True


def test_gemba_cannot_rework_published(client):
    from tests.test_iki_factory_if1 import _agent

    card = _to_build(client, "zz-if4-rework-gemba")
    _to_staged(client, card["id"])
    _product(client, card["id"])
    _deploy(client, card["id"])
    live = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
    ).json()["card"]
    assert live["published"] is True
    key = _agent("zz-if4-rework", ["factory:operate"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{live['id']}/status",
        headers={"Authorization": f"Bearer {key}"},
        json={"card_status": "rework", "rework_lane": "research"},
    )
    assert r.status_code in (401, 403, 422)
    still = client.get(
        f"/api/admin/iki-factory/cards/{live['id']}",
        cookies=_admin(),
    ).json()["card"]
    assert still["lane"] == "live"
    assert still["published"] is True


def test_admin_rework_from_published(client):
    card = _to_build(client, "zz-if4-rework-admin")
    _product(client, card["id"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/status",
        cookies=_admin(),
        json={"card_status": "rework", "rework_lane": "research"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "research"
    assert r.json()["card"]["card_status"] == "rework"


def test_live_requires_admin(client):
    r = client.get("/api/iki-factory/live")
    assert r.status_code == 401
    member = client.get("/api/iki-factory/live", cookies=_member())
    assert member.status_code == 403
    admin = client.get("/api/iki-factory/live", cookies=_admin())
    assert admin.status_code == 200


def test_factory_does_not_touch_wiki_or_runner():
    src = inspect.getsource(iki_factory)
    assert "wiki_agent" not in src
    assert "wiki_store" not in src
    assert "contracts:deliver" not in src
    woo_src = inspect.getsource(woo)
    assert "wiki" not in woo_src.lower()
    live_src = inspect.getsource(
        __import__("routes.iki_factory_live", fromlist=["router"])
    )
    assert "wiki_agent" not in live_src
    runner = ROOT / "web" / "lib" / "runner" / "registry.ts"
    text = runner.read_text(encoding="utf-8")
    assert "iki_factory" not in text
    assert "ftl-iki-" not in text
