"""Playbook Scrapbook — Spec v1.1a · DL-255.

Book root = member_playbook_entries. Chapters/pages/versions/archive/evidence.
Family B. Permanence OD-PB-7.
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import get_config
from practice_spine_domain import PracticeSpineError, _export_key, _iso, _json_loads


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _version_count(cur, identity_id: int, book_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_playbook_versions
           WHERE playbook_entry_id = %s AND identity_id = %s""",
        (book_id, identity_id),
    )
    row = cur.fetchone()
    return int(row["n"] or 0) if row else 0


def _latest_version_n(cur, identity_id: int, book_id: int) -> int | None:
    cur.execute(
        """SELECT version_n FROM member_playbook_versions
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY version_n DESC LIMIT 1""",
        (book_id, identity_id),
    )
    row = cur.fetchone()
    return int(row["version_n"]) if row else None


def _assert_book(cur, identity_id: int, book_id: int) -> dict:
    cur.execute(
        """SELECT * FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (book_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Playbook book not found")
    return row


def serialize_book_meta(cur, row: dict) -> dict:
    bid = int(row["id"])
    iid = int(row["identity_id"])
    vc = _version_count(cur, iid, bid)
    # snippet: prefer body_md column if set else first page
    snippet = (row.get("body_md") or "").strip()
    if not snippet:
        cur.execute(
            """SELECT body_md FROM member_playbook_pages
               WHERE playbook_entry_id = %s AND identity_id = %s
               ORDER BY sort_order ASC, id ASC LIMIT 1""",
            (bid, iid),
        )
        p = cur.fetchone()
        if p:
            snippet = (p.get("body_md") or "")[:280]
    return {
        "id": bid,
        "title": row.get("title") or "",
        "subtitle": row.get("subtitle") or "",
        "body_md": snippet,  # derived/list snippet only
        "structured": _json_loads(row.get("structured_json")) or {},
        "status": row.get("status") or "active",
        "cover_attachment_id": (
            int(row["cover_attachment_id"])
            if row.get("cover_attachment_id") is not None
            else None
        ),
        "export_key": row.get("export_key"),
        "version_count": vc,
        "is_draft": vc == 0,
        "latest_version_n": _latest_version_n(cur, iid, bid),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def ensure_book_pages_migrated(cur, identity_id: int, book_id: int) -> None:
    """One-time: flat body_md → Main chapter + page; seed version 1 if content."""
    row = _assert_book(cur, identity_id, book_id)
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_playbook_chapters
           WHERE playbook_entry_id = %s AND identity_id = %s""",
        (book_id, identity_id),
    )
    if int((cur.fetchone() or {}).get("n") or 0) > 0:
        return
    body = (row.get("body_md") or "").strip()
    if not body and not (row.get("title") or "").strip():
        return
    # Create Main chapter + page
    ck = _export_key("pbc")
    cur.execute(
        """INSERT INTO member_playbook_chapters
             (playbook_entry_id, identity_id, title, blurb, sort_order,
              chapter_type, export_key)
           VALUES (%s, %s, 'Main', NULL, 0, 'chapter', %s)""",
        (book_id, identity_id, ck),
    )
    cid = int(cur.lastrowid)
    pk = _export_key("pbp")
    cur.execute(
        """INSERT INTO member_playbook_pages
             (chapter_id, playbook_entry_id, identity_id, title, body_md,
              sort_order, export_key)
           VALUES (%s, %s, %s, NULL, %s, 0, %s)""",
        (cid, book_id, identity_id, body or "", pk),
    )
    # Derived snippet on book
    snippet = (body or "")[:500]
    cur.execute(
        """UPDATE member_playbook_entries SET body_md = %s
           WHERE id = %s AND identity_id = %s""",
        (snippet, book_id, identity_id),
    )
    # Version 1 seed if contentful (OD-PB-7 / F1)
    if body:
        save_version(cur, identity_id, book_id, system_seed=True)


def load_tree(cur, identity_id: int, book_id: int) -> dict:
    ensure_book_pages_migrated(cur, identity_id, book_id)
    row = _assert_book(cur, identity_id, book_id)
    meta = serialize_book_meta(cur, row)
    cur.execute(
        """SELECT * FROM member_playbook_chapters
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY sort_order ASC, id ASC""",
        (book_id, identity_id),
    )
    chapters = []
    for ch in cur.fetchall() or []:
        cid = int(ch["id"])
        cur.execute(
            """SELECT * FROM member_playbook_pages
               WHERE chapter_id = %s AND identity_id = %s
               ORDER BY sort_order ASC, id ASC""",
            (cid, identity_id),
        )
        pages = []
        for p in cur.fetchall() or []:
            pid = int(p["id"])
            cur.execute(
                """SELECT * FROM member_playbook_stickies
                   WHERE page_id = %s AND identity_id = %s
                   ORDER BY sort_order ASC, id ASC""",
                (pid, identity_id),
            )
            stickies = [
                {
                    "id": int(s["id"]),
                    "page_id": pid,
                    "body_md": s.get("body_md") or "",
                    "sort_order": int(s.get("sort_order") or 0),
                    "export_key": s.get("export_key"),
                }
                for s in cur.fetchall() or []
            ]
            pages.append(
                {
                    "id": pid,
                    "chapter_id": cid,
                    "title": p.get("title"),
                    "body_md": p.get("body_md") or "",
                    "sort_order": int(p.get("sort_order") or 0),
                    "export_key": p.get("export_key"),
                    "stickies": stickies,
                    "updated_at": _iso(p.get("updated_at")),
                }
            )
        chapters.append(
            {
                "id": cid,
                "title": ch.get("title") or "",
                "blurb": ch.get("blurb"),
                "sort_order": int(ch.get("sort_order") or 0),
                "chapter_type": ch.get("chapter_type") or "chapter",
                "export_key": ch.get("export_key"),
                "pages": pages,
            }
        )
    meta["chapters"] = chapters
    return meta


def create_book(
    cur,
    identity_id: int,
    *,
    title: str,
    subtitle: str = "",
    structured: dict | None = None,
    body_md: str = "",
) -> dict:
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "title is required")
    sj = json.dumps(structured) if isinstance(structured, dict) and structured else None
    key = _export_key("pb")
    cur.execute(
        """INSERT INTO member_playbook_entries
             (identity_id, title, subtitle, body_md, structured_json, status, export_key)
           VALUES (%s, %s, %s, %s, %s, 'active', %s)""",
        (identity_id, title[:255], (subtitle or "")[:500] or None, "", sj, key),
    )
    bid = int(cur.lastrowid)
    # Always start with Main chapter + page (draft until Save)
    ck = _export_key("pbc")
    cur.execute(
        """INSERT INTO member_playbook_chapters
             (playbook_entry_id, identity_id, title, blurb, sort_order, chapter_type, export_key)
           VALUES (%s, %s, 'Main', NULL, 0, 'chapter', %s)""",
        (bid, identity_id, ck),
    )
    cid = int(cur.lastrowid)
    pk = _export_key("pbp")
    cur.execute(
        """INSERT INTO member_playbook_pages
             (chapter_id, playbook_entry_id, identity_id, title, body_md, sort_order, export_key)
           VALUES (%s, %s, %s, NULL, %s, 0, %s)""",
        (cid, bid, identity_id, body_md or "", pk),
    )
    _refresh_snippet(cur, identity_id, bid)
    return load_tree(cur, identity_id, bid)


def patch_book(
    cur,
    identity_id: int,
    book_id: int,
    *,
    title: str | None = None,
    subtitle: str | None = ...,
    status: str | None = None,
    structured: dict | None = None,
    cover_attachment_id: Any = ...,
) -> dict:
    row = _assert_book(cur, identity_id, book_id)
    new_title = row["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "title is required")
    new_sub = row.get("subtitle") if subtitle is ... else (
        (subtitle or "").strip()[:500] or None
    )
    new_status = row["status"] if status is None else status.strip().lower()
    if new_status not in ("active", "archived"):
        raise PracticeSpineError(422, "status must be active|archived")
    if structured is None:
        sj = row.get("structured_json")
    else:
        sj = json.dumps(structured) if structured else None
    if cover_attachment_id is ...:
        cov = row.get("cover_attachment_id")
    elif cover_attachment_id in (None, ""):
        cov = None
    else:
        cov = int(cover_attachment_id)
        _assert_attachment(cur, identity_id, book_id, cov)
    cur.execute(
        """UPDATE member_playbook_entries
           SET title = %s, subtitle = %s, status = %s, structured_json = %s,
               cover_attachment_id = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title[:255], new_sub, new_status, sj, cov, book_id, identity_id),
    )
    return load_tree(cur, identity_id, book_id)


def _refresh_snippet(cur, identity_id: int, book_id: int) -> None:
    cur.execute(
        """SELECT body_md FROM member_playbook_pages
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY sort_order ASC, id ASC LIMIT 1""",
        (book_id, identity_id),
    )
    p = cur.fetchone()
    snip = ((p.get("body_md") if p else "") or "")[:500]
    cur.execute(
        """UPDATE member_playbook_entries SET body_md = %s
           WHERE id = %s AND identity_id = %s""",
        (snip, book_id, identity_id),
    )


# ── Chapters / pages ────────────────────────────────────────────────────────


def create_chapter(
    cur, identity_id: int, book_id: int, *, title: str, blurb: str | None = None
) -> dict:
    _assert_book(cur, identity_id, book_id)
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "chapter title is required")
    cur.execute(
        """SELECT COALESCE(MAX(sort_order), -1) AS m FROM member_playbook_chapters
           WHERE playbook_entry_id = %s""",
        (book_id,),
    )
    so = int((cur.fetchone() or {}).get("m") or -1) + 1
    ck = _export_key("pbc")
    cur.execute(
        """INSERT INTO member_playbook_chapters
             (playbook_entry_id, identity_id, title, blurb, sort_order, chapter_type, export_key)
           VALUES (%s, %s, %s, %s, %s, 'chapter', %s)""",
        (book_id, identity_id, title[:255], (blurb or None), so, ck),
    )
    cid = int(cur.lastrowid)
    # empty page
    pk = _export_key("pbp")
    cur.execute(
        """INSERT INTO member_playbook_pages
             (chapter_id, playbook_entry_id, identity_id, title, body_md, sort_order, export_key)
           VALUES (%s, %s, %s, NULL, '', 0, %s)""",
        (cid, book_id, identity_id, pk),
    )
    return load_tree(cur, identity_id, book_id)


def patch_chapter(
    cur,
    identity_id: int,
    chapter_id: int,
    *,
    title: str | None = None,
    blurb: Any = ...,
    sort_order: int | None = None,
) -> dict:
    cur.execute(
        """SELECT * FROM member_playbook_chapters
           WHERE id = %s AND identity_id = %s""",
        (chapter_id, identity_id),
    )
    ch = cur.fetchone()
    if not ch:
        raise PracticeSpineError(404, "Chapter not found")
    book_id = int(ch["playbook_entry_id"])
    new_title = ch["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "chapter title is required")
    new_blurb = ch.get("blurb") if blurb is ... else (
        (blurb or "").strip()[:500] or None
    )
    so = int(ch["sort_order"]) if sort_order is None else int(sort_order)
    cur.execute(
        """UPDATE member_playbook_chapters
           SET title = %s, blurb = %s, sort_order = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title[:255], new_blurb, so, chapter_id, identity_id),
    )
    return load_tree(cur, identity_id, book_id)


def delete_chapter(cur, identity_id: int, chapter_id: int) -> dict:
    cur.execute(
        """SELECT playbook_entry_id FROM member_playbook_chapters
           WHERE id = %s AND identity_id = %s""",
        (chapter_id, identity_id),
    )
    ch = cur.fetchone()
    if not ch:
        raise PracticeSpineError(404, "Chapter not found")
    book_id = int(ch["playbook_entry_id"])
    cur.execute(
        """DELETE FROM member_playbook_chapters
           WHERE id = %s AND identity_id = %s""",
        (chapter_id, identity_id),
    )
    _refresh_snippet(cur, identity_id, book_id)
    return load_tree(cur, identity_id, book_id)


def create_page(
    cur,
    identity_id: int,
    chapter_id: int,
    *,
    title: str | None = None,
    body_md: str = "",
) -> dict:
    cur.execute(
        """SELECT * FROM member_playbook_chapters
           WHERE id = %s AND identity_id = %s""",
        (chapter_id, identity_id),
    )
    ch = cur.fetchone()
    if not ch:
        raise PracticeSpineError(404, "Chapter not found")
    book_id = int(ch["playbook_entry_id"])
    cur.execute(
        """SELECT COALESCE(MAX(sort_order), -1) AS m FROM member_playbook_pages
           WHERE chapter_id = %s""",
        (chapter_id,),
    )
    so = int((cur.fetchone() or {}).get("m") or -1) + 1
    pk = _export_key("pbp")
    cur.execute(
        """INSERT INTO member_playbook_pages
             (chapter_id, playbook_entry_id, identity_id, title, body_md, sort_order, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            chapter_id,
            book_id,
            identity_id,
            (title or None),
            body_md or "",
            so,
            pk,
        ),
    )
    _refresh_snippet(cur, identity_id, book_id)
    return load_tree(cur, identity_id, book_id)


def patch_page(
    cur,
    identity_id: int,
    page_id: int,
    *,
    title: Any = ...,
    body_md: str | None = None,
    sort_order: int | None = None,
) -> dict:
    cur.execute(
        """SELECT * FROM member_playbook_pages
           WHERE id = %s AND identity_id = %s""",
        (page_id, identity_id),
    )
    p = cur.fetchone()
    if not p:
        raise PracticeSpineError(404, "Page not found")
    book_id = int(p["playbook_entry_id"])
    # consistency
    cur.execute(
        """SELECT playbook_entry_id FROM member_playbook_chapters
           WHERE id = %s AND identity_id = %s""",
        (int(p["chapter_id"]), identity_id),
    )
    ch = cur.fetchone()
    if not ch or int(ch["playbook_entry_id"]) != book_id:
        raise PracticeSpineError(422, "page/chapter book mismatch")
    new_title = p.get("title") if title is ... else (title or None)
    new_body = p.get("body_md") if body_md is None else body_md
    so = int(p["sort_order"]) if sort_order is None else int(sort_order)
    cur.execute(
        """UPDATE member_playbook_pages
           SET title = %s, body_md = %s, sort_order = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title, new_body or "", so, page_id, identity_id),
    )
    _refresh_snippet(cur, identity_id, book_id)
    return load_tree(cur, identity_id, book_id)


def delete_page(cur, identity_id: int, page_id: int) -> dict:
    cur.execute(
        """SELECT playbook_entry_id, chapter_id FROM member_playbook_pages
           WHERE id = %s AND identity_id = %s""",
        (page_id, identity_id),
    )
    p = cur.fetchone()
    if not p:
        raise PracticeSpineError(404, "Page not found")
    book_id = int(p["playbook_entry_id"])
    cur.execute(
        """DELETE FROM member_playbook_pages WHERE id = %s AND identity_id = %s""",
        (page_id, identity_id),
    )
    _refresh_snippet(cur, identity_id, book_id)
    return load_tree(cur, identity_id, book_id)


# ── Versions ────────────────────────────────────────────────────────────────


def _snapshot_tree(cur, identity_id: int, book_id: int) -> dict:
    return load_tree(cur, identity_id, book_id)


def save_version(
    cur, identity_id: int, book_id: int, *, system_seed: bool = False
) -> dict:
    _assert_book(cur, identity_id, book_id)
    tree = _snapshot_tree(cur, identity_id, book_id)
    last = _latest_version_n(cur, identity_id, book_id) or 0
    n = last + 1
    cur.execute(
        """INSERT INTO member_playbook_versions
             (playbook_entry_id, identity_id, version_n, snapshot_json)
           VALUES (%s, %s, %s, %s)""",
        (book_id, identity_id, n, json.dumps(tree, default=str)),
    )
    # retention
    _apply_retention(cur, identity_id, book_id)
    return {
        "version_n": n,
        "book": load_tree(cur, identity_id, book_id),
        "system_seed": system_seed,
    }


def _apply_retention(cur, identity_id: int, book_id: int) -> None:
    try:
        cap = int(get_config().playbook_version_retention_count)
    except Exception:
        cap = 50
    if cap < 1:
        cap = 1
    cur.execute(
        """SELECT id, version_n FROM member_playbook_versions
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY version_n ASC""",
        (book_id, identity_id),
    )
    rows = list(cur.fetchall() or [])
    # always keep ≥1 and keep latest
    while len(rows) > cap and len(rows) > 1:
        victim = rows.pop(0)
        # never delete if only one left
        if not rows:
            break
        cur.execute(
            """DELETE FROM member_playbook_versions
               WHERE id = %s AND identity_id = %s""",
            (int(victim["id"]), identity_id),
        )


def list_versions(cur, identity_id: int, book_id: int) -> list[dict]:
    _assert_book(cur, identity_id, book_id)
    cur.execute(
        """SELECT version_n, created_at FROM member_playbook_versions
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY version_n DESC""",
        (book_id, identity_id),
    )
    return [
        {"version_n": int(r["version_n"]), "created_at": _iso(r.get("created_at"))}
        for r in cur.fetchall() or []
    ]


def restore_version(cur, identity_id: int, book_id: int, version_n: int) -> dict:
    _assert_book(cur, identity_id, book_id)
    cur.execute(
        """SELECT snapshot_json FROM member_playbook_versions
           WHERE playbook_entry_id = %s AND identity_id = %s AND version_n = %s""",
        (book_id, identity_id, version_n),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Version not found")
    snap = row["snapshot_json"]
    if isinstance(snap, str):
        snap = json.loads(snap)
    if not isinstance(snap, dict):
        raise PracticeSpineError(500, "Corrupt version snapshot")
    # wipe structure and re-materialize
    cur.execute(
        """DELETE FROM member_playbook_chapters
           WHERE playbook_entry_id = %s AND identity_id = %s""",
        (book_id, identity_id),
    )
    # update book meta
    cur.execute(
        """UPDATE member_playbook_entries
           SET title = %s, subtitle = %s, cover_attachment_id = %s
           WHERE id = %s AND identity_id = %s""",
        (
            (snap.get("title") or "")[:255],
            (snap.get("subtitle") or None),
            snap.get("cover_attachment_id"),
            book_id,
            identity_id,
        ),
    )
    # clear purged_at on attachments referenced
    att_ids: set[int] = set()
    if snap.get("cover_attachment_id"):
        att_ids.add(int(snap["cover_attachment_id"]))
    for ch in snap.get("chapters") or []:
        ck = _export_key("pbc")
        cur.execute(
            """INSERT INTO member_playbook_chapters
                 (playbook_entry_id, identity_id, title, blurb, sort_order, chapter_type, export_key)
               VALUES (%s, %s, %s, %s, %s, 'chapter', %s)""",
            (
                book_id,
                identity_id,
                (ch.get("title") or "Chapter")[:255],
                ch.get("blurb"),
                int(ch.get("sort_order") or 0),
                ch.get("export_key") or ck,
            ),
        )
        cid = int(cur.lastrowid)
        for p in ch.get("pages") or []:
            pk = _export_key("pbp")
            cur.execute(
                """INSERT INTO member_playbook_pages
                     (chapter_id, playbook_entry_id, identity_id, title, body_md, sort_order, export_key)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    cid,
                    book_id,
                    identity_id,
                    p.get("title"),
                    p.get("body_md") or "",
                    int(p.get("sort_order") or 0),
                    p.get("export_key") or pk,
                ),
            )
            pid = int(cur.lastrowid)
            for s in p.get("stickies") or []:
                sk = _export_key("pbs")
                cur.execute(
                    """INSERT INTO member_playbook_stickies
                         (page_id, playbook_entry_id, identity_id, body_md, sort_order, export_key)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        pid,
                        book_id,
                        identity_id,
                        (s.get("body_md") or "")[:500],
                        int(s.get("sort_order") or 0),
                        s.get("export_key") or sk,
                    ),
                )
    if att_ids:
        placeholders = ",".join(["%s"] * len(att_ids))
        cur.execute(
            f"""UPDATE member_playbook_attachments SET purged_at = NULL
                WHERE identity_id = %s AND playbook_entry_id = %s
                  AND id IN ({placeholders})""",
            (identity_id, book_id, *att_ids),
        )
    _refresh_snippet(cur, identity_id, book_id)
    return load_tree(cur, identity_id, book_id)


def discard(cur, identity_id: int, book_id: int) -> dict:
    """Permanent: revert to latest snapshot. Draft: hard-delete book."""
    _assert_book(cur, identity_id, book_id)
    vc = _version_count(cur, identity_id, book_id)
    if vc == 0:
        cur.execute(
            """DELETE FROM member_playbook_entries
               WHERE id = %s AND identity_id = %s""",
            (book_id, identity_id),
        )
        return {"deleted": True, "book_id": book_id}
    last = _latest_version_n(cur, identity_id, book_id)
    assert last is not None
    tree = restore_version(cur, identity_id, book_id, last)
    return {"deleted": False, "book": tree}


def delete_book_if_draft(cur, identity_id: int, book_id: int) -> None:
    _assert_book(cur, identity_id, book_id)
    if _version_count(cur, identity_id, book_id) > 0:
        raise PracticeSpineError(
            409,
            "Once-saved books cannot be deleted — archive instead",
        )
    cur.execute(
        """DELETE FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (book_id, identity_id),
    )


# ── Evidence ────────────────────────────────────────────────────────────────


def list_evidence(cur, identity_id: int, book_id: int) -> list[dict]:
    _assert_book(cur, identity_id, book_id)
    cur.execute(
        """SELECT * FROM member_playbook_evidence
           WHERE playbook_entry_id = %s AND identity_id = %s
           ORDER BY created_at DESC, id DESC""",
        (book_id, identity_id),
    )
    out = []
    for r in cur.fetchall() or []:
        ot = r["object_type"]
        oid = int(r["object_id"])
        target: dict[str, Any] = {"status": "missing"}
        if ot == "journal_session":
            cur.execute(
                """SELECT id, journal_date, tag, status, export_key
                   FROM member_journal_sessions
                   WHERE id = %s AND identity_id = %s""",
                (oid, identity_id),
            )
            js = cur.fetchone()
            if js:
                target = {
                    "status": js.get("status") or "open",
                    "journal_date": str(js.get("journal_date") or "")[:10],
                    "tag": js.get("tag"),
                    "export_key": js.get("export_key"),
                }
        out.append(
            {
                "id": int(r["id"]),
                "object_type": ot,
                "object_id": oid,
                "note_md": r.get("note_md"),
                "export_key": r.get("export_key"),
                "created_at": _iso(r.get("created_at")),
                "target": target,
            }
        )
    return out


def add_evidence(
    cur,
    identity_id: int,
    book_id: int,
    *,
    object_type: str,
    object_id: int,
    note_md: str | None = None,
) -> dict:
    _assert_book(cur, identity_id, book_id)
    ot = (object_type or "").strip()
    if ot not in ("journal_session", "trade"):
        raise PracticeSpineError(422, "object_type must be journal_session|trade")
    oid = int(object_id)
    if ot == "journal_session":
        cur.execute(
            """SELECT id FROM member_journal_sessions
               WHERE id = %s AND identity_id = %s""",
            (oid, identity_id),
        )
        if not cur.fetchone():
            raise PracticeSpineError(404, "Journal session not found")
    elif ot == "trade":
        cur.execute(
            """SELECT id FROM member_trade_log_trades
               WHERE id = %s AND identity_id = %s""",
            (oid, identity_id),
        )
        if not cur.fetchone():
            raise PracticeSpineError(404, "Trade not found")
    ek = _export_key("pbe")
    try:
        cur.execute(
            """INSERT INTO member_playbook_evidence
                 (playbook_entry_id, identity_id, object_type, object_id, note_md, export_key)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (book_id, identity_id, ot, oid, note_md, ek),
        )
    except Exception as exc:
        raise PracticeSpineError(409, "Evidence already stapled") from exc
    return {"evidence": list_evidence(cur, identity_id, book_id)}


def remove_evidence(cur, identity_id: int, book_id: int, evidence_id: int) -> dict:
    _assert_book(cur, identity_id, book_id)
    cur.execute(
        """DELETE FROM member_playbook_evidence
           WHERE id = %s AND playbook_entry_id = %s AND identity_id = %s""",
        (evidence_id, book_id, identity_id),
    )
    if cur.rowcount == 0:
        raise PracticeSpineError(404, "Evidence not found")
    return {"evidence": list_evidence(cur, identity_id, book_id)}


def list_playbooks_for_journal_session(
    cur, identity_id: int, session_id: int
) -> list[dict]:
    """Books linked as evidence for this journal session (journal-side association)."""
    cur.execute(
        """SELECT id FROM member_journal_sessions
           WHERE id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Journal session not found")
    cur.execute(
        """SELECT e.id AS evidence_id, p.id AS playbook_entry_id, p.title, p.status
           FROM member_playbook_evidence e
           JOIN member_playbook_entries p
             ON p.id = e.playbook_entry_id AND p.identity_id = e.identity_id
           WHERE e.identity_id = %s
             AND e.object_type = 'journal_session'
             AND e.object_id = %s
           ORDER BY p.title ASC, e.id ASC""",
        (identity_id, session_id),
    )
    return [
        {
            "evidence_id": int(r["evidence_id"]),
            "playbook_entry_id": int(r["playbook_entry_id"]),
            "title": r.get("title") or "",
            "status": r.get("status") or "active",
        }
        for r in cur.fetchall() or []
    ]


def set_journal_playbook_link(
    cur,
    identity_id: int,
    session_id: int,
    playbook_entry_id: int,
    *,
    linked: bool,
) -> list[dict]:
    """Link or unlink a journal session to a playbook (from journal UI)."""
    cur.execute(
        """SELECT id FROM member_journal_sessions
           WHERE id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Journal session not found")
    _assert_book(cur, identity_id, playbook_entry_id)
    cur.execute(
        """SELECT id FROM member_playbook_evidence
           WHERE identity_id = %s AND playbook_entry_id = %s
             AND object_type = 'journal_session' AND object_id = %s""",
        (identity_id, playbook_entry_id, session_id),
    )
    existing = cur.fetchone()
    if linked:
        if not existing:
            add_evidence(
                cur,
                identity_id,
                playbook_entry_id,
                object_type="journal_session",
                object_id=session_id,
            )
    elif existing:
        cur.execute(
            """DELETE FROM member_playbook_evidence
               WHERE identity_id = %s AND playbook_entry_id = %s
                 AND object_type = 'journal_session' AND object_id = %s""",
            (identity_id, playbook_entry_id, session_id),
        )
    return list_playbooks_for_journal_session(cur, identity_id, session_id)


# ── Archive ─────────────────────────────────────────────────────────────────


def media_root() -> Path:
    cfg = get_config()
    raw = (cfg.playbook_media_dir or "").strip()
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent / "var" / "playbook_media"


def _assert_attachment(cur, identity_id: int, book_id: int, att_id: int) -> dict:
    cur.execute(
        """SELECT * FROM member_playbook_attachments
           WHERE id = %s AND playbook_entry_id = %s AND identity_id = %s""",
        (att_id, book_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Attachment not found")
    return row


def list_archive(cur, identity_id: int, book_id: int, *, include_purged: bool = False) -> list[dict]:
    _assert_book(cur, identity_id, book_id)
    if include_purged:
        cur.execute(
            """SELECT * FROM member_playbook_attachments
               WHERE playbook_entry_id = %s AND identity_id = %s
               ORDER BY id DESC""",
            (book_id, identity_id),
        )
    else:
        cur.execute(
            """SELECT * FROM member_playbook_attachments
               WHERE playbook_entry_id = %s AND identity_id = %s AND purged_at IS NULL
               ORDER BY id DESC""",
            (book_id, identity_id),
        )
    return [
        {
            "id": int(r["id"]),
            "content_type": r.get("content_type"),
            "byte_size": int(r["byte_size"] or 0),
            "original_name": r.get("original_name"),
            "caption_md": r.get("caption_md") or "",
            "export_key": r.get("export_key"),
            "purged": r.get("purged_at") is not None,
            "download_path": (
                f"/api/me/playbook/entries/{book_id}/archive/{int(r['id'])}/bytes"
            ),
            "created_at": _iso(r.get("created_at")),
        }
        for r in cur.fetchall() or []
    ]


def save_attachment(
    cur,
    identity_id: int,
    book_id: int,
    *,
    content_type: str,
    data: bytes,
    original_name: str | None = None,
) -> dict:
    _assert_book(cur, identity_id, book_id)
    cfg = get_config()
    allow = {m.strip().lower() for m in cfg.playbook_archive_mime_allowlist.split(",") if m.strip()}
    ct = (content_type or "application/octet-stream").split(";")[0].strip().lower()
    if ct not in allow:
        raise PracticeSpineError(422, f"content_type not allowed: {ct}")
    if len(data) > cfg.playbook_archive_max_bytes_per_file:
        raise PracticeSpineError(413, "file exceeds max bytes per file")
    cur.execute(
        """SELECT COUNT(*) AS n, COALESCE(SUM(byte_size),0) AS b
           FROM member_playbook_attachments
           WHERE playbook_entry_id = %s AND identity_id = %s AND purged_at IS NULL""",
        (book_id, identity_id),
    )
    stats = cur.fetchone() or {}
    if int(stats.get("n") or 0) >= cfg.playbook_archive_max_files:
        raise PracticeSpineError(422, "max files per book reached")
    if int(stats.get("b") or 0) + len(data) > cfg.playbook_archive_max_bytes_per_book:
        raise PracticeSpineError(413, "book archive size cap exceeded")
    root = media_root()
    root.mkdir(parents=True, exist_ok=True)
    name = f"{identity_id}_{secrets.token_hex(12)}"
    path = root / str(identity_id)
    path.mkdir(parents=True, exist_ok=True)
    fpath = path / name
    fpath.write_bytes(data)
    storage_key = f"pbmedia:{identity_id}/{name}"
    ek = _export_key("pba")
    cur.execute(
        """INSERT INTO member_playbook_attachments
             (playbook_entry_id, identity_id, content_type, byte_size, original_name,
              storage_key, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            book_id,
            identity_id,
            ct,
            len(data),
            (original_name or "")[:255] or None,
            storage_key,
            ek,
        ),
    )
    aid = int(cur.lastrowid)
    return {
        "attachment": next(
            a for a in list_archive(cur, identity_id, book_id) if a["id"] == aid
        )
    }


def read_attachment_bytes(
    cur, identity_id: int, book_id: int, att_id: int
) -> tuple[bytes, str]:
    row = _assert_attachment(cur, identity_id, book_id, att_id)
    key = row.get("storage_key") or ""
    if not key.startswith("pbmedia:"):
        raise PracticeSpineError(500, "invalid storage key")
    rel = key[len("pbmedia:") :]
    path = media_root() / rel
    if not path.is_file():
        raise PracticeSpineError(404, "Attachment file missing")
    return path.read_bytes(), str(row.get("content_type") or "application/octet-stream")


def purge_attachment(cur, identity_id: int, book_id: int, att_id: int) -> dict:
    """Soft-remove from current surface (bytes retained for versions)."""
    _assert_attachment(cur, identity_id, book_id, att_id)
    cur.execute(
        """UPDATE member_playbook_attachments SET purged_at = %s
           WHERE id = %s AND identity_id = %s""",
        (_utcnow(), att_id, identity_id),
    )
    # clear cover if pointing here
    cur.execute(
        """UPDATE member_playbook_entries SET cover_attachment_id = NULL
           WHERE id = %s AND identity_id = %s AND cover_attachment_id = %s""",
        (book_id, identity_id, att_id),
    )
    return {"archive": list_archive(cur, identity_id, book_id)}


def purge_media_for_identity(cur, identity_id: int) -> int:
    """Hard-delete playbook media files for practice data purge (Family B wipe)."""
    cur.execute(
        """SELECT storage_key FROM member_playbook_attachments
           WHERE identity_id = %s""",
        (identity_id,),
    )
    n = 0
    root = media_root()
    for r in cur.fetchall() or []:
        key = r.get("storage_key") or ""
        if not key.startswith("pbmedia:"):
            continue
        rel = key[len("pbmedia:") :]
        path = root / rel
        try:
            if path.is_file():
                path.unlink()
                n += 1
        except OSError:
            pass
    return n
