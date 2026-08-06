"""Member Practice import — Spec portability v1.1+ (two-way, **additive only**).

detect → preview → commit

**Non-destructive:** never UPDATE or DELETE existing rows. Insert missing only;
matching export_key / session_key → skip. Journey meters never written.
Privacy prefs are not overwritten (only new check-ins may be added).
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any

import export_domain as ex

MAX_BYTES = 25 * 1024 * 1024
OPEN_STATUSES = frozenset({"draft", "gathering", "ready"})
NOTE_SURFACES = frozenset({"journal", "pre_market", "playbook"})
# Single policy — additive only (legacy "merge"/"skip_existing" accepted as alias)
POLICIES = frozenset({"additive", "merge", "skip_existing"})
# Journal session product statuses (legacy partial|sealed accepted on import)
SESSION_STATUSES = frozenset({"open", "closed", "partial", "sealed"})
SESSION_AUTHORS = frozenset({"member", "agent"})
SESSION_PHASES = frozenset(
    {"pre_open", "intraday", "post_close", "off_session", "later_day"}
)
SESSION_TAGS = frozenset(
    {"pre_market", "post_session", "clean_day", "reflection"}
)


class ImportErrorLoud(Exception):
    """Fail-loud import problem with HTTP-friendly payload."""

    def __init__(self, message: str, *, status: int = 422, extra: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.extra = extra or {}


def _normalize_policy(policy: str | None) -> str:
    p = (policy or "additive").strip().lower()
    if p not in POLICIES:
        raise ImportErrorLoud("policy must be additive (only non-destructive load supported)")
    return "additive"


def _hash_key(*parts: str) -> str:
    h = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:32]
    return f"h-{h}"


def _portable_key(raw_id: Any, *fallback_parts: str) -> str:
    if raw_id is not None and str(raw_id).strip():
        return str(raw_id).strip()[:64]
    return _hash_key(*fallback_parts)[:64]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def decode_payload(
    *,
    text: str | None = None,
    b64: str | None = None,
    raw_bytes: bytes | None = None,
) -> tuple[bytes, str]:
    """Return (bytes, kind) kind is 'zip' or 'text'."""
    data: bytes
    if raw_bytes is not None:
        data = raw_bytes
    elif b64:
        data = base64.b64decode(b64)
    elif text is not None:
        data = text.encode("utf-8")
    else:
        raise ImportErrorLoud("text, base64, or file content required")
    if len(data) > MAX_BYTES:
        raise ImportErrorLoud(f"payload exceeds {MAX_BYTES} bytes", status=413)
    if data[:2] == b"PK":
        return data, "zip"
    return data, "text"


def _load_json_obj(data: bytes) -> dict:
    try:
        obj = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ImportErrorLoud(f"invalid JSON: {exc}") from exc
    if not isinstance(obj, dict):
        raise ImportErrorLoud("document must be a JSON object")
    return obj


def unpack_payload(data: bytes, kind: str) -> dict[str, dict]:
    """Map surface name → document dict. Partial packs OK."""
    docs: dict[str, dict] = {}
    if kind == "zip":
        try:
            zf = zipfile.ZipFile(io.BytesIO(data))
        except zipfile.BadZipFile as exc:
            raise ImportErrorLoud("invalid ZIP") from exc
        name_map = {
            "trade_log.tradlog.json": "trade_log",
            "journal.json": "journal",
            "journal_session.json": "journal_session",
            "retrospective.json": "retrospective",
            "journey.json": "journey",
            "playbook.json": "playbook",
            "pack.json": "pack",
        }
        for name in zf.namelist():
            base = name.split("/")[-1]
            if base in name_map:
                try:
                    docs[name_map[base]] = _load_json_obj(zf.read(name))
                except ImportErrorLoud:
                    raise
                except Exception as exc:
                    raise ImportErrorLoud(f"bad file {base}: {exc}") from exc
        if "pack" in docs and docs["pack"].get("format") == ex.FMT_PACK:
            embedded = docs["pack"].get("documents") or {}
            if isinstance(embedded, dict):
                for k, v in embedded.items():
                    if isinstance(v, dict) and k not in docs:
                        docs[k] = v
        if not docs:
            raise ImportErrorLoud("ZIP has no recognizable Practice files")
        return docs

    obj = _load_json_obj(data)
    fmt = obj.get("format") or ""
    if fmt == ex.FMT_PACK:
        docs["pack"] = obj
        embedded = obj.get("documents") or {}
        if isinstance(embedded, dict):
            for k, v in embedded.items():
                if isinstance(v, dict):
                    docs[k] = v
        return docs
    if fmt == ex.FMT_JOURNAL:
        return {"journal": obj}
    if fmt == ex.FMT_JOURNAL_SESSION:
        return {"journal_session": obj}
    if fmt == ex.FMT_RETRO:
        return {"retrospective": obj}
    if fmt == ex.FMT_JOURNEY:
        return {"journey": obj}
    if fmt == ex.FMT_PLAYBOOK or fmt == "fattail.labs.playbook":
        return {"playbook": obj}
    if fmt == "fattail.labs.trade_log" or (
        isinstance(obj.get("accounts"), list)
        and str(obj.get("format", "")).startswith("fattail")
    ):
        return {"trade_log": obj}
    if isinstance(obj.get("accounts"), list) and any(
        isinstance(a, dict) and "trades" in a for a in obj.get("accounts") or []
    ):
        return {"trade_log": obj}
    raise ImportErrorLoud(f"unrecognized format {fmt!r}")


def detect_payload(data: bytes, kind: str) -> dict[str, Any]:
    docs = unpack_payload(data, kind)
    surfaces = [
        s
        for s in (
            "trade_log",
            "journal",
            "journal_session",
            "retrospective",
            "journey",
            "playbook",
        )
        if s in docs
    ]
    return {
        "kind": kind,
        "policy": "additive",
        "surfaces": surfaces,
        "formats": {
            s: (docs[s].get("format") if isinstance(docs[s], dict) else None) for s in surfaces
        },
    }


def _count_bucket() -> dict[str, int]:
    return {"new": 0, "skip": 0, "error": 0}


def preview_journal(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    warnings: list[str] = []
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        surface = (e.get("surface") or "journal").strip()
        if surface not in NOTE_SURFACES:
            counts["error"] += 1
            warnings.append(f"skip unknown surface {surface!r}")
            continue
        if not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), surface, str(e.get("day") or ""), body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
    return {
        "surface": "journal",
        "counts": counts,
        "warnings": warnings,
        "mode": "additive",
    }


def commit_journal(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        surface = (e.get("surface") or "journal").strip()
        if surface not in NOTE_SURFACES or not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), surface, str(e.get("day") or ""), body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        cur.execute(
            """INSERT INTO member_tool_notes
                 (identity_id, surface, body_md, export_key)
               VALUES (%s, %s, %s, %s)""",
            (identity_id, surface, body, key),
        )
        counts["new"] += 1
    return {"surface": "journal", "counts": counts, "mode": "additive"}


def preview_playbook(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    """Stub playbook notes — same additive key policy as journal notes."""
    counts = _count_bucket()
    warnings: list[str] = []
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        if not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), "playbook", body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
    rules = doc.get("rules") or []
    if rules:
        warnings.append(
            f"playbook.rules has {len(rules)} item(s); stub importer ignores structured rules"
        )
    return {
        "surface": "playbook",
        "counts": counts,
        "warnings": warnings,
        "mode": "additive",
        "note": "stub surface — free-form notes only",
    }


def commit_playbook(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        if not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), "playbook", body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        cur.execute(
            """INSERT INTO member_tool_notes
                 (identity_id, surface, body_md, export_key)
               VALUES (%s, 'playbook', %s, %s)""",
            (identity_id, body, key),
        )
        counts["new"] += 1
    return {
        "surface": "playbook",
        "counts": counts,
        "mode": "additive",
        "note": "stub surface — free-form notes only",
    }


def _parse_date_only(raw: Any) -> str | None:
    """Return YYYY-MM-DD or None."""
    if raw is None or raw == "":
        return None
    if hasattr(raw, "isoformat"):
        return str(raw.isoformat())[:10]
    s = str(raw).strip()
    return s[:10] if len(s) >= 10 else None


def preview_journal_session(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    """Additive session import — skip by export_key or existing journal_date."""
    counts = _count_bucket()
    msg_counts = _count_bucket()
    warnings: list[str] = []
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        key = _portable_key(
            e.get("id"),
            str(e.get("journal_date") or ""),
            str(e.get("session_started_at") or ""),
            str(e.get("tag") or ""),
        )
        jd = _parse_date_only(e.get("journal_date"))
        cur.execute(
            """SELECT id FROM member_journal_sessions
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        if jd:
            cur.execute(
                """SELECT id FROM member_journal_sessions
                   WHERE identity_id = %s AND journal_date = %s
                   LIMIT 1""",
                (identity_id, jd),
            )
            if cur.fetchone():
                counts["skip"] += 1
                warnings.append(
                    f"skip session {key}: journal_date {jd} already has a conversation"
                )
                continue
        counts["new"] += 1
        for m in e.get("messages") or []:
            if isinstance(m, dict) and (m.get("body_md") or "").strip():
                msg_counts["new"] += 1
            else:
                msg_counts["error"] += 1
        atts = e.get("attachments") or []
        if atts:
            warnings.append(
                f"session {key}: {len(atts)} attachment(s) metadata only "
                "(binaries not restored in stub path)"
            )
    return {
        "surface": "journal_session",
        "counts": counts,
        "messages": msg_counts,
        "warnings": warnings,
        "mode": "additive",
        "note": "one conversation per date; skip if date or export_key exists",
    }


def commit_journal_session(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    msg_counts = _count_bucket()
    warnings: list[str] = []
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        key = _portable_key(
            e.get("id"),
            str(e.get("journal_date") or ""),
            str(e.get("session_started_at") or ""),
            str(e.get("tag") or ""),
        )
        jd = _parse_date_only(e.get("journal_date"))
        if not jd:
            counts["error"] += 1
            warnings.append(f"skip session without journal_date: {key}")
            continue
        cur.execute(
            """SELECT id FROM member_journal_sessions
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        cur.execute(
            """SELECT id FROM member_journal_sessions
               WHERE identity_id = %s AND journal_date = %s
               LIMIT 1""",
            (identity_id, jd),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue

        status = (e.get("status") or "closed").strip().lower()
        if status not in SESSION_STATUSES:
            status = "closed"
        # Import into a live account must not leave many "open" sessions active
        # unless the pack only has a few — preserve closed fidelity; leave open as open.
        tag = e.get("tag")
        if tag is not None:
            tag = str(tag).strip() or None
            if tag and tag not in SESSION_TAGS:
                tag = None
        structured = e.get("structured") if isinstance(e.get("structured"), dict) else {}
        structured_json = json.dumps(structured) if structured else None
        started = _parse_dt(e.get("session_started_at")) or _utcnow()
        prompt_vid = e.get("prompt_version_id")
        if prompt_vid is not None:
            prompt_vid = str(prompt_vid)[:64]

        cur.execute(
            """INSERT INTO member_journal_sessions
                 (identity_id, tag, journal_date, session_started_at, status,
                  structured_json, export_key, prompt_version_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                identity_id,
                tag,
                jd,
                started,
                status,
                structured_json,
                key,
                prompt_vid,
            ),
        )
        sid = int(cur.lastrowid)
        counts["new"] += 1

        for m in e.get("messages") or []:
            if not isinstance(m, dict):
                msg_counts["error"] += 1
                continue
            body = (m.get("body_md") or "").strip()
            if not body:
                msg_counts["skip"] += 1
                continue
            author = (m.get("author") or "member").strip().lower()
            if author not in SESSION_AUTHORS:
                author = "member"
            phase = (m.get("phase") or "off_session").strip().lower()
            if phase not in SESSION_PHASES:
                phase = "off_session"
            created = _parse_dt(m.get("at") or m.get("created_at")) or started
            agent_svc = None
            if author == "agent":
                agent_svc = (m.get("agent_service") or "labs-journal-session")[:64]
            cur.execute(
                """INSERT INTO member_journal_messages
                     (session_id, identity_id, author, agent_service, body_md, phase, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (sid, identity_id, author, agent_svc, body, phase, created),
            )
            msg_counts["new"] += 1

        # Best-effort product tags (session tag column already set; multi-tag table optional)
        try:
            tag_list: list[str] = []
            if tag:
                tag_list.append(tag)
            for t in e.get("tags") or []:
                if isinstance(t, str) and t in SESSION_TAGS and t not in tag_list:
                    tag_list.append(t)
                elif isinstance(t, dict):
                    slug = str(t.get("slug") or "").strip()
                    if slug in SESSION_TAGS and slug not in tag_list:
                        tag_list.append(slug)
            for t in tag_list:
                cur.execute(
                    """INSERT IGNORE INTO member_journal_session_tags (session_id, tag)
                       VALUES (%s, %s)""",
                    (sid, t),
                )
        except Exception:
            pass

        if e.get("attachments"):
            warnings.append(
                f"session {key}: attachment binaries not restored (metadata only in pack)"
            )

    return {
        "surface": "journal_session",
        "counts": counts,
        "messages": msg_counts,
        "warnings": warnings,
        "mode": "additive",
    }


def _json_dumps(v: Any) -> str | None:
    if v is None:
        return None
    return json.dumps(v)


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw
    s = str(raw).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def _retro_import_status_plan(
    cur, identity_id: int, doc: dict
) -> tuple[dict[str, str], list[str]]:
    """Map portable retro key → status to store, demoting opens to respect max-1.

    Portability priority: never hard-fail a pack because the target already has
    an open retrospective. Demote surplus open rows to ``interrupted`` and warn.
    """
    warnings: list[str] = []
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_retrospectives
           WHERE identity_id = %s AND status IN ('draft','gathering','ready')""",
        (identity_id,),
    )
    open_slots = 0 if int(cur.fetchone()["n"] or 0) >= 1 else 1
    plan: dict[str, str] = {}
    for r in doc.get("retrospectives") or []:
        if not isinstance(r, dict):
            continue
        key = _portable_key(
            r.get("id"),
            str(r.get("scope_start") or ""),
            str(r.get("scope_end") or ""),
            str(r.get("title") or ""),
            str(bool(r.get("is_maiden"))),
        )
        status = (r.get("status") or "draft").strip()
        if status in OPEN_STATUSES:
            if open_slots > 0:
                plan[key] = status
                open_slots -= 1
            else:
                plan[key] = "interrupted"
                warnings.append(
                    f"retrospective {key}: status {status!r} demoted to "
                    f"'interrupted' (max 1 open retrospective)"
                )
        else:
            plan[key] = status
    return plan, warnings


def _habit_import_status_plan(
    cur, identity_id: int, doc: dict
) -> tuple[dict[str, str], list[str]]:
    """Map portable plan key → status; demote surplus actives to ``retired``."""
    warnings: list[str] = []
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_habit_plans
           WHERE identity_id = %s AND status = 'active'""",
        (identity_id,),
    )
    active_slots = max(0, 2 - int(cur.fetchone()["n"] or 0))
    plan: dict[str, str] = {}
    for p in doc.get("habit_plans") or []:
        if not isinstance(p, dict):
            continue
        key = _portable_key(
            p.get("id"),
            str(p.get("title") or ""),
            str(p.get("habit") or ""),
            str(p.get("status") or ""),
        )
        st = (p.get("status") or "proposed").strip()
        if st == "active":
            if active_slots > 0:
                plan[key] = "active"
                active_slots -= 1
            else:
                plan[key] = "retired"
                warnings.append(
                    f"habit plan {key}: status 'active' demoted to 'retired' "
                    f"(max 2 active habit plans)"
                )
        else:
            plan[key] = st
    return plan, warnings


def preview_retrospective(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    plan_counts = _count_bucket()
    notif_counts = _count_bucket()
    cadence_counts = _count_bucket()
    status_plan, warnings = _retro_import_status_plan(cur, identity_id, doc)
    _, habit_warnings = _habit_import_status_plan(cur, identity_id, doc)
    warnings.extend(habit_warnings)
    errors: list[str] = []  # portability: demote instead of hard-fail

    for r in doc.get("retrospectives") or []:
        if not isinstance(r, dict):
            counts["error"] += 1
            continue
        key = _portable_key(
            r.get("id"),
            str(r.get("scope_start") or ""),
            str(r.get("scope_end") or ""),
            str(r.get("title") or ""),
            str(bool(r.get("is_maiden"))),
        )
        cur.execute(
            """SELECT id FROM member_retrospectives
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
            _ = status_plan.get(key)  # planned status applied at commit

    for p in doc.get("habit_plans") or []:
        if not isinstance(p, dict):
            plan_counts["error"] += 1
            continue
        key = _portable_key(
            p.get("id"),
            str(p.get("title") or ""),
            str(p.get("habit") or ""),
            str(p.get("status") or ""),
        )
        cur.execute(
            """SELECT id FROM member_habit_plans
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            plan_counts["skip"] += 1
        else:
            plan_counts["new"] += 1

    for n in doc.get("notifications") or []:
        if not isinstance(n, dict):
            notif_counts["error"] += 1
            continue
        kind = (n.get("kind") or "").strip()
        period_key = n.get("period_key")
        if not kind:
            notif_counts["error"] += 1
            continue
        if period_key:
            cur.execute(
                """SELECT id FROM member_notifications
                   WHERE identity_id = %s AND kind = %s AND period_key = %s""",
                (identity_id, kind, str(period_key)[:64]),
            )
            if cur.fetchone():
                notif_counts["skip"] += 1
            else:
                notif_counts["new"] += 1
        else:
            notif_counts["new"] += 1

    for h in doc.get("cadence_history") or []:
        if not isinstance(h, dict) or h.get("cadence_days") is None:
            cadence_counts["error"] += 1
            continue
        eff = _parse_date_only(h.get("effective_from"))
        if not eff:
            cadence_counts["error"] += 1
            continue
        cur.execute(
            """SELECT id FROM member_retro_cadence_history
               WHERE identity_id = %s AND cadence_days = %s AND effective_from = %s
               LIMIT 1""",
            (identity_id, int(h["cadence_days"]), eff),
        )
        if cur.fetchone():
            cadence_counts["skip"] += 1
        else:
            cadence_counts["new"] += 1

    return {
        "surface": "retrospective",
        "counts": counts,
        "habit_plans": plan_counts,
        "notifications": notif_counts,
        "cadence_history": cadence_counts,
        "warnings": warnings,
        "errors": errors,
        "mode": "additive",
        "note": (
            "open retros / active plans demoted when target limits would be exceeded"
        ),
    }


def commit_retrospective(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    prev = preview_retrospective(cur, identity_id, doc)
    if prev.get("errors"):
        raise ImportErrorLoud(
            prev["errors"][0],
            status=409,
            extra={"preview": prev},
        )

    status_plan, warnings = _retro_import_status_plan(cur, identity_id, doc)
    habit_status_plan, habit_warnings = _habit_import_status_plan(cur, identity_id, doc)
    warnings.extend(habit_warnings)

    counts = _count_bucket()
    plan_counts = _count_bucket()
    notif_counts = _count_bucket()
    cadence_counts = _count_bucket()
    retro_map: dict[str, int] = {}

    # Map existing keys for habit plan links
    cur.execute(
        """SELECT id, export_key FROM member_retrospectives
           WHERE identity_id = %s AND export_key IS NOT NULL""",
        (identity_id,),
    )
    for row in cur.fetchall():
        if row.get("export_key"):
            retro_map[str(row["export_key"])] = int(row["id"])

    for r in doc.get("retrospectives") or []:
        if not isinstance(r, dict):
            counts["error"] += 1
            continue
        key = _portable_key(
            r.get("id"),
            str(r.get("scope_start") or ""),
            str(r.get("scope_end") or ""),
            str(r.get("title") or ""),
            str(bool(r.get("is_maiden"))),
        )
        cur.execute(
            """SELECT id FROM member_retrospectives
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        row = cur.fetchone()
        if row:
            counts["skip"] += 1
            retro_map[key] = int(row["id"])
            if r.get("id"):
                retro_map[str(r["id"])] = int(row["id"])
            continue

        status = status_plan.get(key) or (r.get("status") or "draft").strip()
        scope_start = _parse_dt(r.get("scope_start")) or _utcnow()
        scope_end = _parse_dt(r.get("scope_end")) or scope_start
        title = (r.get("title") or "")[:255]
        body_md = r.get("body_md") or ""
        is_maiden = 1 if r.get("is_maiden") else 0
        report_json = _json_dumps(r.get("report"))
        comparison_json = _json_dumps(r.get("comparison"))
        agent_json = _json_dumps(r.get("agent"))
        completed_at = _parse_dt(r.get("completed_at"))
        prompt_version_id = r.get("prompt_version_id")
        if prompt_version_id is not None:
            prompt_version_id = str(prompt_version_id)[:64]
        cadence_days = r.get("cadence_days_at_period")
        try:
            cadence_days = int(cadence_days) if cadence_days is not None else None
        except (TypeError, ValueError):
            cadence_days = None
        period_index = r.get("period_index")
        try:
            period_index = int(period_index) if period_index is not None else None
        except (TypeError, ValueError):
            period_index = None
        interrupted = 1 if (r.get("interrupted") or status == "interrupted") else 0

        cur.execute(
            """INSERT INTO member_retrospectives
                 (identity_id, status, is_maiden, scope_start, scope_end,
                  title, body_md, report_json, comparison_json, agent_json,
                  completed_at, export_key, prompt_version_id,
                  cadence_days_at_period, period_index, interrupted)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                status,
                is_maiden,
                scope_start,
                scope_end,
                title,
                body_md,
                report_json,
                comparison_json,
                agent_json,
                completed_at,
                key,
                prompt_version_id,
                cadence_days,
                period_index,
                interrupted,
            ),
        )
        rid = int(cur.lastrowid)
        counts["new"] += 1
        retro_map[key] = rid
        if r.get("id"):
            retro_map[str(r["id"])] = rid

    for p in doc.get("habit_plans") or []:
        if not isinstance(p, dict):
            plan_counts["error"] += 1
            continue
        key = _portable_key(
            p.get("id"),
            str(p.get("title") or ""),
            str(p.get("habit") or ""),
            str(p.get("status") or ""),
        )
        cur.execute(
            """SELECT id FROM member_habit_plans
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            plan_counts["skip"] += 1
            continue

        title = (p.get("title") or "")[:255]
        habit = (p.get("habit") or "")[:512]
        why = p.get("why_process") or ""
        signal = (p.get("observable_signal") or "routine_days")[:64]
        status = habit_status_plan.get(key) or (p.get("status") or "proposed").strip()
        activated_at = _parse_dt(p.get("activated_at"))
        retired_at = _parse_dt(p.get("retired_at"))
        if status == "retired" and retired_at is None:
            retired_at = _utcnow()
        rid_raw = p.get("retrospective_id")
        rid_db = retro_map.get(str(rid_raw)) if rid_raw is not None else None

        cur.execute(
            """INSERT INTO member_habit_plans
                 (identity_id, retrospective_id, title, habit, why_process,
                  observable_signal, status, activated_at, retired_at, export_key)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                rid_db,
                title,
                habit,
                why,
                signal,
                status,
                activated_at,
                retired_at,
                key,
            ),
        )
        plan_counts["new"] += 1

    for n in doc.get("notifications") or []:
        if not isinstance(n, dict):
            notif_counts["error"] += 1
            continue
        kind = (n.get("kind") or "").strip()[:64]
        if not kind:
            notif_counts["error"] += 1
            continue
        period_key = n.get("period_key")
        period_key_s = str(period_key)[:64] if period_key not in (None, "") else None
        if period_key_s:
            cur.execute(
                """SELECT id FROM member_notifications
                   WHERE identity_id = %s AND kind = %s AND period_key = %s""",
                (identity_id, kind, period_key_s),
            )
            if cur.fetchone():
                notif_counts["skip"] += 1
                continue
        title = (n.get("title") or "")[:512]
        body = n.get("body") or ""
        href = (n.get("href") or "")[:1024]
        channel = (n.get("channel") or "in_app")[:16]
        email_status = (n.get("email_status") or "skipped")[:16]
        resource_type = n.get("resource_type")
        resource_id = n.get("resource_id")
        if resource_type is not None:
            resource_type = str(resource_type)[:64]
        if resource_id is not None:
            resource_id = str(resource_id)[:64]
        read_at = _parse_dt(n.get("read_at"))
        created_at = _parse_dt(n.get("created_at"))
        try:
            cur.execute(
                """INSERT INTO member_notifications
                     (identity_id, kind, title, body, href, channel, period_key,
                      resource_type, resource_id, email_status, read_at, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                           COALESCE(%s, CURRENT_TIMESTAMP))""",
                (
                    identity_id,
                    kind,
                    title,
                    body,
                    href,
                    channel,
                    period_key_s,
                    resource_type,
                    resource_id,
                    email_status,
                    read_at,
                    created_at,
                ),
            )
            notif_counts["new"] += 1
        except Exception as exc:
            notif_counts["error"] += 1
            warnings.append(f"notification skip: {exc}")

    for h in doc.get("cadence_history") or []:
        if not isinstance(h, dict) or h.get("cadence_days") is None:
            cadence_counts["error"] += 1
            continue
        try:
            days = int(h["cadence_days"])
        except (TypeError, ValueError):
            cadence_counts["error"] += 1
            continue
        eff = _parse_date_only(h.get("effective_from"))
        if not eff:
            cadence_counts["error"] += 1
            continue
        cur.execute(
            """SELECT id FROM member_retro_cadence_history
               WHERE identity_id = %s AND cadence_days = %s AND effective_from = %s
               LIMIT 1""",
            (identity_id, days, eff),
        )
        if cur.fetchone():
            cadence_counts["skip"] += 1
            continue
        try:
            cur.execute(
                """INSERT INTO member_retro_cadence_history
                     (identity_id, cadence_days, effective_from)
                   VALUES (%s, %s, %s)""",
                (identity_id, days, eff),
            )
            cadence_counts["new"] += 1
        except Exception as exc:
            cadence_counts["error"] += 1
            warnings.append(f"cadence history skip: {exc}")

    return {
        "surface": "retrospective",
        "counts": counts,
        "habit_plans": plan_counts,
        "notifications": notif_counts,
        "cadence_history": cadence_counts,
        "warnings": warnings,
        "mode": "additive",
    }


def preview_journey(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    """Additive: new check-ins only. Privacy prefs never changed by import.

    Process meters / grades are **recalculated** from Practice activity after
    trade_log + journal_session + retrospectives land — they are not restored
    from the journey snapshot in the file. Learning / reputation still depend
    on course progress on this membership (not in the Practice pack).
    """
    counts = _count_bucket()
    checkins = (doc.get("raw_signals") or {}).get("live_checkins") or []
    for c in checkins:
        if not isinstance(c, dict) or not c.get("session_key"):
            counts["error"] += 1
            continue
        cur.execute(
            """SELECT id FROM live_session_checkins
               WHERE identity_id = %s AND session_key = %s""",
            (identity_id, str(c["session_key"])[:96]),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
    snap = doc.get("process") if isinstance(doc.get("process"), dict) else {}
    return {
        "surface": "journey",
        "counts": counts,
        "mode": "additive",
        "note": (
            "check-ins only (new keys). Grades recalculate from imported Practice "
            "(trades, journals, retros, check-ins); snapshot meters in the file "
            "are not written. Learning/reputation use course progress on this "
            "account (not in Practice pack)."
            + (
                f" Export snapshot overall was {snap.get('overall_percent')}%."
                if snap.get("overall_percent") is not None
                else ""
            )
        ),
    }


def commit_journey(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    # Privacy: never overwrite existing prefs (non-destructive)
    for c in (doc.get("raw_signals") or {}).get("live_checkins") or []:
        if not isinstance(c, dict) or not c.get("session_key"):
            counts["error"] += 1
            continue
        sk = str(c["session_key"])[:96]
        cur.execute(
            """SELECT id FROM live_session_checkins
               WHERE identity_id = %s AND session_key = %s""",
            (identity_id, sk),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        starts = _parse_dt(c.get("starts_at")) or _utcnow()
        checked = _parse_dt(c.get("checked_in_at")) or _utcnow()
        cur.execute(
            """INSERT INTO live_session_checkins
                 (identity_id, session_key, starts_at, checked_in_at)
               VALUES (%s, %s, %s, %s)""",
            (identity_id, sk, starts, checked),
        )
        counts["new"] += 1
    return {
        "surface": "journey",
        "counts": counts,
        "mode": "additive",
        "note": (
            "check-ins written; process meters recalculate from Practice activity "
            "(not from snapshot percentages in the file)"
        ),
    }


def preview_trade_log(doc: dict) -> dict[str, Any]:
    import trade_log_io as tio

    text = json.dumps(doc)
    result = tio.parse_native(text)
    trades = result.get("trades") or []
    return {
        "surface": "trade_log",
        "counts": {
            "new": len(trades),
            "skip": 0,
            "error": len(result.get("errors") or []),
        },
        "trade_count": len(trades),
        "warnings": result.get("warnings") or [],
        "errors": result.get("errors") or [],
        "mode": "additive",
        "note": "idempotent insert by external id; existing trades skipped",
    }


def commit_trade_log(cur, identity_id: int, doc: dict, claims: dict) -> dict[str, Any]:
    """Insert-only into default account; skip existing external ids."""
    import trade_log_catalog as cat
    import trade_log_io as tio
    from fastapi import HTTPException
    from routes.trade_log.common import (
        _dec,
        _ensure_default_account,
        _insert_legs,
        _maybe_set_account_venue,
        _normalize_entry_source,
        _parse_exec_at,
    )

    text = json.dumps(doc, default=str)
    result = tio.parse_native(text)
    if result.get("errors"):
        raise ImportErrorLoud(
            "trade log parse failed",
            extra={"errors": result["errors"]},
        )
    trades = result.get("trades") or []
    adapter_id = "native"
    acct = _ensure_default_account(cur, identity_id)
    account_id = int(acct["id"])
    venue = cat.ADAPTER_DEFAULT_VENUE.get(adapter_id) or "fattail"
    _maybe_set_account_venue(
        cur, identity_id, account_id, broker=venue, only_if_unset=True
    )
    created = 0
    skipped = 0
    errors = 0
    error_samples: list[str] = []
    for t in trades:
        ext = t.get("external_order_id") or t.get("id") or None
        if ext:
            ext = str(ext)[:128]
            cur.execute(
                """SELECT id FROM member_trade_log_trades
                   WHERE identity_id = %s AND account_id = %s
                     AND external_adapter = %s AND external_order_id = %s""",
                (identity_id, account_id, adapter_id, ext),
            )
            if cur.fetchone():
                skipped += 1
                continue
        process = t.get("process") if isinstance(t.get("process"), dict) else {}
        adherence = process.get("adherence") or t.get("adherence") or "unknown"
        if adherence not in cat.ADHERENCE:
            adherence = "unknown"
        strategy = t.get("strategy") or "CUSTOM"
        if strategy not in cat.STRATEGY_CODES:
            strategy = "CUSTOM"
        net_side = t.get("net_side")
        if net_side and net_side not in cat.NET_SIDES:
            net_side = None
        pnl = process.get("pnl_amount")
        if pnl is None:
            pnl = t.get("pnl_amount")
        exec_at = _parse_exec_at(t.get("exec_at"))
        asset_class = (t.get("asset_class") or "equity_option").lower()
        if asset_class not in cat.ASSET_CLASSES:
            asset_class = "equity_option"
        entry_source = _normalize_entry_source(
            t.get("entry_source") or "import", default="import"
        )
        tid: int | None = None
        try:
            cur.execute(
                """INSERT INTO member_trade_log_trades
                     (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                      net_price, net_side, setup_md, plan_md, rules_md, adherence,
                      deviation_md, lesson_md, pnl_amount, external_adapter,
                      external_order_id, entry_source)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    identity_id,
                    account_id,
                    exec_at,
                    asset_class,
                    strategy,
                    (t.get("order_type") or "LMT")[:32],
                    _dec(t.get("net_price")),
                    net_side,
                    process.get("setup_md") or t.get("setup_md") or "",
                    process.get("plan_md") or t.get("plan_md") or "",
                    process.get("rules_md") or t.get("rules_md") or "",
                    adherence,
                    process.get("deviation_md") or t.get("deviation_md") or "",
                    process.get("lesson_md") or t.get("lesson_md") or "",
                    pnl,
                    adapter_id,
                    ext,
                    entry_source,
                ),
            )
            tid = int(cur.lastrowid)
            _insert_legs(cur, tid, identity_id, account_id, t.get("legs") or [])
            created += 1
        except HTTPException as exc:
            if tid is not None:
                cur.execute(
                    "DELETE FROM member_trade_log_legs WHERE trade_id = %s", (tid,)
                )
                cur.execute(
                    "DELETE FROM member_trade_log_trades WHERE id = %s", (tid,)
                )
            errors += 1
            detail = getattr(exc, "detail", str(exc))
            if len(error_samples) < 8:
                error_samples.append(f"trade {ext or '?'}: {detail}")
        except Exception as exc:
            if tid is not None:
                try:
                    cur.execute(
                        "DELETE FROM member_trade_log_legs WHERE trade_id = %s",
                        (tid,),
                    )
                    cur.execute(
                        "DELETE FROM member_trade_log_trades WHERE id = %s", (tid,)
                    )
                except Exception:
                    pass
            errors += 1
            if len(error_samples) < 8:
                error_samples.append(f"trade {ext or '?'}: {exc}")
    if errors and created == 0 and skipped == 0:
        raise ImportErrorLoud(
            "trade log import failed for all trades",
            extra={"errors": error_samples, "error_count": errors},
        )
    out: dict[str, Any] = {
        "surface": "trade_log",
        "counts": {"new": created, "skip": skipped, "error": errors},
        "account_id": account_id,
        "mode": "additive",
    }
    if error_samples:
        out["errors"] = error_samples
    return out


def preview_all(cur, identity_id: int, docs: dict[str, dict], policy: str) -> dict[str, Any]:
    _normalize_policy(policy)
    surfaces: dict[str, Any] = {}
    errors: list[str] = []
    warnings: list[str] = []
    if "trade_log" in docs:
        surfaces["trade_log"] = preview_trade_log(docs["trade_log"])
        errors.extend(surfaces["trade_log"].get("errors") or [])
    if "journal" in docs:
        surfaces["journal"] = preview_journal(cur, identity_id, docs["journal"])
    if "journal_session" in docs:
        surfaces["journal_session"] = preview_journal_session(
            cur, identity_id, docs["journal_session"]
        )
        warnings.extend(surfaces["journal_session"].get("warnings") or [])
    if "retrospective" in docs:
        surfaces["retrospective"] = preview_retrospective(
            cur, identity_id, docs["retrospective"]
        )
        errors.extend(surfaces["retrospective"].get("errors") or [])
        warnings.extend(surfaces["retrospective"].get("warnings") or [])
    if "journey" in docs:
        surfaces["journey"] = preview_journey(cur, identity_id, docs["journey"])
    if "playbook" in docs:
        surfaces["playbook"] = preview_playbook(cur, identity_id, docs["playbook"])
        warnings.extend(surfaces["playbook"].get("warnings") or [])
    return {
        "policy": "additive",
        "mode": "additive",
        "surfaces": surfaces,
        "errors": errors,
        "warnings": warnings,
        "ok": len(errors) == 0,
        "note": "non-destructive: existing rows are never updated or deleted",
    }


# Phrase required in body for intentional Practice wipe (membership retained).
PURGE_CONFIRM = "DELETE_PRACTICE_DATA"


def purge_practice_data(cur, identity_id: int) -> dict[str, int]:
    """Delete authored Practice surfaces; keep identity, memberships, course progress.

    Non-membership data removed:
    - habit plans, retrospectives
    - member_notifications (R7), member_retro_cadence_history (R6)
    - trade log legs / trades / accounts (+ legacy entries if present)
    - tool notes (journal / playbook / trade_log probe notes)
    - live session check-ins (journey attendance signal)
    - journal sessions / media / tag assignments

    Preserved: identities (incl. retro_cadence_days setting), memberships,
    enrollments, lesson_progress, certificates, analytics consent,
    journey_visible / share prefs, credentials, SSO links.
    """
    counts: dict[str, int] = {}

    def _del(label: str, sql: str, args: tuple = ()) -> None:
        cur.execute(sql, args if args else (identity_id,))
        counts[label] = int(cur.rowcount or 0)

    # Order respects FKs
    # Tag assignments on member-owned objects (platform vocabulary retained)
    try:
        import tag_domain as tdom

        counts["tag_assignments"] = tdom.purge_assignments_for_identity(
            cur, identity_id
        )
    except Exception:
        counts["tag_assignments"] = 0
    # R7 — in-app material notifications (Export Spec v1.3)
    try:
        import member_notify as mn

        counts["member_notifications"] = mn.purge_for_identity(cur, identity_id)
    except Exception:
        _del(
            "member_notifications",
            "DELETE FROM member_notifications WHERE identity_id = %s",
        )
    # R6 — cadence history (identity.retro_cadence_days setting is preserved)
    _del(
        "retro_cadence_history",
        "DELETE FROM member_retro_cadence_history WHERE identity_id = %s",
    )
    # Journal sessions (J1+) — media binaries then rows
    try:
        import journal_session_media as jsm

        counts["journal_media_files"] = jsm.purge_media_for_identity(cur, identity_id)
    except Exception:
        counts["journal_media_files"] = 0
    _del(
        "journal_attachments",
        "DELETE FROM member_journal_attachments WHERE identity_id = %s",
    )
    _del(
        "journal_messages",
        "DELETE FROM member_journal_messages WHERE identity_id = %s",
    )
    _del(
        "journal_sessions",
        "DELETE FROM member_journal_sessions WHERE identity_id = %s",
    )
    _del(
        "journal_date_closures",
        "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
    )
    _del(
        "habit_plans",
        "DELETE FROM member_habit_plans WHERE identity_id = %s",
    )
    _del(
        "retrospectives",
        "DELETE FROM member_retrospectives WHERE identity_id = %s",
    )
    _del(
        "trade_log_legs",
        "DELETE FROM member_trade_log_legs WHERE identity_id = %s",
    )
    _del(
        "trade_log_trades",
        "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
    )
    _del(
        "trade_log_accounts",
        "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
    )
    try:
        _del(
            "trade_log_entries_legacy",
            "DELETE FROM member_trade_log_entries WHERE identity_id = %s",
        )
    except Exception:
        counts["trade_log_entries_legacy"] = 0
    _del(
        "tool_notes",
        "DELETE FROM member_tool_notes WHERE identity_id = %s",
    )
    _del(
        "live_checkins",
        "DELETE FROM live_session_checkins WHERE identity_id = %s",
    )
    return counts


def commit_all(
    cur,
    identity_id: int,
    docs: dict[str, dict],
    policy: str,
    *,
    claims: dict,
) -> dict[str, Any]:
    _normalize_policy(policy)
    prev = preview_all(cur, identity_id, docs, "additive")
    if not prev["ok"]:
        raise ImportErrorLoud(
            prev["errors"][0] if prev["errors"] else "preview failed",
            status=409,
            extra={"preview": prev},
        )
    results: dict[str, Any] = {}
    if "trade_log" in docs:
        results["trade_log"] = commit_trade_log(cur, identity_id, docs["trade_log"], claims)
    if "journal" in docs:
        results["journal"] = commit_journal(cur, identity_id, docs["journal"])
    if "journal_session" in docs:
        results["journal_session"] = commit_journal_session(
            cur, identity_id, docs["journal_session"]
        )
    if "retrospective" in docs:
        results["retrospective"] = commit_retrospective(
            cur, identity_id, docs["retrospective"]
        )
    if "journey" in docs:
        results["journey"] = commit_journey(cur, identity_id, docs["journey"])
    if "playbook" in docs:
        results["playbook"] = commit_playbook(cur, identity_id, docs["playbook"])
    return {"policy": "additive", "mode": "additive", "results": results}
