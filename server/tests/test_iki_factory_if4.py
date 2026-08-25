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
    card = _to_spec(client, title)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if4-plan.md"},
    )
    assert r.status_code == 200, r.text
    got = r.json()["card"]
    assert got["lane"] == "build"
    assert got["built_ready"] is True
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


def test_missing_product_spec_stays_build(client):
    card = _to_build(client, "zz-if4-no-product")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"]["reason"] == "waiting for product spec"
    assert r.json()["detail"]["card"]["lane"] == "build"


def test_hold_blocks_deploy_clear_resumes(client):
    card = _to_build(client, "zz-if4-hold")
    client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    r = _product(client, card["id"])
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "build"
    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    got = r2.json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["woo_reason"] == woo.WOO_STUB_REASON
    assert got["store_visible"] is False
    assert got["woo_product_id"] is None


def test_product_spec_writes_published_then_stub(client):
    card = _to_build(client, "zz-if4-live")
    r = _product(client, card["id"])
    assert r.status_code == 200, r.text
    got = r.json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["obtainable"] is True
    assert got["live_at"]
    assert got["publication_hash"]
    assert got["woo_reason"] == woo.WOO_STUB_REASON
    assert got["store_visible"] is False
    assert got["woo_product_id"] is None
    assert "invariant #7" in (got["auto_move_reason"] or "").lower()
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    assert any(
        t["from_lane"] == "build" and t["to_lane"] == "live" and t["auto_move"]
        for t in trans
    )
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


def test_woo_absence_leaves_published_not_build(client):
    card = _to_build(client, "zz-if4-woo-stub")
    r = _product(client, card["id"])
    got = r.json()["card"]
    assert got["lane"] == "live"
    assert got["published"] is True
    assert got["woo_reason"] == woo.WOO_STUB_REASON


def test_paid_not_obtainable_free_is(client):
    free = _to_build(client, "zz-if4-free")
    paid = _to_build(client, "zz-if4-paid")
    _product(client, free["id"], free_vs_paid="free")
    _product(client, paid["id"], free_vs_paid="paid")
    listed = client.get("/api/iki-factory/live", cookies=_member()).json()["templates"]
    by_id = {t["id"]: t for t in listed}
    assert by_id[free["id"]]["obtainable"] is True
    assert by_id[paid["id"]]["obtainable"] is False
    assert by_id[paid["id"]]["published"] is True


def test_catalog_visibility_by_id(client):
    build = _to_build(client, "zz-if4-hidden")
    live = _to_build(client, "zz-if4-shown")
    _product(client, live["id"])
    listed = client.get("/api/iki-factory/live", cookies=_member()).json()["templates"]
    ids = {t["id"] for t in listed}
    assert live["id"] in ids
    assert build["id"] not in ids
    hidden = client.get(
        f"/api/iki-factory/live/{build['id']}",
        cookies=_member(),
    )
    assert hidden.status_code == 404
    shown = client.get(
        f"/api/iki-factory/live/{live['id']}",
        cookies=_member(),
    )
    assert shown.status_code == 200, shown.text
    assert shown.json()["template"]["id"] == live["id"]
    assert shown.json()["template"]["published"] is True


def test_gemba_cannot_rework_published(client):
    from tests.test_iki_factory_if1 import _agent

    card = _to_build(client, "zz-if4-rework-gemba")
    _product(client, card["id"])
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


def test_live_requires_session(client):
    r = client.get("/api/iki-factory/live")
    assert r.status_code == 401


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
