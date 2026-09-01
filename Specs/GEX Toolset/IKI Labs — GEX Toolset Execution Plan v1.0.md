# IKI Labs — GEX Toolset Execution Plan v1.0

**Status:** **DRAFT** — proposed. Requires Coach GO at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `agents/p-iki-gex/EXECUTION-PLAN-v1_0.md`
**Board:** `p-iki-gex`
**Governs:** the Foundation spec + six tool specs, from spec gate to **staging insertion**
(**GXF49** — insertion is the terminal deliverable, not a live member feature).

---

## 0. Sequencing logic — why this order

Five constraints set the order. None of them is negotiable by preference.

1. **Everything derives from the Profile.** Node Card reads it; Session Path consumes its summaries;
   Field and Tape share its formula (**GXF23**). It ships first, and a defect in it is a defect in
   four tools.
2. **The Flow lens waits on the day roll.** **GXF15** is the toolset's one blocking defect, and
   Flow is worthless-to-harmful without it. OI ships first; Flow is its own phase.
3. **The Surface's plane does not exist and cannot be backfilled.** There is no expiry axis in the
   archive (**GS1**, **GS2**). Its forward capture must **start early and accumulate**, so the
   capture is a **GX1-parallel** workstream even though the tool ships near-last.
4. **The Node Card ships last despite being the cheapest to build.** Highest honesty leverage,
   lowest build cost — that combination argues for last, not first (**OD-NC4**). It gates on the
   misread metric in §4.
5. **The rename lands before seven documents are written against two names** (**OD-GXF1**).

---

## 1. Phases

| Phase | Deliverable | Exit criteria | Gate |
|---|---|---|---|
| **GX-R** | **Runner rename.** `Options Lab Heatmap → Runner` across Arch 29, the Heatmap specs, and `web/lib/options-lab/`. Decision-log entry | Docs and paths consistent; no surface reads "Heatmap" and "Runner" for one thing | Lima · India |
| **GX0** | **Spec gate.** Foundation v0.2 + six tool specs accepted · **all OD tables disposed** (Accept/Override per row) · **P-GX2 and P-GX4 closed** · DL entry · board `p-iki-gex` seeded | Coach GO. **No implementation before this** (`INSTRUCTIONS` §5) | **Coach** |
| **GX1** | **Foundation runtime. No member surface.** `GexPolicy` with boot abort · frame join + basis · hygiene · **volume accounting separated from hygiene** (GXF14) · **roll detection before clamp** (GXF15) · derived row fields · coverage object · per-book session windows + calendar | AT-GXF1–13 · AT-AN1 · AT-GP13 (scale) · characterization suite green · **zero member-visible change** | India · Delta |
| **GX1-P** *(parallel, starts with GX1)* | **Multi-expiry forward capture.** Paged batch producer for enumerated `(symbol, expiration)` pairs; catalog; rate isolation | Producer runs on the session clock; pages followed and recorded; **live path still hard-errors on `next_url`** (AT-GS3); P-GX3 evidence | Foxtrot · India |
| **GX2** | **GEX Profile — OI lens only.** Aggregation, cumulative, **all** sign changes, peaks, regime, coverage strip, clip-is-display | AT-GP1–2, 4–13 (not AT-GP3) · AT-AN2/3/6 · browser walk | India · Echo · Tango · Delta |
| **GX3** | **Bucket plane read path.** Host resolution of `gex_session_bucket` from `svp_v1`; caching by key; local failure state; `first_seen_at` semantics | AT-PF13 · HM21f caching proven (zero re-reads on switch) · **no second archive created** | India · Foxtrot |
| **GX4** | **Session GEX Path.** Two books, crossings band, the 16:00/16:15 divergence, statistics with denominators, recap template | AT-SP1–12 · recap reviewed as copy | Echo · Tango · Hotel · Delta |
| **GX5** | **Pressure Field.** Grid, candles, append-only, absence rendering, resolution honesty. **Gamma model only** | AT-PF1–13 · **AT-PF9** (no regime names) · AA contrast on absent-vs-near-zero | Echo · Tango · Hotel · Delta |
| **GX6** | **Node Tape.** Area-proportional marks, selection disclosure, event guards | AT-NT1–13 · **AT-NT1** (area, not radius) · **AT-NT2** (no fire on marked buckets) | Echo · Tango · Delta |
| **GX7** | **Flow lens** across Profile, Field and Tape. Unsigned; signed objects absent; own `algo_version` | AT-GP3 · AT-PF (flow paths) · AT-NT10 · **AT-GXF7** · **P-GX2 closed** | Hotel · India · Delta |
| **GX8** | **Node Card.** Terms inline, no scalar flip, no rating, print template, gated SSE | AT-NC1–14 · **§4 misread metric clean** · Mike sign-off on the SSE topic | **Hotel** · Mike · Echo · Delta |
| **GX9** | **GEX Surface.** Grid on the GX1-P plane, normalisation disclosure, stacked tag | AT-GS1–14 · plane holds **enough sessions to be worth reading** (OD-GS4) | India · Echo · Hotel · Delta |
| **GX-S** | **Staging insertion**, per component | **GXF52** twelve-row pack complete and evidenced · AT-GXF14–17 · Oscar has the guide source pack · Lima has the DL entry | **Coach** → Factory |

**Parallelism:** GX1-P runs alongside GX1–GX8. GX4, GX5 and GX6 may run concurrently once GX3
lands — they share one plane and one renderer family, but no tool depends on another. Everything
else is sequential.

---

## 2. What ships when — the honest version

| Wave | Components | Notes |
|---|---|---|
| **First** | GEX Profile (OI) | The base computation. Four tools inherit its correctness |
| **Second** | Session Path · Pressure Field · Node Tape (OI) | The session-history family, one plane |
| **Third** | Flow lens | Gated on **GXF15** and **P-GX2** |
| **Fourth** | Node Card | Gated on **§4** |
| **Last** | GEX Surface | Gated on its plane having run |

**A component reaches GX-S when it exits its own phase.** Insertion is per component
(**OD-GXF11**) — a family-level handover would hold four finished tools hostage to two that are
deliberately later.

---

## 3. Probe schedule

| Probe | Runs | Blocks |
|---|---|---|
| **P-GX2** — day roll on a dated expiration | As soon as a wider capture exists (GX1-P) | **GX7** (Flow lens). Turns GXF15's inference into fact |
| **P-GX4** — vendor reconcile, ≥5 contracts × ≥3 days, signs reported | Before **GX0** | Any tolerance claim in `AN-V3`. **If the sign inverts, the convention is not understood and GX0 waits** |
| **P-GX3** — multi-expiry page count, latency, rate cost | During GX1-P | Sizes the capture; proves **GS3** affordable |
| **P-GX1** — measured bytes per session | During GX3 | Retention decision (Foundation §11) |
| **P-GX5** — rate of hygiene drops spanning a bucket boundary | During GX6 | Bounds `AN-N3` from mechanism to number |

---

## 4. The misread gate

Carried from SVP §18, because the failure it guards is the same one and this toolset has six
surfaces exposed to it rather than one.

| Metric | Target |
|---|---|
| Coverage-strip glance | Member correctly recalls the session's scope and completeness in a 10-second task |
| Band-clipped or gapped day | Member states the missing region is **absent data**, not zero gamma |
| Zero extra fetches on switch | AT-GP6 / AT-GS1 / AT-PF2 / AT-NT12 / AT-SP11 hold on a healthy stream |
| Digit match across tools | AT-GP12 / AT-NC13 / AT-SP1 hold |
| **"Wall / magnet / pin" misreads in support, Discord and journal, first two weeks after GX2** | **Near zero. If it is not, GX8 does not ship.** |

That last row is the honest version of every copy rule in the specs. The Node Card is the component
that most efficiently propagates a misread, so it is the one held behind the evidence that members
are not making one.

---

## 5. Definition of done, per packet

Every packet satisfies `INSTRUCTIONS` §7 in full. Restated only where this project adds to it:

- [ ] Change declared (exact files, exact changes) and approved **before** implementation
- [ ] Only approved files touched
- [ ] Characterization suite passes; new characterization tests added in the same change
- [ ] Data-flow verified live: curl the API, read it back, check the UI
- [ ] Spec created or versioned; **decision-log entry lands the same day**
- [ ] No secrets, ports, IDs, dates, hosts or **thresholds** hardcoded (**GXF17**)
- [ ] No MSC imports
- [ ] **No banned strings in copy, chrome, tooltips, legends or payload field names** (**GXF35**)
- [ ] **No magnitude stated without its fixture count** (**GXF39**)
- [ ] **Coverage object on every response; strip on every surface** (**GXF30**, **GXF31**)
- [ ] Evidence attached for Delta: commands, output, curl transcripts, browser walk

---

## 6. Risks, named

| Risk | Mitigation |
|---|---|
| **The Surface's plane is a long lead and could slip the whole family** | It does not. GX1-P is parallel and GX9 is last; nothing else waits on it |
| **The Flow lens ships before GXF15 is right** | It is a separate phase with a probe gate. The temptation is that Flow is the most interesting lens — that is exactly why it is fenced |
| **Six tools drift on shared law** | One `GexPolicy`, one Foundation, six specs that reference rather than restate. **AT-GP12 / AT-NC13 / AT-SP1** test the agreement rather than trusting it |
| **Honest chrome erodes under density pressure** | Compact mode surrenders **decoration** first, never declaration (**GXF43**). The strip is never the thing that gets dropped to fit |
| **Building ahead of the staging line** | **GXF50**, **AT-GXF15**. No landing page, catalog row or pricing surface is produced here |
| **A component enters staging incomplete "to finish there"** | **GXF53**, **AT-GXF14**. The rejection names the missing rows |

---

## 7. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-01 | Initial. GX-R rename precursor · GX0 spec gate · GX1 foundation runtime with GX1-P parallel capture · GX2 Profile · GX3 plane · GX4–6 session family · GX7 Flow · GX8 Card · GX9 Surface · GX-S per-component insertion. Probe schedule, misread gate, per-packet DoD, named risks |

**One-line law:**
**Profile first because four tools inherit it, Flow only after the roll is right, the Surface's
capture started early and shipped last, the Card held behind evidence that members are not
misreading the family — and nothing built past the staging line.**