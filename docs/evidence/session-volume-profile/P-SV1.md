# P-SV1 — the volume field (Session Option Volume Profile)

**Probe:** Spec v0.2 §13 P-SV1 (blocking for SVP0)  
**Host:** StudioOne; JSON analysis on **`/tmp/svp-probe` copies** after `cp` off gold  
**Day / book:** 2026-08-28 SPX 0DTE (`expiration=2026-08-28`)  
**Contract:** `O:SPXW260828C07735000` — SPXW 7735 call (ATM at 10:00 ET; `strike=7735`, `side=call`)  
**When:** 2026-08-31 20:44–20:51 ET  
**Safety:** no gold writes; dash not bounced; no Massive. Full-day `open()` of 23 830 SPX files was **not** run on gold. Four-point + open/close used copied files. Non-monotonic scan used **40 RTH samples** (every 182nd RTH snap) copied to `/tmp`.

`t` is reconstructed from the filename clock inside the NY session window, never by filename sort alone.

---

## Verdict

| Question | Observation |
|----------|-------------|
| Field path | **`generation.rows[].volume`** (integer). Sibling fields on the same object: bid, ask, mid, mid_source, delta, gamma, theta, vega, iv, open_interest, side, strike, ticker, is_spot. **No nested `day.volume`.** Envelope `generation.fields` includes `'volume'` |
| Four-point 10:00 / 12:00 / 14:00 / 15:55 ET | **4877 → 24748 → 56794 → 77002**, monotonically rising |
| Cumulative vs interval? | After ~09:38 ET the sampled series **rises for the rest of RTH** and **holds after 16:00**. That is **cumulative through the afternoon**. It is **not** a per-interval count (those four deltas are thousands of contracts, not a 2 s print count) |
| Open | Does **not** start at 0. Pre-open 09:24:58 and 09:30:02 both **`volume=4433`**. Quotes at 09:30 are null (`mid_source=last_trade`) |
| Non-monotonic | **Yes.** Same ticker: **09:30:02 `volume=4433` → 09:38:54 `volume=1886`** (Δ **−2547**). Then 09:48:28 = **3391**. SV3’s clamp is not theoretical on this fixture |
| Next day | Archive is **0DTE-only**. 2026-08-31 snaps have `expiration=2026-08-31` and tickers `O:SPXW260831C…`. **`O:SPXW260828C07735000` is absent** (not reset to 0) |
| Contract timestamp | **None.** No last_quote / last_trade / as_of on the row. Bucket attribution is **`generation.as_of`** (and envelope `captured_at`). At 10:00 they differ by **~0.145 s** |
| Independent daily recon | **Closed 2026-08-31 (probe 2, Massive).** Vendor daily `v` = **76997**. Archive last snap (19:59:59 ET) = **77427**. Raw difference **+430**. 15:55 ET archive **77002 − 76997 = +5**. See §7 below. |

---

## 1. Field card

**File:** `/tmp/svp-probe/spx-2026-08-28/snap-140004073Z.json`  
copied from  
`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-08-28/chain/SPX/snap-140004073Z.json`

Envelope keys: `captured_at`, `chain_cadence`, `chain_cadence_s`, `expiration`, `generation`, `greek_count`, `hole`, `iv_count`, `phase`, `provenance`, `row_count`, `symbol`, `topic`.

`captured_at`: `2026-08-28T10:00:04.073036-04:00`  
`generation.as_of`: `2026-08-28T14:00:03.928524Z`  
`fetched_at_unix`: `1787925603.928565`

**Verbatim contract object:**

```json
{
  "ask": 19.2,
  "bid": 16.5,
  "delta": 0.5163546212750041,
  "gamma": 0.009508997183991348,
  "is_spot": true,
  "iv": 0.1636793871337458,
  "mid": 17.85,
  "mid_source": "nbbo",
  "open_interest": 1110,
  "side": "call",
  "strike": 7735.0,
  "theta": -21.283267307257884,
  "ticker": "O:SPXW260828C07735000",
  "vega": 1.033707058596182,
  "volume": 4877
}
```

**Shows:** volume is a first-class integer on the ladder row. OI sits beside it. Greeks are on the row even though `fields` lists only `delta` among greeks. No per-contract timestamp.

---

## 2. Decisive test — same contract, four times, same day

Ordered by reconstructed `t`. Same ticker `O:SPXW260828C07735000`.

| label | captured_at (ET) | generation.as_of | volume | open_interest |
|-------|------------------|------------------|--------|---------------|
| t1000 | 2026-08-28T10:00:04.073036-04:00 | 2026-08-28T14:00:03.928524Z | **4877** | 1110 |
| t1200 | 2026-08-28T12:00:02.124041-04:00 | 2026-08-28T15:59:57.008672Z | **24748** | 1110 |
| t1400 | 2026-08-28T14:00:01.755182-04:00 | 2026-08-28T18:00:00.792910Z | **56794** | 1110 |
| t1555 | 2026-08-28T15:55:01.233153-04:00 | 2026-08-28T19:54:56.926964Z | **77002** | 1110 |

Deltas between those four: **+19871, +32046, +20208**.

**Shows:** these four reads **increase**. They are not a small interval volume. OI is **unchanged** (1110) across the session in every copied snap — consistent with overnight OI, not with volume.

---

## 3. Open behaviour

Same ticker, files around 09:30 ET:

| label | captured_at | volume | bid | ask | mid_source |
|-------|-------------|--------|-----|-----|------------|
| preopen | 2026-08-28T09:24:58.081250-04:00 | **4433** | (see JSON) | | |
| preopen2 | 2026-08-28T09:25:05.263363-04:00 | **4433** | | | |
| pre_0930 | 2026-08-28T09:29:59.955308-04:00 | **4433** | null | null | last_trade |
| open | 2026-08-28T09:30:02.387893-04:00 | **4433** | null | null | last_trade |

**Verbatim at 09:29:59.955 and 09:30:02.387** (identical contract body):

```json
{
  "ask": null,
  "bid": null,
  "delta": 0.4659831165570358,
  "gamma": 0.009705243267410046,
  "is_spot": false,
  "iv": 0.15491697374212857,
  "mid": 14.6,
  "mid_source": "last_trade",
  "open_interest": 1110,
  "side": "call",
  "strike": 7735.0,
  "theta": -19.427800789822417,
  "ticker": "O:SPXW260828C07735000",
  "vega": 1.0600136096954018,
  "volume": 4433
}
```

**Shows:** first snapshots after 09:30 are **not 0**. Pre-open already carries **4433**. Quotes are absent at the bell (`bid`/`ask` null).

---

## 4. Non-monotonic events

40 RTH samples (step 182 through 7287 RTH files), same ticker, reconstructed `t` order. **One decrease:**

**Pair (verbatim):**

`snap-133002387Z.json` `captured_at=2026-08-28T09:30:02.387893-04:00` `as_of=2026-08-28T13:29:58.138207Z`  
`volume=4433`

`snap-133854251Z.json` `captured_at=2026-08-28T09:38:54.251932-04:00` `as_of=2026-08-28T13:38:49.747995Z`  
`volume=1886`

```json
{
  "ask": 19.2,
  "bid": 19.0,
  "delta": 0.549641234002744,
  "gamma": 0.009756483581001287,
  "is_spot": false,
  "iv": 0.1541604480633413,
  "mid": 19.1,
  "mid_source": "nbbo",
  "open_interest": 1110,
  "side": "call",
  "strike": 7735.0,
  "theta": -19.449105728608988,
  "ticker": "O:SPXW260828C07735000",
  "vega": 1.051315522251043,
  "volume": 1886
}
```

Next sample 09:48:28.442: `volume=3391` (rising again). From 09:38 through 15:49 the 39 remaining samples are non-decreasing.

After 16:00:

```
rth_last     2026-08-28T15:59:50.954965-04:00  volume=77395
after_close  2026-08-28T16:00:05.049395-04:00  volume=77427
session_last 2026-08-28T19:59:59.158487-04:00  volume=77427
```

**Shows:** at least one **downward revision** of 2547 contracts in the first 9 minutes of RTH on this contract. Later RTH is rising; post-close is flat. **Full 23 830-file consecutive scan was not run** (gold `open()` stall risk). `revision_count` is **not** a stored field on the snap; it would be computed by a writer.

---

## 5. Next-day behaviour

Archive law: one listed expiration per symbol per NY date = **that session’s 0DTE**.

Following trading day **2026-08-31** (08-29/30 are weekend folders). Copied:

- `snap-040007991Z.json` captured `2026-08-31T00:00:07.991010-04:00` exp **2026-08-31** n_rows 62  
  sample tickers `O:SPXW260831C07785000`, `O:SPXW260831P07785000`, `O:SPXW260831C07780000`  
  **yesterday_ticker False**
- `snap-133000166Z.json` captured `2026-08-31T09:30:00.166355-04:00` exp **2026-08-31**  
  **yesterday_ticker False**
- `snap-133002577Z.json` captured `2026-08-31T09:30:02.577840-04:00`  
  **yesterday_ticker False**

**Shows:** `O:SPXW260828C07735000` does **not** appear the next session. It does not reset to 0; the **contract is gone** with the expiration. Session boundary is detectable as **absence**, not a zeroed cumulative.

---

## 6. Timestamp alignment

Contract keys at 10:00 ET:

```
['ask', 'bid', 'delta', 'gamma', 'is_spot', 'iv', 'mid', 'mid_source', 'open_interest', 'side', 'strike', 'theta', 'ticker', 'vega', 'volume']
```

Row timestamp-like keys: **none**.

```
captured_at        2026-08-28T10:00:04.073036-04:00
generation.as_of   2026-08-28T14:00:03.928524Z
fetched_at_unix    1787925603.928565
```

`as_of` 14:00:03.928524Z = 10:00:03.928524-04:00. **captured_at − as_of ≈ 0.145 s.**

At the open, captured_at 09:30:02.387893-04:00 vs as_of 13:29:58.138207Z (= 09:29:58.138-04:00): **~4.25 s** (generation reused across the 09:29:59 and 09:30:02 files — identical `as_of` and identical contract JSON).

**Shows:** volume can be attributed to a 1-minute bucket only as honestly as **`generation.as_of`**. There is no independent quote/trade time on the contract. Two envelope files can share one generation.

---

## 7. Reconciliation (closed 2026-08-31 — Massive)

Contract `O:SPXW260828C07735000`, session 2026-08-28.

Archive clocks already on this page:

| clock | archive `generation.rows[].volume` |
|-------|--------------------------------------|
| 15:55:01 ET | 77002 |
| last RTH 15:59:50 ET | 77395 |
| 16:00:05 ET | 77427 |
| last snap 19:59:59 ET | **77427** |

**Commands (StudioTwo, `api.massive.com`, key from env, not printed):**

```
GET /v2/aggs/ticker/O:SPXW260828C07735000/range/1/day/2026-08-28/2026-08-28?adjusted=true
GET /v1/open-close/O:SPXW260828C07735000/2026-08-28
GET /v3/snapshot/options/SPX/O:SPXW260828C07735000
```

**Aggs verbatim:**

```
HTTP 200
{"ticker":"O:SPXW260828C07735000","queryCount":1,"resultsCount":1,"adjusted":true,"results":[{"v":76997,"vw":6.6189,"o":18.3,"c":0.03,"h":38.2,"l":0.01,"t":1787889600000,"n":32184}],"status":"OK","request_id":"38b240bf3b0d3b82c95560e5829bfccc","count":1}
```

**Open-close verbatim:**

```
HTTP 200
{"status":"OK","from":"2026-08-28","symbol":"O:SPXW260828C07735000","open":18.3,"high":38.2,"low":0.01,"close":0.03,"volume":76997,"afterHours":0.03,"preMarket":18.3}
```

**Live snapshot:** HTTP 404 `{"status":"ERROR",...,"error":"Options contract not found."}` (contract expired).

| source | volume | archive − vendor |
|--------|--------|------------------|
| Massive aggs `results[0].v` | **76997** | — |
| Massive open-close `volume` | **76997** | — |
| Archive 15:55:01 ET | 77002 | **+5** |
| Archive last RTH 15:59:50 ET | 77395 | **+398** |
| Archive last snap 19:59:59 ET | 77427 | **+430** |

**Shows:** vendor daily figure is **76997** (aggs and open-close agree). The 15:55 archive read is **5** contracts above that. The last snapshot on disk is **430** above. Numbers are raw; not rounded to “matches.”

---

## Copy / command trail (StudioOne)

Gold reads: `ls` of store root; `ls` / `wc` of `day=2026-08-28/chain/SPX`; `cp` of 34 named snaps + 40 sampled RTH snaps + 3 files from 08-31; sidecar JSON `COUNTS` / `CADENCE` / `PROVENANCE` / `STATS`. Analysis: `python3` against `/tmp/svp-probe` only after copy.

`du` of gold trees: **stalled** (see P-SV4). That did not block this field probe.
