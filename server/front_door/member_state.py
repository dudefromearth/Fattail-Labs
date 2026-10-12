"""Five member states, plus the two membership-without-subscription views.

§2 states: none, observer, navigator_annual, navigator_lifetime,
cancelled_before_completion.

B2/B3 add finished_observer and lapsed_annual so a finisher is not offered
Observer again and is not told they still have major tools. An active
optional subscription (Monthly, once switched on) is covered_other: no buy
button. That is not a sixth named product state; it is "already covered".
"""

from __future__ import annotations

from typing import Any

# Buy buttons for these states.
BUY_STATES = frozenset({"none", "cancelled_before_completion"})
UPGRADE_STATES = frozenset({"observer", "finished_observer", "lapsed_annual"})
COVERED_STATES = frozenset({"navigator_annual", "navigator_lifetime", "covered_other"})

FIVE_STATES = (
    "none",
    "observer",
    "navigator_annual",
    "navigator_lifetime",
    "cancelled_before_completion",
)

ACTIVE = frozenset({"active", "past_due"})


class MemberStateError(ValueError):
    """Facts the classifier cannot read."""


def _flag(facts: dict, key: str) -> bool:
    if key not in facts:
        raise MemberStateError(f"facts.{key} is required")
    value = facts[key]
    if not isinstance(value, bool):
        raise MemberStateError(f"facts.{key} must be true or false")
    return value


def classify(facts: dict) -> str:
    """Map membership facts to one state. Raises if a flag is missing or mistyped."""
    has_identity = _flag(facts, "has_identity")
    has_membership = _flag(facts, "has_membership")
    lifetime = _flag(facts, "lifetime")
    observer_completed = _flag(facts, "observer_completed")
    cancelled_early = _flag(facts, "cancelled_before_completion")
    if "payment_failed" not in facts:
        raise MemberStateError("facts.payment_failed is required")
    if facts["payment_failed"] is not None and not isinstance(facts["payment_failed"], bool):
        raise MemberStateError("facts.payment_failed must be true, false, or null")

    status = facts.get("subscription_status")
    if "subscription_status" not in facts:
        raise MemberStateError("facts.subscription_status is required")
    if status is not None and not isinstance(status, str):
        raise MemberStateError("facts.subscription_status must be a string or null")
    if "subscription_product" not in facts:
        raise MemberStateError("facts.subscription_product is required")
    product = facts.get("subscription_product")
    if product is not None and not isinstance(product, str):
        raise MemberStateError("facts.subscription_product must be a string or null")

    if not has_identity:
        return "none"
    if lifetime:
        return "navigator_lifetime"
    if status in ACTIVE and product:
        if product == "observer":
            return "observer"
        if product == "navigator-annual":
            return "navigator_annual"
        return "covered_other"
    if cancelled_early and not has_membership:
        return "cancelled_before_completion"
    if has_membership and product == "navigator-annual":
        return "lapsed_annual"
    if has_membership and (observer_completed or product == "observer"):
        return "finished_observer"
    if has_membership:
        return "finished_observer"
    if cancelled_early:
        return "cancelled_before_completion"
    return "none"


def payment_attention(facts: dict) -> bool:
    """True when the last payment failed and access is still in the retry window."""
    if not _flag(facts, "has_identity"):
        return False
    status = facts.get("subscription_status")
    explicit = facts.get("payment_failed")
    if explicit is not None and not isinstance(explicit, bool):
        raise MemberStateError("facts.payment_failed must be true, false, or null")
    return status == "past_due" or explicit is True


def visible_products(state: str, offers: dict) -> list[dict]:
    enabled = [p for p in offers["products"] if p["enabled"]]
    if state in BUY_STATES:
        return enabled
    if state in UPGRADE_STATES:
        return [p for p in enabled if p["id"] != "observer"]
    return []


def _copy(state: str) -> tuple[str, str, str]:
    """headline, detail, view name."""
    if state == "none":
        return (
            "Choose how you want to train",
            "Observer is six weeks at $17 a week. Navigator Annual and Lifetime are separate purchases. No refunds.",
            "buy",
        )
    if state == "cancelled_before_completion":
        return (
            "You can start again",
            "The earlier subscription ended before the six weeks were complete, so there is no membership on this email. You can buy Observer or Navigator. No refunds.",
            "buy",
        )
    if state == "observer":
        return (
            "You are in the six weeks",
            "Observer is already on this email. Navigator Annual or Lifetime is a separate purchase when you want it. Observer does not convert on its own.",
            "upgrade",
        )
    if state in ("finished_observer", "lapsed_annual"):
        return (
            "Your membership continues",
            "The subscription is quiet, so major tools are off. IKI Labs is the floor. Navigator Annual or Lifetime turns the major tools back on. It is a separate purchase.",
            "upgrade",
        )
    if state == "navigator_lifetime":
        return (
            "You're already covered",
            "Lifetime is on this email. There is nothing to buy.",
            "nothing_to_buy",
        )
    if state in ("navigator_annual", "covered_other"):
        return (
            "You're already covered",
            "This email already has an active membership subscription. There is nothing further to buy here.",
            "already_covered",
        )
    raise MemberStateError(f"unknown state {state!r}")


def view_for(state: str, offers: dict, *, attention: bool) -> dict[str, Any]:
    from front_door.nudge import nudge_for
    from front_door.offers import public_product

    headline, detail, view = _copy(state)
    products = [public_product(p) for p in visible_products(state, offers)]
    nudge = nudge_for(attention and state in ("observer", "navigator_annual", "covered_other"))
    return {
        "state": state,
        "view": view,
        "headline": headline,
        "detail": detail,
        "can_buy": bool(products),
        "products": products,
        "nudge": nudge,
        "card_update_url": offers["woo_account_payment_methods"] if nudge else None,
    }


def unchecked_view() -> dict[str, Any]:
    return {
        "state": "unchecked",
        "view": "unchecked",
        "headline": "Enter your email",
        "detail": "We check membership on this email before showing a buy button.",
        "can_buy": False,
        "products": [],
        "nudge": None,
        "card_update_url": None,
    }


def sign_in_view(reason: str) -> dict[str, Any]:
    return {
        "state": "unknown",
        "view": "sign_in_to_check",
        "headline": "Sign in to check",
        "detail": reason,
        "can_buy": False,
        "products": [],
        "nudge": None,
        "card_update_url": None,
    }


def anonymous_facts() -> dict:
    return {
        "has_identity": False,
        "has_membership": False,
        "lifetime": False,
        "subscription_product": None,
        "subscription_status": None,
        "observer_completed": False,
        "cancelled_before_completion": False,
        "payment_failed": False,
    }
