"""Append-only link events and misses (RD-L2, RD-L4).

record_pass writes member_id and marker_id NULL. There is no IP column.
"""

from __future__ import annotations

import re
from pathlib import Path

_D4_PATH = Path(__file__).resolve().parent / "fixtures" / "d4_bots.txt"

_PHONE_RE = re.compile(
    r"iPhone|iPod|Windows Phone|IEMobile|webOS|BlackBerry|Opera Mini|Opera Mobi",
    re.IGNORECASE,
)
_TABLET_RE = re.compile(r"iPad|Tablet|PlayBook", re.IGNORECASE)
_ANDROID_RE = re.compile(r"Android", re.IGNORECASE)
_MOBILE_TOKEN_RE = re.compile(r"Mobile", re.IGNORECASE)
_DESKTOP_RE = re.compile(r"Windows|Macintosh|Linux|CrOS|X11", re.IGNORECASE)


def classify(ua, referrer) -> dict:
    """Kind, device, referrer, and bot flag. Country and region are unknown in W1.

    kind is scan only when there is no referrer and the UA is mobile; otherwise click.
    kind_basis is heuristic (RD-L2). A missing referrer is stored as direct.
    """
    agent = ua if isinstance(ua, str) else ""
    present = _present_referrer(referrer)
    mobile = _device_class(agent) in ("phone", "tablet")
    kind = "scan" if present is None and mobile else "click"
    pinned, generic = _d4()
    lowered = agent.lower()
    bot = any(name.lower() in lowered for name in pinned) or bool(generic.search(agent))
    return {
        "kind": kind,
        "kind_basis": "heuristic",
        "device_class": _device_class(agent),
        "os_family": _os_family(agent),
        "referrer": present if present is not None else "direct",
        "country": "unknown",
        "region": "unknown",
        "bot": bot,
    }


def record_pass(
    cur,
    *,
    slug,
    kind,
    device_class,
    os_family,
    referrer,
    country,
    region,
    bot,
) -> None:
    """Insert one pass-through. member_id and marker_id are NULL. No IP parameter."""
    cur.execute(
        """
        INSERT INTO link_events (
            occurred_at, slug, kind, device_class, os_family, referrer,
            country, region, bot, member_id, marker_id
        ) VALUES (
            UTC_TIMESTAMP(6), %s, %s, %s, %s, %s, %s, %s, %s, NULL, NULL
        )
        """,
        (
            _fit(slug, 6),
            _fit(kind, 16),
            _fit(device_class, 32),
            _fit(os_family, 32),
            _fit(referrer, 2048),
            _fit(country, 64),
            _fit(region, 128),
            1 if bot else 0,
        ),
    )


def record_miss(cur, *, attempted) -> None:
    text = attempted if isinstance(attempted, str) else ""
    cur.execute(
        "INSERT INTO link_misses (attempted, occurred_at) VALUES (%s, UTC_TIMESTAMP(6))",
        (_fit(text, 2048),),
    )


def _present_referrer(referrer) -> str | None:
    if not isinstance(referrer, str):
        return None
    text = referrer.strip()
    return text or None


def _device_class(agent: str) -> str:
    if _TABLET_RE.search(agent):
        return "tablet"
    if _ANDROID_RE.search(agent) and not _MOBILE_TOKEN_RE.search(agent):
        return "tablet"
    if _PHONE_RE.search(agent) or (_ANDROID_RE.search(agent) and _MOBILE_TOKEN_RE.search(agent)):
        return "phone"
    if _MOBILE_TOKEN_RE.search(agent):
        return "phone"
    if _DESKTOP_RE.search(agent):
        return "desktop"
    return "other"


def _os_family(agent: str) -> str:
    if re.search(r"iPhone|iPad|iPod", agent, re.IGNORECASE):
        return "iOS"
    if _ANDROID_RE.search(agent):
        return "Android"
    if re.search(r"Windows", agent, re.IGNORECASE):
        return "Windows"
    if re.search(r"Mac OS X|Macintosh", agent, re.IGNORECASE):
        return "macOS"
    if re.search(r"CrOS", agent, re.IGNORECASE):
        return "ChromeOS"
    if re.search(r"Linux", agent, re.IGNORECASE):
        return "Linux"
    return "unknown"


def _d4() -> tuple[list[str], re.Pattern[str]]:
    text = _D4_PATH.read_text(encoding="utf-8")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError("d4 fixture needs pinned lines and a generic pattern")
    pattern = lines[-1]
    try:
        generic = re.compile(pattern, re.IGNORECASE)
    except re.error as exc:
        raise ValueError("d4 generic pattern") from exc
    return lines[:-1], generic


def _fit(value, limit: int) -> str:
    text = value if isinstance(value, str) else ""
    return text[:limit]
