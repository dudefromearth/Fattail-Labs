# GSC0-7 — Kilo · AT matrix

**Project:** p-sessions  
**Callsign:** Kilo  
**Depends:** Hotel `evidence/hotel-calendar.md` (handoff — run last)  
**Feeds:** GSC0-G · GSC1-1 · GSC2-1 · GSC2-3 · GSC4-3 · GSC5-2  
**Invariants:** Deterministic tests · one evidence class per AT · no waive · GSC2 both TZs

## Files in scope

| File | Touch |
|------|--------|
| Plan §8 · Spec §9 · `evidence/hotel-calendar.md` | Read |
| `agents/p-sessions/evidence/characterization-list.md` | **Write** |

## Out of scope

Writing the tests. Product code. Shipping.

## Task sequence

1. Lock every AT-GSC id from plan §8 (01–05, 06a/b/c, 10–16, 17a/b, 18, 19a/b, 20–22, 30–36, 40, 41a/b/c, 42–45).  
2. Exactly one class per row + the command that produces it.  
3. GSC2 tsx under `TZ=UTC` and `TZ=Asia/Tokyo`.  
4. Flag ATs whose class cannot prove the claim (33 browser TZ, 45 policy).

## Completion

`evidence/characterization-list.md`. No Spec §9 row dropped. HTML does not block GSC0-G.
