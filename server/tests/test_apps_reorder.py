"""Apps hub catalog order — Catalog-Order Spec v1.1 / DL-319.

Admin-only POST /api/admin/apps/reorder rewrites sort_order ×10.
Members never see steppers; the write path is administrator-only.
"""

from __future__ import annotations

import db
from tests.conftest import cookie_for

HUB_SLUGS = (
    "journey",
    "practice-log",
    "toughness",
    "strategy-lab",
    "options-lab",
    "community",
    "wiki",
)


def _hub_rows() -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, sort_order FROM apps
                   WHERE slug IN %s
                   ORDER BY sort_order, id""",
                (HUB_SLUGS,),
            )
            return list(cur.fetchall())


def test_hub_catalog_rows_exist():
    rows = _hub_rows()
    slugs = {r["slug"] for r in rows}
    assert slugs == set(HUB_SLUGS)
    assert all(int(r["id"]) > 0 for r in rows)


def test_list_apps_includes_sort_order(client):
    r = client.get("/api/apps")
    assert r.status_code == 200, r.text
    apps = r.json()["apps"]
    assert apps
    assert all("sort_order" in a and "id" in a for a in apps)
    hub = [a for a in apps if a["slug"] in HUB_SLUGS]
    orders = [a["sort_order"] for a in hub]
    assert orders == sorted(orders)


def test_strategy_lab_card_is_silent_coming_soon(client):
    """Public /app card: name only. No catalog product story."""
    r = client.get("/api/apps")
    assert r.status_code == 200, r.text
    lab = next(a for a in r.json()["apps"] if a["slug"] == "strategy-lab")
    assert lab["title"] == "Strategy Lab"
    assert lab["status"] == "soon"
    assert (lab.get("blurb") or "") == ""


def test_reorder_requires_admin(client, admin_cookies):
    r = client.post("/api/admin/apps/reorder", json={"app_ids": [1]})
    assert r.status_code in (401, 403)

    member = cookie_for("navigator")
    r = client.post(
        "/api/admin/apps/reorder", json={"app_ids": [1]}, cookies=member
    )
    assert r.status_code == 403

    r = client.post(
        "/api/admin/apps/reorder",
        json={"app_ids": "not-a-list"},
        cookies=admin_cookies,
    )
    assert r.status_code == 422


def test_reorder_rewrites_sort_order_x10(client, admin_cookies):
    original = _hub_rows()
    ids = [int(r["id"]) for r in original]
    assert len(ids) >= 2
    reversed_ids = list(reversed(ids))
    try:
        r = client.post(
            "/api/admin/apps/reorder",
            json={"app_ids": reversed_ids},
            cookies=admin_cookies,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["count"] == len(reversed_ids)

        listed = client.get("/api/apps").json()["apps"]
        by_id = {int(a["id"]): a for a in listed}
        for pos, aid in enumerate(reversed_ids, 1):
            assert by_id[aid]["sort_order"] == pos * 10

        unknown = client.post(
            "/api/admin/apps/reorder",
            json={"app_ids": reversed_ids + [9_999_999]},
            cookies=admin_cookies,
        )
        assert unknown.status_code == 422
    finally:
        restore = client.post(
            "/api/admin/apps/reorder",
            json={"app_ids": ids},
            cookies=admin_cookies,
        )
        assert restore.status_code == 200, restore.text
