"""Provider registry.  Spec §6.

Config-gated: a provider exists only when its credentials are configured. With
none configured the package still imports and `for_name()` raises a clear error
rather than failing obscurely at charge time.
"""

from __future__ import annotations

import logging

from billing.providers.base import (  # noqa: F401  (re-exported for callers)
    ChargeResult, Provider, ProviderError, RefundResult,
    HARD_DECLINE, PENDING, REQUIRES_ACTION, SOFT_DECLINE, SUCCEEDED, TRANSPORT_ERROR,
    classify, minor_to_decimal_string,
)

log = logging.getLogger("labs.billing.providers")

_cache: dict[str, object] = {}


def available() -> dict[str, bool]:
    """Which providers are configured. Safe to call with no config at all."""
    from config import get_config
    cfg = get_config()
    return {
        "stripe": bool(getattr(cfg, "stripe_secret_key", None)),
        "paypal": bool(getattr(cfg, "paypal_client_id", None)
                       and getattr(cfg, "paypal_client_secret", None)),
    }


def for_name(name: str):
    """Build (and memoise) a provider adapter by name."""
    if name in _cache:
        return _cache[name]
    from config import get_config
    cfg = get_config()
    if name == "stripe":
        key = getattr(cfg, "stripe_secret_key", None)
        if not key:
            raise ProviderError("stripe is not configured (STRIPE_SECRET_KEY unset)")
        from billing.providers.stripe_mit import StripeProvider
        _cache[name] = StripeProvider(key)
    elif name == "paypal":
        cid = getattr(cfg, "paypal_client_id", None)
        sec = getattr(cfg, "paypal_client_secret", None)
        if not (cid and sec):
            raise ProviderError("paypal is not configured (PAYPAL_CLIENT_ID/SECRET unset)")
        from billing.providers.paypal_mit import PayPalProvider
        from billing.providers.paypal_mit import LIVE
        _cache[name] = PayPalProvider(
            cid, sec, api_base=getattr(cfg, "paypal_api_base", None) or LIVE)
    else:
        raise ProviderError(f"unknown provider {name!r}")
    log.info("billing provider ready: %s", name)
    return _cache[name]


def build_stripe_request(**kw) -> dict:
    """Pure request-shape helper, importable without credentials (§13.1)."""
    from billing.providers.stripe_mit import build_payment_intent_params
    return build_payment_intent_params(**kw)


def build_paypal_order(**kw) -> dict:
    """Pure request-shape helper, importable without credentials (§13.1)."""
    from billing.providers.paypal_mit import build_order_body
    return build_order_body(**kw)


def reset_for_tests() -> None:
    _cache.clear()
