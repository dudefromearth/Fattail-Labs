# WP → Owned Stack: Action Plan (DRAFT)

**Status:** Draft for Coach. Not approved. Built from Funnel Spec v1.0.1 + Cutover Design v1.0.1 (uncommitted, 2026-10-11 rulings) and a read-only survey of `FatTail-Labs` (branch `runner-data-plane`). Date: Mon Oct 12, 2026.
**Guiding light:** better Observer experience, more Observer conversions. Most reasonable, safest, quickest path.

## 1. Strategy

**Front door first (Coach ruling, Oct 12).** The funnel's mobile product page and checkout (Funnel Spec v1.0.1 §5–9) is our front door into our ecosystem, and it's the first build. WooCommerce keeps taking payment until B6 is ruled and logged. Order: the mobile direct order form (warm traffic from Conor's emails lands here), then the sales and video pages, then a staging run, then a 10% traffic split. The Search Console/Analytics tool and the SEO audit run alongside, not ahead. The front door uses new URLs and doesn't touch ranking pages, so SEO doesn't block it. Discord rebuild and commerce come after. Every step is reversible until the commerce flip. MiniTwo (production) is untouched until each gate passes. No 301s, ever.

**Build venue needs Coach's choice:** StudioTwo is on hold for builds. Options: a cloud agent working on the repo, or Conor builds.

## 1a. Already done (build on this, don't redo it)

- **Conor's Observer email journey (v1.0):** 15 emails live in ActiveCampaign automation 43. A mu-plugin guards the finisher coupon (OBSERVER1098) so only finishers can use it. Gate 1 (the commitment form) is live. Gates 2–4 are not wired yet.
- **New price cards are deployed** on fattail.ai/pricing. A toggle above the cards switches views:
  - Observer $17/wk ("Six weeks ($102 total)") → Woo `observer` (id 1718)
  - Navigator Annual $1,997 (id 7864) and Navigator Lifetime $3,000 (id 9816), via the toggle
  - Navigator $267/mo (id 1800) is also shown
  - Activator $97/mo (id 1799) is optional and currently hidden from display
  - Navigator Quarterly $597 (id 12234) exists in Woo as an optional idea
  - labs.fattail.ai/membership has an FAQ only, with no cards.
- **Floated ideas, kept as switchable options:** Activator, Quarterly, $165 first-month intro.

## 2. Schedule

Owners: **Coach** (decisions, copy, voice), **Conor** (CTO, build/deploy), **Lakesia** (customers, comms, legacy cases), **bots** (Ash design, Ada money, build/review seats).

| Week | Action | Owner | Depends on | Done when |
|---|---|---|---|---|
| **W1 Oct 12–16** | Formulate IKI Labs floor: what a finished Observer / lapsed annual actually lands on | Coach + Ash | — | One-page IKI Labs offer written, **by Fri Oct 16** |
| W1 | **Choose build venue** (cloud agent on the repo, or Conor); StudioTwo is on hold | Coach | — | Venue named |
| W1 | Rule B6 direction in principle (or set the discussion date) | Coach + Conor + Ada | §3 brief | DL entry drafted, ruled or dated |
| W1 | Approve both v1.0.1 specs; fix the internal contradictions listed in §6 | Coach | — | Specs committed by Coach's say-so |
| W1 | Baseline from existing data: Observer starts, week-by-week drop-off, day-42 completions, Navigator take rate | Conor (progress admin) | none | Numbers in a table, unknowns marked |
| W1–W2 | **Align day-37 and day-42 emails** to the IKI Labs floor plus only the options switched on (replace "Navigator or nothing", drop the word "trial") | Coach + Conor | IKI Labs formulation (Fri Oct 16), pricing config | New copy in automation 43, Coach-approved |
| **W2 Oct 19–23 · FRONT DOOR** | **Mobile direct order form** (warm traffic from Conor's emails lands here); **WooCommerce still takes payment** | Build venue + Ash | specs approved, venue chosen | Order form works on a phone end-to-end into Woo, on dev |
| W2 · FRONT DOOR | **Config layer with switchable options**: core lineup is Observer, then Navigator Annual or Lifetime. Activator, Quarterly and the Monthly intro switch on or off in config with no code change. Cards and emails show only what's switched on | Coach decides what is on; build venue | — | Flipping an option changes the form/cards with no deploy |
| W2 · FRONT DOOR | **Live member check** + member-state model (5 states) on Labs backend | Build venue | specs approved | Right offer per state, tested on fixtures for all 5 |
| W2 | **Wire Gates 2–4** from Labs (`server/labs_observer_journey.py`) to ActiveCampaign (field/tag updates) | Conor | Gate 1 live (done) | Test Observer moves through Gates 2–4 in AC on dev |
| W2 | **Build early-cancel win-back campaign** (state 5) + completion-journey outline | Coach + Lakesia | B4 (ruled) | Copy drafted in ActiveCampaign, not sent |
| W2 (alongside) | Build GSC + GA tool (read-only) | bot | Google read access granted by Coach | Ranking pages + queries + converting pages queryable |
| **W3 Oct 26–30 · FRONT DOOR** | **Sales page + video page**; three entry points with referrer routing | Build venue + Ash | W2 front door, Coach copy | All three entries route correctly on dev |
| W3 · FRONT DOOR | **Speed-aware delivery** + two-bar checkout; failed-payment handling | Build venue | W2 order form | Slow-phone test passes; failed card gets a clear retry path |
| W3 · FRONT DOOR | **Evidence capture at page load and terms acceptance** (privacy + legal check first, A4) | Build venue + Lakesia | legal OK | Evidence package builds for a test order |
| W3 (alongside) | SEO audit: keep-static / replace-same-URL / enhance for every ranking page | bot, Coach signs | GSC/GA tool | Per-page list, Coach-approved; zero redirects |
| W3 | Discord bot rebuild start: read membership from Labs (DL-238 date-aware reconcile) | Conor | member-state model | Dry-run on dev: role diff vs today, no writes |
| W3 | Observer program experience on Labs: six-week arc, weekly progress, day-42 completion check | Conor + Ash | state model | Observers on dev see their week + what's next |
| **W4 Nov 2–6 · FRONT DOOR** | **Staging run** of the whole front door; **checkout still goes to Woo** | Build venue + Coach | W2–W3 front door | Coach walks it on a phone and signs off |
| W4 · FRONT DOOR | **Analytics on checkout drop-off** (which step people leave) | Build venue | GA tool | Drop-off by step visible for staging traffic |
| W4 | Discord bot cutover to Labs membership; retire Lifetime bridge records | Conor + Lakesia | dry-run clean for 1 week | Bot reads Labs; zero wrong revokes in reconcile log |
| **W5 Nov 9–13 · FRONT DOOR** | **10% traffic split**: new visitors → front door, members → existing. Widen on metrics | Conor | D2 edge router ruled, staging sign-off | Split live; rollback = one nginx config revert |
| **W6+ (gate)** | Phase 3 commerce: only after B6 ruled + DL entry. New Observers on Labs Stripe; renewal-migration prompt | Conor + Ada | **B6**, A1 shared Stripe account | One test-mode checkout end-to-end; then live small |
| Then | Phase 4: back-end migration for non-clickers, legacy Lifetimes, PayPal; WP commerce dark; SEO archive stays while it pays | Conor + Lakesia | WP end date, payment source of truth | Last legacy sub on new stack |

Realism note: W2–W5 assume Conor has most of his time on this. If not, stretch, don't skip gates.

## 3. Decisions Coach must make

| Decision | Needed by | Why it blocks |
|---|---|---|
| **IKI Labs formulation** | **Fri Oct 16** | Finished Observers need a real landing; drives completion journey copy |
| **B6 billing off Woo** (+ DL entry reversing OD-F6 "Woo is the platform-wide commerce entry point" and CLAUDE.md "Woo only") | Discussion by ~Oct 23; ruling before W6 | Nothing commerce moves without it. Funnel can ship without it (checkout → Woo) |
| D2 edge router (nginx `auth_request` vs app middleware) | ~Oct 30 | Traffic split in W5 |
| Google Search Console / Analytics read access | Oct 19 | GSC/GA tool, SEO audit |
| Legacy payment source of truth during window (Woo is still charging) | Before Phase 3 | Avoids double-billing / conflicting records |
| WP commerce end date | Before Phase 4 starts | Sets migration deadline for non-clickers |
| Free Observers: the repo counts 521 "free Observers"; spec says Observer is paid only. What happens to them? | Before state model ships (W2) | Five-state model has no "free Observer" |
| $102 six-week option (in DL) vs $17/week only (spec) | W2 | Config + checkout |
| PWA tracker: Phase 1 or separate project (A9/D5) | W3 | Scope |

## 4. Risks and safety rails

- **Billing:** no billing change before B6 + DL entry. Woo keeps charging; funnel checkout links to Woo until then.
- **Production:** MiniTwo untouched until each gate passes on dev/staging. Every deploy has a named rollback.
- **Traffic split:** start small, widen on metrics; one config revert sends all traffic back.
- **SEO:** hard rule, never a 301. Same-URL replacement only; audit list approved before any ranking page changes.
- **Read-only consumers:** GSC/GA tool, progress, evidence layer read only. Woo key stays read-scope (DL already says Labs never writes to commerce).
- **Discord:** dry-run reconcile and diff before the bot writes roles; wrong revoke of a paying member is the worst failure. Lifetimes handled by hand until rebuild.
- **Data:** degrade, don't lie. Unreachable source shows stale + footer, never zeros.
- **Legal:** fingerprinting/no-refund language checked before evidence capture ships.

## 5. Measuring Observer experience and conversion

No baselines invented. Unknown = to be pulled in W1.

| Step | Metric | Source | Baseline |
|---|---|---|---|
| Funnel pages | Visit → checkout start → paid Observer, per entry point | GA (new tool) + Woo orders | Unknown |
| Search | Ranking pages, clicks, positions held/improved after audit | GSC | Unknown until tool |
| Program | Weekly active Observers, lessons done per week, week-by-week drop | `lesson_progress`, `enrollments`, progress admin | Partly in progress admin |
| Completion | % reaching day 42 + course complete | Labs progress + Woo | Unknown |
| Conversion | Completed Observer → Navigator Annual/Lifetime | Woo now, Stripe later | Unknown |
| Win-back | Early canceller → repurchase | ActiveCampaign + orders | New, zero history |
| Checkout speed | Completion on slow connections | Funnel speed buckets | New |
| Discord | Wrong grants/revokes per reconcile run | Labs reconcile log | New |

## 6. Reuse vs new

**Reuse (exists in repo):**
- Stripe billing: `server/routes/billing.py`, `server/link_stripe_price.py`, spec `Specs/FatTail-Labs-Native-Billing-Stripe-Spec-v1.0.md` (checkout, portal, webhook, status map). Live wiring on MiniTwo was never finished, and DL OD-F6 marks it "superseded unless Coach revives."
- Identity/memberships/roles: `server/identity.py`, `server/providers.py` (Woo + WP SSO as pluggable providers, `provider_plan_map`), `server/auth.py`, `server/access_control/`, `server/guards.py`.
- Progress + Woo read source: `server/progress/` (`sources_woo.py`, `sources_ac.py`, `sources_youtube.py`, `rules.py`, `metrics.py`), `web/app/admin/progress/` — already the sources/pure-module pattern.
- Courses/enrollments: `server/routes/courses.py`, `migrations/001_initial.sql`, `server/course_model.py`.
- Discord: `server/labs_discord/` (REST + message mirror bridge bot), DL-237–240 (date-aware role reconcile, DL-238).
- Pricing page: `web/app/membership/`, `web/components/MembershipPlans.tsx`.
- ActiveCampaign: `server/activecampaign.py`.

**New:** GSC/GA tool; five-state member model incl. "cancelled before completion"; funnel pages + config; speed-aware delivery; edge router; dispute-evidence capture + assembler; Discord role executor reading Labs membership; renewal-migration prompt; back-end legacy migration (non-clickers, Lifetimes, PayPal).

**Repo vs spec conflicts to resolve:**
1. **DL OD-F6** (Aug 2026) rules WooCommerce the platform-wide commerce entry point; Native Stripe "superseded unless Coach revives." **CLAUDE.md**: "WooCommerce… ONLY entry point… The app never touches payments." This is the locked rule B6 reverses.
2. Front end is **Next.js 16** (`web/`, React 19), not plain React. Specs say "React"; fine, but say Next.js.
3. Repo counts **free Observers** (521); spec says Observer is paid only. DL also records "$17/wk **or $102**".
4. DL-240 locks the **WP Discord connector on fattail.ai** as the primary connect path. Rebuild must reverse or replace that with a DL entry.
5. `INSTRUCTIONS.md` (cited by cutover §9 for B6 "pillar change, INSTRUCTIONS §3") is **not in the repo**; DL says so too.
6. Inside the specs: funnel §2 still says "the Discord plugin reads membership status" and §3 headline says "Discord gate: membership," vs the later ruling "Discord follows the subscription the bot sees" until rebuild; cutover Phase 4 still holds the bot rebuild (ruling says ASAP); cutover A7 still says "301 map"; funnel D3 still offers "PHP array" config.
