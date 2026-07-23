"""Phase E — end-to-end API smoke for the member happy path.

Health → catalog → enroll → progress. Complements deeper per-domain suites.
"""

from __future__ import annotations

import pytest

import auth
import db
import identity
from config import get_config


@pytest.fixture()
def member_cookies():
    email = "zztest-smoke-member@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity.get_or_create_identity(cur, email, "ZZ Smoke Member")
            # Ensure activator-level access if needed via role_override for gated lessons
            cur.execute(
                "UPDATE identities SET role_override = 'activator' WHERE identity_id = %s",
                (iid,),
            )
    token = auth.issue_session(identity_id=iid, issuer="native", role="activator")
    cookies = {get_config().session_cookie: token}
    yield cookies, iid
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM lesson_progress WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM enrollments WHERE identity_id = %s", (iid,))
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )


def test_smoke_health_catalog_enroll_progress(client, member_cookies):
    cookies, iid = member_cookies

    h = client.get("/api/health")
    assert h.status_code == 200
    assert h.json()["status"] == "ok"

    cat = client.get("/api/courses")
    assert cat.status_code == 200
    courses = cat.json().get("courses") or cat.json()
    if isinstance(courses, dict):
        courses = courses.get("courses") or []
    assert isinstance(courses, list)
    assert len(courses) >= 1
    slug = courses[0]["slug"] if isinstance(courses[0], dict) else None
    assert slug

    detail = client.get(f"/api/courses/{slug}")
    assert detail.status_code == 200

    enr = client.post(f"/api/courses/{slug}/enroll", cookies=cookies)
    assert enr.status_code in (200, 201), enr.text

    me_enr = client.get("/api/me/enrollments", cookies=cookies)
    assert me_enr.status_code == 200

    # Progress endpoint accepts empty or real lesson — just prove auth path works
    cont = client.get("/api/me/continue", cookies=cookies)
    assert cont.status_code == 200
