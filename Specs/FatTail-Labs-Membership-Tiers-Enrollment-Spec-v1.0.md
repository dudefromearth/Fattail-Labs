# FatTail Labs — Membership Tiers & Enrollment Spec v1.0

**Status:** Approved as built (2026-07-21, Coach directive with AI Labs funnel
reference screens)
**Supersedes:** parent spec §3.2's placeholder pricing. Extends Identity & Access
(role ladder gains `alumni`) and Native Billing (tier wiring notes).

---

## 1. Tiers (the products)

Courses are included with **every** membership tier. Discord and the FatTail App are
delivered outside Labs (Discord roles / MSC entitlements) — Labs enforces courses and
livestreams only.

| Tier (plan slug) | Price | Includes | Labs role granted |
|---|---|---|---|
| **Navigator** (`navigator`) | **$250/mo · $2,500/yr** — the featured offer | Everything: live trading room + coaching, workshops/livestreams, all courses & certifications, resources, Discord, app | `navigator` |
| **Activator** (`activator`) | **$100/mo — promotions only** (revealed by promo link/code, never on the open pricing page) | Discord, app, all courses, workshops | `activator` |
| **Observer trial** (`observer-trial`) | **$20/wk for 4 weeks** | **Full Navigator access during the trial** | `navigator` |
| **Course Alumni** (`courses-alumni`) | Not sold — granted (§3) | Course library + resources for 1 year. No Discord, no livestreams, no app | `alumni` (new) |

## 2. Role ladder change

`observer < alumni < activator < navigator < administrator`

- **Lesson content + resource downloads: threshold drops from activator to `alumni`.**
- Workshops/livestreams remain `activator+`; trading room `navigator`.
- Free accounts (`observer` role) keep previews only — unchanged.

## 3. The Alumni rule (retention grandfather)

Leave after a **full 4-week Observer trial**, or after **≥ 28 days** on Activator or
Navigator, and you keep the **course library for 1 year** (membership
`courses-alumni`, `current_period_end = +1 year`, source `system`).

- Enforcement: when a provider membership expires (Stripe webhook, WP sync), the
  expiring membership's tenure (`started_at → now`) is checked; ≥ 28 days →
  alumni granted automatically. Manual grant: `grant_alumni` is also callable by
  operators.
- **Memberships now expire by date**: role derivation ignores memberships whose
  `current_period_end` has passed (this is what ends the alumni year — and applies
  to all memberships generally).

## 4. Enrollment funnel (AI Labs reference)

- **Step 1 — account** (`/signup`): "Step 1 of 2" chip, value copy, what-happens-next
  list. (Social-proof wall joins when real testimonials exist.)
- **Step 2 — membership** (`/membership?welcome=1`): "Step 2 of 2 — Welcome, {name}".
  Navigator card featured with monthly/annual choice; Observer trial card beside it;
  **Activator card renders only with a promo parameter** (`?promo=...`). "Continue
  with your free account" link → `/pathway` (the free path is never hidden).
- **Exit intent** (step 2, once per session): leaving the page surfaces the retention
  offer — ours pitches the **$20/wk Observer trial** ("try everything for 4 weeks")
  rather than a discount.
- Alumni promise shown under the cards: stay a full month (or complete the trial)
  and the courses are yours for a year even if you leave.

## 5. Display & wiring

- Sellable plans carry `display_json` (migration 005): price strings, features,
  badge, `featured`, `promo_only`, `interval_options` — so the pricing page renders
  fully before Stripe wiring; `/api/billing/plans` always returns the tier cards
  (checkout buttons appear only when billing is enabled and prices are mapped).
- Stripe wiring (MiniTwo): prices — navigator monthly $250 + annual $2,500 →
  `navigator`; activator $100 (promo codes via Stripe promotion codes) →
  `activator`; observer weekly $20 → `observer-trial`, with the 4-week cap applied
  post-checkout (webhook sets `cancel_at = start + 28d` — requires live key; noted
  as wiring work).

## 6. Invariants

1. Every paid tier includes course access; the free role never does (previews only).
2. Alumni grants derive only from tenure rules or explicit operator action.
3. Expired-by-date memberships confer nothing — the single derive_role algorithm
   remains the only authority.
4. The Activator tier never renders without a promo parameter.
