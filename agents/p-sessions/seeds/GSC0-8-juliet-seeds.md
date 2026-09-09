# GSC0-8 — Juliet · Materialize GSC1–GSC6 seeds

**Project:** p-sessions  
**Callsign:** Juliet  
**Depends:** GSC0-0 GO  
**Feeds:** GSC0-G · GSC1…  
**Invariants:** Juliet never executes packets · one domain per seed · GSC2-view must not write timeAxis/exchanges

## Files in scope

| File | Touch |
|------|--------|
| Plan v1.2 §7 · Charlie feasibility · stamped OD-S1 path | Read after GO |
| `agents/p-sessions/seeds/GSC1-*.md` … `GSC6-G.md` | **Write after GO** |
| `ORCHESTRATOR.md` NEXT | Update after GO |

## Out of scope

Product code. Changing OD ticks. Running this seed before Coach stamps GO.

## Task sequence

After `agents/go/GSC-W0.md` is **GO**:

1. Write GSC1-0…GSC6-G seeds from plan §7.  
2. Name exact files + write trees.  
3. GSC4 entry = OD-S4 (a) or (c).  
4. Board NEXT = GSC1 ∥ GSC2-axis.

## Completion

GSC1–GSC6 seeds on disk, each executable from cold. **Not run in the GSC0 pre-GO session.**
