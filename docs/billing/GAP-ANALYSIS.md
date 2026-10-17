# Native Billing v2.0 — gap analysis

**As of 2026-10-17**, branch `billing-engine`. Spec:
[`Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md`](../../Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md).

Every row verified against the code, not recalled. 149 tests passing, database
applied locally, nothing deployed, `LABS_BILLING_MODE=off`, WooCommerce untouched.

The useful distinction is not built/unbuilt. It is three states, and the middle one
is where things hide:

| | |
|---|---|
| **BUILT & TESTED** | works, and something proves it |
| **BUILT, NOT WIRED** | the code exists and is tested, but **nothing calls it in the running app** — it will never execute |
| **NOT BUILT** | specified only |

A "BUILT, NOT WIRED" module reads as finished in a file listing and does nothing in
production. That category is the point of this document.

---

## 1. BUILT & TESTED

| § | Capability | Evidence |
|---|---|---|
| 4 | 9 tables, 130 columns | applied locally; verified against `information_schema` — zero drift from spec |
| 4.3 | Double-charge impossible | unique key rejects a racing worker and a replayed key; tested |
| 4.4 | Over-refund blocked in the write path | `ledger.refund` takes `FOR UPDATE`, sums, refuses |
| 5.1 | Unbounded due query | no lower bound — an outage delays, never loses |
| 5.2 | Leases + `SKIP LOCKED` | two workers, one subscription, exactly one charge |
| 5.3 | Ledger before provider | crash between the two is recoverable |
| 5.4 / 5.4.1 | Period arithmetic + the anchor rule | every clamp case; 204/204 real subscriptions reproduce Woo exactly |
| 6.1 | Stripe adapter | request shape, decline classification, 3DS, recovery, refunds |
| 6.2 | PayPal adapter | vaulted order + capture, `invoice_id` guard, PENDING never retried |
| 6.3 / 6.4 | Webhook ingest + ordering | durable dedupe; a late event cannot un-settle a charge |
| 7.1–7.4 | Double charge, crash recovery, wrong amount, decline ladder | all tested |
| 7.6 | 3DS *classification* | not a decline, no retry counted. **The recovery page does not exist** — see §3 |
| 7.10 | Circuit breakers | spend cap and due-surge both halt, writing no ledger rows |
| 7.15 | Transport ≠ decline | ledger left open, `retry_count` untouched, due date intact |
| 7.16 | UTC enforced | worker sets the session zone and refuses to start if it disagrees |
| 7.17 | Import idempotency | re-running cannot create a second row per Woo subscription |
| 8.1 | First purchase | charges on-session, creates the subscription, returns the access date |
| 8.4 | Observer finite term | charges exactly `max_periods` times, then expires |
| 10 | Shadow mode | 157 real subscriptions, full cycle, zero provider calls |
| 16.3 | Discount maths | reproduces the live book's own prices; expiry/deletion cannot re-price |
| 16.4 | Price step-up + notice guard | refuses to raise a price unannounced |

---

## 2. ⚠️ BUILT, NOT WIRED — exists, tested, and never runs

**This is the section that matters.** Each of these is real code with passing tests that
**nothing in the running application calls.**

| § | What | Why it never executes | To wire it |
|---|---|---|---|
| **8.1** | `billing.checkout.start()` | **No HTTP route reaches it.** It is a library function. Ernie's Front Door still calls its own simulated grant (CK-SIM) | one line in `front_door_access.py`, plus a route if Labs needs its own checkout |
| **7.7** | `recovery.reconcile()` — all four checks | **Nothing schedules it.** The nightly backstop that catches a slipped payment never runs | a scheduled job + the alert path |
| **7.2** | `recovery.recover_open_charges()` | Called by the worker — but **the worker itself is not installed anywhere** | install the LaunchDaemon |
| **5.5** | The worker | Entry point works (`python -m billing`), runs locally. **No scheduled job exists**, so no renewal will ever be taken | install the plist |
| **8.2** | Proration (`prorated_credit`, `upgrade_charge`) | **No upgrade/downgrade flow calls it.** The maths is right and unreachable | build the switch flow |
| **16.2/16.3** | Discounts | Schema + application logic exist. **Checkout does not consult them** — a code cannot be redeemed | apply in `checkout.start()` |
| **4.5** | `billing_events` | Written by the webhook routes, which exist — but no provider is configured, so nothing arrives yet | credentials |
| **161** | `membership_events` | **Table exists. Nothing writes to it at all.** The audit trail is empty by construction | add writes at every state change |
| **7.9** | Heartbeat | The query is in `/api/admin/billing/status`. **Nothing alerts on it** — it shows red to whoever happens to look | a scheduled check |
| **7.11** | Refund engine | `ledger.refund` is built and tested. **No route or UI calls it** | admin surface |

---

## 3. NOT BUILT — specified only

| § | What | Consequence today | Blocking? |
|---|---|---|---|
| **7.13** | Woo SSO sync must skip identities with a billing subscription | A Labs-born member's membership could be overwritten by Woo's sync | **BLOCKS going live** |
| **7.14** | Labs emits Discord roles + AC tags | A Labs-born member gets **no Discord role and no AC tag** — invisible to every email journey | **BLOCKS going live** |
| **ANALYSIS §1** | AC contact creation on signup | Woo's AC plugin builds contacts from *Woo orders*. A Labs signup is invisible to it, so the member receives **no email, ever** | **BLOCKS going live** |
| **7.5** | Dunning emails (4) | A failed payment is recorded and the member is **never told** | blocks live charging |
| **6.5** | Receipts | A successful charge sends nothing | blocks live charging |
| **7.6** | 3DS confirm page | A `requires_action` charge has **nowhere for the member to go** | blocks live charging |
| **7.8** | Card-expiry sweep | Expiring cards fail silently instead of being pre-empted | high value, not blocking |
| **8.3** | Member cancel flow | Nobody can cancel without an admin | blocks going live |
| **14.2** | Member billing page | Nobody can see their subscription or change their card | blocks going live |
| **14.2** | Admin: refunds, retries, quarantine queue | Only `catalog` + `status` exist, both read-only | blocks operating it |
| **16.6** | Discount admin | No way to create a code | blocks selling on a code |
| **7.12** | Identity-collision guard | Only matters at import — deferred with §9 |  no |
| **7.18** | Rollback rehearsal | Only matters at cutover — deferred with §9 | no |
| **9.4–9.8** | Migration ops | **Deliberately deferred** by §9.0 (parallel run). Still valid, still tested | no |
| **18.6** | `desired_tags` / `desired_roles` reconciler | The architectural recommendation. Nothing built | follows §7.14 |

---

## 4. Drift and loose ends found while checking

| Item | Status |
|---|---|
| `membership_events` missing from migrations | **FIXED** — migration 161. Found by diffing spec against migrations |
| Spec vs migrations | **ZERO DRIFT** — 9 tables, 130 columns verified against `information_schema` |
| `paused` subscription status | In the enum with **no logic behind it**. Define it or remove it — a status nothing can set or clear is a trap |
| Suite would have dropped real tables | **FIXED** — borrows migrated tables, asserts it dropped nothing |
| `ON DELETE RESTRICT` | Working. Cleanup had to be reordered rather than the constraint weakened |
| venv missing 10 declared deps | **FIXED** — dedicated venv. `zxing-cpp` still unavailable (Links only, irrelevant here) |
| PayPal request shape | Written from documentation. **Must be reconciled against PPCP's PHP before any real charge** |
| Ernie's branch carries the spec at its old path | Will conflict on merge. He should rebase |

---

## 5. What "ready for a real card" actually requires

Ordered by what blocks what.

**Before a single live charge:**
1. §7.14 Discord + AC emission, and AC contact creation on signup — otherwise a paying member
   is invisible to every journey
2. §7.13 SSO-sync skip — otherwise Woo overwrites their membership
3. §6.5 receipts and §7.5 dunning — otherwise payments happen in silence
4. §7.6 the 3DS confirm page — otherwise a challenged payment strands the member
5. Wire `checkout.start()` into the Front Door grant
6. Install the worker as a LaunchDaemon
7. Schedule §7.7 reconciliation
8. Credentials: PayPal client id/secret, Stripe publishable key, both webhook secrets

**Before members can self-serve:** §14.2 member page, §8.3 cancel.

**Before operating it:** admin refunds, retries, quarantine queue.

**Before selling on a code:** §16.6 discount admin.

---

## 6. The honest summary

The **engine** is done: the part that moves money and must never double-charge, lose a
charge, or charge the wrong amount. It is tested against real data and a real database.

What is missing is **everything that connects it to a human** — the screens, the emails,
the one line that joins it to the Front Door, and the scheduled jobs that make it tick.
Plus three integrations (§7.13, §7.14, AC contacts) that are not billing code at all but
without which a paying member silently gets nothing.

Nothing in section 2 or 3 is hard in the way the engine was hard. It is volume, not risk.
