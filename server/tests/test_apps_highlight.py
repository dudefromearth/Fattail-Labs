"""Apps hub card highlight — Catalog-Order Spec v1.1.2 / DL-321.

Admin-only PUT highlighted. Members see the treatment, not the switch.
"""

from __future__ import annotations

from tests.conftest import cookie_for


def test_list_apps_includes_highlighted(client):
    r = client.get("/api/apps")
    assert r.status_code == 200, r.text
    apps = r.json()["apps"]
    assert apps
    assert all("highlighted" in a for a in apps)
    assert all(isinstance(a["highlighted"], bool) for a in apps)


def test_highlight_requires_admin(client, admin_cookies):
    listed = client.get("/api/apps").json()["apps"]
    journey = next(a for a in listed if a["slug"] == "journey")
    aid = int(journey["id"])

    r = client.put(f"/api/admin/apps/{aid}", json={"highlighted": True})
    assert r.status_code in (401, 403)

    member = cookie_for("navigator")
    r = client.put(
        f"/api/admin/apps/{aid}",
        json={"highlighted": True},
        cookies=member,
    )
    assert r.status_code == 403


def test_admin_can_toggle_highlight(client, admin_cookies):
    listed = client.get("/api/apps").json()["apps"]
    journey = next(a for a in listed if a["slug"] == "journey")
    aid = int(journey["id"])
    original = bool(journey["highlighted"])
    try:
        r = client.put(
            f"/api/admin/apps/{aid}",
            json={"highlighted": not original},
            cookies=admin_cookies,
        )
        assert r.status_code == 200, r.text
        assert r.json()["highlighted"] is (not original)
        again = client.get("/api/apps").json()["apps"]
        row = next(a for a in again if a["id"] == aid)
        assert row["highlighted"] is (not original)
    finally:
        restore = client.put(
            f"/api/admin/apps/{aid}",
            json={"highlighted": original},
            cookies=admin_cookies,
        )
        assert restore.status_code == 200, restore.text
