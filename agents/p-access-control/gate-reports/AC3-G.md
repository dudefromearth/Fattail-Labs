# AC3-G — Lessons dual-write + access payload

**Date:** 2026-08-02  
**Verdict:** **PASS** (with residual)

| Deliverable | Status |
|-------------|--------|
| Lesson evaluate via policy preferred | `routes/lessons.py` |
| `access` embedded on lesson response | Yes |
| Dual-write free_preview | `dual_write.py` + admin lesson PUT |
| As-built free_preview / membership default | TargetMeta path |

**Residual:** Full matrix vs seeded course blocked if catalog seed missing in env (`first-stop-the-bleeding` 404 on this host). Engine + admin characterization green; re-run `test_lesson_gating.py` when seed present.

**Unlocks AC5 (MVP path).**
