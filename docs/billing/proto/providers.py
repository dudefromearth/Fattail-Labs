"""Native Billing v2.0 — provider adapters.  Spec §6.

Two real request builders (NOT called here — no keys, no live money) and one
scriptable fake used to prove the infrastructure handles every outcome.

The interface is narrow so a third provider is additive. lookup() is MANDATORY:
a provider we cannot interrogate after a crash cannot be used safely (§7.2).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


# --- outcomes -----------------------------------------------------------------

SUCCEEDED = "succeeded"
SOFT_DECLINE = "soft_decline"       # retry ladder
HARD_DECLINE = "hard_decline"       # skip retries, straight to "update your card"
REQUIRES_ACTION = "requires_action" # 3DS — email a confirm link
TRANSPORT_ERROR = "transport_error" # NOT a decline. Leave intent open (§7.15)
PENDING = "pending"                 # PayPal async capture. Never retry (§6.2)

SOFT_CODES = {"card_declined", "insufficient_funds", "processing_error",
              "issuer_not_available", "try_again_later"}
HARD_CODES = {"expired_card", "incorrect_number", "pickup_card",
              "card_not_supported", "lost_card", "stolen_card", "revoked"}


@dataclass
class ChargeResult:
    outcome: str
    charge_ref: str = ""
    intent_ref: str = ""
    decline_code: str = ""
    message: str = ""


def classify_stripe_error(code: str) -> str:
    """§6.1 — a transport failure must NEVER become a decline, or we start dunning
    a member whose card is fine."""
    if code == "authentication_required":
        return REQUIRES_ACTION
    if code in HARD_CODES:
        return HARD_DECLINE
    if code in SOFT_CODES:
        return SOFT_DECLINE
    if code in ("api_connection_error", "rate_limit", "api_error", "timeout"):
        return TRANSPORT_ERROR
    return SOFT_DECLINE                 # unknown: treat as retryable, never as hard


def minor_to_decimal_string(amount_minor: int, currency: str = "USD") -> str:
    """§6.2 — PayPal wants a decimal STRING. One helper, one place, never str(float).
    Unit-tested for 1997.00 / 17.00 / 160.20 / 0.00."""
    if not isinstance(amount_minor, int):
        raise TypeError("amount must be int minor units — never float")
    if amount_minor < 0:
        raise ValueError("negative amount")
    return str(Decimal(amount_minor).scaleb(-2).quantize(Decimal("0.01")))


# --- real request builders (shape only; not invoked) --------------------------

def build_stripe_request(*, customer_ref: str, method_ref: str, amount_minor: int,
                         currency: str, idempotency_key: str, descriptor: str,
                         metadata: dict) -> dict:
    """§6.1 — merchant-initiated, off-session.

    NOTE ON IDEMPOTENCY: Stripe keys expire after 24 HOURS. A retry of the same
    period a day later will NOT be deduped by Stripe. That is exactly why
    uq_chg_period_attempt is the primary defence and this key is only the
    intra-day secondary. Never invert that reliance."""
    return {
        "amount": amount_minor,
        "currency": currency.lower(),
        "customer": customer_ref,
        "payment_method": method_ref,
        "off_session": True,
        "confirm": True,
        "description": descriptor,
        "statement_descriptor_suffix": "FATTAIL",
        "metadata": metadata,
        "_idempotency_key": idempotency_key,
    }


def build_paypal_order(*, vault_id: str, amount_minor: int, currency: str,
                       charge_id: str, invoice_id: str) -> dict:
    """§6.2 — vaulted merchant-initiated.

    invoice_id gives a PERMANENT, provider-side duplicate guard that Stripe does
    not offer: PayPal rejects a repeated invoice_id for the same merchant.

    Build the production version by PORTING PPCP's own request builder. That plugin
    is making these exact calls successfully against merchant M22DBMQN686X8 today;
    its PHP is the ground truth for field names and the stored_credential block."""
    return {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {"currency_code": currency,
                        "value": minor_to_decimal_string(amount_minor, currency)},
            "custom_id": charge_id,
            "invoice_id": invoice_id,
        }],
        "payment_source": {"paypal": {
            "vault_id": vault_id,
            "stored_credential": {"payment_initiator": "MERCHANT",
                                   "payment_type": "RECURRING",
                                   "usage": "SUBSEQUENT"},
        }},
    }


# --- scriptable fake ----------------------------------------------------------

@dataclass
class FakeProvider:
    """Deterministic provider for infrastructure tests.

    `script` maps idempotency_key -> outcome (or a (outcome, code) tuple).
    Replaying a key returns the ORIGINAL result, mimicking real idempotency, which
    is what makes the crash-recovery test meaningful.
    """
    name: str = "stripe"
    script: dict = field(default_factory=dict)
    default: str = SUCCEEDED
    calls: list = field(default_factory=list)
    seen: dict = field(default_factory=dict)
    fail_lookup: bool = False

    def charge(self, *, customer_ref, method_ref, amount_minor, currency,
               idempotency_key, descriptor="", metadata=None) -> ChargeResult:
        self.calls.append(dict(key=idempotency_key, amount=amount_minor,
                               method=method_ref, currency=currency))
        if idempotency_key in self.seen:
            return self.seen[idempotency_key]          # provider-side idempotency
        spec = self.script.get(idempotency_key, self.default)
        outcome, code = spec if isinstance(spec, tuple) else (spec, "")
        if outcome == TRANSPORT_ERROR:
            raise ConnectionError("simulated provider transport failure")
        res = ChargeResult(
            outcome=outcome,
            charge_ref=f"{self.name}_ch_{len(self.seen)+1}" if outcome in (SUCCEEDED, PENDING) else "",
            intent_ref=f"{self.name}_pi_{len(self.seen)+1}",
            decline_code=code,
            message=f"simulated {outcome}",
        )
        self.seen[idempotency_key] = res
        return res

    def lookup(self, *, idempotency_key: str, charge_ref: str | None = None):
        """§7.2 — the crash-recovery question: did this actually charge?
        Returning None means 'cannot say', which must quarantine, never retry."""
        if self.fail_lookup:
            return None
        return self.seen.get(idempotency_key)

    def commit_silently(self, idempotency_key: str, outcome: str = SUCCEEDED):
        """Test helper: the provider succeeded but our process died before it could
        record the result — the exact scenario §7.2 exists for."""
        self.seen[idempotency_key] = ChargeResult(
            outcome=outcome, charge_ref=f"{self.name}_ch_orphan",
            intent_ref=f"{self.name}_pi_orphan", message="committed before crash")
