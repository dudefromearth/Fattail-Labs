# OPF — Actual cadence finding

**Finding v0.1**  
Date: 2026-09-28  
Machine: StudioOne. Read only. CP-1. Nothing was restarted and nothing was written on that machine.  
Separate from spec v0.2. No build.

The question was whether the 0DTE archive has actually been landing every ~50 seconds rather than every 2 seconds. It has not. Across the regular-hours sessions on disk, the files are about 2.3 seconds apart, and a new generation arrives about every 5 to 7 seconds. The ~50 second figure is a different measurement: one serial chain-feed pass while about 120 topics were hot, taken after the close on 2026-09-28.

Strategy Lab can keep treating a normal session's 0DTE files as a few seconds apart. It should not treat every file as a new Massive snapshot, and it should not treat the archive as a 50-second tape.

## What was counted

Archive root: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`.  
Book: flat files `day=*/chain/SPX/snap-*.json`. On the days sampled, `expiration` is that session day, so these are the 0DTE front book. Nested `exp=*/` books were not in this count.

File time is the UTC clock in the filename. Regular hours are 13:30:00Z through 20:00:00Z, which is 09:30–16:00 ET in September. A "new generation" is a change of `content_hash` inside the snap. The same hash on the next file means the capture wrote Redis again, not that Massive returned a new snapshot.

`chain_cadence` on the snap says `2-5s`. That is the capture loop's label. It is not the age of the generation.

## SPX 0DTE, regular hours

`file_med` is the median gap between files. `hash_med` is the median gap between content-hash changes. `run_med` is how many files in a row carry the same hash. Gaps over an hour were dropped so a hole does not become the median.

| Day | Files | Distinct hashes | File median (s) | New-hash median (s) | New-hash p90 (s) | Longest new-hash gap (s) | Same-hash run, median |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-18 | 10332 | 3555 | 2.2 | 4.5 | 6.8 | 45 | 2 |
| 2026-08-19 | 10199 | 3432 | 2.3 | 4.6 | 6.9 | 64 | 2 |
| 2026-08-20 | 10436 | 5100 | 2.2 | 4.5 | 6.8 | 29 | 2 |
| 2026-08-21 | 5106 | 2149 | 2.3 | 6.9 | 20.4 | 50 | 3 |
| 2026-08-24 | 7348 | 3429 | 2.3 | 6.7 | 11.5 | 69 | 2 |
| 2026-08-25 | 7918 | 4769 | 2.3 | 4.5 | 6.8 | 23 | 1 |
| 2026-08-26 | 5582 | 2401 | 2.3 | 6.9 | 16.3 | 49 | 2 |
| 2026-08-27 | 9967 | 5695 | 2.3 | 4.5 | 6.9 | 70 | 2 |
| 2026-08-28 | 7287 | 3192 | 2.4 | 7.2 | 9.6 | 57 | 2 |
| 2026-08-31 | 7687 | 3890 | 2.4 | 4.8 | 11.8 | 33 | 2 |
| 2026-09-01 | 9945 | 5835 | 2.3 | 2.4 | 7.0 | 33 | 1 |
| 2026-09-02 | 6713 | 4230 | 2.4 | 2.4 | 11.9 | 21 | 1 |
| 2026-09-03 | 10094 | 4052 | 2.3 | 6.8 | 7.0 | 30 | 3 |
| 2026-09-04 | 5369 | 3152 | 2.4 | 6.8 | 14.3 | 45 | 2 |
| 2026-09-08 | 10070 | 4047 | 2.3 | 6.8 | 7.0 | 40 | 3 |
| 2026-09-09 | 10137 | 4051 | 2.3 | 6.8 | 7.0 | 9 | 3 |
| 2026-09-10 | 10115 | 4098 | 2.3 | 6.8 | 7.0 | 65 | 3 |
| 2026-09-11 | 7043 | 4142 | 2.4 | 4.7 | 11.7 | 42 | 2 |
| 2026-09-14 | 10101 | 4159 | 2.3 | 6.7 | 7.0 | 32 | 3 |
| 2026-09-15 | 10186 | 4098 | 2.3 | 6.5 | 7.0 | 7 | 3 |
| 2026-09-16 | 10242 | 4129 | 2.3 | 6.5 | 7.0 | 7 | 3 |
| 2026-09-17 | 10234 | 4144 | 2.3 | 6.4 | 7.0 | 21 | 3 |
| 2026-09-18 | 8638 | 3509 | 2.4 | 7.0 | 9.3 | 38 | 3 |
| 2026-09-21 | 7907 | 3629 | 2.3 | 6.6 | 11.5 | 37 | 2 |
| 2026-09-22 | 7876 | 4079 | 2.3 | 6.6 | 9.2 | 18 | 2 |
| 2026-09-23 | 9821 | 4218 | 2.3 | 6.6 | 7.0 | 14 | 2 |
| 2026-09-24 | 8760 | 4673 | 2.3 | 4.5 | 9.2 | 37 | 2 |
| 2026-09-25 | 8496 | 4083 | 2.3 | 4.8 | 9.3 | 35 | 2 |
| 2026-09-28 | 3135 | 1379 | 2.4 | 12.0 | 33.0 | 85 | 2 |

Days with no regular-hours SPX snaps in that folder: 2026-08-17, 2026-08-23, 2026-08-29, 2026-08-30, 2026-09-06, 2026-09-07, 2026-09-13, 2026-09-20, 2026-09-27. The folder's first day on this volume is 2026-08-14.

From 2026-08-18 through 2026-09-25 the file median stays inside 2.2–2.4 seconds. The new-hash median stays inside 2.4–7.2 seconds, and the 90th percentile is usually at or under 12 seconds. A typical hash is repeated for two or three files, so about half to two-thirds of the files are the same generation as the one before.

2026-09-25, the day previously described as four after-close snaps, has 8,496 regular-hours files in this flat folder, from 13:30:02Z to 19:59:53Z, with one gap over 30 seconds (33 seconds). That count is this path only. It does not reopen the plist finding.

2026-09-28 is the slow session. The files still span 13:30:01Z to 19:59:29Z, and the median file gap is still 2.4 seconds, but there are 3,135 files against a usual 8,000 to 10,000, and 146 gaps longer than 30 seconds. The longest are 83, 73, 66, 62, 60, and 59 seconds. The new-hash median is 12 seconds and the 90th percentile is 33 seconds. Three sampled snaps that day (09:30, 12:59, and 15:59 ET) have `as_of` within about five seconds of `captured_at`, so the files that did land were not a 50-second-old copy.

## The 50-second figure

`chain_feed` started recording `pass_s=` only after the after-close restart on 2026-09-28. The log is `~/Library/Logs/fattail-labs/chain-feed.out.log` on StudioOne. 583 passes were on record at the count.

| Topics in the pass | Passes | Median seconds | Min | Max |
|---:|---:|---:|---:|---:|
| 110 | 2 | 52.6 | 50.6 | 52.6 |
| 120–126 | 194 | 54.7 | 51.7 | 71.6 |
| 6 | 8 | 2.7 | 2.6 | 2.8 |
| 5 | 254 | 2.3 | 2.0 | 3.2 |
| 4 | 114 | 1.8 | 1.6 | 2.6 |
| 3 | 11 | 1.4 | 1.3 | 1.4 |

The first of the long passes was `pass_s=52.596 topics=116`. The last of them, still at 125–126 topics, were about 55.6 seconds. When the interest set fell to 3–6 topics, the same process returned to about 1.3–3.2 seconds. The two-second interval is real on a small topic set. It is not real on the ~120-topic set, and that ~120-topic set is what one serial loop was walking after the close.

That pass time is how often Massive is read for a given book while those topics share one loop. It is not the spacing of the 0DTE files already stored.

## What to correct

A replay that steps the 0DTE archive one file at a time is stepping about 2.3 seconds of capture time, and about every second or third file is a repeated generation. A replay that assumes a new chain every 50 seconds does not match this archive. Storage sized off a 2-second file rate matches the file count. Storage sized off a 50-second file rate does not.

No collector change, no feed change, and no archive rewrite follows from this finding.
