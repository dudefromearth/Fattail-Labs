"""PayPal vaulted merchant-initiated billing.  Spec §6.2.

PayPal is ~29% of the FatTail book, so it ships with Stripe in v1, not after it
(§9.0). Like Stripe, PayPal's own Subscriptions API is NOT used — Labs owns the
schedule and PayPal holds only a vault token. That is already how WooCommerce
works today: every subscription product has
_ppcp_enable_subscription_product = no.

⚠️ WHEN BUILDING FOR REAL, PORT THE REQUEST SHAPE FROM PPCP's PHP, not from docs.
The WooCommerce PayPal Payments plugin makes these exact calls successfully
against merchant M22DBMQN686X8 every day. Its request builder is ground truth
for field names and the stored_credential block; this module is written from the
documented contract and should be reconciled against it before the pilot.
"""

from __future__ import annotations

import logging
import time

import httpx

from billing.providers.base import (
    ChargeResult, ProviderError, RefundResult,
    PENDING, SOFT_DECLINE, SUCCEEDED, classify, minor_to_decimal_string,
)

log = logging.getLogger("labs.billing.paypal")

LIVE = "https://api-m.paypal.com"
SANDBOX = "https://api-m.sandbox.paypal.com"
_TIMEOUT = httpx.Timeout(20.0, connect=10.0)


def build_order_body(*, vault_id: str = "", amount_minor: int, currency: str,
                     invoice_id: str, charge_id: str = "",
                     descriptor: str = "", save_for_future: bool = False,
                     customer_id: str = "", return_url: str = "",
                     cancel_url: str = "") -> dict:
    """The exact order body for a vaulted merchant-initiated charge.

    Pure, so the shape is unit-testable without credentials. Two things matter:

    stored_credential MERCHANT/RECURRING/SUBSEQUENT tells PayPal the customer is
    not present. Omitting it raises decline rates and misrepresents the charge.

    invoice_id is a PERMANENT provider-side duplicate guard — PayPal rejects a
    repeated invoice_id for the same merchant, with no 24-hour expiry. Stripe
    offers nothing equivalent, so this is the stronger of the two providers'
    safety nets and must not be dropped.
    """
    unit = {
        "amount": {"currency_code": currency.upper(),
                   "value": minor_to_decimal_string(amount_minor, currency)},
        "custom_id": str(charge_id)[:127],
        "invoice_id": invoice_id[:127],
    }
    if descriptor:
        unit["description"] = descriptor[:127]
    if save_for_future:
        # FIRST purchase: the member approves in their PayPal window and we ask
        # PayPal to keep the token ON SUCCESS. usage_type MERCHANT is what makes
        # the saved token chargeable by us later without the member present —
        # without it the vault entry exists but every renewal is refused.
        paypal: dict = {
            "attributes": {
                "vault": {
                    "store_in_vault": "ON_SUCCESS",
                    "usage_type": "MERCHANT",
                    "customer_type": "CONSUMER",
                    "permit_multiple_payment_tokens": False,
                },
            },
            "experience_context": {
                "shipping_preference": "NO_SHIPPING",
                "user_action": "PAY_NOW",
                **({"return_url": return_url} if return_url else {}),
                **({"cancel_url": cancel_url} if cancel_url else {}),
            },
        }
        if customer_id:
            paypal["attributes"]["customer"] = {"id": customer_id}
        return {"intent": "CAPTURE", "purchase_units": [unit],
                "payment_source": {"paypal": paypal}}

    # RENEWAL: charge the stored token with no member present.
    return {
        "intent": "CAPTURE",
        "purchase_units": [unit],
        "payment_source": {"paypal": {
            "vault_id": vault_id,
            "stored_credential": {
                "payment_initiator": "MERCHANT",
                "payment_type": "RECURRING",
                "usage": "SUBSEQUENT",
            },
        }},
    }


class PayPalProvider:
    name = "paypal"

    def __init__(self, client_id: str, client_secret: str, *, api_base: str = LIVE):
        if not client_id or not client_secret:
            raise ValueError("PayPalProvider requires client_id and client_secret")
        self._id, self._secret, self._base = client_id, client_secret, api_base.rstrip("/")
        self._token = ""
        self._token_expires = 0.0

    # --- auth -----------------------------------------------------------------

    def _access_token(self) -> str:
        """Cached client-credentials token. PayPal tokens last ~9h; refresh at 60s
        of remaining life so a long worker cycle cannot expire mid-run."""
        if self._token and time.monotonic() < self._token_expires - 60:
            return self._token
        try:
            r = httpx.post(f"{self._base}/v1/oauth2/token",
                           auth=(self._id, self._secret),
                           data={"grant_type": "client_credentials"},
                           timeout=_TIMEOUT)
        except httpx.HTTPError as exc:
            raise ProviderError(f"paypal token transport: {exc}") from exc
        if r.status_code != 200:
            raise ProviderError(f"paypal token failed {r.status_code}: {r.text[:200]}")
        d = r.json()
        self._token = d["access_token"]
        self._token_expires = time.monotonic() + float(d.get("expires_in", 3600))
        return self._token

    def _headers(self, request_id: str = "") -> dict:
        h = {"Authorization": f"Bearer {self._access_token()}",
             "Content-Type": "application/json"}
        if request_id:
            h["PayPal-Request-Id"] = request_id
        return h

    def _call(self, method: str, path: str, *, request_id: str = "",
              json: dict | None = None) -> httpx.Response:
        try:
            return httpx.request(method, f"{self._base}{path}",
                                 headers=self._headers(request_id), json=json,
                                 timeout=_TIMEOUT)
        except httpx.HTTPError as exc:
            # §7.15 — transport, never a decline.
            raise ProviderError(f"paypal transport {method} {path}: {exc}") from exc

    # --- charge ---------------------------------------------------------------

    def charge(self, *, customer_ref: str, method_ref: str, amount_minor: int,
               currency: str, idempotency_key: str, descriptor: str = "",
               metadata: dict | None = None) -> ChargeResult:
        """Create an order against the vaulted token, then capture it.

        invoice_id is set to the idempotency key, which gives a PERMANENT
        provider-side duplicate guard that Stripe does not offer: PayPal rejects
        a repeated invoice_id for the same merchant, with no 24-hour expiry.
        """
        body = build_order_body(
            vault_id=method_ref, amount_minor=amount_minor, currency=currency,
            invoice_id=idempotency_key,
            charge_id=str((metadata or {}).get("labs_charge_id", "")),
            descriptor=descriptor)
        r = self._call("POST", "/v2/checkout/orders", request_id=idempotency_key, json=body)

        if r.status_code == 422 and "DUPLICATE_INVOICE_ID" in r.text:
            # The charge already exists. NEVER create a second one — resolve it.
            log.warning("paypal duplicate invoice_id for %s — resolving existing", idempotency_key)
            found = self.lookup(idempotency_key=idempotency_key)
            return found or ChargeResult(PENDING, message="duplicate invoice; outcome unresolved")
        if r.status_code >= 500:
            raise ProviderError(f"paypal order {r.status_code}: {r.text[:200]}")
        if r.status_code not in (200, 201):
            return self._from_error(r)

        order = r.json()
        order_id = order.get("id", "")

        cap = self._call("POST", f"/v2/checkout/orders/{order_id}/capture",
                         request_id=f"{idempotency_key}:cap", json={})
        if cap.status_code >= 500:
            # The order EXISTS. Report it so the ledger keeps the id and recovery
            # can resolve it, rather than losing the reference entirely.
            raise ProviderError(
                f"paypal capture {cap.status_code} on order {order_id}: {cap.text[:160]}")
        if cap.status_code not in (200, 201):
            res = self._from_error(cap)
            res.intent_ref = order_id
            return res
        return self._from_capture(cap.json(), order_id)

    def _from_capture(self, data: dict, order_id: str) -> ChargeResult:
        caps = (((data.get("purchase_units") or [{}])[0].get("payments") or {})
                .get("captures") or [])
        cap = caps[0] if caps else {}
        status = (cap.get("status") or data.get("status") or "").upper()
        ref = cap.get("id", "")
        if status in ("COMPLETED", "PARTIALLY_REFUNDED"):
            return ChargeResult(SUCCEEDED, charge_ref=ref, intent_ref=order_id, raw=data)
        if status in ("PENDING", "IN_PROGRESS"):
            # §6.2 — async capture. Treat as processing and NEVER retry; the
            # PAYMENT.CAPTURE.COMPLETED webhook settles it.
            return ChargeResult(PENDING, charge_ref=ref, intent_ref=order_id,
                                message=f"capture {status}", raw=data)
        if status == "DECLINED":
            reason = ((cap.get("status_details") or {}).get("reason") or "")
            return ChargeResult(classify(reason) or SOFT_DECLINE, intent_ref=order_id,
                                decline_code=reason, message="capture declined", raw=data)
        return ChargeResult(SOFT_DECLINE, intent_ref=order_id,
                            message=f"unexpected capture status {status}", raw=data)

    def _from_error(self, r: httpx.Response) -> ChargeResult:
        try:
            d = r.json()
        except ValueError:
            return ChargeResult(SOFT_DECLINE, message=f"http {r.status_code}: {r.text[:160]}")
        issue = ""
        details = d.get("details") or []
        if details:
            issue = details[0].get("issue", "")
        issue = issue or d.get("name", "")
        return ChargeResult(classify(issue), decline_code=issue,
                            message=d.get("message", "")[:400], raw=d)

    # --- recovery -------------------------------------------------------------

    def lookup(self, *, idempotency_key: str,
               charge_ref: str | None = None) -> ChargeResult | None:
        """§7.2 — 'did this actually charge?' Returns None for 'cannot say',
        which quarantines rather than retrying."""
        try:
            if charge_ref:
                r = self._call("GET", f"/v2/payments/captures/{charge_ref}")
                if r.status_code == 200:
                    cap = r.json()
                    status = (cap.get("status") or "").upper()
                    if status in ("COMPLETED", "PARTIALLY_REFUNDED"):
                        return ChargeResult(SUCCEEDED, charge_ref=charge_ref, raw=cap)
                    if status in ("PENDING", "IN_PROGRESS"):
                        return ChargeResult(PENDING, charge_ref=charge_ref, raw=cap)
                    return ChargeResult(SOFT_DECLINE, charge_ref=charge_ref,
                                        message=f"capture {status}", raw=cap)
            # Replaying PayPal-Request-Id returns the ORIGINAL response, so this
            # is a safe read rather than a second charge.
            r = self._call("POST", "/v2/checkout/orders",
                           request_id=idempotency_key, json=None)
            if r.status_code == 422 and "DUPLICATE_INVOICE_ID" in r.text:
                # An order exists but we cannot see its capture state from here.
                log.error("paypal: order exists for %s but outcome unknown", idempotency_key)
                return None
        except ProviderError as exc:
            log.error("paypal lookup transport failure: %s", exc)
            return None
        return None

    # --- webhooks -------------------------------------------------------------

    def verify_webhook(self, *, webhook_id: str, headers: dict, body: bytes) -> bool:
        """§6.3 — PayPal signature verification is an API CALL, not a local HMAC.

        Unlike Stripe, this needs working credentials as well as the webhook id,
        so a credential rotation breaks webhook verification too. Fails CLOSED:
        anything we cannot positively verify is rejected.
        """
        import json as _json
        need = ["paypal-transmission-id", "paypal-transmission-time",
                "paypal-cert-url", "paypal-auth-algo", "paypal-transmission-sig"]
        h = {k.lower(): v for k, v in headers.items()}
        if not all(h.get(k) for k in need):
            log.warning("paypal webhook missing signature headers")
            return False
        try:
            payload = {
                "transmission_id": h["paypal-transmission-id"],
                "transmission_time": h["paypal-transmission-time"],
                "cert_url": h["paypal-cert-url"],
                "auth_algo": h["paypal-auth-algo"],
                "transmission_sig": h["paypal-transmission-sig"],
                "webhook_id": webhook_id,
                "webhook_event": _json.loads(body.decode("utf-8")),
            }
            r = self._call("POST", "/v1/notifications/verify-webhook-signature", json=payload)
        except (ProviderError, ValueError) as exc:
            log.error("paypal webhook verification failed: %s", exc)
            return False
        if r.status_code != 200:
            log.error("paypal verify returned %s: %s", r.status_code, r.text[:200])
            return False
        return (r.json().get("verification_status") or "").upper() == "SUCCESS"

    # --- refunds --------------------------------------------------------------

    def refund(self, *, charge_ref: str, amount_minor: int,
               idempotency_key: str, reason: str = "") -> RefundResult:
        body = {"amount": {"currency_code": "USD",
                           "value": minor_to_decimal_string(amount_minor)}}
        if reason:
            body["note_to_payer"] = reason[:255]
        try:
            r = self._call("POST", f"/v2/payments/captures/{charge_ref}/refund",
                           request_id=idempotency_key, json=body)
        except ProviderError as exc:
            return RefundResult(False, message=str(exc))
        if r.status_code in (200, 201):
            d = r.json()
            return RefundResult(True, refund_ref=d.get("id", ""), message=d.get("status", ""))
        return RefundResult(False, message=f"http {r.status_code}: {r.text[:200]}")
