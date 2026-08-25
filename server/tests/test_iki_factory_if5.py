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
    """IF-7: plan attach no longer auto-conveyors to Build. This helper
    absorbs the now-required explicit pull so every other IF-5 test keeps
    its unchanged contract."""
    card = _to_spec(client, title)
    r = client.patch(
        f"/api/admin/iki-factory/cards/{card['id']}",
        cookies=_admin(),
        json={"plan_ref": "docs/zz-if5-plan.md"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["card"]["lane"] == "spec"
    pulled = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert pulled.status_code == 200, pulled.text
    return pulled.json()["card"]


def _publish(client, title: str, *, free_vs_paid: str = "free") -> dict:
    """IF-7: product-spec patch no longer auto-deploys. This helper absorbs
    the now-required explicit pull to Live."""
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
    assert r.json()["card"]["lane"] == "build"
    pulled = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert pulled.status_code == 200, pulled.text
    return pulled.json()["card"]


def test_lineage_idea_to_published(client):
    """IF-7 re-author. Same conveyor mechanism the India-named tests cover
    end to end across the whole lineage — not itself named, but directly
    invalidated by the same retrain, so rewritten alongside them.

    BEFORE (shipped, IF-5-G PASS): the lane key was "ideas", and three of
    the four hops (ideas->research, spec->build, build->live) were
    auto_move=True — the whole point of this test was proving the auto
    conveyor left a complete, reasoned lineage trail.

    AFTER (v1.0 §2.1 lane rename + §3.1 pull retrain): the lane is
    "backlog", and there is no more auto conveyor to leave a trail for —
    every hop is an explicit pull, auto_move=False throughout. The test's
    real point survives unchanged: every hop still carries an actor and a
    reason (charter invariant 4) — now that is true of ALL transitions,
    not just the auto ones, which is IF-7's actual guarantee.
    """
    got = _publish(client, "zz-if5-lineage")
    trans = client.get(
        f"/api/admin/iki-factory/cards/{got['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    path = [(t["from_lane"], t["to_lane"], bool(t["auto_move"])) for t in trans]
    assert path[0][:2] == (None, "backlog")
    assert ("backlog", "research", False) in path
    assert ("research", "spec", False) in path
    assert ("spec", "build", False) in path
    assert ("build", "live", False) in path
    # IF-7's core guarantee: nothing in the whole lineage is auto anymore.
    assert not any(t["auto_move"] for t in trans)
    assert all((t.get("reason") or "").strip() for t in trans)


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
    """IF-7 re-author. Same conveyor mechanism as the named Hold tests in
    IF-3/IF-4, exercised here across both gates in one lineage — not itself
    named, but directly invalidated by the same retrain.

    BEFORE (shipped, IF-5-G PASS): Hold blocked the patch-triggered
    auto-fire at Spec and again at Build; clearing Hold let each dormant
    auto-fire resume.

    AFTER: patching never advances the card at either gate. Hold now blocks
    the explicit pull itself, at each gate; clearing Hold resumes nothing
    by itself — the pull that was rejected succeeds when retried.
    """
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

    blocked = client.post(
        f"/api/admin/iki-factory/cards/{spec['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert blocked.status_code == 422, blocked.text

    r2 = client.patch(
        f"/api/admin/iki-factory/cards/{spec['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r2.json()["card"]["lane"] == "spec"  # clearing Hold moves nothing by itself
    pulled = client.post(
        f"/api/admin/iki-factory/cards/{spec['id']}/move",
        cookies=_admin(),
        json={"to_lane": "build"},
    )
    assert pulled.status_code == 200, pulled.text
    build = pulled.json()["card"]

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

    blocked2 = client.post(
        f"/api/admin/iki-factory/cards/{build['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert blocked2.status_code == 422, blocked2.text

    r4 = client.patch(
        f"/api/admin/iki-factory/cards/{build['id']}",
        cookies=_admin(),
        json={"hold": False},
    )
    assert r4.json()["card"]["lane"] == "build"  # clearing Hold deploys nothing by itself
    pulled2 = client.post(
        f"/api/admin/iki-factory/cards/{build['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert pulled2.status_code == 200, pulled2.text
    assert pulled2.json()["card"]["published"] is True
    assert pulled2.json()["card"]["woo_reason"] == woo.WOO_STUB_REASON


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
