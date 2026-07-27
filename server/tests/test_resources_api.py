"""R2 — Resource HTTP APIs (member hub + admin + course attach)."""

from __future__ import annotations

import uuid

import db
import resources_domain as rd


def _uid(p: str = "zzrapi") -> str:
    return f"{p}-{uuid.uuid4().hex[:10]}"


def _admin(client, admin_cookies):
    return admin_cookies


def test_member_list_and_slug_publish_gate(client, admin_cookies):
    slug = _uid()
    # create unpublished
    r = client.post(
        "/api/admin/resources",
        cookies=admin_cookies,
        json={
            "title": "API Trade Log",
            "description_md": "v1 log",
            "type": "spreadsheet",
            "kind": "link",
            "url": "https://example.com/log-v1",
            "slug": slug,
            "publish": False,
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["published"] is False

    # member session (activator)
    from conftest import cookie_for

    member = cookie_for("activator", identity_id=1)
    listed = client.get("/api/resources", cookies=member)
    assert listed.status_code == 200
    slugs = {x.get("slug") for x in listed.json()["resources"] if x.get("slug")}
    assert slug not in slugs

    # publish
    p = client.post(
        f"/api/admin/resources/{r.json()['slug']}/publish",
        cookies=admin_cookies,
        json={"version": 1},
    )
    assert p.status_code == 200, p.text

    listed2 = client.get("/api/resources", cookies=member)
    assert listed2.status_code == 200
    hit = [x for x in listed2.json()["resources"] if x.get("slug") == r.json()["slug"]]
    assert len(hit) == 1
    assert hit[0]["version"] == 1
    assert hit[0]["source"] == "resource"

    g = client.get(f"/api/resources/{r.json()['slug']}", cookies=member)
    assert g.status_code == 200
    assert g.json()["version"] == 1

    # unauth
    assert client.get("/api/resources").status_code in (401, 403)


def test_pin_download_after_new_publish(client, admin_cookies):
    """Course pin stays on v1 download while hub serves v2."""
    from conftest import cookie_for

    member = cookie_for("activator", identity_id=1)
    slug = _uid()
    # course
    c = client.post(
        "/api/admin/courses",
        cookies=admin_cookies,
        json={"title": f"ZZ Course {slug}"},
    )
    assert c.status_code == 200
    course_slug = c.json()["slug"]

    cr = client.post(
        "/api/admin/resources",
        cookies=admin_cookies,
        json={
            "title": "Pinned Log",
            "type": "spreadsheet",
            "kind": "link",
            "url": "https://example.com/pin-v1",
            "slug": slug,
            "publish": True,
        },
    )
    assert cr.status_code == 200
    rslug = cr.json()["slug"]
    v1_id = cr.json()["version_id"]

    att = client.post(
        f"/api/admin/courses/{course_slug}/resources",
        cookies=admin_cookies,
        json={"resource_slug": rslug, "pinned_version": 1, "free_preview": True},
    )
    assert att.status_code == 200, att.text

    # v2 published
    v2 = client.post(
        f"/api/admin/resources/{rslug}/versions",
        cookies=admin_cookies,
        json={
            "kind": "link",
            "url": "https://example.com/pin-v2",
            "publish": True,
            "changelog_md": "new columns",
        },
    )
    assert v2.status_code == 200
    assert v2.json()["version"] == 2

    hub = client.get(f"/api/resources/{rslug}", cookies=member)
    assert hub.status_code == 200
    assert hub.json()["version"] == 2

    # pin still v1
    cl = client.get(
        f"/api/admin/courses/{course_slug}/resources", cookies=admin_cookies
    )
    assert cl.status_code == 200
    rows = cl.json()["resources"]
    assert rows[0]["pinned_version"] == 1

    # download pin (free) → redirect v1 url
    d = client.get(
        f"/api/resource-versions/{v1_id}/download",
        cookies=member,
        follow_redirects=False,
    )
    assert d.status_code in (302, 307)
    assert "pin-v1" in d.headers.get("location", "")

    # public course payload includes resources
    # publish course first for public GET? public course detail may need published
    client.put(
        f"/api/admin/courses/{course_slug}",
        cookies=admin_cookies,
        json={"status": "published"},
    )
    pub = client.get(f"/api/courses/{course_slug}")
    assert pub.status_code == 200
    body = pub.json()
    assert "resources" in body
    assert any(x.get("slug") == rslug for x in body["resources"])
    assert body["resources"][0]["pinned_version"] == 1

    # cleanup
    client.delete(
        f"/api/admin/courses/{course_slug}/resources/{rslug}",
        cookies=admin_cookies,
    )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM resources WHERE slug = %s", (rslug,))
            row = cur.fetchone()
            if row:
                rid = row["id"]
                cur.execute(
                    "UPDATE resources SET published_version_id = NULL WHERE id = %s",
                    (rid,),
                )
                cur.execute(
                    "DELETE FROM resource_versions WHERE resource_id = %s", (rid,)
                )
                cur.execute("DELETE FROM resources WHERE id = %s", (rid,))
    client.put(
        f"/api/admin/courses/{course_slug}",
        cookies=admin_cookies,
        json={"status": "draft"},
    )
    client.delete(f"/api/admin/courses/{course_slug}", cookies=admin_cookies)


def test_admin_only_mutators(client):
    r = client.post(
        "/api/admin/resources",
        json={"title": "x", "type": "link", "kind": "link", "url": "https://x.com"},
    )
    assert r.status_code in (401, 403)


def test_hub_single_source_no_attachment_merge(client, admin_cookies):
    """R6: library list only returns source=resource."""
    from conftest import cookie_for

    member = cookie_for("activator", identity_id=1)
    listed = client.get("/api/resources", cookies=member)
    assert listed.status_code == 200
    body = listed.json()
    assert body.get("sources") == ["resource"]
    for item in body["resources"]:
        assert item.get("source") == "resource"
        assert item.get("slug")


def test_legacy_attachment_create_becomes_resource(client, admin_cookies):
    """POST …/attachments now creates resource + link (compat shim)."""
    c = client.post(
        "/api/admin/courses",
        cookies=admin_cookies,
        json={"title": "ZZ Attach Shim"},
    )
    assert c.status_code == 200
    cslug = c.json()["slug"]
    r = client.post(
        f"/api/admin/courses/{cslug}/attachments",
        cookies=admin_cookies,
        json={
            "title": "Shim Worksheet",
            "kind": "link",
            "url": "https://example.com/shim",
            "free_preview": True,
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("via") == "resource"
    assert body.get("slug")
    cl = client.get(
        f"/api/admin/courses/{cslug}/resources", cookies=admin_cookies
    )
    assert cl.status_code == 200
    assert any(x["slug"] == body["slug"] for x in cl.json()["resources"])
    client.delete(
        f"/api/admin/courses/{cslug}/resources/{body['slug']}",
        cookies=admin_cookies,
    )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM resources WHERE slug = %s", (body["slug"],)
            )
            row = cur.fetchone()
            if row:
                rid = row["id"]
                cur.execute(
                    "UPDATE resources SET published_version_id = NULL WHERE id = %s",
                    (rid,),
                )
                cur.execute(
                    "DELETE FROM resource_versions WHERE resource_id = %s", (rid,)
                )
                cur.execute("DELETE FROM resources WHERE id = %s", (rid,))
    client.delete(f"/api/admin/courses/{cslug}", cookies=admin_cookies)


def test_admin_hard_delete_resource(client, admin_cookies):
    """DELETE /api/admin/resources/{slug} removes head, versions, and course links."""
    slug = _uid("zzdel")
    cr = client.post(
        "/api/admin/resources",
        cookies=admin_cookies,
        json={
            "title": "Delete Me Worksheet",
            "type": "document",
            "kind": "link",
            "url": "https://example.com/delete-me",
            "slug": slug,
            "publish": True,
        },
    )
    assert cr.status_code == 200, cr.text
    rslug = cr.json()["slug"]

    c = client.post(
        "/api/admin/courses",
        cookies=admin_cookies,
        json={"title": f"ZZ Del Course {slug}"},
    )
    assert c.status_code == 200, c.text
    cslug = c.json()["slug"]
    att = client.post(
        f"/api/admin/courses/{cslug}/resources",
        cookies=admin_cookies,
        json={"resource_slug": rslug, "pinned_version": 1},
    )
    assert att.status_code == 200, att.text

    d = client.delete(f"/api/admin/resources/{rslug}", cookies=admin_cookies)
    assert d.status_code == 200, d.text
    body = d.json()
    assert body["deleted"] is True
    assert body["unlinked_courses"] >= 1

    assert client.get(f"/api/admin/resources/{rslug}", cookies=admin_cookies).status_code == 404
    listed = client.get("/api/admin/resources", cookies=admin_cookies).json()["resources"]
    assert all(x.get("slug") != rslug for x in listed)

    # course link gone
    crlist = client.get(
        f"/api/admin/courses/{cslug}/resources", cookies=admin_cookies
    ).json()["resources"]
    assert all(x.get("slug") != rslug for x in crlist)

    client.delete(f"/api/admin/courses/{cslug}", cookies=admin_cookies)


def test_members_only_download_403(client, admin_cookies):
    from conftest import cookie_for

    observer = cookie_for("observer", identity_id=2)
    slug = _uid()
    cr = client.post(
        "/api/admin/resources",
        cookies=admin_cookies,
        json={
            "title": "Paid Sheet",
            "type": "document",
            "kind": "link",
            "url": "https://example.com/paid",
            "slug": slug,
            "publish": True,
        },
    )
    assert cr.status_code == 200
    vid = cr.json()["version_id"]
    rslug = cr.json()["slug"]
    # no free links → free=false
    d = client.get(
        f"/api/resource-versions/{vid}/download",
        cookies=observer,
        follow_redirects=False,
    )
    assert d.status_code == 403

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM resources WHERE slug = %s", (rslug,))
            rid = cur.fetchone()["id"]
            cur.execute(
                "UPDATE resources SET published_version_id = NULL WHERE id = %s", (rid,)
            )
            cur.execute("DELETE FROM resource_versions WHERE resource_id = %s", (rid,))
            cur.execute("DELETE FROM resources WHERE id = %s", (rid,))
