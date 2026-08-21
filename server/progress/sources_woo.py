"""WooCommerce source — read-only REST pull of orders, subscriptions, products.

Read-only key pair, fail loud on missing config (platform doctrine). The client
normalises into the flat records `progress.metrics` expects and does nothing
clever: no derived numbers live here, so the maths stays testable in isolation.

Field names matter. WooCommerce Subscriptions v3 exposes schedule dates as
`start_date_gmt` / `cancelled_date_gmt` / `end_date_gmt` — the unsuffixed
`start_date` keys exist but are always null. Verified against the live API
2026-08-21.
"""

from __future__ import annotations

import datetime as dt
import logging
import os

import httpx

log = logging.getLogger("labs.progress.woo")

PER_PAGE = 100
MAX_PAGES = 60  # 6,000 records — a hard stop, never a silent truncation
DEFAULT_TIMEOUT = 60


class WooError(RuntimeError):
    """WooCommerce is unreachable or misconfigured."""


def _cfg() -> tuple[str, str, str, int]:
    base = os.environ.get("LABS_WOO_API_URL", "").strip().rstrip("/")
    key = os.environ.get("LABS_WOO_CONSUMER_KEY", "").strip()
    secret = os.environ.get("LABS_WOO_CONSUMER_SECRET", "").strip()
    if not (base and key and secret):
        raise WooError(
            "WooCommerce source needs LABS_WOO_API_URL, LABS_WOO_CONSUMER_KEY "
            "and LABS_WOO_CONSUMER_SECRET"
        )
    try:
        timeout = int(os.environ.get("LABS_WOO_TIMEOUT", DEFAULT_TIMEOUT))
    except ValueError as exc:
        raise WooError("LABS_WOO_TIMEOUT must be an integer") from exc
    return base, key, secret, timeout


def _pages(client: httpx.Client, base: str, path: str, params: dict) -> list[dict]:
    out: list[dict] = []
    for page in range(1, MAX_PAGES + 1):
        q = dict(params, per_page=PER_PAGE, page=page)
        resp = client.get(f"{base}/{path}", params=q)
        if resp.status_code >= 400:
            raise WooError(f"{path} page {page} returned HTTP {resp.status_code}")
        batch = resp.json()
        if not isinstance(batch, list):
            raise WooError(f"{path} page {page} did not return a list")
        out.extend(batch)
        if len(batch) < PER_PAGE:
            return out
    raise WooError(
        f"{path} exceeded {MAX_PAGES} pages — refusing to report a truncated set"
    )


def _clean(value) -> str | None:
    text = str(value or "").strip()
    return text.replace("T", " ") if text else None


def fetch(months: int = 8, now: dt.datetime | None = None) -> dict:
    """Pull everything the Progress page needs. Raises WooError on any failure."""
    base, key, secret, timeout = _cfg()
    now = now or dt.datetime.utcnow()
    after = (dt.datetime(now.year, now.month, 1) - dt.timedelta(days=31 * months)).isoformat()

    with httpx.Client(auth=(key, secret), timeout=timeout,
                      headers={"Accept": "application/json"}) as client:
        raw_products = _pages(client, base, "products", {"status": "publish"})
        raw_subs = _pages(client, base, "subscriptions", {})
        raw_orders = _pages(client, base, "orders",
                            {"after": after, "status": "completed,processing"})

    prices = {
        str(p.get("name")): float(p.get("price") or 0)
        for p in raw_products if p.get("name") and p.get("price")
    }

    subs = []
    for s in raw_subs:
        items = s.get("line_items") or []
        product = str(items[0].get("name")) if items else None
        if not product:
            continue
        subs.append({
            "id": s.get("id"),
            "product": product,
            "status": str(s.get("status") or ""),
            "customer_id": s.get("customer_id"),
            "recurring_total": float(s.get("total") or 0),
            "start_at": _clean(s.get("start_date_gmt")) or _clean(s.get("date_created_gmt")),
            "cancelled_at": _clean(s.get("cancelled_date_gmt")),
            "ends_at": _clean(s.get("end_date_gmt")),
            "next_payment_at": _clean(s.get("next_payment_date_gmt")),
            "billing_period": s.get("billing_period"),
        })

    orders = []
    for o in raw_orders:
        created = _clean(o.get("date_created_gmt")) or _clean(o.get("date_created"))
        for item in (o.get("line_items") or []):
            orders.append({
                "id": o.get("id"),
                "created_at": created,
                "customer_id": o.get("customer_id"),
                "product": str(item.get("name") or "unknown"),
                "line_total": float(item.get("total") or 0),
            })

    log.info("woo fetch: %d subs, %d order lines, %d products",
             len(subs), len(orders), len(prices))
    return {"subscriptions": subs, "orders": orders, "prices": prices,
            "counts": {"subscriptions": len(subs), "order_lines": len(orders)}}
