# Seed RT1-2 — Kilo: Entitlement + isolation tests

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha · Mike  
**Phase:** R1b  
**Prerequisite:** RT1-1  

## Goal

Characterization tests for entitlement matrix and isolation (useful invariants only).

## Cases

1. Observer trial plan → create 200  
2. Free observer no plan → 403  
3. Activator override → 200 (legacy)  
4. Identity A cannot GET B’s retro id  
5. Concurrent second open → 409  

## Files in scope

- `server/tests/test_retrospectives.py`  

## Completion criteria

- [x] pytest green with evidence  
- [x] Alpha · Mike APPROVED  

## Feeds

→ RT1-G  

---

## Evidence (2026-07-29 — Kilo RT1-2)

### Suite

```
tests/test_retrospectives.py  11 passed  (run 1)
tests/test_retrospectives.py  11 passed  (run 2 — flake check identical)
```

### Seed matrix

| # | Case | Test | Result |
|---|------|------|--------|
| 1 | Observer trial → create 200 | `test_observer_trial_plan_create_ok` | PASS |
| 2 | Free no plan → 403 | `test_free_no_plan_create_403` | PASS |
| 3 | Activator → 200 | `test_activator_legacy_create_ok` | PASS |
| 4 | A cannot GET B | `test_cross_member_get_404` | PASS |
| 5 | Concurrent open → 409 | `test_a6_concurrent_second_open_409` (+ happy-path 409) | PASS |

### Attack notes (Spec §10.1 A1–A6)

| # | Case | Test | Result |
|---|------|------|--------|
| A1 | Body `identity_id` spoof | `test_a1_body_identity_spoof_ignored` | PASS — row owned by session A |
| A2 | Cross-member GET | `test_cross_member_get_404` | PASS 404 |
| A3 | Free create | `test_free_no_plan_create_403` | PASS 403 |
| A5 | Expired trial live check | `test_a5_expired_trial_create_403` | PASS 403 |
| A6 | Concurrent open | `test_a6_concurrent_second_open_409` | PASS 409 |

Also: `test_can_create_or_gather_unit_matrix`, `test_navigator_role_create_ok`, schema presence.

### Residual (documented, not FAIL)

- **A4** bad JWT → covered by global session tests (auth module); not duplicated here.  
- **A5 residual:** stale JWT with role `navigator` still passes `role_at_least` after trial expiry until session re-issue — preferred fix is membership-change re-issue (Mike §10.1), not plan-slug alone. Live trial membership check is proven for observer-role sessions.  
- **A7/A8** no admin retro route / agent not shipped — N/A this phase.

### Alpha review: **APPROVED**

Domain helper + HTTP paths covered; no production change required this seed.

### Mike review: **APPROVED**

Isolation A1/A2, free 403, expired trial live membership, concurrent 409 — fail-loud. Residual on stale navigator JWT accepted as session lifecycle.
