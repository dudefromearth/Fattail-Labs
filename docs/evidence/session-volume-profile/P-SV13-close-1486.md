# P-SV13 — Close the 1,486

**Probe request 9 + continuation.** Authority: P-SV12 outcome c on 9 of 10.  
**Named contract:** `O:SPXW260819P07655000` session **2026-08-19**.  
**When:** 2026-09-01.

**Status unchanged:** P-SV1 stays open. The `svp_v1` freeze stays. Hotel stays blocked. P-SV1 closes only when the decomposition is complete and signed. Nothing below is that signature.

Read-only. Raw HTTPS, not `MassiveClient`. Tap not restarted. Gold not written.

Raw JSON: `/tmp/svp-psv13/` plus P-SV12 tapes in `/tmp/svp-psv12/`.

---

## Branch that occurred

**Truncation ruled out** (unique set identical across four pulls). Gate restated: unique set did not move. Section 2 **ran**.

**Identifier-based dedup is impossible on 08-19.** `id` is `""` on 4411/4411. `sequence_number` is `0` on 4411/4411. Content-hash collapse of byte-identical rows is **not** used as the working tape: it makes trade count disagree with the vendor’s own `aggs n`. Working tape = **raw rows** (each row a print). Residual on that tape remains.

---

## 1. Truncation (unique-set gate)

P-SV12 named pull: 1 page, 4411 trades, `next_url` absent, not `max_pages`. Repeat `limit=50000`: identical.

| pull | pages | stopped | raw n | raw `sum(size)` | unique n | unique `sum(size)` |
|------|------:|---------|------:|----------------:|---------:|-------------------:|
| P-SV12 / repeat 50k | 1 | no `next_url` | 4411 | 14271 | **3561** | **12682** |
| `limit=1000` | 5 | no `next_url` | 4415 | 14277 | **3561** | **12682** |
| `limit=250` | 18 | no `next_url` | 4447 | 14401 | **3561** | **12682** |
| hourly 04–17 ET | 13 windows | each no `next_url` | 4412 | 14272 | — | — |

Unique key sets equal. Truncation loses trades. This unique set lost nothing. **Truncation ruled out.**

Raw `sum(size)` still moves with page size (in-page duplicates plus extra copies at page boundaries). That is not truncation.

---

## 3. Dedup key vs vendor identifier

### 3a. Key used in the first P-SV13 write

```
(sip_timestamp, size, price, tuple(conditions or []), exchange)
```

Quoted from `/tmp/svp-psv13/truncation-unique.json` / the continuation script’s `norm()`. Slim P-SV12 rows used the same fields under names `sip`, `size`, `price`, `c`, `x`.

### 3b. Per-trade identifier on 08-19 named

Full `limit=50000` payload, 4411 rows, `request_id=ee22c9b549b66e324eccbd35eaf6d8ff`, no `next_url`.

Fields present: `conditions`, `decimal_size`, `exchange`, `id`, `participant_timestamp`, `price`, `sequence_number`, `sip_timestamp`, `size`.

| field | nonempty | unique values |
|-------|----------:|--------------:|
| `id` | **0 / 4411** (all `""`) | 1 |
| `sequence_number` | 4411 / 4411 | **1** (all `0`) |
| `participant_timestamp` | 4411 | 3166 (same as `sip_timestamp`) |
| `exchange` | 4411 | 1 (all **302**) |
| `correction` | 0 | — (absent) |

**No usable per-trade identifier.** Re-dedup on `id` or `sequence_number` is a no-op: unique (`id`,`sequence_number`) pairs = **1**. Adding them to the content key leaves unique n at **3561**.

09-01 is a different payload: `sequence_number` is populated and unique (ATM call sample 2116609, 3156194, …; call_10 15247 trades / 15247 unique seq). `id` is still `""`. 08-19 named does not have that.

### 3c. Identifier-based recompute — cannot

n and `sum(size)` after identifier dedup = the raw tape, because every row shares `id=""` and `sequence_number=0`.

Raw named (working tape):

| slice | lots | n |
|-------|-----:|--:|
| total | **14271** | **4411** |
| pre-09:30 | **1444** | **485** |
| RTH 09:30–16:00 | **12827** | **3926** |

Content-hash unique (rejected as working tape; recorded):

| slice | lots | n |
|-------|-----:|--:|
| total | 12682 | 3561 |
| pre-09:30 | 1240 | 424 |
| RTH 09:30–16:00 | 11442 | 3137 |

`aggs n` = **3926** = raw RTH n. Unique n **3561** is **365 below** `aggs n`. Collapsing byte-identical rows is what creates that hole.

### 3d. One duplicate group, every field

Largest content-key group: **15 rows**, `sip` 2026-08-19T09:49:04.340 ET, size 1, price 1.92, conditions `[232]`, exchange 302. Indices 945–961 with three gaps; all 15 payloads:

```json
{
  "conditions": [232],
  "exchange": 302,
  "id": "",
  "participant_timestamp": 1787147344340000000,
  "price": 1.92,
  "sequence_number": 0,
  "sip_timestamp": 1787147344340000000,
  "size": 1,
  "decimal_size": "1.0"
}
```

**ALL ROWS == first. Fields that differ: none.** No unique id to tell copies from 15 indistinguishable 1-lot prints. Probe test “differ in ANY field → distinct” does **not** fire. Probe test “identical including a unique id → vendor duplicated” cannot fire: there is no unique id.

390 such groups on this page (max multiplicity 15). 221 `sip`-collision groups are full-row identical; 285 `sip`-collision groups **do** differ (almost always `size` / `decimal_size`) and were **not** collapsed by the content key.

**Correction to the previous write-up:** `raw RTH = 12827 = aggs` was computed on raw rows. It is **not** an artefact of the content-hash collapse (that collapse *removes* RTH lots, 12827 → 11442). It remains a raw-row identity: raw RTH lots **12827** and raw RTH n **3926** both equal the vendor daily bar. It is **not** signed as “airtight on two independent measures” of a deduplicated tape. Content-hash unique disagrees with `aggs n` by 365 trades / 1385 lots.

---

## Named contract — four numbers on the working tape (raw rows)

| | lots | n |
|--|-----:|--:|
| tape total | **14271** | 4411 |
| pre-RTH (sip < 09:30) | **1444** | 485 |
| RTH 09:30–16:00 | **12827** | 3926 |
| aggs `v` / `n` | **12827** | **3926** |
| archive@≤16:00 | **15757** | — |
| archive final | **15758** | — |

archive@≤16:00 − tape = **1486**. archive final − tape = **1487**. Residual remains. Section 2 ran.

---

## Partition — arithmetic, not evidence

`residual` was **defined** as `archive@≤16:00 − tape`, not independently measured. Then

`(archive − aggs) = pre-RTH + residual [+ Late 204]`

holds by construction when pre-RTH is taken from the same tape (Late = leftover of tape−aggs on 08-19 call_10). That line is **arithmetic**. It does not confirm a cause.

On the named contract the numbers still add: 2930 = 1444 + 1486.

| session | role | arch−aggs | pre-RTH lots (n) | residual lots (defined) | Late 204 |
|---------|------|----------:|-----------------:|------------------------:|---------:|
| 08-19 | atm_call | −12 | 813 (476) | **−825** | 0 |
| 08-19 | atm_put | +681 | 624 (333) | **+56** | 0 |
| 08-19 | call_10 | +4665 | 1527 (755) | **+2838** | 300 |
| 08-19 | **put_10** | **+2930** | **1444 (485)** | **+1486** | 0 |
| 08-19 | far_thin | 0 | 10 (6) | **−10** | 0 |
| 08-20 | atm_call | −975 | 74 (28) | **−1049** | 0 |
| 08-20 | atm_put | −482 | 1669 (704) | **−2151** | 0 |
| 08-20 | call_10 | +3854 | 890 (460) | **+2964** | 0 |
| 08-20 | put_10 | +594 | 1121 (342) | **−527** | 0 |
| 08-20 | far_thin | −18 | 2 (2) | **−20** | 0 |

n=10. Residual **not zero** on any. Sign mixed: **4 above tape, 6 below**. Largest unexplained positive: **08-20 call_10 +2964 lots**, not the named 1486. Named is not the worst case.

---

## 2. Residual timing, 09-01 five, `last_updated`

Working tape = raw rows. `archive − tape_at(t)` with `tape_at` = `sum(size)` of prints with `sip ≤` reconstructed snap `t`.

### 2c. `day.last_updated`

**Not retained.** Archive row keys on both walks: `strike, side, is_spot, ticker, mid, bid, ask, mid_source, volume, open_interest, delta, gamma, theta, vega, iv`. No `day` object, no `last_updated`. Named: **0 / 26515** present snaps. 08-20 call_10: **0 / 38159**.

### 2a. Named `O:SPXW260819P07655000` — not one jump

n_present 26515. Overnight archive sits at **2029** (prior session) while tape accretes; residual starts **+2029** at 00:00:11 ET with tape 0.

| clock ET | archive | tape | residual |
|----------|--------:|-----:|---------:|
| 04:00 | 2029 | 0 | +2029 |
| 09:00 | 2029 | 1289 | +740 |
| 09:30:00 | 2029 | 1444 | +585 |
| **09:31:06 roll** | **117** | 1561 | **−1444** |
| 09:32 | 117 | 1561 | −1444 |
| 09:50:09 | 4345 | 4260 | **+85** (first >0 after roll) |
| 10:00 | 6208 | 4863 | +1345 |
| ~10:53 | 11072 | 9585 | **+1487** |
| 15:59 | 15757 | 14270 | **+1487** |
| 16:05 / last | 15758 | 14271 | **+1487** |

09:31:06 is the day roll (archive 2029→117, residual +468→**−1444** = −pre-RTH). After the roll, residual is **negative** until 09:50:09, then **accretes** to **+1487 by ~10:53** and **plateaus** there the rest of the session (small wiggles, returns to 1487). **107** steps with \|Δ\|≥50; **1793** residual changes. Not a single +1486 print.

### 2a. Worst positive — 08-20 call_10 `O:SPXW260820C07690000`

n_present 38159, never absent. Overnight archive **567**. Roll 09:31:03: 567→186, residual −507→**−888**. First >0 after roll: **09:35:05** (+174). Then accretes: 10:00 **+2528**, 13:00 **+2592**, 15:00 **+2955**, 16:00 **+2964**. Stays positive from 09:36:05 through the close. **488** steps \|Δ\|≥50. Accretion, not one jump. Ends at the largest unexplained positive of the ten.

### 2b. P-SV11 five on 2026-09-01

Date-pull tapes. `id=""` on all. `sequence_number` **populated and unique** on the contracts checked (call_10: 15247 seq / 15247 trades). Pre-RTH window `timestamp.gte=04:00` / `lt=09:30`: **0 trades, 0 lots** on all five. First prints ~09:30 ET.

| role | ticker | tape lots (n) | archive ≤16:00 | archive final = aggs | residual final−tape | residual ≤16:00−tape |
|------|--------|--------------:|---------------:|---------------------:|--------------------:|---------------------:|
| ATM call | `O:SPXW260901C07635000` | **140664** (59298) | 139174 | **140664** | **0** | −1490 |
| ATM put | `O:SPXW260901P07635000` | **125339** (56042) | 125036 | **125339** | **0** | −303 |
| Call +10 | `O:SPXW260901C07685000` | **67863** (15247) | 60860 | **60864** | **−6999** | −7003 |
| Put −10 | `O:SPXW260901P07585000` | **24600** (8464) | 24599 | **24600** | **0** | −1 |
| Call +20 | `O:SPXW260901C07735000` | **6370** (1698) | 6370 | **6370** | **0** | 0 |

n=5. Residual at **close is zero on 4 of 5**. Those four: tape = aggs = archive final. The ≤16:00 negatives on ATM (−1490, −303) are the P-SV11 16:00–16:30 catch-up, not extra lots in `day.volume` versus the close tape.

Call +10 is the exception: tape **67863** vs aggs **60864**, unique `sequence_number` so these are not collapsed copies, residual **−6999** (tape *above* archive/aggs). 09-01 does **not** bound the unexplained extra to 08-19/08-20 only. It bounds *archive-above-tape at close* to those days for this five-contract sample, except this one 09-01 name which goes the other way.

---

## Pre-RTH fraction (ten + 09-01 five)

08-19/08-20 from P-SV12 raw date-pull. 09-01 pre-RTH **0 / 0** on all five (explicit 04:00–09:30 pull).

| session | role | pre-RTH lots | pre-RTH n | RTH lots | RTH n | pre / RTH |
|---------|------|-------------:|----------:|---------:|------:|----------:|
| 08-19 | atm_call | 813 | 476 | 29016 | 14313 | 2.80% |
| 08-19 | atm_put | 624 | 333 | 122945 | 53865 | 0.51% |
| 08-19 | call_10 | 1527 | 755 | 50279 | 19624 | 3.04% |
| 08-19 | put_10 | **1444** | **485** | **12827** | **3926** | **11.26%** |
| 08-19 | far_thin | 10 | 6 | 58 | 30 | 17.24% (10 / 58 / 6) |
| 08-20 | atm_call | 74 | 28 | 10203 | 4923 | 0.73% |
| 08-20 | atm_put | 1669 | 704 | 112083 | 45052 | 1.49% |
| 08-20 | call_10 | 890 | 460 | 74006 | 30797 | 1.20% |
| 08-20 | put_10 | 1121 | 342 | 6718 | 1883 | 16.69% |
| 08-20 | far_thin | 2 | 2 | 47 | 28 | 4.26% (2 / 47 / 2) |
| 09-01 | ATM call | **0** | **0** | 140664 | 59298 | 0 |
| 09-01 | ATM put | **0** | **0** | 125339 | 56042 | 0 |
| 09-01 | Call +10 | **0** | **0** | 67863 | 15247 | 0 |
| 09-01 | Put −10 | **0** | **0** | 24600 | 8464 | 0 |
| 09-01 | Call +20 | **0** | **0** | 6370 | 1698 | 0 |

n=15. SVP labelling (whether the profile counts pre-09:30) is not chosen here.

---

## What this run does not claim

- It does not close P-SV1 or lift the freeze.
- It does not sign the 1486 as vendor-side or Labs-side.
- It does not treat byte-identical 08-19 rows as proven copies or proven distinct prints. There is no id to settle it.
- It does not treat `arch − aggs = pre-RTH + residual` as evidence.
- It does not construct a sixth explanation. Mixed sign (4 above, 6 below on 08-19/08-20; 09-01 close residual 0 on four names and −6999 on one) is reported, not resolved.

---

## Source

- Named full trades: `/tmp/svp-psv13/named-full-trades.json` (`request_id=ee22c9b549b66e324eccbd35eaf6d8ff`)
- Unique-set gate: `/tmp/svp-psv13/truncation-unique.json`
- Gold walks: `/tmp/svp-psv13/svp-psv13-walk-named.json`, `svp-psv13-walk-c10.json`
- 09-01 five: `/tmp/svp-psv13/psv11-five-tapes.json`, `psv11-five-prerth.json`
- Endpoint: `GET /v3/trades/{optionsTicker}`
