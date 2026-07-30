# Seed RT5-3 — Kilo: Agent validation tests

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha · Mike  
**Phase:** R5  

## Cases

- Empty anchors rejected  
- Concerns without what_worked rejected when data exists  
- Isolation  

## Completion criteria

- [x] Seed cases + sample gate + isolation  
- [x] pytest green ×2  
- [x] Alpha · Mike APPROVED  

## Feeds

→ RT5-G  

---

## Evidence (2026-07-29 — Kilo RT5-3)

### Suite

```
tests/test_retrospective_agent.py  14 passed  (run 1)
tests/test_retrospective_agent.py  14 passed  (run 2)
```

### Cases

| Case | Test | Result |
|------|------|--------|
| Empty anchors rejected | `test_rt53_empty_anchors_rejected` | PASS |
| Symmetry what_worked | `test_rt53_concerns_without_what_worked_when_data_exists` | PASS |
| Isolation analyze | `test_rt53_analyze_isolation_404` | PASS 404 |
| Sample gate P&L supports | `test_rt53_sample_gate_drops_outcome_corroborated_hypotheses` | PASS |
| Fail loud unconfigured | `test_analyze_endpoint_fail_loud_without_config` | PASS 503 |
| Trial off | `test_analyze_trial_off_by_default` | PASS 403 |
| UI panel markers | `test_rt53_ui_agent_panel_source` | PASS |

### Alpha · Mike: **APPROVED**

Validation + isolation + sample gate covered; no production change this seed.
