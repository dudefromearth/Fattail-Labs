"""Alerts Manager API — AT-ALM-3, 4, 8, 9, 10, 11."""

from __future__ import annotations

import os

import db
import identity as identity_mod
from conftest import cookie_for


def _iid(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "Alerts Probe")


def _purge(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM member_alerts WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM credentials WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _on():
    os.environ["LABS_ALERTS_MANAGER"] = "1"


def _draft(**over):
    d = {
        "source_system": "analyzer_risk_graph",
        "suite": "options_lab",
        "domain": "work_surface",
        "alert_class": "threshold",
        "surface_type": "canvas",
        "symbol": "SPX",
        "title": "SPX rises above 5500",
        "severity": "medium",
        "behavior": "once_only",
        "trigger": {"family": "price", "condition": "above", "target": 5500},
    }
    d.update(over)
    return d


def test_unauth_401(client):
    _on()
    r = client.get("/api/me/alerts")
    assert r.status_code == 401


def test_unregistered_source_system_4xx(client):
    _on()
    iid = _iid("zztest-alm-src@labs.test")
    try:
        r = client.post(
            "/api/me/alerts",
            json=_draft(source_system="not_a_suite"),
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 400
        assert "source_system" in r.json()["detail"]
    finally:
        _purge(iid)


def test_missing_suite_or_severity_4xx(client):
    _on()
    iid = _iid("zztest-alm-sev@labs.test")
    try:
        r = client.post(
            "/api/me/alerts",
            json=_draft(suite=""),
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 400
        r2 = client.post(
            "/api/me/alerts",
            json=_draft(severity=""),
            cookies=cookie_for("navigator", iid),
        )
        assert r2.status_code == 400
    finally:
        _purge(iid)


def test_analyzer_upsert_suite_options_lab(client):
    _on()
    iid = _iid("zztest-alm-ok@labs.test")
    try:
        r = client.post(
            "/api/me/alerts",
            json=_draft(),
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["suite"] == "options_lab"
        assert body["source_system"] == "analyzer_risk_graph"
        assert body["severity"] == "medium"
        assert "/app/options-lab/analyzer?alert=" in (body.get("deep_link") or "")
        listed = client.get(
            "/api/me/alerts",
            cookies=cookie_for("navigator", iid),
        )
        assert listed.status_code == 200
        assert listed.json()["alerts"][0]["suite"] == "options_lab"
    finally:
        _purge(iid)


def test_heatmap_empty_types_cannot_post_canvas(client):
    _on()
    iid = _iid("zztest-alm-hm@labs.test")
    try:
        r = client.post(
            "/api/me/alerts",
            json=_draft(source_system="options_lab_heatmap"),
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 400
    finally:
        _purge(iid)


def test_dangling_local_ref_unbound(client):
    _on()
    iid = _iid("zztest-alm-ub@labs.test")
    try:
        r = client.post(
            "/api/me/alerts",
            json=_draft(
                surface_type="position",
                local_ref={"position_id": None},
                unbound=True,
            ),
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 200, r.text
        assert r.json()["unbound"] is True
        assert r.json()["active"] is False
    finally:
        _purge(iid)


def test_stream_is_not_market_socket(client):
    _on()
    iid = _iid("zztest-alm-sse@labs.test")
    try:
        r = client.get(
            "/api/me/alerts/stream",
            cookies=cookie_for("navigator", iid),
        )
        assert r.status_code == 200
        assert "text/event-stream" in r.headers.get("content-type", "")
        assert r.url.path == "/api/me/alerts/stream"
        assert "/api/me/market/stream" not in str(r.url)
    finally:
        _purge(iid)


def test_stats_no_pnl(client):
    _on()
    iid = _iid("zztest-alm-st@labs.test")
    try:
        client.post(
            "/api/me/alerts",
            json=_draft(),
            cookies=cookie_for("navigator", iid),
        )
        r = client.get("/api/me/alerts/stats", cookies=cookie_for("navigator", iid))
        assert r.status_code == 200
        body = r.json()
        assert "pnl" not in body
        assert "by_suite" in body
        assert "by_class" in body
    finally:
        _purge(iid)
