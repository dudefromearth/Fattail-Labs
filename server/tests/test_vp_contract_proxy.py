"""Labs /api/vp/v1 hop forwards A14.6 cache headers."""

from tests.conftest import cookie_for


def test_proxy_forwards_etag_and_304(client, monkeypatch):
    calls = {"n": 0}

    def fake_fetch(path, query=None, headers=None, base=None):
        del path, query, base
        calls["n"] += 1
        inm = (headers or {}).get("If-None-Match")
        hdrs = {
            "etag": '"g-test"',
            "cache-control": "private, max-age=31536000, immutable",
        }
        if inm == '"g-test"':
            return 304, {}, hdrs
        return 200, {"profile_generation_id": "g-test", "kind": "session", "bins": []}, hdrs

    monkeypatch.setattr("routes.vp_contract_proxy.fetch_v1", fake_fetch)
    admin = cookie_for("administrator", identity_id=0)
    r = client.get("/api/vp/v1/profile/SPX/session?session_date=2026-09-17", cookies=admin)
    assert r.status_code == 200, r.text
    assert r.headers.get("etag") == '"g-test"'
    assert "immutable" in (r.headers.get("cache-control") or "")
    hit = client.get(
        "/api/vp/v1/profile/SPX/session?session_date=2026-09-17",
        cookies=admin,
        headers={"If-None-Match": '"g-test"'},
    )
    assert hit.status_code == 304
    assert hit.headers.get("etag") == '"g-test"'
    member = cookie_for("activator", identity_id=0)
    denied = client.get(
        "/api/vp/v1/profile/SPX/session?session_date=2026-09-17", cookies=member
    )
    assert denied.status_code == 403
