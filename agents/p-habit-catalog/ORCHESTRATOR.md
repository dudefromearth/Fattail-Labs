# p-habit-catalog — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Full plan | [`docs/Habit-Catalog-Full-Agent-Bench-Plan.md`](../../docs/Habit-Catalog-Full-Agent-Bench-Plan.md) |
| Spec | [`Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md`](../../Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md) |
| Architecture | [`Architecture/13-habit-catalog-design.md`](../../Architecture/13-habit-catalog-design.md) |

---

## Sequencing law

> **No HC1+ implementation until HC0-G PASS (Coach GO + reviews).**  
> Vertical slice `size-reason` must close Journal → Retro → Journey before full polish.

---

## Status board

**Program status:** **HC0 OPEN** — Spec v0.1 for W0 review · design locked  

| Phase | Intent | Status |
|-------|--------|--------|
| **HC0** | Spec reviews + Coach GO | **NEXT** |
| **HC1** | Schema + seed + domain + APIs | blocked on HC0-G |
| **HC2** | `/app/habits` + suite nav | blocked on HC1-G |
| **HC3** | Retro coverage + install | blocked on HC2-G (or HC1-G if parallel OK) |
| **HC4** | Journal evidence hooks | blocked on HC1-G |
| **HC5** | Journey methodology strip | blocked on HC3+HC4 preferred |
| **HC6** | Export + docs + CLOSE | blocked on HC5-G |

### Critical path

```text
HC0-G → HC1-G → HC2-G → (HC3 ‖ HC4) → HC5-G → HC6-G
```

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| HC0-0 Coach GO | Coach | pending |
| HC0-1 India | India | pending |
| HC0-2 Tango | Tango | pending |
| HC0-3 Echo | Echo | pending |
| HC0-4 Mike | Mike | pending |
| **HC0-G** | Delta | pending |
| HC1-G … HC6-G | Delta | pending |

---

## How to run a seed

1. Read charter + Spec + seed.  
2. Declare files + changes.  
3. Execute; evidence only.  
4. Report PASS/FAIL/BLOCKED to Coach/Juliet.  
5. Delta gate at phase end — no waived gates.  
