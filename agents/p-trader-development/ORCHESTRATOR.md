# p-trader-development — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Implementation plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Full bench plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Phase bench plans | [`Docs/Trader-Development-Phase-*-Agent-Bench-Plan.md`](../../Docs/) |
| Roadmap Spec | [`Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md`](../../Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md) |
| Alignment | [`Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md`](../../Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md) |

---

## Sequencing law

> **No TD1+ implementation until TD0-G PASS (Coach GO + Spec BUILD AUTHORITY).**  
> Specs are DRAFT until finish pass — TD0-0 first.  
> Own (TD1) before Match long pole (TD2 sync).  
> TD4 only with per-expansion GO.

---

## Status board

**Program status:** **TD0 IN PROGRESS** — **BUILD AUTHORITY** (DL-254) · implementing Phase 0 glue  

**OD authority:** [`Specs/FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](../../Specs/FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) 

| Phase | Intent | Status |
|-------|--------|--------|
| **TD0** | Spec GO + foundation glue | **IN PROGRESS** |
| **TD1** | Playbook + Campaign + adherence | blocked on TD0-G |
| **TD2** | Charts · sync · process reports | blocked on TD1-G (default) |
| **TD3** | Season retro · nudges · R/MFE · PWA | blocked on TD1-G (+ TD2 charts for MFE) |
| **TD4** | Optional expansions | blocked on TD3-G + TD4-0 |

### Critical path

```text
TD0-G → TD1-G → (TD2 charts ‖ reports ‖ sync) → TD2-G → TD3-G → TD4 optional
```

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| TD0-0 Coach GO | Coach | **PASS** (DL-254) |
| TD0-1 India | India | pending |
| TD0-2 Tango | Tango | pending |
| TD0-3 Echo | Echo | pending |
| TD0-4 Mike | Mike | pending |
| **TD0-G** | Delta | pending |
| TD1-G | Delta | pending |
| TD2-G | Delta | pending |
| TD3-G | Delta | pending |
| TD4-E*-G | Delta | n/a until GO |

---

## How to run a seed

1. Read Charter + phase Spec + Full Bench Plan + seed.  
2. Declare exact files + changes (change control).  
3. Execute; evidence only (curl, pytest, UI).  
4. Report PASS/FAIL/BLOCKED to Coach/Juliet.  
5. Delta files `gate-reports/TD*-G.md` — **no waived gates**.  

---

## Seed inventory

See `seeds/README.md` and Full Bench Plan §6. Juliet materializes seed files after TD0-0.
