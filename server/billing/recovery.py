"""Native Billing v2.0 — crash recovery and reconciliation.  Spec §7.2 / §7.7.

The rule that governs this whole module: AN AMBIGUOUS CHARGE IS NEVER RETRIED.
We ask the provider what happened. If the provider cannot say, a human is paged.
"""

from __future__ import annotations

from billing import ledger

QUARANTINE = "quarantined"


def recover_open_charges(conn, *, provider_for, older_than_seconds: int = 600) -> list[dict]:
    """§7.2 — resolve charges stuck in intent/processing.

    The process may have died between committing the intent and recording the
    result, so the money may or may not have moved. We reconstruct the idempotency
    key (it is derivable, §ledger.idempotency_key) and ask."""
    out = []
    with conn.cursor() as cur:
        stuck = ledger.open_rows_older_than(cur, older_than_seconds)
    for row in stuck:
        prov = provider_for(row["provider"])
        res = prov.lookup(idempotency_key=row["idempotency_key"],
                          charge_ref=row["provider_charge_ref"] or None)
        with conn.cursor() as cur:
            if res is None:
                # The provider cannot tell us. DO NOT RETRY. Quarantine + page.
                cur.execute(
                    """UPDATE billing_subscriptions SET status=%s,
                          lease_owner=NULL, lease_expires_at=NULL
                        WHERE id=%s""", (QUARANTINE, row["subscription_id"]))
                out.append({"charge_id": row["id"], "action": "quarantined",
                            "why": "provider could not confirm outcome"})
            elif res.outcome == "succeeded":
                # It DID charge. Settle and advance — never charge again.
                ledger.settle(cur, row["id"], ledger.SUCCEEDED,
                              charge_ref=res.charge_ref, intent_ref=res.intent_ref,
                              message="recovered after crash")
                cur.execute(
                    """UPDATE billing_subscriptions
                          SET period_index=period_index+1, status='active',
                              retry_count=0, lease_owner=NULL, lease_expires_at=NULL
                        WHERE id=%s""", (row["subscription_id"],))
                out.append({"charge_id": row["id"], "action": "settled_succeeded"})
            else:
                ledger.settle(cur, row["id"], ledger.FAILED,
                              decline_code=res.decline_code,
                              message="recovered after crash: " + res.message)
                cur.execute(
                    """UPDATE billing_subscriptions SET status='past_due',
                          lease_owner=NULL, lease_expires_at=NULL
                        WHERE id=%s""", (row["subscription_id"],))
                out.append({"charge_id": row["id"], "action": "settled_failed"})
        conn.commit()
    return out


def reconcile(conn, *, provider_charges: dict | None = None,
              slip_grace_hours: int = 2) -> dict:
    """§7.7 — the nightly backstop, deliberately independent of the worker.

    Four checks. (A) is the direct answer to 'can a payment slip?': a missed charge
    is not merely eventually retried by §5.1, it is actively REPORTED within two
    hours. (B) is the inverse guarantee: money cannot move at the processor without
    a ledger row.

    provider_charges maps idempotency_key -> amount_minor, as pulled from the
    provider's own API for the window.
    """
    alerts: dict[str, list] = {"slipped": [], "unledgered": [], "phantom": [],
                               "orphan_membership": [], "double_charge": [],
                               "over_refund": []}
    with conn.cursor() as cur:
        # (A) LIVENESS — owed, past due, and no ledger row for this period.
        cur.execute(
            """SELECT s.id, s.identity_id, s.next_charge_at, s.period_index, s.amount_minor
                 FROM billing_subscriptions s
                 LEFT JOIN billing_charges c
                        ON c.subscription_id = s.id AND c.period_index = s.period_index
                WHERE s.status IN ('active','past_due','grace')
                  AND s.next_charge_at IS NOT NULL
                  AND s.next_charge_at < UTC_TIMESTAMP() - INTERVAL %s HOUR
                  AND c.id IS NULL""", (slip_grace_hours,))
        alerts["slipped"] = cur.fetchall()

        # (B) COMPLETENESS, both directions.
        if provider_charges is not None:
            cur.execute(
                """SELECT idempotency_key, amount_minor, status FROM billing_charges
                    WHERE initiated_at > UTC_TIMESTAMP() - INTERVAL 48 HOUR""")
            ours = {r["idempotency_key"]: r for r in cur.fetchall()}
            for key, amt in provider_charges.items():
                if key not in ours:
                    alerts["unledgered"].append({"key": key, "amount_minor": amt})
            for key, row in ours.items():
                if row["status"] == ledger.SUCCEEDED and key not in provider_charges:
                    alerts["phantom"].append({"key": key,
                                              "amount_minor": row["amount_minor"]})

        # (C) ARITHMETIC + (D) ORPHANS
        alerts["double_charge"] = ledger.assert_no_double_charges(cur)
        alerts["over_refund"] = ledger.assert_refunds_within_charges(cur)
        cur.execute(
            """SELECT s.id, s.identity_id FROM billing_subscriptions s
                WHERE s.status='active'
                  AND NOT EXISTS (SELECT 1 FROM memberships m
                                   WHERE m.identity_id=s.identity_id
                                     AND m.status IN ('active','grace'))""")
        alerts["orphan_membership"] = cur.fetchall()

    alerts["clean"] = all(not v for k, v in alerts.items() if k != "clean")
    return alerts


def heartbeat_ok(conn, *, max_silence_minutes: int = 30) -> bool:
    """§7.9 — a worker cannot report its own death, so this is checked by a
    SEPARATE scheduled job."""
    with conn.cursor() as cur:
        cur.execute(
            """SELECT COUNT(*) n FROM billing_worker_runs
                WHERE finished_at IS NOT NULL
                  AND finished_at > UTC_TIMESTAMP() - INTERVAL %s MINUTE""",
            (max_silence_minutes,))
        return cur.fetchone()["n"] > 0
