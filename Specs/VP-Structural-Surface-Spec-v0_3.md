# VP Structural Product — Member Surface Spec v0.3 (DRAFT)

**Version:** v0.3 (DRAFT)
**Supersedes:** `VP-Structural-Surface-Spec-v0_2.md`. v0.2 stays on disk as baseline. Change table §13.
**Date:** 2026-09-19
**Machine:** StudioTwo (dev) — specification only; files/trees touched by this document: NONE
**Scope:** Member-facing chart surface of the structural product. Rendering and surface law only. No data-plane, ingest, Engine, or EVENT-compute law lives here.
**Status:** DRAFT. **BUILD AUTHORITY: none.** No component work proceeds from this file.
**Canonical filename:** provisional — house `FatTail-Labs-…` pattern name assigned at DL seating. Header, filename, footer change together.
**Related:** Advisor review 2026-09-19 (v0.1), filed `artifacts/agents/reviews/2026-09-19-Advisor-VP-Structural-Surface-Spec-v0_1.md` — §12 disposition carried forward intact from v0.2.

**Parents (cited, not amended — binding status per §11 P0-1):** `Specs/AZ-VP-9-A23.md` (stamped; W4-G GO; interactive pass and main-merge confirmation outstanding; cite unbound until on a hashable surface for the Advisor seat) · `VP-Overlay-Spec-v0_2.md` (DRAFT, pending DL seat; VP-OVL-# cites unbound until seated and hashed) · VPS v0.2.1 · Structural Analysis Service (consumes, never computes).

**Does not supersede:** anything outside its own lineage. **Does not decide:** Q1, Q2 — fenced upstream. **Does not effect:** §9 proposals — named, pending their own DL seats.

---

## §0 Coach rulings — authority for this version

Rulings 1–3 (2026-09-19, morning session) carried from v0.2 §0 unchanged: (1) multi-mount; (2) viewport-scoped delivery with optimistic paging; (3) merge flexibility via the Lens, experiment decides sequential doctrine.

New rulings, 2026-09-19 (later session), recorded from Coach directly, pending DL stamp:

4. **Production default:** the "experiment" VP becomes a production option, not the main VP. The default is a traditional chart — select individual contracts, or the continuous contract, very similar to the way TradingView does it. → SRF-17.
5. **Continuity:** traders must have continuity from whichever platform they come from — TradingView, TradeStation, thinkorswim, and peers. → SRF-18 vendor presets, with the verification packet.
6. **Friction principle (doctrine, verbatim):** *"If we provide friction as our default, it will be rejected, no matter how good it is."* → governing doctrine for every default choice on this surface; recorded as Help/Wiki source text per the standing rule that doctrine arguments live in the specification.

**Doctrine consequence recorded with ruling 4:** continuity of the tradable series is not coincidence of structure. A continuous-basis chart asserts the former and nothing about the latter; the agreement question remains the experiment's (ruling 3, unchanged). The construction doctrine's target — restated — is the *silent* composite and the *model-feeding* composite. Labeled, model-blind composite views are view conveniences under the construction spec's own sentence ("any adjustment is a view convenience"), default-eligible under ruling 6. §9.1 broadens accordingly.

---

## §1 Purpose

Define the member surface: a chart product (Lightweight Charts engine) whose **front door is familiar** — a traditional futures chart with contract selection and vendor-style continuous construction — and whose **depth is the structural product**: the native-price profile, structural overlay, events, and the Lens, each a named option, never the barrier. Serves the three governing uses — morning routine, trade entry, trade management. Profile semantics break with the vendor platforms deliberately (SRF-4: no visible-range re-profiling; full history constrained by the visible price axis); chart construction does not (SRF-18). This surface is not the Options Lab session-VP canvas (SRF-13).

---

## §2 Dependency gates

| Gate | What it is | Scope | State |
|---|---|---|---|
| G-A | AZ-VP-9-A23 W4-G GO **plus** the two close-out items: interactive pass (Playwright pan/zoom, Strict Mode, logged-in) and A23 merged to main on a hashable surface | All packets | W4-G GO; close-outs pending |
| G-B | Construction spec DL seat, incl. Coach's stamp on the Structure Levels v0.1 §2 / §3.2 reversal | All packets | Pending |
| G-C | VPS Q1 — per-contract ES/MES prints, native prices, timestamps and size | All packets | Pending |
| G-D | Structural Analysis Service commissioned | C3 only | Not commissioned |
| G-E | §9.1 amendment (composite-view carve-out) DL-stamped | C6 MERGED **and** SRF-17/18 continuous-basis rendering | Proposed herein |
| G-F | VPS windowed-delivery kind (§9.2) | SRF-4 reach beyond published kinds | Proposed herein |
| G-G | Vendor-behavior verification packet complete with citations (§9.4) | Each SRF-18 preset, individually | Not started |

No packet dispatches until G-A through G-C are GO. Per Advisor rec 12: C1 without per-contract prints is a front-month-only toy and does not ship early. Continuous-basis default rendering additionally waits on G-E; each vendor preset additionally waits on its G-G row.

---

## §3 Mount law and component inventory

Mount law unchanged from v0.2: one mountable component, sole hard dependency the StudioOne delivery contract; named mounts Options Lab and IKI Lab, anticipated desktop and mobile; every mount inherits every SRF law; Options Lab mount gated on the S8 clarification (§9.3) before C3 draws there; mount chrome carries pair badge (SRF-14), basis chrome (SRF-18), and the §1 caption (SRF-13).

| # | Component | Kind | Cardinality / default | Law |
|---|---|---|---|---|
| C1 | Contract histogram primitive | `ISeriesPrimitive` on that contract's own futures series | One per contract; cap per SRF-15 | SRF-2, -4, -10 |
| C2 | Event marker primitive | `ISeriesPrimitive` on the active chart's time axis; time-only draw | One per chart; **default off** | SRF-3 |
| C3 | Structural-analysis overlay primitive | `ISeriesPrimitive`; **native-basis views only** | One per chart; **default off** | SRF-5 |
| C4 | Chart shell | Basis selector (SRF-17/18), pair staging, layout, settings per A22 | One | SRF-7, -14, -16 |
| C5 | Future-scope entries | Visible "in development" panels, doctrine text | Per future view | SRF-9 |
| C6 | Composite Lens | Render-time transform, displayed window | One per chart; INDIVIDUAL default; MERGED gated G-E | SRF-11 |
| C7 | Basis engine | Render-time basis construction: per-contract native → selected view basis | One per chart | SRF-17, -18 |

**Series-attachment table.** The shell hosts per-contract futures series (candles hideable). C1 attaches only to its own contract's series, never cash. C2 draws in time only — and because event records carry no price, C2 renders correctly on **any basis**, native or continuous (time survives adjustment). C3 attaches per the SA service's spec and draws **only on native-basis views** — structural levels at adjusted addresses would falsify the one thing they claim. C6 and C7 are pane-level transforms attached to nothing. Layout (c) means cash pane plus front-contract futures series, never "histogram drawn on SPX."

---

## §4 Surface laws

SRF-1 (primitives only), SRF-2 (one contract, one primitive, native prices at the model boundary), SRF-3 (events: time and evidence, never a price, no y, default off, delivery spec split, does not seat EVENT), SRF-4 (whole model reachable, window delivered; VRVP prohibited; LOD budget), SRF-5 (structure overlay off by default; draws what SA published; forbidden nouns), SRF-6 (view-only coarsening, no write-back), SRF-7 (rollover chrome is furniture — now subsumed as the manual corner of SRF-18), SRF-8 (pairs parallel), SRF-9 (honest future scope; Replay caption; GEX grammar), SRF-10 (sequential display ≠ voting, all five teeth), SRF-11 (Composite Lens), SRF-12 (terrain nouns), SRF-13 (caption law), SRF-14 (pair + data-status chrome), SRF-15 (display cap), SRF-16 (A22 persistence; lens MERGED never sticky) — **all carried from v0.2 as written**, with three amendments:

- **SRF-10 tooth 3 scope note:** "expired + live on a shared axis only inside the Lens" now reads "only inside the Lens **or a continuous-basis view (SRF-17/18)**, both G-E-gated." The teeth guard against *agreement affordances*; a continuous splice makes a continuity claim, not an agreement claim (§0 doctrine consequence). No sequential-agreement chrome appears on any basis.
- **SRF-11 note:** the Lens's never-default / never-sticky rules apply to the **research merge** (native-price and cash-referenced bases) specifically. The continuous-basis view is governed by SRF-17/18, is default-eligible, and persists per SRF-16.
- **SRF-16 note:** the member's chosen default basis persists under A22; Lens MERGED remains the named never-sticky exception.

**SRF-17 — The default is familiar.** (Coach rulings 4 and 6.) The chart opens as a traditional futures chart: a contract selector offering individual contracts and a continuous contract, constructed the way the member's home platform would construct it (SRF-18). The structural product — native-price profile as primary, C3, the Lens — is a named view option one control away, never the front door. Doctrine text (verbatim, ruling 6): *"If we provide friction as our default, it will be rejected, no matter how good it is."* Every default decision on this surface is tested against that sentence. The profile shown on a continuous basis is a convenience rendering at adjusted addresses and its chrome says so (SRF-18); profile *semantics* remain SRF-4's — full history, price-axis constrained, no VRVP — on every basis, because that difference is the product.

**SRF-18 — Vendor continuity presets.** (Coach ruling 5.) A basis preset is a named recipe — adjustment method plus roll rule — applied by C7 at render time over the same per-contract bins. Named presets at writing: **TradingView** (back-adjusted difference, TV roll convention), **thinkorswim** (ToS splice behavior), **TradeStation** (fully manual: method and roll trigger exposed), **FatTail Native** (per-contract native prices — the door into the structural view). Laws:
1. **No preset's behavior is asserted from memory.** Each vendor preset ships only after its G-G verification row: current vendor behavior confirmed against vendor documentation, with citations, at packet time. A preset that cannot be verified ships as a C5 honest entry, not as a wrong imitation — a subtly wrong splice breaks the continuity it claims.
2. **Render-only, model-blind.** No adjusted series is ever stored; no basis output ever reaches RAW, EVENT, SA, or any computation (VP-OVL-1 untouched at the model boundary). AT-4 extends to C7.
3. **Never silent.** The active basis and method are stated in persistent chrome on every view, every export (extends SRF-11 chrome law). The silent continuous contract remains prohibited on every path.
4. **Manual configuration** (the TradeStation corner) is the SRF-7 furniture, promoted: exposed method and roll controls, sane silent default, chart-only effect.

---

## §5 Open decisions

**D1 — Layout** — seated as Advisor lean, carried from v0.2: (c) front primary + back toggle as the *native-view* default; (d) shared-numeric-axis compare, concurrent only outside the Lens; (b) stacked fallback; (a) independent per-contract autoscale illegal. Note under ruling 4: the *surface* default is now the SRF-17 traditional chart; D1 governs what the native/structural view opens to when selected. Coach overwrites in the DL.
**D2 — Event marker visual grammar** — deferrable; data contract fixed by SRF-3.
**D3 — Default contract set** — blocked on Q1; SRF-10 tooth 4 governs mounting meanwhile.
**D4 — Preset list scope** (new): which vendor presets beyond the four named ship at v1 — decided at packet time against G-G verification cost; no default taken.

---

## §6 What this surface does not do

Compute events, agreement, or structure; store, tag, or amend RAW/EVENT; store any adjusted series; decide Q1 or Q2; deliver notifications (separate delivery spec; door closed); seat the EVENT layer by rendering C2; assert any vendor's construction behavior without a G-G citation.

---

## §7 Acceptance tests (minimum; grown at packet time)

AT-1…AT-8 carried from v0.2 unchanged (two-contract C1 refuses; priced event unrenderable; sequential set → zero C2 markers; no write-back path; MES-on-XSP refused; MERGED pre-G-E inoperable with doctrine text; MERGED chrome in DOM and export; INDIVIDUAL pixel-identical to lens-absent). Added:

| AT | Assertion |
|---|---|
| AT-9 | Continuous-basis view pre-G-E → inoperable; doctrine text shown |
| AT-10 | Any basis view active → basis + method chrome present in DOM and export |
| AT-11 | C7 output consumed by anything other than the paint pass → path does not exist / refused |
| AT-12 | C3 invoked on a non-native basis → refused, fail loud |
| AT-13 | Unverified vendor preset (no G-G citation row) → renders as C5 honest entry, not as a basis |
| AT-14 | Basis switch native ↔ continuous → C2 markers identical in time position |

---

## §8 Intake path

Unchanged from v0.2: iterate as DRAFT beside the construction spec; Juliet intake when G-A through G-C are GO and Coach directs; packets drafted against then-current A23 **as-built** docs; no packet cites this file's guesses about `ISeriesPrimitive` paint-loop shape.

---

## §9 Proposed amendments — named, effected nowhere in this file

**§9.1 — Construction composite-view carve-out** (broadened from v0.2's lens-only text; Coach rulings 3, 4, 6 are drafting authority; stamp required; gates G-E). Proposed text: "VP-OVL-10's prohibition binds the silent composite and the model-feeding composite. Explicit, labeled, render-time-only composite views — the Composite Lens on a named basis, and continuous-contract basis views under named vendor or manual recipes — are view conveniences: they store nothing, feed no computation, and carry persistent basis chrome on every render and export. Default eligibility of the continuous-basis view follows Coach's ruling of 2026-09-19; the Lens's research-merge bases remain never-default and never-sticky. The silent continuous contract remains prohibited on every path." Companion sentence for VP-OVL-3 unchanged: render-time compositing is display, not agreement computation.
**§9.2 — VPS windowed-delivery kind** — carried from v0.2 (gates G-F).
**§9.3 — VPS S8 clarification** — carried from v0.2 (Options Lab mount gate for C3).
**§9.4 — Vendor-behavior verification packet** (new; gates G-G per preset). A research packet, one row per vendor preset: current adjustment method, roll convention, and splice behavior, verified against vendor documentation with citations; output is the recipe C7 implements and the chrome text that names it. Machine at execution: StudioTwo; read-only research, no repo effect beyond the packet report.

---

## §10 P0 identity items

**P0-1 — Parent binding** — carried: cites unbound until parents are on a hashable surface; Juliet question on A23's main-merge outstanding (now also a G-A close-out item).
**P0-2 — Product seat** — resolved as §3 mount law; S8 survives as §9.3.

---

## §11 Advisor finding disposition

The full v0.2 §11 table is carried forward intact — every finding from the 2026-09-19 Advisor review remains dispositioned as recorded there; none reopened, none dropped. Rulings 4–6 postdate that review; their laws (SRF-17, SRF-18, C7, AT-9…14, §9.1 broadening, §9.4) await the next Advisor pass.

---

## §12 Coach questions

None open. Rulings 4–6 answered the default question before it was asked; D1/D3/D4 are seated or blocked as recorded; the §9 amendments reach you through the DL stamp path, not as questions here.

---

## §13 Change table v0.2 → v0.3

| Area | v0.2 | v0.3 |
|---|---|---|
| Front door | Structural view primary | SRF-17 traditional chart default: individual contracts or continuous, TV-similar (ruling 4); structural view a named option |
| Doctrine | — | Friction principle recorded verbatim as governing default doctrine (ruling 6); continuity-of-series ≠ coincidence-of-structure |
| Continuity | Rollover chrome as furniture (SRF-7) | SRF-18 vendor presets (TV, ToS, TradeStation, FatTail Native) with G-G verification packet (ruling 5); SRF-7 subsumed as the manual corner |
| Components | C1–C6 | + C7 basis engine, render-only, model-blind |
| C2 | Cash-series marker | Renders on any basis — time survives adjustment (AT-14) |
| C3 | Overlay, off by default | + native-basis views only (AT-12) |
| §9.1 carve-out | Lens only, never-default | Broadened: labeled, model-blind composites; continuous basis default-eligible; Lens research-merge stays never-default/never-sticky |
| SRF-10 tooth 3 | Shared axis only inside Lens | + or continuous-basis view, both G-E-gated; teeth guard agreement affordances on every basis |
| Gates | G-A…G-F | + G-G (per-preset verification); G-A extended with A23 close-out items |
| ATs | AT-1…8 | + AT-9…14 |

---

Version: v0.3 (DRAFT) — header, filename, and this line must agree.
File sha1: computed post-write and recorded in the DL at seating.
