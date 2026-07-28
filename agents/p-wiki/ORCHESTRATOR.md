# P-Wiki Orchestrator

How to run this project with the bench. Juliet maintains; Coach drives.

## Operating loop

1. Open the next seed in `seeds/` (order: WK0 → WK7; WK3 ∥ WK4 after WK2).
2. Activate the seed's agent (Grok bench or Claude session) with:
   - The seed file (scope of work — **only** the files it lists)
   - Both wiki specs + `agents/bench/doctrine.md`
   - The charter's Current State table
3. Agent executes; ends by running its own completion checklist and reporting
   evidence (commands + outputs), not claims.
4. Delta-style spot check before marking a seed done; update the checkbox table below.
5. Nothing merges to `main` until WK0's commit plan says so (specs land with code —
   documentation parity).

## Seed status

| Seed | Agent | Status |
|------|-------|--------|
| WK0 audit | India | ☐ |
| WK1 store + schema | Alpha | ☐ |
| WK2 API | Alpha | ☐ |
| WK3 env + sync | Foxtrot | ☐ |
| WK4 frontend wire | Charlie | ☐ |
| WK5 HIG + security review | Echo + Mike | ☐ |
| WK6 tests | Kilo | ☐ |
| WK7 gate + docs + ship | Delta + Lima | ☐ |

## Invocation templates

Grok (per seed):

```
Activate <Agent>. Project p-wiki, seed <WKn>.
Read agents/p-wiki/seeds/<file>, agents/p-wiki/CHARTER.md,
Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md,
Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md.
Touch only the files the seed lists. End with the completion checklist
executed and evidence (commands + outputs) pasted.
```

Claude: same content, any phrasing.

## Rules of engagement

- One seed in flight per agent; Alpha's WK1→WK2 are serial.
- A seed that wants to touch out-of-scope files stops and reports (change control).
- Evidence beats demo: §8.1 runbook rows are the currency of "done".
- Coach actions (spec approval, publishing content, ship call) are tracked in the
  plan §3 — agents do not wait silently on them, they flag loudly.
