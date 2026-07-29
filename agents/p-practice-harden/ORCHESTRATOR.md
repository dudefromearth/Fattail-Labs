# P-Practice-Harden Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute **only** via seeds.
**Collaboration is mandatory** — see CHARTER collaboration law and § Collaboration matrix
per phase.

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

---

## Operating loop (every seed)

```
1. Juliet opens seed (status → in_progress)
2. Activate PRIMARY agent(s) with seed + charter + doctrine + linked Specs
3. PRIMARY produces work + evidence pack
4. Activate REVIEWER agent(s) with same seed § Review protocol
   → each REVIEWER: APPROVED | RETURNED (with file-level notes)
5. If RETURNED → PRIMARY fixes → re-review (max 2 loops; then Coach)
6. Juliet marks seed done only when all required REVIEWERS APPROVED
7. Phase end → Delta formal gate (ternary PASS / FAIL / BLOCKED)
8. Lima logs if public API / isolation / Spec status changed
```

**Never skip step 4–6.** A single-agent “I finished” is not complete.

---

## Agent roster (this project)

| Callsign | Role on p-practice-harden |
|----------|---------------------------|
| **Coach** | Final authority; approve metric/UX behavior changes; ship/no-ship |
| **Juliet** | Sequencing, seed readiness, board, parallelization, handoffs |
| **India** | Architecture, domain single-source-of-truth, product boundary, Spec alignment |
| **Alpha** | Backend: routes, domain modules, migrations (only if required), queries |
| **Charlie** | Frontend: API client, split components, wire to server read models |
| **Echo** | HIG / control grammar — only if a change touches chrome or is UX-labeled |
| **Mike** | Isolation, session/identity, export/import trust, no cross-member leaks |
| **Kilo** | Characterization tests per `TEST-STRATEGY.md` — useful invariants only |
| **Tango** | Process-first copy; no profit-claim / shame cadence regressions |
| **Hotel** | Trading-process framing honesty (metrics labels, “illustrative strikes”) |
| **Delta** | Phase gates with evidence; no waived gates |
| **Lima** | Decision log + Spec as-built notes |
| **Foxtrot** | Not scheduled unless Coach adds deploy verification |

---

## Phased plan

### Phase H0 — Safety & observability  
**Intent:** Fail loud, stop silent scale/identity hazards, baseline tests.  
**Behavior:** No intentional UX change.

| Seed | Primary | Required reviewers | Deliverable |
|------|---------|-------------------|-------------|
| **PH0-0** | Juliet | Coach (ack) | Board freeze: scope list, no feature creep; link audit findings |
| **PH0-1** | Alpha | Mike · India | Env-gate `_storage_identity_id` fallback (`dev` only) |
| **PH0-2** | Alpha | Kilo · India | Batch-load legs on `list_trades` (eliminate N+1); same response shape |
| **PH0-3** | Kilo | Alpha · Mike | Isolation + list completeness tests; optional query-count assertion |
| **PH0-G** | Delta | — | Gate H0 with evidence |

**Collaboration diagram (H0):**

```
Juliet (PH0-0) ──► Coach ack
       │
       ▼
Alpha (PH0-1) ◄──► Mike (isolation) ◄──► India (env/prod boundary)
       │
       ▼
Alpha (PH0-2) ◄──► Kilo (tests) ◄──► India (API contract stable)
       │
       ▼
Kilo (PH0-3)  ◄──► Alpha · Mike
       │
       ▼
Delta (PH0-G) ──► PASS → H1
```

---

### Phase H1 — Single source of truth (positions / PnL / series)  
**Intent:** One authoritative implementation of structure matching, open-on-day, realized
equity series; clients consume; seeds share code.  
**Behavior:** Metrics should **match current intended formulas**; any intentional formula
fix = Coach + India + Tango/Hotel.

| Seed | Primary | Required reviewers | Deliverable |
|------|---------|-------------------|-------------|
| **PH1-0** | India | Alpha · Charlie · Coach | Domain design note: module boundaries, API DTOs, deprecation of client enrich |
| **PH1-1** | Alpha | India · Kilo | Server domain module (e.g. `server/trade_log_domain/`) + unit/characterization tests |
| **PH1-2** | Alpha | India · Mike · Kilo | Analytics/read endpoints or extended trade payload (stable JSON contract) |
| **PH1-3** | Charlie | Alpha · Kilo | Wire Reports + Journal day book to server; remove dual client logic (or dev-only fallback) |
| **PH1-4** | Alpha | Kilo | Seeds (`seed_reports_demo_pnl`, etc.) call shared Python domain — no twin algorithms |
| **PH1-5** | Tango · Hotel | India | Copy pass: “estimated PnL”, illustrative strikes, process-first metric labels |
| **PH1-G** | Delta | — | Gate H1: golden series fixture matches; no client/server divergence tests |

**Collaboration diagram (H1):**

```
India design (PH1-0) ── review ──► Alpha + Charlie + Coach
         │
         ▼
Alpha domain (PH1-1) ◄──► Kilo tests ◄──► India model check
         │
         ▼
Alpha API (PH1-2) ◄──► Mike (scope/auth) ◄──► India contract
         │
    ┌────┴────┐
    ▼         ▼
Charlie UI  Alpha seeds
 (PH1-3)    (PH1-4)
    │         │
    └────┬────┘
         ▼
Tango+Hotel copy (PH1-5)
         │
         ▼
Delta (PH1-G)
```

---

### Phase H2 — Module boundaries (structure only)  
**Intent:** Split oversized files; shared API client; Apps catalog uses single suite source.  
**Behavior:** **Zero** intentional UX change.

| Seed | Primary | Required reviewers | Deliverable |
|------|---------|-------------------|-------------|
| **PH2-1** | Alpha | India · Kilo | Split `routes/trade_log.py` into packages (accounts / trades / io) — same routes |
| **PH2-2** | Charlie | Alpha · Echo | `web/lib/tradeLogApi.ts` (or equivalent); pages use it |
| **PH2-3** | Charlie | Echo · Kilo | Split JournalCalendar into view components (behavior identical) |
| **PH2-4** | Charlie | Echo · Kilo | Split ReportsDashboard: charts vs shell (behavior identical) |
| **PH2-5** | Charlie | India | Apps `NESTED_UNDER_PRACTICE` → import `PRACTICE_NESTED_SLUGS` only |
| **PH2-G** | Delta | — | Smoke: suite nav, blotter, reports, journal day book still work (evidence) |

**Parallelization (Juliet may schedule):**

- PH2-1 ∥ PH2-2 if Charlie mocks contracts from PH1  
- PH2-3 ∥ PH2-4 (disjoint files)  
- PH2-5 anytime after suite file stable  

---

### Phase H3 — Spec / institutional truth  
**Intent:** Docs match as-built hardened stack; decision log complete.

| Seed | Primary | Required reviewers | Deliverable |
|------|---------|-------------------|-------------|
| **PH3-1** | India · Lima | Coach | Trade Log Spec as-built notes or v1.2 delta (status honesty) |
| **PH3-2** | Lima | India · Juliet | Decision-log: domain module, API read models, migration numbers |
| **PH3-3** | Juliet | Coach | Ops vs product: document import_0dte_xlsx / seeds as bench tools |
| **PH3-4** | India | Coach | Explicit non-goals: synthetic strikes labeled; Retrospective still DRAFT for content |
| **PH3-G** | Delta | — | Gate H3: Specs/decision log consistent with code |

---

### Phase H4 — Performance UX (optional, Coach-gated)  
**Intent:** Only if H0–H1 still leave real pain (large books).

| Seed | Primary | Required reviewers | Deliverable |
|------|---------|-------------------|-------------|
| **PH4-0** | Coach | Juliet | Go/no-go: virtualize blotter / paginate / server date filters |
| **PH4-1** | Charlie | Echo · Kilo | Virtualization or pagination **if** approved (usability win) |
| **PH4-2** | Alpha | India · Kilo | Server filters `from`/`to` if approved |
| **PH4-G** | Delta | — | Evidence of load improvement without wrong data |

---

## Collaboration matrix (who must talk to whom)

| Topic | Must include |
|-------|----------------|
| Isolation / identity | **Mike + Alpha + Kilo** |
| Domain formula / open book | **India + Alpha + Kilo** (+ Tango/Hotel if labels change) |
| API contract | **India + Alpha + Charlie** |
| UI split / HIG | **Charlie + Echo** (+ Tango if copy) |
| Product boundary / MSC | **India + Mike** |
| Spec / memory | **India + Lima** (+ Juliet sequencing) |
| Any behavior/UX change | **Coach** explicit |

### Collaboration rituals

1. **Design huddle (async OK):** India writes PH1-0; Alpha and Charlie must comment APPROVED/RETURNED in seed thread or gate-report appendix.  
2. **Pair review:** Reviewer never “drives” implementer’s keyboard for the packet; they produce a written verdict.  
3. **Three-party on isolation:** Mike + Alpha + Kilo for PH0-1, PH0-3, PH1-2.  
4. **Copy board:** Tango + Hotel on PH1-5 before Delta H1.  
5. **Escalation:** After 2 RETURNED loops → Juliet re-seeds or Coach arbitrates.

---

## Status board

| Phase | Seed | Status | Notes |
|-------|------|--------|-------|
| H0 | PH0-0 | ✅ done | Coach ACK 2026-07-29 ("Go"); `gate-reports/PH0-0-coach-ack.md` |
| H0 | PH0-1 | ✅ done | Identity gate; Mike·India APPROVED; `gate-reports/PH0-1-review.md` |
| H0 | PH0-2 | ✅ done | Batch legs + scale test; Kilo·India APPROVED; `gate-reports/PH0-2-review.md` |
| H0 | PH0-3 | ✅ done | Gap audit — no new tests; Alpha·Mike APPROVED; `gate-reports/PH0-3-review.md` |
| H0 | PH0-G | ✅ PASS | `gate-reports/H0-delta-gate.md` |
| H1 | PH1-0 | ✅ done | `Architecture/11-practice-domain-single-source.md`; Alpha·Charlie·Coach APPROVED |
| H1 | PH1-1 | ✅ done | `server/trade_log_domain/`; goldens; India·Kilo APPROVED; `gate-reports/PH1-1-review.md` |
| H1 | PH1-2 | ✅ done | analytics day-book / reports-book; India·Mike·Kilo APPROVED; `gate-reports/PH1-2-review.md` |
| H1 | PH1-3 | ✅ done | Reports+Journal on analytics API; dual client domain removed; Alpha·Kilo APPROVED |
| H1 | PH1-4 | ✅ done | seed_reports_demo_pnl → domain; Kilo APPROVED |
| H1 | PH1-5 | ✅ done | process-first copy; Tango·Hotel·India APPROVED |
| H1 | PH1-G | ✅ PASS | `gate-reports/H1-delta-gate.md` |
| H2 | PH2-1 | ✅ done | `routes/trade_log/` package; India·Kilo APPROVED |
| H2 | PH2-2 | ✅ done | `web/lib/tradeLogApi.ts` |
| H2 | PH2-3 | ✅ done | Journal dateUtils + DayTradesPanel |
| H2 | PH2-4 | ✅ done | Reports chart/card modules |
| H2 | PH2-5 | ✅ done | PRACTICE_NESTED_SLUGS single source |
| H2 | PH2-G | ✅ PASS | `gate-reports/H2-delta-gate.md` |
| H3 | PH3-1 | ✅ done | Trade Log Spec §15 as-built; Journal P0 honesty |
| H3 | PH3-2 | ✅ done | Decision-log H0–H3 close |
| H3 | PH3-3 | ✅ done | `OPS-VS-PRODUCT.md` |
| H3 | PH3-4 | ✅ done | Non-goals in SCOPE + Spec §15.5 |
| H3 | PH3-G | ✅ PASS | `gate-reports/H3-delta-gate.md` |
| H4 | PH4-* | ☐ Coach optional | PH4-0 go/no-go first — **not opened** |

Update this table as seeds complete. All cold-start seeds live under `seeds/`.

### PH0-0 notes (Juliet)

- Concrete file inventory + CHARTER↔seed matrix written to `SCOPE.md`.  
- Seed pack H0–H4 confirmed complete vs CHARTER goals/DoD.  
- Feature creep freeze: no Retrospective/Playbook content; no blotter UX; no deploy.  
- **Coach decision required** before any H0 code (PH0-1).

---

## Invocation templates

### Primary implementer

```
Activate <Primary>. Project p-practice-harden, seed <PHn-x>.
Read:
  agents/p-practice-harden/seeds/<file>.md
  agents/p-practice-harden/CHARTER.md
  agents/p-practice-harden/ORCHESTRATOR.md
  agents/bench/doctrine.md
  agents/bench/first-principles-doctrine.md
  [linked Specs in seed]
Touch ONLY files listed in the seed.
Produce: completion checklist + evidence (commands + outputs).
Do NOT mark complete until reviewers in the seed have APPROVED.
```

### Reviewer

```
Activate <Reviewer>. Project p-practice-harden, seed <PHn-x> REVIEW.
Read the seed § Review protocol + implementer’s evidence pack.
Check: goals in CHARTER, invariants in seed, no scope creep, isolation if applicable.
Verdict: APPROVED or RETURNED with file-level, testable notes.
Do not implement fixes unless seed explicitly assigns fix to reviewer.
```

### Delta gate

```
Activate Delta. Project p-practice-harden, phase Hn gate.
Read all seeds marked done in phase + CHARTER DoD for phase.
File gate-reports/Hn-delta-gate.md with PASS/FAIL/BLOCKED + evidence.
No waived gates.
```

---

## Sequencing summary

```
PH0-0 (Juliet/Coach)
  → PH0-1 (Alpha ◄ Mike · India)
  → PH0-2 (Alpha ◄ Kilo · India)
  → PH0-3 (Kilo ◄ Alpha · Mike)
  → PH0-G (Delta)
       ↓
PH1-0 (India ◄ Alpha · Charlie · Coach)
  → PH1-1 → PH1-2 (Alpha ◄ India · Mike · Kilo)
  → PH1-3 (Charlie) ∥ PH1-4 (Alpha)
  → PH1-5 (Tango · Hotel)
  → PH1-G (Delta)
       ↓
PH2-1 (Alpha) ∥ PH2-2 (Charlie)
  → PH2-3 ∥ PH2-4 (Charlie ◄ Echo · Kilo)
  → PH2-5 (Charlie ◄ India)
  → PH2-G (Delta)
       ↓
PH3-* (India · Lima · Juliet ◄ Coach)
  → PH3-G (Delta)
       ↓
[optional] PH4-* Coach-gated
```

---

## Rules of engagement

1. One seed in flight per agent unless Juliet schedules parallel non-overlapping files.  
2. Out-of-scope file need → stop, report, re-seed.  
3. Evidence beats demo.  
4. “It should work” is banned.  
5. Behavior/metric changes require Coach + labeled seed section **Behavior change**.  
6. No Retrospective content features in this project (point to Journal Retrospective Spec slices).  
7. Coordination through **Coach or Juliet** — no silent agent-to-agent scope expansion.
