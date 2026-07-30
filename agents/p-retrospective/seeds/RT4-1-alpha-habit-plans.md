# Seed RT4-1 — Alpha: Habit plans API + cap

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** Mike · India  
**Phase:** R4  
**Prerequisite:** RT3-G PASS  

## Goal

Implement `member_habit_plans` CRUD (or nested under retro):

- `observable_signal` required  
- States: proposed → active → kept|lapsed|retired  
- Max **2** active per identity → **409**  
- Isolation by identity_id  

## Files in scope

- migrations if not fully in RT1-1  
- `server/routes/retrospectives.py` or `routes/habit_plans.py`  
- tests  

## Completion criteria

- [x] Cap enforced under concurrent activate  
- [x] Mike · India APPROVED  

## Feeds

→ RT4-2, RT4-3  

---

## Evidence (2026-07-29 — Alpha RT4-1)

### Shipped

| Item | Path |
|------|------|
| Routes | `server/routes/habit_plans.py` — GET/POST/PATCH/DELETE `/api/me/habit-plans` |
| Domain | `retrospective_domain` — cap, serialize, transitions, `build_carry_forward` |
| Gather | `carry_forward` filled (null maiden; plans/empty_message otherwise) |
| Schema | migration 047 (already applied) |

### API

- Create: `observable_signal` required enum; optional create-as-active with cap  
- Activate: `FOR UPDATE` + count → **409** if already 2 active  
- States: proposed → active → kept|partial|lapsed|retired  
- Isolation: 404 cross-member  
- Entitlement: same as retro create (`can_create_or_gather`)  

### pytest

```
tests/test_habit_plans.py + test_retrospectives.py  36 passed
```

### Mike: **APPROVED**

Isolation + plan-scoped entitlement; cap fail-loud 409; body identity never trusted.

### India: **APPROVED**

Matches Spec §9.2 / §18; carry_forward SoR for §6.0; no MSC boundary issues.
