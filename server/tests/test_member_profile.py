"""Member Profile + Journey presence (Spec v1.0)."""

from io import BytesIO

import pytest

import db
from tests.conftest import cookie_for


@pytest.fixture()
def member_cookies(probe_identity):
    return cookie_for("activator", probe_identity), probe_identity


def test_profile_get_and_patch(client, member_cookies):
    cookies, iid = member_cookies
    r = client.get("/api/me/profile", cookies=cookies)
    assert r.status_code == 200
    body = r.json()
    assert body["identity_id"] == iid
    assert body["journey_visible"] is False
    assert body["avatar_url"] is None

    r2 = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"display_name": "Visible Trader", "journey_visible": True},
    )
    assert r2.status_code == 200
    p = r2.json()
    assert p["display_name"] == "Visible Trader"
    assert p["journey_visible"] is True
    assert p["journey_visible_at"] is not None


def test_presence_roster_opt_in_out(client, member_cookies):
    cookies, _iid = member_cookies
    client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"display_name": "Roster Member", "journey_visible": True},
    )
    roster = client.get("/api/journey/presence", cookies=cookies)
    assert roster.status_code == 200
    names = [m["display_name"] for m in roster.json()["members"]]
    assert "Roster Member" in names
    # No identity leak
    for m in roster.json()["members"]:
        assert "identity_id" not in m
        assert "email" not in m
        assert set(m.keys()) <= {"display_name", "avatar_url"}

    client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"journey_visible": False},
    )
    roster2 = client.get("/api/journey/presence", cookies=cookies)
    names2 = [m["display_name"] for m in roster2.json()["members"]]
    assert "Roster Member" not in names2


def test_avatar_upload(client, member_cookies):
    cookies, _iid = member_cookies
    # Minimal valid-ish PNG (1x1)
    png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00"
        b"\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18"
        b"\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    r = client.post(
        "/api/me/profile/avatar",
        cookies=cookies,
        files={"file": ("av.png", BytesIO(png), "image/png")},
    )
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["avatar_url"] and p["avatar_url"].startswith("/api/media/avatars/")

    me = client.get("/api/auth/me", cookies=cookies)
    assert me.status_code == 200
    assert me.json().get("avatar_url") == p["avatar_url"]

    r_del = client.delete("/api/me/profile/avatar", cookies=cookies)
    assert r_del.status_code == 200
    assert r_del.json()["avatar_url"] is None


def test_presence_requires_session(client):
    assert client.get("/api/journey/presence").status_code == 401


def test_home_quick_nav_default_and_patch(client, member_cookies):
    """Home quick nav defaults to journal; optional chips persist in order."""
    cookies, _iid = member_cookies
    g = client.get("/api/me/profile", cookies=cookies)
    assert g.status_code == 200
    body = g.json()
    assert body["home_quick_nav"] == ["journal"]
    assert any(o["id"] == "wiki" for o in body["home_quick_nav_options"])

    r = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"home_quick_nav": ["wiki", "courses", "journal", "bogus"]},
    )
    assert r.status_code == 200, r.text
    nav = r.json()["home_quick_nav"]
    # journal always first; invalid dropped; order of optionals preserved
    assert nav[0] == "journal"
    assert "wiki" in nav
    assert "courses" in nav
    assert "bogus" not in nav
    assert nav.index("wiki") < nav.index("courses")

    r2 = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"home_quick_nav": []},
    )
    assert r2.status_code == 200
    assert r2.json()["home_quick_nav"] == ["journal"]


def test_profile_cleanup(probe_identity):
    """Reset columns so probe teardown is clean if prior test left state."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE identities
                   SET avatar_url = NULL, journey_visible = 0,
                       journey_visible_at = NULL
                   WHERE identity_id = %s""",
                (probe_identity,),
            )
