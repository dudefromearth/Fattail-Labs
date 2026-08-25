"""IF-5 hardening — lineage, notify, moves, Hold, Hotel, Woo stub."""

from __future__ import annotations

import re
from pathlib import Path

import pytest

import db
import iki_factory
import iki_factory_research as research
import iki_factory_woo as woo
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _agent, _create
from tests.test_iki_factory_if3 import _to_spec

ROOT = Path(__file__).resolve().parents[2]
PROFIT = re.compile(
    r"\b(profit|guaranteed return|you should|buy this|expected return|will make money)\b",
    re.I,
)


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
                ("zz-if5-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _to_build(client, title: str) -> dict:
    card = _to_spec(client, title)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if5-plan.md"},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def _publish(client, title: str, *, free_vs_paid: str = "free") -> dict:
    card = _to_build(client, title)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={
            "product_type": "template",
            "product_tier": "navigator",
            "free_vs_paid": free_vs_paid,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def test_lineage_idea_to_published(client):
    got = _publish(client, "zz-if5-lineage")
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    path = [(t["from_lane"], t["to_lane"], bool(t["auto_move"])) for t in trans]
    assert path[0][:2] == (None, "ideas") or path[0][1] == "ideas"
    assert ("ideas", "research", True) in path
    assert ("research", "spec", False) in path
    assert ("spec", "build", True) in path
    assert ("build", "live", True) in path
    autos = [t for t in trans if t["auto_move"]]
    assert autos
    assert all((t.get("reason") or "").strip() for t in autos)


def test_notify_called_on_published_and_survives_failure(client, monkeypatch):
    calls: list[dict] = []

    def record(**kwargs):
        calls.append(kwargs)

    monkeypatch.setattr("notify.notify_admins", record)
    got = _publish(client, "zz-if5-notify")
    assert got["published"] is True
    kinds = [c.get("kind") for c in calls]
    assert "factory.live" in kinds

    def boom(**kwargs):
        raise RuntimeError("notify down")

    monkeypatch.setattr("notify.notify_admins", boom)
    got2 = _publish(client, "zz-if5-notify-fail")
    assert got2["published"] is True
    assert got2["woo_reason"] == woo.WOO_STUB_REASON


def test_invalid_move_matrix(client):
    card = _create(client, "zz-if5-matrix")
    assert card["lane"] == "research"
    key = _agent("zz-if5-gemba", ["factory:operate"])
    skip = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert skip.status_code == 422
    agent_rs = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "spec"},
    )
    assert agent_rs.status_code == 422
    spec = _to_spec(client, "zz-if5-matrix-spec")
    skip_live = client.post(
        f"/api/admin/iki-factory/cards/{spec['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert skip_live.status_code == 422
    back = client.post(
        f"/api/admin/iki-factory/cards/{spec['id']}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "research"},
    )
    assert back.status_code == 422


def test_hold_skips_spec_and_live(client):
    spec = _to_spec(client, "zz-if5-hold-spec")
    client.patch(
        f"/api/admin/iki-factory/cards/{spec['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    r = client.patch(
        f"/api/admin/iki-factory/cards/{spec['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if5-hold.md"},
    )
    assert r.json()["card"]["lane"] == "spec"
    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{spec['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r2.json()["card"]["lane"] == "build"
    build = r2.json()["card"]
    client.patch(
        f"/api/admin/iki-factory/cards/{build['id']}",
        cookies=_admin(),
        json={"hold": True},
    )
    r3 = client.patch(
        f"/api/admin/iki-factory/cards/{build['id']}",
        cookies=_admin(),
        json={
            "product_type": "template",
            "product_tier": "navigator",
            "free_vs_paid": "free",
        },
    )
    assert r3.json()["card"]["lane"] == "build"
    r4 = client.patch(
        f"/api/admin/iki-factory/cards/{build['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r4.json()["card"]["published"] is True
    assert r4.json()["card"]["woo_reason"] == woo.WOO_STUB_REASON


def test_window_expiry_visible(client):
    card = _create(client, "zz-if5-timeout")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET blocked_reason = NULL,
                       waiting_reason = 'waiting for skills',
                       research_window_ends_at = UTC_TIMESTAMP() - INTERVAL 1 DAY
                 WHERE id = %s
                """,
                (card["id"],),
            )
    n = research.expire_open_windows()
    assert n >= 1
    got = client.get(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
    ).json()["card"]
    assert "expired" in (got.get("blocked_reason") or "").lower()
    assert got["lane"] == "research"


def test_missing_product_spec_stays_build(client):
    card = _to_build(client, "zz-if5-noproduct")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert r.status_code == 422
    assert r.json()["detail"]["card"]["lane"] == "build"


def test_woo_stub_named_not_success():
    src = Path(woo.__file__).read_text(encoding="utf-8")
    assert "NAMED STUB" in src
    assert "does not return success" in src.lower() or "Does not return success" in src
    step = woo.woo_step({"id": 0})
    assert step["ok"] is False
    assert step["stubbed"] is True


def test_hotel_pass_agent_drafted_strings():
    files = [
        ROOT / "server/iki_factory.py",
        ROOT / "server/iki_factory_woo.py",
        ROOT / "server/iki_factory_research.py",
        ROOT / "web/components/iki/IkiFactoryLiveCatalog.tsx",
        ROOT / "web/components/admin/IkiFactoryBoard.tsx",
    ]
    hits = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        for i, line in enumerate(text.splitlines(), 1):
            if PROFIT.search(line) and not any(
                m in line
                for m in (
                    "_PROFIT",
                    "BAD_SHAPE",
                    "Hotel shape",
                    "re.compile",
                    "guaranteed return",
                )
            ):
                hits.append(f"{path.name}:{i}:{line.strip()}")
    assert hits == []
    assert "results promise" in (
        ROOT / "web/components/iki/IkiFactoryLiveCatalog.tsx"
    ).read_text()
    assert woo.WOO_STUB_REASON in (
        ROOT / "server/iki_factory_woo.py"
    ).read_text()
