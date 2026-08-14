"""Resource library: session-gated listing, free vs members downloads,
description/emoji round trip (Resource Library specs v1.0–v1.2)."""

import uuid

import pytest
from conftest import cookie_for


@pytest.fixture()
def probe_resource(client, admin_cookies, published_access_course):
    """Create a published hub resource and attach it to a probe course."""
    course = published_access_course["slug"]
    slugs: list[str] = []

    def make(free: bool) -> dict:
        slug = f"zzres-{uuid.uuid4().hex[:10]}"
        r = client.post(
            "/api/admin/resources",
            cookies=admin_cookies,
            json={
                "title": "zztest Resource",
                "type": "document",
                "kind": "link",
                "url": "https://example.com/doc",
                "slug": slug,
                "publish": True,
            },
        )
        assert r.status_code == 200, r.text
        slugs.append(r.json()["slug"])
        att = client.post(
            f"/api/admin/courses/{course}/resources",
            cookies=admin_cookies,
            json={
                "resource_slug": r.json()["slug"],
                "free_preview": free,
            },
        )
        assert att.status_code == 200, att.text
        return {"slug": r.json()["slug"], "version_id": r.json()["version_id"]}

    yield make
    for slug in slugs:
        client.delete(f"/api/admin/resources/{slug}", cookies=admin_cookies)


def test_listing_requires_session(client):
    assert client.get("/api/resources").status_code == 401
    r = client.get("/api/resources", cookies=cookie_for("observer", 901))
    assert r.status_code == 200
    item = r.json()["resources"][0]
    assert "emoji" in item and "description_md" in item


def test_free_resource_downloads_for_any_session(client, probe_resource):
    rec = probe_resource(free=True)
    r = client.get(
        f"/api/resource-versions/{rec['version_id']}/download",
        cookies=cookie_for("observer", 901),
        follow_redirects=False,
    )
    assert r.status_code == 302
    assert r.headers["location"] == "https://example.com/doc"


def test_members_resource_blocks_observer_allows_alumni(client, probe_resource):
    rec = probe_resource(free=False)
    r = client.get(
        f"/api/resource-versions/{rec['version_id']}/download",
        cookies=cookie_for("observer", 901),
        follow_redirects=False,
    )
    assert r.status_code == 403
    for role in ("alumni", "navigator"):
        r = client.get(
            f"/api/resource-versions/{rec['version_id']}/download",
            cookies=cookie_for(role, 902),
            follow_redirects=False,
        )
        assert r.status_code == 302


def test_download_requires_session(client, probe_resource):
    rec = probe_resource(free=True)
    r = client.get(
        f"/api/resource-versions/{rec['version_id']}/download",
        follow_redirects=False,
    )
    assert r.status_code == 401


def test_description_emoji_round_trip(client, admin_cookies, probe_resource):
    rec = probe_resource(free=True)
    r = client.patch(
        f"/api/admin/resources/{rec['slug']}",
        cookies=admin_cookies,
        json={"description_md": "zztest description", "emoji": "📊"},
    )
    assert r.status_code == 200, r.text
    items = client.get("/api/resources", cookies=admin_cookies).json()["resources"]
    mine = next(i for i in items if i["slug"] == rec["slug"])
    assert mine["description_md"] == "zztest description"
    assert mine["emoji"] == "📊"
    client.patch(
        f"/api/admin/resources/{rec['slug']}",
        cookies=admin_cookies,
        json={"description_md": "", "emoji": ""},
    )
    items = client.get("/api/resources", cookies=admin_cookies).json()["resources"]
    mine = next(i for i in items if i["slug"] == rec["slug"])
    assert mine["description_md"] is None and mine["emoji"] is None


def test_emoji_length_capped(client, admin_cookies, probe_resource):
    rec = probe_resource(free=True)
    r = client.patch(
        f"/api/admin/resources/{rec['slug']}",
        cookies=admin_cookies,
        json={"emoji": "x" * 20},
    )
    assert r.status_code == 422
