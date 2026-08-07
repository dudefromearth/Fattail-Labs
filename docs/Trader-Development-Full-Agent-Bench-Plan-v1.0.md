# Trader Development — Full Multi-Agent Bench Plan v1.0

**Date:** 2026-08-07  
**Program:** [`agents/p-trader-development/`](../agents/p-trader-development/)  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship / doctrine)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)  

### Spec authority (phase pack)

| Phase | Spec |
|-------|------|
| Program | [`Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md) |
| TD0 | [`…Phase-0-Foundation-Glue-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-0-Foundation-Glue-v1.0.md) |
| TD1 | [`…Phase-1-Own-Spine-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1.0.md) |
| TD2 | [`…Phase-2-Match-Hygiene-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1.0.md) |
| TD3 | [`…Phase-3-Deepen-Person-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-3-Deepen-Person-v1.0.md) |
| TD4 | [`…Phase-4-Optional-Expansion-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-4-Optional-Expansion-v1.0.md) |

**Alignment (Claude finish pass):** [`Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md`](./Claude-Alignment-Trader-Development-Spec-Finish-Pass.md)  
**OD locks (working):** [`Specs/FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](../Specs/FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)

**Per-phase bench slices:**  
[`TD0`](./Trader-Development-Phase-0-Agent-Bench-Plan.md) · [`TD1`](./Trader-Development-Phase-1-Agent-Bench-Plan.md) · [`TD2`](./Trader-Development-Phase-2-Agent-Bench-Plan.md) · [`TD3`](./Trader-Development-Phase-3-Agent-Bench-Plan.md) · [`TD4`](./Trader-Development-Phase-4-Agent-Bench-Plan.md)

---

## Sequencing law

> **No implementation code (TD1+ schema/UI) until TD0-G PASS.**  
> TD0 may implement **only** glue enhancements after Spec BUILD AUTHORITY on Phase 0.  
> **No TD2 multi-broker or TD4 AI** pulled forward for “completeness.”  
> **Own first → Match second → Deepen third.**  
> Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
> Delta gates are **PASS / FAIL / BLOCKED** with evidence — **never waived**.

**Spec status today:** Phase pack is **DRAFT v1.1** with **OD locks in Decision Addendum**. Coach must stamp formal **BUILD AUTHORITY** before TD0-G can PASS. Seeds obey Addendum locks (e.g. `entry_source=sync`, single active campaign, progressive story copy).

---

## 0. Mission (one screen)

Ship **trader development** infrastructure inside Practice — not a trade-analytics journal clone.

```text
Playbook → Campaign → Trade Log + Tags + Journal → Retro → Journey → Toughness
```

| Mode | This program |
|------|----------------|
| **Own** | Playbook-as-character · practice campaigns · process Tags · season retro · Journey nudges · doctrine |
| **Match** | One-broker auto-sync · static trade charts · process reports · multi-leg log hygiene |
| **Refuse** | Tick replay · 600 P&L charts · edge AI · prop-firm core · win-rate-as-hero |

**Related programs (do not subsume):**  
`p-trade-log` · `p-tag-manager` · `p-member-export` · `p-retrospective*` · `p-journal-session*` · `p-fattail-hard` · `p-strategy-runtime` (campaign bridge only)

---

## 1. Outcomes / Definition of Done (program)

| # | Outcome |
|---|---------|
| 1 | Member runs a **playbook** and **campaign season** with evidence on Trade Log |
| 2 | Tags are daily-usable process language (not buried) |
| 3 | Dual-sub pressure reduced: **charts + one-broker sync** good enough for logging |
| 4 | Season closes via **Retro**; Journey speaks **process** nudges |
| 5 | Family B + export/purge cover new objects |
| 6 | Copy and UX are trader-development, not edge theater |
| 7 | TD-close gate PASS · DL entry · Specs as-built |

---

## 2. Critical path

```text
TD0 Spec GO + Foundation glue
  → TD1 Playbook + Campaign + links + adherence     [OWN]
  → TD2 Charts ‖ Process reports ‖ Sync pilot       [MATCH]
  → TD3 Season retro · Journey nudges · R/MFE · PWA [DEEPEN]
  → TD4 Optional only (gates)                       [EXPAND]
```

**Parallelism:** After TD1-G, TD2 charts and process reports may run in parallel with sync (sync is long pole). TD3 blocked on TD1-G; MFE needs TD2 chart stack.

---

## 3. Full bench roster

### 3.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | Product frame, Match/Own/Refuse, ship/no-ship, phase GO, arbiter |
| **Juliet** | Decomposition, board, seeds, status honesty — **never executes packets** |
| **India** | Domain model (playbook, campaign, links, sync plane), Family B floor, SL campaign bridge |

### 3.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | Migrations, domain, APIs, sync worker, export bump, Massive chart APIs |
| **Charlie** | Practice UI: Playbook, Campaign chrome, charts, Reports, Journey nudges, PWA |
| **Echo** | HIG density, empty states, Practice context chrome, arming-free ceremony layout |
| **Mike** | Isolation, broker OAuth/tokens, purge/disconnect, coach-view grants (TD4 only) |
| **Foxtrot** | Env for aggregator keys / Massive; stage deploy when phase needs it |
| **Sierra** | Marketing surfaces: no journal-clone / profit claims |

### 3.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | Formal gates TD0-G … TD4-G with evidence |
| **Kilo** | Isolation, idempotent sync, export round-trip, adherence/campaign filters |
| **Lima** | DL, Spec as-built, Guide truth |
| **Tango** | Copy: operator, campaign season, no shame/P&L theater |
| **Hotel** | Risk/R framing honesty; no reckless “optimal exit” claims on MFE |

### 3.4 Lineage (Coach pull)

| Callsign | When |
|----------|------|
| **Whiskey** | Capital preservation framing on reports |
| **Victor** | Via negativa: refuse edge theater |
| **Yankee** | Fat-tail honesty if expectancy language creeps in |

### 3.5 Not seated (this program)

| Callsign | Why |
|----------|-----|
| **Quebec / Bravo / November / Romeo / Papa** | Content studio / marketing campaigns |
| **Golf** | Ask Vexy |

---

## 4. Sacred invariants (all seeds)

1. **Trader development** — features judged by formation, not edge density.  
2. **Standalone repo** — no MSC imports.  
3. **Family B** — playbook, campaign, connections, trades by `identity_id`.  
4. **Config fail-loud** — missing broker/env/market data fails; no silent fake charts.  
5. **Tags = lexicon only** — no free-text invent; no win-rate-by-tag hero.  
6. **Playbook = character** — not strategy backtester.  
7. **Campaign = practice season** — not marketing Campaign Workflow; bridge SL life-cycle if dual concept.  
8. **Sync COGS** — bill only **connected** users; disconnect on churn/purge.  
9. **Match hygiene** — charts static; one broker first; no tick replay.  
10. **Process metrics** — adherence, tags, season — not profit theater.  
11. **Evidence over assertion** at every Delta gate.  
12. **Change control** — seed lists files before touch.

---

## 5. Phase plans (seed tables)

Detail + seed filenames also live in per-phase docs. Summary:

### TD0 — Spec lock + Foundation glue

| Seed | Agent | Work |
|------|-------|------|
| TD0-0 | **Coach** | BUILD AUTHORITY on Phase 0–1 minimum; Match/Own/Refuse locks |
| TD0-1 | **India** | Spec integrity: Phase 0 scope, no new SoR |
| TD0-2 | **Tango** | Story chrome + process language pass |
| TD0-3 | **Echo** | Practice framing strip / empty states notes |
| TD0-4 | **Mike** | Tags assignments remain Family B; no leakage |
| TD0-5 | **Charlie** | Story chrome + Tags discoverability Trade Log/Journal |
| TD0-6 | **Alpha** | Reports/blotter process-tag filter (if API needed) |
| TD0-7 | **Kilo** | Tag filter + export regression tests |
| TD0-G | **Delta** | Spec GO + glue evidence → unlock TD1 |

### TD1 — Own spine (Playbook · Campaign · Adherence)

| Seed | Agent | Work |
|------|-------|------|
| TD1-0 | **Coach** | Phase 1 BUILD AUTHORITY if not in TD0-0 |
| TD1-1 | **India** | Domain model: tables, SL campaign bridge, Practice Context |
| TD1-2 | **Mike** | Isolation matrix; export/purge inventory |
| TD1-3 | **Alpha** | Migrations + domain + APIs playbook/campaign |
| TD1-4 | **Alpha** | Trade FK links + filters; adherence prompt fields |
| TD1-5 | **Charlie** | `/app/playbook` live; campaign create/activate UI |
| TD1-6 | **Charlie** | Practice Context active campaign; blotter columns |
| TD1-7 | **Echo** | Visual pass Playbook + campaign chrome |
| TD1-8 | **Tango** | Copy: season, covenant, adherence vs book |
| TD1-9 | **Kilo** | Isolation + CRUD + filter tests |
| TD1-10 | **Alpha** | Export/import keys (or explicit residual to TD1.1) |
| TD1-G | **Delta** | Own spine MVP proven end-to-end |

### TD2 — Match hygiene (Charts · Sync · Process reports)

| Seed | Agent | Work |
|------|-------|------|
| TD2-0 | **Coach** | Vendor GO; COGS policy lock |
| TD2-1 | **India** | Connection plane; chart contract; process report definitions |
| TD2-2 | **Mike** | OAuth/token storage; disconnect on churn/purge |
| TD2-3 | **Alpha** | Chart API + Massive cache; fail loud stale |
| TD2-4 | **Charlie** | Trade drawer charts + markers |
| TD2-5 | **Alpha** | Connection APIs + sync worker → import path `entry_source=sync` + Trade Log Spec catalog amend + chip + DL |
| TD2-6 | **Charlie** | Connect UX; last sync; errors |
| TD2-7 | **Alpha/Charlie** | Process report pack v1 |
| TD2-8 | **Kilo** | Idempotent sync; chart golden; isolation |
| TD2-9 | **Foxtrot** | Stage secrets / flags when ready |
| TD2-G | **Delta** | Match hygiene proven; COGS connected-only |

### TD3 — Deepen the person

| Seed | Agent | Work |
|------|-------|------|
| TD3-1 | **India** | Season retro context; nudge rules; R/MFE honesty |
| TD3-2 | **Alpha** | Retro gather campaign stats; optional planned_risk |
| TD3-3 | **Charlie** | Season retro path; Journey nudges UI |
| TD3-4 | **Alpha/Charlie** | Tag analytics v2; R and/or MFE widgets |
| TD3-5 | **Alpha** | Optional Massive Futures underlier (ES/NQ) |
| TD3-6 | **Charlie** | PWA polish Journal + check-in + campaign badge |
| TD3-7 | **Tango/Hotel** | Copy pass nudges + MFE caveats |
| TD3-8 | **Kilo** | Characterization suite |
| TD3-G | **Delta** | Season close + formation loop green |

### TD4 — Optional expansion (trigger-gated)

| Seed | Agent | Work |
|------|-------|------|
| TD4-0 | **Coach** | Explicit GO per expansion + kill criteria |
| TD4-x | *varies* | Second broker · process AI · standalone SKU · coach view |
| TD4-G | **Delta** | Per-expansion PASS; no doctrine regression |

---

## 6. Seed inventory (filesystem)

```text
agents/p-trader-development/
  CHARTER.md
  ORCHESTRATOR.md
  IMPLEMENTATION-PLAN.md
  seeds/
    README.md
    TD0-0-coach-go.md
    TD0-1-india-spec.md
    …
    TD0-G-delta.md
    TD1-… 
    TD2-…
    TD3-…
    TD4-0-coach-expansion-go.md
  gate-reports/
    README.md
```

Juliet writes seeds from cold-start template after TD0-0 scope lock. **Seeds before TD0-G may be review-only.**

---

## 7. Agent RACI (summary)

| Agent | Owns |
|-------|------|
| **Coach** | GO, refuse list, ship |
| **Juliet** | Board, seeds, sequence |
| **India** | Domain, bridges, Spec truth |
| **Alpha** | Backend, sync, data |
| **Charlie** | Member UI |
| **Echo** | HIG / density |
| **Tango** | Psychology / copy |
| **Mike** | Privacy / secrets |
| **Kilo** | Tests |
| **Delta** | Gates |
| **Lima** | DL / docs status |
| **Hotel** | Risk framing |
| **Foxtrot** | Deploy/env |
| **Sierra** | External claims |

---

## 8. Risk register

| Risk | Mitigation |
|------|------------|
| Spec still DRAFT | TD0-0 blocks code; Claude finish pass first |
| Dual “campaign” (SL vs Practice) | India TD1-1 bridge; single chrome label |
| Sync long pole | Parallel charts + process reports |
| Multi-leg auto-sync garbage | Quarantine + CSV; Kilo cases |
| Scope → journal clone | Refuse list on every seed; Victor pull |
| COGS zombies | Disconnect on churn/purge; Mike |
| MFE misread on options | Hotel copy; structure caveats |

---

## 9. Coach GO checklist (TD0-0)

- [ ] Roadmap + Phase 0–1 Specs BUILD AUTHORITY (or written amend)  
- [ ] Match / Own / Refuse locked  
- [ ] Trader-development north star confirmed  
- [ ] Reviews TD0-1…4 PASS or residual recorded  
- [ ] TD0-G path clear  
- [ ] DL GO entry  
- [ ] Board NEXT = TD0 implementation or TD1 after glue  

---

## 10. Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-07 | Initial full bench plan from phase Spec pack + competitive roadmap |
