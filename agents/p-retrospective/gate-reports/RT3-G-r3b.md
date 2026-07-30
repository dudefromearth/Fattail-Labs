# Gate RT3-G — R3b (normalized comparison)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT3-1…RT3-3 APPROVED  

---

## Verdict: **PASS**

R3b complete. Next: **RT4-1** (habit plans + carry-forward).

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Normalized comparison in payload | **PASS** | `_comparison` emits `version: 0.5`, `metrics[]` with `current`/`previous` `{value, window_days, n}`, `comparable`, `comparable_reason`. Label: “This window (Nw) vs previous (Mw)”. HTTP: `test_rt31_second_retro_emits_metrics`. |
| 2 | UI suppresses non-comparable deltas | **PASS** | Workspace side-by-side only; “Not comparable” badge; no crude integrity “→” / pts theater (`test_rt33_workspace_suppresses_delta_when_not_comparable`). Tango APPROVED RT3-2. |
| 3 | Tests for 3× window case | **PASS** | `test_rt31_compare_metric_21d_vs_63d_not_comparable`; `test_rt33_fixture_21d_vs_63d_all_activity_not_comparable` — all metrics `comparable=false`, reason `window_length_ratio_ge_3x`. |

### Supporting

| Seed | Status |
|------|--------|
| RT3-1 domain | India · Hotel APPROVED |
| RT3-2 UI | Tango APPROVED |
| RT3-3 fixtures | Alpha APPROVED — 30 tests ×2 green |

### Gate re-run

```
cd server && .venv/bin/python -m pytest tests/test_retrospectives.py -q
# 30 passed
```

### Residuals (do not block)

- Habit carry-forward fill (R4)  
- Expected vs actual content (R6)  
- Cadence meter (R7)  

---

## File path list

| Path | Role |
|------|------|
| `server/retrospective_domain.py` | `compare_metric`, `_comparison` |
| `web/components/retrospective/RetrospectiveWorkspace.tsx` | comparison UI |
| `Architecture/12-retrospective-report-dto.md` §4 | comparison DTO |
| `server/tests/test_retrospectives.py` | 30 characterization tests |

---

## Next action

| Who | Action |
|-----|--------|
| **Alpha** | **RT4-1** habit plans API |
| **Board** | R3b → **PASS**; R4 open |
