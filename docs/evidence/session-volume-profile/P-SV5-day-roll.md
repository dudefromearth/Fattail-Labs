# P-SV5 — day roll, gap census, wings, field census

**Probe request 2** following P-SV1 / P-SV4 (2026-08-31)  
**Host:** StudioOne copies under `/tmp/svp-probe2` (09:25–09:50 ET windows) + sidecars; Massive from StudioTwo for P-SV1 §7 only  
**When:** 2026-08-31  
**Safety:** no gold writes; dash not bounced. Item 4 (Massive) is filed on `P-SV1.md` §7.

`t` reconstructed from filename clock in the NY session window.

---

## Verdict

| Item | Observation |
|------|-------------|
| **1. Per-snapshot vs per-contract** | On 2026-08-28, consecutive snaps `09:31:07.032` → `09:31:18.253` ET: **59 of 62 common contracts decreased, 0 rose, 3 flat, 0 rolled to 0.** New contracts in the wider post snap: 40. The overlap **almost all drops at one pair**. On 2026-08-20, 3 ATM calls dropped at 09:31:01→09:31:03 and 2 others at 09:31:08→09:31:10 (**two pairs, ~7 s apart**) |
| **2. Roll time** | Across 5 weekdays, first drop sits **just after 09:31 ET**, not at 09:30:00. Window ~**09:31:00–09:31:31**. Post-roll values are **small positive** (1–451 in these samples), **never 0** |
| **3. Pre-roll = yesterday’s total?** | **Not testable on this archive.** Every copied SPX snap is **0DTE only** (`expiration` = session date; ticker dates `260827` vs `260828`). A dated contract does not exist on consecutive days here |
| **4. Massive reconcile** | See **P-SV1.md §7**. Vendor daily **76997**. Archive last snap **77427**. Diff **+430** |
| **5. RTH gaps (SPX STATS)** | Quiet days: 0–11 named RTH gaps, tens to hundreds of gap-seconds. **2026-08-21: 459 RTH gaps, 7862.116 s total** (max 47.74 s). 08-14/22/23/29 have no SPX STATS book |
| **6. `wings`** | **Not constant.** COUNTS topics use **`w15` (108)** and **`w25` (34)** among non-empty rows. 08-28 09:25–09:50 window generations: **`(15,31,62)` 302 files** and **`(25,51,102)` 178 files** (plus a few 30/50 listed) |
| **7. Fields** | `generation.spot` present. Per row: `open_interest`, `gamma` present. **No per-row timestamp.** On 10:00 ET snap: **gamma_null=0/102, oi_null=0/102** |

---

## 1. Is the roll per-snapshot or per-contract?

**Day:** 2026-08-28 SPX. Window copy 09:25–09:50 ET, **490** files. First decrease of `O:SPXW260828C07735000` between **consecutive** reconstructed-`t` files:

| | pre | post |
|--|-----|------|
| file | `snap-133107032Z.json` | `snap-133118253Z.json` |
| captured_at | 2026-08-28T09:31:07.032654-04:00 | 2026-08-28T09:31:18.253760-04:00 |
| as_of | 2026-08-28T13:31:01.865793Z | 2026-08-28T13:31:17.322878Z |
| ATM volume | **4433** | **142** |
| wings / listed / rows | 15 / 31 / 62 | 25 / 51 / 102 |

**Overlap census (verbatim):**

```
n_prev 62
n_next 102
n_common 62
decreased 59
rose 0
flat 3
missing_vol 0
only_prev 0
only_next 40
post_roll_zero_among_decreased 0
```

**Flat (volume unchanged):**

```
('O:SPXW260828C07670000', 349, 349)
('O:SPXW260828P07780000', 329, 329)
('O:SPXW260828P07790000', 105, 105)
```

Among the 59 decreases: post values **1…421**, none 0.

ATM watch on that same pair:

```
O:SPXW260828C07730000 pre 9851 post 78
O:SPXW260828C07735000 pre 4433 post 142
O:SPXW260828C07725000 pre 6884 post 100
O:SPXW260828C07740000 pre 6256 post 173
O:SPXW260828C07720000 pre 7998 post 36
```

**Shows:** for contracts present in both snapshots, **59/62 decreased at this one pair**, none rose. Three stayed flat. The post snap is a **wider band** (40 extra tickers), so “all contracts in the file” is not the same set.

---

## 2. Is the roll time stable across days?

09:25–09:50 ET windows copied off gold. Five ATM-ish **calls** per day (nearest `generation.spot`). First drop per ticker:

| day | ticker | pre_t (ET) | pre_vol | post_t (ET) | post_file | post_vol |
|-----|--------|------------|---------|-------------|-----------|----------|
| 2026-08-20 | O:SPXW260820C07710000 | 09:31:01.696 | 3635 | 09:31:03.930 | snap-133103930Z.json | 361 |
| 2026-08-20 | O:SPXW260820C07705000 | 09:31:01.696 | 1619 | 09:31:03.930 | snap-133103930Z.json | 222 |
| 2026-08-20 | O:SPXW260820C07720000 | 09:31:01.696 | 5382 | 09:31:03.930 | snap-133103930Z.json | 285 |
| 2026-08-20 | O:SPXW260820C07715000 | 09:31:08.497 | 4496 | 09:31:10.814 | snap-133110814Z.json | 199 |
| 2026-08-20 | O:SPXW260820C07700000 | 09:31:08.497 | 3209 | 09:31:10.814 | snap-133110814Z.json | 451 |
| 2026-08-21 | O:SPXW260821C07640000 | 09:31:06.564 | 1005 | 09:31:31.521 | snap-133131521Z.json | 21 |
| 2026-08-21 | O:SPXW260821C07645000 | 09:31:06.564 | 1074 | 09:31:31.521 | snap-133131521Z.json | 52 |
| 2026-08-21 | O:SPXW260821C07635000 | 09:31:06.564 | 542 | 09:31:31.521 | snap-133131521Z.json | 3 |
| 2026-08-21 | O:SPXW260821C07650000 | 09:31:06.564 | 2889 | 09:31:31.521 | snap-133131521Z.json | 54 |
| 2026-08-21 | O:SPXW260821C07630000 | 09:31:06.564 | 506 | 09:31:31.521 | snap-133131521Z.json | 1 |
| 2026-08-24 | O:SPXW260824C07675000 | 09:31:03.246 | 6792 | 09:31:10.063 | snap-133110063Z.json | 373 |
| 2026-08-24 | O:SPXW260824C07670000 | 09:31:03.246 | 3241 | 09:31:10.063 | snap-133110063Z.json | 238 |
| 2026-08-24 | O:SPXW260824C07680000 | 09:31:03.246 | 6598 | 09:31:10.063 | snap-133110063Z.json | 298 |
| 2026-08-24 | O:SPXW260824C07665000 | 09:31:03.246 | 1796 | 09:31:10.063 | snap-133110063Z.json | 290 |
| 2026-08-24 | O:SPXW260824C07685000 | 09:31:03.246 | 4078 | 09:31:10.063 | snap-133110063Z.json | 304 |
| 2026-08-27 | O:SPXW260827C07675000 | 09:31:00.522 | 4958 | 09:31:05.211 | snap-133105211Z.json | 120 |
| 2026-08-27 | O:SPXW260827C07680000 | 09:31:00.522 | 4829 | 09:31:05.211 | snap-133105211Z.json | 30 |
| 2026-08-27 | O:SPXW260827C07670000 | 09:31:00.522 | 2963 | 09:31:05.211 | snap-133105211Z.json | 6 |
| 2026-08-27 | O:SPXW260827C07685000 | 09:31:00.522 | 4393 | 09:31:05.211 | snap-133105211Z.json | 26 |
| 2026-08-27 | O:SPXW260827C07665000 | 09:31:00.522 | 1954 | 09:31:05.211 | snap-133105211Z.json | 11 |
| 2026-08-28 | O:SPXW260828C07730000 | 09:31:07.032 | 9851 | 09:31:18.253 | snap-133118253Z.json | 78 |
| 2026-08-28 | O:SPXW260828C07735000 | 09:31:07.032 | 4433 | 09:31:18.253 | snap-133118253Z.json | 142 |
| 2026-08-28 | O:SPXW260828C07725000 | 09:31:07.032 | 6884 | 09:31:18.253 | snap-133118253Z.json | 100 |
| 2026-08-28 | O:SPXW260828C07740000 | 09:31:07.032 | 6256 | 09:31:18.253 | snap-133118253Z.json | 173 |
| 2026-08-28 | O:SPXW260828C07720000 | 09:31:07.032 | 7998 | 09:31:18.253 | snap-133118253Z.json | 36 |

`post_roll_zero` on every day in this set: **`[]`**. Minimum post-roll in this table is **1** (`O:SPXW260821C07630000`).

**Shows:** roll is **after 09:31 ET**, not at the 09:30 print. Same-day contracts can roll on **adjacent pairs** (08-20). Post-roll is never zero in these samples.

---

## 3. Is the pre-roll value literally yesterday’s total?

**Attempted with dated expiration as specified.** SPX snaps on consecutive session dates:

```
2026-08-27 last  snap-035958822Z.json captured 2026-08-27T23:59:58.822484-04:00 gen_exp 2026-08-27 ticker_yymmdd ['260827'] n_tickers 62
2026-08-27 first snap-051730882Z.json captured 2026-08-27T01:17:30.882608-04:00 gen_exp 2026-08-27 ticker_yymmdd ['260827'] n_tickers 102
2026-08-28 first snap-040013634Z.json captured 2026-08-28T00:00:13.634810-04:00 gen_exp 2026-08-28 ticker_yymmdd ['260828'] n_tickers 62
2026-08-28 last  snap-235959158Z.json captured 2026-08-28T19:59:59.158487-04:00 gen_exp 2026-08-28 ticker_yymmdd ['260828'] n_tickers 102
```

Ticker prefixes in the 09:25–09:50 windows: only that session’s `YYMMDD` (`260820`, `260821`, `260824`, `260827`, `260828`).

**Shows:** this gold capture is **one expiration = session date**. There is **no dated contract present on day N and day N+1** to compare last-of-N vs pre-roll-of-N+1.

---

## 4. Massive reconcile

Filed on [`P-SV1.md`](./P-SV1.md) §7. Vendor daily volume **76997**. Archive last snap **77427**. Difference **+430**. 15:55 archive **77002** vs vendor **+5**.

---

## 5. Gap census per day (SPX STATS.json)

RTH filter: GAP `after_file` clock hour UTC 13–19 (09:00–16:00 ET). Source: copied `day=*/STATS.json`.

| day | spx_count | delta_median | n_gaps_all | missing_s_all | n_rth_gaps | rth_gap_seconds_total | rth_gap_max |
|-----|-----------|--------------|------------|---------------|------------|----------------------|-------------|
| 2026-08-14 | *(NO_SPX_BOOK, n_books=1)* | | | | | | |
| 2026-08-17 | 2 | 365.0 | 0 | 0 | 0 | 0 | 0 |
| 2026-08-18 | 38012 | 2.255 | 1 | 45.456 | 1 | 45.456 | 45.456 |
| 2026-08-19 | 37537 | 2.291 | 0 | 0 | 0 | 0 | 0 |
| 2026-08-20 | 38442 | 2.238 | 0 | 0 | 0 | 0 | 0 |
| 2026-08-21 | 17870 | 2.283 | 527 | 9043.121 | **459** | **7862.116** | 47.74 |
| 2026-08-22 | NO_SPX_BOOK n_books=0 | | | | | | |
| 2026-08-23 | NO_SPX_BOOK n_books=0 | | | | | | |
| 2026-08-24 | 29192 | 2.278 | 12 | 371.656 | 11 | 335.601 | 67.252 |
| 2026-08-25 | 30856 | 2.264 | 6 | 177.171 | 5 | 95.735 | 22.416 |
| 2026-08-26 | 20841 | 2.307 | 47 | 968.751 | 41 | 745.461 | 44.164 |
| 2026-08-27 | 36107 | 2.266 | 18 | 805.62 | 10 | 429.58 | 65.005 |
| 2026-08-28 | 23830 | 2.394 | 12 | 351.456 | 7 | 209.091 | 54.683 |
| 2026-08-29 | NO_SPX_BOOK n_books=0 | | | | | | |
| 2026-08-30 | NO_STATS | | | | | | |
| 2026-08-31 | NO_STATS | | | | | | |

Verbatim lines from the probe process:

```
{"day": "day=2026-08-18", "spx_count": 38012, "delta_median": 2.255, "n_gaps_all": 1, "missing_s_all": 45.456, "n_rth_gaps": 1, "rth_gap_seconds_total": 45.456, "rth_gap_max": 45.456}
{"day": "day=2026-08-21", "spx_count": 17870, "delta_median": 2.283, "n_gaps_all": 527, "missing_s_all": 9043.121, "n_rth_gaps": 459, "rth_gap_seconds_total": 7862.116, "rth_gap_max": 47.74}
{"day": "day=2026-08-28", "spx_count": 23830, "delta_median": 2.394, "n_gaps_all": 12, "missing_s_all": 351.456, "n_rth_gaps": 7, "rth_gap_seconds_total": 209.091, "rth_gap_max": 54.683}
```

**Shows:** most RTH days have few named gaps (0–11, tens–hundreds of seconds). **08-21 is an outlier** (459 RTH gaps, 7862 s). Weekends / 08-14 SPY-only have no SPX STATS book.

---

## 6. Is `wings` constant?

COUNTS `topic` last-but-one token, all symbols, all days with a topic string:

```
topic_w_token_counts {'w15': 108, 'none': 110, 'w25': 34}
```

`none` = empty COUNTS rows (weekends / incomplete symbols).

SPX examples:

```
day=2026-08-27 SPX topic mb:ladder:SPX:2026-08-27:w15:dual row_count 62
day=2026-08-28 SPX topic mb:ladder:I:SPX:2026-08-28:w25:dual row_count 102
day=2026-08-31 SPX topic mb:ladder:I:SPX:2026-08-31:w15:dual row_count 62
```

**Within 2026-08-28 09:25–09:50** (490 generations):

```
08-28_window_wings_tuples
{(25, 25, 51, 102): 178,
 (15, 15, 31, 62): 302,
 (25, 25, 50, 100): 8,
 (15, 15, 30, 60): 2}
```

The item-1 roll pair itself is **wings 15 → 25**.

**Shows:** `wings` is **15 or 25** (and listed_in_window 30/31/50/51). Not one constant per day, not one constant per snapshot.

---

## 7. Field census (one snapshot)

File: `/tmp/svp-probe/spx-2026-08-28/snap-140004073Z.json` (10:00 ET 2026-08-28).

```
envelope_keys ['captured_at', 'chain_cadence', 'chain_cadence_s', 'expiration', 'generation', 'greek_count', 'hole', 'iv_count', 'phase', 'provenance', 'row_count', 'symbol', 'topic']
generation_keys [..., 'spot', 'spot_source', 'as_of', ...]
spot 7736.33 spot_source chain_underlying
as_of 2026-08-28T14:00:03.928524Z
captured_at 2026-08-28T10:00:04.073036-04:00
row_keys ['ask', 'bid', 'delta', 'gamma', 'is_spot', 'iv', 'mid', 'mid_source', 'open_interest', 'side', 'strike', 'theta', 'ticker', 'vega', 'volume']
{"n_rows": 102, "gamma_null": 0, "oi_null": 0, "volume_null": 0, "gamma_null_pct": 0.0, "oi_null_pct": 0.0, "per_row_timestamp_keys": []}
gamma_null_by_distance {'atm_pm_10': [0, 10], 'wings': [0, 92]}
```

| Field | Path | This snap |
|-------|------|-----------|
| spot | `generation.spot` | 7736.33 |
| open_interest | `generation.rows[].open_interest` | 0 null / 102 |
| gamma | `generation.rows[].gamma` | 0 null / 102 |
| per-row timestamp | — | **absent** |

**Shows:** spot, OI, and gamma are on the archived ladder row at 10:00 ET on this band. Attribution clock remains snapshot `as_of` / `captured_at`.
