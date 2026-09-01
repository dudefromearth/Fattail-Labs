# P-SV8 — matching-window residual and session-end clocks

**Probe request 4.** Blocks `svp_v1` freeze / Hotel signature.  
**Fixtures:** same 15 as [`P-SV6-reconcile.md`](./P-SV6-reconcile.md) (sessions **2026-08-19, 08-20, 08-25**; 08-21 excluded).  
**Archive clocks:** last snap with `generation.rows` and reconstructed `t ≤ 16:00:00` NY.  
**Vendor:** Massive aggs `results[0].v` from the P-SV6 pull (aggs = open-close on all 15).  
**No new Massive call. No gold write. No rounding of residuals.**

---

## Part A — matching-window residual (`archive@≤16:00:00` − vendor daily)

### Clock of the ≤16:00 read (same file for all five contracts that session)

| session | reconstructed `t` | captured_at | file | rows |
|---------|-------------------|-------------|------|------|
| 2026-08-19 | 2026-08-19T15:59:55.816000-04:00 | 2026-08-19T15:59:55.816000-04:00 | snap-195955816Z.json | 62 |
| 2026-08-20 | 2026-08-20T15:59:58.062000-04:00 | 2026-08-20T15:59:58.062000-04:00 | snap-195958062Z.json | 62 |
| 2026-08-25 | 2026-08-25T15:59:57.828000-04:00 | 2026-08-25T15:59:57.828000-04:00 | snap-195957828Z.json | 62 |

08-19: the filename-last `t≤16:00` snap was a hole (`generation: null`, `hole: NO CHAIN SPX`); this is the previous snap with rows.

### 15 rows

`residual` = archive@≤16:00 − vendor aggs. Signed raw integer. `residual %` = `100 * residual / vendor`, two decimals.

| role | session | ticker | archive@≤16:00 | `t` of that read | vendor daily | residual | residual % |
|------|---------|--------|----------------|------------------|--------------|----------|------------|
| atm_call | 2026-08-19 | O:SPXW260819C07705000 | 29005 | 15:59:55.816-04:00 | 29017 | **−12** | **−0.04%** |
| atm_put | 2026-08-19 | O:SPXW260819P07705000 | 123625 | 15:59:55.816-04:00 | 122944 | **+681** | **+0.55%** |
| call_10 | 2026-08-19 | O:SPXW260819C07755000 | 54644 | 15:59:55.816-04:00 | 49979 | **+4665** | **+9.33%** |
| put_10 | 2026-08-19 | O:SPXW260819P07655000 | 15757 | 15:59:55.816-04:00 | 12827 | **+2930** | **+22.84%** |
| far_thin | 2026-08-19 | O:SPXW260819C07635000 | 58 | 15:59:55.816-04:00 | 58 | **0** | **0.00%** |
| atm_call | 2026-08-20 | O:SPXW260820C07640000 | 9228 | 15:59:58.062-04:00 | 10203 | **−975** | **−9.56%** |
| atm_put | 2026-08-20 | O:SPXW260820P07640000 | 111601 | 15:59:58.062-04:00 | 112083 | **−482** | **−0.43%** |
| call_10 | 2026-08-20 | O:SPXW260820C07690000 | 77860 | 15:59:58.062-04:00 | 74006 | **+3854** | **+5.21%** |
| put_10 | 2026-08-20 | O:SPXW260820P07590000 | 7312 | 15:59:58.062-04:00 | 6718 | **+594** | **+8.84%** |
| far_thin | 2026-08-20 | O:SPXW260820C07585000 | 29 | 15:59:58.062-04:00 | 47 | **−18** | **−38.30%** |
| atm_call | 2026-08-25 | O:SPXW260825C07680000 | 179441 | 15:59:57.828-04:00 | 181533 | **−2092** | **−1.15%** |
| atm_put | 2026-08-25 | O:SPXW260825P07680000 | 49747 | 15:59:57.828-04:00 | 50630 | **−883** | **−1.74%** |
| call_10 | 2026-08-25 | O:SPXW260825C07730000 | 8503 | 15:59:57.828-04:00 | 8328 | **+175** | **+2.10%** |
| put_10 | 2026-08-25 | O:SPXW260825P07630000 | 33824 | 15:59:57.828-04:00 | 33179 | **+645** | **+1.94%** |
| far_thin | 2026-08-25 | O:SPXW260825P07755000 | 54 | 15:59:57.828-04:00 | 54 | **0** | **0.00%** |

### Spread (15 residual %)

| | residual (contracts) | residual % |
|--|---------------------|------------|
| min | **−2092** | **−38.30%** |
| max | **+4665** | **+22.84%** |
| median | **0** | **0.00%** |

Counts: **6 below vendor, 2 equal, 7 above vendor.**

### Flag — archive **above** vendor at ≤16:00

Post-16:00 volume cannot explain these (the archive is already high *before* the bell):

| ticker | session | residual | residual % |
|--------|---------|----------|------------|
| O:SPXW260819P07705000 | 2026-08-19 | +681 | +0.55% |
| O:SPXW260819C07755000 | 2026-08-19 | +4665 | +9.33% |
| O:SPXW260819P07655000 | 2026-08-19 | +2930 | +22.84% |
| O:SPXW260820C07690000 | 2026-08-20 | +3854 | +5.21% |
| O:SPXW260820P07590000 | 2026-08-20 | +594 | +8.84% |
| O:SPXW260825C07730000 | 2026-08-25 | +175 | +2.10% |
| O:SPXW260825P07630000 | 2026-08-25 | +645 | +1.94% |

**7 of 15** sit above vendor at the matching window. The 10-strike-out contracts are **all seven** of the above-vendor rows except 08-19 ATM put. ATM calls are **all below** (−0.04%, −9.56%, −1.15%).

Expected “small, slightly negative” holds for **one** row (08-19 ATM call −12 / −0.04%). It is **not** the shape of the 15.

---

## Part B — where does the session actually end?

**Contracts:** ATM and 10-strikes-out on **08-19** and **08-20** (four on 08-19, two ATM + two 10-out on 08-20 = 8). Plus 08-25 ATM call and call_10 for a third session. Far-wing 08-25 is noted separately as a **band exit**, not a session end.

Clocks: last snap with rows at or before 16:00 / 16:05 / 16:10 / 16:15 / 16:20, then last of NY day.

### Grid

| session | ticker | role | ≤16:00 | ≤16:05 | ≤16:10 | ≤16:15 | ≤16:20 | last snap | last change | left band? |
|---------|--------|------|--------|--------|--------|--------|--------|-----------|-------------|------------|
| 08-19 | O:SPXW260819C07705000 | atm_call | 29005 | **30451** | 30451 | 30451 | 30451 | 30451 | ≤16:05 | no |
| 08-19 | O:SPXW260819P07705000 | atm_put | 123625 | **127217** | 127217 | 127217 | 127217 | 127217 | ≤16:05 | no |
| 08-19 | O:SPXW260819C07755000 | call_10 | 54644 | **54646** | 54646 | 54646 | 54646 | 54646 | ≤16:05 | no |
| 08-19 | O:SPXW260819P07655000 | put_10 | 15757 | **15758** | 15758 | 15758 | 15758 | 15758 | ≤16:05 | no |
| 08-20 | O:SPXW260820C07640000 | atm_call | 9228 | **10236** | 10236 | 10236 | 10236 | 10236 | ≤16:05 | no |
| 08-20 | O:SPXW260820P07640000 | atm_put | 111601 | **115318** | 115318 | 115318 | 115318 | 115318 | ≤16:05 | no |
| 08-20 | O:SPXW260820C07690000 | call_10 | 77860 | 77860 | 77860 | 77860 | 77860 | 77860 | already flat at ≤16:00 | no |
| 08-20 | O:SPXW260820P07590000 | put_10 | 7312 | 7312 | 7312 | 7312 | 7312 | 7312 | already flat at ≤16:00 | no |
| 08-25 | O:SPXW260825C07680000 | atm_call | 179441 | **182436** | 182436 | 182436 | 182436 | 182436 | ≤16:05 | no |
| 08-25 | O:SPXW260825C07730000 | call_10 | 8503 | **8505** | 8505 | 8505 | 8505 | 8505 | ≤16:05 | no |
| 08-25 | O:SPXW260825P07755000 | far_thin | 54 | 54 | **None** | **None** | **None** | **None** | — | **yes, after 16:04:57** |

08-25 far-thin put is in the 16:04:57 snap (102 rows) and gone from 16:09:57 onward (62 rows). That is a **band exit**, not a volume freeze.

### Clock files (08-19 / 08-20 / 08-25)

| session | ≤16:05 file | captured_at |
|---------|-------------|-------------|
| 08-19 | snap-200459709Z.json | 2026-08-19T16:04:59.709000-04:00 |
| 08-20 | snap-200458405Z.json | 2026-08-20T16:04:58.405000-04:00 |
| 08-25 | snap-200457332Z.json | 2026-08-25T16:04:57.332000-04:00 |

≤16:10 / ≤16:15 / ≤16:20 files are in P-SV6 (same copies). No volume change on any in-band contract after the ≤16:05 clock.

### Outcome (plain)

**No in-band ATM or 10-strike-out contract in this set is still moving at 16:10–16:15.** Last observed change is the ≤16:05 clock, or the series is already flat at ≤16:00.

**16:00–16:05 is not universal silence:** ATM names on all three days add volume in that interval (08-19 call 29005→30451; 08-20 call 9228→10236; 08-25 call 179441→182436). Two 10-strike-out names on 08-20 add **zero** after 16:00. Two on 08-19 add **+1 / +2**.

**Mixed** on whether 16:00–16:05 still prints. **Not mixed** after 16:05: flat for every in-band contract sampled. 08-19 ATM call going flat after 16:04:59 is **not unique**.

---

## Source

Numbers are the P-SV6 archive extract (`/tmp/svp-psv6/archive_extract.json` on StudioOne) and P-SV6 Massive pull. Same 15 tickers, same vendor figures, same hole-skipping ≤16:00 files.
