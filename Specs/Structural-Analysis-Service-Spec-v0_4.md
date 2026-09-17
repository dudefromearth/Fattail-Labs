# Structural Analysis Service — Spec v0.4

**Status:** DRAFT — contract close for review. NOT BUILD. Not on the VP
service's critical path (VPS2/VPSB proceed independently). **SA-L11 is
binding on all surface work now** (including APPS Act 3 / the dev canvas).
**Date:** 2026-09-17
**Supersedes:** Structural-Analysis-Service-Spec-v0_3.md
**Parent contract:** Volume-Profile-Service-Spec-v0_6 — this service is a
**computing consumer** of `/v1/profile` and `/v1/profile/.../range`. It
never touches Ingest or raw prints; the histogram is its only input.
**Position:** the VP service is the **data end** of the volume profile
stack; this service is the **app end** — the member-facing product.
**Host:** compute on Dude two (farm plan); the member surface ships
inside FatTail Labs (Options Lab), consuming this service's API.

## Change table (v0.3 → v0.4)

| Source | Change | Where |
|---|---|---|
| Coach directive (2026-09-17), verbatim intent: "the future scope of the structure app must never be lost — the current app must make the full breadth apparent" | **SA-L11** ("the map shows the whole territory"): Replay, Footprint / Market Delta, GEX Overlay, Characterization, and Exploration are first-class navigation entries in honest **IN-DEVELOPMENT** named state with doctrine text — no fake data, no empty widgets, no hiding; schema fields reserved unserved; Help/Wiki seed carries the whole arc from first publish. Binding on all surface work now | §2, §8, §11, §13 |

## 0. Position in the stack

Part four — the app end. The VP service owns capture and histograms
(data end; raw bins available only through its API per VP-L18); this
service owns everything derived — nodes, edges, crevasses, groupings,
the strategy-scoped viewport — and the member application built on
them. The analysis vocabulary forbidden in VP labels (VP-L1) lives
here. Rendering consumers render this service's bytes and never
re-derive (inherits the VP-L2 pattern).

## 1. Purpose

The service publishes **where traded volume changes significantly** — the
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
- **SA-L11 The map shows the whole territory.** The future scope of the
  structure app must never be lost — the current app must make the full
  breadth apparent. Replay, Footprint / Market Delta, GEX Overlay,
  Characterization, and Exploration are **first-class navigation
  entries** from first publish, each in an honest **IN-DEVELOPMENT**
  named state with doctrine text. No fake data, no empty widgets, no
  hiding those entries. Schema fields for unshipped views are
  **reserved unserved**. Help and Wiki seed the whole arc from first
  publish. Binding on all surface work now (including DEV-ONLY canvases).

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

This section is the surface law AZ-VP-9's amendment binds to.

- **Decision 1, closed:** Options Lab is the product's home. The member
  volume profile surface renders this service's objects over the price
  axis. Raw bins remain on the data end (StudioOne) and are available
  only through the VP service's API to entitled computing consumers
  (VP-L18) — availability is an API contract; member visibility is this
  surface law, and no member surface renders raw bins.
- Rendered objects (Structure view, shipping): edges (primary, by line
  weight from contrast), crevasse spans, node spans as shaded context,
  grouping boundaries, uncharted regions labeled as such. Caps and
  z-order fixed with fixtures; when GEX Overlay ships, structure sits
  beneath it (composition law, not a license to paint a fake overlay
  now); no shared color semantics with GEX; encoding per SA-L10.
- Viewport per §7 is the default Structure view — the grouping
  containing spot, cropped by the member's active strategy profile; a
  wider look is a deliberate action, still served from precomputed
  structure.
- Provenance passthrough: source instrument, mapping age/STALE badge,
  approximation and gap flags from VP payloads render on every surface.
  Caption, verbatim and only this:
  > Structure computed from traded volume ({source} prints, mapped to
  > {target}). Not a forecast.
- States in the VP §7 style (status + flags); a gapped or stale upstream
  names itself on the canvas — no blank panes, no silent staleness.

### 8.1 Navigation map (SA-L11)

The current app makes the full breadth apparent. Every entry below is a
**first-class navigation entry** — always present, never hidden, never
replaced by an empty widget or invented marks.

| Entry | State | Doctrine (shown with the named state; not a ship) |
|-------|--------|---------------------------------------------------|
| **Structure** | Shipping (this spec's §7–§8 objects) | Nodes, edges, crevasses, groupings, uncharted — terrain context for defined-risk structures. |
| **Replay** | **IN-DEVELOPMENT** | How a session unfolded in time — a volume profile flattens that away. Market-profile / TPO-style replay. Not live until capture time-resolution is confirmed to support brackets. |
| **Footprint / Market Delta** | **IN-DEVELOPMENT** | Bid/ask-classified volume at each price inside a time-sliced bar. The Market Profile lineage that survives the doctrine filter (aggression, not a named shape). No fabricated delta. |
| **GEX Overlay** | **IN-DEVELOPMENT** | GEX (fast, daily) beside structure (slow) for legibility. A disagreement *alert* would be a forecast and a third product — out of scope (SA-L5 / SA-L10). |
| **Characterization** | **IN-DEVELOPMENT** | Distributions over published objects (provenance, recency, test-history). Build the view; let the data speak. No forecast language (SA-L5). |
| **Exploration** | **IN-DEVELOPMENT** | Click-and-drag over price/date translates to VP `/range` queries surfaced through this service; objects-first, this service's summary, not raw bins (VP-L18). (Absorbs v0.3 §8 "Phase 2 — bounded exploration.") |

**IN-DEVELOPMENT** is an honest named state: the entry is reachable, the
doctrine text is readable, and **no data is invented** to fill the
pane. Schema keys for these views exist as **reserved unserved** (§13).
Hiding an entry "until it is ready" is a SA-L11 violation. Filling it
with placeholder charts or empty frames is a SA-L11 violation. Binding
on production Options Lab **and** DEV-ONLY canvases (SA-DEV Act 3).

## 9. Calibration corpus (protocol)

- Coach marks levels on reference charts (format: symbol, date,
  price/span, his term for the object, one-line reasoning), stored under
  the board as the calibration corpus.
- Corpus use: tune vocabulary mapping and the missed-level review; seed
  SA-Q1/SA-Q2 thresholds. Corpus never substitutes for SA-L9's baseline
  test — ship/no-ship is the pre-registered baseline study alone.
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
- *Resolved:* SA-Q5 — by Q10 = (b) (DL-714) and Coach Decision 1; the
  surface law is §8 of this document.

## 11. Reference material

Coach's 2026-09-16 ES/VRVP chart set: (1) the 7688 deep crevasse between
nodes read live as resistance; (2) node re-weighting as date range
extends — the honest component (full volume arriving) vs the artifact
(VRVP re-binning to the visible range, which SA-L8 forbids); (3) the
widest view: resolution smearing, the recency question, and uncharted
terrain above ~7750. Worked example: the 0DTE viewport pipeline in §7.
Source documents (reclassified):
Specs/sources/Structure-Doctrine-Voice-Session-2026-09-16.md (DL-712)
and its v1.2-draft revision (this round) — keepers absorbed; strikes
recorded there and carried as SA-L10 and the §1 forbidden list; the
draft's basis/mapping delivery gate aligns with VP-L10/L17 and lives as
a VP fixture concern. v1.2-draft §13 Phase 2 (replay, footprint / market
delta, GEX fusion) and §10 characterization are the **doctrine seed**
for SA-L11's IN-DEVELOPMENT entries — not a license to ship those views
from this round.

**Help / Wiki seed (SA-L11, from first publish).** Help and Wiki carry
the whole arc, not only the shipping Structure view: Structure (live
terrain) · Replay · Footprint / Market Delta · GEX Overlay ·
Characterization · Exploration. Each unshipped entry is documented as
**IN-DEVELOPMENT** with the doctrine sentence in §8.1 — never omitted,
never described as if live. Sierra / Help Watch: the structure-app Help
packet seeds this map; Wiki Follow inherits it. A Help page that only
describes today's canvas is incomplete.

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
F7 the SA-Q4 total-order cases · F8 baseline-study protocol
pre-registration (SA-L9) · F9 (new) retirement: an edge present in
generation G and absent in G+1 appears in the generation diff as
RETIRED with both generation ids.

## 13. API sketch (v1, to firm up in review)

```
GET /v1/structure/{target_symbol}?price_lo=&price_hi=&as_of=
GET /v1/structure/{target_symbol}/viewport?strategy=&as_of=
GET /v1/structure/{target_symbol}/generations?from=&to=
GET /v1/health
```

Objects: groupings[] {span, boundary_voids}, nodes[] {span, attributed
volume, first_touch, median}, edges[] {price, direction, contrast, span},
crevasses[] {span, floor, flanks, tag}, uncharted[] {span}, plus identity
block, provenance passthrough from VP payloads, and status + flags in
the VP §7 style. **Retirement recording:** each generation publishes a
diff against its predecessor; objects no longer detected are recorded
RETIRED with both generation ids — structure never silently disappears,
and /generations serves the record. Caps and ordering set with fixtures.
No verbs in labels. No alert or notification endpoints exist in this
service (SA-L10).

**Reserved unserved (SA-L11).** The v1 payload schema reserves, and does
not serve, keys for the unshipped views: `replay`, `footprint` /
`market_delta`, `gex_overlay`, `characterization`, `exploration`.
Presence in the schema is the reservation; values are omitted or named
`UNSERVED` until a later spec versions them live. A client must not
invent bytes for a reserved key. Serving fake series into these keys is
a SA-L11 violation.

## 14. Round log

- Seeded from VP spec rounds 3–10; v0.1 landed DL-711; R2 voice-session
  reclassified (DL-712), lineage corrected (DL-713), Q10 ticked
  (DL-714); v0.2 — app-end positioning, §8 surface law, SA-L9/L10,
  corpus protocol, SA-Q7.
- v0.3 — Decision 1 closed by Coach's architecture sentence (bins on
  the data end via API; member surfaces render these objects);
  heavy-tick edge pricing explicit; generation retirement recording
  (§13, F9); v1.2-draft retired to sources with dispositions.
- v0.4 — this document: **SA-L11** (Coach, 2026-09-17) — the map shows
  the whole territory; future views are first-class **IN-DEVELOPMENT**
  navigation with doctrine text; reserved unserved schema; Help/Wiki
  seed of the whole arc from first publish. Binding on all surface work
  now. Detection procedure unchanged from v0.3. Next: Grok review
  (triple pre-flight per house rule), Coach calibrations SA-Q1, SA-Q2;
  on review PASS, Juliet authors the SA bench plan (the app build
  board), UNSTAMPED.
