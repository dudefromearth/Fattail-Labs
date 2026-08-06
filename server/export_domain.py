"""Member Practice canonical export builders.

Spec: FatTail-Labs-Member-Practice-Export-Spec-v1.0 … **v1.3**
Formats: fattail.labs.journal | retrospective | journey | member_export
"""

from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

from config import get_config

EASTERN = ZoneInfo("America/New_York")

MODEL_VERSION = "1.0"
# Retrospective document bumped for v0.7.1 ceremony columns (Export Spec v1.3)
RETRO_MODEL_VERSION = "1.1"
FMT_JOURNAL = "fattail.labs.journal"
FMT_JOURNAL_SESSION = "fattail.labs.journal_session"
FMT_RETRO = "fattail.labs.retrospective"
FMT_JOURNEY = "fattail.labs.journey"
# Playbook surface is product-incomplete; stub schema for pack completeness.
FMT_PLAYBOOK = "fattail.labs.playbook"
PLAYBOOK_MODEL_VERSION = "0.1-stub"
FMT_PACK = "fattail.labs.member_export"


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        return v.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return str(v)


def _day_eastern(dt: Any) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(EASTERN).date().isoformat()
    return str(dt)[:10]


def envelope(format_id: str, *, email: str | None) -> dict[str, Any]:
    cfg = get_config()
    return {
        "format": format_id,
        "model_version": MODEL_VERSION,
        "exported_at": _now_iso(),
        "source": {"system": "fattail-labs", "env": cfg.env},
        "identity": {
            "export_subject": "self",
            "email": email or "",
        },
    }


def _member_email(cur, identity_id: int) -> str:
    cur.execute(
        "SELECT email FROM identities WHERE identity_id = %s",
        (identity_id,),
    )
    row = cur.fetchone()
    return (row["email"] if row else "") or ""


def build_journal_document(cur, identity_id: int) -> dict[str, Any]:
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_JOURNAL, email=email)

    cur.execute(
        """SELECT id, surface, body_md, export_key, created_at, updated_at
           FROM member_tool_notes
           WHERE identity_id = %s AND surface IN ('journal', 'pre_market')
           ORDER BY created_at ASC, id ASC""",
        (identity_id,),
    )
    notes = cur.fetchall()
    entries = []
    notes_by_day: dict[str, list[str]] = {}
    for r in notes:
        nid = (r.get("export_key") or f"note-{int(r['id'])}").strip()
        day = _day_eastern(r.get("created_at")) or "unknown"
        entries.append(
            {
                "id": nid,
                "day": day,
                "surface": r["surface"],
                "body_md": r.get("body_md") or "",
                "created_at": _iso(r.get("created_at")),
                "updated_at": _iso(r.get("updated_at")),
            }
        )
        notes_by_day.setdefault(day, []).append(nid)

    # Trade days (Python timezone — avoid CONVERT_TZ dependency)
    trade_days: set[str] = set()
    try:
        cur.execute(
            """SELECT exec_at FROM member_trade_log_trades
               WHERE identity_id = %s AND exec_at IS NOT NULL""",
            (identity_id,),
        )
        for row in cur.fetchall():
            day = _day_eastern(row.get("exec_at"))
            if day:
                trade_days.add(day)
    except Exception:
        trade_days = set()

    all_days = sorted(set(notes_by_day) | trade_days)
    day_index = []
    for day in all_days:
        if day == "unknown":
            continue
        day_index.append(
            {
                "day": day,
                "has_trades": day in trade_days,
                "note_ids": notes_by_day.get(day, []),
            }
        )

    doc["entries"] = entries
    doc["day_index"] = day_index
    return doc


def build_journal_session_document(cur, identity_id: int) -> dict[str, Any]:
    """Session Spec §12 — dual-read alongside legacy journal notes."""
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_JOURNAL_SESSION, email=email)
    doc["format"] = FMT_JOURNAL_SESSION
    doc["model_version"] = "1.1"  # v0.6: one session/date · tags · attachments
    try:
        cur.execute(
            """SELECT id, tag, journal_date, session_started_at, status,
                      structured_json, export_key, created_at
               FROM member_journal_sessions
               WHERE identity_id = %s
               ORDER BY session_started_at ASC, id ASC""",
            (identity_id,),
        )
        sessions = cur.fetchall()
    except Exception:
        doc["entries"] = []
        return doc
    entries = []
    for s in sessions:
        sid = int(s["id"])
        cur.execute(
            """SELECT author, agent_service, body_md, phase, created_at
               FROM member_journal_messages
               WHERE session_id = %s AND identity_id = %s
               ORDER BY created_at ASC, id ASC""",
            (sid, identity_id),
        )
        messages = [
            {
                "author": m["author"],
                "phase": m["phase"],
                "body_md": m.get("body_md") or "",
                "at": _iso(m.get("created_at")),
            }
            for m in cur.fetchall()
        ]
        structured = s.get("structured_json")
        if isinstance(structured, str):
            try:
                structured = json.loads(structured)
            except Exception:
                structured = None
        jd = s.get("journal_date")
        # System tags assigned to this session (Tag Manager)
        tag_labels: list[str] = []
        try:
            cur.execute(
                """SELECT t.slug, t.label FROM tag_assignments a
                   JOIN tags t ON t.id = a.tag_id
                   WHERE a.object_type = 'journal_session' AND a.object_id = %s
                   ORDER BY t.label ASC""",
                (sid,),
            )
            tag_labels = [
                {"slug": t["slug"], "label": t["label"]} for t in cur.fetchall()
            ]
        except Exception:
            tag_labels = []
        # Attachments (Family B media — captions + export keys; binaries separate)
        attachments: list[dict[str, Any]] = []
        try:
            cur.execute(
                """SELECT id, content_type, byte_size, caption_md, export_key, created_at
                   FROM member_journal_attachments
                   WHERE session_id = %s AND identity_id = %s
                   ORDER BY id ASC""",
                (sid, identity_id),
            )
            for a in cur.fetchall():
                attachments.append(
                    {
                        "id": (a.get("export_key") or f"jsa-{a['id']}").strip(),
                        "content_type": a.get("content_type"),
                        "byte_size": int(a["byte_size"] or 0),
                        "caption_md": a.get("caption_md") or "",
                        "created_at": _iso(a.get("created_at")),
                    }
                )
        except Exception:
            attachments = []
        entries.append(
            {
                "id": (s.get("export_key") or f"js-{sid}").strip(),
                "tag": s["tag"],
                "tags": tag_labels,
                "journal_date": jd.isoformat() if hasattr(jd, "isoformat") else str(jd),
                "session_started_at": _iso(s.get("session_started_at")),
                "status": s["status"],
                "structured": structured if isinstance(structured, dict) else {},
                "messages": messages,
                "attachments": attachments,
            }
        )
    doc["entries"] = entries
    return doc


def build_retrospective_document(cur, identity_id: int) -> dict[str, Any]:
    """Export Spec v1.3 — ceremony columns, in-app notifications, cadence history."""
    import retrospective_domain as rd

    email = _member_email(cur, identity_id)
    doc = envelope(FMT_RETRO, email=email)
    doc["model_version"] = RETRO_MODEL_VERSION

    cur.execute(
        """SELECT * FROM member_retrospectives
           WHERE identity_id = %s
           ORDER BY id ASC""",
        (identity_id,),
    )
    rows = cur.fetchall()
    retros = []
    for row in rows:
        s = rd.serialize_row(row)
        s.pop("identity_id", None)
        s["id"] = (row.get("export_key") or f"retro-{int(row['id'])}").strip()
        # Explicit v0.7.1 ceremony fields (serialize already includes; assert contract)
        s.setdefault("prompt_version_id", row.get("prompt_version_id"))
        s.setdefault(
            "cadence_days_at_period",
            int(row["cadence_days_at_period"])
            if row.get("cadence_days_at_period") is not None
            else None,
        )
        s.setdefault(
            "period_index",
            int(row["period_index"]) if row.get("period_index") is not None else None,
        )
        s.setdefault("interrupted", bool(row.get("interrupted")))
        retros.append(s)

    cur.execute(
        """SELECT * FROM member_habit_plans
           WHERE identity_id = %s
           ORDER BY id ASC""",
        (identity_id,),
    )
    plans = []
    for row in cur.fetchall():
        p = rd.serialize_habit_plan(row)
        p.pop("identity_id", None)
        p["id"] = (row.get("export_key") or f"plan-{int(row['id'])}").strip()
        rid = row.get("retrospective_id")
        if rid:
            # Prefer parent export_key if present
            cur.execute(
                """SELECT export_key FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (int(rid), identity_id),
            )
            pr = cur.fetchone()
            p["retrospective_id"] = (
                (pr.get("export_key") if pr and pr.get("export_key") else None)
                or f"retro-{int(rid)}"
            )
        else:
            p["retrospective_id"] = None
        plans.append(p)

    # In-app notifications (Family B material — Export Spec v1.3)
    notifications: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT id, kind, title, body, href, channel, period_key,
                      resource_type, resource_id, email_status, read_at, created_at
               FROM member_notifications
               WHERE identity_id = %s
               ORDER BY id ASC""",
            (identity_id,),
        )
        for row in cur.fetchall() or []:
            notifications.append(
                {
                    "id": f"mn-{int(row['id'])}",
                    "kind": row.get("kind"),
                    "title": row.get("title") or "",
                    "body": row.get("body") or "",
                    "href": row.get("href") or "",
                    "channel": row.get("channel") or "in_app",
                    "period_key": row.get("period_key"),
                    "resource_type": row.get("resource_type"),
                    "resource_id": row.get("resource_id"),
                    "email_status": row.get("email_status") or "skipped",
                    "read_at": _iso(row.get("read_at")),
                    "created_at": _iso(row.get("created_at")),
                }
            )
    except Exception:
        notifications = []

    # Forward-only cadence history (identity setting itself is not purged)
    cadence_history: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT cadence_days, effective_from, created_at
               FROM member_retro_cadence_history
               WHERE identity_id = %s
               ORDER BY id ASC""",
            (identity_id,),
        )
        for row in cur.fetchall() or []:
            eff = row.get("effective_from")
            if hasattr(eff, "isoformat"):
                eff_s = eff.isoformat()[:10]
            else:
                eff_s = str(eff)[:10] if eff else None
            cadence_history.append(
                {
                    "cadence_days": int(row["cadence_days"]),
                    "effective_from": eff_s,
                    "created_at": _iso(row.get("created_at")),
                }
            )
    except Exception:
        cadence_history = []

    doc["retrospectives"] = retros
    doc["habit_plans"] = plans
    doc["notifications"] = notifications
    doc["cadence_history"] = cadence_history
    return doc


def build_journey_document(cur, identity_id: int, *, role: str = "observer") -> dict[str, Any]:
    import journey_scores as js

    email = _member_email(cur, identity_id)
    doc = envelope(FMT_JOURNEY, email=email)
    doc["snapshot_note"] = (
        "Derived at export time; not re-importable as source of truth."
    )

    scores = js.scores_for_identity(cur, identity_id)
    process = js.process_meters(cur, identity_id, role=role)
    doc["process"] = process
    # Contribution pillars only — no peer board
    doc["contribution"] = {
        k: scores[k]
        for k in (
            "reputation",
            "personal_growth",
            "attendance_streak",
            "contribution",
        )
        if k in scores
    }

    cur.execute(
        "SELECT journey_visible FROM identities WHERE identity_id = %s",
        (identity_id,),
    )
    row = cur.fetchone()
    journey_visible = bool(row and row.get("journey_visible"))

    cur.execute(
        "SELECT opted_in FROM member_analytics_consent WHERE identity_id = %s",
        (identity_id,),
    )
    ac = cur.fetchone()
    analytics = bool(ac and ac.get("opted_in"))

    doc["privacy"] = {
        "journey_visible": journey_visible,
        "analytics_opted_in": analytics,
    }

    cur.execute(
        """SELECT session_key, starts_at, checked_in_at
           FROM live_session_checkins
           WHERE identity_id = %s
           ORDER BY checked_in_at ASC""",
        (identity_id,),
    )
    checkins = [
        {
            "session_key": r["session_key"],
            "starts_at": _iso(r.get("starts_at")),
            "checked_in_at": _iso(r.get("checked_in_at")),
        }
        for r in cur.fetchall()
    ]

    cur.execute(
        "SELECT COUNT(*) AS n FROM enrollments WHERE identity_id = %s",
        (identity_id,),
    )
    course_count = int(cur.fetchone()["n"] or 0)
    cur.execute(
        """SELECT COUNT(*) AS n FROM lesson_progress
           WHERE identity_id = %s AND completed_at IS NOT NULL""",
        (identity_id,),
    )
    completed_lessons = int(cur.fetchone()["n"] or 0)

    doc["raw_signals"] = {
        "live_checkins": checkins,
        "enrollment_summary": {
            "course_count": course_count,
            "completed_lessons": completed_lessons,
        },
    }
    return doc


def build_playbook_document(cur, identity_id: int) -> dict[str, Any]:
    """Stub Playbook export — tool notes on surface ``playbook`` only.

    Full Playbook product is not finished; this keeps pack schema stable so
    export/import round-trips never drop the surface. Shape::

        format: fattail.labs.playbook
        model_version: 0.1-stub
        entries: [{ id, body_md, created_at, updated_at }]
        rules: []   # reserved for future structured playbook rules
    """
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_PLAYBOOK, email=email)
    doc["model_version"] = PLAYBOOK_MODEL_VERSION
    doc["stub"] = True
    doc["note"] = (
        "Playbook product is incomplete. This document carries free-form "
        "playbook notes only; structured rules are reserved empty."
    )
    entries: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT id, body_md, export_key, created_at, updated_at
               FROM member_tool_notes
               WHERE identity_id = %s AND surface = 'playbook'
               ORDER BY created_at ASC, id ASC""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            entries.append(
                {
                    "id": (r.get("export_key") or f"pb-{int(r['id'])}").strip(),
                    "body_md": r.get("body_md") or "",
                    "created_at": _iso(r.get("created_at")),
                    "updated_at": _iso(r.get("updated_at")),
                }
            )
    except Exception:
        entries = []
    doc["entries"] = entries
    doc["rules"] = []  # reserved
    return doc


def build_trade_log_document(cur, identity_id: int) -> dict[str, Any]:
    """Reuse trade_log_io.export_canonical; add pack envelope identity if missing."""
    import trade_log_io as tio

    email = _member_email(cur, identity_id)
    cur.execute(
        """SELECT * FROM member_trade_log_accounts
           WHERE identity_id = %s ORDER BY sort_order, id""",
        (identity_id,),
    )
    accts = cur.fetchall()
    by_acct: dict[int, list] = {}
    accounts_out = []
    for a in accts:
        aid = int(a["id"])
        cur.execute(
            """SELECT * FROM member_trade_log_trades
               WHERE identity_id = %s AND account_id = %s
               ORDER BY exec_at ASC, id ASC""",
            (identity_id, aid),
        )
        rows = cur.fetchall()
        # Load legs
        trade_ids = [int(r["id"]) for r in rows]
        legs_by: dict[int, list] = {tid: [] for tid in trade_ids}
        if trade_ids:
            placeholders = ",".join(["%s"] * len(trade_ids))
            cur.execute(
                f"""SELECT * FROM member_trade_log_legs
                    WHERE trade_id IN ({placeholders})
                    ORDER BY trade_id, leg_index, id""",
                trade_ids,
            )
            for leg in cur.fetchall():
                legs_by.setdefault(int(leg["trade_id"]), []).append(leg)
        trades = []
        for r in rows:
            t = dict(r)
            t["legs"] = legs_by.get(int(r["id"]), [])
            trades.append(t)
        by_acct[aid] = trades
        accounts_out.append(dict(a))

    doc = tio.export_canonical(accounts_out, by_acct)
    # Align identity block with pack policy (email, no identity_id)
    doc.setdefault("source", {})
    if isinstance(doc["source"], dict):
        doc["source"].setdefault("system", "fattail-labs")
        try:
            doc["source"]["env"] = get_config().env
        except Exception:
            pass
    doc["identity"] = {"export_subject": "self", "email": email}
    return doc


def build_member_pack(cur, identity_id: int, *, role: str = "observer") -> dict[str, Any]:
    email = _member_email(cur, identity_id)
    pack = envelope(FMT_PACK, email=email)
    trade_log = build_trade_log_document(cur, identity_id)
    journal = build_journal_document(cur, identity_id)
    journal_session = build_journal_session_document(cur, identity_id)
    retrospective = build_retrospective_document(cur, identity_id)
    journey = build_journey_document(cur, identity_id, role=role)
    playbook = build_playbook_document(cur, identity_id)
    pack["surfaces"] = [
        "trade_log",
        "journal",
        "journal_session",
        "retrospective",
        "journey",
        "playbook",
    ]
    pack["documents"] = {
        "trade_log": trade_log,
        "journal": journal,
        "journal_session": journal_session,
        "retrospective": retrospective,
        "journey": journey,
        "playbook": playbook,
    }
    return pack


def pack_to_zip_bytes(pack: dict[str, Any]) -> bytes:
    docs = pack.get("documents") or {}
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        manifest = {
            "format": FMT_PACK,
            "model_version": MODEL_VERSION,
            "exported_at": pack.get("exported_at"),
            "identity": pack.get("identity"),
            "surfaces": pack.get("surfaces"),
            "files": {
                "trade_log": "trade_log.tradlog.json",
                "journal": "journal.json",
                "journal_session": "journal_session.json",
                "retrospective": "retrospective.json",
                "journey": "journey.json",
                "playbook": "playbook.json",
            },
        }
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, default=str))
        zf.writestr(
            "trade_log.tradlog.json",
            json.dumps(docs.get("trade_log") or {}, indent=2, default=str),
        )
        zf.writestr(
            "journal.json",
            json.dumps(docs.get("journal") or {}, indent=2, default=str),
        )
        zf.writestr(
            "journal_session.json",
            json.dumps(docs.get("journal_session") or {}, indent=2, default=str),
        )
        zf.writestr(
            "retrospective.json",
            json.dumps(docs.get("retrospective") or {}, indent=2, default=str),
        )
        zf.writestr(
            "journey.json",
            json.dumps(docs.get("journey") or {}, indent=2, default=str),
        )
        zf.writestr(
            "playbook.json",
            json.dumps(docs.get("playbook") or {}, indent=2, default=str),
        )
    return buf.getvalue()
