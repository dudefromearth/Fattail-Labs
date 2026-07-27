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


def test_admin_hub_intro_video_url_normalizes_and_persists(client, admin_cookies):
    """Hub intro video must accept a watch URL and store a clean 11-char id."""
    before = client.get("/api/hub").json()
    old_id = before.get("intro_video_id")
    old_title = before.get("intro_video_title")

    r = client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={
            "intro_video_id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "intro_video_title": "Hub video persistence probe",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["intro_video_id"] == "dQw4w9WgXcQ"
    assert body["intro_video_title"] == "Hub video persistence probe"

    pub = client.get("/api/hub").json()
    assert pub["intro_video_id"] == "dQw4w9WgXcQ"
    assert pub["intro_video_title"] == "Hub video persistence probe"

    # restore
    client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={
            "intro_video_id": old_id,
            "intro_video_title": old_title,
        },
    )


def test_admin_hub_intro_video_rejects_garbage(client, admin_cookies):
    before = client.get("/api/hub").json()["intro_video_id"]
    r = client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={"intro_video_id": "not-a-youtube-link-at-all"},
    )
    assert r.status_code == 200, r.text
    # Invalid paste clears rather than storing a truncated URL fragment.
    assert r.json()["intro_video_id"] is None
    # restore original
    client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={"intro_video_id": before},
    )


def test_admin_hub_video_with_unchanged_faqs_does_not_404(client, admin_cookies):
    """MySQL rowcount=0 on no-op FAQ UPDATE must not abort the video write."""
    hub = client.get("/api/hub").json()
    old_id = hub.get("intro_video_id")
    old_title = hub.get("intro_video_title")
    faqs = hub["faq_items"]
    assert faqs, "seed FAQs required"
    r = client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={
            "intro_video_id": "https://youtu.be/jNQXAC9IVRw",
            "intro_video_title": "FAQ no-op probe",
            "faq_items": [
                {
                    "id": f["id"],
                    "sort_order": f["sort_order"],
                    "question": f["question"],
                    "answer_md": f["answer_md"],
                }
                for f in faqs
            ],
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["intro_video_id"] == "jNQXAC9IVRw"
    # restore
    client.put(
        "/api/admin/hub",
        cookies=admin_cookies,
        json={"intro_video_id": old_id, "intro_video_title": old_title},
    )
