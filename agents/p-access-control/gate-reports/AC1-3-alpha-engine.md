# AC1-3 — Alpha: evaluate engine

**Project:** p-access-control  
**Agent:** Alpha  
**Reviewers:** India · Mike  
**Date:** 2026-08-02  
**Seed:** `seeds/AC1-3-alpha-engine.md`  
**Spec:** §§4.3.1, 4.3.2, 5, 8.3  

---

## Verdict: **APPROVED**

---

## Deliverables

| Module | Role |
|--------|------|
| `access_control/types.py` | ViewerContext, PreviewAs, AccessPolicy, AccessDecision, TargetMeta |
| `access_control/policy.py` | `effective_plans`, `load_policy`, `load_policies_many`, row map |
| `access_control/evaluate.py` | `evaluate`, `evaluate_many`, `apply_preview_as`, `default_for_target_type` |
| `access_control/viewer.py` | `viewer_from_parts`, `viewer_from_claims`, plan/enrollment load |
| `access_control/require.py` | `require_access` (resource hook; **no** public route) |

### API shape (Spec §8.3)

```python
expand_plans(selected) -> frozenset
effective_plans(policy) -> frozenset   # expand at evaluate only
evaluate(target_key, viewer, *, policy=None, meta=None) -> AccessDecision
evaluate_many(keys, viewer, *, policies=None, meta_by_key=None) -> dict
require_access(request, target_key, *, capability="read"|"write"|"export")
```

---

## Invariants verified (smoke matrix)

| Case | Result |
|------|--------|
| selected observer-trial, exact false, plan navigator | ALLOW |
| exact true, navigator | DENY |
| alumni not in expand_plans | OK |
| min_role observer admits alumni | ALLOW |
| deny_plans + app:trade-log | read_only_floor read/export |
| grandfather course enrollment | ALLOW grandfathered |
| deny_plans enrolled | DENY (no grandfather) |
| evaluate_many 40 keys | 40 decisions |
| admin + preview_as | no full admin bypass |
| main.app routes | no `/api/access/decision` public |

```text
$ pytest tests/test_access_control_keys.py -q
13 passed
$ python smoke matrix → ALL ENGINE CHECKS PASSED
$ import main → main OK
```

---

## India algorithm walkthrough

1. Admin bypass only when `not preview_as` — **match Spec §5**  
2. Expand only via `effective_plans` inside evaluate — **match**  
3. Blocklist clears grandfather; data floor still applies — **match**  
4. Type defaults: campaign fail-closed; lesson free_preview/member_content via TargetMeta — **match**  
5. No public decision surface in package — **match**  

**India: APPROVED**

---

## Mike authz boundary

1. `require_access` is import-for-handlers only; no router registration — **OK**  
2. Preview cookie parse fail-closed; enrollments default empty — **OK**  
3. Write capability denied under read_only_floor → 403 — **OK**  
4. hide → 404 — **OK**  

**Mike: APPROVED** (no public probe introduced)

---

## Out of scope (correct)

Admin CRUD · free_preview dual-write · lesson route wire (AC3) · frontend

## Feeds

→ AC1-4 Kilo unit suite → AC1-G
