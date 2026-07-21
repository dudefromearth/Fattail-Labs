"""Native billing — Stripe as the third pluggable provider
(Native Billing Spec v1.0). Stripe hosts all payment surfaces; the webhook is
the source of membership truth; everything is config-gated.

Webhook handlers are deliberately processable WITHOUT Stripe API calls: the
event payloads carry customer id, price id, and status — so the full lifecycle
verifies offline with a signing secret alone.
"""

import time

import stripe
from fastapi import APIRouter, HTTPException, Request

import db
import identity
from config import get_config
from routes.member import require_session

router = APIRouter(tags=["billing"])

PROVIDER = "stripe"
PRICE_CACHE_TTL = 600
_price_cache: dict[str, tuple[float, dict]] = {}

ACTIVE_STATUSES = {"active", "trialing"}
GRACE_STATUSES = {"past_due"}
EXPIRED_STATUSES = {"canceled", "unpaid", "incomplete_expired", "incomplete", "paused"}


def _enabled() -> bool:
    return get_config().stripe_secret_key is not None


def _require_enabled() -> None:
    if not _enabled():
        raise HTTPException(status_code=503, detail="Billing is not configured")


def _web_origin() -> str:
    origin = get_config().web_origin
    if not origin:
        raise HTTPException(status_code=503, detail="LABS_WEB_ORIGIN is not configured")
    return origin.rstrip("/")


def _stripe_mappings(cur) -> list[dict]:
    cur.execute(
        """SELECT ppm.external_key AS price_id, p.id AS plan_id, p.slug, p.name,
                  p.grants_role
           FROM provider_plan_map ppm JOIN plans p ON ppm.plan_id = p.id
           WHERE ppm.provider = %s""",
        (PROVIDER,),
    )
    return cur.fetchall()


def _price_details(price_id: str) -> dict | None:
    """Amount/interval from Stripe, cached in-process. None when unavailable."""
    now = time.monotonic()
    hit = _price_cache.get(price_id)
    if hit and now - hit[0] < PRICE_CACHE_TTL:
        return hit[1]
    try:
        stripe.api_key = get_config().stripe_secret_key
        price = stripe.Price.retrieve(price_id)
        detail = {
            "amount": price["unit_amount"],
            "currency": price["currency"],
            "interval": (price.get("recurring") or {}).get("interval"),
        }
        _price_cache[price_id] = (now, detail)
        return detail
    except Exception:
        return None


@router.get("/api/billing/plans")
def billing_plans() -> dict:
    """Tier cards always render (display_json is the source); live prices/checkout
    attach only when billing is enabled and prices are mapped."""
    import json as _json
    enabled = _enabled()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT slug, name, grants_role, display_json FROM plans
                   WHERE display_json IS NOT NULL"""
            )
            plan_rows = cur.fetchall()
            mappings = _stripe_mappings(cur) if enabled else []

    prices_by_slug: dict[str, list] = {}
    for m in mappings:
        detail = _price_details(m["price_id"]) or {}
        prices_by_slug.setdefault(m["slug"], []).append(
            {"price_id": m["price_id"], **detail}
        )
    plans = []
    for row in plan_rows:
        display = row["display_json"]
        if isinstance(display, (str, bytes)):
            display = _json.loads(display)
        plans.append(
            {
                "slug": row["slug"],
                "name": row["name"],
                "grants_role": row["grants_role"],
                "display": display,
                "prices": prices_by_slug.get(row["slug"], []),
            }
        )
    # Featured first, promo-only last.
    plans.sort(key=lambda p: (not p["display"].get("featured", False),
                              p["display"].get("promo_only", False)))
    return {"enabled": enabled, "plans": plans}


@router.post("/api/billing/checkout")
async def create_checkout(request: Request) -> dict:
    _require_enabled()
    claims = require_session(request)
    body = await request.json()
    price_id = (body.get("price_id") or "").strip()

    with db.transaction() as conn:
        with conn.cursor() as cur:
            mapped = {m["price_id"] for m in _stripe_mappings(cur)}
            if price_id not in mapped:
                raise HTTPException(status_code=422, detail="Unknown price")
            customer_id = identity.resolve_stripe_customer(cur, claims["identity_id"])
            cur.execute(
                "SELECT email FROM identities WHERE identity_id = %s",
                (claims["identity_id"],),
            )
            row = cur.fetchone()
            email = row["email"] if row else None

    origin = _web_origin()
    stripe.api_key = get_config().stripe_secret_key
    params: dict = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": f"{origin}/membership?status=success",
        "cancel_url": f"{origin}/membership?status=cancelled",
        "metadata": {"identity_id": str(claims["identity_id"])},
        "subscription_data": {"metadata": {"identity_id": str(claims["identity_id"])}},
    }
    if customer_id:
        params["customer"] = customer_id
    elif email:
        params["customer_email"] = email
    try:
        session = stripe.checkout.Session.create(**params)
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message or exc}") from exc
    return {"url": session["url"]}


@router.post("/api/billing/portal")
def create_portal(request: Request) -> dict:
    _require_enabled()
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            customer_id = identity.resolve_stripe_customer(cur, claims["identity_id"])
    if not customer_id:
        raise HTTPException(status_code=404, detail="No billing account")
    stripe.api_key = get_config().stripe_secret_key
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id, return_url=f"{_web_origin()}/me"
        )
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message or exc}") from exc
    return {"url": session["url"]}


# --- webhook (source of membership truth) -------------------------------------

def _membership_status(sub_status: str) -> str | None:
    if sub_status in ACTIVE_STATUSES:
        return "active"
    if sub_status in GRACE_STATUSES:
        return "grace"
    if sub_status in EXPIRED_STATUSES:
        return "expired"
    return None


def _handle_subscription(cur, sub: dict) -> str:
    customer_id = sub.get("customer")
    identity_id = identity.resolve_by_link(cur, PROVIDER, customer_id or "")
    if identity_id is None:
        meta_identity = (sub.get("metadata") or {}).get("identity_id")
        if meta_identity and str(meta_identity).isdigit():
            identity_id = int(meta_identity)
            if customer_id:
                identity.ensure_link(cur, identity_id, PROVIDER, customer_id)
    if identity_id is None:
        return "no identity for customer"

    items = ((sub.get("items") or {}).get("data")) or []
    price_id = None
    for item in items:
        price_id = ((item.get("price") or {}).get("id"))
        if price_id:
            break
    if not price_id:
        return "no price in subscription"
    plan_id = identity.plan_id_for_provider_key(cur, PROVIDER, price_id)
    if plan_id is None:
        return f"unmapped price {price_id}"

    status = _membership_status(sub.get("status") or "")
    if status is None:
        return f"ignored status {sub.get('status')}"
    granted_alumni = False
    if status == "expired":
        # Tenure check BEFORE overwriting: >=28 days earns the alumni year.
        cur.execute(
            """SELECT started_at FROM memberships
               WHERE identity_id = %s AND plan_id = %s AND source = %s""",
            (identity_id, plan_id, PROVIDER),
        )
        row = cur.fetchone()
        if row:
            granted_alumni = identity.maybe_grant_alumni(
                cur, identity_id, row["started_at"]
            )
    identity.upsert_membership(
        cur, identity_id, plan_id, status, PROVIDER, external_ref=sub.get("id")
    )
    return f"membership {status}" + (" + alumni granted" if granted_alumni else "")


@router.post("/api/billing/webhook")
async def stripe_webhook(request: Request) -> dict:
    secret = get_config().stripe_webhook_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Billing webhook not configured")
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    try:
        # SDK used for signature verification ONLY; we handle plain JSON after,
        # avoiding StripeObject accessor quirks.
        stripe.Webhook.construct_event(payload, signature, secret)
    except (stripe.error.SignatureVerificationError, ValueError) as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    import json as _json
    data = _json.loads(payload)
    kind = data.get("type") or ""
    obj = (data.get("data") or {}).get("object") or {}
    result = "ignored"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if kind == "checkout.session.completed":
                meta_identity = (obj.get("metadata") or {}).get("identity_id")
                customer_id = obj.get("customer")
                if meta_identity and str(meta_identity).isdigit() and customer_id:
                    identity.ensure_link(
                        cur, int(meta_identity), PROVIDER, customer_id
                    )
                    result = "customer linked"
            elif kind in (
                "customer.subscription.created",
                "customer.subscription.updated",
                "customer.subscription.deleted",
            ):
                sub = dict(obj)
                if kind == "customer.subscription.deleted":
                    sub["status"] = "canceled"
                result = _handle_subscription(cur, sub)
    return {"received": True, "result": result}
