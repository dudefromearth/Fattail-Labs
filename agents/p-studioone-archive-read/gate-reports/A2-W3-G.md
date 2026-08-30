# A2-W3-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** A2-W3-1  
**Verdict:** **PASS**

## Evidence

| Check | Result |
|-------|--------|
| Route | `GET /api/me/options-lab/archive/marks` session-only (`require_session`). Observer ok. Admin stats still admin-only. |
| 501 | Absent env → 501 `ARCHIVE NOT CONFIGURED`. |
| Unreachable | StudioOne down → 200 `STUDIOONE UNREACHABLE`, not an empty native tape. |
| 401 | Upstream 401 → `ARCHIVE AUTH`, not `marks: []`. |
| Provenance | Pass-through keeps `source` beside `mid`. No StudioOne URL in body. |
| Unbounced dash | Upstream 404 `not found` stays **404**, not 200 empty. |
| TM callers | No `archive/marks` under `web/lib/options-lab`. |
| Tests | `pytest tests/test_ssr_archive_proxy.py` → **20 passed**. |

## Fail-closed (none tripped)

TM file calling the new route · dash bounce · `TODAY_LIVE` lift · tap write.

## Unblocks

**A2 W4** Bearer review. **W5** still Coach word. Live dash HTTP 50/55 still wait on bounce.
