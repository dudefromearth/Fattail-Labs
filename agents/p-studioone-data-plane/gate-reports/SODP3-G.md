# SODP3-G — re-point with proof

**Verdict:** PASS (GO)  
**Date:** 2026-09-19

Member Labs `:4000` hops OHLC + contracts to `http://192.168.1.111:4012`. Member cookie not forwarded.

| Row | Attest |
|-----|--------|
| OHLC ES `contract=ESZ2026` | 200 `price_source=massive_futures_aggs` vendor ESZ6 span 108.85d **lo 2026-06-02** n=11601 |
| OHLC MES `MESZ2026` | 200 span 108.87d **lo 2026-06-02** |
| contracts ES | 200 `ESZ2026, ESH2027, …` (Labs identity) |
| health / structure / range | already hopped `:4010` — 200 |
| symbology | already hopped `:4011` |
| stream | already hopped `:4010` |
| Market Bus | **SODP-MB hold** — not re-pointed |

Not AP-1.
