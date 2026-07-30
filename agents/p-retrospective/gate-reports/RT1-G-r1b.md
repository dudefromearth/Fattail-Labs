# Gate RT1-G — R1b (schema + Observer trial entitlement)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT1-1, RT1-2 APPROVED  

---

## Verdict: **PASS**

R1b complete. Next: **RT2-1** (India · Alpha report DTO).

Delta did not modify implementation under review.

---

## Checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Habit plans table + pnl expand pref migrated | **PASS** | `migrations/047_retrospective_r1b.sql` applied (`schema_migrations.filename=047_retrospective_r1b.sql`, applied_at 2026-07-29 16:29:40). Live DB: `member_habit_plans` table count=1; `identities.retrospective_pnl_expanded` column count=1. |
| 2 | Entitlement matrix proven by tests | **PASS** | `cd server && .venv/bin/python -m pytest tests/test_retrospectives.py -q` → **11 passed** (2026-07-29 gate re-run). Covers: trial create 200, free 403, activator 200, navigator 200, expired trial 403, unit `can_create_or_gather` matrix. RT1-2 also ran twice green (flake). |
| 3 | Isolation test present | **PASS** | `test_cross_member_get_404` (A2); `test_a1_body_identity_spoof_ignored` (A1 — body identity_id ignored, row under session A). |
| 4 | No UI regressions required | **PASS** | R1b scope is schema + API entitlement only (seed RT1-1 out of scope: UI). No web/ files in RT1-1/RT1-2. |

### Supporting (Spec §10.1)

| Item | Evidence |
|------|----------|
| Formula | `retrospective_domain.can_create_or_gather` — admin OR activator+ OR active `observer-trial` |
| Create gate | `routes/retrospectives.py` `_require_create_or_gather` on create/gather/preview |
| Concurrent 409 | `test_a6_concurrent_second_open_409` |
| Reviews | RT1-1 Mike·India APPROVED; RT1-2 Alpha·Mike APPROVED |

### Residual (does not block PASS)

- Stale JWT with role `navigator` after trial expiry still passes role ladder until session re-issue (documented RT1-2 / Mike).  
- Habit plan **CRUD** is R4 (schema only in R1b).  
- Process-first UI is R2b.

---

## File path list

| Path | Role |
|------|------|
| `migrations/047_retrospective_r1b.sql` | Schema |
| `server/retrospective_domain.py` | `can_create_or_gather` / `has_active_plan_slug` |
| `server/routes/retrospectives.py` | API gates |
| `server/tests/test_retrospectives.py` | Characterization (11) |
| `agents/p-retrospective/seeds/RT1-1-…` · `RT1-2-…` | Seed evidence |
| `Architecture/00-decision-log.md` | DL-088, DL-089 |

---

## Commands (gate re-run)

```
cd server && .venv/bin/python -m pytest tests/test_retrospectives.py -q
# 11 passed
```

---

## Next action

| Who | Action |
|-----|--------|
| **Juliet / Alpha** | Open **RT2-1** (report DTO / process-first gather contract) |
| **Board** | R1b → **PASS**; R2b open |
