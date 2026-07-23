"""Admin notifications — in-app inbox + optional SMTP email.

Spec: FatTail-Labs-Admin-Notifications-Spec-v1.0.md
"""

from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

import db
from config import get_config

log = logging.getLogger("labs.notify")


class NotifyError(Exception):
    pass


def _admin_identity_ids(*, exclude_identity_id: int | None = None) -> list[dict]:
    """Administrators via role_override (bootstrap + explicit grants)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT identity_id, email, display_name
                   FROM identities
                   WHERE role_override = 'administrator'
                     AND email IS NOT NULL AND email != ''"""
            )
            rows = cur.fetchall()
    out = []
    for r in rows:
        iid = int(r["identity_id"])
        if exclude_identity_id is not None and iid == int(exclude_identity_id):
            continue
        out.append(
            {
                "identity_id": iid,
                "email": r["email"],
                "display_name": r["display_name"] or r["email"],
            }
        )
    return out


def _site_origin() -> str:
    cfg = get_config()
    origin = (cfg.web_origin or os.environ.get("NEXT_PUBLIC_SITE_URL") or "").strip()
    return origin.rstrip("/")


def _smtp_config() -> dict[str, Any] | None:
    """Load SMTP settings. FatTail outbound mail: smtp.hostinger.com (see .env.example)."""
    host = os.environ.get("LABS_SMTP_HOST", "").strip()
    if not host:
        return None
    from_addr = os.environ.get("LABS_SMTP_FROM", "").strip()
    if not from_addr:
        raise NotifyError("LABS_SMTP_FROM is required when LABS_SMTP_HOST is set")
    port_raw = os.environ.get("LABS_SMTP_PORT", "465").strip() or "465"
    try:
        port = int(port_raw)
    except ValueError as exc:
        raise NotifyError(f"LABS_SMTP_PORT must be an integer, got {port_raw!r}") from exc

    # Mode: ssl (implicit TLS, Hostinger 465) | starttls (587) | plain
    mode = os.environ.get("LABS_SMTP_MODE", "").strip().lower()
    if not mode:
        if port == 465:
            mode = "ssl"
        elif os.environ.get("LABS_SMTP_TLS", "1").strip() != "0":
            mode = "starttls"
        else:
            mode = "plain"
    if mode not in ("ssl", "starttls", "plain"):
        raise NotifyError(
            f"LABS_SMTP_MODE must be ssl|starttls|plain, got {mode!r}"
        )

    return {
        "host": host,
        "port": port,
        "user": os.environ.get("LABS_SMTP_USER", "").strip() or None,
        "password": os.environ.get("LABS_SMTP_PASSWORD", "").strip() or None,
        "from_addr": from_addr,
        "mode": mode,
    }


def _send_email(to_addr: str, subject: str, body: str) -> None:
    smtp = _smtp_config()
    if smtp is None:
        required = os.environ.get("LABS_NOTIFY_EMAIL_REQUIRED", "").strip() == "1"
        if required:
            raise NotifyError(
                "LABS_NOTIFY_EMAIL_REQUIRED=1 but LABS_SMTP_HOST is not set"
            )
        raise NotifyError("smtp_not_configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp["from_addr"]
    msg["To"] = to_addr
    msg.set_content(body)

    context = ssl.create_default_context()
    if smtp["mode"] == "ssl":
        # Hostinger recommended: smtp.hostinger.com:465 SSL
        with smtplib.SMTP_SSL(
            smtp["host"], smtp["port"], timeout=30, context=context
        ) as server:
            if smtp["user"]:
                server.login(smtp["user"], smtp["password"] or "")
            server.send_message(msg)
    elif smtp["mode"] == "starttls":
        # Hostinger alternate: port 587 STARTTLS
        with smtplib.SMTP(smtp["host"], smtp["port"], timeout=30) as server:
            server.starttls(context=context)
            if smtp["user"]:
                server.login(smtp["user"], smtp["password"] or "")
            server.send_message(msg)
    else:
        with smtplib.SMTP(smtp["host"], smtp["port"], timeout=30) as server:
            if smtp["user"]:
                server.login(smtp["user"], smtp["password"] or "")
            server.send_message(msg)


def notify_admins(
    *,
    kind: str,
    title: str,
    body: str,
    href: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    exclude_identity_id: int | None = None,
) -> list[int]:
    """Create in-app notifications for all admins and attempt email.

    Returns notification ids created.
    """
    kind = (kind or "").strip()
    title = (title or "").strip()
    body = (body or "").strip()
    href = (href or "").strip()
    if not kind or not title or not body or not href:
        raise NotifyError("kind, title, body, href required")

    admins = _admin_identity_ids(exclude_identity_id=exclude_identity_id)
    if not admins:
        log.warning("notify_admins: no administrator recipients for %s", kind)
        return []

    origin = _site_origin()
    abs_href = href if href.startswith("http") else f"{origin}{href}" if origin else href

    ids: list[int] = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for admin in admins:
                email_status = "pending"
                email_error = None
                try:
                    _send_email(
                        admin["email"],
                        f"[FatTail Labs] {title}",
                        f"{body}\n\nOpen: {abs_href}\n",
                    )
                    email_status = "sent"
                except NotifyError as exc:
                    if str(exc) == "smtp_not_configured":
                        email_status = "skipped"
                        email_error = "SMTP not configured"
                    else:
                        email_status = "failed"
                        email_error = str(exc)[:512]
                        log.warning("notify email failed: %s", exc)
                except Exception as exc:  # noqa: BLE001 — capture SMTP failures
                    email_status = "failed"
                    email_error = str(exc)[:512]
                    log.warning("notify email failed: %s", exc)

                cur.execute(
                    """INSERT INTO admin_notifications
                       (identity_id, kind, title, body, href,
                        resource_type, resource_id, email_status, email_error)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        admin["identity_id"],
                        kind[:64],
                        title[:512],
                        body,
                        href[:1024],
                        resource_type,
                        str(resource_id) if resource_id is not None else None,
                        email_status,
                        email_error,
                    ),
                )
                ids.append(int(cur.lastrowid))
    return ids


def list_for_identity(
    identity_id: int, *, unread_only: bool = False, limit: int = 50
) -> list[dict]:
    limit = max(1, min(int(limit), 100))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            sql = """SELECT id, kind, title, body, href, resource_type, resource_id,
                            read_at, email_status, created_at
                     FROM admin_notifications
                     WHERE identity_id = %s"""
            params: list[Any] = [identity_id]
            if unread_only:
                sql += " AND read_at IS NULL"
            sql += " ORDER BY id DESC LIMIT %s"
            params.append(limit)
            cur.execute(sql, params)
            rows = cur.fetchall()
    return [_row(r) for r in rows]


def unread_count(identity_id: int) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS c FROM admin_notifications
                   WHERE identity_id = %s AND read_at IS NULL""",
                (identity_id,),
            )
            return int(cur.fetchone()["c"])


def mark_read(identity_id: int, notification_id: int) -> bool:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE admin_notifications
                   SET read_at = CURRENT_TIMESTAMP
                   WHERE id = %s AND identity_id = %s AND read_at IS NULL""",
                (notification_id, identity_id),
            )
            return cur.rowcount > 0


def mark_all_read(identity_id: int) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE admin_notifications
                   SET read_at = CURRENT_TIMESTAMP
                   WHERE identity_id = %s AND read_at IS NULL""",
                (identity_id,),
            )
            return int(cur.rowcount)


def _row(r: dict) -> dict:
    created = r.get("created_at")
    read_at = r.get("read_at")
    return {
        "id": r["id"],
        "kind": r["kind"],
        "title": r["title"],
        "body": r["body"],
        "href": r["href"],
        "resource_type": r.get("resource_type"),
        "resource_id": r.get("resource_id"),
        "read_at": read_at.isoformat(sep=" ") if hasattr(read_at, "isoformat") else read_at,
        "email_status": r.get("email_status"),
        "created_at": created.isoformat(sep=" ") if hasattr(created, "isoformat") else created,
        "unread": r.get("read_at") is None,
    }


# --- domain hooks -------------------------------------------------------------


def notify_board_awaiting_approval(
    item: dict, *, actor_identity_id: int | None
) -> list[int]:
    title = f"Approval needed: {item.get('title') or 'work product'}"
    body = (
        f"A content card is awaiting approval.\n"
        f"Product line: {item.get('product_line')}\n"
        f"Status: awaiting_approval"
    )
    return notify_admins(
        kind="board.awaiting_approval",
        title=title,
        body=body,
        href=f"/admin/board?item={item['id']}",
        resource_type="content_item",
        resource_id=str(item["id"]),
        exclude_identity_id=actor_identity_id,
    )


def notify_board_revision(item: dict, *, actor_identity_id: int | None) -> list[int]:
    title = f"Revision requested: {item.get('title') or 'work product'}"
    reason = item.get("reject_reason") or "(no reason recorded)"
    body = f"Revision requested on a content card.\nReason: {reason}"
    return notify_admins(
        kind="board.revision_requested",
        title=title,
        body=body,
        href=f"/admin/board?item={item['id']}",
        resource_type="content_item",
        resource_id=str(item["id"]),
        exclude_identity_id=actor_identity_id,
    )


def notify_board_flag(item_id: int, title: str, guardian: str, message: str) -> list[int]:
    return notify_admins(
        kind="board.flag_opened",
        title=f"Guardian flag ({guardian}): {title}",
        body=message,
        href=f"/admin/board?item={item_id}",
        resource_type="content_item",
        resource_id=str(item_id),
        exclude_identity_id=None,
    )
