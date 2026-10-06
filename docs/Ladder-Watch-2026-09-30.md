# Ladder watch — 2026-09-30 09:30–10:00 ET

Read-only. StudioOne dash log `ssr-snapshot-dash.out.log`, sym_feed log, and a Redis read of the key just served. No process was restarted. Capture 73887, chain_feed 91469, band tap 74138, and dash 85136 were the same pids at 10:01. sym_feed stayed pid 4065, `--interval 1`.

The full-book job is not part of a clean parallel run. It wrote from 09:15 to 09:19, then the SPX worker died on a Massive DNS failure, and launchd left it down. It was still down at 10:01. Book view, `LABS_CHAIN_FEED_BOOKS=on`, and the swap stay untriggered.

## How the numbers were taken

Stale fraction is every `:5055` `ladder_result` with status 200 and `served` hot or last. The dash marks every last-key read stale, and a hot read stale only when `fetched_at_unix` is older than 60 seconds. Hot stale share is 0 in every bucket, so the stale fraction equals the last-key share.

Age is the result line's timestamp minus `fetched_at_unix` on the Redis key, read when the line was tailed. The tail started during the 09:35 bucket, so 09:30 has no age sample and 09:35 is a short one. A negative age means the key was rewritten before the read; those are counted aside and left out of the percentiles. A missing hot key is counted as `nokey` and left out the same way. Percentiles are nearest rank, `ceil(p × n) − 1`.

Spot cadence is the gap between successive `sym SPX` and `sym XSP` lines as they arrived. The same tail start applies.

## Five-minute buckets

| Bucket | Served | Hot | Last | Miss | Stale share | Hot stale share |
|---|---:|---:|---:|---:|---:|---:|
| 09:30 | 12,924 | 4,869 | 8,055 | 1,207 | 0.623 | 0 |
| 09:35 | 15,542 | 5,987 | 9,555 | 1,342 | 0.615 | 0 |
| 09:40 | 15,259 | 7,157 | 8,102 | 1,465 | 0.531 | 0 |
| 09:45 | 23,522 | 10,557 | 12,965 | 1,423 | 0.551 | 0 |
| 09:50 | 22,804 | 10,542 | 12,262 | 1,441 | 0.538 | 0 |
| 09:55 | 20,944 | 10,395 | 10,549 | 1,458 | 0.504 | 0 |

### Served-ladder age, seconds

| Bucket | Hot n | Hot median | Hot p90 | Hot max | Last n | Last median | Last p90 | Last max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 09:30 | 0 | | | | 0 | | | |
| 09:35 | 537 | 2.647 | 5.210 | 5.847 | 595 | 10.346 | 34,793.729 | 49,000.412 |
| 09:40 | 6,386 | 2.744 | 5.157 | 5.955 | 7,463 | 9.769 | 34,907.015 | 49,299.402 |
| 09:45 | 9,338 | 2.491 | 5.103 | 5.936 | 11,797 | 10.183 | 13.992 | 49,599.368 |
| 09:50 | 9,079 | 2.689 | 5.136 | 5.935 | 11,149 | 9.871 | 13.584 | 49,901.354 |
| 09:55 | 9,302 | 2.481 | 5.010 | 5.920 | 9,697 | 9.944 | 14.051 | 50,201.382 |

Hot age stays inside the 6-second hot-key TTL. From 09:45 the last-key 90th percentile is about 14 seconds. The maximum stays about 14 hours, inside the 18-hour last-key TTL. In the 09:40 bucket the 90th percentile itself is about 9.7 hours, on a full sample. The 09:35 last p90 is the same shape on the short sample only.

### Spot frame cadence, seconds

| Bucket | SPX frames | SPX median | SPX p90 | SPX max | XSP frames | XSP median | XSP p90 | XSP max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 09:30 | 0 | | | | 0 | | | |
| 09:35 | 8 | 2.646 | 3.089 | 3.089 | 8 | 2.836 | 3.208 | 3.208 |
| 09:40 | 101 | 2.843 | 3.486 | 4.942 | 101 | 2.821 | 3.606 | 5.218 |
| 09:45 | 95 | 3.096 | 3.748 | 5.303 | 95 | 3.050 | 3.839 | 5.012 |
| 09:50 | 96 | 3.107 | 3.482 | 4.016 | 96 | 3.086 | 3.539 | 4.039 |
| 09:55 | 103 | 2.857 | 3.354 | 4.809 | 102 | 2.841 | 3.422 | 4.831 |

SPX and XSP frames are about 3 seconds apart. sym_feed is `--interval 1`, and that sleep runs after the universe pass, so the frame gap is the pass plus one second.

## Regular-hours misses, same window

Coach asked whether the ~7% misses are feed interest for DTE ≥ 6 and unserved wings. The morning census cannot decide that. It ended at 09:26 ET and contains no regular-hours minute.

Every `ladder_result` from 09:30:00 through 09:59:59 ET: 119,311 lines. Hot 49,504, last 61,472, miss 8,335, book 0. Miss share 0.0699. `served=miss` is no hot key and no last key. The watch's 8,336 misses over 119,331 lines is the same window; this count is the log read straight through from offset 800000000.

The query is not on the result line. A miss is bucketed when a `GET /api/ladder` line with the same status follows within six lines. That paired 7,659 of the 8,335 misses. The other 676 were not given a symbol. If every one of them were DTE ≥ 6, that class would still be under 9% of the misses.

| Calendar DTE | Paired misses |
|---|---:|
| below 0 | 7,618 |
| 0 through 5 | 4 |
| 6 or more | 37 |

Trading DTE of 6 or more is 33 of the paired misses. Requested wings are 25 / 10 / 50 / 100, and none clamp outside 10, 25, or 50. Symbols: XSP 7,632, SPX 27. The ten largest buckets are XSP at DTE −2, −5, −6, and −8, wings 10, 25, 50, and 100, each a few hundred.

The 7% is expired XSP names. It is not the far book, and it is not an unserved wing. The hop was not changed. Feed interest was not changed.
