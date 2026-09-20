# Volume Profile Service — Spec v0.2

**Status:** DRAFT — contract close. NOT BUILD. No Engine implementation, no
consumer cutover, until the Stamp Gate (§13) is fully green.
**Date:** 2026-09-16
**Supersedes:** Volume-Profile-Service-Spec-v0_1.md
**Host:** StudioOne (Ingest, Engine, API co-located for Stage A; migration to
Dude two permitted later without contract change).
**Consumers:** Options Lab VP canvas, heatmap overlay, Analyzer overlay,
Strategy Lab, IKI templates. Consumers render only (VP-L2).

## Change table (v0.1 → v0.2, keyed to review findings G1–G11)

| Finding | Disposition | Where |
|---|---|---|
| G1 parent/SoR unseated | Carried — parents cited, supersession + migration + kill rule | §2, VP-L8 |
| G2 Time Machine name collision | Carried — renamed **as-of replay**; AZ-VP-6 honored | §8, VP-L9, F-AT-7 |
| G3 forecast language in Purpose | Carried — purpose rewritten; allowed-noun list is law | §1, VP-L1 |
| G4 mapping not a law | Carried — ratio locked, offset-only, freeze, fail-loud thresholds, merge rule | §6, VP-L10/L11/L12 |
| G5 algorithms not deterministic | Carried — POC/VA/HVN/LVN written as procedures; ties fixtured | §5, F1/F2 |
| G6 binary failure states | Carried — named states | §7, VP-L13 |
| G7 API a sketch | Carried — v1 shape, /levels schema, generation id, param hash | §8, VP-L16 |
| G8 ingest policy = trading choices | Carried — closed condition list (draft), odd-lot OPEN → Q5 | §4 |
| G9 no surface contract | Carried — §11 written into this spec; forks standalone at canvas build | §11 |
| G10 tests not goldens | Carried — F1–F7 with computed numbers; AT-7 rewritten | §10 |
| G11 scope holes | Carried — Stage C → Q8; footprint/delta out of scope (VP-L14); rebuild, retention, calendars | §3, §4, §12 |

Dropped findings: none.

---

## 0. Shape of the service

Three parts. Each independently testable and independently restartable
(launchd KeepAlive pattern proven on sym_feed/chain_feed).

1. **Volume Ingest** — captures trade prints for volume-source instruments.
2. **Profile Engine** — computes session / composite / developing profiles,
   levels, and the source→target mapping.
3. **Profile API** — serves profiles and level sets. Consumers never compute.

The Engine reads only what Ingest wrote; the API reads only what the Engine
wrote (VP-L7).

**Named dependencies:** symbol-metadata service (row grids, strike patterns,
exchange calendar incl. half-days and SPY ex-div dates); ChainStore (target
marks for mapping fit); StudioOne archive + nightly-backup + watcher regime.

## 1. Purpose

The service publishes **where traded volume concentrated and where it did
not**, per instrument, per window — POC, Value Area, HVN, LVN — as terrain
context for positioning defined-risk structures. It is the third piece of the
Options Lab trifecta.

**Allowed nouns** in purpose, metadata, and served labels: volume, POC, VAH,
VAL, VWAP, HVN, LVN, session, composite, developing, source, basis, gap.
Forbidden anywhere in service output: rotation, break, magnet, target,
support, resistance, acceptance-as-forecast, or any verb assigning future
behavior to a level (VP-L1).

## 2. Parents, SoR, and migration

- **Analyzer Spec v0.2** is the parent surface authority:
  - **AZ-VP-9** — VP surface renders **bins only** (optional POC/VA markers);
    this service is the data source that law binds to.
  - **AZ-VP-3** — no private Massive sockets, no hardcoded symbol lists:
    inherited here as VP-L3 + single-Ingest rule.
  - **AZ-VP-6** — VP never re-prices packages and never consumes OPF what-if
    knobs: inherited as VP-L9.
- **Supersession:** Analyzer §1.16.2 as-built (client binning from
  `marketOhlc*`) is superseded as SoR. Migration: (1) dual-run — service
  levels computed alongside client bins; (2) fixture diff each session (F6
  harness); (3) **kill rule** — client `marketOhlc*` binning is removed after
  10 consecutive RTH sessions of clean diff following BUILD GO. Until kill,
  client bins are marked residual and never shown alongside service levels.
- **GEX Quad v0.12** — GEX is not a VP substitute; this service is the
  complement. No shared color semantics on shared canvases (§11).
- **OPF Truth / Elegant Failure** — named-state doctrine inherited (§7).

## 3. Symbol staging

Profiles are computed on a **volume source** and published under a **target**.
Cash index volume is not terrain.

| Stage | Source | Target | Status |
|---|---|---|---|
| A | SPY trade prints | XSP | this spec's build scope |
| B | ES futures | SPX | spec'd; ships after A; blocked by Q1 |
| C | QQQ | NDX | **pending Q8** — stub or out-of-scope; not implied by any law |

## 4. Part 1 — Volume Ingest

- Extends the StudioOne collection pattern; whether it extends sym_feed or
  runs as a sibling collector is decided by Q2's on-machine answer.
- Captured per print: price, size, timestamp, exchange, sale-condition codes.
- **Regular-print filter (closed list, DRAFT pending Q4 vendor mapping):**
  excluded from profile volume — extended-hours/Form T, average-price,
  sold-out-of-sequence, prior-reference, derivatively priced. Included —
  regular way, opening/closing auction prints (flagged `auction=true` in
  storage so a future rule can split them without recapture). The final
  letter-code mapping is committed as a fixture file at BUILD GO, not prose.
- **Odd lots:** parameter `vp.include_oddlots` exists; **no default** —
  value set by Q5. Prints are stored regardless; the flag governs Engine
  eligibility, so the decision is reversible without recapture.
- Volume is **size**, never tick count (VP-L14). Footprint, delta, bid/ask
  aggressor: out of scope this version (VP-L14).
- Sessioning: SPY RTH 09:30–16:00 ET. ES (Stage B): full Globex stored,
  segment-tagged, RTH derivable. Calendar (incl. half-days, SPY ex-div
  dates) comes from symbol-metadata; no calendar constants in service code.
- Storage: append-only, compressed, gap markers explicit, retention ≥ 2
  years of RTH sessions; covered by the second-volume nightly backup, the
  offsite copy plan, and the archive-health watcher.
- **Rebuild law:** the Engine must be fully reconstructible from Ingest
  archive + a parameter set: `vp_rebuild --target <sym> --date <D>
  --params <hash>` reproduces byte-identical published objects (F7 ties
  identity to the hash).

## 5. Part 2 — Profile Engine (procedures, not adjectives)

All computation happens in **source space** on the source's `vp_row` grid
from symbol-metadata (current metadata values: SPY 0.10, ES 0.25; targets:
XSP 0.10, SPX 1.00). No `÷ 5`, no formula — the field is the law (VP-L12).

**5.1 Histogram.** Volume-at-price rows over the eligible window. Eligible =
regular prints per §4 filter, minus gap-flagged intervals (gaps are excluded
from totals and listed in the payload; they are never interpolated).

**5.2 VWAP.** Σ(price·size)/Σ(size) over the eligible window, computed in
histogram space, published in metadata.

**5.3 POC.** Argmax row volume. Tie → row whose midpoint is nearest VWAP
(same space); remaining tie → lower price. (Exercised by F2.)

**5.4 Value Area.** Classic one-sided expansion from POC: compare the single
next row above vs below; add the heavier; tie → the side nearer VWAP,
remaining tie → lower side. Stop at ≥ 70% of eligible window volume.
(Exercised by F1, including two ties.)

**5.5 Developing gates.** Until `vp.va_min_minutes = 15` AND
`vp.va_min_volume = 1,500,000` source shares (both versioned parameters) are
met, the developing response serves histogram + POC with VA fields null and
state `VA_UNPUBLISHED`. Developing recompute cadence `vp.update_cadence =
15 s`; recompute is volume-driven — a cadence tick with no new eligible
volume republishes nothing.

**5.6 Composite — OPEN, Q6.** Two algebras, exactly one survives the stamp:
- (a) **Sum:** merge N RTH session histograms into one, then one POC/VA on
  the sum. Heavy days dominate.
- (b) **Average-of-dailies:** normalize each session, average, then POC/VA.
  Recurring levels dominate.
N ∈ {5, 10, 20}. Composite recomputes at session close only. Half-day
sessions participate as-is (their smaller volume is real information under
(a); under (b) normalization handles it). No law elsewhere assumes (a) or (b).

**5.7 HVN/LVN.** Collapse plateaus (equal adjacent rows = one node at the
plateau's volume, located at its median row). Local maxima with volume ≥ 30%
of POC volume are HVN candidates; between two retained HVNs there must exist
a minimum ≤ 60% of the smaller peak, else keep only the larger. LVN = local
minimum between two retained HVNs with volume ≤ 40% of the smaller
neighboring HVN. Caps: ≤ 5 HVN (by volume, desc), ≤ 5 LVN (by depth, asc).
All thresholds are named, versioned parameters.

**5.8 Bars-as-proxy.** If prints are unavailable and only aggregates exist:
place each bar's full volume on the bar's VWAP row if the feed provides bar
VWAP, else on its close row; set `approximation = bar_vwap | bar_close`.
Never smear across high–low — that invents terrain. The approximation flag
travels end-to-end (VP-L4).

## 6. Mapping (Engine)

- **Model:** target = source + offset. **Ratio locked at 1** for Stage A and
  Stage B (VP-L10). Offset fitted from synchronized SPY last vs XSP mark
  (ChainStore) pairs.
- **Freeze rule (VP-L10):** the *published* offset changes only when the
  fitted offset differs from the published offset by ≥ one source `vp_row`.
  A mapping refresh alone must never move a published level — levels move
  only with volume changes or a freeze-threshold breach. (F3.)
- **Fit validity — fail loud (VP-L5):** the fit is invalid when any of:
  synchronized pairs < 30 in the last 5 min; RMSE > one target `vp_row`;
  ChainStore mark age > 15 s; source/target clock skew > 500 ms. Invalid →
  state `MAPPING_FAILED`; the last good mapping may serve only if stamped
  `STALE` with its age, TTL 120 s, then `MAPPING_FAILED`.
- **Compute/map order — OPEN, Q7.** Exactly one survives the stamp:
  - (a) **Compute-then-map:** POC/VA/HVN/LVN computed in source space;
    *levels only* are mapped (+ published offset) and snapped to the target
    grid (nearest, half-up). Displayed bins are the source histogram shifted
    by the same published offset. Basis jitter physically cannot restructure
    the profile; badge carries the two-space honesty note (§11).
  - (b) **Map-then-compute:** every source row maps, then **round-and-merge**
    (VP-L11): rows landing on one target row sum; empty target rows stay
    empty; POC/VA run after merge in target space. Self-consistent bins and
    levels; jitter controlled only by the freeze rule.
  - Property either way: Stage A (equal 0.10 grids, ratio 1) cannot collide
    rows — snap is a uniform shift. Merging is a real event only on unequal
    grids (Stage B: four ES rows per SPX row — F4).
- Every mapped object carries `{source, ratio: 1, offset_published,
  offset_fit, fit_as_of, residual_rmse, sample_count}` (VP-L16).

## 7. Named response states (VP-L13)

`COMPLETE | GAPPED | VA_UNPUBLISHED | MAPPING_FAILED | UNAVAILABLE`

- `GAPPED`: profile served with an explicit gap-interval list; totals exclude
  gaps; never presented as COMPLETE. A burst gap does not invalidate the
  session — it names itself. (F5.)
- A gapped/failed *developing* response never blocks serving the prior
  session's `COMPLETE` profile under its own key.
- `STALE` is a mapping stamp carried in metadata, not a response state.
- Partial anything is never served as COMPLETE.

## 8. Part 3 — Profile API (v1 contract)