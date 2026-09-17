# Structural Analysis Service — Spec v0.4

**Status:** DRAFT — contract close for review. NOT BUILD. Not on the VP
service's critical path (VPS2/VPSB proceed independently). This is the
AUTHORED v0.4: it replaces the directive pointer previously on the
board (DL-728); nothing builds against a pointer.
**Date:** 2026-09-17
**Supersedes:** Structural-Analysis-Service-Spec-v0_3_1.md
**Note on Advisor round 2:** in flight against v0.3.1 at cut time; its
findings will be dispositioned into v0.4.1 or confirmed absorbed —
never silently dropped.
**Product name:** spec and API remain "Structural Analysis"; a
member-facing retitle (e.g. "Market Structure") is an open Coach word,
recorded when given.

## Change table (v0.3.1 → v0.4)

| Source | Change | Where |
|---|---|---|
| Coach directive (verbatim intent in DL): future scope must never be lost; the current app must make the full breadth apparent | **SA-L11 — the map shows the whole territory**: all future views are first-class navigation in honest IN-DEVELOPMENT states with doctrine text; no fake data, no empty widgets, no hiding | §2, §8 |
| Walk-and-talk audit G1 | Fourth-leg positioning in Purpose | §1 |
| G2 | §1a Doctrine: inventory-defense persistence story; Market Profile lineage critique; why nodes form; **SA-L12 no day-typing / no session attribution** | §1a, §2 |
| G3 | Ontology: child node, appendage/temporary shelf, promotion; no-line-until-promoted; SA-Q8 (promotion criteria), SA-Q9 (hysteresis) | §3, §8, §10 |
| G4 | §8a Phase roadmap: Exploration, Replay/TPO, Footprint & Market Delta (with the quotes-capture data note), GEX side-by-side (fusion alert stays dead), Characterization | §8a |
| G5 | §8b Characterization stage: behavior distributions, not a confidence score; provenance as input (SA-Q12); schema-reserved, unserved until §12a populates | §8b, §13 |
| G6 | Research agenda: Mandelbrot, Chung & Bellotti, Garzarelli as adjacent evidence; currencies proving ground; node birth | §11 |
| G7 | Session markers from the Sessions tool; four-class location legend in neutral encoding; corpus scale (dozens, across regimes); beats-eye asymmetry rule; Runner named as consumer | §8, §9, §12a, header |
| Coach tick: VPB-Q2 = BOTH | XSP dual-source (SPY and MES), source-tagged; presentation of dual-source XSP = SA-Q10 | §5a, §10 |
| C-1 (open) | Member click-drag pane: objects-only summary per current law, or a narrow bins exception — Coach's word, carried as SA-Q11 | §8a, §10 |

**Parent contract:** Volume-Profile-Service-Spec-v0_6 — this service is a
**computing consumer** of `/v1/profile` and `/v1/profile/.../range`. It
never touches Ingest or raw prints; the histogram is its only input.
**Position:** the VP service is the **data end** of the volume profile
stack; this service is the **app end** — the member-facing product.
**Host:** compute on Dude two (farm plan); the member surface ships
inside FatTail Labs (Options Lab), consuming this service's API.
**Consumers:** Options Lab canvas, heatmap overlay, Analyzer overlay,
**Runner**, Strategy Lab, IKI templates.

## Change table (v0.2 → v0.3)

| Source | Change | Where |
|---|---|---|
| Coach Decision 1 (2026-09-17, verbatim in DL): "Raw bins stay on StudioOne the collector, bins are available through an API" | Decision 1 CLOSED: Options Lab is the product's home; the member surface renders this service's objects; raw bins are an API contract of the VP data end (VP-L18), never a member rendering. Resolves the v1.2-draft's §1/§15.1-vs-§8 presentation collision and its §12 API-exposure defect in this spec's favor | §0, §8 |
| v1.2-draft keepers (structure-levels review, 2026-09-17) | Heavy-tick edge pricing made explicit (§4.2); generation retirement recording added — an object absent from the next generation is recorded RETIRED, never silently gone (§13); pinned-band discipline confirmed already covered by SA-L1/L3 + §7 (no floating-membership object exists here) | §4.2, §13 |
| Draft retirement | The v1.2-draft joins its parent voice-session document under Specs/sources; its noun-freeze concern is satisfied by §1's served-noun law (support/resistance forbidden), its color concern by SA-L10 | §11 |

## 0. Position in the stack

Part four — the app end. The VP service owns capture and histograms
(data end; raw bins available only through its API per VP-L18); this
service owns everything derived — nodes, edges, crevasses, groupings,
the strategy-scoped viewport — and the member application built on
them. The analysis vocabulary forbidden in VP labels (VP-L1) lives
here. Rendering consumers render this service's bytes and never
re-derive (inherits the VP-L2 pattern).

## 1. Purpose

**Volume structure is the fourth leg of market structure.** GEX plus
volatility, time and price are incomplete without it — structure is as
influential on price development as the three D's of options. This
service publishes **where traded volume changes significantly** — the
long edges of volume nodes, and the crevasses between and within them —
grouped into the working sets a trader's strategy actually needs, as
terrain context for positioning defined-risk structures. It is the
member-facing volume profile product of FatTail Labs.

Classic profile measures (POC, value areas, VWAP-anchored levels) are
permanently out of scope: properties of a cropped window, not of the
market. This service publishes only features of the distribution itself.

**Allowed nouns** in served labels: volume, node, edge, crevasse, shelf,
base, floor, contrast, width, grouping, uncharted, session, source,
basis, gap. Forbidden: POC, value area, VAH, VAL, VWAP, HVN, LVN,
rotation, break, magnet, target, support, resistance, bounce, hold,
fail, or any verb assigning future behavior to a level (SA-L5).

## 1a. Doctrine (normative; the Help/Wiki seed)

- **Why levels persist — the causal story.** Persistence is not
  primarily trader memory. Market makers and institutions carry
  long-lived inventory and positions at these prices, which must be
  defended or unwound there; psychology and physiology are secondary.
  Positions outlive sentiment — which is why structure can hold for
  weeks, months, years, even decades. This is doctrine and internal
  thesis; it never becomes served vocabulary (SA-L5 governs the wire).
- **The lineage critique.** Volume profile inherited its lexicon
  wholesale from Market Profile (Steidlmayer's time-price-opportunity
  work). Those concepts describe a *time* distribution; nobody
  re-examined whether they mean anything for a *volume* distribution —
  they were assumed across. POC is not actionable: it marks where the
  market already agreed, not where it battles. The 70% value area is a
  decades-old convention, not something the market said. What survives
  the filter: market delta — bid/ask-classified volume, genuinely
  measuring aggression (§8a, Footprint phase).
- **Why nodes form.** Price moving between nodes is searching out
  value; the most logical place to find it is another node, not the
  well. Failing that, price may decide it has found value intranode,
  or create a brand-new node at fresh highs.
- **No day-typing (SA-L12).** Session shapes are never classified
  (normal day, trend day, …), never used to infer future sessions, and
  levels are never attributed to the session that built them. Sessions
  exist in this system for practical access reasons only.


## 2. Founding laws

- **SA-L1 Window invariance.** Every detection test is local and
  scale-relative — ratios against neighboring structure, widths in rows —
  never fractions of a windowed total, never a window-dependent anchor.
  Consequence: any published object not touching a query boundary is
  byte-identical when the range is extended. Extending a view can reveal
  structure; it can never move or erase structure already found.
- **SA-L2 Full attribution.** A node's weight is its **entire archive
  volume** — everything ever transacted in its rows, fetched via the VP
  `/range` contract. No lookback parameter exists anywhere in this
  service. The practical range a trader experiences is an emergent
  property: rows near all-time highs simply have no volume before their
  first touch.
- **SA-L3 Analyze everything, show by strategy.** The analysis layer
  works the entire archive, continuously, with no knowledge of the
  viewer. The presentation layer is a viewport — bounds derived from the
  requesting strategy (§7) — selecting from precomputed structure, never
  triggering computation. Nothing about what an object is or weighs
  depends on any display choice.
- **SA-L4 Derived, not configured.** First-touch dates, practical range,
  viewport bounds, grouping membership: all derived. The trader
  configures nothing per-day; a strategy profile carries its constants
  (§7) as doctrine, set once.
- **SA-L5 No forecast language** per §1's noun list.
- **SA-L6 Determinism and identity.** Same histograms + same parameter
  set ⇒ byte-identical objects; versioned parameters; parameter-set hash
  and generation id on every payload (inherits VP-L6/L16 pattern).
- **SA-L7 Uncharted terrain is a first-class answer.** Price regions with
  no meaningful transacted history are published as `uncharted` regions,
  never backfilled with a nearest-level or manufactured structure. Fresh
  price discovery names itself.
- **SA-L8 Resolution honesty.** Analysis always runs on the substrate
  grid (`vp_row`). Display zoom is a rendering decision and never changes
  detection input — no view-dependent re-binning of the kind charting
  platforms perform.
- **SA-L9 Baseline ship-gate.** Detected structure ships to members only
  after a pre-registered test shows separation from naive baselines
  (round numbers; prior-session highs/lows) on held data. Baselines
  decide shipping; Coach's marks tune vocabulary and the missed-level
  review — the two ground truths are never mixed.
- **SA-L10 Neutral encoding.** No directional or traffic-light coloring
  of objects — no green floors, no red ceilings. Location, weight, and
  class are encoded by position, line weight, and a legend. No
  notifications or contact alerts in any phase of this service; alerting
  is a separate product under Analyzer alert law.
- **SA-L11 The map shows the whole territory.** Every phase of the app
  renders the full product arc as first-class, visible surface:
  navigation names Exploration (click-drag), Replay (TPO/market
  profile), Footprint & Market Delta, GEX Overlay, and
  Characterization from day one, each in an honest named state —
  IN DEVELOPMENT, with one line of doctrine on what it will be — never
  hidden, never fake data, never an empty widget. Schema reserves
  future fields unserved. The Help/Wiki seed carries the entire
  doctrine and arc from first publish. Removing or hiding a future
  entry is a spec violation, not a simplification.
- **SA-L12 No day-typing.** Per §1a: session shapes are never
  classified or predictive; levels are never attributed to the session
  that built them; session markers are vertical time context only and
  never a detection input.

## 3. Ontology

rows → shelves → **nodes / edges / crevasses** → **groupings**

- **Shelf** — a run of rows at consistent volume (detection primitive).
- **Node** — a region of high shelves, possibly spanning internal
  crevasses; carries full attributed volume (SA-L2).
- **Edge** — the boundary where a node's volume falls away sharply; the
  primary published level-like object. "Long" edges: only nodes of
  sufficient width publish edges. (Alias absorbed from source doctrine:
  "cliff".)
- **Crevasse** — a sharp, narrow volume void: **intra-node** (the node
  continues across it) or **inter-node** (separates nodes within a
  grouping). (Aliases absorbed: "crevice", "well".)
- **Grouping** — a set of nodes bounded by the deepest severity class of
  void. The working set: "the grouping containing spot" is the daily
  retrieval for a 0DTE strategy. Crevasse severity is the dividing
  principle at both scales — ordinary crevasses divide nodes within a
  grouping; boundary-class voids divide groupings (grading: SA-Q2).
- **Child node** — a smaller node forming *adjacent* to (not inside) an
  established parent, as price finds new value and fills it in.
- **Appendage / temporary shelf** — a forming feature not yet
  established enough to count as a node. **Provisional features get no
  line treatment** until promoted. Promotion criteria — how
  established, how often revisited, how big, whether it served as a
  stepping stone — are quantified from the §9 corpus (SA-Q8); whether
  provisional features additionally need on/off hysteresis is SA-Q9.
- **Uncharted region** — per SA-L7.

## 4. Detection procedure (DRAFT — carried verified from VP round 3)

Runs on the eligible histogram at `vp_row`; for every ratio test a row's
volume is evaluated as max(volume, 1).

4.1 **Segmentation.** Greedy, low → high price. A run extends while the
next row is within factor `sa.shelf_band = 2.0` (×/÷, inclusive) of the
run's median (recomputed as it grows; even count → mean of middle two).
Runs ≥ `sa.shelf_min_rows = 3` are shelves; shorter runs are transitions.
4.2 **Edge.** Nearest shelf pair with higher median ≥
`sa.edge_contrast = 3.0` × lower and ≤ `sa.edge_span_max = 3` transition
rows between → edge at the outermost row of the higher shelf, facing the
lower — **the heavy tick**: an edge's served price is always the
high-volume side of the transition, never the empty tick or a midpoint
(alignment with source doctrine recorded). Attributes: price, direction,
contrast, span. A gradual climb — successive rows each breaking the
band — publishes nothing.
4.3 **Crevasse.** A low run of width ≤ `sa.crevasse_max_rows = 4` whose
flanking shelves are each ≥ `sa.edge_contrast` × its median. DRAFT tag
rule (SA-Q1): width ≤ `sa.crevasse_intra_max_rows = 2` → intra-node, else
inter-node.
4.4 **Node.** Maximal region of high shelves + intra-node crevasses,
bounded by published edges, width ≥ `sa.node_min_rows = 5`.
4.5 **Owed refinements (SA-Q4, from Grok R5):** total elimination order
when 3+ overlapping candidates compete; plateau collapse even-count tie.
Both must be written as procedures before any fixture beyond F1 is
authored.

All thresholds are versioned parameters with DRAFT values, settled
against fixtures, not decided.

## 5. Attribution

Per-node volume = VP `/range` over the node's price band, full archive
depth, in the coherent accumulation space (target space for futures
sources, per VP §6 roll-coherence law). First-touch per row is derived
from the archive and published as node metadata. **Open (SA-Q3):**
whether volume decays or annotates by age when price revisits year-old
structure — decided together with SA-Q7 when a fixture forces them.

## 5a. Symbol emphasis and dual-source XSP (Coach tick, VPB-Q2 = BOTH)

**ES→SPX is the primary pair** — the flagship terrain for the house
0DTE instrument. **XSP is dual-source:** SPY→XSP (cash-market RTH
evidence) and MES→XSP (futures-family Globex coverage) are BOTH
analyzed, as separate source-tagged level sets, never silently merged.
Independent appearance of a level in both sources is corroboration —
two different crowds leaving the same footprint — and a natural future
characterization input (§8b). Presentation of dual-source XSP
(source-tagged sets, a corroborated union view, or a member default
with toggle) is **SA-Q10**, settled with fixtures.

## 6. Incremental operation

Analysis state is global and maintained incrementally as VP publishes new
histograms; a strategy-scoped request is a server-side selection of
already-computed objects. Detection re-runs are driven by volume change
in affected rows, not by requests.

## 7. Viewport (presentation layer)

- A **strategy profile** (registry: SA-Q6, likely the house strategy
  catalog) carries per-side reach constants — for 0DTE, `k ≈ 3` with a
  fat-tail cushion, asymmetric (put-side wider, priced off skew).
- Bounds each session: per-side k·σ_day derived from the session's chain
  (ATM straddle / VIX1D via ChainStore) at the morning routine.
- **Snap outward** to the nearest grouping boundary — never inward, never
  through structure; a node is shown whole or not at all. (Worked
  example, 2026-09-16: 0DTE proposal ~7330–7430 on ES-mapped terrain
  snaps to ~7200, the void beneath the 7300 complex.)
- A breach costs a re-crop only: the next grouping is already computed
  and attributed (SA-L3). Small vol wobbles inside the same void do not
  move the snapped bound — display stability is a feature.

## 8. Member surface (the app) — per Q10 = (b), DL-714, and Coach
Decision 1 (2026-09-17)

This section is the surface law **AZ-VP-9-A1**
(Specs/amendments/AZ-VP-9-A1.md, sha in the DL) binds to; no surface
work may cite AZ-VP-9 without that amendment.

- **Decision 1, closed:** Options Lab is the product's home. The member
  volume profile surface renders this service's objects over the price
  axis. Raw bins remain on the data end (StudioOne) and are available
  only through the VP service's API to entitled computing consumers
  (VP-L18) — availability is an API contract; member visibility is this
  surface law, and no member surface renders raw bins.
- Rendered objects: edges (primary, by line weight from contrast),
  crevasse spans, node spans as shaded context, grouping boundaries,
  uncharted regions labeled as such. **Location legend (neutral, per
  SA-L10):** four classes carry the structure by themselves even on a
  5-minute chart — node floor (thick), node ceiling (thick),
  internodal crevasse/cliff (thin), intranode crevasse/cliff (thin) —
  distinguished by weight and legend position, hues non-directional,
  mechanism never encoded. Caps and z-order fixed with fixtures;
  beneath GEX overlays; no shared color semantics with GEX.
- **Session markers:** vertical time context (morning / afternoon /
  close) sourced from the **Sessions tool** in FatTail Labs Resources
  — the single source of session boundaries. Never an attribution of
  which session built a level, never a detection input (SA-L12).
- **Full-scope navigation (SA-L11):** the canvas names every §8a phase
  from day one, IN-DEVELOPMENT entries with one doctrine line each.
- Viewport per §7 is the default view — the grouping containing spot,
  cropped by the member's active strategy profile; a wider look is a
  deliberate action, still served from precomputed structure.
- Provenance passthrough: source instrument, mapping age/STALE badge,
  approximation and gap flags from VP payloads render on every surface.
  Caption, verbatim and only this:
  > Structure computed from traded volume ({source} prints, mapped to
  > {target}). Not a forecast.
- States in the VP §7 style (status + flags); a gapped or stale upstream
  names itself on the canvas — no blank panes, no silent staleness.

## 8a. Phase roadmap (normative; rendered per SA-L11)

- **Phase 1 — Lines.** Detection, structure API, the Options Lab
  canvas per §8, Strategy Lab consumer. Ships behind SA-L9's gate.
- **Phase 2 — Exploration.** Click-and-drag over price/date translates
  to VP `/range` queries surfaced through this service. **Pane content
  is SA-Q11 (Coach C-1):** objects-only summary per current law
  (VP-L18), or a narrow, member-visible slice-histogram exception —
  undecided; the law stands as objects-only until Coach's word.
- **Phase 3 — Replay.** TPO / market-profile replay views of how a
  session unfolded — useful precisely because a volume profile
  flattens time away; never day-typing (SA-L12). Data requirement
  already satisfied: prints stored with timestamps.
- **Phase 4 — Footprint & Market Delta.** The Market Profile survivor:
  bid/ask-classified volume per price per bar, measuring aggression.
  **Data note:** delta requires bid/ask context at print time; the
  current futures capture stores trades only, so this phase adds a
  quotes/NBBO capture beside the trades collector (an Ingest
  extension, planned for — raw prints with timestamps already kept —
  never a redesign).
- **GEX Overlay.** GEX (fast layer, repositioning daily) rendered
  side by side with structure (slow layer, built over months) — the
  honeybees and the honeycomb. Side-by-side legibility only; a
  disagreement alert is a forecast and a third product — permanently
  out of scope here.
- **Characterization** — §8b, served only after §12a populates it.

## 8b. Characterization stage (post-study; schema-reserved, unserved)

Each level will carry a **probability distribution** over behavior at
it — where price tends to stop, how far through it runs, how often it
fails. Explicitly **not a confidence score**: a single number implies
calibration the evidence does not support and invites members to trade
it as such. Candidate inputs: geometric strength (contrast, sharpness);
test history; age and survival; **provenance** — a node built by one
capitulation day vs thirty quiet days of accumulation should behave
differently on retest (weighting: SA-Q12; the §11 literature informs
it); dual-source corroboration (§5a). Measuring touch/fail/through
requires price action, which detection forbids — characterization is a
separate downstream measurement stage, never a detection input. Fields
are defined in the schema and **absent from payloads until the §12a
study populates them**; consumers rendering empty slots would be
theater.

## 9. Calibration corpus (protocol)

- Coach marks levels on reference charts (format: symbol, date,
  price/span, his term for the object, one-line reasoning), stored under
  the board as the calibration corpus. **Scale: dozens of marked
  profiles across regimes** (trending, balanced, post-gap) — a handful
  is explicitly not enough.
- Corpus use: tune vocabulary mapping and the missed-level review; seed
  SA-Q1/SA-Q2/SA-Q8 thresholds. Corpus never substitutes for SA-L9's
  baseline test — ship/no-ship is the pre-registered baseline study
  alone. **Asymmetry rule:** beats the eye but not the baselines —
  does not ship; beats the baselines but misses the eye — ships, with
  the divergence reviewed and documented.
- The 2026-09-16 chart set (§11) forms the corpus's first three entries.

## 10. Open questions

- **SA-Q1** Intra vs inter crevasse: width rule (DRAFT ≤ 2 rows), flank
  similarity, or both — Coach's read.
- **SA-Q2** Severity grading: what promotes a void to a grouping
  boundary (depth × width relative to flanking nodes) — Coach
  calibration, then F3. Reference case: the 7450–7500 gap vs the
  shallower crevasses above it.
- **SA-Q3** Recency on revisit (§5) — deferred until a fixture forces
  it; decided with SA-Q7.
- **SA-Q4** Detection total-order refinements (§4.5) — owed before
  fixtures beyond F1.
- **SA-Q6** Strategy-profile registry: where k and per-side reach live —
  lean: the admin-versioned house strategy catalog.
- **SA-Q7** Deep-history display normalization: attributed volume across
  eras mixes contract-size notional drift, row-count geometry, and the
  futures→options migration — display raw contracts, notional-normalized,
  or era-relative weight? Capture stays raw contracts regardless
  (VP-L14); this is display-time only. Decided with SA-Q3.
- **SA-Q8** Child-node promotion criteria — quantified from the corpus
  (established / revisited / size / stepping-stone), thresholds
  versioned.
- **SA-Q9** Provisional-feature hysteresis: is no-line-until-promoted
  sufficient, or do forming features need a sticky on/off rule?
- **SA-Q10** Dual-source XSP presentation (§5a): source-tagged sets,
  corroborated union, or default-with-toggle — fixtures decide.
- **SA-Q11 (Coach C-1, open)** Exploration pane content: objects-only
  summary per VP-L18, or a narrow member-visible slice-histogram
  exception. Law stands as objects-only until Coach's word.
- **SA-Q12** Provenance weighting in characterization (§8b) — informed
  by the §11 literature and the study data.
- *Resolved:* SA-Q5 — by Q10 = (b) (DL-714) and Coach Decision 1; the
  surface law is §8 of this document. VPB-Q2 — BOTH (§5a).

## 11. Reference material

Coach's 2026-09-16 ES/VRVP chart set: (1) the 7688 deep crevasse between
nodes read live as resistance; (2) node re-weighting as date range
extends — the honest component (full volume arriving) vs the artifact
(VRVP re-binning to the visible range, which SA-L8 forbids); (3) the
widest view: resolution smearing, the recency question, and uncharted
terrain above ~7750. Worked example: the 0DTE viewport pipeline in §7.
Source documents (reclassified):
Specs/sources/Structure-Doctrine-Voice-Session-2026-09-16.md (DL-712)
and its v1.2-draft revision — keepers absorbed; strikes recorded there
and carried as SA-L10 and the §1 forbidden list; the draft's
basis/mapping delivery gate aligns with VP-L10/L17 and lives as a VP
fixture concern.

**Research agenda (adjacent evidence, never validation; feeds §8b and
Help/Wiki):** Mandelbrot — long-range dependence, Hurst, fractal
market structure (*The (Mis)Behavior of Markets*) — relevant to why
structure compounds; long memory is not a license for any no-mapping
shortcut. Chung & Bellotti (arXiv 2101.07410) — S/R levels reverse
trends with statistical significance; more prior bounces → more likely
to bounce; memory decays slowly in stock markets. Garzarelli et al.
(Sci. Rep. 4:4487) — re-bounce exceeds crossing; self-fulfilling
dynamics complementing (not replacing) the §1a inventory mechanism.
Both study price-defined S/R, not volume-prominence structure —
supportive context, validating no detector here. To pursue:
provenance literature (concentrated vs dispersed accumulation and
retest behavior, → SA-Q12); currencies as the persistence proving
ground (bounded ranges revisit the same levels for decades); time ×
price correlation (no asserted direction); **node birth** — how a
level that looks like ordinary price action on the day it forms
persists for years — a learning tool and content angle.

## 12. Fixtures

**F1 — detection tape (verified, from VP R3).** 34 rows, 640.00–643.30 ×
0.10: `18 22 20 19 21 20 | 70 | 290 310 300 285 305 295 300 | 28 25 30 |
240 260 250 | 60 55 | 255 245 250 | 22 19 20 21 18 20 | 45 85 170`.
Expected: edges 640.70 (↑A, 15.00), 641.30 (A↓, 10.71), 641.70 (↑B,
8.93), 642.40 (B↓, 12.50); inter-node crevasse 641.40–641.60 (floor 28);
intra-node crevasse 642.00–642.10 (floor 57.5); Node A 640.70–641.30
(median 300), Node B 641.70–642.40 (median 250, spanning the intra
crevasse); terminal climb 45/85/170 publishes nothing.
**F2 — window invariance.** Detection on rows 0–27 and rows 3–33 of F1
reproduces every interior object byte-identically.
**Owed:** F3 grouping/severity (blocked by SA-Q2) · F4 attribution +
first-touch over a two-session archive slice · F5 viewport snap
(strategy bound inside a void → outward boundary) · F6 uncharted region ·
F7 the SA-Q4 total-order cases · F8 = the §12a protocol, committed as
JSON · F9 retirement: an edge present in generation G and absent in
G+1 appears in the generation diff as RETIRED with both generation ids.

## 12a. F8 — Baseline ship-gate protocol (SA-L9, written per SA-A1)

All values below are versioned DRAFT parameters; they are settled and
then **frozen at registration** — after registration nothing in this
protocol may change for that study.

- **Level sets compared.** SA = this service's published edges (and
  inter-node crevasse floors) for the session, generation as of 09:30
  ET. Baseline-R = round numbers on the target scale (SPX multiples of
  25, with 50/100 as a sub-set; XSP ÷10). Baseline-P = prior RTH
  session's high, low, and close. Baselines are computed by fixed
  formula, no tuning.
- **Touch.** First trade within ± `f8.touch_tol = 1 × vp_row` of a
  level, per level, per session; subsequent touches of the same level
  ignored for that session.
- **Reaction metric.** For each touch, over the following
  `f8.window = 30 min`: MFE = max excursion away from the level on the
  approach's opposing side; MAE = max excursion through the level.
  Score per touch = MFE / max(MAE, 1 row). Session score per level
  set = median of touch scores. No served vocabulary is derived from
  this metric; it exists only inside the study (SA-L5 governs labels,
  not validation math).
- **Holdout.** A NAMED date range of RTH sessions, written into the
  registration before any evaluation run, disjoint from: every session
  used in parameter calibration, every session in the §9 corpus, and
  every session any fixture was cut from. DRAFT shape: two blocks —
  one historical (from backfill, ≥ 40 sessions) and one forward (the
  next `f8.forward_sessions = 20` RTH sessions after registration).
- **Ship rule.** SA ships only if its holdout score exceeds BOTH
  baselines by ≥ `f8.margin = 15%`, with a bootstrap 95% confidence
  interval on the difference excluding zero, on each holdout block
  separately. Anything less is NO-SHIP regardless of how the corpus
  review reads.
- **Registered-at mechanics.** The protocol instance (all parameters,
  the named holdout dates, the SA parameter-set hash under test) is
  committed as JSON under the board, its sha logged in the DL, BEFORE
  the first evaluation run. Runs cite the registration sha. A change
  to any value = a new registration and a fresh forward block.
- **Misses recorded regardless.** Every touch, score, and per-level
  outcome lands in the study record whether the gate passes or fails;
  the corpus review (§9) reads the misses — it never edits the gate.

## 13. API sketch (v1, to firm up in review)

```
GET /v1/structure/{target_symbol}?price_lo=&price_hi=&as_of=
GET /v1/structure/{target_symbol}/viewport?strategy=&as_of=
GET /v1/structure/{target_symbol}/generations?from=&to=
GET /v1/health
```

Objects: groupings[] {span, boundary_voids}, nodes[] {span, attributed
volume, first_touch, median, source_tag}, edges[] {price, direction,
location_class, contrast, span}, crevasses[] {span, floor, flanks,
tag}, uncharted[] {span}, plus identity block, provenance passthrough
from VP payloads, and status + flags in the VP §7 style.
`location_class` ∈ node-floor | node-ceiling | internodal | intranode
(the §8 legend taxonomy). **Characterization fields (§8b) are defined
in the schema and absent from payloads until §12a populates them.**
**Retirement recording:** each generation publishes a diff against its
predecessor; objects no longer detected are recorded RETIRED with both
generation ids — structure never silently disappears, and /generations
serves the record. Caps and ordering set with fixtures. No verbs in
labels. No alert or notification endpoints exist in this service
(SA-L10).

## 14. Round log

- Seeded from VP spec rounds 3–10; v0.1 landed DL-711; R2 voice-session
  reclassified (DL-712), lineage corrected (DL-713), Q10 ticked
  (DL-714); v0.2 — app-end positioning, §8 surface law, SA-L9/L10,
  corpus protocol, SA-Q7; v0.3 — Decision 1 closed, heavy-tick edges,
  retirement recording; v0.3.1 — Advisor round-1 fixes (§12a protocol,
  AZ-VP-9-A1 binding).
- v0.4 — this document, the AUTHORED version replacing the board's
  directive pointer (DL-728): SA-L11 map-shows-whole-territory;
  SA-L12 no day-typing; §1a doctrine (inventory persistence, lineage
  critique); child/appendage/promotion ontology (SA-Q8/Q9); §5a
  dual-source XSP (VPB-Q2 = BOTH; SA-Q10); §8 legend + Sessions-tool
  markers; §8a phase roadmap (Exploration with SA-Q11 open, Replay,
  Footprint + quotes-capture note, GEX side-by-side, Characterization);
  §8b characterization stage (SA-Q12); §11 research agenda; corpus
  scale + asymmetry rule; Runner named. Advisor round 2 (in flight vs
  v0.3.1) dispositions into v0.4.1 or is confirmed absorbed. Open
  Coach words: SA-Q11 (C-1) and the member-facing product name.
