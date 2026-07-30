# Implementation Plan — p-retrospective

**Authority:** **Coach GO 2026-07-29** — board is **BUILDING**.  
**Parents:** Journal Retrospective Spec **v0.5** · Journey Experience Spec v1.0 §4.1a  
**Freeze:** `gate-reports/RT0-0-board-freeze.md`

---

## Dependency graph

```
W0 Spec lock (India/Hotel/Tango/Mike/Sierra → Coach GO)
 │
 ▼
R0 Coach GO ack
 │
 ├──────────────────────────────────────┐
 ▼                                      ▼
R1b Schema + entitlement              (can start after R0)
 │                                      entitlement needed before R7 empty rules
 ▼
R2b Gather + process-first UI ─────────┤
 │                                      │
 ▼                                      │
R3b Normalized comparison               │
 │                                      │
 ▼                                      │
R4 Habit plans + carry-forward          │
 │                                      │
 ▼                                      │
R5 Agent analyze (optional Coach skip)  │
 │                                      │
 ▼                                      │
R6 What worked + expected vs actual     │ (may merge into R2b if cheap)
 │                                      │
 ▼                                      │
R7 Cadence meter + nudge ◄──────────────┘
 │
 ▼
R8 Lima as-built + Delta program close
```

**Parallelism (Juliet only):**

| Parallel window | Seeds | Conflict risk |
|-----------------|-------|---------------|
| After R1b | R2b backend gather vs Charlie shell chrome | Medium — coordinate `report_json` contract first |
| After R3b | R4 Alpha schema vs Charlie carry-forward UI | Low if API first |
| R5 | May run after R4; skip if Coach defers agent | — |
| R6 | Merge into R2b if pre_market join cheap | India call |

---

## Phase W0 — Spec lock

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT0-1 | India | Coach | Merge cadence delta + v0.4 into **Retrospective Spec v0.5** + Journey Experience **§4.1a** draft; as-built honesty |
| RT0-2 | Hotel | India | **DONE** — `MIN_INFERENCE_N=20` locked; banner: does not measure process quality |
| RT0-3 | Tango | Hotel | **DONE** — copy §6.0/6.6/7.5 + §19 glossary; Hotel co-signed banner |
| RT0-4 | Mike | India | **DONE** — §10.1 plan-slug OR activator+ OR admin; A1–A8; Family B classes |
| RT0-5 | Sierra | Tango | **DONE** — §20 no public member-results / SEO / testimonial from retro P&amp;L |
| RT0-G | Delta | — | **PASS** — `gate-reports/RT0-G-spec-lock.md` (2026-07-29) |

**Exit:** Coach GO on v0.5 + Journey meter § + DL entry. **Delta PASS; Coach GO still open.**

---

## Phase R0 — Board freeze

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT0-0 | Juliet | Coach | **DONE** — Coach GO 2026-07-29; freeze note `gate-reports/RT0-0-board-freeze.md` |

---

## Phase R1b — Schema + entitlement

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT1-1 | Alpha | Mike · India | **DONE** — `047_retrospective_r1b.sql`; `can_create_or_gather`; tests green |
| RT1-2 | Kilo | Alpha · Mike | **DONE** — 11 pytest ×2; A1 spoof, A5 expired trial, A6 409 |

**Exit criteria:** Observer trial session creates retro; free observer cannot; Activator (legacy) still can.  

**RT1-G:** **PASS** 2026-07-29 — `gate-reports/RT1-G-r1b.md`

---

## Phase R2b — Process-first gather + UI

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT2-1 | India · Alpha | Charlie | **DONE** — Architecture/12 DTO + domain TypedDict/constants | Stable `report_json` / DTO contract for §6 sections |
| RT2-2 | Alpha | India · Hotel | **DONE** — gather version 0.5; deviations; sample_below_min; 13 pytest |
| RT2-3 | Charlie | Echo · Tango | **DONE** — §6 workspace order; book collapsed; profile expand pref |
| RT2-4 | Kilo | Alpha · Charlie | **DONE** — 18 tests; sample_below_min true/false; DTO keys; UI order | Characterization for report shape + UI contract smoke |

**Exit:** Process above book; book collapsed; sample banner when trades &lt; 20.  

**RT2-G:** **PASS** 2026-07-29 — `gate-reports/RT2-G-r2b.md`

---

## Phase R3b — Normalized comparison

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT3-1 | Alpha | India · Hotel | **DONE** — `compare_metric` + `metrics[]`; 21d vs 63d not comparable |
| RT3-2 | Charlie | Tango | **DONE** — comparison UI side-by-side; Not comparable badge; maiden baseline |
| RT3-3 | Kilo | Alpha | **DONE** — 21d vs 63d fixture; book/adherence math; 30 tests |
| RT3-G | Delta | — | **PASS** 2026-07-29 — `gate-reports/RT3-G-r3b.md` |

**Exit:** Normalized rates + comparable flags; UI no false deltas; 21d vs 63d fixture green.

---

## Phase R4 — Habit plans + carry-forward

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT4-1 | Alpha | Mike · India | **DONE** — `/api/me/habit-plans`; cap 2; carry_forward on gather |
| RT4-2 | Charlie | Tango · Echo | **DONE** — carry-forward first; Kept/Partial/Lapsed chips |
| RT4-3 | Kilo | Alpha | **DONE** — 12 tests; third active 409; maiden CF null; isolation |
| RT4-G | Delta | — | **PASS** 2026-07-29 — `gate-reports/RT4-G-r4.md` |

**Exit:** Cap 2 active; carry-forward first in UI; isolation OK.

---

## Phase R5 — Agent analyze (Coach may defer)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT5-0 | Coach | — | **GO** 2026-07-29 — trial agent off default; fail loud if unconfigured |
| RT5-1 | Alpha · Mike | India · Hotel · Tango | **DONE** — analyze + validate + local agent; trial off default |
| RT5-2 | Charlie | Tango | **DONE** — Run analysis UI; accept/edit/reject proposed plans |
| RT5-3 | Kilo | Alpha · Mike | **DONE** — 14 tests; empty anchors; symmetry; isolation 404 |
| RT5-G | Delta | — | **PASS** 2026-07-29 — `gate-reports/RT5-G-r5.md` (Coach GO path) |

**Exit:** Analyze endpoint; fail-loud config; validation; trial off; UI human gate; 56 pytest green.

---

## Phase R6 — What worked + expected vs actual

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT6-1 | Alpha | Hotel · Tango | **DONE** — what_worked adverse + pre_market expected_vs_actual; null if none |
| RT6-2 | Charlie | Tango | **DONE** — what_worked cards; stated intent / executed grid; process-only copy |
| RT6-G | Delta | — | **PASS** 2026-07-29 — `gate-reports/RT6-G-r6.md` |

**Exit:** Sections present or honestly absent; no P&amp;L figures in adverse what-worked.

---

## Phase R7 — Cadence meter + nudge

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT7-1 | Alpha | India · Tango | **DONE** — retro_horizon_days; formula; E1–E3; completed_at clock only |
| RT7-2 | Charlie | Tango · Echo | **DONE** — cadence grade chip; RetroCadenceNudge on home/journey/library |
| RT7-3 | Kilo | Alpha | **DONE** — §D.2 10–17; 23 pytest ×2 |
| RT7-G | Delta | — | **PASS** — `gate-reports/RT7-G-r7.md` |

---

## Phase R8 — Close

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| RT8-1 | Lima · India | Coach | **DONE** — Spec v0.6 as-built; Arch 02/03/04/12; DL-116; India APPROVED |
| RT8-G | Delta | — | **PASS** — `gate-reports/RT8-G-program-close.md` · program COMPLETE |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Observer trial role is `navigator` during trial | Entitlement by **plan slug** `observer-trial`, not role alone |
| Empty Trade Log on trial | Honest empty book section; process still runs |
| Agent cost on trial | Agent stays paid-tier unless Coach opens |
| Double-counting scope boundary | Option C: gap unreviewed; only completed_at for cadence |
| Activator creep in UX | Copy/funnel never promote Activator; legacy only |

---

## Test strategy (Kilo)

Useful invariants only:

1. Isolation (identity A cannot read B’s retro)  
2. Entitlement matrix (trial / free / navigator / activator)  
3. Concurrent open 409  
4. Maiden vs subsequent scope  
5. Comparison comparable flags  
6. Habit plan cap 409  
7. Cadence formula boundaries + open/abandoned non-freeze  
8. Agent validation rejects (if R5 ships)  

No flaky UI-only tests without Coach ask.
