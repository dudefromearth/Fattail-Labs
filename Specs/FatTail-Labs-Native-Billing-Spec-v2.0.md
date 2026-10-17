# FatTail Labs — Native Billing Spec v2.0 (Merchant-Initiated)

**Status:** DRAFT for Coach ruling — **spec'd, drawn up, and infrastructure-tested.**
The data model, period arithmetic, ledger, worker, recovery, reconciliation, webhook
ingestion and the Woo import transform are all built and passing **121 assertions**
against MySQL 8.0.41 (§13.1). Nothing is wired, deployed, or applied to any live
system. Five rulings are open (§11.1).

**Home:** this spec lives in `Specs/` per the repo convention (AGENTS.md: *Specs under `Specs/`;
human explainers under `docs/`*). Its companions — `DIAGRAMS.md`, `DL-532-draft.md`, the tested modules in
`proto/`, the proof in `tests/test_infrastructure.py`, and the read-only export + import
transform — are in **`docs/billing/`**. Start at `docs/billing/README.md`.

**Supersedes** `Specs/FatTail-Labs-Native-Billing-Stripe-Spec-v1.0.md`
(approved-as-built 2026-07-21, **never wired** — `GET /api/billing/plans` returns
`enabled:false` in production to this day; no `STRIPE_SECRET_KEY` has ever existed).
**Parent specs:** Identity & Access v1.0 · Membership Tiers & Enrollment v1.0 · Access Control v0.4
**Reverses:** `Architecture/05-security-and-access.md` §4 ("No payment card data in Labs
(Stripe/Woo own checkout)") — **partially**. See §2.3. Requires **DL-532**.
**Open ruling it closes:** Funnel/Cutover review ruling #6 (PayPal migration gap).

**Migration:** `migrations/159_native_billing_v2.sql` — **not applied anywhere.**
Numbered 159, not 134: `134` is taken by `134_wiki_contracts.sql` on `origin/main`,
which sits at 158 while some local checkouts are at 133. Rebase before applying.

**Diagrams:** ownership before/after, the charge sequence, both state machines, the
four no-slip layers and the migration flow are in
[`DIAGRAMS.md`](../docs/billing/DIAGRAMS.md) — read it alongside §5 and §7.

---

## 0. Why v2.0 exists, and what changes

v1.0 made Stripe the owner of the subscription: hosted Checkout in `mode=subscription`,
Stripe Billing driving renewals, the webhook as the only source of membership truth. Labs
was a passive listener.

v2.0 inverts that. **Labs owns the subscription.** Stripe and PayPal are reduced to what
they already are in the current WooCommerce setup: vaults that hold a reusable
authorization and charge it when told to.

This is not a new system. It is the same seams — `provider_plan_map`, `identity_links`,
`upsert_membership` — with a schedule, a ledger, and a worker added underneath.

> **Note on redaction.** Coupon codes, customer identifiers and key fragments are masked
> throughout (`founders-A`, `cus_REDACTED`…). Some of those discount codes are still live and
> this repository is public. The real values are in the WordPress database; the mapping is
> recoverable from `wp_woocommerce_order_items` for anyone who needs it internally.

### 0.1 The discovery that makes this cheap

The live FatTail WooCommerce store is **already running merchant-initiated billing**. It was
never provider-owned:

| Evidence | Value |
|---|---|
| `_ppcp_enable_subscription_product` across all 9 subscription products | **`no`** — PayPal's Subscriptions API is not in use anywhere |
| `_requires_manual_renewal` on 50 active PayPal subs | **`false`** — Woo charges them itself |
| PayPal vault tokens in `wp_woocommerce_payment_tokens` | **132 PayPal + 1 Venmo** |
| Stripe gateway mode | saved-PaymentMethod charges; **zero** Stripe Billing subscription objects |
| Active Stripe subs with both `cus_` and a modern `pm_` | **116 / 116** |
| Stripe account | `pk_live_REDACTED`, live mode, Ernie's own |
| WooPayments | enabled but `wcpay_account_data` errored (null data, 6 consecutive failures) — **dead** |
| The renewal trigger | `wp_actionscheduler_actions` rows, hook `woocommerce_scheduled_subscription_payment` — **162 pending**, soonest today, furthest **2031-10-03** |

Two consequences:

1. **PayPal vaulting is already enabled** on merchant `M22DBMQN686X8` (ernie@dudefromearth.com).
   It is not a blocker and does not need requesting. Existing PayPal subscribers do **not**
   need to re-approve — with two named exceptions (§9.4).
2. **There is no Stripe account to migrate between.** Labs has none. It adopts Ernie's
   existing live account, and card migration becomes a no-op: the `cus_`/`pm_` pairs already
   in Woo's database are immediately chargeable.

### 0.2 "Stripe" vs "Stripe Billing" — read this before the table below

An easy and expensive misreading, so stated plainly:

| | |
|---|---|
| **Stripe** — the payment processor | **CORE. Fully integrated. Nothing is reduced.** It holds the card, it moves the money, and *every single renewal in this system is a Stripe API call.* |
| **Stripe Billing** — a specific Stripe *product* | **Not used.** Subscription objects, Prices, Invoices, Customer Portal, Smart Retries. This is the layer that would own the *schedule* — and Labs owning the schedule is the entire point of v2.0. |

What Labs uses from Stripe is most of the core payments API: **Stripe.js / Elements** (checkout
and tokenization), **Customers**, **PaymentMethods**, **SetupIntents**, **PaymentIntents**
(the charge itself), **Refunds**, **Disputes**, **Balance transactions**, **webhooks**, plus
automatic card updater and Radar for free. That is a deep integration, not a thin one.

**The clearest way to see it:** this is *already* how WooCommerce works today. Woo does not use
Stripe Billing either — §0.1 verified **zero Stripe Billing subscription objects** on the
account. Woo uses Stripe purely as a processor and keeps the schedule itself, in Action
Scheduler.

So v2.0 does **not** reduce the Stripe relationship at all relative to today. It keeps it
identical, and moves the *calendar* from WooCommerce to Labs. The same is true of PayPal: the
vault stays, PayPal's Subscriptions API stays unused — exactly as now.

### 0.3 What we are giving up by leaving Stripe Billing behind

Name it honestly, because each one becomes our job:

| Lost | Replacement in this spec |
|---|---|
| Smart Retries (ML-timed retries) | Fixed retry ladder, §7.4. Measurably worse. Accepted. |
| Invoice objects + hosted invoice pages | `billing_charges` ledger + emailed receipts, §6.5 |
| Dunning emails | Our own sequence, §7.5 |
| Proration maths | Explicit, §8.2 |
| SCA/3DS recovery UI | Hosted confirm page, §7.6 |
| Tax calculation | **Nothing — Woo isn't doing it either.** `woocommerce_calc_taxes = no`, zero rows in `wp_woocommerce_tax_rates`. Not a migration task; a separate business decision. |

**Retained for free:** Stripe's automatic card updater operates on PaymentMethods attached to
Customers, independent of Billing. Confirm it is on in the Dashboard before cutover; it is a
material slice of involuntary churn.

---

## 1. The three ownership statements

Everything in this spec follows from these. If an implementation detail contradicts one,
the detail is wrong.

1. **Labs owns the schedule.** The due date for every renewal is a column in a Labs table.
   No provider, no WordPress table, and no Action Scheduler row is consulted to decide
   whether money is owed.
2. **Labs owns the money record.** Every attempt to move money — successful, failed,
   abandoned, refunded, disputed — is a durable row written **before** the provider is
   called and updated after. The ledger is the audit trail; provider dashboards are
   corroboration, never source.
3. **Providers own only the credential.** Stripe holds `cus_`/`pm_`. PayPal holds a vault
   token. Labs holds references to them and never the instrument itself.

---

## 2. Principle, PCI scope, and the pillar amendment

### 2.1 Card data still never touches the server

Checkout moves to `labs.fattail.ai`, but the instrument does not. Stripe Elements and the
PayPal JS SDK tokenize **in the browser**; the server receives a `pm_…` or a vault token.

### 2.2 PCI scope — state it precisely

Hosted Checkout (v1.0) would have been **SAQ A**. Elements embedded in our own page is
**SAQ A-EP**. That is a real step up: it brings our page's integrity into scope (CSP,
Subresource Integrity, change control on the checkout route). It is **not** "we now handle
cards," and it does **not** make us a cardholder-data environment.

**Binding requirements that follow:**
- The checkout route serves a strict CSP; Stripe/PayPal SDKs are the only permitted script origins.
- No third-party tag manager, analytics injector, or A/B tool on the checkout route. Ever.
- Any change to `web/app/checkout/**` requires a named reviewer in the PR.

### 2.3 The amendment to Architecture 05 §4

**Current:** "No payment card data in Labs (Stripe/Woo own checkout)."

**Replacement:**
> **4. No payment card data in Labs.** The instrument is tokenized in the browser by the
> provider's SDK; the server stores only provider references (`cus_`, `pm_`, PayPal vault id).
> Labs **does** own the subscription schedule, the charge ledger, and the merchant-initiated
> charge decision (Native Billing v2.0, DL-532). Labs renders billing UI; Labs never receives,
> logs, or persists a PAN, CVV, or expiry beyond the provider's own display metadata
> (brand + last4 + exp month/year, which are not cardholder data under PCI DSS).

The clause "the app never invents charges" is **retained and strengthened**, not reversed —
it now means §5.4's deterministic period arithmetic: a charge exists only when a stored
schedule says it does, never from a request parameter, a price lookup at charge time, or a
provider event.

---

## 3. Config

All optional. Absence disables the provider and every endpoint reports disabled — the
standalone guarantee from v1.0 holds unchanged.

```
# Stripe (adopt Ernie's existing live account — the one Woo uses)
STRIPE_SECRET_KEY                 sk_live_…
STRIPE_PUBLISHABLE_KEY            pk_live_REDACTED
STRIPE_WEBHOOK_SECRET             whsec_…

# PayPal — REUSE PPCP's existing credentials verbatim.
# Source: wp_options → woocommerce-ppcp-data-common → client_id / client_secret
# (merchant M22DBMQN686X8). Reusing the same REST app removes any doubt about
# whether vault ids resolve.
PAYPAL_CLIENT_ID                  BAAL…REDACTED
PAYPAL_CLIENT_SECRET              …
PAYPAL_WEBHOOK_ID                 …
PAYPAL_API_BASE                   https://api-m.paypal.com

# Worker
LABS_BILLING_MODE                 off | shadow | live        (default off)
LABS_BILLING_WORKER_INTERVAL_SEC  300
LABS_BILLING_LEASE_SEC            900
LABS_BILLING_DAILY_CAP_MINOR      750000                      # $7,500/cycle circuit breaker
LABS_BILLING_ALERT_EMAILS         ernie@…,conor@…
LABS_WEB_ORIGIN                   https://labs.fattail.ai
```

`LABS_BILLING_MODE` is the master switch and the whole safety story. See §10.
Stripe credential specifics — restricted-key scopes, webhook events, account settings — in §3.1.

### 3.1 Stripe credentials — exactly what to create, and why restricted

Three separate secrets, created once, none of them in source code.

| Secret | Where it comes from | Where it lives |
|---|---|---|
| `STRIPE_PUBLISHABLE_KEY` | Dashboard → API keys. **Public by design** — it ships to the browser for Elements | the plist, and the checkout page |
| `STRIPE_SECRET_KEY` | **A new RESTRICTED key** (Dashboard → API keys → *Create restricted key*), NOT the account's standard secret key | the launchd plist only |
| `STRIPE_WEBHOOK_SECRET` | Created when you add the Labs webhook endpoint. Per-endpoint, unrelated to the API key | the launchd plist only |

#### Why a restricted key, not the standard secret

Labs is adopting Ernie's **existing live account**, which WooCommerce also charges through. A
standard secret key can do everything on that account — move payouts, cancel Woo's
subscriptions, read the entire customer base. A restricted key scoped to what the worker
actually does means a leaked Labs key cannot touch Woo's billing or move money out.

That is not theoretical on this estate. The AC API key is currently readable over HTTPS from
eight plugin backup files (§18.10). Assume any secret can leak and size the blast radius
accordingly.

Use a **separate** restricted key for Labs — do not reuse or share Woo's gateway key. They
should be independently revocable.

#### The permissions to grant

⚠️ **Do not take the table below as the literal dashboard list.** Stripe's own documentation
does **not** enumerate the resource names, they vary by dashboard version, and an earlier draft
of this spec listed a "Refunds — write" permission that Ernie could not find on screen
(2026-10-16). Treat this as *the calls we make*, and derive the permissions from them.

**The authoritative method — Stripe's own documented migration path.** Do this rather than
working from any list:

1. Create the key in a **sandbox** with **zero** permissions.
2. Run the code against it.
3. Read the `403` errors. Per Stripe's docs: *"the response body includes an error message
   explaining which permissions to add."*
4. Grant exactly those, re-test until clean, then mirror the same set in live mode.

Their mapping rule is simply `GET` → read, `POST`/`DELETE` → write, on whatever resource the
call touches. `write` implies read.

The calls Labs makes, and the permission each implies:

| Call | Implies | Why |
|---|---|---|
| `PaymentIntent.create` / `.search` | **Payment Intents: write** | the renewal charge (§6.1) and recovery lookups (§7.2) |
| `SetupIntent.create` | **Setup Intents: write** | saving a card at checkout, `usage=off_session` (§8.1) |
| `PaymentMethod.attach` / `.retrieve` | **Payment Methods: write** | attach at checkout; read `brand`/`last4`/`exp_*` for `/me/billing` and the expiry sweep (§7.8) |
| `Customer.create` / `.retrieve` | **Customers: write** | create on signup; read migrated `cus_` |
| `Charge.list` | **Charges: read** | reconciliation (§7.7B) |
| `Refund.create` | **probably Charges: write** — see note | §7.11 |
| `BalanceTransaction.list` | **Balance transactions: read** | daily money total (§7.7C) |
| `Dispute.list` | **Disputes: read** | §7.11 alerting. We never respond via API |
| `Event.list` | **Events: read** | replay missed webhooks from `/v1/events` if the endpoint was down |

**On refunds specifically.** There may be no standalone Refunds entry. Refunds were
historically a charge operation (`POST /v1/charges/{id}/refunds`), so **Charges: write** is the
likely home. Two other explanations if it is simply not visible: the dashboard offers a
*preconfigured permission set* as well as "start from zero permissions", and a preset hides the
full resource list; and the list is long enough to need scrolling or filtering.

**Easiest answer: defer it.** Refunds are an admin action (§7.11) and the admin surface is late
in the build order. Restricted keys are **editable after creation**, so grant whatever refunds
needs when that screen is actually built, guided by its own 403. Nothing in the migration or
the pilot issues a refund.

#### Explicitly NOT needed — and this is the interesting part

| Resource | Why not |
|---|---|
| **Subscriptions** | ⚠️ **none.** Labs owns the schedule. If this is granted, someone can "helpfully" create a Stripe subscription and we end up with two systems billing again — exactly the failure this spec exists to remove |
| **Invoices**, **Quotes**, **Credit notes**, **Customer portal**, **Meters** | all Stripe Billing. Unused (§0.3) |
| **Products**, **Prices** | v1.0 needed Prices to map plans. v2.0 does not — `amount_minor` is per-subscription (§7.3) |
| **Checkout Sessions**, **Payment Links** | we render our own checkout |
| **Coupons**, **Promotion codes** | discounts are Labs-side (§16) |
| **Payouts**, **Transfers**, **Connect**, **Issuing**, **Terminal**, **Treasury** | nothing in this system moves money off the account |
| **Radar rules** (write) | read-only via disputes is enough |

Granting no Subscriptions and no Prices is a deliberate structural guard, not tidiness.

#### The webhook endpoint

Add a **new** endpoint at `https://labs.fattail.ai/api/billing/webhook`. It does not disturb
Woo's existing endpoint — Stripe fans an event out to every subscribed endpoint.

Events to subscribe:

```
payment_intent.succeeded              payment_intent.payment_failed
payment_intent.requires_action        payment_intent.canceled
charge.refunded                       charge.dispute.created
charge.dispute.closed                 payment_method.automatically_updated
setup_intent.succeeded                setup_intent.setup_failed
```

`payment_method.automatically_updated` is the card-updater notification — subscribe to it and
the expiry sweep (§7.8) gets much cheaper.

Note the signing secret authenticates the webhook; `stripe.Webhook.construct_event` needs **no
API key at all**, so the webhook path works even if the restricted key is rotated.

#### Test mode vs live mode — an honest limitation

Test mode has its own publishable/secret/webhook triple, and all the code paths should be
proven there first: declines (`4000000000000002`), 3DS (`4000002500003155`), insufficient funds,
and the dispute flow.

**But the migrated cards exist only in LIVE mode.** No amount of test-mode work proves that
Woo's saved `pm_`s are chargeable off-session by us (§15.2). That is what the five $17 Observer
charges in §9.8 Phase 2 are for, and there is no substitute.

#### Account settings to confirm while in the dashboard

1. **Automatic card updater: ON** (Settings → Payments). Material slice of involuntary churn,
   and it is independent of Billing.
2. **Statement descriptor** set to something a member will recognise (§11.1 ruling 4).
3. **Rate limits** — default live mode is ~100 read / 25 write per second. This book peaks at
   22 charges/day, so limits are a non-issue.
4. **Radar** — check whether any rule would block merchant-initiated charges. Off-session MIT
   with no browser fingerprint can look suspicious to aggressive rules.

### 3.2 PayPal credentials — nothing to request, but one dependency to fix

**Short answer: no new key is needed to start.** The credentials already exist on the
WordPress site, live and in daily use. Verified 2026-10-16 (presence and length only, values
not extracted):

```
wp_options -> woocommerce-ppcp-data-common
  merchant_id             M22DBMQN686X8
  merchant_email          ernie@dudefromearth.com
  merchant_country        US          seller_type   business
  use_sandbox             false       sandbox_merchant  false     <- LIVE
  merchant_connected      true
  use_manual_connection   false                                   <- see the caveat below
  client_id               PRESENT (82 chars)
  client_secret           PRESENT (80 chars)

wp_options -> woocommerce-ppcp-settings
  vault_enabled_dcc       true
wp_woocommerce_payment_tokens (gateway_id='ppcp-gateway')   133 tokens
```

§6.2 recommends reusing exactly these for the **Phase 4.1 proving charge**, because charging an
existing vault token with the identical REST app removes every doubt about whether the token
resolves. That remains the right first move.

#### ⚠️ The caveat: these are partner-issued, not Ernie's own app

`use_manual_connection = false` means the pair was issued through **WooCommerce's PayPal
partner onboarding**, not created by Ernie as a first-party REST app. Consequences:

- They work — PPCP authenticates with them every day.
- But they are **tied to the WooCommerce plugin's connection**. Disconnecting PPCP,
  reconnecting it, or removing the plugin could revoke them.
- So if Labs billing runs on these credentials long-term, **Labs' PayPal charging depends on a
  credential controlled by the plugin we are decommissioning.** That is a latent outage waiting
  for whoever eventually uninstalls PPCP.

#### The recommended two-step

| When | Credential | Why |
|---|---|---|
| **Phase 4.1** — the single proving charge | **reuse PPCP's** `client_id` / `client_secret` | identical app ⇒ vault ids unambiguously resolve. Proves the mechanism with one variable, not two |
| **Before the PayPal cohort migrates** | **Ernie's own live REST app**, same business account, with **Vault** enabled | own, independently revocable credential; no dependency on the Woo plugin's onboarding. Mirrors the restricted-key argument in §3.1 |

Switching apps needs **one** re-test: charge one existing vault token with the new app's
credentials. Vault tokens are scoped to the **merchant**, not the app, so this should work —
but "should" is not "did", and it is a single cheap charge to find out. Do it while PPCP is
still able to bill, so a failure costs nothing.

To create it: developer.paypal.com → Apps & Credentials → **Live** → Create App, under the
business account that owns `M22DBMQN686X8`, then enable **Vault** on the app.

#### `PAYPAL_WEBHOOK_ID` is genuinely new either way

PPCP already has its own registered webhook (`ppcp-webhook` option). Labs needs a **separate**
endpoint — never a shared one — registered against whichever app it uses. Registering it
returns a webhook id, which is what
`POST /v1/notifications/verify-webhook-signature` requires (§6.3). Unlike Stripe, PayPal
signature verification is an **API call**, so it needs working credentials as well as the
webhook id.

Events to subscribe:

```
PAYMENT.CAPTURE.COMPLETED      PAYMENT.CAPTURE.DENIED
PAYMENT.CAPTURE.PENDING        PAYMENT.CAPTURE.REFUNDED
CUSTOMER.DISPUTE.CREATED       VAULT.PAYMENT-TOKEN.DELETED
```

`VAULT.PAYMENT-TOKEN.DELETED` matters most: a customer can revoke a vaulted token from inside
their own PayPal account with no notice to us. Without this event, the first we learn is a
failed renewal (§6.2).

#### Sandbox

PayPal sandbox credentials are a separate app and separate merchant. Use them for the decline,
pending-capture and webhook-verification paths. As with Stripe, **the live vault tokens exist
only in live mode**, so sandbox cannot prove the thing that actually matters.

---

## 4. Exactly how we store the data

*Implemented by `migrations/159_native_billing_v2.sql` · proven by §13.1 sections 3–5.*


MySQL/InnoDB, utf8mb4, matching the existing Labs schema.
**Migration `159_native_billing_v2.sql`** (see the header for why 159, not 134).

### 4.0 Money and time rules — non-negotiable

- **Money is `INT UNSIGNED` minor units.** `199700` = $1,997.00. No `DECIMAL` in arithmetic,
  no floats anywhere in the billing path. Currency is a sibling column, always `USD` today
  (all 213 live subs are USD — verified).
- **All timestamps are `DATETIME` in UTC.** No `TIMESTAMP` columns in billing tables: they
  carry implicit session-timezone conversion, which is exactly the bug class we cannot
  afford. The Hostinger MySQL server runs UTC (`NOW() == UTC_TIMESTAMP()`), and Woo's
  `_schedule_*` meta is already UTC — but **note the trap**: that site's `gmt_offset` option
  is a stale `0` while `timezone_string` is `America/New_York`. Never derive a billing time
  from WordPress's local-time helpers. Read the UTC meta directly.
- **Every row that can be created by a retry carries a natural unique key.** Double-charging
  must be impossible by schema, not by careful code.

### 4.1 `billing_subscriptions` — the owned subscription

```sql
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id         BIGINT UNSIGNED NOT NULL,
  plan_id             BIGINT UNSIGNED NOT NULL,

  status              VARCHAR(24) NOT NULL,
    -- BILLING (the worker's due query selects only the first three):
    --   active | past_due | grace | pending_cancel | cancelled | expired | paused
    -- DELIBERATE NON-BILLING (§9.3) — a real membership, never charged, by decision:
    --   comped | manual_billing
    -- FAULT:
    --   quarantined — data we do not understand
  provider            VARCHAR(24) NOT NULL,            -- 'stripe' | 'paypal'
  payment_method_id   BIGINT UNSIGNED NULL,            -- -> billing_payment_methods.id

  -- MONEY: the authoritative recurring amount for THIS subscriber.
  -- Never recomputed from the plan. See §9.3 (34 live subs are discounted).
  amount_minor        INT UNSIGNED NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  amount_source       VARCHAR(32) NOT NULL DEFAULT 'migrated',
                                                       -- migrated | checkout | admin | plan
  amount_locked       TINYINT(1) NOT NULL DEFAULT 1,   -- §9.3 — deliberately SET price.
                                                       -- No bulk change, plan edit or coupon
                                                       -- expiry may ever alter it.
  discount_note       VARCHAR(255) NOT NULL DEFAULT '',-- provenance (the Woo coupon code)

  -- SCHEDULE: deterministic, anchor-based. See §5.4.
  interval_unit       VARCHAR(8)  NOT NULL,            -- week | month | year
  interval_count      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  anchor_at           DATETIME NOT NULL,               -- immutable origin of the series
  period_index        INT UNSIGNED NOT NULL DEFAULT 0, -- periods charged so far
  current_period_start DATETIME NOT NULL,
  next_charge_at      DATETIME NULL,                   -- NULL = nothing further owed
  max_periods         SMALLINT UNSIGNED NULL,          -- DERIVED from ends_at (§8.4), never
                                                       -- from the product. Secondary guard only.
  ends_at             DATETIME NULL,                   -- finite term / prepaid-term end.
                                                       -- PRIMARY stop. Imported from Woo.
  woo_renewals_completed INT UNSIGNED NOT NULL DEFAULT 0, -- display only; NEVER period_index (§5.4.1)

  -- DUNNING
  retry_count         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_retry_at       DATETIME NULL,
  grace_until         DATETIME NULL,
  last_decline_code   VARCHAR(64) NOT NULL DEFAULT '',

  -- CONCURRENCY: worker lease. See §5.2.
  lease_owner         VARCHAR(64) NULL,
  lease_expires_at    DATETIME NULL,

  -- PROVENANCE / ROLLBACK
  woo_subscription_id BIGINT UNSIGNED NULL,
  migrated_at         DATETIME NULL,
  cancel_reason       VARCHAR(64) NOT NULL DEFAULT '',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_bsub_woo (woo_subscription_id),         -- import is idempotent
  KEY ix_bsub_due (status, next_charge_at),             -- the worker's only scan index
  KEY ix_bsub_retry (status, next_retry_at),
  KEY ix_bsub_identity (identity_id),
  CONSTRAINT fk_bsub_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bsub_plan FOREIGN KEY (plan_id)
    REFERENCES plans (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`ON DELETE RESTRICT`, deliberately, against the `CASCADE` used elsewhere in Labs: deleting an
identity must never silently delete its financial history. Cancel, don't cascade.

### 4.2 `billing_payment_methods` — credential references only

```sql
CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  provider          VARCHAR(24) NOT NULL,              -- stripe | paypal
  customer_ref      VARCHAR(255) NOT NULL,             -- cus_… | ppcp_customer_id
  method_ref        VARCHAR(255) NOT NULL,             -- pm_… | PayPal vault id
  kind              VARCHAR(16) NOT NULL DEFAULT 'card',-- card | link | paypal | venmo
  brand             VARCHAR(24) NOT NULL DEFAULT '',   -- display only
  last4             CHAR(4) NOT NULL DEFAULT '',       -- display only
  exp_month         TINYINT UNSIGNED NULL,             -- expiry sweep, §7.8
  exp_year          SMALLINT UNSIGNED NULL,
  is_default        TINYINT(1) NOT NULL DEFAULT 0,
  status            VARCHAR(16) NOT NULL DEFAULT 'active', -- active | stale | revoked
  mandate_ref       VARCHAR(255) NOT NULL DEFAULT '',  -- Stripe mandate/SetupIntent if known
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bpm_provider_method (provider, method_ref),
  KEY ix_bpm_identity (identity_id, provider),
  KEY ix_bpm_expiry (status, exp_year, exp_month),
  CONSTRAINT fk_bpm_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Nothing here is cardholder data. `brand`/`last4`/`exp_*` are the provider's own display
metadata, explicitly permitted.

### 4.3 `billing_charges` — the ledger, and the double-charge impossibility proof

```sql
CREATE TABLE IF NOT EXISTS billing_charges (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id     BIGINT UNSIGNED NULL,            -- NULL = one-off (e.g. Lifetime)
  identity_id         BIGINT UNSIGNED NOT NULL,
  provider            VARCHAR(24) NOT NULL,

  -- THE IDEMPOTENCY ANCHOR. One row per subscription per billing period. Period.
  period_start        DATETIME NOT NULL,
  period_end          DATETIME NOT NULL,
  period_index        INT UNSIGNED NOT NULL,
  attempt             TINYINT UNSIGNED NOT NULL DEFAULT 1,

  amount_minor        INT UNSIGNED NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',

  status              VARCHAR(24) NOT NULL,
    -- intent | processing | succeeded | failed | requires_action
    -- | abandoned | refunded | partially_refunded | disputed | shadow
  provider_charge_ref VARCHAR(255) NOT NULL DEFAULT '',-- pi_… | PayPal capture id
  provider_intent_ref VARCHAR(255) NOT NULL DEFAULT '',-- pi_… before confirm, for 3DS resume
  idempotency_key     VARCHAR(128) NOT NULL,           -- what we SENT the provider
  decline_code        VARCHAR(64) NOT NULL DEFAULT '',
  failure_message     VARCHAR(512) NOT NULL DEFAULT '',
  amount_refunded_minor INT UNSIGNED NOT NULL DEFAULT 0,

  initiated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at          DATETIME NULL,
  reconciled_at       DATETIME NULL,                   -- §7.7 proof it matched the provider

  PRIMARY KEY (id),

  -- ⬇ THE CENTRAL SAFETY CONSTRAINT.
  -- One (subscription, period, attempt) can exist exactly once. A duplicate
  -- worker, a replayed webhook, a double-clicked admin button, or a crashed
  -- process resuming all collide here and get a DB error instead of a charge.
  UNIQUE KEY uq_chg_period_attempt (subscription_id, period_index, attempt),

  UNIQUE KEY uq_chg_idem (provider, idempotency_key),
  KEY ix_chg_identity (identity_id, initiated_at),
  KEY ix_chg_status (status, initiated_at),
  KEY ix_chg_provider_ref (provider, provider_charge_ref),
  KEY ix_chg_unreconciled (status, reconciled_at),
  CONSTRAINT fk_chg_sub FOREIGN KEY (subscription_id)
    REFERENCES billing_subscriptions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_chg_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

One deliberate consequence of MySQL's NULL semantics: `subscription_id` is NULL for
one-off purchases, and a UNIQUE index permits many NULLs — so `uq_chg_period_attempt` does
not constrain one-offs at all. That is intended. One-off idempotency comes from
`uq_chg_idem (provider, idempotency_key)`, which covers every row including subscription
renewals. Both keys are load-bearing; neither is redundant.

**The ledger is append-mostly.** A row's `status` advances along a one-way path; `amount_minor`,
`period_*` and `idempotency_key` are immutable after insert. No `DELETE` is ever issued
against this table by application code — a mistake is corrected with a compensating refund
row, not an edit.

### 4.4 `billing_refunds`

```sql
CREATE TABLE IF NOT EXISTS billing_refunds (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  charge_id      BIGINT UNSIGNED NOT NULL,
  amount_minor   INT UNSIGNED NOT NULL,
  reason         VARCHAR(64) NOT NULL DEFAULT '',
  provider_ref   VARCHAR(255) NOT NULL DEFAULT '',
  idempotency_key VARCHAR(128) NOT NULL,
  actor          VARCHAR(64) NOT NULL DEFAULT '',      -- admin email | 'system' | 'webhook'
  status         VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at     DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rfnd_idem (idempotency_key),
  KEY ix_rfnd_charge (charge_id),
  CONSTRAINT fk_rfnd_charge FOREIGN KEY (charge_id)
    REFERENCES billing_charges (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Invariant, enforced in code and asserted nightly: `SUM(refunds.amount_minor) <= charge.amount_minor`.

### 4.5 `billing_events` — every provider event, exactly once

```sql
CREATE TABLE IF NOT EXISTS billing_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider       VARCHAR(24) NOT NULL,
  event_ref      VARCHAR(255) NOT NULL,                -- evt_… | PayPal event id
  event_type     VARCHAR(96) NOT NULL,
  provider_created_at DATETIME NULL,                   -- ordering, §6.4
  payload_json   JSON NOT NULL,
  processed_at   DATETIME NULL,
  process_result VARCHAR(255) NOT NULL DEFAULT '',
  error_count    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_evt_provider_ref (provider, event_ref), -- ⬅ webhook dedupe, durable
  KEY ix_evt_unprocessed (processed_at, id),
  KEY ix_evt_type (provider, event_type, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

This replaces `webhook_security.py`'s in-process replay cache **for billing only**. That cache
is explicitly documented as "single-worker launchd is sufficient" — acceptable for membership
sync, unacceptable for money. A process restart must not open a replay window.

### 4.6 `billing_worker_runs` — liveness is a record, not a hope

```sql
CREATE TABLE IF NOT EXISTS billing_worker_runs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  worker_id       VARCHAR(64) NOT NULL,
  mode            VARCHAR(16) NOT NULL,                -- shadow | live
  started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at     DATETIME NULL,
  due_found       INT UNSIGNED NOT NULL DEFAULT 0,
  charged_ok      INT UNSIGNED NOT NULL DEFAULT 0,
  charged_failed  INT UNSIGNED NOT NULL DEFAULT 0,
  skipped         INT UNSIGNED NOT NULL DEFAULT 0,
  amount_minor    INT UNSIGNED NOT NULL DEFAULT 0,
  halted_reason   VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY ix_bwr_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

A cycle that does not write `finished_at` is a detectable incident (§7.9).

### 4.7 DDL verification status

The six `CREATE TABLE` statements in §4.1–§4.6 have been **applied and verified** against
MySQL 8.0.41 (matching the Labs engine), with the foreign keys resolving to the real
`identities` and `plans` tables. All six `ON DELETE RESTRICT` constraints confirmed in
`information_schema`. This now runs as section 3 of the full suite (§13.1); the table
below is the standalone first pass, kept because it names each rejection explicitly:

| Scenario | Result |
|---|---|
| Worker A claims period 1 | accepted |
| Worker B races the same period with a *different* idempotency key | **rejected** — `Duplicate entry '1-1-1' for key uq_chg_period_attempt` |
| Replayed webhook reuses the same idempotency key as a new attempt | **rejected** — `Duplicate entry 'stripe-sub:1:p1:a1' for key uq_chg_idem` |
| Legitimate retry of the same period (attempt 2, new key) | accepted |
| Next period (period 2) | accepted |
| Import re-run on the same Woo subscription | **rejected** — `Duplicate entry '12628' for key uq_bsub_woo` |
| Two one-off charges with `subscription_id = NULL` | both accepted (§4.3 NULL semantics, as intended) |

Note for the implementer: the two racing workers were blocked by *different* keys —
`uq_chg_period_attempt` catches the concurrent-worker case and `uq_chg_idem` catches the
replay case. Both are needed; neither alone covers the other.

The validation ran in a scratch namespace (`ddlchk_*` prefix) which was dropped afterwards.
Migration `159` has **not** been applied to any environment.

Since that first pass the migration has also been applied and dropped in full by
`tests/test_infrastructure.py`, which additionally proves the constraints hold under a
racing second worker, a replayed webhook, a legitimate retry, and a re-run import (§13.1
sections 3–5). The schema is no longer only *syntactically* validated — it is
*behaviourally* validated.

---

## 5. The scheduler: how a payment can never slip

*Implemented by `proto/periods.py` + `proto/worker.py` · proven by §13.1 sections 1, 2, 4, 5, 10.
See `DIAGRAMS.md` §2 (the charge sequence) and §5 (the four no-slip layers).*


Two distinct guarantees. Conflating them is how billing systems fail.

- **Liveness** — a charge that is owed eventually happens. §5.1, §5.3, §7.7, §7.9.
- **Safety** — a charge happens at most once per period. §5.2, §4.3, §6.

### 5.1 The due query is unbounded in the past

```sql
SELECT id FROM billing_subscriptions
WHERE status IN ('active','past_due','grace')
  AND next_charge_at IS NOT NULL
  AND next_charge_at <= UTC_TIMESTAMP()
  AND (lease_expires_at IS NULL OR lease_expires_at < UTC_TIMESTAMP())
ORDER BY next_charge_at
LIMIT 200
FOR UPDATE SKIP LOCKED;
```

There is **no lower bound** on `next_charge_at`. This is the single most important line in
the spec. If the worker is down for six hours, a day, or a week, every missed charge is still
sitting there with a past-due date and gets picked up on the next tick. Nothing is keyed to
"things due in the last 5 minutes," so no outage window can silently drop a renewal.

Corollary: **the worker is crash-safe by construction.** It holds no state. Kill it mid-cycle
and the next cycle reconstructs the entire work list from the table.

### 5.2 Claiming a row (safety under concurrency)

`FOR UPDATE SKIP LOCKED` protects within a transaction; a **lease** protects across process
restarts and the (currently theoretical) second worker:

```sql
UPDATE billing_subscriptions
SET lease_owner = :worker_id,
    lease_expires_at = UTC_TIMESTAMP() + INTERVAL :lease_sec SECOND
WHERE id = :id
  AND (lease_expires_at IS NULL OR lease_expires_at < UTC_TIMESTAMP());
-- 0 rows affected => someone else owns it => skip, do not wait
```

The lease is an optimization. The **correctness** guarantee is `uq_chg_period_attempt` in
§4.3: even if two workers both claim the same row through some lease bug, the second one's
`INSERT` into `billing_charges` fails on the unique key and it aborts before any provider
call. Double-charging requires defeating the database, not the code.

### 5.3 The charge sequence — ledger first, always

For each claimed subscription, in one DB transaction then one provider call:

```
1. Re-read the subscription inside the transaction (guard against a stale read).
2. Compute period_index, period_start, period_end deterministically (§5.4).
3. Assert amount_minor == the subscription's stored amount. A mismatch HALTS this
   subscription and alerts (§7.3). We never charge an amount we computed on the fly.
4. INSERT billing_charges (status='intent', attempt=N, idempotency_key=…).
   -- Duplicate key here => already handled. Release lease, move on. No provider call.
5. COMMIT.  ◀ the intent to charge is now durable and survives any crash
6. Call the provider with the idempotency key.
7. UPDATE the charge row: succeeded | failed | requires_action, + provider refs.
8. On success: advance period_index, current_period_start, next_charge_at;
   reset retry_count; upsert_membership(active). Release lease.
9. On failure: schedule the retry ladder (§7.4); status -> past_due. Release lease.
```

**Step 4 before step 6 is the whole design.** If the process dies between 5 and 7, the next
cycle finds an `intent`/`processing` row older than the lease and runs **recovery** (§7.2) —
it asks the provider "did this idempotency key actually charge?" rather than guessing.

### 5.4 Deterministic period arithmetic

Due dates are computed from the **immutable `anchor_at` plus `period_index` intervals** —
never by adding an interval to `now()`, which drifts a few minutes every cycle and eventually
walks a weekly subscriber across a day boundary.

```
next_charge_at = anchor_at + (period_index + 1) × (interval_count × interval_unit)
```

#### 5.4.1 ⚠️ The anchor is the DUE DATE, not the subscription start

**This was wrong in the first draft of this spec and the live data caught it.** The obvious
reading — anchor on the subscription's start date and walk forward — does not reproduce
WooCommerce's actual schedule. Measured against all 204 datable live subscriptions:

| `anchor_at` sourced from | Subscriptions landing on Woo's exact `_schedule_next_payment` |
|---|---|
| `_schedule_start` (walk forward N intervals) | **88 of 204** — the rest drift, by 1 to **30 days** |
| `_schedule_next_payment` (the due date itself) | **204 of 204**, exact |

Woo's `_schedule_next_payment` has drifted away from a pure `start + N × interval` series
over the life of each subscription — suspensions and resumes, plan switches, and manual date
edits all move it. Recomputing from the start date would therefore charge **116 members on a
different day than they expect**, some by a month. That is a support catastrophe and, for the
ones moved *earlier*, an unauthorized-timing problem.

**Binding rule at import:**
```
anchor_at    = the imported _schedule_next_payment     ← the due date IS the anchor
period_index = 0
```
The first Labs charge then requires **no arithmetic at all** — it fires at the stored value.
Drift is zero by construction, not by calculation. §5.4's interval arithmetic applies only to
period 2 onward, computed from that clean anchor, so the series is drift-free *going forward*
without inheriting Woo's accumulated drift.

Woo's historical renewal count is preserved separately in `woo_renewals_completed` for display
and reporting. It is **never** used as `period_index`, because doing so would reintroduce the
drift this rule exists to eliminate.

Required clamping rules, each a known bug if omitted:

| Case | Rule |
|---|---|
| Monthly anchored on the 29th/30th/31st | Clamp to the last day of the shorter month. Jan 31 → Feb 28/29 → **Mar 31** (clamping never moves the anchor; it is applied per period from `anchor_at`) |
| Annual anchored on Feb 29 | → Feb 28 in non-leap years; returns to Feb 29 in leap years |
| `max_periods` reached | `next_charge_at = NULL`, status → `expired`. Hard guard: even a corrupted date cannot bill a 7th Observer week |
| `ends_at` passed | `next_charge_at = NULL`, status → `expired` |
| DST | Irrelevant — all arithmetic is UTC. This is why §4.0 forbids local-time derivation |

### 5.5 Where the worker runs

A standalone process on the existing `quebec_poller` / `progress.refresh` precedent — **not**
an in-process asyncio task in the API. Rationale: an API deploy or `launchctl kickstart`
must never interrupt a charge cycle, and the worker must be independently stoppable.

```
server/billing/worker.py      # entry: python -m billing.worker
infra/launchd/ai.fattail.labs.billing-worker.plist.example
```

⚠️ **Install as a LaunchDaemon, not a GUI LaunchAgent.** MiniTwo's GUI agents die on console
logout — a known, already-bitten failure on that box. A billing worker that silently stops
when Ernie logs out is the worst possible version of this system. The §7.9 heartbeat is the
backstop, but the daemon is the fix.

---

## 6. Provider adapters

*Implemented by `proto/providers.py` + `proto/webhooks.py` · proven by §13.1 sections 8, 11, 13.
The live provider calls themselves are the one thing still unproven — see §15.2.*


A narrow interface so a third provider is additive:

```python
class Provider(Protocol):
    def charge(self, *, method: PaymentMethod, amount_minor: int, currency: str,
               idempotency_key: str, descriptor: str,
               metadata: dict) -> ChargeResult: ...
    def refund(self, *, charge_ref: str, amount_minor: int,
               idempotency_key: str) -> RefundResult: ...
    def lookup(self, *, idempotency_key: str,
               charge_ref: str | None) -> ChargeResult | None: ...   # recovery, §7.2
```

`lookup()` is mandatory. A provider we cannot interrogate after a crash cannot be used safely.

### 6.1 Stripe — merchant-initiated off-session

```python
stripe.PaymentIntent.create(
    amount=199700, currency="usd",
    customer="cus_REDACTED",
    payment_method="pm_REDACTED",
    off_session=True, confirm=True,
    description="FatTail Navigator Annual — 2027-10-14 → 2028-10-14",
    statement_descriptor_suffix="FATTAIL",
    metadata={"labs_charge_id": "...", "subscription_id": "...", "period_index": "2"},
    idempotency_key="sub:1042:p2:a1",
)
```

**Idempotency-key subtlety that must not be missed:** Stripe idempotency keys expire after
**24 hours**. A retry of the *same period* more than a day later will NOT be deduped by
Stripe. This is precisely why `uq_chg_period_attempt` (§4.3) is the primary defence and the
provider key is only the secondary, intra-day one. Never invert that reliance.

Decline handling:

| Outcome | Action |
|---|---|
| `succeeded` | ledger `succeeded`; advance schedule |
| `CardError`, code `authentication_required` | `requires_action`; store `error.payment_intent.id`; send the 3DS recovery email (§7.6). **Do not** count as a hard decline |
| `card_declined` / `insufficient_funds` / `processing_error` | soft; retry ladder |
| `expired_card` / `incorrect_number` / `pickup_card` / `card_not_supported` | hard; skip remaining retries, go straight to "update your card" (§7.5) and `grace` |
| `APIConnectionError` / `RateLimitError` / 5xx | **not a decline.** Leave the row `intent`, release the lease, let recovery (§7.2) resolve it. Never mark failed on a transport error |

### 6.2 PayPal — vaulted merchant-initiated

Two calls: create order with the vault id, then capture.

```
POST /v2/checkout/orders
Headers: PayPal-Request-Id: <idempotency_key>
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "amount": {"currency_code": "USD", "value": "97.00"},
    "custom_id": "<labs_charge_id>",
    "invoice_id": "labs-sub1042-p7"          // PayPal-side duplicate guard
  }],
  "payment_source": {
    "paypal": {
      "vault_id": "<token>",
      "stored_credential": {
        "payment_initiator": "MERCHANT",
        "payment_type": "RECURRING",
        "usage": "SUBSEQUENT"
      }
    }
  }
}

POST /v2/checkout/orders/{order_id}/capture
Headers: PayPal-Request-Id: <idempotency_key>:cap
```

#### Two PayPal setup facts verified from the docs 2026-10-16

1. **The capability is called "Save payment methods", not "Vault".** In the Developer Dashboard
   it lives under the app's **Features → Payment capabilities**, with a second toggle for the
   PayPal/Venmo instruments under **Features → Payment methods**. Both must be on, in **Live**.
   Nothing in the UI says "Vault", which is what made it hard to find.
2. **We do not need card vaulting.** Saving *cards* requires separate approval for
   "Expanded Checkout". All 133 saved payment methods on the account are PayPal wallet or
   Venmo, so the card capability — and its approval process — is not on our path.

#### ⚠️ FraudNet / RDA is required on the checkout page

PayPal's documentation states that **Risk Data Acquisition is required** for *customer-initiated*
transactions using PayPal and Venmo tokens — implemented via their **FraudNet** (or Magnes)
JavaScript library.

Reading it precisely: our **renewals are merchant-initiated**, so RDA should not apply to them.
It applies to the **checkout flow**, where the customer is present and saving their PayPal
account. So `web/app/checkout/page.tsx` (§8.1) must load FraudNet alongside the PayPal SDK and
pass the session identifier through to the order call.

This interacts with §2.2: the checkout route runs a strict CSP and admits no third-party tags.
FraudNet is a PayPal-origin script and is a **payment-provider** script, not an analytics tag,
so it belongs in the same allow-list as the PayPal SDK itself. Add it deliberately, with a
comment saying why, so a future reviewer tightening the CSP does not remove it and silently
break vaulting eligibility.

Confirm the exact requirement against PayPal's current docs at build time — this is read from
documentation, not from a working integration, and PPCP's own handling of it is the better
reference (see below).

**Build this by porting PPCP's own request builder, not from documentation.** That plugin is
making these exact calls successfully against merchant `M22DBMQN686X8` today — its PHP is the
ground truth for field names, the `stored_credential` block, and the brand/experience context.
Reading its source is a required implementation step, not optional research.

Note `invoice_id`: PayPal rejects a duplicate `invoice_id` for the same merchant. That gives
a **second**, provider-side, non-expiring duplicate guard that Stripe does not offer. Use it.

PayPal specifics:
- Capture is asynchronous more often than Stripe's. `COMPLETED` on the capture response is
  authoritative; `PENDING` means wait for `PAYMENT.CAPTURE.COMPLETED` — treat as `processing`,
  **never** as failed, and never retry a `PENDING` capture.
- `amount.value` is a decimal **string**. Format from minor units exactly once, in one helper,
  with a unit test for `1997.00`, `17.00`, `160.20`. Never `str(float)`.
- Vault tokens are revocable by the customer from their PayPal account with no notification to
  us. `CUSTOMER.PAYMENT-TOKEN.DELETED` → mark the method `revoked`, subscription → `grace`,
  send "reconnect PayPal" immediately rather than waiting for the renewal to fail.

### 6.3 Webhook ingestion — verify, persist, then process

Both providers follow the same three-step path:

```
1. Verify signature (Stripe: construct_event. PayPal: /v1/notifications/verify-webhook-signature).
   Invalid -> 400, nothing persisted.
2. INSERT INTO billing_events (provider, event_ref, …).
   Duplicate key -> return 200 immediately. Already have it. Providers retry aggressively;
   this is the normal path, not an error.
3. COMMIT, then process from the stored row. Processing failure -> 200 + error_count++ and a
   sweeper retries from the table.
```

**Return 200 once the event is durably stored, before processing.** Stripe disables endpoints
that fail repeatedly. Storage is the acknowledgement; processing is our own problem.

### 6.4 Out-of-order events

Providers do not guarantee ordering. `customer.subscription.deleted` can arrive before the
`updated` that preceded it. Every membership-affecting handler compares
`provider_created_at` against the last processed event for that subject and **drops the older
one**. Without this, a late-arriving stale event silently downgrades a paying member.

### 6.5 Receipts

On `succeeded`, send a receipt via the existing `notify.py` SMTP path: amount, date, last4,
plan, period covered, and a link to `/me/billing`. Woo currently sends stock WooCommerce
transactional emails and there is no invoicing plugin on the site, so this is parity, not a
downgrade. **Receipt send failure must never roll back the charge** — queue it and alert.

---

## 7. Failure-point register

*Implemented across `proto/worker.py` and `proto/recovery.py` · proven by §13.1 sections 6–9, 12.
See `DIAGRAMS.md` §5 for how the layers compose.*


The complete list, with detection and mitigation. Columns: what breaks · how we find out ·
what we do.

### 7.1 Double charge
- **Cause:** duplicate worker, lease bug, replayed webhook, double-clicked admin action, resumed crash.
- **Detection:** `uq_chg_period_attempt` violation (logged, counted, alerted if frequent).
- **Mitigation:** structural. The INSERT fails before any provider call. Plus Stripe
  idempotency key (24h) and PayPal `invoice_id` (permanent). Nightly assertion:
  `SELECT subscription_id, period_index, COUNT(*) FROM billing_charges WHERE status='succeeded' GROUP BY 1,2 HAVING COUNT(*) > 1` must return zero rows.

### 7.2 Crash mid-charge — "did it actually go through?"
- **Cause:** process killed, network cut, or MiniTwo rebooted between the provider call and the ledger update.
- **Detection:** sweeper finds `billing_charges` in `intent`/`processing` with
  `initiated_at < now - 10 min`.
- **Mitigation:** **never retry blindly.** Call `provider.lookup(idempotency_key=…)` —
  Stripe returns the original PaymentIntent for a replayed key within 24h; beyond 24h, search
  PaymentIntents by `metadata.labs_charge_id`. PayPal: look up the order by `invoice_id`.
  Resolve the row from the provider's answer. If the provider cannot answer definitively, the
  row goes to `quarantined` and a human is paged. **An ambiguous charge is never retried.**

### 7.3 Wrong amount charged
- **Cause:** someone implements "look up the plan price at charge time." This would raise
  **25 Activators from $67 to $97** and bill **5 comped members** who pay $0.
- **Detection:** §5.3 step 3 asserts the computed amount equals the stored
  `amount_minor`. Plus a pre-flight report in shadow mode diffing every subscription's
  amount against Woo's `_order_total`.
- **Mitigation:** `amount_minor` is per-subscription and authoritative, and
  `amount_locked = 1` on every migrated row (§9.3). Plan price is used **only** at
  new-checkout time to populate it. There is no code path from plan → existing subscription
  amount, and no admin or bulk operation may alter a locked amount. A price change in `plans`
  is explicitly not a migration of existing subscribers (that is a separate, deliberate,
  announced, per-subscription operation).
- **Scale of the error if got wrong:** 39 Activators from $67 to $97, 3 Navigators from
  $217, 2 from $160.20, the Quarterly member from $400 to $597, and four deliberately comped
  members billed. Three of the underlying coupons expire — one of them tomorrow — so the
  stored amount is also what *protects* those prices (§9.3).

### 7.4 Payment fails (soft decline)
*State machine drawn in `DIAGRAMS.md` §3.*
- **Retry ladder** (fixed; we lose Smart Retries):
  `+1 day → +3 days → +5 days → +7 days`, then stop. Four attempts over a week.
- Each retry is a **new `attempt`** on the same `period_index` — so the ledger shows the whole
  story and the unique key still holds.
- ⚠️ Boundary, found by test: grace begins when `retry_count` **exceeds** the ladder length,
  not when it equals it. With `>=` the fourth rung (+7 days) is never scheduled and the member
  is dropped into grace a full attempt early. First failure sets `retry_count = 1` and
  schedules rung 1, so the fifth failure is the one that ends the ladder.
- Status path: `active → past_due` (first failure) → `grace` (set `grace_until = first_failure + 7 days`) → `expired`.
- **Access during grace:** membership stays `grace`, which existing `derive_role` already
  treats as entitled. Member keeps access for 7 days. On expiry → drop to Observer.
- Retries are **skipped entirely** for hard declines (§6.1) — pointless, and repeated hard
  declines raise your decline ratio with the networks.

### 7.5 Dunning
Four emails on the retry ladder, each with a one-click "update payment method" link to
`/me/billing`:
`day 0` payment failed · `day 3` second attempt failed · `day 5` access ends in 2 days ·
`day 7` access reduced to Observer.
Hard decline short-circuits straight to "your card needs updating."
Every send is logged; a failed send alerts rather than silently dropping the member's only warning.

### 7.6 3DS / SCA on an off-session charge
- **Detection:** Stripe `authentication_required`.
- **Mitigation:** ledger → `requires_action`, store the PaymentIntent id, email a link to
  `/billing/confirm/{charge_id}`. That page loads Stripe.js with the `client_secret` and calls
  `confirmCardPayment`. Success webhook (`payment_intent.succeeded`) advances the schedule.
- **Window:** 72 hours, then treat as a soft decline and enter the retry ladder.
- Expected volume on a US card book: low. But the path must exist **before** cutover, because
  the first member who hits it with no recovery page is a cancellation.

### 7.7 A charge is silently never attempted — the reconciliation that catches everything
This is the "never let a payment slip" backstop, and it does not trust our own worker.

Nightly job, independent of the worker:

```
A. LIVENESS: any active subscription with next_charge_at < now - 2 hours
   and no billing_charges row for its current period_index  ->  ALERT (payment slipped)
B. COMPLETENESS: pull all Stripe charges and PayPal captures for the last 48h.
   Any provider charge with no matching ledger row  ->  ALERT (money moved without us)
   Any ledger 'succeeded' with no provider charge   ->  ALERT (phantom success)
   Match -> stamp reconciled_at
C. ARITHMETIC: sum(succeeded) - sum(refunds) for the day vs provider daily total -> must match
D. ORPHANS: any active membership with source='native' and no billing_subscription -> ALERT
   Any active billing_subscription whose identity has no active membership   -> ALERT
```

Check (A) is the direct answer to the question. A missed charge is not merely *eventually*
retried by §5.1 — it is **actively reported within two hours**. Check (B) is the inverse
guarantee: money cannot move at the processor without a ledger row.

### 7.8 Card expiry
Monthly sweep over `billing_payment_methods` where `(exp_year, exp_month)` is within 45 days.
Email the member to update. Stripe's automatic card updater handles many of these silently;
this catches the rest. Involuntary churn from expired cards is the largest avoidable loss in
any subscription book, and it is entirely preventable.

### 7.9 The worker dies
- **Detection:** heartbeat check — no `billing_worker_runs` row with a `finished_at` in the
  last 30 minutes → alert. Checked by a **separate** scheduled job, because a worker cannot
  report its own death.
- **Mitigation:** LaunchDaemon with `KeepAlive`. §5.1's unbounded past-due scan means an
  outage delays charges but never loses them. The alert exists so a multi-day outage is
  noticed on day one, not at month end.

### 7.10 Runaway billing / catastrophic bug
- **Cause:** a date bug marks everything due; a bad migration resets `period_index`.
- **Mitigation — circuit breakers, checked before every cycle and inside it:**
  - `due_found > 3 × trailing-7-day-average` → **halt**, write `halted_reason`, alert, charge nothing.
  - cumulative `amount_minor` in a cycle > `LABS_BILLING_DAILY_CAP_MINOR` → **halt mid-cycle**.
  - any single charge > `3 × subscription.amount_minor` → skip that one and alert.
  - `max_periods` / `ends_at` hard stops (§5.4).
- A halt is loud and manual to clear. Over-caution here costs hours of delayed renewals;
  under-caution costs the business.

### 7.11 Refunds and chargebacks
*Implemented in `proto/ledger.py::refund` · proven by §13.1 section 10d.*
- Refund only via admin action or webhook, always through `billing_refunds` with its own
  idempotency key. Partial refunds supported.
- **The over-refund guard runs in the WRITE path, not only the nightly assertion.** A nightly
  check that discovers an over-refund has already allowed it to happen. `refund()` takes
  `FOR UPDATE` on the charge, sums existing refunds, and refuses the insert if the total would
  exceed the charge.
- `charge.dispute.created` → ledger `disputed`, alert immediately, **do not** auto-revoke
  access (Ernie decides; a dispute is often a confused member, and auto-revoking guarantees
  escalation).
- Chargeback rate is monitored: it is the metric that gets a merchant account closed.

### 7.12 Identity collisions
Labs already has a known class of bug here — one email, two WordPress accounts, two Labs
identities. If billing attaches to the wrong identity, a member pays and someone else gets
access.
- **Mitigation:** `uq_bpm_provider_method` means one `pm_`/vault token maps to exactly one
  identity. At import, any Woo subscription whose email resolves to more than one Labs
  identity is **quarantined, not guessed** (§9.5). Merges use the existing documented atomic
  merge recipe before import, never during.

### 7.13 Dual-write: Woo and Labs both granting access
The highest-risk window in the whole project, and the thing most likely to actually go wrong.
- Both systems can grant/revoke the same membership. Labs already has prior art for this
  going bad (the membership rejoin desync, and the Castaway system failing silently for
  months).
- **Mitigation:** from cutover, **Labs is sole truth for migrated subscriptions.**
  `memberships.source` discriminates: migrated rows become `source='native'`; the Woo SSO
  sync path must **skip** any identity that has an active `billing_subscriptions` row, rather
  than overwriting it with Woo's (now frozen) view. This is a required change to the existing
  `sync_provider_memberships` call path and must land **before** any subscription is migrated.

### 7.14 Downstream side effects stop firing
Discord roles and ActiveCampaign tags currently hang off Woo subscription hooks —
`ets_woo_subscriptions_discord_as_*` fired 548+ times in the last month, and
`membership-auto-upgrade` manages the AC tier tags.
- **Cause:** Woo stops billing → those hooks stop → roles and tags drift. A paying member
  silently loses Discord access.
- **Mitigation:** Labs emits the equivalents directly on membership transition
  (grant/revoke role, set/clear AC tag) **before** cutover, verified in shadow mode by
  diffing Labs' intended role set against Discord's actual role set. Note that Labs' existing
  reconcile job already self-heals roles — extend it rather than duplicating it.
- This is scoped work in its own right and is the main reason cutover is staged by cohort.

### 7.15 Provider outage
- Stripe/PayPal 5xx or timeout → `intent` row stays open, lease released, no status change.
  Recovery (§7.2) resolves it when the provider returns. §5.1 re-picks it up automatically.
- Repeated transport failures in one cycle → exponential backoff and alert. Never convert a
  transport failure into a decline (that would start dunning a member whose card is fine).

### 7.16 Clock skew / DB timezone drift
- All arithmetic in UTC, all columns `DATETIME` (§4.0), `UTC_TIMESTAMP()` in SQL, never
  `NOW()` in a billing query.
- ⚠️ **Asserting UTC is not enough — the connection must SET it.** This was found by the
  first real run of the test suite. `DATETIME ... DEFAULT CURRENT_TIMESTAMP` resolves in the
  **session** timezone, and MySQL here runs `time_zone = SYSTEM`. On a host at BST that means
  `initiated_at` would be written an hour ahead of the `UTC_TIMESTAMP()` values the worker
  writes everywhere else — two timezones inside one money table. The recovery sweeper's
  `initiated_at < UTC_TIMESTAMP() - INTERVAL 10 MINUTE` would then be wrong by the host's
  offset, leaving crashed charges unrecovered for an extra hour (or recovering them an hour
  early). Every billing connection therefore issues:
  ```sql
  SET SESSION time_zone = '+00:00'
  ```
- **Do this on billing's own connections, not globally in `server/db.py`.** `TIMESTAMP`
  columns are stored as UTC and converted on read, so changing the session zone app-wide
  would change what every other feature reads back from its `TIMESTAMP` columns. Billing
  uses `DATETIME` exclusively and must own this setting alone.
- Startup assertion after the SET: `SELECT NOW() = UTC_TIMESTAMP()`. If it still disagrees,
  the worker **refuses to start**.

### 7.19 A semicolon inside an inline SQL comment breaks the migration runner
Also found by the test run, and it is a **repo-wide hazard, not a billing one**.
`server/migrate.py` strips only *full-line* `--` comments before splitting on `;`, so a
semicolon in a trailing inline comment silently splits one statement into two invalid ones.
Migration 159 originally carried `-- display only; NEVER period_index`, which failed with a
syntax error pointing at an apparently blank line. Rules:
- No semicolons in inline SQL comments, in any migration.
- Hardening `migrate.py` to strip inline comments too is worth doing on its own ticket — any
  future migration can hit this, and the error message does not point at the cause.

### 7.17 Migration import is run twice
`uq_bsub_woo (woo_subscription_id)` makes the import idempotent. Re-running updates in place
rather than creating a second subscription for the same member.

### 7.18 Rollback needed after cutover
- Woo subscriptions are **not deleted** and **not cancelled** — only flipped to
  `_requires_manual_renewal = true` (§9.6). Flipping it back restores Woo billing exactly.
- `woo_subscription_id` on every migrated row makes the mapping explicit in both directions.
- Rollback procedure is written, and rehearsed in staging, before cutover — not improvised
  during an incident.

---

## 8. Lifecycle operations

*§8.2 proration and §8.4's finite term are implemented and proven (§13.1 sections 10, 10d).
§8.3's alumni-grant wiring is proven. §8.1 checkout and §8.3's member-facing cancel flow are
specified but not built (§14.2).*


### 8.1 New checkout (the point of all this)
`/checkout` on `labs.fattail.ai`. Stripe Elements or PayPal buttons, member already
authenticated (no anonymous checkout — Labs identity is required, matching the existing
"create account first" rule).
```
Stripe:  SetupIntent (usage=off_session) -> pm_ -> first PaymentIntent (on-session, with 3DS)
         -> billing_payment_methods + billing_subscriptions + first billing_charges row
PayPal:  vault-on-first-purchase order -> vault_id -> same three rows
```
The first charge is **on-session**, so 3DS resolves with the member present and the resulting
mandate makes subsequent off-session charges materially more likely to succeed.

### 8.2 Upgrade / downgrade
Explicit, no magic:
- **Upgrade now:** credit the unused remainder of the current period
  (`amount_minor × remaining_seconds / period_seconds`, floor to minor units), charge the new
  plan's amount less that credit immediately, reset `anchor_at` to now, `period_index = 0`.
  The credit is a ledger row, so the maths is auditable.
  Implemented as `periods.prorated_credit` / `periods.upgrade_charge`.
  **The credit is FLOORED deliberately** — rounding it up would let a member repeatedly
  switch plans to extract fractions of a cent. And when the credit exceeds the new plan's
  price the charge floors at **zero, never negative**: the excess is not paid out, matching
  the no-refund-on-downgrade rule rather than inventing a payout path.
- **Downgrade:** takes effect at `current_period_end`. No refund. Status `pending_cancel` on
  the old subscription, new one created with `anchor_at = period_end`. Avoids the
  refund-then-recharge mess and matches member expectations.
- Both write a `billing_charges` row (even a zero-amount one) so the change is in the ledger.

### 8.3 Cancellation
Member cancels → `pending_cancel`, `next_charge_at = NULL`, `ends_at = current_period_end`.
Access continues to the end of the paid period, then `expired`. The existing alumni tenure
check (≥28 days earns the alumni year) runs on expiry, exactly as the v1.0 webhook path does
today — reuse `maybe_grant_alumni`, do not reimplement.

### 8.4 Observer's 6-week finite term
Product 1718 is a 6-week term, not an open-ended subscription, and it grants
**navigator**-level access via the `observer-trial` plan.
- `interval_unit='week'`, `interval_count=1`, `ends_at` = term end (imported from Woo).
- **`ends_at` is the primary stop and `max_periods` is derived from it**, not from the product:
  `max_periods = floor((ends_at − anchor_at) / interval) + 1`. It exists only to catch a
  corrupted `ends_at` or a clock fault — belt to `ends_at`'s braces.
- ⚠️ **Do not hardcode 6.** The live book does not have a uniform Observer term. Measured
  across 105 Observer subscriptions: **86 are 6 weeks**, 13 are 4 weeks (all now on-hold,
  an older term length), 1 is 5 weeks, 1 is 2 weeks, 2 are 1 week (those four are
  pending-cancel, where `_schedule_end` is the prepaid-term end rather than the term length),
  1 has no end date at all (a comped account, 31 renewals deep), and **1 active subscription
  (#11390) is on a 12-week term**. A hardcoded `max_periods=6` would cut that member's access
  in half. Per-subscription derivation handles all of them without a special case.
- The day-29–42 offer window and the Gate-1 day-42 commitment form are **unchanged** and
  continue to read the journey day, not billing state. Billing must not become their
  dependency.
- **Live data confirms the shape:** 9 active Observers currently have *no* `next_payment` but
  do have a `_schedule_end` within the week — they are in their final period. The import rule
  (§9.2) must handle this explicitly or they get either a 7th charge or a premature expiry.

### 8.5 One-off purchases (Navigator Lifetime, 9816)
A `billing_charges` row with `subscription_id = NULL`, then the existing Lifetime→Navigator
grant path. No schedule. Out of scope for the migration; in scope for the data model so it
isn't bolted on later.

---

## 9. Migration from WooCommerce

*Implemented by `import-dryrun.py` (the verified transform) + `export-woo-subs.sql` ·
proven by §9.8 and §13.1 section 2. See `DIAGRAMS.md` §6 for the cutover flow.*


### 9.0 ⚠️ v1 SHAPE: parallel run — Labs sells new, Woo keeps the existing book

**Decided 2026-10-16.** The rest of §9 assumes migration is Phase 1. It is not. The v1 shape is:

- **Labs takes all NEW signups**, billing them itself, with Stripe *and* PayPal from day one.
- **WooCommerce keeps billing the existing 171** subscriptions, in the background, unchanged.
- The two run **in parallel**, partitioned by where the subscription was born. No member is
  ever owned by both.

**Why this is better than migrating first:**

| | |
|---|---|
| Migration risk | **Zero on day one.** No re-anchoring, no amount deltas, no proving vault tokens against existing customers |
| First live charge | A **new** customer paying **on-session** at checkout — far lower risk than an off-session charge on a migrated card. The off-session question does not arise until their first renewal, 7 days later for an Observer |
| Blast radius | Starts at **zero** and grows one subscriber at a time, rather than 171 at once |
| PayPal | Still required in v1 — not because of the 50 existing PayPal subs, but because **a new checkout without PayPal loses sales on day one** |

**The dual-write concern (§7.13) is satisfied, not violated**, provided the partition is strict:
Labs is truth for any identity holding a `billing_subscriptions` row; Woo is truth for everyone
else. That is a clean boolean, and the §7.13 skip rule implements exactly it. The failure mode
to avoid is a member being *half* in each — which this model never creates, because nothing
migrates.

**What this re-orders:**

1. **`/checkout` becomes the critical path**, not a late deliverable. Until it exists Labs has
   no subscribers at all.
2. **Both provider clients are needed immediately.**
3. **AC contact creation on signup is urgent** — Woo's AC plugin builds contacts from *Woo
   orders*, so a Labs-born member is invisible to it and would receive no email at all
   (`ANALYSIS-ac-and-discord.md` §1).
4. **Discounts (§16) move earlier** — new business will be sold on codes.
5. **§9.2–§9.8 (the importer, the verified transform, the cutover runbook) become deferred,
   not cancelled.** They stay valid and tested for whenever the existing book moves.

**The open question, which does not block anything above:** do the existing 171 *ever* move to
Labs, or does Woo keep them for life? If never, §9 is dead weight and the dual-system tax —
two codepaths for support, two places membership can be written — is permanent. Worth deciding
before the AC/Discord reconciler is designed (§18.6), because it determines whether that
reconciler must understand two owners forever or only temporarily.

### 9.1 What exists, exactly

| | Count |
|---|---|
| Active subscriptions | **171** (Stripe 116 · PayPal 50 · 1 manual-renewal) |
| On-hold | 42 (Stripe 29 · PayPal 13) |
| Pending-cancel | 8 (all with a prepaid-term end) |
| Members with >1 active sub | **1** (169 have exactly one) |
| Line items per subscription | **1** — no bundles, all 171 |
| Currencies | **USD only** (213 active+on-hold) |
| Subscriptions with no `_customer_user` | **0** — nothing orphaned |
| Billing schedules | weekly 77 · annual 49 · monthly 44 · quarterly 1 |
| Active subs on a **recurring coupon** | **34** |
| Renewal volume | ~5–22/day |

### 9.2 Field mapping

| Labs column | Woo source | Notes |
|---|---|---|
| `woo_subscription_id` | `wp_posts.ID` (`shop_subscription`) | idempotency key for the import |
| `identity_id` | `_customer_user` → WP user email → Labs identity | collision → quarantine (§9.5) |
| `plan_id` | line item product → `provider_plan_map` | unmapped → quarantine. Products in the live book: **1718** Observer→`observer-trial`, **1799** Activator→`activator`, **1800** Navigator, **7864** Navigator Annual, **12234** Navigator Quarterly→`navigator`. 12234 was missing from the first draft's map and the quarantine rule caught it — exactly as intended |
| `amount_minor` | **`_order_total` × 100** | ⚠️ **authoritative.** Never the plan price, and **never the sum of line items** — subs #4744 and #5170 each list the same product twice while `_order_total` is already correct. Group by subscription id and read the total once, or those two get double-billed |
| `discount_note` | coupon order_items on the subscription | provenance for the 49 deliberately priced subs (§9.3) |
| `amount_locked` | **always `1`** for migrated rows | §9.3 — a set price may never be changed by a bulk operation, plan edit or coupon expiry |
| `interval_unit` / `interval_count` | `_billing_period` / `_billing_interval` | |
| `anchor_at` | **`_schedule_next_payment`** | ⚠️ **not** `_schedule_start` — see §5.4.1. Zero drift by construction |
| `period_index` | **always `0`** | §5.4.1. Woo's count goes to `woo_renewals_completed` |
| `current_period_start` | derived back from `_schedule_next_payment` | |
| `next_charge_at` | `_schedule_next_payment` | **empty + `_schedule_end` set → NULL** (final period) |
| `ends_at` | `_schedule_end` | set on 76 of 171 active |
| `max_periods` | **derived**: `floor((ends_at − anchor_at) / interval) + 1` | ⚠️ never from the product — Observer terms vary (§8.4) |
| `woo_renewals_completed` | count of completed renewal orders | display/reporting only |
| `provider` | `_payment_method` → `stripe` \| `ppcp-gateway`→`paypal` | |
| `customer_ref` | `_stripe_customer_id` / `ppcp_customer_id` usermeta | |
| `method_ref` | `_stripe_source_id` / `wp_woocommerce_payment_tokens.token` | |
| `status` | `wc-active`→`active` · `wc-pending-cancel`→`pending_cancel` · `wc-on-hold`→**`quarantined`** (§9.6) · `_order_total` 0 →**`comped`** · manual-renewal-with-no-gateway →**`manual_billing`** (both §9.3) | |

The discount mapping, made concrete — this is where money is lost if it's got wrong:

| Coupon | Subs | Effect |
|---|---|---|
| `founders-A` | 25 | Activator at **$67** instead of $97 |
| `founder50` | 3 | Navigator at **$217** instead of $267 |
| `founders-D` | 2 | Navigator at **$160.20** |
| `birthday-E` | 1 | Navigator Quarterly at **$400** |
| `comp-F` | 3 | **$0.00** — comped. Must never be charged |

### 9.3 Deliberately set prices are a first-class state, not an exception

Forty-eight live subscriptions are not on list price. **Every single one is deliberate** —
set by coupon, grandfathered founder discount, or a hand-made comp. Verified: there is no
unexplained price anywhere in the book. The schema therefore treats a set price as a
supported state (`amount_locked`, `discount_note`, and the `comped` / `manual_billing`
statuses) rather than as an anomaly to be reviewed.

#### The list prices — the numbers we must NEVER bill from

Read from `wp_postmeta` rather than assumed:

| Product | ID | Regular | Sale / active |
|---|---|---|---|
| Observer | 1718 | $17 | — (6-week `_subscription_length`) |
| Activator | 1799 | $97.00 | — |
| Navigator | 1800 | $267.00 | — |
| Navigator Annual | 7864 | $2,997.00 | **$1,997.00** |
| Navigator Quarterly | 12234 | $801 | **$597** (3-month interval) |
| Navigator Lifetime | 9816 | $4,997.00 | **$3,000.00** |

#### Every set price in the live book

| Product | They pay | List | Why | Subs |
|---|---|---|---|---|
| Activator | **$67.00** | $97 | coupon `founders-A` (−$30 recurring fee) | **38** |
| Activator | **$67.00** | $97 | coupon `founders-B` (−$30 recurring fee) | 1 |
| Navigator | **$217.00** | $267 | coupon `founder-C` (−$50 recurring fee) | 3 |
| Navigator | **$160.20** | $267 | coupon `founders-D` (−40% recurring) | 2 |
| Navigator Quarterly | **$400.00** | $597 | coupon `birthday-E` (−$197 recurring fee) | 1 |
| Observer · Activator · Navigator | **$0.00** | — | coupon `comp-F` — comped | 3 |
| Navigator | **$0.00** | $267 | hand-made manual comp, no coupon (#12264) | 1 |
| | | | **total deliberately priced** | **49** |

At list for contrast: 104 Observers, 15 Activators, 3 Navigators, 50 Navigator Annuals.

#### ⚠️ Three of those coupons EXPIRE — and Labs is what makes the prices safe

| Coupon | Discount | Expires | Subs |
|---|---|---|---|
| `birthday-E` | −$197 | **2026-10-15 — tomorrow** | 1 |
| `founder-C` | −$50 | 2026-12-31 (78 days) | 3 |
| `founders-B` | −$30 | 2026-12-31 (78 days) | 1 |
| `founders-D` | −40% | never | 2 |
| `founders-A` | −$30 (presumed) | **the coupon no longer exists in `wp_posts`** | **38** |

That last row is the sharpest one. The code `founders-A` survives only as a snapshot in
the subscription's coupon line item; there is no `shop_coupon` post with that title any more.
`founders-B` carries the identical −$30 recurring fee and a `usage_count` of 96, so the two
are almost certainly the same discount renamed at some point — but for 38 paying members the
only remaining record of why they pay $67 is a string in an order-items row.

WooCommerce Subscriptions normally renews against the subscription's own stored
`_order_total`, so an expiring coupon most likely does **not** re-price these members today.
"Most likely" is the problem: a plan switch, an admin edit of the subscription, or a WCS
update that re-validates coupons could put all 45 of them back to list. That is a live
fragility in WooCommerce right now, independent of this project.

**Labs removes it.** `amount_minor` is stored per subscription and `amount_locked = 1`, and
no code path recalculates it. After migration, a coupon expiring upstream — or being
deleted, as `founders-A` apparently already was — cannot change what anybody pays. The
grandfathered prices stop being a side effect of coupon state and become a recorded fact.

#### The rule, stated as a prohibition

> The import reads `_order_total`. The worker reads `billing_subscriptions.amount_minor`.
> **At no point does any code path derive an existing subscriber's charge amount from a plan
> or product price, a coupon, or anything else recomputed at charge time.** A reviewer who
> sees a plan-price lookup inside the charge path must reject the change.
>
> `amount_locked = 1` additionally forbids any **admin** or bulk operation from changing the
> amount. Changing a locked price is a deliberate, single-subscription, audited action.

The scale of getting this wrong: recomputing from list would raise 39 Activators from $67 to
$97, 3 Navigators from $217, 2 from $160.20, the Quarterly member from $400 to $597, and
would bill four people who are deliberately comped.

#### The two deliberate non-billing statuses

Neither is a quarantine case. Both are real memberships that are never charged, and the
worker's due query (`status IN ('active','past_due','grace')`) cannot pick either up —
structurally, not by a flag check.

| Status | Who | Treatment |
|---|---|---|
| `comped` | the 4 at $0 — #6908, #6911, #6913, #12264 | membership granted at the plan's role, no charge ever, no dunning, no expiry from billing |
| `manual_billing` | #5210 ($97/mo) and #7908 ($267/mo) — `_requires_manual_renewal = true`, no gateway | membership honoured, Labs never charges. Woo was not charging them either |

**#12264 explained.** The one $0 with no coupon is a hand-made manual comp: `_order_total`
0.00, `_cart_discount` 0, no `_payment_method`, `_requires_manual_renewal = true`, started
2026-10-03 with its next payment set to **2031-10-03** — a five-year runway. It is also the
source of the furthest-future Action Scheduler row noted in §0.1. Deliberate, not a defect.

#### Pre-cutover report

Signed off by Ernie before Phase 2: every subscription, its Woo amount, its imported amount,
the delta, and its `discount_note`. Expected delta: zero, every time — already true in the
§9.7 dry run across all 221.

### 9.4 The PayPal token gap — a real, named hole
**48 of the 50 active PayPal subscriptions have a vault token. Two do not — and they are now
named:**

| Woo sub | Product | Amount | Next due |
|---|---|---|---|
| **#9661** | Navigator Annual | **$1,997.00** | 2027-06-29 |
| **#12406** | Observer | $17.00 | **2026-10-14 16:59** |

#9661 is the single largest exposure on the list — $1,997 with no chargeable credential — but
it has eight months of runway. #12406 is due within the hour of this analysis.

⚠️ **This is a live issue today, not only a migration one.** If PPCP genuinely has no vaulted
token for these, *Woo's own renewals will fail too*. Caveat on the evidence: the check looked
for tokens in `wp_woocommerce_payment_tokens` under `gateway_id='ppcp-gateway'`, and older PPCP
versions stored some references elsewhere — so verify against PPCP's own view of these two
subscriptions before concluding. If confirmed, they need re-authorization emails regardless of
whether this project proceeds.

Both are held in `quarantined` until they re-approve. If they don't, they are a manual conversation, not a
failed charge.

This is also the honest residue of Ernie's Claude's "PayPal subscribers may need to
re-approve": not 50 of them, **2** — but those 2 are real and must not be discovered on
their renewal day.

### 9.5 Quarantine — the default for anything uncertain
`status='quarantined'` means imported, visible, never charged. Nothing ambiguous is guessed.

**Quarantine is for faults, not for decisions.** A deliberately set price — a comp, a
grandfathered discount, a manual-billing arrangement — is a supported state with its own
status (§9.3), not something to be held for review. Conflating the two would have put six
deliberate arrangements in a queue that nobody needed to work. Quarantine triggers:
- email resolves to 0 or >1 Labs identity
- product has no `provider_plan_map` entry
- missing `customer_ref` or `method_ref` (the 2 PayPal subs)
- *(moved to §9.3)* A `$0` amount or a missing gateway is **not** a quarantine case when it
  is deliberate — those import as `comped` or `manual_billing`, which are supported
  non-billing states. Quarantine is for data we do not understand, and after the §9.7 dry
  run there is none of that in the pricing: all 49 set prices are explained
- `next_charge_at` is **more than 48 hours in the past** at import
- any `wc-on-hold` subscription (§9.6)
- *(also moved to §9.3)* `_requires_manual_renewal = true` or no `_payment_method` — 7 live
  subscriptions, all deliberate. Four import as `comped`, two as `manual_billing`, one is a
  Woo-side manual-renewal flag on an otherwise normal subscription. None are quarantined and
  none are ever charged

Each quarantined row is worked manually with a named owner before `live` mode is enabled for
its cohort.

### 9.6 The 42 on-hold subscriptions need a decision
All 42 still carry a `next_charge_at`. If the import naively treats "has a next payment →
charge it," we would attempt payment on 42 people whose payments **previously failed**, some
possibly months ago. That is the fastest route to a cluster of disputes.

**How dead is that pile?** Every one of the 42 carries a past-due date, and the staleness is
severe: **21 are more than 90 days overdue**, 14 are 30–90 days, 3 are 7–30 days, 2 are 2–7
days. Notably, **zero active subscriptions have a stale due date** — the stale-date rule and
the on-hold rule select exactly the same population, which is a good sign the classification is
sound. Charging a card for a subscription that failed three months ago is a dispute, not a
recovery.

**Specified behaviour:** every `wc-on-hold` subscription imports as `quarantined`. Ernie
reviews them as a list and chooses per cohort: re-engage with a dunning email, or close.
No on-hold subscription is ever auto-charged on import. **This needs Ernie's ruling before
build** (§11).

### 9.7 Verified import dry-run — what the book actually looks like in Labs

The transform in §9.2 has been **run against the live production book** (read-only export of
all 221 active / on-hold / pending-cancel subscriptions, no PII extracted). Results:

```
Woo subscriptions in  : 221
Labs rows out         : 221        1:1 — no row lost, no row invented
STATUS                : active 163 · quarantined 51 · pending_cancel 7
QUARANTINE REASONS    : woo_on_hold 42 · stale_due_date 40 · missing_credential 10
                        no_auto_billing_in_woo 7 · zero_amount_comped 4
UNMAPPED PRODUCTS     : none

ASSERT amount delta      : 0 rows differ          PASS
ASSERT trigger drift     : 0 rows differ          PASS
ASSERT max_periods never schedules past ends_at   PASS

Will be charged by Labs  : 154 subscriptions
Held, never charged      : 67
Next 14 days             : 86 charges totalling $3,098.40
```

`max_periods` across the book after derivation: 113 open-ended (`NULL`), and finite terms
spread 1, 2, 3, 4, 6, 7, 9 and 10 periods — confirming §8.4's point that no single hardcoded
term fits.

#### Worked example — the shape that matters most

Annual Navigator #7893, the case where a wrong anchor would move a $1,997 charge by weeks:

| WooCommerce (`wp_postmeta`) | | Labs (`billing_subscriptions`) | |
|---|---|---|---|
| `_payment_method` | `stripe` | `provider` | `stripe` |
| `_order_total` | `$1997.00` | `amount_minor` | `199700` |
| `_billing_period` / `_interval` | `year` / `1` | `interval_unit` / `_count` | `year` / `1` |
| **`_schedule_next_payment`** | **`2027-05-01 03:00:04`** | **`next_charge_at`** | **`2027-05-01 03:00:04`** |
| | | **`anchor_at`** | **`2027-05-01 03:00:04`** |
| `_schedule_start` | `2026-05-01 03:00:04` | *(not used as anchor)* | — |
| `_schedule_end` | `0` | `ends_at` | `NULL` |
| `product_id` | `7864` | `plan_slug` | `navigator` |
| completed renewals | `0` | `woo_renewals_completed` | `0` |
| *Action Scheduler row* | `woocommerce_scheduled_subscription_payment` | `period_index` | `0` |
| `post_status` | `wc-active` | `status` | `active` |
| `wp_posts.ID` | `7893` | `woo_subscription_id` | `7893` |

The Action Scheduler row on the left and the `next_charge_at` column on the right are the
**same trigger**. That is the entire substitution: a queued cron row becomes an indexed
column, and a `while(true)` worker reads it instead of WordPress's scheduler.

Three more shapes, verified the same way:

| Shape | Woo | Labs |
|---|---|---|
| Weekly Observer mid-term (#11390) | next `2026-10-15 04:08:53`, end `2026-11-26` | `next_charge_at` identical, `ends_at` identical, `max_periods` **7** (12-week term) |
| Weekly Observer final period (#11420) | next `0`, end `2026-10-15 16:12:58` | `next_charge_at` **NULL** — expires at `ends_at`, never charged |
| Grandfathered Activator (#4744) | total `$67.00`, coupon `founders-A` | `amount_minor` **6700**, `discount_note` `woo coupon founders-A` |
| Pending-cancel (#5173) | next `0`, end `2026-11-03 15:08:34` | `next_charge_at` **NULL**, `status` `pending_cancel` |
| Comped (#6908) | total `$0.00`, no gateway, manual `true` | `quarantined`: `no_auto_billing_in_woo;zero_amount_comped` |

#### The named action list — humans, before any cutover

| Action | Subscriptions |
|---|---|
| Re-authorize PayPal (no vault token) | **#9661** Navigator Annual $1,997 · **#12406** Observer $17 |
| Paid plan with no payment method — needs Ernie's ruling | **#5210** Activator $97/mo · **#7908** Navigator $267/mo |
| Convert to granted membership, no billing subscription | **#6908 · #6911 · #6913 · #12264** (all $0) |
| Review as a list, charge nothing | the **42** on-hold (21 of them 90+ days overdue) |
| Confirm the non-standard term is intended | **#11390** — Observer on a 12-week term |

Nine subscriptions and one list. Everything else — 154 of them — imports and bills with no
human touch.

### 9.8 Cutover runbook

**Both providers ship together. PayPal is not a later phase.**

An earlier draft put Stripe through Phases 2–3 and PayPal in Phase 4. That was wrong, for two
reasons:

1. **PayPal is 50 of 171 active subscriptions — 29% of the book**, spanning Observer,
   Activator, Navigator and Navigator Annual. Migrating Stripe first means WooCommerce must
   keep billing those 50 for the whole of Phases 2–3. And Woo billing them means Woo keeps
   firing its subscription hooks for them — so it keeps writing their memberships, AC tags and
   Discord roles. §7.13 ("Labs is sole truth for migrated subscriptions") would then hold for
   *some* identities and not others: a **conditional** dual-write, which is worse than either
   pure state and far harder to reason about. Nothing could be decommissioned, and support
   would have two live codepaths for months.
2. **It deferred the project's biggest unknown to the end.** Whether a Woo-created PayPal vault
   token can be charged by Labs is the single genuinely unproven assumption in this spec
   (§15.2). Phase-4 PayPal meant discovering that *after* committing 116 Stripe migrations.
   Proving it in Phase 2 on a **$17 weekly** charge means a failure costs $17 and one week,
   before anything irreversible has happened.

So: both provider adapters are built before Phase 1, both are exercised in the Phase 2 pilot,
and Phase 3 tranches are organised by **billing cadence** — weekly, monthly, quarterly, annual
— with each tranche containing members of both providers. Cadence is the right axis because it
determines how fast you get feedback; provider is not.

```
PHASE 0 — PREREQUISITES (no billing code runs)
  0.1  DL-532 filed; Architecture 05 §4 amended
  0.2  Stripe keys + PPCP's own client_id/secret into the launchd plist
       (env lives in the plist on MiniTwo, NOT .env — the API has no shell wrapper)
  0.3  Confirm Stripe automatic card updater is ON in the Dashboard
  0.4  §7.13 landed: Woo SSO sync SKIPS identities with a billing_subscriptions row
  0.5  §7.14 landed: Labs emits Discord role + AC tag transitions itself
  0.6  Identity collisions resolved via the documented atomic merge recipe

PHASE 1 — IMPORT, SHADOW MODE (LABS_BILLING_MODE=shadow)
  1.1  Run migration 159
  1.2  Import all 171 active + 8 pending-cancel + 42 on-hold(→quarantined)
  1.3  Amount-delta report: 171 rows, every delta must be 0.00
  1.4  Worker runs on schedule and writes status='shadow' ledger rows.
       NO PROVIDER CALLS AT ALL.
  1.5  Run for 14 days. Woo keeps billing for real.
  1.6  DAILY DIFF: Labs' shadow charges vs Woo's actual renewal orders.
       Same member, same day, same amount — every time.
       Weekly Observers renew every 7 days, so 2 weeks gives ~2 full cycles
       on 77 subscriptions. That is a real sample, not a smoke test.
  ◀ GATE: 14 consecutive days of zero diffs, or do not proceed.

PHASE 2 — LIVE PILOT (BOTH PROVIDERS, weekly Observers)
  2.1  Pick 5 weekly Observers at $17: 3 on Stripe, 2 on PayPal.
       Both providers are proven at the SAME cheap price point, in the same week.
  2.2  Flip those 5 Woo subs to _requires_manual_renewal = true
  2.3  Set those 5 Labs rows to live
  2.4  Watch 2 renewal cycles (14 days). Per charge verify: succeeded, receipt sent,
       membership active, Discord role intact (BOTH guilds), AC tag intact,
       reconciliation clean
  ◀ GATE: 10/10 charges correct, across both providers

PHASE 3 — MIGRATE BY BILLING CADENCE, NOT BY PROVIDER
  3.1  Tranches are weekly -> monthly -> quarterly -> annual.
       EACH tranche contains both Stripe and PayPal members.
  3.2  Per tranche: flip Woo to manual renewal, set Labs live, watch one full cycle
  3.3  Annuals last — their next charge is months away, so the real test is the
       shadow diff plus a deliberate charge on a staff account of each provider
  3.4  The 2 token-less PayPal subs (#9661, #12406) are resolved BEFORE their
       tranche, not after (§9.4)

PHASE 4 — WOO BILLING OFF
  4.1  All remaining Woo subs → _requires_manual_renewal = true
  4.2  Woo subscriptions NOT deleted, NOT cancelled. Rollback stays available
  4.3  30 days later: decommission the Woo checkout path
```

**The single most important mechanical step** is flipping `_requires_manual_renewal` to
`true` per subscription as it goes live. Woo currently holds **162 pending
`woocommerce_scheduled_subscription_payment` actions**, the furthest scheduled for
**2031-10-03**. If both systems are armed, both charge. Manual-renewal is the right lever
because it is per-subscription, reversible, and leaves every Woo record intact — unlike
deleting scheduler rows, which is irreversible and destroys the rollback path.

---

## 10. Modes, and why `shadow` is the centre of the safety argument

| Mode | Worker behaviour |
|---|---|
| `off` | Endpoints report disabled. No worker. The v1.0 standalone guarantee, unchanged |
| `shadow` | Full due-detection, period arithmetic, amount resolution, ledger writes with `status='shadow'`. **Zero provider calls.** |
| `live` | Real charges, per-subscription gated by the row being out of quarantine |

Shadow mode is what makes this safe to build. Every part of the system that can be wrong —
due dates, period arithmetic, amounts, identity resolution, plan mapping, the 34 discounts,
the 9 final-period Observers — is exercised against live production data for two weeks, with
a daily diff against what Woo *actually charged*, while being structurally incapable of
moving a cent.

A spec that goes straight to live charges on 171 paying members is a spec that has not taken
the problem seriously.

---

## 11. Rulings needed from Ernie before build

*Shrunk after the §9.7 dry run: what looked like six pricing decisions turned out to be
confirmed-deliberate arrangements, which the schema now models directly (§9.3). Five
genuine rulings remain.*

### 11.1 Rulings

1. **The 42 on-hold subscriptions** (§9.6) — re-engage with dunning, or close? Spec default:
   quarantine, charge nothing, review as a list. 21 of them are 90+ days overdue.
2. **Grace period:** 7 days confirmed? Referenced in the funnel review; this spec assumes 7.
3. **Retry ladder:** +1/+3/+5/+7 days acceptable as the Smart Retries replacement?
4. **Statement descriptor** — what members should see on their statement. Mismatched
   descriptors are a leading cause of "I don't recognise this charge" disputes.
5. **Dispute policy** (§7.11) — auto-revoke access on `dispute.created`, or hold for review?
   Spec default: hold.

**Out of scope but now visible:** sales tax (§0.3). Woo collects none today, so this is a
net-new business decision rather than an inherited default.

### 11.2 Confirmations, not rulings

Conor has confirmed these prices were deliberately set — by coupon, grandfathered discount
or comp. The spec honours each one exactly as it stands and needs no decision; the only ask
is a glance at the list to confirm nothing on it is a surprise.

| | Treatment |
|---|---|
| 39 Activators at **$67** · 3 Navigators at **$217** · 2 at **$160.20** · 1 Quarterly at **$400** | `amount_locked = 1`, billed at exactly that amount forever |
| 4 members at **$0** (#6908, #6911, #6913, #12264) | status `comped` — membership granted, never charged |
| #5210 at **$97/mo** · #7908 at **$267/mo**, no gateway on file | status `manual_billing` — honoured, never charged by Labs (Woo was not charging them either) |
| #11390's **12-week** Observer term | honoured as written; `max_periods` derives from `ends_at` |

### 11.3 ⚠️ One live WooCommerce risk, surfaced in passing

Not a decision about this project — a thing worth knowing now:

- **`birthday-E` expires 2026-10-15 — tomorrow.** `founder-C` and `founders-B` expire
  2026-12-31.
- **`founders-A`, which explains why 38 Activators pay $67, no longer exists as a coupon
  in `wp_posts` at all.** The code survives only as a snapshot in each subscription's coupon
  line item.

WooCommerce Subscriptions normally renews against the subscription's own stored
`_order_total`, so these members are probably not re-priced by an expiry. But a plan switch,
an admin edit, or a WCS update that re-validates coupons could put up to 45 people back to
list price. Worth a deliberate look regardless of whether native billing proceeds — and it
is precisely the fragility that `amount_locked` ends (§9.3).

---

## 12. Invariants

1. Money never moves without a `billing_charges` row committed **first**.
2. One succeeded charge per (subscription, period). Enforced by unique key, not by code.
3. An existing subscriber's amount is never derived from a plan price.
4. An ambiguous charge is resolved by asking the provider, never by retrying.
5. A transport error is never recorded as a decline.
6. Access truth stays in `memberships`; billing writes it only through `upsert_membership`.
7. Every timestamp in the billing path is UTC `DATETIME`, and every billing connection
   **SETs** `time_zone = '+00:00'` rather than assuming it (§7.16).
8. A missed charge is reported within 2 hours (§7.7A) and retried indefinitely (§5.1).
9. Removing billing config removes the provider. No other code path depends on it.
10. Woo records are preserved through cutover. Rollback is always available.
11. `anchor_at` is the due date, never the subscription start, and `period_index` starts at
    0 on import (§5.4.1).
12. `max_periods` is derived from `ends_at`, never from a product (§8.4).
13. The ledger is append-mostly: application code issues no `DELETE` against
    `billing_charges`, and a settled charge is terminal.

## 13. Test plan

**Unit** — period arithmetic across every clamp case (Jan 31 monthly, Feb 29 annual, weekly
across DST, `max_periods=6`); minor-unit ↔ PayPal decimal-string round trip for
`1997.00`/`17.00`/`160.20`/`0.00`; retry ladder; grace maths.

**Integration (no provider)** — double-charge attempt → unique violation, zero provider calls;
crash-between-commit-and-call → recovery resolves from `lookup()`; webhook replay → 200, one
row; out-of-order events → stale one dropped; circuit breakers halt; worker refuses to start
on a non-UTC DB session.

**Migration** — import the real 171 into a staging DB; assert 171 zero deltas; assert the 9
final-period Observers get `next_charge_at = NULL`; assert all 42 on-hold → `quarantined`;
assert the 2 token-less PayPal subs → `quarantined`; run import twice → same row count.

**Shadow (production)** — 14 days of daily diffs vs Woo's actual renewal orders.

**Live** — the Phase 2 pilot, 10 charges on 5 weekly Observers.

### 13.1 Implemented: `docs/billing/tests/test_infrastructure.py` — 121 assertions passing

Run against MySQL 8.0.41 on localhost. Creates the six billing tables, drops them, ALTERs
nothing, never writes `schema_migrations`, never contacts the live WooCommerce database, and
asserts the dev database is back to its baseline row counts before exiting.

| Section | Proves |
|---|---|
| 1 · period arithmetic | every clamp case; 24 monthly and 60 weekly periods with no drift and no DST shift; `ends_at` and `max_periods` both stop the series |
| 2 · anchor rule | **204/204** live subscriptions reproduce Woo's exact date from the due-date anchor; 88/204 from `_schedule_start`; no subscription's full remaining term charges past `ends_at` |
| 3 · ledger | racing worker rejected by the period key; replay rejected by the idempotency key; legitimate retry allowed; float amount refused; settled charge cannot be resurrected |
| 4–5 · worker | one cycle charges once and advances exactly one interval; two workers on one subscription produce exactly one charge |
| 6 · recovery | a silently-committed provider charge is settled, not repeated; an unresolvable one quarantines instead of retrying |
| 7 · transport failure | ledger left open, `retry_count` untouched, due date unchanged, status still active |
| 8 · declines | ladder lands on +1/+3/+5/+7; grace on the fifth failure; hard decline skips the ladder; 3DS is not a decline; classifier routes all five code classes |
| 9 · breakers | both the spend cap and the due-count surge halt the cycle, writing no ledger rows |
| 10 · finite term | charges exactly `max_periods` times, then expires — never one more |
| 10b · set prices | `comped` and `manual_billing` are invisible to the due query; a grandfathered Activator charges $67 not $97, and still does after a plan change; all five discounted tiers charge their set price |
| 10c · discounts | percent/fixed/override maths reproduce the live book's own prices; one-per-customer is a unique key; expiry and deletion cannot re-price an existing member |
| 10d · money edges | refunds + over-refund refused in the write path; proration both directions, floored, never negative; the §16.4 step-up deferred without notice and applied with it; PayPal `PENDING` never retried; alumni grant delegated on expiry; import idempotent |
| 11 · webhooks | durable replay rejection; out-of-order stale events dropped |
| 12 · reconciliation | all four checks fire: slipped payment, unledgered provider charge, phantom success, no double charges |
| 13 · money | minor-unit → PayPal decimal strings; floats refused; Stripe `off_session`+`confirm`; PayPal `MERCHANT`/`RECURRING`/`SUBSEQUENT` + `invoice_id` |
| 14 · shadow | 157 real subscriptions loaded, full cycle run, **zero provider calls**, every ledger amount matching its subscription |

---

### 13.2 Coverage audit — what is proven, by category

Run as a cross-reference of every spec section against the code and the suite, then the money
paths checked individually. The honest result:

| Category | State |
|---|---|
| **The money engine** — schedule, ledger, charge sequence, concurrency, crash recovery, transport failures, declines, dunning ladder, breakers, finite terms, reconciliation, webhooks, money representation | **Proven.** 121 assertions against MySQL 8.0.41 |
| **The migration** — anchor rule, amounts, quarantine classification, set prices, import idempotency | **Proven against the real book** — 204/204 dates, 221/221 amounts |
| **The money edges** — refunds and the over-refund guard, proration both directions, the §16.4 discount step-up and its notice guard, PayPal `PENDING`, the alumni-grant wiring | **Proven.** These were *specified but untested* until the audit found them; four were coded-but-unexercised, two were specified with no code at all |
| **Discounts** | **Proven**, including that the maths reproduces the live book's own prices ($160.20, $217.00) |
| **Live provider calls** | **NOT proven.** The single real gap. Needs keys (§15.2) |
| **Member-facing surfaces** — checkout, `/me/billing`, the 3DS confirm page | **Not built.** Checkout gates everything |
| **Admin surfaces** — quarantine queue, retries, refund UI, discount admin | **Not built** (the refund *engine* is built and tested; the UI is not) |
| **Emails** — 4 dunning, receipts, advance renewal notice, price-change notice | **Not built.** All ride `notify.py` |
| **The three blocking integrations** (§7.13, §7.14) | **Not built.** Nothing migrates until they are |
| **Card-expiry sweep** (§7.8) · **identity-collision guard** (§7.12) · **one-off purchases** (§8.5) · **rollback rehearsal** (§7.18) | Specified, not built |
| `paused` status | In the enum, never specified. Either define it or drop it |
| Sales tax, multi-currency, discount stacking, account credit | Deliberately out of scope (§0.2, §16.8) |

**What the audit changed.** It is the reason §7.11, §8.2 and §16.4 are now implemented rather
than only described. Three had code that no test exercised — the PayPal `PENDING` branch, the
alumni grant, the step-up columns — which is the most dangerous state for a module to be in,
because it reads as finished. Two existed only as prose: proration and the refund path, both
of which do arithmetic on money.

**What it does not change.** No test here proves Stripe or PayPal will accept our charge. That
needs five $17 Observer charges and one PayPal vault charge (§15.2), and no amount of local
testing substitutes for it.

---

## 14. Deliverables

### 14.1 Built and tested — `docs/billing/`

Prototypes, deliberately not yet in `server/`: moving them there makes them live code
in a repo that deploys, and that should happen once DL-532 is ruled on, not before.

| File | Spec | Lines |
|---|---|---|
| `../../migrations/159_native_billing_v2.sql` | §4 | 6 tables, applied + dropped by the suite |
| `proto/periods.py` | §5.4 / §5.4.1 / §8.4 | pure arithmetic + the Woo import rule |
| `proto/ledger.py` | §4.3 / §5.3 / §7.1 | the only writer of `billing_charges` |
| `proto/worker.py` | §5 / §7.4 / §7.10 | the cycle, ladder and breakers |
| `proto/recovery.py` | §7.2 / §7.7 / §7.9 | recovery, reconciliation, heartbeat |
| `proto/webhooks.py` | §6.3 / §6.4 | durable dedupe + ordering |
| `proto/providers.py` | §6.1 / §6.2 | request builders + a scriptable fake |
| `tests/test_infrastructure.py` | §13.1 | 121 assertions, self-cleaning |
| `import-dryrun.py` · `export-woo-subs.sql` | §9 | the verified import, no PII |
| `DIAGRAMS.md` · `DL-532-draft.md` · `README.md` | — | drawings, governance, index |

### 14.2 Still to build

```
server/billing/__init__.py
server/billing/{periods,ledger,worker,recovery,webhooks}.py   # lift from proto/
server/billing/reconcile.py        # §7.7 — split out of proto/recovery.py
server/billing/dunning.py          # §7.5 — the four emails; rides notify.py SMTP
server/billing/providers/stripe_mit.py    # real client around build_stripe_request
server/billing/providers/paypal_mit.py    # PORT from PPCP's PHP request builder
server/billing/migrate_woo.py      # §9 importer — reads Woo directly, idempotent
server/routes/billing.py           # extend: /checkout, /me/billing, /billing/confirm/{id}
                                   # ⚠️ already dirty in Ernie's tree (§14.3)
server/routes/billing_admin.py     # quarantine queue, manual retry, refund, halt/resume
web/app/checkout/page.tsx          # strict CSP, no third-party tags, named reviewer
web/app/me/billing/page.tsx
web/app/billing/confirm/[id]/page.tsx
infra/launchd/ai.fattail.labs.billing-worker.plist.example      # LaunchDaemon, not Agent
infra/launchd/ai.fattail.labs.billing-reconcile.plist.example
```

Prerequisites that are **not** billing code but gate the whole project — §9.8 Phase 0:
the Woo SSO sync must skip identities holding a `billing_subscriptions` row (§7.13), and
Labs must emit Discord role + AC tag transitions itself (§7.14).

### 14.3 Known collisions with work in flight

- **`server/routes/billing.py` is already modified in Ernie's working tree** — the
  `_woo_billing_url` portal fallback sending "Manage billing" to WooCommerce My Account.
  v2.0's `/me/billing` replaces that destination. Coordinate before editing that file;
  do not rebase over it blindly.
- Some local checkouts are **25 migrations behind `origin/main`** (133 vs 158). Fetch and
  rebase before adding a migration, or you will collide again.

---

## 15. What is proven, and what is still assumed

The distinction matters more than the passing count, so it is stated plainly.

### 15.1 Proven against real data or a real database

| Claim | How |
|---|---|
| The import reproduces Woo's schedule exactly | 204/204 live subscriptions, zero drift (§9.8, §13.1 §2) |
| The import reproduces Woo's amounts exactly | 221 subscriptions, zero deltas (§9.7) |
| Double-charging is structurally impossible | racing worker and replayed webhook both rejected by the database, before any provider call (§13.1 §3, §5) |
| A crash mid-charge resolves without repeating | provider asked, orphan settled, no second charge (§13.1 §6) |
| An unresolvable charge is never retried | quarantines and pages a human (§13.1 §6) |
| A transport error never becomes a decline | ledger left open, `retry_count` untouched, due date intact (§13.1 §7) |
| The dunning ladder and grace are correct | +1/+3/+5/+7 then grace on the fifth failure (§13.1 §8) |
| A finite term cannot overcharge | exactly `max_periods` charges, then expired (§13.1 §10) |
| A runaway bug cannot bill the book | both breakers halt the cycle writing no ledger rows (§13.1 §9) |
| A missed charge is detected, not just retried | all four reconciliation checks fire (§13.1 §12) |
| Shadow mode cannot move money | 157 real subscriptions, full cycle, zero provider calls (§13.1 §14) |
| Deliberately set prices survive everything | comps and manual arrangements unreachable by the due query; locked amounts unchanged by a plan change (§13.1 §10b) |

### 15.2 Still assumed — and how each gets proven

| Assumption | Risk | How it gets proven |
|---|---|---|
| **Woo's saved `pm_`s are chargeable off-session by Labs** | Woo's gateway sets `setup_future_usage=off_session` and all 116 active Stripe subs carry a modern `pm_`, so this should hold — but it has not been executed. | §9.8 Phase 2: 3 of the 5 pilot Observers at $17. |
| **PayPal vault tokens resolve for Labs under the same merchant** | Vaulting is confirmed live (133 tokens, products all `_ppcp_enable_subscription_product=no`), and reusing PPCP's own `client_id` removes the app-scoping doubt. Not executed. | **§9.8 Phase 2, alongside Stripe** — 2 of the 5 pilot Observers are PayPal, at $17. This is the biggest unknown in the spec, so it is proven FIRST and cheapest, not last. |
| PPCP's exact request shape | `build_paypal_order` is written from the documented contract, not from PPCP | Port from PPCP's PHP builder — a required implementation step (§6.2), not optional research |
| 3DS volume is low on this book | US cards, mostly recurring — but unmeasured | The recovery page must exist before cutover regardless (§7.6) |
| Stripe's automatic card updater is enabled | Material slice of involuntary churn | Confirm in the Dashboard, §9.8 Phase 0.3 |
| The 2 token-less PayPal subs can be re-authorized | #9661 is $1,997 | Verify against PPCP's own view, then email them (§9.4) |

Everything in 15.2 needs **keys and a merchant account** to settle. Nothing in it needs
more design. That is the correct state for a spec awaiting a ruling.

**Both provider adapters are v1 scope.** PayPal is 29% of the active book (50 of 171) and is
not a later phase — see §9.8 for why shipping it second would have created a conditional
dual-write and deferred the biggest unknown to the end.

---

## 16. Discounts and coupons — Labs must be able to CREATE them

A gap in v2.0 as first written: §9.3 honours a *migrated* discount but gives no way to make a
new one. Once `fattail.ai`'s WooCommerce checkout is gone, there is no coupon engine left —
every founder offer, birthday sale and comp has to be creatable on Labs. This section closes
that.

### 16.1 The principle, and why it is better than Woo's

**A discount sets a price once, at checkout. It does not re-apply at renewal.**

Woo recomputes the discount from live coupon state on every renewal, which is exactly why 45
members are currently one coupon-expiry or admin edit away from jumping to list price, and why
the coupon explaining 38 Activators at $67 no longer exists (§11.3). Labs evaluates the
discount at checkout, writes the resulting `amount_minor`, sets `amount_locked = 1`, and
records the code in `discount_note`. After that the member's price is a **fact**, not a
calculation. Deleting or expiring the discount afterwards cannot touch anyone already on it.

The one case where the price legitimately changes later is a time-limited discount
("3 months at $67, then $97"), and that is modelled explicitly in §16.4 — never as a silent
recalculation.

### 16.2 Schema (migration 160)

```sql
CREATE TABLE IF NOT EXISTS billing_discounts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code              VARCHAR(64) NOT NULL,            -- what the member types
  status            VARCHAR(16) NOT NULL DEFAULT 'active', -- active | disabled
  kind              VARCHAR(16) NOT NULL,
    -- fixed_off   take N minor units off the plan price
    -- percent_off take N percent off
    -- override    charge exactly this amount (use for comps and bespoke deals)
  value_minor       INT UNSIGNED NULL,               -- fixed_off / override
  percent_bp        SMALLINT UNSIGNED NULL,          -- percent_off, BASIS POINTS: 4000 = 40%
                                                     -- integer maths only, no float percents
  duration          VARCHAR(16) NOT NULL DEFAULT 'forever',
                                                     -- forever | periods | first_period
  duration_periods  SMALLINT UNSIGNED NULL,          -- required when duration='periods'
  plan_ids_json     JSON NULL,                       -- NULL = any plan
  max_redemptions   INT UNSIGNED NULL,               -- NULL = unlimited
  redemptions_used  INT UNSIGNED NOT NULL DEFAULT 0,
  max_per_identity  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  starts_at         DATETIME NULL,
  expires_at        DATETIME NULL,
  note              VARCHAR(255) NOT NULL DEFAULT '',-- why this exists, for whoever finds it
                                                     -- in two years (see founders-A)
  created_by        VARCHAR(255) NOT NULL DEFAULT '',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disc_code (code),
  KEY ix_disc_status (status, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_discount_redemptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  discount_id     BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL,
  amount_before   INT UNSIGNED NOT NULL,             -- the plan price it was applied to
  amount_after    INT UNSIGNED NOT NULL,             -- what the member actually pays
  redeemed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_redeem_once (discount_id, identity_id),   -- enforces max_per_identity=1
  KEY ix_redeem_sub (subscription_id),
  CONSTRAINT fk_redeem_disc FOREIGN KEY (discount_id)
    REFERENCES billing_discounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_redeem_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`uq_redeem_once` makes one-per-customer structural rather than a count check — the same
approach as `uq_chg_period_attempt`. For a discount that genuinely allows repeats, set
`max_per_identity > 1` and the application checks the count instead; the unique key is then
dropped for that path via a `(discount_id, identity_id, id)` insert. Simpler default: one per
customer, which is what every discount in the current book wants.

### 16.3 Applying one

```
POST /api/billing/checkout  {price/plan, code?}
  1. resolve code -> discount (active, in window, plan eligible, redemptions left,
     not already redeemed by this identity)
  2. compute amount: fixed_off -> plan - value | percent_off -> plan - plan*bp/10000
     | override -> value.  Integer maths, floor at 0.
  3. INSERT billing_discount_redemptions (amount_before, amount_after)
     -- duplicate key => already used it, 422, no charge
  4. create the subscription with amount_minor = amount_after, amount_locked = 1,
     discount_note = 'labs discount <code>'
  5. charge on-session
```
Rounding is floored to the minor unit and the result is recorded in `amount_after`, so what
the member was quoted and what they are billed are the same stored number — there is no second
computation anywhere that could disagree.

### 16.4 Time-limited discounts — the only case where a price changes later

"3 months at $67, then $97" needs two more columns on `billing_subscriptions`:

```sql
ALTER TABLE billing_subscriptions
  ADD COLUMN standard_amount_minor   INT UNSIGNED NULL,  -- what they pay after the discount
  ADD COLUMN discount_periods_left   SMALLINT UNSIGNED NULL,
  ADD COLUMN amount_change_notified_at DATETIME NULL;
```

On each successful charge, if `discount_periods_left` is set it decrements; at zero the worker
steps `amount_minor` up to `standard_amount_minor`.

**The guard that matters:** a price *increase* is refused unless the member was told. The
worker will not step the amount up unless `amount_change_notified_at` is at least **7 days**
before the next charge date; if it is not, it sends the notice, pushes nothing, and keeps the
discounted price for one more period. A silent price rise is the single most reliable way to
earn a chargeback, and it is cheaper to give away one extra discounted month than to argue
about it afterwards.

A price *decrease* needs no notice and applies immediately.

### 16.5 Comps

A comp is `kind='override'`, `value_minor=0`, `duration='forever'`. Applying it puts the
subscription in status `comped` (§9.3) rather than `active`, so it is unreachable by the due
query. This replaces the current practice of running a $0 subscription through the billing
path, which is how `comp-F` ended up with 31 renewal orders.

### 16.6 Admin surface

`/admin/billing/discounts` — list, create, disable, and see redemptions. Rules the UI enforces:

- A code can be **disabled but never deleted**, and never edited once redeemed. Its redemption
  rows are the only record of why somebody pays what they pay. `founders-A` is the cautionary
  tale: 38 members, and the coupon is simply gone.
- `note` is **required**. "Founder cohort Jan 2026, promised permanent" is the sentence that
  saves an argument in 2028.
- Disabling a discount shows the count of subscriptions on it and states plainly that their
  prices are unaffected — because with `amount_locked` they are.

### 16.7 Migrating the existing Woo coupons

Not required, and deliberately not done. The 49 affected subscriptions carry their price in
`amount_minor` with the code in `discount_note`; nothing needs the coupon object to keep
billing correctly. Recreate a Woo coupon in Labs only if you want to **sell on it again** —
`founders-D` (−40%, no expiry) being the likely candidate.

### 16.8 What this does NOT cover

One-off order-level discounts, stacking multiple codes on one subscription, referral credits,
and account credit balances. All are deliberate omissions: every discount in the current book
is a single code setting a single recurring price, and stacking is where discount engines go
to die. Add them when something actually needs them.

---

## 17 Integration surface — what "integrated properly" means

*The AC-tag and Discord-role rows below are analysed in full in **§18** — twelve plugin files,
3,350 lines, of which six files (~600 lines) do not need porting at all.*

Billing is not finished when a charge succeeds. Each of these is a place where today's
behaviour is produced by WooCommerce and must be produced by Labs instead. §7.13 and §7.14
cover the two that are **blocking**; this is the complete list.

| Surface | Today | After | Status |
|---|---|---|---|
| **Membership truth** | Woo SSO sync writes `memberships` | Labs writes it; Woo sync **skips** identities holding a `billing_subscriptions` row | **BLOCKING** (§7.13) |
| **Discord roles** | vendor plugin on Woo hooks (548+/month) **plus 3 custom mu-plugins** | `desired_roles()` + reconciler (§18.6) | **BLOCKING** (§7.14, §18) |
| **ActiveCampaign tier tags** | `membership-auto-upgrade`, 1,599 lines | `desired_tags()` + reconciler; 4 status tags toggle, 5 history tags are append-only (§18.2) | **BLOCKING** (§7.14, §18) |
| **Upgrade/downgrade decisions** | `membership-auto-upgrade` tier × commitment matrix | §8.2 + §18.3 — the same-tier matrix must survive | **BLOCKING** (§18.3) |
| **Membership audit trail** | WooCommerce order notes | `membership_events` table (§18.6) | new — order notes do not migrate |
| **Receipts** | Woo transactional email | `notify.py` SMTP on `succeeded` | §6.5, built as a stub |
| **Dunning (4 emails)** | Woo renewal reminders | `billing/dunning.py` | §7.5, specified not built |
| **Advance renewal notice** | 125 pending Woo notification actions | Labs, mandatory for annual | §7.3 |
| **Price-change notice** | n/a | required before any step-up | §16.4 |
| **Member billing page** | Woo My Account | `/me/billing` — card, next charge, history, cancel | §14.2. Collides with Ernie's WIP (§14.3) |
| **Checkout** | `fattail.ai` Woo | `/checkout` with Elements + PayPal, strict CSP | §8.1 / §2.2 |
| **Discount admin** | Woo coupons | `/admin/billing/discounts` | §16.6 |
| **Billing admin** | Woo order screens | quarantine queue, manual retry, refund, halt/resume | §14.2 |
| **Observer journey** | reads journey day | unchanged — must NOT become billing-dependent | §8.4 |
| **Admin Progress telemetry** | pulls revenue from Woo | repoint at `billing_charges` | new, small |
| **Reports / revenue** | Woo orders | `billing_charges` is the ledger | new |
| **0-DTE cross-grants** | Woo on both sites | out of scope — 0-dte.com keeps its own Woo | unchanged |

The three BLOCKING rows are Phase 0 (§9.8) and must land **before any subscription migrates**.
The rest can follow cohort by cohort, except checkout — which must exist before you can sell
anything new on Labs at all.

---

## 18. Membership lifecycle plugins — analysis and Labs mapping

§7.14 and §17 said "Labs must emit Discord roles and AC tags". That understated it. Reading the
live source: it is **twelve files**, not two plugins, and `membership-auto-upgrade` alone is
**1,599 lines** carrying the entire upgrade/downgrade decision engine.

### 18.1 Inventory, as live on 2026-10-15

> ⚠️ **This table is the AC/Discord-grepped subset and is INCOMPLETE.** A full sweep of all 36
> active plugins found three more integrations hooking subscription or membership transitions —
> see **§18.11** for the corrected inventory (15 files, ~5,600 lines, 13 transition hooks).

| File | Lines | Job |
|---|---|---|
| `plugins/membership-auto-upgrade/…php` **v1.7.0** | **1,599** | tier hierarchy, upgrade/downgrade decisions, membership swap/cancel, AC tagging + stripping, retries |
| `mu-plugins/fattail-observer-week5.php` | 219 | `FOTW - Observer Week 5`, days 29–42, hourly cron, **DRY RUN** |
| `mu-plugins/fattail-observer-commitment.php` | 190 | Gate-1 day-42 form → `FOTW - Observer Commitment` |
| `mu-plugins/fattail-observer-finisher-coupon.php` | 281 | validates the `OBSERVER*` week-5 codes |
| `mu-plugins/fotw-lifetime-navigator-tag.php` | 96 | Lifetime (9816) gets `FOTW - Navigator` + `FOTW - Lifetime` — the main plugin *bails* on one-off products |
| `mu-plugins/fotw-lifetime-upgrade-cleanup.php` | 141 | decouples membership from `_subscription_id`, cancels old Navigator subs with the no-mistag flag |
| `mu-plugins/fotw-discord-role-reconcile.php` | 110 | self-healing cron — grants missing tier roles via the BOT token |
| `mu-plugins/fotw-discord-lifetime-role.php` | 157 | grants/restores the Navigator role for Lifetime holders |
| `mu-plugins/fotw-discord-lifetime-connect.php` | 58 | connect link + guild add for Lifetime holders |
| `mu-plugins/fattail-lifetime-access-guard.php` | 144 | stops Woo expiring a Lifetime membership |
| `mu-plugins/fattail-membership-expiry-guard.php` | 19 | same, narrower |
| `mu-plugins/fotw-butterfly-lead.php` | 339 | lead capture → AC (not membership, but holds the same API key) |
| | **~3,350** | |

### 18.2 The ActiveCampaign tag model — two kinds of tag

The part most likely to be broken by a careless port, and genuinely well designed.

**Status tags — they toggle.** `FOTW - Observer` · `Activator` · `Navigator` · `CANCELLED`.
Exactly the four in `FOTW_AC_MEMBERSHIP_TAGS`, which is *the list the plugin strips*.
`CANCELLED` means "lapsed right now" and comes off at the next purchase.

**History tags — permanent, and deliberately OUTSIDE that list.** `FOTW - Observer Completed`
(term ran to `expired`), `FOTW - Observer Dropout` (`cancelled` early), `FOTW - Annual`,
`FOTW - Quarterly`, `FOTW - Lifetime`. Omission from the strip list is the *entire mechanism*
by which they survive later tier changes. A Navigator who once finished the Observer course
still carries `Completed` — which is how alumni-who-converted are findable.

Before this split, 153 people who finished the six weeks and 322 who quit early both collapsed
into `CANCELLED` and got identical emails.

**The safety boundary.** `get_fotw_tags_on_contact()` resolves only those four names to tag ids
and returns only those, so the strip loop can physically only remove those four. AC's own tags,
campaign tags and history tags are untouchable. **Any Labs implementation must keep an explicit
allow-list with the same property: the reconciler may only ever remove tags it owns.**

Operational detail to keep: the contact is **subscribed to lists 1 (master) and 4 (active
members) BEFORE tagging**, so automations can send immediately.

### 18.3 The upgrade/downgrade decision engine

Two independent axes — that is the subtlety.

**Axis 1, tier** (`FOTW_MEMBERSHIP_HIERARCHY`): `observer` (1) = [1718] · `activator` (2) =
[1799] · `navigator` (3) = [1800, 7864, 9816, 12234].

**Axis 2, commitment length** (`fotw_commitment_rank`):

```
day                ->  1
week  x1..x51      ->  2 + (interval-1)/52       week x52+  -> 4
month x1..x11      ->  3 + (interval-1)/12       month x12+ -> 4
year               ->  4       Lifetime (one-off) ranks highest
```

Monthly 3.00 · quarterly 3.17 · six-monthly 3.42 · annual 4.00. The code comment records why:
when month×1 and month×3 both returned 3, a monthly member moving to quarterly read as a
lateral move and the old subscription was never cancelled — **the double-billing bug of 27 Sep**.

**The same-tier matrix** (v1.7.0 — the reason the downgrade button is safe to show):

| New vs old commitment | Action |
|---|---|
| **Longer** (monthly → annual) | cancel the old subscription outright, `direction: upgrade` |
| **Shorter** (annual → monthly) | old → **`pending-cancel`**, and the MEMBERSHIP is deliberately left active |
| **Identical** | nothing but an order note — auto-cancelling one of two identical subscriptions is a guess |

`pending-cancel` rather than cancel is the key judgement: no further payment, but access runs to
the end of the period already paid for. Someone four months into a year keeps their eight.

**Cross-tier** (Navigator → Activator) takes a different path — `swap_membership_plan()` plus a
**hard cancel** — and its allow-list has always included `pending-cancel`. That asymmetry is
pre-existing and, per the plugin's own note, should not be "tidied" without checking prepaid
value.

### 18.4 Idempotency gates and escape hatches

| Mechanism | Purpose |
|---|---|
| `_fotw_membership_upgrade_processed` | Gate 1 — membership/subscription logic runs once per order |
| `_fotw_ac_tagged` | Gate 2 — AC tagging runs once, independently of Gate 1 |
| `_fotw_ac_scenario` / `_fotw_ac_old_tier_keys` | persisted so a *retry* can reconstruct the decision |
| `_fotw_upgrade_cancellation = 'yes'` | **the escape hatch** — `handle_subscription_end()` bails, so an upgrade-driven cancellation never mistags `CANCELLED` |
| `customer_has_active_fotw_subscription()` | don't tag `CANCELLED` when another subscription is live |
| `_fotw_week5_tagged` | per-subscription flag so a no-change cron run costs zero AC calls |

Two gates rather than one is deliberate and correct: AC can fail without re-running the
membership mutations.

**Retries:** 3 attempts, 5 minutes apart, via `wp_schedule_single_event`. After that it writes
an order note saying "manual remediation required" — and nothing else happens.

### 18.5 Mapping to Labs

| Plugin concern | Labs home | Notes |
|---|---|---|
| `FOTW_MEMBERSHIP_HIERARCHY` | **already exists** — `plans.grants_role` + the ranking in `identity.derive_role` | Do NOT duplicate. One hierarchy, not two |
| `fotw_commitment_rank` | new helper in `billing/periods.py` | **Replace the float rank with integer period-days** (7 / 30 / 91 / 182 / 365) from `interval_unit × interval_count`. Same ordering, no float comparison |
| Same-tier matrix | §8.2 | longer → upgrade-now with proration · shorter → `pending_cancel` at period end · identical → **quarantine for a human** |
| Cross-tier swap | §8.2 + `upsert_membership` | a plan change is a membership write |
| `pending-cancel` semantics | **already in the schema** — status `pending_cancel` + `ends_at` | §8.3 |
| `_fotw_upgrade_cancellation` | **already in the schema** — `cancel_reason` | set `cancel_reason='upgrade'`; the projection then never emits CANCELLED |
| `customer_has_active_fotw_subscription` | disappears | tags derive from `memberships`, so "another sub is live" is implicit |
| Status tags | `billing/projections.py` | §18.6 |
| History tags | same, but **append-only** | the strip list must never contain them |
| AC lists 1 + 4 | the reconciler, before tagging | keep the ordering |
| Observer week-5 / commitment | keep as date-driven jobs | no billing event — do not couple them to billing |
| Retry/abandon | replaced by reconciliation | §18.6 |

### 18.6 The architectural recommendation: reconcile desired state, don't fire events

**Do not port the event-driven tagging.** It is best-effort, and the evidence that best-effort
is insufficient here is overwhelming:

- The **Castaway system was silently dead for ~3 months** — both halves wiped, nobody noticed.
- The **Discord vendor plugin silently no-ops** when a member's OAuth token lapses, while still
  marking the job complete. That is why `fotw-discord-role-reconcile.php` had to be written.
- **10 missed orders from Feb–Mar 2026 were never remediated.**
- AC tagging **abandons after 3 retries**, leaving an order note nobody reads.

Three independent systems, each of which either needed a reconciler or silently drifted. So make
reconciliation the rule:

- `desired_tags(identity) -> set[str]` — a **pure function of membership state**, unit-testable,
  the single source of truth for what a contact should carry.
- `reconcile_tags(identity, apply)` — diff desired against actual, where *actual* is read through
  the §18.2 allow-list, and where **history tags are never candidates for removal**.
- **Events trigger a reconcile** for latency; **a periodic sweep reconciles everyone** so
  convergence is guaranteed rather than hoped for.
- A reconcile is idempotent, so a retry is free and "abandoned after 3 attempts" disappears.
- Running it with `apply=False` is a **drift report** — exactly what would have caught Castaway
  in week one instead of month three.
- The identical pattern covers Discord: `desired_roles()` + `reconcile_roles()`, and
  `fotw-discord-role-reconcile.php` is already a working proof of it.

Add one table so "why does this person have this tag" is answerable:

```sql
CREATE TABLE IF NOT EXISTS membership_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  event       VARCHAR(48) NOT NULL,
  detail      VARCHAR(255) NOT NULL DEFAULT '',
  actor       VARCHAR(64) NOT NULL DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_me_identity (identity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Today that answer lives in WooCommerce order notes, which do not survive the migration.

### 18.7 Traps that must survive the port

1. **History tags must never enter the strip list.** The whole model rests on that omission.
2. **Only ever remove tags we own** (§18.2). A reconciler that strips "everything not desired"
   would delete AC's own campaign tags.
3. **Observer history is scoped to product 1718 only.** A cancelling Navigator must never pick
   up an Observer history tag.
4. **`Completed` is final; `Dropout` may flip to `Completed`** (Law T9) — never the reverse.
5. **Upgrade-driven cancellation must not emit CANCELLED** — `cancel_reason='upgrade'`.
6. **Identical commitment is not a downgrade.** Quarantine it; don't guess.
7. **A shorter commitment keeps prepaid access** — `pending_cancel`, never a hard cancel.
8. **Subscribe to lists before tagging**, or an automation fires with no list membership.
9. **The comp path** needs the no-mistag flag *and* a check that Woo hasn't queued an
   "expiring" email. In Labs the second half disappears; the first is `cancel_reason`.

### 18.8 What NOT to port — six of the twelve files simply disappear

The most useful finding here. **Most of the Lifetime machinery exists only because WooCommerce
is subscription-driven.** In Labs a one-off purchase is first-class (§8.5 — a `billing_charges`
row with `subscription_id = NULL`), and membership is not coupled to a subscription id at all.

| File | Why it exists today | In Labs |
|---|---|---|
| `fotw-lifetime-navigator-tag.php` | main plugin bails on one-off products | **gone** — `desired_tags()` reads membership, not orders |
| `fotw-lifetime-upgrade-cleanup.php` | the `_subscription_id` trap | **gone** — no such coupling |
| `fotw-discord-lifetime-role.php` | Discord plugin is subscription-driven | **gone** — `desired_roles()` reads membership |
| `fotw-discord-lifetime-connect.php` | connect link gated on a subscription | **gone** |
| `fattail-lifetime-access-guard.php` | Woo tries to expire an unlimited membership | **gone** — no Woo expiry engine to fight |
| `fattail-membership-expiry-guard.php` | same | **gone** |

Roughly **600 lines of workaround deleted, not ported.** The three Observer mu-plugins stay as
they are — date-driven, no billing event, and §8.4 already requires the Observer journey not
become billing-dependent.

### 18.9 Gaps Labs must newly own

| Gap | Why |
|---|---|
| **AC contact creation** | today the WooCommerce→AC plugin creates contacts; with Woo checkout gone, Labs must `POST /contact/sync` on signup |
| **The AC key itself** | currently hardcoded in plugin source (§18.10). Labs needs it in the launchd plist like every other secret |
| **Drift reporting** | nothing today reports "AC disagrees with membership" |
| **Order notes → audit** | `membership_events` (§18.6) |
| **0-DTE shares the AC account** | `0dte.api-us1.com` serves both businesses. A Labs reconciler must scope strictly to `FOTW -*` or it can disturb 0-DTE segments |

### 18.10 Security findings from reading this code

**1. The ActiveCampaign API key is hardcoded in plugin source** — `FOTW_AC_CONFIG['api_key']`
in `membership-auto-upgrade.php`, and again in `fotw-butterfly-lead.php`.

**2. It is PUBLICLY READABLE right now.** `.php.bak*` files are not executed by PHP, so the web
server returns them as **plain text**. Verified by HTTP on 2026-10-15 — **10 files return 200,
and 9 contain the key**:

```
/wp-content/plugins/membership-auto-upgrade/membership-auto-upgrade.php.bak.v1.3.0      33,300 B
                                          ….php.bak.preswitch                           39,803 B
                                          ….php.bak.pre7864                             39,028 B
                                          ….php.bak.presametier.20260927                39,793 B
                                          ….php.bak.preobshistory.20261001              44,177 B
                                          ….php.bak.prequarterly.20261002               49,057 B
                                          ….php.bak.quarterlytagname.20261005           50,589 B
                                          ….php.bak.predowngrade.202610061539           50,569 B
/wp-content/mu-plugins/fotw-butterfly-lead.php.bak.preswitch                            15,169 B
/wp-content/themes/flatsome-child/functions.php.bak.preswitch                          249,038 B  (no key)
```

An AC v3 `Api-Token` grants full read/write on contacts, lists, tags, automations and campaigns
— and that account is **shared with 0-dte.com**. `wp-config.php` backups were also probed and
correctly return 403, so database credentials are **not** exposed.

Independent of native billing, and wants fixing today. Remediation, in order:

1. Move every `*.bak*` out of the webroot (`~/backups/`), or deny them at the web server.
2. Rotate the AC key in ActiveCampaign.
3. Put the new key in config, not source — and for Labs, in the launchd plist.
4. Check the same pattern on `0-dte.com`, which has the same backup habit.

**3. Backups-beside-source is the habit to break**, not just these files. It has already caused
one silent outage — the Castaway removal hook was lost in a `functions.php` rewrite — and now a
credential leak.

### 18.11 Complete sweep — the files §18.1 missed

§18.1 was written from the twelve files that grep for AC/Discord strings. A full sweep of all
**36 active plugins** plus 18 mu-plugins plus the child theme found **three more integrations
that hook subscription or membership transitions**, and they are not minor.

**Method:** `wp plugin list --status=active`, then each plugin's PHP grepped for
`wcs_|woocommerce_subscription|WC_Subscription`, `wc_memberships`, `api-us1|Api-Token`,
`discord`, SSO and payment markers. Vendor commerce plugins (WooCommerce, Subscriptions,
Memberships, Stripe, PPCP, WooPayments) are excluded below — they are what Labs is replacing,
not what it must re-implement.

#### 18.11.1 `fattail-trial-bot` — hooks ALL FIVE subscription transitions

Two files, ~1,350 lines, and it was absent from §18.1 because it does not touch AC or Discord
roles — it has its own Discord *polling*, which the grep did catch but which I filed as
unrelated.

| Hook | Handler | Meaning |
|---|---|---|
| `woocommerce_subscription_status_active` | `on_subscription_activated` | member starts / resumes |
| `woocommerce_subscription_status_on-hold` | `on_subscription_churned` | **a failed payment counts as churn** |
| `woocommerce_subscription_status_cancelled` | `on_subscription_churned` | |
| `woocommerce_subscription_status_expired` | `on_subscription_churned` | |
| `woocommerce_subscription_status_pending-cancel` | `on_subscription_cancelling` | code comment: "still has access, still winnable" |

Plus a `fattail_discord_poll` cron, `sync_member_signals()`, `frm_after_create_entry`, and a
**REST API** — `/members`, `/members/{id}`, `/members/by-wp-user/{wp_user_id}`,
`/entries/{member_id}`, all behind an `auth_check`.

**Why this matters for Labs:** this is the Observer trial-tracking system, and it is driven
entirely by WooCommerce subscription transitions. When Labs owns billing, **all five
transitions must be emitted or the trial dashboard goes blind.** Note the mapping is not
one-to-one with Labs' statuses: Woo's `on-hold` covers both a failed payment and an
administrative suspension, whereas Labs splits those into `past_due`, `grace` and `paused`.
Someone has to decide which Labs statuses count as "churned" for this bot — `past_due`
probably should not, since the retry ladder may still recover them.

Its REST API is also a consumer of truth, so whatever Labs emits must keep
`/members/by-wp-user/{id}` resolvable — which means the WP user id has to stay available on
the Labs identity, not just the Labs identity id.

#### 18.11.2 `fotw-0dte-discord-bridge` — a SECOND, independent Discord system

Entirely separate from the vendor plugin, with its own OAuth callback, guild-add, and an
Action Scheduler **kick** hook (`execute_kick`).

```
NAVIGATOR_PLAN_ID = 1897
NAVIGATOR_PRODUCTS = [ 1800, 7864, 7923 ]
```
Hooks `subscription_status_{cancelled,expired,on-hold}` → `on_subscription_inactive`,
`subscription_status_active` → `on_subscription_active`, and
`wc_memberships_user_membership_status_changed` → `on_membership_status_changed`.

So Navigator members are added to the **0-DTE** Discord guild and **kicked** when they go
inactive. §18.6's `desired_roles()` must therefore cover *two* guilds, not one.

⚠️ **A live gap, found here:** `NAVIGATOR_PRODUCTS` lists 1800, 7864 and 7923 — it omits
**12234 (Navigator Quarterly)** and **9816 (Navigator Lifetime)**. Both grant Navigator
elsewhere in the stack. On the face of it a Quarterly or Lifetime Navigator does not get
0-DTE Discord access, where a monthly or annual one does. Worth checking against the live
guild before assuming it is a bug — the membership-status hook may cover them by another
route — but it does not look intentional.

#### 18.11.3 `fotw-sso` — the exact tier resolution Labs already consumes

658 lines, and §18.5 asserted "`plans.grants_role` already exists, don't duplicate" without
having read how the tier is actually computed. It is **membership-first with a subscription
fallback**, highest rank wins:

| Source | Mapping |
|---|---|
| WooCommerce **membership plans** (tried first) | 1897 → Navigator (4) · **1943 Coaching → Navigator (4)** · 1896 → Activator (3) · 1895 → Observer (2) |
| **Subscription products** (fallback only) | 1800 / 7864 / 7923 / 12234 → Navigator (4) · 1799 → Activator (3) · 1718 → Observer (2) |

Two things to carry over: **Coaching plan 1943 maps to Navigator by business rule**, which is
easy to lose; and the fallback exists at all, meaning a member with a live subscription but a
broken membership record still gets their tier. Labs' equivalent should keep that
belt-and-braces rather than trusting `memberships` alone during the dual-write window (§7.13).

`0dte-fattail-sso` (957 lines) additionally filters **`user_has_cap`** — it grants
capabilities cross-site. Any capability-level grant must be inventoried before Woo stops being
the source of membership truth.

#### 18.11.4 Everything else, confirmed not in scope

| | Why not |
|---|---|
| `fattail-pricing-cards` v0.28.1 (68 files) | Presentation only — `init`, `template_redirect`, `body_class`. It renders the tier cards and the upgrade/downgrade buttons but makes no membership or AC decision. **It will need its links repointed at Labs `/checkout`** (§17), which is UI work, not logic to port |
| `fotw-member-logic` (70 lines) | One `wp_nav_menu_objects` filter changing a button's destination by plan. Trivial; Labs has `feature_role` |
| `fotw-att-report` | Read-only order-attribution dashboard. Reads Woo orders; will need repointing at `billing_charges` eventually (§17) |
| `fotw-butterfly-lead.php` | Lead capture → AC. Not membership. **But it holds the same API key** (§18.10) |
| Child theme `functions.php` (6,649 lines, 193 hooks) | Overwhelmingly SEO/FAQ schema via `wp_head` (129 of them). Only three relevant: two `woocommerce_account_membership-dashboard_endpoint` handlers, and **`woocommerce_payment_complete` → `auto_complete_order`** |
| `cleantalk-spam-protect`, `formidable(-pro)`, `wp-mail-smtp-pro`, `nextend-facebook-connect`, SEO/analytics plugins | Matched the grep incidentally (`sso` substring, `payment` strings). No membership logic |

**`auto_complete_order` is worth noting.** `membership-auto-upgrade` hooks
`woocommerce_order_status_completed`; the child theme is what drives orders to `completed` on
payment. In Labs that chain disappears — a successful charge is itself the event — so there is
no equivalent to port, but anyone tracing "what triggers the tagging" in the old system needs
to know this link exists.

#### 18.11.5 Corrected count

| | §18.1 said | Actual |
|---|---|---|
| Files in scope | 12 | **15** |
| Lines in scope | ~3,350 | **~5,600** |
| Subscription-transition hooks to replace | 4 | **13** across 4 files |
| Discord systems | 1 vendor + 3 custom | **2 guilds**, 1 vendor + 4 custom |
| Files that do NOT need porting | 6 (~600 lines) | 6 (~600 lines) — unchanged |

The §18.6 recommendation is unaffected and in fact strengthened: with **four separate files
hooking thirteen subscription transitions**, an event-fan-out is even harder to keep correct
than §18.6 argued, and a single `desired_state` projection that every consumer reads is even
more clearly the right shape.

#### 18.11.6 RESOLVED — see `ANALYSIS-ac-and-discord.md`

Both items left open here have been investigated in depth. Full write-up in
[`ANALYSIS-ac-and-discord.md`](../docs/billing/ANALYSIS-ac-and-discord.md); the headlines:

**AC contacts — answered.** The vendor `activecampaign-for-woocommerce` plugin creates them,
by two live routes: `user_register` (immediate contact sync, stamps
`activecampaign_for_woocommerce_contact_synced` on the user) and the Woo order sync
(`woocommerce_new_order` / `payment_complete` / `checkout_order_created`), which pushes
`ecomCustomer` + `ecomOrder` and resolves the `contacts` record. Demonstrably running —
4,867 completed `run_order_sync` actions and 28,720 cart events in Action Scheduler.
`membership-auto-upgrade`'s `ensure_ac_contact()` is a *fallback*, not the primary path.

⚠️ **And the scope is bigger than §18.9 says.** Because that plugin is driven by Woo orders and
carts, cutover silently kills AC's entire **ecommerce** layer, not just contact creation:
`ecomOrder` revenue data, `ecomCustomer` records, **abandoned-cart tracking** (28,720 events),
browse/product-view tracking (its URL patterns point at `fattail.ai/product/*`), subscription
status sync, and refund sync. Any AC automation keyed on ecommerce fields breaks at cutover
without announcing itself. Analysis §1.3 sets out three options; the recommendation is for the
Labs worker to re-push `ecomOrder`/`ecomCustomer` from `billing_charges` on each successful
charge, but it needs an audit of which automations actually use those fields first.

**The Discord plugin — the file count here was WRONG and it has now been read.** It is **11 PHP
files, 3,455 lines**, not 15,100 files (that was an artefact of a broken sweep script counting
the whole plugins directory). Reading it produced the exact root cause of the silent no-op that
forced `fotw-discord-role-reconcile.php` into existence: the role-grant handler authenticates
with the **bot token** but gates the whole call on the *member's* OAuth `access_token`, which is
irrelevant to the request — so a lapsed member token skips the grant with no log, and the
scheduled action still completes. Also found: a latent bug where a multi-item subscription
strips only the last product's roles, and the live product→role id map (analysis §2.2).

**Castaway — prior notes were wrong.** The fallback role is not wiped from all products:
**12234 Navigator Quarterly has it set** on cancel and on failed payment; the other five
products have nothing. One of six behaves differently, and someone should decide which way.

Confirmed for the record: exactly **one** Discord plugin folder,
`woo-subscription-discord-1 Backup` — literal space, literal "Backup". An earlier count of two
was shell word-splitting on that space.
