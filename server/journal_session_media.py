"""Journal private media — Spec §11.2 D4 · JS5.

Separate Family B root; cookie auth; no public URL; purge unlinks binaries.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import journal_session_domain as jsd

ALLOWED_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}
DEFAULT_MAX_BYTES = 5 * 1024 * 1024
MAX_PER_SESSION = 5


class MediaError(Exception):
    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def media_root() -> Path:
    """Config fail loud when routes used without root in non-dev optional.

    LABS_JOURNAL_MEDIA_DIR required when uploading; default under server/var for dev.
    """
    raw = (os.environ.get("LABS_JOURNAL_MEDIA_DIR") or "").strip()
    if raw:
        return Path(raw)
    # Dev default — still not a public mount
    return Path(__file__).resolve().parent / "var" / "journal_media"


def max_bytes() -> int:
    try:
        return int(os.environ.get("LABS_JOURNAL_MEDIA_MAX_BYTES") or DEFAULT_MAX_BYTES)
    except ValueError:
        return DEFAULT_MAX_BYTES


def count_attachments(cur, session_id: int, identity_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_journal_attachments
           WHERE session_id = %s AND identity_id = %s""",
        (session_id, identity_id),
    )
    return int(cur.fetchone()["n"] or 0)


def list_attachments(cur, identity_id: int, session_id: int) -> list[dict]:
    cur.execute(
        """SELECT id, session_id, identity_id, trade_id, content_type, byte_size,
                  caption_md, export_key, created_at
           FROM member_journal_attachments
           WHERE session_id = %s AND identity_id = %s
           ORDER BY id ASC""",
        (session_id, identity_id),
    )
    return [_ser(r) for r in cur.fetchall()]


def _ser(r: dict) -> dict:
    return {
        "id": int(r["id"]),
        "session_id": int(r["session_id"]),
        "identity_id": int(r["identity_id"]),
        "trade_id": int(r["trade_id"]) if r.get("trade_id") is not None else None,
        "content_type": r["content_type"],
        "byte_size": int(r["byte_size"]),
        "caption_md": r.get("caption_md"),
        "export_key": r.get("export_key"),
        "created_at": jsd._iso(r.get("created_at")),
        # Never expose storage_key as a public URL
        "download_path": f"/api/me/journal-sessions/{int(r['session_id'])}/attachments/{int(r['id'])}/bytes",
    }


def save_attachment(
    cur,
    identity_id: int,
    session_id: int,
    *,
    content_type: str,
    data: bytes,
    caption_md: str | None = None,
) -> dict:
    row = jsd._load_mutable_row(cur, identity_id, session_id)
    jd = jsd._as_date(row["journal_date"])
    jsd.assert_date_open(cur, identity_id, jd)

    if count_attachments(cur, session_id, identity_id) >= MAX_PER_SESSION:
        raise MediaError(422, f"Max {MAX_PER_SESSION} attachments per entry")

    ext = ALLOWED_TYPES.get(content_type or "")
    if not ext:
        raise MediaError(422, f"Unsupported type: {content_type}")
    if len(data) > max_bytes():
        raise MediaError(422, f"File exceeds {max_bytes() // (1024*1024)} MB")
    if len(data) == 0:
        raise MediaError(422, "Empty file")

    root = media_root()
    owner_dir = root / str(identity_id)
    owner_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    path = owner_dir / name
    path.write_bytes(data)
    storage_key = f"jmedia:{identity_id}/{name}"
    created = jsd._naive_utc(datetime.now(timezone.utc))

    cur.execute(
        """INSERT INTO member_journal_attachments
             (session_id, identity_id, trade_id, storage_key, content_type,
              byte_size, caption_md, export_key, created_at)
           VALUES (%s, %s, NULL, %s, %s, %s, %s, NULL, %s)""",
        (
            session_id,
            identity_id,
            storage_key,
            content_type,
            len(data),
            caption_md,
            created,
        ),
    )
    aid = int(cur.lastrowid)
    cur.execute(
        """SELECT id, session_id, identity_id, trade_id, content_type, byte_size,
                  caption_md, export_key, created_at
           FROM member_journal_attachments WHERE id = %s""",
        (aid,),
    )
    return _ser(cur.fetchone())


def read_attachment_bytes(
    cur, identity_id: int, session_id: int, attachment_id: int
) -> tuple[bytes, str]:
    cur.execute(
        """SELECT storage_key, content_type FROM member_journal_attachments
           WHERE id = %s AND session_id = %s AND identity_id = %s""",
        (attachment_id, session_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise MediaError(404, "Attachment not found")
    key = str(row["storage_key"])
    # jmedia:{identity_id}/{name}
    if not key.startswith("jmedia:"):
        raise MediaError(500, "Invalid storage key")
    rel = key[len("jmedia:") :]
    path = media_root() / rel
    if not path.is_file():
        raise MediaError(404, "Attachment binary missing")
    return path.read_bytes(), str(row["content_type"])


def update_caption(
    cur,
    identity_id: int,
    session_id: int,
    attachment_id: int,
    caption_md: str | None,
) -> dict:
    """Edit caption while session/date open (Spec v0.6 §1.4 lightbox)."""
    row = jsd._load_mutable_row(cur, identity_id, session_id)
    jd = jsd._as_date(row["journal_date"])
    jsd.assert_date_open(cur, identity_id, jd)
    cur.execute(
        """UPDATE member_journal_attachments SET caption_md = %s
           WHERE id = %s AND session_id = %s AND identity_id = %s""",
        (caption_md, attachment_id, session_id, identity_id),
    )
    if cur.rowcount == 0:
        raise MediaError(404, "Attachment not found")
    cur.execute(
        """SELECT id, session_id, identity_id, trade_id, content_type, byte_size,
                  caption_md, export_key, created_at
           FROM member_journal_attachments WHERE id = %s""",
        (attachment_id,),
    )
    return _ser(cur.fetchone())


def delete_attachment(
    cur, identity_id: int, session_id: int, attachment_id: int
) -> None:
    cur.execute(
        """SELECT id, storage_key FROM member_journal_attachments
           WHERE id = %s AND session_id = %s AND identity_id = %s""",
        (attachment_id, session_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise MediaError(404, "Attachment not found")
    # Only allow delete on mutable sessions
    jsd._load_mutable_row(cur, identity_id, session_id)
    key = str(row["storage_key"])
    cur.execute(
        """DELETE FROM member_journal_attachments
           WHERE id = %s AND identity_id = %s""",
        (attachment_id, identity_id),
    )
    if key.startswith("jmedia:"):
        path = media_root() / key[len("jmedia:") :]
        try:
            path.unlink(missing_ok=True)
        except TypeError:
            if path.is_file():
                path.unlink()


def purge_media_for_identity(cur, identity_id: int) -> int:
    """Delete attachment rows + binaries for identity (practice purge)."""
    cur.execute(
        """SELECT storage_key FROM member_journal_attachments
           WHERE identity_id = %s""",
        (identity_id,),
    )
    keys = [r["storage_key"] for r in cur.fetchall()]
    cur.execute(
        "DELETE FROM member_journal_attachments WHERE identity_id = %s",
        (identity_id,),
    )
    n = 0
    for key in keys:
        if str(key).startswith("jmedia:"):
            path = media_root() / str(key)[len("jmedia:") :]
            try:
                if path.is_file():
                    path.unlink()
                    n += 1
            except OSError:
                pass
    return n
