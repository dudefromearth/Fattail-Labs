# Journal Retrospective Spec v0.7.1 — Full Agent Bench Implementation Plan

**Date:** 2026-07-30  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-retrospective-v07/`](../agents/p-retrospective-v07/)  
**Spec:** [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md`](../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md) (**DRAFT** until Coach GO)  
**Prior as-built:** [`Journal-Retrospective-Spec-v0.6.md`](../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) (RT8-G COMPLETE)  
**Evaluation:** [`Retrospective-Spec-v0.7-Evaluation.md`](./Retrospective-Spec-v0.7-Evaluation.md) (+ §14 cross-review)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · spec-create-review-workflow

This is the **executable multi-agent plan** for shipping the ceremony frame. Specialists run
**seeds only**. Coordination only through **Coach** or **Juliet**. Delta gates:
**PASS / FAIL / BLOCKED** with evidence — never waived.

**Stance:** **Not greenfield.** v0.6 mechanics are **substrate**. v0.7.1 changes product frame and
adds cadence/routine/ceremony laws.

---

## 0. Mission

Ship **Retrospective v0.7.1**: a **ceremony that is walked**, not a document that is read.

| Law | Spec |
|-----|------|
| Four questions + commitment keep gauge | §1 |
| Nine steps fixed order; carry-forward first; book last/collapsed | §6 |
| **Not a wizard** — sections all present, current focused | §6.1 |
| Cadence = trader setting; forward-only; interruption notice | §4 · §9 |
| Indicator = Journey meters only; **period in ceremony / rolling in Journey; never one frame** | §7 |
| Emotion = trader tags + words only; lexicon maps to ceremony steps | §8.1 · §8.1a |
| System inventory; trader names cause + correction; max 2 habits | §8 · §10 |
| Keep rate = **fact** + specificity trend for product eval | §11.1 |
| Routine day = **member message local day** (amends Journal Session) | §12.2 |
| Correlation → avoidable loss / process, never P&L | §13 |
| Notification material-based, once, channel policy, no market hours | §14 |
| Agent holds sequence; code guardrails; versioned prompt | §16 |
| Journal close on complete unchanged | §5 · Session §7 |

**Out of program:** cost-of-deviation (§20 #8 deferred); marketing surfaces (Sierra block); free tier.

---

## 1. Full bench roster

### 1.1 Authority & orchestration

| Callsign | Role | Authority |
|----------|------|-----------|
| **Coach** | §20 locks, GO, ship/no-ship | Final |
| **Juliet** | Board, seeds, phase order | Plans only — never executes |
| **India** | Domain, cadence storage, routine day, single instrument, parent Specs | Architecture veto |

### 1.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | Schema, gather/ceremony DTO, cadence, correlations, routine-day helper, agent, export |
| **Charlie** | Ceremony UI, library, settings, Journey label separation |
| **Echo** | Anti-wizard layout: fixed-order focused sections |
| **Mike** | Family B notifications channel policy; prompt admin authority |
| **Foxtrot** | Deploy/env only if notify infra changes |
| **Sierra** | No marketing leakage from emotion/P&L/correlation |

### 1.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | Gates R0-G … R9-G |
| **Kilo** | Characterization, greps, routine-day fixtures |
| **Lima** | DL; Spec BUILD/as-built; parent Spec patches |
| **Tango** | All member copy; keep-rate fact; interruption; notification tone |
| **Hotel** | Cadence by pattern; thresholds; Behavior lexicon; specificity signals; correlation honesty |

### 1.4 Lineage (optional review)

| Callsign | When |
|----------|------|
| **Victor** | §3 via negativa / fear framing |
| **Whiskey** | Capital preservation — no P&L theater in ceremony |
| **Yankee** | Fat-tail honesty on recovery time / small N |

### 1.5 Not seated

Golf · Content studio (Quebec…).

---

## 2. Sacred invariants

1. Standalone repo — no MSC imports.  
2. Family B — retros, habits, notifications payloads.  
3. **No profit claims** — no behavior↔P&L/win-rate/expectancy surfaces.  
4. **No second progress store** — Journey meters only; derived period accounting.  
5. **No differential gate among paid roles** — create gate as-built (admin · activator+ · observer-trial).  
6. **One instrument, two contexts, never one frame** — period vs rolling.  
7. **Keep rate fact only** + specificity pairing for product eval.  
8. **Routine day = member message timestamp day.**  
9. Evidence over assertion; declare files before touch; no waived gates.  
10. Documentation parity — Journal Session + Journey amendments same body of work as R1.

---

## 3. Substrate (keep / kill)

### Keep (v0.6 as-built)

| Asset | Path |
|-------|------|
| Create / list / gather / complete / abandon | `routes/retrospectives.py` |
| Option C scope | `retrospective_domain.py` |
| Dual report DTO | `Architecture/12-retrospective-report-dto.md` |
| Habit plans max 2 | `habit_plans` |
| Analyzer + guardrails | `retrospective_agent.py` |
| Journey scores + cadence meter | `journey_scores.py` |
| Closure preview + journal close | `journal_session_domain` + workspace |
| Process-before-book UI intent | `RetrospectiveWorkspace.tsx` |

### Kill / replace

| Kill | Replace with |
|------|----------------|
| Report-as-primary mental model | Ceremony walk (§6.1) |
| Tier-derived cadence if any | `retro_cadence_days` trader setting |
| Chore "due" as primary nudge | Material-based once/period notification |
| Dual period+rolling in one frame | Separate surfaces only |
| Routine day via session start only | Message-timestamp day |
| Keep rate as graded % | Fact counts + specificity |

---

## 4. Recommended Coach locks at R0 GO

| §20 | Lock |
|-----|------|
| **1** | Interim rules SoR: habit plans + pre-open journal commitments; Playbook when Spec GO — **state in Spec** |
| **2** | One instrument, two contexts, never one frame (**locked in Spec**) |
| **3** | **One** retrospective (all strategies) |
| **5** | Migrate Journey cadence adherence to period-based; forward-only; no dual frame |
| **9** | Routine day = member message local day (**locked in Spec**) |
| **10** | Keep rate fact + specificity pairing (**locked in Spec**) |
| **11** | Notification channel — recommend **in-app first**; email only with Mike-approved payload |
| **4, 6, 7, 8** | Defer or Hotel table later |

---

## 5. Phase graph

```
v0.6 COMPLETE (substrate)
        │
        ▼
       R0   Spec hygiene · full-bench review · Coach GO · DL
        │
        ▼
       R1   Schema cadence + retro columns + **routine-day helper**
        │   (Journal Session + Journey same body)
        │
        ├──► R2  Ceremony surface (critical path)
        │
        ├──► R3  Indicator period-scoped
        ├──► R4  Emotion + lexicon map
        ├──► R5  Clustering · trends · correlation
        ├──► R7  Notification + channel policy
        ├──► R8  Sequence agent + prompt versions
        │
        ▼
       R6   Interruption notice + forward-only cadence (after R1)
        │
        ▼
       R9   Export/purge · suite · Delta program PASS · Lima
```

**Critical path:** `R0 → R1 → R2 → R6 → R9`  
**Hard stop:** No R1+ implementation until **R0 Coach GO**.

---

## 6. Definition of Done (program)

1. Spec **BUILD AUTHORITY**; DL entry; board GO.  
2. Cadence trader setting + forward-only history; interruption notice when missed.  
3. Ceremony: 9 steps fixed order; all present / "nothing here"; focused step; **no wizard**.  
4. Carry-forward first; book last collapsed.  
5. Indicator period-scoped in ceremony; rolling only in Journey; never co-located.  
6. Emotion mirror only from Behavior tags + member journal text.  
7. Keep rate as fact; specificity press + trend pairing for eval.  
8. Routine day by member message local day (tests: Mon open + Wed/Thu msgs → 3 days).  
9. No P&L correlation surfaces.  
10. Notification once/period, material-based, channel policy, no RTH, no open-position leak.  
11. Agent sequence + code guardrails + prompt_version on retro.  
12. Export/purge new columns; suite green; **R9-G PASS**.

---

## 7. Seed catalog (full)

### PHASE R0 — Spec GO + freeze

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| R0-1 | **India** | Parent citations vs as-built; entitlement wording; routine-day cross-Spec map; cadence storage | RT07-R1 |
| R0-2 | **Mike** | Family B notify channels; prompt authority; open-position check soft-fail | RT07-R2 |
| R0-3 | **Hotel** | Cadence defaults by pattern; MIN_INFERENCE; Behavior lexicon; specificity signals; correlation | RT07-R3 |
| R0-4 | **Tango** | Copy ban list; keep-rate fact; interruption; material notify | RT07-R4 |
| R0-5 | **Echo** | Ceremony anti-wizard acceptance criteria | RT07-R5 |
| R0-6 | **Sierra** | No marketing leakage | RT07-R6 |
| R0-7 | **Victor** *(opt)* | §3 via negativa | — |
| R0-8 | Juliet | Board freeze; seeds complete | pre-G |
| R0-G | **Delta** | Spec-lock evidence | **RT07-0-G** |
| R0-0 | **Coach** | **BUILD AUTHORITY** + §20 locks | **RT07-R0** |
| R0-L | **Lima** | DL entry | same day |

**R0 exit:** BUILD · DL · R1 unblocked.

---

### PHASE R1 — Schema + routine day + cadence

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R1-1 | Alpha | India | Mig: `retro_cadence_days`, `member_retro_cadence_history`, retro columns (`prompt_version_id`, `cadence_days_at_period`, `period_index`, `interrupted`) | RT07-1-G |
| R1-2 | Alpha | India · Hotel | **`routine_days(identity, from, to)`** by member message local day; wire journey + retro | RT07-1-G |
| R1-3 | Alpha | India | Journal Session Spec amendment note / dual-read for journal-day meters | RT07-1-G |
| R1-4 | Charlie | Tango | Member cadence setting UI (settings or journey) | RT07-1-G |
| R1-5 | Kilo | Alpha | Tests: forward-only cadence; Mon+Wed+Thu msgs → 3 routine days | **RT07-1-G** |

**Files (declare):** `migrations/05x_*.sql`, `journey_scores.py`, `journal_session_domain.py` or new helper, `retrospective_domain.py`, Journey UI.

---

### PHASE R2 — Ceremony surface (critical)

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R2-1 | Charlie · Echo | Tango | Rewrite workspace: 9 sections fixed order; focus current; all present / nothing-here | RT07-2-G |
| R2-2 | Charlie | Echo | Carry-forward first; book last collapsed; no Next wizard | RT07-2-G |
| R2-3 | Alpha | India | Gather/DTO fields for ceremony steps (extend report_json honestly) | RT07-2-G |
| R2-4 | Kilo · Echo | — | Grep: no multi-page wizard; all steps in DOM; clean period shows nothing-here | **RT07-2-G** |

---

### PHASE R3 — Indicator

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R3-1 | Alpha | India · Tango | Period-scoped Journey meters for ceremony payload | RT07-3-G |
| R3-2 | Charlie | Tango | Pattern language; steady; not-enough-yet; no character verdicts | RT07-3-G |
| R3-3 | Kilo | — | Assert period + rolling never in one API response / frame | **RT07-3-G** |

---

### PHASE R4 — Emotion + lexicon map

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R4-1 | Hotel · Tango | — | Behavior lexicon audit (moment-reachable terms) | RT07-4-G |
| R4-2 | Alpha | Hotel | Mirror assembly: Behavior tags + journal member words; no diagnosis | RT07-4-G |
| R4-3 | Charlie | Echo | Render step 3 mirror; lexicon category → step map UI | RT07-4-G |
| R4-4 | Kilo | — | No system-generated emotional attribution in HTML | **RT07-4-G** |

---

### PHASE R5 — Clustering, trends, correlation

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R5-1 | Alpha | Hotel | Co-occurrence statements (tags + routine days + deviations) | RT07-5-G |
| R5-2 | Alpha | Hotel | Rate-normalized trends; floor 4–6 cycles; no trend below floor | RT07-5-G |
| R5-3 | Alpha | Hotel · Sierra | Behavior↔avoidable loss / rule-break damage; **no P&L correlation** | RT07-5-G |
| R5-4 | Kilo | Hotel | Grep expectancy/win-rate; small-N fixtures | **RT07-5-G** |

---

### PHASE R6 — Interruption + forward-only cadence

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R6-1 | Alpha | India | Detect missed period; set `interrupted`; compute span | RT07-6-G |
| R6-2 | Charlie | Tango | §9 notice copy before ceremony body | RT07-6-G |
| R6-3 | Kilo | — | Cadence widen does not rewrite past adherence | **RT07-6-G** |

---

### PHASE R7 — Notification

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R7-1 | Mike · Coach | — | Channel policy lock (in-app vs email payload) | RT07-7-G |
| R7-2 | Alpha | Mike · Tango | Material-based once/period; no RTH; open-pos soft fail | RT07-7-G |
| R7-3 | Charlie | Tango | In-app surface for ready material | RT07-7-G |
| R7-4 | Kilo | Mike | Once-only; no second ping; no position leak | **RT07-7-G** |

---

### PHASE R8 — Sequence agent + prompt versions

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R8-1 | Alpha · Hotel | Mike | Sequence agent: one step focus; no prescribe; code guardrails | RT07-8-G |
| R8-2 | Alpha · Mike | Tango | Prompt version store + stamp on retro (mirror Journal J3) | RT07-8-G |
| R8-3 | Charlie | Echo | Ceremony agent panel does not break anti-wizard | RT07-8-G |
| R8-4 | Kilo · Hotel | — | Guardrail corpus + no corrective prescription | **RT07-8-G** |

---

### PHASE R9 — Portability + program close

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| R9-1 | India · Lima | Mike | Export Spec bump for new columns; purge inventory | RT07-9-G |
| R9-2 | Alpha | Mike | Export/purge implementation | RT07-9-G |
| R9-3 | Kilo | Alpha | Full suite: retro + habits + journey + journal routine day | RT07-9-G |
| R9-G | **Delta** | — | **Program PASS** | **RT07-9-G** |
| R9-L | **Lima** | — | DL close; Spec as-built honesty | close |

---

## 8. Gate schedule (Delta)

| Gate | After | Evidence focus |
|------|-------|----------------|
| **RT07-0-G** | R0 reviews | Spec ready / BUILD after Coach |
| **RT07-1-G** | R1 | Schema + routine day + cadence setting |
| **RT07-2-G** | R2 | Ceremony anti-wizard + 9 steps |
| **RT07-3-G** | R3 | Indicator contexts separated |
| **RT07-4-G** | R4 | Emotion mirror |
| **RT07-5-G** | R5 | Clustering / correlation honesty |
| **RT07-6-G** | R6 | Interruption + forward-only |
| **RT07-7-G** | R7 | Notification policy |
| **RT07-8-G** | R8 | Agent + prompt stamp |
| **RT07-9-G** | R9 | **Program PASS** |

Reports: `agents/p-retrospective-v07/gate-reports/`.

---

## 9. Verification map (Kilo)

```bash
# Backend suites
cd server && .venv/bin/python -m pytest \
  tests/test_retrospectives.py \
  tests/test_habit_plans.py \
  tests/test_retrospective_agent.py \
  tests/test_journey_scores.py \
  tests/test_journal_sessions.py -q

# Routine day fixture
# Mon session + member msgs Wed/Thu → 3 routine days (agent msgs don't count)

# Greps
rg -n "win rate|expectancy|your keep rate is|Next step" web/components/retrospective || true
rg -n "period.*rolling|rolling.*period" web/components/retrospective web/components/journey || true
```

See Spec §18a for full verification list.

---

## 10. Handoff contracts

| From → To | Artifact |
|-----------|----------|
| Coach R0-0 → Juliet | GO + §20 locks |
| India R1-2 → Journey / Journal | `routine_days` helper contract |
| Alpha R2-3 → Charlie | Ceremony DTO fields |
| Hotel R4-1 → Alpha | Behavior lexicon GO list |
| Mike R7-1 → Alpha | Channel policy |
| R9-G → Lima | Program PASS for DL |

---

## 11. Operating rhythm

1. Vision — Coach  
2. Orchestration — Juliet  
3. Execution — one seed per session  
4. Verification — Delta  
5. Documentation — Lima same day  
6. Reflection — next cycle  

Forbidden: agent-to-agent side channels; waived gates; greenfield rewrite of gather/complete.

---

## 12. Risks & mitigations

| Risk | Mitigation | Owner |
|------|------------|-------|
| Wizard UX | Echo §6.1 law; R2-G | Echo |
| Routine undercount | R1 helper + tests | India · Alpha |
| Keep rate gamed | Specificity pairing; fact UI | Hotel · Tango |
| Dual gauge confusion | Never one frame | India · Charlie |
| Journey §4.1a break | Forward-only dual-read | India |
| Family B email | Channel policy R7 | Mike |
| Empty trial ceremony | Journal/emotion carry early | Tango · Hotel |
| Scope creep cost-of-deviation | Stay deferred | Coach |

---

## 13. Immediate sequence (first 72h after GO)

| # | Action | Agent |
|---|--------|-------|
| 1 | R0 reviews parallel | India Mike Hotel Tango Echo Sierra |
| 2 | RT07-0-G | Delta |
| 3 | Coach GO + Lima DL | Coach · Lima |
| 4 | R1-1 schema + R1-2 routine day | Alpha |
| 5 | R2 ceremony UI | Charlie · Echo |
| 6 | R6 interruption | Alpha · Tango |
| 7 | Parallel R3–R5, R7, R8 | specialists |
| 8 | R9 program close | Delta · Lima |

---

## 14. Suggested Coach GO statement

> **Journal Retrospective v0.7.1 — BUILD AUTHORITY.**  
> The retrospective is a ceremony, not a report: nine fixed-order sections (not a wizard),
> carry-forward first, book last. Cadence is a trader setting (forward-only) with interruption
> notices. Indicator uses Journey meters only — period-scoped in ceremony, rolling in Journey,
> never side by side. Routine day counts member messages by local timestamp (amends Journal Session
> v0.6). Keep rate is member-facing fact only, paired with specificity for product evaluation.
> v0.6 remains as-built for shipped APIs until R-phases land. No profit claims. Family B unchanged.

---

## 15. Document map

| Doc | Role |
|-----|------|
| **This file** | Canonical full agent bench plan |
| `agents/p-retrospective-v07/*` | Board, seeds, gates |
| Spec v0.7.1 | Product law |
| Spec v0.6 | As-built APIs until R-phases |
| Evaluation + §14 | Pre-GO review memory |

---

## 16. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Full agent bench plan for Journal Retrospective Spec **v0.7.1** |
