# Practice Charter + Day + Journey Compass — Full Agent Bench Plan v1.0

**Date:** 2026-08-08  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-practice-charter-day/`](../agents/p-practice-charter-day/)  
**Product plan (superseded for execution):** [`Practice-Charter-Day-Implementation-Plan.md`](./Practice-Charter-Day-Implementation-Plan.md) — **this document is law for the bench**  
**Concept:** [`Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md)  
**Journey:** [`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`](../Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md)  
**Guide:** `/guide` · **as-built only** (F1 — no member-visible promises of unbuilt UI)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · AGENTS.md

**Claude review of product plan (2026-08-08):** F1–F6 **accepted as amendments** (§1).  
**Claude review of bench plan (2026-08-08):** seating gaps **Kilo / W0-4 Guide strip / J-G-Hotel + Mike co-seats** — **accepted** (§1.1). Disposition: **ready for Coach GO** once seating is locked (this revision).

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates are **PASS / FAIL / BLOCKED** with evidence — never waived.

---

## 0. Mission

Ship the **end of the process loop**:

| Layer | Meaning |
|-------|---------|
| **Day (atom)** | Scientific Trading Protocol — Hypothesis → Experiment → Reflection |
| **Season (optional charter)** | North Star Contract — scope, capital, timeframe; multi-active; silent book |
| **Compass (Journey)** | Detect drift → **locate** (scrub) → **review** (pillar links to own evidence) → **confirm** (recovery, no unlocks) |

**Doctrine:** Umpire (order without force) · day-first · campaign optional · Sacred #8 · no profit theater · Journey is process standing not trophies (DL-068) · no waived gates · declare files before touch · Family B.

**Out of program:** closed `campaign_type` enum · prop/coach counterparty · hard pre-register keyboard ban (D5 deferred — umpire risk) · content unlocks/rewards · P&L on Journey · new process meters without OD · Reports as process-repair destination (DL-257).

---

## 1. Claude review amendments (F1–F6) — locked

| ID | Finding | Amendment (normative) |
|----|---------|------------------------|
| **F1** | Guide ahead of as-built | **Member Guide = as-built only.** Feature copy ships **in the same PR** as the feature. Coach may review draft offline; members must not read unbuilt promises. |
| **F2** | Adhere filter ≠ meter math | **Filter = meter’s complement.** Meter good = `followed` **and** `partial` among tagged (`journey_scores.adherence_raw_from_counts`). Default deep-link filter = trades where adherence is **neither** `followed` **nor** `partial` (i.e. `broke` + `unknown` / untagged-as-shown). **Do not** put `partial` in the default “behind the drift” set. Optional UI may surface partial **separately**, labeled as partial credit. Window = adherence meter window. |
| **F3** | J3 dismissal storage | **Server-side profile prefs only** (JSON prefs on identity / existing prefs path). **Not** localStorage (phone path / multi-device). |
| **F4** | Silent book on retire | **C1 Retire UX:** if only open contract is `is_default` book, one-tap **“Close the book as part of retirement”** — do not force full settle ceremony for a quiet import convenience. |
| **F5** | B4 EOD rule | **EOD records, never adjusts.** UI is variance capture only; no “change my plan” affordance at close. Adaptation waits for weekly pivot. State line = member-authored tags/language only — **mirror, never inference**. |
| **F6** | Missing gates on B/C | Gate tables for Phases B, C, J — Tango · Echo · Hotel · Delta (see §5). |

### 1.1 Claude bench seating amendments (2026-08-08) — locked

| ID | Finding | Amendment (normative) |
|----|---------|------------------------|
| **S1** | Kilo rostered but seatless | **Kilo co-agent** on implementation seeds that produce testable surface: **B2-2**, **C1-1**, **J1-1**, **J3-1** — characterization tests are **completion criteria** of those seeds (same change). Plus **phase K-row gates**: B-G-Kilo, C-G-Kilo, J-G-Kilo (evidence pack for Delta). No Delta gate without Kilo evidence. |
| **S2** | W0 verifies Guide but nobody strips it | **W0-4 Charlie:** strip/hold unbuilt Practice·Campaign·Journey claims from live `/guide` to **as-built**; restore each section **in the same PR** as its feature (F1). W0-G fails if live Guide still promises unbuilt UI. |
| **S3** | Hotel / Mike seatless on J | **J-G-Hotel:** invite content selection for J3 (readiness pedagogy — which plan-accessible material is invitation-worthy). **Mike co-agent** on **J1-1** (filter param Family B) and **J3-1** (prefs path Family B). |
| **S4** | Seed tables are stubs | **W0-G cold-start rule:** W0-G does **not** PASS until Juliet has **materialized** phase seeds as cold-start packets (files in scope, out-of-scope, verifiable criteria, named gate). Stub tables in this plan are the **board index**, not executable seeds. |

---

## 2. Full bench roster

### 2.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | GO, ship/no-ship, arbiter, F1–F6 disposition |
| **Juliet** | Board, seeds, sequencing — **never executes packets** |
| **India** | Model boundaries: charter fields vs free-text; Adhere filter = meter complement; True North derivation; no new tables without keep/kill |

### 2.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | Campaign API fields if needed; Trade Log adherence filter query; journey prefs API for J3 dismiss; retire soft gate server |
| **Charlie** | Campaign frames/charter UI; Journal beats; Journey links + scrub marker + recovery UI; Retire UX; Guide **W0-4 strip** + sections **per feature PR** |
| **Echo** | B2 charter form density; B4 composer integration; J1 tap targets; J2 marker motion |
| **Mike** | Family B on **J1-1** filter param and **J3-1** prefs path; no cross-identity; export/prefs trust (co-agent, not aspirational) |
| **Foxtrot** | Only if deploy/env prefs path changes |

### 2.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | All gates; ternary; evidence — **requires Kilo evidence packs** on B/C/J |
| **Kilo** | **Seated:** co-agent on B2-2 · C1-1 · J1-1 · J3-1; phase gates B-G-Kilo · C-G-Kilo · J-G-Kilo. Scope: filter/meter parity (F2), multi-active, prefs dismiss (F3), no-P&L greps on Journey, silent-book retire path |
| **Lima** | DL + Spec status + Guide parity |
| **Tango** | B1 frames · B4 beats · C2 pivot · J1/J3 copy ban list (*violated / unlock / reward / earn access*) |
| **Hotel** | B4 hypothesis framing; C2 variance/thesis/cost-basis; **J-G-Hotel** invite content selection (J3) |

### 2.4 Optional review only

Victor · Whiskey · Yankee — antifragility / capital-preservation / fat-tail honesty on request.

### 2.5 Not seated

Golf · content studio (Quebec/Bravo/November/Romeo/Papa) — not this board.

---

## 3. Sacred invariants (all seeds)

1. Standalone repo — no MSC imports.  
2. Config fail-loud.  
3. Family B.  
4. **Umpire** — no hard process gates blocking Trade Log/Journal.  
5. **Day atom** — suite serves Hypothesis → Experiment → Reflection.  
6. **Campaign optional** — never required for Journey grade.  
7. **Goodhart line** — campaign created ≠ process boost.  
8. **No profit theater** — Sacred #8.  
9. **No unlocks/rewards/badges** on Journey (DL-068).  
10. **No P&L on Journey path.**  
11. **Guide as-built only** (F1).  
12. **Adhere filter = meter complement** (F2).  
13. **J3 prefs server-side** (F3).  
14. Evidence over assertion; declare files; no waived Delta gates.  
15. Documentation parity same body of work as ship.

---

## 4. As-built vs program (honest)

### 4.1 Landed (substrate)

| Item | Status |
|------|--------|
| Campaign CRUD, multi-active, account, capital, goals, `is_default`, permanence | **LANDED** |
| Trade Sheet multi-active prefill; import Book/none/pick/new | **LANDED** |
| Journey radar + time scrub + shape path (not fully bidirectional marker) | **PARTIAL** |
| Process meters + adherence followed/partial math | **LANDED** |
| Guide Practice/Campaign/Journey | **MUST re-verify as-built** — W0-4 strips any remaining ahead-of-build claims (F1/S2) |
| practiceSuite blurbs day-oriented | **LANDED** |

### 4.2 Program target (not yet)

| Item | Phase |
|------|--------|
| Starting frames + charter form + edit/abandon | **B** |
| Journal hypothesis/EOD variance beats (F5) | **B** |
| Retire UX + silent book one-tap (F4) | **C** |
| Weekly pivot prompts; campaign detail; TL↔journal chip | **C** |
| Pillar deep-links + Adhere filter (F2) | **J** |
| Bidirectional scrub ↔ shape marker | **J** |
| Recovery line + dismissible invite (F3 prefs) | **J** |
| OD-1.3 docs parity | **W0** |

---

## 5. Phases, seeds, gates

### Phase W0 — Program lock + docs parity

| Seed | Agent | Intent |
|------|-------|--------|
| W0-0 | Coach | GO on this bench plan + F1–F6 + S1–S4 seating |
| W0-1 | India | Keep/kill model: charter free-text vs columns; True North = existing grade band; no new tables for J3 |
| W0-2 | Lima | OD-1.3 multi-active in Decision Addendum / Own Spine note; DL charter+umpire+J compass |
| W0-3 | Juliet | **Materialize all phase seeds** as cold-start packets (scope in/out, criteria, gate) — index tables ≠ seeds |
| W0-4 | **Charlie** | **F1/S2:** strip live `/guide` of unbuilt Practice·Campaign·Journey claims; as-built only; feature text returns in feature PRs |
| **W0-G** | **Delta** | Plan lock; **Guide as-built verified** (W0-4 evidence); F2 definition written; **cold-start seeds on disk** (S4) |

### Phase B — Practice P0 (charter + day)

| Seed | Agent | Intent |
|------|-------|--------|
| B1-1 | Tango · Hotel | Frame seeds copy; hypothesis language |
| B1-2 | Charlie · Echo | Starting frames UI + Guide campaign frames **in same PR** |
| B2-1 | Echo · Tango | Charter form density + labels |
| B2-2 | Charlie · Alpha · **Kilo** | Charter create/edit; abandon; **Kilo:** multi-active/edit/abandon tests in-seed |
| B4-1 | Tango · Hotel | Journal beat prompts; **EOD records never adjusts** (F5) |
| B4-2 | Charlie · Echo · **Kilo** | Journal UI beats; freeform preserved; **Kilo:** soft-beat smoke / no hard gate greps |
| B-G-Tango | Tango | Frames + B4 copy PASS |
| B-G-Echo | Echo | Charter form + B4 composer PASS |
| B-G-Hotel | Hotel | Hypothesis / methodology soft language PASS |
| **B-G-Kilo** | **Kilo** | Characterization pack: multi-active, abandon, journal freeform still works, no hard gates |
| **B-G** | **Delta** | Frames+charter+edit/abandon+Journal beats; Guide B sections same PR; zero-campaign path; **Kilo evidence required** |

**Guide (F1):** Campaign frames/charter and Journal beat copy land **only** in B seeds — not before. W0-4 already stripped ahead-of-build claims.

### Phase C — Practice P1

| Seed | Agent | Intent |
|------|-------|--------|
| C1-1 | Charlie · Alpha · **Kilo** | Retire UX; soft open campaigns; **silent book one-tap** (F4); **Kilo:** retire + book-close tests |
| C2-1 | Tango · Hotel | Weekly pivot questions |
| C2-2 | Charlie | Retro optional pivot UI |
| C3-1 | Charlie | Campaign detail + `?campaign=` |
| C4-1 | Charlie | Soft TL↔journal plan chip |
| C-G-Tango | Tango | C2 copy |
| C-G-Hotel | Hotel | C2 variance/thesis/cost-basis |
| **C-G-Kilo** | **Kilo** | Retire soft gate + silent book one-tap + no hard block |
| **C-G** | **Delta** | Retire+silent book; pivot optional; Guide as-built for C; **Kilo evidence required** |

### Phase J — Journey Compass readjustment

| Seed | Agent | Intent |
|------|-------|--------|
| J1-0 | India · Alpha | **F2 lock:** filter = NOT (followed OR partial); window = meter window |
| J1-1 | Alpha · Charlie · **Mike** · **Kilo** | Trade Log filter query + clearable UI; **Mike:** Family B on filter; **Kilo:** filter/meter parity tests |
| J1-2 | Charlie · Echo · Tango | Radar + pillar row links; review labels; `soon` dead |
| J2-1 | Charlie · Echo · **Kilo** | Bidirectional slider ↔ shape marker; **Kilo:** sync smoke |
| J3-1 | India · Alpha · **Mike** · **Kilo** | Recovery from timeline; True North pin; **prefs server-side** (F3); **Mike:** Family B prefs; **Kilo:** dismiss persistence tests |
| J3-2 | Charlie · Tango · **Hotel** | Quiet recovery line; dismissible invite; **Hotel:** which plan-accessible material is invitation-worthy |
| J-G-Tango | Tango | Ban list greps |
| J-G-Echo | Echo | Tap targets + marker motion |
| J-G-India | India | Read-model only; no new tables |
| **J-G-Hotel** | **Hotel** | Invite content selection PASS (pedagogy; always plan-accessible; no unlock framing) |
| **J-G-Mike** | **Mike** | Family B on filter + prefs paths |
| **J-G-Kilo** | **Kilo** | Full J test pack: F2 parity, scrub, dismiss prefs, no P&L greps |
| **J-G** | **Delta** | Full §6.4; **Kilo + Hotel + Mike evidence required** |

### Phase Close

| Seed | Agent | Intent |
|------|-------|--------|
| Z-1 | Lima | DL + Spec as-built notes + Guide parity |
| **Z-G** | **Delta** | Program PASS — all phase gates + Kilo packs present |

---

## 6. Journey Compass — product law (Coach handoff)

### 6.1 Pillar deep-links (J1)

| Pillar | Destination |
|--------|-------------|
| Adhere | Trade Log filtered to **meter complement**: adherence ∉ {`followed`, `partial`} in meter window; filter visible + clearable |
| Retro | `/app/retrospective` |
| Routine · Persist | Journal calendar |
| Learn | Learning path / resume |
| Live | Live schedule |
| Tough | Non-interactive until metered (`soon`) |

Plain nav · review copy · every reading · no modal summary · no Reports · no writes.

### 6.2 Synced scrub (J2)

Slider moves shape-path marker; click path moves slider. Radar morph unchanged. No P&L/regime.

### 6.3 Recovery (J3)

Derived True North return → quiet line; optional dismissible invite to **plan-accessible** content only. Prefs server-side. No unlocks, badges, emails.

### 6.4 Delta acceptance (Journey)

1. Every metered pillar navigates; Adhere = complement of meter good set.  
2. Links at all readings; `soon` non-interactive.  
3. Slider ↔ shape-path bidirectional; radar morph OK.  
4. No P&L series; no new tables; no new routes except filter params.  
5. Recovery + invite derived; invite content open to plan-entitled regardless of scores; dismiss persists; no notification.  
6. Copy ban: violated / unlock / reward / earn access.

---

## 7. Gate matrix (all product phases)

| Phase | Gate | Agents | Evidence |
|-------|------|--------|----------|
| W0 | W0-G | Delta | Plan GO; **W0-4 Guide strip evidence**; F2 written; **cold-start seeds on disk (S4)** |
| B | B-G-Tango | Tango | Frame seeds + B4 prompts |
| B | B-G-Echo | Echo | Charter form + B4 composer |
| B | B-G-Hotel | Hotel | Hypothesis / soft methodology |
| B | **B-G-Kilo** | Kilo | In-seed tests from B2-2 / B4-2 |
| B | **B-G** | Delta | Feature + Guide same PR; umpire; **requires B-G-Kilo** |
| C | C-G-Tango / Hotel | Tango · Hotel | Pivot questions |
| C | **C-G-Kilo** | Kilo | Retire + silent book |
| C | **C-G** | Delta | F4; optional pivot; **requires C-G-Kilo** |
| J | J-G-Tango / Echo / India | Tango · Echo · India | Copy / motion / read-model |
| J | **J-G-Hotel** | Hotel | Invite content selection |
| J | **J-G-Mike** | Mike | Family B filter + prefs |
| J | **J-G-Kilo** | Kilo | F2 parity · scrub · dismiss · no P&L |
| J | **J-G** | Delta | §6.4; **requires Hotel + Mike + Kilo** |
| Z | **Z-G** | Delta | Program close |

---

## 8. Sequencing

```text
W0-G (Coach GO + F1/F2 locks)
  ├─► B* (Practice charter + Journal) ──► B-G
  │         Guide sections ship with B seeds only
  ├─► J1-0 F2 param design ──► J1* ‖ J2* ──► (J3 after J1-0 True North pin)
  │         └── J-G
  └─► C* after B-G (or parallel if no file conflict) ──► C-G
        └── Z-G
```

**Critical path:** `W0-G → (B-G ∥ J1-0) → J-G → Z-G` with C optional on path to Z.

**J1 blocked on:** F2 definition (W0-G / J1-0) **before** filter param built.

---

## 9. Journey meter filter (Goodhart)

| May feed Journey | Must not |
|------------------|----------|
| TL/Journal days → routine, persistence | Campaign create count |
| Adherence followed+partial math | PnL / campaign profit |
| Completed retro | Unlock content for scores |
| Existing timeline for J2/J3 | New vanity meters this program |

---

## 10. File ownership (indicative)

| Area | Paths |
|------|--------|
| Campaign UI | `web/app/app/practice/campaign/**` · `web/lib/practiceSpineApi.ts` |
| Journal | `web/app/app/journal/**` · `web/components/journal/**` |
| Trade Log filter | `web/app/app/trade-log/**` · `server/routes/trade_log/**` · `web/lib/tradeLogApi.ts` |
| Journey compass | `web/components/ProcessMeter.tsx` · `JourneyScores.tsx` |
| Prefs J3 | `server` identity/prefs path (India/Alpha name at J3-1) |
| Guide | `web/app/guide/page.tsx` · `web/lib/guide.ts` — **per feature PR only** |
| Accounts retire | Trade accounts settings UI |

---

## 11. Deferred (not this board)

| ID | Item | Why |
|----|------|-----|
| D1 | Daily Experiment Log artifact | After B4 dogfood |
| D2 | Execution Quality score | Separate OD |
| D3 | 5-stage pack chrome | Optional content |
| D4 | Open kind/tags | OD |
| D5 | Hard pre-register gate | **Umpire risk** — do not ship this program |

---

## 12. Coach GO checklist

- [ ] F1–F6 accepted  
- [ ] **S1–S4 seating** accepted (Kilo co-seats + K-gates; W0-4 Guide strip; J-G-Hotel; Mike on J1-1/J3-1; cold-start seed rule)  
- [ ] F2 Adhere complement definition  
- [ ] Priority: B ∥ J with J1 after J1-0  
- [ ] Explicit **GO** on W0-0  

**After GO, before W0-G:** Juliet materializes seeds; Charlie runs W0-4; Delta will not pass W0-G on stub tables alone (S4).

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-08-08 | Product plan only (pre-bench) |
| 2026-08-08 | Claude F1–F6 + **Full Agent Bench Plan v1.0**; board `p-practice-charter-day` |
| 2026-08-08 | Claude bench seating **S1–S4**: Kilo co-seats + phase K-gates; W0-4 Guide strip; J-G-Hotel; Mike on J1-1/J3-1; W0-G cold-start seed rule |

*Implementation starts only after Coach GO on W0-0.*
