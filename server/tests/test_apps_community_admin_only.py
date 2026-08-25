"""Community is administrator-only on the Apps catalog (Coach 2026-08-25)."""

# (file continues)

from tests.conftest import cookie_for


def test_list_apps_omits_community_for_anonymous_and_member(client):
    listed = client.get("/api/apps").json()["apps"]
    assert "community" not in {a["slug"] for a in listed}

    member = cookie_for("navigator")
    listed = client.get("/api/apps", cookies=member).json()["apps"]
    assert "community" not in {a["slug"] for a in listed}


def test_list_apps_includes_community_for_admin(client):
    admin = cookie_for("administrator")
    listed = client.get("/api/apps", cookies=admin).json()["apps"]
    assert "community" in {a["slug"] for a in listed}


def test_get_community_app_404_for_member(client):
    member = cookie_for("navigator")
    r = client.get("/api/apps/community", cookies=member)
    assert r.status_code == 404


def test_get_community_app_ok_for_admin(client):
    admin = cookie_for("administrator")
    r = client.get("/api/apps/community", cookies=admin)
    assert r.status_code == 200, r.text
    assert r.json()["slug"] == "community"
