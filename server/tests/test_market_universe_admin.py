"""Admin market universe CRUD + Massive validation gate."""

from __future__ import annotations

from unittest.mock import patch

from tests.conftest import cookie_for


def test_admin_list_universe(client, admin_cookies):
    r = client.get("/api/admin/market-universe", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "symbols" in body
    assert body["count"] == len(body["symbols"])
    # House universe includes TSLA
    syms = {s["symbol"] for s in body["symbols"]}
    assert "TSLA" in syms or "SPY" in syms


def test_admin_create_validates_massive(client, admin_cookies):
    sym = "ZZTESTUNIV"
    # cleanup leftover
    client.delete(f"/api/admin/market-universe/{sym}", cookies=admin_cookies)

    with patch(
        "market_data.universe_admin.validate_with_massive",
        return_value={
            "ok": True,
            "symbol": sym,
            "mid": 12.34,
            "feed_used": sym,
            "via_proxy": False,
            "provider": "massive",
        },
    ):
        r = client.post(
            "/api/admin/market-universe",
            cookies=admin_cookies,
            json={
                "symbol": sym,
                "kind": "equity",
                "note": "pytest",
                "sort_order": 9999,
                "validate": True,
            },
        )
    assert r.status_code == 200, r.text
    body = r.json()["symbol"]
    assert body["symbol"] == sym
    assert body["enabled"] is True
    assert body.get("validation", {}).get("mid") == 12.34

    # conflict
    with patch(
        "market_data.universe_admin.validate_with_massive",
        return_value={"ok": True, "symbol": sym, "mid": 1, "provider": "massive"},
    ):
        r2 = client.post(
            "/api/admin/market-universe",
            cookies=admin_cookies,
            json={"symbol": sym, "kind": "equity"},
        )
    assert r2.status_code == 409

    # disable without re-validate path
    r3 = client.patch(
        f"/api/admin/market-universe/{sym}",
        cookies=admin_cookies,
        json={"enabled": False, "validate": False},
    )
    assert r3.status_code == 200, r3.text
    assert r3.json()["symbol"]["enabled"] is False

    r4 = client.delete(f"/api/admin/market-universe/{sym}", cookies=admin_cookies)
    assert r4.status_code == 200, r4.text


def test_admin_create_rejects_massive_failure(client, admin_cookies):
    from market_data.universe_admin import UniverseError

    with patch(
        "market_data.universe_admin.validate_with_massive",
        side_effect=UniverseError(422, "Massive cannot price FAKE: no mark"),
    ):
        r = client.post(
            "/api/admin/market-universe",
            cookies=admin_cookies,
            json={"symbol": "FAKEZZ99", "kind": "equity", "validate": True},
        )
    assert r.status_code == 422, r.text


def test_member_universe_read(client):
    import identity as identity_mod
    import db

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-univ-member@labs.test", "ZZ Univ"
            )
    cookies = cookie_for("activator", iid)
    r = client.get("/api/me/market/universe", cookies=cookies)
    assert r.status_code == 200, r.text
    assert r.json()["source"] == "market_symbol_universe"
    assert all(s.get("enabled") for s in r.json()["symbols"])
