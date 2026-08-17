"""W3-4 T-VW-1 / T-VW-2 — surface_inspect on /api/me/profile."""

from tests.conftest import cookie_for


def test_surface_inspect_get_default(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get("/api/me/profile", cookies=cookies)
    assert r.status_code == 200
    body = r.json()["surface_inspect"]
    assert body["views"] == []
    assert body["default_view_id"] is None


def test_surface_inspect_save_and_reserved_and_cap(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    one = {
        "defaults": {},
        "default_view_id": None,
        "views": [
            {
                "id": "v1",
                "name": "Desk",
                "inspect": {"playhead": 0.01},
                "updated_at": "2026-08-16T00:00:00Z",
            }
        ],
    }
    ok = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"surface_inspect": one},
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["surface_inspect"]["views"][0]["name"] == "Desk"

    reserved = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={
            "surface_inspect": {
                "defaults": {},
                "default_view_id": None,
                "views": [
                    {
                        "id": "v2",
                        "name": "iso",
                        "inspect": {},
                        "updated_at": "2026-08-16T00:00:00Z",
                    }
                ],
            }
        },
    )
    assert reserved.status_code == 422
    assert "iso" in str(reserved.json().get("detail", "")).lower()

    thirteen = [
        {
            "id": f"v{i}",
            "name": f"View {i}",
            "inspect": {},
            "updated_at": "2026-08-16T00:00:00Z",
        }
        for i in range(13)
    ]
    cap = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={
            "surface_inspect": {
                "defaults": {},
                "default_view_id": None,
                "views": thirteen,
            }
        },
    )
    assert cap.status_code == 422
    assert "12" in str(cap.json().get("detail", ""))
