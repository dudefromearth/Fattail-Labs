# Seed W1-2 — Kilo SO-AR today

**Project:** Time Machine One Source  
**Agent:** Kilo  
**Depends:** W1-1  
**Law:** TMI-85 · AT-TM-OS-3  
**Out:** product code beyond tests

## Ask

Characterize:

- Today + snaps → 200 + snaps. No 409 `TODAY_LIVE`.
- Today + zero snaps → named empty / NONE, not TODAY_LIVE.
- Coverage today: `live: true` and count when files exist.
- In-flight `day_hash` mismatch → 409 `day_changed` (resume). That hole is **not** asserted against a completed snapshot.
- A past covered date still retrieves. An uncovered date still NO PATH / NONE.

Evidence: pytest command + output.

## Done when

`reviews/W1-2-kilo.md`. Delta W1-G.
