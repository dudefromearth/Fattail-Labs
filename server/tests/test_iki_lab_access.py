"""IKI Lab plan flags (DL-604)."""

import db
import identity
from conftest import cookie_for


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_iki_lab_woo_name_maps():
    from identity import _entitlement_key_candidates, plan_id_for_provider_key

    c = _entitlement_key_candidates("IKI Lab")
    assert "iki-lab" in c
    with db.transaction() as conn:
        with conn.cursor() as cur:
            pid = plan_id_for_provider_key(cur, "wordpress:fattail", "IKI Lab")
            assert pid is not None
            cur.execute("SELECT slug FROM plans WHERE id = %s", (pid,))
            assert cur.fetchone()["slug"] == "iki-lab"


def test_iki_lab_plan_exists():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT slug, grants_role FROM plans WHERE slug = 'iki-lab'")
            row = cur.fetchone()
            assert row is not None, "run migrate.py — 147_iki_lab_plan.sql"
            assert row["grants_role"] == "observer"


def test_me_iki_flags_admin_and_subscriber(client):
    admin = client.get("/api/auth/me", cookies=cookie_for("administrator"))
    assert admin.status_code == 200, admin.text
    assert admin.json().get("iki_lab") is True
    assert admin.json().get("iki_lab_only") is False

    iid = None
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = identity.get_or_create_identity(
                    cur, "zztest-iki-lab@labs.test", "ZZ IKI Lab"
                )
                cur.execute("SELECT id FROM plans WHERE slug = 'iki-lab'")
                pid = int(cur.fetchone()["id"])
                identity.upsert_membership(cur, iid, pid, "active", "zztest")
        cookies = cookie_for("observer", iid)
        r = client.get("/api/auth/me", cookies=cookies)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["iki_lab"] is True
        assert body["iki_lab_only"] is True
    finally:
        if iid is not None:
            _cleanup(iid)
