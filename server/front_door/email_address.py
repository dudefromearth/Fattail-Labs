"""Order-form email. A usable address is well formed and its domain accepts mail.

A null MX (RFC 7505) means the domain refuses mail. No MX and no address
record means the same. A failed lookup is not treated as acceptance.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request

_LOCAL = re.compile(r"^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?$")
_LABEL = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
_TLD = re.compile(r"^[a-z]{2,24}$")
_FORMAT = "Enter a complete email address, like name@domain.com."
_DOMAIN = "That domain does not accept email."
_UNAVAILABLE = "We couldn't verify that email. Check it and try again."


class EmailAddressError(ValueError):
    """The address cannot be used for this order."""


def normalize_email(raw: str) -> str:
    if not isinstance(raw, str):
        raise EmailAddressError(_FORMAT)
    email = raw.strip().lower()
    if not email or len(email) > 320 or email.count("@") != 1:
        raise EmailAddressError(_FORMAT)
    local, domain = email.split("@", 1)
    if not _local_ok(local) or not _domain_ok(domain):
        raise EmailAddressError(_FORMAT)
    return email


def assert_receives_mail(email: str, lookup=None) -> None:
    domain = normalize_email(email).split("@", 1)[1]
    read = lookup if lookup is not None else lookup_mail_domain
    try:
        kind = read(domain)
    except Exception as exc:  # noqa: BLE001 — a resolver fault is not acceptance
        raise EmailAddressError(_UNAVAILABLE) from exc
    if kind == "unavailable":
        raise EmailAddressError(_UNAVAILABLE)
    if kind not in {"mx", "address"}:
        raise EmailAddressError(_DOMAIN)


def lookup_mail_domain(domain: str) -> str:
    """Return mx, null_mx, address, none, nxdomain, or unavailable."""
    try:
        mx = _dns_json(domain, "MX")
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return "unavailable"
    status = mx.get("Status")
    if status == 3:
        return "nxdomain"
    if status not in {0, None}:
        return "unavailable"
    exchanges = []
    for answer in mx.get("Answer") or []:
        if answer.get("type") != 15:
            continue
        parts = str(answer.get("data") or "").split()
        exchange = parts[-1].rstrip(".").lower() if parts else ""
        exchanges.append(exchange)
    if exchanges:
        if all(not exchange or exchange == "." for exchange in exchanges):
            return "null_mx"
        return "mx"
    for qtype in ("A", "AAAA"):
        try:
            host = _dns_json(domain, qtype)
        except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
            return "unavailable"
        if host.get("Status") == 3:
            return "nxdomain"
        if any(answer.get("type") in {1, 28} for answer in host.get("Answer") or []):
            return "address"
    return "none"


def _local_ok(local: str) -> bool:
    if not local or len(local) > 64 or ".." in local:
        return False
    return _LOCAL.fullmatch(local) is not None


def _domain_ok(domain: str) -> bool:
    if not domain or len(domain) > 253 or ".." in domain:
        return False
    labels = domain.split(".")
    if len(labels) < 2 or _TLD.fullmatch(labels[-1]) is None:
        return False
    return all(_LABEL.fullmatch(label) is not None for label in labels)


def _dns_json(name: str, qtype: str) -> dict:
    query = urllib.parse.urlencode({"name": name, "type": qtype})
    request = urllib.request.Request(
        f"https://cloudflare-dns.com/dns-query?{query}",
        headers={"accept": "application/dns-json"},
    )
    with urllib.request.urlopen(request, timeout=3) as response:
        payload = json.load(response)
    if not isinstance(payload, dict):
        raise ValueError("DNS answer was not an object")
    return payload
