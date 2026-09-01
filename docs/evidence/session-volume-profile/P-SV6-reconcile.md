# P-SV6 — widen the reconcile (15 contracts × vendor daily)

**Probe request 3.** Blocks `svp_v1` tolerance freeze / Hotel signature.  
**When:** 2026-08-31  
**Gold:** StudioOne copies under `/tmp/svp-psv6` (holes skipped: last file `t≤16:00` with `generation.rows`).  
**Massive:** StudioTwo `GET api.massive.com` aggs + open-close, `adjusted=true`.  
**No rounding of deltas. No spec fold.**

---

## Sessions picked

From `day=2026-08-14 … 2026-08-31`, **excluded 08-21** (459 RTH gaps / 7862 s).

| Session | Why |
|---------|-----|
| **2026-08-19** | SPX STATS: **0** RTH gaps |
| **2026-08-20** | SPX STATS: **0** RTH gaps |
| **2026-08-25** | SPX STATS: **5** RTH gaps, 95.735 s — next-cleanest weekday after the two zeros |

08-28 is **not** in the 15; it is only adjunct 4 (vendor stability re-query).

`t` reconstructed in the NY window. Equity-close = last snap with rows and `t ≤ 16:00`. Instrument-close = last snap with rows and `t ≤ 16:15`. Last snap = last of that NY day with rows.

---

## Clock files (verbatim)

| session | clock | captured_at | file |
|---------|-------|-------------|------|
| 2026-08-19 | ≤16:00 | 2026-08-19T15:59:55.816000-04:00 | snap-195955816Z.json |
| 2026-08-19 | ≤16:15 | 2026-08-19T16:14:59.606000-04:00 | snap-201459606Z.json |
| 2026-08-19 | last | 2026-08-19T23:59:58.265000-04:00 | snap-035958265Z.json |
| 2026-08-20 | ≤16:00 | 2026-08-20T15:59:58.062000-04:00 | snap-195958062Z.json |
| 2026-08-20 | ≤16:15 | 2026-08-20T16:14:59.088000-04:00 | snap-201459088Z.json |
| 2026-08-20 | last | 2026-08-20T23:59:59.634000-04:00 | snap-035959634Z.json |
| 2026-08-25 | ≤16:00 | 2026-08-25T15:59:57.828000-04:00 | snap-195957828Z.json |
| 2026-08-25 | ≤16:15 | 2026-08-25T16:14:58.969000-04:00 | snap-201458969Z.json |
| 2026-08-25 | last | 2026-08-25T23:59:58.248000-04:00 | snap-035958248Z.json |

08-19 first candidate `t≤16:00` was `snap-195958035Z.json` with `"generation":null,"hole":"NO CHAIN SPX"` (263 bytes). Walked back to `snap-195955816Z.json` (62 rows).

---

## Contract selection (15:59 snap)

| session | spot | atm | step | band lo–hi | wings |
|---------|------|-----|------|------------|-------|
| 2026-08-19 | 7706.15 | 7705 | 5 | 7630–7780 | 15 |
| 2026-08-20 | 7641.40 | 7640 | 5 | 7565–7715 | 15 |
| 2026-08-25 | 7678.72 | 7680 | 5 | 7605–7755 | 15 |

| session | role | ticker | side | strike | 15:59 volume |
|---------|------|--------|------|--------|--------------|
| 08-19 | atm_call | O:SPXW260819C07705000 | call | 7705 | 29005 |
| 08-19 | atm_put | O:SPXW260819P07705000 | put | 7705 | 123625 |
| 08-19 | call_10 | O:SPXW260819C07755000 | call | 7755 | 54644 |
| 08-19 | put_10 | O:SPXW260819P07655000 | put | 7655 | 15757 |
| 08-19 | far_thin | O:SPXW260819C07635000 | call | 7635 | 58 |
| 08-20 | atm_call | O:SPXW260820C07640000 | call | 7640 | 9228 |
| 08-20 | atm_put | O:SPXW260820P07640000 | put | 7640 | 111601 |
| 08-20 | call_10 | O:SPXW260820C07690000 | call | 7690 | 77860 |
| 08-20 | put_10 | O:SPXW260820P07590000 | put | 7590 | 7312 |
| 08-20 | far_thin | O:SPXW260820C07585000 | call | 7585 | 29 |
| 08-25 | atm_call | O:SPXW260825C07680000 | call | 7680 | 179441 |
| 08-25 | atm_put | O:SPXW260825P07680000 | put | 7680 | 49747 |
| 08-25 | call_10 | O:SPXW260825C07730000 | call | 7730 | 8503 |
| 08-25 | put_10 | O:SPXW260825P07630000 | put | 7630 | 33824 |
| 08-25 | far_thin | O:SPXW260825P07755000 | put | 7755 | 54 |

`call_10` / `put_10` = ATM ± 10×5 = ±50 points. `far_thin` = smallest volume on that 15:59 band.

---

## 15-row table

`delta` = archive@≤16:15 − vendor aggs. Signed raw integer. `delta %` = `100 * delta / aggs`, two decimals.

| ticker | session | archive ≤16:00 | archive ≤16:15 | archive last snap | vendor aggs | vendor open-close | delta (≤16:15 − aggs) | delta % of vendor |
|--------|---------|----------------|----------------|-------------------|-------------|-------------------|----------------------|-------------------|
| O:SPXW260819C07705000 | 2026-08-19 | 29005 | 30451 | 30451 | 29017 | 29017 | **1434** | 4.94% |
| O:SPXW260819P07705000 | 2026-08-19 | 123625 | 127217 | 127217 | 122944 | 122944 | **4273** | 3.48% |
| O:SPXW260819C07755000 | 2026-08-19 | 54644 | 54646 | 54646 | 49979 | 49979 | **4667** | 9.34% |
| O:SPXW260819P07655000 | 2026-08-19 | 15757 | 15758 | 15758 | 12827 | 12827 | **2931** | 22.85% |
| O:SPXW260819C07635000 | 2026-08-19 | 58 | 58 | 58 | 58 | 58 | **0** | 0.00% |
| O:SPXW260820C07640000 | 2026-08-20 | 9228 | 10236 | 10236 | 10203 | 10203 | **33** | 0.32% |
| O:SPXW260820P07640000 | 2026-08-20 | 111601 | 115318 | 115318 | 112083 | 112083 | **3235** | 2.89% |
| O:SPXW260820C07690000 | 2026-08-20 | 77860 | 77860 | 77860 | 74006 | 74006 | **3854** | 5.21% |
| O:SPXW260820P07590000 | 2026-08-20 | 7312 | 7312 | 7312 | 6718 | 6718 | **594** | 8.84% |
| O:SPXW260820C07585000 | 2026-08-20 | 29 | 49 | 49 | 47 | 47 | **2** | 4.26% |
| O:SPXW260825C07680000 | 2026-08-25 | 179441 | 182436 | 182436 | 181533 | 181533 | **903** | 0.50% |
| O:SPXW260825P07680000 | 2026-08-25 | 49747 | 51209 | 51209 | 50630 | 50630 | **579** | 1.14% |
| O:SPXW260825C07730000 | 2026-08-25 | 8503 | 8505 | 8505 | 8328 | 8328 | **177** | 2.13% |
| O:SPXW260825P07630000 | 2026-08-25 | 33824 | 33825 | 33825 | 33179 | 33179 | **646** | 1.95% |
| O:SPXW260825P07755000 | 2026-08-25 | 54 | *absent from ≤16:15 snap* (last present ≤16:15 = **54** @ 16:04:57, snap-200457332Z.json; later clocks `None`) | *None* | 54 | 54 | **0** (using last present ≤16:15 = 54) | 0.00% |

On 08-25 the far-wing put is in the 15:59 (62-row) and 16:04:57 (102-row) snaps, then gone from 16:09 onward (band 62-row again).

---

## Three answers

**1. Sign.** Archive@≤16:15 **≥** vendor aggs in **all 15**. Deltas are **0 or positive**. **No invert.** No stop-flag.

**2. Does the gap scale?** **No, not a constant %.** Range **0.00% … 22.85%**. ATM % is not systematically the largest or smallest. Far-thin % is **0.00 / 4.26 / 0.00**. Largest % is **put_10 on 08-19 (22.85%)**, not the thin wing. Scattered.

**3. Vendor vs itself.** Aggs `results[0].v` **equals** open-close `volume` on **all 15** and on the re-query. No vendor-endpoint disagreement in this sample.

---

## 4. Vendor stability (re-query)

Previous probe (P-SV1 §7): `O:SPXW260828C07735000` 2026-08-28 vendor **76997**.

This run, same endpoints:

```
GET /v2/aggs/ticker/O:SPXW260828C07735000/range/1/day/2026-08-28/2026-08-28?adjusted=true
HTTP 200
{"ticker":"O:SPXW260828C07735000","queryCount":1,"resultsCount":1,"adjusted":true,"results":[{"v":76997,"vw":6.6189,"o":18.3,"c":0.03,"h":38.2,"l":0.01,"t":1787889600000,"n":32184}],"status":"OK","request_id":"007d0b29ba9dd9e16a20b354515cd579","count":1}

GET /v1/open-close/O:SPXW260828C07735000/2026-08-28
HTTP 200 volume=76997
```

**Same number: 76997.**

---

## 5. One post-16:00 breakdown

Contract: **O:SPXW260819C07705000** (08-19 ATM call). Last snap with rows at or before each clock:

| clock | captured_at | file | volume |
|-------|-------------|------|--------|
| ≤16:00 | 2026-08-19T15:59:55.816000-04:00 | snap-195955816Z.json | **29005** |
| ≤16:05 | 2026-08-19T16:04:59.709000-04:00 | snap-200459709Z.json | **30451** |
| ≤16:10 | 2026-08-19T16:09:58.127000-04:00 | snap-200958127Z.json | **30451** |
| ≤16:15 | 2026-08-19T16:14:59.606000-04:00 | snap-201459606Z.json | **30451** |
| ≤16:20 | 2026-08-19T16:19:58.766000-04:00 | snap-201958766Z.json | **30451** |
| last of day | 2026-08-19T23:59:58.265000-04:00 | snap-035958265Z.json | **30451** |

Vendor daily for this contract: **29017**. Archive 15:59 **29005** (vendor − archive = 12 at equity close). Archive 16:05 and after **30451**.

Same pattern on 08-20 ATM call: 9228 @15:59:58 → 10236 @16:04:58, then flat through last snap.

---

## Sample vendor bodies (08-19 ATM call)

```
GET /v2/aggs/ticker/O:SPXW260819C07705000/range/1/day/2026-08-19/2026-08-19?adjusted=true
HTTP 200
{"ticker":"O:SPXW260819C07705000","queryCount":1,"resultsCount":1,"adjusted":true,"results":[{"v":29017,"vw":7.9187,"o":25,"c":2.4,"h":40.6,"l":0.5,"t":1787112000000,"n":14314}],"status":"OK","request_id":"3db21b2f626559bd277ef7fc9c87f985","count":1}

GET /v1/open-close/O:SPXW260819C07705000/2026-08-19
HTTP 200
{"status":"OK","from":"2026-08-19","symbol":"O:SPXW260819C07705000","open":25,"high":40.6,"low":0.5,"close":2.4,"volume":29017,"afterHours":2.4,"preMarket":25}
```

Far-thin 08-19:

```
aggs v=58  open-close volume=58  archive all clocks 58
```

---

## Notes (facts only)

- 15/15 Massive HTTP 200 on both endpoints.
- Archive last-of-day equals archive ≤16:15 on 14/15 rows; the 15th (08-25 far wing) is absent after 16:05.
- Equity-close (≤16:00) is **below** vendor on several ATM rows (e.g. 08-19 call 29005 vs 29017; 08-20 call 9228 vs 10203). The requested delta column uses **≤16:15**, where archive is at or above vendor in this sample.
