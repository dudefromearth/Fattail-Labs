# A2-W-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** W4-G · W5-G · W6-G · W7 · W8  
**Verdict:** **PASS** with **one carry: AT-SOAR-45** (Monday open). W-G does not wait on it.

## Evidence

- Marks route live. AT-SOAR-50/55 live. Bearer 401 ≠ empty tape.
- **51 full set:** union of `marks/*.jsonl` across the store is **exactly 21 names**, including `session.jsonl`. 08-27 is that set. No extra tape in `marks/`. `status/ticks.jsonl` is collector status, not a marks tape, not on `/api/marks`.
- **Nightly stats first run:** full backfill, 14 days, `last_run_status=ok`, `/api/stats` HTTP 200 `hole=null`. SPX medians ~2.26 s; `within_dl609` ≈ 1.0 on full sessions; `within_dl400` ≈ 0.002. **DL-400 [3, 5] is the leftover; DL-609 [2, 5] is the law.**
- Tap PID 21649 / dash 13277 unchanged. No bounce.
- Tests: `test_ssr_archive_stats.py` + archive suite, 57 passed in the stats wave.

## Fail-closed (none tripped)

LOCF · wait on `generation.vix` · tape as absent book · 08-14 UNKNOWN · TM code in this GO · tap write · bounce without GO · disk rewrite · 50/55 fixture · proxy VIX as native.

## Carry

**AT-SOAR-45** — Monday open. Idle weekend is not 45.

## Unblocks

Batch B TMOS W1–W3. A2 strip closed.
