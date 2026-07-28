"""Characterization tests — user activity analytics (admin Users).

Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.

Covers the pure sessionisation helper, path cleaning, the best-effort write
helpers, the /api/pageview ingest, login logging via /api/auth/register, and the
admin roster + detail endpoints. Probe rows clean up via identity cascade.
"""

from __future__ import annotations

import activity
import db
from tests.conftest import cookie_for


# --- pure helpers ------------------------------------------------------------


def test_estimate_sessions_empty():
    assert activity.estimate_sessions([]) == {"sessions": 0, "seconds": 0}


def test_estimate_sessions_single_event_zero_seconds():
    assert activity.estimate_sessions([1000]) == {"sessions": 1, "seconds": 0}


def test_estimate_sessions_one_session():
    # three views 5 min apart -> one session spanning 600s
    ts = [1000, 1000 + 300, 1000 + 600]
    assert activity.estimate_sessions(ts) == {"sessions": 1, "seconds": 600}


def test_estimate_sessions_gap_splits():
    # second cluster starts > 30min after the first ends
    ts = [0, 60, 60 + activity.SESSION_GAP_SECONDS + 1, 60 + activity.SESSION_GAP_SECONDS + 1 + 120]
    out = activity.estimate_sessions(ts)
    assert out["sessions"] == 2
    assert out["seconds"] == 60 + 120


def test_clean_path():
    assert activity.clean_path("/courses?x=1#frag") == "/courses"
    assert activity.clean_path("/admin/board") is None
    assert activity.clean_path("/admin") is None
    assert activity.clean_path("courses") is None  # no leading slash
    assert activity.clean_path("") is None
    assert activity.clean_path("/hub") == "/hub"


# --- write helpers -----------------------------------------------------------


def _count(table: str, iid: int) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS n FROM {table} WHERE identity_id = %s", (iid,))
            return int(cur.fetchone()["n"])


def test_record_login_and_pageview(probe_identity):
    activity.record_login(probe_identity, "wordpress:fattail", "navigator")
    activity.record_pageview(probe_identity, "/courses?ref=x")
    activity.record_pageview(probe_identity, "/admin/secret")  # ignored
    activity.record_pageview(0, "/courses")  # internal id ignored
    assert _count("login_events", probe_identity) == 1
    assert _count("page_views", probe_identity) == 1  # only the /courses one


# --- pageview endpoint -------------------------------------------------------


def test_pageview_endpoint_records_for_member(client, probe_identity):
    cookies = cookie_for("navigator", probe_identity)
    before = _count("page_views", probe_identity)
    r = client.post("/api/pageview", json={"path": "/hub"}, cookies=cookies)
    assert r.status_code == 200 and r.json()["ok"] is True
    assert _count("page_views", probe_identity) == before + 1


def test_pageview_endpoint_anonymous_no_record(client):
    r = client.post("/api/pageview", json={"path": "/hub"})
    assert r.status_code == 200  # never leaks auth state


# --- login logging via register ---------------------------------------------


def test_register_records_login(client):
    email = "zztest-activity-reg@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM identities WHERE email = %s", (email,))
    try:
        r = client.post(
            "/api/auth/register",
            json={"name": "ZZ Reg", "email": email, "password": "correct horse battery staple"},
        )
        assert r.status_code == 201, r.text
        iid = r.json()["identity_id"]
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT provider FROM login_events WHERE identity_id = %s", (iid,)
                )
                rows = cur.fetchall()
        assert len(rows) == 1
        assert rows[0]["provider"] == "native"
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM identities WHERE email = %s", (email,))


# --- admin endpoints ---------------------------------------------------------


def test_users_list_requires_admin(client, probe_identity):
    r = client.get("/api/admin/users")
    assert r.status_code in (401, 403)
    r2 = client.get("/api/admin/users", cookies=cookie_for("navigator", probe_identity))
    assert r2.status_code == 403


def test_users_list_and_detail(client, admin_cookies, probe_identity):
    activity.record_login(probe_identity, "native", "observer")
    activity.record_pageview(probe_identity, "/courses")
    r = client.get(f"/api/admin/users?search=zztest-probe&limit=50", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    emails = [u["email"] for u in r.json()["users"]]
    assert any("zztest-probe" in e for e in emails)

    d = client.get(f"/api/admin/users/{probe_identity}", cookies=admin_cookies)
    assert d.status_code == 200, d.text
    body = d.json()
    assert body["identity_id"] == probe_identity
    assert body["logins"]["total"] >= 1
    assert body["page_views"]["total"] >= 1
    assert "time_on_platform" in body and "seconds" in body["time_on_platform"]
