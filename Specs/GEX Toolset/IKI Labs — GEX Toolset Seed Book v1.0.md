# IKI Labs — GEX Toolset Seed Book v1.0

**Status:** **DRAFT** — proposed. Seeds are not executable until **GX0** GO.
**Date:** 2026-09-01
**Canonical filename:** `agents/p-iki-gex/seeds/SEED-BOOK-v1_0.md`
**Board:** `p-iki-gex` · **Orchestration:** Juliet · **Final authority:** Coach

**How to read this.** One packet per phase of
[`IKI-Labs-GEX-Toolset-Execution-Plan-v1_0.md`](./IKI-Labs-GEX-Toolset-Execution-Plan-v1_0.md).
Each satisfies `INSTRUCTIONS` §6: project, callsign, task sequence, files in scope, out-of-scope
declarations, applicable invariants, verifiable completion criteria, and the gate it feeds.

**Seed test (`INSTRUCTIONS` §6):** *if a seed cannot be executed from cold, it isn't finished.*
Each packet below is written to that standard. At board seeding they split into individual files
under `agents/p-iki-gex/seeds/`.

**Universal preamble — applies to every packet, never restated inside one.**

> Read `agents/bench/<callsign>.md`, `agents/bench/doctrine.md`, and
> `agents/bench/first-principles-doctrine.md`. Read the Foundation spec **v0.1 and v0.2**, the
> Known Anomalies Register, and the tool spec for your packet. **Declare the exact files and exact
> changes before touching anything, and touch only what was approved** (invariant 5). All
> coordination flows through Coach or Juliet; direct agent-to-agent contact is prohibited.
> **Three genuine failed attempts at one approach ⇒ stop and re-derive from first principles.**

**Universal out-of-scope — applies to every packet:**

> Anything past the staging line: landing pages, catalog rows, pricing surfaces, product marketing
> copy (**GXF50**). Member guides and wiki pages (**GXF47** — Oscar's, §14). The Factory pipeline
> itself (**GXF48**). MSC imports of any kind. Any file not named in your packet.

---

## 1. GX-R — Runner rename

| | |
|---|---|
| **Callsign** | **Lima** (lead) · India (review) |
| **Feeds gate** | Lima · India |

**Tasks.** 1. Land the decision-log entry recording `Options Lab Heatmap → Runner` and its rationale.
2. Sweep Arch 29, both Heatmap Templates specs, `README`, and the ADMIN-GUIDE for the old name.
3. Rename the registry path and its imports. 4. Verify no surface, doc or path carries both names
for one thing.

**Files in scope.** `Architecture/00-decision-log.md` · `Architecture/29-*.md` ·
`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_{2,3}.md` · `docs/ADMIN-GUIDE.md` ·
`README.md` · `web/lib/options-lab/templates/**` and its import sites.

**Out of scope.** Any behaviour change. This packet renames and nothing else.

**Invariants.** 6 (documentation parity) · 10 (suite green).

**Done when.** Grep for the old name returns only historical decision-log entries. Suite green.
Build clean. DL entry landed the same day.

---

## 2. GX0 — Spec gate

| | |
|---|---|
| **Callsign** | **Juliet** (orchestration) → **Coach** (authority) |
| **Feeds gate** | **Coach GO** |

**Tasks.** 1. Route the Foundation and six tool specs through India → Echo + Tango → Hotel → Mike →
Foxtrot. 2. Drive **every OD table to disposed** — Accept or Override per row, no carried rows.
3. Confirm **P-GX4** closed (vendor reconcile ≥5 contracts × ≥3 days, signs reported) and **P-GX2**
scheduled. 4. Seed the board. 5. Lima lands the DL entry.

**Files in scope.** `Specs/IKI-Labs-*` · `Architecture/00-decision-log.md` ·
`agents/p-iki-gex/**`.

**Out of scope.** **All implementation.** `INSTRUCTIONS` §5: never begin implementation planning or
coding until the specification is approved.

**Invariants.** 4 (evidence) · 5 (change control) · 6.

**Done when.** Coach GO recorded. Every OD row disposed. **If P-GX4's reconcile sign inverts on any
fixture, GX0 does not close** — the convention is not understood.

---

## 3. GX1 — Foundation runtime

| | |
|---|---|
| **Callsign** | **Alpha** (lead) · **Kilo** (fixtures) · India + Delta (gate) |
| **Feeds gate** | India · Delta |

**Tasks, in order.**

1. `GexPolicy` loader with **boot abort** on missing or invalid config. No defaults in code —
   including `near_zero_threshold`, hygiene thresholds, multipliers and session windows
   (**GXF16**, **GXF17**).
2. Frame join: bind each OPF frame to the underlying's last tick with `ts ≤ frame.ts`; persist
   `basis` when a proxy stands in (**GXF12**, **GXF13**).
3. Quote hygiene per Foundation §5.1.
4. **Volume accounting, separate from hygiene.** Per-contract `last_good_volume` / `last_good_ts`
   carried **across** hygiene drops; mark buckets whose delta spanned a gap (**GXF14**).
5. **Roll detection, before any clamp.** Per contract, by monotonic break, tolerating ≥15 s spread;
   clock is a bound not a trigger; pre-roll reads discarded; first post-roll value to
   `unattributed` under a pre-roll reason code; **then** clamp (**GXF15**).
6. Derived row fields: `gex_oi` signed, `gex_vol` **unsigned** (**GXF11**), `dte_bucket`.
7. Per-book session windows and calendar, including the 13:00 half-day and AM-settled exclusion
   (**GXF19**, **GXF21**).
8. Coverage object per Foundation §12, on every response and artifact.
9. **Kilo:** build the fixture pack — all of §1 of the Acceptance Suite, **including FX-ROLL-SLOW
   and FX-HYGIENE-SUB**.

**Files in scope.** `server/iki_gex/**` (new) · `server/config.py` (policy loading) ·
`server/tests/iki_gex/**` · `server/tests/fixtures/iki-gex/**` · `migrations/NNN_iki_gex_*.sql` if
catalog tables are needed.

**Out of scope.** **Every tool.** No template, no renderer, no member-visible change of any kind.
No web changes. If this packet changes what a member sees, it is wrong.

**Invariants.** 2 (config fail-loud — this packet's spine) · 4 · 5 · 10.

**Done when.** AT-GXF1–13 pass, **AT-GXF8 on both roll fixtures** and **AT-GXF9 on both hygiene
fixtures**. AT-AN1 passes. Characterization suite green. A deliberate config omission aborts boot,
demonstrated. **Zero member-visible change**, demonstrated.

---

## 4. GX1-P — Multi-expiry forward capture *(parallel with GX1)*

| | |
|---|---|
| **Callsign** | **Foxtrot** (lead) · Alpha (producer) · India (gate) |
| **Feeds gate** | Foxtrot · India |

**Tasks.** 1. Batch producer over enumerated `(symbol, expiration)` pairs — **the enumerated list is
config, written out** (**GS3**, OD-GXF7). 2. **Follow pagination** and record `pages`; the live path
keeps its `next_url` hard error, untouched (**AT-GS3**). 3. Catalog rows and job state in MySQL;
bulk on the existing mount, existing role, **no new mount role** (**SV10**). 4. Rate isolation: the
producer defers to the live Market Bus budget and never runs on an interactive path. 5. Run **P-GX3**
and record page count, latency and rate cost.

**Files in scope.** `server/iki_gex/capture/**` · `migrations/NNN_*.sql` · `infra/` scheduling ·
`server/tests/iki_gex/capture/**`.

**Out of scope.** The GEX Surface tool. Any read surface. Any change to the live generation path.

**Invariants.** 1 (no MSC) · 2 · 4.

**Done when.** Producer runs on the session clock under supervision; FX-NEXTURL proves both laws in
one run; P-GX3 evidence recorded; rate isolation observed on the production host. **The capture then
runs continuously — its history is GX9's prerequisite.**

---

## 5. GX2 — GEX Profile (OI lens)

| | |
|---|---|
| **Callsign** | **Alpha** (compute) · **Echo** (surface) · India · Tango · Delta |
| **Feeds gate** | India · Echo · Tango · Delta |

**Tasks.** 1. Registry template `gex-profile`, layout `profile`, **no data plane**. 2. Transforms
per spec §4 — aggregation, ascending sort, cumulation **low-strike-upward and stated on the axis**,
**all** sign changes with a count, peaks, regime from config. 3. **Clipping is display-only** —
never re-cumulate on the window (**GP5**). 4. Coverage strip, persistent, never a hover.
5. Spot line at true proportional position; ATM row emphasised separately. 6. Sign-change marks
between bracketing strikes, each labelled.

**Files in scope.** `web/lib/options-lab/templates/gexProfile.ts` · `registry.ts` ·
`web/components/options-lab/**` · `server/iki_gex/profile.py` · tests.

**Out of scope.** **The flow lens** (GX7 — the control renders disabled with its reason). Node
Card. Any Analyzer emission. Any plane.

**Invariants.** 4 · 5 · 8 (no profit claims) · 10.

**Done when.** AT-GP1–2 and 4–13 pass (**not** AT-GP3). AT-AN2/3/6 pass. Browser walk attached.
FX-CROSS3 renders three marks with a count; FX-CROSS0 emits no interpolated value; FX-NULLΓ
produces invalid cells and **no zero bars**; FX-AMSETTLE contracts are excluded.

---

## 6. GX3 — Bucket plane read path

| | |
|---|---|
| **Callsign** | **Alpha** (lead) · Foxtrot (mount) · India (gate) |
| **Feeds gate** | India · Foxtrot |

**Tasks.** 1. Host resolution of `gex_session_bucket` from `svp_v1` — **the host fetches, never the
template** (**HM21b**). 2. Cache by key: template, lens, side and mode switches cost **zero**
re-reads (**HM21f**). 3. `first_seen_at` semantics surfaced per strike (**GXF29**). 4. Local, loud
failure state — never a silent fallback to the live chain under the same label (**HM21g**).
5. Never on a live write or interactive path; the volume stalls (**AN-N5**). 6. Run **P-GX1**.

**Files in scope.** `server/iki_gex/planes/**` · host resolution in the Runner workspace host ·
tests.

**Out of scope.** **Building any archive.** This packet **reads** `svp_v1` and the StudioOne Archive
Read API. Creating a second capture of the same measurement is a doctrine violation
(**GXF25**, `INSTRUCTIONS` §8).

**Invariants.** 1 · 2 · 4.

**Done when.** AT-PF13 passes. Zero re-reads on switch, demonstrated by call-count assertion.
Plane failure renders locally without taking the workspace. P-GX1 bytes recorded. **No new storage
tree created**, demonstrated.

---

## 7. GX4 — Session GEX Path

| | |
|---|---|
| **Callsign** | **Charlie** (lead) · Echo (surface) · Hotel · Tango · Delta |
| **Feeds gate** | Echo · Tango · Hotel · Delta |

**Tasks.** 1. Consume Profile summaries — **never recompute** (**SP1**). 2. Two book series,
shared axis, **never summed or ratio'd** (**SP4**). 3. **Crossings band** — all crossings per
bucket with counts; no single flip line (**SP2**). 4. Expiring series **terminates settled** at
16:00 while the full series runs to 16:15 (**SP3**). 5. Statistics **with observed/expected bucket
counts** (**SP5**). 6. Event detection with Node Tape's guards. 7. Recap template — drafted, then
**reviewed by Echo and Tango as copy**, not shipped as a format string (**SP7**).

**Files in scope.** `web/lib/options-lab/templates/sessionGexPath.ts` · series renderer (new) ·
`server/iki_gex/path.py` · tests.

**Out of scope.** Flow lens. Journal auto-filing (**OD-SP3** — member-initiated only). Alerts.

**Invariants.** 4 · 8 · 10.

**Done when.** AT-SP1–12 pass. FX-EXPIRY-SPLIT shows the divergence rendered, not averaged.
FX-DEGRADED renders statistics with denominators and the session marked. Recap template reviewed
and its version recorded.

---

## 8. GX5 — Pressure Field

| | |
|---|---|
| **Callsign** | **Echo** (lead, surface-heavy) · Alpha (compute) · Hotel · Tango · Delta |
| **Feeds gate** | Echo · Tango · Hotel · Delta |

**Tasks.** 1. Grid at the **stored** grain; live-tail and archive regions distinguishable and named
(**PF1**). 2. `bucket_agg` declared in payload and on the strip (**PF2**). 3. **Listed strikes
only** (**PF3**). 4. **Append-only** — a config or model change never rewrites a past column
(**PF4**). 5. Absent cells visually distinct from near-zero, verified at AA (**PF6**, **GXF33**).
6. Candles on the bucket clock (**PF11**). 7. **Legend states sign and units only** — no damping,
amplifying, or any variant (**PF9**).

**Files in scope.** `web/lib/options-lab/templates/pressureField.ts` · matrix renderer time-column
support · `server/iki_gex/field.py` · tests.

**Out of scope.** Delta and charm lenses (**PF7** — absent from the control set unless computed).
The residual-book view (**OD-PF3**). Flow lens.

**Invariants.** 4 · 8.

**Done when.** AT-PF1–13 pass, **AT-PF9 explicitly**. FX-BAND-SHIFT renders absent rows with no
first-sighting burst. FX-GAP-54 renders absence with **no interpolation**. AA contrast evidence
attached for absent-vs-near-zero.

---

## 9. GX6 — Node Tape

| | |
|---|---|
| **Callsign** | **Charlie** (lead) · Echo (renderer) · Tango · Delta |
| **Feeds gate** | Echo · Tango · Delta |

**Tasks.** 1. Scatter renderer (new). 2. **Area-proportional marks** — `r ∝ √|value|`, with a size
key in the legend (**NT1**). 3. Selection parameters `k` and `min_abs` **on the surface**
(**NT4**); `min_abs` from config, never `"auto"`. 4. Trail that **breaks** on unselected buckets
(**NT3**). 5. Event guards: no fire on a marked bucket (**NT6**), none before roll completion
(**NT7**), `observation_buckets` before decay is eligible with `reference_t` on the event
(**NT8**). 6. Sign carried by a second channel besides hue (**NT5**). 7. Run **P-GX5**.

**Files in scope.** `web/lib/options-lab/templates/nodeTape.ts` · scatter renderer (new) ·
`server/iki_gex/tape.py` · tests.

**Out of scope.** **Publishing events beyond the surface** — no SSE, no alerts, no journal
(**OD-NT2**; an event stream is a signal product and needs its own Hotel gate). DEX/VEX/charm
greeks. Flow lens.

**Invariants.** 4 · 8.

**Done when.** AT-NT1–13 pass. **FX-BUBBLE-4X proves 4:1 area, not radius.** FX-HYGIENE-SPAN
produces zero events in the marked bucket. FX-EARLY-DECAY produces no decay event. Greyscale
render shows sign distinguishable. P-GX5 rate recorded.

---

## 10. GX7 — Flow lens

| | |
|---|---|
| **Callsign** | **Alpha** (lead) · **Hotel** (gate) · India · Delta |
| **Feeds gate** | **Hotel** · India · Delta |

**Tasks.** 1. `gxflow_v1` — its own algo version, units label and baseline. 2. Wire the lens into
Profile, Field and Tape. 3. **Signed objects absent, not hidden** — no crossings, peaks, regime or
cumulative under flow; controls disabled **with the reason on the strip** (**GXF11**, **GP2**).
4. Never summed, ratio'd, stacked or scored with `gex_oi` (**GXF11**). 5. Surface states the
missing-side limitation wherever the lens is active (**AN-A3**).

**Files in scope.** `server/iki_gex/flow.py` · lens wiring in the three templates · tests.

**Out of scope.** **Node Card and Session Path under flow** — both publish no signed object and are
handled in their own packets (**NC11**, **SP8**). GEX Surface.

**Invariants.** 2 · 4 · 8.

**Gate condition.** **P-GX2 must be closed** — the day roll confirmed on a dated expiration, so
**GXF15** rests on fact rather than inference. Hotel does not sign otherwise.

**Done when.** AT-GP3, AT-NT10, AT-GXF7 pass. A payload under flow contains **no** signed field.
Every disabled control states its reason.

---

## 11. GX8 — Node Card

| | |
|---|---|
| **Callsign** | **Alpha** (lead) · **Mike** (SSE + entitlement) · **Hotel** (gate) · Echo · Delta |
| **Feeds gate** | **Hotel** · Mike · Echo · Delta |

**Tasks.** 1. Payload contract with **`terms` required** — a message missing any term is **not
emitted** (**NC1**). 2. **No scalar `flip`** — `sign_changes[]` + count (**NC2**). 3.
`secondary_concentrations`, never "defense lines" (**NC3**). 4. `anchor.expiry: null` on a rollup
profile (**NC5**). 5. **No rating field in any build**; no ranked level list (**NC7**, **NC8**).
6. Print template with the terms line, **reviewed by Echo and Tango**, versioned (**NC9**).
7. SSE topic authenticated, entitlement-gated, universe-gated (**NC10**). 8. Alerts **off** in a
fresh member state (**NC12**).

**Files in scope.** `server/iki_gex/card.py` · `server/routes/iki_gex.py` (SSE) ·
`web/components/options-lab/NodeCard.tsx` · print template · tests.

**Out of scope.** Journal auto-filing (**OD-NC5**). Dual-scope publish by default (**OD-NC3**).
Flow lens card (**NC11**).

**Invariants.** 2 · 4 · 8.

**Gate condition.** **The §4 misread metric of the execution plan must be clean** — near-zero
wall/magnet/pin misreads in support, Discord and journal for two weeks after GX2. **If it is not,
GX8 does not ship.** This is the gate the whole copy law exists to enforce, and it is not waivable
(`INSTRUCTIONS` §6 — a waived gate is a doctrine violation; Delta has standing to refuse Coach).

**Done when.** AT-NC1–14 pass. A grep for a 1–5 score returns nothing. An unauthenticated SSE
subscriber is rejected, and so is an entitled-symbol mismatch. The print template renders the terms
line at every supported size.

---

## 12. GX9 — GEX Surface

| | |
|---|---|
| **Callsign** | **Alpha** (lead) · Echo (surface) · India · Hotel · Delta |
| **Feeds gate** | India · Echo · Hotel · Delta |

**Tasks.** 1. Matrix over the GX1-P plane; **listed strikes and listed expiries only** (**GS7**).
2. **Normalisation declared on the strip**, with the within-column caveat in the legend
(**GS5**). 3. Absolute value in hover regardless of mode (**GS6**). 4. Peak / counter-peak by
neutral names; counter-peak **absent** when no opposite-side cell exists (**GS10**). 5. Stacked tag
with `stack_min` from config. 6. Held-to-clock rows marked (**GS14**). 7. **VEX hidden** unless its
derivation and units exist (**GS8**).

**Files in scope.** `web/lib/options-lab/templates/gexSurface.ts` · matrix renderer expiry columns ·
`server/iki_gex/surface.py` · tests.

**Out of scope.** Backfill of any kind — **there is nothing to backfill from** (**GS2**).
Member-chosen expiry sets (**OD-GS5**). Flow-lens signed marks (**GS12**).

**Invariants.** 2 · 4 · 8.

**Gate condition.** The GX1-P capture has run long enough that the grid is worth reading
(**OD-GS4**). A Surface with three sessions of history teaches less than no Surface.

**Done when.** AT-GS1–14 pass. FX-MULTIEXP proves the normalisation disclosure and that absolute
values are unchanged by mode. A pre-capture session returns explicit no-data, never an empty grid.

---

## 13. GX-S — Staging insertion *(per component)*

| | |
|---|---|
| **Callsign** | **Juliet** (assembly) · **Lima** (DL + parity) · **Coach** (authority) |
| **Feeds gate** | **Coach** → Factory |

**Tasks.** 1. Assemble the **GXF52** twelve-row insertion pack for the component. 2. Confirm every
OD row for that component is **disposed**. 3. Hand the guide source pack to Oscar (§14). 4. Produce
the **facts sheet** — what it computes, what it declines to claim, its known limits, its scope, in
the register's language. **Not marketing copy** (**GXF54**). 5. Lima lands the DL entry and the
Architecture companion the same day.

**Files in scope.** `agents/p-iki-gex/gate-reports/**` · `Architecture/00-decision-log.md` ·
`Architecture/29-*.md` · `docs/ADMIN-GUIDE.md` · the facts sheet.

**Out of scope.** **Everything past the line** — the landing page, the product record, the catalog
entry, pricing, and the staging operation itself (**GXF48**, **GXF50**). Do not build them, do not
draft them, do not prototype them.

**Invariants.** 4 · 5 · 6 · 7 (component stays `status: draft`; the promotion gate is human and is
staging's).

**Done when.** AT-GXF14–17 pass. All twelve rows evidenced. **A pack missing any row is rejected
and the rejection names the missing rows** (**GXF53**) — a partial handover is not accelerated by
being accepted.

---

## 14. Oscar handoff — guide source pack

| | |
|---|---|
| **Callsign** | **Oscar** (Knowledge Bench compiler, seated product-local) |
| **Feeds gate** | Echo · Tango · Hotel (copy) |

**Oscar owns L3** — member user guides and wiki pages (**GXF47**). This project owns L1 (payload)
and L2 (surface strip) and hands over the source.

**What each component's pack contains** (Foundation §16):

1. **What the number is** — formula, units, sign convention **named as an assumption**
2. **What it is not** — the non-goals verbatim, including the four parity claims declined by name
3. **Every coverage field in plain language** — with its measured magnitude **and the date measured**
4. **When to distrust the picture** — the stochastic anomalies and what each looks like on screen
5. **What is always true** — the deterministic anomalies (roll, OI staleness, the two closes, AM
   settlement, multiple crossings)

**Binding on Oscar's output, not negotiable:**

| | |
|---|---|
| **Copy law applies in full** (**GXF35–GXF39**) | A guide is not where the mechanism→outcome step becomes acceptable because there is room to explain it |
| **Every magnitude carries its fixture count** (**GXF39**) | "+0.52 % on one contract on one day", never "+0.52 %" |
| **The guide is L3, not the declaration** | It explains a strip the member can already see. It never becomes the only place an anomaly appears |
| **Deterministic vs stochastic split preserved** (**GXF32**) | Always-true facts read as always-true; per-session counts read as per-session |

**Out of scope for Oscar.** The landing page and catalog entry — staging's (**GXF50**).

---

## 15. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-01 | Initial seed book. Thirteen packets plus the Oscar handoff, each cold-executable per `INSTRUCTIONS` §6. Universal preamble and universal out-of-scope factored out. Two non-waivable gate conditions recorded: **GX7** waits on P-GX2; **GX8** waits on the misread metric |

**One-line law:**
**Every packet declares its files before it touches them, names what it may not do, and ends at a
gate someone other than its author signs.**