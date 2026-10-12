"""Signed handoff to WooCommerce checkout. The URL carries a product id, never a price."""

from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from front_door.member_state import visible_products
from front_door.offers import product_by_id

_PRICE_KEYS = frozenset({"price", "amount", "cents", "price_cents", "total"})
_MIN_SECRET = 16


class HandoffError(ValueError):
    """The handoff cannot be built. The caller must not invent a URL."""


def checkout_url(base: str, woo_product_id: int) -> str:
    parts = urlsplit(base)
    if parts.scheme != "https" or not parts.netloc:
        raise HandoffError("woo_checkout_base must be https")
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    banned = [key for key in query if key.lower() in _PRICE_KEYS]
    if banned:
        raise HandoffError(f"checkout URL must not carry a price ({banned[0]})")
    query["add-to-cart"] = str(int(woo_product_id))
    url = urlunsplit((parts.scheme, parts.netloc, parts.path or "/", urlencode(query), ""))
    keys = {key.lower() for key, _ in parse_qsl(urlsplit(url).query)}
    if keys & _PRICE_KEYS:
        raise HandoffError("handoff URL gained a price parameter")
    if "add-to-cart" not in keys:
        raise HandoffError("handoff URL is missing add-to-cart")
    return url


def sign_handoff(secret: str, product_id: str, woo_product_id: int, issued_at: int) -> str:
    if not secret or len(secret) < _MIN_SECRET:
        raise HandoffError(
            "FRONT_DOOR_HANDOFF_SECRET is missing or shorter than 16 characters"
        )
    message = f"{product_id}|{int(woo_product_id)}|{int(issued_at)}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def build_handoff(
    *,
    offers: dict,
    product_id: str,
    state: str,
    secret: str,
    issued_at: datetime | None = None,
) -> dict:
    if not isinstance(product_id, str) or not product_id.strip():
        raise HandoffError("product_id is required")
    product = product_by_id(offers, product_id.strip())
    if product is None or not product["enabled"]:
        raise HandoffError("unknown product")
    allowed = {p["id"] for p in visible_products(state, offers)}
    if product["id"] not in allowed:
        raise HandoffError("that product is not offered for this membership state")
    if not product["woo_product_id"]:
        raise HandoffError("product has no WooCommerce id")
    moment = issued_at or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    stamp = int(moment.timestamp())
    url = checkout_url(offers["woo_checkout_base"], int(product["woo_product_id"]))
    signature = sign_handoff(secret, product["id"], int(product["woo_product_id"]), stamp)
    return {
        "url": url,
        "product_id": product["id"],
        "woo_product_id": int(product["woo_product_id"]),
        "issued_at": stamp,
        "signature": signature,
        "state": state,
    }
