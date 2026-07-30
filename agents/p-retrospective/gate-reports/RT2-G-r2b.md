# Gate RT2-G — R2b (process-first gather + UI)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT2-1…RT2-4 APPROVED  

---

## Verdict: **PASS**

R2b complete. Next: **RT3-1** (normalized comparison).

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Process sections above book in UI | **PASS** | `RetrospectiveWorkspace.tsx`: process → integrity → deviations → what worked → (expected) → comparison → **book** → reflection → agent. Source order test `test_rt24_workspace_section_order_source`. |
| 2 | Book collapsed; sample banner when n&lt;20 | **PASS** | UI: `useState(false)` for `bookExpanded`; expand via profile pref. Gather: `sample_below_min` + Hotel banner. Tests: `test_rt24_sample_below_min_true_when_n_lt_20` (n=7), `…false_when_n_ge_20` (n=22), `test_rt24_profile_pnl_expanded_*`. |
| 3 | Deviations bounded | **PASS** | Domain `MAX_DEVIATIONS=5`; gather `_deviations` slices. Asserted `len(deviations) <= 5` in RT2-2/RT2-4 tests. |
| 4 | Tests green | **PASS** | Gate re-run: `pytest tests/test_retrospectives.py -q` → **18 passed**. RT2-4 also ran twice green. |

### Supporting

| Seed | Status |
|------|--------|
| RT2-1 DTO | Charlie · India APPROVED — `Architecture/12-retrospective-report-dto.md` |
| RT2-2 gather v0.5 | India · Hotel APPROVED |
| RT2-3 workspace | Echo · Tango APPROVED |
| RT2-4 Kilo | Alpha · Charlie APPROVED — 18 tests |

### Residuals (do not block PASS)

- Comparison still crude (RT3b normalizes rates + `comparable`).  
- `carry_forward` / `expected_vs_actual` payload fill remain R4 / R6.  
- Agent panel placeholder only (R5).  

---

## File path list

| Path | Role |
|------|------|
| `Architecture/12-retrospective-report-dto.md` | DTO SoR |
| `server/retrospective_domain.py` | gather v0.5 |
| `web/components/retrospective/RetrospectiveWorkspace.tsx` | §6 UI |
| `server/routes/member.py` | `retrospective_pnl_expanded` |
| `server/tests/test_retrospectives.py` | 18 characterization tests |

---

## Commands (gate re-run)

```
cd server && .venv/bin/python -m pytest tests/test_retrospectives.py -q
# 18 passed
```

---

## Next action

| Who | Action |
|-----|--------|
| **Alpha** | **RT3-1** — normalized comparison |
| **Board** | R2b → **PASS**; R3b open |
