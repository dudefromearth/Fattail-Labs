# Volume Profile Service — Spec v0.4

**Status:** DRAFT — contract close, scope corrected. NOT BUILD.
**Date:** 2026-09-16
**Supersedes:** Volume-Profile-Service-Spec-v0_3.md
**Host:** StudioOne. **Parts:** Ingest / Engine / API.

## Change table (v0.3 → v0.4, keyed to Coach directive C4)

| Directive | Change | Where |
|---|---|---|
| C4 — structural analysis is the **fourth part**, a separate downstream service, not yet commissioned | All detection removed from this service: §5.2–5.6 procedures, edges/crevasses/nodes, VP-L17, /structure endpoint, F1/F2 detection fixtures, Q11. Parked as seed material for the Structural Analysis Service spec, on request. This service's product is the **histogram** | §0, §5, §8, §10 |

Consequences: consumer model gains two classes (§0); Q6 and Q7 reworded to
histogram-level questions (§12); STRUCTURE_UNPUBLISHED state removed (§7);
allowed nouns reduced to bin vocabulary (§1). Carried unchanged: Ingest
(§4), mapping mechanics (§6), states, as-of replay, identity block,
parents/SoR/migration, F4–F7, Q1/Q2/Q4/Q5/Q8/Q10, stamp-gate structure.

---

## 0. Shape

Three parts, independently testable and restartable; Engine reads only what
Ingest wrote; API reads only what Engine wrote (VP-L7).

1. **Volume Ingest** — captures trade prints for volume-source instruments.
2. **Profile Engine** — builds finest-resolution volume-at-price histograms
   (session, composite, developing) and the source→target mapping.
3. **Profile API** — serves histograms and health.

**Consumer classes:**
- **Computing consumers** — the Structural Analysis Service (part four,
  future spec; computes nodes, crevasses, and structural levels from these
  histograms) and Strategy Lab research. They may derive.
- **Rendering consumers** — Options Lab canvas, heatmap, Analyzer. They
  render served bytes and never re-bin, re-map, or derive (VP-L2).

## 1. Purpose

The service captures and serves **volume at price, at the finest honest
resolution**, per instrument, per window — the substrate every structural
read is built on. It publishes no analysis, no levels, and no classic
profile measures: POC, value areas, and VWAP-anchored levels are properties
of a cropped window, not of the market, and are permanently out of scope
here; structural objects belong to part four.

**Allowed nouns** in served labels and metadata: volume, row, histogram,
session, composite, developing, source, basis, gap. Forbidden: POC, value
area, VAH, VAL, VWAP, HVN, LVN, node, edge, crevasse, level, or any
predictive verb (VP-L1). (Node/crevasse vocabulary is reserved for the
part-four service, which owns those objects.)

## 2. Parents, SoR, migration — unchanged from v0.2

AZ-VP-9's amendment now follows Q10 plus the part-four surface contract.

## 3. Symbol staging — unchanged (A: SPY→XSP; B: ES→SPX per Q1; C: Q8)

## 4. Part 1 — Volume Ingest — unchanged from v0.2

Closed condition list (Q4); odd-lot flag valueless pending Q5; volume =
size (VP-L14); RTH sessioning, calendars from symbol-metadata; append-only
storage, gap markers, retention ≥ 2 years, backup + watcher regime;
rebuild law: `vp_rebuild --target <sym> --date <D> --params <hash>`
reproduces byte-identical published objects.

## 5. Part 2 — Profile Engine

**5.1 Row assignment.** Grid from symbol-metadata `vp_row` (SPY 0.10,
ES 0.25). A print at price p lands in row floor(p / vp_row) × vp_row —
half-open [row, row + vp_row). Stated here because two implementers will
otherwise round two ways.

**5.2 Histogram.** Integer volume per row over the eligible window
(regular prints per §4, gap intervals excluded from totals and listed).
Zero-volume rows are served as zero — never dropped, never interpolated:
absence of volume is information the analysis service needs.

**5.3 Windows.** *Session*: one RTH session. *Developing*: current
session, recomputed on `vp.update_cadence = 15 s`, volume-driven — a
cadence tick with no new eligible volume republishes nothing. *Composite*:
per Q6 (§12).

**5.4 Determinism.** Same archive + same parameter set ⇒ byte-identical
histograms (VP-L6); every payload records its parameter-set hash.

**5.5 Bars-as-proxy.** If only aggregates exist: the bar's full volume on
its vendor-VWAP row if present, else its close row; `approximation`
flagged end-to-end. Never smeared across high–low.

## 6. Mapping — unchanged mechanics from v0.2

Ratio locked at 1; offset-only, fitted from synchronized source prints vs
ChainStore target marks; publish-freeze at ≥ one source `vp_row`; a
mapping refresh never changes published bins without a volume change;
fail-loud thresholds (pairs ≥ 30 / 5 min, RMSE ≤ 1 target row, mark age ≤
15 s, skew ≤ 500 ms), STALE TTL 120 s. Publication space is Q7 (§12).

## 7. Named states

`COMPLETE | GAPPED | MAPPING_FAILED | UNAVAILABLE` — semantics as v0.2.
(STRUCTURE_UNPUBLISHED removed with detection; early-session sparseness is
simply a small honest histogram.)

## 8. Part 3 — Profile API (v1)

```
GET /v1/profile/{target}/{kind}?as_of=&n=&row=   kind: session|composite|developing
GET /v1/health
```

- Bin schema: `{price, volume}` — side-less, integer sizes, ascending,
  zero rows included across the traded span.
- Identity block on every payload (VP-L16): `profile_generation_id`,
  `parameter_set_hash`, `computed_at`, `as_of`, `state`, source + mapping
  block, approximation flag, gap list. Parameter-hash change ⇒ new
  generation id on identical tape (F7).
- **as-of replay** (VP-L9): `as_of=T` returns the histogram as it stood at
  T, byte-identical to a freeze at T. No what-if knobs, ever; the words
  "Time Machine" do not appear in this service.
- /health: ingest liveness, last print per source, gap report, mapping fit
  status, backup watcher passthrough. Auth: FatTail-Intelligence API auth
  section.

## 9. Laws

- **VP-L1** Allowed nouns per §1.
- **VP-L2** All histogram content computed inside the service. Rendering
  consumers render bytes only; computing consumers (§0) derive downstream
  under their own spec's laws.
- **VP-L3** Grids, calendars, scaling from symbol-metadata only; no
  per-symbol constants; no private Massive sockets.
- **VP-L4** Proxy-honesty: source, mapping block, approximation flags
  travel with every payload.
- **VP-L5** Fail loud, named states, gaps listed never interpolated.
- **VP-L6** Determinism per §5.4.
- **VP-L7** Part isolation.
- **VP-L8** SoR: published bins come only from this service; client OHLC
  binning residual, dual-run, dead by the kill rule (§2).
- **VP-L9** as-of replay ≠ Analyzer Time Machine; no what-if knobs.
- **VP-L10** Mapping: ratio 1, offset-only, publish-freeze, refresh never
  moves published bins.
- **VP-L11** Round-and-merge on unequal grids: source rows landing on one
  target row sum; empty target rows stay empty (active per Q7).
- **VP-L12** Row grid from `vp_row` exclusively.
- **VP-L13** Named states; GAPPED developing never blocks prior COMPLETE.
- **VP-L14** Volume = size; footprint/delta/aggressor out of scope.
- **VP-L15** Composite construction fixed by Q6 before stamp.
- **VP-L16** Identity block per §8.

## 10. Fixtures

**F1 (new) — prints → histogram.** SPY prints (price × size):
640.05×3, 640.07×2, 640.12×5, 640.19×2, 640.25×7, 640.31×4, plus one
average-price-condition print 640.10×50 (excluded by §4) and one declared
gap interval. Expected bins (floor rule, vp_row 0.10):
`640.00: 5 · 640.10: 7 · 640.20: 7 · 640.30: 4` — total 23, excluded
print absent, gap listed in payload. (Two rows tie at 7: with no POC
concept, ties are unremarkable — a deliberate property of this service.)

**F2 (new) — zero-row honesty.** Same tape with all 640.20-bin prints
removed → `640.20: 0` served explicitly between traded rows, not dropped.

**F3 — mapping freeze (bin-level).** F1 bins, ratio 1, published offset
2.48 → target-view rows shift uniformly (+2.5 after nearest-half-up snap:
640.00 → 642.50, …). Fit drifts to 2.52 (Δ 0.04 < 0.10) → bytes identical,
same generation id. Fit 2.60 (Δ 0.12) → republish, uniform +2.6.

**F4–F7 — unchanged from v0.2** (ES→SPX four-into-one merge sums to
{6558: 100, 6559: 350}; gap/GAPPED with prior COMPLETE fetchable; renderer
consumes bytes; parameter-hash ⇒ generation id).

**ATs:** AT-4 byte-identity · AT-5 per-part kill/restart · AT-7 as-of
replay bytes = freeze bytes · AT-8 grids via metadata, zero constants ·
AT-9 composite per Q6 vs hand-built N=5 fixture · AT-10 odd-lot flip
changes eligible volume exactly by stored odd-lot size · AT-11 bar-proxy
placement + flag.

## 11. Surface contract (minimal — most surface law moves to part four)

Any direct rendering of these histograms carries: the proxy badge
(`SPY → XSP · fit {age} s ago`, STALE when stamped), state banners with §7
names, gap intervals on the price axis, and the caption:
> Volume at price from SPY prints, mapped to XSP. Not a forecast.
No level lines, no markers, no derived annotations — those are part-four
objects under part-four law. Q10 (whether members see raw bins at all)
gates rendering-consumer access entirely.

## 12. Open decisions

**Coach — blocking the stamp:**
- **Q5** Odd lots in eligible volume: exclude (lean) or include.
- **Q6 (reworded)** Composite offering of *this* service: (a) serve an
  N-session summed histogram (N ∈ {5,10,20}) alongside sessions, or
  (b) sessions only — any compositing, including recurrence scoring, is
  part-four business. (Recurrence is part-four either way.)
- **Q7 (reworded)** Bin publication space: (a) source-space bins + mapping
  block, consumers apply the published offset (lean — one canonical
  histogram, mapping fully transparent), or (b) service also serves a
  target-mapped view (snap nearest-half-up; VP-L11 on unequal grids).
- **Q8** Stage C QQQ→NDX: stub or out-of-scope.
- **Q10** Member visibility of raw bins: rendering consumers get them, or
  computing consumers only. (Also settles the Stage B licensing hedge.)

**Verification — blocking BUILD:** Q2 sym_feed prints-vs-bars (first
action, StudioOne) · Q4 condition-code mapping · Q9 calendar in metadata ·
Q1 resolved: Massive **Futures Advanced** ($199/mo, non-pro individual)
covers ES trades real-time, 7+ yrs history, flat files; **Stage B
member-facing release precondition:** written Massive confirmation that
serving derived analysis to members is within the use grant (fallback:
part-four objects only, bins internal — a Q10 config, not a redesign).

**Resolved into law:** Q3 (ES member default RTH-only) — carried.

**Parked for the Structural Analysis Service spec (part four, on
request):** the v0.3 transition-detection procedure and parameters,
edge/crevasse/node ontology (including the 7688-class deep crevasse
between nodes from Coach's 2026-09-16 ES chart as a reference example),
window-invariance law, detection fixtures, intra/inter rule (old Q11).

## 13. Stamp gate

- [ ] F1–F4 committed as JSON with §10's numbers
- [ ] Q2 answered with on-machine evidence; Ingest design recorded
- [ ] Q5, Q6, Q7, Q8, Q10 answered by Coach; losing branches struck
- [ ] The strings `POC`, `VAH`, `VAL`, `VWAP`, `HVN`, `LVN`, `value
      area`, `node`, `edge`, `crevasse`, `level`, `rotation`, `break`,
      `magnet`, `Time Machine`, `÷ 5` appear nowhere in this document
      (outside the change table and the §12 parking note) or in served
      labels
- [ ] Condition-code mapping committed as a fixture file (Q4)
- [ ] Coach hash into the decision log (DL-### entry created)

**BUILD honesty metric:** on a held replay, every consumer shows identical
bins for the same `profile_generation_id`, and a mapping-only refresh
changes nothing.

## 14. Round log

- R0 v0.1 draft · R1 Grok: 11 findings, all carried · R2 v0.2 contract
  close · R3 v0.3 (detection folded into Engine — overreach).
- R4 — Coach directive C4: analysis is part four, separately commissioned.
  This document restores the three-part scope; detection parked as
  part-four seed. Next: Grok review of v0.4, Coach answers Q5–Q8, Q10.
