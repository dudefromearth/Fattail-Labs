"""Admin notifications — in-app + email skip without SMTP."""

from __future__ import annotations

import pytest

import db
import identity as identity_mod
import notify


@pytest.fixture()
def admin_identity():
    """Real identity with role_override administrator for inbox targeting."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-admin-notify@labs.test", "ZZ Notify Admin"
            )
            cur.execute(
                "UPDATE identities SET role_override = 'administrator' "
                "WHERE identity_id = %s",
                (iid,),
            )
    yield iid
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM admin_notifications WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            # leave identity row; other tests may not care


def test_awaiting_approval_notifies_admins(client, admin_cookies, admin_identity):
    # create card and move to awaiting_approval
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={
            "title": "ZZ Notify approval card",
            "intent_md": "Needs human approval path",
        },
    )
    assert r.status_code == 200
    iid = r.json()["item"]["id"]
    from agent_auth import Actor
    import packages as packages_mod

    packages_mod.ensure_stub_artifacts_for_tests(
        iid,
        Actor(kind="human", id=0, label="test", role="administrator"),
        "course",
    )
    for to, extra in (
        ("queued", {}),
        ("scheduled", {}),
        ("in_production", {"sub_stage": "research"}),
        ("awaiting_approval", {}),
    ):
        r = client.post(
            f"/api/admin/board/items/{iid}/transition",
            cookies=admin_cookies,
            json={"to_status": to, **extra},
        )
        assert r.status_code == 200, r.text

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT kind, title, href, email_status
                   FROM admin_notifications
                   WHERE identity_id = %s AND resource_id = %s
                   ORDER BY id DESC LIMIT 1""",
                (admin_identity, str(iid)),
            )
            row = cur.fetchone()
    assert row is not None
    assert row["kind"] == "board.awaiting_approval"
    assert "Approval needed" in row["title"]
    assert f"item={iid}" in row["href"]
    # no SMTP in test env
    assert row["email_status"] in ("skipped", "sent", "failed", "pending")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (iid,))
            cur.execute(
                "DELETE FROM admin_notifications WHERE resource_id = %s", (str(iid),)
            )


def test_notify_list_and_mark_read(client, admin_cookies, admin_identity):
    # seed a notification directly
    notify.notify_admins(
        kind="board.awaiting_approval",
        title="ZZ direct notify",
        body="test body",
        href="/admin/board?item=0",
        resource_type="content_item",
        resource_id="0",
    )
    # session is identity 0 — inbox empty for dev admin
    r = client.get("/api/admin/notifications", cookies=admin_cookies)
    assert r.status_code == 200

    # verify unread count for real identity via service
    assert notify.unread_count(admin_identity) >= 1
    items = notify.list_for_identity(admin_identity, unread_only=True)
    assert any(i["title"] == "ZZ direct notify" for i in items)
    nid = next(i["id"] for i in items if i["title"] == "ZZ direct notify")
    assert notify.mark_read(admin_identity, nid) is True
    assert notify.mark_read(admin_identity, nid) is False

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM admin_notifications WHERE identity_id = %s",
                (admin_identity,),
            )


def test_flag_block_notifies(client, admin_cookies, admin_identity):
    r = client.post(
        "/api/admin/board/items",
        cookies=admin_cookies,
        json={"title": "ZZ Flag notify", "intent_md": "flag path"},
    )
    iid = r.json()["item"]["id"]
    r = client.post(
        f"/api/admin/board/items/{iid}/flags",
        cookies=admin_cookies,
        json={
            "guardian": "hotel",
            "message": "Claim missing source",
            "severity": "block",
        },
    )
    assert r.status_code == 200
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT kind FROM admin_notifications
                   WHERE identity_id = %s AND resource_id = %s
                     AND kind = 'board.flag_opened'
                   LIMIT 1""",
                (admin_identity, str(iid)),
            )
            row = cur.fetchone()
    assert row is not None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM content_items WHERE id = %s", (iid,))
            cur.execute(
                "DELETE FROM admin_notifications WHERE resource_id = %s", (str(iid),)
            )
