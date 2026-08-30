# A2-W4-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** A2-W4-1  
**Verdict:** **PASS**

## Evidence

Live bounced dash (`:5055`, PID 13277). Token set, len 64.

- No Bearer on `/api/marks` → **401** `ARCHIVE AUTH`, no `marks` list. Not a 200 empty tape.
- No Bearer on `/api/stats` → **401**. With Bearer → **200** `{hole: STATS STALE, api_version: 1}` (named; v2.1 nightly job never ran).
- `/` and `/api/status` stay 200 without Bearer.
- Labs `.env` token matches the dash process.

Tests: `pytest tests/test_ssr_snapshot_dash.py tests/test_ssr_archive_proxy.py tests/test_ssr_archive_marks.py tests/test_ssr_archive_read.py tests/test_ssr_archive_ladder.py` → **72 passed**.

## Fail-closed (none tripped)

`/` requiring Bearer · 401 body looking like no marks · bounce this wave · token reprint.
