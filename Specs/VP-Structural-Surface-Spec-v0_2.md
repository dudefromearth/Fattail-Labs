# VP Structural Product — Member Surface Spec v0.2 (DRAFT)

**Version:** v0.2 (DRAFT)
**Supersedes:** `VP-Structural-Surface-Spec-v0_1.md` (file sha1 `cbd5ab01…` per the Advisor review object hash). v0.1 stays on disk as baseline. Change table §12.
**Date:** 2026-09-19
**Machine:** StudioTwo (dev) — specification only; files/trees touched by this document: NONE
**Scope:** Member-facing chart surface of the structural product. Rendering and surface law only. No data-plane, ingest, Engine, or EVENT-compute law lives here.
**Status:** DRAFT. **BUILD AUTHORITY: none.** No component work proceeds from this file.
**Canonical filename:** provisional — house `FatTail-Labs-…` pattern name assigned at DL seating (construction spec M1 convention). Header, filename, footer change together.
**Related:** Advisor review 2026-09-19, filed `artifacts/agents/reviews/2026-09-19-Advisor-VP-Structural-Surface-Spec-v0_1.md` (§11 disposes every finding).

**Parents (cited, not amended — binding status per §10 P0-1):**
- `Specs/AZ-VP-9-A23.md` — VP Chart Primitive Migration (stamped; W1–W4 in flight). **Cite currently unbound:** the Advisor seat reads `Specs/` main through A22 only. Binding waits on Juliet confirming where the A23 freeze landed and the file reaching a hashable surface.
- `VP-Overlay-Spec-v0_2.md` — Contract Overlay Construction (DRAFT, pending DL seat). VP-OVL-# cites are to that draft and **unbound** until it is seated and hashed.
- VPS v0.2.1 — histogram data plane, `vp_row` grid, S1/S3/S4/S6/S8, §7 status kinds (cited via the reviews).
- Structural Analysis Service — separately commissioned downstream owner of nodes/crevices/levels; this surface consumes, never computes.

**Does not supersede:** anything outside its own lineage. **Does not decide:** Q1 (participation set), Q2 (sequential join) — fenced upstream, untouched here. **Does not effect:** the amendments proposed in §8 — they are named proposals pending their own DL seats.

---

## §0 Coach rulings of 2026-09-19 — authority for this version

Recorded from Coach directly, pending DL stamp:

1. **Mounts:** the VP app appears in both Options Lab and IKI Lab; the StudioOne server was created precisely so an app can be written at any endpoint — desktop and mobile apps are likely later. → §3 mount law: one component, many mounts.
2. **Day-one delivery:** show single or overlapped ES contract volume bins; deliver the most efficient viewable data for the current view, with optimistic loading, then page as the user explores the entirety of the model. → SRF-4 rewritten as viewport-scoped delivery.
3. **Merge flexibility:** the sequential-agreement question stays with the experiment ("let the experiment decide first") — AND the surface must offer the option of showing merged data or individual contracts for the price and date range being displayed, because no publicly available tool does this and the experiment needs the flexibility. → SRF-11, the Composite Lens: the stored model stays per-contract; the merge exists only as an explicit render-time lens, and the lens is the P0-S instrument. MERGED mode is inoperable until the §8.1 construction amendment is stamped (gate G-E).

---

## §1 Purpose

Define the member surface: a TradingView-style chart (Lightweight Charts engine) limited strictly to specified VP features, serving the three governing uses — morning routine, trade entry, trade management. The actual volume profile is the primary view; structural analysis is an overlay, off by default. This surface is not the Options Lab session-VP canvas; that product continues unchanged (caption law, SRF-13).

---

## §2 Dependency gates

| Gate | What it is | Scope | State at writing |
|---|---|---|---|
| G-A | AZ-VP-9-A23 W4-G final report, GO — **and** the A23 file on a hashable surface so the gate can be verified | All packets | Pending; filing question open with Juliet |
| G-B | Construction spec DL seat, including Coach's stamp on the reversal of **Structure Levels v0.1 §2 struck-row and §3.2** (object renamed per Advisor rec 10) | All packets | Pending |
| G-C | VPS Q1 — per-contract ES/MES prints, native prices, timestamps and size | All packets | Pending |
| G-D | Structural Analysis Service commissioned | C3 only | Not commissioned |
| G-E | §8.1 amendment (VP-OVL-10 lens carve-out) DL-stamped | C6 MERGED mode only | Proposed herein |
| G-F | VPS publishes a windowed-delivery kind serving price × date windows over the whole archive with paging (§8.2) | SRF-4 reach beyond currently published kinds | Proposed herein |

This spec may be iterated and reviewed while gates pend; no packet dispatches until G-A through G-C are GO. Per Advisor rec 12: C1 without per-contract prints is a front-month-only toy that would be mistaken for the product — it does not ship early.

---

## §3 Mount law and component inventory

**Mount law.** The surface is one mountable component whose only hard dependency is the StudioOne delivery contract. Named mounts at writing: **Options Lab** and **IKI Lab**; anticipated: desktop app, mobile app. Every mount inherits every SRF law identically; no per-mount law forks. Mount gates: the Options Lab mount requires a dated clarification/amendment of VPS S8 (Structure Levels lines vs the Options Lab canvas) before C3 draws there; the IKI Lab mount carries no such gate. Mount chrome carries the pair-identity badge (SRF-14) and the §1 caption.

| # | Component | Kind | Cardinality | Law |
|---|---|---|---|---|
| C1 | Contract histogram primitive | `ISeriesPrimitive` on that contract's own futures series | One instance per contract; display cap per SRF-15 | SRF-2, -4, -10 |
| C2 | Event marker primitive | `ISeriesPrimitive` on the cash series; draws in time only | One per cash series; **default off** | SRF-3 |
| C3 | Structural-analysis overlay primitive | `ISeriesPrimitive`; **default off** | One per chart | SRF-5 |
| C4 | Chart shell | Surface chrome: pair staging, rollover view settings, layout, settings persistence per A22 | One | SRF-7, SRF-14 |
| C5 | Future-scope entries | Visible "in development" panels with doctrine text | Per future view | SRF-9 |
| C6 | Composite Lens | Render-time view transform over the displayed window | One per chart; **INDIVIDUAL default; MERGED gated on G-E** | SRF-11 |

**Series-attachment table (Advisor P0-4).** The shell hosts per-contract futures series (candles may be hidden; histogram visible). C1 attaches only to its own contract's series — never to cash, which would require mapping bins onto cash prices, forbidden by VP-OVL-1/SRF-2. C2 attaches to the cash series and draws in time only. C3 attaches to the series whose published structure it draws, per the SA service's own spec — this file does not decide SA coordinates. C6 is a pane-level transform over the visible C1 set, attached to nothing. Layout (c) therefore means: cash pane plus front-contract futures series with its histogram — not "histogram drawn on SPX."

---

## §4 Surface laws

**SRF-1 — Primitives only.** Every profile-related visual renders through an `ISeriesPrimitive` inside the engine's paint loop. Sibling canvases and manual redraw plumbing are prohibited. Inherits A23's acceptance as foundation law (cite unbound until G-A's filing question resolves).

**SRF-2 — One contract, one primitive, native prices.** Each C1 instance attaches to exactly one contract's series and draws only that contract's bins in that contract's native prices. A primitive spanning contracts is engine-enforced impossible, and no adjusted or volume-merged *series* ever exists. Picture-level merge prevention is carried by layout seating (§5 D1), SRF-10's teeth, and the Lens law (SRF-11) — not by the engine. A shared numeric axis is a named compare layout, not the daily default. *(Rewritten per Advisor rec 3; v0.1's "physically impossible" overclaim withdrawn.)*

**SRF-3 — Events carry time and evidence, never a price — including no y.** C2 renders event records (timestamp, contributing contracts, referenced bins) as time-only marks: a vertical rule, a time-axis tick, or a reserved footer band. If the engine requires a y to place a glyph, the glyph lives on the time axis or pane footer — never on a candle. No horizontal line at any cash price derived from an event. The member reads the cash level live at the marked moment; an ES number has no rendering path onto the SPX scale. Evidence-on-click is **member-visible** and lists contract, native price, and size — it does not project onto the cash axis (VP-OVL-4; Advisor D2). C2 is **off by default**, matching C3, until Coach restores alerts by name. Badge/toast/sound delivery is a **separate delivery spec**; the "later section of this file" door is closed. C2 is specified so the render path exists; **it does not seat the EVENT layer.**

**SRF-4 — The whole model reachable, the window delivered.** (Coach ruling 2.) The surface requests bins for the displayed price × date window, renders optimistically, and pages outward as the member explores — the most efficient viewable data first, the entirety of the model reachable. Scrubbing time never re-profiles structure: visible-time-range (VRVP) recomputation stays prohibited; what changes with the window is which contracts and bins are fetched and drawn. Reach beyond currently published VPS kinds is fenced on G-F; until G-F, the surface paints what the published kinds serve, honestly captioned. A **versioned render-side LOD/coarsen budget** governs paint density (Advisor P0-5) — a render parameter, not Engine policy, and still subject to SRF-6.

**SRF-5 — Structure is an overlay, off by default.** C3 draws what the SA service published; the member toggles visibility; the visible price axis clips. C3 labels obey the VP-L1 / Structure Levels forbidden-noun list. *(v0.1's "range the member's current strategy requires" sentence is struck per Advisor rec 7 — strategy-fit clipping read as trade advice; no such band law exists until written.)*

**SRF-6 — View-only coarsening, no write-back.** RAW grain reaches the primitive untouched; coarsening happens at render time inside the primitive under the SRF-4 LOD budget. Nothing the renderer does is ever written back toward the store.

**SRF-7 — Rollover settings are chart furniture.** Vendor-named presets, manual configuration, sane silent default — chart display only, no path to model or stores (VP-OVL-8).

**SRF-8 — Pairs stay parallel on screen.** ES→SPX and MES→XSP are parallel pair surfaces. MES bins never render on an XSP number line unscaled; no cross-pair co-rendering onto one axis (VP-OVL-11 render corollary). AT-5 enforces.

**SRF-9 — Future scope stays visible and honest.** Replay, footprint/market delta, GEX overlay, characterization, click-drag exploration appear as C5 entries: visible, marked in development, doctrine text, never faked. Removing a C5 entry requires a DL entry. The Replay entry is captioned **"as-of replay of this surface"** to kill the Analyzer Time Machine (VP-L9) name collision. The C5 GEX entry inherits VPS S6 — no shared color grammar.

**SRF-10 — Sequential display is not sequential voting — with teeth.** Rendering an expired contract's C1 beside a live one is display, not computation, and is permitted; hiding it would require Q2 compute this spec is forbidden to do. The teeth (Advisor rec 1, all five):
1. **No sequential-agreement chrome.** No connector, shared highlight, dual-POC, "both nodes" chip, or caption asserting the two books agree.
2. **C2 is concurrent-only** until construction v0.3 lifts VP-OVL-3. A marker whose contributing-contracts set mixes expired and live is unrenderable — fail loud, do not paint (AT-3).
3. **Expired C1 is visually demoted**: required identity chrome — contract code + expiry, not color-only — and distinct ink/opacity from live C1.
4. **Mount rule:** C1 auto-mounts by visible-time ∩ contract life, or by explicit member pin. Never auto-mount every expired contract whose native price range intersects the visible price axis — price-range intersection is the sequential-overlay smuggle.
5. If P0-S later permits sequential voting, **SRF-10 is amended by name**, not stretched.
Sequential co-display on a *shared axis* occurs only inside the Lens (SRF-11) and only after G-E; outside the Lens the teeth hold absolutely.

**SRF-11 — The Composite Lens.** (Coach ruling 3.) C6 is an explicit render-time view transform over exactly the displayed price × date window:
- **Modes:** INDIVIDUAL (default — the C1 set as-is) | MERGED (one composited histogram of the window's bins).
- **Merge basis selector:** native-price | cash-referenced — the two coincidence axes of P0-S. The active basis is always displayed in the chrome.
- **Never default, never silent, never sticky:** the lens always opens INDIVIDUAL; MERGED never persists across sessions (A22 persistence explicitly does not apply to lens mode); while MERGED is active a persistent banner names the mode and basis; per-contract identity chrome remains; screenshots and exports carry the chrome.
- **Render-only:** the composite exists only in the paint pass. Nothing is written to RAW or EVENT; no event, level, study, or any computation consumes lens output; C2 never reads it (AT-4, AT-7, AT-8).
- **Scope:** exactly the displayed window; pan/zoom recomputes the composite for the new window under SRF-4 paging.
- **The Lens is the P0-S instrument:** a sequential window viewed under MERGED, on either basis, is the experiment view — the member-grade apparatus for the question Coach ruled stays open. Display under the lens asserts co-location, never agreement.
- **Gate:** MERGED (any basis) is inoperable until G-E; before the stamp the control is a C5-style honest entry with doctrine text (AT-6).

**SRF-12 — Terrain nouns.** This surface never labels POC / VA / VWAP as structural claims — the structure-levels rejection of window-dependent measures stands here. If a mount also exposes session tools carrying those nouns, that is the other product, per the §1 caption.

**SRF-13 — Caption law.** Every mount states: this surface is not the Options Lab session-VP canvas; the AZ-VP-9 session product continues unchanged.

**SRF-14 — Pair identity and data-status chrome.** A persistent pair-identity badge (ES→SPX or MES→XSP; VPS S3/S4) on every mount — the remaining old-§3.5 path after SRF-3 is a member misreading native ES beside cash, and the badge closes it. VPS §7 GAPPED / UNAVAILABLE statuses render as banner law, never silently.

**SRF-15 — Display cap.** C1 concurrent display cap is a **surface parameter, versioned**, independent of Q1's participation-set compute. No default taken here; set at packet time and recorded.

**SRF-16 — Settings persist per A22.** C3 default-off state, layout choice, rollover chrome, and lens *availability* persist under stamped A22 (settings persistence) — not localStorage. Lens *mode* is the named exception (SRF-11: never sticky).

---

## §5 Open decisions

**D1 — Layout** (seated as Advisor lean; Coach overwrites in the DL):
- **(c) front primary + back toggle — member default.** Matches VP-OVL-7; cannot be misread as a merge; the morning/entry/management read.
- **(d) one pane, shared numeric axis, N labeled native histograms — concurrent compare.** Same $/pixel, one number line, contract chips, calendar spread visible as a gap. Concurrent-listed contracts only; expired + live on that axis stays illegal outside the Lens. Distinct from Lens MERGED: (d) is separate labeled histograms; MERGED is one composited histogram — both loud.
- **(b) stacked panes — fallback** if (d) is still read as a merge.
- **(a) one pane, independent per-contract autoscale — illegal.** Engine autoscale paints different native prices on the same pixel: silent basis-cancellation, the picture this doctrine exists to forbid; also dies at three contracts (two price scales per pane).

**D2 — Event marker visual grammar** (deferrable to build; data contract fixed by SRF-3; evidence member-visible per SRF-3).

**D3 — Which contracts render by default** (blocked on Q1; SRF-10 tooth 4 governs mounting meanwhile).

---

## §6 What this surface does not do

Compute events, agreement, or structure; store, tag, or amend RAW/EVENT; apply any price adjustment; decide Q1 or Q2; deliver notifications (separate delivery spec — the door is closed); seat the EVENT layer by rendering C2.

---

## §7 Acceptance tests (minimum; grown at packet time)

| AT | Assertion |
|---|---|
| AT-1 | C1 constructed with two contract ids → refuses, fail loud |
| AT-2 | Event record containing a price field → unrenderable, fail loud |
| AT-3 | Sequential (expired + live) contributing set → zero C2 markers painted |
| AT-4 | Any renderer write-back path toward RAW/EVENT → does not exist / refused |
| AT-5 | MES C1 attached to an XSP series → refused |
| AT-6 | Lens MERGED invoked before G-E → inoperable; doctrine text shown; no composite painted |
| AT-7 | Lens MERGED active → banner + basis chrome present in DOM and in export output |
| AT-8 | Lens INDIVIDUAL → output pixel-identical to lens-absent render |

---

## §8 Proposed amendments — named, effected nowhere in this file

**§8.1 — VP-OVL-10 lens carve-out** (construction spec; Coach ruling 3 is drafting authority; stamp required; gates G-E). Proposed text: "…except under the explicit Composite Lens defined in the surface spec: non-default, loudly chromed, render-time-only compositing of the displayed price × date window, on a named basis (native-price or cash-referenced), storing nothing and feeding no computation. The silent continuous contract remains prohibited; the Lens is never silent." Companion sentence for VP-OVL-3: render-time lens compositing is display, not agreement computation; the voting fence is unaffected.

**§8.2 — VPS windowed-delivery kind** (VPS spec; gates G-F). A published kind serving finest-resolution bins for a requested price × date window across the whole archive, with paging suitable for SRF-4's optimistic-load-then-explore contract. Proposed here; seated in VPS's own process.

**§8.3 — VPS S8 clarification** (mount gate for Options Lab, §3). Dated amendment resolving whether S8's "Structure Levels lines do not draw on the Options Lab VP canvas" reaches a structural-product mount hosted inside Options Lab as its own surface.

---

## §9 Intake path

Iterate as DRAFT beside the construction spec. When G-A through G-C are GO and Coach directs: Juliet intake — series ID, freeze, Phase-5 BUILD AUTHORITY. Work packets are drafted at that point against the then-current A23 **as-built** architecture docs; **no packet cites this file's guesses about `ISeriesPrimitive` paint-loop shape** (Advisor keep, verbatim).

---

## §10 P0 identity items

**P0-1 — Parent binding.** OVL-10/-11 and A23 cites are marked unbound in the header and bind only when those files are on a readable, hashable surface. Standing question to Juliet: where did the A23 freeze land, given `Specs/` main reads through A22?
**P0-2 — Product seat.** Resolved by Coach ruling 1 as the §3 mount law; the S8 question survives as §8.3 and the Options Lab mount gate.

---

## §11 Advisor finding disposition — every finding, carried or reasoned

| Finding | Disposition in v0.2 |
|---|---|
| SRF-10 keep + five teeth | Kept; all five teeth in SRF-10; tooth 3's shared-axis ban scoped "outside the Lens" per Coach ruling 3, with the Lens itself G-E-gated |
| D1 seat the lean; (a) illegal | §5 D1 seated as Advisor lean, (a) recorded illegal with the autoscale mechanism; Coach overwrites in DL |
| SRF-2 overclaim | Rewritten; engine enforces primitive-contract only; picture-merge prevention moved to layout + SRF-10 + SRF-11 |
| No Juliet / no packets | §9; G-A–G-C blockers restated; rec 12's front-month-toy warning carried into §2 |
| §6 as-built sentence | §9, verbatim |
| P0-1 parents unbound | Header + §10; G-A extended to require a hashable A23; G-B object renamed to Structure Levels v0.1 §2 / §3.2 (rec 10) |
| P0-2 route/S8 | §3 mount law (Coach ruling 1); §8.3; Options Lab mount gate |
| P0-3 C2 y-ban, default, delivery door | SRF-3 rewritten: time-only draw, y-ban, off by default, delivery split out, door closed, "does not seat EVENT" sentence |
| P0-4 series attachment | §3 table; C1 never on cash; (c) restated correctly |
| P0-5 SRF-4 vs Stage A | SRF-4 rewritten per Coach ruling 2; G-F fences reach; LOD budget added as render parameter; §1/SRF-13 caption |
| P1 SRF-5 strategy-range | Sentence struck (rec 7); C3 draws what SA published |
| P1 display cap | SRF-15 |
| P1 POC/VA/VWAP silence | SRF-12 |
| P1 pair badge | SRF-14 |
| P1 GAPPED/UNAVAILABLE | SRF-14 banner law |
| P1 Replay collision | SRF-9 caption |
| P1 C3 nouns / C5 GEX grammar | SRF-5, SRF-9 |
| P1 A22 settings | SRF-16, with the lens-mode exception recorded |
| P1 D2 evidence visibility | Member-visible in SRF-3; no cash projection |
| P1 stamp gate / AT / hash | §7 ATs (all five Advisor minimums = AT-1…AT-5, plus lens AT-6…8); footer hash line; DL records file sha1 at seating |
| P1 self-voting leaks | SRF-3 EVENT sentence; SRF-4 composite reach fenced on G-F rather than voted; SRF-5 draws-what-SA-published |
| Recommendations 1–12 | Adopted as written; rec 6 resolved by ruling 1 + ruling 2 (mount law + windowed delivery) rather than the either/or as posed — an adaptation, not a dispute |

Dropped findings: none.

---

## §12 Change table v0.1 → v0.2

| Area | v0.1 | v0.2 |
|---|---|---|
| Route | Unnamed (Advisor FAIL) | §3 mount law: one component, mounts in Options Lab + IKI Lab, endpoints open (Coach ruling 1) |
| Profile depth | Full-history vs session binary | SRF-4 viewport-scoped delivery + paging (Coach ruling 2); G-F fences reach |
| Merge | Prohibited absolutely at render | SRF-11 Composite Lens: INDIVIDUAL default; MERGED explicit, loud, render-only, G-E-gated (Coach ruling 3); §8.1 amendment proposed |
| SRF-2 | "Physically impossible" overclaim | Engine enforces primitive scope only; picture law moved to layout + teeth + lens |
| SRF-10 | Split only | Five teeth added; amend-by-name clause |
| C2 | Data contract only | y-ban, time-only draw, default off, delivery spec split, EVENT-seat disclaimer |
| Laws | SRF-1…10 | SRF-1…16; ATs added; hash line added |
| Coach decisions | D1 empty, no default | D1 seated as Advisor lean; three Coach rulings recorded in §0 |

---

Version: v0.2 (DRAFT) — header, filename, and this line must agree.
File sha1: computed post-write and recorded in the DL at seating (a file cannot embed its own whole-file hash).
