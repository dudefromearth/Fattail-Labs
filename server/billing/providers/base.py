"""Provider-agnostic billing types.  Spec §6.

The interface is deliberately narrow so a third provider is additive:

    charge(...)  -> ChargeResult
    refund(...)  -> RefundResult
    lookup(...)  -> ChargeResult | None     MANDATORY

lookup() is not optional. A provider we cannot interrogate after a crash cannot
be used safely: §7.2 resolves an open charge by ASKING the provider what
happened, never by retrying and hoping.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

# --- outcomes -----------------------------------------------------------------

SUCCEEDED = "succeeded"
SOFT_DECLINE = "soft_decline"        # retry ladder §7.4
HARD_DECLINE = "hard_decline"        # skip the ladder, ask for a new method
REQUIRES_ACTION = "requires_action"  # 3DS §7.6 — NOT a decline
TRANSPORT_ERROR = "transport_error"  # §7.15 — NOT a decline. Leave the intent open
PENDING = "pending"                  # PayPal async capture §6.2 — never retry

SOFT_CODES = {
    "card_declined", "insufficient_funds", "processing_error",
    "issuer_not_available", "try_again_later", "generic_decline",
    "reenter_transaction", "approve_with_id", "call_issuer",
    "INSTRUMENT_DECLINED", "TRANSACTION_REFUSED",
}
HARD_CODES = {
    "expired_card", "incorrect_number", "invalid_number", "pickup_card",
    "card_not_supported", "lost_card", "stolen_card", "revoked",
    "restricted_card", "invalid_account", "card_velocity_exceeded",
    "PAYER_CANNOT_PAY", "PAYMENT_SOURCE_CANNOT_BE_USED",
    "PAYMENT_SOURCE_DECLINED_BY_PROCESSOR",
}
TRANSPORT_CODES = {
    "api_connection_error", "api_error", "rate_limit", "timeout",
    "lock_timeout", "INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE",
}


class ProviderError(Exception):
    """A transport-level failure. NEVER a decline — see §7.15.

    Raising this leaves the ledger row open so recovery (§7.2) resolves it, and
    leaves next_charge_at untouched so §5.1 re-picks it up. Recording it as a
    decline would start dunning a member whose card is perfectly fine.
    """


@dataclass
class ChargeResult:
    outcome: str
    charge_ref: str = ""     # pi_… / PayPal capture id
    intent_ref: str = ""     # pi_… before confirm, for 3DS resume
    decline_code: str = ""
    message: str = ""
    raw: dict | None = None


@dataclass
class RefundResult:
    ok: bool
    refund_ref: str = ""
    message: str = ""


class Provider(Protocol):
    name: str
    def charge(self, *, customer_ref: str, method_ref: str, amount_minor: int,
               currency: str, idempotency_key: str, descriptor: str = "",
               metadata: dict | None = None) -> ChargeResult: ...
    def refund(self, *, charge_ref: str, amount_minor: int,
               idempotency_key: str, reason: str = "") -> RefundResult: ...
    def lookup(self, *, idempotency_key: str,
               charge_ref: str | None = None) -> ChargeResult | None: ...


# --- shared helpers -----------------------------------------------------------

def classify(code: str) -> str:
    """Map a provider decline code to an outcome.

    Unknown codes are treated as SOFT, deliberately: a retry on something we do
    not recognise is recoverable, whereas wrongly classifying a soft decline as
    hard cuts off a member who would have paid on the next attempt.
    """
    if code in ("authentication_required", "PAYER_ACTION_REQUIRED"):
        return REQUIRES_ACTION
    if code in TRANSPORT_CODES:
        return TRANSPORT_ERROR
    if code in HARD_CODES:
        return HARD_DECLINE
    if code in SOFT_CODES:
        return SOFT_DECLINE
    return SOFT_DECLINE


def minor_to_decimal_string(amount_minor: int, currency: str = "USD") -> str:
    """Minor units -> the decimal STRING PayPal requires. One helper, one place.

    Never str(float): 0.1 + 0.2 arithmetic has no business anywhere near money.
    Unit-tested for 199700 / 1700 / 16020 / 0.
    """
    if not isinstance(amount_minor, int) or isinstance(amount_minor, bool):
        raise TypeError("amount must be int minor units — never float")
    if amount_minor < 0:
        raise ValueError("negative amount")
    return str(Decimal(amount_minor).scaleb(-2).quantize(Decimal("0.01")))
