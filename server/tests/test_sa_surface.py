"""AZ-VP-9-A22 — SA surface profile-store on the identity."""

from tests.conftest import cookie_for


def test_sa_surface_unauth(client):
    r = client.get("/api/me/sa-surface")
    assert r.status_code == 401


def test_sa_surface_empty_then_put_get_roundtrip(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    empty = client.get("/api/me/sa-surface", cookies=cookies)
    assert empty.status_code == 200, empty.text
    body = empty.json()
    assert body["schema"] == 1
    assert body["prefs"] is None

    prefs = {
        "mode": "entry",
        "axis": "right",
        "priceTf": "15m",
        "legendOn": True,
        "objectDefaults": {"axis": {"axis": "right"}},
        "overrides": {"entry": {"axis": "right", "priceTf": "15m"}},
    }
    put = client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"schema": 1, "prefs": prefs},
    )
    assert put.status_code == 200, put.text
    stored = put.json()
    assert stored["schema"] == 1
    assert stored["prefs"]["mode"] == "entry"
    assert stored["prefs"]["axis"] == "right"
    assert stored["prefs"]["objectDefaults"]["axis"]["axis"] == "right"

    got = client.get("/api/me/sa-surface", cookies=cookies)
    assert got.status_code == 200
    again = got.json()
    assert again["schema"] == 1
    assert again["prefs"] == stored["prefs"]


def test_sa_surface_server_wins_second_write(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"schema": 1, "prefs": {"mode": "morning", "axis": "left"}},
    )
    # Later write is stored; GET returns the server copy, not a merge.
    client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"schema": 1, "prefs": {"mode": "management", "axis": "both"}},
    )
    got = client.get("/api/me/sa-surface", cookies=cookies).json()
    assert got["prefs"]["mode"] == "management"
    assert got["prefs"]["axis"] == "both"
    assert "left" not in str(got["prefs"].get("axis"))


def test_sa_surface_schema_required_and_unknown_rejected(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    missing_prefs = client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"schema": 1},
    )
    assert missing_prefs.status_code == 422

    future = client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"schema": 99, "prefs": {"mode": "morning"}},
    )
    assert future.status_code == 422
    assert "schema" in str(future.json().get("detail", "")).lower()

    # Missing schema is accepted as v1 (migrate forward).
    ok = client.put(
        "/api/me/sa-surface",
        cookies=cookies,
        json={"prefs": {"mode": "entry"}},
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["schema"] == 1
    assert ok.json()["prefs"]["mode"] == "entry"


def test_sa_surface_legacy_blob_migrates(client, probe_identity):
    """Documents stored without a schema wrapper still restore prefs."""
    import json

    import db

    cookies = cookie_for("activator", probe_identity)
    legacy = {"mode": "entry", "axis": "right", "visible": {"L3": True}}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE identities SET sa_surface_json = %s WHERE identity_id = %s",
                (json.dumps(legacy), probe_identity),
            )
    got = client.get("/api/me/sa-surface", cookies=cookies)
    assert got.status_code == 200, got.text
    body = got.json()
    assert body["schema"] == 1
    assert body["prefs"]["mode"] == "entry"
    assert body["prefs"]["axis"] == "right"
