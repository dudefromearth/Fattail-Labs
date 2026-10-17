"""Scriptable fake provider — tests only.  Spec §13.1.

Deterministic, and it mimics real provider idempotency: replaying a key returns
the ORIGINAL result. That is what makes the crash-recovery test meaningful
rather than decorative.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from billing.providers.base import (
    ChargeResult, ProviderError, RefundResult,
    PENDING, SUCCEEDED, TRANSPORT_ERROR,
)


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
               idempotency_key, descriptor="", metadata=None,
               off_session: bool = True) -> ChargeResult:
        self.calls.append(dict(key=idempotency_key, amount=amount_minor,
                               method=method_ref, currency=currency,
                               off_session=off_session))
        if idempotency_key in self.seen:
            return self.seen[idempotency_key]          # provider-side idempotency
        spec = self.script.get(idempotency_key, self.default)
        outcome, code = spec if isinstance(spec, tuple) else (spec, "")
        if outcome == TRANSPORT_ERROR:
            raise ProviderError("simulated provider transport failure")
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

    def refund(self, *, charge_ref: str, amount_minor: int,
               idempotency_key: str, reason: str = "") -> RefundResult:
        self.calls.append(dict(key=idempotency_key, refund=amount_minor, ref=charge_ref))
        return RefundResult(True, refund_ref=f"{self.name}_re_{len(self.calls)}")
