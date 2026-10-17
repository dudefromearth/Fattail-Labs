# DL-532 (DRAFT — for Coach ruling, then paste into Architecture/00-decision-log.md)

Insert directly below the log header, above DL-531.

---

## 2026-10-14 — DL-532 Native Billing v2.0: Labs owns the subscription (merchant-initiated)

**Decision.** FatTail Labs becomes the owner of membership billing. Labs holds the plan, the
schedule, the next-charge date, the retry ladder, the grace window and the money ledger;
Stripe and PayPal are reduced to vaults that hold a reusable authorization and charge it when
Labs says so. Checkout moves to `labs.fattail.ai`. WooCommerce stops billing.
Spec: `Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md`, superseding Native Billing
(Stripe) v1.0.

**This reverses v1.0, which was never wired.** v1.0 (DL of 2026-07-21) made Stripe the owner —
hosted Checkout in `mode=subscription`, Stripe Billing driving renewals, the webhook as sole
membership truth — and was approved as built pending keys on MiniTwo. Those keys were never
supplied. `GET /api/billing/plans` has returned `enabled:false` in production every day since,
and no `STRIPE_SECRET_KEY` has ever existed in the environment. So this is not a reversal of
working behaviour; it is the first version of this subsystem that will actually charge anyone.

**WooCommerce was already doing merchant-initiated billing — that is what makes this cheap.**
The assumption that providers owned the subscriptions turned out to be false on inspection.
All nine subscription products carry `_ppcp_enable_subscription_product = no`, so PayPal's
Subscriptions API is not in use anywhere; all 50 active PayPal subscriptions have
`_requires_manual_renewal = false`, so Woo charges them itself; and the Stripe gateway holds no
Stripe Billing subscription objects at all. The renewal trigger is nothing more than 162
pending `woocommerce_scheduled_subscription_payment` rows in Action Scheduler, the furthest
dated 2031-10-03. What we are "taking over" is a cron table and a date column.

**PayPal vaulting is already enabled, so the flagged blocker does not exist.** Merchant
`M22DBMQN686X8` holds 132 PayPal vault tokens plus one Venmo. Labs reuses PPCP's own
`client_id`/`client_secret` verbatim so vault ids resolve under the identical REST app, and
existing PayPal subscribers do not re-approve. The honest residue: **2 of the 50** active
PayPal subscriptions have no vault token and must be re-authorized by hand before cutover.

**There is no Stripe account migration, because Labs has no Stripe account.** It adopts
Ernie's existing live account — the one `woocommerce-gateway-stripe` already uses — so the
`cus_`/`pm_` pairs in Woo's database are chargeable on day one with zero customer action. All
116 active Stripe subscriptions carry both a customer id and a modern `pm_` PaymentMethod.
Noted for the record: WooPayments is enabled on that site but its account data is errored and
dead. Had it been the processor, those cards would sit in Automattic's Stripe account and
would **not** have been portable. Nobody re-enables it.

**Architecture 05 §4 is amended, not deleted.** "No payment card data in Labs (Stripe/Woo own
checkout)" becomes "No payment card data in Labs" — the instrument is still tokenized in the
browser and the server still never receives a PAN — plus an explicit statement that Labs owns
the schedule, the ledger and the charge decision. The PCI consequence is stated precisely
rather than hand-waved: hosted Checkout would have been SAQ A, Elements in our own page is
SAQ A-EP. That brings the checkout route's integrity into scope, so it carries a strict CSP,
admits no third-party tags, and requires a named reviewer on every change. It does not make
Labs a cardholder-data environment. The companion clause "the app never invents charges" is
kept and strengthened: a charge now exists only where deterministic period arithmetic over a
stored schedule says it does — never from a request parameter, a price lookup at charge time,
or a provider event.

**Double-charging is prevented by schema, not by care.** `billing_charges` carries
`UNIQUE (subscription_id, period_index, attempt)`, and the ledger row is committed *before*
the provider is called. A duplicate worker, a replayed webhook, a double-clicked admin button
or a crashed process resuming all collide on that key and abort before money moves. Stripe
idempotency keys are the secondary guard only, because they expire after 24 hours and cannot
be relied on for a retry a day later; PayPal's `invoice_id` gives a permanent provider-side
guard that Stripe does not offer.

**A missed charge is reported, not merely retried.** The due query has no lower bound on
`next_charge_at`, so any outage delays renewals without losing them. On top of that a nightly
reconciliation — deliberately independent of the worker — asserts in both directions: any
active subscription past due with no ledger row for its period alerts within two hours, and
any provider charge with no matching ledger row alerts as money moving without us.

**Existing subscribers' prices are frozen by prohibition.** 34 active subscriptions run on
grandfathered recurring coupons: 25 Activators at $67 rather than $97, Navigators at $217 and
$160.20, a quarterly at $400, and 3 comped accounts at $0. `amount_minor` is therefore
per-subscription and authoritative, and no code path may derive an existing subscriber's charge
from a plan or product price. A plan-price lookup inside the charge path is grounds to reject a
change on sight.

**The schedule is re-anchored on the due date, not the start date — the live data overturned
the first draft.** The intuitive design, anchoring each series on the subscription's start and
walking forward by interval, reproduces WooCommerce's actual next-payment date on only 88 of
204 live subscriptions; the rest have drifted through suspensions, resumes and manual edits, by
up to 30 days. Importing that way would charge 116 members on a day they do not expect. So
`anchor_at` is set to the imported `_schedule_next_payment` with `period_index = 0`: the first
Labs charge fires at the stored value with no arithmetic, making drift zero by construction,
and interval arithmetic governs only period two onward. Woo's historical renewal count is kept
for reporting but must never be used as `period_index`. Related: `max_periods` is derived per
subscription from `ends_at` rather than from the product, because the Observer term is not
uniform in practice — the live book holds 1, 2, 4, 5, 6 and 12-week Observer terms, and a
hardcoded 6 would have halved one active member's access.

**The import transform has been run against the live book before being specified as final.**
221 subscriptions in, 221 rows out, zero amount deltas, zero trigger-date drift, no unmapped
products; 154 bill without human involvement and 67 are held. The dry run also surfaced nine
subscriptions needing a human: two PayPal subscribers with no vault token (#9661 at $1,997 and
#12406 at $17), two members on paid plans with no payment method at all (#5210 at $97/mo,
#7908 at $267/mo), four $0 comps that should become granted memberships rather than
subscriptions, and one Observer on a non-standard 12-week term. The 42 on-hold subscriptions
are a separate list, 21 of them more than 90 days overdue.

**Cutover is staged behind a shadow mode, and Woo is kept bootable.** The worker runs for 14
days computing due dates, amounts and ledger rows against live production data while being
structurally incapable of calling a provider, diffed daily against what Woo actually charged.
Live then proceeds by cohort — 5 weekly Observers first at $17 a charge, then Stripe tranches,
then PayPal, annuals last. Woo subscriptions are never deleted or cancelled; each is flipped to
`_requires_manual_renewal = true` as it goes live, which is per-subscription, reversible, and
preserves rollback. Deleting Action Scheduler rows would be irreversible and is forbidden.

**Two integration dependencies must land before any subscription migrates.** First, Labs
becomes sole membership truth for migrated subscriptions: the Woo SSO sync path must skip any
identity holding a `billing_subscriptions` row rather than overwriting it with Woo's frozen
view — without this we recreate the rejoin-desync and Castaway classes of silent failure.
Second, Discord roles and ActiveCampaign tier tags currently hang off Woo subscription hooks
(548+ Discord role actions fired last month), so Labs must emit those transitions itself,
verified in shadow mode by diffing intended roles against Discord's actual roles.

**Deliberately out of scope.** Sales tax: Woo collects none today (`woocommerce_calc_taxes = no`,
zero tax-rate rows), so this is a net-new business decision and not a migration task. Stripe
Billing's Smart Retries are lost and replaced by a fixed +1/+3/+5/+7-day ladder, which is
measurably worse and accepted. Stripe's automatic card updater is retained, since it operates
on PaymentMethods attached to Customers independent of Billing.

**Open rulings carried into build** (Spec §11): disposition of the 42 on-hold subscriptions
(spec default: quarantine, charge nothing); grace window confirmed at 7 days; the retry ladder;
whether the 3 comped accounts become granted memberships with no billing subscription; the
statement descriptor; and dispute policy (spec default: hold access, do not auto-revoke).

**Closes** Funnel/Cutover review ruling #6 (PayPal migration gap).
