# Gate C2 — Canonical Course Model (Delta)

**Date:** 2026-07-26  
**Verdict:** **PASS** (C1 + C2 + C3 MVP + C4 validate hook)

## Evidence

```
cd server && .venv/bin/python -m pytest tests/test_canonical_course_model.py tests/test_production_packages.py -q
# 13 passed
```

Migration:

```
applied: 028_canonical_course_model.sql
```

## Scope delivered

| Item | Status |
|------|--------|
| Spec v1.0 | `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md` |
| Architecture | `Architecture/08-canonical-course-model.md` |
| Design | `Architecture/09-canonical-course-design.md` |
| JSON Schema | `Specs/schemas/canonical-course-v1.json` |
| Pure lib | `server/course_model.py` |
| API | `/api/admin/canonical-courses/*` + package aliases |
| Tests | round-trip, profit lint, refuse published replace, auth |
| Admin UI | Export package + Import package |
| Board | placement plan structural validate via adapter |

## Residual

- Full `apply_placement` materialize still uses packages graph (dual path) — C4 complete materialize convergence deferred but validate-on-place is live.
- Directory/ZIP media bundle = C5 deferred.
- Multi-block lesson editor UI not in scope.

## Invariants checked

- [x] Fail loud on validation errors  
- [x] No published replace  
- [x] No member PII in export path (export projects content only)  
- [x] Admin-only endpoints  
