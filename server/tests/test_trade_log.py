"""Trade Log MVP — process-first fields + isolation."""

import db
import identity as identity_mod
from conftest import cookie_for


def _id(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, email)


def _purge(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_trade_log_entries WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM credentials WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_trade_log_crud_and_isolation(client):
    a = _id("zztest-tl-a@labs.test")
    b = _id("zztest-tl-b@labs.test")
    try:
        ca = cookie_for("activator", a)
        cb = cookie_for("activator", b)
        r = client.post(
            "/api/me/trade-log",
            cookies=ca,
            json={
                "setup_md": "defined-risk vertical",
                "plan_md": "wait for trigger",
                "adherence": "followed",
                "lesson_md": "patience paid",
            },
        )
        assert r.status_code == 200, r.text
        eid = r.json()["id"]
        assert r.json()["setup_md"] == "defined-risk vertical"

        mine = client.get("/api/me/trade-log", cookies=ca)
        assert mine.status_code == 200
        assert any(e["id"] == eid for e in mine.json()["entries"])

        peer = client.get("/api/me/trade-log", cookies=cb)
        assert peer.status_code == 200
        assert all(e["id"] != eid for e in peer.json()["entries"])

        # Observer cannot use tool
        obs = cookie_for("observer", a)
        denied = client.get("/api/me/trade-log", cookies=obs)
        assert denied.status_code == 403

        client.delete(f"/api/me/trade-log/{eid}", cookies=ca)
    finally:
        _purge(a)
        _purge(b)
