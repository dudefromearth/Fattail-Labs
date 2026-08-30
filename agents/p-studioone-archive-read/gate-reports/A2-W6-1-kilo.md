# A2-W6-1 Kilo — AT-SOAR-50…59

**Agent:** Kilo  
**Date:** 2026-08-29  
**Depends:** W5-G PASS  
**Law:** A2_1 acceptance table · plan v1.0 §6

Live host `http://studioone.local:5055`. Bearer required (see W4). No second bounce. Tap PID **21649** throughout. `phase=weekend`, `wake=2026-08-30T20:15:00-04:00`.

| ID | Result | Evidence |
|----|--------|----------|
| **50** | **PASS** live | `GET /api/marks?day=2026-08-27&symbols=VIX&t=2026-08-27T01:16:03-04:00` HTTP 200. mid **17.855**, `source=massive_proxy_v1`, `hole=null`, captured_at `2026-08-27T01:16:02.842096-04:00`. Not a fixture. |
| **51** | **PASS** live | 08-27 `marks/*.jsonl` **21 files** including `session.jsonl`. Same 21 names served on `/api/marks` with no symbols filter. No `MARKS NONE`. SESSION at that `t` is named `MARK GAP` (retrievable). |
| **52** | **PASS** fixture | `test_named_gap_never_locf`: 15 s GAP floor → `MARK GAP`, mid null, never last known. |
| **53** | **PASS** fixture | `test_generation_vix_null_is_not_consulted`: envelope `vix: null` still mid 17.855 from tape. |
| **54** | **PASS** fixture | same test: key absent is not a hole. |
| **55** | **PASS** live | 08-14 SPY coverage/index/fetch HTTP 200, count **129**, hole null. |
| **56** | **PASS** with A2-2 bound | Enumerate disk. Marks tapes retrievable. COUNTS-identified chain books with snaps index 200 (e.g. 08-27 SPX count 36107). 08-14 flat SPY 129. **2026-08-17** nested 18 dirs × 2 leftover snaps, no COUNTS → index HTTP **404** `hole=UNKNOWN` **as A2-2 wrote**. Did not expand the carve-out. COUNTS keys with zero snaps (`NOT TODAY`, weekends) are not disk data. Today skipped (`TODAY_LIVE`). |
| **57** | **PASS** live | 08-27 VIX coverage: `books=[]`, marks `kind=tape` count **14622**. Not `count=0 / expiration=UNKNOWN / status=none` as a book. |
| **58** | **PASS** live | Batch 21 names; `source` / `label` beside `mid`. VIX stays `massive_proxy_v1`. |
| **59** | **PASS** live + fixture | 08-27 flags `VIX NOT NATIVE`, `VIX1D NOT NATIVE`. Synthetic `massive_index_v1` tape does not flag. |
| **45** | **not scored** | Idle weekend tap. Monday open. |

Pytest: **72 passed** (marks + dash + proxy + ladder + read).

## Nightly stats

`GET /api/stats` with Bearer: HTTP **200**, `{hole: STATS STALE, api_version: 1}`. Named. v2.1 W6 never ran (that program still blocked on its own W5-G / AT-SOAR-45). A2 NX-V2.1 — this packet did not backfill `STATS.json`.
