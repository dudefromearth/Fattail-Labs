"""Referrer → entry. No HTTP redirect. Unknown referrers land on the order form."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

ENTRIES = frozenset({"start", "watch", "order"})

_SEARCH = (
    "google.",
    "bing.com",
    "duckduckgo.com",
    "search.yahoo.",
    "baidu.com",
)
_SOCIAL = (
    "youtube.com",
    "youtu.be",
    "twitter.com",
    "x.com",
    "t.co",
    "facebook.com",
    "fb.com",
    "instagram.com",
    "tiktok.com",
    "linkedin.com",
    "reddit.com",
)
_EMAIL_HOSTS = (
    "mail.google.",
    "outlook.live.com",
    "outlook.office.com",
    "mail.yahoo.",
    "mail.proton.me",
    "proton.me",
)


def entry_for_referrer(referrer: str | None) -> str:
    if referrer is None:
        return "order"
    text = referrer.strip()
    if not text:
        return "order"
    parsed = urlparse(text)
    host = (parsed.hostname or "").lower()
    query = parse_qs(parsed.query)
    medium = (query.get("utm_medium") or [""])[0].strip().lower()
    if medium in {"email", "newsletter"}:
        return "order"
    if medium in {"social", "video"}:
        return "watch"
    if medium in {"cpc", "ppc", "paid", "display", "search"}:
        return "start"
    if host.startswith("mail.") or any(token in host for token in _EMAIL_HOSTS):
        return "order"
    if any(token in host for token in _SOCIAL):
        return "watch"
    if any(token in host for token in _SEARCH):
        return "start"
    return "order"
