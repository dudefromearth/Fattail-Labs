# Links — Attribution and Affiliates (LK Phase 3) — Spec v0.2 (DRAFT — 3b design)

**Version:** v0.2 (DRAFT)
**Supersedes:** `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` for the 3b design and the nature of 3c. v0.1 stays on disk; its §1–§2 framing, §3 mechanism, and the 3a law catalogue (AF-L1–AF-L8) are unchanged and not reprinted here — this file amends and extends it.
**Date:** 2026-10-10
**Machine:** 3a is live (see `Specs/LK-1.2.md`-style as-built note below). 3b is specification only — files/trees touched by this document: NONE.
**Status:** DRAFT. **BUILD AUTHORITY: none.** Written up from a design conversation with Coach; nothing here is authorized to build yet.
**Canonical filename:** provisional — assigned at intake, same as v0.1.

**Parents:** `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` (3a mechanism, D8, the law numbering this file continues); `server/journey_scores.py` and `web/components/JourneyLeaderboard.tsx` (the existing reputation/contribution system this plugs into); `server/routes/billing.py` (the native Stripe checkout 3a already attributes to, and where credit redemption will apply).

---

## §0 3a status (as-built, not re-specified here)

Shipped and live on both StudioTwo and `labs.fattail.ai`, per the commit this spec conversation followed: a first-touch marker mints on redirect, rides a first-party `ftl_mkr` cookie, threads into native Stripe checkout metadata, and redeems into a `link_attributions` row on `checkout.session.completed` — idempotent, signature-verified, existing-member checkout only. Dormant until `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are configured. Nothing in this document changes that mechanism; 3b reads `link_attributions`, it doesn't touch how rows get into it.

---

## §1 What changed — the 3b design question, answered

v0.1 left 3b as "referral links + an affiliate registry," framed as leading toward a conventional cash-commission affiliate program (3c: "wire into a WooCommerce affiliate plugin"). The actual design that came out of discussion with Coach is a different, better-fitting shape:

| Area | v0.1 assumption | v0.2 (this document) |
|---|---|---|
| Reward for a referral | Unspecified; presumed cash commission (3c) | **Credits** — a store-credit currency, sized by the referred person's resulting membership tier, spendable only toward the *referrer's own* next tier upgrade |
| Non-member incentive | Unspecified — the open risk flagged in v0.1's §10 | **Social recognition** (leaderboard contribution), which needs no membership or payment to earn — closes the "why would a stranger bother" gap v0.1 left open |
| 3c (WooCommerce affiliate plugin) | A real sub-phase, its own stamp, needing a plugin decision (Q5) and WordPress tree | **Retired.** There is no cash ledger, no plugin, no new WordPress tree. Credit redemption rides the Stripe coupon mechanism on Labs' own already-built native checkout. Q5 is moot. |
| Compliance posture (Q7) | Real concern: 1099s, FTC disclosure, flagged as needing legal input before 3c | **Substantially lighter.** Store credit toward one's own membership is not a cash payout to a third party — but this is not a tax-law claim this document is qualified to make. Still worth a quick real check before shipping, just a much smaller one than cash commissions would have required. |

This is a meaningfully smaller, more contained build than v0.1 anticipated: **no new WordPress tree at all.** Everything lives in code Labs already owns — a new table, an amendment to the already-built native checkout (`billing.py`), a new input to the already-built contribution score (`journey_scores.py`), and an admin registry page. That lowers the risk class from where `Specs/LK-1.2.md` §3 and v0.1 §10 placed it, though it still touches real pricing/discount logic on a checkout path and member-facing recognition, so it's not a candidate for the same fast direct-iteration pattern Phase 1 used without at least Coach reviewing the credit-value constant and the self-referral rule before it ships.

---

## §2 Law catalogue — 3b (continues v0.1's AF-L numbering)

**AF-L9 — Credit accrual.** A credit-earning event is created when a `link_attributions` row's referred identity completes a plan change to Observer, Annual, or Lifetime, sized 1 / 10 / 25 credits respectively, credited to the link's `owner`. One event per attribution row (no double-counting a renewal as a second "upgrade" credit — only the tier *change* earns).

**AF-L10 — Credit value and redemption.** Credits are worth a Coach-set constant (proposed $25/credit, revisable, never hardcoded in more than one place). Redeemable only as a discount on the *credit-holder's own* next-tier Stripe checkout (Observer→Annual, Annual→Lifetime), applied via Stripe's native coupon/discount mechanism, capped at the checkout price (no negative-price checkouts, no cash difference refunded). Never a discount for the referred party. Never convertible to cash.

**AF-L11 — The Lifetime ceiling.** A Lifetime-tier credit-holder has no further spend path. Credits earned after reaching Lifetime do not expire and do not cash out — they convert to recognition standing only (AF-L13), making the top of the program permanently generous without reopening a payout question.

**AF-L12 — Non-member affiliate identity.** An approved (never self-serve — carried from v0.1's AF-L4) affiliate registry entry provisions a minimal row in `identities` with **no corresponding row in `memberships`** — an identity without a membership, which the schema already supports. This is what lets a true outsider own a referral link, accrue credits, and appear in recognition (AF-L13) before ever paying FatTail anything. Should they later actually join, credits already accrued become spendable on their first upgrade immediately — nothing is lost by having earned them "early."

**AF-L13 — Social recognition via the existing Leaderboard, not a new radar.** Referral credit-earning events become a new input to the `contribution` score already computed in `journey_scores.py` and already shown on the Journey Leaderboard (`JourneyLeaderboard.tsx`) and profile — the same place threads, comments, reviews, and course completions already count. **This is explicitly not added to the Process Flow radar** (`ProcessMeter.tsx`, "Practice compass") — that component's entire design principle is that practice discipline pillars never carry an outcome or money signal ("P&L never draws the path"), and a referral that produced a paid upgrade is exactly that kind of signal. Keeping it on the Leaderboard's contribution score instead of the radar is a deliberate, not incidental, choice.

**AF-L14 — No commission ledger, anywhere, ever (D8 reaffirmed, reinterpreted).** v0.1's D8 ("affiliate ledger stays in WooCommerce, never Labs") was written assuming a future cash-commission system. This design has no commission to ledger at all — Labs tracks a *store-credit balance redeemable only against its own pricing*, which is categorically a pricing/discount concern (same family as a coupon code), not a payout/commission concern. D8's actual intent — Labs never becomes an accounts-payable system, never issues 1099s, never moves money to a third party — is fully honored; it's just satisfied by there being no money movement to ledger in the first place, rather than by keeping the ledger in WooCommerce.

---

## §3 Component inventory — 3b

| Component | Kind | Notes |
|---|---|---|
| D9 Credit ledger | New table, Labs | one row per credit-earning or credit-spending event, identity_id, delta, reason (references the `link_attributions` row that earned it, or the checkout that spent it) |
| D10 Credit balance + redemption | Amendment to `billing.py` | `create_checkout` computes available balance (sum of D9 events) when the target price is a qualifying upgrade, applies a Stripe coupon capped at price; webhook amendment records the spend event only after the checkout actually completes (never reserve-and-hope) |
| D11 Contribution-score input | Amendment to `journey_scores.py` | referral credit-earning events become a new signal into the existing `contribution` pillar computation |
| D12 Affiliate registry + approval UI | New table + new small admin surface | name, email, slug, status (pending/approved/revoked), approved-by/at (AF-L4/AF-L12); on approval, provisions the `identities` row |
| D13 Owner activation on links | Amendment to `links.owner` (LK-L1, inert since Phase 1) | set to `identity_id` (member or provisioned non-member affiliate) when a referral link is created |

---

## §4 Still open (carried from v0.1, narrowed)

**Q6 — Self-referral.** Still unanswered and still load-bearing: does a credit-holder referring themselves (e.g., a second email, a friend's card) earn credit? Recommend AF-L7-style flagging (store the event, mark it suspect, never silently block) rather than a hard rule that might misfire on legitimate household/gift cases — but this is Coach's call, not an engineering default.
**Credit value.** $25/credit is proposed, not ruled. Easy to change (one constant) but should be a deliberate number, not a default that sticks by inertia.
**Who can create a referral link.** Today, only admins create any link at all (AD-L1, unchanged). Does 3b give members a self-service "get my referral link" surface, or does Coach keep issuing them by hand even once `owner` works? This changes how much new member-facing UI D12/D13 actually need, separate from the admin registry.
**Q7 (compliance), narrowed.** Much lower risk than v0.1 feared, but "store credit isn't a cash payout" is an assumption this document is making, not a ruling from anyone qualified to make it. Worth a real, quick confirmation before this ships — not a blocker to drafting or even building against, but a gate before it goes live for real members.

---

## §5 Explicitly out of scope (this version)

Everything v0.1 §9 already excluded, still excluded. Additionally now: any cash commission or payout mechanism (retired, §1); any WooCommerce/WordPress tree (no longer needed for 3b); self-serve non-member signup (AF-L4/AF-L12 unchanged — approval only); self-serve referral-link creation by members (open in §4, not decided).

---

*v0.2 DRAFT. BUILD AUTHORITY: none. Supersedes v0.1's 3b/3c framing; v0.1's 3a material and general framing stand. Written from a design conversation with Coach — nothing here is authorized to build until Coach says so explicitly, separate from this document existing.*
