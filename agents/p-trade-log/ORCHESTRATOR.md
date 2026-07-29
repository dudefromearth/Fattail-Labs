# P-Trade-Log Orchestrator

How to run Trade Log v1.1 with the Agent Bench. **Juliet** maintains the board; **Coach** drives; specialists execute **only** via seeds.

**Spec:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md)

## Operating loop

1. Open the next seed in `seeds/` (order below).  
2. Activate the seed’s agent with: seed file · Spec v1.1 · `agents/bench/doctrine.md` · this charter.  
3. Agent executes **only** in-scope files; ends with completion checklist + **evidence**.  
4. Delta spot-check before marking seed done; update status table.  
5. Phase ends at formal Delta gate reports under `gate-reports/`. No waived gates.

## Seed status

| Seed | Agent(s) | Status | Gate |
|------|----------|--------|------|
| TL0 Spec/architecture review | India (+ Echo, Tango, Hotel as needed) | ☐ | Spec ready for build |
| TL1 Schema + API spine | Alpha · Kilo | ☑ P1 | Isolation + multi-leg CRUD |
| TL2 Table-first UI + sheet | Charlie · Echo | ☑ P1 | Spec §3 shell + §5 table |
| TL3 Canonical export/import | Alpha · Charlie | ☐ | native + csv_generic |
| TL4 thinkorswim + Positions | Alpha · Charlie | ☐ | Adapter + open book |
| TL5 Records summary/series + Journal link | Alpha · Charlie | ☐ | Spec §10.2–10.3 |
| TL6 Delta gate + Lima close | Delta · Lima | ☐ | Ship evidence |

## Invocation template

```
Activate <Agent>. Project p-trade-log, seed <TLn>.
Read agents/p-trade-log/seeds/<file>,
agents/p-trade-log/CHARTER.md,
Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md,
agents/bench/doctrine.md.
Touch only the files the seed lists.
End with the completion checklist executed and evidence (commands + outputs) pasted.
```

## Sequencing

```
TL0 (Coach build approval after India)
  → TL1
  → TL2 ∥ (docs only)
  → TL3
  → TL4
  → TL5
  → TL6
```

Mike reviews import/export and isolation with TL1/TL3 (pair on seed or add review note in gate).  
Tango/Hotel process-first review: TL0 and/or TL2 copy pass.

## Rules of engagement

- One seed in flight per agent unless Juliet schedules parallel non-conflicting files.  
- Out-of-scope file need → stop, report, re-seed.  
- Evidence beats demo.  
- Coach actions (spec approval, ship) are explicit — agents flag blockers, they do not invent scope.
