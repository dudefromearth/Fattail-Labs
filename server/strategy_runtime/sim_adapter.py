"""Simulated broker adapter — thin accept pipe for Curate.

Fill policy lives in fill_simulator / ExecutionService, not here.
Never talks to Tradier.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import secrets


@dataclass
class OrderAck:
    accepted: bool
    broker_order_id: str | None
    status: str  # accepted | rejected
    reject_reason: str | None = None


@dataclass
class OrderIntent:
    client_order_tag: str
    symbol: str
    qty: int
    intent: str  # open | close
    side: str
    max_loss_usd: float
    max_profit_usd: float
    entry_price: float
    structure: dict[str, Any]


class SimulatedAdapter:
    """Accepts valid intents immediately; rejects empty tags / bad qty."""

    def submit_order(self, intent: OrderIntent) -> OrderAck:
        if not intent.client_order_tag or not str(intent.client_order_tag).strip():
            return OrderAck(
                accepted=False,
                broker_order_id=None,
                status="rejected",
                reject_reason="client_order_tag required",
            )
        if intent.qty < 1:
            return OrderAck(
                accepted=False,
                broker_order_id=None,
                status="rejected",
                reject_reason="qty must be >= 1",
            )
        if intent.intent not in ("open", "close"):
            return OrderAck(
                accepted=False,
                broker_order_id=None,
                status="rejected",
                reject_reason=f"unknown intent {intent.intent!r}",
            )
        if float(intent.max_loss_usd) <= 0 and intent.intent == "open":
            return OrderAck(
                accepted=False,
                broker_order_id=None,
                status="rejected",
                reject_reason="defined risk required (max_loss_usd > 0)",
            )
        oid = f"sim_{secrets.token_hex(8)}"
        return OrderAck(
            accepted=True,
            broker_order_id=oid,
            status="accepted",
            reject_reason=None,
        )

    def cancel_order(self, broker_order_id: str) -> bool:
        # Instant-fill sim: nothing working to cancel
        return False

    def get_order_status(self, broker_order_id: str) -> str:
        return "filled"
