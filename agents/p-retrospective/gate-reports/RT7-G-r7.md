# Gate RT7-G — R7 (cadence meter + nudge)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT7-1 · RT7-2 · RT7-3 APPROVED  

---

## Verdict: **PASS**

R7 complete. Next: **RT8-1** (Lima · India as-built + program close prep).

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Meter un-soon; formula + empty rules proven | **PASS** | Docstring + implementation: `journey_scores.py` retrospective cadence builder never sets `soon=True` (E1–E3 use `empty=True` only). Formula: `retrospective_cadence_raw` — d≤H→100, 1.5H→50, ≥2H→0 (`test_rt71_cadence_formula_boundaries`, `test_rt73_d2_10_formula_exact_boundaries`). Clock: only `completed_at` (`test_rt71_open_retro_does_not_move_clock`, `test_rt73_d2_12_abandoned_does_not_move_clock`). Empty: E2 grace + free E1 (`test_rt73_d2_13_*`, `test_rt73_d2_14_*`). Live meter not soon: `test_rt71_retrospective_meter_not_soon`. Profiles carry `retro_horizon_days` (trial 42 / mo 30 / annual 90 / free None). |
| 2 | Nudge + meter share one horizon field | **PASS** | Single `H = profile["retro_horizon_days"]`; `m["horizon_days"] = H`; `m["nudge"] = d > H` (same H). `test_rt73_d2_16_nudge_and_horizon_same_field` asserts equality. UI: `RetroCadenceNudge` shows only when `retro.nudge` and not empty/soon. |
| 3 | Copy sweep clean | **PASS** | `test_rt73_d2_17_copy_sweep_no_marked_down` — banned tokens absent in ProcessMeter / RetroCadenceNudge / JourneyScores / MemberHome. Live `rg` on those + retro page: **no matches**. N1 copy + **Not now** present. Surfaces: home, journey, `/app/retrospective`. Tango · Echo APPROVED RT7-2. |

### Supporting seeds

| Seed | Status |
|------|--------|
| RT7-1 cadence meter | India · Tango APPROVED |
| RT7-2 UI + nudge | Tango · Echo APPROVED |
| RT7-3 §D.2 10–17 | Alpha APPROVED — 23 pytest ×2 |

### Gate re-run (live)

```
cd server && .venv/bin/python -m pytest tests/test_journey_scores.py -q
# 23 passed

cd server && .venv/bin/python -m pytest \
  tests/test_retrospectives.py \
  tests/test_habit_plans.py \
  tests/test_retrospective_agent.py -q
# 59 passed  (adjacent; no regression)
```

Cadence-focused subset: **11 passed** (`-k "rt71 or rt73 or cadence or scores_process"`).

### Residuals (do not block)

- R8 as-built honesty + Spec/docs parity  
- Alumni create entitlement still TBD (cadence H=60 if create allowed)  
- External agent provider still local-only (R5 residual)  

---

## File path list

| Path | Role |
|------|------|
| `server/journey_scores.py` | `retro_horizon_days` profiles; cadence formula; E1–E3; nudge flag |
| `server/tests/test_journey_scores.py` | RT7-1 + RT7-3 characterization (23) |
| `web/components/ProcessMeter.tsx` | Cadence sub-meter + grade chip |
| `web/components/RetroCadenceNudge.tsx` | N1 + Not now |
| `web/components/JourneyScores.tsx` | Journey surface |
| `web/components/member-home/MemberHome.tsx` | Home rail |
| `web/app/app/retrospective/page.tsx` | Library surface |

---

## Next action

| Who | Action |
|-----|--------|
| **Lima · India** | **RT8-1** as-built fold + Spec/decision-log parity |
| **Board** | R7 → **PASS**; R8 open |
| **Delta** | **RT8-G** after RT8-1 |
