# Seed RT3-3 — Kilo: Comparison fixtures

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha  
**Phase:** R3b  
**Prerequisite:** RT3-1  

## Goal

Unit/characterization tests for comparable flags and rate math.

## Completion criteria

- [x] 21d vs 63d fixture not comparable  
- [x] Rate / book math + n floors  
- [x] pytest green ×2  
- [x] Alpha APPROVED  

## Feeds

→ RT3-G  

---

## Evidence (2026-07-29 — Kilo RT3-3)

### Suite

```
tests/test_retrospectives.py  30 passed  (run 1)
tests/test_retrospectives.py  30 passed  (run 2)
```

### Fixtures

| Test | Result |
|------|--------|
| `test_rt33_fixture_21d_vs_63d_all_activity_not_comparable` | All metrics `comparable=false`, reason `window_length_ratio_ge_3x` |
| `test_rt33_book_per_trade_math` | 250/25=10, 100/25=4; comparable on matched 30d + n≥20 |
| `test_rt33_adherence_n_floor_overrides_similar_windows` | n=10 fails adherence; activity still comparable |
| `test_rt33_rate_math_per_week_denom` | window_days + n on both sides |
| `test_rt33_weeks_label_heading` | 21→3 weeks, 63→9 weeks |
| `test_rt33_workspace_suppresses_delta_when_not_comparable` | UI markers / no crude arrow |

### Alpha: **APPROVED**

Fixtures match §7.2 rules and RT3-1 domain; no production change this seed.
