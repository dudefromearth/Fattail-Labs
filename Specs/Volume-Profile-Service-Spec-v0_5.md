# Volume Profile Service — Spec v0.5

**Status:** DRAFT — contract close. NOT BUILD. No plan ticket until the
Stamp Gate (§13) is green and this file's shasum is in the decision log.
**Date:** 2026-09-16
**Supersedes:** Volume-Profile-Service-Spec-v0_4.md
**Host:** StudioOne. **Parts:** Ingest / Engine / API.

## Change table (v0.4 → v0.5, keyed to Grok round-5 findings)

Grok's round-5 review was performed against a truncated v0.2 (file ended at
the §8 heading) — two rounds stale. Findings triage:

| Finding | Disposition | Where |
|---|---|---|
| G2-1/2/3 truncation, no law table, no fixture numbers | Transmission artifact; present since v0.2 full cut and in v0.4 §9/§10. Handoff fix: completeness pre-flight + shasum | §13 |
| G2-4 one enum for orthogonal facts | **Carried** — status + flags model | §7 |
| G2-5 §5 pre-decides Q7 | Resolved by v0.4's Q7 rewording (publication space); noted: under Q7(a), mapping failure never blocks source bins — advisor argument to close Q7 = (a) | §7, §12 |
| G2-6 print→row snap | Resolved in v0.4 §5.1 (floor, half-open) | — |
| G2-7 kill rule never fires | **Carried** — rewritten: rebuild-identity + consumer-cutover, client bins are a retired estimator, never a reference | §2 |
| G2-8 Q5 unimplementable without value | **Carried** — Q5 marked "blocks first payload"; remains a Coach tick | §12 |
| G2-9 no gap duration law | **Carried** — feed-liveness primary + print-absence backstop | §4 |
| G2-10 HVN/LVN total order | Moot here (analysis is part four); transferred to parking note (elimination order, plateau even-count tie) | §12 |
| P1: target noun vs field | **Carried** — `target_symbol` split | §1, §8 |
| P1: auction-print bias | **Carried** — §11 note | §11 |
| P1: fit sampling rule | **Carried** | §6 |
| P1: vp_row existence = dependency | **Carried** — folded into Q9 verification | §12 |
| P1: Stage B/C out of Stage A plan; composite not P0 | Consistent with v0.4; Q6 gains option (c) from Coach doctrine | §12 |

Also new this version (Coach direction, rounds 6–10): archive-range query
for computing consumers (§8); Stage B roll-coherence law (§6); Q6 option
(c) all-history running totals, now the lean (§12); part-four parking note
extended (§12).

---

## 0. Shape

Three parts, independently testable and restartable; Engine reads only
what Ingest wrote; API reads only what Engine wrote (VP-L7).

1. **Volume Ingest** — captures trade prints for volume-source instruments.
2. **Profile Engine** — builds finest-resolution volume-at-price histograms
   (session, developing, composite per Q6) and the source→target mapping.
3. **Profile API** — serves histograms and health.

**Consumer classes:** *computing* (Structural Analysis Service — part
four, future spec — and Strategy Lab; may derive) and *rendering* (Options
Lab canvas, heatmap, Analyzer; render served bytes only, VP-L2).

**Named dependencies:** symbol-metadata service (`vp_row` grids, strike
patterns, exchange calendar incl. half-days and SPY ex-div dates);
ChainStore (target marks); StudioOne archive/backup/watcher regime.

## 1. Purpose

The service captures and serves **volume at price, at the finest honest
resolution** — the substrate every structural read is built on. It
publishes no analysis, no levels, no classic profile measures: POC, value
areas, and VWAP-anchored levels are properties of a cropped window, not of
the market, and are permanently out of scope; structural objects belong to
part four.

**Allowed nouns** in served labels and metadata: volume, row, histogram,
session, composite, developing, source, basis, gap. Forbidden in labels:
POC, value area, VAH, VAL, VWAP, HVN, LVN, node, edge, crevasse, level,
target, or any predictive verb (VP-L1). The staging field is the metadata
key `target_symbol`, which is not a label and is permitted everywhere.

## 2. Parents, SoR, migration

Parents unchanged: Analyzer AZ-VP-9 (amendment pending Q10 + part-four
surface law), AZ-VP-3, AZ-VP-6; GEX Quad complement; OPF named-state
doctrine.

**SoR and kill rule (rewritten per G2-7):** published bins come only from
this service (VP-L8). Client `marketOhlc*` binning is a **retired
estimator** — different substrate (bars vs prints), never a diff reference
and never a pass/fail gate. Kill fires when both hold:
1. **Rebuild identity:** live publish == `vp_rebuild` from archive,
   byte-identical, for 10 consecutive RTH sessions (F7 watch).
2. **Consumer cutover:** every rendering consumer verified to no longer
   call `marketOhlc*` for VP purposes.
Until kill, client bins are residual and never shown alongside service
bins.

## 3. Symbol staging — unchanged

A: SPY→XSP (build scope). B: ES→SPX (after A; Q1 resolved, see §12;
member-facing precondition stands). C: QQQ→NDX pending Q8.

## 4. Part 1 — Volume Ingest

As v0.2/v0.4: extends the StudioOne collection pattern (extend sym_feed vs
sibling per Q2); per print: price, size, timestamp, exchange, condition
codes; closed condition list committed as a fixture file (Q4); auction
prints stored with `auction=true`; odd lots always stored,
`vp.include_oddlots` governs Engine eligibility (value = Q5, **blocks the
first published payload**); volume = size (VP-L14); RTH sessioning and
calendars from symbol-metadata; append-only compressed storage, retention
≥ 2 years, backup + watcher regime; rebuild law (`vp_rebuild` reproduces
byte-identical published objects).

**Gap law (new per G2-9).** A gap interval is declared by, in priority
order: (1) **feed-liveness** — Ingest's supervision layer records
disconnect/restart intervals directly (the launchd KeepAlive pattern
already emits these); (2) **print-absence backstop** — no eligible print
for `vp.gap_min_seconds = 300` inside RTH opens a gap closed by the next
eligible print. A quiet-but-printing tape is never a gap. Gap intervals
travel in every payload covering them; gapped time is excluded from
eligible volume and never interpolated.

## 5. Part 2 — Profile Engine

**5.1 Row assignment.** Grid from symbol-metadata `vp_row` (SPY 0.10,
ES 0.25). A print at price p lands in row floor(p / vp_row) × vp_row —
half-open [row, row + vp_row).
**5.2 Histogram.** Integer volume per row over the eligible window
(regular prints per §4, gap intervals excluded and listed). Zero rows
served as zero across the traded span — never dropped, never interpolated.
**5.3 Windows.** *Session* (one RTH session); *developing* (current
session, `vp.update_cadence = 15 s`, volume-driven — no new eligible
volume, no republish); *composite* per Q6.
**5.4 Determinism.** Same archive + same parameter set ⇒ byte-identical
histograms (VP-L6); parameter-set hash on every payload.
**5.5 Bars-as-proxy.** Bar volume on vendor-VWAP row else close row;
`approximation` flag end-to-end; never smeared across high–low.

## 6. Mapping

Ratio locked at 1; offset-only; publish-freeze at ≥ one source `vp_row`;
a mapping refresh never changes published bins without a volume change;
STALE TTL 120 s.

**Fit sampling rule (new per G2-P1).** One candidate pair per second: the
most recent eligible source print vs the most recent ChainStore target
mark, admitted when their timestamps agree within 1 s. Fit is valid when,
over the trailing 5 min: admitted pairs ≥ 30, RMSE ≤ 1 target row, newest
mark age ≤ 15 s, source/target clock skew ≤ 500 ms. Invalid →
`flags.mapping = FAILED`; last good mapping servable only as `STALE`
within TTL.

**Stage B roll coherence (new).** Multi-contract futures history is
incoherent in raw contract price space: each contract's prints sit at
different absolute prices for the same market level, so any cross-roll
accumulation in ES space smears at roll seams. Law: cross-session
accumulation for futures sources is performed only in **target (SPX)
space**, each contract-session's prints passing through that session's own
fitted offset. Raw contract-space histograms remain valid within a single
session. (This is a stated consequence of VP-L10, written so an
implementer cannot build the all-history archive in the wrong space; a
Stage B fixture will cover a roll seam.)

Publication space remains Q7: (a) source-space bins + mapping block,
consumers apply the published offset — **lean**, and under (a) a mapping
failure degrades only the mapping block, never the histogram; or (b) a
service-served target-mapped view (nearest-half-up snap; VP-L11 merge on
unequal grids).

## 7. Response model (rewritten per G2-4)

Orthogonal facts get orthogonal fields:

- **status** — histogram servability, one of
  `UNAVAILABLE | GAPPED | COMPLETE` (priority order for any single badge:
  UNAVAILABLE > GAPPED > COMPLETE).
- **flags.mapping** — `OK | STALE | FAILED`. Never blocks a source-space
  histogram; a Q7(b) target-mapped view returns `UNAVAILABLE` with
  `flags.mapping = FAILED` when no valid or STALE mapping exists.
- **flags.approximation** — `none | bar_vwap | bar_close`.
- **gaps[]** — intervals per §4, present whenever they overlap the window.

A developing window at 09:40 can therefore be simultaneously GAPPED, with
STALE mapping and bar approximation, and each consumer branches on its own
field. A GAPPED developing never blocks serving the prior session's
COMPLETE histogram under its own key.

## 8. Part 3 — Profile API (v1)

```
GET /v1/profile/{target_symbol}/{kind}?as_of=&session_date=&n=&row=
GET /v1/profile/{target_symbol}/range?from=&to=&price_lo=&price_hi=&row=
GET /v1/health
```

- Bin schema: `{price, volume}` — side-less, integer sizes, ascending,
  zero rows included across the traded span.
- **/range (new)** — the computing-consumer archive query: an arbitrary
  date range (`from`/`to`, RTH sessions per the metadata calendar) and
  optional price band (`price_lo`/`price_hi`), returning the summed
  eligible histogram for that slice. This is the query shape part four's
  full-attribution and viewport selection are built on; it implies a
  per-row/per-session index on the Engine store (a build item, not a
  contract change). Stage B ranges are served in SPX space per §6.
- Identity block on every payload (VP-L16): `profile_generation_id`,
  `parameter_set_hash`, `computed_at`, `as_of`, status + flags per §7,
  source + mapping block, gaps[]. Parameter-hash change ⇒ new generation
  id on identical tape (F7).
- **as-of replay** (VP-L9): `as_of=T` returns the object as it stood at T,
  byte-identical to a freeze at T. No what-if knobs; the words "Time
  Machine" appear nowhere in this service.
- /health: ingest liveness per source, last print, gap report, mapping fit
  status, backup watcher passthrough. Auth: FatTail-Intelligence API auth
  section.

## 9. Laws

- **VP-L1** Allowed nouns per §1; `target_symbol` is a field, not a label.
- **VP-L2** Histogram content computed inside the service; rendering
  consumers render bytes; computing consumers derive downstream under
  their own spec's laws.
- **VP-L3** Grids, calendars, scaling from symbol-metadata only; no
  per-symbol constants; no private Massive sockets.
- **VP-L4** Proxy-honesty: source, mapping block, approximation flags
  travel with every payload.
- **VP-L5** Fail loud: status + flags per §7, gap law per §4, thresholds
  per §6; gaps listed, never interpolated.
- **VP-L6** Determinism per §5.4.
- **VP-L7** Part isolation.
- **VP-L8** SoR + kill rule per §2; client bins are a retired estimator,
  never a reference.
- **VP-L9** as-of replay ≠ Analyzer Time Machine; no what-if knobs.
- **VP-L10** Mapping: ratio 1, offset-only, publish-freeze; refresh never
  moves published bins.
- **VP-L11** Round-and-merge on unequal grids (active per Q7(b); governs
  any target-mapped view).
- **VP-L12** Row grid from `vp_row` exclusively.
- **VP-L13** Response model per §7; GAPPED developing never blocks prior
  COMPLETE.
- **VP-L14** Volume = size; footprint/delta/aggressor out of scope.
- **VP-L15** Composite construction fixed by Q6 before stamp.
- **VP-L16** Identity block per §8 on every response.
- **VP-L17** Cross-roll futures accumulation only in target space per §6.

## 10. Fixtures

**F1 — prints → histogram** (floor rule, vp_row 0.10). SPY prints
(price × size): 640.05×3, 640.07×2, 640.12×5, 640.19×2, 640.25×7,
640.31×4; plus one average-price print 640.10×50 (excluded per §4) and
one declared gap interval. Expected: `640.00: 5 · 640.10: 7 · 640.20: 7 ·
640.30: 4`, total 23, excluded print absent, gap listed. (Two rows tie at
7: with no POC concept, ties are unremarkable by design.)
**F2 — zero-row honesty.** Same tape minus the 640.20-bin prints →
`640.20: 0` served explicitly, not dropped.
**F3 — mapping freeze.** F1 bins, ratio 1, published offset 2.48 →
uniform +2.5 after snap; fit drift to 2.52 (Δ 0.04 < 0.10) → bytes
identical, same generation id; fit 2.60 (Δ 0.12) → republish, uniform
+2.6.
**F4 — unequal-grid merge (Stage B).** ES 6558.25/6558.50/6558.75/6559.00
× 100/150/120/80 → SPX (nearest half-up): `6558: 100 · 6559: 350`.
**F5 — gap.** 6-min feed hole mid-session → status GAPPED, interval in
payload, totals exclude it; prior session COMPLETE fetchable.
**F6 — renderer consumes bytes** (harness, not a number).
**F7 — identity.** One parameter changed ⇒ new hash ⇒ new generation id;
also the kill-rule watch: live publish == `vp_rebuild`, byte-identical.
**F8 (new) — /range slice.** Two synthetic sessions; `/range` over both
with a price band returns the summed eligible histogram for exactly that
slice, gaps from both sessions listed.

**ATs:** AT-4 byte-identity · AT-5 per-part kill/restart · AT-7 as-of
bytes = freeze bytes · AT-8 grids via metadata, zero constants · AT-9
composite per Q6 selection vs hand-built fixture · AT-10 odd-lot flip
changes eligible volume exactly by stored odd-lot size · AT-11 bar-proxy
placement + flag · AT-12 (new) Stage B roll seam: two contract-sessions
spanning a roll accumulate coherently in SPX space and visibly smear if
computed in ES space (negative control).

## 11. Surface contract (minimal)

Direct rendering of these histograms carries: proxy badge
(`SPY → XSP · fit {age} s ago`, STALE when stamped), status banner +
flag indicators per §7, gap intervals on the price axis, caption:
> Volume at price from SPY prints, mapped to XSP. Not a forecast.
No level lines, markers, or derived annotations — part-four objects under
part-four law. **Known-bias note (per G2-P1):** auction prints are
included in eligible volume, so opening/closing rows carry auction mass; a
part-four toggle may split them (the `auction` flag exists in storage for
exactly this). Q10 gates rendering-consumer access to raw bins entirely.

## 12. Open decisions

**Coach — blocking the stamp:**
- **Q5** Odd lots: exclude (lean) or include. **Blocks the first published
  payload** — the parameter cannot ship valueless.
- **Q6** Composite offering: (a) N-session sums · (b) sessions only ·
  (c) **all-history running per-row totals** — incremental, no window
  math, the substrate for part-four full attribution — now the lean, per
  Coach's full-attribution doctrine. Composite (any branch) is not Stage A
  critical path; sessions + developing ship first.
- **Q7** Publication space: (a) source bins + mapping block (**lean**;
  mapping failure never blocks the histogram) or (b) service-served
  target view. One code path exists after this tick.
- **Q8** Stage C QQQ→NDX: stub or out-of-scope.
- **Q10** Member visibility of raw bins (also settles the Stage B
  licensing hedge).

**Verification — blocking BUILD:** Q2 sym_feed prints-vs-bars, on
StudioOne, before any Ingest design argument · Q4 condition-code fixture
file · Q9 symbol-metadata carries the calendar (half-days, SPY ex-div)
**and the `vp_row` field** — if either is absent, that is a
metadata-service dependency ticket, not an Engine ticket.
**Q1 resolved:** Massive Futures Advanced ($199/mo, non-pro individual) —
ES trades real-time, 7+ yrs history, flat files. **Stage B member-facing
precondition:** written Massive confirmation on serving derived analytics;
fallback = part-four objects only, bins internal (a Q10 config).
**Resolved into law:** Q3 (ES member default RTH-only).

**Parked for the Structural Analysis Service (part four, on request):**
ontology rows → nodes → **groupings** (crevasse severity divides at both
scales); founding laws — window invariance, full attribution (a node's
weight is its entire archive volume, view-independent), first-touch as a
derived per-row property (no date-range input exists), analyze-everything /
show-by-strategy; viewport rule — per-side k·σ_day from the session's
chain (k ≈ 3 with fat-tail cushion), snapped **outward** to the nearest
grouping boundary, breach costs a re-crop only; uncharted terrain as a
first-class region state; recency-on-revisit question (open); the verified
v0.3 detection procedure + fixture, with Grok's total-order refinements
owed (elimination order among 3+ candidates, plateau even-count tie);
reference charts: Coach's 2026-09-16 ES set (7688 crevasse read;
node re-weighting under range extension; resolution honesty / VRVP
re-binning artifact; current worked example: 0DTE viewport floor snapping
7330-ish to ~7200 at the grouping boundary below the 7300 complex).

## 13. Stamp gate

- [ ] **File integrity:** this file is complete through §14; its shasum is
      recorded in the decision log as the review object before any review
      or plan ticket opens; every reviewer pre-flights section count and
      tail before reading
- [ ] F1–F5, F7, F8 committed as JSON with §10's numbers (F4 parked with
      Stage B; F6 is a harness)
- [ ] Q2 answered with on-machine evidence; Ingest design (extend vs
      sibling) recorded
- [ ] Q5, Q6, Q7, Q8, Q10 answered by Coach; losing branches struck
- [ ] The strings `POC`, `VAH`, `VAL`, `VWAP`, `HVN`, `LVN`, `value
      area`, `node`, `edge`, `crevasse`, `level`, `rotation`, `break`,
      `magnet`, `Time Machine`, `÷ 5` appear nowhere in this document
      (outside the change table and §12 parking note) or in served labels
- [ ] Condition-code mapping committed as a fixture file (Q4)
- [ ] `vp_row` + calendar confirmed on symbol-metadata (Q9)
- [ ] Coach hash into the decision log (DL-### entry)

**BUILD honesty metric:** on a held replay, every consumer shows identical
bins for the same `profile_generation_id`; a mapping-only refresh changes
nothing; live publish matches `vp_rebuild` byte-for-byte.

## 14. Round log

- R0 v0.1 · R1 Grok (11 findings, carried) · R2 v0.2 contract close ·
  R3 v0.3 detection folded in (overreach) · R4 v0.4 scope corrected,
  detection parked for part four (Coach C4) · R5 Grok review against a
  truncated v0.2 — transmission findings noted, substantive findings
  triaged into this version · R6–R10 Coach doctrine rounds (full
  attribution, first-touch, groupings, viewport, k·σ) folded into §8
  /range, §6 roll coherence, Q6(c), and the §12 parking note.
- This document: v0.5. Next: Grok re-review of the **complete** v0.5
  file (pre-flight: ends at §14, shasum logged), and Coach ticks Q5, Q6,
  Q7, Q8, Q10.
