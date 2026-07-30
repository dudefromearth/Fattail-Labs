"""Member Practice Export characterization (Spec v1.0)."""

from __future__ import annotations

import io
import json
import zipfile

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _make_member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "Export Probe")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql, args in (
                ("DELETE FROM member_tool_notes WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)),
                ("DELETE FROM live_session_checkins WHERE identity_id = %s", (iid,)),
                (
                    "DELETE FROM member_access_audit WHERE subject_identity_id = %s OR actor_identity_id = %s",
                    (iid, iid),
                ),
                ("DELETE FROM member_analytics_consent WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_trade_log_accounts WHERE identity_id = %s", (iid,)),
                ("DELETE FROM identities WHERE identity_id = %s", (iid,)),
            ):
                try:
                    cur.execute(sql, args)
                except Exception:
                    pass


def test_export_journal_format_and_isolation(client):
    a = _make_member("zztest-export-a@labs.test")
    b = _make_member("zztest-export-b@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                       VALUES (%s, 'journal', 'A private note')""",
                    (a,),
                )
                cur.execute(
                    """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                       VALUES (%s, 'journal', 'B private note')""",
                    (b,),
                )
        ca = cookie_for("activator", a)
        ra = client.get("/api/me/export/journal", cookies=ca)
        assert ra.status_code == 200
        doc = ra.json()
        assert doc["format"] == "fattail.labs.journal"
        assert doc["model_version"] == "1.0"
        assert "identity_id" not in doc.get("identity", {})
        bodies = [e["body_md"] for e in doc["entries"]]
        assert "A private note" in bodies
        assert "B private note" not in bodies

        cb = cookie_for("activator", b)
        rb = client.get("/api/me/export/journal", cookies=cb)
        bodies_b = [e["body_md"] for e in rb.json()["entries"]]
        assert "B private note" in bodies_b
        assert "A private note" not in bodies_b
    finally:
        _cleanup(a)
        _cleanup(b)


def test_export_retrospectives_and_habits(client):
    iid = _make_member("zztest-export-retro@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_retrospectives
                         (identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, completed_at)
                       VALUES (%s, 'complete', 1, NOW(), NOW(), 'Maiden', 'body', NOW())""",
                    (iid,),
                )
                rid = cur.lastrowid
                cur.execute(
                    """INSERT INTO member_habit_plans
                         (identity_id, retrospective_id, title, habit, why_process,
                          observable_signal, status)
                       VALUES (%s, %s, 'Plan', 'Do X', 'process', 'routine_days', 'active')""",
                    (iid, rid),
                )
        r = client.get(
            "/api/me/export/retrospectives",
            cookies=cookie_for("activator", iid),
        )
        assert r.status_code == 200
        doc = r.json()
        assert doc["format"] == "fattail.labs.retrospective"
        assert len(doc["retrospectives"]) >= 1
        assert doc["retrospectives"][0]["id"].startswith("retro-")
        assert doc["habit_plans"][0]["id"].startswith("plan-")
        assert "identity_id" not in doc["habit_plans"][0]
    finally:
        _cleanup(iid)


def test_export_journey_snapshot(client):
    iid = _make_member("zztest-export-journey@labs.test")
    try:
        r = client.get(
            "/api/me/export/journey",
            cookies=cookie_for("activator", iid),
        )
        assert r.status_code == 200
        doc = r.json()
        assert doc["format"] == "fattail.labs.journey"
        assert "process" in doc and "meters" in doc["process"]
        assert "privacy" in doc
        assert "raw_signals" in doc
        assert "snapshot_note" in doc
    finally:
        _cleanup(iid)


def test_export_pack_json_and_zip(client):
    iid = _make_member("zztest-export-pack@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                       VALUES (%s, 'journal', 'pack note')""",
                    (iid,),
                )
        cookies = cookie_for("activator", iid)
        rj = client.get("/api/me/export?format=json", cookies=cookies)
        assert rj.status_code == 200
        pack = rj.json()
        assert pack["format"] == "fattail.labs.member_export"
        assert set(pack["surfaces"]) == {
            "trade_log",
            "journal",
            "retrospective",
            "journey",
        }
        assert pack["documents"]["journal"]["format"] == "fattail.labs.journal"
        assert pack["documents"]["trade_log"]["format"] == "fattail.labs.trade_log"
        assert pack["documents"]["retrospective"]["format"] == "fattail.labs.retrospective"
        assert pack["documents"]["journey"]["format"] == "fattail.labs.journey"

        rz = client.get("/api/me/export?format=zip", cookies=cookies)
        assert rz.status_code == 200
        assert "application/zip" in (rz.headers.get("content-type") or "")
        zf = zipfile.ZipFile(io.BytesIO(rz.content))
        names = set(zf.namelist())
        assert "manifest.json" in names
        assert "journal.json" in names
        assert "trade_log.tradlog.json" in names
        assert "retrospective.json" in names
        assert "journey.json" in names
        j = json.loads(zf.read("journal.json"))
        assert j["format"] == "fattail.labs.journal"
    finally:
        _cleanup(iid)


def test_export_writes_audit(client):
    iid = _make_member("zztest-export-audit@labs.test")
    try:
        client.get(
            "/api/me/export/journey",
            cookies=cookie_for("activator", iid),
        )
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT action, surfaces_json FROM member_access_audit
                       WHERE subject_identity_id = %s AND action = 'export'
                       ORDER BY id DESC LIMIT 1""",
                    (iid,),
                )
                row = cur.fetchone()
        assert row is not None
        assert row["action"] == "export"
    finally:
        _cleanup(iid)


def test_export_requires_session(client):
    r = client.get("/api/me/export?format=json")
    assert r.status_code in (401, 403)


def test_round_trip_journal_and_retro_import(client):
    """Export → wipe → import → content restored (additive). Second load skips."""
    iid = _make_member("zztest-export-roundtrip@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes
                         (identity_id, surface, body_md, export_key)
                       VALUES (%s, 'journal', 'Round trip note', 'note-rt-1')""",
                    (iid,),
                )
                cur.execute(
                    """INSERT INTO member_retrospectives
                         (identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, completed_at, export_key)
                       VALUES (%s, 'complete', 1, NOW(), NOW(), 'RT', 'body', NOW(),
                               'retro-rt-1')""",
                    (iid,),
                )
                rid = cur.lastrowid
                cur.execute(
                    """INSERT INTO member_habit_plans
                         (identity_id, retrospective_id, title, habit, why_process,
                          observable_signal, status, export_key)
                       VALUES (%s, %s, 'H1', 'habit', 'why', 'routine_days', 'active',
                               'plan-rt-1')""",
                    (iid, rid),
                )
        cookies = cookie_for("activator", iid)
        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        assert pack["documents"]["journal"]["entries"]

        # Wipe
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM member_tool_notes WHERE identity_id = %s", (iid,))

        prev = client.post(
            "/api/me/import/preview",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert prev.status_code == 200
        assert prev.json()["ok"] is True
        assert prev.json()["mode"] == "additive"

        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        body = commit.json()
        assert body["ok"] is True
        assert body["mode"] == "additive"
        assert body["results"]["journal"]["counts"]["new"] >= 1
        assert body["results"]["retrospective"]["counts"]["new"] >= 1
        assert "update" not in body["results"]["journal"]["counts"]

        j2 = client.get("/api/me/export/journal", cookies=cookies).json()
        bodies = [e["body_md"] for e in j2["entries"]]
        assert "Round trip note" in bodies

        # Second import: additive skip only — never update
        c2 = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert c2.status_code == 200
        jcounts = c2.json()["results"]["journal"]["counts"]
        assert jcounts["new"] == 0
        assert jcounts["skip"] >= 1
        assert "update" not in jcounts
    finally:
        _cleanup(iid)


def test_import_additive_does_not_overwrite_note(client):
    """Existing note body must survive re-import of same export_key with different body."""
    iid = _make_member("zztest-export-no-overwrite@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes
                         (identity_id, surface, body_md, export_key)
                       VALUES (%s, 'journal', 'ORIGINAL body', 'note-keep-1')""",
                    (iid,),
                )
        cookies = cookie_for("activator", iid)
        pack = {
            "format": "fattail.labs.member_export",
            "model_version": "1.0",
            "documents": {
                "journal": {
                    "format": "fattail.labs.journal",
                    "entries": [
                        {
                            "id": "note-keep-1",
                            "surface": "journal",
                            "day": "2026-07-01",
                            "body_md": "ATTACKER overwrite",
                        }
                    ],
                }
            },
        }
        r = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert r.status_code == 200
        assert r.json()["results"]["journal"]["counts"]["skip"] >= 1
        assert r.json()["results"]["journal"]["counts"]["new"] == 0
        j = client.get("/api/me/export/journal", cookies=cookies).json()
        bodies = [e["body_md"] for e in j["entries"]]
        assert "ORIGINAL body" in bodies
        assert "ATTACKER overwrite" not in bodies
    finally:
        _cleanup(iid)


def test_purge_practice_keeps_membership_then_load(client):
    """Wipe Practice rows; identity/membership path remains; load restores additive."""
    import identity as identity_mod

    iid = _make_member("zztest-purge-practice@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                # Minimal membership signal if plans exist — at least identity stays
                cur.execute(
                    """INSERT INTO member_tool_notes
                         (identity_id, surface, body_md, export_key)
                       VALUES (%s, 'journal', 'to purge', 'note-purge-1')""",
                    (iid,),
                )
                cur.execute(
                    """INSERT INTO member_retrospectives
                         (identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, completed_at, export_key)
                       VALUES (%s, 'complete', 1, NOW(), NOW(), 'P', 'b', NOW(),
                               'retro-purge-1')""",
                    (iid,),
                )
        cookies = cookie_for("activator", iid)
        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        assert pack["documents"]["journal"]["entries"]

        bad = client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "nope"},
        )
        assert bad.status_code == 422

        ok = client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        assert ok.status_code == 200, ok.text
        body = ok.json()
        assert body["ok"] is True
        assert body["membership_retained"] is True
        assert body["deleted"]["tool_notes"] >= 1
        assert body["deleted"]["retrospectives"] >= 1

        # Identity still valid
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT identity_id, email FROM identities WHERE identity_id = %s",
                    (iid,),
                )
                row = cur.fetchone()
        assert row is not None
        assert row["email"] == "zztest-purge-practice@labs.test"

        empty_j = client.get("/api/me/export/journal", cookies=cookies).json()
        assert empty_j["entries"] == []

        # Load from export after wipe
        load = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert load.status_code == 200, load.text
        j2 = client.get("/api/me/export/journal", cookies=cookies).json()
        assert any(e["body_md"] == "to purge" for e in j2["entries"])
    finally:
        _cleanup(iid)


def test_import_isolation_uses_session_identity(client):
    a = _make_member("zztest-import-iso-a@labs.test")
    b = _make_member("zztest-import-iso-b@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes
                         (identity_id, surface, body_md, export_key)
                       VALUES (%s, 'journal', 'secret A', 'note-iso-a')""",
                    (a,),
                )
        pack = client.get(
            "/api/me/export?format=json",
            cookies=cookie_for("activator", a),
        ).json()
        # B loads A's pack into B's account (by design — file is portable backup)
        r = client.post(
            "/api/me/import/commit",
            cookies=cookie_for("activator", b),
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert r.status_code == 200
        jb = client.get(
            "/api/me/export/journal",
            cookies=cookie_for("activator", b),
        ).json()
        assert any(e["body_md"] == "secret A" for e in jb["entries"])
        # A still has own data; B did not wipe A
        ja = client.get(
            "/api/me/export/journal",
            cookies=cookie_for("activator", a),
        ).json()
        assert any(e["body_md"] == "secret A" for e in ja["entries"])
    finally:
        _cleanup(a)
        _cleanup(b)
