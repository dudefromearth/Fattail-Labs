# p-community — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Spec | [`Specs/FatTail-Labs-Community-App-Spec-v1.0.md`](../../Specs/FatTail-Labs-Community-App-Spec-v1.0.md) **v1.0.2** |
| Security | [`Architecture/05-security-and-access.md`](../../Architecture/05-security-and-access.md) §4.1 |
| Seeds | [`seeds/`](./seeds/) |
| Gates | [`gate-reports/`](./gate-reports/) |

**Decisions:** DL-237 · DL-238 · DL-239 (BUILD AUTHORITY) · **DL-240** (WP Discord connector)

---

## Sequencing law

> **Spec is BUILD AUTHORITY (DL-239).**  
> **C0-G** = specialist reviews stamped + Delta ACK before Discord-heavy **C1b/c**.  
> **C1a** (shell + shelves, no live Discord) may proceed after C0 specialist seeds
> land or Coach waives sequencing — default: **C0-G then C1a**.  
> No waived Delta gates.

---

## Status board

**Program status:** **C1a-G PASS** — shell live · **C1b NEXT** (Discord bridge still off)

| Phase | Intent | Status |
|-------|--------|--------|
| **C0** | Specialist reviews + Delta lock | **PASS** — `gate-reports/C0-G.md` |
| **C1a** | App card, shell, channel map seed, FatTail + member bot shelves | **PASS** — C1a-1 + C1a-G |
| **C1d-lite** | Admin Discord channel map UI + API | **PASS** (ahead of sequence; map only) |
| **C1b** | WP→Labs Discord ingest (fattail.ai plugin), names, role sync + **date-aware reconcile** | **NEXT** |
| **C1c** | Bidirectional message sync + gap-heal backfill + composer + embeds | blocked on C1b-G |
| **C1d** | Admin channel create/map; share/apply + house provenance | blocked on C1c-G (or parallel C1a shelves) |
| **C2** | Discord embeds for shares; reactions/threads; course discussion bridge | deferred |
| **CLOSE** | Ops evidence, as-built docs, Delta program close | after C1d-G |

### Critical path

```text
C0-G → C1a-G → C1b-G → C1c-G → C1d-G → CLOSE
              ↘ shelves may harden in C1d
```

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| C0-0 Coach Phase 5 | Coach | **PASS** — DL-239 · Spec BUILD AUTHORITY |
| C0-1 India residual | India | **PASS** — `gate-reports/C0-1-india-residual.md` |
| C0-2 Tango | Tango | **PASS** — `gate-reports/C0-2-tango.md` (copy deltas for Charlie) |
| C0-3 Mike | Mike | **PASS** — `gate-reports/C0-3-mike.md` (WP plugin inventory + ingest + executor) |
| C0-4 Echo | Echo | **PASS** — `gate-reports/C0-4-echo.md` (layout + tokens for Charlie) |
| C0-5 Foxtrot | Foxtrot | **PASS** — `gate-reports/C0-5-foxtrot.md` · deploy.md stub |
| **C0-G** | Delta | **PASS** — `gate-reports/C0-G.md` · unlocks C1a |
| C1a-1 Alpha | Alpha | **PASS** — schema + API + shell |
| **C1a-G** | Delta | **PASS** — `gate-reports/C1a-G.md` · unlocks C1b |
| C1b-G … C1d-G · CLOSE-G | Delta | pending |

---

## How to run a seed

1. Read charter + Spec + seed.  
2. Declare exact files + changes before touch.  
3. Execute; evidence only (curl, logs, tests).  
4. Report PASS/FAIL/BLOCKED to Coach/Juliet.  
5. Delta gate at phase end — no waived gates.  
