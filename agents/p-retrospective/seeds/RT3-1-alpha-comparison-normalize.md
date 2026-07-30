# Seed RT3-1 — Alpha: Normalized comparison

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** India · Hotel  
**Phase:** R3b  
**Prerequisite:** RT2-G PASS  

## Goal

Replace crude integrity delta with Spec §7:

- Rates + denominators  
- `comparable` flag (n floors; 3× window length rule)  
- Both window_days on each row  

## Files in scope

- `server/retrospective_domain.py` (`_comparison` and helpers)  
- tests  

## Completion criteria

- [x] Fixture 21d vs 63d → rate metrics comparable=false  
- [x] India · Hotel APPROVED  

## Feeds

→ RT3-2, RT3-3  

---

## Evidence (2026-07-29 — Alpha RT3-1)

### Shipped

| Item | Detail |
|------|--------|
| `compare_metric` | Spec §7.2 floors + window ratio ≥ 3× |
| `_build_comparison_metrics` | routine / live / learning / adherence / integrity / book per-trade |
| `_comparison` | label “This window (Nw) vs previous (Mw)”; `metrics[]` |
| Integrity delta | Only when integrity row `comparable` |
| DTO | Architecture/12 §4 updated |

### pytest

```
tests/test_retrospectives.py  24 passed
```

Includes `test_rt31_compare_metric_21d_vs_63d_not_comparable` and HTTP second-retro metrics.

### India: **APPROVED**

SoR matches Spec §7; rates not raw counts; maiden baseline unchanged.

### Hotel: **APPROVED**

Sample floors honest; 21 vs 63 not comparable; book uses per-trade rate with n floor; no false trend from thin samples.
