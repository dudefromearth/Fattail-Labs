# GSC2.5-1 — Kilo · AT-GSC-50 … 54

**Project:** p-sessions  
**Callsign:** Kilo  
**Depends:** GSC2.5-0  
**Feeds:** GSC2.5-G  
**Class:** `tsx` · both `TZ=UTC` and `TZ=Asia/Tokyo`

## Files in scope

| File | Touch |
|------|--------|
| `web/lib/sessions/segments.test.ts` | Create |
| `web/lib/sessions/sessionView.test.ts` | Append AT-GSC-50…54; **do not weaken** AT-GSC-20/21/22 |

## Assertions

| ID | Date | Assert |
|----|------|--------|
| AT-GSC-50 | 2026-09-08 | Three segments; ET bounds 09:30 / 12:30 / 14:30 / 16:00; `toAxis` of those minutes matches `start`/`end` |
| AT-GSC-51 | 2026-11-27 | Morning whole; Afternoon truncated at 13:00; Closing absent |
| AT-GSC-52 | 2026-11-26 | `segments.length === 0`; `currentSegment === null` |
| AT-GSC-53 | 2026-09-05 | empty + null |
| AT-GSC-54 | a past open weekday | `currentSegment === null` even if the clock time would fall in Afternoon |

AT-GSC-55/56 are GSC4 (shot / static). Not this seed.

## Out of scope

Re-gating AT-GSC-20/21/22 as new theory. Playwright. UI.
