# RT07-L — Ceremony map layout §6.2 (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**  
**Spec:** `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7_1.md` §6.2 (layout amendment on as-built v0.7.1)

## Deliverable

`web/components/retrospective/RetrospectiveWorkspace.tsx`

| Element | Behavior |
|---------|----------|
| 3×3 grid | Persistent `data-layout="map-3x3"`; tiles 1–9 |
| Tile state | `needs_you` (5, 8) · `has_content` (summary) · `nothing_here` |
| Body | One focused step under the map (`ceremony-step-body`) |
| Default focus | First `needs_you`, else step 1 |
| Anti-wizard | Any tile anytime; no Next gate |
| Agent | Outside tiles (not a 10th step) |
| Trends / comparison | Under practice (step 2) only |

## Evidence

```
pytest tests/test_retrospectives.py -q   # includes map-3x3 source asserts
tsc --noEmit                             # clean
web build + next start                   # :3000 200
```

## Out of scope

- Schema / gather / R3–R9 reopens  
- Spec rename to v0.7.2 (doc hygiene — follow-up)  
