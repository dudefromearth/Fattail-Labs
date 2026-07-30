# Gate RT8-G — Program close (p-retrospective)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT8-1 · RT0-G…RT7-G PASS · RT5-0 GO  

---

## Verdict: **PASS**

**Program complete.** Journal Retrospective product R1b–R7 is as-built (Spec v0.6);  
documentation and decision log closed (RT8-1 · DL-116). Residuals are explicit and  
do not block close.

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | CHARTER Definition of Done items checked | **PASS** | CHARTER DoD: W0 GO, trial entitlement, process-first workspace, comparison, habits, agent (local), cadence, phase gates RT0–RT7, Lima DL-116 — all checked before this gate; RT8-G is this verdict. |
| 2 | All phase gates PASS on file | **PASS** | Live read of reports: RT0-G, RT1-G, RT2-G, RT3-G, RT4-G, RT5-G, RT6-G, RT7-G each `## Verdict: **PASS**`. RT5-0 **GO** on file. |
| 3 | Observer trial create works; free no-plan does not | **PASS** | `test_observer_trial_plan_create_ok`; `test_free_no_plan_create_403`; `test_a5_expired_trial_create_403`; habit `test_free_observer_403`. Entitlement subset **4 passed**. |
| 4 | Process-first workspace + collapsed book | **PASS** | RT2-G PASS: §6 order; book collapsed default; sample banner n&lt;20 (`test_rt24_sample_below_min_*`). Spec v0.6 surface map. |
| 5 | Comparison normalized | **PASS** | RT3-G PASS; `test_rt31_compare_metric_21d_vs_63d_not_comparable`; `test_rt33_workspace_suppresses_delta_when_not_comparable`. Comparison subset **5 passed**. |
| 6 | Habit cap 2 | **PASS** | RT4-G PASS; `test_max_two_active_third_409`; `test_rt43_create_two_active_third_create_409`. Cap subset **3 passed**. |
| 7 | Agent honest residual or shipped | **PASS** | RT5-0 GO · RT5-G PASS: local mode, fail-loud 503, trial off default, anchoring/isolation. Spec v0.6 §5–§6: external LLM **not shipped** (honest residual). Agent suite **14 passed**. |
| 8 | Cadence meter live | **PASS** | RT7-G PASS; Journey §4.1a; `retro_horizon_days` profiles; formula + E1–E3 + nudge same H. Cadence subset **10 passed**. |
| 9 | No profit-claim regressions | **PASS** | `test_rt61_adverse_what_worked_no_pnl_figure`; copy sweep `test_rt73_d2_17_*`; live `rg` banned phrases on practice UI → **no matches**. Sierra §20 boundary remains Spec-locked. |

### RT8-1 as-built

| Item | Status |
|------|--------|
| Spec **v0.6** | Present; honesty + residuals |
| Architecture 02/03/04/12 | Parity updated |
| DL-116 | Program close docs |
| India APPROVED | Seed RT8-1 |

### Gate re-run (live)

```
cd server && .venv/bin/python -m pytest \
  tests/test_retrospectives.py \
  tests/test_habit_plans.py \
  tests/test_retrospective_agent.py \
  tests/test_journey_scores.py -q
# 82 passed
```

### Residuals (do not block — Spec v0.6 §6)

- Cost-of-deviation counterfactual (deferred)  
- External agent LLM HTTP (local only)  
- Observer trial agent default-on (env flag; default off)  
- Nudge N2/N3 rotation (N1 fixed shipped)  
- Journey milestone feed from retro complete  
- Alumni create entitlement TBD  

---

## Phase gate archive

| Gate | Report | Verdict |
|------|--------|---------|
| RT0-G | `RT0-G-spec-lock.md` | PASS |
| RT1-G | `RT1-G-r1b.md` | PASS |
| RT2-G | `RT2-G-r2b.md` | PASS |
| RT3-G | `RT3-G-r3b.md` | PASS |
| RT4-G | `RT4-G-r4.md` | PASS |
| RT5-G | `RT5-G-r5.md` | PASS |
| RT6-G | `RT6-G-r6.md` | PASS |
| RT7-G | `RT7-G-r7.md` | PASS |
| **RT8-G** | **this file** | **PASS** |

---

## Next action

| Who | Action |
|-----|--------|
| **Board** | Program status → **COMPLETE** |
| **Coach** | Optional formal stamp; product ops use Spec **v0.6** as truth |
| **Future work** | Residuals only via new Spec / new board — do not re-open closed locks without Coach |
