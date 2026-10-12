"""Soft nudge after the first failed payment. Retries stay on Woo."""

from __future__ import annotations


def nudge_for(show: bool) -> dict | None:
    if not show:
        return None
    return {
        "title": "Your payment didn't go through",
        "body": "Update your card. Access stays while the payment is retried.",
        "action": "Update your card",
    }
