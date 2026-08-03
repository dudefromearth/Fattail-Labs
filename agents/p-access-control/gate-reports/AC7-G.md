# AC7-G — Campaigns + feature_gates

**Date:** 2026-08-02  
**Verdict:** **PASS** (P2 partial)

| Item | Status |
|------|--------|
| Bulk policy API | POST `/api/admin/access/policies/bulk` |
| Campaign fail-closed default | engine type default |
| feature_gates full merge | **Deferred** — dual-read later; gates admin unchanged |
| Deploy notes | `infra/deploy.md` appendix or DL |

feature_gates → surface policies cutover scheduled as residual (not blocking MVP).
