# P-SV9 — characterise the per-strike volume error

**Probe request 5.** Reopens **P-SV1**. Blocks `svp_v1` freeze / Hotel signature.  
**When:** 2026-08-31  
**Gold:** historical `day=2026-08-19/20/25` SPX snaps on StudioOne (not the live write day). Change-series written to `/tmp/svp-psv9-t2/*.jsonl`.  
**Massive:** 1-minute aggs, Test 1 only (4 contracts).  
**No spec fold. No rounding.**

Off set used below = P-SV8’s **7 above-vendor @≤16:00** plus **08-20 far_thin** (−38.30% @≤16:00) = **8**. Controls = **3 ATM calls**.

---

## Gate 0 — ticker identity (must pass first)

≤16:00 snaps with rows (same files as P-SV8):

| session | file |
|---------|------|
| 2026-08-19 | snap-195955816Z.json |
| 2026-08-20 | snap-195958062Z.json |
| 2026-08-25 | snap-195957828Z.json |

For each of the 15 P-SV6 fixtures, **ticker on the archive row** vs **ticker sent to Massive** (and vs `aggs_body.ticker`):

All **15** are character-for-character equal. `present=True`. OCC parse of the archive ticker matches `row.side`, `row.strike`, and `generation.expiration`.

Examples (verbatim `repr`):

```
sent='O:SPXW260819C07755000'
arch='O:SPXW260819C07755000'
equal=True
row.side='call' row.strike=7755.0 parsed={'root': 'SPXW', 'exp': '2026-08-19', 'side': 'call', 'strike': 7755.0}
```

ATM 08-19 is 7705; 7755 − 7705 = **50 points = 10 × 5-pt steps**. Same for 08-20 (7640 vs 7690) and 08-25 (7680 vs 7730).

**Gate 0 passes.** The P-SV8 table is not a wrong-strike query. Continue.

---

## Test 1 — which side is wrong?

Four Massive calls: `GET /v2/aggs/ticker/{ticker}/range/1/minute/{day}/{day}?adjusted=true&limit=50000&sort=asc`

Cutoff for “→ 16:00”: bar `t` < 16:00:00-04:00 (epoch ms). All four bodies have `ticker` equal to the request ticker.

| | 08-19 ATM call (clean) | 08-19 call_10 (off) | 08-19 put_10 (off) | 08-20 call_10 (off) |
|--|------------------------|---------------------|--------------------|---------------------|
| ticker | O:SPXW260819C07705000 | O:SPXW260819C07755000 | O:SPXW260819P07655000 | O:SPXW260820C07690000 |
| HTTP | 200 | 200 | 200 | 200 |
| request_id | 9a5f537ea8c4112939cae82030fd97a3 | 0c97075ce56892ce6d10a349762569e8 | bb5297f5b3421be28b990660c5eaf4ba | bfd475e1a055b9c462f15c0e7ba6d1bd |
| n minute bars | 376 | 373 | 342 | 374 |
| first bar | 09:30:00-04:00 | 09:30:00-04:00 | 09:30:00-04:00 | 09:30:00-04:00 |
| last bar | 16:00:00-04:00 | 15:59:00-04:00 | 15:59:00-04:00 | 15:58:00-04:00 |
| **Σ vendor minutes all day** | **29017** | **49979** | **12827** | **74006** |
| **Σ vendor minutes t < 16:00** | **29016** | **49979** | **12827** | **74006** |
| **vendor daily (P-SV6 aggs)** | **29017** | **49979** | **12827** | **74006** |
| **archive @≤16:00** | **29005** | **54644** | **15757** | **77860** |
| Σall − vendor daily | 0 | 0 | 0 | 0 |
| Σ<16:00 − vendor daily | −1 | 0 | 0 | 0 |
| Σ<16:00 − archive | +11 | **−4665** | **−2930** | **−3854** |
| archive − vendor daily | −12 | **+4665** | **+2930** | **+3854** |

ATM clean first/last minute bars (verbatim):

```
first: {"v": 47, "t": 1787146200000, ...}  09:30:00
last:  {"v": 1, "t": 1787169600000, ...}   16:00:00
```

Off call_10 08-19 last bars are 15:59, no 16:00 bar; Σall = Σ<16:00 = daily.

### Test 1 reading

**vendor-sum ≈ vendor-daily, both ≠ archive** on the three off contracts (exact equality vendor-sum = vendor-daily; archive is thousands higher).

On the clean ATM call: vendor-sum ≈ vendor-daily (29016 vs 29017); archive is **12 below** daily (the small pre-bell lag).

**The archive is wrong on the off strikes.** The vendor’s two figures agree with the vendor’s own minute tape. The defect is Labs-side (generation builder or tap), not a daily-vs-intraday convention on Massive.

**Flag:** the shipped Heatmap ladder shows per-strike `volume` from this same generation path. This is a **live-product** question, not only SVP.

---

## Test 2 — archive-side mechanism

One pass per day over every SPX snap (opened 37537 / 38442 / 30856 files; err=0). Emitted a row only when `wings` or a watch ticker’s `volume` changed (or first/last).

| day | opened | emitted | holes (`generation` null/empty) | wings seen |
|-----|--------|---------|----------------------------------|------------|
| 2026-08-19 | 37537 | 417 | 10090 | **[15] only** |
| 2026-08-20 | 38442 | 442 | 283 | **[15] only** |
| 2026-08-25 | 30856 | 10489 | 0 | **[15, 25]** |

### 1. Monotone after the roll?

Roll = first decrease (session boundary ~09:31). After that:

| ticker | role | roll pre→post | n_post_roll_decreases |
|--------|------|---------------|------------------------|
| O:SPXW260819C07705000 | control ATM call | 5070 @00:00:11 → 48 @09:31:06 | **0** |
| O:SPXW260819P07705000 | off ATM put | 4650 → 168 @09:31:06 | **0** |
| O:SPXW260819C07755000 | off call_10 | 3102 → 301 @09:31:06 | **0** |
| O:SPXW260819P07655000 | off put_10 | 2029 → 117 @09:31:06 | **0** |
| O:SPXW260820C07640000 | control ATM call | 99 → 6 @09:31:03 | **0** |
| O:SPXW260820C07690000 | off call_10 | 567 → 186 @09:31:03 | **0** |
| O:SPXW260820P07590000 | off put_10 | no decrease in series (first present 13:20:05 @5508) | — |
| O:SPXW260820C07585000 | off far_thin | no decrease (first present 13:40:59 @23) | — |
| O:SPXW260825C07680000 | control ATM call | 5298 @09:31:02 → 160 @09:31:06 | **0** |
| O:SPXW260825C07730000 | off call_10 | 4084 → 149 @09:31:06 | **0** |
| O:SPXW260825P07630000 | off put_10 | 3506 → 219 @09:31:06 | **0** |

**After the roll, every series that had a roll is monotone.** No post-roll decrease in this change-log (which records every volume change).

08-19 overnight is one static value from 00:00:11 until the 09:31 emit (volume did not change in between, so no extra rows).

### 2. Do steps coincide with `wings` changes?

**08-19 and 08-20:** `wings` is **15 on every emitted snap**. `n_wings_changes_while_present = 0`. The off contracts on those days (including the **+22.84%** and **+9.33%** names) have **no band change to coincide with**.

**08-25:** `wings` flips 15↔25 constantly (`n_wings_changes_while_present = 10366` for tickers present all day). Sample at those flips: **`vol_delta = 0`**.

```
{"t": "2026-08-25T00:00:19.545000-04:00", "wings_from": 15, "wings_to": 25, "vol_before": 5298, "vol_after": 5298, "vol_delta": 0}
{"t": "2026-08-25T00:00:26.207000-04:00", "wings_from": 25, "wings_to": 15, "vol_before": 5298, "vol_after": 5298, "vol_delta": 0}
```

Same zero-delta flips on the off 08-25 names.

### 3. Do the controls show the same?

Yes. ATM-call controls: monotone after roll; 08-19/20 no wings changes; 08-25 same 15↔25 flicker with **volume unchanged** at the flip.

**Band changes are not the cause.** The 08-19/20 errors exist with constant `wings=15`. The 08-25 flicker is shared by the clean ATM call and does not move `volume`.

Post-roll start vs end for 08-19 off call_10: 301 → 54646 (intraday add **54345**) vs vendor daily **49979**. The extra is **accumulated through the session**, not only a bad 09:31 seed.

---

## Test 3 — row identity inside one snapshot

Same three ≤16:00 files as Gate 0.

| session | n_rows | unique tickers | OCC vs (side, strike, gen exp) mismatches | duplicate (side, strike) | `excluded_adjusted_count` |
|---------|--------|----------------|-------------------------------------------|--------------------------|---------------------------|
| 2026-08-19 | 62 | 62 | **0** | **none** | **0** (key present) |
| 2026-08-20 | 62 | 62 | **0** | **none** | **0** (key present) |
| 2026-08-25 | 62 | 62 | **0** | **none** | **0** (key present) |

Non-standard roots: **none**. Sample rows parse as SPXW 0DTE matching the generation expiration.

No neighbour-volume via duplicate `(side, strike)` in these three snaps.

---

## Test 4 — band-edge position of the 8 off contracts

Band at the ≤16:00 snap (step 5). `from_lo` / `from_hi` = strike steps to `strike_lo` / `strike_hi`. Residual % from P-SV8 (archive@≤16:00 − vendor).

| ticker | session | strike | lo–hi | from_lo | from_hi | min-to-edge | residual % @≤16:00 |
|--------|---------|--------|-------|---------|---------|-------------|---------------------|
| O:SPXW260819P07705000 | 08-19 | 7705 | 7630–7780 | 15 | 15 | **15 (center)** | **+0.55%** |
| O:SPXW260819C07755000 | 08-19 | 7755 | 7630–7780 | 25 | 5 | **5** | **+9.33%** |
| O:SPXW260819P07655000 | 08-19 | 7655 | 7630–7780 | 5 | 25 | **5** | **+22.84%** |
| O:SPXW260820C07690000 | 08-20 | 7690 | 7565–7715 | 25 | 5 | **5** | **+5.21%** |
| O:SPXW260820P07590000 | 08-20 | 7590 | 7565–7715 | 5 | 25 | **5** | **+8.84%** |
| O:SPXW260820C07585000 | 08-20 | 7585 | 7565–7715 | 4 | 26 | **4** | **−38.30%** |
| O:SPXW260825C07730000 | 08-25 | 7730 | 7605–7755 | 25 | 5 | **5** | **+2.10%** |
| O:SPXW260825P07630000 | 08-25 | 7630 | 7605–7755 | 5 | 25 | **5** | **+1.94%** |

Six of eight sit **5 steps from an edge** (that is the 10-strike-out construction on a 15-wing / 31-strike band). One is **center** and still +0.55%. One is **4 from the lo edge** and is the −38.30% thin call.

**Not “only the outermost strike.”** The outermost 08-19/08-25 far-thin names were **0.00%** in P-SV8. Error in this set is the **wing region (~5 steps in), both signs**, plus a small center put.

---

## Shapes only (no third story)

- Gate 0: tickers match. Probe artifact ruled out.
- Test 1: vendor minute tape **sums to vendor daily**; archive **does not**. Archive high on off strikes. **Labs-side.** Heatmap volume column is the same path.
- Test 2: after roll, archive `volume` is **monotone**. **No** volume step at `wings` changes. 08-19/20 errors happen with **constant wings=15**. Controls share 08-25 flicker with **zero volume delta**.
- Test 3: no OCC/field mismatch, no duplicate strikes, `excluded_adjusted_count=0`.
- Test 4: off residuals are **not** concentrated on the last strike of the band.

The archive series is smooth and internally consistent. It is **not** the vendor’s RTH tape on the wing strikes.
