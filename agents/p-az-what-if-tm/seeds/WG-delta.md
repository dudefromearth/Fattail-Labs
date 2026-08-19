# Seed W-G — Delta implementation gate

**Project:** p-az-what-if-tm  
**Agent:** Delta  
**Phase:** W-G  
**Depends:** W4-1 · W5-1  
**Gate it feeds:** ship / MiniTwo (Coach)

## Evidence required

| Check | Pass if |
|-------|---------|
| Time max | Not 72; last-trade remaining (AT-TM-1/2) |
| τ | Still 16:00 PM (no T3 rewrite) |
| Vol | Detent σ_m; `volOffsetPts = σ_s − σ_m`; expiry unchanged |
| IV NO | No fake 16% |
| HUD | Says What-if; same scalar (AT-TM-11) |
| 15:30 | T+0 still moves on Analyzer **and** Surface (AT-TM-13 · 14) |
| Docs | Lima DL + §1.11 honesty |
| NX | No `/resolve` schema, no Massive, no ratio wire |

Ternary **PASS / FAIL / BLOCKED**. Never waive.

## Deliverable

`gate-reports/W-G.md`
