"""Section hubs (labs / resources / live) — site_pages CMS + SEO fields."""


def test_public_site_pages(client):
    for slug in ("labs", "resources", "live", "hub"):
        r = client.get(f"/api/site-pages/{slug}")
        assert r.status_code == 200, (slug, r.text)
        body = r.json()
        assert body["slug"] == slug
        assert body["title"]
        assert "description_md" in body


def test_unknown_site_page_404(client):
    r = client.get("/api/site-pages/not-a-hub")
    assert r.status_code == 404


def test_admin_update_section_description(client, admin_cookies):
    r = client.put(
        "/api/admin/site-pages/labs",
        cookies=admin_cookies,
        json={
            "title": "Labs",
            "description_md": "Updated **Labs** hub copy for SEO and members.",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "Updated" in (body.get("description_md") or "")
    pub = client.get("/api/site-pages/labs")
    assert pub.status_code == 200
    assert "Updated" in (pub.json().get("description_md") or "")
    # restore seed-ish copy
    client.put(
        "/api/admin/site-pages/labs",
        cookies=admin_cookies,
        json={
            "title": "Labs",
            "description_md": (
                "Member **practice tools** for capacity-building: Journey, Trade Log, "
                "and more on the way."
            ),
        },
    )


def test_admin_site_page_auth(client):
    r = client.put(
        "/api/admin/site-pages/resources",
        json={"title": "Resources"},
    )
    assert r.status_code in (401, 403)
