"""Offer config. Prices and optional products live in offers.json.

Missing file, broken JSON, or an enabled product without a Woo id aborts.
Environment overrides exist only for the flag, the split, and the kill switch.
An override that is present and invalid aborts. Unset means "use the file".
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Mapping
from urllib.parse import urlparse

CORE_IDS = ("observer", "navigator-annual", "navigator-lifetime")
ROLES = frozenset({"core", "optional"})
KINDS = frozenset({"subscription", "one_time"})
PRICE_MODES = frozenset({"listed", "confirmed_at_checkout"})
INTERVALS = frozenset({"week", "month", "year", None})

_BOOL = {
    "1": True,
    "true": True,
    "yes": True,
    "on": True,
    "0": False,
    "false": False,
    "no": False,
    "off": False,
}


class OfferConfigError(RuntimeError):
    """The offer file or an operational override cannot be used."""


def default_offers_path() -> Path:
    return Path(__file__).resolve().parent / "offers.json"


def _require_bool_text(name: str, raw: str) -> bool:
    value = raw.strip().lower()
    if value not in _BOOL:
        raise OfferConfigError(
            f"{name} must be 0|1|true|false|yes|no|on|off, got {raw!r}"
        )
    return _BOOL[value]


def _require_percent_text(name: str, raw: str) -> int:
    try:
        n = int(raw.strip())
    except ValueError as exc:
        raise OfferConfigError(f"{name} must be an integer 0–100, got {raw!r}") from exc
    if n < 0 or n > 100:
        raise OfferConfigError(f"{name} must be an integer 0–100, got {n}")
    return n


def _https_url(name: str, value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise OfferConfigError(f"{name} must be an https URL")
    parsed = urlparse(value.strip())
    if parsed.scheme != "https" or not parsed.netloc:
        raise OfferConfigError(f"{name} must be an https URL, got {value!r}")
    return value.strip()


def _product(raw: object, index: int) -> dict:
    if not isinstance(raw, dict):
        raise OfferConfigError(f"products[{index}] must be an object")
    pid = raw.get("id")
    if not isinstance(pid, str) or not pid.strip():
        raise OfferConfigError(f"products[{index}].id is required")
    name = raw.get("name")
    if not isinstance(name, str) or not name.strip():
        raise OfferConfigError(f"{pid}: name is required")
    role = raw.get("role")
    if role not in ROLES:
        raise OfferConfigError(f"{pid}: role must be core|optional")
    kind = raw.get("kind")
    if kind not in KINDS:
        raise OfferConfigError(f"{pid}: kind must be subscription|one_time")
    if not isinstance(raw.get("enabled"), bool):
        raise OfferConfigError(f"{pid}: enabled must be true or false")
    mode = raw.get("price_mode")
    if mode not in PRICE_MODES:
        raise OfferConfigError(f"{pid}: price_mode must be listed|confirmed_at_checkout")
    cents = raw.get("price_cents")
    if cents is not None and (not isinstance(cents, int) or isinstance(cents, bool) or cents < 0):
        raise OfferConfigError(f"{pid}: price_cents must be a non-negative integer or null")
    if mode == "listed" and not isinstance(cents, int):
        raise OfferConfigError(f"{pid}: listed price_mode requires price_cents")
    interval = raw.get("interval")
    if interval not in INTERVALS:
        raise OfferConfigError(f"{pid}: interval must be week|month|year|null")
    interval_count = raw.get("interval_count")
    if interval_count is not None and (
        not isinstance(interval_count, int) or isinstance(interval_count, bool) or interval_count < 1
    ):
        raise OfferConfigError(f"{pid}: interval_count must be a positive integer or null")
    woo = raw.get("woo_product_id")
    if woo is not None and (not isinstance(woo, int) or isinstance(woo, bool) or woo < 1):
        raise OfferConfigError(f"{pid}: woo_product_id must be a positive integer or null")
    disclosure = raw.get("disclosure")
    if not isinstance(disclosure, str) or not disclosure.strip():
        raise OfferConfigError(f"{pid}: disclosure is required")
    order = raw.get("display_order")
    if not isinstance(order, int) or isinstance(order, bool):
        raise OfferConfigError(f"{pid}: display_order must be an integer")
    if raw["enabled"]:
        if woo is None:
            raise OfferConfigError(
                f"{pid} is enabled but has no woo_product_id — switch it off or set the id"
            )
        if mode == "listed" and cents is None:
            raise OfferConfigError(f"{pid} is enabled without a listed price")
    if "trial" in disclosure.lower():
        raise OfferConfigError(f"{pid}: disclosure must not call the offer a trial")
    return {
        "id": pid.strip(),
        "name": name.strip(),
        "kind": kind,
        "role": role,
        "enabled": raw["enabled"],
        "price_cents": cents,
        "price_mode": mode,
        "currency": "usd",
        "interval": interval,
        "interval_count": interval_count,
        "woo_product_id": woo,
        "display_order": order,
        "disclosure": disclosure.strip(),
    }


def validate_offers(data: object) -> dict:
    if not isinstance(data, dict):
        raise OfferConfigError("offers root must be an object")
    for key in (
        "terms_version",
        "privacy_notice_version",
        "terms_url",
        "privacy_url",
        "woo_checkout_base",
        "woo_account_payment_methods",
        "feature_flag",
        "traffic_percent",
        "kill_switch",
        "products",
    ):
        if key not in data:
            raise OfferConfigError(f"missing offers key: {key}")
    terms = data["terms_version"]
    privacy = data["privacy_notice_version"]
    if not isinstance(terms, str) or not terms.strip():
        raise OfferConfigError("terms_version is required")
    if not isinstance(privacy, str) or not privacy.strip():
        raise OfferConfigError("privacy_notice_version is required")
    if not isinstance(data["feature_flag"], bool):
        raise OfferConfigError("feature_flag must be true or false")
    if not isinstance(data["kill_switch"], bool):
        raise OfferConfigError("kill_switch must be true or false")
    percent = data["traffic_percent"]
    if not isinstance(percent, int) or isinstance(percent, bool) or percent < 0 or percent > 100:
        raise OfferConfigError("traffic_percent must be an integer 0–100")
    vsl = data.get("vsl_url", "")
    if vsl is None:
        vsl = ""
    if not isinstance(vsl, str):
        raise OfferConfigError("vsl_url must be a string")
    if vsl.strip():
        _https_url("vsl_url", vsl)
    products_raw = data["products"]
    if not isinstance(products_raw, list) or not products_raw:
        raise OfferConfigError("products must be a non-empty list")
    products = [_product(item, i) for i, item in enumerate(products_raw)]
    ids = [p["id"] for p in products]
    if len(ids) != len(set(ids)):
        raise OfferConfigError("product ids must be unique")
    missing = [cid for cid in CORE_IDS if cid not in ids]
    if missing:
        raise OfferConfigError(f"core lineup missing: {', '.join(missing)}")
    for cid in CORE_IDS:
        product = next(p for p in products if p["id"] == cid)
        if product["role"] != "core":
            raise OfferConfigError(f"{cid} must stay role=core")
    products.sort(key=lambda p: (p["display_order"], p["id"]))
    return {
        "terms_version": terms.strip(),
        "privacy_notice_version": privacy.strip(),
        # DL-828: opaque https pointers. Any host is valid. No WordPress client.
        "terms_url": _https_url("terms_url", data["terms_url"]),
        "privacy_url": _https_url("privacy_url", data["privacy_url"]),
        "woo_checkout_base": _https_url("woo_checkout_base", data["woo_checkout_base"]),
        "woo_account_payment_methods": _https_url(
            "woo_account_payment_methods", data["woo_account_payment_methods"]
        ),
        "feature_flag": data["feature_flag"],
        "traffic_percent": percent,
        "kill_switch": data["kill_switch"],
        "vsl_url": vsl.strip(),
        "products": products,
    }


def apply_operational_overrides(offers: dict, env: Mapping[str, str]) -> dict:
    """Copy offers and apply split/flag/kill overrides. Does not change prices."""
    out = dict(offers)
    out["products"] = list(offers["products"])
    if env.get("FRONT_DOOR_TRAFFIC_PERCENT", "").strip():
        out["traffic_percent"] = _require_percent_text(
            "FRONT_DOOR_TRAFFIC_PERCENT", env["FRONT_DOOR_TRAFFIC_PERCENT"]
        )
    if env.get("FRONT_DOOR_KILL_SWITCH", "").strip():
        out["kill_switch"] = _require_bool_text(
            "FRONT_DOOR_KILL_SWITCH", env["FRONT_DOOR_KILL_SWITCH"]
        )
    if env.get("FRONT_DOOR_ENABLED", "").strip():
        out["feature_flag"] = _require_bool_text(
            "FRONT_DOOR_ENABLED", env["FRONT_DOOR_ENABLED"]
        )
    return out


def load_offers(path: Path | None = None, env: Mapping[str, str] | None = None) -> dict:
    path = path or default_offers_path()
    if not path.is_file():
        raise OfferConfigError(f"offers file missing: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise OfferConfigError(f"offers file is not valid JSON: {path}") from exc
    offers = validate_offers(data)
    return apply_operational_overrides(offers, env if env is not None else os.environ)


def enabled_products(offers: dict) -> list[dict]:
    return [p for p in offers["products"] if p["enabled"]]


def public_product(product: dict) -> dict:
    """Member payload. The Woo id stays on the server."""
    return {
        "id": product["id"],
        "name": product["name"],
        "kind": product["kind"],
        "role": product["role"],
        "price_cents": product["price_cents"],
        "price_mode": product["price_mode"],
        "currency": product["currency"],
        "interval": product["interval"],
        "interval_count": product["interval_count"],
        "display_order": product["display_order"],
        "disclosure": product["disclosure"],
    }


def public_offers(offers: dict) -> dict:
    return {
        "terms_version": offers["terms_version"],
        "privacy_notice_version": offers["privacy_notice_version"],
        "terms_url": offers["terms_url"],
        "privacy_url": offers["privacy_url"],
        "feature_flag": offers["feature_flag"],
        "traffic_percent": offers["traffic_percent"],
        "kill_switch": offers["kill_switch"],
        "vsl_url": offers["vsl_url"],
        "card_update_url": offers["woo_account_payment_methods"],
        "products": [public_product(p) for p in enabled_products(offers)],
    }


def product_by_id(offers: dict, product_id: str) -> dict | None:
    for product in offers["products"]:
        if product["id"] == product_id:
            return product
    return None
