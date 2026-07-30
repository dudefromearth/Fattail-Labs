"""Tag Manager characterization — admin lexicon + member assign-only."""

from __future__ import annotations

from datetime import date

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Tags")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tag_assignments WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_journal_messages WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_sessions WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM tags WHERE slug LIKE 'zztest-%' OR label LIKE 'zztest %'"
            )


def test_list_active_tags_seeded(client, admin_cookies):
    r = client.get("/api/tags", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "tags" in data and "categories" in data
    assert len(data["categories"]) >= 4
    labels = {t["label"] for t in data["tags"]}
    assert "early exit" in labels
    assert all(t["status"] == "active" for t in data["tags"])


def test_non_admin_cannot_create_tag(client):
    iid = _member("zztest-tags-noadmin@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/admin/tags",
            json={"label": "zztest sneaky"},
            cookies=cookies,
        )
        assert r.status_code == 403
    finally:
        _cleanup(iid)


def test_admin_create_update_retire_delete(client, admin_cookies):
    r = client.post(
        "/api/admin/tags",
        json={
            "label": "zztest alpha tag",
            "description": "probe",
            "category_id": 1,
        },
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    tag = r.json()["tag"]
    tid = tag["id"]
    assert tag["slug"] == "zztest-alpha-tag"

    r2 = client.patch(
        f"/api/admin/tags/{tid}",
        json={"description": "updated", "status": "active"},
        cookies=admin_cookies,
    )
    assert r2.status_code == 200
    assert r2.json()["tag"]["description"] == "updated"

    r3 = client.post(f"/api/admin/tags/{tid}/retire", cookies=admin_cookies)
    assert r3.status_code == 200
    assert r3.json()["tag"]["status"] == "retired"

    # Reactivate then delete (no assignments)
    client.patch(
        f"/api/admin/tags/{tid}",
        json={"status": "active"},
        cookies=admin_cookies,
    )
    r4 = client.delete(f"/api/admin/tags/{tid}", cookies=admin_cookies)
    assert r4.status_code == 200, r4.text


def test_cannot_delete_tag_with_assignments(client, admin_cookies):
    iid = _member("zztest-tags-delblock@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # create session + tag + assign
        cr = client.post(
            "/api/admin/tags",
            json={"label": "zztest stuck tag"},
            cookies=admin_cookies,
        )
        tid = cr.json()["tag"]["id"]
        # Need membership for journal create — use admin identity session
        admin_iid = 0
        # Create journal as activator with plan — use existing pattern
        with db.transaction() as conn:
            with conn.cursor() as cur:
                # ensure activator can create: set role_override
                cur.execute(
                    "UPDATE identities SET role_override = 'activator' WHERE identity_id = %s",
                    (iid,),
                )
        # Add membership if needed via retrospective can_create
        from tests.test_journal_sessions import cookie_for as jc  # noqa — use local

        # Prefer direct domain create session if API blocks
        import journal_session_domain as jsd

        with db.transaction() as conn:
            with conn.cursor() as cur:
                sess = jsd.create_session(
                    cur,
                    iid,
                    tag="reflection",
                    journal_date=date.today(),
                )
                sid = sess["id"]
        a = client.post(
            "/api/tags/assignments",
            json={
                "tag_id": tid,
                "object_type": "journal_session",
                "object_id": sid,
            },
            cookies=cookies,
        )
        assert a.status_code == 200, a.text

        d = client.delete(f"/api/admin/tags/{tid}", cookies=admin_cookies)
        assert d.status_code == 409, d.text

        # retire works
        assert (
            client.post(
                f"/api/admin/tags/{tid}/retire", cookies=admin_cookies
            ).status_code
            == 200
        )
    finally:
        _cleanup(iid)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM tags WHERE slug LIKE 'zztest-%' OR label LIKE 'zztest %'"
                )


def test_assign_unassign_isolation(client, admin_cookies):
    a = _member("zztest-tags-iso-a@labs.test")
    b = _member("zztest-tags-iso-b@labs.test")
    ca = cookie_for("administrator", a)
    cb = cookie_for("activator", b)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' WHERE identity_id = %s",
                    (a,),
                )
                cur.execute(
                    "UPDATE identities SET role_override = 'activator' WHERE identity_id = %s",
                    (b,),
                )
        import journal_session_domain as jsd

        with db.transaction() as conn:
            with conn.cursor() as cur:
                sa = jsd.create_session(
                    cur, a, tag="reflection", journal_date=date.today()
                )
                sb = jsd.create_session(
                    cur, b, tag="reflection", journal_date=date.today()
                )
        # pick a seed tag
        tags = client.get("/api/tags", cookies=ca).json()["tags"]
        tid = tags[0]["id"]

        r = client.post(
            "/api/tags/assignments",
            json={
                "tag_id": tid,
                "object_type": "journal_session",
                "object_id": sa["id"],
            },
            cookies=ca,
        )
        assert r.status_code == 200, r.text

        # B cannot assign to A's session
        bad = client.post(
            "/api/tags/assignments",
            json={
                "tag_id": tid,
                "object_type": "journal_session",
                "object_id": sa["id"],
            },
            cookies=cb,
        )
        assert bad.status_code == 403

        # B can assign to own
        ok = client.post(
            "/api/tags/assignments",
            json={
                "tag_id": tid,
                "object_type": "journal_session",
                "object_id": sb["id"],
            },
            cookies=cb,
        )
        assert ok.status_code == 200, ok.text

        # B reading A's assignments via API returns empty/not theirs
        ga = client.get(
            f"/api/tags/assignments?object_type=journal_session&object_id={sa['id']}",
            cookies=cb,
        )
        assert ga.status_code == 200
        # filtered to empty for non-owner
        assert ga.json()["assignments"] == []
    finally:
        _cleanup(a)
        _cleanup(b)


def test_merge_repoints_assignments(client, admin_cookies):
    iid = _member("zztest-tags-merge@labs.test")
    cookies = cookie_for("administrator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' WHERE identity_id = %s",
                    (iid,),
                )
        import journal_session_domain as jsd

        with db.transaction() as conn:
            with conn.cursor() as cur:
                sess = jsd.create_session(
                    cur, iid, tag="reflection", journal_date=date.today()
                )
                sid = sess["id"]

        s = client.post(
            "/api/admin/tags",
            json={"label": "zztest merge source"},
            cookies=admin_cookies,
        ).json()["tag"]
        t = client.post(
            "/api/admin/tags",
            json={"label": "zztest merge target"},
            cookies=admin_cookies,
        ).json()["tag"]

        client.post(
            "/api/tags/assignments",
            json={
                "tag_id": s["id"],
                "object_type": "journal_session",
                "object_id": sid,
            },
            cookies=cookies,
        )
        m = client.post(
            "/api/admin/tags/merge",
            json={"source_tag_id": s["id"], "target_tag_id": t["id"]},
            cookies=admin_cookies,
        )
        assert m.status_code == 200, m.text
        assigns = client.get(
            f"/api/tags/assignments?object_type=journal_session&object_id={sid}",
            cookies=cookies,
        ).json()["assignments"]
        ids = {a["tag_id"] for a in assigns}
        assert t["id"] in ids
        assert s["id"] not in ids
    finally:
        _cleanup(iid)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM tags WHERE slug LIKE 'zztest-%' OR label LIKE 'zztest %'"
                )


def test_set_assignments_replace(client, admin_cookies):
    iid = _member("zztest-tags-set@labs.test")
    cookies = cookie_for("administrator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' WHERE identity_id = %s",
                    (iid,),
                )
        import journal_session_domain as jsd

        with db.transaction() as conn:
            with conn.cursor() as cur:
                sess = jsd.create_session(
                    cur, iid, tag="reflection", journal_date=date.today()
                )
                sid = sess["id"]
        tags = client.get("/api/tags", cookies=cookies).json()["tags"][:2]
        ids = [t["id"] for t in tags]
        r = client.put(
            "/api/tags/assignments",
            json={
                "object_type": "journal_session",
                "object_id": sid,
                "tag_ids": ids,
            },
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        assert len(r.json()["assignments"]) == 2
        r2 = client.put(
            "/api/tags/assignments",
            json={
                "object_type": "journal_session",
                "object_id": sid,
                "tag_ids": [ids[0]],
            },
            cookies=cookies,
        )
        assert r2.status_code == 200
        assert len(r2.json()["assignments"]) == 1
        assert r2.json()["assignments"][0]["tag_id"] == ids[0]
    finally:
        _cleanup(iid)
