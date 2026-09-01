# P-SV11 — live 0DTE three-way: source vs tap vs aggregates

**Probe request 7.** Blocks P-SV1 / `svp_v1` freeze / Hotel.  
**Session:** Tuesday **2026-09-01** RTH. Today's 0DTE SPXW.  
**Source:** raw HTTPS to `api.massive.com` from StudioTwo (`urllib`, User-Agent `FatTail-Labs-svp-probe-psv11/1.0`). **Not** `MassiveClient`.  
**Tap:** read-only gold on StudioOne, `day=2026-09-01/chain/SPX`. Reconstructed `t` from filename inside the NY window.  
**Constraints held:** no gold write; tap not restarted or reconfigured; extra Massive load limited to the three instants plus the 13:00 ATM-call repeat plus the 16:30 aggs/open-close set.

Raw capture JSON: `/tmp/svp-psv11/` (`tickers.json`, `instant-1100.json`, `instant-1300.json`, `instant-1545.json`, `after-close.json`, `*-rebracket.json`).

The immediate tap “after” was often not on disk yet at request time (tap ~2.4 s). Bracket numbers below are the **re-bracket after catch-up** (~1–2 min later) against the original request timestamps. Immediate files are kept; they are not the comparison.

---

## Outcome row

**Row 3 — Direct ≈ tap ≈ aggs. Today does not reproduce the 08-19 / 08-20 archive-high discrepancy.**

| Clause | Today |
|--------|-------|
| Direct inside tap bracket at 11:00, 13:00, 15:45 | **Yes** on every in-band contract — exact equality, not a range. Call +20 is absent from `wings=15` bracket files; every nearby `wings=25` snap that holds the ticker matches the snapshot exactly. |
| Direct and tap **exceed** aggs after the close | **No.** At 16:30, tap final = aggs = open-close on all five. |
| Direct ≈ tap ≈ aggs | **Yes**, at the 16:30 pull. |

Intra-day, the tap is a faithful copy of snapshot `day.volume`. After the close, that number equals the vendor daily bar. The 08-19/08-20 pattern (archive thousands of lots **above** vendor at ≤16:00 on 10-strike-out names) did not appear on this session.

Per the probe table, next step for those historical days is **those days' conditions**, not the general path. No generation-builder investigation from this run.

---

## Frozen contracts

Picked **2026-09-01T09:39:50.508713-04:00**, after 09:35. Spot **7635.75**, ATM **7635**, expiration **2026-09-01**. Same five all day.

| # | role | ticker | strike |
|---|------|--------|-------:|
| 1 | ATM call | `O:SPXW260901C07635000` | 7635 |
| 2 | ATM put | `O:SPXW260901P07635000` | 7635 |
| 3 | Call +10 | `O:SPXW260901C07685000` | 7685 |
| 4 | Put −10 | `O:SPXW260901P07585000` | 7585 |
| 5 | Call +20 | `O:SPXW260901C07735000` | 7735 |

Call +20 is 20 steps on the 5-pt grid (7735). A `wings=15` ladder around ATM 7635 tops out near 7710–7725. That contract is in the tap only when `wings=25`.

---

## Instant 11:00 ET

Requests 11:00:00.011 – 11:00:02.168 ET. Snapshot HTTP 200 on all five.

| role | snapshot `day.volume` | tap before | tap after | inside | `day.last_updated` ET | lag s |
|------|----------------------:|-----------:|----------:|:------:|-----------------------|------:|
| ATM call | **16031** | 16031 | 16031 | **yes** | 10:59:02.082 | 57.929 |
| ATM put | **29020** | 29020 | 29020 | **yes** | 10:59:02.141 | 58.509 |
| Call +10 | **31092** | 31092 | 31092 | **yes** | 10:59:02.138 | 59.012 |
| Put −10 | **10390** | 10390 | 10390 | **yes** | 10:59:02.120 | 59.527 |
| Call +20 | **2781** | *absent* | *absent* | n/a | 10:59:02.121 | 60.047 |

Bracket files (in-band): `snap-145959486Z.json` (`captured_at` 10:59:59.486 ET, `wings=15`) and `snap-150001876Z.json` (11:00:01.876 ET, `wings=15`).

Call +20: bracketing files `wings=15`, ticker not in rows. Nearest `wings=25` snap `snap-145933853Z.json` (10:59:33.853 ET) holds it at **2781**.

### Verbatim `day` objects (11:00)

**ATM call**

```json
{"change": -39, "change_percent": -66.7, "close": 19.4, "high": 29.36, "last_updated": 1788274742082000000, "low": 10.1, "open": 14.37, "previous_close": 58.43, "volume": 16031, "vwap": 14.6603}
```

**ATM put**

```json
{"change": 1, "change_percent": 37.037, "close": 3.7, "high": 17.3, "last_updated": 1788274742141000000, "low": 2.2, "open": 13.6, "previous_close": 2.7, "volume": 29020, "vwap": 7.4215}
```

**Call +10**

```json
{"change": -18.3, "change_percent": -96.3, "close": 0.65, "high": 2.25, "last_updated": 1788274742138000000, "low": 0.57, "open": 1.55, "previous_close": 19, "volume": 31092, "vwap": 1.0781}
```

**Put −10**

```json
{"change": -0.2, "change_percent": -30.8, "close": 0.45, "high": 2.9, "last_updated": 1788274742120000000, "low": 0.25, "open": 2.1, "previous_close": 0.65, "volume": 10390, "vwap": 1.2145}
```

**Call +20**

```json
{"change": -1.7, "change_percent": -91.9, "close": 0.15, "high": 0.25, "last_updated": 1788274742121000000, "low": 0.1, "open": 0.2, "previous_close": 1.85, "volume": 2781, "vwap": 0.1701}
```

---

## Instant 13:00 ET

Requests 13:00:00.002 – 13:00:12.257 ET. Snapshot HTTP 200 on all five.

| role | snapshot `day.volume` | tap before | tap after | inside | `day.last_updated` ET | lag s |
|------|----------------------:|-----------:|----------:|:------:|-----------------------|------:|
| ATM call | **27161** | 27161 | 27161 | **yes** | 12:59:02.082 | 57.920 |
| ATM put | **75299** | 75299 | 75299 | **yes** | 13:00:02.127 | 8.605 |
| Call +10 | **53426** | 53426 | 53426 | **yes** | 13:00:02.142 | 9.087 |
| Put −10 | **16205** | 16205 | 16205 | **yes** | 13:00:02.365 | 9.370 |
| Call +20 | **3929** | *absent* | *absent* | n/a | 13:00:02.333 | 9.924 |

ATM-call bracket files: `snap-165957706Z.json` (12:59:57.706 ET, `wings=25`) and `snap-170000058Z.json` (13:00:00.058 ET, `wings=15`). Volume identical across the wings flicker.

Call +20: `wings=15` bracket files do not hold it. Nearest `wings=25` snap `snap-170009385Z.json` (13:00:09.385 ET) holds it at **3929**.

### Stability — ATM call, two snapshot reads 10.644 s apart

| | request ET | `day.volume` | VWAP | `last_updated` ET | tap before / after |
|--|------------|-------------:|-----:|-------------------|--------------------|
| 1 | 13:00:00.002 | **27161** | 13.9456 | 12:59:02.082 | 27161 / 27161 |
| 2 | 13:00:10.646 | **27283** | 13.9290 | 13:00:02.180 | 27283 / 27283 |

`moved_backward`: **false**. Direct snapshot volume moved **forward** 122 lots. The source itself did not rewind on this pair.

`day` at t2:

```json
{"change": -48.7, "change_percent": -83.3, "close": 9.7, "high": 29.36, "last_updated": 1788282002180000000, "low": 7.8, "open": 14.37, "previous_close": 58.43, "volume": 27283, "vwap": 13.929}
```

### Verbatim `day` objects (13:00, first read)

**ATM call** — see t1 above (`volume` 27161, `vwap` 13.9456, `last_updated` 1788281942082000000).

**ATM put**

```json
{"change": 3.55, "change_percent": 131.481, "close": 6.25, "high": 17.3, "last_updated": 1788282002127000000, "low": 1, "open": 13.6, "previous_close": 2.7, "volume": 75299, "vwap": 5.9747}
```

**Call +10**

```json
{"change": -18.7, "change_percent": -98.4, "close": 0.27, "high": 2.25, "last_updated": 1788282002142000000, "low": 0.15, "open": 1.55, "previous_close": 19, "volume": 53426, "vwap": 0.8498}
```

**Put −10**

```json
{"change": -0.28, "change_percent": -43.1, "close": 0.37, "high": 2.9, "last_updated": 1788282002365000000, "low": 0.15, "open": 2.1, "previous_close": 0.65, "volume": 16205, "vwap": 0.9415}
```

**Call +20**

```json
{"change": -1.77, "change_percent": -95.7, "close": 0.08, "high": 0.25, "last_updated": 1788282002333000000, "low": 0.05, "open": 0.2, "previous_close": 1.85, "volume": 3929, "vwap": 0.1452}
```

---

## Instant 15:45 ET

Requests 15:45:00.007 – 15:45:02.221 ET. Snapshot HTTP 200 on all five. This is the high-volume 0DTE window P-SV10 never measured (dated volumes were 154–617).

| role | snapshot `day.volume` | tap before | tap after | inside | `day.last_updated` ET | lag s |
|------|----------------------:|-----------:|----------:|:------:|-----------------------|------:|
| ATM call | **120411** | 120411 | 120411 | **yes** | 15:44:02.116 | 57.891 |
| ATM put | **122439** | 122439 | 122439 | **yes** | 15:44:02.134 | 58.464 |
| Call +10 | **60797** | 60797 | 60797 | **yes** | 15:42:02.087 | 179.077 |
| Put −10 | **24428** | 24428 | 24428 | **yes** | 15:43:02.291 | 119.408 |
| Call +20 | **6366** | *absent* | *absent* | n/a | 15:31:02.144 | 840.077 |

ATM-call bracket: `snap-194457989Z.json` (15:44:57.989 ET, `wings=25`) and `snap-194500318Z.json` (15:45:00.318 ET, `wings=15`).

Call +20: every nearby `wings=25` snap from 15:43:43 through 15:46:17 holds **6366**.

`day.last_updated` lag at this instant is ~58 s on ATM, ~2–3 min on the 10-strike names, **14 min** on call +20. The tap copies the snapshot number it is given.

### Verbatim `day` objects (15:45)

**ATM call**

```json
{"change": -57.8, "change_percent": -98.9, "close": 0.65, "high": 29.36, "last_updated": 1788291842116000000, "low": 0.5, "open": 14.37, "previous_close": 58.43, "volume": 120411, "vwap": 5.5748}
```

**ATM put**

```json
{"change": 7.27, "change_percent": 269.259, "close": 9.97, "high": 24.25, "last_updated": 1788291842134000000, "low": 1, "open": 13.6, "previous_close": 2.7, "volume": 122439, "vwap": 6.9228}
```

**Call +10**

```json
{"change": -19, "change_percent": -100, "close": 0.03, "high": 2.25, "last_updated": 1788291722087000000, "low": 0.02, "open": 1.55, "previous_close": 19, "volume": 60797, "vwap": 0.763}
```

**Put −10**

```json
{"change": -0.58, "change_percent": -89.2, "close": 0.07, "high": 2.9, "last_updated": 1788291782291000000, "low": 0.03, "open": 2.1, "previous_close": 0.65, "volume": 24428, "vwap": 0.7599}
```

**Call +20**

```json
{"change": -1.82, "change_percent": -98.4, "close": 0.03, "high": 0.25, "last_updated": 1788291062144000000, "low": 0.03, "open": 0.2, "previous_close": 1.85, "volume": 6366, "vwap": 0.1123}
```

---

## After the close (16:30:00 – 16:30:04 ET)

Aggs `/v2/aggs/ticker/…/range/1/day/2026-09-01/2026-09-01?adjusted=true`.  
Open-close `/v1/open-close/…/2026-09-01?adjusted=true`.  
Tap ≤16:00: last gold snap with reconstructed `t ≤ 16:00` = `snap-195954017Z.json`, `captured_at` **15:59:54.017 ET**, `wings=25`, 102 rows, not a hole.  
Tap final: last gold snap at the 16:30 listing (`snap-203000749Z.json` / `snap-203003116Z.json`, 16:30:00.750 / 16:30:03.116 ET).

Aggs `v` = open-close `volume` on all five.

| role | tap ≤16:00 | tap final | aggs `v` | open-close | tap≤16:00 − aggs | tap final − aggs |
|------|----------:|----------:|---------:|-----------:|-----------------:|-----------------:|
| ATM call | 139174 | **140664** | **140664** | **140664** | **−1490** | **0** |
| ATM put | 125036 | **125339** | **125339** | **125339** | **−303** | **0** |
| Call +10 | 60860 | **60864** | **60864** | **60864** | **−4** | **0** |
| Put −10 | 24599 | **24600** | **24600** | **24600** | **−1** | **0** |
| Call +20 | 6370 | **6370** | **6370** | **6370** | **0** | **0** |

Aggs `request_id`s: `95f2928f7c18d993f5762f7c68064ae1`, `6a3d580502b762ff96837d66ef866d4a`, `926d1647533338a51dab664aff754f76`, `9756cf1dc7e7876be019d11ee76ebf23`, `1fb1378ea472fdae768b616381e903a6`.

Call +20 is **present** at ≤16:00 because that snap is `wings=25`.

The ≤16:00 residual vs the 16:30 vendor daily is small and **negative** (ATM call −1490). It is not the 08-19 put_10 **+2930 / +22.84%** shape. By 16:30 the tap has met the vendor bar exactly.

---

## P-SV8 loose end — −2092 and −38.30% are two rows

P-SV8’s summary line “min residual **−2092** / min residual % **−38.30%**” is two different contracts.

| | ticker | session | residual @≤16:00 | residual % | band / gap |
|--|--------|---------|-----------------:|-----------:|------------|
| **−2092 lots** | ATM call `O:SPXW260825C07680000` | 2026-08-25 | 179441 − 181533 = **−2092** | **−1.15%** | Present in **all 30,856** snaps that day. **0 gaps. Did not leave the band before 16:00.** One volume drop is the 09:31 roll (5298 → 160 at 13:31:06Z). Same contract is **182436** by 16:05 (P-SV8 Part B) vs vendor 181533 = **+903**. |
| **−38.30%** | far_thin `O:SPXW260820C07585000` | 2026-08-20 | 29 − 47 = **−18** | **−38.30%** | First present **13:40:59 ET** @23 (`wings=15`). Four gaps, all **13:41–14:00 ET** (longest 418 rowed-absent snaps, reappears 14:00:44). Then present through 16:00 (**128** snaps in 15:55–16:00). **`left_band_before_1600`: false.** Last-of-day archive **49** vs vendor **47** (P-SV6). Thin late-entry wing, not a 16:00 band exit. |

Gold walk: StudioOne `day=2026-08-20` and `day=2026-08-25`, every snap. JSON: `/tmp/svp-psv11/psv8-loose-end.json`.

The −38.30% row is not the same phenomenon as the high-side +22.84% (`O:SPXW260819P07655000`). The −2092 row is an in-band ATM that is still printing between 16:00 and 16:05.

---

## What this run does not claim

- It does not reopen explanations 1–4 (vendor inclusion, clock window, 15↔25 misalignment, multi-leg `updates_volume`). Those were killed on prior probes.
- It does not say 08-19 / 08-20 were measured wrong. Those residuals stand. This session did not reproduce them.
- It does not treat call +20’s missing `wings=15` row as a rewritten volume. When the row exists, the number matches.
- Snapshot `day.last_updated` lagged the request (≈58 s on ATM at :00; up to 840 s on call +20 at 15:45). Recorded; not used as a fifth story.

---

## Source

- Tickers: `/tmp/svp-psv11/tickers.json`
- Instants: `/tmp/svp-psv11/instant-{1100,1300,1545}.json` and `instant-*-rebracket.json`
- Close: `/tmp/svp-psv11/after-close.json`
- Driver: `/tmp/svp-psv11-driver.py` on StudioTwo; bracket: `/tmp/svp-psv11-bracket.py` on StudioOne
- Gold: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-09-01/chain/SPX`
- Snapshot path: `GET /v3/snapshot/options/SPX/{ticker}`
