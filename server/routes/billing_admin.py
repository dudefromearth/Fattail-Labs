"""Billing admin — ADMIN ONLY.  Spec §14.2, §16.6.

Everything here is behind `require_admin`, deliberately. Pricing is not on the
member-facing surface yet and must not leak there by accident: the catalog is
the authoritative price list the server charges from (§8.1), so exposing it
publicly before the checkout is ready would publish prices we have not agreed
to honour.

Read-only for now. Refunds, manual retries and the quarantine queue are
specified (§14.2) and not yet built; they are listed in `capabilities` so the
admin UI can grey them out rather than guess.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import db
from config import get_config
from guards import require_admin

from billing import catalog, providers

router = APIRouter(tags=["billing-admin"])


@router.get("/api/admin/billing/catalog")
def admin_catalog(request: Request) -> dict:
    """The server-side price list — ADMIN ONLY until the checkout goes live.

    This is the authority for what a member is charged. The Front Door sends
    only a product id (CK-CARD), so these amounts are never supplied by a
    browser and cannot be tampered with.
    """
    require_admin(request)
    cfg = get_config()
    return {
        "mode": cfg.billing_mode,
        "providers": providers.available(),
        "member_visible": False,          # pricing stays admin-only for now
        "products": catalog.as_catalog(),
    }


@router.get("/api/admin/billing/status")
def admin_status(request: Request) -> dict:
    """Operational state at a glance: is billing on, is anything owed, is the
    worker alive, and is anything stuck."""
    require_admin(request)
    cfg = get_config()
    out: dict = {
        "mode": cfg.billing_mode,
        "providers": providers.available(),
        "daily_cap_minor": cfg.billing_daily_cap_minor,
        "capabilities": {
            "catalog": True, "status": True,
            "refund": False, "manual_retry": False,
            "quarantine_queue": False, "discounts": False,
        },
    }
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SET SESSION time_zone = '+00:00'")
            cur.execute("""SELECT status, COUNT(*) n, COALESCE(SUM(amount_minor),0) amt
                             FROM billing_subscriptions GROUP BY status""")
            out["subscriptions"] = {r["status"]: {"count": r["n"], "mrr_minor": int(r["amt"])}
                                    for r in cur.fetchall()}
            cur.execute("""SELECT status, COUNT(*) n, COALESCE(SUM(amount_minor),0) amt
                             FROM billing_charges GROUP BY status""")
            out["charges"] = {r["status"]: {"count": r["n"], "amount_minor": int(r["amt"])}
                              for r in cur.fetchall()}
            # §7.9 — a worker cannot report its own death, so this is the check
            # an admin page should show in red.
            cur.execute("""SELECT MAX(finished_at) last_finished FROM billing_worker_runs""")
            out["worker_last_finished"] = str(cur.fetchone()["last_finished"] or "")
            cur.execute("""SELECT COUNT(*) n FROM billing_worker_runs
                            WHERE finished_at IS NOT NULL
                              AND finished_at > UTC_TIMESTAMP() - INTERVAL 30 MINUTE""")
            out["worker_healthy"] = cur.fetchone()["n"] > 0
            # §7.7A — owed, past due, and no ledger row for the current period.
            cur.execute("""SELECT COUNT(*) n FROM billing_subscriptions s
                            LEFT JOIN billing_charges c
                              ON c.subscription_id = s.id AND c.period_index = s.period_index
                            WHERE s.status IN ('active','past_due','grace')
                              AND s.next_charge_at IS NOT NULL
                              AND s.next_charge_at < UTC_TIMESTAMP() - INTERVAL 2 HOUR
                              AND c.id IS NULL""")
            out["payments_possibly_slipped"] = cur.fetchone()["n"]
            cur.execute("""SELECT COUNT(*) n FROM billing_charges
                            WHERE status IN ('intent','processing')
                              AND initiated_at < UTC_TIMESTAMP() - INTERVAL 10 MINUTE""")
            out["charges_awaiting_recovery"] = cur.fetchone()["n"]
    return out
