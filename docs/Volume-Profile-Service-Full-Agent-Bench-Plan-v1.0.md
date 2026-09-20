# Volume Profile Service — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-16  
**Status:** **SUPERSEDED as execution snapshot** by [v1.1](./Volume-Profile-Service-Full-Agent-Bench-Plan-v1.1.md). Kept on disk. Do not stamp this file.  
**Original status:** **Planning candidate — not a build GO.** Spec v0.5 is DRAFT and **truncated on disk**. This file’s first job is that completeness + Stamp Gate. **No product code until `VPS0-W0` is STAMPED and GATE 0 is green.**  
**Plan revision:** **v1.0**  
**Author:** Juliet (orchestration)  
**Authority:** Coach (GO / ship)  
**Canonical land path:** `docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.0.md`  
**Filename convention:** **dot** (`v1.0.md`). Spec on disk uses spaces: `Specs/Volume Profile Service — Spec v0.5.md`.  
**Machine:** StudioTwo holds this **repo / board**. Service **host is StudioOne** (spec §0). This agent does not SSH StudioOne or MiniTwo unless Coach names that host. Never `git add -A`. Do not stop StudioTwo `:3000` / `:4000`.

**Parent spec:** [`Specs/Volume Profile Service — Spec v0.5.md`](../Specs/Volume%20Profile%20Service%20%E2%80%94%20Spec%20v0.5.md) **v0.5 DRAFT** · sha1 `ebdc633d2dd8191f7d01e35f1548347566781168` (155 lines; file ends mid-§6)  
**Baselines on disk (do not plan against):** v0.2 (211 lines, also cuts at §8), v0.1. **No** `Volume-Profile-Service-Spec-v0_4.md` file exists (v0.5 header cites it).  
**Board:** [`agents/p-volume-profile-service/`](../agents/p-volume-profile-service/)  
**Planning token:** [`agents/go/VPS0-W0.md`](../agents/go/VPS0-W0.md) — **AWAITING STAMP**  
**First build token (later):** `agents/go/VPS1-W0.md` — **do not create until GATE 0 PASS**

**Not this program (do not reopen):**

| Tree | Why it is a different product |
|------|-------------------------------|
| `agents/p-volume-profile-histogram/` · Spec `FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md` · plan `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md` | Labs dual-store / `marketOhlc*` residual chart · sabrant2tb · **DL-324** |
| `agents/p-session-volume-profile/` | Heatmap **session-volume** auxiliary plane (LIM E14) |
| Options Lab XSP/SPY scale · LIM · QFRIC · PPL · Help Watch | Active other trees |

**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review-workflow Phase 6.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
Coach overrule of a specialist finding = **DL entry with reasoning**, not a silent waive.

---

## 0. Sequencing gate (first entry — spec header + §13)

Spec v0.5 header, carried verbatim:

> Status: DRAFT — contract close. **NOT BUILD.** No plan ticket until the Stamp Gate (§13) is green and this file's shasum is in the decision log.

**On-disk fact (2026-09-16, StudioTwo):** the file is **155 lines** and **ends mid-sentence in §6** (`…degrades only the`). Cited §7 status+flags, §8 archive-range API, §10 fixtures, §11 surface, §12 Qs, §13 Stamp Gate **are not in the file**. v0.2 is also truncated (ends at `## 8. Part 3 — Profile API`). This is the same class of defect Grok round-5 called G2-1/2/3; v0.5 claimed it was a transmission artifact already fixed. **It is not fixed on disk.**

```text
GATE 0   restore v0.5 completeness + §13 green + sha1 in DL + Q5 value
   │     (no Ingest, no Engine, no API, no consumer cutover)
   ▼
VPS0-W0  STAMP  ──► VPS1 Ingest Stage A ──► VPS2 Engine histograms
                                          ──► VPS3 Mapping
                                          ──► VPS4 API
                                          ──► VPS5 kill / cutover
Part four (Structural Analysis)  PARKED
```

| Gate | Today | Implication |
|------|-------|-------------|
| **GATE 0** completeness | **FAIL** — truncated v0.5 | No `VPS1-W0`. No StudioOne ingest packet |
| **§13 Stamp Gate** | **Not on disk** | Cannot be green |
| **Q5** `vp.include_oddlots` | **OPEN — blocks first published payload** | No Engine publish |
| Histogram dual-store W0-G | PASS (other tree) | **Not** credit for this service |

A seed that edits `server/` or `web/` product paths, StudioOne collectors, or `marketOhlc*` **before GATE 0 + `VPS1-W0`** is **FAIL**.

**This planning file is not a plan ticket in the spec’s sense.** It is the Juliet DAG so Coach can stamp. It does **not** authorize build.

---

## 1. Why this plan exists

v0.5 is a **new StudioOne service**: prints → finest honest volume-at-price histograms → API. It is **not** the Labs histogram dual-store and **not** heatmap session-volume.

**Spine (do not re-litigate once GATE 0 restores the rest of the file):**

> Three parts, independently testable. Engine reads only Ingest. API reads only Engine (**VP-L7**). Published bins come only from this service (**VP-L8**). Rendering consumers **render served bytes only** (**VP-L2**). The service publishes **no analysis** (**VP-L1**): POC, value area, HVN, LVN, VWAP-as-level, node, edge, crevasse, “level”, “target” as a label are **forbidden**. Those objects are **part four**, a future spec.

Stage **A** is the only build scope: **SPY prints → XSP** `target_symbol`. Stage B (ES→SPX) after A + Q1. Stage C (QQQ→NDX) pending Q8.

---

## 2. Law this plan executes (from v0.5 text that **is** on disk)

| ID | Law |
|----|-----|
| **VP-L1** | Allowed nouns in served **labels**: volume, row, histogram, session, composite, developing, source, basis, gap. Forbidden in labels: POC, value area, VAH, VAL, VWAP, HVN, LVN, node, edge, crevasse, level, target, predictive verbs. Metadata key `target_symbol` is permitted |
| **VP-L2** | Rendering consumers (Options Lab canvas, heatmap, Analyzer) render **served bytes only**. Computing consumers (future Structural Analysis, Strategy Lab) may derive |
| **VP-L6** | Same archive + same parameter set ⇒ byte-identical histograms. Parameter-set hash on every payload |
| **VP-L7** | Engine reads only Ingest; API reads only Engine |
| **VP-L8** | Published bins only from this service. Client `marketOhlc*` binning is a **retired estimator**, never a diff reference, never a pass/fail gate |
| **VP-L10** | Mapping: ratio locked at 1; offset-only; publish-freeze ≥ one source `vp_row`. Stage B cross-session accumulation **only in target (SPX) space** |
| **VP-L14** | Volume = size. Footprint / delta / aggressor out of scope |
| **Kill** | Fires only when **both**: (1) live publish == `vp_rebuild` byte-identical for **10 consecutive RTH** (F7); (2) every **rendering** consumer no longer calls `marketOhlc*` for VP. Until then, client bins residual, never shown alongside service bins |
| **Row** | Grid from symbol-metadata `vp_row` (SPY 0.10, ES 0.25). Print at p → `floor(p / vp_row) × vp_row`, half-open `[row, row + vp_row)` |
| **Histogram** | Integer volume per row; zero rows served as zero across the traded span; never dropped, never interpolated. Gaps excluded and listed |
| **Windows** | Session (one RTH); developing (current session, `vp.update_cadence = 15 s`, volume-driven); composite per **Q6** |
| **Bars-as-proxy** | Full bar volume on vendor-VWAP row else close; `approximation` flag end-to-end; never smear high–low |
| **Gap** | (1) feed-liveness disconnect/restart; (2) print-absence backstop `vp.gap_min_seconds = 300` inside RTH. Quiet-but-printing tape is never a gap |
| **Fit** | One candidate pair per second (latest eligible source print vs latest ChainStore target mark, timestamps within 1 s). Valid over trailing 5 min: pairs ≥ 30, RMSE ≤ 1 target row, newest mark age ≤ 15 s, clock skew ≤ 500 ms. Else `flags.mapping = FAILED`; last good mapping `STALE` within TTL 120 s |
| **Q7 lean** | **(a)** source-space bins + mapping block; consumers apply published offset. Mapping failure never blocks source bins |
| **Q6 lean** | **(c)** all-history running totals |
| **Parents** | AZ-VP-9 (amendment pending Q10 + part-four), AZ-VP-3, AZ-VP-6; GEX Quad complement; OPF named-state doctrine |

**Do not execute v0.1/v0.2 Engine procedures (POC / VA / HVN / LVN / VWAP levels).** v0.5 parked them. A seed that ships those as this service’s payload is **FAIL**.

**v0.2 named states** `COMPLETE \| GAPPED \| VA_UNPUBLISHED \| MAPPING_FAILED \| UNAVAILABLE` are **not** this plan’s model. v0.5 carries **status + flags** (G2-4). Exact schema is in missing §7 — GATE 0 restores it. Until then, seeds **shield**: do not invent an enum.

---

## 3. Open decisions (Coach ticks — no silent default)

From v0.5 §12 citations in the change table and body. Values in **lean** are Coach direction already in v0.5; they still need the stamp tick.

| ID | Question | Lean in v0.5 | Blocks |
|----|----------|--------------|--------|
| **Q1** | Stage B ES→SPX member-facing precondition | After A; precondition stands | VPS-B (not Stage A) |
| **Q2** | Ingest extends `sym_feed` vs sibling collector | On-machine | VPS1 |
| **Q4** | Closed sale-condition list as fixture | Required at BUILD | VPS1 Engine eligibility |
| **Q5** | `vp.include_oddlots` value | **No default. Blocks first published payload** | VPS2 publish |
| **Q6** | Composite algebra | **(c) all-history running totals** | VPS2 composite |
| **Q7** | Publication space | **(a) source bins + mapping block** | VPS3 |
| **Q8** | Stage C QQQ→NDX | Pending | Not Stage A |
| **Q9** | `vp_row` existence = dependency | Folded into verification | VPS2 |
| **Q10** | AZ-VP-9 amendment + part-four surface law | Pending | Consumer chrome / part four |

**GATE 0 extra ticks (this plan, because the file is incomplete):**

| ID | Tick |
|----|------|
| **G0-1** | Restore the remainder of v0.5 onto disk (§7–§13 at minimum). Completeness pre-flight: line count / heading list / sha1 |
| **G0-2** | That sha1 logged in `Architecture/00-decision-log.md` |
| **G0-3** | §13 Stamp Gate actually present and Coach-green |
| **G0-4** | Confirm Q6=(c) and Q7=(a) on the token (v0.5 lean) |

---

## 4. Isolation (DL-539)

**Do not touch (FAIL if in the diff unless the GO names it):**

| Frozen | Why |
|--------|-----|
| `agents/p-volume-profile-histogram/` and Labs VP dual-store / sabrant2tb campaign | Different product · DL-324 |
| `agents/p-session-volume-profile/` · heatmap `session-volume` enum | LIM E14 |
| LIM / QFRIC / XS / PPL / Help Watch product files | Active other trees |
| `AnalyzerPositionsList.tsx` | Standing freeze |
| Matcher FIFO | PPL freeze |
| `web/lib/marketOhlc*` **delete** before kill rule | Kill is VPS5, two conjuncts |
| OPF store/builder, Market Bus extra sockets | AZ-VP-3 / VP-L3 |
| MiniTwo / DudeTwo | Not this tree unless Coach names |
| Part four structural analysis | Parked |

**In-scope after GATE 0 + `VPS1-W0` (by phase):**

| Phase | Trees (expected; exact paths named on each W0) |
|-------|------------------------------------------------|
| **VPS1** | StudioOne Ingest for SPY prints; archive; gap supervision; Q4 fixture. **This repo** may gain contracts/tests only if the GO names files |
| **VPS2** | Engine: session / developing / composite histograms. **No** POC/VA/HVN |
| **VPS3** | Mapping SPY→XSP; `target_symbol`; flags.mapping; STALE TTL |
| **VPS4** | Profile API v1: rendering payloads + computing **archive-range** query (§8, restored at GATE 0) |
| **VPS5** | Rendering consumer cutover on Options Lab VP canvas / overlays; then kill |

---

## 5. Critical path

```text
VPS0     GATE 0 completeness + §13 + sha1 DL + Q5
         token VPS0-W0  (planning stamp)
   │     no product code
   ▼
VPS1     Volume Ingest Stage A (SPY)
         GO: VPS1-W0  (Q2, Q4 fixture, odd-lot storage always)
   ▼
VPS2     Profile Engine histograms
         GO: VPS2-W0  (Q5 value required; Q6c composite; Q9 vp_row)
   ▼
VPS3     Mapping SPY→XSP (Q7a)
         GO: VPS3-W0
   ▼
VPS4     Profile API v1 (+ archive-range for computing consumers)
         GO: VPS4-W0
   ▼
VPS5     Consumer cutover + kill (F7 10 RTH ∧ no marketOhlc* VP calls)
         GO: VPS5-W0
```

| Phase | May start | Product code? |
|-------|-----------|----------------|
| **VPS0** | Now as planning; stamp `VPS0-W0` | **No** |
| **VPS1** | GATE 0 PASS + `VPS1-W0` | Ingest only (StudioOne) |
| **VPS2** | VPS1-G PASS + Q5 ticked + `VPS2-W0` | Engine histograms |
| **VPS3** | VPS2-G PASS + `VPS3-W0` | Mapping |
| **VPS4** | VPS3-G PASS + `VPS4-W0` | API |
| **VPS5** | VPS4-G PASS + F7 watch + `VPS5-W0` | Rendering consumers; then kill |

**Do not combine VPS1 with VPS2.** Ingest proves archive before Engine publishes. **Do not combine VPS4 with VPS5.** API proves before canvas cutover.

---

## 6. Acceptance tests (characterization — lock at GATE 0 / VPS2)

Names are plan-level. Exact numbers wait on restored §10 fixtures. Do **not** use client `marketOhlc*` as expected bytes (**VP-L8**).

| AT | Phase | Claim |
|----|-------|--------|
| **AT-VPS-0** | VPS0 | Spec file contains headings §0–§13; sha1 matches DL; Stamp Gate checklist present |
| **AT-VPS-1** | VPS2 | Row assignment: print at p → `floor(p/vp_row)×vp_row` (half-open). Fixture prices on and off the tick |
| **AT-VPS-2** | VPS2 | Zero rows in the traded span are served as **0**, never omitted |
| **AT-VPS-3** | VPS2 | Gap interval listed; gapped time excluded from eligible volume; no interpolation |
| **AT-VPS-4** | VPS2 | Quiet-but-printing tape is **not** a gap |
| **AT-VPS-5** | VPS2 | Developing: no new eligible volume ⇒ no republish (`vp.update_cadence = 15 s`) |
| **AT-VPS-6** | VPS2 | `vp_rebuild` byte-identical to live publish for a fixtured session (F7 identity, single day) |
| **AT-VPS-7** | VPS2 | Payload labels contain none of the VP-L1 forbidden nouns |
| **AT-VPS-8** | VPS3 | Mapping freeze: offset change < one `vp_row` does not rewrite published bins |
| **AT-VPS-9** | VPS3 | Fit invalid → `flags.mapping = FAILED`; last good mapping only as STALE ≤ 120 s |
| **AT-VPS-10** | VPS3 | Q7(a): mapping failure does **not** drop source bins |
| **AT-VPS-11** | VPS4 | Rendering GET returns Engine bytes; computing archive-range is a separate query |
| **AT-VPS-12** | VPS5 | After kill: no rendering consumer calls `marketOhlc*` for VP purposes |
| **AT-VPS-13** | VPS2 | Bars-as-proxy: volume on VWAP-or-close row; `approximation` flag set; never high–low smear |
| **AT-VPS-14** | VPS-B | Stage B roll seam: cross-session accumulation in **SPX space** only (not raw ES) |

**Not ATs of this service:** v0.2 F1/F2 POC/VA ties; HVN/LVN total order. Those wait on part four.

---

## 7. Workstreams and seeds

### VPS0 — completeness + stamp (this file)

| Seed | Agent | Deliverable | Gate |
|------|-------|-------------|------|
| VPS0-0 | Coach | Stamp `VPS0-W0`: GATE 0 intent, Q6=(c), Q7=(a), Q5 value or “blocks VPS2” | VPS0-0 |
| VPS0-1 | India | Completeness pre-flight: required headings, truncation report, parents vs Histogram/SVP isolation | VPS0-1 |
| VPS0-2 | Lima | sha1 of the **complete** v0.5 in DL; filename/dot honesty | VPS0-2 |
| VPS0-G | Delta | GATE 0 PASS only if file is complete, sha1 logged, §13 present | **GATE 0** |

Until VPS0-G PASS, **no VPS1 seed fires**.

### VPS1 — Ingest Stage A

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS1-0 | Foxtrot / Alpha (named on `VPS1-W0`) | StudioOne Ingest: SPY prints; append-only store; gap supervision (KeepAlive + 300 s backstop) |
| VPS1-1 | Alpha / Kilo | Q4 condition-code fixture file; auction=`true`; odd lots **stored** regardless of Q5 |
| VPS1-2 | Mike | Identity/scope if any Labs API is involved; StudioOne vs Labs SSO boundary |
| VPS1-G | Delta | Archive exists; rebuild input complete; no Engine publish yet |

### VPS2 — Engine histograms

Requires **Q5 ticked**. Histogram only.

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS2-0 | Alpha | Session + developing histograms; parameter hash; VP-L1 label lint |
| VPS2-1 | Alpha | Composite Q6(c) running totals |
| VPS2-2 | Kilo | AT-VPS-1…7, 13 goldens |
| VPS2-G | Delta | Byte-identical rebuild for fixture session |

### VPS3 — Mapping

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS3-0 | Alpha | SPY→XSP offset; freeze; fit sampling rule; flags.mapping |
| VPS3-1 | Kilo | AT-VPS-8…10 |
| VPS3-G | Delta | Q7(a) proven: FAILED mapping still serves source bins |

### VPS4 — API

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS4-0 | Alpha | v1 rendering payload; archive-range for computing consumers (schema from restored §8) |
| VPS4-1 | Echo / Tango | No analysis chrome; allowed-noun pass |
| VPS4-G | Delta | AT-VPS-11 |

### VPS5 — Cutover + kill

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS5-0 | Charlie | Rendering consumers consume API; dual-run **without** showing client bins beside service bins |
| VPS5-1 | Kilo | F7 ten-session identity watch; AT-VPS-12 |
| VPS5-G | Delta | Kill conjuncts both true, or BLOCKED |

**Hotel** reviews any member-facing VP copy (no forecast verbs). **Sheldon** if a later packet claims a statistical property the histogram does not support.

---

## 8. Token shape (`VPS0-W0`)

Required ticks (straight-to-build **not** among them):

- [ ] Spec v0.5 **complete on disk** (GATE 0 / G0-1)
- [ ] sha1 in decision log (G0-2)
- [ ] §13 Stamp Gate green (G0-3)
- [ ] Q5 `vp.include_oddlots` = ______ (or explicitly “defer to VPS2-W0, still blocks publish”)
- [ ] Q6 = (c) all-history running totals
- [ ] Q7 = (a) source-space bins + mapping block
- [ ] Isolation: do not reopen Histogram dual-store or SVP heatmap boards
- [ ] StudioOne named for Ingest; this agent does not SSH unless Coach writes the host

Build packets **VPS1+** require a **later** `VPS1-W0`.

---

## 9. Isolation FAIL list (every gate)

Diff contains any of: `AnalyzerPositionsList.tsx`; LIM / QFRIC / XS / PPL product; `p-volume-profile-histogram` campaign code; heatmap `session-volume` enum; POC/VA/HVN/LVN **payload** fields; MiniTwo deploy. → **FAIL**.

---

## 10. Out of scope (this version)

- Part four Structural Analysis Service  
- Stage B/C product (spec’d; not Stage A build)  
- Footprint, delta, bid/ask aggressor  
- Killing `marketOhlc*` before VPS5  
- Teaching LIM/QFRIC/XS from this board  
- Help Watch (separate)  
- DudeTwo migration (permitted later without contract change; not this plan)

---

## 11. Version history

| Ver | Date | Note |
|-----|------|------|
| **1.0** | 2026-09-16 | Juliet plan from Spec v0.5. GATE 0 first: file truncated at §6. New board. Histogram dual-store and SVP not this tree. Not GO. |
