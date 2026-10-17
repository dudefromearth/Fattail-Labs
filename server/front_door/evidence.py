"""Dispute evidence. Three moments, keyed to an order key, kept at least two years.

Page load must not carry a device fingerprint. The fingerprint arrives with
terms acceptance, after the privacy notice is on the page.
"""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime, timezone
from typing import Any

MOMENTS = ("page_load", "terms_acceptance", "payment_confirmation")
_ORDER_KEY = re.compile(r"^[0-9a-fA-F-]{16,64}$")


class EvidenceError(ValueError):
    """The moment cannot be stored as sent."""


def plus_two_years(day: date) -> date:
    try:
        return day.replace(year=day.year + 2)
    except ValueError:
        return day.replace(year=day.year + 2, day=28)


def require_order_key(value: object) -> str:
    if not isinstance(value, str) or not _ORDER_KEY.match(value.strip()):
        raise EvidenceError("order_key must be a 16–64 character token")
    token = value.strip()
    try:
        uuid.UUID(token)
    except ValueError as exc:
        raise EvidenceError("order_key must be a UUID") from exc
    return token


def _require_str(payload: dict, key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise EvidenceError(f"{key} is required")
    return value.strip()


def normalize_moment(
    *,
    moment: str,
    order_key: str,
    payload: dict,
    client_host: str | None,
    terms_version: str,
    privacy_version: str,
    now: datetime | None = None,
) -> dict[str, Any]:
    if moment not in MOMENTS:
        raise EvidenceError(f"unknown moment {moment!r}")
    if not isinstance(payload, dict):
        raise EvidenceError("payload must be an object")
    key = require_order_key(order_key)
    moment_now = now or datetime.now(timezone.utc)
    if moment_now.tzinfo is None:
        moment_now = moment_now.replace(tzinfo=timezone.utc)
    received = moment_now.isoformat()
    body = dict(payload)
    if moment == "page_load":
        if "device_fingerprint" in body:
            raise EvidenceError("page load must not include a device fingerprint")
        _require_str(body, "user_agent")
        referrer = body.get("referrer")
        if referrer is not None and not isinstance(referrer, str):
            raise EvidenceError("referrer must be a string or null")
        stored = {
            "user_agent": body["user_agent"].strip(),
            "referrer": referrer.strip() if isinstance(referrer, str) else None,
            "client_sent_at": body.get("client_sent_at"),
            "ip": (client_host or "").strip() or None,
            "server_received_at": received,
        }
    elif moment == "terms_acceptance":
        if body.get("checkbox") is not True:
            raise EvidenceError("terms checkbox must be true")
        if _require_str(body, "terms_version") != terms_version:
            raise EvidenceError("terms_version does not match the offer config")
        if _require_str(body, "privacy_notice_version") != privacy_version:
            raise EvidenceError("privacy_notice_version does not match the offer config")
        _require_str(body, "device_fingerprint")
        _require_str(body, "rendered_checkout_sha256")
        stored = {
            "terms_version": terms_version,
            "privacy_notice_version": privacy_version,
            "checkbox": True,
            "clicked_at": _require_str(body, "clicked_at"),
            "device_fingerprint": body["device_fingerprint"].strip(),
            "rendered_checkout_sha256": body["rendered_checkout_sha256"].strip(),
            "server_received_at": received,
        }
    else:
        stored = {
            "woo_order_id": _require_str(body, "woo_order_id"),
            "charge_id": body.get("charge_id") if isinstance(body.get("charge_id"), str) else None,
            "charge_source": "woo_handoff",
            "rendered_checkout_sha256": _require_str(body, "rendered_checkout_sha256"),
            "server_received_at": received,
        }
    return {
        "order_key": key,
        "moment": moment,
        "woo_order_id": stored.get("woo_order_id"),
        "payload": stored,
        "retain_until": plus_two_years(moment_now.date()).isoformat(),
        "created_at": received,
    }


def assemble(order_key: str, events: list[dict], usage: dict) -> dict[str, Any]:
    """Build one package. A dead usage source is stale, never 'did nothing'."""
    key = require_order_key(order_key)
    by_moment: dict[str, dict] = {}
    for event in events:
        if event.get("order_key") != key:
            continue
        by_moment[event["moment"]] = event
    if not isinstance(usage, dict) or "ok" not in usage:
        raise EvidenceError("usage must say ok true or false")
    if usage.get("ok") is True:
        weeks = usage.get("weeks")
        if not isinstance(weeks, list):
            raise EvidenceError("usage.weeks must be a list when ok is true")
        usage_block = {"stale": False, "freshness": "live", "weeks": weeks}
    else:
        reason = usage.get("reason")
        if not isinstance(reason, str) or not reason.strip():
            raise EvidenceError("a failed usage source needs a reason")
        usage_block = {"stale": True, "freshness": reason.strip(), "weeks": None}
    package = {
        "order_key": key,
        "woo_order_id": (by_moment.get("payment_confirmation") or {}).get("woo_order_id"),
        "moments": {name: by_moment.get(name) for name in MOMENTS},
        "complete": all(name in by_moment for name in MOMENTS),
        "usage": usage_block,
    }
    rendered = json_dumps(package)
    if "did nothing" in rendered.lower():
        raise EvidenceError("evidence package must not claim the member did nothing")
    return package


def json_dumps(package: dict) -> str:
    import json

    return json.dumps(package, sort_keys=True)
