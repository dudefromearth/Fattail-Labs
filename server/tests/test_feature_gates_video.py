"""Feature gate video_url field (home landing intro)."""

from conftest import cookie_for


def test_home_gate_video_url_round_trip(client, admin_cookies):
    # Ensure home gate exists (seeded by migration 037).
    listed = client.get("/api/admin/feature-gates", cookies=admin_cookies)
    assert listed.status_code == 200, listed.text
    keys = {g["surface_key"] for g in listed.json()["gates"]}
    assert "home" in keys

    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    put = client.put(
        "/api/admin/feature-gates/home",
        cookies=admin_cookies,
        json={
            "headline": "zztest gate headline",
            "body_md": "Hello **markdown** body.",
            "video_url": url,
        },
    )
    assert put.status_code == 200, put.text
    assert put.json()["video_url"] == url
    assert "markdown" in put.json()["body_md"]

    pub = client.get("/api/feature-gates/home")
    assert pub.status_code == 200
    body = pub.json()
    assert body["video_url"] == url
    assert "markdown" in body["body_md"]

    # Clear video
    cleared = client.put(
        "/api/admin/feature-gates/home",
        cookies=admin_cookies,
        json={"video_url": ""},
    )
    assert cleared.status_code == 200
    assert not cleared.json().get("video_url")

    bad = client.put(
        "/api/admin/feature-gates/home",
        cookies=admin_cookies,
        json={"video_url": "javascript:alert(1)"},
    )
    assert bad.status_code == 422
