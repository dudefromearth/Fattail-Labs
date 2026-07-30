# Seed RT7-1 — Alpha: Cadence meter

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** India · Tango  
**Phase:** R7  
**Prerequisite:** RT3-G (R4–R6 preferred complete)  

## Goal

Per cadence delta §A:

1. `retro_horizon_days` on meter profiles  
2. `retrospective` meter formula (not soon)  
3. Empty E1–E3 (E1 = cannot create retro)  
4. Only `completed_at` moves clock  
5. Tenure weighting unchanged  
6. Nudge threshold reads **same** field  

## Files in scope

- `server/journey_scores.py`  
- `server/tests/test_journey_scores.py`  
- Optionally retrospective list API for days-since-last  

## Completion criteria

- [x] Formula boundaries tested (H, 1.5H, 2H)  
- [x] Open/abandoned do not freeze  
- [x] India · Tango APPROVED  

## Feeds

→ RT7-2, RT7-3  

---

## Evidence (2026-07-29 — Alpha RT7-1)

### Shipped

| Item | Detail |
|------|--------|
| Profiles | `retro_horizon_days`: trial 42, nav mo 30, annual 90, activator 30, alumni 60, free **None** (E1) |
| Formula | `retrospective_cadence_raw(d, H)` — d≤H→100, 1.5H→50, ≥2H→0 |
| Empty | E1 cannot-create; E2 grace no-complete d≤H; E3 epoch unresolvable |
| Clock | Only `status=complete` + `completed_at`; open ready does not reset |
| Nudge | `meter.nudge = d > H` (same H) |
| Profile API | `process.profile.retro_horizon_days` |

### pytest

```
tests/test_journey_scores.py  16 passed
```

### India: **APPROVED**

Single-sourced H on profiles; tenure path unchanged; product boundary clean.

### Tango: **APPROVED**

Meter label “Retrospective cadence”; nudge flag only (copy in RT7-2); no shame in detail strings.
