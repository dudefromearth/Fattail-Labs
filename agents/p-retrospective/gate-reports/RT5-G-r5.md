# Gate RT5-G — R5 (agent analyze)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT5-0 **GO** · RT5-1…RT5-3 APPROVED  

---

## Verdict: **PASS**

R5 complete (Coach GO path). Next: **RT6-1** (what worked + expected vs actual) or merge residual into R6/R7 per board.

Delta did not modify implementation under review.

---

## Checklist (GO path)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Coach GO | **PASS** | `gate-reports/RT5-0-agent-go.md`; DL-104 |
| 2 | Analyze endpoint + fail loud | **PASS** | `POST …/analyze`; unconfigured → **503** (`test_analyze_endpoint_fail_loud_without_config`) |
| 3 | Validation (anchors, symmetry, sample gate) | **PASS** | `test_rt53_empty_anchors_rejected`; symmetry; sample-gate drops P&L supports |
| 4 | Isolation | **PASS** | Cross-member analyze → **404** |
| 5 | Trial agent off default | **PASS** | **403** without `LABS_RETRO_AGENT_TRIAL` |
| 6 | UI human gate | **PASS** | Run analysis; Accept/Reject plans; Tango APPROVED RT5-2 |
| 7 | Tests green | **PASS** | Gate re-run: agent + habit + retro **56 passed** |

### Seeds

| Seed | Status |
|------|--------|
| RT5-0 | **GO** |
| RT5-1 | Mike · India · Hotel · Tango APPROVED |
| RT5-2 | Tango APPROVED |
| RT5-3 | Alpha · Mike APPROVED — 14 tests ×2 |

### Gate re-run

```
cd server && .venv/bin/python -m pytest \
  tests/test_retrospective_agent.py \
  tests/test_habit_plans.py \
  tests/test_retrospectives.py -q
# 56 passed
```

### Config (ops)

```
LABS_RETRO_AGENT_MODE=local   # required to enable
LABS_RETRO_AGENT_TRIAL=1      # optional; default off
```

### Residuals (do not block)

- External LLM provider (HTTP) not shipped — local deterministic analyzer only  
- R6 expected vs actual content fill  
- R7 cadence meter  

---

## File path list

| Path | Role |
|------|------|
| `server/retrospective_agent.py` | validate + local analyze |
| `server/routes/retrospectives.py` | `POST …/analyze` |
| `web/…/RetrospectiveWorkspace.tsx` | agent panel |
| `server/tests/test_retrospective_agent.py` | 14 characterization tests |

---

## Next action

| Who | Action |
|-----|--------|
| **Alpha** | **RT6-1** what worked / expected vs actual (if not already sufficient) |
| **Board** | R5 → **PASS**; R6 open |
