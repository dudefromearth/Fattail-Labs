"""Help desk domain — screenshot storage, notifications, serialization.

Members ask questions (help_questions) and get threaded answers (help_messages),
all stored in the Labs DB. Notifications reuse the existing infra:
  - new question  -> notify.notify_admins (admin in-app + email)
  - admin answer  -> member_notify.create_in_app (member in-app) + SMTP email

All notification paths are best-effort and NEVER raise to the request.
Spec: FatTail-Labs-Help-System-Spec-v1.0.
"""

from __future__ import annotations

import base64
import binascii
import logging
import uuid
from pathlib import Path

log = logging.getLogger("labs.help")

MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024  # 5 MB decoded
_UPLOADS = Path(__file__).resolve().parent / "uploads" / "help"

STATUSES = ("open", "answered", "closed")


class HelpError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def _image_ext(raw: bytes) -> str | None:
    """Recognise a real image by magic bytes; None if it isn't one (reject)."""
    if raw[:3] == b"\xff\xd8\xff":
        return "jpg"
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return "webp"
    if raw[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    return None


def save_screenshot(b64: str | None) -> str | None:
    """Decode a base64 image (member upload) and store it under uploads/help/.
    Returns the relative media path (help/<uuid>.<ext>) or None. Raises
    HelpError(413) if too large. Anything that isn't a recognised image, or fails
    to store, returns None — the attachment is optional and never blocks the
    question."""
    if not b64:
        return None
    data = str(b64).split(",", 1)[-1].strip()  # tolerate data: URI prefix
    if not data:
        return None
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        log.warning("help attachment: invalid base64, ignoring")
        return None
    if not raw:
        return None
    if len(raw) > MAX_SCREENSHOT_BYTES:
        raise HelpError(413, "Image too large (max 5MB)")
    ext = _image_ext(raw)
    if ext is None:
        log.warning("help attachment: not a recognised image, ignoring")
        return None
    try:
        _UPLOADS.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}.{ext}"
        (_UPLOADS / name).write_bytes(raw)
        return f"help/{name}"
    except Exception as exc:  # noqa: BLE001 — storage failure must not block the question
        log.warning("help attachment store failed: %s", exc)
        return None


def notify_admins_new_question(question_id: int, subject: str, reporter: str) -> None:
    try:
        import notify
        notify.notify_admins(
            kind="help.new_question",
            title=f"New help question: {subject[:80]}",
            body=f"{reporter} asked a question:\n\n{subject}",
            href=f"/admin/help?q={question_id}",
            resource_type="help_question",
            resource_id=str(question_id),
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("help admin notify failed (q=%s): %s", question_id, exc)


def notify_member_answered_inapp(
    cur, *, identity_id: int, question_id: int, subject: str, message_id: int,
) -> None:
    """In-app member notification, within the caller's txn. Best-effort."""
    try:
        import member_notify as mn
        mn.create_in_app(
            cur,
            identity_id=int(identity_id),
            kind="help.answered",
            title="Your question was answered",
            body=f'"{subject[:120]}" has a reply from the team.',
            href=f"/help?q={question_id}",
            period_key=f"help-{question_id}-msg-{message_id}",
            resource_type="help_question",
            resource_id=str(question_id),
        )
    except Exception as exc:  # noqa: BLE001 — never block the admin answer
        log.warning("help member in-app notify failed (q=%s): %s", question_id, exc)


def email_member_answered(*, member_email: str | None, question_id: int, subject: str) -> None:
    """Send the 'answered' email AFTER commit. Best-effort — SMTP is optional."""
    if not member_email:
        return
    try:
        import notify
        origin = (notify._site_origin() or "").rstrip("/")
        link = f"{origin}/help?q={question_id}" if origin else f"/help?q={question_id}"
        notify._send_email(
            member_email,
            "Your FatTail Labs question was answered",
            f'Your question "{subject}" has a reply from the team.\n\nOpen: {link}\n',
        )
    except Exception as exc:  # noqa: BLE001 — SMTP optional / may fail
        log.warning("help member email skipped/failed (q=%s): %s", question_id, exc)
