"""IKI Factory → store seam (IF-4 · DL-577).

NAMED STUB. There is no WooCommerce / WC API interface yet. The store will
be hosted on labs.fattail.ai under a separate program Coach will open later.

`woo_step()` is the one seam to connect. It does not return success.
Do not hunt the tree for a second product-create path.
"""

from __future__ import annotations

from typing import Any

WOO_STUB_REASON = "Woo step stubbed — store interface is a later program."


def woo_step(card: dict[str, Any]) -> dict[str, Any]:
    """Named store seam. Stubbed. Does not return success. Does not call WC."""
    _ = card
    return {
        "ok": False,
        "stubbed": True,
        "reason": WOO_STUB_REASON,
        "product_id": None,
    }
