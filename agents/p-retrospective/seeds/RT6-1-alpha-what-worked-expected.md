# Seed RT6-1 — Alpha: What worked + expected vs actual gather

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** Hotel · Tango  
**Phase:** R6  
**Prerequisite:** RT2-G (may run parallel after RT2 if merged — Juliet call)  

## Goal

Populate report sections §6.4–6.5:

- what_worked max 3 (including adverse process-held row without printing P&amp;L figure)  
- expected_vs_actual from pre_market + trades; omit if none  
- Honest absence  

## Completion criteria

- [x] Hotel · Tango APPROVED  
- [x] tests for empty pre_market  

## Feeds

→ RT6-2  

---

## Evidence (2026-07-29 — Alpha RT6-1)

### Shipped

| Item | Detail |
|------|--------|
| `what_worked` | Adherence runs, journal stretch, **adverse followed** (no $ figure) |
| `expected_vs_actual` | From `pre_market` surface or journal body markers; **null** if none |
| Intent text | Verbatim after stripping type marker only |
| Cap | max 3 what_worked |

### pre_market detection

- `surface = 'pre_market'`, or  
- `surface = 'journal'` with body starting `pre_market:` / `[pre_market]` / `# pre_market`

### pytest

```
tests/test_retrospectives.py  33 passed
```

Includes empty pre_market → null; pre_market pair; adverse no dollar figure.

### Hotel: **APPROVED**

Adverse row is process fact; sample/P&L figure never printed in what_worked.

### Tango: **APPROVED**

Honest absence; no success/fail framing; capacity over dependency (gap left for member).
