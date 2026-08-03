"""AC2 — Admin access policy API characterization."""

from __future__ import annotations

import json

import db
from conftest import cookie_for


def _cleanup(target: str):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM access_policy_audit WHERE target_key = %s", (target,))
            cur.execute("DELETE FROM access_policies WHERE target_key = %s", (target,))


def test_put_surface_login_422(client, admin_cookies):
    r = client.put(
        "/api/admin/access/policies/surface:login",
        cookies=admin_cookies,
        json={"mode": "hard", "min_role": "navigator"},
    )
    assert r.status_code == 422


def test_put_trade_log_hard_422(client, admin_cookies):
    r = client.put(
        "/api/admin/access/policies/app:trade-log",
        cookies=admin_cookies,
        json={"mode": "hard", "min_role": "navigator"},
    )
    assert r.status_code == 422
    assert "Data-bearing" in json.dumps(r.json())


def test_put_stores_intent_not_expanded(client, admin_cookies):
    key = "lesson:999001"
    _cleanup(key)
    try:
        r = client.put(
            f"/api/admin/access/policies/{key}",
            cookies=admin_cookies,
            json={
                "mode": "hard",
                "selected_plans": ["observer-trial"],
                "exact_plans_only": False,
                "label": "zztest",
            },
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["selected_plans"] == ["observer-trial"]
        assert body["exact_plans_only"] is False
        # not pre-expanded
        assert body["selected_plans"] != [
            "observer-trial",
            "activator",
            "navigator",
            "coaching",
        ]
        g = client.get(f"/api/admin/access/policies/{key}", cookies=admin_cookies)
        assert g.status_code == 200
        assert g.json()["selected_plans"] == ["observer-trial"]
        # audit
        a = client.get("/api/admin/access/audit", cookies=admin_cookies, params={"target": key})
        assert a.status_code == 200
        assert any(x["target_key"] == key for x in a.json()["audit"])
    finally:
        _cleanup(key)


def test_bulk_rejects_illegal_row(client, admin_cookies):
    r = client.post(
        "/api/admin/access/policies/bulk",
        cookies=admin_cookies,
        json={
            "policies": [
                {"target_key": "lesson:999002", "selected_plans": ["observer-trial"]},
                {"target_key": "surface:login", "mode": "hard"},
            ]
        },
    )
    assert r.status_code == 422


def test_non_admin_decision_forbidden(client):
    r = client.get(
        "/api/admin/access/decision",
        params={"target": "course:1"},
        cookies=cookie_for("navigator", 902),
    )
    assert r.status_code in (401, 403)


def test_no_public_decision_route(client):
    r = client.get("/api/access/decision", params={"target": "course:1"})
    assert r.status_code == 404


def test_admin_decision_batch(client, admin_cookies):
    key = "lesson:999003"
    _cleanup(key)
    try:
        client.put(
            f"/api/admin/access/policies/{key}",
            cookies=admin_cookies,
            json={"selected_plans": ["observer-trial"], "exact_plans_only": False},
        )
        r = client.post(
            "/api/admin/access/decision/batch",
            cookies=admin_cookies,
            json={
                "targets": [key],
                "role": "navigator",
                "plan_slugs": ["navigator"],
            },
        )
        assert r.status_code == 200, r.text
        d = r.json()["decisions"][key]
        assert d["allow"] is True
    finally:
        _cleanup(key)


def test_soft_trade_log_allowed(client, admin_cookies):
    key = "app:trade-log"
    _cleanup(key)
    try:
        r = client.put(
            f"/api/admin/access/policies/{key}",
            cookies=admin_cookies,
            json={"mode": "soft", "min_role": "navigator", "label": "zztest-soft"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["mode"] == "soft"
    finally:
        _cleanup(key)
