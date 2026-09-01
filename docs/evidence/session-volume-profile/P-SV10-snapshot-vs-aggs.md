# P-SV10 — Massive snapshot `day.volume` vs aggregates / open-close

**Probe request 6.** Blocks P-SV1 / `svp_v1` freeze / Hotel.  
**When:** 2026-08-31 23:40–23:42 ET (`market_status: closed`). Static. **No archive. No generation-builder investigation.**  
**Reference session:** 2026-08-31.  
**Contracts:** live dated expiration **2026-09-04** (Friday weekly; a few days after 08-31). Spot I:SPX **7686.14**.

Snapshot `day` is documented as *“The most recent daily bar for this contract.”*  
`chain_ladder.py` copies `day.volume` (else `row.volume`) with no math.

---

## Part A — five SPX 2026-09-04 contracts

Pulled at one moment. Strike window `7550–7850` so ATM is actually ATM (an unfiltered `sort=ticker` page starts at strike 3200).

| role | ticker | strike | snapshot `day.volume` | aggs `v` (2026-08-31) | open-close `volume` | snapshot − aggs | % |
|------|--------|--------|------------------------|------------------------|---------------------|-----------------|---|
| atm_call | O:SPXW260904C07685000 | 7685 | **466** | **466** | **466** | **0** | 0.00% |
| atm_put | O:SPXW260904P07685000 | 7685 | **617** | **627** | **627** | **−10** | **−1.59%** |
| call_10 | O:SPXW260904C07735000 | 7735 | **267** | **267** | **267** | **0** | 0.00% |
| put_10 | O:SPXW260904P07635000 | 7635 | **154** | **154** | **154** | **0** | 0.00% |
| call_20 | O:SPXW260904C07785000 | 7785 | **483** | **483** | **483** | **0** | 0.00% |

Aggs `request_id`s: `b343e33252c1c1425cd76b4e701ba6e0`, `fa7b0634626a38e9de78233474490aa0`, `e4445c246b8651bc8a160dff25780f6f`, `19364e451f7461c32f16b7e6643973c2`, `c4f621e51ab96d39a351c1240f4368fa`.

### Verbatim `day` objects (dedicated contract snapshot)

**ATM call** `O:SPXW260904C07685000`

```json
{
  "change": -16,
  "change_percent": -27.7,
  "close": 41.66,
  "high": 44.26,
  "last_updated": 1788208442086000000,
  "low": 30.1,
  "open": 44.25,
  "previous_close": 57.69,
  "volume": 466,
  "vwap": 35.6972
}
```

Aggs same session: `{"v": 466, "vw": 35.6972, "o": 44.25, "c": 41.66, "h": 44.26, "l": 30.1, "t": 1788148800000, "n": 208}`. Open-close `volume: 466`.

**ATM put** `O:SPXW260904P07685000` — the disagreeing row

```json
{
  "change": 2.6,
  "change_percent": 8.862,
  "close": 31.94,
  "high": 45.9,
  "last_updated": 1788207182049000000,
  "low": 29.93,
  "open": 35.32,
  "previous_close": 29.34,
  "volume": 617,
  "vwap": 37.6002
}
```

Aggs: `{"v": 627, "vw": 37.5508, "o": 35.32, "c": 31.94, "h": 45.9, "l": 29.93, "t": 1788148800000, "n": 210}`. Open-close `volume: 627`.  
Snapshot has **no `n`**. Aggs `n=210`. VWAP 37.6002 vs 37.5508.

**Call +10** `O:SPXW260904C07735000`

```json
{
  "change": -15.3,
  "change_percent": -46.6,
  "close": 17.53,
  "high": 19.76,
  "last_updated": 1788207002058000000,
  "low": 11.59,
  "open": 19.05,
  "previous_close": 32.83,
  "volume": 267,
  "vwap": 14.4322
}
```

Aggs `v=267` `n=122` `vw=14.4322`. Open-close 267.

**Put −10** `O:SPXW260904P07635000`

```json
{
  "change": 0.37,
  "change_percent": 2.27,
  "close": 16.67,
  "high": 26,
  "last_updated": 1788206822053000000,
  "low": 15.49,
  "open": 18.68,
  "previous_close": 16.3,
  "volume": 154,
  "vwap": 21.1274
}
```

Aggs `v=154` `n=83`. Open-close 154.

**Call +20** `O:SPXW260904C07785000`

```json
{
  "change": -6.12,
  "change_percent": -54.1,
  "close": 5.2,
  "high": 6.6,
  "last_updated": 1788206942112000000,
  "low": 3.2,
  "open": 6.6,
  "previous_close": 11.32,
  "volume": 483,
  "vwap": 4.735
}
```

Aggs `v=483` `n=151`. Open-close 483.

`day` fields present on all five: `change`, `change_percent`, `close`, `high`, `last_updated`, `low`, `open`, `previous_close`, `volume`, `vwap`. **No session marker, no trade-count, no condition flags.**

### Part A outcome

**Snapshot < aggs, or mixed sign.**

Four of five: snapshot == aggs == open-close.  
One of five (ATM **put**): snapshot **617 < 627** aggs/open-close (**−10 / −1.59%**).

That is **not** “snapshot > aggs on the wings, ≈ equal at ATM.”  
That is **not** “snapshot == aggs on every contract.”

Stop here. No story.

(Aggs and open-close agreed on all five SPX names.)

---

## Part B — vendor inclusion rules (published; not a support ticket)

**Asked via Massive’s own Conditions API and knowledge-base article.** No human reply. That is the answer quality.

### Knowledge base (verbatim gist, article “How does Massive create the OHLCV aggregate bars?”)

> Massive uses the “Sale Conditions” attached to each trade to determine if that trade is eligible to update the aggregate.  
> You can use the Conditions endpoint to answer this question.  
> The same concept applies to Options data as well.  
> Massive currently only offers aggregates for the “consolidated” feed … so only the consolidated rules apply.  
> OPRA … guidelines apply primarily to daily bars. Because we publish minute aggregates, for such data there are slight differences: in particular, trades in extended-hours markets can update OHLC for minute bars.

The article **does not mention snapshot `day.volume`.** It does not say whether snapshot uses a different inclusion set than daily/minute aggregates.

### `GET /v3/reference/conditions?asset_class=options&data_type=trade&limit=1000`

HTTP 200, `count=33`, `request_id=8b362c78b5473ff9ba6ea3cef06fdfbd`.

Every **Multi Leg** / **Stock Options** (combo) condition in the table has consolidated `updates_volume: true`:

| id | name | updates_volume | updates_high_low | updates_open_close |
|----|------|----------------|------------------|--------------------|
| 232 | Multi Leg auto-electronic trade | true | true | true |
| 233 | Multi Leg Auction | true | true | true |
| 234 | Multi Leg Cross | true | true | true |
| 235 | Multi Leg floor trade | true | true | true |
| 236 | Multi Leg auto-electronic trade against single leg(s) | true | true | true |
| 238 | Multi Leg Auction against single leg(s) | true | true | true |
| 239 | Multi Leg floor trade against single leg(s) | true | true | true |
| 246 | Multi Leg Floor Trade of Proprietary Products | true | **false** | **false** |
| 247 | Multilateral Compression Trade of Proprietary Products | true | **false** | **false** |
| 248 | Extended Hours Trade | true | false | false |

Canceled / late / out-of-sequence (201–207 except 208) have `updates_volume: false`.

**No condition in this table is documented as “snapshot only” vs “aggregates only.”** Multi-leg prints are **in** the published aggregate volume rules.

Option-chain snapshot docs: `results[].day` = “The most recent daily bar for this contract.” That sentence does not distinguish it from `/v2/aggs` daily bars. The ATM-put row above is a counterexample to treating those two as the same number.

---

## Part C — SPY 2026-09-04 (discriminator only)

Spot 767.05. Same roles. **Hint, not a proof.**

| role | ticker | strike | snapshot | aggs | open-close | Δ | % |
|------|--------|--------|----------|------|------------|---|---|
| atm_call | O:SPY260904C00767000 | 767 | **9981** | **9671** | 9671 | **+310** | **+3.21%** |
| atm_put | O:SPY260904P00767000 | 767 | **4608** | **4479** | 4479 | **+129** | **+2.88%** |
| call_10 | O:SPY260904C00777000 | 777 | **5435** | **5392** | 5392 | **+43** | **+0.80%** |
| put_10 | O:SPY260904P00757000 | 757 | **1128** | **1124** | 1124 | **+4** | **+0.36%** |
| call_20 | O:SPY260904C00787000 | 787 | **803** | **803** | 803 | **0** | 0.00% |

ATM call `day` (verbatim):

```json
{
  "change": -1.63,
  "change_percent": -28.4,
  "close": 4.11,
  "high": 4.55,
  "last_updated": 1788207242094000000,
  "low": 3.04,
  "open": 4.32,
  "previous_close": 5.74,
  "volume": 9981,
  "vwap": 3.5855
}
```

Aggs: `v=9671`, `vw=3.5717`, `n=1978`.

On this SPY sample, snapshot **≥** aggs, **larger at ATM than at the wing**, **not** the P-SV8 SPX “wings high” shape. Discriminator only.

---

## Named outcome (Part A)

**Mixed sign.** One SPX contract snapshot < aggs; four equal. Not the two-inclusion-set confirmation. Not snapshot==aggs on every contract. Not a Labs generation-builder finding from this probe.
