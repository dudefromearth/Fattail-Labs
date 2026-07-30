# Seed RT2-2 — Alpha: Gather process-first + deviations + sample gate

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** India · Hotel  
**Phase:** R2b  
**Prerequisite:** RT2-1  

## Goal

Upgrade `gather_report` / domain to emit Spec §6.1–6.3, §6.6 fields:

1. Process performance rates  
2. Integrity review (existing Journey process_meters)  
3. Bounded deviations (max 5; journal/activity gap **N=3**)  
4. Book performance with `trade_count`, `sample_below_min`, `MIN_INFERENCE_N=20`  
5. Keep Option C scope boundaries  

## Files in scope

- `server/retrospective_domain.py`  
- `server/routes/retrospectives.py` (if needed)  
- `server/tests/test_retrospectives.py`  

## Out of scope

- UI layout (RT2-3)  
- Normalized comparison (RT3)  
- Agent  

## Completion criteria

- [x] report_json matches DTO  
- [x] Hotel: sample gate honest  
- [x] India APPROVED  
- [x] pytest green  

## Feeds

→ RT2-3, RT2-4  

---

## Evidence (2026-07-29 — Alpha RT2-2)

### Shipped

| Item | Detail |
|------|--------|
| `gather_report` | Emits **version 0.5** per Architecture/12 |
| Process §6.1 | adherence rates, routine/live/learning per-week |
| Integrity §6.2 | Journey meters + direction when prior exists |
| Deviations §6.3 | `adherence_broke`, `journal_activity_gap` (N=3), max 5 |
| Book §6.6 | `sample_below_min`, `sample_banner`, `min_inference_n=20` |
| Option C | Maiden `[start,end]`; subsequent `(start,end]` unchanged |
| Compat | `pnl` alias = `book_performance` for v0.2 readers |

### pytest

```
tests/test_retrospectives.py  13 passed
```

Includes `test_rt22_report_v05_shape_and_sample_gate`, gap constants.

### Hotel: **APPROVED**

Sample banner only when `trade_count < 20`; exact Hotel/Tango string; no trend language on book; deviations not gated by sample size.

### India: **APPROVED**

DTO SoR honored; Option C scope; constants named; carry_forward/expected_vs_actual honest null until R4/R6.
