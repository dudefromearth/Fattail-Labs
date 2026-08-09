# p-journal-day-net — Orchestrator (Juliet)

## Status

| Phase | State |
|-------|--------|
| W0 Program lock | **PASS** — Coach GO 2026-08-09; defaults ON / buckets / R:R density / JED-4 deferred |
| JED-1 API | **PASS** — domain + route + tests |
| JED-1b Toggle prefs | **PASS** — migration 116 + API |
| JED-2 Month paint | **PASS** — amounts, gradient, period bar, toggle |
| JED-3 Week | **PASS** — week nets + Week P&L bar |
| JED-4 Year | **Deferred** (Coach GO) |
| JED-6 R:R polish | Folded into JED-2 (desktop R shown when sample_n > 0) |
| Z Close | In progress — ship commit |

## Claude plan review (folded)

- **C1:** Hotel W0-2 must state **day_r2r aggregation rule** in one sentence.  
- **C2:** Lima W0-4 DL = **ratified for build**, not shipped.  
- Paint gate + L-table + T12 + risk register: affirmed.

## First actions after Coach GO (W0-0)

1. Materialize cold-start seeds from bench plan §5 → `seeds/` (W0-3).  
2. India W0-1 formula pin; Hotel W0-2 **aggregation sentence (C1)**; Lima W0-4 DL carve-out (**ratified for build** — C2).  
3. Delta W0-G only when seeds exist + locks written + C1/C2 evidence.  
4. **Do not** schedule Charlie paint before JED-1-G **and** JED-1b-G.

## Paths

- Plan: `docs/Journal-Day-Net-Calendar-Full-Agent-Bench-Plan-v1.0.md`  
- Spec: `Specs/FatTail-Labs-Journal-Day-Net-Calendar-Spec-v0.2.md`  
- Seeds: `agents/p-journal-day-net/seeds/`  
- Gates: `agents/p-journal-day-net/gate-reports/`

## Coordination

Specialists **only** via seeds. Coordination only Coach or Juliet. No waived Delta gates.
