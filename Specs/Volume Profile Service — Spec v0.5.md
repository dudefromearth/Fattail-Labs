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
failure degrades only the