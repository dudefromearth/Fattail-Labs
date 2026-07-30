# Seed RT2-4 — Kilo: Report shape tests

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha · Charlie  
**Phase:** R2b  
**Prerequisite:** RT2-2  

## Goal

Characterization: gather response contains process + book sample fields;  
trade_count &lt; 20 sets sample_below_min true.

## Completion criteria

- [x] pytest green  
- [x] Alpha · Charlie APPROVED  

## Feeds

→ RT2-G  

---

## Evidence (2026-07-29 — Kilo RT2-4)

### Suite

```
tests/test_retrospectives.py  18 passed  (run 1)
tests/test_retrospectives.py  18 passed  (run 2 — flake check)
```

### RT2-4 cases

| Test | Proves |
|------|--------|
| `test_rt24_sample_below_min_true_when_n_lt_20` | 7 trades → `sample_below_min` true + Hotel banner |
| `test_rt24_sample_below_min_false_when_n_ge_20` | 22 trades → false, banner null |
| `test_rt24_report_dto_required_keys` | Architecture/12 keys on report/meta/process/book |
| `test_rt24_profile_pnl_expanded_default_and_patch` | Pref default false; PATCH persists |
| `test_rt24_workspace_section_order_source` | Charlie §6 section order + collapsed default |

### Alpha: **APPROVED**

Gather contract + sample gate covered with seeded trades; no domain change required.

### Charlie: **APPROVED**

Workspace source order markers + expand copy asserted; pref API covered for UI.
