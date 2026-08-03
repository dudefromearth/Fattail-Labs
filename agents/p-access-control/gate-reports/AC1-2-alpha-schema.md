# AC1-2 — Alpha: access_policies DDL

**Project:** p-access-control  
**Agent:** Alpha  
**Reviewer:** India (SoR)  
**Date:** 2026-08-02  
**Seed:** `seeds/AC1-2-alpha-schema.md`  
**Spec:** Access Control v0.4 §9  

---

## Verdict: **APPROVED**

---

## Migration

| Item | Result |
|------|--------|
| File | `migrations/075_access_policies.sql` |
| Tables | `access_policies`, `access_policy_audit` |
| Expanded cache column | **Absent** (correct) |
| Intent columns | `selected_plans_json`, `exact_plans_only` present |
| Charset / row format | utf8mb4_unicode_ci · DYNAMIC |

### Command evidence

```text
$ cd server && .venv/bin/python migrate.py --dry-run
would apply: 075_access_policies.sql

$ .venv/bin/python migrate.py
applied: 075_access_policies.sql

$ .venv/bin/python migrate.py --dry-run
No pending migrations.
```

### Spec §9 SoR match

| Spec column | Present |
|-------------|---------|
| target_key PK | Yes |
| enabled, mode, min_role | Yes |
| selected_plans_json, exact_plans_only | Yes |
| all_plans_json, deny_plans_json | Yes |
| plan_role_combine default `or` | Yes |
| require_signed_in | Yes |
| opens_at, closes_at, close_behavior | Yes |
| deny_ui_json, time_ui_json | Yes |
| campaign_id, grandfather_enrollments | Yes |
| label, notes, version, updated_by | Yes |
| created_at, updated_at | Yes |
| ix_access_campaign, ix_access_opens | Yes |
| access_policy_audit full | Yes |
| No any_plans / expanded cache | **Confirmed** |

### India co-sign

Schema matches Spec §9 self-contained DDL. Intent storage only — expand-at-eval invariant preserved. No engine/HTTP in this packet.

**India: APPROVED**

---

## Completion

- [x] dry-run → apply → second dry-run empty  
- [x] India SoR columns ↔ Spec §9  
- [x] Tables exist on dev DB  

## Feeds

→ AC1-3 engine
