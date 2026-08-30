# Seed A2-W6-1 — Kilo ATs

**Project:** p-studioone-archive-read (A2 strip)  
**Agent:** Kilo  
**Phase:** W6  
**Depends:** W5-G PASS  
**Law:** A2_1 acceptance table · plan v1.0 §6 · AT-SOAR-50…59  
**Gate it feeds:** W6-G

## Ask

Run AT-SOAR-50…59. **Never waive.**

- **50** is a **live** 2026-08-27 walk. First print `mid=17.855` is the floor; empty/UNKNOWN is fail. A fixture does not close 50.  
- **51** count of served names = files on disk that day, including `session.jsonl`.  
- **52** synthetic gap → named gap, never last known.  
- **53–54** null / absent `generation.vix` is not a hole.  
- **55** 2026-08-14 SPY coverage+index+fetch.  
- **56** enumerate disk; fail first unreachable.  
- **57** coverage payload: tape ≠ absent book.  
- **58** batch; `source` / `label` beside `mid`.  
- **59** `VIX NOT NATIVE` on 2026-08-27; a synthetic native tape does not flag.

## Out of scope

TM e2e. Waiving 50 because “the route exists.”

## Done when

Evidence log with command + output per AT.
