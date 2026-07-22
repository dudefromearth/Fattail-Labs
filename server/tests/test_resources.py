"""Resource library: session-gated listing, free vs members downloads,
description/emoji round trip (Resource Library specs v1.0–v1.2)."""

import pytest
from conftest import cookie_for

COURSE = "first-stop-the-bleeding"


@pytest.fixture()
def probe_resource(client, admin_cookies):
    def make(free: bool) -> int:
        r = client.post(
            f"/api/admin/courses/{COURSE}/attachments",
            cookies=admin_cookies,
            json={"title": "zztest Resource", "kind": "link",
                  "url": "https://example.com/doc", "free_preview": free},
        )
        assert r.status_code == 200
        created.append(r.json()["id"])
        return created[-1]

    created: list[int] = []
    yield make
    for aid in created:
        client.delete(f"/api/admin/attachments/{aid}", cookies=admin_cookies)


def test_listing_requires_session(client):
    assert client.get("/api/resources").status_code == 401
    r = client.get("/api/resources", cookies=cookie_for("observer", 901))
    assert r.status_code == 200
    item = r.json()["resources"][0]
    assert "emoji" in item and "description_md" in item


def test_free_resource_downloads_for_any_session(client, probe_resource):
    aid = probe_resource(free=True)
    r = client.get(f"/api/attachments/{aid}/download",
                   cookies=cookie_for("observer", 901), follow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == "https://example.com/doc"


def test_members_resource_blocks_observer_allows_alumni(client, probe_resource):
    aid = probe_resource(free=False)
    r = client.get(f"/api/attachments/{aid}/download",
                   cookies=cookie_for("observer", 901), follow_redirects=False)
    assert r.status_code == 403
    for role in ("alumni", "navigator"):
        r = client.get(f"/api/attachments/{aid}/download",
                       cookies=cookie_for(role, 902), follow_redirects=False)
        assert r.status_code == 302


def test_download_requires_session(client, probe_resource):
    aid = probe_resource(free=True)
    r = client.get(f"/api/attachments/{aid}/download", follow_redirects=False)
    assert r.status_code == 401


def test_description_emoji_round_trip(client, admin_cookies, probe_resource):
    aid = probe_resource(free=True)
    r = client.put(f"/api/admin/attachments/{aid}", cookies=admin_cookies,
                   json={"description_md": "zztest description", "emoji": "📊"})
    assert r.status_code == 200
    items = client.get("/api/resources", cookies=admin_cookies).json()["resources"]
    mine = next(i for i in items if i["id"] == aid)
    assert mine["description_md"] == "zztest description"
    assert mine["emoji"] == "📊"
    # empty strings normalize back to NULL
    client.put(f"/api/admin/attachments/{aid}", cookies=admin_cookies,
               json={"description_md": "", "emoji": ""})
    items = client.get("/api/resources", cookies=admin_cookies).json()["resources"]
    mine = next(i for i in items if i["id"] == aid)
    assert mine["description_md"] is None and mine["emoji"] is None


def test_emoji_length_capped(client, admin_cookies, probe_resource):
    aid = probe_resource(free=True)
    r = client.put(f"/api/admin/attachments/{aid}", cookies=admin_cookies,
                   json={"emoji": "x" * 20})
    assert r.status_code == 422
