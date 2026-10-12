"""WooCommerce payment-state read for the migration window.

Unset Woo credentials raise WooUnavailable. The route turns that into
"sign in to check" and does not show a buy button. This module does not
import progress.sources_woo.
"""

from __future__ import annotations

import os

from front_door.member_state import anonymous_facts


class WooUnavailable(RuntimeError):
    """Payment state cannot be read. Do not guess a member state."""


def woo_configured(env: dict | None = None) -> bool:
    source = env if env is not None else os.environ
    return bool(
        source.get("LABS_WOO_API_URL", "").strip()
        and source.get("LABS_WOO_CONSUMER_KEY", "").strip()
        and source.get("LABS_WOO_CONSUMER_SECRET", "").strip()
    )


def _cfg(env: dict | None = None) -> tuple[str, str, str, float]:
    source = env if env is not None else os.environ
    base = source.get("LABS_WOO_API_URL", "").strip().rstrip("/")
    key = source.get("LABS_WOO_CONSUMER_KEY", "").strip()
    secret = source.get("LABS_WOO_CONSUMER_SECRET", "").strip()
    if not (base and key and secret):
        raise WooUnavailable(
            "WooCommerce read needs LABS_WOO_API_URL, LABS_WOO_CONSUMER_KEY, "
            "and LABS_WOO_CONSUMER_SECRET"
        )
    try:
        timeout = float(source.get("LABS_WOO_TIMEOUT", "8").strip() or "8")
    except ValueError as exc:
        raise WooUnavailable("LABS_WOO_TIMEOUT must be a number") from exc
    return base, key, secret, timeout


def facts_from_records(offers: dict, records: dict) -> dict:
    """Pure map from a normalized Woo snapshot to classifier facts."""
    if not records.get("customer_found"):
        return anonymous_facts()
    by_woo = {
        int(p["woo_product_id"]): p["id"]
        for p in offers["products"]
        if p.get("woo_product_id")
    }
    subs = records.get("subscriptions") or []
    if not isinstance(subs, list):
        raise WooUnavailable("subscriptions must be a list")
    active = None
    for sub in subs:
        status = str(sub.get("status") or "")
        woo_id = sub.get("woo_product_id")
        if woo_id is None:
            continue
        product_id = by_woo.get(int(woo_id))
        if product_id and status in {"active", "past_due", "on-hold"}:
            mapped = "past_due" if status in {"past_due", "on-hold"} else "active"
            active = (product_id, mapped)
            break
    lifetime = bool(records.get("lifetime"))
    return {
        "has_identity": True,
        "has_membership": bool(records.get("has_membership")),
        "lifetime": lifetime,
        "subscription_product": None if active is None else active[0],
        "subscription_status": None if active is None else active[1],
        "observer_completed": bool(records.get("observer_completed")),
        "cancelled_before_completion": bool(records.get("cancelled_before_completion")),
        "payment_failed": bool(active and active[1] == "past_due"),
    }


class LiveWooLookup:
    """Read one customer by email. Fail loud on HTTP errors."""

    def __init__(self, env: dict | None = None) -> None:
        self._env = env

    def lookup(self, email: str, offers: dict) -> dict:
        import httpx

        base, key, secret, timeout = _cfg(self._env)
        try:
            with httpx.Client(auth=(key, secret), timeout=timeout) as client:
                customers = client.get(f"{base}/customers", params={"email": email, "per_page": 1})
                if customers.status_code >= 400:
                    raise WooUnavailable(f"customers returned HTTP {customers.status_code}")
                found = customers.json()
                if not isinstance(found, list):
                    raise WooUnavailable("customers did not return a list")
                if not found:
                    return anonymous_facts()
                customer_id = found[0].get("id")
                subs = client.get(
                    f"{base}/subscriptions",
                    params={"customer": customer_id, "per_page": 20},
                )
                if subs.status_code >= 400:
                    raise WooUnavailable(f"subscriptions returned HTTP {subs.status_code}")
                raw_subs = subs.json()
                if not isinstance(raw_subs, list):
                    raise WooUnavailable("subscriptions did not return a list")
                orders = client.get(
                    f"{base}/orders",
                    params={
                        "customer": customer_id,
                        "per_page": 20,
                        "status": "completed,processing",
                    },
                )
                if orders.status_code >= 400:
                    raise WooUnavailable(f"orders returned HTTP {orders.status_code}")
                raw_orders = orders.json()
                if not isinstance(raw_orders, list):
                    raise WooUnavailable("orders did not return a list")
        except WooUnavailable:
            raise
        except Exception as exc:  # noqa: BLE001 — network and parse failures
            raise WooUnavailable(f"WooCommerce read failed: {exc.__class__.__name__}") from exc
        normalized = []
        lifetime_ids = {
            int(p["woo_product_id"])
            for p in offers["products"]
            if p["id"] == "navigator-lifetime" and p.get("woo_product_id")
        }
        lifetime = False
        for sub in raw_subs:
            items = sub.get("line_items") or []
            woo_id = items[0].get("product_id") if items else None
            normalized.append({"woo_product_id": woo_id, "status": sub.get("status")})
        for order in raw_orders:
            for item in order.get("line_items") or []:
                if item.get("product_id") in lifetime_ids:
                    lifetime = True
        # Completion (day 42 + course) is not on the Woo subscription row.
        # Do not claim the IKI floor from a cancelled sub alone.
        return facts_from_records(
            offers,
            {
                "customer_found": True,
                "subscriptions": normalized,
                "lifetime": lifetime,
                "has_membership": False,
                "observer_completed": False,
                "cancelled_before_completion": False,
            },
        )
