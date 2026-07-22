"""Media library: upload, listing, referentially-safe delete
(Media Library spec v1.0)."""

import base64

from conftest import cookie_for

# 1x1 transparent PNG
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"
    "AAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
COURSE = "first-stop-the-bleeding"


def test_upload_list_reference_guard_delete(client, admin_cookies):
    r = client.post("/api/admin/media", cookies=admin_cookies,
                    files={"file": ("zztest.png", PNG, "image/png")})
    assert r.status_code == 200
    url = r.json()["url"]
    name = url.rsplit("/", 1)[1]

    listed = client.get("/api/admin/media", cookies=admin_cookies).json()["media"]
    assert any(m["name"] == name for m in listed)

    # referenced as a course banner -> delete refused with the referrer named
    client.put(f"/api/admin/courses/{COURSE}", cookies=admin_cookies,
               json={"hero_image_url": url})
    try:
        r = client.delete(f"/api/admin/media/{name}", cookies=admin_cookies)
        assert r.status_code == 409
        assert COURSE in r.json()["detail"]
    finally:
        client.put(f"/api/admin/courses/{COURSE}", cookies=admin_cookies,
                   json={"hero_image_url": None})

    # dereferenced -> delete succeeds
    assert client.delete(f"/api/admin/media/{name}",
                         cookies=admin_cookies).status_code == 200


def test_media_endpoints_are_admin_only(client):
    assert client.get("/api/admin/media").status_code == 401
    r = client.get("/api/admin/media", cookies=cookie_for("navigator", 902))
    assert r.status_code == 403


def test_path_traversal_rejected(client, admin_cookies):
    r = client.delete("/api/admin/media/..%2Fsecrets", cookies=admin_cookies)
    assert r.status_code in (404, 422)


def test_upload_rejects_wrong_type(client, admin_cookies):
    r = client.post("/api/admin/media", cookies=admin_cookies,
                    files={"file": ("evil.svg", b"<svg/>", "image/svg+xml")})
    assert r.status_code == 422
