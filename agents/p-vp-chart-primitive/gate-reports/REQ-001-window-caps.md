# REQ-001 — OHLC window caps (found before change)

| Cap | File | Line | Effect |
|-----|------|------|--------|
| `lookback_days` default **5** | `server/sa_dev/service.py` `ohlc_for_source` | 220 / 238–239 | Slices print-store days if >0 |
| Member API default **0** (all store days) | `server/routes/vp_display.py` | 100–106 | Chart uses this |
| Admin-dev default **5** | `server/routes/sa_dev.py` | 106 | Admin harness only |
| Client always sends **0** | `web/components/sa/SaPriceChart.tsx` | 174, 579 | Full store, not 5 |
| Initial visible window **1 day** | `saView.defaultTimeWindow` + chart `lookbackDays=1` | saView.ts 25–26, SaPriceChart ~187 | Optimistic first paint — pan must still reach dataLo |
| House `priceLookbackDays: 1` | `saLayerStore.ts` | 199 | Dialog “price-layer lookback”; does not cap member fetch |
| Print store depth | `/Users/ernie/fattail-market-data` | — | ~10 sessions when 2TB unmounted |
| Massive stock `ES` ticker | `fetch_aggs("ES")` | — | Wrong instrument (~$67 equity) |

After fill: ES 5m via `/futures/v1/aggs/ESZ6` resolution `5min` when print span < 90d. Payload `history_span_days`, `price_source`, `SHORT HISTORY` if still short.

**Live API (StudioTwo, after fill, not AP-1):**  
`GET /api/app/vp/v1/ohlc/ES?tf=5m&lookback_days=0` → 200 in 0.61s, **11115 bars**, `history_span_days=94.2`, `price_source=massive_futures_aggs`, first bar **2026-06-16** (on or before 2026-06-19). REQ-001 remains **OPEN** until Coach attests in his browser.
