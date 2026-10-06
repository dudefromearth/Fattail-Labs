# Massive concurrency finding

**v0.1 · 2026-09-29 · StudioOne.**  
Measured after the close, with the live chain feed still running. This file is the raw record. It does not revise OPF spec v0.3.

## Footprint

Throwaway process `/tmp/massive-concurrency-probe.py`, started only after the feed was confirmed on pid 91469 (lstart Tue Sep 29 16:06:25 2026). The process issued `GET /v3/snapshot/options/SPX` with `limit=250`, `expiration_date` set, and did not follow `next_url`. One call is one HTTP page, not a paginated book. It wrote no Redis key, no archive file, and no launchd job. It read `~/Library/Logs/fattail-labs/chain-feed.out.log` and would have stopped the sweep on an `HTTP 429` line in the bytes added during the run.

Not restarted: chain feed, live capture, band tap, `:5055` dash, sym feed. The full-book job stayed unloaded.

Discovery, before the timed levels, was six single pages, each HTTP 200, 0.123–0.136 s, one expiration per page: 2026-09-30, 2026-10-01, 2026-10-02, 2026-10-05, 2026-10-06, 2026-10-07. The timed calls round-robin those six.

## Feed during the probe

| | |
|---|---|
| pid before | 91469 |
| pid after | 91469 |
| feed `HTTP 429` lines added during the probe | 0 |

Passes logged while the levels ran stayed in the same band as the pre-probe feed: SPX about 14–15 s over 47–48 topics, XSP about 12–13 s over 38–39 topics, shared pass about 34–39 s over 88–99 topics. Capture pid 73887, band tap 74138, dash 85136, and sym feed 82012 (`--interval 5`) were the same processes after the probe.

## Levels

Each level held N calls in flight for 30 seconds. Timeout per call was 8 seconds. p90 is the nearest rank of every attempt: index `ceil(0.90 × count) − 1` on the sorted latencies. A timeout would have entered that list as the time waited. No call timed out. Throttle means HTTP 429 or a body that says too many requests. There were none.

| N | Attempts | Successes | Success rate | Throttles | p50 (s) | p90 (s) | max (s) | Statuses |
|---|----------|-----------|--------------|-----------|---------|---------|---------|----------|
| 2 | 403 | 403 | 1.0 | 0 | 0.1437 | 0.1613 | 0.3163 | 200 × 403 |
| 4 | 784 | 784 | 1.0 | 0 | 0.1460 | 0.1630 | 0.7449 | 200 × 784 |
| 6 | 1,287 | 1,287 | 1.0 | 0 | 0.1361 | 0.1528 | 0.3846 | 200 × 1,287 |
| 8 | 1,714 | 1,714 | 1.0 | 0 | 0.1379 | 0.1505 | 0.1897 | 200 × 1,714 |
| 12 | 2,615 | 2,615 | 1.0 | 0 | 0.1350 | 0.1509 | 0.2977 | 200 × 2,615 |

## Cap

The largest N with zero throttles and p90 under 1 second is 12. The cap is that N minus one: **11**.

`LABS_FULLBOOK_IN_FLIGHT_CAP=11` is set on `ai.fattail.labs.fullbook-capture` in the StudioOne plist. The job is not loaded. `live()` passes that same integer to the SPX scheduler and to the XSP scheduler, so the process can hold 11 loads per name at once. This probe was one pool of calls, not two. A load in the full-book worker then pages a book serially; these rows are one page each.

The 21:00 ET fallback (cap 3, marked unmeasured) was not used. The probe finished before that hour.
