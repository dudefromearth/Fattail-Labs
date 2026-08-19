"""In-house apply calendar invite — ICS METHOD:REQUEST over LABS_SMTP_*.

No Calendly. No Chili Piper. Organizer is Cole Merritt / cole@fattail.ai.
Times are America/New_York. Duration 30 minutes. Location is not a fake Zoom.
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
import smtplib
import ssl
import time
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Any
from zoneinfo import ZoneInfo

log = logging.getLogger("labs.apply_invite")

APPLY_TZ = ZoneInfo("America/New_York")
APPLY_TZ_NAME = "America/New_York"
DURATION_MINUTES = 30
ORGANIZER_CN = "Cole Merritt"
ORGANIZER_MAIL = "cole@fattail.ai"
SUMMARY = "FatTail conversation"
LOCATION = "We'll send the link."
WHEN_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ApplyInviteError(Exception):
    pass


def parse_when_et(value: str) -> datetime:
    raw = (value or "").strip()
    m = WHEN_RE.match(raw)
    if not m:
        raise ApplyInviteError(
            "Pick a date and time in America/New_York (YYYY-MM-DDTHH:MM)"
        )
    year, month, day, hour, minute = (int(p) for p in m.groups())
    try:
        return datetime(year, month, day, hour, minute, tzinfo=APPLY_TZ)
    except ValueError as exc:
        raise ApplyInviteError("That date-time is not valid in America/New_York") from exc


def is_when_valid(value: str) -> bool:
    try:
        parse_when_et(value)
        return True
    except ApplyInviteError:
        return False


def conversation_uid(email: str) -> str:
    digest = hashlib.sha1(email.strip().lower().encode("utf-8")).hexdigest()[:16]
    return f"apply-conversation-{digest}@fattail.ai"


def _fold(line: str) -> str:
    raw = line.encode("utf-8")
    if len(raw) <= 74:
        return line
    out: list[str] = []
    while raw:
        chunk = raw[:74]
        # do not split a UTF-8 codepoint
        while chunk and (chunk[-1] & 0xC0) == 0x80:
            chunk = chunk[:-1]
        if not chunk:
            chunk = raw[:74]
        out.append(chunk.decode("utf-8"))
        raw = raw[len(chunk) :]
        if raw:
            raw = b" " + raw
    return "\r\n".join(out)


def _esc(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _ics_stamp(dt: datetime) -> str:
    return dt.astimezone(ZoneInfo("UTC")).strftime("%Y%m%dT%H%M%SZ")


def _ics_local(dt: datetime) -> str:
    return dt.strftime("%Y%m%dT%H%M%S")


def build_ics(*, email: str, when: datetime, sequence: int) -> str:
    end = when + timedelta(minutes=DURATION_MINUTES)
    uid = conversation_uid(email)
    desc = (
        "Thirty-minute live FatTail conversation. "
        "We'll send the link. Times are America/New_York."
    )
    lines = [
        "BEGIN:VCALENDAR",
        "PRODID:-//FatTail//Apply Conversation//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VTIMEZONE",
        "TZID:America/New_York",
        "BEGIN:DAYLIGHT",
        "DTSTART:19700308T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
        "TZOFFSETFROM:-0500",
        "TZOFFSETTO:-0400",
        "TZNAME:EDT",
        "END:DAYLIGHT",
        "BEGIN:STANDARD",
        "DTSTART:19701101T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
        "TZOFFSETFROM:-0400",
        "TZOFFSETTO:-0500",
        "TZNAME:EST",
        "END:STANDARD",
        "END:VTIMEZONE",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{_ics_stamp(datetime.now(tz=ZoneInfo('UTC')))}",
        f"DTSTART;TZID=America/New_York:{_ics_local(when)}",
        f"DTEND;TZID=America/New_York:{_ics_local(end)}",
        f"SUMMARY:{_esc(SUMMARY)}",
        f"LOCATION:{_esc(LOCATION)}",
        f"DESCRIPTION:{_esc(desc)}",
        f"ORGANIZER;CN={_esc(ORGANIZER_CN)}:mailto:{ORGANIZER_MAIL}",
        "ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;"
        f"CN={_esc(email)}:mailto:{email}",
        f"SEQUENCE:{int(sequence)}",
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
    ]
    return "\r\n".join(_fold(line) for line in lines)


def _smtp_config() -> dict[str, Any]:
    host = os.environ.get("LABS_SMTP_HOST", "").strip()
    if not host:
        raise ApplyInviteError(
            "LABS_SMTP_HOST is not set; the calendar invite cannot send"
        )
    from_addr = os.environ.get("LABS_SMTP_FROM", "").strip()
    if not from_addr:
        raise ApplyInviteError(
            "LABS_SMTP_FROM is required when LABS_SMTP_HOST is set"
        )
    port_raw = os.environ.get("LABS_SMTP_PORT", "465").strip() or "465"
    try:
        port = int(port_raw)
    except ValueError as exc:
        raise ApplyInviteError(
            f"LABS_SMTP_PORT must be an integer, got {port_raw!r}"
        ) from exc
    mode = os.environ.get("LABS_SMTP_MODE", "").strip().lower()
    if not mode:
        mode = "ssl" if port == 465 else "starttls"
    if mode not in ("ssl", "starttls", "plain"):
        raise ApplyInviteError(
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


def _send_message(msg: EmailMessage) -> None:
    smtp = _smtp_config()
    context = ssl.create_default_context()
    if smtp["mode"] == "ssl":
        with smtplib.SMTP_SSL(
            smtp["host"], smtp["port"], timeout=30, context=context
        ) as server:
            if smtp["user"]:
                server.login(smtp["user"], smtp["password"] or "")
            server.send_message(msg)
        return
    with smtplib.SMTP(smtp["host"], smtp["port"], timeout=30) as server:
        if smtp["mode"] == "starttls":
            server.starttls(context=context)
        if smtp["user"]:
            server.login(smtp["user"], smtp["password"] or "")
        server.send_message(msg)


def send_conversation_invite(email: str, when_value: str) -> dict:
    """Build METHOD:REQUEST ICS and mail it. Same UID per applicant email."""
    addr = (email or "").strip().lower()
    if not addr or not EMAIL_RE.match(addr) or len(addr) > 320:
        raise ApplyInviteError("Valid email required")
    when = parse_when_et(when_value)
    sequence = int(time.time())
    ics = build_ics(email=addr, when=when, sequence=sequence)
    hour12 = when.strftime("%I:%M %p").lstrip("0")
    day = when.strftime("%A, %B ") + str(when.day) + when.strftime(", %Y")
    body = (
        f"A FatTail conversation is on the calendar.\n\n"
        f"{day} at {hour12} America/New_York.\n"
        f"Thirty minutes. We'll send the link.\n\n"
        f"Open the attached invite to add it to your calendar.\n"
    )
    smtp = _smtp_config()
    msg = EmailMessage()
    msg["Subject"] = f"Invitation: {SUMMARY}"
    msg["From"] = smtp["from_addr"]
    msg["To"] = addr
    msg["Cc"] = ORGANIZER_MAIL
    msg["Reply-To"] = f"{ORGANIZER_CN} <{ORGANIZER_MAIL}>"
    msg.set_content(body)
    msg.add_attachment(
        ics.encode("utf-8"),
        maintype="text",
        subtype="calendar",
        filename="invite.ics",
        params={"method": "REQUEST", "charset": "UTF-8"},
    )
    _send_message(msg)
    log.info("apply invite sent uid=%s when=%s", conversation_uid(addr), when_value)
    return {
        "ok": True,
        "sent": True,
        "uid": conversation_uid(addr),
        "when": when_value.strip(),
        "tz": APPLY_TZ_NAME,
        "duration_minutes": DURATION_MINUTES,
    }
