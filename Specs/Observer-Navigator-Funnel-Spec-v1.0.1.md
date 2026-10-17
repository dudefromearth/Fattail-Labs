# Observer / Navigator Acquisition Funnel — Spec v1.0.1

**Status:** Approved by Coach 2026-10-12 (DL-826)
**Date:** 2026-10-11
**Scope:** Single-purpose member-acquisition funnel for fattail.ai, built on the owned stack (FastAPI + React + MySQL + nginx). Not a generalized tool. *(v1.0.1, B5 ruled: nothing WordPress-related; it integrates with WooCommerce only during the migration window.)*
**Supersedes for review:** `SPEC-v1.0-observer-navigator-funnel.md` (original kept unchanged alongside this file).
**Companion:** WP-Labs-Cutover-Design-v1.0.1.md

**Scope statement.** Active program: Observer/Navigator acquisition funnel and WP→Labs cutover (documents only). Files touched: this file only (new). Touches outside program: NONE. No code, decision log, CLAUDE.md or INSTRUCTIONS.md changes. Content of the original draft is carried forward word for word except where listed below.

## Changes from the original draft

| # | Section | Change | Source |
|---|---|---|---|
| 1 | Title / filename | Renamed from "Spec v1.0 — Observer / Navigator Acquisition Funnel" (`SPEC-v1.0-observer-navigator-funnel.md`) to this name, so it no longer shares a series number with the cutover doc | Review A9 |
| 2 | Header | Status set to "Draft v1.0.1 for review, not approved."; scope statement, this table and Review status added | Review A9 |
| 3 | §1 | "Two products, two jobs" → "Three products" (table has three rows) | Review A9 nit |
| 4 | §2 | Note added: the Discord plugin does not read membership today; the subscription-shaped Lifetime record bridges it | Coach ruling B1 |
| 5 | §3 | Discord gate rewritten from subscription status to **membership** status; Lifetime keeps Discord; Lifetime members get the Navigator role; the Coach role is reserved for legacy 0DTE.com members | Coach ruling B1 |
| 6 | §4, §8 | Bracketed notes added where "Discord closes / cuts" now depends on what membership level a finished Observer or failed payer keeps (open B2/B3) | Coach ruling B1 + open B2/B3 |
| 7 | §5, §8 | Footnotes: Ash (Design) and Ada (Money) are FatTail bot seats | Answers review A9 question |
| 8 | §11 D4 | D4 rewritten: resolved by B1 ruling (bridge record now, bot rebuilt against Labs later, aligned with DL-238) | Coach ruling B1 |
| 9 | New §12–13 | Open decisions for Coach (B2–B7, questions 2–8, suggested defaults) and Review status | Review |

---

## 1. Products

Three products:

| Product | Type | Price | Grants |
|---|---|---|---|
| **Observer** | Subscription (trial) | $17/week, 6 weeks | Navigator membership |
| **Navigator Annual** | Subscription | $1,997/year | Navigator membership |
| **Navigator Lifetime** | One-time product | one-time | Navigator membership |

- Activator is **out of scope** — not sold, not referenced.
- Observer is a paid trial framed as a training program, not a free trial.
- No refunds. $17/week is disclosed upfront at checkout.

## 2. Member States (five as of v1.0.1, B4)

1. No subscription — no access
2. Observer subscription — full access during trial
3. Navigator annual subscription — full access
4. Navigator lifetime product — full access
5. *(Added v1.0.1, Coach ruling B4, 2026-10-11)* Cancelled before completion — a member who cancels before the six weeks are over gets **no membership and no subscription**: no IKI Labs, no tools, no Discord, no access at all. They **stay on the email list** and receive a dedicated win-back campaign (warm leads who already paid), separate from the completion email journey.

> **v1.0.1 note (B4 ruling):** the 2026-09-26 decisions are restored. Early cancel gets no tools (state 5). Completion means day 42 elapsed **plus** the six-week course complete; only a completed Observer keeps membership. Two states keep membership without a subscription, both on the IKI Labs floor (B2/B3): the **finished Observer** and the **lapsed annual Navigator**, who lands in the same position. State 5 is different: no membership at all.

**Lifetime = one-time product.** It does not create a subscription. The membership flag never changes; the payment instrument is the only variable. This resolves the earlier "perpetual subscription" idea — unnecessary, since the Discord plugin reads membership status, which we control.

> **v1.0.1 note (B1 ruling):** Today's Discord bot does *not* read membership — it only sees subscription changes through its limited WooCommerce interface. During the migration window the Labs backend writes a **subscription-shaped record** for each Lifetime member so the existing bot keeps working unchanged. This is a compatibility shim for the bot only; it does not change the product model above (Lifetime is still a one-time product, D1 stands). Whether these four states are complete is open (B4).

## 3. Two-Gate Architecture

- **Discord gate:** **membership** status (Coach ruling B1, 2026-10-11). Lifetime members keep Discord. Discord follows membership, not subscription.
  - *Migration window:* the existing Discord bot only sees subscription changes through its WooCommerce interface, so the Labs backend writes a subscription-shaped record for each Lifetime member; the bot runs unchanged.
  - *Later:* the bot is rebuilt against the Labs backend and reads membership directly. This aligns with DL-238 (Labs' date-aware membership derivation as the Discord role source, with a reconciliation sweep).
  - *Timing (Coach ruling 2026-10-11, replaces the earlier "no urgency, stays in Phase 4" note):* the subscription-shaped bridge record is a stopgap, not a destination. Rebuild the bot to read membership directly from the Labs backend as soon as possible, without letting the bridge hang around, so the WooCommerce API dependency is removed promptly. Lifetime members who join before the rebuild are still handled manually.
  - *Role (ruled 2026-10-11):* from here on, a Lifetime member receives the **Navigator** role on Discord. The **Coach** role is reserved for legacy members from the 0DTE.com website.
  - *Discord for members without an active subscription (Coach ruling 2026-10-11):* until the rebuild, Discord follows the subscription the bot can actually see, because WooCommerce's API restrictions mean the bot has no view into membership. A finished Observer or lapsed annual Navigator has no subscription, so the bot sees none and Discord is cut, matching "Observer ends, Discord closes." The subscription-shaped bridge record is the Lifetime exception: the Labs backend writes it so the existing bot keeps Lifetime members in. After the rebuild the bot reads membership directly from the Labs backend, removing the WooCommerce restriction.
- **Site gate (fattail.ai + labs.fattail.ai):** membership status. Survives Observer ending.
- **IKI Labs:** the subset of labs tools available to members whose subscription has ended but whose membership persists.
  - *Work to do (Coach, 2026-10-11):* IKI Labs has something for finished Observers to land on, but it is not well formulated yet. That formulation work must be taken on by the end of this week, **Friday, October 16, 2026**.
- Membership plugin grants one access level from any of the three payment paths. It never asks how access was paid for.
  - *Resolved (Coach ruling B2, 2026-10-11):* the plugin grants **one membership, one level** from any of the three payment paths. That level is a state, not a single tier, and it carries a tool-access modifier. A finished Observer is still a member (the membership flag never changes), so the plugin still grants their one level, with the tools floor applied: IKI Labs only, no major tools. The payment instrument is the variable, and the finished-Observer state is one of the values it can take. **The rule:** the level's tool access depends on whether a subscription is currently active. This is the workaround for WooCommerce: membership survives, the subscription ends, and the gap between them defines IKI Labs as the floor.

## 4. Trial-to-Paid Transition

- Observer does **not** auto-convert. Member must buy Navigator separately.
- When Observer ends, membership persists. Access to the system persists. Discord closes. *(v1.0.1, ruled 2026-10-11: holds. The bot sees no subscription, so Discord closes; see §3.)*
- Week 6 is the unlock condition for the valuable tools — completing the six weeks is required.
- Day-42 email: "your six weeks are done — here's Navigator annual, or lifetime if you never want to think about this again." No fake urgency. *(Goes only to members who completed the six weeks; early cancellers get their own win-back campaign, per B4. The 2026-09-26 week-5 campaign ends at day 42, with no further drip.)*
- *(v1.0.1, Coach ruling 2026-10-11, replaces the day-49 second touch)* After day 42 there is no day-49 event or designation. Members who completed the six weeks move into a different group on a separate email journey. Its touches are not tied to any specific day count, and the journey is its own thing to design.

## 5. Funnel Front End on the Owned Stack

> **v1.0.1 (B5 ruling):** replaces the original custom WordPress theme. **RULED 2026-10-11 (Coach):** the funnel has nothing to do with WordPress. It is built on the owned stack (FastAPI + React + MySQL + nginx). Funnel v1.0 is the first piece of the cutover's Phase 1 on that stack, not a WordPress theme that gets built and thrown away. The only WordPress-side contact is integration with WooCommerce during the migration window.

- Custom FatTail front end in React on the owned stack (Ash's charter: build the FatTail version, don't rent).¹
- Mobile-first, responsive: one codebase, breakpoints for phone / tablet / desktop.
- Config layer: product IDs, membership levels, subscription terms in one config. Prices change without code changes.
- Member detection: live membership and subscription check against the Labs backend (FastAPI), not WordPress's `is_user_logged_in()` or a membership plugin. During the migration window the backend reads WooCommerce for payment state. Live check, not cached role — stale sessions must not see a buy button they don't need.
- Logged-in experience differs by state: Navigator member sees "you're already covered"; Observer member sees upgrade path; lifetime member sees nothing to buy.

¹ Ash = FatTail's Design bot seat; Ada = FatTail's Money bot seat. Both are real seats, not yet on the repo's bench roster.

## 6. Three Entry Points

1. **Sales page** — cold traffic (search, ads). Hook, VSL, six-week breakdown, price, one CTA. Quiet, premium, institutional — not ClickFunnels.
2. **VSL page** — social clips, YouTube. Short video does the trust work.
3. **Direct order form** — warm traffic (email, existing members, hand-raisers). Highest conversion.

Routing: referrer-based at the edge. Every page links to the other two — no dead ends. Shared config keeps prices in sync.

## 7. Speed-Aware Delivery

- Detect via Network Information API (Chromium) + lightweight latency probe fallback (Safari/Firefox).
- Bucket: fast / medium / slow.
- Slow: defer non-critical scripts, lazy-load below-fold, bare checkout — no animations, no extra widgets.
- Goal: checkout completes on a two-bar connection.

## 8. Failed Payments

- Stripe retry schedule: three attempts over ~two weeks. Access survives the window.
- Soft nudge after first failure: "your payment didn't go through, update your card."
- All retries fail → subscription unpaid → Discord cuts → membership survives → member drops to IKI Labs subset → Ada's failed-renewal book picks up the open order.¹ *(v1.0.1: tool access drops to the floor per B2/B3. Discord cuts because the bot sees no subscription; ruled 2026-10-11, see §3.)*
- Annual renewal failure: same pattern. Access never ends per product design — but the failed-renewal flow still fires for collection.
  - *Resolved (Coach ruling B3, 2026-10-11):* "access never ends" means membership never ends, not full access. **RULED 2026-10-11:** a lapsed annual Navigator does **not** keep full access. Someone who stops paying (cancels or doesn't renew) loses the subscription and drops to the same position as a finished Observer: membership only, IKI Labs only, no major tools. The membership flag never changes; the payment instrument is the variable.

## 9. Dispute Evidence Capture

Logged at three moments, keyed to order ID, retained ≥2 years:

- **Page load:** IP, user agent, device fingerprint, referrer, timestamp.
- **Terms acceptance:** exact terms version shown, checkbox state, click timestamp.
- **Payment confirmation:** Stripe charge ID, order ID, screenshot hash of rendered checkout.

Plus usage tracking through every week of the subscription (existing admin tool): login timestamps, lesson completion, tool usage, Discord activity — keyed to member ID and week number. A member who logged in weekly cannot credibly claim non-receipt.

**Privacy:** IP/device fingerprint = personal data (GDPR/CCPA). Privacy notice covers collection and retention. Terms state data exists to verify program participation.

## 10. Dispute-Evidence Layer (on existing progress admin)

- Read-only consumer of existing sources: `lesson_progress`, `enrollments`, WooCommerce source, Discord activity (from WP plugin user meta).
- New pure module: **evidence assembler** — takes order ID, builds per-order package (purchase timestamp, terms version, screenshot hash, weekly usage timeline).
- Degradation rule: unreachable source → stale panel + freshness footer. Never "member did nothing."
- Follows Labs isolation pattern: sources fetch/normalize, derivation in pure modules.

## 11. Open Decisions for Review

- **D1 (resolved):** Lifetime = one-time product. No perpetual subscription.
- **D2:** Edge router — reverse proxy vs app-level middleware for the traffic split (load-bearing, still open).
- **D3:** Config format — PHP array vs JSON vs customizer panel.
- **D4 (resolved by B1 ruling, 2026-10-11):** Discord follows membership. The current bot cannot read memberships (it only sees Woo subscription changes), so during the migration window the Labs backend writes a subscription-shaped record per Lifetime member and the bot runs unchanged; the bot is later rebuilt against the Labs backend to read membership directly (aligned with DL-238). Lifetime members get the Navigator role; the Coach role is reserved for legacy 0DTE.com members (ruled 2026-10-11).
- **D5:** PWA tracker (separate project) — read-only, served off site, coordinates with in-app tracker via Labs backend.

## 12. Open Decisions for Coach

Each default below is **Suggested, not ruled.**

- **B2 / Q2 — What does a finished Observer keep?** **RULED 2026-10-11:** one membership, one level; tool access depends on whether a subscription is active, so a finished Observer gets the tools floor (IKI Labs only). See §3. IKI Labs formulation due Friday, October 16, 2026.
- **B3 / Q3 — Annual Navigator who stops paying?** **RULED 2026-10-11:** a lapsed annual Navigator does **not** keep full access. Someone who stops paying (cancels or doesn't renew) loses the subscription and drops to the same position as a finished Observer: membership only, IKI Labs only, no major tools. The membership flag never changes; the payment instrument is the variable. See §8.
- **B4 / Q4 — 2026-09-26 decisions.** **RULED 2026-10-11:** the 2026-09-26 decisions are restored: (1) early cancel gets no tools; (2) completion means day 42 elapsed plus the six-week course complete. A new fifth member state is added: **cancelled before completion**, with no membership and no subscription, so no IKI Labs, no tools, no Discord, no access at all. It is distinct from the finished Observer (membership persists, IKI Labs floor) and the lapsed annual Navigator (same as finished Observer). **Leftovers ruled 2026-10-11:** (a) early cancellers stay on the email list; (b) early cancellers get their own win-back email campaign, because they are warm leads who already paid. It is separate from the day-42 email and the completion journey, which go only to members who completed the six weeks. **Week-5 campaign ruled 2026-10-11:** the 9/26 week-5 campaign does not stay as it is. Once day 42 is over, the campaign is over. After day 42 the member either has IKI Labs access (finished the six weeks) or buys a new product; no further drip. **B4 fully ruled.** **Day-49 ruled 2026-10-11:** there is no day-49 event or designation for an Observer. After day 42, members who completed the six weeks move into a separate group on their own email journey, with touches not tied to any day count; that journey is its own design work. See §2.
- **B5 / Q5 — Where is this funnel built?** **RULED 2026-10-11 (Coach):** the funnel has nothing to do with WordPress. It is built on the owned stack (FastAPI + React + MySQL + nginx). Funnel v1.0 is the first piece of the cutover's Phase 1 on that stack, not a WordPress theme that gets built and thrown away. The only WordPress-side contact is integration with WooCommerce during the migration window. See §5.
- **B6 / Q6 — Billing moves off WooCommerce?** **OPEN, pending discussion (Coach, 2026-10-11):** Coach agrees with the suggested answer. Moving billing off WooCommerce reverses a locked Labs rule, so it needs a decision-log entry, and any move should build on the Stripe billing Labs already has. But billing off WooCommerce has not been discussed yet, so this is not settled. No billing work proceeds on this basis until it is resolved and logged.
- **B7 / Q7 — WP end state and legacy data flow.** **RULED 2026-10-11 (Coach):** WordPress will definitely go away, and all members will be migrated to the owned stack, matching the cutover's Phase 4 retirement. **Open work:** a back-end migration for anyone who never clicks the renewal prompt, plus moving legacy Lifetimes and PayPal subscribers without relying on the WooCommerce My Account dashboard. Not covered by the ruling: a hard calendar date for WP going dark, and the source of truth for a legacy sub's payment status during the window. (See cutover doc, Phase 4.)
- **Q8 / A2 — Missing Coach items.** *Suggested, not ruled:* monthly, quarterly, the $102 credit, the Tradier subsidy and the $3,000 Lifetime price are each listed in this spec or marked out of scope.

## 13. Review status (Review v1.0)

| Item | Status | Note |
|---|---|---|
| B1 Lifetime loses Discord | **RULED** | Discord follows membership (2026-10-11). §2, §3, D4 updated. Role ruled: Lifetime gets Navigator; Coach is reserved for legacy 0DTE.com members. |
| B2 One level vs IKI subset | **RULED** | One membership, one level, tool access set by whether a subscription is active (2026-10-11). §3, §12. |
| B3 Lapsed annual keeps full access | **RULED** | No: drops to membership only, IKI Labs only (2026-10-11). §8, §12. |
| B4 Seated 2026-09-26 states omitted | **RULED** | 9/26 early-cancel and completion rules restored; fifth state (cancelled before completion: no membership, no access) added (2026-10-11). Email list, win-back campaign and week-5 campaign (ends at day 42, no further drip) all ruled. Fully ruled. §2, §12. |
| B5 Where funnel is built | **RULED** | Owned stack, first piece of cutover Phase 1; nothing WordPress-related except WooCommerce integration during migration (2026-10-11). §5, §12. |
| B6 Billing pillar change, no DL entry | **OPEN (pending discussion)** | Coach agrees: needs DL entry, build on existing Labs Stripe billing; not yet discussed, unresolved (2026-10-11). §12. |
| B7 No cutover end state / data flow | **RULED** (open work noted) | WP retires, all members migrate; back-end migration for non-clickers, legacy Lifetimes, PayPal still to build (2026-10-11). Cutover doc. |
| A1 Reuse existing Stripe customer | OPEN | Cutover-side; confirm shared Stripe account. |
| A2 Coach ideas absent | OPEN | Q8 in §12. |
| A3 Map evidence to Stripe dispute fields; server-side hash | OPEN | Not implemented in §9–10. |
| A4 Fingerprinting / no-refunds legal check | OPEN | Not implemented. |
| A5 Edge router via nginx `auth_request` + `ft_session` | OPEN | Input to D2. |
| A6 Cache bypass for live member check | OPEN | Not implemented. |
| A7 SEO migration | OPEN | Cutover-side. |
| A8 Woo duties to replace | OPEN | Cutover-side. |
| A9 Naming and governance | **ADDRESSED** (partly) | Renamed; "Three products"; scope statement added; Ash/Ada identified. PWA-in-Phase-1 vs D5 "separate project" mismatch remains OPEN. |

---

*Companion: WP-Labs-Cutover-Design-v1.0.1.md*
