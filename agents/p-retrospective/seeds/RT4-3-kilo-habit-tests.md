# Seed RT4-3 — Kilo: Habit plan tests

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha  
**Phase:** R4  

## Cases

- Third active → 409  
- Maiden has no carry-forward data  
- Cross-identity 403/404  

## Completion criteria

- [x] All seed cases covered  
- [x] pytest green ×2  
- [x] Alpha APPROVED  

## Feeds

→ RT4-G  

---

## Evidence (2026-07-29 — Kilo RT4-3)

### Suite

```
tests/test_habit_plans.py  12 passed  (run 1)
tests/test_habit_plans.py  12 passed  (run 2)
```

### Cases

| Case | Test | Result |
|------|------|--------|
| Third active → 409 | `test_max_two_active_third_409`, `test_rt43_create_two_active_third_create_409` | PASS |
| Maiden no carry-forward | `test_rt43_maiden_carry_forward_null`, `test_carry_forward_on_gather` | PASS (`null`) |
| Cross-identity 404 | `test_isolation_cross_member_404` | PASS |
| Free 403 | `test_free_observer_403` | PASS |
| Empty CF message | `test_rt43_non_maiden_empty_carry_forward_message` | PASS |
| Invalid transition | `test_rt43_invalid_transition_409` | PASS |
| UI maiden gate | `test_rt43_workspace_maiden_hides_carry_forward_source` | PASS |

### Alpha: **APPROVED**

Characterization covers §18 cap, §6.0 maiden null, isolation; no production change this seed.
