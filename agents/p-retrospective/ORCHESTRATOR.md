# P-Retrospective Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute **only** via seeds.  
**Collaboration is mandatory** — CHARTER collaboration law.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Seeds | [`seeds/`](./seeds/) |
| Gates | [`gate-reports/`](./gate-reports/) |

---

## Status board

**Program status:** **COMPLETE** — RT8-G **PASS** · Spec v0.6 as-built · gates RT0-G…RT8-G

| Phase | Intent | Status |
|-------|--------|--------|
| **W0** | Spec lock (v0.5 + Journey meter + advisors) | **PASS** + **Coach GO** |
| **R0** | Board freeze | **done** — `gate-reports/RT0-0-board-freeze.md` |
| **R1b** | Schema + Observer trial entitlement | **PASS** — `gate-reports/RT1-G-r1b.md` |
| **R2b** | Process-first gather + UI | **PASS** — `gate-reports/RT2-G-r2b.md` |
| **R3b** | Normalized comparison | **PASS** — `gate-reports/RT3-G-r3b.md` |
| **R4** | Habit plans + carry-forward | **PASS** — `gate-reports/RT4-G-r4.md` |
| **R5** | Agent analyze | **PASS** — `gate-reports/RT5-G-r5.md` (Coach GO) |
| **R6** | What worked + expected vs actual | **PASS** — `gate-reports/RT6-G-r6.md` |
| **R7** | Cadence meter + nudge | **PASS** — `gate-reports/RT7-G-r7.md` |
| **R8** | As-built + program close | **PASS** — `gate-reports/RT8-G-program-close.md` |

### Seed checklist

| Seed | Primary | Reviewers | Status |
|------|---------|-----------|--------|
| RT0-1 | India | Coach | **done** (Spec fold; Coach GO 2026-07-29) |
| RT0-2 | Hotel | India | **done** (`MIN_INFERENCE_N=20` locked; banner accepted; India APPROVED) |
| RT0-3 | Tango | Hotel | **done** (copy §6.0/6.6/7.5/§19; Hotel co-signed banner) |
| RT0-4 | Mike | India | **done** (§10.1 isolation + plan entitlement; India APPROVED) |
| RT0-5 | Sierra | Tango | **done** (§20 marketing boundary; Tango APPROVED) |
| RT0-G | Delta | — | **PASS** — `gate-reports/RT0-G-spec-lock.md` |
| RT0-0 | Juliet | Coach | **done** — freeze `gate-reports/RT0-0-board-freeze.md` |
| RT1-1 | Alpha | Mike · India | **done** — mig 047; plan-aware create; Mike·India APPROVED |
| RT1-2 | Kilo | Alpha · Mike | **done** — 11 tests ×2 green; A1–A6; Alpha·Mike APPROVED |
| RT1-G | Delta | — | **PASS** — `gate-reports/RT1-G-r1b.md` |
| RT2-1 | India · Alpha | Charlie | **done** — `Architecture/12-retrospective-report-dto.md`; TypedDict; Charlie·India APPROVED |
| RT2-2 | Alpha | India · Hotel | **done** — gather v0.5; deviations; sample gate; 13 pytest; India·Hotel APPROVED |
| RT2-3 | Charlie | Echo · Tango | **done** — §6 order; book collapsed + pref; Echo·Tango APPROVED |
| RT2-4 | Kilo | Alpha · Charlie | **done** — 18 pytest ×2; sample gate n&lt;20 / n≥20; Alpha·Charlie APPROVED |
| RT2-G | Delta | — | **PASS** — `gate-reports/RT2-G-r2b.md` |
| RT3-1 | Alpha | India · Hotel | **done** — §7 metrics + comparable; 21d vs 63d false; India·Hotel APPROVED |
| RT3-2 | Charlie | Tango | **done** — side-by-side metrics; no delta when not comparable; Tango APPROVED |
| RT3-3 | Kilo | Alpha | **done** — 30 pytest ×2; 21d vs 63d fixture; Alpha APPROVED |
| RT3-G | Delta | — | **PASS** — `gate-reports/RT3-G-r3b.md` |
| RT4-1 | Alpha | Mike · India | **done** — habit-plans CRUD; max 2 active 409; carry_forward gather; Mike·India APPROVED |
| RT4-2 | Charlie | Tango · Echo | **done** — carry-forward first; Kept/Partial/Lapsed; Tango·Echo APPROVED |
| RT4-3 | Kilo | Alpha | **done** — 12 habit tests ×2; maiden CF null; 409 cap; Alpha APPROVED |
| RT4-G | Delta | — | **PASS** — `gate-reports/RT4-G-r4.md` |
| RT5-0 | Coach | — | **GO** — `gate-reports/RT5-0-agent-go.md` (trial agent off default) |
| RT5-1 | Alpha · Mike | India · Hotel · Tango | **done** — analyze endpoint; local mode; 503 if off; reviewers APPROVED |
| RT5-2 | Charlie | Tango | **done** — agent panel; accept/edit/reject plans; Tango APPROVED |
| RT5-3 | Kilo | Alpha · Mike | **done** — 14 agent tests ×2; anchors/symmetry/isolation; Alpha·Mike APPROVED |
| RT5-G | Delta | — | **PASS** — `gate-reports/RT5-G-r5.md` |
| RT6-1 | Alpha | Hotel · Tango | **done** — what_worked + expected_vs_actual gather; Hotel·Tango APPROVED |
| RT6-2 | Charlie | Tango | **done** — §6.4–6.5 UI polish; Tango APPROVED |
| RT6-G | Delta | — | **PASS** — `gate-reports/RT6-G-r6.md` |
| RT7-1 | Alpha | India · Tango | **done** — cadence formula + E1–E3; open ≠ clock; India·Tango APPROVED |
| RT7-2 | Charlie | Tango · Echo | **done** — ProcessMeter cadence chip; nudge N1 + Not now; Tango·Echo APPROVED |
| RT7-3 | Kilo | Alpha | **done** — §D.2 10–17; 23 pytest ×2; Alpha APPROVED |
| RT7-G | Delta | — | **PASS** — `gate-reports/RT7-G-r7.md` |
| RT8-1 | Lima · India | Coach | **done** — Spec v0.6 as-built; Arch parity; DL-116; India APPROVED |
| RT8-G | Delta | — | **PASS** — `gate-reports/RT8-G-program-close.md` |

---

## Operating loop (every seed)

```
1. Juliet opens seed (status → in_progress)
2. Activate PRIMARY with seed + CHARTER + doctrine + linked Specs
3. PRIMARY produces work + evidence pack
4. REVIEWERS: APPROVED | RETURNED (max 2 loops → Coach)
5. Juliet marks seed done only when reviewers APPROVED
6. Phase end → Delta formal gate (PASS / FAIL / BLOCKED)
7. Lima logs API / isolation / Spec changes same day
```

**Never skip review.** A waived Delta gate is a doctrine violation.

---

## Agent roster

| Callsign | Role on p-retrospective |
|----------|-------------------------|
| **Coach** | Ship/no-ship; entitlement; agent GO/DEFER; MIN_INFERENCE_N final |
| **Juliet** | Sequencing, board, parallelization |
| **India** | Spec integrity, domain SoR, product boundary, entitlement by plan |
| **Alpha** | Migrations, domain, APIs, gather, agent boundary |
| **Charlie** | Journal, retrospective workspace, ProcessMeter, nudge UI |
| **Echo** | HIG density / control grammar on workspace chrome |
| **Mike** | Isolation, plan-based entitlement, agent/Family B logs |
| **Kilo** | Characterization tests (useful invariants only) |
| **Tango** | Process-first copy; no shame cadence; no profit claims |
| **Hotel** | Sample size honesty; P&amp;L as neutral sample |
| **Sierra** | No marketing reuse of book performance |
| **Delta** | Phase gates with evidence |
| **Lima** | Decision log + Spec as-built |
| **Foxtrot** | Only if deploy verification required |

---

## Spec / product freeze (for implementers)

| Decision | Source |
|----------|--------|
| Create entitlement | **admin OR activator+ OR active plan `observer-trial`** (live memberships+slug; not role-only); free no-plan **403** |
| Marketed path | Observer trial → **Navigator** only |
| Activator | Legacy self-directed; not advertised |
| Scope | Since last complete; maiden from practice_epoch |
| Option C | Activity between scope_end and completed_at in **no** window |
| Workspace order | Carry-forward → process → integrity → deviations → what worked → expected vs actual → book collapsed |
| MIN_INFERENCE_N | **20** (Hotel RT0-2 locked) |
| Habit plans | Max **2** active |
| Cadence | `retro_horizon_days`; only completed_at; E1–E3 empty rules |
| Agent | **GO** RT5-0; optional path; anchoring hard; trial **off** default |

---

## Collaboration diagrams

### W0 Spec lock

```
India (RT0-1) Spec fold
    │
    ├─► Hotel (RT0-2) MIN_INFERENCE_N
    ├─► Tango (RT0-3) copy
    ├─► Mike  (RT0-4) isolation / trial entitlement
    └─► Sierra (RT0-5) marketing boundary
    │
    ▼
Delta (RT0-G) ──► Coach GO ──► R0 freeze
```

### R1b → R3b (build spine)

```
Juliet R0 freeze
    │
    ▼
Alpha RT1-1 (schema + entitlement) ◄── Mike · India
    │
    ▼
Kilo RT1-2 ──► Delta RT1-G
    │
    ▼
India+Alpha RT2-1 (DTO) ──► Alpha RT2-2 gather ──► Charlie RT2-3 UI
    │                              │
    └────────── Kilo RT2-4 ────────┘
    │
    ▼
Delta RT2-G
    │
    ▼
Alpha RT3-1 ──► Charlie RT3-2 ──► Kilo RT3-3 ──► Delta RT3-G
```

### R4 → R8

```
Alpha RT4-1 plans ──► Charlie RT4-2 carry-forward ──► Kilo RT4-3 ──► Delta RT4-G
    │
    ▼
Coach RT5-0 GO|DEFER
    │ (if GO)
    ▼
Alpha+Mike RT5-1 ──► Charlie RT5-2 ──► Kilo RT5-3 ──► Delta RT5-G
    │
    ▼
R6 (if not merged) ──► R7 cadence ──► Lima RT8-1 ──► Delta RT8-G PASS
```

---

## Evidence standards (Delta)

Every gate report must include:

1. Spec section IDs covered  
2. Commands + output (pytest, curl)  
3. Isolation assertion where auth/scope touched  
4. Copy/doctrine check (Tango/Hotel) if member-facing  
5. Ternary verdict: **PASS / FAIL / BLOCKED**  

---

## How to start (Coach)

W0 + R0 complete (2026-07-29). **BUILDING.**

1. Run **RT1-1** (Alpha schema + plan-aware entitlement).  
2. RT1-2 Kilo → RT1-G Delta.  
3. Continue R2b → R8 per board; R5 waits on **RT5-0** GO/DEFER.  

Seed list frozen — no silent adds (see `gate-reports/RT0-0-board-freeze.md`).
