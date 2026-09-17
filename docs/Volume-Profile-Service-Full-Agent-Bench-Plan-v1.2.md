# Volume Profile Service — Full Agent Bench Plan v1.2

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-16  
**Status:** **Planning candidate — not a build GO.** `VPS0-W0` is **STAMPED** (**DL-706**). **CP-1** is standing law (**DL-707**). No Ingest until Q2 + `VPS1-W0`.  
**Plan revision:** **v1.2** (v1.1 SUPERSEDED as execution snapshot; kept on disk)  
**Author:** Juliet (orchestration)  
**Authority:** Coach (GO / ship)  
**Canonical land path:** `docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md`  
**Filename convention:** **dot** (`v1.2.md`). Specs: **underscore** `Specs/Volume-Profile-Service-Spec-v0_5.md`.  
**Supersedes:** [`docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.1.md`](./Volume-Profile-Service-Full-Agent-Bench-Plan-v1.1.md)  
**Parent:** v1.1. **v1.2 freeze:** **CP-1 Chain primacy** only. Spine, VP-L1…L17, Stage A = SPY→XSP, kill conjuncts, sibling trees **not** re-opened.

**Machine:** Repo, board, and agent execution: **StudioTwo**. Deployment and runtime: **StudioOne** (spec §0). StudioOne is touched **only** by packets whose GO names it **and** that carry **CP-1**. No first-time install or cutover during RTH. MiniTwo / DudeTwo are **not this tree**. Never `git add -A`. Do not stop StudioTwo `:3000` / `:4000`.

**Parent spec:** [`Specs/Volume-Profile-Service-Spec-v0_5.md`](../Specs/Volume-Profile-Service-Spec-v0_5.md) **v0.5 DRAFT** · sha1 `a487a702dff7de45f3a0d4ba0ca09199bd2586dd` (358 lines · 16 `## ` headings · last `## 14. Round log`) · **DL-705**  
**Baseline freeze:** [`Specs/Volume-Profile-Service-Spec-v0_4.md`](../Specs/Volume-Profile-Service-Spec-v0_4.md) · sha1 `9b4a56e0dceaa2a4a1f25430dc8cf6356b4b5cd8`  
**CORRUPT ARTIFACT (do not bind):** `Specs/Volume Profile Service — Spec v0.5.md` · sha1 `ebdc633d2dd8191f7d01e35f1548347566781168` · 155 lines  
**Board:** [`agents/p-volume-profile-service/`](../agents/p-volume-profile-service/)  
**Planning token:** [`agents/go/VPS0-W0.md`](../agents/go/VPS0-W0.md) — **STAMPED GO** · **DL-706** · VPS0 **CLOSED**  
**Q2 token:** [`agents/go/VPS-Q2-W0.md`](../agents/go/VPS-Q2-W0.md) — **must carry CP-1**; StudioOne **outside RTH**; not executed in the CP-1 packet  
**First build token (later):** `agents/go/VPS1-W0.md` — **do not create until Q2 evidence + CP-1 AFTER check**

### Changes since v1.1

| # | Change | Driven by |
|---|--------|-----------|
| 1 | Standing law **CP-1 Chain primacy** (verbatim) · **DL-707** | Coach 2026-09-16 |
| 2 | Every StudioOne GO: (a) CP-1 verbatim (b) resource footprint vs chain_feed (c) BEFORE/AFTER process + last-snapshot freshness (d) rollback line | CP-1 |
| 3 | Isolation FAIL: AFTER chain_feed degraded → packet FAIL, rollback immediately | CP-1 |
| 4 | `VPS0-W0` stamped; VPS0 closed | **DL-706** |

v1.1 Claude (a)–(d) remain in force.

### Standing law — CP-1 (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

### Claude findings fold — required for v1.1 (still in force)

Spine, isolation, and phase order unchanged.

| ID | Finding | v1.1 disposition |
|----|---------|------------------|
| **(a)** | §0 Q5 wording vs token | Gate table: **value or explicit deferral to VPS2-W0; blocks publish either way** |
| **(b)** | Law table incomplete / leans mixed in | Re-keyed to restored spec **VP-L1…L17**. Q6/Q7 leans live in **§3 only** |
| **(c)** | MACHINE / StudioOne SSH risk | StudioTwo execution; StudioOne only when a GO names it; no RTH install/cutover; MiniTwo/DudeTwo not this tree |
| **(d)** | AT-VPS-14 in Stage A counts | **Excluded.** Stage B, parked. Stage A gate ATs are AT-VPS-0…13 |

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

```text
GATE 0   complete v0.5 on disk + §13 present + sha1 in DL
         Q5 = value or explicit deferral to VPS2-W0 (blocks publish either way)
   │     (no Ingest, no Engine, no API, no consumer cutover)
   ▼
VPS0-W0  STAMP  ──► VPS1 Ingest Stage A ──► VPS2 Engine histograms
                                          ──► VPS3 Mapping
                                          ──► VPS4 API
                                          ──► VPS5 kill / cutover
Part four (Structural Analysis)  PARKED
```

| Gate | Today (2026-09-16, StudioTwo) | Implication |
|------|-------------------------------|-------------|
| **GATE 0** completeness | Restore **on disk** — 358 lines, sha1 `a487a702…`, 16 headings through §14 · **DL-705** | Token still **AWAITING STAMP** |
| **§13 Stamp Gate** | **Present** in restored file; Coach boxes **unticked** | Stamp is Coach, not this packet |
| **Q5** `vp.include_oddlots` | **Value or explicit deferral to VPS2-W0; blocks publish either way** | No Engine publish until valued |
| Histogram dual-store W0-G | PASS (other tree) | **Not** credit for this service |

A seed that edits `server/` or `web/` product paths, StudioOne collectors, or `marketOhlc*` **before GATE 0 + `VPS1-W0`** is **FAIL**.

**This planning file is not a BUILD GO.** It is the Juliet DAG so Coach can stamp. It does **not** authorize Ingest.

---

## 1. Why this plan exists

v0.5 is a **new StudioOne service**: prints → finest honest volume-at-price histograms → API. It is **not** the Labs histogram dual-store and **not** heatmap session-volume.

**Spine (do not re-litigate):**

> Three parts, independently testable. Engine reads only Ingest. API reads only Engine (**VP-L7**). Published bins come only from this service (**VP-L8**). Rendering consumers **render served bytes only** (**VP-L2**). The service publishes **no analysis** (**VP-L1**): POC, value area, HVN, LVN, VWAP-as-level, node, edge, crevasse, “level”, “target” as a label are **forbidden**. Those objects are **part four**, a future spec.

Stage **A** is the only build scope: **SPY prints → XSP** `target_symbol`. Stage B (ES→SPX) after A + Q1. Stage C (QQQ→NDX) pending Q8.

---

## 2. Law this plan executes (restored spec §9 — VP-L1…L17)

Leans (Q6, Q7) are **not** law. They live in §3 until Coach ticks them on `VPS0-W0`.

| ID | Law (spec §9) |
|----|----------------|
| **VP-L1** | Allowed nouns per spec §1; `target_symbol` is a field, not a label |
| **VP-L2** | Histogram content computed inside the service; rendering consumers render bytes; computing consumers derive downstream under their own spec |
| **VP-L3** | Grids, calendars, scaling from symbol-metadata only; no per-symbol constants; no private Massive sockets |
| **VP-L4** | Proxy-honesty: source, mapping block, approximation flags travel with every payload |
| **VP-L5** | Fail loud: status + flags per §7, gap law per §4, thresholds per §6; gaps listed, never interpolated |
| **VP-L6** | Determinism per §5.4 |
| **VP-L7** | Part isolation (Engine reads Ingest only; API reads Engine only) |
| **VP-L8** | SoR + kill rule per §2; client bins are a retired estimator, never a reference. Kill fires when **both**: live publish == `vp_rebuild` byte-identical for 10 consecutive RTH (F7) **and** every rendering consumer no longer calls `marketOhlc*` for VP |
| **VP-L9** | as-of replay ≠ Analyzer Time Machine; no what-if knobs |
| **VP-L10** | Mapping: ratio 1, offset-only, publish-freeze; refresh never moves published bins |
| **VP-L11** | Round-and-merge on unequal grids (active per Q7(b); governs any target-mapped view) |
| **VP-L12** | Row grid from `vp_row` exclusively |
| **VP-L13** | Response model per §7; GAPPED developing never blocks prior COMPLETE |
| **VP-L14** | Volume = size; footprint/delta/aggressor out of scope |
| **VP-L15** | Composite construction fixed by Q6 before stamp |
| **VP-L16** | Identity block per §8 on every response |
| **VP-L17** | Cross-roll futures accumulation only in target space per §6 |

**Parents (unchanged):** AZ-VP-9 (amendment pending Q10 + part-four), AZ-VP-3, AZ-VP-6; GEX Quad complement; OPF named-state doctrine.

**Do not execute v0.1/v0.2 Engine procedures (POC / VA / HVN / LVN / VWAP levels).** v0.5 parked them. A seed that ships those as this service’s payload is **FAIL**.

**Response model (restored §7):** orthogonal fields — `status` `UNAVAILABLE \| GAPPED \| COMPLETE`; `flags.mapping` `OK \| STALE \| FAILED`; `flags.approximation`; `gaps[]`. Do not invent a single mixed enum.

---

## 3. Open decisions (Coach ticks — no silent default)

Leans live **here only**, not in §2.

| ID | Question | Lean in v0.5 | Blocks |
|----|----------|--------------|--------|
| **Q1** | Stage B ES→SPX member-facing precondition | After A; precondition stands | VPS-B (not Stage A) |
| **Q2** | Ingest extends `sym_feed` vs sibling collector | On-machine (StudioOne; **named GO**) | VPS1 |
| **Q4** | Closed sale-condition list as fixture | Required at BUILD | VPS1 Engine eligibility |
| **Q5** | `vp.include_oddlots` value | **No default. Value or explicit deferral to VPS2-W0; blocks publish either way** | First published payload |
| **Q6** | Composite algebra | **(c) all-history running totals** | VPS2 composite |
| **Q7** | Publication space | **(a) source bins + mapping block** | VPS3 |
| **Q8** | Stage C QQQ→NDX | Pending — **does not block this stamp** | Not Stage A |
| **Q9** | `vp_row` existence = dependency | Folded into verification | VPS2 |
| **Q10** | AZ-VP-9 amendment + part-four surface law | Pending — **does not block this stamp** | Consumer chrome / part four |

**GATE 0 ticks:**

| ID | Tick |
|----|------|
| **G0-1** | Completeness pre-flight on underscore v0.5 (358 / `a487a702…` / 16 headings / §14) |
| **G0-2** | Those sha1s logged (**DL-705**); truncated `ebdc633d…` recorded CORRUPT |
| **G0-3** | §13 Stamp Gate present in the restored file |
| **G0-4** | Confirm Q6=(c) and Q7=(a) on the token (Coach tick, not self-tick) |

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
| MiniTwo / DudeTwo | Not this tree |
| Part four structural analysis | Parked |
| StudioOne | Only packets whose GO names it **and** carry **CP-1** |
| `chain_feed` and supporting jobs | **CP-1** — never disrupt; pessimistic hold |

**In-scope after GATE 0 + `VPS1-W0` (by phase):**

| Phase | Trees (expected; exact paths named on each W0) |
|-------|------------------------------------------------|
| **VPS1** | StudioOne Ingest for SPY prints; archive; gap supervision; Q4 fixture. **This repo** may gain contracts/tests only if the GO names files |
| **VPS2** | Engine: session / developing / composite histograms. **No** POC/VA/HVN |
| **VPS3** | Mapping SPY→XSP; `target_symbol`; flags.mapping; STALE TTL |
| **VPS4** | Profile API v1: rendering payloads + computing **archive-range** query (§8) |
| **VPS5** | Rendering consumer cutover on Options Lab VP canvas / overlays; then kill |

---

## 5. Critical path

```text
VPS0     GATE 0 completeness + §13 present + sha1 DL
         Q5 = value or deferral to VPS2-W0 (blocks publish either way)
         token VPS0-W0  (planning stamp)
   │     no product code
   ▼
VPS1     Volume Ingest Stage A (SPY)
         GO: VPS1-W0  (Q2 on StudioOne under its own named GO, Q4 fixture)
   ▼
VPS2     Profile Engine histograms
         GO: VPS2-W0  (Q5 must be valued here if deferred; Q6c composite; Q9 vp_row)
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
| **VPS1** | GATE 0 PASS + Coach stamp + `VPS1-W0` | Ingest only (StudioOne, named GO) |
| **VPS2** | VPS1-G PASS + Q5 valued + `VPS2-W0` | Engine histograms |
| **VPS3** | VPS2-G PASS + `VPS3-W0` | Mapping |
| **VPS4** | VPS3-G PASS + `VPS4-W0` | API |
| **VPS5** | VPS4-G PASS + F7 watch + `VPS5-W0` | Rendering consumers; then kill |

**Do not combine VPS1 with VPS2.** Ingest proves archive before Engine publishes. **Do not combine VPS4 with VPS5.** API proves before canvas cutover.

---

## 6. Acceptance tests (characterization — lock at GATE 0 / VPS2)

Names are plan-level. Fixture numbers are spec §10 (F1–F8). Do **not** use client `marketOhlc*` as expected bytes (**VP-L8**).

**Stage A gate ATs (count these):** AT-VPS-0 … AT-VPS-13.

| AT | Phase | Claim |
|----|-------|--------|
| **AT-VPS-0** | VPS0 | Spec file contains headings through §14; sha1 matches DL-705; Stamp Gate §13 present |
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

| AT | Phase | Stage A? |
|----|-------|----------|
| **AT-VPS-14** | VPS-B | **Excluded from Stage A gate counts.** Stage B roll seam (SPX space vs raw ES). **Parked** with Stage B |

**Not ATs of this service:** v0.2 F1/F2 POC/VA ties; HVN/LVN total order. Those wait on part four.

---

## 7. Workstreams and seeds

### VPS0 — completeness + stamp (this file)

| Seed | Agent | Deliverable | Gate |
|------|-------|-------------|------|
| VPS0-0 | Coach | Stamp `VPS0-W0` | VPS0-0 |
| VPS0-1 | India | Completeness pre-flight (done this packet) | VPS0-1 |
| VPS0-2 | Lima | sha1 + CORRUPT record (**DL-705**) | VPS0-2 |
| VPS0-G | Delta | GATE 0 on evidence of 1–4 | **GATE 0** |

Until VPS0-G PASS **and** Coach stamp, **no VPS1 seed fires**.

### VPS1 — Ingest Stage A

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS1-0 | Foxtrot / Alpha (named on `VPS1-W0`) | StudioOne Ingest: SPY prints; append-only store; gap supervision (KeepAlive + 300 s backstop) |
| VPS1-1 | Alpha / Kilo | Q4 condition-code fixture file; auction=`true`; odd lots **stored** regardless of Q5 |
| VPS1-2 | Mike | Identity/scope if any Labs API is involved; StudioOne vs Labs SSO boundary |
| VPS1-G | Delta | Archive exists; rebuild input complete; no Engine publish yet |

Q2 verification is a **later packet** whose GO names StudioOne. Not this packet.

### VPS2 — Engine histograms

Requires **Q5 valued** (if deferred on VPS0, it is valued on `VPS2-W0`). Histogram only.

| Seed | Agent | Deliverable |
|------|-------|-------------|
| VPS2-0 | Alpha | Session + developing histograms; parameter hash; VP-L1 label lint |
| VPS2-1 | Alpha | Composite Q6(c) running totals |
| VPS2-2 | Kilo | AT-VPS-1…7, 13 goldens (**not** AT-VPS-14) |
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
| VPS4-0 | Alpha | v1 rendering payload; archive-range for computing consumers (§8) |
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

Required ticks (straight-to-build **not** among them). **Do not self-tick.**

- [ ] Spec v0.5 complete on disk (pre-flight evidence)
- [ ] sha1s in DL-705 (including truncated file as CORRUPT)
- [ ] §13 present
- [ ] Q6 = (c) all-history running totals
- [ ] Q7 = (a) source-space bins + mapping block
- [ ] Q5 = explicitly **DEFERRED to VPS2-W0** and **blocks first publish**
- [ ] Isolation acknowledgment (Histogram dual-store / SVP not this tree)
- [ ] StudioOne-by-named-packet acknowledgment

Build packets **VPS1+** require a **later** `VPS1-W0`. Next packet after this stamp: **Q2 verification on StudioOne under its own named GO**.

---

## 9. Isolation FAIL list (every gate)

Diff contains any of: `AnalyzerPositionsList.tsx`; LIM / QFRIC / XS / PPL product; `p-volume-profile-histogram` campaign code; heatmap `session-volume` enum; POC/VA/HVN/LVN **payload** fields; MiniTwo deploy; unsolicited StudioOne SSH. → **FAIL**.  
StudioOne packet whose AFTER check shows `chain_feed` degraded → **FAIL**; rollback executes immediately (**CP-1**). A StudioOne GO missing CP-1 (a)(b)(c)(d) → **FAIL** before execution.

---

## 10. Out of scope (this version)

- Part four Structural Analysis Service  
- Stage B/C product (spec’d; not Stage A build) · **AT-VPS-14 parked with Stage B**  
- Footprint, delta, bid/ask aggressor  
- Killing `marketOhlc*` before VPS5  
- Teaching LIM/QFRIC/XS from this board  
- Help Watch (separate)  
- DudeTwo / MiniTwo  
- Q8 / Q10 (remain open; do not block this stamp)

---

## 11. Version history

| Ver | Date | Note |
|-----|------|------|
| **1.0** | 2026-09-16 | Juliet plan from truncated Spec v0.5. GATE 0 first. **SUPERSEDED snapshot.** |
| **1.1** | 2026-09-16 | Claude (a)–(d): Q5 gate wording; VP-L1…L17; StudioTwo vs StudioOne MACHINE; AT-VPS-14 out of Stage A counts. Restore sha1s **DL-705**. **SUPERSEDED snapshot.** |
| **1.2** | 2026-09-16 | **CP-1** Chain primacy (**DL-707**). `VPS0-W0` STAMPED (**DL-706**). StudioOne GOs must carry CP-1 (a)(b)(c)(d). Not VPS1 GO. |
