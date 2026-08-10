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
# Playbook + Practice Campaign (Trader Development Phase 1 · OD-1.5)
FMT_PLAYBOOK = "fattail.labs.playbook"
# 2.0 = scrapbook tree (chapters/pages/stickies/evidence/archive refs) · PB3
PLAYBOOK_MODEL_VERSION = "2.0"
FMT_PRACTICE_CAMPAIGN = "fattail.labs.practice_campaign"
# 1.1 = first-class pack: account scope, capital, goals, activated_at (Campaign Spec §4.10)
# 1.2 = signature · amendments · predecessor_export_key (Campaign Spec §4.5 / lifecycle)
CAMPAIGN_MODEL_VERSION = "1.3"
FMT_CAPITAL = "fattail.labs.capital"
CAPITAL_MODEL_VERSION = "1.0"
FMT_PACK = "fattail.labs.member_export"
# Full-pack media budget (B4) — single-book packs may exceed via dedicated export
FULL_PACK_MEDIA_MAX_BYTES = 20 * 1024 * 1024


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
                      structured_json, export_key, practice_campaign_id, created_at
               FROM member_journal_sessions
               WHERE identity_id = %s
               ORDER BY session_started_at ASC, id ASC""",
            (identity_id,),
        )
        sessions = cur.fetchall()
    except Exception:
        doc["entries"] = []
        return doc
    # Resolve campaign export keys once
    camp_keys: dict[int, str] = {}
    try:
        cur.execute(
            """SELECT id, export_key FROM member_practice_campaigns
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            ek = (r.get("export_key") or "").strip()
            if ek:
                camp_keys[int(r["id"])] = ek
    except Exception:
        camp_keys = {}
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
        camp_id = s.get("practice_campaign_id")
        camp_key = None
        if camp_id is not None:
            camp_key = camp_keys.get(int(camp_id))
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
                "practice_campaign_export_key": camp_key,
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


def _export_playbook_book(cur, identity_id: int, book_id: int) -> dict[str, Any]:
    """One scrapbook book as portable dict (model 2.0 tree)."""
    import playbook_scrapbook_domain as pbs

    tree = pbs.load_tree(cur, identity_id, book_id)
    # Attachment id → export_key for cover + archive metadata
    att_by_id: dict[int, dict[str, Any]] = {}
    try:
        for a in pbs.list_archive(cur, identity_id, book_id, include_purged=False):
            att_by_id[int(a["id"])] = a
    except Exception:
        att_by_id = {}

    cover_id = tree.get("cover_attachment_id")
    cover_key = None
    if cover_id is not None and int(cover_id) in att_by_id:
        cover_key = (
            att_by_id[int(cover_id)].get("export_key")
            or f"pba-{int(cover_id)}"
        )

    chapters_out: list[dict[str, Any]] = []
    for ch in tree.get("chapters") or []:
        pages_out: list[dict[str, Any]] = []
        for p in ch.get("pages") or []:
            stickies_out = [
                {
                    "id": (s.get("export_key") or f"pbs-{s['id']}").strip(),
                    "body_md": s.get("body_md") or "",
                    "sort_order": int(s.get("sort_order") or 0),
                }
                for s in (p.get("stickies") or [])
            ]
            pages_out.append(
                {
                    "id": (p.get("export_key") or f"pbp-{p['id']}").strip(),
                    "title": p.get("title"),
                    "body_md": p.get("body_md") or "",
                    "sort_order": int(p.get("sort_order") or 0),
                    "stickies": stickies_out,
                }
            )
        chapters_out.append(
            {
                "id": (ch.get("export_key") or f"pbc-{ch['id']}").strip(),
                "title": ch.get("title") or "",
                "blurb": ch.get("blurb"),
                "sort_order": int(ch.get("sort_order") or 0),
                "chapter_type": ch.get("chapter_type") or "chapter",
                "pages": pages_out,
            }
        )

    evidence_out: list[dict[str, Any]] = []
    try:
        for ev in pbs.list_evidence(cur, identity_id, book_id):
            target = ev.get("target") or {}
            evidence_out.append(
                {
                    "id": (ev.get("export_key") or f"pbe-{ev['id']}").strip(),
                    "object_type": ev.get("object_type"),
                    "object_export_key": target.get("export_key"),
                    "object_id": ev.get("object_id"),  # fallback if key missing
                    "note_md": ev.get("note_md"),
                    "target_status": target.get("status"),
                    "journal_date": target.get("journal_date"),
                }
            )
    except Exception:
        evidence_out = []

    archive_out: list[dict[str, Any]] = []
    for a in att_by_id.values():
        archive_out.append(
            {
                "id": (a.get("export_key") or f"pba-{a['id']}").strip(),
                "content_type": a.get("content_type"),
                "byte_size": a.get("byte_size"),
                "original_name": a.get("original_name"),
                "caption_md": a.get("caption_md") or "",
                # Path only meaningful inside single-book ZIP media/
                "media_path": f"media/{(a.get('export_key') or f'pba-{a['id']}').strip()}",
            }
        )

    return {
        "id": (tree.get("export_key") or f"pb-{book_id}").strip(),
        "title": tree.get("title") or "",
        "subtitle": tree.get("subtitle") or "",
        "body_md": tree.get("body_md") or "",  # derived snippet
        "structured": tree.get("structured")
        if isinstance(tree.get("structured"), dict)
        else {},
        "status": tree.get("status") or "active",
        "cover_export_key": cover_key,
        "chapters": chapters_out,
        "evidence": evidence_out,
        "archive": archive_out,
        "created_at": tree.get("created_at"),
        "updated_at": tree.get("updated_at"),
    }


def build_playbook_document(cur, identity_id: int) -> dict[str, Any]:
    """Playbook export v2.0 scrapbook tree + legacy tool-note notes.

    Shape::
        format: fattail.labs.playbook
        model_version: 2.0
        entries: [{ id, title, subtitle, chapters[], evidence[], archive[], … }]
        notes: [{ id, body_md, ... }]  # legacy surface=playbook tool notes
    """
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_PLAYBOOK, email=email)
    doc["model_version"] = PLAYBOOK_MODEL_VERSION
    doc["stub"] = False
    entries: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT id FROM member_playbook_entries
               WHERE identity_id = %s
               ORDER BY created_at ASC, id ASC""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            try:
                entries.append(_export_playbook_book(cur, identity_id, int(r["id"])))
            except Exception:
                continue
    except Exception:
        entries = []
    notes: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT id, body_md, export_key, created_at, updated_at
               FROM member_tool_notes
               WHERE identity_id = %s AND surface = 'playbook'
               ORDER BY created_at ASC, id ASC""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            notes.append(
                {
                    "id": (r.get("export_key") or f"pbn-{int(r['id'])}").strip(),
                    "body_md": r.get("body_md") or "",
                    "created_at": _iso(r.get("created_at")),
                    "updated_at": _iso(r.get("updated_at")),
                }
            )
    except Exception:
        notes = []
    doc["entries"] = entries
    doc["notes"] = notes
    # Backward-compat: 0.1-stub packs only had free-form notes in entries
    if not entries and notes:
        doc["entries"] = [
            {**n, "title": "", "status": "active", "structured": {}} for n in notes
        ]
    return doc


def build_single_playbook_document(
    cur, identity_id: int, book_id: int
) -> dict[str, Any]:
    """One-book scrapbook export (same format as pack surface, single entry)."""
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_PLAYBOOK, email=email)
    doc["model_version"] = PLAYBOOK_MODEL_VERSION
    doc["stub"] = False
    doc["entries"] = [_export_playbook_book(cur, identity_id, book_id)]
    doc["notes"] = []
    return doc


def single_playbook_to_zip_bytes(
    cur, identity_id: int, book_id: int
) -> bytes:
    """ZIP: playbook.json + media/* for archive files (PB3 single-book pack)."""
    import playbook_scrapbook_domain as pbs

    doc = build_single_playbook_document(cur, identity_id, book_id)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "playbook.json",
            json.dumps(doc, indent=2, default=str),
        )
        zf.writestr(
            "manifest.json",
            json.dumps(
                {
                    "format": FMT_PLAYBOOK,
                    "model_version": PLAYBOOK_MODEL_VERSION,
                    "kind": "single_book",
                    "files": {"playbook": "playbook.json", "media": "media/"},
                },
                indent=2,
            ),
        )
        try:
            for a in pbs.list_archive(cur, identity_id, book_id):
                ek = (a.get("export_key") or f"pba-{a['id']}").strip()
                try:
                    data, _ct = pbs.read_attachment_bytes(
                        cur, identity_id, book_id, int(a["id"])
                    )
                except Exception:
                    continue
                zf.writestr(f"media/{ek}", data)
        except Exception:
            pass
    return buf.getvalue()


def _parse_signed_terms_export(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            out = json.loads(raw)
            return out if isinstance(out, dict) else None
        except (TypeError, ValueError):
            return None
    return None


def build_practice_campaign_document(cur, identity_id: int) -> dict[str, Any]:
    """Practice Campaign export — first-class surface (schema practice-campaign-v1).

    model_version 1.1: account_export_key, starting_capital, goals_md, activated_at,
    playbook M2M. 1.2: signed_at/signed_terms, amendments[], predecessor_export_key.
    Empty entries[] is valid (campaigns optional).
    """
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_PRACTICE_CAMPAIGN, email=email)
    doc["format"] = FMT_PRACTICE_CAMPAIGN
    doc["model_version"] = CAMPAIGN_MODEL_VERSION
    # playbook id → export_key
    pb_keys: dict[int, str] = {}
    try:
        cur.execute(
            """SELECT id, export_key FROM member_playbook_entries
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            ek = (r.get("export_key") or "").strip()
            if ek:
                pb_keys[int(r["id"])] = ek
    except Exception:
        pb_keys = {}
    # account id → portable id + label (same id shape as trade_log.accounts[].id)
    acct_meta: dict[int, tuple[str, str]] = {}
    try:
        cur.execute(
            """SELECT id, label FROM member_trade_log_accounts
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            aid = int(r["id"])
            acct_meta[aid] = (f"acct-{aid}", (r.get("label") or "").strip())
    except Exception:
        acct_meta = {}
    # campaign id → export_key (for predecessor_export_key)
    camp_keys: dict[int, str] = {}
    try:
        cur.execute(
            """SELECT id, export_key FROM member_practice_campaigns
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            ek = (r.get("export_key") or "").strip()
            if ek:
                camp_keys[int(r["id"])] = ek
    except Exception:
        camp_keys = {}
    entries: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT id, title, status, account_id, starts_at, ends_at,
                      activated_at, starting_capital, goals_md, is_default,
                      is_ledger,
                      signed_at, signed_terms, signed_terms_backfilled,
                      predecessor_campaign_id,
                      charter_version, max_drawdown_pct, strategy_codes,
                      capital_allocation_mode, capital_allocation_note,
                      retrospective_id, same_bet_json,
                      export_key, created_at, updated_at
               FROM member_practice_campaigns
               WHERE identity_id = %s
               ORDER BY created_at ASC, id ASC""",
            (identity_id,),
        )
        camps = cur.fetchall() or []
        for c in camps:
            cid = int(c["id"])
            cur.execute(
                """SELECT playbook_entry_id FROM member_practice_campaign_playbooks
                   WHERE campaign_id = %s ORDER BY playbook_entry_id""",
                (cid,),
            )
            pb_export_keys = []
            for link in cur.fetchall() or []:
                pk = pb_keys.get(int(link["playbook_entry_id"]))
                if pk:
                    pb_export_keys.append(pk)
            account_export_key = None
            account_label = None
            if c.get("account_id") is not None:
                meta = acct_meta.get(int(c["account_id"]))
                if meta:
                    account_export_key, account_label = meta
                else:
                    account_export_key = f"acct-{int(c['account_id'])}"
            cap = c.get("starting_capital")
            try:
                starting_capital = float(cap) if cap is not None else None
            except (TypeError, ValueError):
                starting_capital = None
            pred_id = c.get("predecessor_campaign_id")
            predecessor_export_key = None
            if pred_id is not None:
                predecessor_export_key = camp_keys.get(int(pred_id))
                if not predecessor_export_key:
                    predecessor_export_key = f"camp-{int(pred_id)}"
            # Amendments (append-only history)
            amendments: list[dict[str, Any]] = []
            try:
                cur.execute(
                    """SELECT export_key, amended_at, field, old_value, new_value,
                              note_md
                       FROM member_practice_campaign_amendments
                       WHERE identity_id = %s AND campaign_id = %s
                       ORDER BY amended_at ASC, id ASC""",
                    (identity_id, cid),
                )
                for ar in cur.fetchall() or []:
                    amendments.append(
                        {
                            "id": (ar.get("export_key") or "").strip() or None,
                            "amended_at": _iso(ar.get("amended_at")),
                            "field": ar.get("field") or "",
                            "old_value": ar.get("old_value"),
                            "new_value": ar.get("new_value"),
                            "note_md": (ar.get("note_md") or None) or None,
                        }
                    )
            except Exception:
                amendments = []
            # Bounds (Two Roles) — Spec pack ≥ 1.3
            bounds_out: list[dict[str, Any]] = []
            try:
                cur.execute(
                    """SELECT export_key, role, attribute, unit, basis, window_kind,
                              range_low, range_high, is_critical, n_floor
                       FROM member_practice_campaign_bounds
                       WHERE identity_id = %s AND campaign_id = %s
                       ORDER BY role ASC, attribute ASC, id ASC""",
                    (identity_id, cid),
                )
                for br in cur.fetchall() or []:
                    def _bf(v: Any) -> float | None:
                        if v is None:
                            return None
                        try:
                            return float(v)
                        except (TypeError, ValueError):
                            return None

                    bounds_out.append(
                        {
                            "id": (br.get("export_key") or "").strip() or None,
                            "role": (br.get("role") or "boundary"),
                            "attribute": br.get("attribute") or "",
                            "unit": br.get("unit"),
                            "basis": br.get("basis"),
                            "window_kind": br.get("window_kind"),
                            "range_low": _bf(br.get("range_low")),
                            "range_high": _bf(br.get("range_high")),
                            "is_critical": bool(int(br.get("is_critical") or 0)),
                            "n_floor": (
                                int(br["n_floor"])
                                if br.get("n_floor") is not None
                                else None
                            ),
                        }
                    )
            except Exception:
                bounds_out = []
            entries.append(
                {
                    "id": (c.get("export_key") or f"camp-{cid}").strip(),
                    "title": c.get("title") or "",
                    "status": c.get("status") or "planned",
                    "starts_at": _iso(c.get("starts_at")),
                    "ends_at": _iso(c.get("ends_at")),
                    "activated_at": _iso(c.get("activated_at")),
                    "account_export_key": account_export_key,
                    "account_label": account_label or None,
                    "starting_capital": starting_capital,
                    "goals_md": (c.get("goals_md") or None) or None,
                    "is_default": bool(int(c.get("is_default") or 0)),
                    "is_ledger": bool(int(c.get("is_ledger") or 0)),
                    "signed_at": _iso(c.get("signed_at")),
                    "signed_terms": _parse_signed_terms_export(c.get("signed_terms")),
                    "signed_terms_backfilled": bool(
                        int(c.get("signed_terms_backfilled") or 0)
                    ),
                    "predecessor_export_key": predecessor_export_key,
                    "charter_version": int(c.get("charter_version") or 1),
                    "max_drawdown_pct": (
                        float(c["max_drawdown_pct"])
                        if c.get("max_drawdown_pct") is not None
                        else None
                    ),
                    "capital_allocation_mode": (
                        (c.get("capital_allocation_mode") or "fixed") or "fixed"
                    ),
                    "capital_allocation_note": (
                        (c.get("capital_allocation_note") or None) or None
                    ),
                    "strategy_codes": c.get("strategy_codes"),
                    "retrospective_id": (
                        int(c["retrospective_id"])
                        if c.get("retrospective_id") is not None
                        else None
                    ),
                    "same_bet": c.get("same_bet_json"),
                    "amendments": amendments,
                    "bounds": bounds_out,
                    "playbook_export_keys": pb_export_keys,
                    "created_at": _iso(c.get("created_at")),
                    "updated_at": _iso(c.get("updated_at")),
                }
            )
    except Exception:
        entries = []
    doc["entries"] = entries
    doc["$schema"] = "https://fattail.labs/schemas/practice-campaign-v1.json"
    return doc


def build_trade_log_document(cur, identity_id: int) -> dict[str, Any]:
    """Reuse trade_log_io.export_canonical; add pack envelope identity if missing."""
    import trade_log_io as tio

    email = _member_email(cur, identity_id)
    # Resolve playbook / campaign export keys for portable links
    pb_keys: dict[int, str] = {}
    camp_keys: dict[int, str] = {}
    try:
        cur.execute(
            """SELECT id, export_key FROM member_playbook_entries
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            ek = (r.get("export_key") or "").strip()
            if ek:
                pb_keys[int(r["id"])] = ek
        cur.execute(
            """SELECT id, export_key FROM member_practice_campaigns
               WHERE identity_id = %s""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            ek = (r.get("export_key") or "").strip()
            if ek:
                camp_keys[int(r["id"])] = ek
    except Exception:
        pass

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
                    WHERE identity_id = %s AND trade_id IN ({placeholders})
                    ORDER BY trade_id, leg_index, id""",
                [identity_id, *trade_ids],
            )
            for leg in cur.fetchall():
                legs_by.setdefault(int(leg["trade_id"]), []).append(leg)
        trades = []
        for r in rows:
            t = dict(r)
            t["legs"] = legs_by.get(int(r["id"]), [])
            pb_id = t.get("playbook_entry_id")
            camp_id = t.get("practice_campaign_id")
            if pb_id is not None:
                t["playbook_export_key"] = pb_keys.get(int(pb_id))
            if camp_id is not None:
                t["practice_campaign_export_key"] = camp_keys.get(int(camp_id))
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


def build_capital_document(cur, identity_id: int) -> dict[str, Any]:
    """Capital prefs + cash movements (Hardening B3). Empty is valid."""
    email = _member_email(cur, identity_id)
    doc = envelope(FMT_CAPITAL, email=email)
    doc["format"] = FMT_CAPITAL
    doc["model_version"] = CAPITAL_MODEL_VERSION
    prefs: dict[str, Any] | None = None
    try:
        cur.execute(
            "SELECT * FROM member_capital_prefs WHERE identity_id = %s",
            (identity_id,),
        )
        row = cur.fetchone()
        if row:
            prefs = {
                "export_key": row.get("export_key"),
                "tolerated_master_drawdown": (
                    float(row["tolerated_master_drawdown"])
                    if row.get("tolerated_master_drawdown") is not None
                    else None
                ),
                "tolerated_master_drawdown_form": row.get(
                    "tolerated_master_drawdown_form"
                )
                or "percent",
                "buying_power_posture": row.get("buying_power_posture") or "arbitrary",
                "buying_power_value": (
                    float(row["buying_power_value"])
                    if row.get("buying_power_value") is not None
                    else None
                ),
            }
    except Exception:
        prefs = None
    movements: list[dict[str, Any]] = []
    try:
        cur.execute(
            """SELECT m.*, a.label AS account_label
               FROM member_account_cash_movements m
               JOIN member_trade_log_accounts a
                 ON a.id = m.account_id AND a.identity_id = m.identity_id
               WHERE m.identity_id = %s
               ORDER BY m.occurred_at ASC, m.id ASC""",
            (identity_id,),
        )
        for r in cur.fetchall() or []:
            aid = int(r["account_id"])
            movements.append(
                {
                    "id": (r.get("export_key") or f"mvt-{r['id']}").strip(),
                    "account_export_key": f"acct-{aid}",
                    "account_label": (r.get("account_label") or "").strip(),
                    "amount": float(r["amount"] or 0),
                    "occurred_at": _iso(r.get("occurred_at")),
                    "note": r.get("note") or "",
                }
            )
    except Exception:
        movements = []
    doc["prefs"] = prefs
    doc["movements"] = movements
    return doc


def build_member_pack(cur, identity_id: int, *, role: str = "observer") -> dict[str, Any]:
    email = _member_email(cur, identity_id)
    pack = envelope(FMT_PACK, email=email)
    warnings: list[str] = []

    def _safe(name: str, fn):
        """C3 — never silent-skip a failed surface; emit warnings[]."""
        try:
            return fn()
        except Exception as exc:
            warnings.append(f"{name}: export failed ({exc})")
            stub = envelope(f"fattail.labs.{name}", email=email)
            stub["format"] = f"fattail.labs.{name}"
            stub["stub"] = True
            stub["export_error"] = str(exc)
            return stub

    # Playbook before campaigns (import order matches)
    playbook = _safe("playbook", lambda: build_playbook_document(cur, identity_id))
    practice_campaign = _safe(
        "practice_campaign",
        lambda: build_practice_campaign_document(cur, identity_id),
    )
    trade_log = _safe("trade_log", lambda: build_trade_log_document(cur, identity_id))
    journal = _safe("journal", lambda: build_journal_document(cur, identity_id))
    journal_session = _safe(
        "journal_session",
        lambda: build_journal_session_document(cur, identity_id),
    )
    retrospective = _safe(
        "retrospective",
        lambda: build_retrospective_document(cur, identity_id),
    )
    journey = _safe(
        "journey",
        lambda: build_journey_document(cur, identity_id, role=role),
    )
    capital = _safe("capital", lambda: build_capital_document(cur, identity_id))
    pack["surfaces"] = [
        "playbook",
        "practice_campaign",
        "trade_log",
        "journal",
        "journal_session",
        "retrospective",
        "journey",
        "capital",
    ]
    pack["documents"] = {
        "playbook": playbook,
        "practice_campaign": practice_campaign,
        "trade_log": trade_log,
        "journal": journal,
        "journal_session": journal_session,
        "retrospective": retrospective,
        "journey": journey,
        "capital": capital,
    }
    if warnings:
        pack["warnings"] = warnings
    return pack


def pack_to_zip_bytes(
    pack: dict[str, Any],
    *,
    cur=None,
    identity_id: int | None = None,
) -> bytes:
    docs = pack.get("documents") or {}
    warnings = list(pack.get("warnings") or [])
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        files = {
            "playbook": "playbook.json",
            "practice_campaign": "practice_campaign.json",
            "trade_log": "trade_log.tradlog.json",
            "journal": "journal.json",
            "journal_session": "journal_session.json",
            "retrospective": "retrospective.json",
            "journey": "journey.json",
            "capital": "capital.json",
        }
        # B4 — optional media/* when cur provided (size-capped)
        media_files: list[str] = []
        if cur is not None and identity_id is not None:
            try:
                import playbook_scrapbook_domain as pbs

                media_budget = FULL_PACK_MEDIA_MAX_BYTES
                used = 0
                books = (docs.get("playbook") or {}).get("entries") or []
                for book in books:
                    if not isinstance(book, dict):
                        continue
                    # Resolve book id via export_key when possible
                    bk = (book.get("id") or "").strip()
                    if not bk:
                        continue
                    cur.execute(
                        """SELECT id FROM member_playbook_entries
                           WHERE identity_id = %s AND export_key = %s""",
                        (identity_id, bk),
                    )
                    brow = cur.fetchone()
                    if not brow:
                        continue
                    book_id = int(brow["id"])
                    for a in pbs.list_archive(cur, identity_id, book_id) or []:
                        ek = (a.get("export_key") or f"pba-{a['id']}").strip()
                        try:
                            data, _ct = pbs.read_attachment_bytes(
                                cur, identity_id, book_id, int(a["id"])
                            )
                        except Exception:
                            warnings.append(f"media/{ek}: read failed — skipped")
                            continue
                        if used + len(data) > media_budget:
                            warnings.append(
                                f"media: size cap {FULL_PACK_MEDIA_MAX_BYTES} "
                                f"bytes — remaining archive files skipped"
                            )
                            media_budget = 0
                            break
                        zf.writestr(f"media/{ek}", data)
                        media_files.append(f"media/{ek}")
                        used += len(data)
                    if media_budget == 0:
                        break
            except Exception as exc:
                warnings.append(f"media: pack attach failed ({exc})")
        if media_files:
            files["media"] = "media/"
        manifest = {
            "format": FMT_PACK,
            "model_version": MODEL_VERSION,
            "exported_at": pack.get("exported_at"),
            "identity": pack.get("identity"),
            "surfaces": pack.get("surfaces"),
            "files": files,
            "warnings": warnings or None,
        }
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, default=str))
        zf.writestr(
            "playbook.json",
            json.dumps(docs.get("playbook") or {}, indent=2, default=str),
        )
        zf.writestr(
            "practice_campaign.json",
            json.dumps(docs.get("practice_campaign") or {}, indent=2, default=str),
        )
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
            "capital.json",
            json.dumps(docs.get("capital") or {}, indent=2, default=str),
        )
        zf.writestr(
            "retrospective.json",
            json.dumps(docs.get("retrospective") or {}, indent=2, default=str),
        )
        zf.writestr(
            "journey.json",
            json.dumps(docs.get("journey") or {}, indent=2, default=str),
        )
    return buf.getvalue()
