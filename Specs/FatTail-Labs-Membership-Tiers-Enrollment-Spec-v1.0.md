# FatTail Labs — Membership Tiers & Enrollment Spec v1.0

**Status:** Approved as built (2026-07-21, Coach directive with AI Labs funnel
reference screens)
**Supersedes:** parent spec §3.2's placeholder pricing. Extends Identity & Access
(role ladder gains `alumni`) and Native Billing (tier wiring notes).

---

## 1. Tiers (the products)

Courses are included with **every** membership tier.

**Discord / FatTail App (amended 2026-08-06 — DL-237 / DL-239 / DL-240):**  
Historically: “Discord and the FatTail App are delivered outside Labs (Discord roles /
MSC entitlements) — Labs enforces courses and livestreams only.”  

**Now:** Member **connect** to Discord guild **FatTail AI** is via the **WordPress
Discord connector plugin on fattail.ai**; Discord **name is maintained on fattail.ai**
(DL-240). Labs **owns entitlement** (date-aware memberships), **ingests** Discord id +
name, and runs Community as a **second window** on that guild
(`Specs/FatTail-Labs-Community-App-Spec-v1.0.md` v1.0.2). Discord remains the
conversational home for guild chat; **Labs membership is SoR for who may have paid
roles**. Role revocation must run on a **schedule against date-aware derivation**
(Observer term end, alumni year end), not webhooks alone (DL-238). Execution:
`agents/p-community/`.

| Tier (plan slug) | Price | Includes | Labs role granted |
|---|---|---|---|
| **Navigator** (`navigator`) | **$267/mo · $2,997/yr** — the featured offer | Everything: live trading room + coaching, workshops/livestreams, all courses & certifications, resources, Discord, app | `navigator` |
| **Activator** (`activator`) | **$100/mo — promotions only** (revealed by promo link/code, never on the open pricing page) | Discord, app, all courses, workshops | `activator` |
| **Observer trial** (`observer-trial`) | **6 weeks at $17/wk or $102 total** — long enough for habits to form (~33–66 days is a common expert range) | **Full Navigator access during the membership** | `navigator` |
| **Course Alumni** (`courses-alumni`) | Not sold — granted (§3) | Course library + resources for 1 year. No Discord, no livestreams, no app | `alumni` (new) |

## 2. Role ladder change

`observer < alumni < activator < navigator < administrator`

- **Lesson content + resource downloads: threshold drops from activator to `alumni`.**
- Workshops/livestreams remain `activator+`; trading room `navigator`.
- Free accounts (`observer` role) keep previews only — unchanged.

## 3. The Alumni rule (retention grandfather)

Leave after a **full 6-week Observer membership**, or after **≥ 28 days** on Activator or
Navigator, and you keep the **course library for 1 year** (membership
`courses-alumni`, `current_period_end = +1 year`, source `system`).

- Enforcement: when a provider membership expires (Stripe webhook, WP sync), the
  expiring membership's tenure (`started_at → now`) is checked; ≥ 28 days (or
  completed full Observer term) → alumni granted automatically. Manual grant:
  `grant_alumni` is also callable by operators.
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
  offer — ours pitches the **6-week Observer membership** ("$17/wk or $102 for 6 weeks")
  rather than a discount.
- Alumni promise shown under the cards: stay a full month (or complete the trial)
  and the courses are yours for a year even if you leave.

## 5. Display & wiring

- Sellable plans carry `display_json` (migration 005): price strings, features,
  badge, `featured`, `promo_only`, `interval_options` — so the pricing page renders
  fully before Stripe wiring; `/api/billing/plans` always returns the tier cards
  (checkout buttons appear only when billing is enabled and prices are mapped).
- Stripe wiring (MiniTwo): prices — navigator monthly **$267** + annual **$2,997** →
  `navigator`; activator $100 (promo codes via Stripe promotion codes) →
  `activator`; observer weekly (**$17/wk or $102** for the term) → `observer-trial`,
  with the **6-week** cap applied post-checkout (webhook sets `cancel_at = start + 42d`
  — requires live key; noted as wiring work).

## 6. Invariants

1. Every paid tier includes course access; the free role never does (previews only).
2. Alumni grants derive only from tenure rules or explicit operator action.
3. Expired-by-date memberships confer nothing — the single derive_role algorithm
   remains the only authority.
4. The Activator tier never renders without a promo parameter.
