"""IF-8 characterization — the Staged lane.

Spec: Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md §7 (supersedes v1.0)
Charter: agents/bench/gemba.md — Staged production, workflow 7

Scope: Build -> Staged (Gemba's pull, §3.3) and Staged production of four
artifacts (product, landing_page, store_placement, help_page) — dark
until Live. wiki_page is not a Staged artifact at all (DL-583, amending
this GO after its original gate): the wiki page was never the Factory's
to build — it is Oscar's, composed after publication from the published
help guide (the general derivation rule, §7.8), not a Factory-specific
gap. The original IF-8 build seeded it as a fifth, permanently-blocked
slot (v1.0 §8.10); that slot is removed, not merely left unbuilt.

Also carries forward IF-7-G's "what the acceptance tests did not measure"
item 1: no prior test proved Gemba (an agent principal) could actually
pull Backlog -> Research, despite the pull table naming "Gemba or a
human." Proven here.
"""

from __future__ import annotations

import db
import pytest
from main import app
from tests.conftest import LabsTestClient, cookie_for
from tests.test_iki_factory_if1 import _agent, _deposit
from tests.test_iki_factory_if4 import _product, _to_build


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
                ("zz-if8-%",),
            )


@pytest.fixture(autouse=True)
def isolate():
    _cleanup()
    yield
    _cleanup()


def _admin():
    return cookie_for("administrator")


def _gemba(callsign: str = "zz-if8-gemba") -> str:
    return _agent(callsign, ["factory:operate"])


def _to_staged(client, card_id: int, *, gemba_key: str | None = None) -> dict:
    key = gemba_key or _gemba()
    r = client.post(
        f"/api/admin/iki-factory/cards/{card_id}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "staged"},
    )
    assert r.status_code == 200, r.text
    return r.json()["card"]


def test_build_to_staged_requires_gemba_agent(client):
    """v1.0 §3.3: 'Build → Staged | Gemba as build agent' — named, like
    Research→Spec and Spec→Build are named to the admin. Admin cannot pull
    this transition; an agent can."""
    card = _to_build(client, "zz-if8-actor")
    rejected = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/move",
        cookies=_admin(),
        json={"to_lane": "staged"},
    )
    assert rejected.status_code == 422, rejected.text
    assert "gemba" in rejected.json()["detail"]["reason"].lower()
    assert rejected.json()["detail"]["card"]["lane"] == "build"

    staged = _to_staged(client, card["id"])
    assert staged["lane"] == "staged"
    assert staged["staged_ready"] is True


def test_staged_seeds_four_artifacts_no_wiki_page(client):
    """§7.3 (amended, DL-583): product, landing_page, store_placement,
    help_page. All four seed 'pending' — Gemba produces them explicitly,
    no invention. There is no wiki_page slot to seed — not a gap left
    unbuilt, an artifact that was never the Factory's to build."""
    card = _to_build(client, "zz-if8-seed")
    staged = _to_staged(client, card["id"])
    artifacts = client.get(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged",
        cookies=_admin(),
    ).json()["staged_artifacts"]
    by_kind = {a["kind"]: a for a in artifacts}
    assert set(by_kind) == {
        "product",
        "landing_page",
        "store_placement",
        "help_page",
    }
    for kind in by_kind:
        assert by_kind[kind]["status"] == "pending"
        assert not by_kind[kind]["blocked_reason"]


def test_produce_staged_artifact_round_trip(client):
    card = _to_build(client, "zz-if8-produce")
    key = _gemba()
    staged = _to_staged(client, card["id"], gemba_key=key)
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged/landing_page",
        headers={"Authorization": f"Bearer {key}"},
        json={"body": "Draft landing copy — process outcomes only, no profit claims."},
    )
    assert r.status_code == 200, r.text
    art = r.json()["artifact"]
    assert art["status"] == "ready"
    assert art["body"] == "Draft landing copy — process outcomes only, no profit claims."
    assert art["produced_by_label"]

    listed = client.get(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged",
        cookies=_admin(),
    ).json()["staged_artifacts"]
    ready = next(a for a in listed if a["kind"] == "landing_page")
    assert ready["status"] == "ready"


def test_produce_staged_artifact_admin_can_stand_in(client):
    """No production skill exists yet (mirrors IF-2's empty-registry
    posture) — until one does, an admin may stand in for Gemba."""
    card = _to_build(client, "zz-if8-admin-produce")
    staged = _to_staged(client, card["id"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged/help_page",
        cookies=_admin(),
        json={"body": "How to configure this template."},
    )
    assert r.status_code == 200, r.text
    assert r.json()["artifact"]["status"] == "ready"


def test_produce_staged_artifact_requires_body(client):
    card = _to_build(client, "zz-if8-empty-body")
    staged = _to_staged(client, card["id"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged/product",
        cookies=_admin(),
        json={},
    )
    assert r.status_code == 422, r.text


def test_wiki_page_is_not_a_valid_kind(client):
    """Not a permanently-blocked slot anymore (that was the original IF-8
    build, v1.0 §8.10) — wiki_page is dropped entirely (DL-583). Rejected
    the same way any unrecognized kind would be, by Gemba or anyone else,
    because the artifact was never the Factory's to produce."""
    card = _to_build(client, "zz-if8-wiki-gap")
    key = _gemba()
    staged = _to_staged(client, card["id"], gemba_key=key)
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged/wiki_page",
        headers={"Authorization": f"Bearer {key}"},
        json={"body": "Anything at all."},
    )
    assert r.status_code == 422, r.text
    assert "kind must be one of" in r.json()["detail"].lower()


def test_produce_artifact_only_in_staged(client):
    card = _to_build(client, "zz-if8-wrong-lane")
    r = client.post(
        f"/api/admin/iki-factory/cards/{card['id']}/staged/product",
        cookies=_admin(),
        json={"body": "Too early."},
    )
    assert r.status_code == 422, r.text


def test_produce_artifact_requires_factory_scope(client):
    card = _to_build(client, "zz-if8-member")
    staged = _to_staged(client, card["id"])
    r = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/staged/product",
        cookies=cookie_for("navigator"),
        json={"body": "Not allowed."},
    )
    assert r.status_code == 403, r.text


def test_staged_to_live_gated_on_staged_ready_and_product_not_artifacts(client):
    """Judgment call from the original IF-8 gate, unchanged by the DL-583
    amendment: §7.6 (v1.0) read literally made Live unreachable, since
    wiki_page could never be produced there. §7.6 is now rewritten
    (DL-583) so a wiki page is explicitly not a Live precondition — a
    product publishes and goes visibly noisy until one exists — which
    confirms this reading rather than reversing it. Staged->Live still
    requires exactly what Build->Live required before (staged_ready +
    product-completeness); artifact status (any of the four) is tracked
    and visible, not enforced as a switch condition."""
    card = _to_build(client, "zz-if8-gate")
    staged = _to_staged(client, card["id"])

    missing_product = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert missing_product.status_code == 422, missing_product.text
    assert missing_product.json()["detail"]["reason"] == "waiting for product spec"

    _product(client, staged["id"])
    # No artifact has been produced — Live still succeeds. This is the
    # judgment call named above, not an oversight.
    deployed = client.post(
        f"/api/admin/iki-factory/cards/{staged['id']}/move",
        cookies=_admin(),
        json={"to_lane": "live"},
    )
    assert deployed.status_code == 200, deployed.text
    assert deployed.json()["card"]["published"] is True


def test_gemba_pull_backlog_to_research(client):
    """Carried from IF-7-G, 'what the acceptance tests did not measure'
    item 1: the pull table names 'Backlog → Research: Gemba or a human'
    (v1.0 §3.3), but every prior test reached Research via the admin
    cookie. Proven here: an agent principal can pull it too."""
    deposited = _deposit(client, "zz-if8-gemba-pull")
    assert deposited["lane"] == "backlog"
    key = _gemba("zz-if8-pull-agent")
    r = client.post(
        f"/api/admin/iki-factory/cards/{deposited['id']}/move",
        headers={"Authorization": f"Bearer {key}"},
        json={"to_lane": "research"},
    )
    assert r.status_code == 200, r.text
    got = r.json()["card"]
    assert got["lane"] == "research"
    trans = client.get(
        f"/api/admin/iki-factory/cards/{deposited['id']}",
        cookies=_admin(),
    ).json()["transitions"]
    move = next(t for t in trans if t["from_lane"] == "backlog" and t["to_lane"] == "research")
    assert move["actor_kind"] == "agent"
    assert (move.get("reason") or "").strip()
