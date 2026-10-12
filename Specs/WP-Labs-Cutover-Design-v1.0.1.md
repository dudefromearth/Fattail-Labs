# WordPress → Labs Cutover Design Doc — v1.0.1

**Status:** Approved by Coach 2026-10-12 (DL-826)
**Date:** 2026-10-11
**Companion:** Observer-Navigator-Funnel-Spec-v1.0.1.md
**Supersedes for review:** `SPEC-v1.1-wp-to-labs-cutover.md` (original kept unchanged alongside this file).

**Scope statement.** Active program: Observer/Navigator acquisition funnel and WP→Labs cutover (documents only). Files touched: this file only (new). Touches outside program: NONE. No code, decision log, CLAUDE.md or INSTRUCTIONS.md changes. Content of the original draft is carried forward word for word except where listed below.

## Changes from the original draft

| # | Section | Change | Source |
|---|---|---|---|
| 1 | Title / filename | Renamed from "Spec v1.1 — WordPress → Labs Cutover Design Doc" (`SPEC-v1.1-wp-to-labs-cutover.md`); it is a companion to the funnel spec, not a revision of it | Review A9 |
| 2 | Header | Status set to "Draft v1.0.1 for review, not approved."; scope statement, this table and Review status added | Review A9 |
| 3 | §2 | New reason: the Discord bot only sees subscription changes through its limited WooCommerce interface | Coach ruling B1 |
| 4 | Phase 3 | Discord entitlement follows membership; Labs backend writes a subscription-shaped record per Lifetime member so the existing bot runs unchanged | Coach ruling B1 |
| 5 | Phase 4 | Discord bot rebuilt against the Labs backend, reading membership directly (aligned with DL-238) | Coach ruling B1 |
| 6 | §6 diagram | Note added below the diagram (diagram itself unchanged) | Coach ruling B1 |
| 7 | New §9–10 | Open decisions for Coach (B2–B7, questions 2–8, suggested defaults) and Review status | Review |

---

## 1. Executive Summary

The intent is **complete autonomy and complete control over the full lifecycle of both customers and non-customers**. Today that lifecycle is split across rented software — WordPress for content, WooCommerce for commerce, plugins for memberships and Discord — each with its own update cycle, failure modes, and vendor. This plan replaces all of it with one owned stack (FastAPI + React + MySQL + nginx, proven by Labs), so every decision about the member journey — from first visit to lifetime access — is ours to make.

## 2. Reasons for the New System

- **Vendor risk:** WP/Woo updates, plugin conflicts, and hosting changes are outside our control and have broken commerce before.
- **Performance:** Rented stacks carry plugin bloat. A single-purpose owned stack serves one funnel with nothing else loaded.
- **Data ownership:** Member, order, subscription, and progress data lives in one schema we control — enabling the dispute-evidence layer, usage analytics, and the PWA tracker without plugin gymnastics.
- **Speed of change:** Config-driven pricing, copy, and flows change without deploys through a vendor's release cycle.
- **Integration depth:** Discord entitlement, IKI Labs gating, and the in-app tracker share one backend instead of three bolted-together systems.
- **Entitlement model we define (v1.0.1, B1):** The current Discord bot only sees subscription changes through its limited WooCommerce interface, so it cannot follow membership — a Lifetime member (one-time product, no subscription) would lose Discord. Moving off WooCommerce/WordPress lets the new stack define exactly the entitlement model we want (Discord follows membership) instead of living with that integration's inadequacies.

> **Note (Coach, 2026-10-11): the workarounds are evidence, not architecture.** Everything being built to cope with WooCommerce/WordPress, including the subscription-shaped bridge record for Lifetime members, the membership-versus-subscription split that defines the IKI Labs floor, and the manual handling of Lifetime members during the migration, is evidence for this migration, not permanent design. The new stack makes membership the native model instead of something bolted onto a subscription system, so none of these contortions are needed after cutover.

## 3. Benefits

- One source of truth for member state across Discord, fattail.ai, labs.fattail.ai, and IKI Labs.
- Failed-payment and dispute flows built for our exact product, not adapted from generic plugin behavior.
- Analytics on which entry point converts, where checkout drops, and week-six conversion rate — without a third-party funnel tool.
- The PWA tracker and in-app tracker read the same tables with zero sync logic.
- No plugin license costs, no update windows, no surprise breakage.

## 4. Possibilities Unavailable on Rented Software

- **Per-member dispute packages** assembled automatically from usage + checkout evidence.
- **Speed-aware page delivery** tuned to our funnel's actual conversion paths.
- **A read-only PWA** that mirrors in-app progress with a service worker and offline cache.
- **A traffic split** that routes potential vs current customers at the edge with a live membership check.
- **A My Account migration surface** that moves members from WP billing to the new stack without double-billing.
- Deep customization of the entitlement model (membership as the constant, payment instrument as the variable) without fighting a plugin's assumptions.

## 5. Target Architecture

```
                    ┌─────────────────────────────┐
                    │     fattail.ai (edge)       │
                    │  live membership check      │
                    └───────┬─────────────┬───────┘
                            │             │
              potential     │             │   current
              customers     │             │   customers
                            ▼             ▼
                 ┌──────────────┐  ┌──────────────┐
                 │  NEW STACK   │  │  LEGACY WP   │
                 │ FastAPI      │  │ WordPress +  │
                 │ React        │  │ WooCommerce  │
                 │ MySQL        │  │ (shrinking   │
                 │ nginx        │  │  book only)  │
                 └──────┬───────┘  └──────┬───────┘
                        │                 │
                        ▼                 ▼
                 ┌────────────────────────────────┐
                 │     Labs backend (shared)      │
                 │  members · orders · subs ·     │
                 │  progress · evidence · Discord │
                 └────────────────────────────────┘
```

- **New stack** serves: content, sales pages, VSL, direct order form, checkout (Stripe), memberships, subscriptions, Discord entitlements, PWA tracker API, dispute-evidence layer.
- **Legacy WP** serves: only the existing subscription book during the parallel window. No new sales.
- **Shared Labs backend** is the single source of truth. WP reads from it during the window; the new stack writes to it.

## 6. Migration Timeline

```
  Phase 1          Phase 2           Phase 3              Phase 4
  CONTENT          TRAFFIC SPLIT     COMMERCE             RETIREMENT
  ─────────────    ─────────────     ─────────────        ─────────────
  Build content    Route potential    New stack takes      WP book shrinks
  layer: pages,    customers → new,   billing, member-     as subs lapse or
  lessons, 6-wk    current → legacy.  ships, Discord       convert. Last
  arc, sales copy, Edge router with   entitlement reads.   renewal under new
  PWA tracker.     live membership    My Account carries   stack → WP dark.
  No billing       check. New subs    migration prompt.    fattail.ai fully
  risk.            start day one.     Parallel run: each   owned.
                                      sub renews ≥1x
                                      under new stack
                                      before WP closes.
  ───► ───► ───► ───► ───► ───► ───► ───► ───► ───►
  low risk ──────────────► increasing criticality ──────► irreversible
```

> **v1.0.1 note (B1):** In Phase 3, "Discord entitlement reads" follow **membership**, bridged by a subscription-shaped record for Lifetime members; the Discord bot rebuild against the Labs backend lands in Phase 4. See the phase text below.

### Phase 1 — Content Layer (lowest risk)

- Entire content side: pages, lessons, six-week arc, sales copy, PWA tracker.
- Nothing touches billing. Proves the stack before anything critical depends on it.
- All new capabilities (PWA, dispute-evidence) built against Labs backend, not WP.
- **Prerequisite: Search Console + Analytics tool (v1.0.1, Coach ruling 2026-10-11).** Build a tool that plugs directly into Google Search Console and Google Analytics **before** the SEO audit runs, so the audit works from real ranking data instead of a manual list. Search Console supplies the actual ranking pages and their queries; Analytics shows which pages convert. Together they make the audit a live, queryable dataset. It follows the Labs pattern: sources fetch and normalize, derivation happens in pure modules, and the SEO audit is a read-only consumer of these two APIs.
- **SEO audit of every ranking page (v1.0.1, Coach ruling 2026-10-11).** The current site has pages and auto-generated blog posts that are heavily SEO-optimized and rank well. Audit every page that has rank, not just blog posts. For each one, decide: **keep static**; **replace with its equivalent at the same URL**, so the link and content don't change; or **enhance** it with metadata and other elements that make it more searchable and more discoverable by AI agents. URL stability is load-bearing: same-URL replacement, never redirecting. Output: a per-page list with the decision for each.
  - **HARD RULE (Coach, 2026-10-11): there will NEVER be a 301 redirect.** Redirects are off the table entirely for ranking pages. Every ranking page gets exactly one of keep static, replace with its equivalent at the same URL, or enhance. A lot of SEO work went into these pages. The goal is to keep that SEO and make it stronger, not just preserve it.
- *(v1.0.1, B5 ruled 2026-10-11)* The Observer/Navigator funnel (funnel spec v1.0.1) is the first piece of Phase 1, built on the owned stack. Nothing in it is WordPress-related; it integrates with WooCommerce only during the migration window.

### Phase 2 — Traffic Split

- Potential customers → new side. Current customers → legacy side.
- Edge router decides via **live membership lookup**, not cached role.
- New subscriptions flow through the new system from day one.
- Open decision D2: reverse proxy vs app-level middleware.

### Phase 3 — Commerce Migration

- New stack owns billing, memberships, Discord entitlement reads.
- **Discord follows membership (Coach ruling B1, 2026-10-11).** The existing Discord bot only sees subscription changes through its WooCommerce interface, so the Labs backend writes a **subscription-shaped record for each Lifetime member**. The existing bot keeps working unchanged during the migration window and Lifetime members keep Discord. This record is a bot-compatibility shim, not a real subscription (Lifetime stays a one-time product).
  - *Discord for members without an active subscription (Coach ruling 2026-10-11):* until the rebuild, Discord follows the subscription the bot can actually see, because WooCommerce's API restrictions mean the bot has no view into membership. A finished Observer or lapsed annual Navigator has no subscription, so the bot sees none and Discord is cut, matching "Observer ends, Discord closes." The subscription-shaped bridge record is the Lifetime exception: the Labs backend writes it so the existing bot keeps Lifetime members in. After the rebuild the bot reads membership directly from the Labs backend, removing the WooCommerce restriction.
- *Role (ruled 2026-10-11):* from here on, a Lifetime member receives the **Navigator** role on Discord. The **Coach** role is reserved for legacy members from the 0DTE.com website.
- Existing WP subs keep renewing on WP until each renews ≥1x under the new stack.
- My Account dashboard: renewal-migration prompt. Member clicks → new stack creates sub, WP one cancels at period end. No double-billing, no access gap.
- Dashboard reads both systems during the window so no member sees conflicting records.

### Phase 4 — Retirement

- **Discord bot rebuild (B1):** the bot is rebuilt against the Labs backend and reads membership directly, retiring the subscription-shaped Lifetime records. This aligns with DL-238 (Labs' date-aware membership derivation as the Discord role source, with a reconciliation sweep). Must land before WP/Woo goes dark, since the current bot depends on the Woo interface.
  - *Timing (Coach ruling 2026-10-11, replaces the earlier "no urgency, stays in Phase 4" note):* the subscription-shaped bridge record is a stopgap, not a destination. Rebuild the bot to read membership directly from the Labs backend as soon as possible, without letting the bridge hang around, so the WooCommerce API dependency is removed promptly. Lifetime members who join before the rebuild are still handled manually.
- WP book shrinks naturally. When the last sub renews under the new stack, WP goes dark.
- *(v1.0.1, B7 ruled 2026-10-11)* WordPress definitely goes away and every member is migrated. Renewal alone won't empty the WP book, so Phase 4 also needs a **back-end migration** for anyone who never clicks the renewal prompt, plus legacy Lifetimes and PayPal subscribers, moved without relying on the My Account dashboard. This is open work.
- fattail.ai serves entirely from the owned stack.
- **SEO-archive exception (v1.0.1, Coach ruling 2026-10-11):** WordPress retires as a commerce system, but its content archive may stay up for some time, as long as the SEO value of its ranking pages justifies the hosting cost. Which pages stay is set by the Phase 1 SEO audit.

## 7. Migration Principles

1. **Nothing critical flips until proven.** Content first, traffic, commerce, retirement.
2. **One source of truth.** Labs backend owns member state; WP is a read-mostly consumer during the window. *(Source of truth for legacy sub payment status during the window — open B7.)*
3. **No double-billing.** Migration prompt cancels the WP sub at period end; new sub starts clean.
4. **No access gaps.** Membership persists across every transition.
5. **Degrade, don't lie.** Unreachable sources show stale + footer, never false zeros.
6. **Irreversible steps last.** WP retirement only after the last renewal lands on the new stack.

## 8. Open Decisions

- **D2:** Edge router implementation (reverse proxy vs middleware) — load-bearing.
- Data migration mapping: WP tables → Labs schema (members, orders, subs, progress) — to be drafted.
- Cutover window length: long enough for every sub to renew once under the new stack.

## 9. Open Decisions for Coach

Each default below is **Suggested, not ruled.**

- **B2 / Q2 — What does a finished Observer keep?** **RULED 2026-10-11:** one membership, one level; the level's tool access depends on whether a subscription is currently active, so a finished Observer keeps membership with the tools floor (IKI Labs only, no major tools). Membership survives, the subscription ends, and that gap defines IKI Labs as the floor (the WooCommerce workaround; the Labs backend models it directly after cutover). IKI Labs still needs its offering formulated, due Friday, October 16, 2026. Full text in the funnel spec §3.
- **B3 / Q3 — Annual Navigator who stops paying?** **RULED 2026-10-11:** a lapsed annual Navigator does **not** keep full access. Someone who stops paying (cancels or doesn't renew) loses the subscription and drops to the same position as a finished Observer: membership only, IKI Labs only, no major tools. The membership flag never changes; the payment instrument is the variable. Full text in the funnel spec §8.
- **B4 / Q4 — 2026-09-26 decisions.** **RULED 2026-10-11:** the 2026-09-26 decisions are restored: (1) early cancel gets no tools; (2) completion means day 42 elapsed plus the six-week course complete. A new fifth member state is added: **cancelled before completion**, with no membership and no subscription, so no IKI Labs, no tools, no Discord, no access at all. It is distinct from the finished Observer (membership persists, IKI Labs floor) and the lapsed annual Navigator (same as finished Observer). **Leftovers ruled 2026-10-11:** (a) early cancellers stay on the email list; (b) early cancellers get their own win-back email campaign, because they are warm leads who already paid. It is separate from the day-42 email and the completion journey, which go only to members who completed the six weeks. **Week-5 campaign ruled 2026-10-11:** the 9/26 week-5 campaign does not stay as it is. Once day 42 is over, the campaign is over. After day 42 the member either has IKI Labs access (finished the six weeks) or buys a new product; no further drip. **B4 fully ruled.** **Day-49 ruled 2026-10-11:** there is no day-49 event or designation for an Observer. After day 42, members who completed the six weeks move into a separate group on their own email journey, with touches not tied to any day count; that journey is its own design work. The data migration must carry all five states. Full text in the funnel spec §2.
- **B5 / Q5 — Where is the funnel built?** **RULED 2026-10-11 (Coach):** the funnel has nothing to do with WordPress. It is built on the owned stack (FastAPI + React + MySQL + nginx). Funnel v1.0 is the first piece of the cutover's Phase 1 on that stack, not a WordPress theme that gets built and thrown away. The only WordPress-side contact is integration with WooCommerce during the migration window.
- **B6 / Q6 — Billing moves off WooCommerce (pillar change, INSTRUCTIONS §3).** **OPEN, pending discussion (Coach, 2026-10-11):** Coach agrees with the suggested answer. Moving billing off WooCommerce reverses a locked Labs rule, so it needs a decision-log entry, and any move should build on the Stripe billing Labs already has. But billing off WooCommerce has not been discussed yet, so this is not settled. No billing work proceeds on this basis until it is resolved and logged.
- **B7 / Q7 — End state and data flow.** **RULED 2026-10-11 (Coach):** WordPress will definitely go away, and all members will be migrated to the owned stack, matching the cutover's Phase 4 retirement. **Open work:** a back-end migration for anyone who never clicks the renewal prompt, plus moving legacy Lifetimes and PayPal subscribers without relying on the WooCommerce My Account dashboard. Not covered by the ruling: a hard calendar date for WP going dark, and the source of truth for a legacy sub's payment status during the window. The source of truth for a legacy sub's payment status during the window also needs stating (review notes legacy Woo is the system still charging cards).
- **Q8 / A2 — Missing Coach items.** *Suggested, not ruled:* monthly, quarterly, the $102 credit, the Tradier subsidy and the $3,000 Lifetime price are listed or marked out of scope.

## 10. Review status (Review v1.0)

| Item | Status | Note |
|---|---|---|
| B1 Lifetime loses Discord | **RULED** | Discord follows membership (2026-10-11). §2, Phase 3, Phase 4 updated. Role ruled: Lifetime gets Navigator; Coach is reserved for legacy 0DTE.com members. |
| B2 One level vs IKI subset | **RULED** | One membership, one level, tool access set by whether a subscription is active (2026-10-11). Funnel §3; §9. |
| B3 Lapsed annual keeps full access | **RULED** | No: drops to membership only, IKI Labs only (2026-10-11). Funnel §8; §9. |
| B4 Seated 2026-09-26 states omitted | **RULED** | 9/26 rules restored; fifth state added (2026-10-11). All sub-points ruled; week-5 campaign ends at day 42. Fully ruled. Funnel §2; §9. |
| B5 Where funnel is built | **RULED** | Owned stack, first piece of Phase 1; WooCommerce integration only during migration (2026-10-11). Phase 1, §9. |
| B6 Billing pillar change, no DL entry | **OPEN (pending discussion)** | Coach agrees: needs DL entry, build on existing Labs Stripe billing; not yet discussed, unresolved (2026-10-11). §9. |
| B7 No end state / inverted data flow | **RULED** (open work noted) | WP retires, all members migrate; back-end migration still to build; WP end date and legacy payment source of truth not yet stated (2026-10-11). Phase 4, §9. |
| A1 Reuse existing Stripe customer (`billing_cycle_anchor` / `trial_end`) | OPEN | Confirm shared Stripe account first. |
| A2 Coach ideas absent | OPEN | Q8 in §9. |
| A3 Evidence mapped to Stripe dispute fields | OPEN | Funnel-side. |
| A4 Fingerprinting / no-refunds legal check | OPEN | Funnel-side. |
| A5 Edge router via nginx `auth_request` + `ft_session` | OPEN | Input to D2. |
| A6 Cache bypass for live member check | OPEN | Not implemented. |
| A7 SEO migration (URL inventory, 301 map, sitemap) | OPEN | Not in Phase 4 yet. |
| A8 Woo duties to replace (tax, receipts, email, AC/n8n, WooCord triggers) | OPEN | Not on Phase 3 checklist yet. |
| A9 Naming and governance | **ADDRESSED** (partly) | Renamed; scope statement added; Ash/Ada are FatTail bot seats (Design, Money). PWA tracker in Phase 1 vs funnel D5 "separate project" remains OPEN. |

---

*End of WP-Labs Cutover Design v1.0.1.*
