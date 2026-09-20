# P-SV16 — Filter the tape by `updates_volume`

**Probe request 12.** Authority: P-SV15.  
**When:** 2026-09-01.

**Status unchanged:** P-SV1 stays open. Freeze stays. Hotel stays blocked.

Read-only. Every ineligible lot is tagged with a condition code (or `empty[]`).

Raw JSON: `/tmp/svp-psv16/fifteen.json`, `conditions-33.json`.

---

## 0. Capture fix is on `main`

`feat(ssr): persist vendor day.last_updated on chain generation rows` — **`3801c0d`**, pushed to `origin/main`. `chain_ladder.py` + test. **Tap not restarted.** New snaps still omit `last_updated` until a separate restart.

---

## 1a. All 33 option trade conditions (consolidated)

`GET /v3/reference/conditions?asset_class=options&data_type=trade&limit=1000`  
P-SV10 `request_id=8b362c78b5473ff9ba6ea3cef06fdfbd` (count=33). Re-read P-SV12 `request_id=79a6998f4b59a493579826025b582b42` (same 33 rows, same flags).

**209 and 227 first** (most frequent codes on these tapes after empty/`[]`):

| id | abbr | name | updates_volume | updates_high_low | updates_open_close |
|----|------|------|----------------|------------------|--------------------|
| **209** | AUTO | Automatic Execution | **true** | true | true |
| **227** | SLAN | Single Leg Auction Non ISO | **true** | true | true |

Full 33:

| id | abbr | name | vol | hl | oc |
|----|------|------|-----|----|----|
| 201 | CANC | Canceled | **false** | false | false |
| 202 | OSEQ | Late and Out Of Sequence | **false** | false | false |
| 203 | CNCL | Last and Canceled | **false** | false | false |
| 204 | LATE | Late | **false** | false | false |
| 205 | CNCO | Opening Trade and Canceled | **false** | false | false |
| 206 | OPEN | Opening Trade, Late, and Out Of Sequence | **false** | false | false |
| 207 | CNOL | Only Trade and Canceled | **false** | false | false |
| 208 | OPNL | Opening Trade and Late | true | true | true |
| 209 | AUTO | Automatic Execution | true | true | true |
| 210 | REOP | Reopening Trade | true | true | true |
| 219 | ISOI | Intermarket Sweep Order | true | true | true |
| 227 | SLAN | Single Leg Auction Non ISO | true | true | true |
| 228 | SLAI | Single Leg Auction ISO | true | true | true |
| 229 | SLCN | Single Leg Cross Non ISO | true | true | true |
| 230 | SLCI | Single Leg Cross ISO | true | true | true |
| 231 | SLFT | Single Leg Floor Trade | true | true | true |
| 232 | MLET | Multi Leg auto-electronic trade | true | true | true |
| 233 | MLAT | Multi Leg Auction | true | true | true |
| 234 | MLCT | Multi Leg Cross | true | true | true |
| 235 | MLFT | Multi Leg floor trade | true | true | true |
| 236 | MESL | Multi Leg auto-electronic trade against single leg(s) | true | true | true |
| 237 | TLAT | Stock Options Auction | true | true | true |
| 238 | MASL | Multi Leg Auction against single leg(s) | true | true | true |
| 239 | MFSL | Multi Leg floor trade against single leg(s) | true | true | true |
| 240 | TLET | Stock Options auto-electronic trade | true | true | true |
| 241 | TLCT | Stock Options Cross | true | true | true |
| 242 | TLFT | Stock Options floor trade | true | true | true |
| 243 | TESL | Stock Options auto-electronic trade against single leg(s) | true | true | true |
| 244 | TASL | Stock Options Auction against single leg(s) | true | true | true |
| 245 | TFSL | Stock Options floor trade against single leg(s) | true | true | true |
| 246 | CBMO | Multi Leg Floor Trade of Proprietary Products | true | **false** | **false** |
| 247 | MCTP | Multilateral Compression Trade of Proprietary Products | true | **false** | **false** |
| 248 | EXHT | Extended Hours Trade | true | **false** | **false** |

`updates_volume: false` is **only 201–207**. 208 and everything 209+ is true. 209 AUTO and 227 SLAN are **eligible**.

Codes actually on the P-SV12/15 tapes: **209, 227, 232, 233, 236**, plus **204** (Late) and **empty `[]`**. 219/231/239/246 appear in small size on some 08-20/09-01 rows; all of those have `updates_volume: true`.

---

## 1b. Empty `conditions` array

**Undocumented.**

- Conditions API: 33 named ids. No row for “no condition” / omitted array.
- KB article used in P-SV10 (“How does Massive create the OHLCV aggregate bars?”): eligibility is “Sale Conditions attached to each trade”; if **all** listed conditions qualify, include; if **any** is NO, exclude. It does not mention a missing or empty `conditions` field. It says the same concept applies to options. It does not mention snapshot `day.volume`.
- Polygon “Understanding Trade Eligibility” (stocks CTA/UTP): same all-yes / any-NO rule. No empty-array case.
- Trades API sample includes a trade **without** a `conditions` key (`exchange` 46, size 1). Schema marks `conditions` optional.

This probe does **not** assume empty is eligible. `tape_eligible` = lots whose conditions are non-empty **and** all have `updates_volume: true`. Empty lots are in `tape_ineligible`, broken out as `empty[]`.

---

## 2a. 09-01 Call +10 — the 10:37–10:38 minute, first

Step: `t_prev` 10:37:07.466 ET → `t_step` 10:38:08.197 ET. Archive +161, raw tape **7163**, gap −7002, **105 trades**.

| conditions | name | updates_volume | n trades | lots |
|------------|------|----------------|---------:|-----:|
| **[204]** | **Late** | **false** | **8** | **6999** |
| [209] | Automatic Execution | true | 49 | 72 |
| [232] | Multi Leg auto-electronic | true | 13 | 39 |
| [233] | Multi Leg Auction | true | 16 | 30 |
| [236] | Multi Leg vs single leg(s) | true | 14 | 18 |
| [227] | Single Leg Auction Non ISO | true | 5 | 5 |

Eligible in that minute: **164 lots / 97 trades**. Ineligible: **6999 lots / 8 trades**, all **204 Late**, all exchange 302, all within **10:37:36.149–.210 ET**, unique `sequence_number`s:

| sip ET | size | seq |
|--------|-----:|----:|
| 10:37:36.149938 | 3000 | 635259717 |
| 10:37:36.208944 | 200 | 635260354 |
| 10:37:36.209145 | 500 | 635260362 |
| 10:37:36.209376 | 500 | 635260370 |
| 10:37:36.209606 | 500 | 635260372 |
| 10:37:36.209861 | 500 | 635260375 |
| 10:37:36.210077 | 1499 | 635260377 |
| 10:37:36.210303 | 300 | 635260380 |

**6999 = the −6999 residual.** All-day 204 on this contract is exactly these 8 trades / 6999 lots. Other 09-01 four contracts: **0** lots of 204, **0** empty.

Filter **closes 09-01 Call +10**: `tape_eligible` 60864 = aggs = archive final. Residual_eligible **0**. The raw tape was the wrong comparator.

---

## 2. Fifteen contracts — raw vs eligible

`tape_eligible` = `updates_volume: true` only (non-empty). Residual vs archive **≤16:00** on 08-19/08-20 (the +22.84% clock); vs archive **final** on 09-01.

| session | role | tape_raw | tape_eligible | ineligible (by code) | aggs | arch ≤16:00 | arch final | residual_raw | residual_eligible |
|---------|------|---------:|--------------:|----------------------|-----:|------------:|-----------:|-------------:|------------------:|
| 08-19 | atm_call | 29830 | 29017 | empty[] **813** (476 tr) | 29017 | 29005 | 30451 | −825 | **−12** |
| 08-19 | atm_put | 123569 | 122945 | empty[] **624** (333) | 122944 | 123625 | 127217 | +56 | **+680** |
| 08-19 | call_10 | 51806 | 49979 | empty[] 1527; **204 Late 300** (9 tr) | 49979 | 54644 | 54646 | +2838 | **+4665** |
| 08-19 | **put_10** | 14271 | 12827 | empty[] **1444** (485) | 12827 | 15757 | 15758 | **+1486** | **+2930** |
| 08-19 | far_thin | 68 | 58 | empty[] 10 (6) | 58 | 58 | 58 | −10 | **0** |
| 08-20 | atm_call | 10277 | 10203 | empty[] 74 (28) | 10203 | 9228 | 10236 | −1049 | **−975** |
| 08-20 | atm_put | 113752 | 112083 | empty[] 1669 (704) | 112083 | 111601 | 115318 | −2151 | **−482** |
| 08-20 | call_10 | 74896 | 74006 | empty[] 890 (460) | 74006 | 77860 | 77860 | +2964 | **+3854** |
| 08-20 | put_10 | 7839 | 6718 | empty[] 1121 (342) | 6718 | 7312 | 7312 | −527 | **+594** |
| 08-20 | far_thin | 49 | 47 | empty[] 2 (2) | 47 | 29 | 49 | −20 | **−18** |
| **09-01** | **call_10** | 67863 | **60864** | **204 Late 6999** (8 tr) | **60864** | 60860 | 60864 | **−6999** | **0** |
| 09-01 | atm_call | 140664 | 140664 | — | 140664 | 139174 | 140664 | 0 | **0** |
| 09-01 | atm_put | 125339 | 125339 | — | 125339 | 125036 | 125339 | 0 | **0** |
| 09-01 | put_10 | 24600 | 24600 | — | 24600 | 24599 | 24600 | 0 | **0** |
| 09-01 | call_20 | 6370 | 6370 | — | 6370 | 6370 | 6370 | 0 | **0** |

`tape_eligible` = aggs on 14/15 (08-19 atm_put 122945 vs 122944, 1 lot).

### Sign split (n=15)

| | + | − | 0 | min | max |
|--|--:|--:|--:|----:|----:|
| residual_raw | 4 | 7 | 4 | −6999 | +2964 |
| residual_eligible | 5 | 4 | 6 | −975 | +4665 |

**Not single-signed.**

By date:

| set | raw +/−/0 | eligible +/−/0 |
|-----|-----------|----------------|
| 09-01 five | 0 / 1 / **4** | **0 / 0 / 5** |
| 08-19/08-20 ten | 4 / 6 / 0 | 5 / 4 / 1 |

**Closes 09-01. Worsens 08-19.** Named put_10 residual_raw **+1486** → residual_eligible **+2930** (empty pre-RTH 1444 no longer counted in the tape). 08-19 call_10 +2838 → +4665. 08-20 call_10 +2964 → +3854. 08-19 far_thin goes to 0.

---

## 3. From P-SV15 — record, do not explain

- 09-01 rolls do **not** land on RTH-so-far (misses **−24 / −39 / −20 / −2**). The clean 08-19 identity (117 = 1561 − 1444) does not generalise.
- Afternoon net-zero is **not** universal: ATM put **−76**, ATM call **−405** on 09-01. The 08-19 afternoon-clean finding does not generalise.
- Zero-trade archive moves appear on 09-01 too (Call +20 has **12**). Not specific to the anomalous days.

None of these is a candidate mechanism.

---

## What the filter does and does not

- **09-01:** closes. Call +10 −6999 is **8 Late prints / 6999 lots** at 10:37:36. Eligible tape = aggs = archive final on all five.
- **08-19/08-20:** does **not** close. Removing empty `[]` (pre-RTH) and 204 Late **increases** archive-high residuals on the named wing and the other high-side names. Sign stays mixed (5 above, 4 below, 1 zero).
- Empty `[]` is undocumented. It is the entire ineligible mass on 08-19/08-20 except 300 lots of 204 on 08-19 call_10.

No sixth explanation.

---

## Source

- Conditions: P-SV10 + `/tmp/svp-psv16/conditions-33.json`
- Fifteen: `/tmp/svp-psv16/fifteen.json`
- 10:37 minute: `/tmp/svp-psv15/tape-call_10.json`
- Capture: `3801c0d` on `main`
