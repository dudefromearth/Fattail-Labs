# Seed RT1-1 — Alpha + Mike: Schema + Observer trial entitlement

**Project:** p-retrospective  
**Primary:** Alpha  
**Reviewers:** Mike · India  
**Phase:** R1b  
**Prerequisite:** RT0-0  

## Goal

1. Migrations for `member_habit_plans` (+ required columns) and  
   `identities.retrospective_pnl_expanded` (default 0).  
2. Change retrospective create/gather entitlement to allow:
   - active plan slug **`observer-trial`**, OR  
   - role **activator+** (legacy Activator + Navigator), OR  
   - **administrator**  
   Free account with **no** trial plan → **403**.  
3. Resolve storage identity for trial (plan check, not role-only).  

## Files in scope

- `migrations/047_*.sql` (or next free number)  
- `server/routes/retrospectives.py`  
- `server/routes/trade_log/common.py` only if sharing a helper (prefer shared `_require_practice_member`)  
- Possibly `server/identity.py` helper for plan slug  

## Out of scope

- UI process-first reorder (R2b)  
- Agent  
- Cadence meter  

## Invariants

1. Family B isolation unchanged.  
2. Fail loud 403 with clear detail.  
3. Activator still works (legacy).  
4. Concurrent open still 409.  

## Collaboration

1. Alpha implements.  
2. Mike: attack plan spoofing / role navigator without trial plan.  
3. India: plan vs role derivation consistent.  

## Completion criteria

- [x] Migration applied  
- [x] pytest: trial create OK; free 403; activator OK  
- [x] Mike APPROVED · India APPROVED  

## Feeds

→ RT1-2, RT1-G  

---

## Evidence (2026-07-29 — Alpha RT1-1)

### Deliverables

| Item | Path |
|------|------|
| Migration | `migrations/047_retrospective_r1b.sql` — applied |
| Entitlement | `retrospective_domain.can_create_or_gather` + `has_active_plan_slug` |
| Routes | `server/routes/retrospectives.py` — create/gather/preview gate; list/get isolation-only |
| Tests | `server/tests/test_retrospectives.py` — **6 passed** |

### Formula (shipped)

```
can_create_or_gather =
    administrator
    OR role_at_least(activator)
    OR has_active_membership(observer-trial)   # live memberships + plans.slug
```

### pytest evidence

```
applied: 047_retrospective_r1b.sql
tests/test_retrospectives.py ......  6 passed
```

| Test | Proves |
|------|--------|
| `test_observer_trial_plan_create_ok` | Plan path with **observer** session role (not role-only) |
| `test_free_no_plan_create_403` | Free no-plan POST + preview **403**; list empty **200** |
| `test_activator_legacy_create_ok` | Legacy Activator |
| `test_cross_member_get_404` | Isolation A2 |
| `test_preview_create_gather_complete` | Happy path + 409 concurrent |
| `test_schema_habit_plans_and_pnl_pref_exist` | Migration objects |

### Mike review: **APPROVED**

| Attack | Result |
|--------|--------|
| Free no plan create | 403 fail loud |
| Trial via plan slug, not grants_role accident | Covered (observer cookie + trial plan) |
| Cross-member GET | 404 |
| Body identity_id | Still ignored (session only) |
| Concurrent open | 409 preserved |

### India review: **APPROVED**

| Check | Result |
|-------|--------|
| Matches Spec §10.1 | Yes |
| Plan vs role consistent with Journey E1 | Same cannot-create predicate |
| Schema traces Spec §9.2 / §9.3 | Yes |
| Product boundary | No MSC |
