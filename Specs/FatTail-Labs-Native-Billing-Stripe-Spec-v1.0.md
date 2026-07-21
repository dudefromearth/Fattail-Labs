# FatTail Labs — Native Billing (Stripe) Spec v1.0

**Status:** Approved as built (2026-07-21) — webhook + checkout live-verification
pending Stripe keys on MiniTwo (Coach supplies)
**Parent spec:** Identity & Access v1.0 — Stripe is the THIRD pluggable provider
(`stripe`), alongside `wordpress:fattail` and `wordpress:0-dte`. No new tables.

---

## 1. Principle

Billing rides the existing provider seams: Stripe Prices map to Labs plans via
`provider_plan_map`; customers link via `identity_links`; subscription lifecycle
drives the same `upsert_membership` machinery. **Stripe hosts every payment surface**
(Checkout + Customer Portal) — the server never renders billing UI or touches card
data. Config-gated: no `STRIPE_SECRET_KEY` → the provider does not exist and every
billing endpoint reports disabled; the standalone guarantee holds.

## 2. Config (all optional — absence disables billing)

`STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `LABS_WEB_ORIGIN` (redirect base,
required once billing is enabled). Price↔plan mappings are DATA:
`provider_plan_map (provider='stripe', external_key=<price_id>, plan_id)` —
managed by the `server/link_stripe_price.py` operator CLI.

## 3. API

```
GET  /api/billing/plans      {enabled, plans[{slug,name,grants_role,
                              prices[{price_id, interval, amount, currency}]}]}
                             (amounts fetched from Stripe, cached in-process)
POST /api/billing/checkout   {price_id} session required; price must be mapped ->
                             Checkout Session (mode=subscription, metadata
                             identity_id, existing customer reused via link) -> {url}
POST /api/billing/portal     session + stripe link required -> Portal session {url}
POST /api/billing/webhook    Stripe-Signature verified (constructed-event scheme):
```

Webhook events (designed to need NO Stripe API calls — fully processable offline):
- `checkout.session.completed` → link customer↔identity (identity_id from metadata)
- `customer.subscription.created/updated/deleted` → payload carries price id +
  status → map price→plan → membership status: active/trialing → **active**,
  past_due → **grace**, canceled/unpaid/incomplete_expired → **expired**
  (external_ref = subscription id). The webhook is the source of truth; the success
  redirect is UX only.

## 4. UI

- **/membership** pricing page: plan cards with interval prices → checkout redirect.
  Anonymous → create-account-first prompt. Billing disabled → "checkout coming soon,
  join free" fallback. `?status=success|cancelled` banners on return.
- Upgrade CTAs across the app (gated lesson 403, resource download denial, header
  dropdown upsell, live session role locks) now point to **/membership** (signup
  remains the account-creation surface).
- `/me` gains **Manage billing** (Customer Portal) when a Stripe link exists.

## 5. Verification split

- **Now (no keys):** disabled-mode behavior; webhook signature scheme (HMAC
  `t.payload` v1) verified with a test signing secret; full simulated lifecycle —
  checkout.completed links identity, subscription created→active/activator,
  past_due→grace, deleted→expired/observer; bad signature 400; unmapped price
  ignored gracefully.
- **On MiniTwo (Coach supplies keys):** live test-mode checkout, portal, and real
  webhook delivery (`stripe listen` in dev / public endpoint in staging).

## 6. Invariants

1. Card data and billing UI never touch the server (hosted Checkout/Portal only).
2. Membership truth comes only from verified webhook events.
3. Removing Stripe config removes the provider — no code path depends on it.
