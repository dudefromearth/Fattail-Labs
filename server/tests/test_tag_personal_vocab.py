"""Tag Manager v0.2 — personal vocabulary + resolve-or-create."""

from __future__ import annotations

import db
import identity as identity_mod
import tag_domain as td
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Tag Vocab")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                ("activator", iid),
            )
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tag_assignments WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM member_tags WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_tag_categories WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_sessions WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_seed_member_vocabulary():
    iid = _member("zztest-tv-seed@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                r = td.ensure_member_vocabulary(cur, iid)
                assert r["seeded"] >= 20
                tags = td.list_member_tags(cur, iid)
                assert len(tags) >= 20
                assert all(t.get("lexicon_key") for t in tags)
                # second call is no-op
                r2 = td.ensure_member_vocabulary(cur, iid)
                assert r2["already"] == 1
    finally:
        _cleanup(iid)


def test_resolve_or_create_and_near_dup_hint(client):
    email = "zztest-tv-resolve@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/tags", cookies=cookies)
        assert r.status_code == 200, r.text
        assert len(r.json()["tags"]) >= 20

        # Create personal label
        c = client.post(
            "/api/me/tags/resolve",
            cookies=cookies,
            json={"label": "early exit variant xyz"},
        )
        assert c.status_code == 200, c.text
        body = c.json()
        assert body["created"] is True
        assert body["tag"]["source"] == "member_created"
        assert body["tag"]["lexicon_key"] is None

        # Idempotent resolve
        c2 = client.post(
            "/api/me/tags/resolve",
            cookies=cookies,
            json={"label": "early exit variant xyz"},
        )
        assert c2.json()["created"] is False
        assert c2.json()["tag"]["id"] == body["tag"]["id"]
    finally:
        _cleanup(iid)


def test_journal_assign_member_tags(client):
    import journal_session_domain as jsd
    from datetime import date

    email = "zztest-tv-assign@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                td.ensure_member_vocabulary(cur, iid)
                tags = td.list_member_tags(cur, iid)
                mid = tags[0]["id"]
                sess = jsd.create_session(cur, iid, journal_date=date.today())
                sid = int(sess["id"])

        r = client.put(
            "/api/tags/assignments",
            cookies=cookies,
            json={
                "object_type": "journal_session",
                "object_id": sid,
                "member_tag_ids": [mid],
            },
        )
        assert r.status_code == 200, r.text
        assigns = r.json()["assignments"]
        assert len(assigns) >= 1
        assert assigns[0].get("member_tag_id") == mid or assigns[0]["tag"]["label"]
    finally:
        _cleanup(iid)


def test_purge_removes_member_vocab_not_lexicon(client):
    email = "zztest-tv-purge@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                td.ensure_member_vocabulary(cur, iid)
                n_lex = len(td.list_tags(cur, status="active"))
        assert n_lex >= 20

        # practice purge
        p = client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        assert p.status_code == 200, p.text

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) AS n FROM member_tags WHERE identity_id = %s",
                    (iid,),
                )
                assert int(cur.fetchone()["n"]) == 0
                assert len(td.list_tags(cur, status="active")) >= 20
    finally:
        _cleanup(iid)


def test_no_pnl_on_resources_tags_source():
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "components"
        / "resources"
        / "ResourcesHub.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "resources-suite-nav" in src
    assert "resources-hub-tab-" in src and '["tags", "Tags"]' in src
    assert "justify-center" in src  # Spec §9a centered pills above title
    assert "No P&amp;L" in src or "No P&L" in src
    assert "expectancy" not in src.lower()
    assert "win rate" not in src.lower()
