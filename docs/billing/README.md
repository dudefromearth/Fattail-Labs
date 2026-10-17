# Native Billing v2.0 — FatTail Labs owns the subscription

Everything for the merchant-initiated billing project lives in this folder.

**Status:** spec'd, drawn up, and infrastructure-tested — **121 assertions passing**.
Nothing is wired, deployed, or applied to any live system. Awaiting Coach ruling on
DL-532 and the five open questions in SPEC §11.1.

**Design is settled. What remains is building the surfaces and getting keys — see
*What's actually left* below.**

---

## The folder

| File | What it is |
|---|---|
| **[SPEC](../../Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md)** | The spec, 16 sections. Data model, failure-point register, migration, cutover runbook, and **§15 — what is proven vs what is still assumed**. Supersedes `Native-Billing-Stripe-Spec-v1.0` |
| **[ANALYSIS-three-blockers.md](ANALYSIS-three-blockers.md)** | The three "a paying member silently gets nothing" blockers, read from the code. One was overstated, one is worse than described, and a fourth problem was found |
| **[GAP-ANALYSIS.md](GAP-ANALYSIS.md)** | What is built, what is **built but never runs**, and what is not built at all. Verified against the code, not recalled |
| **[SETUP-for-ernie.md](SETUP-for-ernie.md)** | Forward-as-is instructions for Ernie: the Stripe restricted key, three dashboard settings, and why PayPal needs nothing yet. Webhooks deliberately deferred |
| **[SECURITY-ac-key-exposure.md](SECURITY-ac-key-exposure.md)** | ⚠️ **Read first.** A live credential leak found while analysing the plugins — unrelated to billing, fix today |
| **[ANALYSIS-ac-and-discord.md](ANALYSIS-ac-and-discord.md)** | Deep dive: what creates AC contacts (and what else dies at cutover), and the Discord plugin read in full — including the exact root cause of its silent role-grant failure |
| **[DIAGRAMS.md](DIAGRAMS.md)** | Seven diagrams: ownership before/after, the charge sequence, both state machines, the four no-slip layers, the migration flow |
| **[DL-532-draft.md](DL-532-draft.md)** | Decision-log entry, ready to paste into `Architecture/00-decision-log.md` |
| **[proto/](proto/)** | The tested modules — `periods` · `ledger` · `worker` · `recovery` · `webhooks` · `providers`. Lift into `server/billing/` when the ruling lands |
| **[tests/test_infrastructure.py](tests/test_infrastructure.py)** | The infrastructure proof. 121 assertions, self-cleaning, localhost only |
| **[export-woo-subs.sql](export-woo-subs.sql)** | Read-only export of the live Woo book. Extracts **no PII** |
| **[import-dryrun.py](import-dryrun.py)** | The import transform whose output is recorded in SPEC §9.8 |
| `../../migrations/159_native_billing_v2.sql` | Core billing schema. **Not applied anywhere** |
| `../../migrations/160_billing_discounts.sql` | Discounts/coupons (§16). **Not applied anywhere** |

---

## Run the proof

```bash
cd docs/billing/tests
../../../server/.venv/bin/python test_infrastructure.py [path/to/woo_subs.tsv]
```

**Safety, by construction:** it refuses to start unless `LABS_DB_HOST` is localhost,
creates only the six brand-new billing tables and drops them at the end, ALTERs
nothing, never writes to `schema_migrations`, never contacts the live WooCommerce
database, and asserts the dev database is back to its starting row counts before it
exits. The `woo_subs.tsv` argument is optional — without it the two real-data
sections skip and the other 79 assertions still run.

What it proves, in order: period arithmetic and every clamp case · the §5.4.1 anchor
rule replayed against all 204 datable live subscriptions · ledger constraints ·
a worker cycle · two workers racing one subscription · crash recovery · transport
failure · the decline ladder, hard declines and 3DS · both circuit breakers · a
finite-term lifecycle · webhook replay and out-of-order · all four reconciliation
checks · money representation · and a full shadow cycle over 157 real subscriptions
with zero provider calls.

---

## The four things most likely to be got wrong

1. **`anchor_at` is the DUE DATE, not `_schedule_start`** (SPEC §5.4.1). Anchoring on
   the start date reproduces Woo's real date on only 88 of 204 subscriptions; the
   rest drift by up to 30 days.
2. **An existing subscriber's amount is never derived from a plan price** (§7.3, §9.3).
   **49 subscriptions have a deliberately set price** — 39 Activators at $67 instead of $97,
   Navigators at $217 and $160.20, a Quarterly at $400 instead of $597, and four comped at
   $0. `amount_locked = 1` forbids any bulk or admin operation from changing them. Three of
   the underlying coupons expire — one tomorrow — so the stored amount is also what protects
   those prices.
3. **`max_periods` is derived from `ends_at`, never from the product** (§8.4). Live
   Observer terms are 1, 2, 4, 5, 6 **and 12** weeks.
4. **The ledger row is committed before the provider is called** (§5.3). Reversing
   those two steps makes every crash an unanswerable question.

## Bugs and gaps the testing caught in the spec itself

| Found | Fix |
|---|---|
| Anchor rule drifted on 116 of 204 subscriptions | §5.4.1 — anchor on the due date |
| `max_periods` hardcoded to 6 | derive from `ends_at` |
| Dunning ladder ran `+1/+3/+5` — the 4th rung never scheduled | `>` not `>=` in `worker.py` |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` resolves in the **session** zone, and local MySQL runs `time_zone=SYSTEM` | billing connections `SET SESSION time_zone='+00:00'` (§7.16). **Not** globally in `db.py` — that would change how the rest of the app reads its TIMESTAMP columns |
| A semicolon inside an **inline** SQL comment splits a statement in `server/migrate.py`, which strips only full-line comments | no semicolons in inline comments; `migrate.py` is worth hardening separately |
| Product 12234 (Navigator Quarterly) missing from the plan map | added — and the quarantine rule had already caught it |
| Subs #4744 / #5170 list the same product twice | group by subscription id, read `_order_total` once, never sum line items |
| Refund path and proration existed only as prose — arithmetic on money with no code | implemented in `ledger.refund` and `periods.prorated_credit`, over-refund refused in the write path |
| PayPal `PENDING`, the alumni grant and the §16.4 step-up columns were coded or declared but no test touched them | all three now exercised (§13.1 §10d) |
| The worker's expiry path had silently dropped the alumni tenure check that v1.0's webhook did | restored, and the delegation is asserted |

## The one thing still unproven

Everything in the design is tested. What is **not** tested is a real charge against a real
credential — Stripe off-session on a Woo-saved `pm_`, and a PayPal charge against an existing
vault token. Both need keys and a merchant account, not more design. SPEC §15.2 lists them
with how each gets settled: five weekly Observers at $17 for Stripe, and exactly one live
charge against one token for PayPal, before any tranche.

## Humans needed before any cutover

| Action | Subscriptions |
|---|---|
| Re-authorize PayPal — no vault token | **#9661** Navigator Annual $1,997 · **#12406** Observer $17 |
| ~~Needs a ruling~~ **confirmed deliberate** → status `manual_billing` | **#5210** $97/mo · **#7908** $267/mo |
| ~~Convert to granted membership~~ **confirmed deliberate** → status `comped` | #6908 · #6911 · #6913 · #12264 (all $0) |
| Review as a list, charge nothing | the 42 on-hold (21 of them 90+ days overdue) |
| ~~Confirm the term~~ honoured as written via `ends_at` | **#11390** — Observer on a 12-week term |
| **Look at before 2026-10-15** — `birthday-E` expires tomorrow; `founders-A` (38 subs) no longer exists as a coupon at all. A live Woo fragility, not a migration one (SPEC §11.3) | 45 subscriptions |

SPEC §11 shrank from nine questions to five once the pricing turned out to be deliberate
(§11.2). Nothing blocks building.

Nine subscriptions and one list. The other 154 import and bill untouched.

## Known collisions with work in flight

- **`server/routes/billing.py` is already modified in Ernie's working tree** — the
  `_woo_billing_url` portal fallback that sends "Manage billing" to WooCommerce
  My Account. v2.0's `/me/billing` replaces that destination. Coordinate before
  anyone edits that file.
- **The migration is numbered 159, not 134.** `134` is taken by
  `134_wiki_contracts.sql` on `origin/main`, which is at 158 while some checkouts
  sit at 133. Rebase before applying.

---

## What's actually left

**Design: done.** Data model, period arithmetic, ledger, worker, dunning, recovery,
reconciliation, webhooks, the Woo import, discounts, and the integration list are all
specified and 121 assertions pass against a real database. Nothing in the design is
outstanding.

**What is not done is the build.** Roughly a quarter of the code exists, and it exists as
*prototypes in `proto/`* — they prove the mechanisms, they are not production modules in
`server/`.

### 0. First, what a coverage audit changed
Cross-referencing every spec section against the code and the suite found six money paths in
the worst possible state — **specified, some of them coded, none of them exercised by a test**.
A module like that reads as finished. All six are now implemented and proven: refunds and the
over-refund guard, proration both directions, the §16.4 discount step-up and its notice guard,
the PayPal `PENDING` branch, and the alumni-grant wiring on expiry. See SPEC §13.2 for the
full audit, including what is still **not** built.

### 1. Provider clients — BOTH of them, and the only genuinely unproven thing
Real Stripe and PayPal HTTP calls. The request shapes are written and unit-tested; no live call
has ever been made.

**Stripe and PayPal ship together.** PayPal is **50 of 171 active subscriptions (29%)**.
Migrating Stripe first would leave Woo billing those 50 for months — and Woo billing them means
Woo keeps writing their memberships, AC tags and Discord roles, so §7.13 would hold for some
identities and not others. A conditional dual-write is worse than either pure state. It would
also defer the spec's biggest unknown (does a Woo-created vault token charge for us?) until
after 116 Stripe subs had been committed. See §9.8.

PayPal's builder should be **ported from PPCP's PHP** rather than written from docs (§6.2).
Both are proven in the same pilot: 5 weekly Observers at $17 — 3 Stripe, 2 PayPal (§15.2).

### 1b. The membership plugins — analysed, see SPEC §18
**Fifteen** files, ~5,600 lines, carrying the AC tag model and the whole upgrade/downgrade
decision engine. (The first pass found twelve by grepping for AC/Discord strings; a full sweep
of all 36 active plugins found three more — §18.11.) The analysis changes the plan in two ways: **six of the twelve files (~600 lines) do not
need porting at all** — they exist only to patch WooCommerce's subscription-centricity, and a
one-off purchase is first-class in Labs — and the event-driven tagging should be **replaced by
desired-state reconciliation**, not ported, because three independent systems here have already
drifted silently (Castaway dead 3 months, Discord roles needing a self-healing cron, 10 orders
never remediated).

Three integrations the first pass missed, all hooking subscription transitions: **`fattail-trial-bot`**
(all five statuses — the Observer trial dashboard goes blind without them), **`fotw-0dte-discord-bridge`**
(a *second* Discord guild, with a kick-on-inactive hook), and the exact tier maths in **`fotw-sso`**
(membership-first with a subscription fallback, and Coaching plan 1943 → Navigator by business rule).
Thirteen subscription-transition hooks across four files, not four across one.

### 2. Three blocking integrations — before ANY subscription migrates
Not billing code, but nothing can cut over without them (§17):
- Woo SSO sync must **skip** identities holding a `billing_subscriptions` row (§7.13)
- Labs must emit **Discord role** transitions (548+/month today ride Woo hooks)
- Labs must emit **ActiveCampaign tier tags**

### 3. The surfaces nobody can use it without
`/checkout` (Elements + PayPal, strict CSP) · `/me/billing` · `/billing/confirm/{id}` for 3DS ·
`/admin/billing` quarantine queue, retries, refunds, halt/resume · `/admin/billing/discounts`.
Checkout is the hard gate: until it exists, Labs cannot sell anything at all.

### 4. Emails
Four dunning emails, receipts, advance renewal notice, and the price-change notice §16.4
requires. All ride the existing `notify.py` SMTP path.

### 5. Lift and wire
`proto/*` → `server/billing/*`, split `reconcile.py` out of `recovery.py`, write the real
`migrate_woo.py` (reads Woo directly rather than a TSV), and two **LaunchDaemon** plists —
not GUI LaunchAgents, which die on console logout.

### 6. Nine subscriptions and one list, by hand
See the table above. Chiefly #9661 ($1,997, no PayPal token).

### Build order

**Step 0 — not this project, do it today.** Fix the AC key exposure
([SECURITY-ac-key-exposure.md](SECURITY-ac-key-exposure.md)). Moving the `*.bak*` files out of
the webroot is one command and stops it immediately; rotation can follow.

Then two tracks, which are independent until cutover:

```
TRACK A — integrations (no Stripe keys needed, gates CUTOVER)
  A1  desired_state() + DRIFT REPORT, read-only          ← START HERE
  A2  reconcile Discord roles (add-only first)
  A3  reconcile AC tags
  A4  SSO-sync skip (§7.13)

TRACK B — billing (no Stripe keys needed until B3, gates SELLING)
  B1  lift proto/ -> server/billing, apply migrations 159+160 to dev
  B2  importer reads Woo directly -> SHADOW MODE, 14-day clock starts
  B3  BOTH provider clients (Stripe + PayPal) + 5 live $17 Observer charges
      — 3 Stripe, 2 PayPal. PayPal is 29% of the book, not a later phase
  B4  checkout + /me/billing + 3DS confirm page
  B5  emails, admin surfaces, then discounts (§16)
```

**A1 is the first thing to build.** It is read-only, needs no keys and no decisions, cannot
break anything, and it validates the one function everything else in Track A depends on
(`desired_tags` / `desired_roles`) against 171 live members before it is ever allowed to write.
It will also find existing drift — we already know of two sources: the Discord grant silently
no-ops on a lapsed member token (ANALYSIS §2.4), and Castaway is configured on exactly one of
six products (ANALYSIS §2.6).

**B2 before B3** because the 14-day shadow diff is the long pole and needs no keys — start that
clock as early as possible.

Discounts are last: migrated members carry their price in `amount_minor` and bill correctly
with no coupon engine present. You need §16 before you next want to *sell* on a code, not
before cutover.
