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
import html as _html
import logging
import os
import uuid
from pathlib import Path

log = logging.getLogger("labs.help")

MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024  # 5 MB decoded
_UPLOADS = Path(__file__).resolve().parent / "uploads" / "help"

STATUSES = ("open", "answered", "closed")

# Grok-4-fast $/1M tokens (override via env as pricing changes). Used only to
# estimate concierge cost per resolution in analytics — never billed on.
_COST_IN_PER_M = float(os.environ.get("LABS_HELP_AI_COST_IN_PER_M", "0.20"))
_COST_OUT_PER_M = float(os.environ.get("LABS_HELP_AI_COST_OUT_PER_M", "0.50"))


def log_ai_event(
    *, question_id, event_type, category=None, page_context=None,
    res=None, resolved=None, reference_hit=None,
) -> None:
    """Record one concierge interaction for the analytics / doc-gap report.
    `res` is the dict from help_ai.answer (topic, resolved, reference_hit, model,
    input_tokens, output_tokens). Best-effort — never raises into the request."""
    try:
        import db
        r = res or {}
        resolved_v = bool(r.get("resolved")) if resolved is None else bool(resolved)
        in_tok = int(r.get("input_tokens") or 0)
        out_tok = int(r.get("output_tokens") or 0)
        cost = round(
            in_tok / 1_000_000 * _COST_IN_PER_M + out_tok / 1_000_000 * _COST_OUT_PER_M, 6
        )
        ref = r.get("reference_hit") if reference_hit is None else reference_hit
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO help_ai_events
                         (question_id, event_type, topic, category, page_context,
                          resolved, reference_hit, model, input_tokens, output_tokens, cost_usd)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        question_id, event_type, (r.get("topic") or category), category,
                        page_context, 1 if resolved_v else 0,
                        None if ref is None else (1 if ref else 0),
                        r.get("model"), in_tok or None, out_tok or None, cost or None,
                    ),
                )
    except Exception as exc:  # noqa: BLE001 — analytics must never break help
        log.warning("help_ai_event log failed (q=%s): %s", question_id, exc)


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


def _help_notify_emails() -> list[str]:
    """Who gets the team EMAIL for a new/escalated ticket. In-app still goes to
    ALL admins; only the email is scoped. Configurable via
    LABS_HELP_NOTIFY_EMAILS (comma-separated); defaults to the support owner.
    Set it empty to fall back to emailing every admin."""
    raw = os.environ.get("LABS_HELP_NOTIFY_EMAILS", "conor@0-dte.com")
    return [e.strip() for e in raw.split(",") if e.strip()]


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
            email_to=_help_notify_emails() or None,
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


def _help_ticket_link(question_id: int) -> str:
    """Deep link to the member's ticket inside the app."""
    import notify
    origin = (notify._site_origin() or "").rstrip("/")
    return f"{origin}/help?q={question_id}" if origin else f"/help?q={question_id}"


_EMAIL_LOGO = "https://labs.fattail.ai/brand/fattail-labs-logo.jpg"


def _esc(s) -> str:
    return _html.escape(str(s or ""), quote=True)


def _br(s) -> str:
    return _esc(s).replace("\n", "<br>")


def _help_email_html(*, heading: str, intro_html: str, panel_text, link: str, cta_label: str) -> str:
    """Branded, email-safe HTML (table layout + inline styles) for member emails."""
    panel = ""
    if panel_text:
        panel = (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">'
            '<tr><td style="background:#f5f5f7;border-left:3px solid #0d9488;border-radius:8px;'
            'padding:14px 16px;font-size:15px;line-height:1.55;color:#1d1d1f;">'
            + _br(panel_text) + "</td></tr></table>"
        )
    return (
        '<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f7;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 12px;">'
        '<tr><td align="center">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;'
        'border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
        '<tr><td style="background:#0b0b0f;padding:18px 28px;text-align:center;">'
        f'<img src="{_EMAIL_LOGO}" alt="FatTail Labs" width="150" '
        'style="display:inline-block;max-width:150px;height:auto;border:0;"></td></tr>'
        '<tr><td style="padding:28px;">'
        f'<h1 style="margin:0 0 12px;font-size:19px;line-height:1.3;color:#1d1d1f;font-weight:700;">{_esc(heading)}</h1>'
        f'<div style="font-size:15px;line-height:1.55;color:#3a3a3c;">{intro_html}</div>'
        f"{panel}"
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 6px;"><tr>'
        f'<td style="border-radius:10px;background:#0d9488;"><a href="{_esc(link)}" '
        'style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;'
        f'text-decoration:none;border-radius:10px;">{_esc(cta_label)}</a></td></tr></table>'
        '<p style="font-size:13px;line-height:1.5;color:#6e6e73;margin:16px 0 0;">'
        'Or open it manually: sign in to FatTail Labs, click the <strong>?</strong> Help button in the '
        "bottom-right corner, and select this ticket.</p>"
        "</td></tr>"
        '<tr><td style="padding:16px 28px;border-top:1px solid #e5e5ea;text-align:center;">'
        '<p style="margin:0;font-size:12px;color:#8e8e93;">FatTail Labs &middot; '
        '<a href="https://labs.fattail.ai" style="color:#0d9488;text-decoration:none;">labs.fattail.ai</a></p>'
        "</td></tr></table></td></tr></table></body></html>"
    )


def email_member_ticket_received(*, member_email: str | None, question_id: int, subject: str) -> str:
    """Confirm to the member their ticket reached the human team. Returns send status."""
    if not member_email:
        return "skipped"
    try:
        import notify
        link = _help_ticket_link(question_id)
        body = (
            "Hi,\n\n"
            "Thanks for reaching out - your support ticket has been received and "
            f'passed to our team:\n\n    "{subject}"\n\n'
            "We'll email you as soon as we reply. There's nothing else you need to do.\n\n"
            "Open your ticket in FatTail Labs: " + link + "\n\n- The FatTail Labs Team\n"
        )
        html = _help_email_html(
            heading="We've received your support ticket",
            intro_html=(
                "Thanks for reaching out — your support ticket has been received and passed to our team:"
                f'<br><br><strong>{_esc(subject)}</strong><br><br>'
                "We'll email you as soon as we reply. There's nothing else you need to do."
            ),
            panel_text=None,
            link=link,
            cta_label="View your ticket",
        )
        notify._send_email(member_email, "We've received your FatTail Labs support ticket", body, html=html)
        return "sent"
    except Exception as exc:  # noqa: BLE001 — SMTP optional / may fail
        log.warning("help ticket-received email skipped/failed (q=%s): %s", question_id, exc)
        return "failed"


def email_member_answered(
    *, member_email: str | None, question_id: int, subject: str, reply_body: str | None = None,
) -> str:
    """Send the 'ticket updated' email AFTER commit. Returns send status (sent|failed|skipped)."""
    if not member_email:
        return "skipped"
    try:
        import notify
        link = _help_ticket_link(question_id)
        reply = (reply_body or "").strip()
        quoted = ("\n" + ("-" * 56) + "\n" + reply + "\n" + ("-" * 56) + "\n") if reply else ""
        body = (
            "Hi,\n\n"
            f'Our team has replied to your support ticket "{subject}":\n'
            + quoted
            + "\nYour ticket has been updated. Read the full conversation or reply back here: "
            + link + "\n\n- The FatTail Labs Team\n"
        )
        html = _help_email_html(
            heading="Your support ticket has been updated",
            intro_html=(
                f'Our team has replied to your support ticket <strong>{_esc(subject)}</strong>. '
                "Read the full conversation or reply back:"
            ),
            panel_text=reply or None,
            link=link,
            cta_label="View reply & respond",
        )
        notify._send_email(member_email, "Your FatTail Labs support ticket has been updated", body, html=html)
        return "sent"
    except Exception as exc:  # noqa: BLE001 — SMTP optional / may fail
        log.warning("help member email skipped/failed (q=%s): %s", question_id, exc)
        return "failed"
