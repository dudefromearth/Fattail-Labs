"""mark_sum engine — natural package debit from leg mids (OPF6)."""

from __future__ import annotations

from typing import Any


def mark_sum_package(leg_marks: list[dict[str, Any]]) -> dict[str, Any]:
    """D_nat = sum q_i * m_i per share. Incomplete → complete=false."""
    total = 0.0
    complete = True
    missing: list[str] = []
    for lm in leg_marks:
        mid = lm.get("mid")
        qty = lm.get("qty")
        leg_id = str(lm.get("leg_id") or lm.get("id") or "?")
        if mid is None or qty is None:
            complete = False
            missing.append(leg_id)
            continue
        total += float(qty) * float(mid)
    return {
        "engine_id": "mark_sum",
        "debit_per_share": total if complete else None,
        "complete": complete,
        "missing_legs": missing,
        "label": "mark",
    }
