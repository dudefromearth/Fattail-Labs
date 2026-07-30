# Gate RT4-G — R4 (habit plans + carry-forward)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT4-1…RT4-3 APPROVED  

---

## Verdict: **PASS**

R4 complete. Next: **RT5-0** (Coach GO/DEFER agent analyze).

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Cap 2 active proven | **PASS** | `MAX_ACTIVE_HABIT_PLANS=2`; `test_max_two_active_third_409`, `test_rt43_create_two_active_third_create_409` → **409**. Routes use `FOR UPDATE` + count. |
| 2 | Carry-forward first in UI when applicable | **PASS** | Workspace: `{!isMaiden && (` carry-forward before process (`testId="retro-carry-forward"` line ~397 before process ~500). Kept/Partial/Lapsed chips. Source order test includes CF first. |
| 3 | Isolation OK | **PASS** | `test_isolation_cross_member_404`; free observer create **403** (`test_free_observer_403`). |

### Supporting

| Seed | Status |
|------|--------|
| RT4-1 API | Mike · India APPROVED |
| RT4-2 UI | Tango · Echo APPROVED |
| RT4-3 tests | Alpha APPROVED — 12 habit tests ×2 |

### Gate re-run

```
cd server && .venv/bin/python -m pytest tests/test_habit_plans.py tests/test_retrospectives.py -q
# 42 passed
```

### Residuals (do not block)

- Agent analyze (R5 — Coach RT5-0 GO/DEFER)  
- Expected vs actual content fill (R6)  
- Cadence meter (R7)  
- Signal this/prior window numeric rates on carry-forward still optional nulls  

---

## File path list

| Path | Role |
|------|------|
| `server/routes/habit_plans.py` | CRUD API |
| `server/retrospective_domain.py` | cap, carry_forward |
| `web/components/retrospective/RetrospectiveWorkspace.tsx` | CF first + assessment |
| `server/tests/test_habit_plans.py` | characterization |

---

## Next action

| Who | Action |
|-----|--------|
| **Coach** | **RT5-0** GO or DEFER agent analyze |
| **Board** | R4 → **PASS**; R5 pending Coach |
