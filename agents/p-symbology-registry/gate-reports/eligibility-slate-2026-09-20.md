# Eligibility slate — true daily/MWF candidate list (2026-09-20)

Coach picks once against this list. Does not close REQ-003.

Gate (same as overnight probe): ≥3 expirations/week, rolling-4-week median of listed dates. Window: 20 weekdays 2026-09-21 … 2026-10-16. Help copy: short-dated including 0DTE (0–5 DTE).

## 1. What the three-row report actually queried

**Not capture-bounded. Not the Admin universe. Not the registry options-role set.**

| Layer | What it is | Used by overnight 3-row? |
|-------|------------|--------------------------|
| Overnight probe | Hardcoded `("SPX","XSP","SPY")` via Massive `fetch_option_chain_until` | **Yes — only this** |
| Registry options-role | `server/symbology/service.py` `_static_rows`: SPX, XSP member-visible; SPY `volume-source` `member_visible=false` | No (API `eligibility_report()` still returns `measured_expirations_per_week: null`) |
| Admin `market_symbol_universe` | 18 tradeable + VIX/VIX1D reference | No |
| StudioOne chain capture | SSR standing interest on **every enabled tradeable** when `next_expirations_json` lists **today** | No |

Overnight file: `eligibility-2026-09-20.md` (SPX/XSP/SPY median 5). SPY was included as a cadence measurement, not as a picker row.

## 2. Current chain capture (StudioOne, read-only)

`chain_feed` pid **538**, RSS **71088**, last line `no interest keys; idle` (Sunday 01:03 ET and again after the Massive calendar probe). Redis `mb:ladder:*` count **0**. Probe ran from StudioTwo; no interest keys added.

SSR `day=2026-09-18` MANIFEST symbols (18 tradeable + 2 reference marks):

`SPX, XSP, VIX1D, VIX, SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG, AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT`

Last RTH week (COUNTS.json `expiration == day` and snaps > 0):

| Day | Captured 0DTE | Skipped (`not_today`, 0 snaps) |
|-----|---------------|--------------------------------|
| Mon 09-14 … Thu 09-17 | **SPX, XSP only** | SPY, QQQ, IWM, and the other 13 tradeable |
| Fri 09-18 | **all 18 tradeable** | — |

Cause: Admin `next_expirations_json` is **stale** for most names (many `as_of` still August; TLT/XLF/META null). SPX/XSP calendars were refreshed 2026-09-19 with weekday dates; SPY’s calendar was refreshed the same night **after** that week. Capture follows the calendar, not Massive’s live listing. **COUNTS is not the eligibility SoR.**

Friday disk (`du -sh day=2026-09-18/chain/*`), 2s snaps, wings 15–25 dual:

| Symbol | Disk | snaps | rows/snap |
|--------|------|------:|----------:|
| SPX | 891M | 26664 | 102 |
| XSP | 571M | 21796 | 62 |
| SLV | 511M | 17470 | 102 |
| USO | 512M | 17475 | 62 |
| SPY | 514M | 17446 | 62 |
| TSLA | 509M | 17357 | 102 |
| IWM | 509M | 17370 | 102 |
| META | 508M | 17345 | 62 |
| XLF | 500M | 17439 | 62 |
| GLD | 480M | 16559 | 62 |
| MSFT | 480M | 17487 | 62 |
| TLT | 478M | 17421 | 62 |
| AAPL | 406M | 17300 | 52 |
| GOOGL | 386M | 16599 | 76 |
| UNG | 275M | 12039 | 62 |
| NVDA | 251M | 11375 | 58 |
| QQQ | 230M | 9434 | 62 |
| AMZN | 206M | 10029 | 74 |
| **day total** | **8.1G** | **298605** | |

SPX avg snap 32 110 bytes. Day total includes marks + JSON overhead.

## 3. True listed cadence (Massive reference, not capture)

Method: `GET /v3/reference/options/contracts?underlying_ticker=&expiration_date=&limit=1&contract_type=call&expired=false` for each of 20 weekdays × 32 candidates = **640 HTTP**. StudioTwo. **41.9 s**. chain_feed AFTER: pid 538, RSS 71088 unchanged, still `no interest keys; idle`.

Raw: `eligibility-slate-2026-09-20.json` (same folder).

Median uses the same rule as the overnight probe: median of per-ISO-week hit counts (Python `sorted(counts)[len//2]`). ETF/stock “daily” products list ~10 trading days of dailies, then Fridays — same shape as overnight SPY (`W39=5, W40=5, W41=1, W42=1`, median **5**).

### Pass (≥3/week) — 22 names

#### Daily class (10)

| Symbol | 20d hits | median/week | In Admin 18? | Picker today | Collector if captured on **true** cadence |
|--------|----------:|------------:|:---:|:---:|---|
| SPX | 20 | 5 | yes | options COMING | **Already paid daily** (Mon–Thu last week). Friday 891M / ~37k snaps weekdays. **+0** |
| XSP | 20 | 5 | yes | options COMING | **Already paid daily**. Friday 571M. **+0** |
| NDX | 20 | 5 | **no** | — | **NEW daily topic**. Unmeasured on disk; analog index **XSP–SPX 0.6–0.9 GB/RTH-day**, +1 Massive fetch / 2s every session |
| SPY | 12 | 5 | yes | volume-source, not picker | In universe but **calendar-starved** (0 snaps Mon–Thu). Truthful calendar = **+4 weekdays/week × 514M ≈ +2.1 GB/week** and +1 topic those days |
| QQQ | 12 | 5 | yes | — | Same starvation. Friday 230M → **+4 × 230M ≈ +0.9 GB/week** |
| IWM | 12 | 5 | yes | — | Friday 509M → **+4 × 509M ≈ +2.0 GB/week** |
| GLD | 12 | 5 | yes | — | Friday 480M → **+4 × 480M ≈ +1.9 GB/week** |
| XLF | 12 | 5 | yes | — | Friday 500M → **+4 × 500M ≈ +2.0 GB/week** |
| RUT | 13 | 5 | **no** | — | **NEW daily**. Analog IWM **~0.5 GB/RTH-day** |
| MRUT | 13 | 5 | **no** | — | **NEW daily** (mini-RUT). Analog XSP **~0.6 GB/RTH-day** |

#### MWF class (12) — Mon/Wed/Fri only; no Tue/Thu listings

| Symbol | 20d hits | median/week | In Admin 18? | Collector if captured on **true** cadence |
|--------|----------:|------------:|:---:|---|
| AAPL | 8 | 3 | yes | Stale calendar → Friday-only last week. Truthful = **+Mon+Wed**. Friday 406M → **+2 × 406M ≈ +0.8 GB/week** |
| MSFT | 8 | 3 | yes | Friday 480M → **+1.0 GB/week** |
| META | 8 | 3 | yes | Friday 508M → **+1.0 GB/week** |
| GOOGL | 8 | 3 | yes | Friday 386M → **+0.8 GB/week** |
| NVDA | 8 | 3 | yes | Friday 251M → **+0.5 GB/week** |
| TSLA | 8 | 3 | yes | Friday 509M → **+1.0 GB/week** |
| AMZN | 8 | 3 | yes | Friday 206M → **+0.4 GB/week** |
| SLV | 8 | 3 | yes | Friday 511M → **+1.0 GB/week** |
| TLT | 8 | 3 | yes | Friday 478M → **+1.0 GB/week** |
| AVGO | 8 | 3 | **no** | **NEW MWF**. Analog AAPL/NVDA **0.25–0.4 GB × 3 days/week** |
| AMD | 8 | 3 | **no** | **NEW MWF**. Same analog |
| IBIT | 8 | 3 | **no** | **NEW MWF**. Same analog |

Weeks for MWF passers: `W39=3, W40=3, W41=1, W42=1` (far weeks are Friday-only listings, same median-3 as overnight gate).

### Fail (measured, so the cut is visible)

| Symbol | class | median | why |
|--------|-------|-------:|-----|
| MU | MWF | 2 | `W39=3, W40=2, W41=1, W42=1` |
| USO | WF | 2 | Wed+Fri only; already in universe |
| UNG | WF | 2 | Wed+Fri only; already in universe |
| DJX | sparse daily | 1 | Cboe daily since 2026-05-18; W39=5 then holes |
| MGTN | sparse daily | 2 | W39=5 then thin |
| DIA | WF | 1 | |
| PLTR | Friday | 1 | |
| CBTX, MBTX, NDXP | none | 0 | no contracts under that `underlying_ticker` on Massive reference |

VIX/VIX1D stay reference-role (no fake chain). Not on this slate.

## 4. CP-1 arithmetic (collector, not picker)

`chain_feed` ticks **one Massive dual-side snapshot per interest topic per 2s**. SSR creates topics only for enabled tradeable names whose calendar lists **today**. Weekend = 0 topics.

**Today’s collector (stale calendars):**

| Session | Topics | Massive | Disk (order of magnitude) |
|---------|-------:|---------|---------------------------|
| Mon–Thu last week | **2** (SPX, XSP) | 1 req/s | ~SPX+XSP weekday (~1.5 GB class; 37k snaps each) |
| Friday | **18** | 9 req/s | **8.1 GB** |
| Weekend | **0** | idle | 0 |

**Picker-only (registry options-role, no universe insert, no calendar refresh):** **+0** collector. SPX/XSP already paid.

**Calendar refresh of the 16 passers already in the Admin 18** (no new symbols): Mon–Thu topics go 2 → **7 daily** (SPX XSP SPY QQQ IWM GLD XLF) and **16 on MWF** (+9 MWF passers). That is the real load jump: roughly **3.5× Tue/Thu** and **8× Mon/Wed** vs last week, **+~10 GB/week** disk if Friday per-name sizes hold on the extra days.

**Inserting the 6 not-in-universe passers** (NDX, RUT, MRUT daily; AVGO, AMD, IBIT MWF) **on top of truthful calendars:**

| Day type | Topics | vs Friday-now 18 |
|----------|-------:|------------------|
| Tue/Thu | 7 current-daily + 3 new daily = **10** | below Friday |
| MWF | 10 daily + 12 MWF = **22** | **+4 vs Friday** |
| Massive | 5–11 req/s | still one `chain_feed` process |

Unmeasured new-name disk: budget **NDX 0.6–0.9 GB + RUT 0.5 + MRUT 0.6 per daily session**, plus **~0.3 GB × 3 MWF names × 3 days**. Order **+2 GB/weekday** if all three indexes are added.

Rollback for a future insert: disable the symbol in `market_symbol_universe` (SSR drops interest; `chain_feed` idles that topic). Do not bounce pid 538.

## 5. How this maps to “~20 member-visible options rows”

22 names pass the gate. Registry today exposes **2** (SPX, XSP). SPY is eligible on cadence and already captured on Fridays, but is **volume-source / not in picker** unless Coach re-roles it.

Coach’s one pick is against the 22. Suggested cuts if the cap is hard-20: drop SPY (keep as volume-source) and/or MRUT (mini of RUT) and/or IBIT — those are product calls, not gate fails.

Nothing on this list is enabled in the picker by this report.
