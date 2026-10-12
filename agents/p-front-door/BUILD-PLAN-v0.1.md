# Front Door: Mobile Product Page + Checkout — Execution Plan v0.1 (DRAFT, Juliet)

**Project board (proposed):** `agents/p-front-door/`, with `seeds/` and `gate-reports/`. Nothing has been created in the repo yet. This file lives on the box only.
**Tracks:** GitHub issue #13 "Mobile checkout" (dudefromearth/Fattail-Labs).
**Law:**
- `Specs/Observer-Navigator-Funnel-Spec-v1.0.1.md` §5–9
- `Specs/WP-Labs-Cutover-Design-v1.0.1.md`, Phase 1–2

Both specs were **Coach-approved Oct 12, 2026, 6:43 PM ET**. Lima's DL entry is being written separately.
**Sequence (Coach):** spec ✅ → **build plan (this)** → review (India, Echo + Tango, Mike, Sierra, Foxtrot) → GO token → build.
**Status:** No product code. No repo writes. Waiting on review, then **FD-W0** (GO).
**Guiding light (Coach):** a better experience for the Observer and more conversions, by the most reasonable, safest and quickest route.

---

## 0. Preconditions (must hold before FD-W0 GO)

| # | Precondition | Owner | State |
|---|---|---|---|
| P1 | Lima writes the DL entry recording Coach's approval of both v1.0.1 specs (B4, B5, B7 rulings; B6 OPEN) | Lima | In progress (separate) |
| P2 | **RL-1:** Coach's requirements become REQ rows in `agents/bench/requirements-ledger.md`, with wording preserved. Proposed rows: "front door = mobile product page + checkout, first build"; "front door into our ecosystem"; "improve the observer experience and increase conversions"; "NEVER a 301"; "core lineup Observer → Navigator Annual/Lifetime; Activator, Quarterly and $165 intro switchable in config, no code change"; "nothing lost from the original checkout detail" | Lima (Juliet supplies wording) | Not started |
| P3 | **B6 stays OPEN.** WooCommerce keeps taking payment. The front door hands off to Woo checkout. Native Stripe (`billing.py`) is not switched on. | Coach | OPEN, by design |
| P4 | **OD-F6 / DL-240 scope.** OD-F6 ("Woo is the platform-wide commerce entry point") still stands, and this plan stays inside it: the front door is presentation and routing, and Woo still sells. Reversing OD-F6 is a B6 matter, outside this plan. DL-240 (Discord connect through the WP plugin) is out of scope and untouched. | India checks | Holds |
| P5 | **Invariant 7 / doctrine §15 (no drift; DL-539).** This plan builds new trees only: new routes, new components, a new config module. Any edit to existing work needs three successive Coach OKs recorded on the GO token before the first edit. Existing work here includes `server/routes/billing.py`, `server/progress/*`, `web/app/membership/page.tsx`, `components/MembershipPlans`, the Woo price-cards plugin, and nginx prod config. Candidates already identified are listed in §6. | Juliet / India / Delta | Required |
| P6 | **Build venue** chosen (StudioTwo is on hold for builds). See §5. | Coach | OPEN |
| P7 | The IKI Labs floor one-pager (due Fri Oct 16). The "already covered" and finisher copy depends on it. | Coach + Ash | Due Fri |
| P8 | Baselines pulled read-only (see §1). | Alpha (read-only query) / Conor | TBD |

---

## 1. Goal and success metrics

**Goal:** a phone visitor gets from a price card, video, or email link to a completed Observer (or Navigator) purchase. The flow should be quiet, premium, one-handed, and working on two bars. Existing members are never shown a buy button they don't need.

All baselines are **TBD**. Nothing below is invented; each one gets measured in FD-W0.

| Metric | Baseline | Target |
|---|---|---|
| Mobile visitor → checkout started | TBD | Coach sets after baseline |
| Checkout started → paid (mobile) | TBD | Coach sets |
| Mobile vs desktop conversion gap | TBD | Gap narrows |
| Time to interactive on order form, slow 3G | TBD | Coach sets (spec goal: completes on two bars) |
| Members shown a buy button they don't need | TBD | 0 |
| Failed-payment recoveries (Ada's book) | TBD | Up |
| Disputes lost for lack of evidence | TBD | 0 |

---

## 2. Scope / non-scope

**In scope (spec §5–9):**
- A mobile-first React/Next.js front door on **new URLs** with phone, tablet and desktop breakpoints.
- A config layer with prices and products in one place. Optional products switch on or off with no code change.
- A live member check through the Labs FastAPI covering all 5 states. During migration it reads Woo for payment state.
- Three entry points (sales page, video/VSL page, direct order form) with referrer routing and no dead ends.
- Speed-aware delivery (fast/medium/slow buckets) and a bare checkout on the slow path.
- Failed-payment UX: the soft nudge and card-update path. Woo/Stripe retries stay where they are today.
- Dispute evidence capture at page load, terms acceptance and payment confirmation, behind a privacy check.

**Out of scope:**
- Moving billing off Woo (B6).
- Any 301 redirect, ever.
- Changing ranking pages.
- Discord rebuild (DL-240/238).
- Commerce migration (cutover Phase 3) and WP retirement.
- The Observer email journey (Conor's, live in AC automation 43). The front door only gives it a landing page.
- Strategy Lab.
- Native app.

---

## 3. Issue #13 versus the spec (needs Coach's call)

Issue #13 assumes **"responsive web checkout on the existing WooCommerce flow."** The approved spec puts the front door on the **owned stack**. These don't conflict if we split the work:

- **Track A, quick Woo fixes now (FD-A).** Fix what the read-only mobile audit finds on today's live path (price cards → product → cart → Woo checkout), using CSS and settings only. This helps today's buyers within days.
  - It touches existing work (the Woo theme/plugin on WordPress), so it needs Coach's three OKs under P5.
  - It runs on WordPress, not the Labs repo. That means Conor or a WP-admin session, never MiniTwo.
- **Track B, the new front door (FD-W1…W4).** This is the spec build. Issue #13's acceptance criteria apply to both tracks.

**Recommendation:** do Track A as a small, capped fix list only. Example: anything blocking tap/scroll/payment on iOS Safari or Android Chrome. Then put all real effort into Track B. Issue #13 closes when Track B passes FD-G4.

**Audit status:** `/workspace/mobile-checkout/audit-report.md` is **not written yet**. Screenshots exist for pricing, product, cart and checkout on iPhone 14 and Pixel 7 (`/workspace/mobile-checkout/audit/`). They're unreviewed here, and the FD-A fix list waits on the report.

---

## 4. Phases, packets, seeds, gates

Each packet below becomes one seed in `agents/p-front-door/seeds/`. A seed states the project, callsign, task sequence, files in scope, out-of-scope items, the invariants that apply, verifiable completion criteria, and the gate it feeds. No packet spans two domains. Delta gates every phase with PASS / FAIL / BLOCKED. No waived gates.

**Invariants on every seed:**
- No 301s.
- No edits to existing work without three OKs (§15).
- No MiniTwo changes.
- No `.env` or secrets in seeds.
- No member PII in fixtures.
- Woo still takes payment.
- Prices are read from config, never hard-coded.
- Tango and Hotel copy-honesty rules apply: no win-rate or profit claims, and no "trial".

### FD-W0 — Plan acceptance and GO (week of Oct 12, by Fri Oct 16)

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W0-1 | Juliet | `ORCHESTRATOR.md` board + seeds for W1–W4 | Every packet has agent, seed, deps, gate (Juliet checklist) |
| W0-2 | India | Plan review against specs + DL (OD-F6 holds, B6 open, no frozen trees) | APPROVED / RETURNED + flagged ideas |
| W0-3 | Echo + Tango | Design/experience review of plan + wireframe intent | APPROVED / RETURNED |
| W0-4 | Mike, Sierra, Foxtrot | Domain reviews: checkout security / SEO (new URLs, canonical, no 301, no ranking-page change) / edge + env | Each APPROVED / RETURNED |
| W0-5 | Lima | REQ rows (P2); DL entry for venue + D2 choice once ruled | Rows exist, wording verbatim |
| W0-6 | Alpha (read-only) | Baseline table from progress/Woo aggregates, unknowns marked TBD | Table filed; no PII |
| W0-7 | Coach | GO token `agents/go/FD-W0.md` (venue, D2, any three-OK records) | Stamped |

**FD-G0 (Delta):** reviews returned APPROVED, REQ rows present, GO token stamped.

### FD-W1 — Foundation and direct order form (week of Oct 19)

| Packet | Owner | Deliverable | Acceptance (spec / #13) | Deps | Risk → rollback |
|---|---|---|---|---|---|
| W1-1 | Alpha | **New** offer-config module + read API: core lineup Observer → Navigator Annual (Woo 7864) / Lifetime (9816); switchable Activator (1799), Quarterly (12234), Monthly (1800), $165 intro; flags flip without deploy | §5 config; Coach rule on switchable options | G0 | Wrong price shown → config revert; Woo price is final authority at checkout |
| W1-2 | Alpha | **New** member-state endpoint, live (no cached role), 5 states, reads Woo payment state during migration | §5 member detection; §2 five states | G0 | Woo read failure → fail open to "sign in to check" (never a wrong buy button) |
| W1-3 | Mike | Auth/session review of W1-2; Woo handoff security (signed cart/add-to-cart link, no price params trusted from client) | §5; #13 payment step | W1-2 | Tampered handoff → Woo recomputes price; disable link builder |
| W1-4 | Charlie | **Direct order form** on a new URL (warm traffic from Conor's emails), state-aware views ("already covered", upgrade, nothing to buy), hands off to Woo checkout | §6.3; #13 no clipped fields, one-handed | W1-1, W1-2 | Off by feature flag; old links untouched |
| W1-5 | Echo | HIG/mobile pass on W1-4: tap targets, thumb zone, type scale, #00B478 one-hue, same system as Labs tokens | #13 large tap targets; brand | W1-4 | RETURN to Charlie |
| W1-6 | Tango | Member-experience + copy honesty pass (no "trial", no win-rate, only switched-on options shown) | Tango charter | W1-4 | RETURN |
| W1-7 | Kilo | Tests: state fixtures ×5 (synthetic, no PII), config flag flips, handoff link integrity; real-phone walk iOS Safari + Android Chrome | #13 completes on iOS/Android | W1-4 | — |

**FD-G1 (Delta):**
- The order form reaches a Woo checkout on dev from both real phones.
- All 5 states render correctly.
- Flipping an option changes the form with no deploy.
- Evidence (screenshots/video) is filed in `gate-reports/`.

### FD-W2 — Sales page, video page, routing, speed, failed payments, evidence (week of Oct 26)

| Packet | Owner | Deliverable | Acceptance | Deps | Risk → rollback |
|---|---|---|---|---|---|
| W2-1 | Charlie | Sales page + VSL page (new URLs), cross-links, no dead ends | §6.1–6.2 | G1, Coach copy | Flag off |
| W2-2 | Foxtrot | Referrer routing at the edge per D2 (nginx `auth_request` vs app middleware); dev/staging env only | §6 routing; cutover D2 | D2 ruled | Route config revert; no prod nginx touch without three OKs |
| W2-3 | Charlie | Speed-aware delivery: Network Information API + latency probe fallback (Safari); slow bucket = bare checkout | §7; two-bar goal | W1-4 | Default to "slow" bucket if probe fails |
| W2-4 | Alpha | Failed-payment state surfaced to front door (read from Woo/Stripe status) + card-update path into Woo My Account | §8; #13 error states clear | W1-2 | Read-only; hide nudge on error |
| W2-5 | Mike | Evidence capture design: page load / terms acceptance / payment confirmation, keyed to order ID, ≥2-yr retention; **privacy notice + legal check first** | §9; cutover A4 | Privacy/legal OK (Coach/Lakesia) | Capture off by flag; no fingerprint until notice live |
| W2-6 | Alpha | Evidence storage (new tables via migration) | §9–10 | W2-5 | Migration down-script |
| W2-7 | Sierra | New-URL SEO: canonical, meta, FAQ/JSON-LD consistent with offer config; confirm zero ranking pages touched, zero 301s | Cutover hard rule | W2-1 | Noindex until FD-G4 |
| W2-8 | Echo + Tango | Pass on W2-1/W2-3 views | — | W2-1 | RETURN |
| W2-9 | Kilo | Slow-3G throttled runs, routing matrix (search/social/email/direct → right page), failed-card path with Stripe test cards on Woo staging | §7, §8; #13 | W2-* | — |

**FD-G2 (Delta):**
- The routing matrix passes.
- Slow 3G checkout completes.
- The failed-card path is clear on the phone.
- An evidence package is built for a test order.
- The privacy notice is in place.

### FD-W3 — Staging and Coach phone sign-off (week of Nov 2)

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W3-1 | Foxtrot | Full front door on staging (not MiniTwo) | Reachable, env verified |
| W3-2 | Kilo | Real-device end-to-end apply → payment → confirmation on iOS Safari + Android Chrome, plus slow 3G; recorded | #13 "end-to-end test recorded" |
| W3-3 | Hotel / Tango | Final copy truth sweep | No trading/member-trust lies |
| W3-4 | Coach | Signs off on his own phone | Written OK |
| W3-5 | Lima | DL + docs same day | Logged |

**FD-G3 (Delta):** every #13 acceptance box is checked with evidence. Coach has signed off.

### FD-W4 — 10% traffic split (week of Nov 9)

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W4-1 | Foxtrot | 10% of new visitors to the front door (cutover Phase 2), kill switch | Split live; switch tested |
| W4-2 | Kilo / Alpha | Watch conversion vs control (metrics in §1), errors, Woo handoff success | Daily read |
| W4-3 | Coach | Go / hold / roll back; widen % later | Decision logged by Lima |

**FD-G4 (Delta):**
- The split runs clean.
- There are no wrong-state buy buttons.
- Issue #13 is ready to close.

**Rollback at every stage:**
- Turn the feature flag off, or set the split to 0%. Old URLs and Woo checkout were never changed.
- No redirects to undo.

**Track A (FD-A, in parallel, small):**
1. Reviewer writes the audit report.
2. Coach gives three OKs for the WP/Woo touch.
3. Conor or the chosen venue makes CSS/settings fixes on a staging copy.
4. Kilo walks it on real phones.
5. Delta gates it.
6. It ships.

Rollback is reverting the CSS.

---

## 5. Build venue (Coach decision)

| Option | For | Against |
|---|---|---|
| Cloud coding agent on the repo, playing bench seats per seed, opening draft PRs | Conor stays on the Observer journey; seeds are already pasteable; no StudioTwo load | Needs repo/CI access; deploy to staging still needs Foxtrot/Conor; no prod access by design |
| Conor builds | Knows Woo + stack; can do Track A on WP too | Pulls him off the journey + gates 2–4 |
| StudioTwo | — | **On hold for builds**; not an option until Coach lifts it |

Juliet's lean: a cloud agent for Track B, and Conor for the small Track A WP fixes.

---

## 6. Existing work this plan may need to touch (each needs three successive Coach OKs)

1. **`server/routes/billing.py`.** Reuse `_woo_billing_url` and the plan listing. Preferred route: call them read-only from a new module, with no edit.
2. **`server/progress/sources_woo.py`.** Reuse the Woo reads for the member check, the same way: import, don't edit.
3. **`web/app/membership/page.tsx`.** The FAQ says finishers "keep access to every course for a full year". That conflicts with the B3/B4 rulings. It needs a copy fix, which counts as touching existing work. Flag it to Coach; it's not in this plan's packets.
4. **The Woo price-cards plugin and theme (Track A).**
5. **Prod nginx.** This only comes up at W4.

Note: `server/labs_observer_journey.py` (named in the brief) **is not in the repo** on StudioTwo, so the gates 2–4 wiring has no code to reuse yet.

---

## 7. Test plan

- **Devices:** a real iPhone on iOS Safari and a real Android phone on Chrome. Emulation alone doesn't pass a gate.
- **Network:** fast, plus slow 3G throttled. A two-bar field test is preferred.
- **Matrix:**
  - 3 entry points × 5 member states × 2 devices × 2 network buckets;
  - config flag flips;
  - Woo handoff;
  - a failed test card through to the nudge;
  - evidence package built for a test order.
- **Checks:** no horizontal scroll, no clipped fields, no desktop-only interactions; error and success states readable.
- **Evidence:** screenshots and video in `gate-reports/`.
- **Data:** synthetic accounts only, no member PII.

---

## 8. Schedule

| Week | Phase | Gate |
|---|---|---|
| Oct 12–16 | FD-W0: reviews, REQ rows, baselines, venue, D2, IKI floor (Fri) | FD-G0 |
| Oct 19–23 | FD-W1: config, member check, direct order form | FD-G1 |
| Oct 26–30 | FD-W2: sales + video pages, routing, speed, failed payments, evidence | FD-G2 |
| Nov 2–6 | FD-W3: staging, real-phone E2E, Coach sign-off | FD-G3 |
| Nov 9–13 | FD-W4: 10% split | FD-G4 |
| Any time after audit | FD-A: quick Woo fixes | Delta |

---

## 9. Optional business-side reviewers (Grok teammates, not bench gates)

- **Hayes + Ash:** the `brand-review` skill before anything ships (pages, forms, mail).
- **Ada:** money check that failed-payment handling feeds the failed-renewal book. A canceled PaymentIntent is not a failed renewal.
- **Knox:** IT/dev oversight and alignment with the CTO.
- **Reed:** walk from clip to checkout for honesty.
- **Voss:** check that what we sell matches what exists.

They follow `gemba-walk` before any status claim and `company-charter-check` before ship. They're advisory only; Delta's gates decide.

---

## 10. Open decisions for Coach

1. **Build venue:** cloud agent or Conor (StudioTwo on hold).
2. **Issue #13 split:** do capped quick Woo fixes now (Track A) alongside the new build? Track A needs three OKs to touch WP/Woo.
3. **D2:** edge routing through nginx `auth_request` or app middleware.
4. **B6:** stays open. Confirm the front door hands off to Woo checkout until it's ruled.
5. **Privacy/legal OK** for evidence capture (IP and device fingerprint) and the privacy notice text.
6. **Which optional products are switched on at launch:** Activator, Quarterly, Monthly $267, $165 intro.
7. **New URL names** for the sales, video and order pages.
8. **Targets** once the baselines are in.
9. **Three-OK candidates** in §6, including the membership FAQ "full year" copy conflict.
10. **IKI Labs floor** (Fri Oct 16). It drives the "already covered" and finisher views.
