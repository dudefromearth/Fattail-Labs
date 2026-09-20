# Volume Profile Service — Spec v0.6.1

**Status:** DRAFT — contract close, Advisor round-1 fixes. Build in
flight under stamped tokens (VPS1-W0, VPS2-W0, VPSB-W0); composite
build is FENCED off VPS2-W0 (§5.3). No new build scope until review
PASS.
**Date:** 2026-09-17
**Supersedes:** Volume-Profile-Service-Spec-v0_6.md

## Change table (v0.6 → v0.6.1, keyed to Advisor findings)

| Finding | Fix | Where |
|---|---|---|
| A-1: F3 contradicted Q7(a)/VP-L10 — published bins "shifted" | Publication clarified: source-space histogram bytes NEVER move with mapping; only `offset_published` in the mapping block changes at freeze breach (new generation id, bins byte-identical). F3 rewritten; F4/F9 re-homed to internal target-space accumulation | §6, §10 |
| A-2: VP-L18 had no deny rule; F6 could not fail | Audience enforcement law: token classes; member-class tokens receive 403 on /v1/profile*; F6 is now a concrete deny fixture. Route fate stated via AZ-VP-9-A1 | §8, §9, §10 |
| A-3: AZ-VP-9 parent still said bins | Amendment record **Specs/amendments/AZ-VP-9-A1.md** is the citable law; both specs cite it; its sha logged in the DL | §2 |
| A-4: composite = silent Engine scope on in-flight tokens | Composite is law but its BUILD is fenced: not authorized under VPS2-W0; ships under a later token | §5.3, §13 |

## Change table (v0.5 → v0.6)

| Source | Change | Where |
|---|---|---|
| DL-718 futures amendments (field-proven in the VPSB collector) | Futures ingest law: /futures/v1/* + futures WS; raw UTC-ns timestamps; session key = vendor `session_end_date`; active contracts from the Contracts endpoint (never a hardcoded list); scheduled maintenance halt ≠ gap (Schedules / market-status authoritative); futures mandatory fields exclude equities-style condition codes (captured verbatim if emitted) | §4 |
| Coach: Futures Advanced secured; ES + MES capture live | Stage B symbols: ES→SPX and MES→XSP candidate; VPB-Q2 opened (SPY vs MES as XSP source — Strategy Lab evidence) | §3, §12 |
| MES staging | VP-L10 amended: mapping ratio is an **exact product constant from symbol-metadata** (1 for SPY→XSP and ES→SPX; 0.1 for MES→XSP), never fitted; offset remains the only fitted parameter. F9 fixture added | §6, §9, §10 |
| Coach: take all vendor-available history | Retention rewritten: backfill to the vendor floor (ES 2017-04; MES 2019-05 listing; SPY equities-tier floor), retention indefinite; first-touch integrity is the stated reason | §4 |
| VPB-Q1 (opened) | Historical basis provenance: pre-ChainStore sessions fit offsets from a documented alternate SPX mark source; `mark_source` carried in the mapping block | §6, §12 |
| Coach ticks now law | Q6 = (c) all-history running totals (DL-706); Q7 = (a) source-space publication (DL-706); Q5 = EXCLUDE odd lots (DL-715); Q10 = (b) (DL-714) with Coach's architecture sentence as VP-L18 | §5, §6, §9, §12 |
| Coach architecture sentence (2026-09-17) | **VP-L18:** raw bins live on the data end and are available only through this service's API; no member surface renders raw bins — member surfaces render Structural Analysis objects (SA spec §8; AZ-VP-9 amendment) | §9 |

---

## 0. Shape

Three parts, independently testable and restartable; Engine reads only
what Ingest wrote; API reads only what Engine wrote (VP-L7).

1. **Volume Ingest** — captures trade prints for volume-source
   instruments (equities collector: SPY, live 2026-09-16; futures
   collector: ES + MES, live 2026-09-17).
2. **Profile Engine** — builds finest-resolution volume-at-price
   histograms (session, developing, all-history running totals per Q6)
   and the source→target mapping.
3. **Profile API** — serves histograms and health.

**Consumer classes:** *computing* (Structural Analysis Service — the app
end, its own spec line — and Strategy Lab; may derive) and *rendering*
(no rendering consumer receives raw bins per VP-L18; legacy rendering
paths retire under the §2 kill rule).

**Named dependencies:** symbol-metadata service (`vp_row` grids, mapping
ratio constants, strike patterns, exchange calendars incl. half-days and
SPY ex-div); ChainStore (target marks, current era); Massive futures
reference endpoints (Contracts, Products, Schedules, market-status);
StudioOne archive/backup/watcher regime.

## 1. Purpose

The service captures and serves **volume at price, at the finest honest
resolution** — the substrate every structural read is built on. It
publishes no analysis, no levels, no classic profile measures: POC,
value areas, and VWAP-anchored levels are properties of a cropped
window, not of the market, and are permanently out of scope; structural
objects belong to the Structural Analysis Service.

**Allowed nouns** in served labels and metadata: volume, row, histogram,
session, composite, developing, source, basis, gap. Forbidden in labels:
POC, value area, VAH, VAL, VWAP, HVN, LVN, node, edge, crevasse, level,
target, or any predictive verb (VP-L1). The staging field is the
metadata key `target_symbol`, which is not a label and is permitted
everywhere.

## 2. Parents, SoR, migration

Parents: Analyzer AZ-VP-9 **as amended by AZ-VP-9-A1**
(Specs/amendments/AZ-VP-9-A1.md — the citable law; sha in the DL;
folded into the Analyzer spec at its next revision), AZ-VP-3, AZ-VP-6;
GEX Quad complement; OPF named-state doctrine. **Route fate (per
AZ-VP-9-A1):** /app/options-lab/volume-profile remains the product
home; its canvas is replaced by the SA surface at SA Phase-1 ship; the
existing client-binned canvas persists strictly as a residual estimator
until then — it never consumes this service's bins — and dies under
this section's kill rule. No surface work may cite AZ-VP-9 without the
amendment.

**SoR and kill rule:** published bins come only from this service
(VP-L8). Client `marketOhlc*` binning is a **retired estimator** —
different substrate, never a diff reference, never a pass/fail gate.
Kill fires when both hold: (1) rebuild identity — live publish ==
`vp_rebuild`, byte-identical, 10 consecutive RTH sessions (F7 watch);
(2) consumer cutover — every legacy consumer verified off `marketOhlc*`
for VP purposes. Until kill, client bins are residual and never shown
alongside service output.

## 3. Symbol staging

| Stage | Source | Target | Status |
|---|---|---|---|
| A | SPY trade prints | XSP | capture live 2026-09-16; Engine under VPS2-W0 |
| B | ES trade prints | SPX | capture live 2026-09-17; Engine gated on VPS2-G + this version's review |
| B-alt | MES trade prints | XSP | capture live 2026-09-17; **VPB-Q2**: SPY vs MES as the XSP source decided on Strategy Lab evidence, not argument |
| C | QQQ | NDX | pending Q8 |

Cash index volume is not terrain; every target is fed by a volume
source through the §6 mapping.

## 4. Part 1 — Volume Ingest

**Common law (all collectors):** per print: price, size, exchange
timestamp, source symbol/contract; append-only compressed storage under
{LABS_MARKET_DATA_ROOT}/vp/ingest/<SOURCE>/; gap markers; volume = size
(VP-L14); odd lots always stored (`vp.include_oddlots` governs Engine
eligibility; value = EXCLUDE per Q5, DL-715); launchd KeepAlive
supervision with disconnect/restart intervals recorded; rebuild law
(`vp_rebuild` reproduces byte-identical published objects); calendars
and grids from symbol-metadata (VP-L3).

**Equities collector (SPY):** Massive stocks trades WS (T.SPY,
multiplexed socket); sale-condition codes mandatory per print; closed
condition fixture (Q4 file; ambiguous ids EXCLUDED-and-flagged pending
the resolution pass); auction prints stored `auction=true`; RTH
sessioning per the metadata calendar; gap law: feed-liveness primary,
`vp.gap_min_seconds = 300` print-absence backstop inside RTH;
quiet-but-printing is never a gap.

**Futures collector (ES, MES) — per DL-718, field-proven:**
/futures/v1/* + futures WS, both products multiplexed on ONE socket
(separate entitlement budget from the stocks socket). Timestamps stored
as raw UTC nanoseconds; conversion is display-time only. Session key is
the vendor `session_end_date` (a session ending 5:00 p.m. CT carries
that date); session identity is never derived from local clock math.
Mandatory per print: price, size, exchange timestamp, **contract
ticker** (VP-L17 roll coherence), `session_end_date`. Condition/flag
fields are captured verbatim if the stream emits them; their absence is
not a defect — the futures condition fixture is observed-after-capture,
never guessed. Active contract set from GET /futures/v1/contracts
(product code, active filter), refreshed daily; roll weeks capture both
contracts because both are active. **Gap law (futures):** a scheduled
maintenance halt per GET /futures/v1/schedules is NEVER a gap; gap
markers apply only to silence during a scheduled-open segment
(disconnect, or print-absence backstop), with open/paused state checked
via /futures/v1/market-status, never assumed. Full Globex stored,
segment-tagged, RTH derivable.

**Retention and backfill:** backfill each source to the vendor floor —
ES from 2017-04, MES from its 2019-05 listing, SPY to the equities-tier
floor — in after-close tranches (CP-1), integrity-checked against
vendor manifests; retention indefinite. Stated reason: **first-touch
integrity** — a truncated archive silently falsifies derived
first-touch metadata downstream (SA-L2/L4); the archive's left edge
must be the vendor's, not a choice.

## 5. Part 2 — Profile Engine

**5.1 Row assignment.** Grid from symbol-metadata `vp_row` for **SPY 0.10**.
Futures (ES, MES) grid **reads** registry `tick_size` (REQ-009 D7 split-author;
errata `Specs/amendments/VPS-D7-split-author-REQ-009.md`). A print at price p
lands in row floor(p / vp_row) × vp_row — half-open [row, row + vp_row).
**5.2 Histogram.** Integer volume per row over the eligible window
(eligible prints per §4; gap intervals excluded and listed). Zero rows
served as zero across the traded span — never dropped, never
interpolated.
**5.3 Windows.** *Session* (one RTH session; futures full-Globex view
derivable by segment); *developing* (current session,
`vp.update_cadence = 15 s`, volume-driven — no new eligible volume, no
republish); *composite* = **all-history running per-row totals**
(Q6 = (c)): maintained incrementally as prints arrive, no window math,
no N parameter; the substrate for downstream full attribution.
Sessions + developing ship first. **Fence (A-4):** composite is law
here but its build is NOT authorized under VPS2-W0 or any in-flight
token; it ships under its own later token. A VPS2 seed emitting
composite code is out of scope.
**5.4 Determinism.** Same archive + same parameter set ⇒ byte-identical
histograms (VP-L6); parameter-set hash on every payload.
**5.5 Bars-as-proxy.** Bar volume on vendor-VWAP row else close row;
`approximation` flag end-to-end; never smeared across high–low.

## 6. Mapping

**Model:** target = source × ratio + offset. **Ratio is an exact
product constant from symbol-metadata, never fitted** (VP-L10 as
amended): 1 for SPY→XSP and ES→SPX; 0.1 for MES→XSP (XSP ≡ SPX/10).
Offset is the only fitted parameter: publish-freeze at ≥ one source
`vp_row`; a mapping refresh never changes published bins without a
volume change; STALE TTL 120 s.

**Fit sampling rule:** one candidate pair per second (latest eligible
source print vs latest target mark, timestamps within 1 s). Valid over
the trailing 5 min: pairs ≥ 30, RMSE ≤ 1 target row, newest mark age ≤
15 s, clock skew ≤ 500 ms. Invalid → `flags.mapping = FAILED`; last
good mapping servable only as `STALE` within TTL.

**Mark provenance (VPB-Q1):** current-era fits use ChainStore target
marks. Pre-ChainStore historical sessions fit from a documented
alternate SPX source (candidates: Massive indices values; the chain
archive where it reaches; daily-settlement approximation) — decided on
VPB-Q1 evidence. Every mapping block carries `mark_source`; a
settlement-approximated historical fit is never mistaken for a
ChainStore-quality one.

**Roll coherence (VP-L17):** cross-session accumulation for futures
sources only in target space (SPX for ES; XSP for MES), each
contract-session through its own fitted offset; raw contract-space
histograms valid within a single session; a Stage B fixture covers a
roll seam (AT-12).

**Publication space (Q7 = (a), law — clarified per A-1):** published
bins are ALWAYS source-space bytes and are never rewritten by mapping
activity of any kind. The mapping block carries `{ratio,
offset_published, offset_fit, fit_as_of, residual, mark_source}`;
consumers apply ratio and `offset_published` themselves. Fit drift
below the freeze threshold changes nothing — not the bins, not the
mapping block, not the generation id. At a freeze breach (≥ one source
`vp_row`), `offset_published` updates: the payload changes, so the
generation id changes, and the bins remain byte-identical (F3 asserts
exactly this). A mapping failure degrades only the mapping block,
never the histogram. VP-L11's round-and-merge exists solely for the
service's internal target-space accumulations — the roll-coherent
stores and /range served in target space — where unequal grids merge
nearest-half-up, source rows landing on one target row sum, and empty
target rows stay empty; no published source-space histogram is ever
produced by that path.

## 7. Response model

- **status** — `UNAVAILABLE | GAPPED | COMPLETE` (badge priority in
  that order).
- **flags.mapping** — `OK | STALE | FAILED`; never blocks a
  source-space histogram.
- **flags.approximation** — `none | bar_vwap | bar_close`.
- **gaps[]** — intervals per §4 whenever they overlap the window.
A GAPPED developing never blocks serving the prior session's COMPLETE
histogram under its own key.

## 8. Part 3 — Profile API (v1)

```
GET /v1/profile/{target_symbol}/{kind}?as_of=&session_date=&n=&row=
GET /v1/profile/{target_symbol}/range?from=&to=&price_lo=&price_hi=&row=
GET /v1/health
```

- Bin schema: `{price, volume}` — side-less, integer sizes, ascending,
  zero rows included across the traded span.
- **/range** — the computing-consumer archive query: arbitrary date
  range (sessions per the metadata calendar; futures sessions keyed by
  `session_end_date`) and optional price band, returning the summed
  eligible histogram for the slice. Futures ranges served in target
  space per §6. Implies the per-row/per-session index (build item).
- Identity block on every payload (VP-L16): `profile_generation_id`,
  `parameter_set_hash`, `computed_at`, `as_of`, status + flags, source +
  mapping block (ratio, offset, fit_as_of, residual, `mark_source`),
  gaps[]. Parameter-hash change ⇒ new generation id on identical tape.
- **as-of replay** (VP-L9): `as_of=T` returns the object as it stood at
  T, byte-identical to a freeze at T. No what-if knobs; the words "Time
  Machine" appear nowhere in this service.
- /health: ingest liveness per collector, last print per source, gap
  report, mapping fit status, backup watcher passthrough. Auth:
  FatTail-Intelligence API auth section.
- **Audience enforcement (A-2):** two token classes. COMPUTING
  (service tokens: SA service, Strategy Lab, ops) may call
  /v1/profile* and /health. MEMBER (Labs member-session tokens)
  receive **HTTP 403** on every /v1/profile* route, unconditionally —
  there is no member-readable bins endpoint, and no query parameter or
  header changes that. The deny is logged with token class. F6 tests
  the deny.

## 9. Laws

- **VP-L1** Allowed nouns per §1; `target_symbol` is a field, not a
  label.
- **VP-L2** Histogram content computed inside the service; computing
  consumers derive downstream under their own spec's laws; no rendering
  consumer receives raw bins (VP-L18).
- **VP-L3** Grids, ratio constants, calendars, active contract sets
  from symbol-metadata / vendor reference endpoints only; no per-symbol
  constants in code; no private Massive sockets.
- **VP-L4** Proxy-honesty: source, mapping block (incl. `mark_source`),
  approximation flags travel with every payload.
- **VP-L5** Fail loud: status + flags per §7; gap laws per §4
  (scheduled halts never gaps); thresholds per §6; gaps listed, never
  interpolated.
- **VP-L6** Determinism per §5.4.
- **VP-L7** Part isolation.
- **VP-L8** SoR + kill rule per §2.
- **VP-L9** as-of replay ≠ Analyzer Time Machine; no what-if knobs.
- **VP-L10** Mapping: ratio = exact metadata product constant, never
  fitted; offset-only fitting; publish-freeze; refresh never moves
  published bins.
- **VP-L11** Round-and-merge on unequal grids for the service's
  target-space accumulations (§6).
- **VP-L12** Row grid from `vp_row` exclusively.
- **VP-L13** Response model per §7; GAPPED developing never blocks
  prior COMPLETE.
- **VP-L14** Volume = size; footprint/delta/aggressor out of scope.
- **VP-L15** Composite = all-history running totals (Q6 = (c), law).
- **VP-L16** Identity block per §8 on every response.
- **VP-L17** Cross-roll futures accumulation only in target space.
- **VP-L18** Raw bins live on the data end (StudioOne) and are
  available only through this service's API to entitled computing
  consumers; no member surface renders raw bins — member surfaces
  render Structural Analysis objects (SA spec §8; AZ-VP-9-A1).
  **Deny rule:** member-class tokens receive 403 on /v1/profile*
  (§8); the rule is enforced server-side and fixtured (F6), not a
  convention.

## 10. Fixtures

**F1 — prints → histogram** (floor rule, vp_row 0.10). SPY prints
(price × size): 640.05×3, 640.07×2, 640.12×5, 640.19×2, 640.25×7,
640.31×4; plus one average-price print 640.10×50 (excluded per §4) and
one declared gap interval. Expected: `640.00: 5 · 640.10: 7 ·
640.20: 7 · 640.30: 4`, total 23, excluded print absent, gap listed.
**F2 — zero-row honesty.** Same tape minus the 640.20-bin prints →
`640.20: 0` served explicitly, not dropped.
**F3 — mapping freeze (rewritten per A-1, Q7(a)).** F1 bins, ratio 1,
`offset_published` 2.48. Fit drifts to 2.52 (Δ 0.04 < 0.10): payload
byte-identical — same bins, same mapping block, same generation id.
Fit reaches 2.60 (Δ 0.12 ≥ 0.10): `offset_published` becomes 2.60 →
new generation id, mapping block changed, **bins[] byte-identical to
the prior generation** (asserted by diff). At no point does any
published bin price or volume change from mapping activity.
**F4 — unequal-grid merge (internal target-space accumulation,
ES→SPX).** Applies to the §6 roll-coherent store / /range served in
target space — never to published source-space bins. ES 6558.25/
6558.50/6558.75/6559.00 × 100/150/120/80 → SPX (nearest half-up):
`6558: 100 · 6559: 350`.
**F5 — gap.** 6-min feed hole mid-session → status GAPPED, interval in
payload, totals exclude it; prior session COMPLETE fetchable.
**F6 — audience deny (concrete per A-2).** A MEMBER-class token GET
/v1/profile/XSP/session → **403**, deny logged with token class; a
COMPUTING-class token, same request → 200 with bins. Both assertions
required; a build where the member request cannot be made to fail is
a FAIL.
**F7 — identity.** One parameter changed ⇒ new hash ⇒ new generation
id; also the kill-rule watch: live publish == `vp_rebuild`,
byte-identical.
**F8 — /range slice.** Two synthetic sessions; `/range` over both with
a price band returns the summed eligible histogram for exactly that
slice, gaps from both sessions listed.
**F9 — MES→XSP ratio-from-metadata (internal target-space
accumulation).** Ratio 0.1 exact from metadata in the mapping block of
published MES bins (which remain source-space per F3). For the
target-space accumulation path only: MES rows 7682.25/7682.50/7682.75/
7683.00 × 100/150/120/80 → ×0.1 → 768.225/768.250/768.275/768.300 →
XSP grid 0.10 (nearest half-up): `768.2: 100 · 768.3: 350`.
`offset_published` freeze behaves as F3.

**ATs:** AT-4 byte-identity · AT-5 per-part kill/restart · AT-7 as-of
bytes = freeze bytes · AT-8 grids and ratio constants via metadata,
zero constants in code · AT-9 composite running totals vs a hand-built
two-session fixture · AT-10 odd-lot flip changes eligible volume
exactly by stored odd-lot size · AT-11 bar-proxy placement + flag ·
AT-12 Stage B roll seam: two contract-sessions spanning a roll
accumulate coherently in target space and visibly smear in raw
contract space (negative control) · AT-13 (new) futures session
keying: prints either side of 17:00 CT land under the vendor
`session_end_date`, never a locally computed date · AT-14 (new)
scheduled-halt honesty: the maintenance window per Schedules produces
zero gap markers; an injected disconnect during a scheduled-open
segment produces exactly one.

## 11. Surface contract

This service has no member surface (VP-L18). Any internal/dev
rendering of histograms carries the proxy badge (source → target, fit
age, STALE when stamped), status + flags, gap intervals, and the
caption:
> Volume at price from {source} prints, mapped to {target}. Not a
> forecast.
Member-facing surface law lives in the Structural Analysis spec §8.

## 12. Open decisions

**Resolved into law this version:** Q5 EXCLUDE (DL-715) · Q6 (c)
(DL-706) · Q7 (a) (DL-706) · Q10 (b) (DL-714 + Coach architecture
sentence, VP-L18) · Q1 secured (Futures Advanced active, DL-718) · Q2
quotes-only → Ingest EXTENDED sym_feed for SPY trades (DL-709 line) ·
Q3 ES member default RTH-only.

**Open:**
- **Q8** Stage C QQQ→NDX: stub or out-of-scope.
- **Q4 (residual)** Stocks ambiguous-condition resolution pass before
  first member-era publish; futures condition vocabulary
  observed-after-capture, fixture committed from live data.
- **VPB-Q1** Historical mark source for pre-ChainStore offset fits —
  evidence packet owed; decision recorded here on its findings.
- **VPB-Q2** XSP source: SPY (cash-market evidence) vs MES
  (futures-family symmetry) — both captured; decided on Strategy Lab
  side-by-side evidence.
- **Q9 (verification)** symbol-metadata carries `vp_row`, ratio
  constants, calendars — dependency ticket if absent.

## 13. Stamp gate (this version)

- [ ] File complete through §14; triple pre-flighted; sha in DL as the
      review object
- [ ] F1–F5, F7, F8, F9 committed as JSON (F4/F9 with Stage B; F6 a
      harness)
- [ ] Q8 answered; VPB-Q1 evidence landed and decided; Q4 residual
      pass done before first member-era publish
- [ ] Forbidden strings absent per v0.5 §13 list (outside change
      table/§12)
- [ ] AZ-VP-9-A1 landed at Specs/amendments/ with its sha in the DL
- [ ] Composite fence recorded on VPS2-W0; the F3 golden in the VPS2
      build corrected to this version's expectation BEFORE any
      install byte-match
- [ ] Coach hash into the decision log

**BUILD honesty metric:** unchanged — identical bins per generation id
everywhere; mapping-only refresh changes nothing (bins byte-identical
across offset republish); live publish matches `vp_rebuild`
byte-for-byte.

## 14. Round log

- R0–R10 per v0.5. R11: VPS0 stamped (DL-706), CP-1 law (DL-707),
  VPS1 stamped (DL-709), Q10/Q5 ticked (DL-714/715), VPS2-W0 in
  flight, VPSB collector live under DL-718.
- v0.6: resolved decisions folded into law; futures ingest law
  field-proven; MES staging + ratio-from-metadata; vendor-floor
  retention; mark provenance; VP-L18.
- R12 — Advisor round 1: NO-GO, findings A-1..A-4, all carried, none
  dropped.
- v0.6.1 — this document: F3/F4/F9 corrected to Q7(a) (bins never
  move with mapping); VP-L18 deny rule + concrete F6; AZ-VP-9-A1
  citable amendment; composite fenced off VPS2-W0. Next: Advisor
  re-review (triple pre-flight), VPB-Q1 evidence, Q8.
