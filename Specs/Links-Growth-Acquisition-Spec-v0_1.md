# Links — Growth & Acquisition (LK Phase 4) — Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT)
**Supersedes:** nothing — new document.
**Date:** 2026-10-10
**Machine:** Not yet dispatched to any machine. Specification only; files/trees touched by this document: NONE.
**Scope:** Build the two Tier A items from `docs/Links-QR-Use-Case-Ranking-Acquisition-Conversion.md` that need real code — **4a: two-sided referral credit** and **4b: partner/creator co-marketing links** — and explicitly declare the other two Tier A items (on-screen QR/YouTube native surfaces, paid-ad attribution tagging) out of spec scope because they need zero new code.
**Touches:** `routes/billing.py` (4a, a second credit-award call alongside the existing one); `links/credits.py` or a sibling module (4a, a new `reason` value); a **new table** for 4b (partner registry, deliberately separate from `affiliates`); a new small admin surface for 4b (parallel to `AffiliatesPanel.tsx`); possibly a new admin-facing call path to `identity.upsert_membership` for 4b's comp'd-membership term (that function exists today but nothing admin-facing calls it directly).
**Status:** DRAFT. **BUILD AUTHORITY: none.**
**Canonical filename:** provisional — assigned the next free `Specs/` series ID at intake, same as the rest of the LK series.

**Parents (cited, not amended):**
- `Specs/LK-1.2.md` — the link model (`links.owner`, slug, QR) this phase builds on.
- `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` / `v0_2.md` — the marker/attribution mechanism (3a, live) and the store-credit model (3b, AF-L9–AF-L14) that 4a directly extends and 4b deliberately does **not** reuse.
- `docs/Links-QR-Membership-Use-Cases.md` — items #2 (two-sided referral), #3 (partner/creator co-marketing), #21/#23 (on-screen QR, YouTube native surfaces), #26/#27 (paid-ad attribution).
- `docs/Links-QR-Use-Case-Ranking-Acquisition-Conversion.md` — why these four and not others (Tier A).

---

## §1 Purpose

The Tier A ranking identified four items with real acquisition/conversion leverage. Two need no new code — they're adoption of what Phase 1/3a already shipped. This document specs only the two that do:

1. **Two-sided referral (4a).** Today (AF-L9/AF-L10) only the link *owner* earns credit when someone they referred upgrades. The referred person gets nothing, even though referral conversion is usually bottlenecked by *their* hesitation, not the referrer's incentive. 4a gives the referred person a reason too.
2. **Partner/creator co-marketing (4b).** Every growth mechanism shipped so far (referral credits, nudges, upsell campaigns) recirculates people who already have some relationship to FatTail. 4b is the one item on the entire use-case list that reaches an audience with *no* existing stake — a trading educator, a newsletter, a podcast — and that audience has no reason to care about store credit toward a FatTail membership they may never buy. They need cash or a comp'd membership, which is a genuinely different compensation model than anything built in Phase 3b.

Items #21/#23 (on-screen QR + YouTube's native surfaces) and #26/#27 (paid-ad attribution) are **not specified here** — see §3. They are real, high-value, and should happen; they just aren't a spec.

---

## §2 Scope table

| Sub-phase | Delivers | Risk | Authorized by |
|---|---|---|---|
| **4a — Two-sided referral credit** | A second credit-award event, sized by a Coach-set constant, created for the *referred* person alongside the existing owner-side award, on the same qualifying checkout. | Extends an already-shipped, already-reviewed money-adjacent mechanism (AF-L9/AF-L10). Low-risk relative to 4b — a reasonable direct-iteration candidate once Q12/Q13 (§6) are answered. | Its own stamp, after this draft is reviewed |
| **4b — Partner/creator co-marketing links** | A new, non-affiliate class of link owner compensated in cash or a comp'd membership — terms the existing store-credit model (AF-L10: "never cash, never convertible") explicitly does not and should not cover. | Real compensation changing hands, or a membership granted outside the normal checkout path. This reopens the exact risk class `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` §10 flagged for the original 3c (cash commissions) before v0.2 retired it — retired *for the member-credit path only*, not for this one. | Its own stamp; cash terms specifically should get the same "real legal input, not an engineering guess" treatment v0.1 §8 Q7 flagged, before engineering starts |

---

## §3 Not specified here — operational only, zero build

**#21/#23 — On-screen QR + YouTube's other native surfaces.** `qr-card.png` (labeled QR) and `qr.svg`/`qr.png` already exist (LK-1.1 W3). "Building" this is rendering the existing output into a video asset, end-screen graphic, channel-banner image, or Community post — no code, no law, no gate. Track with a `placement` convention (e.g. `placement=card`, `placement=endscreen`, `placement=banner`, `placement=community`) exactly as Phase 1's placement fields already support.

**#26/#27 — Paid-ad click-through attribution.** `source`/`medium`/`campaign` already exist (LK-1.1). "Building" this is a tagging discipline (`medium=paid-ad`) applied before any ad dollar is spent, not after — no code, no law, no gate.

Both belong in an ops checklist, not a spec. Nothing below this line authorizes or gates them because nothing needs to.

---

## §4 Mechanism — 4a (two-sided referral)

`routes/billing.py`'s `_award_referral_credit()` (AF-L9) already awards the link `owner` on a qualifying `customer.subscription.created` event, keyed for idempotency on `(identity_id, reason, external_ref)`. 4a adds a second, sibling award call in the same function, for the *purchaser* (the referred person), using a distinct `reason` value so the ledger can always tell which side of a referral a given `credit_events` row belongs to. Both calls share the same `sub_id` as `external_ref`, so a redelivered webhook cannot double-award either side — the existing idempotency guard (AF-L9, the `ux_credit_events_idempotency` unique key) covers this without any schema change.

Self-referral (owner == purchaser) is a degenerate case of "two-sided": there is no second party. 4a does not change AF-L7/AF-L17's flagged-not-blocked self-referral rule — it simply doesn't fire a second award when there is no second identity to award.

---

## §5 Law catalogue — 4a (continues AF-L numbering; this is a direct extension of the existing credit law family)

**AF-L15 — Two-sided award.** When `_award_referral_credit` awards the link `owner`, a second award event is created for the purchaser (the referred identity), sized by its own Coach-set constant (Q12) — never derived from or equal to the owner's award by default. Each side's event carries a distinct `reason` value (e.g. `referral` for the owner, `referred` for the purchaser); neither write depends on the other succeeding, and a partial failure (one side recorded, the other not, e.g. a crash mid-transaction) is recoverable by simply redelivering — idempotency is per-side, not joint.

**AF-L16 — A referred credit with nothing to spend yet is not an error.** `balance()` (AF-L9) already derives correctly from summed `credit_events` regardless of reason; a freshly-referred Observer's credit sits banked until they have a next tier to spend it on. AF-L10's existing "redeemable only toward the credit-holder's own next tier, never cash" rule applies unchanged — 4a adds a new *party* who can hold this kind of credit, not a new *kind* of credit or a new redemption rule.

**AF-L17 — Self-referral unaffected (carries AF-L7/Q6 forward).** When owner and purchaser are the same identity, only the existing single-sided, flagged-not-blocked award fires — 4a's second award path is skipped, not awarded-and-flagged twice, because there is no second identity to pay.

---

## §6 Open decisions requiring Coach — 4a

**Q12 — Referred-side credit amount.** Same constant as the owner's award (AF-L10's proposed $25/credit value, scaled by tier same as AF-L9's 1/10/25), a flat "welcome" amount regardless of tier, or something else entirely? No default — this is a real cost-per-acquisition decision.
**Q13 — Retroactive or forward-only?** Does 4a apply to `link_attributions` rows already on the books before this ships, or only to attributions recorded after go-live? Retroactive application means a one-time backfill job against existing rows; forward-only needs none.

---

## §7 Mechanism — 4b (partner/creator co-marketing)

A partner is not a member and, in the typical case, has no existing Stripe relationship or `identities` row the way an approved 3b affiliate does (AF-L12 provisions one specifically so they can spend store credit through native checkout — a cash-paid partner has no such spend path to provision for). 4b needs its own registry and its own compensation model, deliberately **not** layered onto `affiliates`/`credit_tier_rules` (AF-L4/AF-L9), which are store-credit-only by design (AF-L10's "never cash" is a law, not an oversight).

A partner's link is still an ordinary row in `links` — it inherits QR, reporting, and the existing marker/attribution plumbing (AF-L1/AF-L2) for free, same as any other owned link. What's new is *who* can own one and *how they're paid*, not the redirect/attribution mechanism itself.

---

## §8 Law catalogue — 4b (new prefix: PM-L, Partner Marketing — deliberately not AF-L, to avoid implying partner terms inherit AF-L10's "never cash" rule)

**PM-L1 — Partner registry, separate from affiliates.** A new table, `partners`: name, email, entity/company name (nullable), `terms_type` (`cash` | `comp_membership`), `terms_value` (cents for cash, a plan reference for comp'd membership), status (`pending`/`approved`/`revoked`), approved-by/at. Never merged into or confused with the `affiliates` table — different compensation model, different trust boundary.

**PM-L2 — Partner link ownership.** `links.owner` (AF-L3) is scoped to an `identities.identity_id`. 4b's working assumption — not yet a law — is to provision a minimal `identities` row for an approved partner too (reusing AF-L12's exact pattern), purely so `owner` stays one consistent type across the whole app, even though a cash-paid partner never spends credit through it. The alternative (widening `owner` with a type discriminator) is explicitly not preferred and would need its own justification if Coach wants it instead.

**PM-L3 — No cash ledger in Labs.** Labs proves attribution (signups/orders per partner link) and reports a dollar-equivalent total for FatTail's own bookkeeping. It never issues a payment, never tracks payout status, never generates a 1099. The actual cash payment happens entirely outside Labs — this is v0.1's original D8/§10 intent, which v0.2's AF-L14 only retired for the member-store-credit path; it is explicitly **not** retired for partner cash terms.

**PM-L4 — Comp'd membership is a membership grant, never a faked checkout.** If a partner's term is a free/comp'd membership, Labs grants it via a new admin-initiated call to `identity.upsert_membership()` (the function already exists; no admin-facing caller does today) — never by constructing a $0 Stripe checkout or any other simulation of a real payment.

**PM-L5 — Compliance flag (carries v0.1 §8 Q7 forward, un-retired for this path).** Real cash compensation to a partner reopens the FTC-disclosure / 1099-threshold question v0.2 correctly retired for store credit. It is not retired here. Same treatment v0.1 §10 recommended for the original 3c: real legal input before this goes live, not an engineering guess.

---

## §9 Open decisions requiring Coach — 4b

**Q9 — Partner terms structure.** Flat fee per signup, percentage, tiered, or something else? A business decision, not engineering's to default.
**Q10 — Partner self-service visibility.** Does an approved partner get any read access to their own link's numbers (a new, narrow public-facing surface — more exposure than anything partner-related has had so far), or does FatTail report to them manually? Mirrors v0.1 §8 Q4's self-service framing.
**Q11 — Payment mechanism.** Confirmed fully outside Labs (PM-L3) — manual bank transfer, PayPal, Wise, whatever FatTail already uses for other vendors — or does Coach want Labs to at least generate an unpaid invoice/payable record (still never actually pay it)?

---

## §10 Component inventory

| Component | Kind | Notes |
|---|---|---|
| D14 Referred-side award call | Amendment to `routes/billing.py` | AF-L15, same transaction as the existing owner-side award |
| D15 Referred-credit constant | Config/constant | AF-L15, Q12 |
| D16 Partner registry table | New table, Labs | PM-L1 |
| D17 Partner registry admin UI | New admin surface | parallel to `AffiliatesPanel.tsx`; approval-only, no self-serve (mirrors AF-L4) |
| D18 Partner owner provisioning | Amendment, reuses `identity_mod.get_or_create_identity` | PM-L2 |
| D19 Comp-membership grant action | New admin-facing caller of existing `identity.upsert_membership()` | PM-L4 |

---

## §11 Work packets (scoping only — nothing here dispatches from this document)

**W0 (4a) — Build-ready once Q12/Q13 are answered.** Small: one new `reason` value, one new call site in `_award_referral_credit`, no migration (reuses `credit_events`/`ux_credit_events_idempotency` as-is).
**W0 (4b) — Needs Q9–Q11 answered first; needs PM-L2's provisioning approach confirmed before any code.** New migration (`partners` table), new admin route + panel, one new admin action wired to `identity.upsert_membership()`.

---

## §12 Acceptance tests (draft)

**AT-1 (4a)** A qualifying first-touch attribution's `customer.subscription.created` event awards credit to both the link owner and the purchaser, each with its own correctly-tagged `reason`, in one transaction.
**AT-2 (4a)** Redelivering the same webhook event does not double-award either side — idempotency holds per side, independently.
**AT-3 (4a)** Self-referral (owner == purchaser) produces exactly one award event, not two, and remains flagged per AF-L7/AF-L17.
**AT-4 (4b)** A `pending` partner's link is inert/unapproved, exactly like AF-L4's affiliate pattern — scannable, owns nothing until approved.
**AT-5 (4b)** No partner attribution report, export, or admin view ever contains a payment-sent/payout-status field (PM-L3) — mirrors AF-L6/the existing affiliate AT-6.
**AT-6 (4b)** A comp'd-membership grant calls `identity.upsert_membership()` directly; no Stripe API call of any kind occurs on that path.

---

## §13 Explicitly out of scope (this version)

Any self-serve partner signup (approval-only, PM-L1, mirrors AF-L4/AF-L12). Any actual payment execution inside Labs, in any form (PM-L3). Any change to the existing owner-side credit math or constants (AF-L9/AF-L10) — 4a adds a second award, it does not change the first. On-screen QR/YouTube native surfaces and paid-ad attribution tagging (§3 — operational, not a build). Self-serve referral-link creation by members (still open from `Specs/Links-Attribution-Affiliates-Spec-v0_2.md` §4, unchanged by this document).

---

## §14 Risk note to Coach

4a is a small, low-risk extension of a mechanism that already shipped and was already reviewed (AF-L9/AF-L10) — a reasonable direct-iteration candidate once Q12/Q13 are answered, in the spirit of `Specs/LK-1.2.md` §3's documented exception.

4b is not. It reopens the exact risk class `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` §10 described for the original 3c (cash commissions) — real compensation changing hands, real compliance exposure (PM-L5) — which v0.2 correctly retired *only* because it replaced cash with non-transferable store credit. 4b puts cash back on the table deliberately, because that's the only way to compensate someone with no existing stake in FatTail. Recommend the same fuller gate v0.1 §10 recommended for 3c, specifically for 4b — Coach review of PM-L1–PM-L5 and real answers to Q9–Q11 before any code, not direct iteration.

---

*v0.1 DRAFT. BUILD AUTHORITY: none. Nothing in this document authorizes touching `routes/billing.py`, creating the `partners` table, or granting any membership outside the existing checkout/webhook paths.*
