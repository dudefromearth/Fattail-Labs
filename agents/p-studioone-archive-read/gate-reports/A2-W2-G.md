# A2-W2-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** A2-W2-1  
**Verdict:** **PASS** (reader). Live **dash HTTP** still 404 on `/api/marks` — bounce is Coach W5-GO.

## What W2 owns

`server/market_data/ssr_archive_read.py` + `server/tests/test_ssr_archive_marks.py`. Not the dash process. Not TMOS `TODAY_LIVE`. Not a bounce.

Local: `pytest tests/test_ssr_archive_marks.py tests/test_ssr_archive_read.py tests/test_ssr_archive_ladder.py` → **39 passed**.

Live store (StudioOne disk, new reader, no dash restart):

### AT-SOAR-50 PASS (live store)

`day_marks(2026-08-27, VIX, t=01:16:03-04:00)`:

- mid **17.855** (matches tape first print)
- `source=massive_proxy_v1` beside mid, not inside it
- coverage: VIX is **`kind=tape` count=14622**, **not** a book, **not** `count=0 / UNKNOWN / none`
- `flags`: **`VIX NOT NATIVE`**, **`VIX1D NOT NATIVE`**

At 14:32:06-04:00 (the W1 instant): nearest mid **17.545**, same proxy source, hole null. Batch included VIX + VIX1D + SPY in **one** call.

### AT-SOAR-55 PASS (live store)

2026-08-14 SPY, flat layout, no COUNTS, no `chain/SPY/`:

| Call | Result |
|------|--------|
| `day_index` | hole **null**, **count=129** |
| `day_fetch` level 0 | hole **null**, **count_on_disk=129**, returned 65 (level-0 dyadic) |
| coverage | SPY `rth_complete` **count=129** — and retrieve no longer 404s |

The W1 failure was coverage advertising `rth_complete` while fetch 404'd. Fetch is **200-shaped** (hole null). Nested COUNTS-missing still UNKNOWN (test).

### AT-SOAR-59

08-27 flags `VIX NOT NATIVE`. 08-29 native tape (`massive_index_v1` from 00:38:08) is **not** flagged. Source field, not the number.

## Live dash (unbounced)

`GET http://192.168.1.111:5055/api/marks?day=2026-08-27&…` still **HTTP 404 `not found`**. Process started 2026-08-27 13:11. **No bounce this packet.**

## Fail-closed (none tripped)

LOCF · wait on `generation.vix` · tape as absent book (reader) · 08-14 still UNKNOWN (reader) · TMOS W1 in this diff · dash bounce · `TODAY_LIVE` lift.

## Unblocks

**A2 W3** Labs proxy. **TMOS W1** may start — module lock released. Dash HTTP 50/55 wait on **W5-GO**.
