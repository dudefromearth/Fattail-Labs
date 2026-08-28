"""IKI Factory → store seam (IF-4 · DL-577; two-step per Store Spec).

NAMED STUB. There is still no WooCommerce / WC API interface. The store runs
as a separate program (Factory Spec v1.1 section 8.7) — see
`Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md`.

TWO seams, not one. Coach's flow: the Woo product is created as a DRAFT when a
card lands in Staged, and published when the card goes Live.

    woo_stage(card)    -> create/update the Woo product as a DRAFT
    woo_publish(card)  -> flip that existing draft to published

`woo_step` is retained as an alias of `woo_publish` so nothing that already
calls it changes behaviour.

Neither returns success while stubbed; each does not return success
until a real WC interface exists. Do not hunt the tree for a second
product-create path — these are the only two.

Wiring either one requires a WooCommerce REST key with WRITE scope. As of
2026-08-26 all four keys on fattail.ai are read-only (Store Spec section 10.4),
so both remain stubbed regardless of caller.
"""

from __future__ import annotations

from typing import Any

WOO_STUB_REASON = "Woo step stubbed — store interface is a later program."
WOO_STAGE_STUB_REASON = (
    "Woo draft stubbed — no write-scoped WC key exists yet (Store Spec 10.4)."
)


def _stub(reason: str) -> dict[str, Any]:
    return {"ok": False, "stubbed": True, "reason": reason, "product_id": None}


def woo_stage(card: dict[str, Any]) -> dict[str, Any]:
    """Staged seam. Create the Woo product as a DRAFT for a paid card.

    Free cards have nothing to sell, so there is no product to create and this
    is a no-op rather than a failure — a free card must not be held in Staged
    waiting on a store step that will never apply to it.
    """
    if str(card.get("free_vs_paid") or "").strip().lower() == "free":
        return {
            "ok": True,
            "stubbed": False,
            "reason": "Free product — no Woo product required.",
            "product_id": None,
        }
    return _stub(WOO_STAGE_STUB_REASON)


def woo_publish(card: dict[str, Any]) -> dict[str, Any]:
    """Live seam. Publish the draft created at Staged. Does not create."""
    _ = card
    return _stub(WOO_STUB_REASON)


# Back-compat: the original single seam published at Live.
woo_step = woo_publish
