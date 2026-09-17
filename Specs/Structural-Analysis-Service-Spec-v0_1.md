# Structural Analysis Service — Spec v0.1

**Status:** DRAFT — first cut for review. NOT BUILD. Not on the VP
service's critical path; the VP spec stamps and builds independently.
**Date:** 2026-09-16
**Supersedes:** none (initial version; seeded from VP spec rounds 3–10 —
the v0.3 detection fold-in, retracted as scope, is this document's
ancestor).
**Parent contract:** Volume-Profile-Service-Spec-v0_5 — this service is a
**computing consumer** of `/v1/profile` and `/v1/profile/.../range`. It
never touches Ingest or raw prints; the histogram is its only input.
**Host:** Dude two (compute tier per the farm plan). **Consumers:**
Options Lab canvas, heatmap overlay, Analyzer overlay, Strategy Lab, IKI
templates — all rendering consumers of this service's objects.

## 0. Position in the stack

Part four. The VP service owns capture and histograms; this service owns
everything derived: nodes, edges, crevasses, groupings, and the
strategy-scoped viewport. The analysis vocabulary forbidden in VP labels
(VP-L1) lives here. Rendering consumers render this service's bytes and
never re-derive (inherits the VP-L2 pattern).

## 1. Purpose

The service publishes **where traded volume changes significantly** — the
long edges of volume nodes, and the crevasses between and within them —
grouped into the working sets a trader's strategy actually needs, as
terrain context for positioning defined-risk structures.

Classic profile measures (POC, value areas, VWAP-anchored levels) are
permanently out of scope: properties of a cropped window, not of the
market. This service publishes only features of the distribution itself.

**Allowed nouns** in served labels: volume, node, edge, crevasse, shelf,
base, floor, contrast, width, grouping, uncharted, session, source,
basis, gap. Forbidden: POC, value area, VAH, VAL, VWAP, HVN, LVN,
rotation, break, magnet, target, support, resistance, or any verb
assigning future behavior to a level (SA-L5).

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

## 3. Ontology

rows → shelves → **nodes / edges / crevasses** → **groupings**

- **Shelf** — a run of rows at consistent volume (detection primitive).
- **Node** — a region of high shelves, possibly spanning internal
  crevasses; carries full attributed volume (SA-L2).
- **Edge** — the boundary where a node's volume falls away sharply; the
  primary published level-like object. "Long" edges: only nodes of
  sufficient width publish edges.
- **Crevasse** — a sharp, narrow volume void: **intra-node** (the node
  continues across it) or **inter-node** (separates nodes within a
  grouping).
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
lower. Attributes: price, direction, contrast, span. A gradual climb —
successive rows each breaking the band — publishes nothing.
4.3 **Crevasse.** A low run of width ≤ `sa.crevasse_max_rows = 4` whose
flanking shelves are each ≥ `sa.edge_contrast` × its median. DRAFT tag
rule (SA-Q1): width ≤ `sa.crevasse_intra_max_rows = 2` → intra-node, else
inter-node.
4.4 **Node.** Maximal region of high shelves + intra-node crevasses,
bounded by published edges, width ≥ `sa.node_min_rows = 5`.
4.5 **Owed refinements (from Grok, R5):** total elimination order when 3+
overlapping candidates compete; plateau collapse even-count tie. Both
must be written as procedures before any fixture beyond F1 is authored
(SA-Q4).

All thresholds are versioned parameters with DRAFT values, settled
against fixtures, not decided.

## 5. Attribution

Per-node volume = VP `/range` over the node's price band, full archive
depth, in the coherent accumulation space (SPX space for futures sources,
per VP §6 roll-coherence law). First-touch per row is derived from the
archive and published as node metadata. **Open (SA-Q3):** whether volume
decays or annotates by age when price revisits year-old structure — full
attribution and recency-weighting converge at all-time highs (no old
volume exists in the active band) and diverge only on deep retracement;
the archive supports either answer and the decision is deferred until a
fixture forces it.

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

## 8. API sketch (v1, to firm up in review)

```
GET /v1/structure/{target_symbol}?price_lo=&price_hi=&as_of=
GET /v1/structure/{target_symbol}/viewport?strategy=&as_of=
GET /v1/health
```

Objects: groupings[] {span, boundary_voids}, nodes[] {span, attributed
volume, first_touch, median}, edges[] {price, direction, contrast, span},
crevasses[] {span, floor, flanks, tag}, uncharted[] {span}, plus identity
block, mapping/provenance passthrough from VP payloads, and status +
flags in the VP §7 style. Caps and ordering to be set with fixtures. No
verbs in labels.

## 9. Fixtures

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
F7 the SA-Q4 total-order cases.

## 10. Open questions

- **SA-Q1** Intra vs inter crevasse: width rule (DRAFT ≤ 2 rows), flank
  similarity, or both — Coach's read.
- **SA-Q2** Severity grading: what promotes a void to a grouping
  boundary (depth × width relative to flanking nodes) — Coach
  calibration, then F3.
- **SA-Q3** Recency on revisit (§5) — deferred until a fixture forces it.
- **SA-Q4** Detection total-order refinements (§4.5) — owed to Grok.
- **SA-Q5** Interplay with VP Q10: if members never see raw bins, this
  service's objects are the only member-facing surface, and the surface
  spec lands here.
- **SA-Q6** Strategy-profile registry: where k and per-side reach live —
  lean: the admin-versioned house strategy catalog.

## 11. Reference material

Coach's 2026-09-16 ES/VRVP chart set: (1) the 7688 deep crevasse between
nodes read live as resistance; (2) node re-weighting as date range
extends — the honest component (full volume arriving) vs the artifact
(VRVP re-binning to the visible range, which SA-L8 forbids); (3) the
widest view: resolution smearing, the recency question, and uncharted
terrain above ~7750. Worked example: the 0DTE viewport pipeline in §7.

## 12. Round log

- Seeded from VP spec rounds 3–10: v0.3 detection fold-in (retracted as
  VP scope, ancestor of this file); Coach doctrine rounds — transitions
  ontology, window invariance, full attribution, first-touch, groupings,
  analyze-everything/show-by-strategy, k·σ viewport with outward snap.
- v0.1 — this document, first standalone cut. Next: Grok review (with
  file-completeness pre-flight and shasum per house rule), and Coach
  calibrations SA-Q1, SA-Q2.
