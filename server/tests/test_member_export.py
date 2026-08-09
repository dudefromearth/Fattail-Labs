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
                ("DELETE FROM member_notifications WHERE identity_id = %s", (iid,)),
                (
                    "DELETE FROM member_retro_cadence_history WHERE identity_id = %s",
                    (iid,),
                ),
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
                (
                    "DELETE FROM member_journal_messages WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_journal_attachments WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_journal_sessions WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_practice_campaign_amendments WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    """DELETE FROM member_practice_campaign_playbooks
                       WHERE campaign_id IN (
                         SELECT id FROM member_practice_campaigns WHERE identity_id = %s
                       )""",
                    (iid,),
                ),
                (
                    "UPDATE member_practice_campaigns SET predecessor_campaign_id = NULL "
                    "WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "UPDATE member_playbook_entries SET cover_attachment_id = NULL "
                    "WHERE identity_id = %s",
                    (iid,),
                ),
                ("DELETE FROM member_playbook_versions WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_evidence WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_stickies WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_pages WHERE identity_id = %s", (iid,)),
                ("DELETE FROM member_playbook_chapters WHERE identity_id = %s", (iid,)),
                (
                    "DELETE FROM member_playbook_attachments WHERE identity_id = %s",
                    (iid,),
                ),
                (
                    "DELETE FROM member_playbook_entries WHERE identity_id = %s",
                    (iid,),
                ),
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
                          title, body_md, completed_at, prompt_version_id,
                          cadence_days_at_period, period_index, interrupted)
                       VALUES (%s, 'complete', 1, NOW(), NOW(), 'Maiden', 'body', NOW(),
                               'RETROSPECTIVE_SEQUENCE_PROMPT_V1', 7, 1, 0)""",
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
                # Cadence history + notification (v1.3)
                cur.execute(
                    """INSERT INTO member_retro_cadence_history
                         (identity_id, cadence_days, effective_from)
                       VALUES (%s, 14, CURDATE())""",
                    (iid,),
                )
                cur.execute(
                    """INSERT INTO member_notifications
                         (identity_id, kind, title, body, href, channel, period_key,
                          email_status)
                       VALUES (%s, 'retrospective.material_ready', 'Your week is ready',
                               '14 trades.', '/app/retrospective', 'in_app',
                               'maiden:test', 'skipped')""",
                    (iid,),
                )
        r = client.get(
            "/api/me/export/retrospectives",
            cookies=cookie_for("activator", iid),
        )
        assert r.status_code == 200
        doc = r.json()
        assert doc["format"] == "fattail.labs.retrospective"
        assert doc.get("model_version") == "1.1"
        assert len(doc["retrospectives"]) >= 1
        retro = doc["retrospectives"][0]
        assert retro["id"].startswith("retro-")
        assert retro.get("prompt_version_id") == "RETROSPECTIVE_SEQUENCE_PROMPT_V1"
        assert retro.get("cadence_days_at_period") == 7
        assert retro.get("period_index") == 1
        assert retro.get("interrupted") is False
        assert "identity_id" not in retro
        assert doc["habit_plans"][0]["id"].startswith("plan-")
        assert "identity_id" not in doc["habit_plans"][0]
        assert isinstance(doc.get("notifications"), list)
        assert len(doc["notifications"]) >= 1
        assert doc["notifications"][0]["id"].startswith("mn-")
        assert doc["notifications"][0]["channel"] == "in_app"
        assert doc["notifications"][0]["email_status"] == "skipped"
        assert isinstance(doc.get("cadence_history"), list)
        assert any(h.get("cadence_days") == 14 for h in doc["cadence_history"])
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
            "playbook",
            "practice_campaign",
            "trade_log",
            "journal",
            "journal_session",
            "retrospective",
            "journey",
            "capital",
        }
        assert pack["documents"]["journal"]["format"] == "fattail.labs.journal"
        assert pack["documents"]["journal_session"]["format"] == "fattail.labs.journal_session"
        assert pack["documents"]["trade_log"]["format"] == "fattail.labs.trade_log"
        assert pack["documents"]["retrospective"]["format"] == "fattail.labs.retrospective"
        assert pack["documents"]["journey"]["format"] == "fattail.labs.journey"
        assert pack["documents"]["playbook"]["format"] == "fattail.labs.playbook"
        assert pack["documents"]["playbook"].get("stub") is False
        assert pack["documents"]["practice_campaign"]["format"] == "fattail.labs.practice_campaign"
        assert pack["documents"]["capital"]["format"] == "fattail.labs.capital"

        rz = client.get("/api/me/export?format=zip", cookies=cookies)
        assert rz.status_code == 200
        assert "application/zip" in (rz.headers.get("content-type") or "")
        zf = zipfile.ZipFile(io.BytesIO(rz.content))
        names = set(zf.namelist())
        assert "manifest.json" in names
        assert "journal.json" in names
        assert "capital.json" in names
        assert "journal_session.json" in names
        assert "trade_log.tradlog.json" in names
        assert "retrospective.json" in names
        assert "journey.json" in names
        assert "playbook.json" in names
        assert "practice_campaign.json" in names
        j = json.loads(zf.read("journal.json"))
        assert j["format"] == "fattail.labs.journal"
        js = json.loads(zf.read("journal_session.json"))
        assert js["format"] == "fattail.labs.journal_session"
        pb = json.loads(zf.read("playbook.json"))
        assert pb["format"] == "fattail.labs.playbook"
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

        # Identity still valid; retro_cadence_days setting path preserved
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


def test_round_trip_trade_log_future_option_and_rights(client):
    """future_option + option_right survive export → wipe → import."""
    iid = _make_member("zztest-export-tl-fo@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                         (identity_id, label, broker, currency, status, sort_order)
                       VALUES (%s, 'Main', 'fattail', 'USD', 'active', 0)""",
                    (iid,),
                )
                aid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, asset_class, strategy,
                          order_type, net_price, net_side, setup_md, plan_md,
                          rules_md, adherence, deviation_md, lesson_md,
                          external_adapter, external_order_id, entry_source)
                       VALUES (%s, %s, NOW(), 'future_option', 'BUTTERFLY',
                               'LMT', 0.50, 'DEBIT', '', '', '', 'followed', '', '',
                               'native', 'fo-ext-1', 'manual')""",
                    (iid, aid),
                )
                tid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_legs
                         (trade_id, identity_id, account_id, leg_index, side, quantity,
                          pos_effect, asset_class, underlier, symbol, expiry, strike,
                          option_right, fill_price)
                       VALUES
                         (%s, %s, %s, 0, 'BUY', 1, 'TO_OPEN', 'future_option',
                          'ES', 'ES', '2026-09-18', 5500, 'PUT', 1.20),
                         (%s, %s, %s, 1, 'SELL', 2, 'TO_OPEN', 'future_option',
                          'ES', 'ES', '2026-09-18', 5525, 'PUT', 0.80),
                         (%s, %s, %s, 2, 'BUY', 1, 'TO_OPEN', 'future_option',
                          'ES', 'ES', '2026-09-18', 5550, 'PUT', 0.40)""",
                    (tid, iid, aid, tid, iid, aid, tid, iid, aid),
                )
        cookies = cookie_for("activator", iid)
        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        tl = pack["documents"]["trade_log"]
        trades = tl["accounts"][0]["trades"]
        assert len(trades) == 1
        assert trades[0]["asset_class"] == "future_option"
        assert all(leg.get("right") == "PUT" for leg in trades[0]["legs"])

        # Wipe practice trades
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)
                )
                cur.execute(
                    "DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)
                )
                cur.execute(
                    "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                    (iid,),
                )

        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        body = commit.json()
        assert body["results"]["trade_log"]["counts"]["new"] == 1
        assert body["results"]["trade_log"]["counts"]["error"] == 0

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT asset_class FROM member_trade_log_trades
                       WHERE identity_id = %s""",
                    (iid,),
                )
                row = cur.fetchone()
                assert row["asset_class"] == "future_option"
                cur.execute(
                    """SELECT option_right, asset_class FROM member_trade_log_legs
                       WHERE identity_id = %s ORDER BY leg_index""",
                    (iid,),
                )
                legs = cur.fetchall()
                assert len(legs) == 3
                assert all(l["option_right"] == "PUT" for l in legs)
                assert all(l["asset_class"] == "future_option" for l in legs)
    finally:
        _cleanup(iid)


def test_round_trip_journal_session_import(client):
    """Journal sessions (messages) export and re-import by export_key / date."""
    iid = _make_member("zztest-export-js-rt@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_journal_sessions
                         (identity_id, tag, journal_date, session_started_at, status,
                          structured_json, export_key)
                       VALUES (%s, 'reflection', '2026-06-15', NOW(6), 'closed',
                               %s, 'js-rt-1')""",
                    (iid, json.dumps({"mood": "steady"})),
                )
                sid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_journal_messages
                         (session_id, identity_id, author, body_md, phase, created_at)
                       VALUES
                         (%s, %s, 'member', 'Pre-open plan held.', 'pre_open', NOW(6)),
                         (%s, %s, 'agent', 'Noted.', 'pre_open', NOW(6))""",
                    (sid, iid, sid, iid),
                )
        cookies = cookie_for("activator", iid)
        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        assert len(pack["documents"]["journal_session"]["entries"]) == 1
        assert pack["documents"]["journal_session"]["entries"][0]["id"] == "js-rt-1"

        ok = client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        assert ok.status_code == 200, ok.text

        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        js = commit.json()["results"]["journal_session"]
        assert js["counts"]["new"] == 1
        assert js["messages"]["new"] == 2

        pack2 = client.get("/api/me/export?format=json", cookies=cookies).json()
        entries = pack2["documents"]["journal_session"]["entries"]
        assert len(entries) == 1
        bodies = [m["body_md"] for m in entries[0]["messages"]]
        assert "Pre-open plan held." in bodies

        # Second load skips
        c2 = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert c2.status_code == 200
        assert c2.json()["results"]["journal_session"]["counts"]["skip"] >= 1
        assert c2.json()["results"]["journal_session"]["counts"]["new"] == 0
    finally:
        _cleanup(iid)


def test_import_open_retro_demoted_when_target_has_open(client):
    """Dev→prod portability: open retro in pack demotes instead of 409."""
    iid = _make_member("zztest-export-open-demote@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_retrospectives
                         (identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md)
                       VALUES (%s, 'draft', 0, NOW(), NOW(), 'Already open', '')""",
                    (iid,),
                )
        cookies = cookie_for("activator", iid)
        pack = {
            "format": "fattail.labs.member_export",
            "model_version": "1.0",
            "documents": {
                "retrospective": {
                    "format": "fattail.labs.retrospective",
                    "retrospectives": [
                        {
                            "id": "retro-imported-open",
                            "status": "draft",
                            "is_maiden": False,
                            "scope_start": "2026-01-01T00:00:00Z",
                            "scope_end": "2026-01-07T00:00:00Z",
                            "title": "From other env",
                            "body_md": "should land as interrupted",
                        }
                    ],
                    "habit_plans": [],
                }
            },
        }
        prev = client.post(
            "/api/me/import/preview",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert prev.status_code == 200
        assert prev.json()["ok"] is True
        assert any("demoted" in w for w in (prev.json().get("warnings") or []))

        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT status FROM member_retrospectives
                       WHERE identity_id = %s AND export_key = 'retro-imported-open'""",
                    (iid,),
                )
                row = cur.fetchone()
                assert row is not None
                assert row["status"] == "interrupted"
    finally:
        _cleanup(iid)


def test_playbook_stub_round_trip(client):
    """Legacy playbook tool notes still export/import (notes surface)."""
    iid = _make_member("zztest-export-playbook@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes
                         (identity_id, surface, body_md, export_key)
                       VALUES (%s, 'playbook', 'Always size first', 'pb-1')""",
                    (iid,),
                )
        cookies = cookie_for("activator", iid)
        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        assert pack["documents"]["playbook"]["format"] == "fattail.labs.playbook"
        notes = pack["documents"]["playbook"].get("notes") or []
        entries = pack["documents"]["playbook"].get("entries") or []
        assert any(
            e["body_md"] == "Always size first" for e in notes
        ) or any(e["body_md"] == "Always size first" for e in entries)

        client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        pb_res = commit.json()["results"]["playbook"]
        assert (
            pb_res["counts"]["new"] + (pb_res.get("notes") or {}).get("new", 0)
            >= 1
        )

        pack2 = client.get("/api/me/export?format=json", cookies=cookies).json()
        notes2 = pack2["documents"]["playbook"].get("notes") or []
        entries2 = pack2["documents"]["playbook"].get("entries") or []
        bodies = [e["body_md"] for e in notes2] + [e["body_md"] for e in entries2]
        assert "Always size first" in bodies
    finally:
        _cleanup(iid)


def test_playbook_campaign_spine_export_round_trip(client):
    """Real playbook + campaign export → purge → import (OD-1.5)."""
    iid = _make_member("zztest-export-spine@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        pb = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Size first", "body_md": "No chase."},
        )
        assert pb.status_code == 200, pb.text
        entry = pb.json()["entry"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "August season",
                "playbook_entry_ids": [entry["id"]],
                "activate": True,
            },
        )
        assert camp.status_code == 200, camp.text
        campaign = camp.json()["campaign"]

        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        pb_doc = pack["documents"]["playbook"]
        assert pb_doc["model_version"] == "2.0"
        assert any(e.get("title") == "Size first" for e in pb_doc["entries"])
        sized = next(e for e in pb_doc["entries"] if e.get("title") == "Size first")
        # PB3 scrapbook tree present (Main chapter seeded on create)
        assert isinstance(sized.get("chapters"), list)
        assert len(sized["chapters"]) >= 1
        camp_doc = pack["documents"]["practice_campaign"]
        assert camp_doc["format"] == "fattail.labs.practice_campaign"
        assert any(e.get("title") == "August season" for e in camp_doc["entries"])
        camp_entry = next(
            e for e in camp_doc["entries"] if e.get("title") == "August season"
        )
        assert entry["export_key"] in (camp_entry.get("playbook_export_keys") or [])

        client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        # After purge, no spine rows
        empty = client.get("/api/me/playbook/entries", cookies=cookies).json()
        assert empty.get("entries") == []

        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        assert commit.json()["results"]["playbook"]["counts"]["new"] >= 1
        assert commit.json()["results"]["practice_campaign"]["counts"]["new"] >= 1

        # Idempotent second import
        commit2 = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit2.status_code == 200, commit2.text
        assert commit2.json()["results"]["playbook"]["counts"]["skip"] >= 1
        assert commit2.json()["results"]["practice_campaign"]["counts"]["skip"] >= 1

        pack2 = client.get("/api/me/export?format=json", cookies=cookies).json()
        titles = [e["title"] for e in pack2["documents"]["playbook"]["entries"]]
        assert "Size first" in titles
        c_titles = [
            e["title"] for e in pack2["documents"]["practice_campaign"]["entries"]
        ]
        assert "August season" in c_titles
        # campaign id may change but export_key preserved
        assert campaign["export_key"] in {
            e["id"] for e in pack2["documents"]["practice_campaign"]["entries"]
        }
    finally:
        _cleanup(iid)


def test_campaign_lifecycle_pack_round_trip(client):
    """X1: export signed_terms + amendments + predecessor → purge → import (model 1.2)."""
    iid = _make_member("zztest-export-lifecycle@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        root = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={
                "title": "Cycle Root",
                "activate": True,
                "starting_capital": 8000,
                "goals_md": "Preserve",
            },
        ).json()["campaign"]
        # amend charter
        client.patch(
            f"/api/me/practice/campaigns/{root['id']}",
            cookies=cookies,
            json={"starting_capital": 9000, "goals_md": "Preserve carefully"},
        )
        client.patch(
            f"/api/me/practice/campaigns/{root['id']}",
            cookies=cookies,
            json={"status": "completed"},
        )
        successor = client.post(
            f"/api/me/practice/campaigns/{root['id']}/renew",
            cookies=cookies,
        ).json()["campaign"]
        assert successor.get("predecessor_campaign_id") == root["id"]

        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        camp_doc = pack["documents"]["practice_campaign"]
        assert camp_doc["model_version"] == "1.3"
        by_key = {e["id"]: e for e in camp_doc["entries"]}
        root_e = by_key[root["export_key"]]
        succ_e = by_key[successor["export_key"]]
        assert root_e.get("signed_at")
        assert isinstance(root_e.get("signed_terms"), dict)
        assert float(root_e["signed_terms"].get("starting_capital")) == 8000.0
        amends = root_e.get("amendments") or []
        assert any(a.get("field") == "starting_capital" for a in amends)
        assert succ_e.get("predecessor_export_key") == root_e["id"]
        # Draft successor is unsigned
        assert succ_e.get("signed_at") is None

        client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        commit = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert commit.status_code == 200, commit.text
        assert commit.json()["results"]["practice_campaign"]["counts"]["new"] >= 2

        pack2 = client.get("/api/me/export?format=json", cookies=cookies).json()
        camp2 = pack2["documents"]["practice_campaign"]
        by2 = {e["id"]: e for e in camp2["entries"]}
        r2 = by2[root["export_key"]]
        s2 = by2[successor["export_key"]]
        assert r2.get("signed_at")
        assert float(r2["signed_terms"]["starting_capital"]) == 8000.0
        assert any(
            a.get("field") == "starting_capital" for a in (r2.get("amendments") or [])
        )
        assert s2.get("predecessor_export_key") == r2["id"]

        # API lineage restored
        listed = client.get("/api/me/practice/campaigns", cookies=cookies).json()
        by_export = {c["export_key"]: c for c in listed["campaigns"]}
        root_row = by_export[root["export_key"]]
        succ_row = by_export[successor["export_key"]]
        assert succ_row.get("predecessor_campaign_id") == root_row["id"]
        assert succ_row.get("cycle_number") == 2
    finally:
        _cleanup(iid)
