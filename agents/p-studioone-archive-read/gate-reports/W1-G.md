# W1-G — Delta

**Project:** p-studioone-archive-read  
**Agent:** Delta  
**Phase:** W1-G  
**Date:** 2026-08-27  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 W1-G  
**Depends:** W1-1

---

## Verdict: **PASS**

Unblocks **W2**. Does not unblock W5 (Coach W5-GO). Does not ship product code.

---

## Evidence

| Gate rule | Evidence |
|-----------|----------|
| Drift table exists | `agents/p-studioone-archive-read/gate-reports/W1-1-india-prior-art.md` |
| Path+line quotes | Reader `ssr_archive_read.py` 91 (name-sort), 108–117 (`json.loads`), 270–296 (local-date `t`), 528–529 (omitted expiration → WRONG BOOK), 647–651 / 701–705 (required `expiration`). Proxy `ssr_archive.py` 17 (tool-gate), 28–36 (absent URL), 68 (`no-store`). Dash 4 (“gold”), 317 / 342–349 (calls without expiration), 669–689 (workspace handlers). Store: `ssr_live_capture.py` 207–211 FatTail2TB. |
| Keep vs replace stated | Replace reader/proxy/handlers. Keep store path, glob, hash format, Friday-flat, COUNTS/CHECKLIST/PROVENANCE, “browser never calls StudioOne.” |
| **No implementation diff this wave** | W1-1 and this report only. `git status --short` on product files is **pre-existing** untracked/modified prior art (`?? ssr_archive_read.py`, `?? routes/ssr_archive.py`, `M ssr_snapshot_dash.py`, `M main.py`). W1 did not add, delete, or patch those files. |
| Prior-art tests | `pytest` 3 failed / 8 passed — `day_index`/`day_fetch` require `expiration` the tests do not pass. Characterization, not a fail of this gate. |

## Fail-closed (not triggered)

- No name-sorted ladder **shipped** (prior art exists; W2 must not keep it).  
- No dash bounce.  
- No admin-tree edits.  
- No W5.

## Notes for W2 (Coach, 2026-08-27 — not optional)

- Order by reconstructed `t`, never by filename.  
- No local-date candidate test.  
- Envelope open = named two-in-window branch only.  
- W5-G needs AT-SOAR-45 cadence evidence, not process-up.
